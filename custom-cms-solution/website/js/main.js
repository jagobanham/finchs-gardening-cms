/**
 * Finch's Gardening Services - Main JavaScript
 * 
 * This file contains all the interactive functionality for the website:
 * - Mobile navigation menu
 * - Sticky header
 * - Smooth scrolling
 * - Quote request modal
 * - Before/After image slider
 * - FAQ accordion
 * - Form validation
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initMobileMenu();
    initStickyHeader();
    initSmoothScroll();
    initQuoteModal();
    initBeforeAfterSliders();
    initFaqAccordion();
    initFormValidation();
});

/**
 * Mobile Menu Toggle
 */
function initMobileMenu() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const header = document.querySelector('.header');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            header.classList.toggle('mobile-menu-open');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!header.contains(event.target) && header.classList.contains('mobile-menu-open')) {
                header.classList.remove('mobile-menu-open');
            }
        });
    }
}

/**
 * Sticky Header
 */
function initStickyHeader() {
    const header = document.querySelector('.header');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 100) {
            header.classList.add('header--scrolled');
        } else {
            header.classList.remove('header--scrolled');
        }
        
        lastScrollTop = scrollTop;
    });
}

/**
 * Smooth Scrolling for Anchor Links
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                document.querySelector('.header').classList.remove('mobile-menu-open');
            }
        });
    });
}

/**
 * Quote Request Modal
 */
function initQuoteModal() {
    const quoteButtons = document.querySelectorAll('.quote-btn');
    const quoteModal = document.getElementById('quoteModal');
    const closeModalButton = quoteModal ? quoteModal.querySelector('.modal__close') : null;
    
    if (quoteModal && quoteButtons.length > 0) {
        // Open modal when clicking quote buttons
        quoteButtons.forEach(button => {
            button.addEventListener('click', function() {
                openModal(quoteModal);
                
                // If button has data-service attribute, pre-select that service in the dropdown
                const serviceValue = this.getAttribute('data-service');
                if (serviceValue) {
                    const serviceSelect = document.getElementById('service');
                    if (serviceSelect) {
                        serviceSelect.value = serviceValue;
                    }
                }
            });
        });
        
        // Close modal when clicking the close button
        if (closeModalButton) {
            closeModalButton.addEventListener('click', function() {
                closeModal(quoteModal);
            });
        }
        
        // Close modal when clicking outside the modal content
        quoteModal.addEventListener('click', function(event) {
            if (event.target === quoteModal) {
                closeModal(quoteModal);
            }
        });
        
        // Close modal when pressing Escape key
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && quoteModal.classList.contains('active')) {
                closeModal(quoteModal);
            }
        });
        
        // Handle form submission
        const quoteForm = document.getElementById('quoteForm');
        if (quoteForm) {
            quoteForm.addEventListener('submit', function(event) {
                event.preventDefault();
                
                // In a real implementation, you would send the form data to a server
                // For this demo, we'll just show a success message
                quoteForm.innerHTML = '<div class="form-success"><h3>Thank you for your request!</h3><p>We\'ve received your information and will contact you shortly to discuss your gardening needs.</p></div>';
                
                // Close the modal after 3 seconds
                setTimeout(function() {
                    closeModal(quoteModal);
                    // Reset the form after it's hidden
                    setTimeout(function() {
                        quoteForm.reset();
                        quoteForm.innerHTML = quoteForm.originalHTML;
                    }, 300);
                }, 3000);
            });
            
            // Store the original HTML to reset later
            quoteForm.originalHTML = quoteForm.innerHTML;
        }
    }
}

/**
 * Helper function to open a modal
 */
function openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
}

/**
 * Helper function to close a modal
 */
function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
}

/**
 * Before/After Image Slider
 */
function initBeforeAfterSliders() {
    const sliders = document.querySelectorAll('.before-after-slider');
    
    sliders.forEach(slider => {
        const handle = slider.querySelector('.before-after-slider__handle');
        const beforeDiv = slider.querySelector('.before-after-slider__before');
        
        if (!handle || !beforeDiv) return;
        
        let isDragging = false;
        
        // Set initial position (50%)
        updateSliderPosition(slider, 50);
        
        // Mouse events
        handle.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', endDrag);
        
        // Touch events for mobile
        handle.addEventListener('touchstart', startDrag);
        document.addEventListener('touchmove', drag);
        document.addEventListener('touchend', endDrag);
        
        // Click anywhere on the slider to move the handle
        slider.addEventListener('click', function(e) {
            if (e.target !== handle) {
                const sliderRect = slider.getBoundingClientRect();
                const position = ((e.clientX - sliderRect.left) / sliderRect.width) * 100;
                updateSliderPosition(slider, position);
            }
        });
        
        function startDrag(e) {
            e.preventDefault();
            isDragging = true;
        }
        
        function drag(e) {
            if (!isDragging) return;
            
            let clientX;
            if (e.type === 'touchmove') {
                clientX = e.touches[0].clientX;
            } else {
                clientX = e.clientX;
            }
            
            const sliderRect = slider.getBoundingClientRect();
            let position = ((clientX - sliderRect.left) / sliderRect.width) * 100;
            
            // Constrain position between 0% and 100%
            position = Math.max(0, Math.min(100, position));
            
            updateSliderPosition(slider, position);
        }
        
        function endDrag() {
            isDragging = false;
        }
    });
}

/**
 * Helper function to update the before/after slider position
 */
function updateSliderPosition(slider, position) {
    const beforeDiv = slider.querySelector('.before-after-slider__before');
    const handle = slider.querySelector('.before-after-slider__handle');
    
    if (!beforeDiv || !handle) return;
    
    // Update the clip-path to reveal the "before" image
    beforeDiv.style.clipPath = `polygon(0 0, ${position}% 0, ${position}% 100%, 0 100%)`;
    
    // Update the handle position
    handle.style.left = `${position}%`;
}

/**
 * FAQ Accordion
 */
function initFaqAccordion() {
    const faqItems = document.querySelectorAll('.faq__item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq__question');
        
        if (question) {
            question.addEventListener('click', function() {
                // Toggle active class on the clicked item
                item.classList.toggle('active');
                
                // Optional: Close other items when opening one
                faqItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                    }
                });
            });
        }
    });
}

/**
 * Form Validation
 */
function initFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(event) {
            let isValid = true;
            
            // Check required fields
            const requiredFields = form.querySelectorAll('[required]');
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    highlightInvalidField(field);
                } else {
                    removeInvalidHighlight(field);
                }
            });
            
            // Check email format if there's an email field
            const emailFields = form.querySelectorAll('input[type="email"]');
            emailFields.forEach(field => {
                if (field.value.trim() && !isValidEmail(field.value.trim())) {
                    isValid = false;
                    highlightInvalidField(field);
                }
            });
            
            // If the form is not valid, prevent submission
            if (!isValid) {
                event.preventDefault();
            }
        });
    });
}

/**
 * Helper function to highlight invalid form fields
 */
function highlightInvalidField(field) {
    field.classList.add('invalid');
    
    // Add error message if it doesn't exist
    let errorMessage = field.nextElementSibling;
    if (!errorMessage || !errorMessage.classList.contains('error-message')) {
        errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = field.type === 'email' ? 'Please enter a valid email address.' : 'This field is required.';
        field.parentNode.insertBefore(errorMessage, field.nextSibling);
    }
    
    // Remove invalid highlight when user starts typing
    field.addEventListener('input', function() {
        removeInvalidHighlight(field);
    });
}

/**
 * Helper function to remove invalid highlight from form fields
 */
function removeInvalidHighlight(field) {
    field.classList.remove('invalid');
    
    // Remove error message if it exists
    const errorMessage = field.nextElementSibling;
    if (errorMessage && errorMessage.classList.contains('error-message')) {
        errorMessage.parentNode.removeChild(errorMessage);
    }
}

/**
 * Helper function to validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

