// Heatmap Visualization Module
// Handles correlation, confusion matrix, performance, and density heatmaps

window.HeatmapModule = {
    loadAll() {
        console.log('🔥 Loading heatmap visualizations...');
        this.createCorrelationHeatmap();
        this.createConfusionMatrixHeatmap();
        this.createPerformanceHeatmap();
        this.createDensityHeatmap();
    },

    createCorrelationHeatmap() {
        // Check if container exists
        if (!document.getElementById('correlation-heatmap-chart')) {
            console.warn('⚠️ Correlation heatmap container not found');
            return;
        }
        
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
    },

    createConfusionMatrixHeatmap() {
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
    },

    createPerformanceHeatmap() {
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
            hovertemplate: '<b>%{y}</b><br>Model: %{x}<br>Score: %{z:.3f}<extra></extra>',
            colorbar: {title: 'Score', titleside: 'right'}
        };
        
        const layout = {
            title: 'Model Performance Heatmap',
            template: 'plotly_white',
            height: 400,
            margin: {l: 80, r: 100, t: 80, b: 120},
            xaxis: {title: 'Models', tickangle: -45},
            yaxis: {title: 'Metrics'}
        };
        
        Plotly.newPlot('performance-heatmap-chart', [trace], layout, {
            responsive: true,
            displayModeBar: false
        });
    },

    createDensityHeatmap() {
        // Generate sample 2D density data
        const n = 50;
        const x = Array.from({length: n}, (_, i) => i);
        const y = Array.from({length: n}, (_, i) => i);
        const z = [];
        
        for (let i = 0; i < n; i++) {
            const row = [];
            for (let j = 0; j < n; j++) {
                // Create two clusters for demo
                const cluster1 = Math.exp(-((i-15)**2 + (j-15)**2) / 100);
                const cluster2 = Math.exp(-((i-35)**2 + (j-35)**2) / 150);
                row.push(cluster1 + cluster2 + Math.random() * 0.1);
            }
            z.push(row);
        }
        
        const trace = {
            z: z,
            type: 'heatmap',
            colorscale: 'Hot',
            hovertemplate: '<b>X: %{x}<br>Y: %{y}</b><br>Density: %{z:.3f}<extra></extra>',
            colorbar: {title: 'Density', titleside: 'right'}
        };
        
        const layout = {
            title: 'Transaction Density Heatmap',
            template: 'plotly_white',
            height: 400,
            margin: {l: 80, r: 100, t: 80, b: 80},
            xaxis: {title: 'Location X'},
            yaxis: {title: 'Location Y'}
        };
        
        Plotly.newPlot('density-heatmap-chart', [trace], layout, {
            responsive: true,
            displayModeBar: false
        });
    }
};