/**
 * Error Display System
 * =====================
 * 
 * User-friendly error display and management system
 * - Customized messages for various error types
 * - Visual feedback (toast, modal, inline messages)
 * - Error recovery guide provision
 * - Error log management and analysis
 */

class ErrorDisplaySystem {
    constructor() {
        this.errorQueue = [];
        this.maxQueueSize = 5;
        this.toastContainer = this.createToastContainer();
        
        // Error type configuration
        this.errorConfigs = {
            'network': {
                icon: 'fas fa-wifi',
                color: 'danger',
                title: 'Connection Issue',
                suggestions: [
                    'Please check your internet connection',
                    'Please try again later',
                    'Contact administrator if problem persists'
                ]
            },
            'server_error': {
                icon: 'fas fa-server',
                color: 'danger',
                title: 'Server Error',
                suggestions: [
                    'Please try again later',
                    'Try refreshing the page if problem persists',
                    'Contact administrator for urgent issues'
                ]
            },
            'validation': {
                icon: 'fas fa-exclamation-triangle',
                color: 'warning',
                title: 'Input Error',
                suggestions: [
                    'Please recheck the information you entered',
                    'Ensure no required fields are missing',
                    'Please enter in the correct format'
                ]
            },
            'permission': {
                icon: 'fas fa-lock',
                color: 'warning',
                title: 'Insufficient Permission',
                suggestions: [
                    'Please check your login status',
                    'Verify if you have page access permission',
                    'Request permission from administrator'
                ]
            },
            'timeout': {
                icon: 'fas fa-clock',
                color: 'info',
                title: 'Timeout',
                suggestions: [
                    'Please check your network status',
                    'Please try again later',
                    'Large files may take more time to process'
                ]
            },
            'data_error': {
                icon: 'fas fa-database',
                color: 'warning',
                title: 'Data Issue',
                suggestions: [
                    'Try reloading the data',
                    'Try refreshing the page',
                    'Contact administrator if problem persists'
                ]
            }
        };
    }
    
    /**
     * Create toast container
     */
    createToastContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container position-fixed top-0 end-0 p-3';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
        }
        return container;
    }
    
    /**
     * Show error (main function)
     */
    showError(errorInfo, displayType = 'toast') {
        // Queue management
        if (this.errorQueue.length >= this.maxQueueSize) {
            this.errorQueue.shift();
        }
        this.errorQueue.push(errorInfo);
        
        // Determine display method based on error type
        switch (displayType) {
            case 'toast':
                this.showToast(errorInfo);
                break;
            case 'modal':
                this.showModal(errorInfo);
                break;
            case 'inline':
                this.showInlineError(errorInfo);
                break;
            case 'banner':
                this.showBanner(errorInfo);
                break;
            default:
                this.showToast(errorInfo);
        }
        
        // Update error statistics
        this.updateErrorStats(errorInfo);
    }
    
    /**
     * Show toast notification
     */
    showToast(errorInfo) {
        const config = this.getErrorConfig(errorInfo.category);
        const toastId = `toast-${Date.now()}`;
        
        const toastHTML = `
            <div id="${toastId}" class="toast align-items-center text-bg-${config.color} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        <div class="d-flex align-items-center">
                            <i class="${config.icon} me-2"></i>
                            <div>
                                <strong>${config.title}</strong><br>
                                <small>${errorInfo.userMessage || errorInfo.message}</small>
                                ${errorInfo.id ? `<br><small class="opacity-75">Error ID: ${errorInfo.id}</small>` : ''}
                            </div>
                        </div>
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                            data-bs-dismiss="toast"></button>
                </div>
                ${this.shouldShowActions(errorInfo) ? this.generateActionButtons(errorInfo) : ''}
            </div>
        `;
        
        this.toastContainer.insertAdjacentHTML('beforeend', toastHTML);
        
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, {
            autohide: true,
            delay: this.getToastDelay(errorInfo.severity)
        });
        
        toast.show();
        
        // Cleanup after toast removal
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }
    
    /**
     * Show modal error
     */
    showModal(errorInfo) {
        const config = this.getErrorConfig(errorInfo.category);
        const modalId = 'error-modal';
        
        // Remove existing modal
        const existingModal = document.getElementById(modalId);
        if (existingModal) {
            existingModal.remove();
        }
        
        const modalHTML = `
            <div class="modal fade" id="${modalId}" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-${config.color} text-white">
                            <h5 class="modal-title">
                                <i class="${config.icon} me-2"></i>
                                ${config.title}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" 
                                    data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <strong>Issue:</strong><br>
                                ${errorInfo.userMessage || errorInfo.message}
                            </div>
                            
                            <div class="mb-3">
                                <strong>Solution:</strong>
                                <ul class="mt-2">
                                    ${config.suggestions.map(suggestion => 
                                        `<li>${suggestion}</li>`
                                    ).join('')}
                                </ul>
                            </div>
                            
                            ${errorInfo.id ? `
                                <div class="mb-3">
                                    <small class="text-muted">
                                        <strong>Error ID:</strong> ${errorInfo.id}<br>
                                        <strong>Timestamp:</strong> ${errorInfo.timestamp || new Date().toLocaleString()}
                                    </small>
                                </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer">
                            ${this.generateModalActions(errorInfo)}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = new bootstrap.Modal(document.getElementById(modalId));
        modal.show();
        
        // Cleanup after modal close
        document.getElementById(modalId).addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }
    
    /**
     * Show inline error
     */
    showInlineError(errorInfo, targetElement) {
        if (!targetElement) {
            console.warn('Inline error requires target element');
            return this.showToast(errorInfo);
        }
        
        const config = this.getErrorConfig(errorInfo.category);
        const errorId = `inline-error-${Date.now()}`;
        
        // Remove existing inline error
        const existingError = targetElement.querySelector('.inline-error');
        if (existingError) {
            existingError.remove();
        }
        
        const errorHTML = `
            <div id="${errorId}" class="inline-error alert alert-${config.color} alert-dismissible fade show mt-2">
                <div class="d-flex align-items-center">
                    <i class="${config.icon} me-2"></i>
                    <div class="flex-grow-1">
                        <strong>${config.title}:</strong> ${errorInfo.userMessage || errorInfo.message}
                    </div>
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            </div>
        `;
        
        targetElement.insertAdjacentHTML('afterend', errorHTML);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            const errorElement = document.getElementById(errorId);
            if (errorElement) {
                errorElement.remove();
            }
        }, 5000);
    }
    
    /**
     * Show banner error
     */
    showBanner(errorInfo) {
        const config = this.getErrorConfig(errorInfo.category);
        const bannerId = 'error-banner';
        
        // Remove existing banner
        const existingBanner = document.getElementById(bannerId);
        if (existingBanner) {
            existingBanner.remove();
        }
        
        const bannerHTML = `
            <div id="${bannerId}" class="alert alert-${config.color} alert-dismissible mb-0 rounded-0" 
                 style="position: fixed; top: 0; left: 0; right: 0; z-index: 9998;">
                <div class="container-fluid">
                    <div class="d-flex align-items-center">
                        <i class="${config.icon} me-2"></i>
                        <div class="flex-grow-1">
                            <strong>${config.title}:</strong> ${errorInfo.userMessage || errorInfo.message}
                        </div>
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('afterbegin', bannerHTML);
        
        // Add padding to body
        document.body.style.paddingTop = '60px';
        
        // Remove padding when banner is removed
        document.getElementById(bannerId).addEventListener('closed.bs.alert', () => {
            document.body.style.paddingTop = '';
        });
    }
    
    /**
     * Get error configuration
     */
    getErrorConfig(category) {
        return this.errorConfigs[category] || this.errorConfigs['data_error'];
    }
    
    /**
     * Determine toast display time
     */
    getToastDelay(severity) {
        const delays = {
            'low': 3000,
            'medium': 5000,
            'high': 8000,
            'critical': 10000
        };
        return delays[severity] || 5000;
    }
    
    /**
     * Check if action buttons are needed
     */
    shouldShowActions(errorInfo) {
        return errorInfo.category === 'network' || 
               errorInfo.category === 'server_error' ||
               errorInfo.severity === 'critical';
    }
    
    /**
     * Generate action buttons
     */
    generateActionButtons(errorInfo) {
        return `
            <div class="toast-actions mt-2">
                <button class="btn btn-sm btn-outline-light me-2" 
                        onclick="ErrorDisplay.retryAction('${errorInfo.endpoint || ''}')">
                    <i class="fas fa-redo me-1"></i>Retry
                </button>
                <button class="btn btn-sm btn-outline-light" 
                        onclick="ErrorDisplay.showErrorDetails('${errorInfo.id || ''}')">
                    <i class="fas fa-info-circle me-1"></i>Details
                </button>
            </div>
        `;
    }
    
    /**
     * Generate modal action buttons
     */
    generateModalActions(errorInfo) {
        let actions = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                OK
            </button>
        `;
        
        if (this.shouldShowActions(errorInfo)) {
            actions = `
                <button type="button" class="btn btn-primary" 
                        onclick="ErrorDisplay.retryAction('${errorInfo.endpoint || ''}')">
                    <i class="fas fa-redo me-1"></i>Retry
                </button>
                <button type="button" class="btn btn-info" 
                        onclick="ErrorDisplay.reportError('${errorInfo.id || ''}')">
                    <i class="fas fa-bug me-1"></i>Report Error
                </button>
            ` + actions;
        }
        
        return actions;
    }
    
    /**
     * Retry action
     */
    retryAction(endpoint) {
        if (endpoint && window.APIClient) {
            console.log(`🔄 Retrying: ${endpoint}`);
            // Page refresh or specific API recall
            if (endpoint === 'reload') {
                window.location.reload();
            } else {
                // Retry after cache clear
                window.APIClient.clearCache();
                // Endpoint recall logic implemented based on specific situation
            }
        }
    }
    
    /**
     * Show error details
     */
    showErrorDetails(errorId) {
        if (window.APIClient) {
            const errorLog = window.APIClient.getErrorLog();
            const error = errorLog.find(e => e.id === errorId);
            if (error) {
                console.group('🔍 Error Details');
                console.log('Error ID:', error.id);
                console.log('Timestamp:', error.timestamp);
                console.log('Category:', error.category);
                console.log('Severity:', error.severity);
                console.log('Message:', error.message);
                console.groupEnd();
            }
        }
    }
    
    /**
     * Report error
     */
    reportError(errorId) {
        // In production environment, send to error reporting system
        console.log(`📧 Reporting error: ${errorId}`);
        this.showToast({
            category: 'validation',
            message: 'Error has been reported. We will resolve it as soon as possible.',
            severity: 'low'
        });
    }
    
    /**
     * Update error statistics
     */
    updateErrorStats(errorInfo) {
        const stats = JSON.parse(localStorage.getItem('error_display_stats') || '{}');
        
        const today = new Date().toDateString();
        if (!stats[today]) {
            stats[today] = {};
        }
        
        const category = errorInfo.category || 'unknown';
        stats[today][category] = (stats[today][category] || 0) + 1;
        
        // Keep only last 7 days data
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        
        Object.keys(stats).forEach(date => {
            if (new Date(date) < cutoffDate) {
                delete stats[date];
            }
        });
        
        localStorage.setItem('error_display_stats', JSON.stringify(stats));
    }
    
    /**
     * Get error statistics
     */
    getErrorStats() {
        return JSON.parse(localStorage.getItem('error_display_stats') || '{}');
    }
    
    /**
     * Clear all error displays
     */
    clearAllErrors() {
        // Remove toasts
        const toasts = this.toastContainer.querySelectorAll('.toast');
        toasts.forEach(toast => {
            const bsToast = bootstrap.Toast.getInstance(toast);
            if (bsToast) bsToast.hide();
        });
        
        // Remove modal
        const modal = document.getElementById('error-modal');
        if (modal) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) bsModal.hide();
        }
        
        // Remove banner
        const banner = document.getElementById('error-banner');
        if (banner) {
            banner.remove();
            document.body.style.paddingTop = '';
        }
        
        // Remove inline errors
        const inlineErrors = document.querySelectorAll('.inline-error');
        inlineErrors.forEach(error => error.remove());
    }
}

// Create global instance
window.ErrorDisplay = new ErrorDisplaySystem();

// Alternative implementation if Bootstrap 5 is not loaded
if (typeof bootstrap === 'undefined') {
    window.bootstrap = {
        Toast: function(element, options) {
            return {
                show: () => {
                    element.style.display = 'block';
                    element.classList.add('show');
                    setTimeout(() => {
                        element.style.display = 'none';
                        element.classList.remove('show');
                        element.dispatchEvent(new Event('hidden.bs.toast'));
                    }, options?.delay || 5000);
                }
            };
        },
        Modal: function(element) {
            return {
                show: () => {
                    element.style.display = 'block';
                    element.classList.add('show');
                },
                hide: () => {
                    element.style.display = 'none';
                    element.classList.remove('show');
                    element.dispatchEvent(new Event('hidden.bs.modal'));
                }
            };
        }
    };
}

console.log('✅ Error Display System initialized');