/**
 * Bar Chart Module
 * Specialized bar chart rendering for model comparisons and feature importance
 */

class BarCharts {
    constructor(renderer) {
        this.renderer = renderer;
    }
    
    /**
     * Render model comparison bar chart
     */
    async renderModelComparison(data, containerIds = ['model-performance-chart']) {
        console.log('🔍 BarCharts: Rendering model comparison');
        
        if (!this.renderer.validateData(data, ['labels', 'datasets'])) {
            console.error('❌ Invalid model comparison data');
            return false;
        }
        
        const datasets = data.datasets[0];
        
        const trace = {
            x: data.labels,
            y: datasets.data,
            type: 'bar',
            marker: {
                color: datasets.backgroundColor || ['#e74a3b', '#36b9cc', '#f6c23e'],
                opacity: 0.8,
                line: {
                    color: ['#c0392b', '#2c9faf', '#e6ac00'],
                    width: 2
                }
            },
            text: datasets.data.map(val => `${(val * 100).toFixed(1)}%`),
            textposition: 'auto',
            hovertemplate: '<b>%{x}</b><br>Performance: %{text}<br><span style="color:#5dade2;">🚀 Model Performance</span><extra></extra>'
        };
        
        const layout = {
            title: {
                text: 'Model Performance Comparison',
                font: { size: 16, color: '#5a5c69' }
            },
            xaxis: {
                title: 'Models',
                tickangle: -45
            },
            yaxis: {
                title: 'Performance Score',
                tickformat: '.1%',
                range: [0, 1],
                gridcolor: '#e3e6f0',
                gridwidth: 1
            },
            plot_bgcolor: 'rgba(0,0,0,0)',
            paper_bgcolor: 'rgba(0,0,0,0)'
        };
        
        return await this.renderer.render(containerIds, [trace], layout);
    }
    
    /**
     * Render feature importance horizontal bar chart
     */
    async renderFeatureImportance(data, title = 'Feature Importance', containerIds) {
        console.log('🔍 BarCharts: Rendering feature importance');
        
        if (!this.renderer.validateData(data, ['features', 'values'])) {
            console.error('❌ Invalid feature importance data');
            return false;
        }
        
        const trace = {
            x: data.values,
            y: data.features,
            type: 'bar',
            orientation: 'h',
            marker: {
                color: data.values.map(v => v > 0.12 ? '#dc3545' : v > 0.08 ? '#ffc107' : '#28a745'),
                opacity: 0.8,
                line: {
                    color: '#ffffff',
                    width: 1
                }
            },
            text: data.values.map(v => `${(v * 100).toFixed(1)}%`),
            textposition: 'auto',
            hovertemplate: '<b>%{y}</b><br>Importance: %{text}<br><span style="color:#a569bd;">🎯 Feature Impact</span><extra></extra>'
        };
        
        const layout = {
            title: {
                text: title,
                font: { size: 16, color: '#5a5c69' }
            },
            xaxis: {
                title: 'Importance Score',
                tickformat: '.1%'
            },
            yaxis: {
                title: 'Features',
                automargin: true
            },
            margin: { t: 50, r: 30, b: 50, l: 120 },
            height: 350,
            plot_bgcolor: 'rgba(0,0,0,0)',
            paper_bgcolor: 'rgba(0,0,0,0)'
        };
        
        return await this.renderer.render(containerIds, [trace], layout);
    }
    
    /**
     * Render fraud feature importance
     */
    renderFraudFeatureImportance(data, containerIds = ['fraud-feature-importance-main-chart', 'fraud-feature-importance-chart']) {
        return this.renderFeatureImportance(data, 'Fraud Detection - Feature Importance', containerIds);
    }
    
    /**
     * Render attrition feature importance  
     */
    renderAttritionFeatureImportance(data, containerIds = ['attrition-feature-importance-chart']) {
        return this.renderFeatureImportance(data, 'Customer Attrition - Feature Importance', containerIds);
    }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BarCharts;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.BarCharts = BarCharts;
}