// =========================================
// Erwin Esener Portfolio - Revamped 2025
// Lightweight, Performant, Accessible
// =========================================

document.addEventListener('DOMContentLoaded', async () => {
    initScrollProgress();
    initNavigation();
    initMobileMenu();
    initRevealAnimations();
    initCounterAnimation();
    initProjectFilters();
    initCreativeTabs();

    await loadDynamicContent();

    document.body.classList.add('loaded');
});

// =========================================
// Dynamic Content Loader
// =========================================

async function loadDynamicContent() {
    try {
        const response = await fetch('./data/content.json');
        if (!response.ok) throw new Error('Content data not found');
        const data = await response.json();

        renderVideos(data.videos);
        renderTracks(data.music);
        initVideoModal();
        initMusicPlayer();
    } catch (error) {
        console.log('Using static fallback:', error.message);
    }
}

// =========================================
// Render Videos
// =========================================

function renderVideos(videos) {
    const grid = document.getElementById('video-grid');
    if (!grid || !videos) return;

    grid.innerHTML = videos.map((v, i) => `
        <div class="video-card reveal-up" style="--delay: ${0.05 * i}s" data-src="${v.path}" data-title="${v.title}" tabindex="0" role="button" aria-label="Play ${v.title}">
            <div class="video-thumb">
                <video src="${v.path}" muted preload="metadata" aria-hidden="true"></video>
                <div class="video-play-icon">
                    <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
            </div>
            <div class="video-meta">
                <h3 class="video-title">${v.title}</h3>
                <p class="video-description">${v.description}</p>
            </div>
        </div>
    `).join('');

    // Re-observe new elements for reveal
    observeRevealElements(grid);
}

// =========================================
// Render Music Tracks
// =========================================

function renderTracks(tracks) {
    const list = document.getElementById('track-list');
    if (!list || !tracks) return;

    const icons = {
        rocket: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>',
        city: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="6" width="7" height="18"/><rect x="10" y="2" width="7" height="22"/><rect x="19" y="10" width="4" height="14"/></svg>',
        mirror: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10"/></svg>',
        music: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
        globe: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>'
    };

    list.innerHTML = tracks.map((t, i) => `
        <div class="track-item" data-src="${t.path}" data-title="${t.title}" data-artist="${t.artist}" tabindex="0" role="button" aria-label="Play ${t.title} by ${t.artist}">
            <span class="track-number">${i + 1}</span>
            <div class="track-info">
                <span class="track-name">${t.title}</span>
                <span class="track-artist">${t.artist}</span>
            </div>
            <span class="track-icon">${icons[t.icon] || icons.music}</span>
        </div>
    `).join('');
}

// =========================================
// Scroll Progress
// =========================================

function initScrollProgress() {
    const bar = document.querySelector('.scroll-progress');
    if (!bar) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const scrollTop = window.scrollY;
                const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                bar.style.width = docHeight > 0 ? (scrollTop / docHeight * 100) + '%' : '0%';
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

// =========================================
// Navigation
// =========================================

function initNavigation() {
    const navbar = document.querySelector('.navbar');
    const links = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');

    // Scroll state
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                navbar.classList.toggle('scrolled', window.scrollY > 50);
                updateActiveLink(links, sections);
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                e.preventDefault();
                const offset = 80;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });
}

function updateActiveLink(links, sections) {
    const scrollPos = window.scrollY + 100;
    let currentSection = '';

    sections.forEach(section => {
        if (scrollPos >= section.offsetTop) {
            currentSection = section.getAttribute('id');
        }
    });

    links.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + currentSection);
    });
}

// =========================================
// Mobile Menu
// =========================================

function initMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const menu = document.querySelector('.mobile-menu');
    const links = document.querySelectorAll('.mobile-link');

    if (!toggle || !menu) return;

    function closeMenu() {
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
        menu.classList.remove('open');
        menu.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    toggle.addEventListener('click', () => {
        const isOpen = menu.classList.contains('open');
        if (isOpen) {
            closeMenu();
        } else {
            toggle.classList.add('active');
            toggle.setAttribute('aria-expanded', 'true');
            menu.classList.add('open');
            menu.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }
    });

    links.forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menu.classList.contains('open')) {
            closeMenu();
            toggle.focus();
        }
    });
}

// =========================================
// Reveal Animations (Intersection Observer)
// =========================================

function initRevealAnimations() {
    observeRevealElements(document);
}

function observeRevealElements(root) {
    const elements = root.querySelectorAll('.reveal-up:not(.visible)');
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(el => observer.observe(el));
}

// =========================================
// Counter Animation
// =========================================

function initCounterAnimation() {
    const counters = document.querySelectorAll('.stat-number[data-count]');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(el => observer.observe(el));
}

function animateCounter(el) {
    const target = parseInt(el.dataset.count);
    const duration = 1500;
    const start = performance.now();

    function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(target * eased);

        el.textContent = target > 1000 ? current.toLocaleString() : current;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// =========================================
// Project Filters
// =========================================

function initProjectFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.project-card');

    if (!buttons.length || !cards.length) return;

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;

            buttons.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');

            cards.forEach(card => {
                const category = card.dataset.category;
                const show = filter === 'all' || category === filter;
                card.classList.toggle('hidden', !show);
            });
        });
    });
}

// =========================================
// Creative Tabs (Visuals / Music)
// =========================================

function initCreativeTabs() {
    const tabs = document.querySelectorAll('.creative-tab');
    const panels = document.querySelectorAll('.creative-panel');

    if (!tabs.length) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;

            tabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');

            panels.forEach(p => {
                p.classList.toggle('active', p.id === 'panel-' + target);
            });
        });
    });
}

// =========================================
// Video Modal
// =========================================

function initVideoModal() {
    const modal = document.getElementById('video-modal');
    const modalVideo = document.getElementById('modal-video');
    const modalTitle = document.getElementById('modal-title');
    const closeBtn = document.getElementById('modal-close');
    const backdrop = document.getElementById('modal-backdrop');

    if (!modal || !modalVideo) return;

    function openModal(src, title) {
        modalVideo.src = src;
        modalTitle.textContent = title;
        modal.hidden = false;
        // Force reflow for transition
        modal.offsetHeight;
        modal.classList.add('open');
        modalVideo.play().catch(() => {});
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.remove('open');
        modalVideo.pause();
        modalVideo.src = '';
        document.body.style.overflow = '';
        setTimeout(() => { modal.hidden = true; }, 300);
    }

    // Click on video cards
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.video-card');
        if (card) {
            openModal(card.dataset.src, card.dataset.title);
        }
    });

    // Keyboard activation for video cards
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            const card = e.target.closest('.video-card');
            if (card) {
                e.preventDefault();
                openModal(card.dataset.src, card.dataset.title);
            }
        }
    });

    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('open')) {
            closeModal();
        }
    });
}

// =========================================
// Music Player
// =========================================

function initMusicPlayer() {
    const audio = document.getElementById('audio-player');
    const playBtn = document.getElementById('btn-play');
    const prevBtn = document.getElementById('btn-prev');
    const nextBtn = document.getElementById('btn-next');
    const progressBar = document.getElementById('progress-bar');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeBtn = document.getElementById('btn-volume');
    const currentTimeEl = document.getElementById('current-time');
    const totalTimeEl = document.getElementById('total-time');
    const titleEl = document.getElementById('player-title');
    const artistEl = document.getElementById('player-artist');
    const artEl = document.getElementById('player-art');
    const trackItems = document.querySelectorAll('.track-item');

    if (!audio || !playBtn || !trackItems.length) return;

    let currentTrackIndex = -1;
    let isPlaying = false;

    function loadTrack(index) {
        const item = trackItems[index];
        if (!item) return;

        currentTrackIndex = index;
        audio.src = item.dataset.src;
        titleEl.textContent = item.dataset.title;
        artistEl.textContent = item.dataset.artist;

        trackItems.forEach(t => t.classList.remove('active'));
        item.classList.add('active');
        artEl.classList.add('playing');

        audio.play().then(() => {
            isPlaying = true;
            updatePlayIcon();
        }).catch(() => {});
    }

    function togglePlay() {
        if (currentTrackIndex === -1) {
            loadTrack(0);
            return;
        }

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play().catch(() => {});
        }
    }

    function updatePlayIcon() {
        const iconPlay = playBtn.querySelector('.icon-play');
        const iconPause = playBtn.querySelector('.icon-pause');
        if (iconPlay && iconPause) {
            iconPlay.style.display = isPlaying ? 'none' : 'block';
            iconPause.style.display = isPlaying ? 'block' : 'none';
        }
        playBtn.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
    }

    function formatTime(s) {
        if (isNaN(s)) return '0:00';
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return m + ':' + (sec < 10 ? '0' : '') + sec;
    }

    // Events
    audio.addEventListener('play', () => { isPlaying = true; updatePlayIcon(); });
    audio.addEventListener('pause', () => { isPlaying = false; updatePlayIcon(); });

    audio.addEventListener('timeupdate', () => {
        if (audio.duration) {
            progressBar.value = (audio.currentTime / audio.duration) * 100;
            currentTimeEl.textContent = formatTime(audio.currentTime);
        }
    });

    audio.addEventListener('loadedmetadata', () => {
        totalTimeEl.textContent = formatTime(audio.duration);
    });

    audio.addEventListener('ended', () => {
        const next = (currentTrackIndex + 1) % trackItems.length;
        loadTrack(next);
    });

    playBtn.addEventListener('click', togglePlay);

    prevBtn.addEventListener('click', () => {
        const prev = currentTrackIndex <= 0 ? trackItems.length - 1 : currentTrackIndex - 1;
        loadTrack(prev);
    });

    nextBtn.addEventListener('click', () => {
        const next = (currentTrackIndex + 1) % trackItems.length;
        loadTrack(next);
    });

    progressBar.addEventListener('input', () => {
        if (audio.duration) {
            audio.currentTime = (progressBar.value / 100) * audio.duration;
        }
    });

    // Volume
    audio.volume = 0.8;

    volumeSlider.addEventListener('input', () => {
        audio.volume = volumeSlider.value / 100;
        audio.muted = false;
        updateVolumeIcon(false);
    });

    volumeBtn.addEventListener('click', () => {
        audio.muted = !audio.muted;
        updateVolumeIcon(audio.muted);
    });

    function updateVolumeIcon(muted) {
        const on = volumeBtn.querySelector('.icon-volume-on');
        const off = volumeBtn.querySelector('.icon-volume-off');
        if (on && off) {
            on.style.display = muted ? 'none' : 'block';
            off.style.display = muted ? 'block' : 'none';
        }
    }

    // Click on track items
    trackItems.forEach((item, i) => {
        item.addEventListener('click', () => loadTrack(i));
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                loadTrack(i);
            }
        });
    });
}
