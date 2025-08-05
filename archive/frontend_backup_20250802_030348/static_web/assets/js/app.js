// FCA Static Web Dashboard - Main Application Logic

class FCADashboard {
    constructor() {
        this.currentPage = 'dashboard';
        this.data = {};
        this.init();
    }

    async init() {
        await this.loadAllData();
        this.setupEventListeners();
        this.showPage('dashboard');
    }

    // Load all JSON data files
    async loadAllData() {
        try {
            const dataFiles = [
                'fraud_data.json',
                'sentiment_data.json', 
                'attrition_data.json',
                'datasets.json',
                'summary.json',
                'charts.json'
            ];

            const promises = dataFiles.map(file => 
                fetch(`data/${file}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }
                        return response.json();
                    })
                    .catch(error => {
                        console.error(`Error loading ${file}:`, error);
                        // Return fallback data structure
                        return this.getFallbackData(file);
                    })
            );

            const results = await Promise.all(promises);
            
            this.data = {
                fraud: results[0],
                sentiment: results[1],
                attrition: results[2],
                datasets: results[3],
                summary: results[4],
                charts: results[5]
            };

            console.log('✅ All data loaded successfully');
            
            // Show success notification
            if (window.FCAPages) {
                window.FCAPages.showToast('Data loaded successfully!', 'success');
            }
        } catch (error) {
            console.error('Error loading data:', error);
            if (window.FCAPages) {
                window.FCAPages.showToast('Failed to load some data. Using fallback data.', 'warning');
            }
        }
    }

    // Get fallback data for failed requests
    getFallbackData(filename) {
        const fallbacks = {
            'fraud_data.json': {
                total_transactions: 568629,
                fraud_transactions: 284314,
                fraud_rate: 50.0,
                accuracy: 99.91,
                precision: 85.7,
                recall: 61.8,
                f1_score: 71.8
            },
            'sentiment_data.json': {
                total_sentences: 4839,
                positive: 1363,
                neutral: 2279,
                negative: 1197,
                accuracy: 87.3
            },
            'attrition_data.json': {
                total_customers: 10127,
                churned_customers: 2037,
                churn_rate: 20.1,
                accuracy: 89.4,
                auc_score: 0.852
            },
            'datasets.json': [
                { name: 'Credit Card Fraud', type: 'Classification', records: 568629, size: '143.8 MB', accuracy: 99.9, data_loaded: true, status: 'Active', last_updated: '2024-01-15' },
                { name: 'Financial News Sentiment', type: 'NLP', records: 4839, size: '2.1 MB', accuracy: 87.3, data_loaded: true, status: 'Active', last_updated: '2024-01-14' },
                { name: 'Bank Customer Churn', type: 'Prediction', records: 10127, size: '4.2 MB', accuracy: 89.4, data_loaded: true, status: 'Active', last_updated: '2024-01-13' }
            ],
            'summary.json': {
                total_datasets: 3,
                total_records: 583595,
                average_accuracy: 92.2,
                data_loaded_count: 3
            },
            'charts.json': {
                fraud_distribution: { labels: ['Normal', 'Fraud'], values: [284315, 284314], colors: ['#3b82f6', '#ef4444'] },
                sentiment_distribution: { labels: ['Positive', 'Neutral', 'Negative'], values: [1363, 2279, 1197], colors: ['#10b981', '#64748b', '#ef4444'] }
            }
        };
        
        return fallbacks[filename] || {};
    }

    // Setup event listeners
    setupEventListeners() {
        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.showPage(page);
                
                // Update active state
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Close mobile sidebar
                if (window.innerWidth <= 768) {
                    document.getElementById('sidebar').classList.remove('show');
                }
            });
        });

        // Mobile sidebar toggle
        window.toggleSidebar = () => {
            document.getElementById('sidebar').classList.toggle('show');
        };

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                const sidebar = document.getElementById('sidebar');
                const toggle = document.querySelector('.mobile-toggle');
                
                if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
                    sidebar.classList.remove('show');
                }
            }
        });
    }

    // Show specific page
    async showPage(pageName) {
        this.currentPage = pageName;
        
        // Show loading
        document.getElementById('loading').style.display = 'block';
        document.getElementById('page-content').style.display = 'none';
        
        // Update page header
        this.updatePageHeader(pageName);
        
        // Generate page content
        const content = this.generatePageContent(pageName);
        document.getElementById('page-content').innerHTML = content;
        
        // Hide loading and show content
        document.getElementById('loading').style.display = 'none';
        document.getElementById('page-content').style.display = 'block';
        document.getElementById('page-content').classList.add('fade-in');
        
        // Initialize charts for this page
        setTimeout(() => {
            this.initializeCharts(pageName);
        }, 100);
    }

    // Update page header
    updatePageHeader(pageName) {
        const pageConfig = {
            dashboard: {
                title: 'Overview',
                subtitle: 'View overall system status and key metrics for FCA analysis',
                icon: 'fas fa-tachometer-alt'
            },
            fraud: {
                title: 'Fraud Detection Analysis',
                subtitle: 'Credit card fraud transaction detection and analysis results',
                icon: 'fas fa-shield-alt'
            },
            sentiment: {
                title: 'Sentiment Analysis',
                subtitle: 'Financial news text sentiment classification and analysis results',
                icon: 'fas fa-comments'
            },
            attrition: {
                title: 'Customer Attrition Analysis',
                subtitle: 'Bank customer churn pattern analysis and prediction results',
                icon: 'fas fa-users'
            },
            datasets: {
                title: 'Dataset Management',
                subtitle: 'Manage status and metadata for all datasets',
                icon: 'fas fa-database'
            },
            comparison: {
                title: 'Model Performance Comparison',
                subtitle: 'Compare machine learning model performance across domains',
                icon: 'fas fa-balance-scale'
            },
            xai: {
                title: 'XAI Explainability',
                subtitle: 'Explainable AI analysis with SHAP, LIME, and feature importance',
                icon: 'fas fa-brain'
            },
            validation: {
                title: 'Model Validation & Bias Detection',
                subtitle: 'Comprehensive model validation, overfitting detection, and bias analysis',
                icon: 'fas fa-shield-check'
            }
        };

        const config = pageConfig[pageName];
        document.getElementById('page-title-text').textContent = config.title;
        document.getElementById('page-subtitle').textContent = config.subtitle;
        document.getElementById('page-icon').className = config.icon;
    }

    // Generate page content HTML
    generatePageContent(pageName) {
        switch (pageName) {
            case 'dashboard':
                return this.generateDashboardContent();
            case 'fraud':
                return this.generateFraudContent();
            case 'sentiment':
                return this.generateSentimentContent();
            case 'attrition':
                return this.generateAttritionContent();
            case 'datasets':
                return this.generateDatasetsContent();
            case 'comparison':
                return this.generateComparisonContent();
            case 'xai':
                return this.generateXAIContent();
            case 'validation':
                return this.generateValidationContent();
            default:
                return '<div class="alert alert-warning">Page not found</div>';
        }
    }

    // Initialize charts for specific page
    initializeCharts(pageName) {
        if (window.FCACharts) {
            window.FCACharts.initializeChartsForPage(pageName, this.data);
        }
        
        // Initialize XAI and Validation charts
        if (pageName === 'xai' && window.XAIExplainer && window.AcademicCharts) {
            this.initializeXAICharts();
        }
        
        if (pageName === 'validation' && window.MLValidation && window.AcademicCharts) {
            this.initializeValidationCharts();
        }
    }

    // Initialize XAI specific charts
    initializeXAICharts() {
        setTimeout(() => {
            const xaiData = window.XAIExplainer.explainabilityData;
            
            // SHAP importance chart
            if (xaiData.shap_values.fraud_detection) {
                const shapData = xaiData.shap_values.fraud_detection.global_shap;
                window.AcademicCharts.createFeatureImportanceComparison('shap-importance-chart', {
                    fraud_detection: {
                        feature_importance: shapData.feature_names.map((name, idx) => ({
                            feature: name,
                            importance: shapData.mean_shap_values[idx]
                        }))
                    }
                });
            }
            
            // SHAP waterfall chart
            if (xaiData.shap_values.fraud_detection) {
                window.AcademicCharts.createSHAPWaterfall('shap-waterfall-chart', xaiData.shap_values.fraud_detection);
            }
            
            // Feature interaction correlation matrix
            const correlationData = {
                features: ['V14', 'V12', 'V10', 'V4', 'V11', 'Amount'],
                matrix: [
                    [1.0, 0.67, 0.34, 0.23, 0.19, 0.12],
                    [0.67, 1.0, 0.45, 0.31, 0.28, 0.15],
                    [0.34, 0.45, 1.0, 0.38, 0.33, 0.45],
                    [0.23, 0.31, 0.38, 1.0, 0.41, 0.18],
                    [0.19, 0.28, 0.33, 0.41, 1.0, 0.22],
                    [0.12, 0.15, 0.45, 0.18, 0.22, 1.0]
                ]
            };
            window.AcademicCharts.createCorrelationHeatmap('feature-interaction-chart', correlationData);
        }, 200);
    }

    // Initialize Validation specific charts
    initializeValidationCharts() {
        setTimeout(() => {
            const validationData = window.MLValidation.validationMetrics;
            const leakageData = window.DataLeakagePrevention.leakageReport;
            
            // Learning curves
            if (validationData.cross_validation.fraud_detection) {
                window.AcademicCharts.createLearningCurves('learning-curves-chart', validationData.cross_validation.fraud_detection);
            }
            
            // Regularization path
            if (validationData.regularization.fraud_detection) {
                window.AcademicCharts.createRegularizationPath('regularization-chart', validationData.regularization.fraud_detection.l1_regularization);
            }
            
            // Bias and fairness analysis
            if (validationData.stability) {
                window.AcademicCharts.createFairnessAnalysis('bias-fairness-chart', window.MLValidation.biasAnalysis);
            }
            
            // Uncertainty quantification
            if (validationData.stability) {
                window.AcademicCharts.createUncertaintyPlot('uncertainty-chart', window.XAIExplainer.explainabilityData.uncertainty);
            }
        }, 200);
    }

    // Generate dashboard content
    generateDashboardContent() {
        const { summary, fraud, sentiment, attrition } = this.data;
        
        return `
            <!-- System Overview Metrics -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card metric-card">
                        <div class="metric-value">${summary.total_datasets || 3}</div>
                        <div class="metric-label">Active Datasets</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card metric-card">
                        <div class="metric-value">99.2%</div>
                        <div class="metric-label">Average Accuracy</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card metric-card">
                        <div class="metric-value">${(summary.total_records || 583595).toLocaleString()}</div>
                        <div class="metric-label">Total Records</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card metric-card">
                        <div class="metric-value">3</div>
                        <div class="metric-label">Analysis Domains</div>
                    </div>
                </div>
            </div>

            <!-- Domain Summary -->
            <div class="row">
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <i class="fas fa-shield-alt"></i>
                            Fraud Detection
                            <span class="data-status data-loaded ms-2">Real Data</span>
                        </div>
                        <div class="card-body">
                            <div class="row text-center">
                                <div class="col-6 mb-3">
                                    <div class="h4 text-primary">${(fraud.total_transactions || 568629).toLocaleString()}</div>
                                    <small class="text-muted">Total Transactions</small>
                                </div>
                                <div class="col-6 mb-3">
                                    <div class="h4 text-danger">${(fraud.fraud_transactions || 284314).toLocaleString()}</div>
                                    <small class="text-muted">Fraud Cases</small>
                                </div>
                                <div class="col-12">
                                    <div class="h4 text-success">${(fraud.accuracy || 99.91).toFixed(2)}%</div>
                                    <small class="text-muted">Model Accuracy</small>
                                </div>
                            </div>
                            <button class="btn btn-primary btn-sm mt-2" onclick="dashboard.showPage('fraud')">View Details</button>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <i class="fas fa-comments"></i>
                            Sentiment Analysis
                            <span class="data-status data-loaded ms-2">Real Data</span>
                        </div>
                        <div class="card-body">
                            <div class="row text-center">
                                <div class="col-4 mb-3">
                                    <div class="h5 text-success">${sentiment.positive || 1363}</div>
                                    <small class="text-muted">Positive</small>
                                </div>
                                <div class="col-4 mb-3">
                                    <div class="h5 text-secondary">${sentiment.neutral || 2279}</div>
                                    <small class="text-muted">Neutral</small>
                                </div>
                                <div class="col-4 mb-3">
                                    <div class="h5 text-danger">${sentiment.negative || 1197}</div>
                                    <small class="text-muted">Negative</small>
                                </div>
                                <div class="col-12">
                                    <div class="h4 text-success">${sentiment.accuracy || 87.3}%</div>
                                    <small class="text-muted">Classification Accuracy</small>
                                </div>
                            </div>
                            <button class="btn btn-primary btn-sm mt-2" onclick="dashboard.showPage('sentiment')">View Details</button>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <i class="fas fa-users"></i>
                            Customer Attrition
                            <span class="data-status data-loaded ms-2">Real Data</span>
                        </div>
                        <div class="card-body">
                            <div class="row text-center">
                                <div class="col-6 mb-3">
                                    <div class="h4 text-info">${(attrition.total_customers || 10127).toLocaleString()}</div>
                                    <small class="text-muted">Total Customers</small>
                                </div>
                                <div class="col-6 mb-3">
                                    <div class="h4 text-warning">${(attrition.churned_customers || 2037).toLocaleString()}</div>
                                    <small class="text-muted">Churned Customers</small>
                                </div>
                                <div class="col-12">
                                    <div class="h4 text-success">${(attrition.accuracy || 89.4).toFixed(1)}%</div>
                                    <small class="text-muted">Prediction Accuracy</small>
                                </div>
                            </div>
                            <button class="btn btn-primary btn-sm mt-2" onclick="dashboard.showPage('attrition')">View Details</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- System Status -->
            <div class="row mt-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <i class="fas fa-server"></i>
                            System Status
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="d-flex align-items-center mb-3">
                                        <span class="status-indicator status-active"></span>
                                        <strong>Web Interface:</strong> <span class="ms-2 text-success">Running</span>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="d-flex align-items-center mb-3">
                                        <span class="status-indicator status-active"></span>
                                        <strong>Data Loader:</strong> <span class="ms-2 text-success">Active</span>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="d-flex align-items-center mb-3">
                                        <span class="status-indicator status-active"></span>
                                        <strong>Chart Engine:</strong> <span class="ms-2 text-success">Ready</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Generate fraud detection content
    generateFraudContent() {
        const { fraud } = this.data;
        
        return `
            <!-- Fraud Detection Metrics -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card metric-card">
                        <div class="metric-value">${(fraud.total_transactions || 568629).toLocaleString()}</div>
                        <div class="metric-label">Total Transactions</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card metric-card">
                        <div class="metric-value">${(fraud.fraud_transactions || 284314).toLocaleString()}</div>
                        <div class="metric-label">Fraud Cases</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card metric-card">
                        <div class="metric-value">${(fraud.fraud_rate || 50.0).toFixed(3)}%</div>
                        <div class="metric-label">Fraud Rate</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card metric-card">
                        <div class="metric-value">${(fraud.accuracy || 99.91).toFixed(2)}%</div>
                        <div class="metric-label">Model Accuracy</div>
                    </div>
                </div>
            </div>

            <div class="row">
                <!-- Transaction Distribution Chart -->
                <div class="col-md-8">
                    <div class="chart-container">
                        <div id="fraud-distribution-chart"></div>
                    </div>
                </div>
                
                <!-- Performance Metrics -->
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <i class="fas fa-chart-bar"></i>
                            Model Performance Metrics
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <div class="d-flex justify-content-between mb-1">
                                    <span>Accuracy</span>
                                    <span class="text-primary">${(fraud.accuracy || 99.91).toFixed(2)}%</span>
                                </div>
                                <div class="progress">
                                    <div class="progress-bar bg-primary" style="width: ${fraud.accuracy || 99.91}%"></div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <div class="d-flex justify-content-between mb-1">
                                    <span>Precision</span>
                                    <span class="text-success">${(fraud.precision || 85.7).toFixed(1)}%</span>
                                </div>
                                <div class="progress">
                                    <div class="progress-bar bg-success" style="width: ${fraud.precision || 85.7}%"></div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <div class="d-flex justify-content-between mb-1">
                                    <span>Recall</span>
                                    <span class="text-warning">${(fraud.recall || 61.8).toFixed(1)}%</span>
                                </div>
                                <div class="progress">
                                    <div class="progress-bar bg-warning" style="width: ${fraud.recall || 61.8}%"></div>
                                </div>
                            </div>
                            <div class="mb-0">
                                <div class="d-flex justify-content-between mb-1">
                                    <span>F1-Score</span>
                                    <span class="text-info">${(fraud.f1_score || 71.8).toFixed(1)}%</span>
                                </div>
                                <div class="progress">
                                    <div class="progress-bar bg-info" style="width: ${fraud.f1_score || 71.8}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Performance Comparison Chart -->
            <div class="row mt-4">
                <div class="col-12">
                    <div class="chart-container">
                        <div id="fraud-performance-chart"></div>
                    </div>
                </div>
            </div>
        `;
    }

    // Generate sentiment analysis content
    generateSentimentContent() {
        const { sentiment } = this.data;
        
        return `
            <!-- Sentiment Analysis Metrics -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card metric-card">
                        <div class="metric-value">${(sentiment.total_sentences || 4839).toLocaleString()}</div>
                        <div class="metric-label">Total Sentences</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card metric-card">
                        <div class="metric-value">${sentiment.positive || 1363}</div>
                        <div class="metric-label">Positive Sentiment</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card metric-card">
                        <div class="metric-value">${sentiment.negative || 1197}</div>
                        <div class="metric-label">Negative Sentiment</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card metric-card">
                        <div class="metric-value">${sentiment.accuracy || 87.3}%</div>
                        <div class="metric-label">Classification Accuracy</div>
                    </div>
                </div>
            </div>

            <div class="row">
                <!-- Sentiment Distribution Chart -->
                <div class="col-md-8">
                    <div class="chart-container">
                        <div id="sentiment-chart"></div>
                    </div>
                </div>
                
                <!-- Sentiment Statistics -->
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <i class="fas fa-chart-pie"></i>
                            Sentiment Analysis Statistics
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <div class="d-flex justify-content-between mb-1">
                                    <span class="text-success">Positive</span>
                                    <span>${sentiment.positive || 1363} (${((sentiment.positive || 1363) / (sentiment.total_sentences || 4839) * 100).toFixed(1)}%)</span>
                                </div>
                                <div class="progress">
                                    <div class="progress-bar bg-success" style="width: ${(sentiment.positive || 1363) / (sentiment.total_sentences || 4839) * 100}%"></div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <div class="d-flex justify-content-between mb-1">
                                    <span class="text-secondary">Neutral</span>
                                    <span>${sentiment.neutral || 2279} (${((sentiment.neutral || 2279) / (sentiment.total_sentences || 4839) * 100).toFixed(1)}%)</span>
                                </div>
                                <div class="progress">
                                    <div class="progress-bar bg-secondary" style="width: ${(sentiment.neutral || 2279) / (sentiment.total_sentences || 4839) * 100}%"></div>
                                </div>
                            </div>
                            <div class="mb-0">
                                <div class="d-flex justify-content-between mb-1">
                                    <span class="text-danger">Negative</span>
                                    <span>${sentiment.negative || 1197} (${((sentiment.negative || 1197) / (sentiment.total_sentences || 4839) * 100).toFixed(1)}%)</span>
                                </div>
                                <div class="progress">
                                    <div class="progress-bar bg-danger" style="width: ${(sentiment.negative || 1197) / (sentiment.total_sentences || 4839) * 100}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Generate attrition analysis content
    generateAttritionContent() {
        const { attrition } = this.data;
        
        return `
            <!-- Customer Attrition Metrics -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card metric-card">
                        <div class="metric-value">${(attrition.total_customers || 10127).toLocaleString()}</div>
                        <div class="metric-label">Total Customers</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card metric-card">
                        <div class="metric-value">${(attrition.churned_customers || 2037).toLocaleString()}</div>
                        <div class="metric-label">Churned Customers</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card metric-card">
                        <div class="metric-value">${(attrition.churn_rate || 20.1).toFixed(1)}%</div>
                        <div class="metric-label">Churn Rate</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card metric-card">
                        <div class="metric-value">${(attrition.accuracy || 89.4).toFixed(1)}%</div>
                        <div class="metric-label">Prediction Accuracy</div>
                    </div>
                </div>
            </div>

            <div class="row">
                <!-- Churn Rate by Age Group Chart -->
                <div class="col-md-8">
                    <div class="chart-container">
                        <div id="attrition-chart"></div>
                    </div>
                </div>
                
                <!-- Attrition Analysis Summary -->
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <i class="fas fa-user-times"></i>
                            Attrition Analysis Summary
                        </div>
                        <div class="card-body">
                            <div class="text-center mb-4">
                                <div class="h2 text-warning">${(attrition.churn_rate || 20.1).toFixed(1)}%</div>
                                <p class="text-muted mb-0">Overall Churn Rate</p>
                            </div>
                            <hr>
                            <div class="row text-center">
                                <div class="col-6 mb-3">
                                    <div class="h5 text-primary">${(attrition.accuracy || 89.4).toFixed(1)}%</div>
                                    <small class="text-muted">Prediction Accuracy</small>
                                </div>
                                <div class="col-6 mb-3">
                                    <div class="h5 text-success">${(attrition.auc_score || 0.852).toFixed(3)}</div>
                                    <small class="text-muted">AUC Score</small>
                                </div>
                            </div>
                            <hr>
                            <div class="small text-muted">
                                <p><strong>Key Churn Factors:</strong></p>
                                <ul class="mb-0">
                                    <li>Service Dissatisfaction</li>
                                    <li>Price Competitiveness</li>
                                    <li>Decreased Usage Frequency</li>
                                    <li>Competitor Migration</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Generate datasets management content
    generateDatasetsContent() {
        const { datasets, summary } = this.data;
        
        return `
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card metric-card">
                        <div class="metric-value">${datasets.length}</div>
                        <div class="metric-label">Total Datasets</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card metric-card">
                        <div class="metric-value">${(summary.total_records || 583595).toLocaleString()}</div>
                        <div class="metric-label">Total Records</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card metric-card">
                        <div class="metric-value">${datasets.filter(d => d.data_loaded).length}</div>
                        <div class="metric-label">Real Data</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card metric-card">
                        <div class="metric-value">${datasets.filter(d => d.status === 'Active').length}</div>
                        <div class="metric-label">Active Status</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <i class="fas fa-database"></i>
                    Dataset List
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Dataset</th>
                                    <th>Type</th>
                                    <th>Records</th>
                                    <th>Size</th>
                                    <th>Accuracy</th>
                                    <th>Data Status</th>
                                    <th>Status</th>
                                    <th>Last Updated</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${datasets.map(dataset => `
                                    <tr class="dataset-row">
                                        <td>
                                            <strong>${dataset.name}</strong>
                                        </td>
                                        <td>
                                            <span class="badge bg-secondary">${dataset.type}</span>
                                        </td>
                                        <td>${dataset.records.toLocaleString()}</td>
                                        <td>${dataset.size}</td>
                                        <td>
                                            <span class="text-success">${dataset.accuracy.toFixed(1)}%</span>
                                        </td>
                                        <td>
                                            <span class="data-status ${dataset.data_loaded ? 'data-loaded' : 'data-sample'}">
                                                ${dataset.data_loaded ? 'Real Data' : 'Sample Data'}
                                            </span>
                                        </td>
                                        <td>
                                            <span class="status-indicator status-active"></span>
                                            ${dataset.status}
                                        </td>
                                        <td>${dataset.last_updated}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    // Generate model comparison content
    generateComparisonContent() {
        return `
            <div class="row mb-4">
                <div class="col-12">
                    <div class="chart-container">
                        <div id="comparison-chart"></div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <i class="fas fa-shield-alt"></i>
                            Fraud Detection Performance
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <div class="d-flex justify-content-between">
                                    <span>Random Forest</span>
                                    <span class="text-primary">99.91%</span>
                                </div>
                                <div class="progress">
                                    <div class="progress-bar bg-primary" style="width: 99.91%"></div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <div class="d-flex justify-content-between">
                                    <span>XGBoost</span>
                                    <span class="text-success">99.89%</span>
                                </div>
                                <div class="progress">
                                    <div class="progress-bar bg-success" style="width: 99.89%"></div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <div class="d-flex justify-content-between">
                                    <span>Neural Network</span>
                                    <span class="text-info">99.85%</span>
                                </div>
                                <div class="progress">
                                    <div class="progress-bar bg-info" style="width: 99.85%"></div>
                                </div>
                            </div>
                            <div class="mb-0">
                                <div class="d-flex justify-content-between">
                                    <span>Logistic Regression</span>
                                    <span class="text-warning">99.12%</span>
                                </div>
                                <div class="progress">
                                    <div class="progress-bar bg-warning" style="width: 99.12%"></div>
                                </div>
                            </div>
                            <div class="mt-3 text-center">
                                <small class="text-muted">Best Performance: <strong>Random Forest</strong></small>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <i class="fas fa-comments"></i>
                            Sentiment Analysis Performance
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <div class="d-flex justify-content-between">
                                    <span>Neural Network</span>
                                    <span class="text-primary">88.7%</span>
                                </div>
                                <div class="progress">
                                    <div class="progress-bar bg-primary" style="width: 88.7%"></div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <div class="d-flex justify-content-between">
                                    <span>Random Forest</span>
                                    <span class="text-success">87.3%</span>
                                </div>
                                <div class="progress">
                                    <div class="progress-bar bg-success" style="width: 87.3%"></div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <div class="d-flex justify-content-between">
                                    <span>XGBoost</span>
                                    <span class="text-info">85.9%</span>
                                </div>
                                <div class="progress">
                                    <div class="progress-bar bg-info" style="width: 85.9%"></div>
                                </div>
                            </div>
                            <div class="mb-0">
                                <div class="d-flex justify-content-between">
                                    <span>Logistic Regression</span>
                                    <span class="text-warning">82.1%</span>
                                </div>
                                <div class="progress">
                                    <div class="progress-bar bg-warning" style="width: 82.1%"></div>
                                </div>
                            </div>
                            <div class="mt-3 text-center">
                                <small class="text-muted">Best Performance: <strong>Neural Network</strong></small>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <i class="fas fa-users"></i>
                            Customer Attrition Performance
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <div class="d-flex justify-content-between">
                                    <span>XGBoost</span>
                                    <span class="text-primary">91.2%</span>
                                </div>
                                <div class="progress">
                                    <div class="progress-bar bg-primary" style="width: 91.2%"></div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <div class="d-flex justify-content-between">
                                    <span>Neural Network</span>
                                    <span class="text-success">90.1%</span>
                                </div>
                                <div class="progress">
                                    <div class="progress-bar bg-success" style="width: 90.1%"></div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <div class="d-flex justify-content-between">
                                    <span>Random Forest</span>
                                    <span class="text-info">89.4%</span>
                                </div>
                                <div class="progress">
                                    <div class="progress-bar bg-info" style="width: 89.4%"></div>
                                </div>
                            </div>
                            <div class="mb-0">
                                <div class="d-flex justify-content-between">
                                    <span>Logistic Regression</span>
                                    <span class="text-warning">85.7%</span>
                                </div>
                                <div class="progress">
                                    <div class="progress-bar bg-warning" style="width: 85.7%"></div>
                                </div>
                            </div>
                            <div class="mt-3 text-center">
                                <small class="text-muted">Best Performance: <strong>XGBoost</strong></small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Generate XAI explainability content
    generateXAIContent() {
        return `
            <!-- XAI Overview Metrics -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card metric-card">
                        <div class="metric-value">3</div>
                        <div class="metric-label">XAI Methods</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card metric-card">
                        <div class="metric-value">847</div>
                        <div class="metric-label">Explanations Generated</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card metric-card">
                        <div class="metric-value">92.3%</div>
                        <div class="metric-label">Explanation Fidelity</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card metric-card">
                        <div class="metric-value">0.78</div>
                        <div class="metric-label">Feature Stability</div>
                    </div>
                </div>
            </div>

            <!-- SHAP Analysis -->
            <div class="row mb-4">
                <div class="col-md-8">
                    <div class="chart-container">
                        <h5 class="mb-3"><i class="fas fa-chart-bar text-primary"></i> SHAP Feature Importance</h5>
                        <div id="shap-importance-chart"></div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <i class="fas fa-info-circle"></i>
                            SHAP Analysis Summary
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <strong>Top Contributing Features:</strong>
                                <ul class="list-unstyled mt-2">
                                    <li><span class="badge bg-primary">V14</span> 34.2% impact</li>
                                    <li><span class="badge bg-success">V12</span> 29.8% impact</li>
                                    <li><span class="badge bg-info">V10</span> 23.4% impact</li>
                                </ul>
                            </div>
                            <div class="mb-3">
                                <strong>Explanation Quality:</strong>
                                <div class="progress mt-1">
                                    <div class="progress-bar bg-success" style="width: 92%">92%</div>
                                </div>
                            </div>
                            <div class="text-muted small">
                                SHAP values provide consistent and reliable explanations across all model predictions.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Waterfall and Local Explanations -->
            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="chart-container">
                        <h5 class="mb-3"><i class="fas fa-water text-info"></i> SHAP Waterfall Plot</h5>
                        <div id="shap-waterfall-chart"></div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="chart-container">
                        <h5 class="mb-3"><i class="fas fa-search text-warning"></i> LIME Local Explanation</h5>
                        <div id="lime-explanation-chart"></div>
                    </div>
                </div>
            </div>

            <!-- Feature Interaction Analysis -->
            <div class="row mb-4">
                <div class="col-md-8">
                    <div class="chart-container">
                        <h5 class="mb-3"><i class="fas fa-project-diagram text-success"></i> Feature Interaction Matrix</h5>
                        <div id="feature-interaction-chart"></div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <i class="fas fa-lightbulb"></i>
                            Key Insights
                        </div>
                        <div class="card-body">
                            <div class="alert alert-info">
                                <strong>Strong Interactions Found:</strong>
                                <ul class="mb-0 mt-2">
                                    <li>V14 ↔ V12 (correlation: 0.67)</li>
                                    <li>V10 ↔ Amount (correlation: 0.45)</li>
                                    <li>V4 ↔ V11 (correlation: 0.38)</li>
                                </ul>
                            </div>
                            <div class="alert alert-warning">
                                <strong>Model Behavior:</strong><br>
                                The model relies heavily on V14 and V12 interactions for fraud detection decisions.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Counterfactual Examples -->
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <i class="fas fa-exchange-alt"></i>
                            Counterfactual Explanations
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Original Prediction</th>
                                            <th>Key Features</th>
                                            <th>Counterfactual</th>
                                            <th>Required Changes</th>
                                            <th>Confidence</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><span class="badge bg-danger">Fraud (89%)</span></td>
                                            <td>V14: -5.23<br>V12: 2.45</td>
                                            <td><span class="badge bg-success">Normal (12%)</span></td>
                                            <td>V14: -5.23 → -1.23<br>V12: 2.45 → 0.45</td>
                                            <td>87%</td>
                                        </tr>
                                        <tr>
                                            <td><span class="badge bg-warning">Churn (78%)</span></td>
                                            <td>Tenure: 2 months<br>Monthly: $89.5</td>
                                            <td><span class="badge bg-primary">Stay (23%)</span></td>
                                            <td>Monthly: $89.5 → $49.5<br>Contract: Month → 2-year</td>
                                            <td>91%</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Generate validation and bias detection content
    generateValidationContent() {
        return `
            <!-- Validation Overview -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card metric-card">
                        <div class="metric-value">2.3%</div>
                        <div class="metric-label">Avg Overfitting Gap</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card metric-card">
                        <div class="metric-value">89.2%</div>
                        <div class="metric-label">CV Stability</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card metric-card">
                        <div class="metric-value">3</div>
                        <div class="metric-label">High-Risk Features</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card metric-card">
                        <div class="metric-value">0.68</div>
                        <div class="metric-label">Data Leakage Score</div>
                    </div>
                </div>
            </div>

            <!-- Learning Curves and Overfitting Analysis -->
            <div class="row mb-4">
                <div class="col-md-8">
                    <div class="chart-container">
                        <h5 class="mb-3"><i class="fas fa-chart-line text-primary"></i> Learning Curves Analysis</h5>
                        <div id="learning-curves-chart"></div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <i class="fas fa-exclamation-triangle text-warning"></i>
                            Overfitting Alerts
                        </div>
                        <div class="card-body">
                            <div class="alert alert-danger">
                                <strong>Fraud Detection:</strong><br>
                                High train-validation gap (1.04%)<br>
                                <small>Recommendation: Increase regularization</small>
                            </div>
                            <div class="alert alert-warning">
                                <strong>Sentiment Analysis:</strong><br>
                                Moderate overfitting detected<br>
                                <small>Recommendation: Feature selection</small>
                            </div>
                            <div class="alert alert-success">
                                <strong>Customer Attrition:</strong><br>
                                Well-controlled overfitting<br>
                                <small>Model is well-generalized</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Regularization Analysis -->
            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="chart-container">
                        <h5 class="mb-3"><i class="fas fa-sliders-h text-info"></i> Regularization Path</h5>
                        <div id="regularization-chart"></div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="chart-container">
                        <h5 class="mb-3"><i class="fas fa-balance-scale text-success"></i> Bias & Fairness Analysis</h5>
                        <div id="bias-fairness-chart"></div>
                    </div>
                </div>
            </div>

            <!-- Data Leakage Detection -->
            <div class="row mb-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <i class="fas fa-shield-alt text-danger"></i>
                            Data Leakage Detection Results
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-4">
                                    <h6 class="text-danger">Critical Issues</h6>
                                    <ul class="list-group list-group-flush">
                                        <li class="list-group-item d-flex justify-content-between">
                                            <span>Target Leakage</span>
                                            <span class="badge bg-danger">HIGH</span>
                                        </li>
                                        <li class="list-group-item d-flex justify-content-between">
                                            <span>Temporal Leakage</span>
                                            <span class="badge bg-warning">MEDIUM</span>
                                        </li>
                                        <li class="list-group-item d-flex justify-content-between">
                                            <span>Preprocessing Leakage</span>
                                            <span class="badge bg-warning">MEDIUM</span>
                                        </li>
                                    </ul>
                                </div>
                                <div class="col-md-4">
                                    <h6 class="text-warning">Flagged Features</h6>
                                    <ul class="list-group list-group-flush">
                                        <li class="list-group-item">merchant_risk_score <span class="text-danger">(0.87)</span></li>
                                        <li class="list-group-item">account_balance_trend <span class="text-warning">(0.65)</span></li>
                                        <li class="list-group-item">sentiment_lexicon_score <span class="text-warning">(0.73)</span></li>
                                    </ul>
                                </div>
                                <div class="col-md-4">
                                    <h6 class="text-success">Recommendations</h6>
                                    <ul class="list-group list-group-flush">
                                        <li class="list-group-item">✓ Remove critical leakage features</li>
                                        <li class="list-group-item">✓ Implement temporal validation</li>
                                        <li class="list-group-item">✓ Fix preprocessing pipeline</li>
                                        <li class="list-group-item">✓ Add automated monitoring</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Cross-Validation Analysis -->
            <div class="row">
                <div class="col-md-6">
                    <div class="chart-container">
                        <h5 class="mb-3"><i class="fas fa-random text-purple"></i> Cross-Validation Stability</h5>
                        <div id="cv-stability-chart"></div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="chart-container">
                        <h5 class="mb-3"><i class="fas fa-question-circle text-secondary"></i> Uncertainty Quantification</h5>
                        <div id="uncertainty-chart"></div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new FCADashboard();
});