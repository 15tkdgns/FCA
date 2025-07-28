// XAI (Explainable AI) Dashboard JavaScript
// Handles interactive charts and explanations for model interpretability

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 XAI Dashboard initializing...');
    
    // Initialize XAI dashboard
    initializeXAIDashboard();
    
    // Load XAI data and charts
    loadXAIData();
});

function initializeXAIDashboard() {
    // Update summary cards with loading states
    updateSummaryCards();
    
    // Initialize all charts
    createShapImportanceChart();
    createGlobalImportanceChart();
    createShapWaterfallChart();
    createShapSummaryChart();
    createLimeExplanationChart();
    createPDPChart();
    createInterpretabilityRadarChart();
}

function updateSummaryCards() {
    // Simulate loading and update with sample data
    setTimeout(() => {
        document.getElementById('shap-features').textContent = '15';
        document.getElementById('lime-samples').textContent = '100';
        document.getElementById('feature-count').textContent = '8';
        document.getElementById('transparency-score').textContent = '86%';
    }, 1000);
}

function loadXAIData() {
    // In a real implementation, this would fetch data from the API
    console.log('📊 Loading XAI explanation data...');
}

function createShapImportanceChart() {
    // Sample SHAP feature importance data
    const features = [
        'Transaction_Amount', 'Account_Balance', 'Transaction_Time', 
        'Merchant_Category', 'Location_Risk', 'Payment_Method',
        'Customer_Age', 'Previous_Transactions'
    ];
    
    const shapValues = [0.45, -0.32, 0.28, 0.21, -0.18, 0.15, -0.12, 0.08];
    const colors = shapValues.map(val => val > 0 ? '#2563eb' : '#dc2626');
    
    const trace = {
        y: features,
        x: shapValues,
        type: 'bar',
        orientation: 'h',
        marker: {
            color: colors,
            opacity: 0.8
        },
        hovertemplate: '<b>%{y}</b><br>SHAP Value: %{x:.3f}<extra></extra>'
    };
    
    const layout = {
        title: {
            text: 'Feature Importance (SHAP Values)',
            font: { size: 14, color: '#374151' }
        },
        xaxis: {
            title: 'SHAP Value',
            gridcolor: '#f3f4f6',
            zerolinecolor: '#9ca3af'
        },
        yaxis: {
            title: '',
            gridcolor: '#f3f4f6'
        },
        margin: { l: 150, r: 20, t: 50, b: 50 },
        paper_bgcolor: 'white',
        plot_bgcolor: 'white',
        font: { family: 'Inter, sans-serif', size: 12, color: '#374151' }
    };
    
    Plotly.newPlot('shap-importance-chart', [trace], layout, {
        responsive: true,
        displayModeBar: false
    });
}

function createGlobalImportanceChart() {
    // Sample global feature importance data
    const features = ['Amount', 'Balance', 'Time', 'Category', 'Risk', 'Method'];
    const importance = [0.35, 0.28, 0.15, 0.12, 0.07, 0.03];
    
    const trace = {
        labels: features,
        values: importance,
        type: 'pie',
        hole: 0.4,
        marker: {
            colors: ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2'],
            line: { color: '#ffffff', width: 2 }
        },
        textinfo: 'label+percent',
        textposition: 'outside',
        hovertemplate: '<b>%{label}</b><br>Importance: %{value:.2f}<br>Percentage: %{percent}<extra></extra>'
    };
    
    const layout = {
        title: {
            text: 'Global Feature Importance',
            font: { size: 14, color: '#374151' }
        },
        showlegend: false,
        margin: { l: 20, r: 20, t: 50, b: 20 },
        paper_bgcolor: 'white',
        font: { family: 'Inter, sans-serif', size: 11, color: '#374151' }
    };
    
    Plotly.newPlot('global-importance-chart', [trace], layout, {
        responsive: true,
        displayModeBar: false
    });
}

function createShapWaterfallChart() {
    // Sample SHAP waterfall data for a single prediction
    const labels = ['Base Value', 'Amount', 'Balance', 'Time', 'Category', 'Risk', 'Final Prediction'];
    const values = [0.2, 0.15, -0.08, 0.05, 0.03, -0.02];
    const cumulative = [0.2];
    
    // Calculate cumulative values
    for (let i = 0; i < values.length - 1; i++) {
        cumulative.push(cumulative[cumulative.length - 1] + values[i]);
    }
    
    const trace = {
        x: labels.slice(0, -1),
        y: values,
        type: 'waterfall',
        orientation: 'v',
        measure: ['absolute', 'relative', 'relative', 'relative', 'relative', 'relative'],
        connector: {
            line: { color: '#9ca3af', width: 2 }
        },
        increasing: { marker: { color: '#059669' } },
        decreasing: { marker: { color: '#dc2626' } },
        totals: { marker: { color: '#2563eb' } },
        hovertemplate: '<b>%{x}</b><br>Contribution: %{y:.3f}<extra></extra>'
    };
    
    const layout = {
        title: {
            text: 'SHAP Waterfall for Sample Prediction',
            font: { size: 14, color: '#374151' }
        },
        xaxis: {
            title: 'Features',
            gridcolor: '#f3f4f6'
        },
        yaxis: {
            title: 'SHAP Value',
            gridcolor: '#f3f4f6'
        },
        margin: { l: 50, r: 20, t: 50, b: 80 },
        paper_bgcolor: 'white',
        plot_bgcolor: 'white',
        font: { family: 'Inter, sans-serif', size: 12, color: '#374151' }
    };
    
    Plotly.newPlot('shap-waterfall-chart', [trace], layout, {
        responsive: true,
        displayModeBar: false
    });
}

function createShapSummaryChart() {
    // Sample SHAP summary plot data
    const features = ['Transaction_Amount', 'Account_Balance', 'Transaction_Time', 'Merchant_Category', 'Location_Risk'];
    const data = [];
    
    features.forEach((feature, idx) => {
        // Generate sample SHAP values and feature values
        const shapValues = Array.from({length: 100}, () => (Math.random() - 0.5) * 0.6);
        const featureValues = Array.from({length: 100}, () => Math.random());
        
        const trace = {
            x: shapValues,
            y: Array(100).fill(idx),
            mode: 'markers',
            marker: {
                size: 4,
                color: featureValues,
                colorscale: 'RdYlBu',
                showscale: idx === 0,
                colorbar: {
                    title: 'Feature Value',
                    titleside: 'right'
                },
                opacity: 0.7
            },
            name: feature,
            showlegend: false,
            hovertemplate: '<b>' + feature + '</b><br>SHAP: %{x:.3f}<br>Value: %{marker.color:.2f}<extra></extra>'
        };
        
        data.push(trace);
    });
    
    const layout = {
        title: {
            text: 'SHAP Summary Plot',
            font: { size: 14, color: '#374151' }
        },
        xaxis: {
            title: 'SHAP Value',
            gridcolor: '#f3f4f6',
            zerolinecolor: '#9ca3af'
        },
        yaxis: {
            title: '',
            tickmode: 'array',
            tickvals: [0, 1, 2, 3, 4],
            ticktext: features,
            gridcolor: '#f3f4f6'
        },
        margin: { l: 120, r: 80, t: 50, b: 50 },
        paper_bgcolor: 'white',
        plot_bgcolor: 'white',
        font: { family: 'Inter, sans-serif', size: 12, color: '#374151' }
    };
    
    Plotly.newPlot('shap-summary-chart', data, layout, {
        responsive: true,
        displayModeBar: false
    });
}

function createLimeExplanationChart() {
    // Sample LIME explanation data
    const features = ['Amount > 1000', 'Balance < 500', 'Weekend Transaction', 'New Merchant', 'High Risk Location'];
    const contributions = [0.35, -0.28, 0.15, 0.12, -0.08];
    const colors = contributions.map(val => val > 0 ? '#dc2626' : '#059669');
    
    const trace = {
        y: features,
        x: contributions,
        type: 'bar',
        orientation: 'h',
        marker: {
            color: colors,
            opacity: 0.8
        },
        hovertemplate: '<b>%{y}</b><br>Contribution: %{x:.3f}<extra></extra>'
    };
    
    const layout = {
        title: {
            text: 'LIME Local Explanation',
            font: { size: 14, color: '#374151' }
        },
        xaxis: {
            title: 'Feature Contribution',
            gridcolor: '#f3f4f6',
            zerolinecolor: '#9ca3af'
        },
        yaxis: {
            title: '',
            gridcolor: '#f3f4f6'
        },
        margin: { l: 140, r: 20, t: 50, b: 50 },
        paper_bgcolor: 'white',
        plot_bgcolor: 'white',
        font: { family: 'Inter, sans-serif', size: 12, color: '#374151' }
    };
    
    Plotly.newPlot('lime-explanation-chart', [trace], layout, {
        responsive: true,
        displayModeBar: false
    });
}

function createPDPChart() {
    // Sample Partial Dependence Plot data
    const transactionAmounts = Array.from({length: 50}, (_, i) => i * 100);
    const pdpValues = transactionAmounts.map(amount => {
        // Simulate a relationship where fraud probability increases with amount
        return Math.tanh(amount / 2000) * 0.8 + Math.random() * 0.1;
    });
    
    const trace = {
        x: transactionAmounts,
        y: pdpValues,
        type: 'scatter',
        mode: 'lines+markers',
        line: {
            color: '#2563eb',
            width: 3
        },
        marker: {
            color: '#2563eb',
            size: 6,
            opacity: 0.7
        },
        hovertemplate: '<b>Amount: $%{x}</b><br>Fraud Probability: %{y:.3f}<extra></extra>'
    };
    
    const layout = {
        title: {
            text: 'Partial Dependence: Transaction Amount',
            font: { size: 14, color: '#374151' }
        },
        xaxis: {
            title: 'Transaction Amount ($)',
            gridcolor: '#f3f4f6'
        },
        yaxis: {
            title: 'Fraud Probability',
            gridcolor: '#f3f4f6'
        },
        margin: { l: 60, r: 20, t: 50, b: 50 },
        paper_bgcolor: 'white',
        plot_bgcolor: 'white',
        font: { family: 'Inter, sans-serif', size: 12, color: '#374151' }
    };
    
    Plotly.newPlot('pdp-chart', [trace], layout, {
        responsive: true,
        displayModeBar: false
    });
}

function createInterpretabilityRadarChart() {
    // Sample interpretability metrics for different domains
    const domains = ['Fraud Detection', 'Sentiment Analysis', 'Customer Attrition'];
    const metrics = ['Feature Importance', 'SHAP Consistency', 'LIME Stability', 'Model Transparency', 'Global Explanations'];
    
    const data = [
        {
            type: 'scatterpolar',
            r: [95, 88, 82, 79, 85],
            theta: metrics,
            fill: 'toself',
            name: 'Fraud Detection',
            marker: { color: '#2563eb' },
            fillcolor: 'rgba(37, 99, 235, 0.1)'
        },
        {
            type: 'scatterpolar',
            r: [88, 92, 78, 83, 80],
            theta: metrics,
            fill: 'toself',
            name: 'Sentiment Analysis',
            marker: { color: '#059669' },
            fillcolor: 'rgba(5, 150, 105, 0.1)'
        },
        {
            type: 'scatterpolar',
            r: [90, 85, 88, 86, 82],
            theta: metrics,
            fill: 'toself',
            name: 'Customer Attrition',
            marker: { color: '#d97706' },
            fillcolor: 'rgba(217, 119, 6, 0.1)'
        }
    ];
    
    const layout = {
        title: {
            text: 'Model Interpretability Comparison',
            font: { size: 14, color: '#374151' }
        },
        polar: {
            radialaxis: {
                visible: true,
                range: [0, 100],
                gridcolor: '#e5e7eb'
            },
            angularaxis: {
                gridcolor: '#e5e7eb'
            }
        },
        showlegend: true,
        legend: {
            orientation: 'h',
            y: -0.1,
            x: 0.5,
            xanchor: 'center'
        },
        margin: { l: 50, r: 50, t: 50, b: 80 },
        paper_bgcolor: 'white',
        font: { family: 'Inter, sans-serif', size: 12, color: '#374151' }
    };
    
    Plotly.newPlot('interpretability-radar-chart', data, layout, {
        responsive: true,
        displayModeBar: false
    });
}

// Utility functions for XAI
function generateSampleShapData(numFeatures = 10, numSamples = 100) {
    const features = Array.from({length: numFeatures}, (_, i) => `Feature_${i + 1}`);
    const data = [];
    
    features.forEach(feature => {
        const shapValues = Array.from({length: numSamples}, () => (Math.random() - 0.5) * 2);
        data.push({
            feature: feature,
            shapValues: shapValues
        });
    });
    
    return data;
}

function updateXAIMetrics() {
    // Update interpretability metrics periodically
    const metrics = {
        shapFeatures: Math.floor(Math.random() * 20) + 10,
        limeSamples: Math.floor(Math.random() * 200) + 50,
        featureCount: Math.floor(Math.random() * 15) + 5,
        transparencyScore: Math.floor(Math.random() * 20) + 75
    };
    
    document.getElementById('shap-features').textContent = metrics.shapFeatures;
    document.getElementById('lime-samples').textContent = metrics.limeSamples;
    document.getElementById('feature-count').textContent = metrics.featureCount;
    document.getElementById('transparency-score').textContent = metrics.transparencyScore + '%';
}

console.log('🔍 XAI Dashboard JavaScript loaded successfully');