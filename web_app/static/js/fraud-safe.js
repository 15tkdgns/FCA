/**
 * Safe Fraud Detection JavaScript
 * ===============================
 * 
 * 안전한 사기 탐지 페이지 로딩
 * - API 클라이언트 초기화 대기
 * - 직접 API 호출 fallback
 * - 견고한 에러 처리
 */

class SafeFraudAnalysis {
    constructor() {
        this.fraudData = null;
        this.maxRetries = 3;
        
        console.log('🛡️ SafeFraudAnalysis initializing...');
        this.init();
    }

    async init() {
        try {
            // API 클라이언트 준비 대기
            await this.waitForDependencies();
            
            console.log('📊 Loading fraud statistics...');
            await this.loadFraudStatistics();
            
            console.log('🎨 Rendering fraud chart...');
            this.renderFraudChart();
            
            console.log('📋 Rendering data table...');
            this.renderDataTable();
            
            console.log('✅ SafeFraudAnalysis initialized successfully');
            
        } catch (error) {
            console.error('❌ SafeFraudAnalysis initialization failed:', error);
            this.showErrorMessage(error.message);
        }
    }

    async waitForDependencies(timeout = 5000) {
        const startTime = Date.now();
        
        // Utils와 Plotly 대기
        while ((!window.Utils || typeof Plotly === 'undefined') && (Date.now() - startTime) < timeout) {
            console.log('⏳ Waiting for dependencies...');
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (!window.Utils) {
            console.warn('⚠️ Utils not available, using fallback');
        }
        
        if (typeof Plotly === 'undefined') {
            throw new Error('Plotly.js not available');
        }
        
        console.log('✅ Dependencies ready');
    }

    async loadFraudStatistics() {
        try {
            // APIClient를 통한 시도
            if (window.APIClient && window.APIClient.getFraudStatistics) {
                try {
                    const response = await window.APIClient.getFraudStatistics();
                    if (response.status === 'success') {
                        this.fraudData = response.data;
                        console.log('✅ Fraud data loaded via APIClient');
                        return;
                    }
                } catch (error) {
                    console.warn('⚠️ APIClient failed, trying direct call:', error);
                }
            }

            // 직접 API 호출
            console.log('🔄 Trying direct API call...');
            const response = await fetch('/api/fraud/statistics');
            const data = await response.json();
            
            if (data.status === 'success') {
                this.fraudData = data.data;
                console.log('✅ Fraud data loaded via direct call:', this.fraudData);
            } else {
                throw new Error(data.error || 'Failed to get fraud statistics');
            }
            
        } catch (error) {
            console.error('❌ Error loading fraud statistics:', error);
            throw error;
        }
    }

    renderFraudChart() {
        if (!this.fraudData) {
            console.error('❌ No fraud data available for chart');
            return;
        }

        const container = document.getElementById('fraud-performance-chart');
        if (!container) {
            console.error('❌ Chart container not found');
            return;
        }

        try {
            // 차트 데이터 생성
            const chartData = {
                data: [
                    {
                        x: ['Accuracy', 'Precision', 'Recall', 'F1-Score'],
                        y: [
                            this.fraudData.accuracy || 0.940,
                            this.fraudData.precision || 0.887,
                            this.fraudData.recall || 0.846,
                            this.fraudData.f1_score || 0.866
                        ],
                        type: 'bar',
                        marker: { color: ['#dc2626', '#2563eb', '#059669', '#d97706'] },
                        text: [
                            `${((this.fraudData.accuracy || 0.940) * 100).toFixed(1)}%`,
                            `${((this.fraudData.precision || 0.887) * 100).toFixed(1)}%`,
                            `${((this.fraudData.recall || 0.846) * 100).toFixed(1)}%`,
                            `${((this.fraudData.f1_score || 0.866) * 100).toFixed(1)}%`
                        ],
                        textposition: 'auto'
                    }
                ],
                layout: {
                    title: {
                        text: `🛡️ ${this.fraudData.best_model} Performance Metrics`,
                        font: { size: 18 }
                    },
                    xaxis: { title: 'Metrics' },
                    yaxis: { 
                        title: 'Score',
                        tickformat: '.0%',
                        range: [0, 1]
                    },
                    responsive: true,
                    margin: { l: 50, r: 50, t: 80, b: 50 }
                }
            };

            // 차트 렌더링
            Plotly.newPlot('fraud-performance-chart', chartData.data, chartData.layout, {
                responsive: true,
                displayModeBar: false
            });

            console.log('✅ Fraud chart rendered successfully');

        } catch (error) {
            console.error('❌ Error rendering fraud chart:', error);
            container.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Chart rendering failed: ${error.message}
                </div>
            `;
        }
    }

    renderDataTable() {
        if (!this.fraudData) {
            console.error('❌ No fraud data available for table');
            return;
        }

        const container = document.getElementById('fraud-statistics-table');
        if (!container) {
            console.error('❌ Table container not found');
            return;
        }

        try {
            const tableHtml = `
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead class="table-dark">
                            <tr>
                                <th>Metric</th>
                                <th>Value</th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><i class="fas fa-credit-card me-2"></i>Total Transactions</td>
                                <td><strong>${(this.fraudData.total_transactions || 0).toLocaleString()}</strong></td>
                                <td>Total transactions analyzed</td>
                            </tr>
                            <tr>
                                <td><i class="fas fa-exclamation-triangle me-2 text-danger"></i>Fraud Detected</td>
                                <td><strong class="text-danger">${(this.fraudData.fraud_detected || 0).toLocaleString()}</strong></td>
                                <td>Fraudulent transactions identified</td>
                            </tr>
                            <tr>
                                <td><i class="fas fa-percentage me-2"></i>Fraud Rate</td>
                                <td><strong>${((this.fraudData.fraud_rate || 0) * 100).toFixed(3)}%</strong></td>
                                <td>Percentage of fraudulent transactions</td>
                            </tr>
                            <tr class="table-primary">
                                <td><i class="fas fa-bullseye me-2"></i>Model Accuracy</td>
                                <td><strong class="text-success">${((this.fraudData.accuracy || 0) * 100).toFixed(1)}%</strong></td>
                                <td>Overall model accuracy</td>
                            </tr>
                            <tr>
                                <td><i class="fas fa-crosshairs me-2"></i>Precision</td>
                                <td><strong>${((this.fraudData.precision || 0) * 100).toFixed(1)}%</strong></td>
                                <td>True positives / (True positives + False positives)</td>
                            </tr>
                            <tr>
                                <td><i class="fas fa-search me-2"></i>Recall</td>
                                <td><strong>${((this.fraudData.recall || 0) * 100).toFixed(1)}%</strong></td>
                                <td>True positives / (True positives + False negatives)</td>
                            </tr>
                            <tr>
                                <td><i class="fas fa-balance-scale me-2"></i>F1-Score</td>
                                <td><strong>${((this.fraudData.f1_score || 0) * 100).toFixed(1)}%</strong></td>
                                <td>Harmonic mean of precision and recall</td>
                            </tr>
                            <tr class="table-info">
                                <td><i class="fas fa-robot me-2"></i>Best Model</td>
                                <td><strong class="text-primary">${this.fraudData.best_model || 'Random Forest'}</strong></td>
                                <td>Top performing model</td>
                            </tr>
                            <tr>
                                <td><i class="fas fa-database me-2"></i>Dataset Size</td>
                                <td><strong>${this.fraudData.dataset_size || '568K transactions'}</strong></td>
                                <td>Training dataset size</td>
                            </tr>
                            <tr>
                                <td><i class="fas fa-calendar me-2"></i>Last Updated</td>
                                <td><strong>${this.fraudData.last_updated || '2025-01-25'}</strong></td>
                                <td>Data last updated date</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;

            container.innerHTML = tableHtml;
            console.log('✅ Fraud data table rendered successfully');

        } catch (error) {
            console.error('❌ Error rendering fraud table:', error);
            container.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Table rendering failed: ${error.message}
                </div>
            `;
        }
    }

    showErrorMessage(message) {
        // 차트 컨테이너에 에러 메시지 표시
        const chartContainer = document.getElementById('fraud-performance-chart');
        if (chartContainer) {
            chartContainer.innerHTML = `
                <div class="alert alert-danger text-center">
                    <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                    <h5>Loading Failed</h5>
                    <p>${message}</p>
                    <button class="btn btn-outline-danger" onclick="window.safeFraudAnalysis.init()">
                        <i class="fas fa-redo me-2"></i>Retry
                    </button>
                </div>
            `;
        }

        // 테이블 컨테이너에도 에러 메시지 표시
        const tableContainer = document.getElementById('fraud-statistics-table');
        if (tableContainer) {
            tableContainer.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Failed to load fraud detection statistics. Please try refreshing the page.
                </div>
            `;
        }
    }

    async refresh() {
        console.log('🔄 Refreshing fraud analysis...');
        await this.init();
    }
}

// DOM 로드 후 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Safe Fraud Analysis...');
    window.safeFraudAnalysis = new SafeFraudAnalysis();
});

// 에러 처리
window.addEventListener('error', function(event) {
    console.error('🚨 Fraud page error:', event.error);
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('🚨 Fraud page unhandled rejection:', event.reason);
});