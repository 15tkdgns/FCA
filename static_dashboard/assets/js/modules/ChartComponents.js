/**
 * Chart Components Module
 * =======================
 * 
 * 재사용 가능한 차트 컴포넌트 라이브러리
 * - 각 컴포넌트는 독립적으로 동작
 * - 일관된 인터페이스 제공
 * - 테마 지원 및 반응형 디자인
 */

/**
 * 기본 차트 컴포넌트 클래스
 */
export class BaseChartComponent {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.options = {
            theme: 'light',
            responsive: true,
            showLegend: true,
            ...options
        };
        
        this.isRendered = false;
        this.plotlyInstance = null;
        
        if (!this.container) {
            throw new Error(`Container not found: ${containerId}`);
        }
        
        this.setupContainer();
    }
    
    /**
     * 컨테이너 초기 설정
     */
    setupContainer() {
        this.container.classList.add('chart-component');
        this.container.style.minHeight = '300px';
    }
    
    /**
     * 차트 렌더링 - 하위 클래스에서 구현
     */
    async render(data) {
        throw new Error('render method must be implemented by subclass');
    }
    
    /**
     * 기본 레이아웃 생성
     */
    getBaseLayout() {
        return {
            font: {
                family: "'Nunito', sans-serif",
                size: 12,
                color: this.options.theme === 'dark' ? '#ffffff' : '#5a5c69'
            },
            plot_bgcolor: 'rgba(0,0,0,0)',
            paper_bgcolor: 'rgba(0,0,0,0)',
            margin: { t: 50, r: 30, b: 50, l: 50 },
            showlegend: this.options.showLegend,
            legend: {
                orientation: 'h',
                yanchor: 'bottom',
                y: -0.2,
                xanchor: 'center',
                x: 0.5
            }
        };
    }
    
    /**
     * 기본 설정 생성
     */
    getBaseConfig() {
        return {
            responsive: this.options.responsive,
            displayModeBar: true,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
            displaylogo: false,
            toImageButtonOptions: {
                format: 'png',
                filename: `fca_${this.containerId}`,
                height: 500,
                width: 700,
                scale: 1
            }
        };
    }
    
    /**
     * 테마별 색상 팔레트
     */
    getColors() {
        const palettes = {
            light: [
                '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e',
                '#e74a3b', '#6f42c1', '#20c997', '#fd7e14'
            ],
            dark: [
                '#5a9fd4', '#2dd4bf', '#60a5fa', '#fbbf24',
                '#f87171', '#a855f7', '#34d399', '#fb923c'
            ]
        };
        
        return palettes[this.options.theme] || palettes.light;
    }
    
    /**
     * 로딩 표시
     */
    showLoading() {
        this.container.innerHTML = `
            <div class="chart-loading d-flex flex-column align-items-center justify-content-center" style="height: 300px;">
                <div class="spinner-border text-primary mb-3" role="status"></div>
                <div class="text-muted">Loading...</div>
            </div>
        `;
    }
    
    /**
     * 에러 표시
     */
    showError(message) {
        this.container.innerHTML = `
            <div class="chart-error d-flex flex-column align-items-center justify-content-center text-center p-4" style="height: 300px;">
                <i class="fas fa-exclamation-triangle text-warning fa-3x mb-3"></i>
                <div class="text-muted">
                    <strong>Chart Error</strong><br>
                    ${message}
                </div>
            </div>
        `;
    }
    
    /**
     * 리사이즈
     */
    resize() {
        if (this.isRendered && this.plotlyInstance) {
            Plotly.Plots.resize(this.container);
        }
    }
    
    /**
     * 정리
     */
    destroy() {
        if (this.plotlyInstance) {
            Plotly.purge(this.container);
            this.plotlyInstance = null;
            this.isRendered = false;
        }
    }
}

/**
 * 파이 차트 컴포넌트
 */
export class PieChartComponent extends BaseChartComponent {
    constructor(containerId, options = {}) {
        super(containerId, {
            showValues: true,
            showPercent: true,
            ...options
        });
    }
    
    async render(data) {
        try {
            this.showLoading();
            
            if (!data.labels || !data.values) {
                throw new Error('Pie chart data is invalid');
            }
            
            const colors = this.getColors();
            
            const chartData = [{
                type: 'pie',
                labels: data.labels,
                values: data.values,
                marker: {
                    colors: colors,
                    line: { color: '#ffffff', width: 2 }
                },
                textinfo: this.getTextInfo(),
                textposition: 'auto',
                hovertemplate: '<b>%{label}</b><br>Value: %{value}<br>Ratio: %{percent}<extra></extra>'
            }];
            
            const layout = {
                ...this.getBaseLayout(),
                title: {
                    text: data.title || '',
                    x: 0.5,
                    font: { size: 16 }
                }
            };
            
            await Plotly.newPlot(this.container, chartData, layout, this.getBaseConfig());
            this.isRendered = true;
            this.plotlyInstance = this.container;
            
        } catch (error) {
            this.showError(error.message);
            console.error('PieChart render error:', error);
        }
    }
    
    getTextInfo() {
        let textinfo = 'label';
        if (this.options.showValues) textinfo += '+value';
        if (this.options.showPercent) textinfo += '+percent';
        return textinfo;
    }
}

/**
 * 바 차트 컴포넌트
 */
export class BarChartComponent extends BaseChartComponent {
    constructor(containerId, options = {}) {
        super(containerId, {
            orientation: 'vertical', // 'vertical' or 'horizontal'
            showGrid: true,
            ...options
        });
    }
    
    async render(data) {
        try {
            this.showLoading();
            
            if (!data.x || !data.y) {
                throw new Error('Bar chart data is invalid');
            }
            
            const colors = this.getColors();
            
            const chartData = [{
                type: 'bar',
                x: this.options.orientation === 'horizontal' ? data.y : data.x,
                y: this.options.orientation === 'horizontal' ? data.x : data.y,
                orientation: this.options.orientation === 'horizontal' ? 'h' : 'v',
                marker: {
                    color: colors[0],
                    line: { color: colors[1], width: 1 }
                },
                hovertemplate: '<b>%{x}</b><br>Value: %{y}<extra></extra>'
            }];
            
            const layout = {
                ...this.getBaseLayout(),
                title: {
                    text: data.title || '',
                    x: 0.5,
                    font: { size: 16 }
                },
                xaxis: { 
                    title: data.xTitle || '',
                    showgrid: this.options.showGrid,
                    tickangle: data.tickAngle || 0
                },
                yaxis: { 
                    title: data.yTitle || '',
                    showgrid: this.options.showGrid
                }
            };
            
            await Plotly.newPlot(this.container, chartData, layout, this.getBaseConfig());
            this.isRendered = true;
            this.plotlyInstance = this.container;
            
        } catch (error) {
            this.showError(error.message);
            console.error('BarChart render error:', error);
        }
    }
}

/**
 * 라인 차트 컴포넌트
 */
export class LineChartComponent extends BaseChartComponent {
    constructor(containerId, options = {}) {
        super(containerId, {
            showMarkers: true,
            lineWidth: 3,
            markerSize: 6,
            ...options
        });
    }
    
    async render(data) {
        try {
            this.showLoading();
            
            if (!data.x || !data.y) {
                throw new Error('Line chart data is invalid');
            }
            
            const colors = this.getColors();
            
            const chartData = [{
                type: 'scatter',
                mode: this.options.showMarkers ? 'lines+markers' : 'lines',
                x: data.x,
                y: data.y,
                line: { 
                    color: colors[0], 
                    width: this.options.lineWidth 
                },
                marker: this.options.showMarkers ? { 
                    color: colors[0], 
                    size: this.options.markerSize 
                } : undefined,
                name: data.name || '',
                hovertemplate: '<b>%{x}</b><br>Value: %{y}<extra></extra>'
            }];
            
            const layout = {
                ...this.getBaseLayout(),
                title: {
                    text: data.title || '',
                    x: 0.5,
                    font: { size: 16 }
                },
                xaxis: { 
                    title: data.xTitle || '',
                    showgrid: true
                },
                yaxis: { 
                    title: data.yTitle || '',
                    showgrid: true
                }
            };
            
            await Plotly.newPlot(this.container, chartData, layout, this.getBaseConfig());
            this.isRendered = true;
            this.plotlyInstance = this.container;
            
        } catch (error) {
            this.showError(error.message);
            console.error('LineChart render error:', error);
        }
    }
}

/**
 * 스캐터 차트 컴포넌트
 */
export class ScatterChartComponent extends BaseChartComponent {
    constructor(containerId, options = {}) {
        super(containerId, {
            markerSize: 8,
            markerOpacity: 0.7,
            showTrendline: false,
            ...options
        });
    }
    
    async render(data) {
        try {
            this.showLoading();
            
            if (!data.x || !data.y) {
                throw new Error('Scatter chart data is invalid');
            }
            
            const colors = this.getColors();
            
            const chartData = [{
                type: 'scatter',
                mode: 'markers',
                x: data.x,
                y: data.y,
                marker: { 
                    color: colors[0], 
                    size: this.options.markerSize,
                    opacity: this.options.markerOpacity
                },
                name: data.name || '',
                hovertemplate: '<b>X: %{x}</b><br>Y: %{y}<extra></extra>'
            }];
            
            // 추세선 추가
            if (this.options.showTrendline) {
                const trendline = this.calculateTrendline(data.x, data.y);
                chartData.push({
                    type: 'scatter',
                    mode: 'lines',
                    x: data.x,
                    y: trendline,
                    line: { color: colors[1], width: 2, dash: 'dash' },
                    name: 'Trend Line',
                    showlegend: false
                });
            }
            
            const layout = {
                ...this.getBaseLayout(),
                title: {
                    text: data.title || '',
                    x: 0.5,
                    font: { size: 16 }
                },
                xaxis: { 
                    title: data.xTitle || '',
                    showgrid: true
                },
                yaxis: { 
                    title: data.yTitle || '',
                    showgrid: true
                }
            };
            
            await Plotly.newPlot(this.container, chartData, layout, this.getBaseConfig());
            this.isRendered = true;
            this.plotlyInstance = this.container;
            
        } catch (error) {
            this.showError(error.message);
            console.error('ScatterChart render error:', error);
        }
    }
    
    /**
     * 간단한 선형 추세선 계산
     */
    calculateTrendline(x, y) {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        return x.map(xi => slope * xi + intercept);
    }
}

/**
 * 히스토그램 컴포넌트
 */
export class HistogramComponent extends BaseChartComponent {
    constructor(containerId, options = {}) {
        super(containerId, {
            bins: 20,
            opacity: 0.7,
            ...options
        });
    }
    
    async render(data) {
        try {
            this.showLoading();
            
            if (!data.values) {
                throw new Error('Histogram data is invalid');
            }
            
            const colors = this.getColors();
            
            const chartData = [{
                type: 'histogram',
                x: data.values,
                marker: { 
                    color: colors[0], 
                    opacity: this.options.opacity 
                },
                nbinsx: this.options.bins,
                hovertemplate: '<b>Range: %{x}</b><br>Frequency: %{y}<extra></extra>'
            }];
            
            const layout = {
                ...this.getBaseLayout(),
                title: {
                    text: data.title || '',
                    x: 0.5,
                    font: { size: 16 }
                },
                xaxis: { 
                    title: data.xTitle || 'Value',
                    showgrid: true
                },
                yaxis: { 
                    title: data.yTitle || 'Frequency',
                    showgrid: true
                },
                bargap: 0.1
            };
            
            await Plotly.newPlot(this.container, chartData, layout, this.getBaseConfig());
            this.isRendered = true;
            this.plotlyInstance = this.container;
            
        } catch (error) {
            this.showError(error.message);
            console.error('Histogram render error:', error);
        }
    }
}

/**
 * 히트맵 컴포넌트
 */
export class HeatmapComponent extends BaseChartComponent {
    constructor(containerId, options = {}) {
        super(containerId, {
            colorscale: 'Viridis',
            showscale: true,
            ...options
        });
    }
    
    async render(data) {
        try {
            this.showLoading();
            
            if (!data.z) {
                throw new Error('Heatmap data is invalid');
            }
            
            const chartData = [{
                type: 'heatmap',
                z: data.z,
                x: data.x || [],
                y: data.y || [],
                colorscale: this.options.colorscale,
                showscale: this.options.showscale,
                hoverongaps: false,
                hovertemplate: '<b>X: %{x}</b><br>Y: %{y}<br>Value: %{z}<extra></extra>'
            }];
            
            const layout = {
                ...this.getBaseLayout(),
                title: {
                    text: data.title || '',
                    x: 0.5,
                    font: { size: 16 }
                },
                xaxis: { 
                    title: data.xTitle || '',
                    side: 'bottom'
                },
                yaxis: { 
                    title: data.yTitle || '',
                    autorange: 'reversed'
                }
            };
            
            await Plotly.newPlot(this.container, chartData, layout, this.getBaseConfig());
            this.isRendered = true;
            this.plotlyInstance = this.container;
            
        } catch (error) {
            this.showError(error.message);
            console.error('Heatmap render error:', error);
        }
    }
}

/**
 * LIME 설명 차트 컴포넌트
 */
export class LIMEChartComponent extends BaseChartComponent {
    constructor(containerId, options = {}) {
        super(containerId, options);
    }
    
    async render(data) {
        try {
            this.showLoading();
            
            if (!data.features || !Array.isArray(data.features)) {
                throw new Error('LIME feature data is invalid');
            }
            
            const colors = this.getColors();
            
            const chartData = [{
                x: data.features.map(f => f.impact),
                y: data.features.map(f => f.name),
                type: 'bar',
                orientation: 'h',
                marker: {
                    color: data.features.map(f => f.impact > 0 ? colors[4] : colors[1]), // Red/Green
                    opacity: 0.8,
                    line: { color: '#ffffff', width: 1 }
                },
                text: data.features.map(f => `${f.impact > 0 ? '+' : ''}${f.impact.toFixed(3)}`),
                textposition: 'auto',
                hovertemplate: '<b>%{y}</b><br>Impact: %{text}<br>Direction: %{customdata}<extra></extra>',
                customdata: data.features.map(f => f.direction?.replace('_', ' ') || (f.impact > 0 ? 'Risk Increase' : 'Risk Decrease'))
            }];
            
            const layout = {
                ...this.getBaseLayout(),
                title: {
                    text: data.title || 'LIME Local Explanation',
                    x: 0.5,
                    font: { size: 16 }
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
                margin: { t: 50, r: 30, b: 50, l: 100 }
            };
            
            await Plotly.newPlot(this.container, chartData, layout, this.getBaseConfig());
            this.isRendered = true;
            this.plotlyInstance = this.container;
            
        } catch (error) {
            this.showError(error.message);
            console.error('LIME chart render error:', error);
        }
    }
}

/**
 * 모델 의사결정 과정 차트 컴포넌트
 */
export class DecisionProcessChartComponent extends BaseChartComponent {
    constructor(containerId, options = {}) {
        super(containerId, options);
    }
    
    async render(data) {
        try {
            this.showLoading();
            
            if (!data.steps || !Array.isArray(data.steps)) {
                throw new Error('Decision process data is invalid');
            }
            
            const colors = this.getColors();
            
            const chartData = [{
                x: data.steps.map((_, i) => `Step ${i + 1}`),
                y: data.steps.map(step => step.confidence || step.gini || step.value),
                type: 'scatter',
                mode: 'lines+markers',
                line: { color: colors[0], width: 3 },
                marker: { 
                    size: data.steps.map(step => Math.log((step.samples || 100)) * 3),
                    color: colors[0]
                },
                text: data.steps.map(step => `${step.feature || step.condition || step.name} ${step.threshold ? '≤ ' + step.threshold : ''}`),
                textposition: 'top center',
                hovertemplate: '<b>%{text}</b><br>Value: %{y:.3f}<br>Samples: %{customdata}<extra></extra>',
                customdata: data.steps.map(step => step.samples || 'N/A')
            }];
            
            const layout = {
                ...this.getBaseLayout(),
                title: {
                    text: data.title || 'Model Decision Process',
                    x: 0.5,
                    font: { size: 16 }
                },
                xaxis: {
                    title: 'Decision Steps'
                },
                yaxis: {
                    title: data.yTitle || 'Confidence/Purity'
                }
            };
            
            await Plotly.newPlot(this.container, chartData, layout, this.getBaseConfig());
            this.isRendered = true;
            this.plotlyInstance = this.container;
            
        } catch (error) {
            this.showError(error.message);
            console.error('Decision process chart render error:', error);
        }
    }
}

/**
 * 예측 신뢰도 차트 컴포넌트
 */
export class ConfidenceChartComponent extends BaseChartComponent {
    constructor(containerId, options = {}) {
        super(containerId, options);
    }
    
    async render(data) {
        try {
            this.showLoading();
            
            if (!data.bins || !data.counts) {
                throw new Error('Confidence distribution data is invalid');
            }
            
            const colors = this.getColors();
            
            const chartData = [{
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
            }];
            
            const layout = {
                ...this.getBaseLayout(),
                title: {
                    text: data.title || 'Prediction Confidence Distribution',
                    x: 0.5,
                    font: { size: 16 }
                },
                xaxis: {
                    title: 'Confidence Range',
                    tickangle: -45
                },
                yaxis: {
                    title: 'Prediction Count'
                },
                margin: { t: 50, r: 30, b: 80, l: 60 }
            };
            
            await Plotly.newPlot(this.container, chartData, layout, this.getBaseConfig());
            this.isRendered = true;
            this.plotlyInstance = this.container;
            
        } catch (error) {
            this.showError(error.message);
            console.error('Confidence chart render error:', error);
        }
    }
}

/**
 * 차트 팩토리
 */
export class ChartFactory {
    static createChart(type, containerId, options = {}) {
        const chartTypes = {
            pie: PieChartComponent,
            bar: BarChartComponent,
            line: LineChartComponent,
            scatter: ScatterChartComponent,
            histogram: HistogramComponent,
            heatmap: HeatmapComponent,
            lime: LIMEChartComponent,
            decision: DecisionProcessChartComponent,
            confidence: ConfidenceChartComponent
        };
        
        const ChartClass = chartTypes[type];
        if (!ChartClass) {
            throw new Error(`Unsupported chart type: ${type}`);
        }
        
        return new ChartClass(containerId, options);
    }
    
    static getSupportedTypes() {
        return ['pie', 'bar', 'line', 'scatter', 'histogram', 'heatmap', 'lime', 'decision', 'confidence'];
    }
}

// 전역 exports
if (typeof window !== 'undefined') {
    window.ChartComponents = {
        BaseChartComponent,
        PieChartComponent,
        BarChartComponent,
        LineChartComponent,
        ScatterChartComponent,
        HistogramComponent,
        HeatmapComponent,
        LIMEChartComponent,
        DecisionProcessChartComponent,
        ConfidenceChartComponent,
        ChartFactory
    };
}

// 모듈 exports
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BaseChartComponent,
        PieChartComponent,
        BarChartComponent,
        LineChartComponent,
        ScatterChartComponent,
        HistogramComponent,
        HeatmapComponent,
        LIMEChartComponent,
        DecisionProcessChartComponent,
        ConfidenceChartComponent,
        ChartFactory
    };
}