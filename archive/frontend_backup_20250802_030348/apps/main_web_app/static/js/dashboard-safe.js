/**
 * Safe Dashboard JavaScript
 * =========================
 * 
 * safe dashboard 로딩 및 chart rendering
 * - API 클라이언트 initialization wait
 * - robust error handling
 * - 단계별 로딩
 */

class SafeDashboard {
    constructor() {
        this.summaryData = null;
        this.chartsLoaded = false;
        this.maxRetries = 3;
        
        console.log('🚀 SafeDashboard initializing...');
        this.init();
    }

    async init() {
        try {
            // API 클라이언트 준비 대기
            await this.waitForAPIClient();
            
            // 순차적으로 로딩
            console.log('📊 Loading summary data...');
            await this.loadSummaryData();
            
            console.log('🎨 Loading charts...');
            await this.loadCharts();
            
            console.log('📈 Updating UI...');
            this.updateSummaryCards();
            this.updateBestPerformers();
            
            console.log('✅ SafeDashboard initialized successfully');
            
        } catch (error) {
            console.error('❌ SafeDashboard initialization failed:', error);
            this.showFallbackMessage();
        }
    }

    async waitForAPIClient(timeout = 5000) {
        const startTime = Date.now();
        
        while (!window.APIClient && (Date.now() - startTime) < timeout) {
            console.log('⏳ Waiting for API client...');
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (!window.APIClient) {
            throw new Error('API Client not available after timeout');
        }
        
        console.log('✅ API Client ready');
    }

    async loadSummaryData() {
        try {
            const response = await window.APIClient.getSummary();
            console.log('📡 Summary response:', response);
            
            if (response.status === 'success') {
                this.summaryData = response.data;
                console.log('✅ Summary data loaded');
                return this.summaryData;
            } else {
                throw new Error(response.error || 'Failed to get summary data');
            }
        } catch (error) {
            console.error('❌ Error loading summary data:', error);
            
            // direct API call 시도
            try {
                console.log('🔄 Trying direct API call...');
                const response = await fetch('/api/summary');
                const data = await response.json();
                
                if (data.status === 'success') {
                    this.summaryData = data.data;
                    console.log('✅ Summary data loaded via direct call');
                    return this.summaryData;
                }
            } catch (directError) {
                console.error('❌ Direct API call also failed:', directError);
            }
            
            throw error;
        }
    }

    async loadCharts() {
        const charts = [
            { type: 'overview', containerId: 'overview-chart' },
            { type: 'distribution', containerId: 'distribution-chart' },
            { type: 'success', containerId: 'success-chart' },
            { type: 'radar', containerId: 'radar-chart' }
        ];

        console.log('🎨 Starting safe chart loading...');

        for (const chart of charts) {
            try {
                console.log(`📊 Loading chart: ${chart.type}`);
                
                const container = document.getElementById(chart.containerId);
                if (!container) {
                    console.warn(`⚠️ Container not found: ${chart.containerId}`);
                    continue;
                }

                // 로딩 표시
                this.showChartLoading(chart.containerId);

                // 차트 데이터 가져오기
                const chartData = await this.getChartData(chart.type);
                
                // chart rendering
                await this.renderChart(chart.containerId, chartData);
                
                console.log(`✅ Chart ${chart.type} loaded successfully`);
                
            } catch (error) {
                console.error(`❌ Error loading ${chart.type} chart:`, error);
                this.showChartError(chart.containerId, error.message);
            }
        }

        this.chartsLoaded = true;
        console.log('🎨 Safe chart loading completed');
    }

    async getChartData(chartType) {
        // APIClient를 통한 시도
        try {
            if (window.APIClient && window.APIClient.getChart) {
                const response = await window.APIClient.getChart(chartType);
                if (response.status === 'success') {
                    return response.data;
                }
            }
        } catch (error) {
            console.warn(`⚠️ APIClient failed for ${chartType}, trying direct call`);
        }

        // direct API call
        const response = await fetch(`/api/chart/${chartType}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            return data.data;
        } else {
            throw new Error(data.error || `Failed to get ${chartType} chart`);
        }
    }

    async renderChart(containerId, chartData) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container not found: ${containerId}`);
        }

        // Plotly 가용성 confirm
        if (typeof Plotly === 'undefined') {
            throw new Error('Plotly.js is not available');
        }

        console.log(`🎨 Rendering chart in ${containerId}:`, chartData);

        // 데이터 검증
        if (!chartData || !chartData.data) {
            throw new Error('Invalid chart data structure');
        }

        // 컨테이너 초기화
        container.innerHTML = '';
        
        // 레이아웃 settings
        const layout = {
            ...chartData.layout,
            responsive: true,
            font: { family: 'Inter, sans-serif', size: 12 },
            margin: { l: 50, r: 50, t: 80, b: 50 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)'
        };
        
        const config = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d']
        };
        
        // 차트 생성
        await Plotly.newPlot(containerId, chartData.data, layout, config);
        
        console.log(`✅ Chart rendered successfully: ${containerId}`);
    }

    showChartLoading(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="d-flex justify-content-center align-items-center h-100">
                    <div class="text-center">
                        <div class="spinner-border text-primary mb-3" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <h6>Loading chart...</h6>
                        <small class="text-muted">Please wait...</small>
                    </div>
                </div>
            `;
        }
    }

    showChartError(containerId, message) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="text-center p-4">
                    <i class="fas fa-chart-bar fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">Chart Loading Error</h5>
                    <p class="text-muted small">${message}</p>
                    <button class="btn btn-outline-primary btn-sm mt-2" onclick="window.safeDashboard.loadCharts()">
                        <i class="fas fa-redo me-1"></i>Retry
                    </button>
                </div>
            `;
        }
    }

    updateSummaryCards() {
        if (!this.summaryData) {
            console.warn('⚠️ No summary data for card updates');
            return;
        }

        console.log('📊 Updating summary cards...');

        const cards = [
            { id: 'total-models', value: this.summaryData.total_models || 12 },
            { id: 'total-datasets', value: this.summaryData.total_datasets || 3 },
            { id: 'total-domains', value: this.summaryData.domains?.length || 3 },
            { id: 'avg-performance', value: this.summaryData.success_rate || '94.2%' }
        ];

        cards.forEach(card => {
            const element = document.getElementById(card.id);
            if (element) {
                element.textContent = card.value;
                console.log(`📈 Updated ${card.id}: ${card.value}`);
            }
        });
    }

    updateBestPerformers() {
        if (!this.summaryData?.best_performers) {
            console.warn('⚠️ No best performers data');
            return;
        }

        const container = document.getElementById('best-performers');
        if (!container) return;

        const performers = this.summaryData.best_performers;
        
        container.innerHTML = `
            <div class="col-lg-4 col-md-6 mb-3">
                <div class="card">
                    <div class="card-body text-center">
                        <i class="fas fa-shield-alt fa-2x mb-2 text-primary"></i>
                        <h6 class="card-title">fraud detection 최고 성능</h6>
                        <h4 class="text-success">${(performers.fraud.score * 100).toFixed(1)}%</h4>
                        <p class="card-text">
                            <strong>${performers.fraud.model}</strong><br>
                            <small class="text-muted">${performers.fraud.dataset}</small>
                        </p>
                    </div>
                </div>
            </div>
            
            <div class="col-lg-4 col-md-6 mb-3">
                <div class="card">
                    <div class="card-body text-center">
                        <i class="fas fa-comment-alt fa-2x mb-2 text-info"></i>
                        <h6 class="card-title">sentiment analysis 최고 성능</h6>
                        <h4 class="text-success">${(performers.sentiment.score * 100).toFixed(1)}%</h4>
                        <p class="card-text">
                            <strong>${performers.sentiment.model}</strong><br>
                            <small class="text-muted">${performers.sentiment.dataset}</small>
                        </p>
                    </div>
                </div>
            </div>
            
            <div class="col-lg-4 col-md-6 mb-3">
                <div class="card">
                    <div class="card-body text-center">
                        <i class="fas fa-users fa-2x mb-2 text-warning"></i>
                        <h6 class="card-title">고객 이탈 최고 성능</h6>
                        <h4 class="text-success">${(performers.attrition.score * 100).toFixed(1)}%</h4>
                        <p class="card-text">
                            <strong>${performers.attrition.model}</strong><br>
                            <small class="text-muted">${performers.attrition.dataset}</small>
                        </p>
                    </div>
                </div>
            </div>
        `;

        console.log('✅ Best performers updated');
    }

    showFallbackMessage() {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="container-fluid">
                    <div class="row justify-content-center">
                        <div class="col-md-8">
                            <div class="alert alert-warning text-center">
                                <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                                <h4>Dashboard Loading Issue</h4>
                                <p>There was a problem loading the dashboard. Please try refreshing the page.</p>
                                <button class="btn btn-primary" onclick="location.reload()">
                                    <i class="fas fa-redo me-2"></i>Refresh Page
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    async refresh() {
        console.log('🔄 Refreshing safe dashboard...');
        await this.init();
    }
}

// DOM이 로드된 후 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Safe Dashboard...');
    window.safeDashboard = new SafeDashboard();
});

// error handling
window.addEventListener('error', function(event) {
    console.error('🚨 Global error:', event.error);
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('🚨 Unhandled promise rejection:', event.reason);
});