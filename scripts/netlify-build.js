/**
 * netlify-build.js
 * Wrapper for Netlify builds that caches data/content.json between deploys.
 *
 * Problem: Netlify starts each build from a fresh git checkout, so content.json
 *          from git may not include entries added during previous builds.
 *          This causes all media to be re-analyzed on every push.
 *
 * Solution: Use Netlify's persistent build cache (/opt/build/cache/) to
 *           preserve content.json between builds. Only truly new files
 *           get sent to the Gemini API.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DATA_FILE = path.join(__dirname, '../data/content.json');
const CACHE_DIR = '/opt/build/cache';
const CACHE_FILE = path.join(CACHE_DIR, 'content.json');

/**
 * Merge cached content.json with the git version.
 * Cached entries take priority (they have AI-generated descriptions),
 * but git entries are kept if the file still exists on disk.
 */
function restoreCache() {
    if (!fs.existsSync(CACHE_FILE)) {
        console.log('[cache] No cached content.json found - first build or cache cleared');
        return;
    }

    console.log('[cache] Restoring content.json from build cache...');

    try {
        const cached = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
        let current = { music: [], videos: [] };

        if (fs.existsSync(DATA_FILE)) {
            current = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        }

        // Merge: use cached entries, adding any git-only entries that aren't in cache
        const merged = { music: [], videos: [] };

        for (const type of ['music', 'videos']) {
            const cachedItems = Array.isArray(cached[type]) ? cached[type] : [];
            const currentItems = Array.isArray(current[type]) ? current[type] : [];

            // Start with all cached entries
            const seen = new Set();
            for (const item of cachedItems) {
                merged[type].push(item);
                seen.add(item.filename);
            }

            // Add any entries from git that aren't in cache
            for (const item of currentItems) {
                if (!seen.has(item.filename)) {
                    merged[type].push(item);
                }
            }
        }

        fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
        fs.writeFileSync(DATA_FILE, JSON.stringify(merged, null, 2));

        const cachedCount = (cached.music?.length || 0) + (cached.videos?.length || 0);
        const mergedCount = merged.music.length + merged.videos.length;
        console.log(`[cache] Restored ${cachedCount} cached entries (${mergedCount} total after merge)`);
    } catch (e) {
        console.error('[cache] Failed to restore cache:', e.message);
        console.log('[cache] Continuing with git version of content.json');
    }
}

/**
 * Save the updated content.json to the build cache for next time.
 */
function updateCache() {
    if (!fs.existsSync(DATA_FILE)) return;

    try {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
        fs.copyFileSync(DATA_FILE, CACHE_FILE);
        console.log('[cache] Saved updated content.json to build cache');
    } catch (e) {
        console.error('[cache] Failed to update cache:', e.message);
    }
}

// Main build flow
restoreCache();

console.log('\n[build] Running media analysis...\n');
execSync('node scripts/analyze-media.js', { stdio: 'inherit' });

updateCache();
