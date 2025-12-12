/* scripts/analyze-media.js
 * AI-powered media analysis script using Google Gemini
 * Scans music/ and clips/ folders, sends new files to Gemini for description
 * Updates data/content.json with AI-generated metadata
 *
 * Usage: npm run analyze
 * Optional: GEMINI_API_KEY (from .env file or Netlify environment variables)
 *           Without API key, uses basic metadata from filenames
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Check if Gemini API is available
const HAS_GEMINI = !!process.env.GEMINI_API_KEY;
let genAI, fileManager, model;

if (HAS_GEMINI) {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const { GoogleAIFileManager } = require("@google/generative-ai/server");
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    console.log("Gemini API enabled - will generate AI descriptions");
} else {
    console.log("No GEMINI_API_KEY found - using basic metadata from filenames");
}

const DATA_FILE = path.join(__dirname, '../data/content.json');
const MUSIC_DIR = path.join(__dirname, '../music');
const CLIPS_DIR = path.join(__dirname, '../clips');

// Supported file extensions
const MUSIC_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.ogg', '.flac'];
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi'];

// Ensure data file exists
if (!fs.existsSync(DATA_FILE)) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify({ music: [], videos: [] }, null, 2));
    console.log("Created new content.json database");
}

// Load existing database
let db;
try {
    db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
} catch (e) {
    console.error("Error reading content.json:", e.message);
    db = { music: [], videos: [] };
}

// Ensure arrays exist
if (!Array.isArray(db.music)) db.music = [];
if (!Array.isArray(db.videos)) db.videos = [];

/**
 * Get MIME type based on file extension
 */
function getMimeType(filePath, type) {
    const ext = path.extname(filePath).toLowerCase();

    if (type === 'music') {
        const mimeTypes = {
            '.mp3': 'audio/mp3',
            '.wav': 'audio/wav',
            '.m4a': 'audio/mp4',
            '.ogg': 'audio/ogg',
            '.flac': 'audio/flac'
        };
        return mimeTypes[ext] || 'audio/mpeg';
    } else {
        const mimeTypes = {
            '.mp4': 'video/mp4',
            '.webm': 'video/webm',
            '.mov': 'video/quicktime',
            '.avi': 'video/x-msvideo'
        };
        return mimeTypes[ext] || 'video/mp4';
    }
}

/**
 * Generate basic metadata from filename (fallback when no API)
 */
function generateBasicMetadata(filePath, type) {
    const filename = path.basename(filePath);
    // Clean up filename: remove extension, replace separators with spaces
    let title = filename
        .replace(/\.[^/.]+$/, '')  // remove extension
        .replace(/[-_]/g, ' ')     // replace dashes/underscores with spaces
        .replace(/\s+/g, ' ')      // normalize spaces
        .trim();

    // If filename is a UUID, use a generic title
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
async function analyzeFile(filePath, type) {
    const filename = path.basename(filePath);
    console.log(`\nAnalyzing ${type}: ${filename}...`);

    // Fallback mode: generate basic metadata from filename
    if (!HAS_GEMINI) {
        const metadata = generateBasicMetadata(filePath, type);
        console.log(`  Generated basic metadata: "${metadata.title}"`);
        return metadata;
    }

    try {
        // 1. Upload to Gemini
        console.log("  Uploading to Gemini...");
        const uploadResult = await fileManager.uploadFile(filePath, {
            mimeType: getMimeType(filePath, type),
            displayName: filename,
        });

        // 2. Wait for processing (important for video)
        let file = await fileManager.getFile(uploadResult.file.name);
        process.stdout.write("  Processing");
        while (file.state === "PROCESSING") {
            process.stdout.write(".");
            await new Promise((resolve) => setTimeout(resolve, 2000));
            file = await fileManager.getFile(uploadResult.file.name);
        }

        if (file.state === "FAILED") {
            console.log("\n  File processing failed.");
            return null;
        }
        console.log(" Done!");

        // 3. Generate Content with Gemini
        console.log("  Generating description...");
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
            {
                fileData: {
                    fileUri: uploadResult.file.uri,
                    mimeType: uploadResult.file.mimeType,
                },
            },
        ]);

        const responseText = result.response.text();
        // Clean markdown if Gemini returns it
        const jsonStr = responseText.replace(/```json|```/g, "").trim();

        try {
            const metadata = JSON.parse(jsonStr);
            console.log(`  Generated: "${metadata.title}"`);

            return {
                filename: filename,
                path: `${type === 'music' ? 'music' : 'clips'}/${filename}`,
                ...metadata
            };
        } catch (e) {
            console.error("  Failed to parse AI response:", responseText);
            // Return fallback metadata
            return {
                filename: filename,
                path: `${type === 'music' ? 'music' : 'clips'}/${filename}`,
                title: filename.replace(/\.[^/.]+$/, ""),
                ...(type === 'music'
                    ? { artist: "Erwin Esener", description: "Audio track", icon: "music" }
                    : { description: "Video clip" })
            };
        }

    } catch (error) {
        console.error(`  Error analyzing file: ${error.message}`);
        return null;
    }
}

/**
 * Scan a directory for new media files
 */
async function scanDirectory(directory, type, dbList, extensions) {
    if (!fs.existsSync(directory)) {
        console.log(`Directory not found: ${directory}`);
        return false;
    }

    const files = fs.readdirSync(directory)
        .filter(f => !f.startsWith('.'))
        .filter(f => extensions.includes(path.extname(f).toLowerCase()));

    let updated = false;
    let newCount = 0;
    let skippedCount = 0;

    console.log(`\nScanning ${type} directory: ${files.length} files found`);

    for (const file of files) {
        const existing = dbList.find(item => item.filename === file);
        if (!existing) {
            const newItem = await analyzeFile(path.join(directory, file), type);
            if (newItem) {
                dbList.push(newItem);
                updated = true;
                newCount++;
            }
        } else {
            skippedCount++;
        }
    }

    if (skippedCount > 0) {
        console.log(`  Skipped ${skippedCount} already-analyzed files`);
    }
    if (newCount > 0) {
        console.log(`  Added ${newCount} new ${type} entries`);
    }

    return updated;
}

/**
 * Remove entries for files that no longer exist
 */
function cleanupMissingFiles() {
    let cleaned = false;

    // Clean music entries
    const musicBefore = db.music.length;
    db.music = db.music.filter(item => {
        const exists = fs.existsSync(path.join(__dirname, '..', item.path));
        if (!exists) console.log(`  Removed missing: ${item.filename}`);
        return exists;
    });
    if (db.music.length < musicBefore) cleaned = true;

    // Clean video entries
    const videosBefore = db.videos.length;
    db.videos = db.videos.filter(item => {
        const exists = fs.existsSync(path.join(__dirname, '..', item.path));
        if (!exists) console.log(`  Removed missing: ${item.filename}`);
        return exists;
    });
    if (db.videos.length < videosBefore) cleaned = true;

    return cleaned;
}

/**
 * Main execution
 */
async function main() {
    console.log("=".repeat(50));
    console.log("AI Media Analyzer - Erwin Esener Portfolio");
    console.log("=".repeat(50));

    // Clean up missing files first
    console.log("\nChecking for removed files...");
    const cleaned = cleanupMissingFiles();

    // Scan directories
    const musicUpdated = await scanDirectory(MUSIC_DIR, 'music', db.music, MUSIC_EXTENSIONS);
    const videoUpdated = await scanDirectory(CLIPS_DIR, 'videos', db.videos, VIDEO_EXTENSIONS);

    if (musicUpdated || videoUpdated || cleaned) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
        console.log("\n" + "=".repeat(50));
        console.log("Database updated successfully!");
        console.log(`Total tracks: ${db.music.length}`);
        console.log(`Total videos: ${db.videos.length}`);
        console.log("=".repeat(50));
    } else {
        console.log("\n" + "=".repeat(50));
        console.log("No changes detected. Database is up to date.");
        console.log(`Total tracks: ${db.music.length}`);
        console.log(`Total videos: ${db.videos.length}`);
        console.log("=".repeat(50));
    }
}

main().catch(console.error);
