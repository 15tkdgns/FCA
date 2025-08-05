// FCA Application - Modular Main Application File

import { DataManager } from './modules/data-manager.js';
import { ChartFactory } from './modules/chart-factory.js';
import { PageManager } from './modules/page-manager.js';
import { ThemeManager } from './modules/theme-manager.js';

class FCAApplication {
    constructor() {
        this.modules = {};
        this.initialized = false;
        this.config = {};
    }

    // Initialize the application
    async init(config = {}) {
        if (this.initialized) {
            console.warn('FCA Application already initialized');
            return;
        }

        this.config = {
            enableThemes: true,
            enableDataCaching: true,
            defaultTheme: 'light',
            loadingTimeout: 30000,
            ...config
        };

        try {
            // Initialize core modules
            await this.initializeModules();
            
            // Setup global error handling
            this.setupErrorHandling();
            
            // Setup performance monitoring
            this.setupPerformanceMonitoring();
            
            // Initialize legacy components
            this.initializeLegacyComponents();
            
            // Setup auto-save and recovery
            this.setupAutoSave();
            
            this.initialized = true;
            
            console.log('✅ FCA Application initialized successfully');
            
            // Emit initialization event
            document.dispatchEvent(new CustomEvent('fcaAppReady', {
                detail: { app: this }
            }));
            
        } catch (error) {
            console.error('❌ FCA Application initialization failed:', error);
            this.handleInitializationError(error);
        }
    }

    // Initialize core modules
    async initializeModules() {
        // Initialize Theme Manager first
        if (this.config.enableThemes) {
            this.modules.themeManager = new ThemeManager();
            this.modules.themeManager.init();
            window.themeManager = this.modules.themeManager;
        }

        // Initialize Data Manager
        if (this.config.enableDataCaching) {
            this.modules.dataManager = new DataManager();
            this.setupDataValidators();
            window.dataManager = this.modules.dataManager;
        }

        // Initialize Chart Factory
        this.modules.chartFactory = new ChartFactory();
        if (this.modules.themeManager) {
            this.modules.chartFactory.setThemeManager(this.modules.themeManager);
        }
        this.registerChartConfigs();
        window.chartFactory = this.modules.chartFactory;

        // Initialize Page Manager
        this.modules.pageManager = new PageManager();
        this.modules.pageManager.init({
            loadingId: 'loading',
            contentId: 'page-content',
            headerId: 'page-header'
        });
        this.registerPages();
        window.pageManager = this.modules.pageManager;

        // Setup inter-module communication
        this.setupModuleCommunication();
    }

    // Setup data validators
    setupDataValidators() {
        const dataManager = this.modules.dataManager;

        // Fraud data validator
        dataManager.registerValidator('fraud', (data) => {
            return data && typeof data.total_transactions === 'number' && data.total_transactions > 0;
        });

        // Sentiment data validator
        dataManager.registerValidator('sentiment', (data) => {
            return data && typeof data.total_sentences === 'number' && data.total_sentences > 0;
        });

        // Attrition data validator
        dataManager.registerValidator('attrition', (data) => {
            return data && typeof data.total_customers === 'number' && data.total_customers > 0;
        });

        // Charts data validator
        dataManager.registerValidator('charts', (data) => {
            return data && data.fraud_distribution && data.sentiment_distribution;
        });
    }

    // Register chart configurations
    registerChartConfigs() {
        const chartFactory = this.modules.chartFactory;

        // Plotly configuration
        chartFactory.registerChartConfig('plotly', {
            layout: {
                font: { family: 'Inter, sans-serif' },
                margin: { l: 40, r: 40, t: 60, b: 40 },
                paper_bgcolor: 'white',
                plot_bgcolor: 'white'
            },
            options: { responsive: true }
        });

        // Chart.js configuration
        chartFactory.registerChartConfig('chartjs', {
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });

        // Academic chart configuration
        chartFactory.registerChartConfig('academic', {
            layout: {
                font: { family: 'Times New Roman, serif', size: 14 },
                margin: { l: 80, r: 50, t: 80, b: 80 },
                paper_bgcolor: 'white',
                plot_bgcolor: 'white'
            },
            options: { responsive: true, toImageButtonOptions: { scale: 2 } }
        });
    }

    // Register pages
    registerPages() {
        const pageManager = this.modules.pageManager;

        // Dashboard page
        pageManager.registerPage('dashboard', {
            title: 'Overview',
            subtitle: 'View overall system status and key metrics for FCA analysis',
            icon: 'fas fa-tachometer-alt',
            contentGenerator: () => this.generateDashboardContent(),
            onEnter: () => this.initializeDashboardCharts(),
            preloadData: ['summary', 'fraud', 'sentiment', 'attrition']
        });

        // Fraud detection page
        pageManager.registerPage('fraud', {
            title: 'Fraud Detection Analysis',
            subtitle: 'Credit card fraud transaction detection and analysis results',
            icon: 'fas fa-shield-alt',
            contentGenerator: () => this.generateFraudContent(),
            onEnter: () => this.initializeFraudCharts(),
            preloadData: ['fraud', 'charts']
        });

        // Sentiment analysis page
        pageManager.registerPage('sentiment', {
            title: 'Sentiment Analysis',
            subtitle: 'Financial news text sentiment classification and analysis results',
            icon: 'fas fa-comments',
            contentGenerator: () => this.generateSentimentContent(),
            onEnter: () => this.initializeSentimentCharts(),
            preloadData: ['sentiment', 'charts']
        });

        // Customer attrition page
        pageManager.registerPage('attrition', {
            title: 'Customer Attrition Analysis',
            subtitle: 'Bank customer churn pattern analysis and prediction results',
            icon: 'fas fa-users',
            contentGenerator: () => this.generateAttritionContent(),
            onEnter: () => this.initializeAttritionCharts(),
            preloadData: ['attrition', 'charts']
        });

        // Dataset management page
        pageManager.registerPage('datasets', {
            title: 'Dataset Management',
            subtitle: 'Manage status and metadata for all datasets',
            icon: 'fas fa-database',
            contentGenerator: () => this.generateDatasetsContent(),
            preloadData: ['datasets', 'summary']
        });

        // Model comparison page
        pageManager.registerPage('comparison', {
            title: 'Model Performance Comparison',
            subtitle: 'Compare machine learning model performance across domains',
            icon: 'fas fa-balance-scale',
            contentGenerator: () => this.generateComparisonContent(),
            onEnter: () => this.initializeComparisonCharts()
        });

        // XAI page
        pageManager.registerPage('xai', {
            title: 'XAI Explainability',
            subtitle: 'Explainable AI analysis with SHAP, LIME, and feature importance',
            icon: 'fas fa-brain',
            contentGenerator: () => this.generateXAIContent(),
            onEnter: () => this.initializeXAICharts()
        });

        // Validation page
        pageManager.registerPage('validation', {
            title: 'Model Validation & Bias Detection',
            subtitle: 'Comprehensive model validation, overfitting detection, and bias analysis',
            icon: 'fas fa-shield-check',
            contentGenerator: () => this.generateValidationContent(),
            onEnter: () => this.initializeValidationCharts()
        });
    }

    // Setup inter-module communication
    setupModuleCommunication() {
        const { dataManager, themeManager, chartFactory, pageManager } = this.modules;

        // Listen for theme changes and update charts
        if (themeManager) {
            document.addEventListener('themeChanged', (e) => {
                // Recreate all charts with new theme
                setTimeout(() => {
                    const currentPage = pageManager.getCurrentPage();
                    if (currentPage) {
                        this.reinitializePageCharts(currentPage);
                    }
                }, 100);
            });
        }

        // Listen for data updates and refresh relevant pages
        if (dataManager) {
            dataManager.addEventListener('dataLoaded', (e) => {
                const { dataType } = e.detail;
                console.log(`Data loaded: ${dataType}`);
            });
        }

        // Listen for page navigation and cleanup
        pageManager.addNavigationListener((pageId, page) => {
            // Cleanup charts from previous page
            chartFactory.destroyAllCharts();
            
            // Analytics tracking (if implemented)
            this.trackPageView(pageId);
        });
    }

    // Initialize legacy components (for backward compatibility)
    initializeLegacyComponents() {
        // Keep references to legacy objects for compatibility
        window.dashboard = {
            showPage: (pageId) => this.modules.pageManager.navigateTo(pageId),
            data: {} // Will be populated by data manager
        };

        // Initialize legacy ML validation if available
        if (window.MLValidation) {
            window.MLValidation.init();
        }

        // Initialize legacy XAI explainer if available
        if (window.XAIExplainer) {
            window.XAIExplainer.init();
        }

        // Initialize legacy data leakage prevention if available
        if (window.DataLeakagePrevention) {
            window.DataLeakagePrevention.init();
        }

        // Initialize legacy academic charts if available
        if (window.AcademicCharts) {
            window.AcademicCharts.init();
        }
    }

    // Content generators (simplified versions)
    generateDashboardContent() {
        return window.dashboard ? 
            (new FCADashboard()).generateDashboardContent() : 
            '<div class="alert alert-info">Dashboard content loading...</div>';
    }

    generateFraudContent() {
        return window.dashboard ? 
            (new FCADashboard()).generateFraudContent() : 
            '<div class="alert alert-info">Fraud analysis content loading...</div>';
    }

    generateSentimentContent() {
        return window.dashboard ? 
            (new FCADashboard()).generateSentimentContent() : 
            '<div class="alert alert-info">Sentiment analysis content loading...</div>';
    }

    generateAttritionContent() {
        return window.dashboard ? 
            (new FCADashboard()).generateAttritionContent() : 
            '<div class="alert alert-info">Attrition analysis content loading...</div>';
    }

    generateDatasetsContent() {
        return window.dashboard ? 
            (new FCADashboard()).generateDatasetsContent() : 
            '<div class="alert alert-info">Dataset management content loading...</div>';
    }

    generateComparisonContent() {
        return window.dashboard ? 
            (new FCADashboard()).generateComparisonContent() : 
            '<div class="alert alert-info">Model comparison content loading...</div>';
    }

    generateXAIContent() {
        return window.dashboard ? 
            (new FCADashboard()).generateXAIContent() : 
            '<div class="alert alert-info">XAI content loading...</div>';
    }

    generateValidationContent() {
        return window.dashboard ? 
            (new FCADashboard()).generateValidationContent() : 
            '<div class="alert alert-info">Validation content loading...</div>';
    }

    // Chart initialization methods
    async initializeDashboardCharts() {
        // Dashboard doesn't have specific charts, but loads data
        await this.loadPageData(['summary', 'fraud', 'sentiment', 'attrition']);
    }

    async initializeFraudCharts() {
        const data = await this.loadPageData(['fraud', 'charts']);
        if (window.FCACharts && data.charts) {
            window.FCACharts.initializeChartsForPage('fraud', data);
        }
    }

    async initializeSentimentCharts() {
        const data = await this.loadPageData(['sentiment', 'charts']);
        if (window.FCACharts && data.charts) {
            window.FCACharts.initializeChartsForPage('sentiment', data);
        }
    }

    async initializeAttritionCharts() {
        const data = await this.loadPageData(['attrition', 'charts']);
        if (window.FCACharts && data.charts) {
            window.FCACharts.initializeChartsForPage('attrition', data);
        }
    }

    async initializeComparisonCharts() {
        const data = await this.loadPageData(['charts']);
        if (window.FCACharts && data.charts) {
            window.FCACharts.initializeChartsForPage('comparison', data);
        }
    }

    async initializeXAICharts() {
        if (window.XAIExplainer && window.AcademicCharts) {
            const xaiData = window.XAIExplainer.explainabilityData;
            // Initialize XAI-specific charts
            setTimeout(() => this.renderXAICharts(xaiData), 200);
        }
    }

    async initializeValidationCharts() {
        if (window.MLValidation && window.AcademicCharts) {
            const validationData = window.MLValidation.validationMetrics;
            // Initialize validation-specific charts
            setTimeout(() => this.renderValidationCharts(validationData), 200);
        }
    }

    // Load page data
    async loadPageData(dataTypes) {
        const dataManager = this.modules.dataManager;
        if (!dataManager) return {};

        const data = {};
        for (const dataType of dataTypes) {
            try {
                data[dataType] = await dataManager.loadData(dataType);
            } catch (error) {
                console.error(`Failed to load data: ${dataType}`, error);
                data[dataType] = {};
            }
        }

        // Update legacy dashboard data
        if (window.dashboard) {
            window.dashboard.data = { ...window.dashboard.data, ...data };
        }

        return data;
    }

    // Reinitialize page charts (used when theme changes)
    async reinitializePageCharts(pageId) {
        const chartMethods = {
            'fraud': () => this.initializeFraudCharts(),
            'sentiment': () => this.initializeSentimentCharts(),
            'attrition': () => this.initializeAttritionCharts(),
            'comparison': () => this.initializeComparisonCharts(),
            'xai': () => this.initializeXAICharts(),
            'validation': () => this.initializeValidationCharts()
        };

        const initMethod = chartMethods[pageId];
        if (initMethod) {
            await initMethod();
        }
    }

    // Setup error handling
    setupErrorHandling() {
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            this.handleError(e.error);
        });

        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
            this.handleError(e.reason);
        });
    }

    // Setup performance monitoring
    setupPerformanceMonitoring() {
        if ('performance' in window) {
            // Monitor page load performance
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    console.log('Page load time:', perfData.loadEventEnd - perfData.fetchStart, 'ms');
                }, 0);
            });

            // Monitor chart rendering performance
            document.addEventListener('chartRendered', (e) => {
                console.log(`Chart rendered: ${e.detail.chartId} in ${e.detail.renderTime}ms`);
            });
        }
    }

    // Setup auto-save functionality
    setupAutoSave() {
        // Save user preferences and state
        setInterval(() => {
            this.saveApplicationState();
        }, 30000); // Save every 30 seconds

        // Save state before page unload
        window.addEventListener('beforeunload', () => {
            this.saveApplicationState();
        });
    }

    // Save application state
    saveApplicationState() {
        const state = {
            currentPage: this.modules.pageManager?.getCurrentPage(),
            theme: this.modules.themeManager?.currentTheme,
            timestamp: Date.now()
        };

        try {
            localStorage.setItem('fca-app-state', JSON.stringify(state));
        } catch (error) {
            console.warn('Failed to save application state:', error);
        }
    }

    // Restore application state
    restoreApplicationState() {
        try {
            const savedState = localStorage.getItem('fca-app-state');
            if (savedState) {
                const state = JSON.parse(savedState);
                
                // Restore theme
                if (state.theme && this.modules.themeManager) {
                    this.modules.themeManager.applyTheme(state.theme);
                }
                
                // Restore current page
                if (state.currentPage && this.modules.pageManager) {
                    this.modules.pageManager.navigateTo(state.currentPage);
                }
            }
        } catch (error) {
            console.warn('Failed to restore application state:', error);
        }
    }

    // Handle errors
    handleError(error) {
        // Log error details
        console.error('FCA Application Error:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        // Show user-friendly error message
        const errorMessage = this.getUserFriendlyErrorMessage(error);
        this.showErrorNotification(errorMessage);
    }

    // Handle initialization errors
    handleInitializationError(error) {
        document.body.innerHTML = `
            <div class="container mt-5">
                <div class="alert alert-danger" role="alert">
                    <h4 class="alert-heading">Application Initialization Failed</h4>
                    <p>The FCA application failed to initialize properly. Please refresh the page or contact support.</p>
                    <hr>
                    <p class="mb-0"><strong>Error:</strong> ${error.message}</p>
                </div>
            </div>
        `;
    }

    // Get user-friendly error message
    getUserFriendlyErrorMessage(error) {
        const errorMap = {
            'NetworkError': 'Network connection issue. Please check your internet connection.',
            'TypeError': 'Data format error. Please refresh the page.',
            'ReferenceError': 'Component loading error. Please refresh the page.',
            'default': 'An unexpected error occurred. Please try again.'
        };

        return errorMap[error.constructor.name] || errorMap.default;
    }

    // Show error notification
    showErrorNotification(message) {
        if (window.FCAPages && window.FCAPages.showToast) {
            window.FCAPages.showToast(message, 'danger');
        } else {
            // Fallback alert
            alert(message);
        }
    }

    // Track page view (placeholder for analytics)
    trackPageView(pageId) {
        // Implement analytics tracking here
        console.log(`Page view: ${pageId}`);
    }

    // Render XAI charts
    renderXAICharts(xaiData) {
        // Implementation would go here
        console.log('Rendering XAI charts...');
    }

    // Render validation charts
    renderValidationCharts(validationData) {
        // Implementation would go here
        console.log('Rendering validation charts...');
    }

    // Public API methods
    getModule(moduleName) {
        return this.modules[moduleName];
    }

    isInitialized() {
        return this.initialized;
    }

    getConfig() {
        return { ...this.config };
    }

    // Cleanup method
    destroy() {
        Object.values(this.modules).forEach(module => {
            if (module && typeof module.destroy === 'function') {
                module.destroy();
            }
        });
        
        this.modules = {};
        this.initialized = false;
    }
}

// Initialize the application
const fcaApp = new FCAApplication();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    fcaApp.init({
        enableThemes: true,
        enableDataCaching: true,
        defaultTheme: 'light'
    });
});

// Make app globally available
window.FCAApp = fcaApp;

export default fcaApp;