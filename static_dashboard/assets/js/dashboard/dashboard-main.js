/**
 * FCA Analysis Dashboard - Main Controller
 * =======================================
 * 
 * Main dashboard controller handling initialization,
 * navigation, and core functionality.
 */

class FCADashboard {
    constructor() {
        this.data = {};
        this.currentPage = 'dashboard';
        this.theme = localStorage.getItem('dashboard-theme') || 'light';
        this.charts = {};
        this.dashboardLoader = null;
        this.loadingStartTime = null;
        
        // Safe logging function
        this.safeLog = (message, type = 'info', module = 'Dashboard') => {
            if (typeof CommonUtils !== 'undefined' && CommonUtils.log) {
                CommonUtils.log[type](message, module);
            } else {
                const emoji = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : '✅';
                console.log(`${emoji} [${module}] ${message}`);
            }
        };
        
        // Initialize modular components
        this.contentLoaders = null;
        this.xaiHandlers = null;
        
        this.safeLog('FCA Dashboard initializing with modular architecture');
        this.init();
    }
    
    async init() {
        try {
            this.loadingStartTime = Date.now();
            this.safeLog('FCA Dashboard initialization started');
            
            // Set initial theme
            this.setTheme(this.theme);
            this.safeLog('Theme set');
            
            // Show loading indicator first  
            this.showLoading();
            this.safeLog('Loading indicator shown');
            
            // Load data using fallback method
            this.safeLog('Using fallback data loading method', 'warn');
            await this.loadFallbackDashboard();
            
            // Setup navigation
            this.setupNavigation();
            this.safeLog('Navigation setup complete');
            
            // Initialize modular components
            this.initializeModules();
            this.safeLog('Modular components initialized');
            
            // Setup event listeners
            this.setupEventListeners();
            this.safeLog('Event listeners setup');
            
            // Hide loading and show content
            this.hideLoading();
            this.showDashboard();
            this.safeLog('Loading hidden and content shown');
            
            // Load initial page content
            await this.loadPageContent(this.currentPage);
            this.safeLog('Dashboard display complete');
            
        } catch (error) {
            this.safeLog(`Dashboard initialization failed: ${error.message}`, 'error');
            this.showError('Failed to initialize dashboard');
        }
    }
    
    async loadFallbackDashboard() {
        try {
            this.safeLog('Loading fallback dashboard data...');
            
            // Load bundled data
            const bundleStartTime = performance.now();
            const bundleData = await this.loadBundledData();
            const bundleEndTime = performance.now();
            
            console.log(`📦 Bundle fetch: ${(bundleEndTime - bundleStartTime).toFixed(2)}ms`);
            
            const loadStartTime = performance.now();
            this.data = this.processBundleData(bundleData);
            const loadEndTime = performance.now();
            
            console.log(`✅ Bundle loaded in ${(loadEndTime - loadStartTime).toFixed(2)}ms:`, bundleData);
            
            // Cache for future loads
            this.cacheBundleData(bundleData);
            console.log('💾 Bundle data cached for future loads');
            
            this.safeLog('Data loaded via fallback method');
            
        } catch (error) {
            this.safeLog(`Fallback data loading failed: ${error.message}`, 'error');
            // Use minimal fallback data
            this.data = this.getMinimalFallbackData();
        }
    }
    
    async loadBundledData() {
        try {
            const response = await fetch('data/bundle.json');
            return await response.json();
        } catch (error) {
            console.warn('Bundle data not found, using individual files');
            return await this.loadIndividualDataFiles();
        }
    }
    
    async loadIndividualDataFiles() {
        const dataFiles = [
            'data/fraud_data.json',
            'data/sentiment_data.json', 
            'data/attrition_data.json',
            'data/xai_data.json',
            'data/model_data.json',
            'data/performance_metrics.json',
            'data/business_metrics.json'
        ];
        
        const loadPromises = dataFiles.map(async (file) => {
            try {
                const response = await fetch(file);
                const data = await response.json();
                return { file, data, success: true };
            } catch (error) {
                console.warn(`Failed to load ${file}:`, error);
                return { file, data: null, success: false };
            }
        });
        
        const results = await Promise.allSettled(loadPromises);
        return results.filter(r => r.status === 'fulfilled' && r.value.success)
                     .map(r => r.value.data);
    }
    
    processBundleData(bundleData) {
        if (Array.isArray(bundleData)) {
            return bundleData.reduce((acc, data) => ({ ...acc, ...data }), {});
        }
        return bundleData || {};
    }
    
    cacheBundleData(data) {
        try {
            const cacheKey = 'fca-dashboard-bundle';
            const cacheData = {
                data: data,
                timestamp: Date.now(),
                version: '1.0'
            };
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Failed to cache bundle data:', error);
        }
    }
    
    getMinimalFallbackData() {
        return {
            fraud_data: { summary: { total: 0, fraudulent: 0, legitimate: 0 } },
            sentiment_data: { summary: { positive: 0, neutral: 0, negative: 0 } },
            attrition_data: { summary: { total_customers: 0, at_risk: 0 } },
            xai_data: { lime_explanations: {} },
            model_data: { models: [] },
            performance_metrics: { accuracy: 0, precision: 0, recall: 0 },
            business_metrics: { revenue: 0, costs: 0 }
        };
    }
    
    // Navigation and page management
    setupNavigation() {
        const navLinks = document.querySelectorAll('[data-page]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.getAttribute('data-page') || 
                             e.target.closest('[data-page]').getAttribute('data-page');
                this.navigateToPage(page);
            });
        });
        this.safeLog('Navigation setup complete');
    }
    
    navigateToPage(page) {
        if (page === this.currentPage) return;
        
        this.safeLog(`Navigating to: ${page}`);
        
        // Hide all pages
        document.querySelectorAll('.page-content').forEach(pageElement => {
            pageElement.style.display = 'none';
        });
        
        // Show target page
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            targetPage.style.display = 'block';
            this.currentPage = page;
            
            // Update navigation state
            this.updateNavigationState(page);
            
            // Load page content
            this.loadPageContent(page);
            
            this.safeLog(`Navigated to ${page} page`);
        } else {
            this.safeLog(`Page not found: ${page}`, 'error');
        }
    }
    
    updateNavigationState(currentPage) {
        // Update active navigation link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-page="${currentPage}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
    
    initializeModules() {
        // Initialize content loaders module
        if (typeof DashboardContentLoaders !== 'undefined') {
            this.contentLoaders = new DashboardContentLoaders(this);
            this.safeLog('Content loaders module initialized');
        } else {
            this.safeLog('Content loaders module not available', 'warn');
        }
        
        // Initialize XAI handlers module
        if (typeof DashboardXAIHandlers !== 'undefined') {
            this.xaiHandlers = new DashboardXAIHandlers(this);
            this.safeLog('XAI handlers module initialized');
        } else {
            this.safeLog('XAI handlers module not available', 'warn');
        }
    }

    async loadPageContent(page) {
        try {
            switch (page) {
                case 'dashboard':
                    if (this.contentLoaders) {
                        await this.contentLoaders.loadDashboardContent();
                    }
                    break;
                case 'fraud':
                    if (this.contentLoaders) {
                        this.contentLoaders.loadFraudContent();
                    }
                    break;
                case 'sentiment':
                    if (this.contentLoaders) {
                        this.contentLoaders.loadSentimentContent();
                    }
                    break;
                case 'attrition':
                    if (this.contentLoaders) {
                        this.contentLoaders.loadAttritionContent();
                    }
                    break;
                case 'datasets':
                    if (this.contentLoaders) {
                        this.contentLoaders.loadDatasetsContent();
                    }
                    break;
                case 'xai':
                    if (this.xaiHandlers) {
                        this.xaiHandlers.loadXAIContent();
                    }
                    break;
                case 'local-explanations':
                    if (this.xaiHandlers) {
                        this.xaiHandlers.loadLocalExplanationsContent();
                    }
                    break;
                case 'global-analysis':
                    if (this.xaiHandlers) {
                        this.xaiHandlers.loadGlobalAnalysisContent();
                    }
                    break;
                case 'model-performance':
                    if (this.xaiHandlers) {
                        this.xaiHandlers.loadModelPerformanceContent();
                    }
                    break;
                case 'fairness-ethics':
                    if (this.xaiHandlers) {
                        this.xaiHandlers.loadFairnessEthicsContent();
                    }
                    break;
            }
        } catch (error) {
            console.error(`Error loading ${page} content:`, error);
        }
    }
    
    // Expose generateMockXAIData for modules
    generateMockXAIData() {
        if (this.xaiHandlers) {
            return this.xaiHandlers.generateMockXAIData();
        }
        return {};
    }
    
    // Theme management
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.theme = theme;
        localStorage.setItem('dashboard-theme', theme);
        
        // Update theme toggle button text
        const themeButton = document.querySelector('.settings-btn');
        if (themeButton) {
            themeButton.textContent = theme === 'light' ? 'Dark Mode' : 'Light Mode';
        }
    }
    
    // Loading states
    showLoading() {
        const loadingElement = document.getElementById('loading-indicator');
        if (loadingElement) {
            loadingElement.style.display = 'flex';
        }
    }
    
    hideLoading() {
        const loadingElement = document.getElementById('loading-indicator');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }
    
    showDashboard() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.style.display = 'block';
        }
    }
    
    showError(message) {
        const error = document.createElement('div');
        error.className = 'alert alert-danger';
        error.textContent = message;
        document.body.appendChild(error);
        
        setTimeout(() => {
            if (error.parentNode) {
                error.parentNode.removeChild(error);
            }
        }, 5000);
    }
    
    // Event listeners setup
    setupEventListeners() {
        // Theme toggle
        window.toggleTheme = () => {
            this.theme = this.theme === 'light' ? 'dark' : 'light';
            this.setTheme(this.theme);
            console.log(`🎨 Theme switched to ${this.theme}`);
        };
        
        // Data refresh
        window.refreshData = async () => {
            try {
                this.showLoading();
                await this.loadFallbackDashboard();
                this.loadPageContent(this.currentPage);
                this.hideLoading();
                console.log('🔄 Data refreshed');
            } catch (error) {
                console.error('❌ Data refresh failed:', error);
                this.showError('Failed to refresh data');
            }
        };
        
        // Mobile sidebar toggle
        window.toggleSidebar = () => {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.classList.toggle('mobile-hidden');
            }
        };
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new FCADashboard();
});