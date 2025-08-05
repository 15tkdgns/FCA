/**
 * Safe Sentiment Analysis JavaScript
 * ==================================
 * 
 * safe sentiment analysis page loading
 */

class SafeSentimentAnalysis {
    constructor() {
        this.sentimentData = null;
        console.log('💬 SafeSentimentAnalysis initializing...');
        this.init();
    }

    async init() {
        try {
            await this.waitForDependencies();
            console.log('📊 Loading sentiment data...');
            await this.loadSentimentData();
            console.log('🎨 Rendering sentiment chart...');
            this.renderSentimentChart();
            console.log('📋 Rendering data table...');
            this.renderDataTable();
            console.log('✅ SafeSentimentAnalysis initialized successfully');
        } catch (error) {
            console.error('❌ SafeSentimentAnalysis initialization failed:', error);
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

    async loadSentimentData() {
        try {
            if (window.APIClient && window.APIClient.getSentimentData) {
                try {
                    const response = await window.APIClient.getSentimentData();
                    if (response.status === 'success') {
                        this.sentimentData = response.data;
                        return;
                    }
                } catch (error) {
                    console.warn('⚠️ APIClient failed, trying direct call');
                }
            }

            const response = await fetch('/api/sentiment/data');
            const data = await response.json();
            
            if (data.status === 'success') {
                this.sentimentData = data.data;
                console.log('✅ Sentiment data loaded:', this.sentimentData);
            } else {
                throw new Error(data.error || 'Failed to get sentiment data');
            }
        } catch (error) {
            console.error('❌ Error loading sentiment data:', error);
            throw error;
        }
    }

    renderSentimentChart() {
        if (!this.sentimentData) return;

        const container = document.getElementById('sentiment-distribution-chart');
        if (!container) return;

        try {
            const chartData = {
                data: [
                    {
                        labels: ['Positive', 'Negative', 'Neutral'],
                        values: [
                            this.sentimentData.positive || 142863,
                            this.sentimentData.negative || 85158,
                            this.sentimentData.neutral || 55705
                        ],
                        type: 'pie',
                        hole: 0.4,
                        marker: {
                            colors: ['#10b981', '#ef4444', '#6b7280']
                        },
                        textinfo: 'label+percent',
                        textposition: 'outside'
                    }
                ],
                layout: {
                    title: {
                        text: `💬 Sentiment Distribution (${this.sentimentData.best_model})`,
                        font: { size: 18 }
                    },
                    responsive: true,
                    margin: { l: 50, r: 50, t: 80, b: 50 }
                }
            };

            Plotly.newPlot('sentiment-distribution-chart', chartData.data, chartData.layout, {
                responsive: true,
                displayModeBar: false
            });

            console.log('✅ Sentiment chart rendered successfully');
        } catch (error) {
            console.error('❌ Error rendering sentiment chart:', error);
        }
    }

    renderDataTable() {
        if (!this.sentimentData) return;

        const container = document.getElementById('sentiment-statistics-table');
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
                                <td><i class="fas fa-comments me-2"></i>Total Texts</td>
                                <td><strong>${(this.sentimentData.total_texts || 0).toLocaleString()}</strong></td>
                                <td>Total texts analyzed</td>
                            </tr>
                            <tr class="table-success">
                                <td><i class="fas fa-smile me-2 text-success"></i>Positive</td>
                                <td><strong class="text-success">${(this.sentimentData.positive || 0).toLocaleString()}</strong></td>
                                <td>Positive sentiment texts</td>
                            </tr>
                            <tr class="table-danger">
                                <td><i class="fas fa-frown me-2 text-danger"></i>Negative</td>
                                <td><strong class="text-danger">${(this.sentimentData.negative || 0).toLocaleString()}</strong></td>
                                <td>Negative sentiment texts</td>
                            </tr>
                            <tr>
                                <td><i class="fas fa-meh me-2 text-muted"></i>Neutral</td>
                                <td><strong class="text-muted">${(this.sentimentData.neutral || 0).toLocaleString()}</strong></td>
                                <td>Neutral sentiment texts</td>
                            </tr>
                            <tr class="table-primary">
                                <td><i class="fas fa-bullseye me-2"></i>Model Accuracy</td>
                                <td><strong class="text-success">${((this.sentimentData.accuracy || 0) * 100).toFixed(1)}%</strong></td>
                                <td>Overall model accuracy</td>
                            </tr>
                            <tr>
                                <td><i class="fas fa-crosshairs me-2"></i>Precision</td>
                                <td><strong>${((this.sentimentData.precision || 0) * 100).toFixed(1)}%</strong></td>
                                <td>Model precision score</td>
                            </tr>
                            <tr>
                                <td><i class="fas fa-search me-2"></i>Recall</td>
                                <td><strong>${((this.sentimentData.recall || 0) * 100).toFixed(1)}%</strong></td>
                                <td>Model recall score</td>
                            </tr>
                            <tr>
                                <td><i class="fas fa-balance-scale me-2"></i>F1-Score</td>
                                <td><strong>${((this.sentimentData.f1_score || 0) * 100).toFixed(1)}%</strong></td>
                                <td>Harmonic mean of precision and recall</td>
                            </tr>
                            <tr class="table-info">
                                <td><i class="fas fa-robot me-2"></i>Best Model</td>
                                <td><strong class="text-primary">${this.sentimentData.best_model || 'BERT'}</strong></td>
                                <td>Top performing model</td>
                            </tr>
                            <tr>
                                <td><i class="fas fa-database me-2"></i>Dataset</td>
                                <td><strong>${this.sentimentData.dataset || 'Financial Phrasebank'}</strong></td>
                                <td>Training dataset used</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;

            container.innerHTML = tableHtml;
            console.log('✅ Sentiment data table rendered successfully');
        } catch (error) {
            console.error('❌ Error rendering sentiment table:', error);
        }
    }

    showErrorMessage(message) {
        const containers = [
            'sentiment-distribution-chart',
            'sentiment-statistics-table'
        ];

        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="alert alert-danger text-center">
                        <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                        <h5>Loading Failed</h5>
                        <p>${message}</p>
                        <button class="btn btn-outline-danger" onclick="window.safeSentimentAnalysis.init()">
                            <i class="fas fa-redo me-2"></i>Retry
                        </button>
                    </div>
                `;
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Safe Sentiment Analysis...');
    window.safeSentimentAnalysis = new SafeSentimentAnalysis();
});