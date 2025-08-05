/**
 * Navigation Module
 * =================
 * 
 * Handles page navigation and URL routing for the FCA Dashboard
 */

export class Navigation {
    constructor(dashboard) {
        this.dashboard = dashboard;
        this.currentPage = 'dashboard';
        this.pages = ['dashboard', 'fraud', 'sentiment', 'attrition', 'datasets'];
        this.pageHistory = [];
        
        this.init();
    }

    init() {
        this.setupNavigationEvents();
        this.setupKeyboardShortcuts();
        
        // Handle initial page load
        const initialPage = this.getPageFromHash() || 'dashboard';
        this.navigateToPage(initialPage, false);
    }

    /**
     * Setup navigation event listeners
     */
    setupNavigationEvents() {
        // Navigation links
        document.querySelectorAll('[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.currentTarget.getAttribute('data-page');
                this.navigateToPage(page);
            });
        });

        // Browser back/forward buttons
        window.addEventListener('popstate', (e) => {
            const page = this.getPageFromHash() || 'dashboard';
            this.navigateToPage(page, false);
        });

        // Refresh button
        const refreshBtn = document.getElementById('refresh-data');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshCurrentPage());
        }
    }

    /**
     * Setup keyboard shortcuts for navigation
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when no input is focused
            if (document.activeElement.tagName === 'INPUT' || 
                document.activeElement.tagName === 'TEXTAREA') {
                return;
            }

            const shortcuts = {
                '1': 'dashboard',
                '2': 'fraud', 
                '3': 'sentiment',
                '4': 'attrition',
                '5': 'datasets'
            };

            if (e.key in shortcuts && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.navigateToPage(shortcuts[e.key]);
            }

            // R for refresh
            if (e.key === 'r' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.refreshCurrentPage();
            }
        });
    }

    /**
     * Navigate to a specific page
     * @param {string} page - Page identifier
     * @param {boolean} updateHistory - Whether to update browser history
     */
    async navigateToPage(page, updateHistory = true) {
        if (!this.pages.includes(page)) {
            console.warn(`Invalid page: ${page}`);
            return;
        }

        if (this.currentPage === page) {
            return; // Already on this page
        }

        try {
            // Show loading for page transition
            this.showPageLoading(page);

            // Update navigation UI
            this.updateNavigationUI(page);

            // Hide all pages
            this.hideAllPages();

            // Show target page
            await this.showPage(page);

            // Update current page
            this.pageHistory.push(this.currentPage);
            this.currentPage = page;

            // Update browser history and URL
            if (updateHistory) {
                this.updateURL(page);
            }

            // Update page title
            this.updatePageTitle(page);

            console.log(`📄 Navigated to ${page} page`);

        } catch (error) {
            console.error(`Navigation to ${page} failed:`, error);
            this.dashboard.showError(`Failed to load ${page} page: ${error.message}`);
        }
    }

    /**
     * Show page loading indicator
     */
    showPageLoading(page) {
        const pageElement = document.getElementById(`${page}-page`);
        if (pageElement) {
            // Add loading class
            pageElement.classList.add('page-loading');
        }
    }

    /**
     * Update navigation UI to reflect current page
     */
    updateNavigationUI(page) {
        // Update nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        const activeLink = document.querySelector(`[data-page="${page}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Update breadcrumb if exists
        const breadcrumb = document.querySelector('.breadcrumb-item.active');
        if (breadcrumb) {
            breadcrumb.textContent = this.getPageTitle(page);
        }
    }

    /**
     * Hide all page sections
     */
    hideAllPages() {
        this.pages.forEach(pageId => {
            const pageElement = document.getElementById(`${pageId}-page`);
            if (pageElement) {
                pageElement.style.display = 'none';
                pageElement.classList.remove('active', 'page-loading');
            }
        });
    }

    /**
     * Show specific page and load its content
     */
    async showPage(page) {
        const pageElement = document.getElementById(`${page}-page`);
        if (!pageElement) {
            throw new Error(`Page element not found: ${page}-page`);
        }

        // Show page
        pageElement.style.display = 'block';
        pageElement.classList.add('active');

        // Load page-specific content
        await this.loadPageContent(page);

        // Remove loading state
        pageElement.classList.remove('page-loading');

        // Update page title display
        const titleElement = document.getElementById('page-title-text');
        if (titleElement) {
            titleElement.textContent = this.getPageTitle(page);
        }
    }

    /**
     * Load content for specific page
     */
    async loadPageContent(page) {
        switch (page) {
            case 'dashboard':
                await this.dashboard.showDashboard();
                break;
            case 'fraud':
                await this.dashboard.showFraudPage();
                break;
            case 'sentiment':
                await this.dashboard.showSentimentPage();
                break;
            case 'attrition':
                await this.dashboard.showAttritionPage();
                break;
            case 'datasets':
                await this.dashboard.showDatasetsPage();
                break;
            default:
                throw new Error(`Unknown page: ${page}`);
        }
    }

    /**
     * Get page title
     */
    getPageTitle(page) {
        const titles = {
            'dashboard': 'Overview',
            'fraud': 'Fraud Detection',
            'sentiment': 'Sentiment Analysis', 
            'attrition': 'Customer Attrition',
            'datasets': 'Datasets'
        };
        return titles[page] || page;
    }

    /**
     * Update page title in document
     */
    updatePageTitle(page) {
        const title = `FCA Dashboard - ${this.getPageTitle(page)}`;
        document.title = title;
    }

    /**
     * Update URL hash
     */
    updateURL(page) {
        const url = page === 'dashboard' ? '#' : `#${page}`;
        history.pushState({ page }, '', url);
    }

    /**
     * Get page from URL hash
     */
    getPageFromHash() {
        const hash = window.location.hash.slice(1);
        return hash && this.pages.includes(hash) ? hash : null;
    }

    /**
     * Refresh current page
     */
    async refreshCurrentPage() {
        console.log(`🔄 Refreshing ${this.currentPage} page...`);
        
        try {
            // Clear relevant caches
            this.dashboard.dataLoader.clearCache();
            
            // Reload current page
            await this.navigateToPage(this.currentPage, false);
            
            // Show success message
            this.dashboard.showNotification('Page refreshed successfully', 'success');
            
        } catch (error) {
            console.error('Page refresh failed:', error);
            this.dashboard.showError('Failed to refresh page: ' + error.message);
        }
    }

    /**
     * Go back to previous page
     */
    goBack() {
        if (this.pageHistory.length > 0) {
            const previousPage = this.pageHistory.pop();
            this.navigateToPage(previousPage);
        }
    }

    /**
     * Get navigation state
     */
    getState() {
        return {
            currentPage: this.currentPage,
            history: [...this.pageHistory],
            availablePages: [...this.pages]
        };
    }
}