/**
 * Dashboard Core - Refactored Main Dashboard
 * ========================================
 * Lightweight core dashboard with dependency injection,
 * event-driven architecture, and clean separation of concerns
 */

class DashboardCore {
    constructor(dependencies = {}) {
        // Inject dependencies
        this.apiService = dependencies.apiService || container.resolve('apiService');
        this.eventBus = dependencies.eventBus || container.resolve('eventBus');
        this.configManager = dependencies.configManager || container.resolve('configManager');
        this.chartRenderer = dependencies.chartRenderer || container.resolve('chartRenderer');
        
        // Dashboard state
        this.state = {
            initialized: false,
            loading: false,
            currentPage: 'dashboard',
            theme: 'light',
            data: {},
            charts: new Map(),
            errors: []
        };
        
        // Configuration
        this.config = this.configManager.get('app', {});
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize dashboard
     */
    async init() {
        try {
            console.log('🚀 Dashboard Core initializing...');
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load configuration
            this.loadConfiguration();
            
            // Set initial theme
            this.setTheme(this.state.theme);
            
            // Load initial data
            await this.loadInitialData();
            
            // Initialize UI components
            this.initializeUI();
            
            // Mark as initialized
            this.state.initialized = true;
            
            // Emit initialization complete event
            this.eventBus.emit('dashboard.initialized', this.state);
            
            console.log('✅ Dashboard Core initialized successfully');
            
        } catch (error) {
            console.error('❌ Dashboard initialization failed:', error);
            this.handleError(error, 'initialization');
        }
    }
    
    /**
     * Load initial data
     */
    async loadInitialData() {
        try {
            this.setState({ loading: true });
            this.eventBus.emit('dashboard.loading.start');
            
            console.log('📊 Loading dashboard data...');
            
            // Load data through API service
            const data = await this.apiService.loadDashboardData();
            
            // Update state
            this.setState({ data, loading: false });
            
            // Emit data loaded event
            this.eventBus.emit('dashboard.data.loaded', data);
            
            console.log('✅ Dashboard data loaded successfully');
            
        } catch (error) {
            console.error('❌ Failed to load dashboard data:', error);
            this.setState({ loading: false });
            this.handleError(error, 'data_loading');
        }
    }
    
    /**
     * Render dashboard
     */
    async render() {
        try {
            console.log('🎨 Rendering dashboard...');
            
            // Emit render start event
            this.eventBus.emit('dashboard.render.start');
            
            // Render charts based on current page
            await this.renderCurrentPage();
            
            // Emit render complete event
            this.eventBus.emit('dashboard.render.complete');
            
            console.log('✅ Dashboard rendered successfully');
            
        } catch (error) {
            console.error('❌ Dashboard render failed:', error);
            this.handleError(error, 'rendering');
        }
    }
    
    /**
     * Render current page
     */
    async renderCurrentPage() {
        const page = this.state.currentPage;
        const data = this.state.data;
        
        console.log(`🎨 Rendering page: ${page}`);
        
        switch (page) {
            case 'dashboard':
                await this.renderDashboardPage(data);
                break;
            case 'fraud':
                await this.renderFraudPage(data);
                break;
            case 'sentiment':
                await this.renderSentimentPage(data);
                break;
            case 'xai':
                await this.renderXAIPage(data);
                break;
            default:
                console.warn(`⚠️ Unknown page: ${page}`);
        }
    }
    
    /**
     * Render dashboard overview page
     */
    async renderDashboardPage(data) {
        const charts = [
            { type: 'summary', containers: ['summary-charts'] },
            { type: 'trends', containers: ['trend-charts'] },
            { type: 'kpis', containers: ['kpi-charts'] }
        ];
        
        for (const chart of charts) {
            this.eventBus.emit('chart.render.request', {
                type: chart.type,
                containers: chart.containers,
                data: data,
                config: this.getChartConfig(chart.type)
            });
        }
    }
    
    /**
     * Render fraud analysis page
     */
    async renderFraudPage(data) {
        const charts = [
            { type: 'fraud_overview', containers: ['fraud-overview-chart'] },
            { type: 'fraud_trends', containers: ['fraud-trends-chart'] },
            { type: 'fraud_distribution', containers: ['fraud-distribution-chart'] }
        ];
        
        for (const chart of charts) {
            this.eventBus.emit('chart.render.request', {
                type: chart.type,
                containers: chart.containers,
                data: data.fraud_data || {},
                config: this.getChartConfig(chart.type)
            });
        }
    }
    
    /**
     * Render sentiment analysis page
     */
    async renderSentimentPage(data) {
        const charts = [
            { type: 'sentiment_overview', containers: ['sentiment-overview-chart'] },
            { type: 'sentiment_trends', containers: ['sentiment-trends-chart'] },
            { type: 'sentiment_distribution', containers: ['sentiment-distribution-chart'] }
        ];
        
        for (const chart of charts) {
            this.eventBus.emit('chart.render.request', {
                type: chart.type,
                containers: chart.containers,
                data: data.sentiment_data || {},
                config: this.getChartConfig(chart.type)
            });
        }
    }
    
    /**
     * Render XAI analysis page
     */
    async renderXAIPage(data) {
        const charts = [
            { type: 'lime_explanation', containers: ['lime-explanation-xai-chart'] },
            { type: 'decision_process', containers: ['decision-tree-xai-chart'] },
            { type: 'feature_importance', containers: ['global-feature-importance-chart'] },
            { type: 'model_comparison', containers: ['model-comparison-xai-chart'] },
            { type: 'confidence_distribution', containers: ['confidence-distribution-xai-chart'] },
            { type: 'partial_dependence', containers: ['partial-dependence-chart'] }
        ];
        
        for (const chart of charts) {
            this.eventBus.emit('chart.render.request', {
                type: chart.type,
                containers: chart.containers,
                data: data.xai_data || {},
                config: this.getChartConfig(chart.type)
            });
        }
    }
    
    /**
     * Navigate to page
     */
    navigateTo(page) {
        if (page === this.state.currentPage) {
            return;
        }
        
        console.log(`🧭 Navigating to: ${page}`);
        
        // Update state
        this.setState({ currentPage: page });
        
        // Emit navigation event
        this.eventBus.emit('dashboard.navigation', { from: this.state.currentPage, to: page });
        
        // Render new page
        this.render();
    }
    
    /**
     * Set theme
     */
    setTheme(theme) {
        if (this.state.theme === theme) {
            return;
        }
        
        console.log(`🎨 Setting theme: ${theme}`);
        
        // Update state
        this.setState({ theme });
        
        // Update chart renderer theme
        this.chartRenderer.setTheme(theme);
        
        // Update DOM
        document.documentElement.setAttribute('data-theme', theme);
        
        // Save to localStorage
        localStorage.setItem('dashboard-theme', theme);
        
        // Emit theme change event
        this.eventBus.emit('dashboard.theme.changed', theme);
    }
    
    /**
     * Refresh data
     */
    async refreshData() {
        console.log('🔄 Refreshing dashboard data...');
        
        // Clear cache
        this.apiService.clearCache();
        
        // Reload data
        await this.loadInitialData();
        
        // Re-render
        await this.render();
        
        this.eventBus.emit('dashboard.data.refreshed');
    }
    
    /**
     * Export data
     */
    exportData(format = 'json') {
        try {
            console.log(`📤 Exporting data as ${format}...`);
            
            const data = this.state.data;
            let exportContent;
            let mimeType;
            let filename;
            
            switch (format.toLowerCase()) {
                case 'json':
                    exportContent = JSON.stringify(data, null, 2);
                    mimeType = 'application/json';
                    filename = 'dashboard-data.json';
                    break;
                case 'csv':
                    exportContent = this.convertToCSV(data);
                    mimeType = 'text/csv';
                    filename = 'dashboard-data.csv';
                    break;
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }
            
            // Download file
            this.downloadFile(exportContent, filename, mimeType);
            
            this.eventBus.emit('dashboard.data.exported', { format, filename });
            
        } catch (error) {
            console.error('❌ Export failed:', error);
            this.handleError(error, 'export');
        }
    }
    
    /**
     * Get current state
     */
    getState() {
        return { ...this.state };
    }
    
    /**
     * Get chart configuration
     */
    getChartConfig(chartType) {
        return this.configManager.get(`charts.${chartType}`, {});
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Navigation events
        this.eventBus.on('navigation.request', (data) => {
            this.navigateTo(data.page);
        });
        
        // Theme change events
        this.eventBus.on('theme.change.request', (data) => {
            this.setTheme(data.theme);
        });
        
        // Data refresh events
        this.eventBus.on('data.refresh.request', () => {
            this.refreshData();
        });
        
        // Export events
        this.eventBus.on('data.export.request', (data) => {
            this.exportData(data.format);
        });
        
        // Error events
        this.eventBus.on('error.occurred', (error) => {
            this.handleError(error.error, error.context);
        });
    }
    
    /**
     * Load configuration
     */
    loadConfiguration() {
        this.state.theme = this.configManager.get('ui.theme', 'light');
        
        // Apply other configuration settings
        const debugMode = this.configManager.get('app.debug', false);
        if (debugMode) {
            this.eventBus.setDebugMode(true);
        }
    }
    
    /**
     * Initialize UI components
     */
    initializeUI() {
        // Show loading indicator
        this.hideLoading();
        
        // Setup UI event listeners
        this.setupUIEventListeners();
        
        // Update UI state
        this.updateUIState();
    }
    
    /**
     * Setup UI event listeners
     */
    setupUIEventListeners() {
        // Navigation links
        document.querySelectorAll('[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.getAttribute('data-page');
                this.navigateTo(page);
            });
        });
        
        // Theme toggle
        const themeToggle = document.querySelector('[data-theme-toggle]');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const newTheme = this.state.theme === 'light' ? 'dark' : 'light';
                this.setTheme(newTheme);
            });
        }
        
        // Refresh button
        const refreshBtn = document.querySelector('[data-refresh]');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshData();
            });
        }
    }
    
    /**
     * Update UI state
     */
    updateUIState() {
        // Update active navigation
        document.querySelectorAll('[data-page]').forEach(link => {
            const page = link.getAttribute('data-page');
            link.classList.toggle('active', page === this.state.currentPage);
        });
        
        // Update theme toggle
        const themeToggle = document.querySelector('[data-theme-toggle]');
        if (themeToggle) {
            themeToggle.textContent = this.state.theme === 'light' ? '🌙' : '☀️';
        }
    }
    
    /**
     * Show loading indicator
     */
    showLoading() {
        const loader = document.querySelector('.loading-overlay');
        if (loader) {
            loader.style.display = 'flex';
        }
    }
    
    /**
     * Hide loading indicator
     */
    hideLoading() {
        const loader = document.querySelector('.loading-overlay');
        if (loader) {
            loader.style.display = 'none';
        }
    }
    
    /**
     * Update state
     */
    setState(updates) {
        Object.assign(this.state, updates);
        this.eventBus.emit('dashboard.state.updated', this.state);
    }
    
    /**
     * Handle errors
     */
    handleError(error, context = 'unknown') {
        console.error(`❌ Dashboard error in ${context}:`, error);
        
        this.state.errors.push({
            error: error.message || error,
            context,
            timestamp: Date.now()
        });
        
        this.eventBus.emit('dashboard.error', { error, context });
        
        // Show user-friendly error message
        this.showErrorMessage(`An error occurred: ${error.message || error}`);
    }
    
    /**
     * Show error message to user
     */
    showErrorMessage(message) {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.className = 'toast toast-error';
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }
    
    /**
     * Utility methods
     */
    convertToCSV(data) {
        // Simple CSV conversion - would need more sophisticated implementation
        const flattened = this.flattenObject(data);
        const headers = Object.keys(flattened);
        const values = Object.values(flattened);
        
        return [headers.join(','), values.join(',')].join('\\n');
    }
    
    flattenObject(obj, prefix = '') {
        const flattened = {};
        
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const newKey = prefix ? `${prefix}.${key}` : key;
                
                if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                    Object.assign(flattened, this.flattenObject(obj[key], newKey));
                } else {
                    flattened[newKey] = obj[key];
                }
            }
        }
        
        return flattened;
    }
    
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        
        URL.revokeObjectURL(url);
    }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardCore;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.DashboardCore = DashboardCore;
}