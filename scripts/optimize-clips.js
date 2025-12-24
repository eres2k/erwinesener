#!/usr/bin/env node
/**
 * optimize-clips.js
 * Automatically optimizes video clips for web delivery at 720p
 *
 * Features:
 * - Transcodes videos to 720p (1280x720) for optimal web streaming
 * - Auto-detects GPU acceleration (NVIDIA NVENC, AMD AMF, Intel QSV)
 * - Falls back to CPU encoding (libx264) if no GPU available
 * - Uses H.264 codec with web-optimized settings
 * - Adds faststart flag for progressive playback
 * - Preserves originals in clips/originals/ folder
 * - Updates content.json paths automatically
 *
 * Requirements:
 * - FFmpeg must be installed
 *   Windows: winget install FFmpeg
 *   Linux:   sudo apt install ffmpeg
 *   macOS:   brew install ffmpeg
 *
 * Usage:
 *   node scripts/optimize-clips.js           # Optimize all clips (auto-detect GPU)
 *   node scripts/optimize-clips.js --cpu     # Force CPU encoding
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

    // Target resolution (720p)
    width: 1280,
    height: 720,

    // Audio codec settings (same for all encoders)
    audio: {
        codec: 'aac',
        bitrate: '128k',
        sampleRate: '44100',
    },

    // Encoder configurations (in priority order)
    encoders: {
        // NVIDIA NVENC (GPU) - 5-10x faster
        nvenc: {
            name: 'NVIDIA NVENC (GPU)',
            codec: 'h264_nvenc',
            testArgs: ['-f', 'lavfi', '-i', 'nullsrc=s=256x256:d=1', '-c:v', 'h264_nvenc', '-f', 'null', '-'],
            args: [
                '-c:v', 'h264_nvenc',
                '-preset', 'p4',           // p1 (fastest) to p7 (slowest/best)
                '-tune', 'hq',             // High quality tuning
                '-rc', 'vbr',              // Variable bitrate
                '-cq', '23',               // Constant quality (similar to CRF)
                '-b:v', '0',               // Let CQ control quality
                '-profile:v', 'high',
                '-level', '4.0',
            ]
        },
        // AMD AMF (GPU)
        amf: {
            name: 'AMD AMF (GPU)',
            codec: 'h264_amf',
            testArgs: ['-f', 'lavfi', '-i', 'nullsrc=s=256x256:d=1', '-c:v', 'h264_amf', '-f', 'null', '-'],
            args: [
                '-c:v', 'h264_amf',
                '-quality', 'quality',     // quality, balanced, speed
                '-rc', 'vbr_peak',
                '-qp_i', '23',
                '-qp_p', '23',
                '-profile:v', 'high',
                '-level', '4.0',
            ]
        },
        // Intel Quick Sync (GPU)
        qsv: {
            name: 'Intel Quick Sync (GPU)',
            codec: 'h264_qsv',
            testArgs: ['-f', 'lavfi', '-i', 'nullsrc=s=256x256:d=1', '-c:v', 'h264_qsv', '-f', 'null', '-'],
            args: [
                '-c:v', 'h264_qsv',
                '-preset', 'slow',
                '-global_quality', '23',
                '-profile:v', 'high',
                '-level', '4.0',
            ]
        },
        // CPU fallback (libx264) - always available
        cpu: {
            name: 'CPU (libx264)',
            codec: 'libx264',
            testArgs: null, // Always available
            args: [
                '-c:v', 'libx264',
                '-preset', 'slow',         // Better compression
                '-crf', '23',              // Quality (18-28)
                '-profile:v', 'high',
                '-level', '4.0',
            ]
        }
    },

    // Output format and web optimization
    format: 'mp4',
    movflags: '+faststart',
};

// Cache for detected encoder
let detectedEncoder = null;

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
 * Detect the best available encoder (GPU > CPU)
 * Tests encoders in priority order: NVENC > AMF > QSV > CPU
 */
function detectEncoder(forceCpu = false) {
    if (forceCpu) {
        console.log('  Forcing CPU encoder (--cpu flag)');
        return { key: 'cpu', ...CONFIG.encoders.cpu };
    }

    if (detectedEncoder) {
        return detectedEncoder;
    }

    console.log('  Detecting available encoders...');

    // Test GPU encoders in priority order
    const gpuEncoders = ['nvenc', 'amf', 'qsv'];

    for (const key of gpuEncoders) {
        const encoder = CONFIG.encoders[key];
        try {
            execSync(`ffmpeg ${encoder.testArgs.join(' ')} 2>&1`, {
                stdio: 'pipe',
                timeout: 10000
            });
            console.log(`  ✓ ${encoder.name} available`);
            detectedEncoder = { key, ...encoder };
            return detectedEncoder;
        } catch {
            // Encoder not available, try next
        }
    }

    // Fallback to CPU
    console.log('  No GPU encoder found, using CPU');
    detectedEncoder = { key: 'cpu', ...CONFIG.encoders.cpu };
    return detectedEncoder;
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
    const { dryRun = false, encoder = null } = options;

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

    // Build FFmpeg command with detected encoder
    const ffmpegArgs = [
        '-i', inputPath,
        '-y',  // Overwrite output
        '-v', 'warning',
        '-stats',

        // Video encoder settings (from detected encoder)
        ...encoder.args,

        // Scale to 720p (maintain aspect ratio, ensure even dimensions)
        '-vf', `scale='min(${CONFIG.width},iw)':min'(${CONFIG.height},ih)':force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2`,

        // Audio settings
        '-c:a', CONFIG.audio.codec,
        '-b:a', CONFIG.audio.bitrate,
        '-ar', CONFIG.audio.sampleRate,

        // Output format and web optimization
        '-f', CONFIG.format,
        '-movflags', CONFIG.movflags,
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
    const { dryRun = false, force = false, forceCpu = false } = options;

    console.log('\n' + '='.repeat(50));
    console.log('Web Video Optimizer - 720p');
    console.log('='.repeat(50));

    // Check FFmpeg
    if (!checkFFmpeg()) {
        console.error('\nError: FFmpeg is not installed!');
        console.error('Install with:');
        console.error('  Windows: winget install FFmpeg');
        console.error('  Linux:   sudo apt install ffmpeg');
        console.error('  macOS:   brew install ffmpeg');
        process.exit(1);
    }
    console.log('\n✓ FFmpeg found');

    // Detect best available encoder
    const encoder = detectEncoder(forceCpu);
    console.log(`\n🎬 Using encoder: ${encoder.name}`);

    if (dryRun) {
        console.log('\n🔍 DRY RUN MODE - No files will be modified');
    }

    const videos = getVideoFiles();

    if (videos.length === 0) {
        console.log('\nNo video files found in clips/');
        return;
    }

    console.log(`\nFound ${videos.length} video(s) to check`);

    const results = [];
    let totalSavings = 0;
    const startTime = Date.now();

    for (const filename of videos) {
        const filePath = path.join(CONFIG.clipsDir, filename);

        if (!needsOptimization(filePath, force)) {
            console.log(`\n  Skipping ${filename}: Already optimized`);
            continue;
        }

        const result = optimizeVideo(filename, { dryRun, encoder });
        if (result) {
            results.push(result);
            if (result.savings) totalSavings += result.savings;
        }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

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
        console.log(`Time elapsed: ${elapsed}s`);
        console.log(`Encoder used: ${encoder.name}`);
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

Automatically optimizes videos to 720p for web delivery.
Auto-detects GPU acceleration (NVIDIA/AMD/Intel) for 5-10x faster encoding.

Usage:
  node scripts/optimize-clips.js [options]

Options:
  --dry-run    Preview what would be optimized (no changes)
  --status     Show current optimization status
  --force      Re-optimize all videos (even if already optimized)
  --cpu        Force CPU encoding (skip GPU detection)
  --help       Show this help message

GPU Acceleration:
  The script automatically detects and uses:
  - NVIDIA NVENC (CUDA) - fastest
  - AMD AMF
  - Intel Quick Sync
  - CPU (libx264) - fallback

Examples:
  node scripts/optimize-clips.js              # Optimize with auto GPU detection
  node scripts/optimize-clips.js --cpu        # Force CPU encoding
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
            force: args.includes('--force') || args.includes('-f'),
            forceCpu: args.includes('--cpu') || args.includes('-c')
        });
    }
}

// Export for use as module
module.exports = {
    optimizeAll,
    optimizeVideo,
    getVideoInfo,
    needsOptimization,
    detectEncoder,
    showStatus,
    CONFIG
};
