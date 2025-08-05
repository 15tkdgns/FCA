/**
 * Common Utilities
 * ================
 * 
 * Shared utility functions to reduce code duplication
 * and improve maintainability.
 */

class CommonUtils {
    /**
     * Enhanced logging with consistent formatting
     */
    static log = {
        info: (message, module = '') => {
            const prefix = module ? `[${module}]` : '';
            console.log(`✅ ${prefix} ${message}`);
        },
        
        error: (message, error = null, module = '') => {
            const prefix = module ? `[${module}]` : '';
            console.error(`❌ ${prefix} ${message}`, error || '');
        },
        
        warn: (message, module = '') => {
            const prefix = module ? `[${module}]` : '';
            console.warn(`⚠️ ${prefix} ${message}`);
        },
        
        debug: (message, module = '') => {
            const prefix = module ? `[${module}]` : '';
            console.log(`🔧 ${prefix} ${message}`);
        },
        
        progress: (step, total, message = '', module = '') => {
            const prefix = module ? `[${module}]` : '';
            const percent = Math.round((step / total) * 100);
            console.log(`📊 ${prefix} ${message} (${step}/${total} - ${percent}%)`);
        }
    };

    /**
     * Promise utilities with timeout
     */
    static async withTimeout(promise, timeoutMs, errorMessage = 'Operation timeout') {
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
        );
        
        return Promise.race([promise, timeoutPromise]);
    }

    /**
     * Safe DOM element operations
     */
    static dom = {
        getElementById: (id, required = false) => {
            const element = document.getElementById(id);
            if (required && !element) {
                throw new Error(`Required element with id '${id}' not found`);
            }
            return element;
        },
        
        show: (elementOrId) => {
            const element = typeof elementOrId === 'string' 
                ? document.getElementById(elementOrId) 
                : elementOrId;
            if (element) element.style.display = 'block';
        },
        
        hide: (elementOrId) => {
            const element = typeof elementOrId === 'string' 
                ? document.getElementById(elementOrId) 
                : elementOrId;
            if (element) element.style.display = 'none';
        },
        
        updateText: (elementOrId, text) => {
            const element = typeof elementOrId === 'string' 
                ? document.getElementById(elementOrId) 
                : elementOrId;
            if (element) element.textContent = text;
        },
        
        updateHTML: (elementOrId, html) => {
            const element = typeof elementOrId === 'string' 
                ? document.getElementById(elementOrId) 
                : elementOrId;
            if (element) element.innerHTML = html;
        }
    };

    /**
     * Loading state management
     */
    static loading = {
        show: (message = 'Loading...', elementId = 'loading-indicator') => {
            const element = document.getElementById(elementId);
            if (element) {
                element.style.display = 'block';
                const statusEl = element.querySelector('[id$="status"]');
                if (statusEl) statusEl.textContent = message;
            }
        },
        
        hide: (elementId = 'loading-indicator') => {
            CommonUtils.dom.hide(elementId);
        },
        
        updateStatus: (message, elementId = 'loading-status') => {
            CommonUtils.dom.updateText(elementId, message);
        },
        
        updateProgress: (percent, elementId = 'loading-progress') => {
            const element = document.getElementById(elementId);
            if (element) {
                element.style.width = `${Math.max(0, Math.min(100, percent))}%`;
            }
        }
    };

    /**
     * Error handling utilities
     */
    static error = {
        show: (message, containerId = 'error-container') => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="alert alert-danger" role="alert">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>Error:</strong> ${message}
                        <button type="button" class="btn-close float-end" 
                                onclick="this.closest('.alert').remove()"></button>
                    </div>
                `;
                container.style.display = 'block';
            }
        },
        
        clear: (containerId = 'error-container') => {
            CommonUtils.dom.updateHTML(containerId, '');
            CommonUtils.dom.hide(containerId);
        }
    };

    /**
     * Chart utilities
     */
    static chart = {
        getDefaultConfig: () => ({
            displayModeBar: false,
            responsive: true,
            locale: 'en'
        }),
        
        getDefaultColors: () => [
            '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b',
            '#858796', '#5a5c69', '#6f42c1', '#e83e8c', '#fd7e14'
        ],
        
        getDefaultLayout: (title = '') => ({
            title: {
                text: title,
                x: 0.5,
                font: { size: 16, color: '#5a5c69' }
            },
            margin: { t: 60, r: 30, b: 60, l: 60 },
            font: { family: "'Nunito', sans-serif", size: 12 }
        }),
        
        showLoadingState: (containerId) => {
            const container = document.getElementById(containerId);
            if (!container) return;

            container.innerHTML = `
                <div class="d-flex flex-column align-items-center justify-content-center" style="height: 300px;">
                    <div class="spinner-border text-primary mb-3" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <div class="text-muted">Loading chart...</div>
                </div>
            `;
        },
        
        showErrorState: (containerId, error) => {
            const container = document.getElementById(containerId);
            if (!container) return;

            container.innerHTML = `
                <div class="d-flex flex-column align-items-center justify-content-center text-center p-4" style="height: 300px;">
                    <i class="fas fa-exclamation-triangle text-warning fa-3x mb-3"></i>
                    <div class="text-muted">
                        <strong>Chart Load Failed</strong><br>
                        ${error.message}
                    </div>
                    <button class="btn btn-outline-primary btn-sm mt-3" onclick="location.reload()">
                        <i class="fas fa-redo me-1"></i> Refresh Page
                    </button>
                </div>
            `;
        }
    };

    /**
     * Data loading utilities
     */
    static data = {
        async fetchJSON(url, timeout = 5000) {
            try {
                const response = await CommonUtils.withTimeout(
                    fetch(url), 
                    timeout, 
                    `Fetch timeout for ${url}`
                );
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                return await response.json();
            } catch (error) {
                CommonUtils.log.error(`Failed to fetch ${url}`, error, 'DataLoader');
                throw error;
            }
        },
        
        validateRequired(data, requiredFields = []) {
            const missing = requiredFields.filter(field => !(field in data));
            if (missing.length > 0) {
                throw new Error(`Missing required fields: ${missing.join(', ')}`);
            }
            return true;
        }
    };

    /**
     * Utility delay function
     */
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Debounce function for performance
     */
    static debounce(func, wait) {
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

    /**
     * Safe JSON parsing
     */
    static safeJSONParse(str, defaultValue = null) {
        try {
            return JSON.parse(str);
        } catch (error) {
            CommonUtils.log.warn(`JSON parse failed: ${error.message}`, 'Utils');
            return defaultValue;
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CommonUtils;
}

// Global usage
window.CommonUtils = CommonUtils;