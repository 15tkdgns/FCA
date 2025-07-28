// Advanced Visualizations Dashboard JavaScript
// Handles various visualization types including heatmaps and advanced charts

document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Advanced Visualizations Dashboard initializing...');
    
    // Initialize visualization dashboard
    initializeVisualizationDashboard();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial visualizations
    loadAllVisualizations();
});

function initializeVisualizationDashboard() {
    // Set up category switching
    const categoryButtons = document.querySelectorAll('.viz-category-btn');
    const sections = document.querySelectorAll('.visualization-section');
    
    // Show heatmaps section by default
    document.getElementById('heatmaps-section').style.display = 'block';
    document.querySelector('[data-category="heatmaps"]').classList.add('active');
}

function setupEventListeners() {
    // Category switching
    document.querySelectorAll('.viz-category-btn').forEach(button => {
        button.addEventListener('click', function() {
            const category = this.dataset.category;
            switchVisualizationCategory(category);
            
            // Update active button
            document.querySelectorAll('.viz-category-btn').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Control panel listeners
    document.getElementById('dataset-selector').addEventListener('change', updateDataset);
    document.getElementById('color-scheme-selector').addEventListener('change', updateColorScheme);
    document.getElementById('chart-size-selector').addEventListener('change', updateChartSize);
    document.getElementById('animation-toggle').addEventListener('change', toggleAnimation);
}

function switchVisualizationCategory(category) {
    // Hide all sections
    document.querySelectorAll('.visualization-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show selected section
    const targetSection = document.getElementById(`${category}-section`);
    if (targetSection) {
        targetSection.style.display = 'block';
        
        // Load category-specific visualizations
        loadCategoryVisualizations(category);
    }
}

function loadAllVisualizations() {
    console.log('📊 Loading all visualizations...');
    
    // Load heatmaps (default category)
    loadHeatmapVisualizations();
}

function loadCategoryVisualizations(category) {
    switch(category) {
        case 'heatmaps':
            loadHeatmapVisualizations();
            break;
        case 'distributions':
            loadDistributionVisualizations();
            break;
        case 'relationships':
            loadRelationshipVisualizations();
            break;
        case 'hierarchical':
            loadHierarchicalVisualizations();
            break;
        case '3d':
            load3DVisualizations();
            break;
        case 'advanced':
            loadAdvancedVisualizations();
            break;
    }
}

// Heatmap Visualizations
function loadHeatmapVisualizations() {
    console.log('🔥 Loading heatmap visualizations...');
    
    createCorrelationHeatmap();
    createConfusionMatrixHeatmap();
    createPerformanceHeatmap();
    createDensityHeatmap();
}

function createCorrelationHeatmap() {
    // Sample correlation data
    const features = ['Amount', 'Balance', 'Age', 'Frequency', 'Risk_Score', 'Location_Risk'];
    const correlationMatrix = [
        [1.00, 0.45, -0.23, 0.67, 0.89, 0.34],
        [0.45, 1.00, -0.12, 0.34, 0.56, 0.28],
        [-0.23, -0.12, 1.00, -0.45, -0.67, -0.21],
        [0.67, 0.34, -0.45, 1.00, 0.78, 0.43],
        [0.89, 0.56, -0.67, 0.78, 1.00, 0.56],
        [0.34, 0.28, -0.21, 0.43, 0.56, 1.00]
    ];
    
    const trace = {
        z: correlationMatrix,
        x: features,
        y: features,
        type: 'heatmap',
        colorscale: 'RdBu',
        zmid: 0,
        text: correlationMatrix.map(row => row.map(val => val.toFixed(2))),
        texttemplate: '%{text}',
        textfont: {size: 12, color: 'white'},
        hovertemplate: '<b>%{x} vs %{y}</b><br>Correlation: %{z:.3f}<extra></extra>',
        colorbar: {title: 'Correlation', titleside: 'right'}
    };
    
    const layout = {
        title: 'Feature Correlation Heatmap',
        template: 'plotly_white',
        height: 400,
        margin: {l: 80, r: 100, t: 80, b: 80},
        xaxis: {title: 'Features'},
        yaxis: {title: 'Features'}
    };
    
    Plotly.newPlot('correlation-heatmap-chart', [trace], layout, {
        responsive: true,
        displayModeBar: false
    });
}

function createConfusionMatrixHeatmap() {
    // Sample confusion matrix data
    const confusionMatrix = [[850, 45], [32, 73]];
    const labels = ['Normal', 'Fraud'];
    
    // Normalize for display
    const total = confusionMatrix.flat().reduce((a, b) => a + b, 0);
    const normalized = confusionMatrix.map(row => 
        row.map(val => val / total)
    );
    
    const trace = {
        z: normalized,
        x: labels,
        y: labels,
        type: 'heatmap',
        colorscale: 'Blues',
        text: confusionMatrix,
        texttemplate: '%{text}',
        textfont: {size: 16, color: 'white'},
        hovertemplate: '<b>True: %{y}<br>Predicted: %{x}</b><br>Count: %{text}<br>Rate: %{z:.3f}<extra></extra>',
        colorbar: {title: 'Rate', titleside: 'right'}
    };
    
    const layout = {
        title: 'Confusion Matrix Heatmap',
        template: 'plotly_white',
        height: 400,
        width: 400,
        margin: {l: 80, r: 100, t: 80, b: 80},
        xaxis: {title: 'Predicted Label'},
        yaxis: {title: 'True Label'}
    };
    
    Plotly.newPlot('confusion-matrix-chart', [trace], layout, {
        responsive: true,
        displayModeBar: false
    });
}

function createPerformanceHeatmap() {
    // Sample model performance data
    const models = ['Random Forest', 'XGBoost', 'SVM', 'Neural Network', 'Logistic Regression'];
    const metrics = ['Accuracy', 'Precision', 'Recall', 'F1-Score', 'AUC-ROC'];
    const performanceData = [
        [0.94, 0.89, 0.87, 0.91, 0.96], // Accuracy
        [0.88, 0.92, 0.84, 0.87, 0.85], // Precision
        [0.91, 0.86, 0.89, 0.93, 0.88], // Recall
        [0.89, 0.89, 0.86, 0.90, 0.86], // F1-Score
        [0.95, 0.94, 0.88, 0.94, 0.91]  // AUC-ROC
    ];
    
    const trace = {
        z: performanceData,
        x: models,
        y: metrics,
        type: 'heatmap',
        colorscale: 'Viridis',
        text: performanceData.map(row => row.map(val => val.toFixed(3))),
        texttemplate: '%{text}',
        textfont: {size: 10, color: 'white'},
        hovertemplate: '<b>Model: %{x}<br>Metric: %{y}</b><br>Score: %{z:.3f}<extra></extra>',
        colorbar: {title: 'Score', titleside: 'right'}
    };
    
    const layout = {
        title: 'Model Performance Heatmap',
        template: 'plotly_white',
        height: 400,
        margin: {l: 80, r: 100, t: 80, b: 120},
        xaxis: {title: 'Models', tickangle: 45},
        yaxis: {title: 'Metrics'}
    };
    
    Plotly.newPlot('performance-heatmap-chart', [trace], layout, {
        responsive: true,
        displayModeBar: false
    });
}

function createDensityHeatmap() {
    // Generate sample 2D density data
    const x = Array.from({length: 100}, () => Math.random() * 10 + Math.random() * 5);
    const y = Array.from({length: 100}, () => Math.random() * 8 + Math.random() * 3);
    
    const trace = {
        x: x,
        y: y,
        type: 'histogram2d',
        colorscale: 'Hot',
        nbinsx: 15,
        nbinsy: 15,
        hovertemplate: '<b>X: %{x:.2f}<br>Y: %{y:.2f}</b><br>Count: %{z}<extra></extra>',
        colorbar: {title: 'Count', titleside: 'right'}
    };
    
    const layout = {
        title: '2D Density Heatmap',
        template: 'plotly_white',
        height: 400,
        margin: {l: 60, r: 100, t: 80, b: 60},
        xaxis: {title: 'Feature X'},
        yaxis: {title: 'Feature Y'}
    };
    
    Plotly.newPlot('density-heatmap-chart', [trace], layout, {
        responsive: true,
        displayModeBar: false
    });
}

// Distribution Visualizations
function loadDistributionVisualizations() {
    console.log('📈 Loading distribution visualizations...');
    
    createViolinPlot();
    createBoxPlot();
    createRidgelinePlot();
    createFeatureDistributionHeatmap();
}

function createViolinPlot() {
    // Sample data for violin plot
    const categories = ['Group A', 'Group B', 'Group C'];
    const data = [];
    
    categories.forEach(category => {
        const values = Array.from({length: 100}, () => 
            Math.random() * 20 + Math.sin(Math.random() * 10) * 5 + 15
        );
        
        data.push({
            type: 'violin',
            y: values,
            name: category,
            box: {visible: true},
            meanline: {visible: true},
            fillcolor: ['#2563eb', '#059669', '#d97706'][categories.indexOf(category)],
            opacity: 0.6
        });
    });
    
    const layout = {
        title: 'Violin Plot - Data Distribution by Category',
        template: 'plotly_white',
        height: 400,
        yaxis: {title: 'Values'},
        showlegend: true
    };
    
    Plotly.newPlot('violin-plot-chart', data, layout, {
        responsive: true,
        displayModeBar: false
    });
}

function createBoxPlot() {
    // Sample data for box plot
    const categories = ['Low Risk', 'Medium Risk', 'High Risk'];
    const data = [];
    
    categories.forEach((category, idx) => {
        const values = Array.from({length: 50}, () => 
            Math.random() * 30 + idx * 20 + Math.random() * 10
        );
        
        data.push({
            type: 'box',
            y: values,
            name: category,
            marker: {color: ['#059669', '#d97706', '#dc2626'][idx]},
            boxpoints: 'outliers'
        });
    });
    
    const layout = {
        title: 'Box Plot - Risk Score Distribution',
        template: 'plotly_white',
        height: 400,
        yaxis: {title: 'Risk Score'},
        showlegend: true
    };
    
    Plotly.newPlot('box-plot-chart', data, layout, {
        responsive: true,
        displayModeBar: false
    });
}

function createRidgelinePlot() {
    // Sample ridgeline plot (using violin plots oriented horizontally)
    const categories = ['Category 1', 'Category 2', 'Category 3', 'Category 4'];
    const data = [];
    
    categories.forEach((category, idx) => {
        const values = Array.from({length: 100}, () => 
            Math.random() * 15 + Math.sin(idx) * 3 + idx * 5
        );
        
        data.push({
            type: 'violin',
            x: values,
            y: Array(100).fill(category),
            name: category,
            orientation: 'h',
            side: 'positive',
            fillcolor: `hsl(${idx * 90}, 70%, 60%)`,
            opacity: 0.7,
            line: {color: `hsl(${idx * 90}, 70%, 40%)`},
            showlegend: false
        });
    });
    
    const layout = {
        title: 'Ridgeline Plot - Distribution Comparison',
        template: 'plotly_white',
        height: 400,
        xaxis: {title: 'Values'},
        yaxis: {title: 'Categories'}
    };
    
    Plotly.newPlot('ridgeline-plot-chart', data, layout, {
        responsive: true,
        displayModeBar: false
    });
}

function createFeatureDistributionHeatmap() {
    // Sample feature distribution data
    const features = ['Amount', 'Balance', 'Age', 'Frequency', 'Score'];
    const bins = 15;
    const data = [];
    
    features.forEach(feature => {
        const distribution = Array.from({length: bins}, (_, i) => 
            Math.exp(-(Math.pow(i - bins/2, 2)) / (2 * Math.pow(bins/6, 2))) * 100 + Math.random() * 20
        );
        data.push(distribution);
    });
    
    const binCenters = Array.from({length: bins}, (_, i) => i);
    
    const trace = {
        z: data,
        x: binCenters,
        y: features,
        type: 'heatmap',
        colorscale: 'Hot',
        hovertemplate: '<b>Feature: %{y}<br>Bin: %{x}</b><br>Count: %{z:.0f}<extra></extra>',
        colorbar: {title: 'Count', titleside: 'right'}
    };
    
    const layout = {
        title: 'Feature Distribution Heatmap',
        template: 'plotly_white',
        height: 400,
        margin: {l: 80, r: 100, t: 80, b: 60},
        xaxis: {title: 'Value Bins'},
        yaxis: {title: 'Features'}
    };
    
    Plotly.newPlot('feature-distribution-chart', [trace], layout, {
        responsive: true,
        displayModeBar: false
    });
}

// Relationship Visualizations
function loadRelationshipVisualizations() {
    console.log('🔗 Loading relationship visualizations...');
    
    createScatterPlotMatrix();
    createParallelCoordinates();
}

function createScatterPlotMatrix() {
    // Generate sample data for scatter plot matrix
    const n = 200;
    const features = ['Feature A', 'Feature B', 'Feature C', 'Feature D'];
    
    // Generate correlated data
    const data = [];
    for (let i = 0; i < n; i++) {
        const base = Math.random();
        data.push({
            'Feature A': base + Math.random() * 0.3,
            'Feature B': base * 0.8 + Math.random() * 0.4,
            'Feature C': (1 - base) * 0.6 + Math.random() * 0.3,
            'Feature D': Math.random(),
            'Category': Math.random() > 0.5 ? 'Type 1' : 'Type 2'
        });
    }
    
    const traces = [];
    
    // Create scatter matrix
    for (let i = 0; i < features.length; i++) {
        for (let j = 0; j < features.length; j++) {
            if (i !== j) {
                const trace = {
                    x: data.map(d => d[features[j]]),
                    y: data.map(d => d[features[i]]),
                    mode: 'markers',
                    type: 'scatter',
                    marker: {
                        size: 4,
                        color: data.map(d => d.Category === 'Type 1' ? '#2563eb' : '#dc2626'),
                        opacity: 0.6
                    },
                    showlegend: false,
                    xaxis: `x${j + 1}`,
                    yaxis: `y${i + 1}`,
                    hovertemplate: `<b>${features[j]}: %{x:.3f}<br>${features[i]}: %{y:.3f}</b><extra></extra>`
                };
                traces.push(trace);
            }
        }
    }
    
    // Create subplot layout
    const layout = {
        title: 'Scatter Plot Matrix',
        template: 'plotly_white',
        height: 500,
        width: 500,
        grid: {rows: features.length, columns: features.length, pattern: 'independent'},
        showlegend: false
    };
    
    // Set axis properties
    for (let i = 0; i < features.length; i++) {
        for (let j = 0; j < features.length; j++) {
            const xaxis = `xaxis${i * features.length + j + 1}`;
            const yaxis = `yaxis${i * features.length + j + 1}`;
            
            layout[xaxis] = {title: j === features.length - 1 ? features[j] : ''};
            layout[yaxis] = {title: j === 0 ? features[i] : ''};
        }
    }
    
    Plotly.newPlot('scatter-matrix-chart', traces, layout, {
        responsive: true,
        displayModeBar: false
    });
}

function createParallelCoordinates() {
    // Sample data for parallel coordinates
    const n = 100;
    const data = [];
    
    for (let i = 0; i < n; i++) {
        const type = Math.random() > 0.6 ? 'High Risk' : 'Low Risk';
        const multiplier = type === 'High Risk' ? 1.5 : 0.8;
        
        data.push({
            'Transaction Amount': Math.random() * 1000 * multiplier,
            'Account Balance': Math.random() * 5000 * (2 - multiplier),
            'Customer Age': 25 + Math.random() * 40,
            'Transaction Frequency': Math.random() * 50 * multiplier,
            'Risk Score': Math.random() * 100 * multiplier,
            'Category': type
        });
    }
    
    const dimensions = [
        {
            label: 'Transaction Amount',
            values: data.map(d => d['Transaction Amount']),
            range: [0, Math.max(...data.map(d => d['Transaction Amount']))]
        },
        {
            label: 'Account Balance',
            values: data.map(d => d['Account Balance']),
            range: [0, Math.max(...data.map(d => d['Account Balance']))]
        },
        {
            label: 'Customer Age',
            values: data.map(d => d['Customer Age']),
            range: [25, 65]
        },
        {
            label: 'Transaction Frequency',
            values: data.map(d => d['Transaction Frequency']),
            range: [0, Math.max(...data.map(d => d['Transaction Frequency']))]
        },
        {
            label: 'Risk Score',
            values: data.map(d => d['Risk Score']),
            range: [0, 100]
        }
    ];
    
    const trace = {
        type: 'parcoords',
        dimensions: dimensions,
        line: {
            color: data.map(d => d['Risk Score']),
            colorscale: 'Viridis',
            showscale: true,
            colorbar: {title: 'Risk Score'}
        }
    };
    
    const layout = {
        title: 'Parallel Coordinates Plot',
        template: 'plotly_white',
        height: 400,
        margin: {l: 100, r: 100, t: 80, b: 60}
    };
    
    Plotly.newPlot('parallel-coordinates-chart', [trace], layout, {
        responsive: true,
        displayModeBar: false
    });
}

// Hierarchical Visualizations
function loadHierarchicalVisualizations() {
    console.log('🌳 Loading hierarchical visualizations...');
    
    createSunburstChart();
    createTreemapChart();
}

function createSunburstChart() {
    // Sample hierarchical data
    const trace = {
        type: 'sunburst',
        labels: ['Root', 'Finance', 'Technology', 'Healthcare', 'Banking', 'Insurance', 'Software', 'Hardware', 'Hospitals', 'Pharma'],
        parents: ['', 'Root', 'Root', 'Root', 'Finance', 'Finance', 'Technology', 'Technology', 'Healthcare', 'Healthcare'],
        values: [100, 40, 35, 25, 25, 15, 20, 15, 15, 10],
        branchvalues: 'total',
        hovertemplate: '<b>%{label}</b><br>Value: %{value}<br>Percent: %{percentParent}<extra></extra>',
        maxdepth: 3
    };
    
    const layout = {
        title: 'Sunburst Chart - Hierarchical Data',
        template: 'plotly_white',
        height: 450,
        margin: {l: 20, r: 20, t: 80, b: 20}
    };
    
    Plotly.newPlot('sunburst-chart', [trace], layout, {
        responsive: true,
        displayModeBar: false
    });
}

function createTreemapChart() {
    // Sample treemap data
    const trace = {
        type: 'treemap',
        labels: ['Total', 'Fraud Cases', 'Normal Cases', 'High Risk Fraud', 'Medium Risk Fraud', 'Low Risk Fraud', 'Verified Normal', 'Pending Normal'],
        parents: ['', 'Total', 'Total', 'Fraud Cases', 'Fraud Cases', 'Fraud Cases', 'Normal Cases', 'Normal Cases'],
        values: [1000, 150, 850, 80, 45, 25, 700, 150],
        textinfo: 'label+value+percent parent',
        hovertemplate: '<b>%{label}</b><br>Value: %{value}<br>Percent: %{percentParent}<extra></extra>',
        colorscale: 'RdYlBu'
    };
    
    const layout = {
        title: 'Treemap Chart - Transaction Categories',
        template: 'plotly_white',
        height: 450,
        margin: {l: 20, r: 20, t: 80, b: 20}
    };
    
    Plotly.newPlot('treemap-chart', [trace], layout, {
        responsive: true,
        displayModeBar: false
    });
}

// 3D Visualizations
function load3DVisualizations() {
    console.log('🎯 Loading 3D visualizations...');
    
    create3DScatterPlot();
}

function create3DScatterPlot() {
    // Generate sample 3D data
    const n = 200;
    const data = [];
    
    for (let i = 0; i < n; i++) {
        const category = Math.random() > 0.5 ? 'Fraud' : 'Normal';
        const fraud_factor = category === 'Fraud' ? 1.5 : 0.7;
        
        data.push({
            x: Math.random() * 100 * fraud_factor,
            y: Math.random() * 50 + Math.random() * 30,
            z: Math.random() * 80 * fraud_factor,
            category: category,
            size: Math.random() * 10 + 5
        });
    }
    
    const fraudData = data.filter(d => d.category === 'Fraud');
    const normalData = data.filter(d => d.category === 'Normal');
    
    const traces = [
        {
            x: fraudData.map(d => d.x),
            y: fraudData.map(d => d.y),
            z: fraudData.map(d => d.z),
            mode: 'markers',
            type: 'scatter3d',
            name: 'Fraud',
            marker: {
                size: fraudData.map(d => d.size),
                color: '#dc2626',
                opacity: 0.7
            },
            hovertemplate: '<b>Fraud Transaction</b><br>X: %{x:.2f}<br>Y: %{y:.2f}<br>Z: %{z:.2f}<extra></extra>'
        },
        {
            x: normalData.map(d => d.x),
            y: normalData.map(d => d.y),
            z: normalData.map(d => d.z),
            mode: 'markers',
            type: 'scatter3d',
            name: 'Normal',
            marker: {
                size: normalData.map(d => d.size),
                color: '#2563eb',
                opacity: 0.7
            },
            hovertemplate: '<b>Normal Transaction</b><br>X: %{x:.2f}<br>Y: %{y:.2f}<br>Z: %{z:.2f}<extra></extra>'
        }
    ];
    
    const layout = {
        title: '3D Scatter Plot - Transaction Analysis',
        template: 'plotly_white',
        height: 600,
        scene: {
            xaxis: {title: 'Transaction Amount'},
            yaxis: {title: 'Account Age'},
            zaxis: {title: 'Risk Score'}
        },
        showlegend: true
    };
    
    Plotly.newPlot('3d-scatter-chart', traces, layout, {
        responsive: true,
        displayModeBar: false
    });
}

// Advanced Visualizations
function loadAdvancedVisualizations() {
    console.log('⚡ Loading advanced visualizations...');
    
    createTimeSeriesHeatmap();
}

function createTimeSeriesHeatmap() {
    // Generate sample time series data
    const hours = Array.from({length: 24}, (_, i) => i);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = [];
    
    days.forEach(day => {
        const dayData = hours.map(hour => {
            // Simulate transaction patterns (higher during business hours, weekends different)
            let base = Math.sin((hour - 12) * Math.PI / 12) * 30 + 50;
            if (day === 'Sat' || day === 'Sun') {
                base *= 0.7; // Lower weekend activity
            }
            return Math.max(0, base + Math.random() * 20);
        });
        data.push(dayData);
    });
    
    const trace = {
        z: data,
        x: hours,
        y: days,
        type: 'heatmap',
        colorscale: 'Plasma',
        hovertemplate: '<b>Day: %{y}<br>Hour: %{x}:00</b><br>Activity: %{z:.0f}<extra></extra>',
        colorbar: {title: 'Activity Level', titleside: 'right'}
    };
    
    const layout = {
        title: 'Time Series Heatmap - Daily Activity Patterns',
        template: 'plotly_white',
        height: 400,
        margin: {l: 60, r: 100, t: 80, b: 60},
        xaxis: {title: 'Hour of Day'},
        yaxis: {title: 'Day of Week'}
    };
    
    Plotly.newPlot('time-series-heatmap-chart', [trace], layout, {
        responsive: true,
        displayModeBar: false
    });
}

// Control Panel Functions
function updateDataset() {
    const dataset = document.getElementById('dataset-selector').value;
    console.log(`📊 Switching to dataset: ${dataset}`);
    // Reload current category with new dataset
    const activeCategory = document.querySelector('.viz-category-btn.active').dataset.category;
    loadCategoryVisualizations(activeCategory);
}

function updateColorScheme() {
    const colorScheme = document.getElementById('color-scheme-selector').value;
    console.log(`🎨 Updating color scheme to: ${colorScheme}`);
    // Apply new color scheme to current visualizations
    // This would typically involve re-rendering charts with new colors
}

function updateChartSize() {
    const size = document.getElementById('chart-size-selector').value;
    const heights = {
        'small': 300,
        'medium': 400,
        'large': 500
    };
    
    console.log(`📏 Updating chart size to: ${size}`);
    
    // Update all chart containers
    document.querySelectorAll('[id$="-chart"]').forEach(container => {
        const plotlyDiv = container;
        if (plotlyDiv && plotlyDiv.layout) {
            Plotly.relayout(plotlyDiv, {height: heights[size]});
        }
    });
}

function toggleAnimation() {
    const enabled = document.getElementById('animation-toggle').checked;
    console.log(`🎬 Animation ${enabled ? 'enabled' : 'disabled'}`);
    // This would control animation settings for future chart updates
}

console.log('📊 Advanced Visualizations JavaScript loaded successfully');