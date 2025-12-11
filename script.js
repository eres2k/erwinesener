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
        .contact-card
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
