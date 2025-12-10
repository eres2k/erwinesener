// =========================================
// Award-Winning Portfolio - Interactive Features
// =========================================

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initScrollAnimations();
    initMobileMenu();
    initSmoothScroll();
    initProjectCards();
    initParallaxEffects();
    createScrollProgress();
});

// =========================================
// Navigation & Scroll Behavior
// =========================================

function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');

    const observerOptions = {
        threshold: 0.3,
        rootMargin: '-100px 0px -50% 0px'
    };

    const observer = new IntersectionObserver((entries) => {
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

    sections.forEach(section => observer.observe(section));

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', throttle(() => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            navbar.style.background = 'rgba(10, 10, 15, 0.95)';
            navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
        } else {
            navbar.style.background = 'rgba(10, 10, 15, 0.8)';
            navbar.style.boxShadow = 'none';
        }

        lastScroll = currentScroll;
    }, 100));
}

// =========================================
// Mobile Menu Toggle
// =========================================

function initMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            menuToggle.classList.toggle('active');

            if (navMenu.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });

        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                menuToggle.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }
}

// =========================================
// Smooth Scrolling
// =========================================

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
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
// Scroll Reveal Animations
// =========================================

function initScrollAnimations() {
    const projectCards = document.querySelectorAll('.project-card');
    const impactCards = document.querySelectorAll('.impact-card');

    const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 150); // Stagger animation
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -100px 0px'
    });

    projectCards.forEach(card => animationObserver.observe(card));
    impactCards.forEach(card => animationObserver.observe(card));
}

// =========================================
// Parallax Effects
// =========================================

function initParallaxEffects() {
    const orbs = document.querySelectorAll('.gradient-orb');
    const particles = document.querySelectorAll('.particle');

    window.addEventListener('scroll', throttle(() => {
        const scrolled = window.pageYOffset;

        orbs.forEach((orb, index) => {
            const speed = 0.5 + (index * 0.2);
            orb.style.transform = `translateY(${scrolled * speed}px)`;
        });

        particles.forEach((particle, index) => {
            const speed = 0.3 + (index * 0.1);
            particle.style.transform = `translateY(${scrolled * speed}px)`;
        });
    }, 10));

    // Mouse move parallax for project icons
    const projectIcons = document.querySelectorAll('.project-icon-large');

    document.addEventListener('mousemove', throttle((e) => {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;

        projectIcons.forEach((icon, index) => {
            const moveX = (mouseX - 0.5) * 20;
            const moveY = (mouseY - 0.5) * 20;

            icon.style.transform = `translate(${moveX}px, ${moveY}px)`;
        });
    }, 50));
}

// =========================================
// Project Card Interactions
// =========================================

function initProjectCards() {
    const projectCards = document.querySelectorAll('.project-card');

    projectCards.forEach(card => {
        // 3D tilt effect on hover
        card.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });

        // Highlight interactions
        const highlights = card.querySelectorAll('.highlight');
        highlights.forEach((highlight, index) => {
            highlight.style.opacity = '0';
            highlight.style.transform = 'translateX(-20px)';

            setTimeout(() => {
                highlight.style.transition = 'all 0.5s ease';
                highlight.style.opacity = '1';
                highlight.style.transform = 'translateX(0)';
            }, index * 100);
        });
    });
}

// =========================================
// Scroll Progress Indicator
// =========================================

function createScrollProgress() {
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: linear-gradient(90deg, #FF6B35, #7C3AED, #10B981);
        z-index: 9999;
        transition: width 0.1s ease;
    `;
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', throttle(() => {
        const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = (window.scrollY / windowHeight) * 100;
        progressBar.style.width = scrolled + '%';
    }, 50));
}

// =========================================
// Statistics Counter Animation
// =========================================

function animateValue(element, start, end, duration, suffix = '') {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);

        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(easeOut * (end - start) + start);

        element.textContent = current + suffix;

        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            element.textContent = end + suffix;
        }
    };
    window.requestAnimationFrame(step);
}

// Animate stats when they come into view
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
            const statNumbers = entry.target.querySelectorAll('.stat-number, .impact-stat');

            statNumbers.forEach((stat, index) => {
                const text = stat.textContent.trim();

                if (text === 'Zero') {
                    stat.textContent = '0';
                    setTimeout(() => {
                        stat.textContent = 'Zero';
                    }, 1000);
                } else {
                    const match = text.match(/(\d+)(%?)/);
                    if (match) {
                        const number = parseInt(match[1]);
                        const suffix = match[2];
                        stat.textContent = '0' + suffix;
                        setTimeout(() => {
                            animateValue(stat, 0, number, 2000, suffix);
                        }, index * 100);
                    }
                }
            });

            entry.target.dataset.animated = 'true';
        }
    });
}, { threshold: 0.3 });

const heroStatsContainer = document.querySelector('.hero-stats-container');
const impactGrid = document.querySelector('.impact-grid');

if (heroStatsContainer) statsObserver.observe(heroStatsContainer);
if (impactGrid) statsObserver.observe(impactGrid);

// =========================================
// Impact Bars Animation
// =========================================

const barsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const bars = entry.target.querySelectorAll('.impact-bar');
            bars.forEach((bar, index) => {
                setTimeout(() => {
                    bar.classList.add('animate');
                }, index * 100);
            });
        }
    });
}, { threshold: 0.5 });

if (impactGrid) barsObserver.observe(impactGrid);

// =========================================
// Tech Badge Interactions
// =========================================

document.querySelectorAll('.tech-badge').forEach(badge => {
    badge.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-3px) scale(1.05)';
    });

    badge.addEventListener('mouseleave', function() {
        this.style.transform = '';
    });
});

// =========================================
// Contact Card Animations
// =========================================

const contactCards = document.querySelectorAll('.contact-card');
contactCards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';

    setTimeout(() => {
        card.style.transition = 'all 0.6s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    }, 1000 + (index * 150));
});

// =========================================
// Keyboard Navigation & Accessibility
// =========================================

document.addEventListener('keydown', (e) => {
    // Press 'Escape' to close mobile menu
    if (e.key === 'Escape') {
        const navMenu = document.querySelector('.nav-menu');
        const menuToggle = document.querySelector('.mobile-menu-toggle');

        if (navMenu && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            menuToggle.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Press '/' to focus search (if implemented)
    if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        // Focus search input if available
    }
});

// =========================================
// Project Link Tracking
// =========================================

document.querySelectorAll('.project-link').forEach(link => {
    link.addEventListener('click', function(e) {
        const projectCard = this.closest('.project-card');
        const projectNum = projectCard?.getAttribute('data-project');
        const linkType = this.classList.contains('primary') ? 'Launch' : 'Demo';

        console.log(`Project ${projectNum} - ${linkType} clicked`);

        // Add ripple effect
        const ripple = document.createElement('span');
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.5);
            width: 20px;
            height: 20px;
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;

        const rect = this.getBoundingClientRect();
        ripple.style.left = (e.clientX - rect.left - 10) + 'px';
        ripple.style.top = (e.clientY - rect.top - 10) + 'px';

        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    });
});

// Add ripple animation
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// =========================================
// Performance Monitoring
// =========================================

window.addEventListener('load', () => {
    if (window.performance && window.performance.timing) {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log(`🚀 Portfolio loaded in ${pageLoadTime}ms`);
    }
});

// =========================================
// Easter Egg: Konami Code
// =========================================

let konamiCode = [];
const konamiPattern = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.key);
    konamiCode = konamiCode.slice(-10);

    if (JSON.stringify(konamiCode) === JSON.stringify(konamiPattern)) {
        console.log('🎮 Konami Code activated! Safety level: MAXIMUM');

        // Create confetti effect
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.textContent = ['⭐', '🎯', '🚀', '✨', '💫'][Math.floor(Math.random() * 5)];
                confetti.style.cssText = `
                    position: fixed;
                    top: -50px;
                    left: ${Math.random() * 100}%;
                    font-size: ${Math.random() * 20 + 20}px;
                    animation: fall ${Math.random() * 3 + 2}s linear;
                    pointer-events: none;
                    z-index: 10000;
                `;
                document.body.appendChild(confetti);

                setTimeout(() => confetti.remove(), 5000);
            }, i * 50);
        }
    }
});

// Add confetti animation
const confettiStyle = document.createElement('style');
confettiStyle.textContent = `
    @keyframes fall {
        to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(confettiStyle);

// =========================================
// Utility Functions
// =========================================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

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
// Cursor Trail Effect (Optional)
// =========================================

function initCursorTrail() {
    const trail = [];
    const trailLength = 20;

    document.addEventListener('mousemove', (e) => {
        trail.push({ x: e.clientX, y: e.clientY, time: Date.now() });

        if (trail.length > trailLength) {
            trail.shift();
        }

        // Draw trail
        trail.forEach((point, index) => {
            const age = Date.now() - point.time;
            if (age < 1000) {
                const dot = document.createElement('div');
                dot.style.cssText = `
                    position: fixed;
                    width: ${6 - (index / trailLength) * 4}px;
                    height: ${6 - (index / trailLength) * 4}px;
                    background: rgba(255, 107, 53, ${1 - (index / trailLength)});
                    border-radius: 50%;
                    pointer-events: none;
                    left: ${point.x}px;
                    top: ${point.y}px;
                    transform: translate(-50%, -50%);
                    z-index: 9998;
                `;
                document.body.appendChild(dot);
                setTimeout(() => dot.remove(), 100);
            }
        });
    });
}

// Uncomment to enable cursor trail
// initCursorTrail();

console.log('✨ Award-winning portfolio initialized successfully!');
