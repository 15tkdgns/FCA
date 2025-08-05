/**
 * UI Utilities
 * ============
 * 
 * Common UI utility functions for the FCA Dashboard
 */

export class UIUtils {
    /**
     * Show loading spinner
     * @param {string|HTMLElement} container - Container selector or element
     * @param {string} message - Loading message
     */
    static showLoading(container = 'body', message = 'Loading...') {
        const containerEl = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;

        if (!containerEl) return;

        const existingLoader = containerEl.querySelector('.loading-overlay');
        if (existingLoader) return; // Already showing

        const loader = document.createElement('div');
        loader.className = 'loading-overlay';
        loader.innerHTML = `
            <div class="loading-content">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div class="loading-message mt-2">${message}</div>
            </div>
        `;

        containerEl.style.position = 'relative';
        containerEl.appendChild(loader);

        // Trigger fade-in animation
        setTimeout(() => loader.classList.add('visible'), 10);
    }

    /**
     * Hide loading spinner
     * @param {string|HTMLElement} container - Container selector or element
     */
    static hideLoading(container = 'body') {
        const containerEl = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;

        if (!containerEl) return;

        const loader = containerEl.querySelector('.loading-overlay');
        if (loader) {
            loader.classList.remove('visible');
            setTimeout(() => loader.remove(), 300);
        }
    }

    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Type: success, error, warning, info
     * @param {number} duration - Duration in milliseconds
     */
    static showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        notification.innerHTML = `
            <div class="notification-content">
                <i class="${icons[type] || icons.info}"></i>
                <span class="notification-message">${message}</span>
                <button class="notification-close" type="button">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Add close functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => this.removeNotification(notification));

        // Add to container
        let container = document.querySelector('.notification-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'notification-container';
            document.body.appendChild(container);
        }

        container.appendChild(notification);

        // Show animation
        setTimeout(() => notification.classList.add('show'), 10);

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => this.removeNotification(notification), duration);
        }

        return notification;
    }

    /**
     * Remove notification
     * @param {HTMLElement} notification - Notification element
     */
    static removeNotification(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    /**
     * Show error message
     * @param {string} message - Error message
     * @param {HTMLElement} container - Container element
     */
    static showError(message, container = null) {
        const errorEl = document.createElement('div');
        errorEl.className = 'alert alert-danger error-display';
        errorEl.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <div class="error-content flex-grow-1">
                    <strong>Error:</strong> ${message}
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        const targetContainer = container || document.querySelector('#error-display') || document.body;
        targetContainer.appendChild(errorEl);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (errorEl.parentNode) {
                errorEl.remove();
            }
        }, 10000);

        console.error('UI Error:', message);
        return errorEl;
    }

    /**
     * Format numbers with proper separators
     * @param {number} num - Number to format
     * @param {object} options - Formatting options
     */
    static formatNumber(num, options = {}) {
        const defaults = {
            locale: 'en-US',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        };

        const config = { ...defaults, ...options };
        
        if (num === null || num === undefined || isNaN(num)) {
            return 'N/A';
        }

        return num.toLocaleString(config.locale, {
            minimumFractionDigits: config.minimumFractionDigits,
            maximumFractionDigits: config.maximumFractionDigits
        });
    }

    /**
     * Format percentage
     * @param {number} value - Value between 0 and 1
     * @param {number} decimals - Number of decimal places
     */
    static formatPercentage(value, decimals = 1) {
        if (value === null || value === undefined || isNaN(value)) {
            return 'N/A';
        }
        
        return (value * 100).toFixed(decimals) + '%';
    }

    /**
     * Format file size
     * @param {number} bytes - Size in bytes
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        if (!bytes) return 'N/A';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Debounce function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Delay in milliseconds
     * @param {boolean} immediate - Execute immediately
     */
    static debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    /**
     * Throttle function calls
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     */
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Smooth scroll to element
     * @param {string|HTMLElement} target - Target selector or element
     * @param {number} offset - Offset from top
     */
    static scrollToElement(target, offset = 0) {
        const element = typeof target === 'string' 
            ? document.querySelector(target) 
            : target;

        if (!element) return;

        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     */
    static async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                textArea.remove();
            }
            this.showNotification('Copied to clipboard', 'success', 2000);
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            this.showNotification('Failed to copy to clipboard', 'error');
            return false;
        }
    }

    /**
     * Generate unique ID
     * @param {string} prefix - ID prefix
     */
    static generateId(prefix = 'id') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Check if element is in viewport
     * @param {HTMLElement} element - Element to check
     * @param {number} threshold - Threshold percentage (0-1)
     */
    static isInViewport(element, threshold = 0) {
        const rect = element.getBoundingClientRect();
        const height = window.innerHeight || document.documentElement.clientHeight;
        const width = window.innerWidth || document.documentElement.clientWidth;

        return (
            rect.top >= -threshold * height &&
            rect.left >= -threshold * width &&
            rect.bottom <= height + threshold * height &&
            rect.right <= width + threshold * width
        );
    }

    /**
     * Add CSS class with animation
     * @param {HTMLElement} element - Target element
     * @param {string} className - CSS class to add
     * @param {number} delay - Animation delay
     */
    static addClassWithAnimation(element, className, delay = 0) {
        setTimeout(() => {
            element.classList.add(className);
        }, delay);
    }

    /**
     * Remove CSS class with animation
     * @param {HTMLElement} element - Target element
     * @param {string} className - CSS class to remove
     * @param {number} delay - Animation delay
     */
    static removeClassWithAnimation(element, className, delay = 300) {
        element.classList.add('animating-out');
        setTimeout(() => {
            element.classList.remove(className, 'animating-out');
        }, delay);
    }

    /**
     * Create loading skeleton
     * @param {number} lines - Number of skeleton lines
     * @param {object} options - Skeleton options
     */
    static createSkeleton(lines = 3, options = {}) {
        const { width = '100%', height = '20px', margin = '10px 0' } = options;
        
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-container';
        
        for (let i = 0; i < lines; i++) {
            const line = document.createElement('div');
            line.className = 'skeleton-line';
            line.style.width = Array.isArray(width) ? width[i] || '100%' : width;
            line.style.height = height;
            line.style.margin = margin;
            skeleton.appendChild(line);
        }
        
        return skeleton;
    }
}