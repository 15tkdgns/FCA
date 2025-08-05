/**
 * FCA Analysis Dashboard - Performance Charts
 * ==========================================
 * 
 * Contains performance-related chart types including
 * ROC curves, precision-recall, training curves.
 */

class PerformanceCharts {
    constructor() {
        this.defaultConfig = {
            responsive: true,
            displayModeBar: true,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
            displaylogo: false,
            toImageButtonOptions: {
                format: 'png',
                filename: 'fca_performance_chart',
                height: 500,
                width: 700,
                scale: 1
            }
        };
        
        this.defaultLayout = {
            font: {
                family: "'Nunito', sans-serif",
                size: 12
            },
            plot_bgcolor: 'rgba(0,0,0,0)',
            paper_bgcolor: 'rgba(0,0,0,0)',
            margin: { t: 30, r: 30, b: 50, l: 50 }
        };
        
        console.log('📈 PerformanceCharts module initialized');
    }

    /**
     * Render ROC curve with AUC
     */
    renderROCCurve(chartsData, containerId) {
        try {
            const container = document.getElementById(containerId);
            if (!container || !chartsData?.roc_curve) {
                console.warn('⚠️ ROC curve data or container not found');
                return;
            }
            
            const data = chartsData.roc_curve;
            
            const traces = [
                {
                    x: data.fpr,
                    y: data.tpr,
                    type: 'scatter',
                    mode: 'lines',
                    name: `ROC Curve (AUC = ${data.auc.toFixed(3)})`,
                    line: {
                        color: '#4e73df',
                        width: 3
                    },
                    hovertemplate: 'FPR: %{x:.3f}<br>TPR: %{y:.3f}<extra></extra>'
                },
                {
                    x: [0, 1],
                    y: [0, 1],
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Random Classifier',
                    line: {
                        color: '#858796',
                        width: 1,
                        dash: 'dash'
                    },
                    hoverinfo: 'skip'
                }
            ];
            
            const layout = {
                ...this.defaultLayout,
                title: {
                    text: 'ROC Curve Analysis',
                    font: { size: 16, color: '#5a5c69' }
                },
                xaxis: {
                    title: 'False Positive Rate',
                    range: [0, 1]
                },
                yaxis: {
                    title: 'True Positive Rate',
                    range: [0, 1]
                },
                showlegend: true
            };
            
            Plotly.newPlot(container, traces, layout, this.defaultConfig);
            console.log('✅ ROC curve chart rendered');
            
        } catch (error) {
            console.error('❌ ROC curve chart error:', error);
            this.renderErrorChart(containerId, 'ROC Curve');
        }
    }

    /**
     * Render precision-recall curve
     */
    renderPrecisionRecallCurve(chartsData, containerId) {
        try {
            const container = document.getElementById(containerId);
            if (!container || !chartsData?.pr_curve) {
                console.warn('⚠️ PR curve data or container not found');
                return;
            }
            
            const data = chartsData.pr_curve;
            
            const trace = {
                x: data.recall,
                y: data.precision,
                type: 'scatter',
                mode: 'lines',
                name: `PR Curve (AP = ${data.ap.toFixed(3)})`,
                line: {
                    color: '#1cc88a',
                    width: 3
                },
                fill: 'tonexty',
                fillcolor: 'rgba(28, 200, 138, 0.1)',
                hovertemplate: 'Recall: %{x:.3f}<br>Precision: %{y:.3f}<extra></extra>'
            };
            
            const layout = {
                ...this.defaultLayout,
                title: {
                    text: 'Precision-Recall Curve',
                    font: { size: 16, color: '#5a5c69' }
                },
                xaxis: {
                    title: 'Recall',
                    range: [0, 1]
                },
                yaxis: {
                    title: 'Precision',
                    range: [0, 1]
                },
                showlegend: true
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('✅ Precision-Recall curve chart rendered');
            
        } catch (error) {
            console.error('❌ Precision-Recall curve chart error:', error);
            this.renderErrorChart(containerId, 'Precision-Recall Curve');
        }
    }

    /**
     * Render training curves (loss and metrics over epochs)
     */
    renderTrainingCurves(trainingData, containerId) {
        try {
            const container = document.getElementById(containerId);
            if (!container || !trainingData?.epochs) {
                console.warn('⚠️ Training data or container not found');
                return;
            }
            
            const data = trainingData;
            
            const traces = [
                {
                    x: data.epochs,
                    y: data.train_loss,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Training Loss',
                    line: { color: '#e74a3b', width: 2 },
                    marker: { size: 4 },
                    yaxis: 'y'
                },
                {
                    x: data.epochs,
                    y: data.val_loss,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Validation Loss',
                    line: { color: '#f6c23e', width: 2 },
                    marker: { size: 4 },
                    yaxis: 'y'
                },
                {
                    x: data.epochs,
                    y: data.train_accuracy,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Training Accuracy',
                    line: { color: '#1cc88a', width: 2 },
                    marker: { size: 4 },
                    yaxis: 'y2'
                },
                {
                    x: data.epochs,
                    y: data.val_accuracy,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Validation Accuracy',
                    line: { color: '#36b9cc', width: 2 },
                    marker: { size: 4 },
                    yaxis: 'y2'
                }
            ];
            
            const layout = {
                ...this.defaultLayout,
                title: {
                    text: 'Training Progress',
                    font: { size: 16, color: '#5a5c69' }
                },
                xaxis: {
                    title: 'Epoch'
                },
                yaxis: {
                    title: 'Loss',
                    side: 'left',
                    color: '#e74a3b'
                },
                yaxis2: {
                    title: 'Accuracy',
                    side: 'right',
                    overlaying: 'y',
                    color: '#1cc88a',
                    tickformat: '.1%'
                },
                showlegend: true,
                hovermode: 'x unified'
            };
            
            Plotly.newPlot(container, traces, layout, this.defaultConfig);
            console.log('✅ Training curves chart rendered');
            
        } catch (error) {
            console.error('❌ Training curves chart error:', error);
            this.renderErrorChart(containerId, 'Training Curves');
        }
    }

    /**
     * Render confusion matrix heatmap
     */
    renderConfusionMatrix(matrixData, containerId) {
        try {
            const container = document.getElementById(containerId);
            if (!container || !matrixData?.matrix) {
                console.warn('⚠️ Confusion matrix data or container not found');
                return;
            }
            
            const data = matrixData;
            
            const trace = {
                z: data.matrix,
                x: data.labels,
                y: data.labels,
                type: 'heatmap',
                colorscale: 'Blues',
                showscale: true,
                text: data.matrix.map(row => row.map(val => val.toString())),
                texttemplate: '%{text}',
                textfont: { color: 'white', size: 14 },
                hovertemplate: 'Predicted: %{x}<br>Actual: %{y}<br>Count: %{z}<extra></extra>'
            };
            
            const layout = {
                ...this.defaultLayout,
                title: {
                    text: 'Confusion Matrix',
                    font: { size: 16, color: '#5a5c69' }
                },
                xaxis: {
                    title: 'Predicted Label',
                    side: 'bottom'
                },
                yaxis: {
                    title: 'True Label',
                    autorange: 'reversed'
                }
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('✅ Confusion matrix chart rendered');
            
        } catch (error) {
            console.error('❌ Confusion matrix chart error:', error);
            this.renderErrorChart(containerId, 'Confusion Matrix');
        }
    }

    /**
     * Render learning curve (performance vs training set size)
     */
    renderLearningCurve(learningData, containerId) {
        try {
            const container = document.getElementById(containerId);
            if (!container || !learningData?.train_sizes) {
                console.warn('⚠️ Learning curve data or container not found');
                return;
            }
            
            const data = learningData;
            
            const traces = [
                {
                    x: data.train_sizes,
                    y: data.train_scores_mean,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Training Score',
                    line: { color: '#4e73df', width: 2 },
                    marker: { size: 6 },
                    error_y: {
                        type: 'data',
                        array: data.train_scores_std,
                        visible: true,
                        color: '#4e73df'
                    }
                },
                {
                    x: data.train_sizes,
                    y: data.val_scores_mean,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Validation Score',
                    line: { color: '#1cc88a', width: 2 },
                    marker: { size: 6 },
                    error_y: {
                        type: 'data',
                        array: data.val_scores_std,
                        visible: true,
                        color: '#1cc88a'
                    }
                }
            ];
            
            const layout = {
                ...this.defaultLayout,
                title: {
                    text: 'Learning Curve',
                    font: { size: 16, color: '#5a5c69' }
                },
                xaxis: {
                    title: 'Training Set Size'
                },
                yaxis: {
                    title: 'Score',
                    tickformat: '.1%'
                },
                showlegend: true,
                hovermode: 'x unified'
            };
            
            Plotly.newPlot(container, traces, layout, this.defaultConfig);
            console.log('✅ Learning curve chart rendered');
            
        } catch (error) {
            console.error('❌ Learning curve chart error:', error);
            this.renderErrorChart(containerId, 'Learning Curve');
        }
    }

    /**
     * Render validation curve (performance vs hyperparameter)
     */
    renderValidationCurve(validationData, containerId) {
        try {
            const container = document.getElementById(containerId);
            if (!container || !validationData?.param_range) {
                console.warn('⚠️ Validation curve data or container not found');
                return;
            }
            
            const data = validationData;
            
            const traces = [
                {
                    x: data.param_range,
                    y: data.train_scores_mean,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Training Score',
                    line: { color: '#4e73df', width: 2 },
                    marker: { size: 6 },
                    error_y: {
                        type: 'data',
                        array: data.train_scores_std,
                        visible: true,
                        color: '#4e73df'
                    }
                },
                {
                    x: data.param_range,
                    y: data.val_scores_mean,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Validation Score',
                    line: { color: '#1cc88a', width: 2 },
                    marker: { size: 6 },
                    error_y: {
                        type: 'data',
                        array: data.val_scores_std,
                        visible: true,
                        color: '#1cc88a'
                    }
                }
            ];
            
            const layout = {
                ...this.defaultLayout,
                title: {
                    text: `Validation Curve - ${data.param_name}`,
                    font: { size: 16, color: '#5a5c69' }
                },
                xaxis: {
                    title: data.param_name,
                    type: data.param_scale || 'linear'
                },
                yaxis: {
                    title: 'Score',
                    tickformat: '.1%'
                },
                showlegend: true,
                hovermode: 'x unified'
            };
            
            Plotly.newPlot(container, traces, layout, this.defaultConfig);
            console.log('✅ Validation curve chart rendered');
            
        } catch (error) {
            console.error('❌ Validation curve chart error:', error);
            this.renderErrorChart(containerId, 'Validation Curve');
        }
    }

    /**
     * Render error chart fallback
     */
    renderErrorChart(containerId, chartName) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="d-flex justify-content-center align-items-center" style="height: 300px;">
                    <div class="text-center">
                        <div class="error-icon mb-3">
                            <i class="fas fa-chart-area fa-3x text-muted"></i>
                        </div>
                        <h6 class="text-muted mb-2">${chartName} Unavailable</h6>
                        <p class="text-muted small">Performance chart could not be loaded at this time.</p>
                    </div>
                </div>
            `;
        }
    }
}

// Export for use in other modules
window.PerformanceCharts = PerformanceCharts;