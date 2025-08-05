/**
 * Pie Chart Module
 * Specialized pie and donut chart rendering
 */

class PieCharts {
    constructor(renderer) {
        this.renderer = renderer;
    }
    
    /**
     * Render fraud risk distribution pie chart
     */
    async renderFraudDistribution(data, containerIds = ['fraud-risk-chart', 'fraud-risk-detail-chart']) {
        console.log('🔍 PieCharts: Rendering fraud distribution');
        
        if (!this.renderer.validateData(data, ['labels', 'data', 'backgroundColor'])) {
            console.error('❌ Invalid fraud distribution data');
            return false;
        }
        
        const trace = {
            labels: data.labels,
            values: data.data,
            type: 'pie',
            marker: {
                colors: data.backgroundColor,
                line: {
                    color: '#ffffff',
                    width: 2
                }
            },
            textinfo: 'percent',
            textposition: 'inside',
            textfont: {
                size: 12,
                color: 'white'
            },
            hovertemplate: '<b>%{label}</b><br>Cases: %{value:,}<br>Percentage: %{percent}<br><span style="color:#ffdc00;">⭐ Click to highlight</span><extra></extra>',
            pull: data.labels.map(() => 0)
        };
        
        const layout = {
            title: {
                text: 'Fraud Risk Distribution',
                font: { size: 16, color: '#5a5c69' }
            },
            showlegend: true,
            legend: {
                orientation: 'v',
                x: 1.05,
                y: 0.5,
                xanchor: 'left',
                yanchor: 'middle'
            },
            margin: { t: 50, r: 100, b: 20, l: 20 },
            autosize: true
        };
        
        return await this.renderer.render(containerIds, [trace], layout);
    }
    
    /**
     * Render sentiment distribution pie chart
     */
    async renderSentimentDistribution(data, containerIds = ['sentiment-distribution-chart', 'sentiment-distribution-detail-chart']) {
        console.log('🔍 PieCharts: Rendering sentiment distribution');
        
        // Provide fallback data if needed
        if (!data || !data.labels) {
            console.warn('⚠️ Using fallback sentiment data');
            data = {
                labels: ['Positive', 'Neutral', 'Negative'],
                data: [0.27, 0.606, 0.124],
                backgroundColor: ['#4CAF50', '#9E9E9E', '#F44336']
            };
        }
        
        if (!this.renderer.validateData(data, ['labels', 'data', 'backgroundColor'])) {
            return false;
        }
        
        const trace = {
            labels: data.labels,
            values: data.data,
            type: 'pie',
            marker: {
                colors: data.backgroundColor,
                line: {
                    color: '#ffffff',
                    width: 2
                }
            },
            textinfo: 'percent',
            textposition: 'inside',
            textfont: {
                size: 12,
                color: 'white'
            },
            hovertemplate: '<b>%{label}</b><br>Proportion: %{percent}<br><span style="color:#36d7b7;">💭 Sentiment Analysis</span><extra></extra>',
            pull: data.labels.map(() => 0)
        };
        
        const layout = {
            title: {
                text: 'Sentiment Distribution',
                font: { size: 16, color: '#5a5c69' }
            },
            showlegend: true,
            legend: {
                orientation: 'v',
                x: 1.05,
                y: 0.5,
                xanchor: 'left',
                yanchor: 'middle'
            },
            margin: { t: 50, r: 100, b: 20, l: 20 },
            autosize: true
        };
        
        return await this.renderer.render(containerIds, [trace], layout);
    }
    
    /**
     * Render customer segments donut chart
     */
    async renderCustomerSegments(data, containerIds = ['customer-segments-chart', 'customer-segments-detail-chart']) {
        console.log('🔍 PieCharts: Rendering customer segments');
        
        // Provide fallback data if needed
        if (!data || !data.labels) {
            console.warn('⚠️ Using fallback customer segments data');
            data = {
                labels: ['Premium', 'Standard', 'Basic', 'At Risk', 'High Value'],
                data: [2500, 4200, 3100, 800, 1400],
                backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b']
            };
        }
        
        if (!this.renderer.validateData(data, ['labels', 'data', 'backgroundColor'])) {
            return false;
        }
        
        const trace = {
            labels: data.labels,
            values: data.data,
            type: 'pie',
            hole: 0.4, // Makes it a donut chart
            marker: {
                colors: data.backgroundColor,
                line: {
                    color: '#ffffff',
                    width: 2
                }
            },
            textinfo: 'percent',
            textposition: 'inside',
            textfont: {
                size: 11,
                color: 'white'
            },
            hovertemplate: '<b>%{label}</b><br>Customers: %{value:,}<br>Percentage: %{percent}<br><span style="color:#ff6b6b;">👥 Customer Segment</span><extra></extra>',
            pull: data.labels.map(() => 0)
        };
        
        const layout = {
            title: {
                text: 'Customer Segments',
                font: { size: 16, color: '#5a5c69' }
            },
            showlegend: true,
            legend: {
                orientation: 'v',
                x: 1.05,
                y: 0.5,
                xanchor: 'left',
                yanchor: 'middle'
            },
            annotations: [{
                text: 'Customer<br>Segments',
                x: 0.5,
                y: 0.5,
                font: {
                    size: 12,
                    color: '#5a5c69'
                },
                showarrow: false
            }],
            margin: { t: 50, r: 120, b: 20, l: 20 },
            autosize: true
        };
        
        return await this.renderer.render(containerIds, [trace], layout);
    }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PieCharts;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.PieCharts = PieCharts;
}