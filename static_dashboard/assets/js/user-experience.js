/**
 * User Experience Enhancements
 * Advanced features for better user interaction and accessibility
 */

class UserExperienceEnhancer {
    constructor() {
        this.initialized = false;
        this.init();
    }
    
    init() {
        this.initialized = true;
        console.log('🎯 UserExperienceEnhancer initialized');
        
        // Setup enhanced navigation
        this.setupEnhancedNavigation();
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Setup accessibility features
        this.setupAccessibility();
        
        // Setup tooltips and help system
        this.setupTooltips();
        
        // Setup performance monitoring
        this.setupPerformanceMonitoring();
        
        // Setup error recovery
        this.setupErrorRecovery();
    }
    
    /**
     * Enhanced navigation with smooth transitions
     */
    setupEnhancedNavigation() {
        document.addEventListener('click', (event) => {
            const navLink = event.target.closest('[data-page]');
            if (navLink) {
                event.preventDefault();
                this.navigateWithTransition(navLink.dataset.page);
            }
        });
    }
    
    /**
     * Navigate with smooth transition effects
     */
    async navigateWithTransition(pageId) {
        const currentPage = document.querySelector('.page-content.active');
        const targetPage = document.getElementById(`${pageId}-page`);
        
        if (!targetPage || targetPage === currentPage) return;
        
        // Add loading indicator
        this.showNavigationLoading();
        
        try {
            // Fade out current page
            if (currentPage) {
                currentPage.style.transition = 'opacity 0.3s ease-out';
                currentPage.style.opacity = '0';
                await new Promise(resolve => setTimeout(resolve, 300));
                currentPage.classList.remove('active');
                currentPage.style.display = 'none';
            }
            
            // Show target page with fade in
            targetPage.style.display = 'block';
            targetPage.style.opacity = '0';
            targetPage.classList.add('active');
            
            // Trigger any page-specific loading
            this.triggerPageLoad(pageId);
            
            // Fade in new page
            setTimeout(() => {
                targetPage.style.transition = 'opacity 0.3s ease-in';
                targetPage.style.opacity = '1';
            }, 50);
            
            // Update navigation state
            this.updateNavigationState(pageId);
            
            // Update URL without refresh
            history.pushState({ page: pageId }, '', `#${pageId}`);
            
        } catch (error) {
            console.error('❌ Navigation error:', error);
            this.showNavigationError();
        } finally {
            this.hideNavigationLoading();
        }
    }
    
    /**
     * Show navigation loading indicator
     */
    showNavigationLoading() {
        const indicator = document.createElement('div');
        indicator.id = 'nav-loading';
        indicator.innerHTML = `
            <div class="loading-overlay">
                <div class="loading-spinner">
                    <div class="chart-loading-spinner"></div>
                    <div class="loading-text">Loading page...</div>
                </div>
            </div>
        `;
        document.body.appendChild(indicator);
    }
    
    /**
     * Hide navigation loading indicator
     */
    hideNavigationLoading() {
        const indicator = document.getElementById('nav-loading');
        if (indicator) {
            indicator.remove();
        }
    }
    
    /**
     * Trigger page-specific loading
     */
    triggerPageLoad(pageId) {
        // Trigger chart rendering for specific pages
        if (pageId === 'dashboard' && window.FCADashboard) {
            setTimeout(() => {
                window.FCADashboard.renderDashboardCharts();
            }, 100);
        }
        
        // Page-specific initialization
        const pageInitFunctions = {
            'fraud': () => this.initializeFraudPage(),
            'sentiment': () => this.initializeSentimentPage(),
            'attrition': () => this.initializeAttritionPage(),
            'datasets': () => this.initializeDatasetsPage()
        };
        
        if (pageInitFunctions[pageId]) {
            pageInitFunctions[pageId]();
        }
    }
    
    /**
     * Update navigation state
     */
    updateNavigationState(activePageId) {
        // Update navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === activePageId) {
                link.classList.add('active');
            }
        });
        
        // Update page title
        const pageTitles = {
            'dashboard': 'Overview - FCA Analytics',
            'fraud': 'Fraud Detection - FCA Analytics',
            'sentiment': 'Sentiment Analysis - FCA Analytics',
            'attrition': 'Customer Attrition - FCA Analytics',
            'datasets': 'Datasets - FCA Analytics'
        };
        
        document.title = pageTitles[activePageId] || 'FCA Analytics';
        
        // Update page title text
        const titleElement = document.getElementById('page-title-text');
        if (titleElement) {
            const pageNames = {
                'dashboard': 'Dashboard Overview',
                'fraud': 'Fraud Detection Analysis',
                'sentiment': 'Sentiment Analysis',
                'attrition': 'Customer Attrition Prediction',
                'datasets': 'Dataset Management'
            };
            titleElement.textContent = pageNames[activePageId] || 'Analytics';
        }
    }
    
    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Alt + number keys for navigation\n            if (event.altKey && !event.ctrlKey && !event.shiftKey) {\n                const shortcuts = {\n                    '1': 'dashboard',\n                    '2': 'fraud',\n                    '3': 'sentiment',\n                    '4': 'attrition',\n                    '5': 'datasets'\n                };\n                \n                if (shortcuts[event.key]) {\n                    event.preventDefault();\n                    this.navigateWithTransition(shortcuts[event.key]);\n                    this.showShortcutFeedback(`Navigated to ${shortcuts[event.key]}`);\n                }\n            }\n            \n            // Ctrl + R for refresh charts\n            if (event.ctrlKey && event.key === 'r') {\n                event.preventDefault();\n                this.refreshCurrentPageCharts();\n                this.showShortcutFeedback('Charts refreshed');\n            }\n            \n            // Ctrl + D for toggle dark mode\n            if (event.ctrlKey && event.key === 'd') {\n                event.preventDefault();\n                this.toggleTheme();\n            }\n            \n            // F1 for help\n            if (event.key === 'F1') {\n                event.preventDefault();\n                this.showHelpModal();\n            }\n        });\n    }\n    \n    /**\n     * Show keyboard shortcut feedback\n     */\n    showShortcutFeedback(message) {\n        const feedback = document.createElement('div');\n        feedback.className = 'shortcut-feedback';\n        feedback.textContent = message;\n        feedback.style.cssText = `\n            position: fixed;\n            top: 20px;\n            right: 20px;\n            background: var(--primary-color);\n            color: white;\n            padding: 0.75rem 1.5rem;\n            border-radius: 0.5rem;\n            box-shadow: 0 4px 12px rgba(0,0,0,0.15);\n            z-index: 9999;\n            font-weight: 600;\n            animation: slideIn 0.3s ease-out;\n        `;\n        \n        document.body.appendChild(feedback);\n        \n        setTimeout(() => {\n            feedback.style.animation = 'slideOut 0.3s ease-in forwards';\n            setTimeout(() => feedback.remove(), 300);\n        }, 2000);\n    }\n    \n    /**\n     * Refresh charts on current page\n     */\n    refreshCurrentPageCharts() {\n        const activePage = document.querySelector('.page-content.active');\n        if (!activePage) return;\n        \n        const charts = activePage.querySelectorAll('[id$=\"-chart\"]');\n        charts.forEach(chart => {\n            if (chart.id && window.chartManager) {\n                window.chartManager.recoverChart(chart.id);\n            }\n        });\n    }\n    \n    /**\n     * Toggle theme\n     */\n    toggleTheme() {\n        const currentTheme = document.documentElement.getAttribute('data-theme');\n        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';\n        document.documentElement.setAttribute('data-theme', newTheme);\n        localStorage.setItem('theme', newTheme);\n        this.showShortcutFeedback(`Switched to ${newTheme} theme`);\n    }\n    \n    /**\n     * Setup accessibility features\n     */\n    setupAccessibility() {\n        // Focus management\n        this.setupFocusManagement();\n        \n        // Screen reader announcements\n        this.setupScreenReaderAnnouncements();\n        \n        // High contrast mode detection\n        this.setupHighContrastMode();\n        \n        // Reduced motion support\n        this.setupReducedMotion();\n    }\n    \n    /**\n     * Setup focus management\n     */\n    setupFocusManagement() {\n        // Skip link for keyboard navigation\n        const skipLink = document.createElement('a');\n        skipLink.href = '#main-content';\n        skipLink.textContent = 'Skip to main content';\n        skipLink.className = 'skip-link';\n        skipLink.style.cssText = `\n            position: absolute;\n            top: -40px;\n            left: 6px;\n            background: var(--primary-color);\n            color: white;\n            padding: 8px;\n            text-decoration: none;\n            border-radius: 4px;\n            z-index: 10000;\n            transition: top 0.2s;\n        `;\n        \n        skipLink.addEventListener('focus', () => {\n            skipLink.style.top = '6px';\n        });\n        \n        skipLink.addEventListener('blur', () => {\n            skipLink.style.top = '-40px';\n        });\n        \n        document.body.insertBefore(skipLink, document.body.firstChild);\n        \n        // Focus trap for modals\n        this.setupModalFocusTrap();\n    }\n    \n    /**\n     * Setup screen reader announcements\n     */\n    setupScreenReaderAnnouncements() {\n        // Create live region for announcements\n        const liveRegion = document.createElement('div');\n        liveRegion.id = 'live-region';\n        liveRegion.setAttribute('aria-live', 'polite');\n        liveRegion.setAttribute('aria-atomic', 'true');\n        liveRegion.style.cssText = `\n            position: absolute;\n            left: -10000px;\n            width: 1px;\n            height: 1px;\n            overflow: hidden;\n        `;\n        document.body.appendChild(liveRegion);\n        \n        // Announce page changes\n        this.announcePageChanges();\n        \n        // Announce chart loading states\n        this.announceChartStates();\n    }\n    \n    /**\n     * Announce page changes to screen readers\n     */\n    announcePageChanges() {\n        const observer = new MutationObserver((mutations) => {\n            mutations.forEach((mutation) => {\n                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {\n                    const target = mutation.target;\n                    if (target.classList.contains('active') && target.classList.contains('page-content')) {\n                        const pageTitle = target.querySelector('h1, h2, [data-page-title]')?.textContent;\n                        this.announce(`Navigated to ${pageTitle || 'page'}`);\n                    }\n                }\n            });\n        });\n        \n        document.querySelectorAll('.page-content').forEach(page => {\n            observer.observe(page, { attributes: true });\n        });\n    }\n    \n    /**\n     * Announce message to screen readers\n     */\n    announce(message) {\n        const liveRegion = document.getElementById('live-region');\n        if (liveRegion) {\n            liveRegion.textContent = message;\n        }\n    }\n    \n    /**\n     * Setup tooltips and help system\n     */\n    setupTooltips() {\n        // Enhanced tooltips for chart elements\n        this.setupChartTooltips();\n        \n        // Help tooltips for UI elements\n        this.setupUITooltips();\n        \n        // Context-sensitive help\n        this.setupContextualHelp();\n    }\n    \n    /**\n     * Setup chart-specific tooltips\n     */\n    setupChartTooltips() {\n        // Add helpful tooltips to chart containers\n        document.querySelectorAll('.chart-container').forEach(container => {\n            container.setAttribute('title', 'Interactive chart - click and drag to zoom, hover for details');\n            container.setAttribute('data-bs-toggle', 'tooltip');\n            container.setAttribute('data-bs-placement', 'top');\n        });\n        \n        // Initialize Bootstrap tooltips\n        if (window.bootstrap) {\n            new bootstrap.Tooltip(document.body, {\n                selector: '[data-bs-toggle=\"tooltip\"]'\n            });\n        }\n    }\n    \n    /**\n     * Setup performance monitoring\n     */\n    setupPerformanceMonitoring() {\n        // Monitor page load performance\n        this.monitorPagePerformance();\n        \n        // Monitor chart rendering performance\n        this.monitorChartPerformance();\n        \n        // Monitor user interactions\n        this.monitorUserInteractions();\n    }\n    \n    /**\n     * Monitor page performance\n     */\n    monitorPagePerformance() {\n        if ('performance' in window) {\n            window.addEventListener('load', () => {\n                setTimeout(() => {\n                    const perfData = performance.getEntriesByType('navigation')[0];\n                    if (perfData) {\n                        const loadTime = perfData.loadEventEnd - perfData.loadEventStart;\n                        if (loadTime > 3000) {\n                            console.warn(`⚠️ Slow page load detected: ${loadTime}ms`);\n                            this.showPerformanceWarning('Page loaded slowly. Consider refreshing.');\n                        }\n                    }\n                }, 1000);\n            });\n        }\n    }\n    \n    /**\n     * Show performance warning\n     */\n    showPerformanceWarning(message) {\n        const warning = document.createElement('div');\n        warning.className = 'performance-warning';\n        warning.innerHTML = `\n            <div class=\"alert alert-warning alert-dismissible fade show\" role=\"alert\">\n                <i class=\"fas fa-exclamation-triangle\"></i>\n                ${message}\n                <button type=\"button\" class=\"btn-close\" data-bs-dismiss=\"alert\"></button>\n            </div>\n        `;\n        warning.style.cssText = `\n            position: fixed;\n            top: 70px;\n            right: 20px;\n            z-index: 9999;\n            max-width: 300px;\n        `;\n        \n        document.body.appendChild(warning);\n        \n        setTimeout(() => {\n            warning.remove();\n        }, 10000);\n    }\n    \n    /**\n     * Setup error recovery\n     */\n    setupErrorRecovery() {\n        // Global error handler\n        window.addEventListener('error', (event) => {\n            console.error('💥 Global error:', event.error);\n            this.handleGlobalError(event.error);\n        });\n        \n        // Unhandled promise rejection handler\n        window.addEventListener('unhandledrejection', (event) => {\n            console.error('💥 Unhandled promise rejection:', event.reason);\n            this.handlePromiseRejection(event.reason);\n        });\n    }\n    \n    /**\n     * Handle global errors gracefully\n     */\n    handleGlobalError(error) {\n        // Show user-friendly error message\n        this.showErrorRecoveryDialog(error.message);\n        \n        // Try to recover charts if error is chart-related\n        if (error.message.includes('chart') || error.message.includes('Plotly')) {\n            this.attemptChartRecovery();\n        }\n    }\n    \n    /**\n     * Show error recovery dialog\n     */\n    showErrorRecoveryDialog(errorMessage) {\n        const dialog = document.createElement('div');\n        dialog.className = 'error-recovery-dialog';\n        dialog.innerHTML = `\n            <div class=\"modal fade show\" style=\"display: block; background: rgba(0,0,0,0.5);\">\n                <div class=\"modal-dialog\">\n                    <div class=\"modal-content\">\n                        <div class=\"modal-header\">\n                            <h5 class=\"modal-title\">⚠️ Something went wrong</h5>\n                        </div>\n                        <div class=\"modal-body\">\n                            <p>We encountered an issue, but don't worry - we're trying to fix it automatically.</p>\n                            <div class=\"error-actions\">\n                                <button class=\"btn btn-primary\" onclick=\"location.reload()\">Refresh Page</button>\n                                <button class=\"btn btn-secondary\" onclick=\"this.closest('.error-recovery-dialog').remove()\">Continue</button>\n                            </div>\n                        </div>\n                    </div>\n                </div>\n            </div>\n        `;\n        \n        document.body.appendChild(dialog);\n        \n        // Auto-remove after 10 seconds\n        setTimeout(() => {\n            dialog.remove();\n        }, 10000);\n    }\n    \n    /**\n     * Attempt to recover charts after error\n     */\n    attemptChartRecovery() {\n        console.log('🔧 Attempting chart recovery after error...');\n        \n        if (window.chartMonitor && window.chartMonitor.recoverAllFailedCharts) {\n            window.chartMonitor.recoverAllFailedCharts();\n        }\n        \n        if (window.chartManager) {\n            const charts = document.querySelectorAll('[id$=\"-chart\"]');\n            charts.forEach(chart => {\n                if (chart.id) {\n                    setTimeout(() => {\n                        window.chartManager.recoverChart(chart.id);\n                    }, 1000);\n                }\n            });\n        }\n    }\n    \n    /**\n     * Show help modal\n     */\n    showHelpModal() {\n        const helpModal = document.createElement('div');\n        helpModal.innerHTML = `\n            <div class=\"modal fade show\" style=\"display: block; background: rgba(0,0,0,0.5);\">\n                <div class=\"modal-dialog modal-lg\">\n                    <div class=\"modal-content\">\n                        <div class=\"modal-header\">\n                            <h5 class=\"modal-title\">🎯 FCA Analytics Help</h5>\n                            <button type=\"button\" class=\"btn-close\" onclick=\"this.closest('.modal').parentNode.remove()\"></button>\n                        </div>\n                        <div class=\"modal-body\">\n                            <div class=\"help-content\">\n                                <h6>Keyboard Shortcuts</h6>\n                                <ul>\n                                    <li><kbd>Alt + 1-5</kbd> - Navigate between pages</li>\n                                    <li><kbd>Ctrl + R</kbd> - Refresh charts</li>\n                                    <li><kbd>Ctrl + D</kbd> - Toggle dark mode</li>\n                                    <li><kbd>F1</kbd> - Show this help</li>\n                                </ul>\n                                \n                                <h6>Chart Interactions</h6>\n                                <ul>\n                                    <li>Click and drag to zoom</li>\n                                    <li>Double-click to reset zoom</li>\n                                    <li>Hover for detailed information</li>\n                                    <li>Click legend items to toggle visibility</li>\n                                </ul>\n                                \n                                <h6>Navigation</h6>\n                                <ul>\n                                    <li>Use the sidebar to navigate between analysis types</li>\n                                    <li>Each page loads relevant charts and data</li>\n                                    <li>Charts load automatically with fallback images</li>\n                                </ul>\n                            </div>\n                        </div>\n                        <div class=\"modal-footer\">\n                            <button type=\"button\" class=\"btn btn-primary\" onclick=\"this.closest('.modal').parentNode.remove()\">Got it!</button>\n                        </div>\n                    </div>\n                </div>\n            </div>\n        `;\n        \n        document.body.appendChild(helpModal);\n    }\n    \n    // Page-specific initialization methods\n    initializeFraudPage() {\n        console.log('🔍 Initializing fraud detection page');\n        // Add fraud-specific enhancements\n    }\n    \n    initializeSentimentPage() {\n        console.log('💭 Initializing sentiment analysis page');\n        // Add sentiment-specific enhancements\n    }\n    \n    initializeAttritionPage() {\n        console.log('👥 Initializing customer attrition page');\n        // Add attrition-specific enhancements\n    }\n    \n    initializeDatasetsPage() {\n        console.log('📊 Initializing datasets page');\n        // Add dataset-specific enhancements\n    }\n}\n\n// CSS for animations and effects\nconst uxCSS = `\n<style>\n@keyframes slideIn {\n    from {\n        transform: translateX(100%);\n        opacity: 0;\n    }\n    to {\n        transform: translateX(0);\n        opacity: 1;\n    }\n}\n\n@keyframes slideOut {\n    from {\n        transform: translateX(0);\n        opacity: 1;\n    }\n    to {\n        transform: translateX(100%);\n        opacity: 0;\n    }\n}\n\n.loading-overlay {\n    position: fixed;\n    top: 0;\n    left: 0;\n    right: 0;\n    bottom: 0;\n    background: rgba(255, 255, 255, 0.9);\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    z-index: 9999;\n}\n\n.loading-spinner {\n    text-align: center;\n}\n\n.loading-text {\n    margin-top: 1rem;\n    color: var(--gray-600);\n    font-weight: 600;\n}\n\n.skip-link:focus {\n    outline: 2px solid var(--primary-color);\n    outline-offset: 2px;\n}\n\n.error-actions {\n    margin-top: 1rem;\n    display: flex;\n    gap: 0.5rem;\n}\n\n.help-content h6 {\n    color: var(--primary-color);\n    margin-top: 1.5rem;\n    margin-bottom: 0.5rem;\n}\n\n.help-content ul {\n    margin-bottom: 1rem;\n}\n\n.help-content kbd {\n    background: var(--gray-200);\n    border: 1px solid var(--gray-300);\n    border-radius: 3px;\n    padding: 2px 4px;\n    font-size: 0.85em;\n}\n\n/* Reduced motion support */\n@media (prefers-reduced-motion: reduce) {\n    * {\n        animation-duration: 0.01ms !important;\n        animation-iteration-count: 1 !important;\n        transition-duration: 0.01ms !important;\n    }\n}\n\n/* High contrast mode support */\n@media (prefers-contrast: high) {\n    .chart-container {\n        border: 2px solid;\n    }\n    \n    .chart-container::before {\n        height: 6px;\n    }\n}\n</style>\n`;\n\n// Inject UX CSS\ndocument.head.insertAdjacentHTML('beforeend', uxCSS);\n\n// Make available globally\nif (typeof window !== 'undefined') {\n    window.UserExperienceEnhancer = UserExperienceEnhancer;\n    window.uxEnhancer = new UserExperienceEnhancer();\n}\n\n// Export for module use\nif (typeof module !== 'undefined' && module.exports) {\n    module.exports = UserExperienceEnhancer;\n}