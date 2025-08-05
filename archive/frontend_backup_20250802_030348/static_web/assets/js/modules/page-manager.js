// FCA Page Manager Module - Centralized page navigation and content management

export class PageManager {
    constructor() {
        this.pages = new Map();
        this.currentPage = null;
        this.pageHistory = [];
        this.navigationListeners = [];
        this.loadingElement = null;
        this.contentElement = null;
        this.headerElement = null;
    }

    // Initialize page manager
    init(options = {}) {
        this.loadingElement = document.getElementById(options.loadingId || 'loading');
        this.contentElement = document.getElementById(options.contentId || 'page-content');
        this.headerElement = document.getElementById(options.headerId || 'page-header');
        
        this.setupEventListeners();
        this.registerDefaultPages();
    }

    // Register a page
    registerPage(pageId, pageConfig) {
        this.pages.set(pageId, {
            id: pageId,
            title: pageConfig.title || pageId,
            subtitle: pageConfig.subtitle || '',
            icon: pageConfig.icon || 'fas fa-file',
            contentGenerator: pageConfig.contentGenerator,
            onEnter: pageConfig.onEnter || (() => {}),
            onExit: pageConfig.onExit || (() => {}),
            requiresAuth: pageConfig.requiresAuth || false,
            preloadData: pageConfig.preloadData || []
        });
    }

    // Navigate to page
    async navigateTo(pageId, options = {}) {
        const page = this.pages.get(pageId);
        if (!page) {
            throw new Error(`Page not found: ${pageId}`);
        }

        // Check authentication if required
        if (page.requiresAuth && !this.checkAuth()) {
            throw new Error('Authentication required');
        }

        // Show loading
        this.showLoading();

        try {
            // Call onExit for current page
            if (this.currentPage) {
                const currentPageConfig = this.pages.get(this.currentPage);
                if (currentPageConfig) {
                    await currentPageConfig.onExit();
                }
            }

            // Add to history
            if (this.currentPage && this.currentPage !== pageId) {
                this.pageHistory.push(this.currentPage);
            }

            // Update current page
            this.currentPage = pageId;

            // Update page header
            this.updatePageHeader(page);

            // Preload required data
            if (page.preloadData.length > 0) {
                await this.preloadPageData(page.preloadData);
            }

            // Generate and set content
            const content = await page.contentGenerator(options);
            this.setPageContent(content);

            // Call onEnter for new page
            await page.onEnter(options);

            // Hide loading and show content
            this.hideLoading();

            // Update navigation state
            this.updateNavigationState(pageId);

            // Notify listeners
            this.notifyNavigationListeners(pageId, page);

        } catch (error) {
            console.error('Navigation error:', error);
            this.hideLoading();
            this.showError(error.message);
        }
    }

    // Go back to previous page
    goBack() {
        if (this.pageHistory.length > 0) {
            const previousPage = this.pageHistory.pop();
            this.navigateTo(previousPage);
        }
    }

    // Update page header
    updatePageHeader(page) {
        if (this.headerElement) {
            const titleElement = this.headerElement.querySelector('#page-title-text');
            const subtitleElement = this.headerElement.querySelector('#page-subtitle');
            const iconElement = this.headerElement.querySelector('#page-icon');

            if (titleElement) titleElement.textContent = page.title;
            if (subtitleElement) subtitleElement.textContent = page.subtitle;
            if (iconElement) iconElement.className = page.icon;
        }
    }

    // Set page content
    setPageContent(content) {
        if (this.contentElement) {
            this.contentElement.innerHTML = content;
            this.contentElement.classList.add('fade-in');
        }
    }

    // Show loading
    showLoading() {
        if (this.loadingElement) {
            this.loadingElement.style.display = 'block';
        }
        if (this.contentElement) {
            this.contentElement.style.display = 'none';
        }
    }

    // Hide loading
    hideLoading() {
        if (this.loadingElement) {
            this.loadingElement.style.display = 'none';
        }
        if (this.contentElement) {
            this.contentElement.style.display = 'block';
        }
    }

    // Show error
    showError(message) {
        const errorHtml = `
            <div class="alert alert-danger" role="alert">
                <h4 class="alert-heading">Error</h4>
                <p>${message}</p>
                <hr>
                <p class="mb-0">Please try again or contact support if the problem persists.</p>
            </div>
        `;
        this.setPageContent(errorHtml);
        this.hideLoading();
    }

    // Setup event listeners
    setupEventListeners() {
        // Navigation links
        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('[data-page]');
            if (navLink) {
                e.preventDefault();
                const pageId = navLink.getAttribute('data-page');
                this.navigateTo(pageId);
            }
        });

        // Browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.pageId) {
                this.navigateTo(e.state.pageId, { fromPopState: true });
            }
        });

        // Handle window resize for responsive layouts
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    // Update navigation state
    updateNavigationState(pageId) {
        // Update active navigation link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-page="${pageId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Update browser history
        const url = new URL(window.location);
        url.hash = pageId;
        history.pushState({ pageId }, '', url);

        // Close mobile sidebar if open
        if (window.innerWidth <= 768) {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.classList.remove('show');
            }
        }
    }

    // Preload page data
    async preloadPageData(dataTypes) {
        const promises = dataTypes.map(dataType => {
            if (window.dataManager) {
                return window.dataManager.loadData(dataType);
            }
            return Promise.resolve(null);
        });

        return Promise.all(promises);
    }

    // Handle window resize
    handleResize() {
        // Resize charts if chart factory is available
        if (window.chartFactory) {
            window.chartFactory.resizeAllCharts();
        }
    }

    // Check authentication (placeholder)
    checkAuth() {
        // Implement authentication logic here
        return true;
    }

    // Add navigation listener
    addNavigationListener(listener) {
        this.navigationListeners.push(listener);
    }

    // Remove navigation listener
    removeNavigationListener(listener) {
        const index = this.navigationListeners.indexOf(listener);
        if (index > -1) {
            this.navigationListeners.splice(index, 1);
        }
    }

    // Notify navigation listeners
    notifyNavigationListeners(pageId, page) {
        this.navigationListeners.forEach(listener => {
            try {
                listener(pageId, page);
            } catch (error) {
                console.error('Navigation listener error:', error);
            }
        });
    }

    // Register default pages
    registerDefaultPages() {
        // This will be implemented when integrating with existing page definitions
    }

    // Get current page
    getCurrentPage() {
        return this.currentPage;
    }

    // Get page configuration
    getPage(pageId) {
        return this.pages.get(pageId);
    }

    // Get all registered pages
    getAllPages() {
        return Array.from(this.pages.values());
    }

    // Refresh current page
    async refreshCurrentPage() {
        if (this.currentPage) {
            await this.navigateTo(this.currentPage, { refresh: true });
        }
    }
}