// Enhanced FCA Dashboard JavaScript - Advanced Features

class EnhancedFCADashboard {
    constructor() {
        this.charts = {};
        this.updateInterval = 5000; // 5초마다 업데이트
        this.validationData = {
            currentScore: 9.25,
            maxScore: 10,
            improvements: {
                dataLeakage: { before: 4, after: 9 },
                overfitting: { before: 6, after: 9 },
                validation: { before: 7, after: 10 },
                features: { before: 5, after: 9 }
            }
        };
        this.systemMetrics = {
            fraudAccuracy: null,
            sentimentAccuracy: null,
            attritionAccuracy: null,
            validationScore: 9.25
        };
    }

    init() {
        this.setupEventListeners();
        this.initializeCharts();
        this.startRealTimeUpdates();
        this.updateValidationDisplay();
        this.initializeNavigation();
        this.loadInitialData();
        
        console.log('Enhanced FCA Dashboard initialized successfully');
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Mobile menu toggle
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        if (mobileToggle) {
            mobileToggle.addEventListener('click', this.toggleMobileMenu.bind(this));
        }

        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', this.handleNavigation.bind(this));
        });

        // Export button
        const exportBtn = document.querySelector('.btn-export');
        if (exportBtn) {
            exportBtn.addEventListener('click', this.exportData.bind(this));
        }

        // Refresh button
        const refreshBtn = document.querySelector('.btn-refresh');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', this.refreshData.bind(this));
        }

        // Chart controls
        const performanceTimeframe = document.getElementById('performance-timeframe');
        if (performanceTimeframe) {
            performanceTimeframe.addEventListener('change', this.updatePerformanceChart.bind(this));
        }

        // Log level filter
        const logFilter = document.getElementById('log-level-filter');
        if (logFilter) {
            logFilter.addEventListener('change', this.filterLogs.bind(this));
        }

        // Window resize handler
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    // Mobile Menu Toggle
    toggleMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        sidebar.classList.toggle('open');
        mainContent.classList.toggle('shifted');
    }

    // Navigation Handler
    handleNavigation(event) {
        event.preventDefault();
        
        const link = event.currentTarget;
        const pageId = link.getAttribute('data-page');
        
        // Remove active class from all links and pages
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        
        // Add active class to clicked link and corresponding page
        link.classList.add('active');
        const targetPage = document.getElementById(`page-${pageId}`);
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        // Update page title and breadcrumb
        const pageTitle = link.textContent.trim();
        document.getElementById('page-title').textContent = pageTitle;
        document.getElementById('breadcrumb-path').textContent = `home > ${pageTitle}`;
        
        // Close mobile menu if open
        if (window.innerWidth <= 768) {
            const sidebar = document.querySelector('.sidebar');
            const mainContent = document.querySelector('.main-content');
            sidebar.classList.remove('open');
            mainContent.classList.remove('shifted');
        }
        
        // Initialize dataset charts if datasets page is selected
        if (pageId === 'datasets') {
            setTimeout(() => {
                initializeDatasetCharts();
            }, 100);
        }
    }

    // Initialize Navigation
    initializeNavigation() {
        // Set dashboard as default active page
        const dashboardLink = document.querySelector('.nav-link[data-page="dashboard"]');
        const dashboardPage = document.getElementById('page-dashboard');
        
        if (dashboardLink && dashboardPage) {
            dashboardLink.classList.add('active');
            dashboardPage.classList.add('active');
        }
    }

    // Chart Initialization
    initializeCharts() {
        this.initPerformanceChart();
        this.initLearningCurveChart();
        this.initAdditionalCharts();
        this.updateValidationCircle();
        
        console.log('Charts initialized');
    }

    // Initialize Additional Charts for Other Pages
    initAdditionalCharts() {
        // Fraud Detection Chart
        this.initFraudDetectionChart();
        
        // Sentiment Distribution Chart
        this.initSentimentDistributionChart();
        
        // Attrition Trend Chart
        this.initAttritionTrendChart();
        
        // Model Comparison Radar Chart
        this.initModelComparisonRadarChart();
        
        // Feature Importance Chart
        this.initFeatureImportanceChart();
    }

    // Fraud Detection Chart
    initFraudDetectionChart() {
        const ctx = document.getElementById('fraud-detection-chart');
        if (!ctx) return;

        this.charts.fraudDetection = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.generateTimeLabels(12),
                datasets: [{
                    label: '처리된 거래',
                    data: [1200, 1180, 1220, 1250, 1190, 1240, 1210, 1280, 1230, 1260, 1247, 1270],
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    yAxisID: 'y'
                }, {
                    label: '탐지된 사기',
                    data: [5, 3, 4, 6, 2, 5, 3, 7, 4, 5, 3, 4],
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: '처리된 거래'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: '탐지된 사기'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });
    }

    // Sentiment Distribution Chart
    initSentimentDistributionChart() {
        const ctx = document.getElementById('sentiment-distribution-chart');
        if (!ctx) return;

        this.charts.sentimentDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['긍정', '중립', '부정'],
                datasets: [{
                    data: [67, 21, 12],
                    backgroundColor: [
                        '#28a745',
                        '#ffc107', 
                        '#dc3545'
                    ],
                    borderWidth: 3,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Attrition Trend Chart
    initAttritionTrendChart() {
        const ctx = document.getElementById('attrition-trend-chart');
        if (!ctx) return;

        this.charts.attritionTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['1월', '2월', '3월', '4월', '5월', '6월'],
                datasets: [{
                    label: '이탈 위험 고객',
                    data: [180, 165, 172, 148, 156, 142],
                    borderColor: '#ffc107',
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }, {
                    label: '실제 이탈 고객',
                    data: [145, 132, 128, 118, 124, 108],
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '고객 수'
                        }
                    }
                }
            }
        });
    }

    // Model Comparison Radar Chart
    initModelComparisonRadarChart() {
        const ctx = document.getElementById('model-comparison-radar-chart');
        if (!ctx) return;

        this.charts.modelComparisonRadar = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['정확도', '속도', '안정성', '확장성', '효율성'],
                datasets: [{
                    label: 'Random Forest',
                    data: [95, 90, 88, 85, 90],
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.2)',
                    borderWidth: 2
                }, {
                    label: 'Gradient Boosting',
                    data: [92, 75, 90, 88, 85],
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.2)',
                    borderWidth: 2
                }, {
                    label: 'LSTM',
                    data: [88, 60, 92, 90, 75],
                    borderColor: '#ffc107',
                    backgroundColor: 'rgba(255, 193, 7, 0.2)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Feature Importance Chart
    initFeatureImportanceChart() {
        const ctx = document.getElementById('feature-importance-chart');
        if (!ctx) return;

        this.charts.featureImportance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Amount', 'Time', 'V14', 'V12', 'V10', 'V4', 'V11', 'V2'],
                datasets: [{
                    label: '특성 중요도',
                    data: [0.85, 0.72, 0.68, 0.55, 0.48, 0.42, 0.38, 0.33],
                    backgroundColor: [
                        '#007bff', '#28a745', '#ffc107', '#dc3545',
                        '#6f42c1', '#e83e8c', '#fd7e14', '#20c997'
                    ],
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 1.0,
                        title: {
                            display: true,
                            text: '중요도'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '특성'
                        }
                    }
                }
            }
        });
    }

    // Performance Trend Chart
    initPerformanceChart() {
        const ctx = document.getElementById('performance-trend-chart');
        if (!ctx) return;

        const timeLabels = this.generateTimeLabels(24);
        const performanceData = this.generatePerformanceData(24);

        this.charts.performance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: timeLabels,
                datasets: [{
                    label: 'fraud detection 정확도',
                    data: performanceData.fraud,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'sentiment analysis 정확도',
                    data: performanceData.sentiment,
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                }, {
                    label: '이탈 예측 정확도',
                    data: performanceData.attrition,
                    borderColor: '#ffc107',
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.y.toFixed(2) + '%';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'time'
                        }
                    },
                    y: {
                        beginAtZero: false,
                        min: 80,
                        max: 100,
                        title: {
                            display: true,
                            text: '정확도 (%)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    // Learning Curve Chart
    initLearningCurveChart() {
        const ctx = document.getElementById('learning-curve-chart');
        if (!ctx) return;

        const trainingSizes = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
        const trainingScores = [0.85, 0.87, 0.89, 0.91, 0.93, 0.94, 0.95, 0.96, 0.97, 0.98];
        const validationScores = [0.82, 0.84, 0.86, 0.87, 0.88, 0.89, 0.90, 0.91, 0.92, 0.92];

        this.charts.learningCurve = new Chart(ctx, {
            type: 'line',
            data: {
                labels: trainingSizes.map(size => `${(size * 100).toFixed(0)}%`),
                datasets: [{
                    label: '훈련 점수',
                    data: trainingScores,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.3
                }, {
                    label: '검증 점수',
                    data: validationScores,
                    borderColor: '#764ba2',
                    backgroundColor: 'rgba(118, 75, 162, 0.1)',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + (context.parsed.y * 100).toFixed(1) + '%';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '훈련 데이터 size'
                        }
                    },
                    y: {
                        min: 0.8,
                        max: 1.0,
                        title: {
                            display: true,
                            text: '정확도'
                        },
                        ticks: {
                            callback: function(value) {
                                return (value * 100).toFixed(0) + '%';
                            }
                        }
                    }
                }
            }
        });

        // Update overfitting status
        this.updateOverfittingStatus(trainingScores, validationScores);
    }

    // Update Overfitting Status
    updateOverfittingStatus(trainScores, valScores) {
        const finalTrainScore = trainScores[trainScores.length - 1];
        const finalValScore = valScores[valScores.length - 1];
        const gap = finalTrainScore - finalValScore;
        
        const statusElement = document.getElementById('overfitting-status');
        if (!statusElement) return;

        let riskLevel, riskColor, riskIcon;
        
        if (gap < 0.05) {
            riskLevel = 'LOW';
            riskColor = '#28a745';
            riskIcon = 'fas fa-check-circle';
        } else if (gap < 0.1) {
            riskLevel = 'MEDIUM';
            riskColor = '#ffc107';
            riskIcon = 'fas fa-exclamation-triangle';
        } else {
            riskLevel = 'HIGH';
            riskColor = '#dc3545';
            riskIcon = 'fas fa-times-circle';
        }

        statusElement.innerHTML = `
            <i class="${riskIcon}" style="color: ${riskColor}"></i>
            <span>오버피팅 위험: <strong style="color: ${riskColor}">${riskLevel}</strong></span>
        `;
    }

    // Update Validation Circle
    updateValidationCircle() {
        const circle = document.querySelector('.circle-progress');
        if (!circle) return;

        const percentage = (this.validationData.currentScore / this.validationData.maxScore) * 100;
        const degrees = (percentage / 100) * 360;
        
        circle.style.background = `conic-gradient(#007bff 0deg, #007bff ${degrees}deg, #dee2e6 ${degrees}deg)`;
    }

    // Generate Time Labels
    generateTimeLabels(hours) {
        const labels = [];
        const now = new Date();
        
        for (let i = hours; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 60 * 60 * 1000);
            labels.push(time.toLocaleTimeString('ko-KR', { 
                hour: '2-digit', 
                minute: '2-digit',
                hourCycle: 'h23'
            }));
        }
        
        return labels;
    }

    // Generate Performance Data
    generatePerformanceData(points) {
        const data = {
            fraud: [],
            sentiment: [],
            attrition: []
        };
        
        let fraudAcc = 94.5;
        let sentimentAcc = 88.0;
        let attritionAcc = 90.5;
        
        for (let i = 0; i < points; i++) {
            // fraud detection - 높은 정확도, 작은 변동
            fraudAcc += (Math.random() - 0.5) * 0.5;
            fraudAcc = Math.max(94.0, Math.min(95.5, fraudAcc));
            data.fraud.push(parseFloat(fraudAcc.toFixed(2)));
            
            // sentiment analysis - 중간 정확도, 중간 변동
            sentimentAcc += (Math.random() - 0.5) * 2;
            sentimentAcc = Math.max(85.0, Math.min(92.0, sentimentAcc));
            data.sentiment.push(parseFloat(sentimentAcc.toFixed(2)));
            
            // 이탈 예측 - 중간 정확도, 중간 변동
            attritionAcc += (Math.random() - 0.5) * 1.5;
            attritionAcc = Math.max(88.0, Math.min(94.0, attritionAcc));
            data.attrition.push(parseFloat(attritionAcc.toFixed(2)));
        }
        
        return data;
    }

    // Update Validation Display
    updateValidationDisplay() {
        // Update main validation score
        const validationDisplay = document.getElementById('validation-score-display');
        if (validationDisplay) {
            validationDisplay.textContent = `${this.validationData.currentScore}/10`;
        }

        // Update leakage score in sidebar
        const leakageScore = document.getElementById('leakage-score');
        if (leakageScore) {
            leakageScore.textContent = `${this.validationData.currentScore}/10`;
        }

        // Update breakdown bars
        this.updateBreakdownBars();
    }

    // Update Breakdown Bars
    updateBreakdownBars() {
        const improvements = this.validationData.improvements;
        
        Object.keys(improvements).forEach(key => {
            const barFill = document.querySelector(`.breakdown-item:has(.breakdown-label:contains("${this.getBreakdownLabel(key)}")) .bar-fill`);
            if (barFill) {
                const percentage = (improvements[key].after / 10) * 100;
                barFill.style.width = `${percentage}%`;
            }
        });
    }

    // Get Breakdown Label
    getBreakdownLabel(key) {
        const labels = {
            dataLeakage: '데이터 누출 방지',
            overfitting: '오버피팅 방지',
            validation: '검증 방법론',
            features: '특성 엔지니어링'
        };
        return labels[key] || key;
    }

    // Load Initial Data
    async loadInitialData() {
        try {
            await this.loadSystemMetrics();
            await this.loadModelStatus();
            await this.loadPerformanceData();
            await this.loadModelComparison();
            this.updateSystemLogs();
            this.updateLastUpdateTime();
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.showNotification('데이터 로드 failed', 'error');
            // Fallback to mock data
            this.updateSystemMetrics();
            this.updatePredictions();
        }
    }

    // Load System Metrics from API
    async loadSystemMetrics() {
        try {
            const response = await fetch('/api/metrics');
            if (!response.ok) throw new Error('API call failed');
            
            const data = await response.json();
            this.updateSystemMetricsFromAPI(data);
            this.updatePredictionsFromAPI(data);
        } catch (error) {
            console.error('Failed to load system metrics:', error);
            // Fallback to existing mock data methods
            this.updateSystemMetrics();
            this.updatePredictions();
        }
    }

    // Load Model Status from API
    async loadModelStatus() {
        try {
            const response = await fetch('/api/models/status');
            if (!response.ok) throw new Error('API call failed');
            
            const data = await response.json();
            this.updateModelStatusDisplay(data);
        } catch (error) {
            console.error('Failed to load model status:', error);
        }
    }

    // Load Model Comparison Data from API
    async loadModelComparison() {
        try {
            const response = await fetch('/api/models/comparison');
            if (!response.ok) throw new Error('API call failed');
            
            const data = await response.json();
            this.updateModelComparisonDisplay(data);
        } catch (error) {
            console.error('Failed to load model comparison:', error);
        }
    }

    // Load Performance Chart Data from API
    async loadPerformanceData() {
        try {
            const response = await fetch('/api/charts/performance');
            if (!response.ok) throw new Error('API call failed');
            
            const data = await response.json();
            this.updatePerformanceChartFromAPI(data);
        } catch (error) {
            console.error('Failed to load performance data:', error);
        }
    }

    // Update System Metrics from API Data
    updateSystemMetricsFromAPI(data) {
        const elements = {
            'fraud-accuracy': data.fraud_detection.accuracy + '%',
            'sentiment-accuracy': data.sentiment_analysis.accuracy + '%',
            'attrition-accuracy': data.attrition_prediction.accuracy + '%',
            'validation-score-main': data.system.validation_score + '/10'
        };

        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = elements[id];
            }
        });

        // Update quick stats in sidebar
        const quickAccuracy = document.getElementById('quick-accuracy');
        if (quickAccuracy) {
            const avgAccuracy = ((data.fraud_detection.accuracy + 
                               data.sentiment_analysis.accuracy + 
                               data.attrition_prediction.accuracy) / 3).toFixed(1);
            quickAccuracy.textContent = avgAccuracy + '%';
        }

        const quickSpeed = document.getElementById('quick-speed');
        if (quickSpeed) {
            quickSpeed.textContent = data.fraud_detection.processing_speed + 'ms';
        }
    }

    // Update Predictions from API Data
    updatePredictionsFromAPI(data) {
        // Update fraud detection metrics
        const fraudElements = document.querySelectorAll('.fraud-prediction .metric-value');
        if (fraudElements.length >= 3) {
            fraudElements[0].textContent = data.fraud_detection.processed_transactions.toLocaleString();
            fraudElements[1].textContent = data.fraud_detection.detected_fraud;
            fraudElements[2].textContent = data.fraud_detection.accuracy.toFixed(2) + '%';
        }

        // Update sentiment analysis metrics
        const sentimentElements = document.querySelectorAll('.sentiment-prediction .metric-value');
        if (sentimentElements.length >= 3) {
            sentimentElements[0].textContent = data.sentiment_analysis.analyzed_texts.toLocaleString();
            sentimentElements[1].textContent = data.sentiment_analysis.positive_ratio + '%';
            sentimentElements[2].textContent = data.sentiment_analysis.accuracy.toFixed(1) + '%';
        }

        // Update attrition prediction metrics
        const attritionElements = document.querySelectorAll('.attrition-prediction .metric-value');
        if (attritionElements.length >= 3) {
            attritionElements[0].textContent = data.attrition_prediction.analyzed_customers.toLocaleString();
            attritionElements[1].textContent = data.attrition_prediction.high_risk_customers;
            attritionElements[2].textContent = data.attrition_prediction.accuracy.toFixed(1) + '%';
        }
    }

    // Update Model Status Display
    updateModelStatusDisplay(data) {
        // Update system status indicator
        const statusElement = document.getElementById('system-status');
        if (statusElement) {
            statusElement.className = data.engines_available ? 'status-dot online' : 'status-dot offline';
        }

        // Update validation score displays
        const validationElements = ['validation-score-display', 'leakage-score', 'validation-score-main'];
        validationElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = data.system_metrics.validation_score + '/10';
            }
        });
    }

    // Update Performance Chart from API Data
    updatePerformanceChartFromAPI(data) {
        if (!this.charts.performance) return;

        this.charts.performance.data.labels = data.labels;
        this.charts.performance.data.datasets[0].data = data.fraud_accuracy;
        this.charts.performance.data.datasets[1].data = data.sentiment_accuracy;
        this.charts.performance.data.datasets[2].data = data.attrition_accuracy;
        
        this.charts.performance.update();
    }

    // Update Model Comparison Display
    updateModelComparisonDisplay(data) {
        console.log('Model comparison data loaded:', data);
        
        // Update detailed comparison chart if element exists
        if (data.detailed_comparison && document.getElementById('model-comparison-radar-chart')) {
            this.updateModelComparisonChart(data.detailed_comparison);
        }
    }

    updateModelComparisonChart(models) {
        const ctx = document.getElementById('model-comparison-radar-chart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['정확도', '속도', '메모리 효율성', 'F1 점수', 'AUC-ROC'],
                datasets: models.slice(0, 3).map((model, index) => ({
                    label: model.model,
                    data: [
                        model.accuracy,
                        100 - (model.speed_ms * 2),
                        100 - (model.memory_mb / 2),
                        model.f1_score,
                        model.auc_roc
                    ],
                    borderColor: [`rgba(${index * 60}, ${150 - index * 30}, ${200 + index * 20}, 1)`],
                    backgroundColor: [`rgba(${index * 60}, ${150 - index * 30}, ${200 + index * 20}, 0.2)`],
                    borderWidth: 2
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        pointLabels: {
                            color: '#ffffff'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                }
            }
        });
    }

    // Update System Metrics
    updateSystemMetrics() {
        const elements = {
            'fraud-accuracy': this.systemMetrics.fraudAccuracy + '%',
            'sentiment-accuracy': this.systemMetrics.sentimentAccuracy + '%',
            'attrition-accuracy': this.systemMetrics.attritionAccuracy + '%',
            'validation-score-main': this.systemMetrics.validationScore + '/10'
        };

        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = elements[id];
            }
        });

        // Update quick stats in sidebar
        const quickAccuracy = document.getElementById('quick-accuracy');
        if (quickAccuracy) {
            const avgAccuracy = ((this.systemMetrics.fraudAccuracy + 
                               this.systemMetrics.sentimentAccuracy + 
                               this.systemMetrics.attritionAccuracy) / 3).toFixed(1);
            quickAccuracy.textContent = avgAccuracy + '%';
        }

        const quickSpeed = document.getElementById('quick-speed');
        if (quickSpeed) {
            quickSpeed.textContent = (1.0 + Math.random() * 0.5).toFixed(1) + 'ms';
        }
    }

    // Update Predictions
    updatePredictions() {
        // Update prediction metrics with realistic values
        const fraudProcessed = 1200 + Math.floor(Math.random() * 100);
        const fraudDetected = Math.floor(fraudProcessed * 0.002); // 0.2% fraud rate
        const sentimentTexts = 850 + Math.floor(Math.random() * 100);
        const positiveRatio = 60 + Math.floor(Math.random() * 15); // 60-75%
        const attritionCustomers = 10000;
        const attritionRisk = 150 + Math.floor(Math.random() * 20);

        // Update fraud detection metrics
        const fraudElements = document.querySelectorAll('.fraud-prediction .metric-value');
        if (fraudElements.length >= 3) {
            fraudElements[0].textContent = fraudProcessed.toLocaleString();
            fraudElements[1].textContent = fraudDetected;
            fraudElements[2].textContent = this.systemMetrics.fraudAccuracy + '%';
        }

        // Update sentiment analysis metrics
        const sentimentElements = document.querySelectorAll('.sentiment-prediction .metric-value');
        if (sentimentElements.length >= 3) {
            sentimentElements[0].textContent = sentimentTexts.toLocaleString();
            sentimentElements[1].textContent = positiveRatio + '%';
            sentimentElements[2].textContent = this.systemMetrics.sentimentAccuracy + '%';
        }

        // Update attrition prediction metrics
        const attritionElements = document.querySelectorAll('.attrition-prediction .metric-value');
        if (attritionElements.length >= 3) {
            attritionElements[0].textContent = attritionCustomers.toLocaleString();
            attritionElements[1].textContent = attritionRisk;
            attritionElements[2].textContent = this.systemMetrics.attritionAccuracy + '%';
        }
    }

    // Update System Logs
    updateSystemLogs() {
        const logContainer = document.getElementById('system-logs');
        if (!logContainer) return;

        const logs = this.generateSystemLogs();
        
        logContainer.innerHTML = logs.map(log => `
            <div class="log-entry ${log.level.toLowerCase()}">
                <span class="log-time">${log.time}</span>
                <span class="log-level">${log.level}</span>
                <span class="log-message">${log.message}</span>
            </div>
        `).join('');
    }

    // Generate System Logs
    generateSystemLogs() {
        const messages = [
            { level: 'INFO', message: '개선된 fraud detection 모델 훈련 complete - 정확도: 94.8%' },
            { level: 'SUCCESS', message: '데이터 누출 방지 시스템 적용 complete - 검증 점수: 9.25/10' },
            { level: 'INFO', message: 'time적 교차 검증 실행 중 - 오버피팅 위험: LOW' },
            { level: 'SUCCESS', message: '특성 엔지니어링 개선 complete - 누출 위험 제거됨' },
            { level: 'INFO', message: '예측 시스템 정상 작동 중' },
            { level: 'SUCCESS', message: '학습 곡선 분석 complete - model performance 안정적' },
            { level: 'INFO', message: '검증 프레임워크 초기화 complete' },
            { level: 'SUCCESS', message: 'dashboard 업데이트 complete - 모든 메트릭 정상' }
        ];

        const logs = [];
        const now = new Date();

        for (let i = 0; i < 6; i++) {
            const logTime = new Date(now.getTime() - i * 60000 * 2); // 2분 간격
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            
            logs.push({
                time: logTime.toLocaleTimeString('ko-KR', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit',
                    hourCycle: 'h23'
                }),
                level: randomMessage.level,
                message: randomMessage.message
            });
        }

        return logs;
    }

    // Update Last Update Time
    updateLastUpdateTime() {
        const element = document.getElementById('last-update');
        if (element) {
            const now = new Date();
            element.textContent = `마지막 업데이트: ${now.toLocaleString('ko-KR', { hour12: false })}`;
        }
    }

    // Start Real-time Updates
    startRealTimeUpdates() {
        setInterval(async () => {
            try {
                // Load real data from APIs
                await this.loadSystemMetrics();
                await this.loadPerformanceData();
                this.updateCharts();
                this.updateLastUpdateTime();
                
                // Occasionally update logs
                if (Math.random() > 0.7) {
                    this.updateSystemLogs();
                }
            } catch (error) {
                console.error('Real-time update failed:', error);
                // Fallback to mock data updates
                this.updateSystemMetrics();
                this.updatePredictions();
                this.updateCharts();
                this.updateLastUpdateTime();
            }
        }, this.updateInterval);

        console.log('Real-time updates started with API integration');
    }

    // Update Charts
    updateCharts() {
        // Update performance chart
        if (this.charts.performance) {
            const datasets = this.charts.performance.data.datasets;
            
            // Add new data point
            const newFraudData = 99.5 + (Math.random() - 0.5) * 0.5;
            const newSentimentData = 88.0 + (Math.random() - 0.5) * 2;
            const newAttritionData = 90.5 + (Math.random() - 0.5) * 1.5;
            
            datasets[0].data.push(parseFloat(newFraudData.toFixed(2)));
            datasets[1].data.push(parseFloat(newSentimentData.toFixed(2)));
            datasets[2].data.push(parseFloat(newAttritionData.toFixed(2)));
            
            // Remove old data point
            datasets.forEach(dataset => {
                if (dataset.data.length > 24) {
                    dataset.data.shift();
                }
            });
            
            // Update labels
            const newTime = new Date().toLocaleTimeString('ko-KR', { 
                hour: '2-digit', 
                minute: '2-digit',
                hourCycle: 'h23'
            });
            
            this.charts.performance.data.labels.push(newTime);
            if (this.charts.performance.data.labels.length > 24) {
                this.charts.performance.data.labels.shift();
            }
            
            this.charts.performance.update('none');
        }
    }

    // Performance Chart Update Handler
    updatePerformanceChart(event) {
        const timeframe = event.target.value;
        let hours;
        
        switch(timeframe) {
            case '24h': hours = 24; break;
            case '7d': hours = 24 * 7; break;
            case '30d': hours = 24 * 30; break;
            default: hours = 24;
        }
        
        if (this.charts.performance) {
            this.charts.performance.data.labels = this.generateTimeLabels(hours);
            const newData = this.generatePerformanceData(hours);
            this.charts.performance.data.datasets[0].data = newData.fraud;
            this.charts.performance.data.datasets[1].data = newData.sentiment;
            this.charts.performance.data.datasets[2].data = newData.attrition;
            this.charts.performance.update();
        }
    }

    // Filter Logs
    filterLogs(event) {
        const level = event.target.value;
        const logEntries = document.querySelectorAll('.log-entry');
        
        logEntries.forEach(entry => {
            if (level === 'all') {
                entry.style.display = 'flex';
            } else {
                const entryLevel = entry.querySelector('.log-level').textContent.toLowerCase();
                entry.style.display = entryLevel === level ? 'flex' : 'none';
            }
        });
    }

    // Export Data
    exportData() {
        const data = {
            timestamp: new Date().toISOString(),
            systemMetrics: this.systemMetrics,
            validationData: this.validationData,
            chartData: {
                performance: this.charts.performance?.data,
                learningCurve: this.charts.learningCurve?.data
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fca-dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('데이터 내보내기가 complete되었습니다', 'success');
    }

    // Refresh Data
    refreshData() {
        this.loadInitialData();
        this.updateValidationDisplay();
        
        // Refresh charts
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.update === 'function') {
                chart.update();
            }
        });
        
        this.showNotification('데이터가 refresh되었습니다', 'info');
    }

    // Handle Window Resize
    handleResize() {
        // Responsive chart updates
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
        
        // Mobile menu handling
        if (window.innerWidth > 768) {
            const sidebar = document.querySelector('.sidebar');
            const mainContent = document.querySelector('.main-content');
            sidebar.classList.remove('open');
            mainContent.classList.remove('shifted');
        }
    }

    // Show Notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} fade-in`;
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            `;
            document.body.appendChild(container);
        }
        
        container.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // Utility Methods
    formatNumber(num) {
        return new Intl.NumberFormat('ko-KR').format(num);
    }

    formatPercentage(num) {
        return (num * 100).toFixed(1) + '%';
    }

    formatDateTime(date) {
        return new Intl.DateTimeFormat('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h23'
        }).format(date);
    }
}

// Global functions for event handlers
function refreshSystemStatus() {
    if (window.enhancedDashboard) {
        window.enhancedDashboard.updateSystemMetrics();
        window.enhancedDashboard.showNotification('시스템 status가 refresh되었습니다', 'info');
    }
}

function refreshFraudData() {
    if (window.enhancedDashboard) {
        window.enhancedDashboard.showNotification('fraud detection 데이터가 refresh되었습니다', 'info');
        // Update fraud detection chart if it exists
        if (window.enhancedDashboard.charts.fraudDetection) {
            window.enhancedDashboard.charts.fraudDetection.update();
        }
    }
}

function refreshSentimentData() {
    if (window.enhancedDashboard) {
        window.enhancedDashboard.showNotification('sentiment analysis 데이터가 refresh되었습니다', 'info');
        // Update sentiment chart if it exists
        if (window.enhancedDashboard.charts.sentimentDistribution) {
            // Update data with slight variations
            const chart = window.enhancedDashboard.charts.sentimentDistribution;
            chart.data.datasets[0].data = [
                67 + Math.floor(Math.random() * 6 - 3),
                21 + Math.floor(Math.random() * 4 - 2),
                12 + Math.floor(Math.random() * 4 - 2)
            ];
            chart.update();
        }
    }
}

function refreshAttritionData() {
    if (window.enhancedDashboard) {
        window.enhancedDashboard.showNotification('고객 이탈 데이터가 refresh되었습니다', 'info');
        // Update attrition chart if it exists
        if (window.enhancedDashboard.charts.attritionTrend) {
            window.enhancedDashboard.charts.attritionTrend.update();
        }
    }
}

function refreshDatasets() {
    if (window.enhancedDashboard) {
        window.enhancedDashboard.showNotification('데이터셋 info가 refresh되었습니다', 'info');
    }
}

function exportData() {
    if (window.enhancedDashboard) {
        window.enhancedDashboard.exportData();
    }
}

function refreshData() {
    if (window.enhancedDashboard) {
        window.enhancedDashboard.refreshData();
    }
}

// Dataset management functions
function viewDataset(datasetName) {
    console.log(`Viewing dataset: ${datasetName}`);
    if (window.enhancedDashboard) {
        window.enhancedDashboard.showNotification(`데이터셋 "${datasetName}" 상세 info를 표시합니다`, 'info');
        // Show dataset details in a modal or navigate to detail view
    }
}

function downloadDataset(datasetName) {
    console.log(`Downloading dataset: ${datasetName}`);
    if (window.enhancedDashboard) {
        window.enhancedDashboard.showNotification(`데이터셋 "${datasetName}" download를 시작합니다`, 'info');
        // Implement download logic
    }
}

function analyzeDataset(datasetName) {
    console.log(`Analyzing dataset: ${datasetName}`);
    if (window.enhancedDashboard) {
        window.enhancedDashboard.showNotification(`데이터셋 "${datasetName}" 분석을 시작합니다`, 'info');
        // Navigate to analysis page or show analysis results
    }
}

function retryDataset(datasetName) {
    console.log(`Retrying dataset: ${datasetName}`);
    if (window.enhancedDashboard) {
        window.enhancedDashboard.showNotification(`데이터셋 "${datasetName}" 재시도를 시작합니다`, 'info');
        // Implement retry logic
    }
}

function reportIssue(datasetName) {
    console.log(`Reporting issue for dataset: ${datasetName}`);
    if (window.enhancedDashboard) {
        window.enhancedDashboard.showNotification(`데이터셋 "${datasetName}" 문제를 보고합니다`, 'warning');
        // Open issue reporting interface
    }
}

function showImage(imageSrc, title) {
    // Create or show image modal
    let modal = document.getElementById('imageModal');
    if (!modal) {
        // Create modal dynamically
        modal = document.createElement('div');
        modal.id = 'imageModal';
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="imageModalLabel">${title}</h5>
                        <button type="button" class="btn-close" onclick="closeImageModal()" aria-label="Close">&times;</button>
                    </div>
                    <div class="modal-body text-center">
                        <img id="modal-image" src="${imageSrc}" class="img-fluid" alt="Dataset Visualization" style="max-width: 100%; height: auto;">
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        document.getElementById('imageModalLabel').textContent = title;
        document.getElementById('modal-image').src = imageSrc;
    }
    
    // Show modal
    modal.style.display = 'block';
    modal.classList.add('show');
    document.body.classList.add('modal-open');
    
    // Add backdrop
    let backdrop = document.querySelector('.modal-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        document.body.appendChild(backdrop);
    }
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }
    
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
        backdrop.remove();
    }
    
    document.body.classList.remove('modal-open');
}

// Process dataset performance monitoring charts
function initializeDatasetCharts() {
    // Processing Performance Chart
    const processingCanvas = document.getElementById('processing-performance-chart');
    if (processingCanvas && window.Chart) {
        const processingCtx = processingCanvas.getContext('2d');
        new Chart(processingCtx, {
            type: 'bar',
            data: {
                labels: ['Credit Card', 'WAMC', 'Phrasebank', 'Dhanush'],
                datasets: [{
                    label: '처리 time (초)',
                    data: [2.1, 1.8, 0.3, 4.2],
                    backgroundColor: 'rgba(0, 123, 255, 0.6)',
                    borderColor: 'rgba(0, 123, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: '데이터셋 처리 time'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'time (초)'
                        }
                    }
                }
            }
        });
    }

    // Memory Usage Chart
    const memoryCanvas = document.getElementById('memory-usage-chart');
    if (memoryCanvas && window.Chart) {
        const memoryCtx = memoryCanvas.getContext('2d');
        new Chart(memoryCtx, {
            type: 'pie',
            data: {
                labels: ['Credit Card', 'WAMC', 'Phrasebank', 'Dhanush'],
                datasets: [{
                    data: [35, 22, 2, 76],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 205, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 205, 86, 1)',
                        'rgba(75, 192, 192, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: '메모리 사용량 분포 (MB)'
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}


// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.enhancedDashboard = new EnhancedFCADashboard();
    window.enhancedDashboard.init();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedFCADashboard;
}