/**
 * Fraud Detection Page JavaScript
 * ===============================
 * 
 * 사기 탐지 분석 페이지의 모든 동적 기능 처리
 * - 실제 사기 탐지 데이터셋 통계 표시
 * - 데이터셋별 비교 차트 렌더링
 * - 상세 통계 테이블 생성
 * - 실시간 데이터 업데이트
 */

class FraudAnalysis {
    constructor() {
        this.fraudData = null;  // API에서 로드한 사기 탐지 통계 데이터
        this.init();            // 사기 탐지 분석 초기화
    }

    /**
     * 사기 탐지 분석 페이지 초기화
     * 데이터 로드 → 차트 렌더링 → 테이블 생성 순으로 실행
     */
    async init() {
        try {
            Utils.showLoading();                // 로딩 상태 표시
            await this.loadFraudStatistics();   // 실제 사기 탐지 통계 데이터 로드
            this.renderFraudChart();            // 데이터셋 비교 차트 렌더링
            this.renderDataTable();             // 상세 통계 테이블 렌더링
        } catch (error) {
            console.error('Fraud analysis initialization error:', error);
            Utils.showError('Failed to load fraud detection data');
        } finally {
            Utils.hideLoading();                // 로딩 상태 숨김
        }
    }

    async loadFraudStatistics() {
        try {
            const response = await window.APIClient.getFraudStatistics();
            if (response.status === 'success') {
                this.fraudData = response.data;
                console.log('Fraud data loaded:', this.fraudData);
            } else {
                throw new Error(response.error || 'Failed to get fraud statistics');
            }
        } catch (error) {
            console.error('Error loading fraud statistics:', error);
            throw error;
        }
    }

    renderFraudChart() {
        if (!this.fraudData || !this.fraudData.dataset_statistics) return;

        const datasets = this.fraudData.dataset_statistics;
        const chartContainer = document.getElementById('fraud-chart');
        
        if (!chartContainer) return;

        // Enhanced data preparation
        const datasetEntries = Object.entries(datasets);
        const datasetNames = datasetEntries.map(([name]) => 
            name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        );
        const fraudRates = datasetEntries.map(([, data]) => parseFloat((data.fraud_rate * 100).toFixed(2)));
        const totalTransactions = datasetEntries.map(([, data]) => data.total_transactions);
        const fraudCounts = datasetEntries.map(([, data]) => data.fraud_transactions);

        // Create enhanced Plotly chart
        if (typeof Plotly !== 'undefined') {
            const trace1 = {
                x: datasetNames,
                y: fraudRates,
                type: 'bar',
                name: 'Fraud Rate (%)',
                yaxis: 'y',
                marker: { 
                    color: fraudRates.map(rate => 
                        rate > 10 ? '#dc2626' : rate > 1 ? '#f59e0b' : '#10b981'
                    )
                },
                text: fraudRates.map(rate => `${rate}%`),
                textposition: 'auto',
                hovertemplate: '<b>%{x}</b><br>Fraud Rate: %{y}%<br><extra></extra>'
            };

            const trace2 = {
                x: datasetNames,
                y: totalTransactions,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Total Transactions',
                yaxis: 'y2',
                line: { color: '#3b82f6', width: 3 },
                marker: { color: '#3b82f6', size: 8 },
                hovertemplate: '<b>%{x}</b><br>Transactions: %{y:,}<br><extra></extra>'
            };

            const trace3 = {
                x: datasetNames,
                y: fraudCounts,
                type: 'bar',
                name: 'Fraud Cases',
                yaxis: 'y3',
                marker: { color: 'rgba(239, 68, 68, 0.6)' },
                text: fraudCounts.map(count => count.toLocaleString()),
                textposition: 'auto',
                hovertemplate: '<b>%{x}</b><br>Fraud Cases: %{y:,}<br><extra></extra>',
                visible: 'legendonly'
            };

            const layout = {
                title: {
                    text: '🛡️ Fraud Detection Dataset Analysis',
                    font: { size: 18, color: '#1f2937' },
                    x: 0.5
                },
                xaxis: { 
                    title: 'Dataset',
                    tickangle: -45
                },
                yaxis: {
                    title: 'Fraud Rate (%)',
                    side: 'left',
                    color: '#dc2626'
                },
                yaxis2: {
                    title: 'Total Transactions',
                    side: 'right',
                    overlaying: 'y',
                    color: '#3b82f6'
                },
                yaxis3: {
                    title: 'Fraud Cases',
                    side: 'right',
                    overlaying: 'y',
                    position: 0.95,
                    color: '#ef4444'
                },
                showlegend: true,
                legend: {
                    orientation: 'h',
                    y: -0.2,
                    x: 0.5,
                    xanchor: 'center'
                },
                margin: { t: 80, l: 60, r: 80, b: 100 },
                plot_bgcolor: 'rgba(0,0,0,0)',
                paper_bgcolor: 'rgba(0,0,0,0)',
                font: { family: 'Inter, sans-serif' }
            };

            const config = {
                responsive: true,
                displayModeBar: true,
                displaylogo: false,
                modeBarButtonsToRemove: ['pan2d', 'lasso2d']
            };

            Plotly.newPlot('fraud-chart', [trace1, trace2, trace3], layout, config);
        } else {
            // Enhanced fallback view
            chartContainer.innerHTML = `
                <div class="text-center p-4">
                    <h5 class="mb-4">🛡️ Fraud Detection Statistics</h5>
                    <div class="row">
                        ${datasetEntries.map(([name, data]) => `
                            <div class="col-lg-4 col-md-6 mb-3">
                                <div class="card h-100 border-${data.fraud_rate > 0.1 ? 'danger' : data.fraud_rate > 0.01 ? 'warning' : 'success'}">
                                    <div class="card-body text-center">
                                        <h6 class="card-title">${name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h6>
                                        <div class="mb-2">
                                            <span class="badge bg-${data.fraud_rate > 0.1 ? 'danger' : data.fraud_rate > 0.01 ? 'warning' : 'success'} fs-6">
                                                ${(data.fraud_rate * 100).toFixed(2)}% Fraud Rate
                                            </span>
                                        </div>
                                        <p class="mb-1"><strong>Total:</strong> ${data.total_transactions.toLocaleString()}</p>
                                        <p class="mb-1"><strong>Fraud:</strong> ${data.fraud_transactions.toLocaleString()}</p>
                                        ${data.amount_stats ? `<p class="mb-0"><strong>Avg Amount:</strong> $${data.amount_stats.mean.toFixed(2)}</p>` : ''}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    }

    renderDataTable() {
        if (!this.fraudData || !this.fraudData.dataset_statistics) return;

        const tableContainer = document.getElementById('fraud-table');
        if (!tableContainer) return;

        const datasets = this.fraudData.dataset_statistics;
        
        let tableHtml = `
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th>Dataset</th>
                            <th>Total Transactions</th>
                            <th>Fraud Cases</th>
                            <th>Fraud Rate</th>
                            <th>Avg Amount</th>
                            <th>Median Amount</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        Object.entries(datasets).forEach(([name, data]) => {
            const displayName = name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            tableHtml += `
                <tr>
                    <td><strong>${displayName}</strong></td>
                    <td>${data.total_transactions.toLocaleString()}</td>
                    <td>${data.fraud_transactions.toLocaleString()}</td>
                    <td>
                        <span class="badge ${data.fraud_rate > 0.1 ? 'bg-danger' : data.fraud_rate > 0.01 ? 'bg-warning' : 'bg-success'}">
                            ${(data.fraud_rate * 100).toFixed(3)}%
                        </span>
                    </td>
                    <td>${data.amount_stats ? '$' + data.amount_stats.mean.toFixed(2) : 'N/A'}</td>
                    <td>${data.amount_stats ? '$' + data.amount_stats.median.toFixed(2) : 'N/A'}</td>
                </tr>
            `;
        });

        tableHtml += `
                    </tbody>
                </table>
            </div>
        `;

        tableContainer.innerHTML = tableHtml;
    }

    // Refresh fraud data
    async refresh() {
        console.log('Refreshing fraud analysis...');
        await this.init();
    }
}

// Initialize fraud analysis when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.fraudAnalysis = new FraudAnalysis();
    
    // Add refresh functionality
    const refreshBtn = document.getElementById('fraud-refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            window.fraudAnalysis.refresh();
        });
    }
});