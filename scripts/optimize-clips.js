#!/usr/bin/env node
/**
 * optimize-clips.js
 * Automatically optimizes video clips for web delivery at 720p
 *
 * Features:
 * - Transcodes videos to 720p (1280x720) for optimal web streaming
 * - Uses H.264 codec with web-optimized settings
 * - Adds faststart flag for progressive playback
 * - Preserves originals in clips/originals/ folder
 * - Updates content.json paths automatically
 *
 * Requirements:
 * - FFmpeg must be installed (sudo apt install ffmpeg)
 *
 * Usage:
 *   node scripts/optimize-clips.js           # Optimize all clips
 *   node scripts/optimize-clips.js --dry-run # Preview what would be optimized
 *   node scripts/optimize-clips.js --status  # Show optimization status
 *   node scripts/optimize-clips.js --force   # Re-optimize all clips
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// Configuration
const CONFIG = {
    clipsDir: path.join(__dirname, '../clips'),
    originalsDir: path.join(__dirname, '../clips/originals'),
    dataFile: path.join(__dirname, '../data/content.json'),
    videoExtensions: ['.mp4', '.webm', '.mov', '.avi', '.mkv'],

    // FFmpeg settings for web optimization
    ffmpeg: {
        // Target resolution (720p)
        width: 1280,
        height: 720,

        // Video codec settings
        videoCodec: 'libx264',
        preset: 'slow',        // Better compression (slow/medium/fast)
        crf: 23,               // Quality (18-28, lower = better quality, bigger file)
        profile: 'high',       // H.264 profile for compatibility
        level: '4.0',          // H.264 level for web compatibility

        // Audio codec settings
        audioCodec: 'aac',
        audioBitrate: '128k',
        audioSampleRate: '44100',

        // Output format
        format: 'mp4',

        // Web optimization
        movflags: '+faststart', // Move moov atom to start for streaming
    }
};

/**
 * Check if FFmpeg is installed
 */
function checkFFmpeg() {
    try {
        execSync('ffmpeg -version', { stdio: 'pipe' });
        return true;
    } catch {
        return false;
    }
}

/**
 * Get video information using ffprobe
 */
function getVideoInfo(filePath) {
    try {
        const result = execSync(
            `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`,
            { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
        );
        const info = JSON.parse(result);
        const videoStream = info.streams?.find(s => s.codec_type === 'video');

        return {
            width: videoStream?.width || 0,
            height: videoStream?.height || 0,
            duration: parseFloat(info.format?.duration || 0),
            size: parseInt(info.format?.size || 0),
            bitrate: parseInt(info.format?.bit_rate || 0),
            codec: videoStream?.codec_name || 'unknown'
        };
    } catch (error) {
        console.error(`  Error getting video info: ${error.message}`);
        return null;
    }
}

/**
 * Format file size for display
 */
function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Format duration for display
 */
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get list of video files in clips directory
 */
function getVideoFiles() {
    if (!fs.existsSync(CONFIG.clipsDir)) return [];

    return fs.readdirSync(CONFIG.clipsDir)
        .filter(f => !f.startsWith('.'))
        .filter(f => CONFIG.videoExtensions.includes(path.extname(f).toLowerCase()))
        .filter(f => {
            const stat = fs.statSync(path.join(CONFIG.clipsDir, f));
            return stat.isFile();
        });
}

/**
 * Check if a video needs optimization
 */
function needsOptimization(filePath, force = false) {
    if (force) return true;

    const info = getVideoInfo(filePath);
    if (!info) return false;

    // Check if already optimized (720p or smaller, reasonable bitrate)
    const isSmallEnough = info.height <= 720;
    const isReasonableBitrate = info.bitrate < 3000000; // Under 3 Mbps
    const isH264 = info.codec === 'h264';

    return !(isSmallEnough && isReasonableBitrate && isH264);
}

/**
 * Optimize a single video file
 */
function optimizeVideo(filename, options = {}) {
    const { dryRun = false } = options;

    const inputPath = path.join(CONFIG.clipsDir, filename);
    const outputFilename = path.basename(filename, path.extname(filename)) + '.mp4';
    const tempPath = path.join(CONFIG.clipsDir, '_temp_' + outputFilename);
    const originalPath = path.join(CONFIG.originalsDir, filename);

    const inputInfo = getVideoInfo(inputPath);
    if (!inputInfo) {
        console.log(`  Skipping ${filename}: Could not read video info`);
        return null;
    }

    console.log(`\n  Processing: ${filename}`);
    console.log(`    Input: ${inputInfo.width}x${inputInfo.height}, ${formatSize(inputInfo.size)}, ${formatDuration(inputInfo.duration)}`);

    if (dryRun) {
        console.log(`    [DRY RUN] Would optimize to 720p`);
        return { filename, skipped: false, dryRun: true };
    }

    // Build FFmpeg command
    const ffmpegArgs = [
        '-i', inputPath,
        '-y',  // Overwrite output
        '-v', 'warning',
        '-stats',

        // Video settings
        '-c:v', CONFIG.ffmpeg.videoCodec,
        '-preset', CONFIG.ffmpeg.preset,
        '-crf', CONFIG.ffmpeg.crf.toString(),
        '-profile:v', CONFIG.ffmpeg.profile,
        '-level', CONFIG.ffmpeg.level,

        // Scale to 720p (maintain aspect ratio, ensure even dimensions)
        '-vf', `scale='min(${CONFIG.ffmpeg.width},iw)':min'(${CONFIG.ffmpeg.height},ih)':force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2`,

        // Audio settings
        '-c:a', CONFIG.ffmpeg.audioCodec,
        '-b:a', CONFIG.ffmpeg.audioBitrate,
        '-ar', CONFIG.ffmpeg.audioSampleRate,

        // Output format and web optimization
        '-f', CONFIG.ffmpeg.format,
        '-movflags', CONFIG.ffmpeg.movflags,
        '-pix_fmt', 'yuv420p',  // Maximum compatibility

        tempPath
    ];

    try {
        console.log(`    Optimizing...`);

        // Run FFmpeg
        execSync(`ffmpeg ${ffmpegArgs.map(a => `"${a}"`).join(' ')}`, {
            stdio: ['pipe', 'pipe', 'inherit'],
            maxBuffer: 50 * 1024 * 1024
        });

        // Get output info
        const outputInfo = getVideoInfo(tempPath);
        if (!outputInfo || outputInfo.size === 0) {
            throw new Error('Output file is empty or invalid');
        }

        // Calculate savings
        const savings = inputInfo.size - outputInfo.size;
        const savingsPercent = ((savings / inputInfo.size) * 100).toFixed(1);

        // Ensure originals directory exists
        if (!fs.existsSync(CONFIG.originalsDir)) {
            fs.mkdirSync(CONFIG.originalsDir, { recursive: true });
        }

        // Move original to originals folder
        fs.renameSync(inputPath, originalPath);

        // Move optimized file to final location
        const finalPath = path.join(CONFIG.clipsDir, outputFilename);
        fs.renameSync(tempPath, finalPath);

        console.log(`    Output: ${outputInfo.width}x${outputInfo.height}, ${formatSize(outputInfo.size)}`);
        console.log(`    Saved: ${formatSize(savings)} (${savingsPercent}% reduction)`);
        console.log(`    Original backed up to: originals/${filename}`);

        return {
            filename,
            outputFilename,
            inputSize: inputInfo.size,
            outputSize: outputInfo.size,
            savings,
            savingsPercent: parseFloat(savingsPercent)
        };

    } catch (error) {
        console.error(`    Error optimizing: ${error.message}`);

        // Cleanup temp file if it exists
        if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }

        return null;
    }
}

/**
 * Update content.json paths for optimized videos
 */
function updateContentPaths(optimizedFiles) {
    if (!fs.existsSync(CONFIG.dataFile)) return;

    try {
        const content = JSON.parse(fs.readFileSync(CONFIG.dataFile, 'utf8'));
        let updated = false;

        for (const result of optimizedFiles) {
            if (!result || result.dryRun) continue;

            // Find video entry and update path if filename changed
            const video = content.videos?.find(v =>
                v.filename === result.filename ||
                v.path === `clips/${result.filename}`
            );

            if (video && result.outputFilename !== result.filename) {
                video.filename = result.outputFilename;
                video.path = `clips/${result.outputFilename}`;
                updated = true;
            }
        }

        if (updated) {
            fs.writeFileSync(CONFIG.dataFile, JSON.stringify(content, null, 2));
            console.log('\nUpdated content.json with new file paths');
        }
    } catch (error) {
        console.error(`Error updating content.json: ${error.message}`);
    }
}

/**
 * Show optimization status
 */
function showStatus() {
    console.log('\n' + '='.repeat(50));
    console.log('Video Optimization Status');
    console.log('='.repeat(50));

    const videos = getVideoFiles();

    if (videos.length === 0) {
        console.log('\nNo video files found in clips/');
        return;
    }

    let totalSize = 0;
    let needsOptCount = 0;

    console.log(`\nFound ${videos.length} video(s):\n`);

    for (const filename of videos) {
        const filePath = path.join(CONFIG.clipsDir, filename);
        const info = getVideoInfo(filePath);

        if (info) {
            totalSize += info.size;
            const needsOpt = needsOptimization(filePath);
            if (needsOpt) needsOptCount++;

            const status = needsOpt ? '⚠️  NEEDS OPTIMIZATION' : '✓ Optimized';
            console.log(`  ${filename}`);
            console.log(`    ${info.width}x${info.height} | ${formatSize(info.size)} | ${info.codec} | ${status}`);
        }
    }

    console.log('\n' + '-'.repeat(50));
    console.log(`Total size: ${formatSize(totalSize)}`);
    console.log(`Need optimization: ${needsOptCount} of ${videos.length} videos`);

    // Check for originals
    if (fs.existsSync(CONFIG.originalsDir)) {
        const originals = fs.readdirSync(CONFIG.originalsDir).filter(f => !f.startsWith('.'));
        if (originals.length > 0) {
            let originalsSize = 0;
            for (const f of originals) {
                const stat = fs.statSync(path.join(CONFIG.originalsDir, f));
                originalsSize += stat.size;
            }
            console.log(`\nOriginals backed up: ${originals.length} files (${formatSize(originalsSize)})`);
        }
    }

    console.log('='.repeat(50));
}

/**
 * Main optimization function
 */
async function optimizeAll(options = {}) {
    const { dryRun = false, force = false } = options;

    console.log('\n' + '='.repeat(50));
    console.log('Web Video Optimizer - 720p');
    console.log('='.repeat(50));

    // Check FFmpeg
    if (!checkFFmpeg()) {
        console.error('\nError: FFmpeg is not installed!');
        console.error('Install it with: sudo apt install ffmpeg');
        process.exit(1);
    }
    console.log('\n✓ FFmpeg found');

    if (dryRun) {
        console.log('🔍 DRY RUN MODE - No files will be modified\n');
    }

    const videos = getVideoFiles();

    if (videos.length === 0) {
        console.log('\nNo video files found in clips/');
        return;
    }

    console.log(`\nFound ${videos.length} video(s) to check`);

    const results = [];
    let totalSavings = 0;

    for (const filename of videos) {
        const filePath = path.join(CONFIG.clipsDir, filename);

        if (!needsOptimization(filePath, force)) {
            console.log(`\n  Skipping ${filename}: Already optimized`);
            continue;
        }

        const result = optimizeVideo(filename, { dryRun });
        if (result) {
            results.push(result);
            if (result.savings) totalSavings += result.savings;
        }
    }

    // Update content.json
    if (!dryRun && results.length > 0) {
        updateContentPaths(results);
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('Optimization Complete!');
    console.log('='.repeat(50));

    const optimized = results.filter(r => r && !r.dryRun && r.savings !== undefined);

    if (optimized.length > 0) {
        console.log(`\nOptimized: ${optimized.length} video(s)`);
        console.log(`Total saved: ${formatSize(totalSavings)}`);
    } else if (dryRun) {
        console.log(`\n[DRY RUN] Would optimize ${results.length} video(s)`);
    } else {
        console.log('\nAll videos are already optimized!');
    }
}

// CLI execution
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Web Video Optimizer for 720p

Usage:
  node scripts/optimize-clips.js [options]

Options:
  --dry-run    Preview what would be optimized (no changes)
  --status     Show current optimization status
  --force      Re-optimize all videos (even if already optimized)
  --help       Show this help message

Examples:
  node scripts/optimize-clips.js              # Optimize all clips
  node scripts/optimize-clips.js --dry-run    # Preview changes
  node scripts/optimize-clips.js --status     # Check status
  npm run optimize                            # Run via npm
        `);
        process.exit(0);
    }

    if (args.includes('--status') || args.includes('-s')) {
        showStatus();
    } else {
        optimizeAll({
            dryRun: args.includes('--dry-run') || args.includes('-n'),
            force: args.includes('--force') || args.includes('-f')
        });
    }
}

// Export for use as module
module.exports = {
    optimizeAll,
    optimizeVideo,
    getVideoInfo,
    needsOptimization,
    showStatus,
    CONFIG
};
