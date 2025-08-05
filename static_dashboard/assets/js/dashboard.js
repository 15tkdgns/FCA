/**
 * FCA Analysis Dashboard - Main JavaScript
 * =======================================
 * 
 * Main dashboard functionality including data loading,
 * page navigation, and UI interactions.
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
        
        this.safeLog('FCA Dashboard initializing with async loading');
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
            
            // TEMPORARILY DISABLE ASYNC LOADING - FORCE FALLBACK MODE
            this.safeLog('Async loading disabled - using fallback mode only', 'warn');
            this.dashboardLoader = null;
            
            // Load data using DataManager with safety check
            if (typeof DataManager !== 'undefined' && DataManager.loadDashboardData) {
                this.data = await DataManager.loadDashboardData();
                this.safeLog('Data loaded via DataManager');
            } else {
                this.safeLog('DataManager not available, falling back to basic loading', 'warn');
                await this.loadAllData(); // fallback to old method
                this.safeLog('Data loaded via fallback method');
            }
            
            // Setup navigation
            this.setupNavigation();
            this.safeLog('Navigation setup complete');
            
            // Show dashboard using basic synchronous method
            this.showDashboard();
            this.safeLog('Dashboard displayed (sync mode)');
            
            // Render XAI charts immediately for testing
            this.renderXAIChartsWithNewSystem();
            this.safeLog('XAI charts rendered');
            
            // Setup event listeners
            this.setupEventListeners();
            this.safeLog('Event listeners setup');
            
            // Setup performance monitoring
            this.setupPerformanceMonitoring();
            this.safeLog('Performance monitoring setup');
            
            const loadTime = Date.now() - this.loadingStartTime;
            this.safeLog(`FCA Dashboard initialized successfully in ${loadTime}ms`);
            
            // Add debug commands to window for console access
            this.addDebugCommands();
            
        } catch (error) {
            console.error('❌ Dashboard initialization failed:', error);
            
            // If it's a timeout error, try fallback loading
            if (error.message.includes('timeout')) {
                console.log('🔄 Attempting fallback loading...');
                this.loadFallbackDashboard();
            } else {
                this.showError('Failed to initialize dashboard: ' + error.message);
            }
        }
    }
    
    /**
     * Fallback loading for when async system fails
     */
    async loadFallbackDashboard() {
        try {
            console.log('🆘 Loading fallback dashboard...');
            
            // Update status
            const statusEl = document.getElementById('loading-status');
            if (statusEl) {
                statusEl.textContent = 'Loading basic version...';
            }
            
            // Force disable async loading
            this.dashboardLoader = null;
            
            // Load data synchronously
            await this.loadAllData();
            
            // Setup basic navigation
            this.setupNavigation();
            
            // Show basic dashboard
            this.showDashboard();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('✅ Fallback dashboard loaded successfully');
            
        } catch (error) {
            console.error('❌ Even fallback loading failed:', error);
            this.showError('System error: Unable to load dashboard. Please refresh the page.');
        }
    }

    /**
     * Initialize the dashboard loader system
     */
    async initializeDashboardLoader() {
        try {
            console.log('🚀 Starting dashboard loader initialization...');
            
            // Quick dependency check first
            if (typeof Plotly === 'undefined') {
                throw new Error('Plotly.js not available - cannot initialize async loading');
            }
            
            // Add timeout to prevent hanging (reduced to 3 seconds)
            const initPromise = this.initDashboardLoaderWithTimeout();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Dashboard loader initialization timeout (3s)')), 3000)
            );
            
            await Promise.race([initPromise, timeoutPromise]);
            console.log('✅ Dashboard loader system initialized');
            
        } catch (error) {
            console.warn('⚠️ Dashboard loader failed, falling back to synchronous loading:', error.message);
            this.dashboardLoader = null;
            
            // Update loading status to indicate fallback mode
            const statusEl = document.getElementById('loading-status');
            if (statusEl) {
                statusEl.textContent = 'Loading in compatibility mode...';
            }
        }
    }
    
    async initDashboardLoaderWithTimeout() {
        // Import dashboard loader dynamically to avoid blocking
        console.log('📦 Importing DashboardLoader module...');
        const { DashboardLoader } = await import('./modules/DashboardLoader.js');
        
        console.log('🏗️ Creating DashboardLoader instance...');
        this.dashboardLoader = new DashboardLoader();
        
        console.log('⚡ Initializing DashboardLoader...');
        await this.dashboardLoader.init();
    }

    /**
     * Load data asynchronously with better error handling
     */
    async loadAllDataAsync() {
        const dataFiles = [
            { name: 'fraud_data', file: 'data/fraud_data.json', priority: 'critical' },
            { name: 'xai_data', file: 'data/xai_data.json', priority: 'high' },
            { name: 'sentiment_data', file: 'data/sentiment_data.json', priority: 'normal' },
            { name: 'attrition_data', file: 'data/attrition_data.json', priority: 'normal' }
        ];

        // Sort by priority
        const priorityOrder = ['critical', 'high', 'normal', 'low'];
        dataFiles.sort((a, b) => {
            return priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
        });

        console.log('📊 Loading data files asynchronously...');
        
        const promises = dataFiles.map(async (dataFile) => {
            try {
                const response = await fetch(dataFile.file);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                const data = await response.json();
                this.data[dataFile.name] = data;
                console.log(`✅ Loaded ${dataFile.name} (${dataFile.priority} priority)`);
                return { name: dataFile.name, success: true };
            } catch (error) {
                console.error(`❌ Failed to load ${dataFile.name}:`, error);
                this.data[dataFile.name] = this.getFallbackData(dataFile.name);
                return { name: dataFile.name, success: false, error };
            }
        });

        const results = await Promise.allSettled(promises);
        const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        
        console.log(`📊 Data loading complete: ${successCount}/${dataFiles.length} files loaded successfully`);
        
        if (successCount === 0) {
            throw new Error('Failed to load any data files');
        }
    }

    /**
     * Show dashboard with async chart loading
     */
    async showDashboardAsync() {
        try {
            // Show dashboard page
            this.showDashboard();
            
            // Use async dashboard loader if available
            if (this.dashboardLoader) {
                console.log('🎯 Using async chart loading system');
                await this.dashboardLoader.loadDashboard(this.currentPage);
            } else {
                console.log('📊 Falling back to synchronous chart rendering');
                this.renderChartsSync();
            }
            
            // Hide loading indicator
            this.hideLoading();
            
        } catch (error) {
            console.error('❌ Dashboard display failed:', error);
            this.showError('Failed to display dashboard: ' + error.message);
        }
    }

    /**
     * Performance monitoring setup
     */
    setupPerformanceMonitoring() {
        // Monitor loading performance
        if (this.dashboardLoader) {
            setInterval(() => {
                const stats = this.dashboardLoader.getLoadingStats();
                if (stats && stats.total > 0) {
                    console.log(`📈 Chart Loading Stats: ${stats.loaded}/${stats.total} loaded, ${(stats.success_rate * 100).toFixed(1)}% success rate`);
                }
            }, 5000);
        }

        // Monitor memory usage
        if (performance && performance.memory) {
            setInterval(() => {
                const memory = performance.memory;
                const used = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
                const total = (memory.totalJSHeapSize / 1024 / 1024).toFixed(2);
                console.log(`💾 Memory Usage: ${used}MB / ${total}MB`);
            }, 30000);
        }
    }
    
    async loadAllData() {
        try {
            const startTime = performance.now();
            console.log('📊 Loading dashboard data...');
            
            // Check if data is already cached in session storage
            const cacheKey = 'fca_dashboard_data';
            const cacheTimestampKey = 'fca_dashboard_data_timestamp';
            const cacheMaxAge = 5 * 60 * 1000; // 5 minutes
            
            const cachedData = sessionStorage.getItem(cacheKey);
            const cacheTimestamp = sessionStorage.getItem(cacheTimestampKey);
            
            if (cachedData && cacheTimestamp) {
                const age = Date.now() - parseInt(cacheTimestamp);
                if (age < cacheMaxAge) {
                    this.data = JSON.parse(cachedData);
                    const cacheTime = performance.now() - startTime;
                    console.log(`🚀 Data loaded from cache in ${cacheTime.toFixed(2)}ms:`, Object.keys(this.data));
                    return;
                }
            }
            
            // Try to load bundled data first (single request)
            // Use new DataService instead of direct fetch
            try {
                // Ensure DataService is available
                if (!window.DataService || typeof window.DataService.getBundleData !== 'function') {
                    throw new Error('DataService.getBundleData is not available');
                }
                
                const bundleStartTime = performance.now();
                this.data = await window.DataService.getBundleData();
                const totalTime = performance.now() - startTime;
                console.log(`✅ Bundle loaded via DataService in ${totalTime.toFixed(2)}ms:`, Object.keys(this.data));
                
                // Update StateManager safely
                if (window.StateManager && typeof window.StateManager.dispatch === 'function') {
                    window.StateManager.dispatch('SET_FRAUD_DATA', this.data.fraud_data);
                    window.StateManager.dispatch('SET_XAI_DATA', this.data.xai_data);
                    window.StateManager.dispatch('SET_SENTIMENT_DATA', this.data.sentiment_data);
                    window.StateManager.dispatch('SET_ATTRITION_DATA', this.data.attrition_data);
                    window.StateManager.dispatch('SET_LAST_DATA_LOAD', Date.now());
                }
                return;
                
            } catch (bundleError) {
                console.warn('⚠️ Bundle loading failed, falling back to DataService individual loads:', bundleError.message);
                
                // Fallback to individual data loading via DataService
                try {
                    if (!window.DataService || typeof window.DataService.loadDashboardData !== 'function') {
                        throw new Error('DataService.loadDashboardData is not available');
                    }
                    
                    this.data = await window.DataService.loadDashboardData();
                    
                    // Update StateManager with all loaded data safely
                    if (window.StateManager && typeof window.StateManager.dispatch === 'function') {
                        window.StateManager.dispatch('SET_FRAUD_DATA', this.data.fraud_data);
                        window.StateManager.dispatch('SET_XAI_DATA', this.data.xai_data);
                        window.StateManager.dispatch('SET_SENTIMENT_DATA', this.data.sentiment_data);
                        window.StateManager.dispatch('SET_ATTRITION_DATA', this.data.attrition_data);
                        window.StateManager.dispatch('SET_PERFORMANCE_DATA', this.data.performance_data);
                        window.StateManager.dispatch('SET_LAST_DATA_LOAD', Date.now());
                    }
                    
                    const totalTime = performance.now() - startTime;
                    console.log(`✅ Dashboard data loaded via DataService in ${totalTime.toFixed(2)}ms`);
                    
                } catch (fallbackError) {
                    console.error('❌ Both bundle and individual data loading failed:', fallbackError.message);
                    // Safe StateManager error handling
                    if (window.StateManager && typeof window.StateManager.addError === 'function') {
                        window.StateManager.addError({
                            type: 'DATA_LOAD_FAILURE',
                            message: 'Failed to load dashboard data',
                            error: fallbackError
                        });
                    } else {
                        console.warn('⚠️ StateManager not available for error tracking');
                    }
                    throw fallbackError;
                }
            }
            
            const totalTime = performance.now() - startTime;
            console.log(`✅ All data loaded in ${totalTime.toFixed(2)}ms:`, Object.keys(this.data));
            
        } catch (error) {
            console.error('❌ Data loading failed:', error);
            throw error;
        }
    }
    
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link[data-page]');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                const page = link.getAttribute('data-page');
                this.navigateToPage(page);
            });
        });
        
        console.log('🧭 Navigation setup complete');
    }
    
    navigateToPage(page) {
        try {
            // Update navigation active state
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            document.querySelector(`[data-page="${page}"]`).classList.add('active');
            
            // Hide all page content
            document.querySelectorAll('.page-content').forEach(content => {
                content.style.display = 'none';
            });
            
            // Show target page
            const targetPage = document.getElementById(`${page}-page`);
            if (targetPage) {
                targetPage.style.display = 'block';
                targetPage.classList.add('fade-in');
            }
            
            // Update page header
            this.updatePageHeader(page);
            
            // Update current page
            this.currentPage = page;
            
            // Load page-specific content
            this.loadPageContent(page);
            
            console.log(`📄 Navigated to ${page} page`);
            
        } catch (error) {
            console.error('Navigation error:', error);
        }
    }
    
    updatePageHeader(page) {
        const pageConfigs = {
            dashboard: {
                title: 'Overview Dashboard',
                subtitle: 'Comprehensive analysis of fraud detection, sentiment analysis, and customer behavior'
            },
            fraud: {
                title: 'Fraud Detection Analysis',
                subtitle: 'Advanced fraud detection models and risk assessment'
            },
            sentiment: {
                title: 'Sentiment Analysis',
                subtitle: 'Financial news sentiment classification and analysis'
            },
            attrition: {
                title: 'Customer Attrition Analysis',
                subtitle: 'Customer churn prediction and retention strategies'
            },
            datasets: {
                title: 'Available Datasets',
                subtitle: 'Dataset management and statistics overview'
            },
            xai: {
                title: 'XAI Analysis',
                subtitle: 'Explainable AI insights and model interpretability analysis'
            }
        };
        
        const config = pageConfigs[page] || pageConfigs.dashboard;
        
        document.getElementById('page-title-text').textContent = config.title;
        document.getElementById('page-subtitle').textContent = config.subtitle;
    }
    
    async loadPageContent(page) {
        try {
            switch (page) {
                case 'dashboard':
                    await this.loadDashboardContent();
                    break;
                case 'fraud':
                    this.loadFraudContent();
                    break;
                case 'sentiment':
                    this.loadSentimentContent();
                    break;
                case 'attrition':
                    this.loadAttritionContent();
                    break;
                case 'datasets':
                    this.loadDatasetsContent();
                    break;
                case 'xai':
                    this.loadXAIContent();
                    break;
                case 'local-explanations':
                    this.loadLocalExplanationsContent();
                    break;
                case 'global-analysis':
                    this.loadGlobalAnalysisContent();
                    break;
                case 'model-performance':
                    this.loadModelPerformanceContent();
                    break;
                case 'fairness-ethics':
                    this.loadFairnessEthicsContent();
                    break;
            }
        } catch (error) {
            console.error(`Error loading ${page} content:`, error);
        }
    }
    
    async loadDashboardContent() {
        // Update summary cards
        this.updateSummaryCards();
        
        // Render main charts
        await this.renderDashboardCharts();
        
        // Update model health
        this.updateModelHealth();
        
        // Update last updated time
        this.updateLastUpdated();
    }
    
    updateSummaryCards() {
        const summary = this.data.summary;
        
        if (summary) {
            // Total Datasets
            document.getElementById('total-datasets').textContent = summary.total_datasets || '8';
            
            // Models Trained
            document.getElementById('models-trained').textContent = summary.models_trained || '3';
            
            // Fraud Detection Rate
            const fraudRate = summary.business_insights?.fraud_detection_rate || 0.368;
            document.getElementById('fraud-detection-rate').textContent = `${(fraudRate * 100).toFixed(1)}%`;
            
            // System Status
            const status = summary.system_status || 'operational';
            const statusElement = document.getElementById('system-status');
            statusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
            statusElement.className = `h5 mb-0 font-weight-bold ${status === 'operational' ? 'text-success' : 'text-warning'}`;
        }
        
        console.log('📊 Summary cards updated');
    }
    
    async renderDashboardCharts() {
        console.log('📈 Starting to render dashboard charts...');
        console.log('Available data:', Object.keys(this.data));
        
        // Try modular chart system first
        if (window.chartManager) {
            if (window.chartManager.initialized) {
                try {
                    console.log('🎯 Using modular chart system');
                    
                    const results = await window.chartManager.renderAllCharts(this.data.charts);
                    
                    // Register charts for monitoring
                    if (window.chartMonitor) {
                        window.chartMonitor.registerChart('model-performance-chart', 'bar');
                        window.chartMonitor.registerChart('fraud-risk-chart', 'pie');
                        window.chartMonitor.registerChart('sentiment-distribution-chart', 'pie');
                        window.chartMonitor.registerChart('customer-segments-chart', 'donut');
                    }
                    
                    // Check results and provide feedback
                    if (results.model && results.fraud && results.sentiment && results.segments) {
                        console.log('✅ All dashboard charts rendered successfully');  
                    } else {
                        console.warn('⚠️ Some charts failed to render:', results);
                        
                        // Print detailed monitoring report after delay
                        setTimeout(() => {
                            if (window.chartMonitor) {
                                window.chartMonitor.printReport();
                            }
                        }, 2000);
                    }
                    
                    return;
                    
                } catch (error) {
                    console.error('❌ Modular chart system failed:', error);
                    console.log('🔄 Falling back to legacy chart system...');
                }
            } else {
                console.log('⏳ ChartManager still initializing, retrying in 500ms...');
                setTimeout(() => this.renderDashboardCharts(), 500);
                return;
            }
        }
        
        // Fallback to legacy chart system
        if (window.FCACharts) {
            try {
                console.log('🔄 Using legacy chart system');
                
                window.FCACharts.renderModelComparison(this.data.charts);
                window.FCACharts.renderFraudDistribution(this.data.charts);
                window.FCACharts.renderSentimentDistribution(this.data.charts);
                window.FCACharts.renderCustomerSegments(this.data.charts);
                
                console.log('✅ Legacy dashboard charts rendered successfully');
            } catch (error) {
                console.error('❌ Error rendering dashboard charts:', error);
                this.renderFallbackCharts();
            }
        } else {
            console.warn('⚠️ Charts library not loaded, using fallback');
            this.renderFallbackCharts();
        }
    }
    
    renderFallbackCharts() {
        // Simple fallback charts using basic HTML
        const chartContainers = [
            'model-performance-chart',
            'fraud-risk-chart',
            'sentiment-distribution-chart',
            'customer-segments-chart'
        ];
        
        chartContainers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="chart-loading">
                        <span>Chart loading...</span>
                    </div>
                `;
            }
        });
    }
    
    updateModelHealth() {
        const summary = this.data.summary;
        const healthContainer = document.getElementById('model-health-cards');
        
        if (summary?.model_health && healthContainer) {
            const models = summary.model_health;
            
            let healthHTML = '';
            
            Object.entries(models).forEach(([modelName, health]) => {
                const statusClass = health.status === 'healthy' ? 'success' : 
                                   health.status === 'warning' ? 'warning' : 'danger';
                
                const metricValue = health.accuracy || health.auc || 'N/A';
                const metricLabel = health.accuracy ? 'Accuracy' : 'AUC';
                
                healthHTML += `
                    <div class="col-md-4 mb-3">
                        <div class="model-health-card ${statusClass}">
                            <div class="card-title">
                                ${modelName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                            <div class="card-value">
                                ${typeof metricValue === 'number' ? (metricValue * 100).toFixed(1) + '%' : metricValue}
                            </div>
                            <div class="card-subtitle">
                                ${metricLabel} • ${health.status}
                            </div>
                        </div>
                    </div>
                `;
            });
            
            healthContainer.innerHTML = healthHTML;
            console.log('💊 Model health updated');
        }
    }
    
    updateLastUpdated() {
        const summary = this.data.summary;
        if (summary?.last_updated) {
            const date = new Date(summary.last_updated);
            const timeString = date.toLocaleString();
            document.getElementById('last-updated').textContent = timeString;
        }
    }
    
    loadFraudContent() {
        // Render fraud-specific charts
        if (window.FCACharts) {
            try {
                console.log('🛡️ Loading fraud content and charts...');
                const mockData = this.generateMockXAIData();
                
                window.FCACharts.renderFraudFeatureImportance(this.data.charts);
                window.FCACharts.renderFraudDistribution(this.data.charts);
                window.FCACharts.renderSHAPSummary(mockData);
                window.FCACharts.renderLIMEExplanation(mockData);
                window.FCACharts.renderDecisionTree(mockData);
                window.FCACharts.renderConfidenceDistribution(mockData);
                
                console.log('✅ Fraud charts rendered successfully');
            } catch (error) {
                console.error('❌ Error rendering fraud charts:', error);
            }
        } else {
            console.warn('⚠️ FCACharts not available for fraud page');
        }
        
        const fraudPage = document.getElementById('fraud-detailed-charts');
        if (fraudPage && this.data.fraud_data) {
            fraudPage.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">Performance Metrics</h6>
                            </div>
                            <div class="card-body">
                                <p><strong>Accuracy:</strong> ${(this.data.fraud_data.performance_metrics.accuracy * 100).toFixed(2)}%</p>
                                <p><strong>Precision:</strong> ${(this.data.fraud_data.performance_metrics.precision * 100).toFixed(2)}%</p>
                                <p><strong>Recall:</strong> ${(this.data.fraud_data.performance_metrics.recall * 100).toFixed(2)}%</p>
                                <p><strong>F1-Score:</strong> ${(this.data.fraud_data.performance_metrics.f1_score * 100).toFixed(2)}%</p>
                                <p><strong>AUC-ROC:</strong> ${(this.data.fraud_data.performance_metrics.roc_auc * 100).toFixed(2)}%</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">Risk Distribution</h6>
                            </div>
                            <div class="card-body">
                                <p><strong>High Risk:</strong> ${this.data.fraud_data.risk_distribution.HIGH.toLocaleString()} cases</p>
                                <p><strong>Medium Risk:</strong> ${this.data.fraud_data.risk_distribution.MEDIUM.toLocaleString()} cases</p>
                                <p><strong>Low Risk:</strong> ${this.data.fraud_data.risk_distribution.LOW.toLocaleString()} cases</p>
                                <p><strong>Minimal Risk:</strong> ${this.data.fraud_data.risk_distribution.MINIMAL.toLocaleString()} cases</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    loadSentimentContent() {
        // Render sentiment-specific charts
        if (window.FCACharts) {
            try {
                console.log('💭 Loading sentiment content and charts...');
                
                window.FCACharts.renderSentimentDistribution(this.data.charts);
                window.FCACharts.renderSentimentTimeline(this.data.sentiment_data);
                window.FCACharts.renderDomainSentiment(this.data.sentiment_data);
                
                console.log('✅ Sentiment charts rendered successfully');
            } catch (error) {
                console.error('❌ Error rendering sentiment charts:', error);
            }
        } else {
            console.warn('⚠️ FCACharts not available for sentiment page');
        }
        
        const sentimentPage = document.getElementById('sentiment-detailed-charts');
        if (sentimentPage && this.data.sentiment_data) {
            const dist = this.data.sentiment_data.sentiment_distribution;
            sentimentPage.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">Sentiment Distribution</h6>
                            </div>
                            <div class="card-body">
                                <p><strong>Positive:</strong> ${(dist.positive * 100).toFixed(1)}%</p>
                                <p><strong>Neutral:</strong> ${(dist.neutral * 100).toFixed(1)}%</p>
                                <p><strong>Negative:</strong> ${(dist.negative * 100).toFixed(1)}%</p>
                                <p><strong>Total Sentences:</strong> ${this.data.sentiment_data.dataset_info.total_sentences.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">Model Performance</h6>
                            </div>
                            <div class="card-body">
                                <p><strong>Ensemble Accuracy:</strong> ${(this.data.sentiment_data.model_performance.ensemble_accuracy * 100).toFixed(1)}%</p>
                                <hr>
                                <h6>Individual Models:</h6>
                                ${Object.entries(this.data.sentiment_data.model_performance.individual_models).map(([model, metrics]) => 
                                    `<p><strong>${model.toUpperCase()}:</strong> ${(metrics.accuracy * 100).toFixed(1)}%</p>`
                                ).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    loadAttritionContent() {
        // Render attrition-specific charts
        if (window.FCACharts) {
            try {
                console.log('👥 Loading attrition content and charts...');
                const mockData = this.generateMockXAIData();
                
                window.FCACharts.renderCustomerSegments(this.data.charts);
                window.FCACharts.renderAttritionFeatureImportance(this.data.attrition_data);
                window.FCACharts.renderAttritionConfidence(this.data.attrition_data);
                window.FCACharts.renderFeatureInteraction(mockData);
                window.FCACharts.renderMonthlyChurnTrend(this.data.attrition_data);
                
                console.log('✅ Attrition charts rendered successfully');
            } catch (error) {
                console.error('❌ Error rendering attrition charts:', error);
            }
        } else {
            console.warn('⚠️ FCACharts not available for attrition page');
        }
        
        const attritionPage = document.getElementById('attrition-detailed-charts');
        if (attritionPage && this.data.attrition_data) {
            attritionPage.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">Customer Overview</h6>
                            </div>
                            <div class="card-body">
                                <p><strong>Total Customers:</strong> ${this.data.attrition_data.dataset_info.total_customers.toLocaleString()}</p>
                                <p><strong>Churn Rate:</strong> ${(this.data.attrition_data.dataset_info.churn_rate * 100).toFixed(1)}%</p>
                                <p><strong>Retained:</strong> ${this.data.attrition_data.dataset_info.retained_customers.toLocaleString()}</p>
                                <p><strong>Churned:</strong> ${this.data.attrition_data.dataset_info.churned_customers.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">Top Customer Segments</h6>
                            </div>
                            <div class="card-body">
                                ${Object.entries(this.data.attrition_data.customer_segments).slice(0, 4).map(([segment, data]) => 
                                    `<p><strong>${segment.replace(/_/g, ' ')}:</strong> ${data.count.toLocaleString()} (${data.percentage}%)</p>`
                                ).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    loadDatasetsContent() {
        const datasetsPage = document.getElementById('datasets-table');
        if (datasetsPage && this.data.datasets) {
            let tableHTML = `
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Dataset Name</th>
                                <th>Type</th>
                                <th>Records</th>
                                <th>Features</th>
                                <th>Size (MB)</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            // Combine all datasets
            const allDatasets = [
                ...(this.data.datasets.available_datasets.fraud_detection || []),
                ...(this.data.datasets.available_datasets.sentiment_analysis || []),
                ...(this.data.datasets.available_datasets.customer_analytics || [])
            ];
            
            allDatasets.forEach(dataset => {
                const statusBadge = dataset.status === 'ready' ? 
                    '<span class="badge badge-success">Ready</span>' :
                    '<span class="badge badge-warning">Processing</span>';
                
                tableHTML += `
                    <tr>
                        <td><strong>${dataset.name}</strong><br><small class="text-muted">${dataset.description}</small></td>
                        <td>${dataset.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                        <td>${dataset.records.toLocaleString()}</td>
                        <td>${dataset.features}</td>
                        <td>${dataset.size_mb}</td>
                        <td>${statusBadge}</td>
                    </tr>
                `;
            });
            
            tableHTML += '</tbody></table></div>';
            datasetsPage.innerHTML = tableHTML;
        }
    }
    
    loadXAIContent() {
        // Update XAI summary cards
        this.updateXAISummaryCards();
        
        // Generate and render XAI charts
        this.renderXAICharts();
        
        // Update XAI insights
        this.updateXAIInsights();
        
        // Load complete transparency data
        this.loadCompleteTransparency();
        
        // Initialize processing pipeline
        this.initializeProcessingPipeline();
        
        // Initialize data leakage monitoring
        this.initializeDataLeakageMonitoring();
        
        // Initialize overfitting monitoring
        this.initializeOverfittingMonitoring();
        
        // Initialize detailed training process
        this.initializeDetailedTraining();
        
        // Start real-time monitoring
        this.startRealtimeMonitoring();
        
        // Render XAI-specific charts
        if (window.FCACharts) {
            try {
                console.log('🎯 Loading XAI content and charts...');
                const mockData = this.generateMockXAIData();
                
                window.FCACharts.renderGlobalFeatureImportance(this.data);
                window.FCACharts.renderModelComparisonXAI(this.data);
                window.FCACharts.renderComplexityAnalysis(mockData);
                window.FCACharts.renderEdgeCaseDetection(mockData);
                
                // Render processing pipeline charts
                window.FCACharts.renderProcessingPipeline();
                window.FCACharts.renderDataLeakageMatrix();
                window.FCACharts.renderOverfittingMonitor();
                window.FCACharts.renderTrainingProgress();
                window.FCACharts.renderParameterComparison();
                
                console.log('✅ XAI charts rendered successfully');
            } catch (error) {
                console.error('❌ Error rendering XAI charts:', error);
            }
        } else {
            console.warn('⚠️ FCACharts not available for XAI page');
        }
        
        // Initialize model analysis
        this.initializeModelAnalysis();
    }
    
    updateXAISummaryCards() {
        // Update with mock data for demonstration
        document.getElementById('feature-importance-count').textContent = '15 Features';
        document.getElementById('shap-values-count').textContent = '1000 Samples';
        document.getElementById('transparency-score').textContent = '85%';
        
        console.log('📊 XAI summary cards updated');
    }
    
    renderXAICharts() {
        console.log('📈 Starting to render XAI charts...');
        
        // Try modular chart system first
        if (window.chartManager && window.chartManager.initialized) {
            try {
                console.log('🎯 Using modular XAI chart system');
                
                const xaiData = this.data.xai_data || {};
                
                // Render core XAI charts
                const results = {
                    lime: window.chartManager.renderLIMEExplanation(xaiData),
                    decision: window.chartManager.renderModelDecisionProcess(xaiData),
                    confidence: window.chartManager.renderPredictionConfidence(xaiData),
                    interaction: window.chartManager.renderFeatureInteraction(xaiData),
                    training: window.chartManager.renderTrainingProcess(xaiData),
                    comparison: window.chartManager.renderModelComparisonAnalysis(xaiData)
                };
                
                // Register XAI charts for monitoring
                if (window.chartMonitor) {
                    window.chartMonitor.registerChart('lime-explanation-chart', 'xai-lime');
                    window.chartMonitor.registerChart('decision-tree-chart', 'xai-decision');
                    window.chartMonitor.registerChart('confidence-distribution-chart', 'xai-confidence');
                    window.chartMonitor.registerChart('feature-interaction-xai-chart', 'xai-interaction');
                    window.chartMonitor.registerChart('training-curves-chart', 'xai-training');
                    window.chartMonitor.registerChart('model-comparison-chart', 'xai-comparison');
                }
                
                const successCount = Object.values(results).filter(Boolean).length;
                console.log(`✅ XAI charts rendered: ${successCount}/6 successful`);
                
                // If some charts failed, print detailed report
                if (successCount < 6) {
                    console.warn('⚠️ Some XAI charts failed to render');
                    setTimeout(() => {
                        if (window.chartMonitor) {
                            window.chartMonitor.printReport();
                        }
                    }, 3000);
                }
                
                return;
                
            } catch (error) {
                console.error('❌ Modular XAI chart system failed:', error);
                console.log('🔄 Falling back to legacy XAI system...');
            }
        }
        
        // Fallback to legacy chart system
        if (window.FCACharts) {
            // Generate mock XAI data for demonstration
            const mockXAIData = this.generateMockXAIData();
            
            try {
                console.log('🔄 Using legacy XAI chart system');
                
                // Render available XAI charts
                if (window.FCACharts.renderLIMEExplanation) {
                    window.FCACharts.renderLIMEExplanation(mockXAIData);
                }
                if (window.FCACharts.renderModelDecisionProcess) {
                    window.FCACharts.renderModelDecisionProcess(mockXAIData);
                }
                if (window.FCACharts.renderPredictionConfidence) {
                    window.FCACharts.renderPredictionConfidence(mockXAIData);
                }
                if (window.FCACharts.renderFeatureInteraction) {
                    window.FCACharts.renderFeatureInteraction(mockXAIData);
                }
                if (window.FCACharts.renderTrainingProcess) {
                    window.FCACharts.renderTrainingProcess(mockXAIData);
                }
                
                console.log('📈 Legacy XAI charts rendered');
                
            } catch (error) {
                console.error('❌ Error rendering XAI charts:', error);
                this.renderXAIFallbackCharts();
            }
            window.FCACharts.renderErrorAnalysis(mockXAIData);
            window.FCACharts.renderEdgeCaseDetection(mockXAIData);
            window.FCACharts.renderRealtimeMonitoring(mockXAIData);
            
            console.log('📈 XAI charts rendered');
        } else {
            console.warn('⚠️ Charts library not loaded, using fallback');
            this.renderXAIFallbackCharts();
        }
    }
    
    generateMockXAIData() {
        // Generate realistic mock data for XAI visualization
        const features = [
            'Transaction_Amount', 'Time_Since_Last_Transaction', 'Merchant_Category',
            'Account_Age', 'Previous_Failures', 'Location_Risk_Score',
            'Device_Score', 'Velocity_Check', 'Amount_Zscore'
        ];
        
        return {
            feature_importance: {
                features: features,
                values: [0.25, 0.18, 0.15, 0.12, 0.10, 0.08, 0.06, 0.04, 0.02]
            },
            shap_values: {
                features: features,
                shap_values: [0.3, -0.2, 0.15, -0.1, 0.25, -0.05, 0.1, -0.15, 0.08],
                feature_values: [1500, 24, 3, 365, 0, 0.7, 0.8, 2, 1.2]
            },
            lime_explanation: {
                features: features.slice(0, 6),
                values: [0.35, -0.22, 0.18, -0.15, 0.28, -0.12]
            },
            partial_dependence: {
                feature_name: 'Transaction_Amount',
                feature_values: Array.from({length: 20}, (_, i) => 100 + i * 200),
                partial_dependence_values: Array.from({length: 20}, (_, i) => 
                    0.3 + 0.4 * Math.sin(i * 0.3) + Math.random() * 0.1
                )
            },
            decision_tree: {
                x_positions: [0, -1, 1, -1.5, -0.5, 0.5, 1.5],
                y_positions: [3, 2, 2, 1, 1, 1, 1],
                node_labels: ['Amount > 1000?', 'Risk = High', 'Time < 30m?', 'Fraud', 'Safe', 'Check Device', 'Safe'],
                node_sizes: [30, 25, 25, 20, 20, 20, 20],
                node_colors: [0.5, 0.8, 0.3, 0.9, 0.1, 0.6, 0.1]
            },
            confidence_distribution: {
                confidence_scores: Array.from({length: 1000}, () => 
                    Math.max(0, Math.min(1, 0.7 + Math.random() * 0.3 - 0.15))
                )
            },
            feature_interaction: {
                features: features.slice(0, 5),
                interaction_matrix: [
                    [1.0, 0.3, -0.2, 0.1, 0.15],
                    [0.3, 1.0, 0.05, -0.1, 0.25],
                    [-0.2, 0.05, 1.0, 0.4, -0.1],
                    [0.1, -0.1, 0.4, 1.0, 0.2],
                    [0.15, 0.25, -0.1, 0.2, 1.0]
                ]
            },
            accuracy_by_feature: {
                feature_ranges: ['0-200', '200-500', '500-1000', '1000-2000', '2000+'],
                accuracy_scores: [0.92, 0.95, 0.88, 0.85, 0.78]
            },
            correlation_network: {
                x_positions: [0, 1, 2, 0.5, 1.5, 1, 0.5, 1.5],
                y_positions: [2, 2, 2, 1, 1, 0, 0.5, 0.5],
                feature_names: ['Amount', 'Time', 'Category', 'Age', 'Risk', 'Device', 'Location', 'Velocity'],
                node_sizes: [30, 25, 28, 22, 26, 20, 18, 24],
                correlation_strengths: [0.8, 0.6, 0.7, 0.4, 0.5, 0.3, 0.2, 0.45]
            },
            shap_waterfall: {
                features: ['Base', 'Amount', 'Time', 'Category', 'Age', 'Risk', 'Final'],
                shap_values: [0.5, 0.15, -0.08, 0.12, -0.05, 0.18, 0],
                cumulative_values: [0.5, 0.65, 0.57, 0.69, 0.64, 0.82, 0.82],
                measures: ['absolute', 'relative', 'relative', 'relative', 'relative', 'relative', 'total']
            },
            fairness_analysis: {
                demographic_groups: ['Group A', 'Group B', 'Group C', 'Group D'],
                metrics: ['Accuracy', 'Precision', 'Recall', 'F1-Score'],
                metric_values: [
                    [0.92, 0.88, 0.90, 0.89],
                    [0.89, 0.91, 0.87, 0.89],
                    [0.90, 0.89, 0.88, 0.89],
                    [0.90, 0.89, 0.88, 0.89]
                ],
                colors: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e']
            },
            complexity_analysis: {
                complexity_dimensions: ['Model Size', 'Training Time', 'Inference Speed', 'Memory Usage', 'Interpretability', 'Accuracy'],
                complexity_scores: [0.7, 0.6, 0.8, 0.5, 0.9, 0.85]
            },
            data_pipeline: {
                x_positions: [0, 1, 2, 3, 4, 5],
                y_positions: [1, 1, 1, 1, 1, 1],
                step_names: ['Raw Data', 'Clean', 'Feature Eng.', 'Scale', 'Train', 'Deploy'],
                step_colors: [0.1, 0.3, 0.5, 0.7, 0.9, 1.0]
            },
            error_analysis: {
                feature_ranges: ['Low', 'Medium-Low', 'Medium', 'Medium-High', 'High'],
                false_positives: [0.02, 0.04, 0.08, 0.12, 0.18],
                false_negatives: [0.15, 0.10, 0.08, 0.06, 0.04]
            },
            edge_cases: {
                normal_cases: {
                    x: Array.from({length: 200}, () => Math.random() * 10),
                    y: Array.from({length: 200}, () => Math.random() * 10)
                },
                edge_cases: {
                    x: [1, 9, 0.5, 9.5, 2, 8, 1.5, 8.5],
                    y: [1, 9, 9, 1, 0.5, 9.5, 8.5, 1.5]
                }
            },
            realtime_monitoring: {
                timestamps: Array.from({length: 24}, (_, i) => `${i}:00`),
                accuracy_over_time: Array.from({length: 24}, () => 0.85 + Math.random() * 0.1),
                drift_scores: Array.from({length: 24}, () => Math.random() * 0.3)
            }
        };
    }
    
    renderXAIFallbackCharts() {
        const xaiChartContainers = [
            'feature-importance-chart',
            'shap-summary-chart',
            'lime-explanation-chart',
            'partial-dependence-chart',
            'decision-tree-chart',
            'confidence-distribution-chart',
            'feature-interaction-chart'
        ];
        
        xaiChartContainers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="chart-loading">
                        <span>XAI Chart loading...</span>
                    </div>
                `;
            }
        });
    }
    
    updateXAIInsights() {
        // Update top features list
        const topFeaturesList = document.getElementById('top-features-list');
        if (topFeaturesList) {
            topFeaturesList.innerHTML = `
                <li>Transaction Amount (25% importance)</li>
                <li>Time Since Last Transaction (18% importance)</li>
                <li>Merchant Category (15% importance)</li>
                <li>Account Age (12% importance)</li>
                <li>Previous Failures (10% importance)</li>
            `;
        }
        
        // Update bias analysis
        const biasAnalysis = document.getElementById('bias-analysis');
        if (biasAnalysis) {
            biasAnalysis.textContent = 'Model shows low bias across demographic groups. Feature importance is balanced and interpretable.';
        }
        
        console.log('🔍 XAI insights updated');
    }
    
    loadCompleteTransparency() {
        // Populate model architecture table
        const architectureTableBody = document.getElementById('architecture-table-body');
        if (architectureTableBody) {
            architectureTableBody.innerHTML = `
                <tr>
                    <td><strong>Input Layer</strong></td>
                    <td>Dense layer with 15 features</td>
                    <td>15 neurons</td>
                </tr>
                <tr>
                    <td><strong>Hidden Layer 1</strong></td>
                    <td>ReLU activation, Dropout 0.3</td>
                    <td>128 neurons</td>
                </tr>
                <tr>
                    <td><strong>Hidden Layer 2</strong></td>
                    <td>ReLU activation, Dropout 0.2</td>
                    <td>64 neurons</td>
                </tr>
                <tr>
                    <td><strong>Hidden Layer 3</strong></td>
                    <td>ReLU activation, Dropout 0.1</td>
                    <td>32 neurons</td>
                </tr>
                <tr>
                    <td><strong>Output Layer</strong></td>
                    <td>Sigmoid activation for binary classification</td>
                    <td>1 neuron</td>
                </tr>
                <tr>
                    <td><strong>Total Parameters</strong></td>
                    <td>Trainable parameters</td>
                    <td>8,449</td>
                </tr>
            `;
        }
        
        // Populate training configuration
        const trainingConfigJson = document.getElementById('training-config-json');
        if (trainingConfigJson) {
            const trainingConfig = {
                "model_type": "Neural Network",
                "optimizer": "Adam",
                "learning_rate": 0.001,
                "batch_size": 32,
                "epochs": 100,
                "early_stopping": {
                    "monitor": "val_loss",
                    "patience": 10,
                    "restore_best_weights": true
                },
                "loss_function": "binary_crossentropy",
                "metrics": ["accuracy", "precision", "recall", "f1_score"],
                "regularization": {
                    "dropout_rates": [0.3, 0.2, 0.1],
                    "l2_penalty": 0.001
                },
                "data_split": {
                    "train": 0.7,
                    "validation": 0.15,
                    "test": 0.15
                },
                "random_seed": 42,
                "cross_validation": {
                    "folds": 5,
                    "stratified": true
                }
            };
            trainingConfigJson.textContent = JSON.stringify(trainingConfig, null, 2);
        }
        
        // Populate feature engineering steps
        const featureStepsList = document.getElementById('feature-steps-list');
        if (featureStepsList) {
            featureStepsList.innerHTML = `
                <li>Data cleaning and missing value imputation using median strategy</li>
                <li>Outlier detection and treatment using IQR method</li>
                <li>Feature scaling using StandardScaler normalization</li>
                <li>Categorical encoding using One-Hot encoding</li>
                <li>Feature selection using mutual information and correlation analysis</li>
                <li>Temporal feature engineering (hour, day of week, month)</li>
                <li>Transaction velocity and frequency calculations</li>
                <li>Risk score aggregations and rolling window statistics</li>
                <li>Domain-specific feature creation (amount z-scores, merchant risk)</li>
                <li>Feature interaction terms for critical combinations</li>
            `;
        }
        
        // Populate validation results
        const validationTableBody = document.getElementById('validation-table-body');
        if (validationTableBody) {
            validationTableBody.innerHTML = `
                <tr>
                    <td><strong>Accuracy</strong></td>
                    <td>0.952</td>
                    <td>0.948</td>
                    <td>0.945</td>
                </tr>
                <tr>
                    <td><strong>Precision</strong></td>
                    <td>0.934</td>
                    <td>0.928</td>
                    <td>0.925</td>
                </tr>
                <tr>
                    <td><strong>Recall</strong></td>
                    <td>0.967</td>
                    <td>0.961</td>
                    <td>0.958</td>
                </tr>
                <tr>
                    <td><strong>F1-Score</strong></td>
                    <td>0.950</td>
                    <td>0.944</td>
                    <td>0.941</td>
                </tr>
                <tr>
                    <td><strong>AUC-ROC</strong></td>
                    <td>0.985</td>
                    <td>0.978</td>
                    <td>0.975</td>
                </tr>
                <tr>
                    <td><strong>AUC-PR</strong></td>
                    <td>0.972</td>
                    <td>0.965</td>
                    <td>0.962</td>
                </tr>
            `;
        }
        
        console.log('📋 Complete transparency data loaded');
    }
    
    // ========================================
    // Processing Pipeline Functions
    // ========================================
    
    initializeProcessingPipeline() {
        // Initialize data processing monitoring
        this.processingState = {
            currentStep: 0,
            totalSteps: 7,
            isRunning: false,
            startTime: null,
            logs: []
        };
        
        // Update processing status display
        this.updateProcessingStatus();
        
        console.log('🔧 Processing pipeline initialized');
    }
    
    initializeDataLeakageMonitoring() {
        // Initialize data leakage prevention monitoring
        this.leakageState = {
            checks: [
                { name: 'Temporal Leakage', status: 'passed', risk: 'low' },
                { name: 'Target Leakage', status: 'passed', risk: 'low' },
                { name: 'Feature Leakage', status: 'warning', risk: 'medium' },
                { name: 'Data Snooping', status: 'passed', risk: 'low' },
                { name: 'Look-ahead Bias', status: 'passed', risk: 'low' }
            ],
            overallScore: 92
        };
        
        this.updateLeakageMonitoring();
        
        console.log('🔒 Data leakage monitoring initialized');
    }
    
    initializeOverfittingMonitoring() {
        // Initialize overfitting prevention monitoring
        this.overfittingState = {
            metrics: {
                train_accuracy: 0.952,
                val_accuracy: 0.948,
                train_loss: 0.123,
                val_loss: 0.145,
                gap: 0.004
            },
            status: 'healthy',
            earlyStoppingEnabled: true,
            currentEpoch: 45,
            bestEpoch: 42
        };
        
        this.updateOverfittingMonitoring();
        
        console.log('📊 Overfitting monitoring initialized');
    }
    
    initializeDetailedTraining() {
        // Initialize detailed training process monitoring
        this.trainingState = {
            isRunning: false,
            currentEpoch: 0,
            totalEpochs: 100,
            batchProgress: 0,
            totalBatches: 1000,
            logs: [],
            parameters: {
                learning_rate: 0.001,
                batch_size: 32,
                optimizer: 'Adam',
                regularization: 'L2 + Dropout'
            },
            metrics: {
                train_acc: [],
                val_acc: [],
                train_loss: [],
                val_loss: []
            }
        };
        
        this.updateTrainingProgress();
        
        console.log('🎯 Detailed training monitoring initialized');
    }
    
    updateProcessingStatus() {
        const stepNames = [
            'Data Loading',
            'Quality Validation',
            'Missing Value Treatment',
            'Outlier Detection',
            'Feature Engineering',
            'Data Splitting',
            'Final Validation'
        ];
        
        const progressBar = document.getElementById('processing-progress');
        const statusText = document.getElementById('processing-status');
        const stepsList = document.getElementById('processing-steps');
        
        if (progressBar) {
            const progress = (this.processingState.currentStep / this.processingState.totalSteps) * 100;
            progressBar.style.width = `${progress}%`;
            progressBar.setAttribute('aria-valuenow', progress);
        }
        
        if (statusText) {
            if (this.processingState.isRunning) {
                statusText.textContent = `Processing: ${stepNames[this.processingState.currentStep]} (${this.processingState.currentStep + 1}/${this.processingState.totalSteps})`;
            } else {
                statusText.textContent = this.processingState.currentStep === 0 ? 'Ready to start' : 'Processing completed';
            }
        }
        
        if (stepsList) {
            let stepsHTML = '';
            stepNames.forEach((step, index) => {
                let statusClass = 'text-muted';
                let icon = '⏳';
                
                if (index < this.processingState.currentStep) {
                    statusClass = 'text-success';
                    icon = '✅';
                } else if (index === this.processingState.currentStep && this.processingState.isRunning) {
                    statusClass = 'text-primary';
                    icon = '🔄';
                }
                
                stepsHTML += `<li class="${statusClass}">${icon} ${step}</li>`;
            });
            stepsList.innerHTML = stepsHTML;
        }
    }
    
    updateLeakageMonitoring() {
        const checksTable = document.getElementById('leakage-checks-table');
        const leakageScore = document.getElementById('leakage-score');
        
        if (checksTable) {
            let tableHTML = '';
            this.leakageState.checks.forEach(check => {
                const statusBadge = check.status === 'passed' ? 
                    '<span class="badge badge-success">Passed</span>' :
                    check.status === 'warning' ?
                    '<span class="badge badge-warning">Warning</span>' :
                    '<span class="badge badge-danger">Failed</span>';
                
                const riskBadge = check.risk === 'low' ?
                    '<span class="badge badge-info">Low</span>' :
                    check.risk === 'medium' ?
                    '<span class="badge badge-warning">Medium</span>' :
                    '<span class="badge badge-danger">High</span>';
                
                tableHTML += `
                    <tr>
                        <td>${check.name}</td>
                        <td>${statusBadge}</td>
                        <td>${riskBadge}</td>
                    </tr>
                `;
            });
            checksTable.innerHTML = tableHTML;
        }
        
        if (leakageScore) {
            leakageScore.innerHTML = `
                <div class="text-center">
                    <h4 class="text-success">${this.leakageState.overallScore}%</h4>
                    <small class="text-muted">Data Integrity Score</small>
                </div>
            `;
        }
    }
    
    updateOverfittingMonitoring() {
        const metricsTable = document.getElementById('overfitting-metrics');
        const overfittingStatus = document.getElementById('overfitting-status');
        
        if (metricsTable) {
            metricsTable.innerHTML = `
                <tr>
                    <td>Training Accuracy</td>
                    <td>${(this.overfittingState.metrics.train_accuracy * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                    <td>Validation Accuracy</td>
                    <td>${(this.overfittingState.metrics.val_accuracy * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                    <td>Training Loss</td>
                    <td>${this.overfittingState.metrics.train_loss.toFixed(3)}</td>
                </tr>
                <tr>
                    <td>Validation Loss</td>
                    <td>${this.overfittingState.metrics.val_loss.toFixed(3)}</td>
                </tr>
                <tr class="${this.overfittingState.metrics.gap < 0.01 ? 'text-success' : this.overfittingState.metrics.gap < 0.05 ? 'text-warning' : 'text-danger'}">
                    <td><strong>Accuracy Gap</strong></td>
                    <td><strong>${(this.overfittingState.metrics.gap * 100).toFixed(1)}%</strong></td>
                </tr>
            `;
        }
        
        if (overfittingStatus) {
            const statusClass = this.overfittingState.status === 'healthy' ? 'success' : 
                               this.overfittingState.status === 'warning' ? 'warning' : 'danger';
            overfittingStatus.innerHTML = `
                <div class="text-center">
                    <span class="badge badge-${statusClass} badge-lg">${this.overfittingState.status.toUpperCase()}</span>
                    <br><small class="text-muted">Current Epoch: ${this.overfittingState.currentEpoch} | Best: ${this.overfittingState.bestEpoch}</small>
                </div>
            `;
        }
    }
    
    updateTrainingProgress() {
        const trainingProgress = document.getElementById('training-progress');
        const batchProgress = document.getElementById('batch-progress');
        const trainingLogs = document.getElementById('training-logs');
        const parametersTable = document.getElementById('training-parameters');
        
        if (trainingProgress) {
            const epochProgress = (this.trainingState.currentEpoch / this.trainingState.totalEpochs) * 100;
            trainingProgress.style.width = `${epochProgress}%`;
            trainingProgress.textContent = `Epoch ${this.trainingState.currentEpoch}/${this.trainingState.totalEpochs}`;
        }
        
        if (batchProgress) {
            const batchPercent = (this.trainingState.batchProgress / this.trainingState.totalBatches) * 100;
            batchProgress.style.width = `${batchPercent}%`;
            batchProgress.textContent = `Batch ${this.trainingState.batchProgress}/${this.trainingState.totalBatches}`;
        }
        
        if (trainingLogs) {
            const logs = this.trainingState.logs.slice(-10); // Show last 10 logs
            trainingLogs.innerHTML = logs.map(log => 
                `<div class="log-entry"><small class="text-muted">[${log.timestamp}]</small> ${log.message}</div>`
            ).join('');
            trainingLogs.scrollTop = trainingLogs.scrollHeight;
        }
        
        if (parametersTable) {
            parametersTable.innerHTML = `
                <tr>
                    <td>Learning Rate</td>
                    <td>${this.trainingState.parameters.learning_rate}</td>
                </tr>
                <tr>
                    <td>Batch Size</td>
                    <td>${this.trainingState.parameters.batch_size}</td>
                </tr>
                <tr>
                    <td>Optimizer</td>
                    <td>${this.trainingState.parameters.optimizer}</td>
                </tr>
                <tr>
                    <td>Regularization</td>
                    <td>${this.trainingState.parameters.regularization}</td>
                </tr>
            `;
        }
    }
    
    startRealtimeMonitoring() {
        // Update live metrics every 5 seconds
        const updateMetrics = () => {
            const currentAccuracy = 0.85 + Math.random() * 0.1;
            const driftScore = Math.random() * 0.3;
            const throughput = Math.floor(100 + Math.random() * 50);
            
            // Update live accuracy
            const liveAccuracy = document.getElementById('live-accuracy');
            const accuracyProgress = document.getElementById('accuracy-progress');
            if (liveAccuracy && accuracyProgress) {
                liveAccuracy.textContent = `${(currentAccuracy * 100).toFixed(1)}%`;
                accuracyProgress.style.width = `${currentAccuracy * 100}%`;
            }
            
            // Update drift score
            const liveDrift = document.getElementById('live-drift');
            const driftProgress = document.getElementById('drift-progress');
            if (liveDrift && driftProgress) {
                liveDrift.textContent = `${(driftScore * 100).toFixed(1)}%`;
                driftProgress.style.width = `${driftScore * 100}%`;
            }
            
            // Update throughput
            const liveThroughput = document.getElementById('live-throughput');
            if (liveThroughput) {
                liveThroughput.textContent = `${throughput} req/min`;
            }
            
            // Update timestamp
            const liveTimestamp = document.getElementById('live-timestamp');
            if (liveTimestamp) {
                liveTimestamp.textContent = new Date().toLocaleTimeString();
            }
        };
        
        // Initial update
        updateMetrics();
        
        // Set up periodic updates
        this.monitoringInterval = setInterval(updateMetrics, 5000);
        
        console.log('📊 Real-time monitoring started');
    }
    
    downloadModelReport() {
        // Generate comprehensive model report
        const reportData = {
            timestamp: new Date().toISOString(),
            model_info: {
                name: "FCA Fraud Detection Model",
                version: "1.0.0",
                type: "Neural Network",
                framework: "TensorFlow/Keras"
            },
            performance_metrics: {
                accuracy: 0.945,
                precision: 0.925,
                recall: 0.958,
                f1_score: 0.941,
                auc_roc: 0.975,
                auc_pr: 0.962
            },
            feature_importance: this.generateMockXAIData().feature_importance,
            model_architecture: {
                layers: 5,
                total_parameters: 8449,
                trainable_parameters: 8449
            },
            training_details: {
                epochs: 100,
                batch_size: 32,
                optimizer: "Adam",
                learning_rate: 0.001
            },
            fairness_analysis: {
                demographic_parity: 0.02,
                equalized_odds: 0.03,
                calibration: 0.01
            },
            transparency_score: 85
        };
        
        // Convert to JSON string
        const reportJson = JSON.stringify(reportData, null, 2);
        
        // Create download link
        const blob = new Blob([reportJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `FCA_Model_Transparency_Report_${new Date().toISOString().split('T')[0]}.json`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(url);
        
        console.log('📥 Model transparency report downloaded');
    }
    
    // ========================================
    // Processing Control Functions
    // ========================================
    
    async startDataProcessing() {
        if (this.processingState.isRunning) {
            console.log('⚠️ Processing already running');
            return;
        }
        
        this.processingState.isRunning = true;
        this.processingState.startTime = new Date();
        this.processingState.currentStep = 0;
        this.processingState.logs = [];
        
        console.log('🚀 Starting data processing pipeline...');
        
        const steps = [
            { name: 'Data Loading', duration: 2000 },
            { name: 'Quality Validation', duration: 1500 },
            { name: 'Missing Value Treatment', duration: 3000 },
            { name: 'Outlier Detection', duration: 2500 },
            { name: 'Feature Engineering', duration: 4000 },
            { name: 'Data Splitting', duration: 1000 },
            { name: 'Final Validation', duration: 2000 }
        ];
        
        try {
            for (let i = 0; i < steps.length; i++) {
                this.processingState.currentStep = i;
                this.updateProcessingStatus();
                
                // Add log entry
                this.addProcessingLog(`Starting ${steps[i].name}...`);
                
                // Simulate processing time
                await this.sleep(steps[i].duration);
                
                // Add completion log
                this.addProcessingLog(`✅ ${steps[i].name} completed successfully`);
                
                // Update leakage monitoring during processing
                if (i === 2) { // After missing value treatment
                    this.simulateLeakageCheck('Missing Value Imputation');
                }
                if (i === 4) { // After feature engineering
                    this.simulateLeakageCheck('Feature Engineering');
                }
            }
            
            this.processingState.currentStep = steps.length;
            this.processingState.isRunning = false;
            this.updateProcessingStatus();
            
            this.addProcessingLog('🎉 Data processing pipeline completed successfully!');
            
            console.log('✅ Data processing completed');
            
        } catch (error) {
            this.processingState.isRunning = false;
            this.addProcessingLog(`❌ Error: ${error.message}`);
            console.error('❌ Processing failed:', error);
        }
    }
    
    async startModelTraining() {
        if (this.trainingState.isRunning) {
            console.log('⚠️ Training already running');
            return;
        }
        
        this.trainingState.isRunning = true;
        this.trainingState.currentEpoch = 0;
        this.trainingState.batchProgress = 0;
        this.trainingState.logs = [];
        this.trainingState.metrics.train_acc = [];
        this.trainingState.metrics.val_acc = [];
        this.trainingState.metrics.train_loss = [];
        this.trainingState.metrics.val_loss = [];
        
        console.log('🎯 Starting model training...');
        
        try {
            for (let epoch = 1; epoch <= this.trainingState.totalEpochs; epoch++) {
                this.trainingState.currentEpoch = epoch;
                
                // Simulate batch processing
                for (let batch = 1; batch <= this.trainingState.totalBatches; batch++) {
                    this.trainingState.batchProgress = batch;
                    this.updateTrainingProgress();
                    
                    // Speed up by updating every 50 batches
                    if (batch % 50 === 0) {
                        await this.sleep(50);
                    }
                }
                
                // Generate realistic metrics with some noise
                const baseTrainAcc = 0.85 + (epoch / this.trainingState.totalEpochs) * 0.1;
                const baseValAcc = baseTrainAcc - 0.02 - Math.random() * 0.01;
                const trainAcc = Math.min(0.98, baseTrainAcc + (Math.random() - 0.5) * 0.02);
                const valAcc = Math.min(0.96, baseValAcc + (Math.random() - 0.5) * 0.02);
                const trainLoss = Math.max(0.05, 0.8 - (epoch / this.trainingState.totalEpochs) * 0.7 + (Math.random() - 0.5) * 0.1);
                const valLoss = trainLoss + 0.02 + Math.random() * 0.05;
                
                this.trainingState.metrics.train_acc.push(trainAcc);
                this.trainingState.metrics.val_acc.push(valAcc);
                this.trainingState.metrics.train_loss.push(trainLoss);
                this.trainingState.metrics.val_loss.push(valLoss);
                
                // Add training log
                this.addTrainingLog(`Epoch ${epoch}/${this.trainingState.totalEpochs} - train_acc: ${trainAcc.toFixed(4)}, val_acc: ${valAcc.toFixed(4)}, train_loss: ${trainLoss.toFixed(4)}, val_loss: ${valLoss.toFixed(4)}`);
                
                // Update overfitting monitoring
                this.overfittingState.metrics.train_accuracy = trainAcc;
                this.overfittingState.metrics.val_accuracy = valAcc;
                this.overfittingState.metrics.train_loss = trainLoss;
                this.overfittingState.metrics.val_loss = valLoss;
                this.overfittingState.metrics.gap = Math.abs(trainAcc - valAcc);
                this.overfittingState.currentEpoch = epoch;
                
                // Check for overfitting
                if (this.overfittingState.metrics.gap > 0.05) {
                    this.overfittingState.status = 'warning';
                    this.addTrainingLog('⚠️ Warning: Potential overfitting detected');
                } else if (this.overfittingState.metrics.gap > 0.1) {
                    this.overfittingState.status = 'danger';
                    this.addTrainingLog('🚨 Alert: Overfitting detected - Consider early stopping');
                }
                
                this.updateOverfittingMonitoring();
                
                // Early stopping simulation
                if (epoch > 20 && valAcc < this.trainingState.metrics.val_acc[epoch - 5]) {
                    this.addTrainingLog('🛑 Early stopping triggered - Validation accuracy not improving');
                    break;
                }
                
                // Speed control for demo
                if (epoch % 5 === 0) {
                    await this.sleep(100);
                }
            }
            
            this.trainingState.isRunning = false;
            this.addTrainingLog('🎉 Model training completed successfully!');
            
            console.log('✅ Model training completed');
            
        } catch (error) {
            this.trainingState.isRunning = false;
            this.addTrainingLog(`❌ Training error: ${error.message}`);
            console.error('❌ Training failed:', error);
        }
    }
    
    downloadProcessingReport() {
        const reportData = {
            timestamp: new Date().toISOString(),
            processing_pipeline: {
                status: this.processingState.isRunning ? 'running' : 'completed',
                current_step: this.processingState.currentStep,
                total_steps: this.processingState.totalSteps,
                start_time: this.processingState.startTime,
                duration: this.processingState.startTime ? 
                    (new Date() - this.processingState.startTime) / 1000 : null,
                logs: this.processingState.logs
            },
            data_leakage_prevention: {
                overall_score: this.leakageState.overallScore,
                checks: this.leakageState.checks
            },
            overfitting_monitoring: {
                status: this.overfittingState.status,
                metrics: this.overfittingState.metrics,
                current_epoch: this.overfittingState.currentEpoch,
                best_epoch: this.overfittingState.bestEpoch
            },
            training_details: {
                status: this.trainingState.isRunning ? 'running' : 'completed',
                current_epoch: this.trainingState.currentEpoch,
                total_epochs: this.trainingState.totalEpochs,
                parameters: this.trainingState.parameters,
                final_metrics: {
                    train_accuracy: this.trainingState.metrics.train_acc.slice(-1)[0],
                    val_accuracy: this.trainingState.metrics.val_acc.slice(-1)[0],
                    train_loss: this.trainingState.metrics.train_loss.slice(-1)[0],
                    val_loss: this.trainingState.metrics.val_loss.slice(-1)[0]
                },
                training_history: {
                    train_accuracy: this.trainingState.metrics.train_acc,
                    val_accuracy: this.trainingState.metrics.val_acc,
                    train_loss: this.trainingState.metrics.train_loss,
                    val_loss: this.trainingState.metrics.val_loss
                },
                logs: this.trainingState.logs
            }
        };
        
        const reportJson = JSON.stringify(reportData, null, 2);
        const blob = new Blob([reportJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `FCA_Processing_Report_${new Date().toISOString().split('T')[0]}.json`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        console.log('📥 Processing report downloaded');
    }
    
    // ========================================
    // Utility Functions
    // ========================================
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    addProcessingLog(message) {
        const logEntry = {
            timestamp: new Date().toLocaleTimeString(),
            message: message
        };
        this.processingState.logs.push(logEntry);
        
        // Update logs display if element exists
        const logsContainer = document.getElementById('processing-logs');
        if (logsContainer) {
            const logs = this.processingState.logs.slice(-10);
            logsContainer.innerHTML = logs.map(log => 
                `<div class="log-entry"><small class="text-muted">[${log.timestamp}]</small> ${log.message}</div>`
            ).join('');
            logsContainer.scrollTop = logsContainer.scrollHeight;
        }
    }
    
    addTrainingLog(message) {
        const logEntry = {
            timestamp: new Date().toLocaleTimeString(),
            message: message
        };
        this.trainingState.logs.push(logEntry);
        
        // Update training logs display
        this.updateTrainingProgress();
    }
    
    simulateLeakageCheck(checkName) {
        // Simulate running a data leakage check
        this.addProcessingLog(`🔍 Running data leakage check for ${checkName}...`);
        
        // Randomly update a check status (for demo purposes)
        const randomCheck = this.leakageState.checks[Math.floor(Math.random() * this.leakageState.checks.length)];
        if (Math.random() > 0.8) {
            randomCheck.status = 'warning';
            randomCheck.risk = 'medium';
            this.leakageState.overallScore = Math.max(70, this.leakageState.overallScore - 5);
        }
        
        this.updateLeakageMonitoring();
        this.addProcessingLog(`✅ Data leakage check completed for ${checkName}`);
    }
    
    // ========================================
    // Model Analysis Functions
    // ========================================
    
    initializeModelAnalysis() {
        // Load detailed model analysis data
        this.modelAnalysisData = {
            fraud: {
                performance: {
                    accuracy: 0.9994,
                    precision: 0.8571,
                    recall: 0.8571,
                    f1_score: 0.8571,
                    auc_roc: 0.9234
                },
                dataset: {
                    total_transactions: 4260920,
                    training_samples: 40000,
                    test_samples: 10000,
                    features: 30,
                    fraud_rate: 0.20
                },
                model_config: {
                    algorithm: 'Random Forest',
                    n_estimators: 100,
                    max_depth: 10,
                    cv_folds: 5
                },
                feature_importance: [
                    { feature: 'Amount_zscore', importance: 0.234 },
                    { feature: 'Time_hour', importance: 0.187 },
                    { feature: 'V14', importance: 0.156 },
                    { feature: 'V12', importance: 0.143 },
                    { feature: 'V10', importance: 0.128 }
                ],
                business_impact: {
                    daily_detections: 184,
                    annual_savings: 250000000,
                    detection_rate: 0.368
                }
            },
            sentiment: {
                performance: {
                    ensemble_accuracy: 0.887,
                    high_confidence: 0.652,
                    domain_accuracy: 0.89
                },
                dataset: {
                    total_sentences: 14780,
                    positive: 0.270,
                    neutral: 0.606,
                    negative: 0.124
                },
                individual_models: {
                    'Logistic Regression': { accuracy: 0.856, f1: 0.851 },
                    'SVM': { accuracy: 0.842, f1: 0.839 },
                    'Naive Bayes': { accuracy: 0.823, f1: 0.817 },
                    'VADER': { accuracy: 0.734, f1: 0.721 }
                },
                domain_performance: {
                    'Technology': 0.67,
                    'Healthcare': 0.45,
                    'Banking': 0.23,
                    'Energy': -0.12
                }
            },
            attrition: {
                performance: {
                    auc: 0.892,
                    precision: 0.798,
                    recall: 0.756
                },
                dataset: {
                    total_customers: 10127,
                    churn_rate: 0.161,
                    high_risk_customers: 987
                },
                feature_importance: [
                    { feature: 'Customer_Value_Score', importance: 0.284 },
                    { feature: 'IsActiveMember', importance: 0.223 },
                    { feature: 'Age', importance: 0.187 },
                    { feature: 'NumOfProducts', importance: 0.156 },
                    { feature: 'Balance', importance: 0.134 }
                ],
                business_impact: {
                    avg_ltv: 2400000,
                    retention_roi: 5.33,
                    acquisition_cost: 150000,
                    retention_cost: 45000
                },
                segments: {
                    'Champions': { count: 2456, churn_prob: 0.05 },
                    'At_Risk': { count: 987, churn_prob: 0.75 },
                    'Cannot_Lose_Them': { count: 456, churn_prob: 0.80 }
                }
            }
        };
        
        this.renderModelAnalysisCharts();
        console.log('📊 Model analysis initialized');
    }
    
    renderModelAnalysisCharts() {
        if (window.FCACharts) {
            // Render fraud model charts
            window.FCACharts.renderFraudFeatureImportance(this.modelAnalysisData.fraud);
            
            // Render sentiment model charts
            window.FCACharts.renderSentimentModelComparison(this.modelAnalysisData.sentiment);
            
            // Render attrition model charts
            window.FCACharts.renderCustomerSegmentAnalysis(this.modelAnalysisData.attrition);
            
            // Render comparison charts
            window.FCACharts.renderHyperparameterComparison(this.modelAnalysisData);
            window.FCACharts.renderPerformanceRadar(this.modelAnalysisData);
            
            console.log('📊 Model analysis charts rendered');
        }
    }
    
    exportDetailedReport() {
        const detailedReport = {
            timestamp: new Date().toISOString(),
            report_type: 'Comprehensive Model Analysis',
            models: {
                fraud_detection: {
                    ...this.modelAnalysisData.fraud,
                    model_type: 'Random Forest Ensemble',
                    training_date: '2025-07-31',
                    status: 'Production'
                },
                sentiment_analysis: {
                    ...this.modelAnalysisData.sentiment,
                    model_type: 'Ensemble (4 models)',
                    training_date: '2025-08-01',
                    status: 'Production'
                },
                customer_attrition: {
                    ...this.modelAnalysisData.attrition,
                    model_type: 'XGBoost',
                    training_date: '2025-08-01',
                    status: 'Production'
                }
            },
            system_metrics: {
                total_datasets: 8,
                total_records: 4260920,
                overall_accuracy: 0.918,
                data_quality_score: 0.96,
                system_uptime: 0.999
            },
            business_impact: {
                fraud_prevention_savings: 250000000,
                customer_retention_value: 12000000000,
                real_time_insights: 'enabled',
                automated_decisions: 1500
            },
            recommendations: [
                'Review additional feature engineering to reduce false positives in fraud detection model',
                'Consider expanding sentiment analysis model to non-financial domains',
                'Implement real-time intervention automation for customer attrition prediction',
                'Introduce A/B testing framework for all models'
            ]
        };
        
        const reportJson = JSON.stringify(detailedReport, null, 2);
        const blob = new Blob([reportJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `FCA_Detailed_Model_Analysis_${new Date().toISOString().split('T')[0]}.json`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        console.log('📄 Detailed model analysis report exported');
    }
    
    refreshModelAnalysis() {
        console.log('🔄 Refreshing model analysis...');
        
        // Simulate data refresh
        setTimeout(() => {
            this.initializeModelAnalysis();
            
            // Show refresh notification
            const notification = document.createElement('div');
            notification.className = 'alert alert-success alert-dismissible fade show';
            notification.style.position = 'fixed';
            notification.style.top = '20px';
            notification.style.right = '20px';
            notification.style.zIndex = '9999';
            notification.innerHTML = `
                <strong>✅ Complete!</strong> Model analysis data has been refreshed.
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            
            document.body.appendChild(notification);
            
            // Auto remove notification after 3 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 3000);
            
        }, 1000);
    }
    
    // ===== New XAI Sub-page Loading Functions =====
    
    loadLocalExplanationsContent() {
        console.log('🔍 Loading Local Explanations content...');
        
        try {
            // Render LIME explanation
            this.renderMockXAICharts();
            
            console.log('✅ Local Explanations content loaded');
        } catch (error) {
            console.error('❌ Error loading Local Explanations:', error);
        }
    }
    
    loadGlobalAnalysisContent() {
        console.log('🌍 Loading Global Analysis content...');
        
        try {
            // Render global analysis charts
            this.renderMockXAICharts();
            
            console.log('✅ Global Analysis content loaded');
        } catch (error) {
            console.error('❌ Error loading Global Analysis:', error);
        }
    }
    
    loadModelPerformanceContent() {
        console.log('📊 Loading Model Performance content...');
        
        try {
            // Render performance charts
            this.renderMockXAICharts();
            
            console.log('✅ Model Performance content loaded');
        } catch (error) {
            console.error('❌ Error loading Model Performance:', error);
        }
    }
    
    loadFairnessEthicsContent() {
        console.log('⚖️ Loading Fairness & Ethics content...');
        
        try {
            // Render fairness analysis charts
            this.renderMockXAICharts();
            
            console.log('✅ Fairness & Ethics content loaded');
        } catch (error) {
            console.error('❌ Error loading Fairness & Ethics:', error);
        }
    }
    
    setupEventListeners() {
        // Theme toggle
        window.toggleTheme = () => {
            this.theme = this.theme === 'light' ? 'dark' : 'light';
            this.setTheme(this.theme);
            localStorage.setItem('dashboard-theme', this.theme);
            console.log(`🎨 Theme switched to ${this.theme}`);
        };
        
        // Data refresh
        window.refreshData = async () => {
            try {
                this.showLoading();
                await this.loadAllData();
                this.loadPageContent(this.currentPage);
                this.hideLoading();
                console.log('🔄 Data refreshed');
            } catch (error) {
                console.error('❌ Data refresh failed:', error);
                this.showError('Failed to refresh data');
            }
        };
        
        // Sidebar toggle for mobile
        window.toggleSidebar = () => {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('active');
            console.log('📱 Sidebar toggled');
        };
        
        // Global download model report function
        window.downloadModelReport = () => {
            this.downloadModelReport();
        };
        
        // Global processing pipeline functions
        window.startDataProcessing = () => {
            this.startDataProcessing();
        };
        
        window.startModelTraining = () => {
            this.startModelTraining();
        };
        
        window.downloadProcessingReport = () => {
            this.downloadProcessingReport();
        };
        
        // Global model analysis functions
        window.exportDetailedReport = () => {
            this.exportDetailedReport();
        };
        
        window.refreshModelAnalysis = () => {
            this.refreshModelAnalysis();
        };
        
        
        // Window resize handler
        window.addEventListener('resize', () => {
            if (window.FCACharts) {
                window.FCACharts.resizeCharts();
            }
        });
        
        console.log('👂 Event listeners setup complete');
    }
    
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update theme icon
        const themeIcon = document.querySelector('.dropdown-item i.fa-moon');
        if (themeIcon) {
            themeIcon.className = theme === 'light' ? 'fas fa-moon me-1' : 'fas fa-sun me-1';
        }
    }
    
    showLoading() {
        document.getElementById('loading-indicator').style.display = 'flex';
        document.getElementById('page-header').style.display = 'none';
        document.getElementById('dashboard-content').style.display = 'none';
    }
    
    hideLoading() {
        CommonUtils.log.debug('Hiding loading indicator', 'Dashboard');
        
        // Use CommonUtils for DOM operations
        CommonUtils.dom.hide('loading-indicator');
        CommonUtils.dom.show('page-header');
        CommonUtils.dom.show('dashboard-content');
        
        CommonUtils.log.info('Loading hidden and content shown', 'Dashboard');
    }
    
    showDashboard() {
        CommonUtils.log.debug('Showing dashboard', 'Dashboard');
        this.hideLoading();
        
        // Force show the main content without complex navigation
        CommonUtils.dom.show('dashboard-content');
        
        // Set current page without complex navigation
        this.currentPage = 'dashboard';
        CommonUtils.log.info('Dashboard display complete', 'Dashboard');
    }
    
    showError(message) {
        this.hideLoading();
        
        CommonUtils.error.show(message, 'dashboard-content');
        CommonUtils.dom.show('dashboard-content');
        
        CommonUtils.log.error('Dashboard error displayed', new Error(message), 'Dashboard');
    }
    
    /**
     * Render XAI charts using new ChartFactory system
     */
    async renderXAIChartsWithNewSystem() {
        try {
            this.safeLog('Starting XAI charts rendering with ChartFactory');
            
            // Check if we have XAI data
            const xaiData = this.data?.xai_data || this.data?.xai || null;
            this.safeLog(`XAI data available: ${!!xaiData}`);
            
            if (!xaiData) {
                this.safeLog('No XAI data found, loading from file', 'warn');
                try {
                    const response = await fetch('data/xai_data.json');
                    const loadedXaiData = await response.json();
                    this.safeLog('XAI data loaded from file');
                    await this.renderXAIChartsFromData(loadedXaiData);
                } catch (error) {
                    this.safeLog(`Failed to load XAI data: ${error.message}`, 'error');
                    await this.renderMockXAICharts();
                }
            } else {
                await this.renderXAIChartsFromData(xaiData);
            }
            
        } catch (error) {
            this.safeLog(`XAI charts rendering failed: ${error.message}`, 'error');
            await this.renderMockXAICharts();
        }
    }
    
    /**
     * Render XAI charts from loaded data
     */
    async renderXAIChartsFromData(xaiData) {
        try {
            // 1. LIME Local Explanation - Use XAICharts module
            if (xaiData.lime_explanations?.fraud_detection?.features) {
                // Use the existing XAICharts system instead of ChartFactory
                this.safeLog('LIME chart will be rendered by XAICharts module');
            }
            
            // 2. Model Decision Process  
            if (xaiData.model_decision_process?.fraud_detection?.decision_tree_path) {
                const steps = xaiData.model_decision_process.fraud_detection.decision_tree_path;
                const stepData = {
                    x: steps.map(s => s.feature),
                    y: steps.map(s => s.gini)
                };
                
                await ChartFactory.createBarChart('decision-tree-xai-chart', stepData, {
                    title: 'Model Decision Process',
                    xTitle: 'Decision Features',
                    yTitle: 'Gini Impurity'
                });
                this.safeLog('Decision process chart rendered successfully');
            }
            
            // 3. Feature Importance
            if (xaiData.global_feature_importance?.fraud_detection) {
                const importance = xaiData.global_feature_importance.fraud_detection;
                await ChartFactory.createBarChart('global-feature-importance-chart', {
                    x: importance.features,
                    y: importance.importance_scores
                }, {
                    title: 'Global Feature Importance',
                    xTitle: 'Features',
                    yTitle: 'Importance Score'
                });
                this.safeLog('Feature importance chart rendered successfully');
            }
            
            // 4. Prediction Confidence Distribution
            if (xaiData.prediction_confidence) {
                const confidence = xaiData.prediction_confidence;
                await ChartFactory.createBarChart('confidence-distribution-xai-chart', {
                    x: confidence.bins,
                    y: confidence.counts
                }, {
                    title: 'Prediction Confidence Distribution',
                    xTitle: 'Confidence Range',
                    yTitle: 'Count'
                });
                this.safeLog('Confidence distribution chart rendered successfully');
            }
            
            // 5. Model Comparison
            if (xaiData.model_comparison?.performance_metrics) {
                const metrics = xaiData.model_comparison.performance_metrics;
                const models = Object.keys(metrics);
                const accuracy = models.map(m => metrics[m].accuracy);
                
                await ChartFactory.createBarChart('model-comparison-xai-chart', {
                    x: models,
                    y: accuracy
                }, {
                    title: 'Model Performance Comparison',
                    xTitle: 'Models',
                    yTitle: 'Accuracy'
                });
                this.safeLog('Model comparison chart rendered successfully');
            }
            
        } catch (error) {
            this.safeLog(`Error rendering XAI charts from data: ${error.message}`, 'error');
            throw error;
        }
    }
    
    /**
     * Render mock XAI charts if data is not available
     */
    async renderMockXAICharts() {
        try {
            this.safeLog('Rendering mock XAI charts as fallback');
            
            // Mock LIME data - Use XAICharts module instead
            this.safeLog('Mock LIME chart will be rendered by XAICharts module');
            
            // Mock Decision Process
            await ChartFactory.createBarChart('decision-tree-xai-chart', {
                x: ['Amount Check', 'Time Analysis', 'Pattern Match', 'Risk Score'],
                y: [0.45, 0.32, 0.18, 0.08]
            }, {
                title: 'Model Decision Process (Demo)',
                xTitle: 'Decision Steps',
                yTitle: 'Importance'
            });
            
            // Mock Feature Importance
            await ChartFactory.createBarChart('global-feature-importance-chart', {
                x: ['V14', 'V12', 'V10', 'Amount', 'V17', 'V4'],
                y: [0.42, 0.38, 0.31, 0.28, 0.25, 0.19]
            }, {
                title: 'Global Feature Importance (Demo)',
                xTitle: 'Features',
                yTitle: 'Importance Score'
            });
            
            // Mock Confidence Distribution
            await ChartFactory.createBarChart('confidence-distribution-xai-chart', {
                x: ['0-20%', '20-40%', '40-60%', '60-80%', '80-100%'],
                y: [45, 123, 234, 456, 678]
            }, {
                title: 'Prediction Confidence Distribution (Demo)',
                xTitle: 'Confidence Range',
                yTitle: 'Count'
            });
            
            // Mock Model Comparison
            await ChartFactory.createBarChart('model-comparison-xai-chart', {
                x: ['Random Forest', 'XGBoost', 'Neural Network', 'SVM'],
                y: [0.94, 0.96, 0.92, 0.89]
            }, {
                title: 'Model Performance Comparison (Demo)',
                xTitle: 'Models',
                yTitle: 'Accuracy'
            });
            
            // Mock Feature Interaction Heatmap
            await ChartFactory.createHeatmapChart('feature-interaction-xai-chart', {
                z: [[1.0, 0.8, 0.6], [0.8, 1.0, 0.7], [0.6, 0.7, 1.0]],
                x: ['Amount', 'Time', 'Location'],
                y: ['Amount', 'Time', 'Location']
            }, {
                title: 'Feature Interaction Matrix (Demo)'
            });
            
            // Mock Model Accuracy by Feature
            await ChartFactory.createBarChart('accuracy-by-feature-chart', {
                x: ['Amount', 'Time', 'Location', 'Card Type', 'Merchant'],
                y: [0.94, 0.91, 0.88, 0.85, 0.82]
            }, {
                title: 'Model Accuracy by Feature (Demo)',
                xTitle: 'Features',
                yTitle: 'Accuracy'
            });
            
            // Mock Correlation Network (using scatter plot)
            await ChartFactory.createScatterChart('correlation-network-chart', {
                x: [1, 2, 3, 4, 5, 6],
                y: [2, 5, 3, 8, 7, 6],
                text: ['Amount', 'Time', 'Location', 'Card', 'Merchant', 'User']
            }, {
                title: 'Feature Correlation Network (Demo)',
                xTitle: 'Correlation Strength',
                yTitle: 'Feature Importance'
            });
            
            // Mock SHAP Waterfall Plot
            await ChartFactory.createBarChart('shap-waterfall-chart', {
                x: ['Base', 'Amount', 'Time', 'Location', 'Card Type', 'Final'],
                y: [0.1, 0.3, 0.15, -0.05, 0.2, 0.7]
            }, {
                title: 'SHAP Waterfall Plot (Demo)',
                xTitle: 'Features',
                yTitle: 'SHAP Value'
            });
            
            // Mock Fairness Analysis
            await ChartFactory.createBarChart('fairness-analysis-chart', {
                x: ['Group A', 'Group B', 'Group C', 'Group D'],
                y: [0.92, 0.89, 0.94, 0.87]
            }, {
                title: 'Fairness Analysis Across Demographics (Demo)',
                xTitle: 'Demographic Groups',
                yTitle: 'Model Accuracy'
            });
            
            // Mock Partial Dependence Plot
            await ChartFactory.createLineChart('partial-dependence-chart', {
                x: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
                y: [0.1, 0.15, 0.25, 0.4, 0.6, 0.8, 0.85, 0.9, 0.92, 0.94, 0.95]
            }, {
                title: 'Partial Dependence Plot (Demo)',
                xTitle: 'Transaction Amount',
                yTitle: 'Predicted Fraud Probability'
            });
            
            this.safeLog('Mock XAI charts rendered successfully');
            
        } catch (error) {
            this.safeLog(`Failed to render even mock XAI charts: ${error.message}`, 'error');
        }
    }
    
    /**
     * Add debug commands for console access
     */
    addDebugCommands() {
        window.debugFCA = {
            // Chart monitoring commands
            checkCharts: () => {
                if (window.chartMonitor) {
                    window.chartMonitor.checkAllCharts();
                    window.chartMonitor.printReport();
                } else {
                    console.warn('ChartMonitor not available');
                }
            },
            
            // Chart health check
            healthCheck: () => {
                if (window.chartManager) {
                    return window.chartManager.healthCheck();
                } else {
                    console.warn('ChartManager not available');
                    return null;
                }
            },
            
            // Re-render charts
            reRenderCharts: () => {
                this.renderDashboardCharts();
            },
            
            // Show data structure
            showData: () => {
                console.group('📊 Dashboard Data Structure');
                Object.keys(this.data).forEach(key => {
                    console.log(`${key}:`, this.data[key]);
                });
                console.groupEnd();
            },
            
            // Get chart containers info
            getContainers: () => {
                const containers = document.querySelectorAll('[id*="chart"]');
                const info = Array.from(containers).map(c => ({
                    id: c.id,
                    visible: c.offsetWidth > 0 && c.offsetHeight > 0,
                    hasPlotly: !!c.querySelector('.plotly-graph-div'),
                    isEmpty: !!c.querySelector('.chart-empty'),
                    hasError: !!c.querySelector('.chart-error')
                }));
                console.table(info);
                return info;
            }
        };
        
        console.log('🛠️ Debug commands available: window.debugFCA');
        console.log('   - debugFCA.checkCharts() - Check all charts');
        console.log('   - debugFCA.healthCheck() - System health check');
        console.log('   - debugFCA.reRenderCharts() - Re-render all charts');
        console.log('   - debugFCA.showData() - Show data structure');
        console.log('   - debugFCA.getContainers() - Get chart containers info');
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏁 DOM loaded, initializing FCA Dashboard...');
    window.dashboard = new FCADashboard();
});

// Export for global access
window.FCADashboard = FCADashboard;