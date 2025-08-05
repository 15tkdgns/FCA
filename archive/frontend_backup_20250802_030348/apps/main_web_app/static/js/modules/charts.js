/**
 * Charts Module
 * =============
 * 
 * chart rendering 관련 기능을 모듈화
 * - Plotly.js 차트 생성
 * - 차트 settings 관리
 * - 반응형 차트
 * - 차트 이벤트 처리
 */

/**
 * 기본 차트 settings
 */
export const ChartConfig = {
    // 기본 레이아웃
    defaultLayout: {
        font: { family: 'Inter, sans-serif', size: 12 },
        margin: { l: 50, r: 50, t: 80, b: 50 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        responsive: true
    },

    // 기본 settings
    defaultConfig: {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d']
    },

    // 색상 팔레트
    colors: {
        primary: ['#dc2626', '#2563eb', '#d97706', '#059669', '#7c3aed'],
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#3b82f6'
    },

    // 차트 타입별 기본 settings
    chartTypes: {
        bar: {
            type: 'bar',
            textposition: 'auto'
        },
        line: {
            type: 'scatter',
            mode: 'lines+markers'
        },
        scatter: {
            type: 'scatter',
            mode: 'markers'
        },
        pie: {
            type: 'pie',
            hole: 0.3
        },
        radar: {
            type: 'scatterpolar',
            fill: 'toself'
        }
    }
};

/**
 * 차트 렌더러 클래스
 */
export class ChartRenderer {
    constructor(config = {}) {
        this.config = { ...ChartConfig, ...config };
        this.charts = new Map(); // 생성된 차트들 추적
    }

    /**
     * chart rendering 메인 함수
     */
    async render(containerId, chartData, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container not found: ${containerId}`);
        }

        // Plotly 가용성 confirm
        if (typeof Plotly === 'undefined') {
            throw new Error('Plotly.js is not available');
        }

        try {
            // 데이터 전처리
            const processedData = this._processChartData(chartData);
            
            // 레이아웃 settings
            const layout = this._buildLayout(processedData.layout, options);
            
            // settings 객체
            const config = this._buildConfig(options);
            
            // 컨테이너 초기화
            container.innerHTML = '';
            
            // 차트 생성
            await Plotly.newPlot(containerId, processedData.data, layout, config);
            
            // 차트 추적
            this.charts.set(containerId, {
                data: processedData.data,
                layout,
                config,
                timestamp: Date.now()
            });
            
            // 이벤트 리스너 추가
            this._attachEventListeners(containerId);
            
            console.log(`✅ Chart rendered successfully: ${containerId}`);
            
        } catch (error) {
            console.error(`❌ Chart rendering failed: ${containerId}`, error);
            this._showChartError(container, error.message);
            throw error;
        }
    }

    /**
     * 차트 데이터 전처리
     */
    _processChartData(chartData) {
        try {
            // JSON 문자열인 경우 파싱
            let data = chartData;
            if (typeof chartData === 'string') {
                data = JSON.parse(chartData);
            }

            return {
                data: data.data || [],
                layout: data.layout || {}
            };
        } catch (error) {
            throw new Error(`Invalid chart data: ${error.message}`);
        }
    }

    /**
     * 레이아웃 구성
     */
    _buildLayout(chartLayout, options) {
        return {
            ...this.config.defaultLayout,
            ...chartLayout,
            ...options.layout
        };
    }

    /**
     * settings 구성
     */
    _buildConfig(options) {
        return {
            ...this.config.defaultConfig,
            ...options.config
        };
    }

    /**
     * 이벤트 리스너 추가
     */
    _attachEventListeners(containerId) {
        const element = document.getElementById(containerId);
        if (!element) return;

        // 차트 클릭 이벤트
        element.on('plotly_click', (data) => {
            console.log('Chart clicked:', data);
            this._handleChartClick(containerId, data);
        });

        // 차트 호버 이벤트
        element.on('plotly_hover', (data) => {
            this._handleChartHover(containerId, data);
        });

        // 리사이즈 이벤트
        window.addEventListener('resize', () => {
            this._handleResize(containerId);
        });
    }

    /**
     * 차트 클릭 처리
     */
    _handleChartClick(containerId, data) {
        // 커스텀 클릭 이벤트 발생
        const event = new CustomEvent('chartClick', {
            detail: { containerId, data }
        });
        document.dispatchEvent(event);
    }

    /**
     * 차트 호버 처리
     */
    _handleChartHover(containerId, data) {
        // 호버 효과 처리
        const event = new CustomEvent('chartHover', {
            detail: { containerId, data }
        });
        document.dispatchEvent(event);
    }

    /**
     * 리사이즈 처리
     */
    _handleResize(containerId) {
        if (this.charts.has(containerId)) {
            Plotly.Plots.resize(containerId);
        }
    }

    /**
     * 차트 에러 표시
     */
    _showChartError(container, message) {
        container.innerHTML = `
            <div class="chart-error text-center p-4">
                <i class="fas fa-chart-bar fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">chart rendering error</h5>
                <p class="text-muted small">${message}</p>
                <button class="btn btn-outline-primary btn-sm mt-2" onclick="location.reload()">
                    <i class="fas fa-redo me-1"></i>refresh
                </button>
            </div>
        `;
    }

    /**
     * 특정 차트 업데이트
     */
    async updateChart(containerId, newData, newLayout = {}) {
        if (!this.charts.has(containerId)) {
            throw new Error(`Chart not found: ${containerId}`);
        }

        try {
            await Plotly.react(containerId, newData, newLayout);
            
            // 차트 info 업데이트
            const chartInfo = this.charts.get(containerId);
            chartInfo.data = newData;
            chartInfo.layout = { ...chartInfo.layout, ...newLayout };
            chartInfo.timestamp = Date.now();
            
            console.log(`✅ Chart updated: ${containerId}`);
        } catch (error) {
            console.error(`❌ Chart update failed: ${containerId}`, error);
            throw error;
        }
    }

    /**
     * 차트 제거
     */
    removeChart(containerId) {
        if (this.charts.has(containerId)) {
            Plotly.purge(containerId);
            this.charts.delete(containerId);
            console.log(`🗑️ Chart removed: ${containerId}`);
        }
    }

    /**
     * 모든 차트 제거
     */
    removeAllCharts() {
        for (const containerId of this.charts.keys()) {
            this.removeChart(containerId);
        }
    }

    /**
     * 차트 info 조회
     */
    getChartInfo(containerId) {
        return this.charts.get(containerId);
    }

    /**
     * 모든 차트 info 조회
     */
    getAllCharts() {
        return Array.from(this.charts.entries()).map(([id, info]) => ({
            id,
            ...info
        }));
    }
}

/**
 * 특화된 차트 생성기들
 */
export class PerformanceChart {
    constructor(renderer) {
        this.renderer = renderer;
    }

    async renderOverview(containerId, data) {
        const chartData = {
            data: [{
                x: data.labels || ['Fraud Detection', 'Sentiment Analysis', 'Customer Attrition'],
                y: data.values || [0.94, 0.927, 0.857],
                type: 'bar',
                marker: {
                    color: ChartConfig.colors.primary
                },
                text: data.text || ['94.0%', '92.7%', '85.7%'],
                textposition: 'auto',
                hovertemplate: '<b>%{x}</b><br>Performance: %{y:.1%}<extra></extra>'
            }],
            layout: {
                title: {
                    text: '📊 Model Performance Overview',
                    x: 0.5,
                    font: { size: 20, color: '#0f172a' }
                },
                yaxis: {
                    title: 'Performance Score',
                    tickformat: '.0%',
                    range: [0, 1]
                }
            }
        };

        return this.renderer.render(containerId, chartData);
    }

    async renderDistribution(containerId, data) {
        const chartData = {
            data: [{
                x: data.labels || ['Credit Card', 'WAMC', 'Dhanush', 'Financial'],
                y: data.values || [568629, 283726, 1000000, 14780],
                type: 'bar',
                marker: {
                    color: ChartConfig.colors.primary
                },
                text: data.text || ['568K', '284K', '1M', '15K'],
                textposition: 'auto'
            }],
            layout: {
                title: '📈 Dataset Size Distribution',
                yaxis: { title: 'Number of Records' },
                xaxis: { title: 'Dataset' }
            }
        };

        return this.renderer.render(containerId, chartData);
    }

    async renderSuccess(containerId, data) {
        const chartData = {
            data: [{
                x: data.labels || ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                y: data.values || [0.91, 0.93, 0.94, 0.95],
                type: 'scatter',
                mode: 'lines+markers',
                line: { color: ChartConfig.colors.success, width: 3 },
                marker: { size: 8, color: ChartConfig.colors.success }
            }],
            layout: {
                title: '📈 Success Rate Trend',
                yaxis: { title: 'Success Rate', tickformat: '.0%' },
                xaxis: { title: 'Time Period' }
            }
        };

        return this.renderer.render(containerId, chartData);
    }

    async renderRadar(containerId, data) {
        const chartData = {
            data: [{
                type: 'scatterpolar',
                r: data.values || [0.94, 0.91, 0.88, 0.92, 0.89],
                theta: data.labels || ['Accuracy', 'Precision', 'Recall', 'F1-Score', 'AUC-ROC'],
                fill: 'toself',
                name: 'Model Performance',
                line: { color: ChartConfig.colors.primary[0] }
            }],
            layout: {
                title: '🎯 Multi-Metric Performance',
                polar: {
                    radialaxis: {
                        visible: true,
                        range: [0, 1]
                    }
                }
            }
        };

        return this.renderer.render(containerId, chartData);
    }
}

/**
 * 차트 유틸리티 함수들
 */
export const ChartUtils = {
    /**
     * 색상 생성기
     */
    generateColors(count, palette = 'primary') {
        const colors = ChartConfig.colors[palette] || ChartConfig.colors.primary;
        const result = [];
        
        for (let i = 0; i < count; i++) {
            result.push(colors[i % colors.length]);
        }
        
        return result;
    },

    /**
     * 데이터 포맷터
     */
    formatData(data, type = 'number') {
        switch (type) {
            case 'percentage':
                return data.map(d => d * 100);
            case 'currency':
                return data.map(d => d.toLocaleString('ko-KR'));
            case 'compact':
                return data.map(d => {
                    if (d >= 1000000) return (d / 1000000).toFixed(1) + 'M';
                    if (d >= 1000) return (d / 1000).toFixed(0) + 'K';
                    return d.toString();
                });
            default:
                return data;
        }
    },

    /**
     * 반응형 레이아웃 조정
     */
    getResponsiveLayout(containerWidth) {
        if (containerWidth < 576) {
            return {
                margin: { l: 40, r: 40, t: 60, b: 40 },
                font: { size: 10 }
            };
        } else if (containerWidth < 768) {
            return {
                margin: { l: 45, r: 45, t: 70, b: 45 },
                font: { size: 11 }
            };
        } else {
            return {
                margin: { l: 50, r: 50, t: 80, b: 50 },
                font: { size: 12 }
            };
        }
    }
};