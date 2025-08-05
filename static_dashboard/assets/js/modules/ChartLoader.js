/**
 * ChartLoader Module
 * ==================
 * 
 * High-performance, low-dependency chart loading system
 * - Minimized dependencies (only Plotly.js required)
 * - Reusable component structure
 * - Error handling and fallback mechanisms
 * - Memory-efficient management
 */

export class ChartLoader {
    constructor(options = {}) {
        this.options = {
            timeout: 30000,
            retryAttempts: 3,
            memoryLimit: 100, // MB
            enableCaching: true,
            fallbackMode: 'placeholder',
            ...options
        };
        
        this.cache = new Map();
        this.loadedCharts = new Set();
        this.eventListeners = new Map();
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * 초기화 - 의존성 확인 및 설정
     */
    async init() {
        try {
            await this.waitForDependencies();
            this.setupEventListeners();
            this.isInitialized = true;
            console.log('✅ ChartLoader initialized');
        } catch (error) {
            console.error('❌ ChartLoader initialization failed:', error);
            this.isInitialized = false;
        }
    }

    /**
     * 의존성 대기 (Plotly.js만 필요)
     */
    async waitForDependencies() {
        const startTime = Date.now();
        
        while (typeof Plotly === 'undefined') {
            if (Date.now() - startTime > this.options.timeout) {
                throw new Error('Plotly.js dependency timeout');
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log('✅ Dependencies loaded');
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 페이지 언로드 시 메모리 정리
        window.addEventListener('beforeunload', () => this.cleanup());
        
        // 윈도우 리사이즈 시 차트 리사이즈
        window.addEventListener('resize', this.debounce(() => {
            this.resizeAllCharts();
        }, 250));
    }

    /**
     * 차트 로드 - 메인 진입점
     */
    async loadChart(config) {
        if (!this.isInitialized) {
            console.warn('ChartLoader not initialized, attempting to load anyway...');
        }

        const {
            containerId,
            type,
            data,
            options = {},
            fallback = null
        } = config;

        try {
            // 컨테이너 유효성 검사
            const container = this.validateContainer(containerId);
            if (!container) {
                throw new Error(`Container not found: ${containerId}`);
            }

            // 로딩 표시
            this.showLoading(container);

            // 데이터 유효성 검사
            if (!this.validateData(data)) {
                throw new Error('Invalid chart data provided');
            }

            // 차트 타입별 렌더링
            const result = await this.renderByType(type, container, data, options);
            
            if (result) {
                this.loadedCharts.add(containerId);
                this.hideLoading(container);
                console.log(`✅ Chart loaded: ${containerId}`);
                return result;
            } else {
                throw new Error('Chart rendering failed');
            }

        } catch (error) {
            console.error(`❌ Chart load failed (${containerId}):`, error);
            this.handleLoadError(containerId, error, fallback);
            return false;
        }
    }

    /**
     * 컨테이너 유효성 검사
     */
    validateContainer(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container not found: ${containerId}`);
            return null;
        }
        return container;
    }

    /**
     * 데이터 유효성 검사
     */
    validateData(data) {
        if (!data) {
            console.error('No data provided');
            return false;
        }

        if (Array.isArray(data)) {
            return data.some(item => 
                (item.x && item.x.length > 0) ||
                (item.y && item.y.length > 0) ||
                (item.values && item.values.length > 0)
            );
        }

        if (typeof data === 'object') {
            return Object.keys(data).length > 0;
        }

        return false;
    }

    /**
     * 차트 타입별 렌더링
     */
    async renderByType(type, container, data, options) {
        const chartConfig = this.getChartConfig(type, data, options);
        
        if (!chartConfig) {
            throw new Error(`Unsupported chart type: ${type}`);
        }

        return await this.renderPlotlyChart(container, chartConfig);
    }

    /**
     * 차트 설정 생성
     */
    getChartConfig(type, data, options) {
        const configs = {
            pie: () => this.createPieConfig(data, options),
            bar: () => this.createBarConfig(data, options),
            line: () => this.createLineConfig(data, options),
            scatter: () => this.createScatterConfig(data, options),
            heatmap: () => this.createHeatmapConfig(data, options),
            histogram: () => this.createHistogramConfig(data, options),
            lime: () => this.createLIMEConfig(data, options),
            decision: () => this.createDecisionConfig(data, options),
            confidence: () => this.createConfidenceConfig(data, options)
        };

        return configs[type] ? configs[type]() : null;
    }

    /**
     * Pie Chart 설정
     */
    createPieConfig(data, options) {
        const colors = this.getColors();
        
        return {
            data: [{
                type: 'pie',
                labels: data.labels || [],
                values: data.values || [],
                marker: {
                    colors: colors,
                    line: { color: '#ffffff', width: 2 }
                },
                textinfo: options.textinfo || 'label+percent',
                textposition: options.textposition || 'auto',
                hovertemplate: '<b>%{label}</b><br>Value: %{value}<br>Ratio: %{percent}<extra></extra>'
            }],
            layout: {
                title: {
                    text: options.title || '',
                    x: 0.5,
                    font: { size: 16, color: '#5a5c69' }
                },
                showlegend: options.showlegend !== false,
                margin: { t: 60, r: 30, b: 30, l: 30 },
                font: { family: "'Nunito', sans-serif", size: 12 },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)'
            },
            config: this.getDefaultConfig()
        };
    }

    /**
     * Bar Chart 설정
     */
    createBarConfig(data, options) {
        const colors = this.getColors();
        
        return {
            data: [{
                type: 'bar',
                x: data.x || data.labels || [],
                y: data.y || data.values || [],
                marker: {
                    color: colors[0],
                    line: { color: colors[1], width: 1 }
                },
                hovertemplate: '<b>%{x}</b><br>Value: %{y}<extra></extra>'
            }],
            layout: {
                title: {
                    text: options.title || '',
                    x: 0.5,
                    font: { size: 16, color: '#5a5c69' }
                },
                xaxis: { 
                    title: options.xTitle || '',
                    tickangle: options.tickAngle || 0
                },
                yaxis: { title: options.yTitle || '' },
                margin: { t: 60, r: 30, b: 80, l: 60 },
                font: { family: "'Nunito', sans-serif", size: 12 },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)'
            },
            config: this.getDefaultConfig()
        };
    }

    /**
     * Line Chart 설정
     */
    createLineConfig(data, options) {
        const colors = this.getColors();
        
        return {
            data: [{
                type: 'scatter',
                mode: 'lines+markers',
                x: data.x || [],
                y: data.y || [],
                line: { color: colors[0], width: 3 },
                marker: { color: colors[0], size: 6 },
                hovertemplate: '<b>%{x}</b><br>Value: %{y}<extra></extra>'
            }],
            layout: {
                title: {
                    text: options.title || '',
                    x: 0.5,
                    font: { size: 16, color: '#5a5c69' }
                },
                xaxis: { title: options.xTitle || '' },
                yaxis: { title: options.yTitle || '' },
                margin: { t: 60, r: 30, b: 60, l: 60 },
                font: { family: "'Nunito', sans-serif", size: 12 },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)'
            },
            config: this.getDefaultConfig()
        };
    }

    /**
     * Scatter Chart 설정
     */
    createScatterConfig(data, options) {
        const colors = this.getColors();
        
        return {
            data: [{
                type: 'scatter',
                mode: 'markers',
                x: data.x || [],
                y: data.y || [],
                marker: { 
                    color: colors[0], 
                    size: options.markerSize || 8,
                    opacity: 0.7
                },
                hovertemplate: '<b>X: %{x}</b><br>Y: %{y}<extra></extra>'
            }],
            layout: {
                title: {
                    text: options.title || '',
                    x: 0.5,
                    font: { size: 16, color: '#5a5c69' }
                },
                xaxis: { title: options.xTitle || '' },
                yaxis: { title: options.yTitle || '' },
                margin: { t: 60, r: 30, b: 60, l: 60 },
                font: { family: "'Nunito', sans-serif", size: 12 },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)'
            },
            config: this.getDefaultConfig()
        };
    }

    /**
     * Heatmap Chart 설정
     */
    createHeatmapConfig(data, options) {
        return {
            data: [{
                type: 'heatmap',
                z: data.z || [],
                x: data.x || [],
                y: data.y || [],
                colorscale: options.colorscale || 'Viridis',
                hoverongaps: false,
                hovertemplate: '<b>X: %{x}</b><br>Y: %{y}<br>Value: %{z}<extra></extra>'
            }],
            layout: {
                title: {
                    text: options.title || '',
                    x: 0.5,
                    font: { size: 16, color: '#5a5c69' }
                },
                xaxis: { title: options.xTitle || '' },
                yaxis: { title: options.yTitle || '' },
                margin: { t: 60, r: 30, b: 60, l: 60 },
                font: { family: "'Nunito', sans-serif", size: 12 },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)'
            },
            config: this.getDefaultConfig()
        };
    }

    /**
     * Histogram Chart 설정
     */
    createHistogramConfig(data, options) {
        const colors = this.getColors();
        
        return {
            data: [{
                type: 'histogram',
                x: data.x || data.values || [],
                marker: { color: colors[0], opacity: 0.7 },
                nbinsx: options.bins || 20,
                hovertemplate: '<b>Range: %{x}</b><br>Frequency: %{y}<extra></extra>'
            }],
            layout: {
                title: {
                    text: options.title || '',
                    x: 0.5,
                    font: { size: 16, color: '#5a5c69' }
                },
                xaxis: { title: options.xTitle || 'Value' },
                yaxis: { title: options.yTitle || 'Frequency' },
                margin: { t: 60, r: 30, b: 60, l: 60 },
                font: { family: "'Nunito', sans-serif", size: 12 },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)'
            },
            config: this.getDefaultConfig()
        };
    }

    /**
     * LIME Chart 설정
     */
    createLIMEConfig(data, options) {
        const colors = this.getColors();
        
        return {
            data: [{
                x: data.features.map(f => f.impact),
                y: data.features.map(f => f.name),
                type: 'bar',
                orientation: 'h',
                marker: {
                    color: data.features.map(f => f.impact > 0 ? colors[4] : colors[1]),
                    opacity: 0.8,
                    line: { color: '#ffffff', width: 1 }
                },
                text: data.features.map(f => `${f.impact > 0 ? '+' : ''}${f.impact.toFixed(3)}`),
                textposition: 'auto',
                hovertemplate: '<b>%{y}</b><br>Impact: %{text}<extra></extra>'
            }],
            layout: {
                title: {
                    text: options.title || data.title || 'LIME Local Explanation',
                    x: 0.5,
                    font: { size: 16, color: '#5a5c69' }
                },
                xaxis: {
                    title: 'Feature Impact',
                    zeroline: true,
                    zerolinecolor: '#666',
                    zerolinewidth: 2
                },
                yaxis: {
                    title: 'Features',
                    automargin: true
                },
                margin: { t: 60, r: 30, b: 50, l: 100 },
                font: { family: "'Nunito', sans-serif", size: 12 },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)'
            },
            config: this.getDefaultConfig()
        };
    }

    /**
     * Decision Process Chart 설정
     */
    createDecisionConfig(data, options) {
        const colors = this.getColors();
        
        return {
            data: [{
                x: data.steps.map((_, i) => `Step ${i + 1}`),
                y: data.steps.map(step => step.confidence || step.gini || step.value),
                type: 'scatter',
                mode: 'lines+markers',
                line: { color: colors[0], width: 3 },
                marker: { 
                    size: data.steps.map(step => Math.log((step.samples || 100)) * 3),
                    color: colors[0]
                },
                text: data.steps.map(step => `${step.feature || step.condition || step.name}`),
                textposition: 'top center',
                hovertemplate: '<b>%{text}</b><br>Value: %{y:.3f}<extra></extra>'
            }],
            layout: {
                title: {
                    text: options.title || data.title || 'Model Decision Process',
                    x: 0.5,
                    font: { size: 16, color: '#5a5c69' }
                },
                xaxis: { title: 'Decision Steps' },
                yaxis: { title: data.yTitle || 'Confidence/Purity' },
                margin: { t: 60, r: 30, b: 50, l: 60 },
                font: { family: "'Nunito', sans-serif", size: 12 },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)'
            },
            config: this.getDefaultConfig()
        };
    }

    /**
     * Confidence Chart 설정
     */
    createConfidenceConfig(data, options) {
        const colors = this.getColors();
        
        return {
            data: [{
                x: data.bins,
                y: data.counts,
                type: 'bar',
                marker: {
                    color: data.colors || colors,
                    opacity: 0.8,
                    line: { color: '#ffffff', width: 1 }
                },
                text: data.counts.map(c => c.toLocaleString()),
                textposition: 'auto',
                hovertemplate: '<b>%{x}</b><br>Prediction Count: %{y:,}<extra></extra>'
            }],
            layout: {
                title: {
                    text: options.title || data.title || 'Prediction Confidence Distribution',
                    x: 0.5,
                    font: { size: 16, color: '#5a5c69' }
                },
                xaxis: {
                    title: 'Confidence Range',
                    tickangle: -45
                },
                yaxis: { title: 'Prediction Count' },
                margin: { t: 60, r: 30, b: 80, l: 60 },
                font: { family: "'Nunito', sans-serif", size: 12 },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)'
            },
            config: this.getDefaultConfig()
        };
    }

    /**
     * Plotly 차트 렌더링
     */
    async renderPlotlyChart(container, chartConfig) {
        try {
            await Plotly.newPlot(
                container,
                chartConfig.data,
                chartConfig.layout,
                chartConfig.config
            );
            return true;
        } catch (error) {
            console.error('Plotly rendering error:', error);
            throw error;
        }
    }

    /**
     * 로딩 표시
     */
    showLoading(container) {
        container.innerHTML = `
            <div class="chart-loading d-flex flex-column align-items-center justify-content-center" style="height: 300px;">
                <div class="spinner-border text-primary mb-3" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div class="text-muted">Loading chart...</div>
            </div>
        `;
    }

    /**
     * 로딩 숨김
     */
    hideLoading(container) {
        const loading = container.querySelector('.chart-loading');
        if (loading) {
            loading.remove();
        }
    }

    /**
     * 에러 처리
     */
    handleLoadError(containerId, error, fallback) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (fallback && typeof fallback === 'function') {
            fallback(container, error);
        } else {
            this.showErrorPlaceholder(container, error.message);
        }
    }

    /**
     * 에러 플레이스홀더 표시
     */
    showErrorPlaceholder(container, message) {
        container.innerHTML = `
            <div class="chart-error d-flex flex-column align-items-center justify-content-center text-center p-4" style="height: 300px;">
                <i class="fas fa-exclamation-triangle text-warning fa-3x mb-3"></i>
                <div class="text-muted">
                    <strong>Chart Load Failed</strong><br>
                    ${message}
                </div>
                <button class="btn btn-outline-primary btn-sm mt-3" onclick="location.reload()">
                    <i class="fas fa-redo me-1"></i> Refresh Page
                </button>
            </div>
        `;
    }

    /**
     * 모든 차트 리사이즈
     */
    resizeAllCharts() {
        this.loadedCharts.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container && container.querySelector('.plotly-graph-div')) {
                Plotly.Plots.resize(container);
            }
        });
    }

    /**
     * 기본 색상 팔레트
     */
    getColors() {
        return [
            '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e',
            '#e74a3b', '#6f42c1', '#20c997', '#fd7e14'
        ];
    }

    /**
     * 기본 Plotly 설정
     */
    getDefaultConfig() {
        return {
            responsive: true,
            displayModeBar: true,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
            displaylogo: false,
            toImageButtonOptions: {
                format: 'png',
                filename: 'fca_chart',
                height: 500,
                width: 700,
                scale: 1
            }
        };
    }

    /**
     * 디바운스 유틸리티
     */
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
     * 메모리 정리
     */
    cleanup() {
        this.loadedCharts.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container && container.querySelector('.plotly-graph-div')) {
                Plotly.purge(container);
            }
        });
        
        this.loadedCharts.clear();
        this.cache.clear();
        console.log('✅ ChartLoader cleanup completed');
    }

    /**
     * 헬스체크
     */
    healthCheck() {
        return {
            initialized: this.isInitialized,
            plotlyAvailable: typeof Plotly !== 'undefined',
            chartsLoaded: this.loadedCharts.size,
            cacheSize: this.cache.size
        };
    }
}

// 전역 인스턴스 생성
if (typeof window !== 'undefined') {
    window.ChartLoader = ChartLoader;
    
    // DOM 로드 후 자동 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.chartLoader = new ChartLoader();
        });
    } else {
        window.chartLoader = new ChartLoader();
    }
}

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartLoader;
}