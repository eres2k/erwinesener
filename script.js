// =========================================
// Navigation & Scroll Behavior
// =========================================

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initScrollAnimations();
    initMobileMenu();
    initSmoothScroll();
    initProjectCards();
});

// Navigation active state on scroll
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
    let lastScroll = 0;
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
        }

        lastScroll = currentScroll;
    });
}

// Mobile Menu Toggle
function initMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            menuToggle.classList.toggle('active');

            // Prevent body scroll when menu is open
            if (navMenu.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });

        // Close menu when clicking nav links
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

// Smooth scrolling for anchor links
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
// Scroll Animations
// =========================================

function initScrollAnimations() {
    const animateElements = document.querySelectorAll('.project-card, .impact-card, .arch-layer');

    const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    });

    animateElements.forEach(element => {
        animationObserver.observe(element);
    });
}

// =========================================
// Project Card Interactions
// =========================================

function initProjectCards() {
    const projectCards = document.querySelectorAll('.project-card');

    projectCards.forEach(card => {
        // Add hover effect to features
        const features = card.querySelectorAll('.feature');
        features.forEach(feature => {
            feature.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-4px)';
            });

            feature.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });

        // Track card interactions
        card.addEventListener('click', function(e) {
            // Don't track if clicking on links
            if (e.target.tagName === 'A') return;

            const projectName = this.getAttribute('data-project');
            console.log(`Project card clicked: ${projectName}`);
        });
    });
}

// =========================================
// Statistics Counter Animation
// =========================================

function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);

        // Ease out function
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(easeOut * (end - start) + start);

        element.textContent = current.toLocaleString();

        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            element.textContent = end.toLocaleString();
        }
    };
    window.requestAnimationFrame(step);
}

// Animate stats when they come into view
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
            const stats = entry.target.querySelectorAll('.stat h3, .impact-card h3');
            stats.forEach(stat => {
                const text = stat.textContent.trim();
                const match = text.match(/(\d+)/);

                if (match) {
                    const number = parseInt(match[1]);
                    stat.textContent = '0';
                    setTimeout(() => {
                        animateValue(stat, 0, number, 2000);
                    }, 200);
                }
            });
            entry.target.dataset.animated = 'true';
        }
    });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
const impactGrid = document.querySelector('.impact-grid');

if (heroStats) statsObserver.observe(heroStats);
if (impactGrid) statsObserver.observe(impactGrid);

// =========================================
// Lazy Loading Images (if any are added)
// =========================================

if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    const lazyImages = document.querySelectorAll('img.lazy');
    lazyImages.forEach(img => imageObserver.observe(img));
}

// =========================================
// Tech Stack Tag Interactions
// =========================================

document.querySelectorAll('.tech-tag').forEach(tag => {
    tag.addEventListener('click', function() {
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 200);
    });
});

// =========================================
// Keyboard Navigation
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
});

// =========================================
// Performance Monitoring
// =========================================

// Log page load performance
window.addEventListener('load', () => {
    if (window.performance && window.performance.timing) {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log(`Page loaded in ${pageLoadTime}ms`);
    }
});

// =========================================
// Scroll Progress Indicator (Optional)
// =========================================

function createScrollProgress() {
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: linear-gradient(90deg, #FF9500, #4F46E5);
        z-index: 9999;
        transition: width 0.1s ease;
    `;
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
        const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = (window.scrollY / windowHeight) * 100;
        progressBar.style.width = scrolled + '%';
    });
}

// Uncomment to enable scroll progress indicator
// createScrollProgress();

// =========================================
// Project Links Handler
// =========================================

function initProjectLinks() {
    // Add repository links
    const projectLinks = {
        'quest': 'https://github.com/eres2k/amzlwhsquest',
        'analytics': 'https://github.com/eres2k/safety-analytics',
        'hub': 'https://github.com/eres2k/safety-hub'
    };

    document.querySelectorAll('.project-card').forEach(card => {
        const projectType = card.getAttribute('data-project');
        const links = card.querySelectorAll('.project-link');

        if (links.length >= 1 && projectLinks[projectType]) {
            links[0].setAttribute('href', projectLinks[projectType]);
            links[0].setAttribute('target', '_blank');
            links[0].setAttribute('rel', 'noopener noreferrer');
            links[0].textContent = 'View on GitHub →';
        }
    });
}

initProjectLinks();

// =========================================
// Analytics & Tracking (Optional)
// =========================================

function trackEvent(category, action, label) {
    // Placeholder for analytics tracking
    console.log('Event:', { category, action, label });

    // Example: Google Analytics
    // if (typeof gtag !== 'undefined') {
    //     gtag('event', action, {
    //         'event_category': category,
    //         'event_label': label
    //     });
    // }
}

// Track external link clicks
document.querySelectorAll('a[target="_blank"]').forEach(link => {
    link.addEventListener('click', function() {
        trackEvent('Outbound Link', 'Click', this.href);
    });
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
        document.body.style.animation = 'rainbow 2s linear infinite';

        setTimeout(() => {
            document.body.style.animation = '';
        }, 5000);
    }
});

// =========================================
// Utility Functions
// =========================================

// Debounce function for performance
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

// Throttle function for scroll events
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

// Export for use in other scripts if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        debounce,
        throttle,
        trackEvent
    };
}
