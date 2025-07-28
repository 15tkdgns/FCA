/**
 * Safe Customer Attrition JavaScript
 * ==================================
 * 
 * 안전한 고객 이탈 분석 페이지 로딩
 */

class SafeAttritionAnalysis {
    constructor() {
        this.attritionData = null;
        console.log('👥 SafeAttritionAnalysis initializing...');
        this.init();
    }

    async init() {
        try {
            await this.waitForDependencies();
            console.log('📊 Loading attrition data...');
            await this.loadAttritionData();
            console.log('🎨 Rendering attrition chart...');
            this.renderAttritionChart();
            console.log('📋 Rendering data table...');
            this.renderDataTable();
            console.log('✅ SafeAttritionAnalysis initialized successfully');
        } catch (error) {
            console.error('❌ SafeAttritionAnalysis initialization failed:', error);
            this.showErrorMessage(error.message);
        }
    }

    async waitForDependencies(timeout = 5000) {
        const startTime = Date.now();
        while (typeof Plotly === 'undefined' && (Date.now() - startTime) < timeout) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (typeof Plotly === 'undefined') {
            throw new Error('Plotly.js not available');
        }
    }

    async loadAttritionData() {
        try {
            if (window.APIClient && window.APIClient.getAttritionData) {
                try {
                    const response = await window.APIClient.getAttritionData();
                    if (response.status === 'success') {
                        this.attritionData = response.data;
                        return;
                    }
                } catch (error) {
                    console.warn('⚠️ APIClient failed, trying direct call');
                }
            }

            const response = await fetch('/api/attrition/data');
            const data = await response.json();
            
            if (data.status === 'success') {
                this.attritionData = data.data;
                console.log('✅ Attrition data loaded:', this.attritionData);
            } else {
                throw new Error(data.error || 'Failed to get attrition data');
            }
        } catch (error) {
            console.error('❌ Error loading attrition data:', error);
            throw error;
        }
    }

    renderAttritionChart() {
        if (!this.attritionData) return;

        const container = document.getElementById('attrition-overview-chart');
        if (!container) return;

        try {
            const totalCustomers = this.attritionData.total_customers || 1000000;
            const churned = this.attritionData.churned_customers || 160000;
            const retained = totalCustomers - churned;

            const chartData = {
                data: [
                    {
                        x: ['Retained Customers', 'Churned Customers'],
                        y: [retained, churned],
                        type: 'bar',
                        marker: {
                            color: ['#10b981', '#ef4444']
                        },
                        text: [
                            `${retained.toLocaleString()} (${((retained/totalCustomers)*100).toFixed(1)}%)`,
                            `${churned.toLocaleString()} (${((churned/totalCustomers)*100).toFixed(1)}%)`
                        ],
                        textposition: 'auto'
                    }
                ],
                layout: {
                    title: {
                        text: `👥 Customer Retention Analysis (${this.attritionData.best_model})`,
                        font: { size: 18 }
                    },
                    xaxis: { title: 'Customer Status' },
                    yaxis: { 
                        title: 'Number of Customers',
                        tickformat: ',.0f'
                    },
                    responsive: true,
                    margin: { l: 50, r: 50, t: 80, b: 50 }
                }
            };

            Plotly.newPlot('attrition-overview-chart', chartData.data, chartData.layout, {
                responsive: true,
                displayModeBar: false
            });

            console.log('✅ Attrition chart rendered successfully');
        } catch (error) {
            console.error('❌ Error rendering attrition chart:', error);
        }
    }

    renderDataTable() {
        if (!this.attritionData) return;

        const container = document.getElementById('attrition-statistics-table');
        if (!container) return;

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
                                <td><i class="fas fa-users me-2"></i>Total Customers</td>
                                <td><strong>${(this.attritionData.total_customers || 0).toLocaleString()}</strong></td>
                                <td>Total customers analyzed</td>
                            </tr>
                            <tr class="table-danger">
                                <td><i class="fas fa-user-minus me-2 text-danger"></i>Churned Customers</td>
                                <td><strong class="text-danger">${(this.attritionData.churned_customers || 0).toLocaleString()}</strong></td>
                                <td>Customers who left</td>
                            </tr>
                            <tr class="table-success">
                                <td><i class="fas fa-user-plus me-2 text-success"></i>Retained Customers</td>
                                <td><strong class="text-success">${((this.attritionData.total_customers || 0) - (this.attritionData.churned_customers || 0)).toLocaleString()}</strong></td>
                                <td>Customers who stayed</td>
                            </tr>
                            <tr class="table-warning">
                                <td><i class="fas fa-percentage me-2"></i>Churn Rate</td>
                                <td><strong class="text-warning">${((this.attritionData.churn_rate || 0) * 100).toFixed(1)}%</strong></td>
                                <td>Percentage of customers who churned</td>
                            </tr>
                            <tr class="table-primary">
                                <td><i class="fas fa-bullseye me-2"></i>Model Accuracy</td>
                                <td><strong class="text-success">${((this.attritionData.accuracy || 0) * 100).toFixed(1)}%</strong></td>
                                <td>Overall model accuracy</td>
                            </tr>
                            <tr>
                                <td><i class="fas fa-crosshairs me-2"></i>Precision</td>
                                <td><strong>${((this.attritionData.precision || 0) * 100).toFixed(1)}%</strong></td>
                                <td>Model precision score</td>
                            </tr>
                            <tr>
                                <td><i class="fas fa-search me-2"></i>Recall</td>
                                <td><strong>${((this.attritionData.recall || 0) * 100).toFixed(1)}%</strong></td>
                                <td>Model recall score</td>
                            </tr>
                            <tr>
                                <td><i class="fas fa-balance-scale me-2"></i>F1-Score</td>
                                <td><strong>${((this.attritionData.f1_score || 0) * 100).toFixed(1)}%</strong></td>
                                <td>Harmonic mean of precision and recall</td>
                            </tr>
                            <tr class="table-info">
                                <td><i class="fas fa-robot me-2"></i>Best Model</td>
                                <td><strong class="text-primary">${this.attritionData.best_model || 'XGBoost'}</strong></td>
                                <td>Top performing model</td>
                            </tr>
                            <tr>
                                <td><i class="fas fa-database me-2"></i>Dataset</td>
                                <td><strong>${this.attritionData.dataset || 'Customer Attrition'}</strong></td>
                                <td>Training dataset used</td>
                            </tr>
                            <tr>
                                <td><i class="fas fa-cogs me-2"></i>Models Tested</td>
                                <td><strong>${this.attritionData.models_tested || 5}</strong></td>
                                <td>Number of models evaluated</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;

            container.innerHTML = tableHtml;
            console.log('✅ Attrition data table rendered successfully');
        } catch (error) {
            console.error('❌ Error rendering attrition table:', error);
        }
    }

    showErrorMessage(message) {
        const containers = [
            'attrition-overview-chart',
            'attrition-statistics-table'
        ];

        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="alert alert-danger text-center">
                        <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                        <h5>Loading Failed</h5>
                        <p>${message}</p>
                        <button class="btn btn-outline-danger" onclick="window.safeAttritionAnalysis.init()">
                            <i class="fas fa-redo me-2"></i>Retry
                        </button>
                    </div>
                `;
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Safe Attrition Analysis...');
    window.safeAttritionAnalysis = new SafeAttritionAnalysis();
});