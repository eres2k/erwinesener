/**
 * auto-scan-media.js
 * Automatically scans for new media files in clips/ and music/ folders
 * and adds them to the site's content database.
 *
 * Features:
 * - Exports reusable scanForNewMedia() function
 * - Watch mode for real-time file monitoring
 * - Event callbacks for integration with other tools
 * - AI-powered metadata generation (with Gemini API) or fallback mode
 *
 * Usage:
 *   CLI:     node scripts/auto-scan-media.js [--watch]
 *   Import:  const { scanForNewMedia, watchMedia } = require('./scripts/auto-scan-media');
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    dataFile: path.join(__dirname, '../data/content.json'),
    musicDir: path.join(__dirname, '../music'),
    clipsDir: path.join(__dirname, '../clips'),
    musicExtensions: ['.mp3', '.wav', '.m4a', '.ogg', '.flac'],
    videoExtensions: ['.mp4', '.webm', '.mov', '.avi'],
    watchDebounceMs: 1000, // Debounce rapid file changes
};

// Gemini AI setup (optional)
const HAS_GEMINI = !!process.env.GEMINI_API_KEY;
let genAI, fileManager, model;

if (HAS_GEMINI) {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const { GoogleAIFileManager } = require("@google/generative-ai/server");
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
}

/**
 * Load the content database
 */
function loadDatabase() {
    if (!fs.existsSync(CONFIG.dataFile)) {
        fs.mkdirSync(path.dirname(CONFIG.dataFile), { recursive: true });
        fs.writeFileSync(CONFIG.dataFile, JSON.stringify({ music: [], videos: [] }, null, 2));
    }

    try {
        const db = JSON.parse(fs.readFileSync(CONFIG.dataFile, 'utf8'));
        if (!Array.isArray(db.music)) db.music = [];
        if (!Array.isArray(db.videos)) db.videos = [];
        return db;
    } catch (e) {
        return { music: [], videos: [] };
    }
}

/**
 * Save the content database
 */
function saveDatabase(db) {
    fs.writeFileSync(CONFIG.dataFile, JSON.stringify(db, null, 2));
}

/**
 * Get MIME type for a file
 */
function getMimeType(filePath, type) {
    const ext = path.extname(filePath).toLowerCase();

    const mimeTypes = {
        // Audio
        '.mp3': 'audio/mp3', '.wav': 'audio/wav', '.m4a': 'audio/mp4',
        '.ogg': 'audio/ogg', '.flac': 'audio/flac',
        // Video
        '.mp4': 'video/mp4', '.webm': 'video/webm',
        '.mov': 'video/quicktime', '.avi': 'video/x-msvideo'
    };

    return mimeTypes[ext] || (type === 'music' ? 'audio/mpeg' : 'video/mp4');
}

/**
 * Generate basic metadata from filename (fallback mode)
 */
function generateBasicMetadata(filePath, type) {
    const filename = path.basename(filePath);
    let title = filename
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    // Handle UUID filenames
    if (/^[a-f0-9-]{36}$/i.test(title.replace(/\s/g, ''))) {
        title = `New ${type === 'music' ? 'Track' : 'Clip'}`;
    }

    if (type === 'music') {
        return {
            filename,
            path: `music/${filename}`,
            title,
            artist: 'Erwin Esener',
            description: 'Audio track',
            icon: 'music'
        };
    } else {
        return {
            filename,
            path: `clips/${filename}`,
            title,
            description: 'Video clip'
        };
    }
}

/**
 * Analyze a media file using Gemini AI (or fallback to basic metadata)
 */
async function analyzeFile(filePath, type, options = {}) {
    const filename = path.basename(filePath);
    const { silent = false } = options;

    if (!silent) console.log(`  Analyzing ${type}: ${filename}...`);

    // Fallback mode without AI
    if (!HAS_GEMINI) {
        const metadata = generateBasicMetadata(filePath, type);
        if (!silent) console.log(`    Generated basic metadata: "${metadata.title}"`);
        return metadata;
    }

    try {
        // Upload to Gemini
        if (!silent) console.log("    Uploading to Gemini...");
        const uploadResult = await fileManager.uploadFile(filePath, {
            mimeType: getMimeType(filePath, type),
            displayName: filename,
        });

        // Wait for processing
        let file = await fileManager.getFile(uploadResult.file.name);
        if (!silent) process.stdout.write("    Processing");
        while (file.state === "PROCESSING") {
            if (!silent) process.stdout.write(".");
            await new Promise(resolve => setTimeout(resolve, 2000));
            file = await fileManager.getFile(uploadResult.file.name);
        }

        if (file.state === "FAILED") {
            if (!silent) console.log("\n    File processing failed, using fallback.");
            return generateBasicMetadata(filePath, type);
        }
        if (!silent) console.log(" Done!");

        // Generate AI description
        if (!silent) console.log("    Generating AI description...");
        const prompt = type === 'music'
            ? `Listen to this audio track. The filename is "${filename}".
               Provide a JSON object with these exact fields:
               - "title": A creative display title (can be based on the filename or the musical vibe)
               - "artist": The original artist or "Erwin Esener" if it's a cover/remix
               - "description": A single artistic sentence describing the mood, genre, or style
               - "icon": One of these icon types that best fits: "rocket", "city", "mirror", "music", "globe", "heart", "star", "wave"
               Return ONLY the JSON object, no markdown formatting.`
            : `Watch this video clip. The filename is "${filename}".
               Provide a JSON object with these exact fields:
               - "title": A creative title for this visual piece
               - "description": A short, artistic description of the visual effects or content
               Return ONLY the JSON object, no markdown formatting.`;

        const result = await model.generateContent([
            prompt,
            { fileData: { fileUri: uploadResult.file.uri, mimeType: uploadResult.file.mimeType } }
        ]);

        const responseText = result.response.text();
        const jsonStr = responseText.replace(/```json|```/g, "").trim();

        try {
            const metadata = JSON.parse(jsonStr);
            if (!silent) console.log(`    Generated: "${metadata.title}"`);
            return {
                filename,
                path: `${type === 'music' ? 'music' : 'clips'}/${filename}`,
                ...metadata
            };
        } catch (e) {
            if (!silent) console.error("    Failed to parse AI response, using fallback.");
            return generateBasicMetadata(filePath, type);
        }

    } catch (error) {
        if (!silent) console.error(`    Error: ${error.message}, using fallback.`);
        return generateBasicMetadata(filePath, type);
    }
}

/**
 * Get list of media files in a directory
 */
function getMediaFiles(directory, extensions) {
    if (!fs.existsSync(directory)) return [];

    return fs.readdirSync(directory)
        .filter(f => !f.startsWith('.'))
        .filter(f => extensions.includes(path.extname(f).toLowerCase()));
}

/**
 * Detect new files that aren't in the database
 */
function detectNewFiles(db) {
    const newFiles = { music: [], videos: [] };

    // Check music directory
    const musicFiles = getMediaFiles(CONFIG.musicDir, CONFIG.musicExtensions);
    for (const file of musicFiles) {
        if (!db.music.find(item => item.filename === file)) {
            newFiles.music.push(path.join(CONFIG.musicDir, file));
        }
    }

    // Check clips directory
    const videoFiles = getMediaFiles(CONFIG.clipsDir, CONFIG.videoExtensions);
    for (const file of videoFiles) {
        if (!db.videos.find(item => item.filename === file)) {
            newFiles.videos.push(path.join(CONFIG.clipsDir, file));
        }
    }

    return newFiles;
}

/**
 * Detect removed files that are still in the database
 */
function detectRemovedFiles(db) {
    const removed = { music: [], videos: [] };

    for (const item of db.music) {
        const fullPath = path.join(__dirname, '..', item.path);
        if (!fs.existsSync(fullPath)) {
            removed.music.push(item.filename);
        }
    }

    for (const item of db.videos) {
        const fullPath = path.join(__dirname, '..', item.path);
        if (!fs.existsSync(fullPath)) {
            removed.videos.push(item.filename);
        }
    }

    return removed;
}

/**
 * Main scan function - scans for new media and updates the database
 *
 * @param {Object} options - Configuration options
 * @param {boolean} options.silent - Suppress console output
 * @param {Function} options.onNewFile - Callback when a new file is found
 * @param {Function} options.onRemoved - Callback when a file is removed
 * @param {Function} options.onComplete - Callback when scan completes
 * @returns {Object} Scan results { added: { music: [], videos: [] }, removed: { music: [], videos: [] }, db }
 */
async function scanForNewMedia(options = {}) {
    const { silent = false, onNewFile, onRemoved, onComplete } = options;

    if (!silent) {
        console.log('\n' + '='.repeat(50));
        console.log('Auto-Scan Media - Erwin Esener Portfolio');
        console.log('='.repeat(50));
    }

    const db = loadDatabase();
    const results = {
        added: { music: [], videos: [] },
        removed: { music: [], videos: [] },
        db
    };

    // Detect and remove missing files
    if (!silent) console.log('\nChecking for removed files...');
    const removedFiles = detectRemovedFiles(db);

    for (const filename of removedFiles.music) {
        db.music = db.music.filter(item => item.filename !== filename);
        results.removed.music.push(filename);
        if (!silent) console.log(`  Removed: ${filename}`);
        if (onRemoved) onRemoved({ type: 'music', filename });
    }

    for (const filename of removedFiles.videos) {
        db.videos = db.videos.filter(item => item.filename !== filename);
        results.removed.videos.push(filename);
        if (!silent) console.log(`  Removed: ${filename}`);
        if (onRemoved) onRemoved({ type: 'video', filename });
    }

    // Detect and analyze new files
    if (!silent) console.log('\nScanning for new files...');
    const newFiles = detectNewFiles(db);

    // Process new music files
    if (newFiles.music.length > 0) {
        if (!silent) console.log(`\nFound ${newFiles.music.length} new music file(s):`);
        for (const filePath of newFiles.music) {
            const metadata = await analyzeFile(filePath, 'music', { silent });
            if (metadata) {
                db.music.push(metadata);
                results.added.music.push(metadata);
                if (onNewFile) onNewFile({ type: 'music', metadata });
            }
        }
    }

    // Process new video files
    if (newFiles.videos.length > 0) {
        if (!silent) console.log(`\nFound ${newFiles.videos.length} new video file(s):`);
        for (const filePath of newFiles.videos) {
            const metadata = await analyzeFile(filePath, 'videos', { silent });
            if (metadata) {
                db.videos.push(metadata);
                results.added.videos.push(metadata);
                if (onNewFile) onNewFile({ type: 'video', metadata });
            }
        }
    }

    // Save if changes were made
    const hasChanges = results.added.music.length > 0 ||
                       results.added.videos.length > 0 ||
                       results.removed.music.length > 0 ||
                       results.removed.videos.length > 0;

    if (hasChanges) {
        saveDatabase(db);
        if (!silent) {
            console.log('\n' + '='.repeat(50));
            console.log('Database updated!');
            console.log(`  Added: ${results.added.music.length} music, ${results.added.videos.length} videos`);
            console.log(`  Removed: ${results.removed.music.length} music, ${results.removed.videos.length} videos`);
            console.log(`  Total: ${db.music.length} music, ${db.videos.length} videos`);
            console.log('='.repeat(50));
        }
    } else {
        if (!silent) {
            console.log('\n' + '='.repeat(50));
            console.log('No changes detected. Database is up to date.');
            console.log(`  Total: ${db.music.length} music, ${db.videos.length} videos`);
            console.log('='.repeat(50));
        }
    }

    if (onComplete) onComplete(results);
    return results;
}

/**
 * Watch mode - monitors directories for changes in real-time
 *
 * @param {Object} options - Configuration options
 * @param {Function} options.onNewFile - Callback when a new file is detected
 * @param {Function} options.onRemoved - Callback when a file is removed
 * @param {Function} options.onChange - Callback for any change
 * @returns {Function} Function to stop watching
 */
function watchMedia(options = {}) {
    const { onNewFile, onRemoved, onChange } = options;
    const watchers = [];
    let debounceTimer = null;
    let isProcessing = false;

    console.log('\n' + '='.repeat(50));
    console.log('Watch Mode - Monitoring for new media files');
    console.log('='.repeat(50));
    console.log(`\nWatching directories:`);
    console.log(`  Music: ${CONFIG.musicDir}`);
    console.log(`  Clips: ${CONFIG.clipsDir}`);
    console.log('\nPress Ctrl+C to stop.\n');

    const handleChange = async (eventType, filename, type) => {
        if (!filename || filename.startsWith('.') || isProcessing) return;

        // Check if it's a valid media file
        const ext = path.extname(filename).toLowerCase();
        const validExtensions = type === 'music' ? CONFIG.musicExtensions : CONFIG.videoExtensions;
        if (!validExtensions.includes(ext)) return;

        // Debounce rapid changes
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            isProcessing = true;
            console.log(`\n[${new Date().toLocaleTimeString()}] Change detected: ${filename}`);

            try {
                const results = await scanForNewMedia({
                    silent: false,
                    onNewFile: (data) => {
                        if (onNewFile) onNewFile(data);
                        if (onChange) onChange({ event: 'added', ...data });
                    },
                    onRemoved: (data) => {
                        if (onRemoved) onRemoved(data);
                        if (onChange) onChange({ event: 'removed', ...data });
                    }
                });
            } catch (error) {
                console.error('Error during scan:', error.message);
            }

            isProcessing = false;
        }, CONFIG.watchDebounceMs);
    };

    // Watch music directory
    if (fs.existsSync(CONFIG.musicDir)) {
        const musicWatcher = fs.watch(CONFIG.musicDir, (event, filename) => {
            handleChange(event, filename, 'music');
        });
        watchers.push(musicWatcher);
    }

    // Watch clips directory
    if (fs.existsSync(CONFIG.clipsDir)) {
        const clipsWatcher = fs.watch(CONFIG.clipsDir, (event, filename) => {
            handleChange(event, filename, 'videos');
        });
        watchers.push(clipsWatcher);
    }

    // Initial scan
    scanForNewMedia({ silent: false });

    // Return stop function
    return () => {
        clearTimeout(debounceTimer);
        watchers.forEach(w => w.close());
        console.log('\nWatch mode stopped.');
    };
}

/**
 * Get current media status (without modifying database)
 */
function getMediaStatus() {
    const db = loadDatabase();
    const newFiles = detectNewFiles(db);
    const removedFiles = detectRemovedFiles(db);

    return {
        current: {
            music: db.music.length,
            videos: db.videos.length
        },
        pending: {
            newMusic: newFiles.music.length,
            newVideos: newFiles.videos.length,
            removedMusic: removedFiles.music.length,
            removedVideos: removedFiles.videos.length
        },
        hasChanges: newFiles.music.length > 0 ||
                    newFiles.videos.length > 0 ||
                    removedFiles.music.length > 0 ||
                    removedFiles.videos.length > 0
    };
}

// Export functions for use as a module
module.exports = {
    scanForNewMedia,
    watchMedia,
    getMediaStatus,
    loadDatabase,
    analyzeFile,
    CONFIG
};

// CLI execution
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.includes('--watch') || args.includes('-w')) {
        // Watch mode
        const stop = watchMedia();
        process.on('SIGINT', () => {
            stop();
            process.exit(0);
        });
    } else if (args.includes('--status') || args.includes('-s')) {
        // Status mode
        const status = getMediaStatus();
        console.log('\nMedia Status:');
        console.log(`  Current: ${status.current.music} music, ${status.current.videos} videos`);
        console.log(`  Pending: ${status.pending.newMusic} new music, ${status.pending.newVideos} new videos`);
        console.log(`  Removed: ${status.pending.removedMusic} music, ${status.pending.removedVideos} videos`);
        console.log(`  Changes needed: ${status.hasChanges ? 'Yes' : 'No'}`);
    } else {
        // Default: single scan
        scanForNewMedia().catch(console.error);
    }
}
