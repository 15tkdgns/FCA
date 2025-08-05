// FCA Static Web Dashboard - Academic Quality Charts for Research Papers

class AcademicCharts {
    constructor() {
        this.academicLayout = {
            font: { 
                family: 'Times New Roman, serif',
                size: 14
            },
            margin: { l: 80, r: 50, t: 80, b: 80 },
            paper_bgcolor: 'white',
            plot_bgcolor: 'white',
            showlegend: true,
            legend: {
                font: { size: 12 },
                bgcolor: 'rgba(255,255,255,0.8)',
                bordercolor: '#333',
                borderwidth: 1
            }
        };

        this.academicColors = {
            primary: '#2E86AB',
            secondary: '#A23B72',
            accent: '#F18F01',
            success: '#C73E1D',
            info: '#7209B7',
            warning: '#F45B69',
            dark: '#2F3737',
            light: '#F2F2F2'
        };
    }

    // Create learning curves for overfitting analysis
    createLearningCurves(containerId, modelData) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const data = modelData.learning_curves;
        
        const traces = [
            {
                x: data.train_sizes,
                y: data.train_scores,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Training Score',
                line: { 
                    color: this.academicColors.primary, 
                    width: 3,
                    dash: 'solid'
                },
                marker: { 
                    size: 8, 
                    color: this.academicColors.primary,
                    symbol: 'circle'
                },
                error_y: {
                    type: 'constant',
                    value: 0.01,
                    visible: true,
                    color: this.academicColors.primary
                }
            },
            {
                x: data.train_sizes,
                y: data.val_scores,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Validation Score',
                line: { 
                    color: this.academicColors.secondary, 
                    width: 3,
                    dash: 'dash'
                },
                marker: { 
                    size: 8, 
                    color: this.academicColors.secondary,
                    symbol: 'square'
                },
                error_y: {
                    type: 'constant',
                    value: 0.015,
                    visible: true,
                    color: this.academicColors.secondary
                }
            },
            {
                x: data.train_sizes,
                y: data.gap_trend,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Overfitting Gap',
                line: { 
                    color: this.academicColors.warning, 
                    width: 2,
                    dash: 'dot'
                },
                marker: { 
                    size: 6, 
                    color: this.academicColors.warning,
                    symbol: 'triangle-up'
                },
                yaxis: 'y2'
            }
        ];

        const layout = {
            ...this.academicLayout,
            title: {
                text: 'Learning Curves and Overfitting Analysis',
                font: { size: 16, color: '#333' },
                x: 0.5
            },
            xaxis: { 
                title: 'Training Set Size (Fraction)',
                titlefont: { size: 14 },
                tickfont: { size: 12 },
                gridcolor: '#E5E5E5',
                gridwidth: 1,
                range: [0, 1.05]
            },
            yaxis: { 
                title: 'Model Accuracy',
                titlefont: { size: 14 },
                tickfont: { size: 12 },
                gridcolor: '#E5E5E5',
                gridwidth: 1,
                range: [0.85, 1.0]
            },
            yaxis2: {
                title: 'Overfitting Gap',
                titlefont: { size: 14, color: this.academicColors.warning },
                tickfont: { size: 12, color: this.academicColors.warning },
                overlaying: 'y',
                side: 'right',
                range: [0, 0.03]
            },
            annotations: [
                {
                    x: 0.6,
                    y: 0.02,
                    xref: 'x',
                    yref: 'y2',
                    text: 'Overfitting\nThreshold',
                    showarrow: true,
                    arrowhead: 2,
                    arrowcolor: this.academicColors.warning,
                    font: { size: 10 }
                }
            ],
            height: 500
        };

        Plotly.newPlot(container, traces, layout, { responsive: true });
    }

    // Create regularization path visualization
    createRegularizationPath(containerId, regulData) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const traces = [
            {
                x: regulData.alpha_values,
                y: regulData.train_scores,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Training Score',
                line: { color: this.academicColors.primary, width: 3 },
                marker: { size: 8, color: this.academicColors.primary }
            },
            {
                x: regulData.alpha_values,
                y: regulData.val_scores,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Validation Score',
                line: { color: this.academicColors.secondary, width: 3 },
                marker: { size: 8, color: this.academicColors.secondary }
            }
        ];

        // Add sparsity if available
        if (regulData.feature_sparsity) {
            traces.push({
                x: regulData.alpha_values,
                y: regulData.feature_sparsity,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Active Features',
                line: { color: this.academicColors.accent, width: 2 },
                marker: { size: 6, color: this.academicColors.accent },
                yaxis: 'y2'
            });
        }

        const layout = {
            ...this.academicLayout,
            title: {
                text: 'Regularization Path Analysis (L1 Regularization)',
                font: { size: 16, color: '#333' },
                x: 0.5
            },
            xaxis: { 
                title: 'Regularization Strength (α)',
                type: 'log',
                titlefont: { size: 14 },
                tickfont: { size: 12 },
                gridcolor: '#E5E5E5'
            },
            yaxis: { 
                title: 'Model Performance',
                titlefont: { size: 14 },
                tickfont: { size: 12 },
                gridcolor: '#E5E5E5'
            },
            yaxis2: regulData.feature_sparsity ? {
                title: 'Number of Active Features',
                titlefont: { size: 14, color: this.academicColors.accent },
                tickfont: { size: 12, color: this.academicColors.accent },
                overlaying: 'y',
                side: 'right'
            } : undefined,
            height: 450
        };

        Plotly.newPlot(container, traces, layout, { responsive: true });
    }

    // Create SHAP waterfall plot
    createSHAPWaterfall(containerId, shapData) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const example = shapData.local_examples[0];
        const features = Object.keys(example.shap_values);
        const values = Object.values(example.shap_values);
        
        // Calculate cumulative values for waterfall
        let cumulative = [example.base_value];
        for (let i = 0; i < values.length; i++) {
            cumulative.push(cumulative[cumulative.length - 1] + values[i]);
        }

        const colors = values.map(v => v > 0 ? this.academicColors.success : this.academicColors.warning);

        const trace = {
            x: ['Base Value', ...features, 'Prediction'],
            y: [example.base_value, ...values, example.prediction],
            type: 'waterfall',
            orientation: 'v',
            measure: ['absolute', ...values.map(() => 'relative'), 'total'],
            text: [
                example.base_value.toFixed(3),
                ...values.map(v => (v >= 0 ? '+' : '') + v.toFixed(3)),
                example.prediction.toFixed(3)
            ],
            textposition: 'outside',
            connector: {
                line: { color: '#333', width: 2 }
            },
            increasing: { marker: { color: this.academicColors.success } },
            decreasing: { marker: { color: this.academicColors.warning } },
            totals: { marker: { color: this.academicColors.dark } }
        };

        const layout = {
            ...this.academicLayout,
            title: {
                text: 'SHAP Waterfall Plot - Local Feature Contributions',
                font: { size: 16, color: '#333' },
                x: 0.5
            },
            xaxis: { 
                title: 'Features',
                titlefont: { size: 14 },
                tickfont: { size: 11 },
                tickangle: -45
            },
            yaxis: { 
                title: 'SHAP Value Contribution',
                titlefont: { size: 14 },
                tickfont: { size: 12 },
                gridcolor: '#E5E5E5'
            },
            height: 500,
            annotations: [
                {
                    x: 0.02,
                    y: 0.98,
                    xref: 'paper',
                    yref: 'paper',
                    text: `True Label: ${example.true_label === 1 ? 'Fraud' : 'Normal'}`,
                    showarrow: false,
                    font: { size: 12, color: '#666' },
                    bgcolor: 'rgba(255,255,255,0.8)',
                    bordercolor: '#ccc',
                    borderwidth: 1
                }
            ]
        };

        Plotly.newPlot(container, traces, layout, { responsive: true });
    }

    // Create feature importance comparison across models
    createFeatureImportanceComparison(containerId, importanceData) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const models = Object.keys(importanceData);
        const features = importanceData[models[0]].feature_importance.slice(0, 8).map(f => f.feature);
        
        const traces = models.map((model, idx) => ({
            x: features,
            y: importanceData[model].feature_importance.slice(0, 8).map(f => f.importance),
            type: 'bar',
            name: model.replace('_', ' ').toUpperCase(),
            marker: { 
                color: Object.values(this.academicColors)[idx % Object.values(this.academicColors).length],
                line: { color: '#333', width: 1 }
            },
            text: importanceData[model].feature_importance.slice(0, 8).map(f => f.importance.toFixed(3)),
            textposition: 'auto',
            textfont: { size: 10 }
        }));

        const layout = {
            ...this.academicLayout,
            title: {
                text: 'Permutation Feature Importance Comparison',
                font: { size: 16, color: '#333' },
                x: 0.5
            },
            xaxis: { 
                title: 'Features',
                titlefont: { size: 14 },
                tickfont: { size: 11 },
                tickangle: -45
            },
            yaxis: { 
                title: 'Importance Score (Accuracy Drop)',
                titlefont: { size: 14 },
                tickfont: { size: 12 },
                gridcolor: '#E5E5E5'
            },
            barmode: 'group',
            height: 500
        };

        Plotly.newPlot(container, traces, layout, { responsive: true });
    }

    // Create bias and fairness analysis
    createFairnessAnalysis(containerId, biasData) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const models = Object.keys(biasData);
        const fairnessMetrics = [];

        models.forEach(model => {
            if (biasData[model].demographic_parity) {
                const dp = biasData[model].demographic_parity;
                fairnessMetrics.push({
                    model: model,
                    metric: 'Demographic Parity',
                    value: dp.max_difference,
                    threshold: dp.fairness_threshold,
                    is_fair: dp.is_fair
                });
            }
            if (biasData[model].equalized_odds) {
                const eo = biasData[model].equalized_odds;
                fairnessMetrics.push({
                    model: model,
                    metric: 'Equalized Odds (TPR)',
                    value: eo.tpr_difference,
                    threshold: 0.05,
                    is_fair: eo.is_fair
                });
            }
        });

        const trace1 = {
            x: fairnessMetrics.map(f => f.model + '\n' + f.metric),
            y: fairnessMetrics.map(f => f.value),
            type: 'bar',
            name: 'Bias Score',
            marker: { 
                color: fairnessMetrics.map(f => f.is_fair ? this.academicColors.success : this.academicColors.warning),
                line: { color: '#333', width: 1 }
            },
            text: fairnessMetrics.map(f => f.value.toFixed(3)),
            textposition: 'auto'
        };

        const trace2 = {
            x: fairnessMetrics.map(f => f.model + '\n' + f.metric),
            y: fairnessMetrics.map(f => f.threshold),
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Fairness Threshold',
            line: { color: this.academicColors.dark, width: 2, dash: 'dash' },
            marker: { size: 8, color: this.academicColors.dark }
        };

        const layout = {
            ...this.academicLayout,
            title: {
                text: 'Algorithmic Fairness and Bias Analysis',
                font: { size: 16, color: '#333' },
                x: 0.5
            },
            xaxis: { 
                title: 'Model and Fairness Metric',
                titlefont: { size: 14 },
                tickfont: { size: 10 },
                tickangle: -45
            },
            yaxis: { 
                title: 'Bias Score (Lower is Better)',
                titlefont: { size: 14 },
                tickfont: { size: 12 },
                gridcolor: '#E5E5E5'
            },
            height: 450,
            annotations: [
                {
                    x: 0.02,
                    y: 0.98,
                    xref: 'paper',
                    yref: 'paper',
                    text: 'Green: Fair | Orange: Biased',
                    showarrow: false,
                    font: { size: 11, color: '#666' },
                    bgcolor: 'rgba(255,255,255,0.8)',
                    bordercolor: '#ccc',
                    borderwidth: 1
                }
            ]
        };

        Plotly.newPlot(container, [trace1, trace2], layout, { responsive: true });
    }

    // Create uncertainty quantification plot
    createUncertaintyPlot(containerId, uncertaintyData) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const models = Object.keys(uncertaintyData);
        const confidenceLevels = [68, 95, 99];

        const traces = [];

        models.forEach((model, modelIdx) => {
            const data = uncertaintyData[model];
            
            confidenceLevels.forEach((conf, confIdx) => {
                const interval = data.prediction_intervals.find(p => p.confidence === conf/100);
                
                traces.push({
                    x: [model],
                    y: [(interval.upper + interval.lower) / 2],
                    error_y: {
                        type: 'data',
                        symmetric: false,
                        array: [(interval.upper - interval.lower) / 2],
                        arrayminus: [(interval.upper - interval.lower) / 2],
                        color: Object.values(this.academicColors)[confIdx],
                        thickness: 3,
                        width: 10
                    },
                    type: 'scatter',
                    mode: 'markers',
                    name: `${conf}% CI`,
                    marker: { 
                        size: 12, 
                        color: Object.values(this.academicColors)[confIdx],
                        symbol: 'circle'
                    },
                    showlegend: modelIdx === 0
                });
            });
        });

        const layout = {
            ...this.academicLayout,
            title: {
                text: 'Prediction Uncertainty Quantification',
                font: { size: 16, color: '#333' },
                x: 0.5
            },
            xaxis: { 
                title: 'Models',
                titlefont: { size: 14 },
                tickfont: { size: 12 }
            },
            yaxis: { 
                title: 'Prediction Confidence Intervals',
                titlefont: { size: 14 },
                tickfont: { size: 12 },
                gridcolor: '#E5E5E5',
                range: [0.7, 1.0]
            },
            height: 450
        };

        Plotly.newPlot(container, traces, layout, { responsive: true });
    }

    // Create correlation heatmap for feature analysis
    createCorrelationHeatmap(containerId, correlationMatrix) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const features = correlationMatrix.features;
        const correlations = correlationMatrix.matrix;

        const trace = {
            z: correlations,
            x: features,
            y: features,
            type: 'heatmap',
            colorscale: [
                [0, this.academicColors.warning],
                [0.5, 'white'],
                [1, this.academicColors.primary]
            ],
            showscale: true,
            colorbar: {
                title: 'Correlation Coefficient',
                titlefont: { size: 12 },
                tickfont: { size: 11 }
            },
            text: correlations.map(row => 
                row.map(val => val.toFixed(2))
            ),
            texttemplate: '%{text}',
            textfont: { size: 10 }
        };

        const layout = {
            ...this.academicLayout,
            title: {
                text: 'Feature Correlation Matrix',
                font: { size: 16, color: '#333' },
                x: 0.5
            },
            xaxis: { 
                title: 'Features',
                titlefont: { size: 14 },
                tickfont: { size: 10 },
                tickangle: -45,
                side: 'bottom'
            },
            yaxis: { 
                title: 'Features',
                titlefont: { size: 14 },
                tickfont: { size: 10 },
                autorange: 'reversed'
            },
            height: 600,
            width: 600
        };

        Plotly.newPlot(container, [trace], layout, { responsive: true });
    }

    // Export chart as publication-ready image
    exportChart(containerId, filename, format = 'png', width = 800, height = 600) {
        const container = document.getElementById(containerId);
        if (!container) return;

        Plotly.toImage(container, {
            format: format,
            width: width,
            height: height,
            scale: 2 // High resolution for publications
        }).then(function(dataURL) {
            const link = document.createElement('a');
            link.download = `${filename}.${format}`;
            link.href = dataURL;
            link.click();
        });
    }

    // Initialize academic charts
    init() {
        console.log('✅ Academic Charts system initialized');
    }
}

// Initialize academic charts system
window.AcademicCharts = new AcademicCharts();
window.AcademicCharts.init();