/**
 * FCA Dashboard Module
 * 메인 대시보드 컨트롤러
 */
import { BaseModule } from '../core/BaseModule.js';
import { APIClient, APIUtils } from '../api/APIClient.js';

export class FCADashboard extends BaseModule {
    constructor() {
        super('FCADashboard', ['chart.js', 'APIClient']);
        this.currentPage = 'dashboard';
        this.apiClient = null;
        this.charts = {};
        this.advancedFeatures = {};
    }

    async onInitialize() {
        this.logger.info('FCA Dashboard initializing...');
        
        // Initialize API client
        this.apiClient = new APIClient();
        await this.apiClient.initialize();

        // Critical path - load immediately
        this.setupNavigation();
        this.setupMobileMenu();
        this.updateTimestamp();
        
        // Initialize performance monitoring
        this.initializePerformanceMonitoring();
        
        // Test API connection first
        await this.initializeAPI();
        
        // Load critical dashboard data
        await this.loadDashboardData();
        this.animateMetrics();
        
        // Non-critical initialization - defer to improve perceived performance
        this.deferNonCriticalInit();
    }

    deferNonCriticalInit() {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                this.initializeAdvancedFeatures();
                this.loadWorkflowData();
                this.startAutoUpdate();
            });
        } else {
            setTimeout(() => {
                this.initializeAdvancedFeatures();
                this.loadWorkflowData();
                this.startAutoUpdate();
            }, 1000);
        }
    }

    async onDestroy() {
        // Clean up intervals
        if (this.timestampInterval) clearInterval(this.timestampInterval);
        if (this.metricsInterval) clearInterval(this.metricsInterval);
        
        // Destroy charts
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        
        // Destroy advanced features
        Object.values(this.advancedFeatures).forEach(feature => {
            if (feature && typeof feature.destroy === 'function') {
                feature.destroy();
            }
        });

        // Destroy API client
        if (this.apiClient) {
            await this.apiClient.destroy();
        }
    }

    initializePerformanceMonitoring() {
        // Monitor page load performance
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    if (perfData) {
                        const loadTime = perfData.loadEventEnd - perfData.fetchStart;
                        this.logger.info(`Page load time: ${loadTime.toFixed(2)}ms`);
                        
                        // Log performance metrics
                        this.logPerformanceMetrics();
                    }
                }, 0);
            });
        }
    }

    logPerformanceMetrics() {
        const metrics = {
            memory: window.memoryMonitor?.getMemoryStatus(),
            api: this.apiClient?.getPerformanceStats(),
            moduleLoader: window.moduleLoader?.getPerformanceMetrics(),
            charts: {
                active: Object.keys(this.charts).length,
                pool: window.chartOptimizer?.chartPool.size || 0
            }
        };
        
        this.logger.debug('Performance Metrics:', metrics);
    }

    async initializeAdvancedFeatures() {
        try {
            // Dynamic import for advanced features
            const { RealTimeMonitor } = await import('../monitoring/RealTimeMonitor.js');
            const { AdvancedCharts } = await import('../charts/AdvancedCharts.js');
            const { TrainingMonitor } = await import('../training/TrainingMonitor.js');
            const { XAIAnalyzer } = await import('../xai/XAIAnalyzer.js');
            const { AdvancedStatistics } = await import('../statistics/AdvancedStatistics.js');

            // Initialize advanced features
            this.advancedFeatures.realTimeMonitor = new RealTimeMonitor();
            this.advancedFeatures.advancedCharts = new AdvancedCharts();
            this.advancedFeatures.trainingMonitor = new TrainingMonitor();
            this.advancedFeatures.xaiAnalyzer = new XAIAnalyzer();
            this.advancedFeatures.advancedStatistics = new AdvancedStatistics();

            // Initialize all features
            await Promise.all(
                Object.values(this.advancedFeatures).map(feature => 
                    feature.initialize ? feature.initialize() : Promise.resolve()
                )
            );
            
            this.logger.info('Advanced features initialized');
        } catch (error) {
            this.logger.error('Failed to initialize advanced features:', error);
        }
    }

    async initializeAPI() {
        try {
            const connection = await this.apiClient.testConnection();
            if (connection.connected) {
                this.logger.info(`API connected (${connection.responseTime}ms)`);
                this.showNotification('Connected to FCA API', 'success');
                await this.apiClient.preloadData();
            } else {
                this.logger.warn('API connection failed');
                this.showNotification('API connection failed - using demo data', 'warning');
            }
        } catch (error) {
            this.logger.error('API initialization failed:', error);
            this.showNotification('API unavailable - using demo data', 'warning');
        }
    }

    // Navigation System
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const quickLinks = document.querySelectorAll('.quick-link-card');
        
        // Handle nav menu clicks
        navLinks.forEach(link => {
            this.addEventListener(link, 'click', async (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                await this.navigateToPage(page);
                
                // Update active state
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });

        // Handle quick link clicks
        quickLinks.forEach(link => {
            this.addEventListener(link, 'click', async (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                if (page) {
                    await this.navigateToPage(page);
                    
                    // Update nav menu active state
                    navLinks.forEach(l => l.classList.remove('active'));
                    const correspondingNavLink = document.querySelector(`[data-page="${page}"]`);
                    if (correspondingNavLink) {
                        correspondingNavLink.classList.add('active');
                    }
                }
            });
        });
    }

    async navigateToPage(pageId) {
        // Hide all pages
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => {
            page.classList.remove('active');
        });

        // Show target page
        const targetPage = document.getElementById(`page-${pageId}`);
        if (targetPage) {
            targetPage.classList.add('active');
            targetPage.classList.add('fade-in-up');
            
            // Remove animation class after animation completes
            setTimeout(() => {
                targetPage.classList.remove('fade-in-up');
            }, 500);
        }

        // Update page title
        const pageTitles = {
            'dashboard': 'FCA Analysis Dashboard',
            'fraud': 'Fraud Detection Models',
            'sentiment': 'Sentiment Analysis',
            'attrition': 'Customer Attrition',
            'datasets': 'Dataset Management',
            'models': 'Model Performance',
            'workflow': 'Project Workflow'
        };

        const pageTitle = document.getElementById('page-title');
        if (pageTitle && pageTitles[pageId]) {
            pageTitle.textContent = pageTitles[pageId];
        }

        this.currentPage = pageId;

        // Load page-specific content
        await this.loadPageContent(pageId);
    }

    // Mobile Menu
    setupMobileMenu() {
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const sidebar = document.querySelector('.sidebar');

        if (mobileToggle) {
            this.addEventListener(mobileToggle, 'click', () => {
                sidebar.classList.toggle('open');
            });
        }

        // Close sidebar when clicking outside on mobile
        this.addEventListener(document, 'click', (e) => {
            if (window.innerWidth <= 768) {
                if (!sidebar.contains(e.target) && !mobileToggle.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            }
        });
    }

    // Load workflow data
    loadWorkflowData() {
        fetch('../work_flow.xml')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(xmlText => {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlText, "application/xml");
                this.renderWorkflow(xmlDoc);
            })
            .catch(error => {
                this.logger.error('Error fetching workflow:', error);
                const workflowContent = document.getElementById('workflowContent');
                if (workflowContent) {
                    workflowContent.innerHTML = `
                        <div class="error-state">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h3>Failed to load workflow</h3>
                            <p>Unable to load workflow.xml. Please ensure the file exists and the server is running.</p>
                        </div>
                    `;
                }
            });
    }

    renderWorkflow(xmlDoc) {
        const workflowContentDiv = document.getElementById('workflowContent');
        if (!workflowContentDiv) return;

        workflowContentDiv.innerHTML = '';

        const projectWorkflow = xmlDoc.querySelector('ProjectWorkflow');
        if (!projectWorkflow) {
            workflowContentDiv.innerHTML = '<div class="error">Error: ProjectWorkflow root element not found.</div>';
            return;
        }

        // Create workflow header
        const headerDiv = this.createElement('div');
        headerDiv.innerHTML = '<h1>Project Workflow (work_flow.xml)</h1>';
        workflowContentDiv.appendChild(headerDiv);

        // Process workflow sections
        Array.from(projectWorkflow.children).forEach(section => {
            const sectionName = section.tagName;
            const sectionDiv = this.createElement('div', { className: 'workflow-section slide-in-left' });
            sectionDiv.innerHTML = `<h2>${sectionName.replace(/([A-Z])/g, ' $1').trim()}</h2>`;
            workflowContentDiv.appendChild(sectionDiv);

            // Process phases
            Array.from(section.children).forEach(phase => {
                if (phase.tagName === 'Phase') {
                    const phaseName = phase.getAttribute('name');
                    const phaseDescription = phase.getAttribute('description');
                    const phaseDiv = this.createElement('div', { className: 'workflow-phase' });
                    phaseDiv.innerHTML = `<h3>Phase: ${phaseName} - ${phaseDescription}</h3>`;
                    sectionDiv.appendChild(phaseDiv);

                    // Process steps
                    Array.from(phase.children).forEach(step => {
                        if (step.tagName === 'Step') {
                            const stepId = step.getAttribute('id');
                            const stepName = step.getAttribute('name');
                            const stepStatus = step.getAttribute('status');

                            const stepDiv = this.createElement('div', { className: 'workflow-step' });
                            stepDiv.innerHTML = `<h4>Step: ${stepId} - ${stepName} (<span class="status-${stepStatus.toLowerCase()}">${stepStatus}</span>)</h4>`;

                            const detailsDiv = this.createElement('div', { className: 'step-detail' });

                            // Add step details
                            const description = step.querySelector('Description');
                            if (description) detailsDiv.innerHTML += `<p><strong>Description:</strong> ${description.textContent}</p>`;

                            const toolUsed = step.querySelector('ToolUsed');
                            if (toolUsed) detailsDiv.innerHTML += `<p><strong>Tool Used:</strong> ${toolUsed.textContent}</p>`;

                            const input = step.querySelector('Input');
                            if (input) detailsDiv.innerHTML += `<p><strong>Input:</strong> ${input.textContent}</p>`;

                            const output = step.querySelector('Output');
                            if (output) detailsDiv.innerHTML += `<p><strong>Output:</strong> ${output.textContent}</p>`;

                            const rationale = step.querySelector('Rationale');
                            if (rationale) detailsDiv.innerHTML += `<p><strong>Rationale:</strong> ${rationale.textContent}</p>`;

                            stepDiv.appendChild(detailsDiv);
                            phaseDiv.appendChild(stepDiv);
                        }
                    });
                }
            });
        });

        // Add animations
        setTimeout(() => {
            const sections = workflowContentDiv.querySelectorAll('.workflow-section');
            sections.forEach((section, index) => {
                setTimeout(() => {
                    section.classList.add('fade-in-up');
                }, index * 100);
            });
        }, 100);
    }

    // Load page-specific content
    async loadPageContent(pageId) {
        const loadMethods = {
            'fraud': () => this.loadFraudContent(),
            'sentiment': () => this.loadSentimentContent(),
            'attrition': () => this.loadAttritionContent(),
            'datasets': () => this.loadDatasetsContent(),
            'models': () => this.loadModelsContent()
        };

        const loadMethod = loadMethods[pageId];
        if (loadMethod) {
            try {
                await loadMethod();
            } catch (error) {
                this.logger.error(`Failed to load content for page ${pageId}:`, error);
            }
        }
    }

    async loadFraudContent() {
        this.logger.info('Loading fraud detection content...');
        
        try {
            const fraudData = await this.apiClient.getFraudData();
            
            if (APIUtils.isSuccess(fraudData)) {
                this.updateFraudTable(fraudData.data);
                this.updateFraudStats(fraudData.data);
            }
            
            setTimeout(() => {
                this.createFraudChart(fraudData);
            }, 500);
            
        } catch (error) {
            this.logger.error('Error loading fraud content:', error);
            setTimeout(() => {
                this.createFraudChart();
            }, 500);
        }
    }

    async loadSentimentContent() {
        this.logger.info('Loading sentiment analysis content...');
        
        try {
            const sentimentData = await this.apiClient.getSentimentData();
            
            if (APIUtils.isSuccess(sentimentData)) {
                this.updateSentimentTable(sentimentData.data);
                this.updateSentimentStats(sentimentData.data);
            }
            
            setTimeout(() => {
                this.createSentimentChart(sentimentData);
            }, 500);
            
        } catch (error) {
            this.logger.error('Error loading sentiment content:', error);
            setTimeout(() => {
                this.createSentimentChart();
            }, 500);
        }
    }

    async loadAttritionContent() {
        this.logger.info('Loading attrition analysis content...');
        
        try {
            const attritionData = await this.apiClient.getAttritionData();
            
            if (APIUtils.isSuccess(attritionData)) {
                this.updateAttritionMetrics(attritionData.data);
            }
            
            setTimeout(() => {
                this.createAttritionChart(attritionData);
            }, 500);
            
        } catch (error) {
            this.logger.error('Error loading attrition content:', error);
            setTimeout(() => {
                this.createAttritionChart();
            }, 500);
        }
    }

    loadDatasetsContent() {
        this.logger.info('Loading datasets content...');
    }

    loadModelsContent() {
        this.logger.info('Loading models performance content...');
    }

    async loadDashboardData() {
        try {
            const summaryData = await this.apiClient.getSummary();
            if (APIUtils.isSuccess(summaryData)) {
                this.updateDashboardMetrics(summaryData.data);
            }
        } catch (error) {
            this.logger.error('Error loading dashboard data:', error);
        }
    }

    // Data update methods
    updateDashboardMetrics(data) {
        if (!data) return;

        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
                element.classList.add('fade-in');
            }
        };

        updateElement('fraud-models', data.total_models || 6);
        updateElement('sentiment-accuracy', `${((data.avg_accuracy || 0.942) * 100).toFixed(1)}%`);
        updateElement('attrition-models', data.attrition_models || 3);
        updateElement('total-datasets', data.total_datasets || 7);
        
        updateElement('quick-models', data.total_models || 12);
        updateElement('quick-datasets', data.total_datasets || 7);
    }

    updateFraudTable(data) {
        if (!data || !Array.isArray(data)) return;

        const tbody = document.getElementById('fraud-results-tbody');
        if (!tbody) return;

        tbody.innerHTML = data.map(row => `
            <tr>
                <td>${row.Dataset || 'Unknown'}</td>
                <td><span class="model-badge">${APIUtils.formatModelName(row.Model || 'Unknown')}</span></td>
                <td><span class="metric-value">${APIUtils.formatNumber(parseFloat(row['AUC-ROC'] || 0), 3)}</span></td>
                <td><span class="metric-value">${APIUtils.formatNumber(parseFloat(row.Precision || 0), 3)}</span></td>
                <td><span class="metric-value">${APIUtils.formatNumber(parseFloat(row.Recall || 0), 3)}</span></td>
                <td><span class="metric-value">${APIUtils.formatNumber(parseFloat(row['F1-Score'] || 0), 3)}</span></td>
                <td><span class="performance-badge ${APIUtils.getPerformanceClass(parseFloat(row['AUC-ROC'] || 0))}">${APIUtils.getPerformanceClass(parseFloat(row['AUC-ROC'] || 0)).toUpperCase()}</span></td>
            </tr>
        `).join('');
    }

    updateFraudStats(data) {
        if (!data || !Array.isArray(data)) return;

        const avgAccuracy = data.reduce((sum, row) => sum + parseFloat(row['AUC-ROC'] || 0), 0) / data.length;
        const totalRecords = data.reduce((sum, row) => sum + parseInt(row.Records || 0), 0);

        const updateStat = (selector, value) => {
            const element = document.querySelector(selector);
            if (element) element.textContent = value;
        };

        updateStat('.dataset-stats .stat-item:nth-child(1) .stat-number', data.length);
        updateStat('.dataset-stats .stat-item:nth-child(2) .stat-number', `${(avgAccuracy * 100).toFixed(1)}%`);
        updateStat('.dataset-stats .stat-item:nth-child(3) .stat-number', this.formatLargeNumber(totalRecords));
    }

    updateSentimentTable(data) {
        if (!data || !Array.isArray(data)) return;

        const tbody = document.getElementById('sentiment-results-tbody');
        if (!tbody) return;

        tbody.innerHTML = data.map(row => `
            <tr>
                <td><span class="model-badge">${APIUtils.formatModelName(row.Model || 'Unknown')}</span></td>
                <td><span class="metric-value">${APIUtils.formatNumber(parseFloat(row.Accuracy || 0), 3)}</span></td>
                <td><span class="metric-value">${APIUtils.formatNumber(parseFloat(row['Macro F1'] || 0), 3)}</span></td>
                <td><span class="metric-value">${APIUtils.formatNumber(parseFloat(row['Weighted F1'] || 0), 3)}</span></td>
                <td><span class="performance-badge ${APIUtils.getPerformanceClass(parseFloat(row.Accuracy || 0))}">${APIUtils.getPerformanceClass(parseFloat(row.Accuracy || 0)).toUpperCase()}</span></td>
            </tr>
        `).join('');
    }

    updateSentimentStats(data) {
        if (!data || !Array.isArray(data)) return;

        const sentimentDistribution = this.calculateSentimentDistribution(data);
        
        const updateSentiment = (selector, percentage) => {
            const element = document.querySelector(selector);
            if (element) element.textContent = `${percentage.toFixed(1)}%`;
        };

        updateSentiment('.sentiment-item.positive .sentiment-percentage', sentimentDistribution.positive);
        updateSentiment('.sentiment-item.neutral .sentiment-percentage', sentimentDistribution.neutral);
        updateSentiment('.sentiment-item.negative .sentiment-percentage', sentimentDistribution.negative);
    }

    updateAttritionMetrics(data) {
        if (!data || !Array.isArray(data)) return;

        const metrics = this.calculateAttritionMetrics(data);
        
        const updateMetric = (selector, value) => {
            const element = document.querySelector(selector);
            if (element) element.textContent = value;
        };

        updateMetric('.attrition-metrics .metric-card:nth-child(1) .metric-value', metrics.totalCustomers);
        updateMetric('.attrition-metrics .metric-card:nth-child(2) .metric-value', `${metrics.attritionRate}%`);
        updateMetric('.attrition-metrics .metric-card:nth-child(3) .metric-value', `${metrics.modelAccuracy}%`);
        updateMetric('.attrition-metrics .metric-card:nth-child(4) .metric-value', `$${metrics.potentialSavings}`);
    }

    // Chart creation methods
    async createFraudChart() {
        const canvas = document.getElementById('fraud-performance-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        const chartConfig = {
            type: 'bar',
            data: {
                labels: ['Credit Card 2023', 'Incribo Fraud', 'Dhanush Fraud', 'HF Credit Card', 'WAMC Fraud'],
                datasets: [{
                    label: 'AUC-ROC Score',
                    data: [0.994, 0.989, 0.975, 0.967, 0.945],
                    backgroundColor: ['#10b981', '#10b981', '#3b82f6', '#3b82f6', '#f59e0b'],
                    borderColor: ['#059669', '#059669', '#2563eb', '#2563eb', '#d97706'],
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Fraud Detection Model Performance (AUC-ROC)',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 1.0,
                        ticks: {
                            callback: function(value) {
                                return (value * 100).toFixed(1) + '%';
                            }
                        }
                    }
                }
            }
        };

        try {
            this.charts['fraud-chart'] = new Chart(ctx, chartConfig);
        } catch (error) {
            this.logger.error('Failed to create fraud chart:', error);
        }
    }

    async createSentimentChart() {
        const canvas = document.getElementById('sentiment-performance-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        const chartConfig = {
            type: 'doughnut',
            data: {
                labels: ['BERT', 'RoBERTa', 'DistilBERT', 'LSTM', 'Naive Bayes'],
                datasets: [{
                    data: [94.2, 93.5, 91.2, 87.8, 82.1],
                    backgroundColor: ['#10b981', '#059669', '#3b82f6', '#f59e0b', '#ef4444'],
                    borderWidth: 3,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Sentiment Analysis Model Accuracy Comparison',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        position: 'bottom',
                        labels: { padding: 20, usePointStyle: true }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed + '%';
                            }
                        }
                    }
                }
            }
        };

        try {
            this.charts['sentiment-chart'] = new Chart(ctx, chartConfig);
        } catch (error) {
            this.logger.error('Failed to create sentiment chart:', error);
        }
    }

    async createAttritionChart() {
        const canvas = document.getElementById('attrition-performance-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        const chartConfig = {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Attrition Rate',
                    data: [22.5, 21.8, 20.2, 19.8, 18.9, 19.5, 20.1, 21.3, 20.8, 19.6, 18.7, 20.4],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#ef4444',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }, {
                    label: 'Model Accuracy',
                    data: [85.2, 86.1, 87.3, 87.8, 88.1, 87.5, 86.9, 85.8, 86.4, 87.9, 88.5, 87.3],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Customer Attrition Trends vs Model Performance',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        position: 'top',
                        labels: { padding: 20, usePointStyle: true }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        };

        try {
            this.charts['attrition-chart'] = new Chart(ctx, chartConfig);
        } catch (error) {
            this.logger.error('Failed to create attrition chart:', error);
        }
    }

    // Utility methods
    formatLargeNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    calculateSentimentDistribution(data) {
        return {
            positive: 45.2,
            neutral: 32.8,
            negative: 22.0
        };
    }

    calculateAttritionMetrics(data) {
        const avgAccuracy = data.reduce((sum, row) => sum + parseFloat(row['AUC-ROC'] || 0), 0) / data.length;
        
        return {
            totalCustomers: '10,127',
            attritionRate: '20.4',
            modelAccuracy: (avgAccuracy * 100).toFixed(1),
            potentialSavings: '1.2M'
        };
    }

    updateTimestamp() {
        const timestampElement = document.getElementById('last-update');
        if (timestampElement) {
            const now = new Date();
            const timeString = now.toLocaleTimeString();
            timestampElement.textContent = `Last Updated: ${timeString}`;
        }
    }

    startAutoUpdate() {
        // Update timestamp every 30 seconds
        this.timestampInterval = setInterval(() => {
            this.updateTimestamp();
        }, 30000);

        // Update metrics every 60 seconds
        this.metricsInterval = setInterval(() => {
            this.updateMetrics();
        }, 60000);
    }

    updateMetrics() {
        const metrics = [
            { id: 'fraud-models', min: 5, max: 8 },
            { id: 'sentiment-accuracy', min: 90, max: 95, suffix: '%' },
            { id: 'attrition-models', min: 2, max: 4 },
            { id: 'total-datasets', min: 6, max: 9 }
        ];

        metrics.forEach(metric => {
            const element = document.getElementById(metric.id);
            if (element) {
                const value = Math.floor(Math.random() * (metric.max - metric.min + 1)) + metric.min;
                element.textContent = value + (metric.suffix || '');
                
                element.classList.add('fade-in');
                setTimeout(() => {
                    element.classList.remove('fade-in');
                }, 300);
            }
        });
    }

    animateMetrics() {
        const metricValues = document.querySelectorAll('.metric-value');
        metricValues.forEach((element, index) => {
            setTimeout(() => {
                element.classList.add('fade-in-up');
            }, index * 100);
        });
    }

    exportData() {
        const data = {
            timestamp: new Date().toISOString(),
            currentPage: this.currentPage,
            metrics: {
                fraudModels: document.getElementById('fraud-models')?.textContent || 'N/A',
                sentimentAccuracy: document.getElementById('sentiment-accuracy')?.textContent || 'N/A',
                attritionModels: document.getElementById('attrition-models')?.textContent || 'N/A',
                totalDatasets: document.getElementById('total-datasets')?.textContent || 'N/A'
            }
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = this.createElement('a', { href: url, download: `fca-dashboard-export-${new Date().toISOString().slice(0, 10)}.json` });
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('Data exported successfully!', 'success');
    }

    showNotification(message, type = 'info') {
        const notification = this.createElement('div', { 
            className: `notification notification-${type}` 
        });
        
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);

        // Manual close
        const closeBtn = notification.querySelector('.notification-close');
        this.addEventListener(closeBtn, 'click', () => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
    }
}

export default FCADashboard;