/**
 * Chart Interface Module
 * ======================
 * 
 * 통합 차트 인터페이스 및 의존성 관리
 * - 단일 진입점 제공
 * - 의존성 주입 및 관리
 * - 타입 안전성 보장
 * - 에러 처리 표준화
 */

/**
 * 차트 인터페이스 메인 클래스
 */
export class ChartInterface {
    constructor(options = {}) {
        this.options = {
            autoInit: true,
            dependencyTimeout: 10000,
            enableCaching: true,
            defaultTheme: 'light',
            ...options
        };
        
        this.dependencies = new Map();
        this.chartInstances = new Map();
        this.eventListeners = new Map();
        this.isInitialized = false;
        
        if (this.options.autoInit) {
            this.init();
        }
    }
    
    /**
     * 초기화
     */
    async init() {
        try {
            console.log('🚀 ChartInterface initializing...');
            
            await this.loadDependencies();
            this.setupEventListeners();
            this.registerChartTypes();
            
            this.isInitialized = true;
            console.log('✅ ChartInterface initialized successfully');
            
            // 초기화 완료 이벤트 발생
            this.emit('initialized', { timestamp: Date.now() });
            
        } catch (error) {
            console.error('❌ ChartInterface initialization failed:', error);
            this.isInitialized = false;
            throw error;
        }
    }
    
    /**
     * 의존성 로딩
     */
    async loadDependencies() {
        const requiredDependencies = [
            { name: 'Plotly', check: () => typeof Plotly !== 'undefined' },
            { name: 'ChartLoader', check: () => typeof ChartLoader !== 'undefined' },
            { name: 'ChartComponents', check: () => typeof ChartComponents !== 'undefined' }
        ];
        
        for (const dep of requiredDependencies) {
            if (!dep.check()) {
                console.warn(`⚠️ Dependency missing: ${dep.name}`);
                await this.waitForDependency(dep.name, dep.check);
            }
            this.dependencies.set(dep.name, true);
        }
        
        console.log('✅ All dependencies loaded');
    }
    
    /**
     * 의존성 대기
     */
    async waitForDependency(name, checkFn) {
        const startTime = Date.now();
        
        while (!checkFn() && (Date.now() - startTime) < this.options.dependencyTimeout) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (!checkFn()) {
            throw new Error(`Dependency timeout: ${name}`);
        }
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 윈도우 리사이즈
        window.addEventListener('resize', this.debounce(() => {
            this.resizeAllCharts();
        }, 250));
        
        // 페이지 언로드 시 정리
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
        
        // 테마 변경 감지
        this.observeThemeChanges();
    }
    
    /**
     * 차트 타입 등록
     */
    registerChartTypes() {
        const chartTypes = [
            'pie', 'bar', 'line', 'scatter', 'histogram', 'heatmap', 'lime', 'decision', 'confidence'
        ];
        
        chartTypes.forEach(type => {
            this[`create${this.capitalize(type)}Chart`] = (containerId, options) => {
                return this.createChart(type, containerId, options);
            };
        });
        
        console.log(`📊 Registered ${chartTypes.length} chart types`);
    }
    
    /**
     * 차트 생성 - 메인 메서드
     */
    async createChart(type, containerId, options = {}) {
        this.validateInitialization();
        
        try {
            // 기존 차트 정리
            if (this.chartInstances.has(containerId)) {
                this.destroyChart(containerId);
            }
            
            // 차트 생성
            const chart = ChartComponents.ChartFactory.createChart(type, containerId, {
                theme: this.options.defaultTheme,
                ...options
            });
            
            // 인스턴스 저장
            this.chartInstances.set(containerId, {
                instance: chart,
                type: type,
                options: options,
                created: Date.now()
            });
            
            console.log(`✅ Chart created: ${type} in ${containerId}`);
            
            // 차트 생성 이벤트 발생
            this.emit('chartCreated', { type, containerId, chart });
            
            return chart;
            
        } catch (error) {
            console.error(`❌ Chart creation failed (${type}, ${containerId}):`, error);
            this.emit('chartError', { type, containerId, error });
            throw error;
        }
    }
    
    /**
     * 간편 차트 렌더링
     */
    async renderChart(config) {
        const {
            type,
            containerId,
            data,
            options = {}
        } = this.validateConfig(config);
        
        try {
            // 차트 생성
            const chart = await this.createChart(type, containerId, options);
            
            // 데이터 렌더링
            await chart.render(data);
            
            console.log(`✅ Chart rendered: ${type} in ${containerId}`);
            
            // 렌더링 완료 이벤트 발생
            this.emit('chartRendered', { type, containerId, chart, data });
            
            return chart;
            
        } catch (error) {
            console.error(`❌ Chart rendering failed:`, error);
            this.handleRenderError(containerId, error);
            throw error;
        }
    }
    
    /**
     * 설정 검증
     */
    validateConfig(config) {
        const required = ['type', 'containerId', 'data'];
        
        for (const field of required) {
            if (!config[field]) {
                throw new Error(`Required field missing: ${field}`);
            }
        }
        
        // 지원되는 차트 타입 확인
        if (!ChartComponents.ChartFactory.getSupportedTypes().includes(config.type)) {
            throw new Error(`Unsupported chart type: ${config.type}`);
        }
        
        return config;
    }
    
    /**
     * 차트 업데이트
     */
    async updateChart(containerId, newData, options = {}) {
        const chartInfo = this.chartInstances.get(containerId);
        
        if (!chartInfo) {
            throw new Error(`Chart not found: ${containerId}`);
        }
        
        try {
            await chartInfo.instance.render(newData);
            
            // 업데이트 이벤트 발생
            this.emit('chartUpdated', { containerId, newData, chart: chartInfo.instance });
            
            console.log(`✅ Chart updated: ${containerId}`);
            return true;
            
        } catch (error) {
            console.error(`❌ Chart update failed (${containerId}):`, error);
            this.emit('chartError', { containerId, error });
            throw error;
        }
    }
    
    /**
     * 차트 삭제
     */
    destroyChart(containerId) {
        const chartInfo = this.chartInstances.get(containerId);
        
        if (chartInfo) {
            try {
                chartInfo.instance.destroy();
                this.chartInstances.delete(containerId);
                
                // 삭제 이벤트 발생
                this.emit('chartDestroyed', { containerId });
                
                console.log(`✅ Chart destroyed: ${containerId}`);
                return true;
                
            } catch (error) {
                console.error(`❌ Chart destruction failed (${containerId}):`, error);
                return false;
            }
        }
        
        return false;
    }
    
    /**
     * 모든 차트 리사이즈
     */
    resizeAllCharts() {
        this.chartInstances.forEach((chartInfo, containerId) => {
            try {
                chartInfo.instance.resize();
            } catch (error) {
                console.warn(`Chart resize failed (${containerId}):`, error);
            }
        });
        
        console.log(`🔄 Resized ${this.chartInstances.size} charts`);
    }
    
    /**
     * 테마 변경
     */
    setTheme(theme) {
        this.options.defaultTheme = theme;
        
        this.chartInstances.forEach((chartInfo, containerId) => {
            try {
                chartInfo.instance.options.theme = theme;
                // 차트 재렌더링은 개별적으로 호출 필요
            } catch (error) {
                console.warn(`Theme update failed (${containerId}):`, error);
            }
        });
        
        this.emit('themeChanged', { theme });
        console.log(`🎨 Theme changed to: ${theme}`);
    }
    
    /**
     * 테마 변경 감지
     */
    observeThemeChanges() {
        // CSS 변수 변경 감지
        if (window.MutationObserver) {
            const observer = new MutationObserver(() => {
                const computedStyle = getComputedStyle(document.documentElement);
                const theme = computedStyle.getPropertyValue('--theme-mode') || 'light';
                
                if (theme !== this.options.defaultTheme) {
                    this.setTheme(theme);
                }
            });
            
            observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['class', 'style']
            });
        }
    }
    
    /**
     * 에러 처리
     */
    handleRenderError(containerId, error) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="chart-error d-flex flex-column align-items-center justify-content-center text-center p-4" style="height: 300px;">
                    <i class="fas fa-exclamation-triangle text-warning fa-3x mb-3"></i>
                    <div class="text-muted">
                        <strong>Chart Rendering Failed</strong><br>
                        ${error.message}
                    </div>
                    <button class="btn btn-outline-primary btn-sm mt-3" onclick="location.reload()">
                        <i class="fas fa-redo me-1"></i> Refresh
                    </button>
                </div>
            `;
        }
    }
    
    /**
     * 이벤트 시스템
     */
    on(eventName, callback) {
        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, []);
        }
        this.eventListeners.get(eventName).push(callback);
    }
    
    off(eventName, callback) {
        if (this.eventListeners.has(eventName)) {
            const listeners = this.eventListeners.get(eventName);
            const index = listeners.indexOf(callback);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    emit(eventName, data) {
        if (this.eventListeners.has(eventName)) {
            this.eventListeners.get(eventName).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Event listener error (${eventName}):`, error);
                }
            });
        }
    }
    
    /**
     * 유틸리티 메서드
     */
    validateInitialization() {
        if (!this.isInitialized) {
            throw new Error('ChartInterface not initialized');
        }
    }
    
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * 상태 정보
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            chartCount: this.chartInstances.size,
            dependencies: Object.fromEntries(this.dependencies),
            theme: this.options.defaultTheme,
            eventListeners: Array.from(this.eventListeners.keys())
        };
    }
    
    /**
     * 헬스체크
     */
    healthCheck() {
        const status = this.getStatus();
        const health = {
            ...status,
            healthy: status.initialized && status.dependencies.Plotly,
            timestamp: Date.now()
        };
        
        console.log('🏥 ChartInterface health check:', health);
        return health;
    }
    
    /**
     * 메모리 정리
     */
    cleanup() {
        // 모든 차트 인스턴스 정리
        this.chartInstances.forEach((chartInfo, containerId) => {
            this.destroyChart(containerId);
        });
        
        // 이벤트 리스너 정리
        this.eventListeners.clear();
        
        console.log('🧹 ChartInterface cleanup completed');
    }
}

/**
 * 간편 API 래퍼
 */
export class EasyChart {
    static interface = null;
    
    /**
     * 인터페이스 초기화
     */
    static async init(options = {}) {
        if (!this.interface) {
            this.interface = new ChartInterface(options);
            await this.interface.init();
        }
        return this.interface;
    }
    
    /**
     * 간편 차트 생성
     */
    static async create(type, containerId, data, options = {}) {
        if (!this.interface) {
            await this.init();
        }
        
        return this.interface.renderChart({
            type,
            containerId,
            data,
            options
        });
    }
    
    /**
     * 파이 차트
     */
    static async pie(containerId, data, options = {}) {
        return this.create('pie', containerId, data, options);
    }
    
    /**
     * 바 차트
     */
    static async bar(containerId, data, options = {}) {
        return this.create('bar', containerId, data, options);
    }
    
    /**
     * 라인 차트
     */
    static async line(containerId, data, options = {}) {
        return this.create('line', containerId, data, options);
    }
    
    /**
     * 스캐터 차트
     */
    static async scatter(containerId, data, options = {}) {
        return this.create('scatter', containerId, data, options);
    }
    
    /**
     * 히스토그램
     */
    static async histogram(containerId, data, options = {}) {
        return this.create('histogram', containerId, data, options);
    }
    
    /**
     * 히트맵
     */
    static async heatmap(containerId, data, options = {}) {
        return this.create('heatmap', containerId, data, options);
    }
    
    /**
     * LIME 설명 차트
     */
    static async lime(containerId, data, options = {}) {
        return this.create('lime', containerId, data, options);
    }
    
    /**
     * 의사결정 과정 차트
     */
    static async decision(containerId, data, options = {}) {
        return this.create('decision', containerId, data, options);
    }
    
    /**
     * 신뢰도 분포 차트
     */
    static async confidence(containerId, data, options = {}) {
        return this.create('confidence', containerId, data, options);
    }
}

// 전역 exports
if (typeof window !== 'undefined') {
    window.ChartInterface = ChartInterface;
    window.EasyChart = EasyChart;
    
    // 기존 시스템 호환성을 위한 FCACharts 인터페이스
    window.FCACharts = {
        // XAI 차트 메서드들
        renderLIMEExplanation: async (data) => {
            try {
                // 기존 데이터 형식을 새로운 형식으로 변환
                const limeData = {
                    title: 'LIME Local Explanation',
                    features: data?.lime_explanations?.fraud_detection?.features || [
                        { name: "V14", impact: 0.42, direction: "increases_fraud" },
                        { name: "V12", impact: 0.38, direction: "increases_fraud" },
                        { name: "Amount", impact: -0.31, direction: "decreases_fraud" },
                        { name: "V10", impact: 0.28, direction: "increases_fraud" },
                        { name: "V17", impact: -0.25, direction: "increases_fraud" }
                    ]
                };
                
                return await EasyChart.lime('lime-explanation-chart', limeData);
            } catch (error) {
                console.error('LIME chart render failed:', error);
                return false;
            }
        },
        
        renderModelDecisionProcess: async (data) => {
            try {
                const decisionData = {
                    title: 'Model Decision Process',
                    steps: data?.model_decision_process?.fraud_detection?.decision_tree_path || [
                        { feature: "V14", threshold: -2.5, gini: 0.45, samples: 1000 },
                        { feature: "Amount", threshold: 500, gini: 0.32, samples: 234 },
                        { feature: "V12", threshold: -1.8, gini: 0.18, samples: 89 },
                        { feature: "V10", threshold: -0.9, gini: 0.08, samples: 23 }
                    ]
                };
                
                return await EasyChart.decision('decision-tree-chart', decisionData);
            } catch (error) {
                console.error('Decision process chart render failed:', error);
                return false;
            }
        },
        
        renderPredictionConfidence: async (data) => {
            try {
                const confData = data?.prediction_confidence?.fraud_detection?.confidence_distribution || {
                    bins: ["0-10%", "10-20%", "20-30%", "30-40%", "40-50%", "50-60%", "60-70%", "70-80%", "80-90%", "90-100%"],
                    counts: [45, 123, 234, 456, 678, 543, 432, 321, 234, 156],
                    colors: ["#ffe6e6", "#ffcccc", "#ffb3b3", "#ff9999", "#ff8080", "#ff6666", "#ff4d4d", "#ff3333", "#ff1a1a", "#ff0000"]
                };
                
                return await EasyChart.confidence('confidence-distribution-chart', {
                    title: 'Prediction Confidence Distribution',
                    bins: confData.bins,
                    counts: confData.counts,
                    colors: confData.colors
                });
            } catch (error) {
                console.error('Confidence chart render failed:', error);
                return false;
            }
        },
        
        renderFeatureInteraction: async (data) => {
            try {
                const intData = data?.feature_interaction?.fraud_detection?.interaction_matrix || {
                    features: ["V14", "V12", "V10", "V17", "V4", "Amount"],
                    values: [
                        [1.00, 0.73, 0.45, 0.67, -0.23, 0.34],
                        [0.73, 1.00, 0.56, 0.48, -0.19, 0.42],
                        [0.45, 0.56, 1.00, 0.39, -0.15, 0.29],
                        [0.67, 0.48, 0.39, 1.00, -0.21, 0.36],
                        [-0.23, -0.19, -0.15, -0.21, 1.00, -0.18],
                        [0.34, 0.42, 0.29, 0.36, -0.18, 1.00]
                    ]
                };
                
                return await EasyChart.heatmap('feature-interaction-chart', {
                    title: 'Feature Interaction Matrix',
                    z: intData.values,
                    x: intData.features,
                    y: intData.features
                }, {
                    colorscale: 'RdBu'
                });
            } catch (error) {
                console.error('Feature interaction chart render failed:', error);
                return false;
            }
        },
        
        renderTrainingProcess: async (data) => {
            try {
                // 훈련 과정 차트는 라인 차트로 구현
                const trainData = data?.training_process?.fraud_detection?.epochs || [
                    { epoch: 1, train_loss: 0.693, val_loss: 0.681, train_acc: 0.532, val_acc: 0.545 },
                    { epoch: 5, train_loss: 0.421, val_loss: 0.435, train_acc: 0.781, val_acc: 0.768 },
                    { epoch: 10, train_loss: 0.287, val_loss: 0.312, train_acc: 0.856, val_acc: 0.834 },
                    { epoch: 15, train_loss: 0.198, val_loss: 0.245, train_acc: 0.912, val_acc: 0.889 },
                    { epoch: 20, train_loss: 0.156, val_loss: 0.203, train_acc: 0.934, val_acc: 0.907 }
                ];
                
                return await EasyChart.line('training-process-chart', {
                    title: 'Training Process',
                    x: trainData.map(e => e.epoch),
                    y: trainData.map(e => e.val_acc), // 검증 정확도
                    xTitle: 'Epoch',
                    yTitle: 'Validation Accuracy'
                });
            } catch (error) {
                console.error('Training process chart render failed:', error);
                return false;
            }
        },
        
        // 기존 차트 메서드들도 추가
        renderFraudDistribution: async (data) => {
            try {
                return await EasyChart.pie('fraud-risk-chart', {
                    title: 'Fraud Distribution',
                    labels: data?.labels || ['Normal', 'Fraud'],
                    values: data?.data || data?.values || [920, 80]
                });
            } catch (error) {
                console.error('Fraud distribution chart render failed:', error);
                return false;
            }
        },
        
        renderSentimentDistribution: async (data) => {
            try {
                return await EasyChart.pie('sentiment-distribution-chart', {
                    title: 'Sentiment Distribution', 
                    labels: data?.labels || ['Positive', 'Neutral', 'Negative'],
                    values: data?.values || [60, 25, 15]
                });
            } catch (error) {
                console.error('Sentiment distribution chart render failed:', error);
                return false;
            }
        },
        
        renderCustomerSegments: async (data) => {
            try {
                return await EasyChart.pie('customer-segments-chart', {
                    title: 'Customer Segments',
                    labels: data?.labels || ['General', 'VIP', 'New'],
                    values: data?.values || [70, 20, 10]
                });
            } catch (error) {
                console.error('Customer segments chart render failed:', error);
                return false;
            }
        },
        
        renderModelComparison: async (data) => {
            try {
                return await EasyChart.bar('model-performance-chart', {
                    title: 'Model Performance Comparison',
                    x: data?.models || ['Random Forest', 'XGBoost', 'SVM'],
                    y: data?.accuracy || [0.94, 0.96, 0.89],
                    xTitle: 'Models',
                    yTitle: 'Accuracy'
                });
            } catch (error) {
                console.error('Model comparison chart render failed:', error);
                return false;
            }
        },
        
        // 유틸리티 메서드들
        initialized: () => EasyChart.interface?.isInitialized || false,
        healthCheck: () => EasyChart.interface?.healthCheck() || { healthy: false }
    };
    
    // 자동 초기화
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            await EasyChart.init();
            console.log('✅ EasyChart auto-initialized');
            console.log('✅ FCACharts compatibility layer loaded');
        } catch (error) {
            console.warn('⚠️ EasyChart auto-initialization failed:', error);
        }
    });
}

// 모듈 exports
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ChartInterface, EasyChart };
}