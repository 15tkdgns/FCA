/**
 * FCA Dashboard Application Entry Point
 * =====================================
 * 
 * Main application bootstrap and initialization
 */

import { FCADashboard } from './modules/dashboard-core.js';

class FCAApp {
    constructor() {
        this.dashboard = null;
        this.startTime = Date.now();
        
        console.log('🚀 FCA Dashboard Application starting...');
        this.init();
    }

    async init() {
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initDashboard());
            } else {
                await this.initDashboard();
            }

        } catch (error) {
            this.handleInitError(error);
        }
    }

    async initDashboard() {
        try {
            // Show initial loading
            this.showAppLoading();

            // Check for required dependencies
            await this.checkDependencies();

            // Initialize dashboard
            this.dashboard = new FCADashboard();

            // Wait for dashboard initialization
            await this.waitForDashboardReady();

            // Hide loading and show dashboard
            this.hideAppLoading();
            this.showDashboard();

            // Log startup time
            const loadTime = Date.now() - this.startTime;
            console.log(`✅ FCA Dashboard ready in ${loadTime}ms`);

            // Setup global error handlers
            this.setupGlobalErrorHandlers();

        } catch (error) {
            this.handleInitError(error);
        }
    }

    showAppLoading() {
        const loadingEl = document.getElementById('loading-indicator');
        if (loadingEl) {
            loadingEl.style.display = 'flex';
        }

        // Update loading message
        const messageEl = document.querySelector('.loading-message');
        if (messageEl) {
            messageEl.textContent = 'Initializing FCA Dashboard...';
        }
    }

    hideAppLoading() {
        const loadingEl = document.getElementById('loading-indicator');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }

    showDashboard() {
        const dashboardEl = document.getElementById('dashboard-content');
        if (dashboardEl) {
            dashboardEl.style.display = 'block';
        }

        // Fade in effect
        setTimeout(() => {
            if (dashboardEl) {
                dashboardEl.classList.add('fade-in');
            }
        }, 100);
    }

    async checkDependencies() {
        const dependencies = [
            { name: 'Plotly', check: () => typeof Plotly !== 'undefined' },
            { name: 'Bootstrap', check: () => typeof bootstrap !== 'undefined' }
        ];

        const missing = [];
        
        for (const dep of dependencies) {
            if (!dep.check()) {
                missing.push(dep.name);
            }
        }

        if (missing.length > 0) {
            throw new Error(`Missing dependencies: ${missing.join(', ')}`);
        }

        console.log('✅ All dependencies loaded');
    }

    async waitForDashboardReady() {
        return new Promise((resolve, reject) => {
            const checkReady = () => {
                if (this.dashboard && this.dashboard.initialized) {
                    resolve();
                } else {
                    setTimeout(checkReady, 100);
                }
            };
            
            checkReady();
            
            // Timeout after 30 seconds
            setTimeout(() => {
                reject(new Error('Dashboard initialization timeout'));
            }, 30000);
        });
    }

    setupGlobalErrorHandlers() {
        // Global JavaScript error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.handleRuntimeError(event.error);
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleRuntimeError(event.reason);
        });

        // Plotly error handler
        if (typeof Plotly !== 'undefined') {
            document.addEventListener('plotly_error', (event) => {
                console.error('Plotly error:', event.detail);
                this.handleChartError(event.detail);
            });
        }

        console.log('🛡️ Global error handlers setup');
    }

    handleInitError(error) {
        console.error('❌ FCA Dashboard initialization failed:', error);
        
        this.hideAppLoading();
        this.showErrorScreen(error);
    }

    handleRuntimeError(error) {
        // Don't spam error notifications
        if (this.lastErrorTime && Date.now() - this.lastErrorTime < 5000) {
            return;
        }
        this.lastErrorTime = Date.now();

        console.error('Runtime error:', error);
        
        // Show user-friendly error notification
        if (this.dashboard?.navigation) {
            const errorMessage = error.message || 'An unexpected error occurred';
            // Use UIUtils if available
            if (typeof UIUtils !== 'undefined') {
                UIUtils.showNotification(`Error: ${errorMessage}`, 'error', 10000);
            }
        }
    }

    handleChartError(error) {
        console.error('Chart error:', error);
        
        // Show chart-specific error notification
        if (typeof UIUtils !== 'undefined') {
            UIUtils.showNotification('Chart rendering error occurred', 'warning', 5000);
        }
    }

    showErrorScreen(error) {
        const dashboardEl = document.getElementById('dashboard-content');
        if (dashboardEl) {
            dashboardEl.innerHTML = `
                <div class="error-screen d-flex flex-column align-items-center justify-content-center text-center p-5">
                    <div class="error-icon mb-4">
                        <i class="fas fa-exclamation-triangle text-danger" style="font-size: 4rem;"></i>
                    </div>
                    <h2 class="text-danger mb-3">Dashboard Initialization Failed</h2>
                    <p class="text-muted mb-4 max-width-500">
                        We encountered an error while loading the FCA Dashboard. 
                        Please try refreshing the page or contact support if the problem persists.
                    </p>
                    <div class="error-details mb-4">
                        <details class="text-left">
                            <summary class="btn btn-outline-secondary btn-sm mb-3">Show Technical Details</summary>
                            <pre class="bg-light p-3 rounded text-dark small">${error.message}\n\n${error.stack || ''}</pre>
                        </details>
                    </div>
                    <div class="error-actions">
                        <button class="btn btn-primary me-2" onclick="location.reload()">
                            <i class="fas fa-redo me-1"></i> Reload Page
                        </button>
                        <button class="btn btn-outline-secondary" onclick="this.showAppLoading(); setTimeout(() => location.reload(), 1000)">
                            <i class="fas fa-home me-1"></i> Try Again
                        </button>
                    </div>
                </div>
                
                <style>
                .error-screen { min-height: 60vh; }
                .max-width-500 { max-width: 500px; margin: 0 auto; }
                .error-details pre { max-height: 200px; overflow-y: auto; }
                </style>
            `;
            dashboardEl.style.display = 'block';
        }
    }

    // Expose dashboard instance globally for debugging
    getDashboard() {
        return this.dashboard;
    }

    // Get application state
    getAppState() {
        return {
            startTime: this.startTime,
            loadTime: Date.now() - this.startTime,
            dashboard: this.dashboard?.getState() || null,
            dependencies: {
                plotly: typeof Plotly !== 'undefined',
                bootstrap: typeof bootstrap !== 'undefined'
            }
        };
    }
}

// Initialize application when script loads
const fcaApp = new FCAApp();

// Expose app instance globally for debugging and console access
window.FCAApp = fcaApp;

// Development helpers (only in development mode)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Add development shortcuts
    window.fcaDashboard = () => fcaApp.getDashboard();
    window.fcaState = () => fcaApp.getAppState();
    window.fcaReload = () => location.reload();
    
    console.log(`
    🔧 Development Mode Active
    
    Available console commands:
    • fcaDashboard() - Get dashboard instance
    • fcaState() - Get application state  
    • fcaReload() - Reload application
    `);
}

export default fcaApp;