// =============================================
// Erwin Esener — Portfolio 2026
// Compact, modern, accessible
// =============================================

document.addEventListener('DOMContentLoaded', async () => {
    initNav();
    initMobileMenu();
    initAnimations();
    initCounters();
    initFilters();
    initTabs();

    await loadContent();
});

// =============================================
// Dynamic Content
// =============================================

async function loadContent() {
    try {
        const res = await fetch('./data/content.json');
        if (!res.ok) throw new Error('No content data');
        const data = await res.json();

        renderVideos(data.videos);
        renderTracks(data.music);
        initVideoModal();
        initMusicPlayer();
    } catch (e) {
        console.log('Static fallback:', e.message);
    }
}

// =============================================
// Render Videos
// =============================================

function renderVideos(videos) {
    const grid = document.getElementById('video-grid');
    if (!grid || !videos) return;

    grid.innerHTML = videos.map((v, i) => `
        <div class="vid-card anim" data-src="${v.path}" data-title="${v.title}" tabindex="0" role="button" aria-label="Play ${v.title}">
            <div class="vid-card__thumb">
                <video src="${v.path}" muted preload="metadata" aria-hidden="true"></video>
                <div class="vid-card__play">
                    <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
            </div>
            <div class="vid-card__meta">
                <h3>${v.title}</h3>
                <p>${v.description}</p>
            </div>
        </div>
    `).join('');

    observeElements(grid);
}

// =============================================
// Render Tracks
// =============================================

function renderTracks(tracks) {
    const list = document.getElementById('track-list');
    if (!list || !tracks) return;

    list.innerHTML = tracks.map((t, i) => `
        <div class="track" data-src="${t.path}" data-title="${t.title}" data-artist="${t.artist}" tabindex="0" role="button" aria-label="Play ${t.title} by ${t.artist}">
            <span class="track__num">${i + 1}</span>
            <div class="track__info">
                <span class="track__name">${t.title}</span>
                <span class="track__artist">${t.artist}</span>
            </div>
        </div>
    `).join('');
}

// =============================================
// Navigation
// =============================================

function initNav() {
    const nav = document.querySelector('.nav');
    const links = document.querySelectorAll('.nav__links a:not(.nav__cta)');
    const sections = document.querySelectorAll('section[id]');

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            nav.classList.toggle('scrolled', window.scrollY > 40);
            // Active link
            const y = window.scrollY + 120;
            let current = '';
            sections.forEach(s => { if (y >= s.offsetTop) current = s.id; });
            links.forEach(a => {
                a.style.color = a.getAttribute('href') === '#' + current ? 'var(--text)' : '';
            });
            ticking = false;
        });
    }, { passive: true });

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const target = document.querySelector(a.getAttribute('href'));
            if (target) {
                e.preventDefault();
                window.scrollTo({ top: target.offsetTop - 64, behavior: 'smooth' });
            }
        });
    });
}

// =============================================
// Mobile Menu
// =============================================

function initMobileMenu() {
    const toggle = document.querySelector('.nav__toggle');
    const menu = document.getElementById('mobile-nav');
    const links = menu?.querySelectorAll('a');
    if (!toggle || !menu) return;

    const close = () => {
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
        menu.classList.remove('open');
        menu.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };

    toggle.addEventListener('click', () => {
        const open = menu.classList.contains('open');
        if (open) { close(); return; }
        toggle.classList.add('active');
        toggle.setAttribute('aria-expanded', 'true');
        menu.classList.add('open');
        menu.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    });

    links?.forEach(l => l.addEventListener('click', close));
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && menu.classList.contains('open')) { close(); toggle.focus(); }
    });
}

// =============================================
// Animations (IntersectionObserver)
// =============================================

function initAnimations() { observeElements(document); }

function observeElements(root) {
    const els = root.querySelectorAll('.anim:not(.visible)');
    if (!els.length) return;

    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

    els.forEach(el => obs.observe(el));
}

// =============================================
// Counter Animation
// =============================================

function initCounters() {
    const nums = document.querySelectorAll('.stat__num[data-count]');
    if (!nums.length) return;

    // Reset to 0 — HTML has real values as fallback for no-JS
    nums.forEach(el => { el.textContent = '0'; });

    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) { animateNum(e.target); obs.unobserve(e.target); }
        });
    }, { threshold: 0.15 });

    nums.forEach(el => obs.observe(el));
}

function animateNum(el) {
    const target = parseInt(el.dataset.count);
    const start = performance.now();
    const dur = 1200;

    function tick(now) {
        const t = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = target > 1000 ? Math.round(target * eased).toLocaleString() : Math.round(target * eased);
        if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

// =============================================
// Filters
// =============================================

function initFilters() {
    const btns = document.querySelectorAll('.filters__btn');
    const cards = document.querySelectorAll('.card[data-cat]');
    if (!btns.length) return;

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const f = btn.dataset.filter;
            btns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            cards.forEach(c => c.classList.toggle('hidden', f !== 'all' && c.dataset.cat !== f));
        });
    });
}

// =============================================
// Tabs
// =============================================

function initTabs() {
    const tabs = document.querySelectorAll('.tab-bar__btn');
    const panels = document.querySelectorAll('.tab-panel');
    if (!tabs.length) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const t = tab.dataset.tab;
            tabs.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            panels.forEach(p => p.classList.toggle('active', p.id === 'panel-' + t));
        });
    });
}

// =============================================
// Video Modal (using <dialog>)
// =============================================

function initVideoModal() {
    const dialog = document.getElementById('video-modal');
    const video = document.getElementById('modal-video');
    const title = document.getElementById('modal-title');
    const closeBtn = document.getElementById('modal-close');
    if (!dialog || !video) return;

    function open(src, name) {
        video.src = src;
        title.textContent = name;
        dialog.showModal();
        video.play().catch(() => {});
    }

    function close() {
        video.pause();
        video.src = '';
        dialog.close();
    }

    document.addEventListener('click', e => {
        const card = e.target.closest('.vid-card');
        if (card) open(card.dataset.src, card.dataset.title);
    });

    document.addEventListener('keydown', e => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.vid-card')) {
            e.preventDefault();
            const card = e.target.closest('.vid-card');
            open(card.dataset.src, card.dataset.title);
        }
    });

    closeBtn.addEventListener('click', close);
    dialog.addEventListener('click', e => { if (e.target === dialog) close(); });
}

// =============================================
// Music Player
// =============================================

function initMusicPlayer() {
    const audio = document.getElementById('audio-player');
    const playBtn = document.getElementById('btn-play');
    const prevBtn = document.getElementById('btn-prev');
    const nextBtn = document.getElementById('btn-next');
    const progress = document.getElementById('progress-bar');
    const volSlider = document.getElementById('volume-slider');
    const volBtn = document.getElementById('btn-volume');
    const timeNow = document.getElementById('current-time');
    const timeEnd = document.getElementById('total-time');
    const titleEl = document.getElementById('player-title');
    const artistEl = document.getElementById('player-artist');
    const artEl = document.getElementById('player-art');
    const tracks = document.querySelectorAll('.track');

    if (!audio || !playBtn || !tracks.length) return;

    let idx = -1;
    let playing = false;

    function load(i) {
        const t = tracks[i];
        if (!t) return;
        idx = i;
        audio.src = t.dataset.src;
        titleEl.textContent = t.dataset.title;
        artistEl.textContent = t.dataset.artist;
        tracks.forEach(tr => tr.classList.remove('active'));
        t.classList.add('active');
        artEl.classList.add('playing');
        audio.play().then(() => { playing = true; updateIcon(); }).catch(() => {});
    }

    function toggle() {
        if (idx === -1) { load(0); return; }
        playing ? audio.pause() : audio.play().catch(() => {});
    }

    function updateIcon() {
        const pi = playBtn.querySelector('.icon-play');
        const pa = playBtn.querySelector('.icon-pause');
        if (pi) pi.style.display = playing ? 'none' : 'block';
        if (pa) pa.style.display = playing ? 'block' : 'none';
        playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    }

    function fmt(s) {
        if (isNaN(s)) return '0:00';
        return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
    }

    audio.addEventListener('play', () => { playing = true; updateIcon(); });
    audio.addEventListener('pause', () => { playing = false; updateIcon(); });
    audio.addEventListener('timeupdate', () => {
        if (audio.duration) {
            progress.value = (audio.currentTime / audio.duration) * 100;
            timeNow.textContent = fmt(audio.currentTime);
        }
    });
    audio.addEventListener('loadedmetadata', () => { timeEnd.textContent = fmt(audio.duration); });
    audio.addEventListener('ended', () => load((idx + 1) % tracks.length));

    playBtn.addEventListener('click', toggle);
    prevBtn.addEventListener('click', () => load(idx <= 0 ? tracks.length - 1 : idx - 1));
    nextBtn.addEventListener('click', () => load((idx + 1) % tracks.length));
    progress.addEventListener('input', () => { if (audio.duration) audio.currentTime = (progress.value / 100) * audio.duration; });

    audio.volume = 0.8;
    volSlider.addEventListener('input', () => { audio.volume = volSlider.value / 100; audio.muted = false; updateVol(false); });
    volBtn.addEventListener('click', () => { audio.muted = !audio.muted; updateVol(audio.muted); });

    function updateVol(muted) {
        const on = volBtn.querySelector('.icon-volume-on');
        const off = volBtn.querySelector('.icon-volume-off');
        if (on) on.style.display = muted ? 'none' : 'block';
        if (off) off.style.display = muted ? 'block' : 'none';
    }

    tracks.forEach((t, i) => {
        t.addEventListener('click', () => load(i));
        t.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); load(i); } });
    });
}
