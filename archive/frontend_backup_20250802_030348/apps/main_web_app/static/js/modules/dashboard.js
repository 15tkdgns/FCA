/**
 * Dashboard Module
 * ================
 * 
 * dashboard 핵심 기능 모듈화
 * - data loading 관리
 * - 성능 모니터링
 * - 카드 업데이트
 * - 자동 refresh
 */

import { APIWrapper } from './api.js';
import { ChartRenderer, PerformanceChart } from './charts.js';
import { utils } from './utils.js';

/**
 * dashboard 메인 클래스
 */
export class Dashboard {
    constructor(config = {}) {
        this.config = {
            autoRefreshInterval: config.autoRefreshInterval || 300000, // 5분
            performanceUpdateInterval: config.performanceUpdateInterval || 5000, // 5초
            animationDuration: config.animationDuration || 1500,
            ...config
        };

        this.api = new APIWrapper();
        this.chartRenderer = new ChartRenderer();
        this.performanceChart = new PerformanceChart(this.chartRenderer);
        
        this.summaryData = null;
        this.performanceMetrics = new Map();
        this.intervalIds = [];
        
        this.init();
    }

    /**
     * dashboard 초기화
     */
    async init() {
        try {
            utils.showLoading('dashboard-init');
            
            await this.loadSummaryData();
            await this.loadCharts();
            this.updateSummaryCards();
            this.updateBestPerformers();
            this.initPerformanceMonitoring();
            this.setupAutoRefresh();
            
            console.log('✅ Dashboard initialized successfully');
        } catch (error) {
            console.error('❌ Dashboard initialization failed:', error);
            utils.showError('dashboard를 초기화하는 중 error가 발생했습니다.');
        } finally {
            utils.hideLoading('dashboard-init');
        }
    }

    /**
     * summary data loading
     */
    async loadSummaryData() {
        try {
            const response = await this.api.getSummary();
            if (response.status === 'success') {
                this.summaryData = response.data;
                console.log('📊 Summary data loaded:', this.summaryData);
                return this.summaryData;
            } else {
                throw new Error(response.error || 'Failed to get summary data');
            }
        } catch (error) {
            console.error('❌ Error loading summary data:', error);
            throw error;
        }
    }

    /**
     * 차트 로딩 및 렌더링
     */
    async loadCharts() {
        const charts = [
            { type: 'overview', containerId: 'overview-chart', renderer: 'performance' },
            { type: 'distribution', containerId: 'distribution-chart', renderer: 'performance' },
            { type: 'success', containerId: 'success-chart', renderer: 'performance' },
            { type: 'radar', containerId: 'radar-chart', renderer: 'performance' }
        ];

        console.log('🎨 Starting chart loading process...');

        const chartPromises = charts.map(async (chart) => {
            try {
                console.log(`📊 Loading chart: ${chart.type}`);
                
                const container = document.getElementById(chart.containerId);
                if (!container) {
                    console.warn(`⚠️ Container not found: ${chart.containerId}`);
                    return;
                }

                utils.showLoadingInContainer(chart.containerId);

                const response = await this.api.getChart(chart.type);
                console.log(`📈 Chart response for ${chart.type}:`, response);
                
                if (response.status === 'success') {
                    await this.renderChart(chart, response.data);
                    console.log(`✅ Chart ${chart.type} rendered successfully`);
                } else {
                    throw new Error(response.error || `Failed to get ${chart.type} chart`);
                }
            } catch (error) {
                console.error(`❌ Error loading ${chart.type} chart:`, error);
                utils.showError(`${chart.type} 차트를 불러오는데 failed했습니다.`, chart.containerId, error.message);
            }
        });

        await Promise.allSettled(chartPromises);
        console.log('🎨 Chart loading process completed');
    }

    /**
     * chart rendering (특화된 렌더러 사용)
     */
    async renderChart(chartConfig, chartData) {
        const { type, containerId, renderer } = chartConfig;

        try {
            if (renderer === 'performance' && this.performanceChart) {
                // 특화된 성능 차트 렌더러 사용
                switch (type) {
                    case 'overview':
                        await this.performanceChart.renderOverview(containerId, chartData);
                        break;
                    case 'distribution':
                        await this.performanceChart.renderDistribution(containerId, chartData);
                        break;
                    case 'success':
                        await this.performanceChart.renderSuccess(containerId, chartData);
                        break;
                    case 'radar':
                        await this.performanceChart.renderRadar(containerId, chartData);
                        break;
                    default:
                        await this.chartRenderer.render(containerId, chartData);
                }
            } else {
                // 기본 차트 렌더러 사용
                await this.chartRenderer.render(containerId, chartData);
            }
        } catch (error) {
            console.error(`❌ Chart rendering failed: ${type}`, error);
            throw error;
        }
    }

    /**
     * summary 카드 업데이트
     */
    updateSummaryCards() {
        if (!this.summaryData) {
            console.warn('⚠️ No summary data available for card updates');
            return;
        }

        console.log('📊 Updating summary cards with data:', this.summaryData);

        const avgPerformance = this.summaryData.success_rate || '94.2%';

        const cards = [
            { 
                id: 'total-models', 
                value: this.summaryData.total_models || 14,
                formatter: (val) => utils.number.format(val, 0)
            },
            { 
                id: 'total-datasets', 
                value: this.summaryData.data_overview ? 
                    Object.values(this.summaryData.data_overview).filter(d => d && d.available).length : 3,
                formatter: (val) => utils.number.format(val, 0)
            },
            { 
                id: 'total-domains', 
                value: this.summaryData.domains ? this.summaryData.domains.length : 3,
                formatter: (val) => utils.number.format(val, 0)
            },
            { 
                id: 'avg-performance', 
                value: avgPerformance,
                formatter: (val) => typeof val === 'string' ? val : utils.number.formatPercent(val)
            }
        ];

        cards.forEach(card => {
            const element = document.getElementById(card.id);
            if (element) {
                console.log(`📈 Updating card: ${card.id} with value: ${card.value}`);
                
                if (typeof card.value === 'number') {
                    this.animateCardValue(element, 0, card.value, card.formatter, this.config.animationDuration);
                } else {
                    element.textContent = card.formatter(card.value);
                    utils.animation.fadeIn(element);
                }
            } else {
                console.warn(`⚠️ Card element not found: ${card.id}`);
            }
        });
    }

    /**
     * 카드 값 애니메이션
     */
    animateCardValue(element, start, end, formatter, duration = 1000) {
        if (!element || !formatter) return;
        
        const startTime = performance.now();
        
        function updateValue(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentValue = start + (end - start) * progress;
            element.textContent = formatter(Math.round(currentValue));
            
            if (progress < 1) {
                requestAnimationFrame(updateValue);
            }
        }
        
        requestAnimationFrame(updateValue);
    }

    /**
     * 최고 성능 모델 업데이트
     */
    updateBestPerformers() {
        if (!this.summaryData?.best_performers) return;

        const container = document.getElementById('best-performers');
        if (!container) return;

        const performers = this.summaryData.best_performers;
        
        const performersHtml = `
            <div class="col-lg-4 col-md-6 mb-3">
                <div class="card performer-card">
                    <div class="card-body text-center">
                        <i class="fas fa-shield-alt fa-2x mb-2 performer-icon" style="color: var(--primary-color);"></i>
                        <h6 class="card-title">fraud detection 최고 성능</h6>
                        <h4 class="model-score ${utils.performance.getBootstrapClass(performers.fraud.score)}">
                            ${utils.number.format(performers.fraud.score, 3)}
                        </h4>
                        <p class="card-text">
                            <strong>${performers.fraud.model}</strong><br>
                            <small class="text-muted">${performers.fraud.dataset}</small>
                        </p>
                    </div>
                </div>
            </div>
            
            <div class="col-lg-4 col-md-6 mb-3">
                <div class="card performer-card">
                    <div class="card-body text-center">
                        <i class="fas fa-comment-alt fa-2x mb-2 performer-icon" style="color: var(--secondary-color);"></i>
                        <h6 class="card-title">sentiment analysis 최고 성능</h6>
                        <h4 class="model-score ${utils.performance.getBootstrapClass(performers.sentiment.score)}">
                            ${utils.number.format(performers.sentiment.score, 3)}
                        </h4>
                        <p class="card-text">
                            <strong>${performers.sentiment.model}</strong><br>
                            <small class="text-muted">Financial Phrasebank</small>
                        </p>
                    </div>
                </div>
            </div>
            
            <div class="col-lg-4 col-md-6 mb-3">
                <div class="card performer-card">
                    <div class="card-body text-center">
                        <i class="fas fa-users fa-2x mb-2 performer-icon" style="color: var(--success-color);"></i>
                        <h6 class="card-title">고객 이탈 최고 성능</h6>
                        <h4 class="model-score ${utils.performance.getBootstrapClass(performers.attrition.score)}">
                            ${utils.number.format(performers.attrition.score, 3)}
                        </h4>
                        <p class="card-text">
                            <strong>${performers.attrition.model}</strong><br>
                            <small class="text-muted">Customer Attrition</small>
                        </p>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = performersHtml;

        // 슬라이드 인 애니메이션 추가
        container.querySelectorAll('.performer-card').forEach((card, index) => {
            setTimeout(() => {
                utils.animation.slideIn(card, 'bottom', 400);
            }, index * 200);
        });
    }

    /**
     * 성능 모니터링 초기화
     */
    initPerformanceMonitoring() {
        this.startPerformanceMonitoring();
        
        const intervalId = setInterval(() => {
            this.updatePerformanceMetrics();
        }, this.config.performanceUpdateInterval);
        
        this.intervalIds.push(intervalId);
    }

    /**
     * 성능 모니터링 시작
     */
    startPerformanceMonitoring() {
        this.updatePerformanceMetrics();
    }

    /**
     * 성능 메트릭 업데이트
     */
    updatePerformanceMetrics() {
        const metrics = this.collectPerformanceMetrics();
        
        this.performanceMetrics.set('latest', {
            ...metrics,
            timestamp: new Date()
        });

        this.updatePerformanceUI(metrics);
    }

    /**
     * 성능 메트릭 수집
     */
    collectPerformanceMetrics() {
        const memoryInfo = performance.memory || {};
        const memoryUsed = memoryInfo.usedJSHeapSize || 0;
        const memoryTotal = memoryInfo.totalJSHeapSize || 0;
        const memoryPercent = memoryTotal > 0 ? (memoryUsed / memoryTotal * 100).toFixed(1) : 0;
        
        return {
            memory: {
                used: memoryUsed,
                total: memoryTotal,
                percent: memoryPercent
            },
            api: {
                averageTime: this.getAverageApiTime(),
                cacheSize: this.api.client.cache.size
            },
            charts: {
                averageRenderTime: this.getAverageChartTime(),
                totalCharts: this.chartRenderer.getAllCharts().length
            },
            errors: {
                total: utils.error.getErrorHistory().length,
                recent: utils.error.getErrorHistory().filter(
                    err => Date.now() - err.timestamp.getTime() < 300000
                ).length
            }
        };
    }

    /**
     * 평균 API 응답 time (시뮬레이션)
     */
    getAverageApiTime() {
        return Math.floor(Math.random() * 200) + 50; // 50-250ms
    }

    /**
     * 평균 chart rendering time (시뮬레이션)
     */
    getAverageChartTime() {
        return Math.floor(Math.random() * 300) + 100; // 100-400ms
    }

    /**
     * 성능 UI 업데이트
     */
    updatePerformanceUI(metrics) {
        const elements = {
            memory: document.getElementById('perf-memory'),
            api: document.getElementById('perf-api'),
            charts: document.getElementById('perf-charts')
        };
        
        if (elements.memory) {
            elements.memory.textContent = `${metrics.memory.percent}%`;
        }
        if (elements.api) {
            elements.api.textContent = `${metrics.api.averageTime}ms`;
        }
        if (elements.charts) {
            elements.charts.textContent = `${metrics.charts.averageRenderTime}ms`;
        }
        
        // 성능 세부 info 업데이트
        const detailsEl = document.getElementById('performance-details');
        if (detailsEl) {
            detailsEl.innerHTML = `
                <small class="text-muted">
                    마지막 업데이트: ${utils.time.formatTimeShort()}<br>
                    status: <span class="text-success">활성</span><br>
                    캐시: ${metrics.api.cacheSize}개 item
                </small>
            `;
        }
    }

    /**
     * 자동 refresh settings
     */
    setupAutoRefresh() {
        const intervalId = setInterval(() => {
            console.log('🔄 Auto-refreshing dashboard...');
            this.refresh();
        }, this.config.autoRefreshInterval);
        
        this.intervalIds.push(intervalId);
    }

    /**
     * dashboard refresh
     */
    async refresh() {
        try {
            console.log('🔄 Refreshing dashboard...');
            utils.showLoading('dashboard-refresh');
            
            await this.loadSummaryData();
            await this.loadCharts();
            this.updateSummaryCards();
            this.updateBestPerformers();
            
            console.log('✅ Dashboard refreshed successfully');
        } catch (error) {
            console.error('❌ Dashboard refresh failed:', error);
            utils.showError('dashboard refresh 중 error가 발생했습니다.');
        } finally {
            utils.hideLoading('dashboard-refresh');
        }
    }

    /**
     * 리소스 정리
     */
    destroy() {
        // 인터벌 정리
        this.intervalIds.forEach(id => clearInterval(id));
        this.intervalIds = [];
        
        // 차트 정리
        this.chartRenderer.removeAllCharts();
        
        // 데이터 정리
        this.summaryData = null;
        this.performanceMetrics.clear();
        
        console.log('🧹 Dashboard resources cleaned up');
    }

    /**
     * dashboard status 조회
     */
    getStatus() {
        return {
            isInitialized: !!this.summaryData,
            chartsLoaded: this.chartRenderer.getAllCharts().length,
            lastUpdate: this.performanceMetrics.get('latest')?.timestamp,
            config: this.config
        };
    }
}

export default Dashboard;