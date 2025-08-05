// FCA Static Web Dashboard - Chart Generation Logic

class FCACharts {
    constructor() {
        this.defaultLayout = {
            font: { family: 'Inter, sans-serif' },
            margin: { l: 40, r: 40, t: 60, b: 40 },
            paper_bgcolor: 'white',
            plot_bgcolor: 'white'
        };
    }

    // Initialize charts for specific page
    initializeChartsForPage(pageName, data) {
        switch (pageName) {
            case 'fraud':
                this.createFraudDistributionChart(data.charts);
                this.createFraudPerformanceChart(data.charts);
                break;
            case 'sentiment':
                this.createSentimentChart(data.charts);
                break;
            case 'attrition':
                this.createAttritionChart(data.charts);
                break;
            case 'comparison':
                this.createModelComparisonChart(data.charts);
                break;
        }
    }

    // Create fraud distribution chart
    createFraudDistributionChart(chartData) {
        const container = document.getElementById('fraud-distribution-chart');
        if (!container || !chartData?.fraud_distribution) return;

        const data = chartData.fraud_distribution;
        
        const trace = {
            x: data.labels,
            y: data.values,
            type: 'bar',
            marker: {
                color: data.colors
            },
            text: data.values.map(v => v.toLocaleString()),
            textposition: 'auto',
            hovertemplate: '<b>%{x}</b><br>Count: %{y:,}<extra></extra>'
        };

        const layout = {
            ...this.defaultLayout,
            title: {
                text: 'Credit Card Transaction Distribution',
                x: 0.5,
                font: { size: 18, weight: 'bold' }
            },
            xaxis: { title: 'Transaction Type' },
            yaxis: { title: 'Count' },
            height: 400,
            showlegend: false
        };

        Plotly.newPlot(container, [trace], layout, { responsive: true });
    }

    // Create fraud performance chart
    createFraudPerformanceChart(chartData) {
        const container = document.getElementById('fraud-performance-chart');
        if (!container || !chartData?.fraud_performance) return;

        const data = chartData.fraud_performance;
        
        const trace = {
            x: data.metrics,
            y: data.values,
            type: 'bar',
            marker: {
                color: data.colors
            },
            text: data.values.map(v => `${v.toFixed(1)}%`),
            textposition: 'auto',
            hovertemplate: '<b>%{x}</b><br>Score: %{y:.1f}%<extra></extra>'
        };

        const layout = {
            ...this.defaultLayout,
            title: {
                text: 'Fraud Detection Model Performance',
                x: 0.5,
                font: { size: 18, weight: 'bold' }
            },
            yaxis: { 
                title: 'Performance (%)',
                range: [0, 100]
            },
            height: 400,
            showlegend: false
        };

        Plotly.newPlot(container, [trace], layout, { responsive: true });
    }

    // Create sentiment analysis chart
    createSentimentChart(chartData) {
        const container = document.getElementById('sentiment-chart');
        if (!container || !chartData?.sentiment_distribution) return;

        const data = chartData.sentiment_distribution;
        
        const trace = {
            labels: data.labels,
            values: data.values,
            type: 'pie',
            marker: {
                colors: data.colors
            },
            hole: 0.4,
            textinfo: 'label+percent',
            textfont: { size: 12 },
            hovertemplate: '<b>%{label}</b><br>Count: %{value:,}<br>Percentage: %{percent}<extra></extra>'
        };

        const totalSentences = data.values.reduce((sum, val) => sum + val, 0);

        const layout = {
            ...this.defaultLayout,
            title: {
                text: 'Financial News Sentiment Distribution',
                x: 0.5,
                font: { size: 18, weight: 'bold' }
            },
            height: 400,
            annotations: [{
                text: `Total<br>${totalSentences.toLocaleString()}`,
                x: 0.5,
                y: 0.5,
                font: { size: 16 },
                showarrow: false
            }]
        };

        Plotly.newPlot(container, [trace], layout, { responsive: true });
    }

    // Create customer attrition chart
    createAttritionChart(chartData) {
        const container = document.getElementById('attrition-chart');
        if (!container || !chartData?.attrition_by_age) return;

        const data = chartData.attrition_by_age;
        
        const trace = {
            x: data.age_groups,
            y: data.churn_rates,
            type: 'bar',
            name: 'Churn Rate (%)',
            marker: {
                color: '#f59e0b'
            },
            text: data.churn_rates.map(rate => `${rate.toFixed(1)}%`),
            textposition: 'auto',
            hovertemplate: '<b>Age Group: %{x}</b><br>Churn Rate: %{y:.1f}%<extra></extra>'
        };

        const layout = {
            ...this.defaultLayout,
            title: {
                text: 'Customer Churn Rate by Age Group',
                x: 0.5,
                font: { size: 18, weight: 'bold' }
            },
            xaxis: { title: 'Age Group' },
            yaxis: { 
                title: 'Churn Rate (%)',
                range: [0, 30]
            },
            height: 400,
            showlegend: false
        };

        Plotly.newPlot(container, [trace], layout, { responsive: true });
    }

    // Create model comparison chart
    createModelComparisonChart(chartData) {
        const container = document.getElementById('comparison-chart');
        if (!container || !chartData?.model_comparison) return;

        const data = chartData.model_comparison;
        
        const traces = [
            {
                name: 'Fraud Detection',
                x: data.models,
                y: data.fraud_detection,
                type: 'bar',
                marker: { color: '#3b82f6' },
                hovertemplate: '<b>Fraud Detection</b><br>Model: %{x}<br>Accuracy: %{y:.1f}%<extra></extra>'
            },
            {
                name: 'Sentiment Analysis',
                x: data.models,
                y: data.sentiment_analysis,
                type: 'bar',
                marker: { color: '#10b981' },
                hovertemplate: '<b>Sentiment Analysis</b><br>Model: %{x}<br>Accuracy: %{y:.1f}%<extra></extra>'
            },
            {
                name: 'Customer Attrition',
                x: data.models,
                y: data.customer_attrition,
                type: 'bar',
                marker: { color: '#f59e0b' },
                hovertemplate: '<b>Customer Attrition</b><br>Model: %{x}<br>Accuracy: %{y:.1f}%<extra></extra>'
            }
        ];

        const layout = {
            ...this.defaultLayout,
            title: {
                text: 'Model Performance Comparison Across Domains',
                x: 0.5,
                font: { size: 18, weight: 'bold' }
            },
            xaxis: { title: 'Models' },
            yaxis: { 
                title: 'Accuracy (%)',
                range: [75, 100]
            },
            barmode: 'group',
            height: 500,
            legend: { 
                orientation: 'h',
                y: -0.2
            }
        };

        Plotly.newPlot(container, traces, layout, { responsive: true });
    }

    // Create simple bar chart using Chart.js (alternative)
    createSimpleBarChart(containerId, labels, data, colors, title) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Clear any existing content
        container.innerHTML = '<canvas></canvas>';
        const canvas = container.querySelector('canvas');

        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: title,
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: title,
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Create simple pie chart using Chart.js (alternative)
    createSimplePieChart(containerId, labels, data, colors, title) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Clear any existing content
        container.innerHTML = '<canvas></canvas>';
        const canvas = container.querySelector('canvas');

        new Chart(canvas, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: title,
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// Initialize charts manager
window.FCACharts = new FCACharts();