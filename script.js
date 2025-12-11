// =========================================
// Award-Winning Portfolio - Apple-Style Scroll Animations
// =========================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all animations
    initScrollProgress();
    initNavigation();
    initScrollReveal();
    initParallax();
    initTextSplit();
    initSmoothScroll();
    initMobileMenu();
    initCounterAnimation();

    // Add loaded class for initial animations
    document.body.classList.add('loaded');
});

// =========================================
// Scroll Progress Indicator
// =========================================

function initScrollProgress() {
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.prepend(progressBar);

    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const scrollTop = window.scrollY;
                const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                const progress = (scrollTop / docHeight) * 100;
                progressBar.style.width = `${progress}%`;
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

// =========================================
// Navigation with Scroll Detection
// =========================================

function initNavigation() {
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');

    // Scroll effect for navbar
    let lastScrollY = 0;
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const scrollY = window.scrollY;

                // Add/remove scrolled class
                if (scrollY > 50) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }

                lastScrollY = scrollY;
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    // Active section tracking
    const observerOptions = {
        threshold: 0.3,
        rootMargin: '-100px 0px -50% 0px'
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const currentId = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${currentId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => sectionObserver.observe(section));
}

// =========================================
// Apple-Style Scroll Reveal Animations
// =========================================

function initScrollReveal() {
    // Elements to animate on scroll
    const animatedElements = document.querySelectorAll(`
        .section-header,
        .project-card,
        .skill-category,
        .contact-card,
        .video-card
    `);

    // Observer with staggered reveal
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Add delay based on element's position in the viewport
                const delay = entry.target.dataset.delay || 0;

                setTimeout(() => {
                    entry.target.classList.add('in-view');
                }, delay);

                // Unobserve after animation
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach((el, index) => {
        revealObserver.observe(el);
    });

    // Special handling for skill categories with staggered delays
    const skillCategories = document.querySelectorAll('.skill-category');
    skillCategories.forEach((card, index) => {
        card.dataset.delay = index * 100;
    });

    // Special handling for contact cards
    const contactCards = document.querySelectorAll('.contact-card');
    contactCards.forEach((card, index) => {
        card.dataset.delay = index * 100;
    });
}

// =========================================
// Parallax Depth Effect
// =========================================

function initParallax() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    const orbs = document.querySelectorAll('.gradient-orb');

    let ticking = false;

    // Parallax on scroll
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const scrollY = window.scrollY;

                // Move gradient orbs based on scroll
                orbs.forEach((orb, index) => {
                    const speed = (index + 1) * 0.05;
                    const yPos = scrollY * speed;
                    orb.style.transform = `translate(0, ${yPos}px)`;
                });

                // Move parallax elements
                parallaxElements.forEach(el => {
                    const speed = el.dataset.parallax || 0.1;
                    const yPos = scrollY * speed;
                    el.style.transform = `translateY(${yPos}px)`;
                });

                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    // Subtle mouse parallax for orbs
    let mouseX = 0, mouseY = 0;
    let currentX = 0, currentY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 30;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 30;
    }, { passive: true });

    function animateOrbs() {
        currentX += (mouseX - currentX) * 0.05;
        currentY += (mouseY - currentY) * 0.05;

        orbs.forEach((orb, index) => {
            const factor = (index + 1) * 0.3;
            orb.style.marginLeft = `${currentX * factor}px`;
            orb.style.marginTop = `${currentY * factor}px`;
        });

        requestAnimationFrame(animateOrbs);
    }

    animateOrbs();
}

// =========================================
// Text Split Animation
// =========================================

function initTextSplit() {
    const splitTitles = document.querySelectorAll('.section-title');

    splitTitles.forEach(title => {
        const text = title.textContent;
        const words = text.split(' ');

        title.innerHTML = words.map(word => {
            const chars = word.split('').map((char, i) =>
                `<span class="char" style="transition-delay: ${i * 0.03}s">${char}</span>`
            ).join('');
            return `<span class="word">${chars}</span>`;
        }).join(' ');
    });
}

// =========================================
// Smooth Scroll
// =========================================

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');

            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const navbarHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = targetElement.offsetTop - navbarHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// =========================================
// Mobile Menu
// =========================================

function initMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (!menuToggle) return;

    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        menuToggle.classList.toggle('active');

        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });

    // Close menu on link click
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            menuToggle.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            menuToggle.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// =========================================
// Counter Animation
// =========================================

function initCounterAnimation() {
    const counters = document.querySelectorAll('.stat-number, .impact-stat');

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.dataset.animated) {
                animateCounter(entry.target);
                entry.target.dataset.animated = 'true';
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => counterObserver.observe(counter));
}

function animateCounter(element) {
    const text = element.textContent.trim();

    // Handle special cases
    if (text.toLowerCase() === 'zero') {
        element.textContent = '0';
        setTimeout(() => {
            element.textContent = 'zero';
        }, 1500);
        return;
    }

    const match = text.match(/^(\d+)(.*)$/);
    if (!match) return;

    const target = parseInt(match[1]);
    const suffix = match[2];
    const duration = 2000;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(easeProgress * target);

        element.textContent = current + suffix;

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = target + suffix;
        }
    }

    element.textContent = '0' + suffix;
    requestAnimationFrame(update);
}

// =========================================
// Scroll-Linked Opacity Effect
// =========================================

function initScrollLinkedEffects() {
    const hero = document.querySelector('.hero');

    if (!hero) return;

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const heroHeight = hero.offsetHeight;
        const opacity = 1 - (scrollY / heroHeight) * 1.5;
        const scale = 1 - (scrollY / heroHeight) * 0.1;

        hero.style.opacity = Math.max(0, Math.min(1, opacity));
        hero.querySelector('.hero-content').style.transform =
            `scale(${Math.max(0.9, scale)}) translateY(${scrollY * 0.3}px)`;
    }, { passive: true });
}

// Initialize scroll-linked effects
initScrollLinkedEffects();

// =========================================
// Performance: Throttle Utility
// =========================================

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// =========================================
// Intersection Observer for Skills Grid
// =========================================

const skillsGrid = document.querySelector('.skills-grid');

if (skillsGrid) {
    const skillsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const categories = entry.target.querySelectorAll('.skill-category');
                categories.forEach((category, index) => {
                    setTimeout(() => {
                        category.classList.add('in-view');
                    }, index * 100);
                });
                skillsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    skillsObserver.observe(skillsGrid);
}

// =========================================
// Magnetic Button Effect (Subtle)
// =========================================

document.querySelectorAll('.btn, .project-link').forEach(btn => {
    btn.addEventListener('mousemove', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        this.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
    });

    btn.addEventListener('mouseleave', function() {
        this.style.transform = '';
    });
});

// =========================================
// Cursor Glow Effect
// =========================================

function initCursorGlow() {
    const glow = document.createElement('div');
    glow.style.cssText = `
        position: fixed;
        width: 400px;
        height: 400px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255, 107, 53, 0.08) 0%, transparent 70%);
        pointer-events: none;
        z-index: 0;
        transform: translate(-50%, -50%);
        transition: opacity 0.3s ease;
        opacity: 0;
    `;
    document.body.appendChild(glow);

    let glowX = 0, glowY = 0;
    let currentGlowX = 0, currentGlowY = 0;

    document.addEventListener('mousemove', (e) => {
        glowX = e.clientX;
        glowY = e.clientY;
        glow.style.opacity = '1';
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
        glow.style.opacity = '0';
    });

    function animateGlow() {
        currentGlowX += (glowX - currentGlowX) * 0.1;
        currentGlowY += (glowY - currentGlowY) * 0.1;

        glow.style.left = `${currentGlowX}px`;
        glow.style.top = `${currentGlowY}px`;

        requestAnimationFrame(animateGlow);
    }

    animateGlow();
}

// Initialize cursor glow on desktop only
if (window.matchMedia('(min-width: 1024px)').matches) {
    initCursorGlow();
}

// =========================================
// Scroll Velocity Effect
// =========================================

let scrollVelocity = 0;
let lastScrollTop = 0;

window.addEventListener('scroll', throttle(() => {
    const scrollTop = window.scrollY;
    scrollVelocity = Math.abs(scrollTop - lastScrollTop);
    lastScrollTop = scrollTop;

    // Apply velocity-based effects
    const projectCards = document.querySelectorAll('.project-card.in-view');
    const velocityScale = Math.min(scrollVelocity * 0.001, 0.02);

    projectCards.forEach(card => {
        card.style.transform = `translateY(0) scale(${1 - velocityScale})`;
    });

    // Reset after scroll stops
    setTimeout(() => {
        projectCards.forEach(card => {
            card.style.transform = '';
        });
    }, 150);
}, 16), { passive: true });

// =========================================
// Section Reveal with Blur
// =========================================

const blurSections = document.querySelectorAll('.section-header');

const blurObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
        }
    });
}, {
    threshold: 0.2,
    rootMargin: '0px 0px -100px 0px'
});

blurSections.forEach(section => blurObserver.observe(section));

// =========================================
// Performance Monitor (Development Only)
// =========================================

if (window.location.hostname === 'localhost') {
    window.addEventListener('load', () => {
        if (window.performance && window.performance.timing) {
            const perfData = window.performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            console.log(`Page loaded in ${pageLoadTime}ms`);
        }
    });
}

// Log initialization
console.log('Award-winning portfolio initialized');

// =========================================
// Music Player with Audio Visualization
// =========================================

(function initMusicPlayer() {
    const musicPlayer = document.querySelector('.music-player');
    const trackCards = document.querySelectorAll('.track-card');
    const playBtn = document.querySelector('.play-btn');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const progressFill = document.querySelector('.progress-fill');
    const progressInput = document.querySelector('.progress-input');
    const timeCurrent = document.querySelector('.time-current');
    const timeDuration = document.querySelector('.time-duration');
    const volumeSlider = document.querySelector('.volume-slider');
    const trackTitle = document.querySelector('.now-playing .track-title');
    const trackArtist = document.querySelector('.now-playing .track-artist');
    const playIcon = document.querySelector('.play-icon');
    const pauseIcon = document.querySelector('.pause-icon');
    const canvas = document.getElementById('audioVisualizer');

    if (!musicPlayer || !canvas) return;

    // Audio setup
    let audio = new Audio();
    let audioContext = null;
    let analyser = null;
    let source = null;
    let currentTrackIndex = -1;
    let isPlaying = false;
    let animationId = null;

    // Canvas setup
    const ctx = canvas.getContext('2d');
    let canvasWidth, canvasHeight;

    function resizeCanvas() {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        canvasWidth = canvas.width;
        canvasHeight = canvas.height;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize audio context on first interaction
    function initAudioContext() {
        if (audioContext) return;

        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
    }

    // Format time
    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Load track
    function loadTrack(index) {
        if (index < 0 || index >= trackCards.length) return;

        const card = trackCards[index];
        const src = card.dataset.src;
        const title = card.dataset.title;
        const artist = card.dataset.artist;

        // Update UI
        trackCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        trackTitle.textContent = title;
        trackArtist.textContent = artist;

        // Load audio
        audio.src = src;
        currentTrackIndex = index;

        audio.addEventListener('loadedmetadata', () => {
            timeDuration.textContent = formatTime(audio.duration);
            card.querySelector('.track-duration').textContent = formatTime(audio.duration);
        }, { once: true });
    }

    // Play/Pause
    function togglePlay() {
        if (currentTrackIndex === -1) {
            loadTrack(0);
        }

        initAudioContext();

        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        if (isPlaying) {
            audio.pause();
            isPlaying = false;
            musicPlayer.classList.remove('playing');
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
            cancelAnimationFrame(animationId);
        } else {
            audio.play();
            isPlaying = true;
            musicPlayer.classList.add('playing');
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
            visualize();
        }
    }

    // Previous track
    function prevTrack() {
        let newIndex = currentTrackIndex - 1;
        if (newIndex < 0) newIndex = trackCards.length - 1;
        loadTrack(newIndex);
        if (isPlaying) {
            audio.play();
            visualize();
        }
    }

    // Next track
    function nextTrack() {
        let newIndex = currentTrackIndex + 1;
        if (newIndex >= trackCards.length) newIndex = 0;
        loadTrack(newIndex);
        if (isPlaying) {
            audio.play();
            visualize();
        }
    }

    // Audio visualization
    function visualize() {
        if (!analyser) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        function draw() {
            animationId = requestAnimationFrame(draw);

            analyser.getByteFrequencyData(dataArray);

            // Clear canvas
            ctx.clearRect(0, 0, canvasWidth / window.devicePixelRatio, canvasHeight / window.devicePixelRatio);

            const centerX = canvasWidth / (2 * window.devicePixelRatio);
            const centerY = canvasHeight / (2 * window.devicePixelRatio);
            const radius = Math.min(centerX, centerY) * 0.75;

            // Draw circular bars
            const bars = 64;
            const barWidth = 3;

            for (let i = 0; i < bars; i++) {
                const dataIndex = Math.floor(i * bufferLength / bars);
                const value = dataArray[dataIndex];
                const barHeight = (value / 255) * radius * 0.5;

                const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;

                const x1 = centerX + Math.cos(angle) * (radius - 10);
                const y1 = centerY + Math.sin(angle) * (radius - 10);
                const x2 = centerX + Math.cos(angle) * (radius - 10 + barHeight);
                const y2 = centerY + Math.sin(angle) * (radius - 10 + barHeight);

                // Gradient color based on frequency
                const hue = (i / bars) * 60 + 15; // Orange to purple range
                const saturation = 80 + (value / 255) * 20;
                const lightness = 50 + (value / 255) * 20;

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${0.6 + (value / 255) * 0.4})`;
                ctx.lineWidth = barWidth;
                ctx.lineCap = 'round';
                ctx.stroke();
            }

            // Inner glow effect
            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 0.6);
            gradient.addColorStop(0, 'rgba(255, 107, 53, 0.1)');
            gradient.addColorStop(0.5, 'rgba(124, 58, 237, 0.05)');
            gradient.addColorStop(1, 'transparent');

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        }

        draw();
    }

    // Update progress
    audio.addEventListener('timeupdate', () => {
        const progress = (audio.currentTime / audio.duration) * 100;
        progressFill.style.width = `${progress}%`;
        progressInput.value = progress;
        timeCurrent.textContent = formatTime(audio.currentTime);
    });

    // Track ended
    audio.addEventListener('ended', () => {
        nextTrack();
    });

    // Progress seek
    progressInput.addEventListener('input', (e) => {
        const time = (e.target.value / 100) * audio.duration;
        audio.currentTime = time;
    });

    // Volume control
    volumeSlider.addEventListener('input', (e) => {
        audio.volume = e.target.value / 100;
    });

    // Set initial volume
    audio.volume = 0.8;

    // Event listeners
    playBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', prevTrack);
    nextBtn.addEventListener('click', nextTrack);

    // Track card click
    trackCards.forEach((card, index) => {
        card.addEventListener('click', () => {
            const wasPlaying = isPlaying && currentTrackIndex === index;

            if (currentTrackIndex !== index) {
                loadTrack(index);
                initAudioContext();

                if (audioContext.state === 'suspended') {
                    audioContext.resume();
                }

                audio.play();
                isPlaying = true;
                musicPlayer.classList.add('playing');
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'block';
                visualize();
            } else {
                togglePlay();
            }
        });
    });

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        // Only handle if music section is in view
        const musicSection = document.querySelector('#music');
        const rect = musicSection.getBoundingClientRect();
        const inView = rect.top < window.innerHeight && rect.bottom > 0;

        if (!inView) return;

        if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
            e.preventDefault();
            togglePlay();
        } else if (e.code === 'ArrowLeft') {
            prevTrack();
        } else if (e.code === 'ArrowRight') {
            nextTrack();
        }
    });

    // Scroll reveal for music elements
    const musicObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                musicObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    musicObserver.observe(musicPlayer);
    trackCards.forEach(card => musicObserver.observe(card));

    // Load track durations
    trackCards.forEach((card, index) => {
        const tempAudio = new Audio();
        tempAudio.src = card.dataset.src;
        tempAudio.addEventListener('loadedmetadata', () => {
            card.querySelector('.track-duration').textContent = formatTime(tempAudio.duration);
        });
    });

    console.log('Music player initialized');
})();

// =========================================
// Video Gallery with Modal Player
// =========================================

(function initVideoGallery() {
    const videoCards = document.querySelectorAll('.video-card');
    const videoModal = document.getElementById('videoModal');
    const modalVideo = document.getElementById('modalVideo');
    const modalTitle = document.querySelector('.modal-title');
    const modalDescription = document.querySelector('.modal-description');
    const modalClose = document.querySelector('.modal-close');
    const modalBackdrop = document.querySelector('.modal-backdrop');

    if (!videoCards.length || !videoModal) return;

    // Format time
    function formatTime(seconds) {
        if (isNaN(seconds)) return '-:--';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Load video durations
    videoCards.forEach(card => {
        const video = card.querySelector('.video-thumbnail');
        const durationEl = card.querySelector('.video-duration');

        if (video && durationEl) {
            video.addEventListener('loadedmetadata', () => {
                durationEl.textContent = formatTime(video.duration);
            });

            // Trigger load
            video.load();
        }
    });

    // Hover preview for video cards
    videoCards.forEach(card => {
        const video = card.querySelector('.video-thumbnail');

        card.addEventListener('mouseenter', () => {
            if (video) {
                video.currentTime = 0;
                video.play().catch(() => {});
            }
        });

        card.addEventListener('mouseleave', () => {
            if (video) {
                video.pause();
                video.currentTime = 0;
            }
        });
    });

    // Open modal
    function openModal(card) {
        const src = card.dataset.src;
        const title = card.dataset.title;
        const description = card.dataset.description;

        modalVideo.querySelector('source').src = src;
        modalVideo.load();
        modalTitle.textContent = title;
        modalDescription.textContent = description;

        videoModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Auto-play video after modal opens
        setTimeout(() => {
            modalVideo.play().catch(() => {});
        }, 400);
    }

    // Close modal
    function closeModal() {
        modalVideo.pause();
        modalVideo.currentTime = 0;
        videoModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Event listeners
    videoCards.forEach(card => {
        card.addEventListener('click', () => openModal(card));
    });

    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', closeModal);
    }

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && videoModal.classList.contains('active')) {
            closeModal();
        }
    });

    // Scroll reveal for video cards
    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                videoObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    videoCards.forEach(card => videoObserver.observe(card));

    console.log('Video gallery initialized');
})();

// =========================================
// Page Views Counter with Persistent Backend
// =========================================

(function initPageViewsCounter() {
    const countElement = document.getElementById('pageViewCount');
    const COUNTER_API = 'https://api.counterapi.dev/v1/erwinesener-portfolio/pageviews/up';
    const FALLBACK_COUNT = 1377;

    if (!countElement) return;

    // Animate the counter display
    function animateCount(target) {
        const duration = 1500;
        const startTime = performance.now();
        const startValue = Math.max(0, target - 50);

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(startValue + (target - startValue) * easeProgress);

            countElement.textContent = current.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                countElement.textContent = target.toLocaleString();
            }
        }

        requestAnimationFrame(update);
    }

    // Fetch and increment the counter from the backend
    async function fetchAndIncrementCount() {
        try {
            const response = await fetch(COUNTER_API);
            if (!response.ok) throw new Error('Counter API unavailable');
            const data = await response.json();
            // The API returns { count: number } - add to our base count
            return FALLBACK_COUNT + (data.count || 0);
        } catch (error) {
            console.warn('Counter API error, using fallback:', error);
            // Fallback to localStorage if API fails
            const localCount = localStorage.getItem('erwinesener_page_views');
            if (localCount) {
                const count = parseInt(localCount, 10) + 1;
                localStorage.setItem('erwinesener_page_views', count.toString());
                return count;
            }
            return FALLBACK_COUNT;
        }
    }

    // Start animation when element is in view
    let hasAnimated = false;
    let currentCount = FALLBACK_COUNT;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !hasAnimated) {
                hasAnimated = true;
                animateCount(currentCount);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    // Fetch count from backend and update
    fetchAndIncrementCount().then(count => {
        currentCount = count;
        // If already in view, animate now
        const rect = countElement.getBoundingClientRect();
        const inView = rect.top < window.innerHeight && rect.bottom > 0;
        if (inView && !hasAnimated) {
            hasAnimated = true;
            animateCount(currentCount);
        } else if (!hasAnimated) {
            observer.observe(countElement);
        } else {
            // Already animated with fallback, update to real count
            countElement.textContent = currentCount.toLocaleString();
        }
        console.log('Page views counter initialized:', currentCount);
    });

    // Show fallback immediately, will be updated when API responds
    observer.observe(countElement);
})();
