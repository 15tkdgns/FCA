/**
 * FCA Analysis Dashboard - Charts JavaScript
 * ==========================================
 * 
 * Chart rendering functionality using Plotly.js
 * for interactive data visualizations.
 */

class FCACharts {
    constructor() {
        this.defaultConfig = {
            responsive: true,
            displayModeBar: true,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
            displaylogo: false,
            toImageButtonOptions: {
                format: 'png',
                filename: 'fca_chart',
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
        
        console.log('📈 FCACharts initialized');
    }
    
    /**
     * Render model performance comparison bar chart
     */
    renderModelComparison(chartsData) {
        try {
            const container = document.getElementById('model-performance-chart');
            if (!container || !chartsData?.model_comparison) {
                console.warn('⚠️ Model comparison data or container not found');
                return;
            }
            
            const data = chartsData.model_comparison;
            
            const trace = {
                x: data.labels,
                y: data.datasets[0].data,
                type: 'bar',
                marker: {
                    color: ['#e74a3b', '#36b9cc', '#f6c23e'],
                    opacity: 0.8,
                    line: {
                        color: ['#c0392b', '#2c9faf', '#e6ac00'],
                        width: 2
                    }
                },
                text: data.datasets[0].data.map(val => `${(val * 100).toFixed(1)}%`),
                textposition: 'auto',
                hovertemplate: '<b>%{x}</b><br>Performance: %{text}<extra></extra>'
            };
            
            const layout = {
                ...this.defaultLayout,
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
                    range: [0, 1]
                }
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('✅ Model comparison chart rendered');
            
        } catch (error) {
            console.error('❌ Model comparison chart error:', error);
            this.renderErrorChart('model-performance-chart', 'Model Performance');
        }
    }
    
    /**
     * Render fraud risk distribution pie chart
     */
    renderFraudDistribution(chartsData) {
        try {
            console.log('🔍 Rendering fraud distribution with data:', chartsData);
            
            const container = document.getElementById('fraud-risk-chart') || 
                             document.getElementById('fraud-risk-detail-chart');
            
            if (!container) {
                console.error('❌ Fraud distribution chart container not found');
                console.log('Available containers:', 
                    document.getElementById('fraud-risk-chart') ? 'fraud-risk-chart found' : 'fraud-risk-chart missing',
                    document.getElementById('fraud-risk-detail-chart') ? 'fraud-risk-detail-chart found' : 'fraud-risk-detail-chart missing'
                );
                return;
            }
            
            console.log('✅ Container found:', container.id);
            
            if (!chartsData?.fraud_distribution) {
                console.error('❌ Fraud distribution data missing from chartsData');
                console.log('Available data keys:', Object.keys(chartsData || {}));
                return;
            }
            
            const data = chartsData.fraud_distribution;
            console.log('📊 Using fraud distribution data:', data);
            
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
                hovertemplate: '<b>%{label}</b><br>Cases: %{value:,}<br>Percentage: %{percent}<extra></extra>',
                pull: data.data.map(() => 0)
            };
            
            const layout = {
                ...this.defaultLayout,
                showlegend: true,
                legend: {
                    orientation: 'v',
                    x: 1.05,
                    y: 0.5,
                    xanchor: 'left',
                    yanchor: 'middle'
                },
                margin: { t: 20, r: 100, b: 20, l: 20 },
                autosize: true
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('✅ Fraud distribution chart rendered');
            
        } catch (error) {
            console.error('❌ Fraud distribution chart error:', error);
            this.renderErrorChart('fraud-risk-chart', 'Fraud Distribution');
        }
    }
    
    /**
     * Render sentiment distribution pie chart
     */
    renderSentimentDistribution(chartsData) {
        try {
            const container = document.getElementById('sentiment-distribution-chart') || 
                             document.getElementById('sentiment-distribution-detail-chart');
            if (!container) {
                console.warn('⚠️ Sentiment distribution chart container not found');
                return;
            }
            
            console.log('Sentiment data received:', chartsData);
            
            let data;
            if (chartsData?.sentiment_distribution) {
                data = chartsData.sentiment_distribution;
            } else {
                // Fallback data
                data = {
                    labels: ['Positive', 'Neutral', 'Negative'],
                    data: [0.27, 0.606, 0.124],
                    backgroundColor: ['#4CAF50', '#9E9E9E', '#F44336']
                };
                console.log('Using fallback sentiment distribution data');
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
                hovertemplate: '<b>%{label}</b><br>Proportion: %{percent}<extra></extra>',
                pull: data.data.map(() => 0)
            };
            
            const layout = {
                ...this.defaultLayout,
                showlegend: true,
                legend: {
                    orientation: 'v',
                    x: 1.05,
                    y: 0.5,
                    xanchor: 'left',
                    yanchor: 'middle'
                },
                margin: { t: 20, r: 100, b: 20, l: 20 },
                autosize: true
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('✅ Sentiment distribution chart rendered');
            
        } catch (error) {
            console.error('❌ Sentiment distribution chart error:', error);
            this.renderErrorChart('sentiment-distribution-chart', 'Sentiment Distribution');
        }
    }
    
    /**
     * Render customer segments donut chart
     */
    renderCustomerSegments(chartsData) {
        try {
            console.log('🔍 Rendering customer segments with data:', chartsData);
            
            const container = document.getElementById('customer-segments-chart') || 
                             document.getElementById('customer-segments-detail-chart');
            
            if (!container) {
                console.error('❌ Customer segments chart container not found');
                console.log('Available containers:', 
                    document.getElementById('customer-segments-chart') ? 'customer-segments-chart found' : 'customer-segments-chart missing',
                    document.getElementById('customer-segments-detail-chart') ? 'customer-segments-detail-chart found' : 'customer-segments-detail-chart missing'
                );
                return;
            }
            
            console.log('✅ Container found:', container.id);
            
            let data;
            if (chartsData?.customer_segments) {
                data = chartsData.customer_segments;
                console.log('📊 Using charts.json customer segments data:', data);
            } else {
                // Fallback data
                data = {
                    labels: ['Premium', 'Standard', 'Basic', 'At Risk', 'High Value'],
                    data: [2500, 4200, 3100, 800, 1400],
                    backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b']
                };
                console.warn('⚠️ Customer segments data missing, using fallback data');
                console.log('Available data keys:', Object.keys(chartsData || {}));
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
                hovertemplate: '<b>%{label}</b><br>Customers: %{value:,}<br>Percentage: %{percent}<extra></extra>',
                pull: data.labels.map(() => 0)
            };
            
            const layout = {
                ...this.defaultLayout,
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
                margin: { t: 20, r: 120, b: 20, l: 20 },
                autosize: true
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('✅ Customer segments chart rendered');
            
        } catch (error) {
            console.error('❌ Customer segments chart error:', error);
            this.renderErrorChart('customer-segments-chart', 'Customer Segments');
        }
    }
    
    /**
     * Render ROC curve
     */
    renderROCCurve(chartsData, containerId) {
        try {
            const container = document.getElementById(containerId);
            if (!container || !chartsData?.roc_curves) {
                console.warn('⚠️ ROC curve data or container not found');
                return;
            }
            
            const rocData = chartsData.roc_curves.fraud_detection;
            
            const traces = [
                {
                    x: rocData.fpr,
                    y: rocData.tpr,
                    type: 'scatter',
                    mode: 'lines',
                    name: `ROC Curve (AUC = ${rocData.auc.toFixed(3)})`,
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
                        width: 2,
                        dash: 'dash'
                    },
                    hoverinfo: 'skip'
                }
            ];
            
            const layout = {
                ...this.defaultLayout,
                title: {
                    text: 'ROC Curve - Fraud Detection Model',
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
                showlegend: true,
                legend: {
                    x: 0.6,
                    y: 0.1
                }
            };
            
            Plotly.newPlot(container, traces, layout, this.defaultConfig);
            console.log('✅ ROC curve rendered');
            
        } catch (error) {
            console.error('❌ ROC curve error:', error);
            this.renderErrorChart(containerId, 'ROC Curve');
        }
    }
    
    /**
     * Render feature importance horizontal bar chart
     */
    renderFeatureImportance(chartsData, modelType, containerId) {
        try {
            const container = document.getElementById(containerId);
            if (!container || !chartsData?.feature_importance?.[modelType]) {
                console.warn(`⚠️ Feature importance data for ${modelType} or container not found`);
                return;
            }
            
            const data = chartsData.feature_importance[modelType];
            
            const trace = {
                x: data.data,
                y: data.labels,
                type: 'bar',
                orientation: 'h',
                marker: {
                    color: '#1cc88a',
                    opacity: 0.8,
                    line: {
                        color: '#17a673',
                        width: 1
                    }
                },
                text: data.data.map(val => val.toFixed(3)),
                textposition: 'auto',
                hovertemplate: '<b>%{y}</b><br>Importance: %{x:.3f}<extra></extra>'
            };
            
            const layout = {
                ...this.defaultLayout,
                title: {
                    text: `Feature Importance - ${modelType.charAt(0).toUpperCase() + modelType.slice(1)}`,
                    font: { size: 16, color: '#5a5c69' }
                },
                xaxis: {
                    title: 'Importance Score'
                },
                yaxis: {
                    title: 'Features',
                    automargin: true
                },
                height: 400
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log(`✅ Feature importance chart rendered for ${modelType}`);
            
        } catch (error) {
            console.error(`❌ Feature importance chart error for ${modelType}:`, error);
            this.renderErrorChart(containerId, 'Feature Importance');
        }
    }
    
    /**
     * Render time series chart for sentiment trends
     */
    renderSentimentTimeSeries(sentimentData, containerId) {
        try {
            const container = document.getElementById(containerId);
            if (!container || !sentimentData?.time_series) {
                console.warn('⚠️ Sentiment timeseries data or container not found');
                return;
            }
            
            const timeSeries = sentimentData.time_series;
            
            const traces = [
                {
                    x: timeSeries.dates,
                    y: timeSeries.positive,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Positive',
                    line: { color: '#1cc88a', width: 3 },
                    marker: { size: 6 }
                },
                {
                    x: timeSeries.dates,
                    y: timeSeries.neutral,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Neutral',
                    line: { color: '#858796', width: 3 },
                    marker: { size: 6 }
                },
                {
                    x: timeSeries.dates,
                    y: timeSeries.negative,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Negative',
                    line: { color: '#e74a3b', width: 3 },
                    marker: { size: 6 }
                }
            ];
            
            const layout = {
                ...this.defaultLayout,
                title: {
                    text: 'Sentiment Trends Over Time',
                    font: { size: 16, color: '#5a5c69' }
                },
                xaxis: {
                    title: 'Date',
                    type: 'date'
                },
                yaxis: {
                    title: 'Sentiment Count'
                },
                showlegend: true,
                legend: {
                    orientation: 'h',
                    y: -0.1,
                    x: 0.5,
                    xanchor: 'center'
                },
                hovermode: 'x unified'
            };
            
            Plotly.newPlot(container, traces, layout, this.defaultConfig);
            console.log('✅ Sentiment time series chart rendered');
            
        } catch (error) {
            console.error('❌ Sentiment time series chart error:', error);
            this.renderErrorChart(containerId, 'Sentiment Trends');
        }
    }
    
    /**
     * Render error chart when data loading fails
     */
    renderErrorChart(containerId, chartName) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="chart-loading" style="background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 0.25rem;">
                    <span>Error loading ${chartName} chart</span>
                </div>
            `;
        }
    }
    
    /**
     * Resize all charts (called on window resize)
     */
    resizeCharts() {
        const chartContainers = [
            'model-performance-chart',
            'fraud-risk-chart',
            'sentiment-distribution-chart',
            'customer-segments-chart',
            'feature-importance-chart',
            'shap-summary-chart',
            'lime-explanation-chart',
            'partial-dependence-chart',
            'decision-tree-chart',
            'confidence-distribution-chart',
            'feature-interaction-chart',
            'accuracy-by-feature-chart',
            'correlation-network-chart',
            'shap-waterfall-chart',
            'fairness-analysis-chart',
            'complexity-analysis-chart',
            'data-pipeline-chart',
            'error-analysis-chart',
            'edge-case-chart',
            'realtime-monitoring-chart'
        ];
        
        chartContainers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container && container._plotly) {
                Plotly.Plots.resize(container);
            }
        });
        
        console.log('📏 Charts resized');
    }
    
    /**
     * Apply dark theme to charts
     */
    applyDarkTheme() {
        this.defaultLayout.plot_bgcolor = 'rgba(0,0,0,0)';
        this.defaultLayout.paper_bgcolor = 'rgba(0,0,0,0)';
        this.defaultLayout.font.color = '#f8f9fc';
        
        // Update existing charts
        this.resizeCharts();
    }
    
    /**
     * Apply light theme to charts
     */
    applyLightTheme() {
        this.defaultLayout.plot_bgcolor = 'rgba(0,0,0,0)';
        this.defaultLayout.paper_bgcolor = 'rgba(0,0,0,0)';
        this.defaultLayout.font.color = '#5a5c69';
        
        // Update existing charts
        this.resizeCharts();
    }
    
    /**
     * Render Feature Importance Chart for XAI
     */
    renderXAIFeatureImportance(xaiData) {
        try {
            const container = document.getElementById('feature-importance-chart');
            if (!container || !xaiData?.feature_importance) {
                console.warn('⚠️ XAI feature importance data or container not found');
                return;
            }
            
            const data = xaiData.feature_importance;
            
            const trace = {
                x: data.values,
                y: data.features,
                type: 'bar',
                orientation: 'h',
                marker: {
                    color: '#4e73df',
                    opacity: 0.8
                },
                text: data.values.map(val => val.toFixed(3)),
                textposition: 'auto',
                hovertemplate: '<b>%{y}</b><br>Importance: %{x:.3f}<extra></extra>'
            };
            
            const layout = {
                ...this.defaultLayout,
                xaxis: {
                    title: 'Feature Importance Score'
                },
                yaxis: {
                    title: 'Features',
                    automargin: true
                },
                height: 350,
                margin: { t: 20, r: 20, b: 50, l: 120 }
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('✅ XAI Feature importance chart rendered');
            
        } catch (error) {
            console.error('❌ XAI Feature importance chart error:', error);
            this.renderErrorChart('feature-importance-chart', 'Feature Importance');
        }
    }
    
    /**
     * Render SHAP Summary Plot
     */
    renderSHAPSummary(xaiData) {
        try {
            const container = document.getElementById('shap-summary-chart');
            if (!container || !xaiData?.shap_values) {
                console.warn('⚠️ SHAP values data or container not found');
                return;
            }
            
            const data = xaiData.shap_values;
            
            const trace = {
                x: data.shap_values,
                y: data.features,
                mode: 'markers',
                type: 'scatter',
                marker: {
                    size: 8,
                    color: data.feature_values,
                    colorscale: 'RdYlBu',
                    reversescale: true,
                    colorbar: {
                        title: 'Feature Value',
                        titleside: 'right'
                    },
                    opacity: 0.7
                },
                hovertemplate: '<b>%{y}</b><br>SHAP Value: %{x:.3f}<br>Feature Value: %{marker.color:.2f}<extra></extra>'
            };
            
            const layout = {
                ...this.defaultLayout,
                xaxis: {
                    title: 'SHAP Value (Impact on Model Output)',
                    zeroline: true,
                    zerolinecolor: '#858796',
                    zerolinewidth: 2
                },
                yaxis: {
                    title: 'Features',
                    automargin: true
                },
                height: 350,
                margin: { t: 20, r: 80, b: 50, l: 120 }
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('✅ SHAP summary chart rendered');
            
        } catch (error) {
            console.error('❌ SHAP summary chart error:', error);
            this.renderErrorChart('shap-summary-chart', 'SHAP Summary');
        }
    }
    
    /**
     * Render LIME Local Explanation
     */
    renderLIMEExplanation(xaiData) {
        try {
            const container = document.getElementById('lime-explanation-chart') || document.getElementById('lime-explanation-xai-chart');
            if (!container || !xaiData?.lime_explanation) {
                console.warn('⚠️ LIME explanation data or container not found');
                return;
            }
            
            const data = xaiData.lime_explanation;
            
            const trace = {
                x: data.values,
                y: data.features,
                type: 'bar',
                orientation: 'h',
                marker: {
                    color: data.values.map(val => val > 0 ? '#1cc88a' : '#e74a3b'),
                    opacity: 0.8
                },
                text: data.values.map(val => val.toFixed(3)),
                textposition: 'auto',
                hovertemplate: '<b>%{y}</b><br>LIME Score: %{x:.3f}<extra></extra>'
            };
            
            const layout = {
                ...this.defaultLayout,
                xaxis: {
                    title: 'LIME Contribution Score',
                    zeroline: true,
                    zerolinecolor: '#858796',
                    zerolinewidth: 2
                },
                yaxis: {
                    title: 'Features',
                    automargin: true
                },
                height: 300,
                margin: { t: 20, r: 20, b: 50, l: 120 }
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('✅ LIME explanation chart rendered');
            
        } catch (error) {
            console.error('❌ LIME explanation chart error:', error);
            this.renderErrorChart('lime-explanation-chart', 'LIME Explanation');
        }
    }
    
    /**
     * Render Partial Dependence Plot
     */
    renderPartialDependence(xaiData) {
        try {
            const container = document.getElementById('partial-dependence-chart');
            if (!container || !xaiData?.partial_dependence) {
                console.warn('⚠️ Partial dependence data or container not found');
                return;
            }
            
            const data = xaiData.partial_dependence;
            
            const trace = {
                x: data.feature_values,
                y: data.partial_dependence_values,
                type: 'scatter',
                mode: 'lines+markers',
                line: {
                    color: '#36b9cc',
                    width: 3
                },
                marker: {
                    size: 6,
                    color: '#36b9cc'
                },
                hovertemplate: '<b>Feature Value:</b> %{x:.2f}<br><b>Partial Dependence:</b> %{y:.3f}<extra></extra>'
            };
            
            const layout = {
                ...this.defaultLayout,
                xaxis: {
                    title: `${data.feature_name} Value`
                },
                yaxis: {
                    title: 'Partial Dependence'
                },
                height: 300,
                margin: { t: 20, r: 20, b: 50, l: 60 }
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('✅ Partial dependence chart rendered');
            
        } catch (error) {
            console.error('❌ Partial dependence chart error:', error);
            this.renderErrorChart('partial-dependence-chart', 'Partial Dependence');
        }
    }
    
    /**
     * Render Decision Tree Visualization
     */
    renderDecisionTree(xaiData) {
        try {
            const container = document.getElementById('decision-tree-chart') || document.getElementById('decision-tree-xai-chart');
            if (!container || !xaiData?.decision_tree) {
                console.warn('⚠️ Decision tree data or container not found');
                return;
            }
            
            const data = xaiData.decision_tree;
            
            // Create a simple tree visualization using scatter plot with text
            const trace = {
                x: data.x_positions,
                y: data.y_positions,
                mode: 'markers+text',
                type: 'scatter',
                text: data.node_labels,
                textposition: 'middle center',
                marker: {
                    size: data.node_sizes,
                    color: data.node_colors,
                    colorscale: 'Viridis',
                    opacity: 0.8,
                    line: {
                        color: '#ffffff',
                        width: 2
                    }
                },
                hovertemplate: '<b>Node:</b> %{text}<br><b>Samples:</b> %{marker.size}<extra></extra>',
                showlegend: false
            };
            
            const layout = {
                ...this.defaultLayout,
                xaxis: {
                    showgrid: false,
                    showticklabels: false,
                    zeroline: false
                },
                yaxis: {
                    showgrid: false,
                    showticklabels: false,
                    zeroline: false
                },
                height: 400,
                margin: { t: 20, r: 20, b: 20, l: 20 }
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('✅ Decision tree chart rendered');
            
        } catch (error) {
            console.error('❌ Decision tree chart error:', error);
            this.renderErrorChart('decision-tree-chart', 'Decision Tree');
        }
    }
    
    /**
     * Render Prediction Confidence Distribution
     */
    renderConfidenceDistribution(xaiData) {
        try {
            const container = document.getElementById('confidence-distribution-chart') || document.getElementById('confidence-distribution-xai-chart');
            if (!container || !xaiData?.confidence_distribution) {
                console.warn('⚠️ Confidence distribution data or container not found');
                return;
            }
            
            const data = xaiData.confidence_distribution;
            
            const trace = {
                x: data.confidence_scores,
                type: 'histogram',
                nbinsx: 20,
                marker: {
                    color: '#f6c23e',
                    opacity: 0.8,
                    line: {
                        color: '#e6ac00',
                        width: 1
                    }
                },
                hovertemplate: '<b>Confidence Range:</b> %{x}<br><b>Count:</b> %{y}<extra></extra>'
            };
            
            const layout = {
                ...this.defaultLayout,
                xaxis: {
                    title: 'Prediction Confidence Score',
                    range: [0, 1]
                },
                yaxis: {
                    title: 'Frequency'
                },
                height: 300,
                margin: { t: 20, r: 20, b: 50, l: 50 }
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('✅ Confidence distribution chart rendered');
            
        } catch (error) {
            console.error('❌ Confidence distribution chart error:', error);
            this.renderErrorChart('confidence-distribution-chart', 'Confidence Distribution');
        }
    }
    
    /**
     * Render Feature Interaction Heatmap
     */
    renderFeatureInteraction(xaiData) {
        try {
            const container = document.getElementById('feature-interaction-chart') || document.getElementById('feature-interaction-xai-chart');
            if (!container || !xaiData?.feature_interaction) {
                console.warn('⚠️ Feature interaction data or container not found');
                return;
            }
            
            const data = xaiData.feature_interaction;
            
            const trace = {
                z: data.interaction_matrix,
                x: data.features,
                y: data.features,
                type: 'heatmap',
                colorscale: 'RdBu',
                reversescale: true,
                colorbar: {
                    title: 'Interaction Strength',
                    titleside: 'right'
                },
                hovertemplate: '<b>%{x}</b> × <b>%{y}</b><br>Interaction: %{z:.3f}<extra></extra>'
            };
            
            const layout = {
                ...this.defaultLayout,
                xaxis: {
                    title: 'Features',
                    tickangle: -45
                },
                yaxis: {
                    title: 'Features'
                },
                height: 300,
                margin: { t: 20, r: 80, b: 80, l: 80 }
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('✅ Feature interaction chart rendered');
            
        } catch (error) {
            console.error('❌ Feature interaction chart error:', error);
            this.renderErrorChart('feature-interaction-chart', 'Feature Interaction');
        }
    }
    
    /**
     * Render Model Accuracy by Feature Range
     */
    renderAccuracyByFeature(xaiData) {
        try {
            const container = document.getElementById('accuracy-by-feature-chart');
            if (!container || !xaiData?.accuracy_by_feature) {
                console.warn('⚠️ Accuracy by feature data or container not found');
                return;
            }
            
            const data = xaiData.accuracy_by_feature;
            
            const trace = {
                x: data.feature_ranges,
                y: data.accuracy_scores,
                type: 'scatter',
                mode: 'lines+markers',
                line: {
                    color: '#4e73df',
                    width: 3
                },
                marker: {
                    size: 8,
                    color: '#4e73df'
                },
                fill: 'tonexty',
                fillcolor: 'rgba(78, 115, 223, 0.1)',
                hovertemplate: '<b>Range:</b> %{x}<br><b>Accuracy:</b> %{y:.3f}<extra></extra>'
            };
            
            const layout = {
                ...this.defaultLayout,
                xaxis: {
                    title: 'Feature Value Range'
                },
                yaxis: {
                    title: 'Model Accuracy',
                    range: [0, 1]
                },
                height: 300,
                margin: { t: 20, r: 20, b: 50, l: 60 }
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('✅ Accuracy by feature chart rendered');
            
        } catch (error) {
            console.error('❌ Accuracy by feature chart error:', error);
            this.renderErrorChart('accuracy-by-feature-chart', 'Accuracy by Feature');
        }
    }
    
    /**
     * Render Feature Correlation Network
     */
    renderCorrelationNetwork(xaiData) {
        try {
            const container = document.getElementById('correlation-network-chart');
            if (!container || !xaiData?.correlation_network) {
                console.warn('⚠️ Correlation network data or container not found');
                return;
            }
            
            const data = xaiData.correlation_network;
            
            const trace = {
                x: data.x_positions,
                y: data.y_positions,
                mode: 'markers+text',
                type: 'scatter',
                text: data.feature_names,
                textposition: 'middle center',
                marker: {
                    size: data.node_sizes,
                    color: data.correlation_strengths,
                    colorscale: 'Viridis',
                    colorbar: {
                        title: 'Correlation<br>Strength',
                        titleside: 'right'
                    },
                    opacity: 0.8,
                    line: {
                        color: '#ffffff',
                        width: 2
                    }
                },
                hovertemplate: '<b>%{text}</b><br>Correlation: %{marker.color:.3f}<extra></extra>',
                showlegend: false
            };
            
            const layout = {
                ...this.defaultLayout,
                xaxis: {
                    showgrid: false,
                    showticklabels: false,
                    zeroline: false
                },
                yaxis: {
                    showgrid: false,
                    showticklabels: false,
                    zeroline: false
                },
                height: 300,
                margin: { t: 20, r: 60, b: 20, l: 20 }
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('✅ Correlation network chart rendered');
            
        } catch (error) {
            console.error('❌ Correlation network chart error:', error);
            this.renderErrorChart('correlation-network-chart', 'Correlation Network');
        }
    }
    
    /**
     * Render SHAP Waterfall Plot
     */
    renderSHAPWaterfall(xaiData) {
        try {
            const container = document.getElementById('shap-waterfall-chart');
            if (!container || !xaiData?.shap_waterfall) {
                console.warn('⚠️ SHAP waterfall data or container not found');
                return;
            }
            
            const data = xaiData.shap_waterfall;
            
            const trace = {
                x: data.features,
                y: data.cumulative_values,
                type: 'waterfall',
                orientation: 'v',
                measure: data.measures,
                text: data.shap_values.map(val => val.toFixed(3)),
                textposition: 'outside',
                connector: {
                    line: {
                        color: 'rgb(63, 63, 63)'
                    }
                },
                increasing: {
                    marker: {
                        color: '#1cc88a'
                    }
                },
                decreasing: {
                    marker: {
                        color: '#e74a3b'
                    }
                },
                totals: {
                    marker: {
                        color: '#4e73df'
                    }
                },
                hovertemplate: '<b>%{x}</b><br>SHAP Value: %{text}<br>Cumulative: %{y:.3f}<extra></extra>'
            };
            
            const layout = {
                ...this.defaultLayout,
                xaxis: {
                    title: 'Features',
                    tickangle: -45
                },
                yaxis: {
                    title: 'Cumulative SHAP Impact'
                },
                height: 300,
                margin: { t: 20, r: 20, b: 80, l: 60 }
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('✅ SHAP waterfall chart rendered');
            
        } catch (error) {
            console.error('❌ SHAP waterfall chart error:', error);
            this.renderErrorChart('shap-waterfall-chart', 'SHAP Waterfall');
        }
    }
    
    /**
     * Render Fairness Analysis Chart
     */
    renderFairnessAnalysis(xaiData) {
        try {
            const container = document.getElementById('fairness-analysis-chart');
            if (!container || !xaiData?.fairness_analysis) {
                console.warn('⚠️ Fairness analysis data or container not found');
                return;
            }
            
            const data = xaiData.fairness_analysis;
            
            const traces = data.demographic_groups.map((group, index) => ({
                x: data.metrics,
                y: data.metric_values[index],
                type: 'bar',
                name: group,
                marker: {
                    color: data.colors[index],
                    opacity: 0.8
                },
                hovertemplate: '<b>%{fullData.name}</b><br>%{x}: %{y:.3f}<extra></extra>'
            }));
            
            const layout = {
                ...this.defaultLayout,
                xaxis: {
                    title: 'Fairness Metrics'
                },
                yaxis: {
                    title: 'Metric Score'
                },
                barmode: 'group',
                height: 350,
                margin: { t: 20, r: 20, b: 50, l: 60 },
                legend: {
                    orientation: 'h',
                    y: -0.2,
                    x: 0.5,
                    xanchor: 'center'
                }
            };
            
            Plotly.newPlot(container, traces, layout, this.defaultConfig);
            console.log('✅ Fairness analysis chart rendered');
            
        } catch (error) {
            console.error('❌ Fairness analysis chart error:', error);
            this.renderErrorChart('fairness-analysis-chart', 'Fairness Analysis');
        }
    }
    
    /**
     * Render Model Complexity Analysis
     */
    renderComplexityAnalysis(xaiData) {
        try {
            const container = document.getElementById('complexity-analysis-chart');
            if (!container || !xaiData?.complexity_analysis) {
                console.warn('⚠️ Complexity analysis data or container not found');
                return;
            }
            
            const data = xaiData.complexity_analysis;
            
            const trace = {
                r: data.complexity_scores,
                theta: data.complexity_dimensions,
                type: 'scatterpolar',
                fill: 'toself',
                fillcolor: 'rgba(78, 115, 223, 0.2)',
                line: {
                    color: '#4e73df',
                    width: 2
                },
                marker: {
                    size: 8,
                    color: '#4e73df'
                },
                hovertemplate: '<b>%{theta}</b><br>Score: %{r:.3f}<extra></extra>'
            };
            
            const layout = {
                ...this.defaultLayout,
                polar: {
                    radialaxis: {
                        visible: true,
                        range: [0, 1]
                    }
                },
                height: 350,
                margin: { t: 20, r: 20, b: 20, l: 20 }
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('✅ Complexity analysis chart rendered');
            
        } catch (error) {
            console.error('❌ Complexity analysis chart error:', error);
            this.renderErrorChart('complexity-analysis-chart', 'Complexity Analysis');
        }
    }
    
    /**
     * Render Data Pipeline Visualization
     */
    renderDataPipeline(xaiData) {
        try {
            const container = document.getElementById('data-pipeline-chart');
            if (!container || !xaiData?.data_pipeline) {
                console.warn('⚠️ Data pipeline data or container not found');
                return;
            }
            
            const data = xaiData.data_pipeline;
            
            const trace = {
                x: data.x_positions,
                y: data.y_positions,
                mode: 'markers+text',
                type: 'scatter',
                text: data.step_names,
                textposition: 'middle center',
                marker: {
                    size: 40,
                    color: data.step_colors,
                    colorscale: 'Plasma',
                    opacity: 0.8,
                    line: {
                        color: '#ffffff',
                        width: 2
                    }
                },
                hovertemplate: '<b>%{text}</b><br>Processing Step<extra></extra>',
                showlegend: false
            };
            
            const layout = {
                ...this.defaultLayout,
                xaxis: {
                    showgrid: false,
                    showticklabels: false,
                    zeroline: false
                },
                yaxis: {
                    showgrid: false,
                    showticklabels: false,
                    zeroline: false
                },
                height: 250,
                margin: { t: 20, r: 20, b: 20, l: 20 }
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('✅ Data pipeline chart rendered');
            
        } catch (error) {
            console.error('❌ Data pipeline chart error:', error);
            this.renderErrorChart('data-pipeline-chart', 'Data Pipeline');
        }
    }
    
    /**
     * Render Error Analysis Chart
     */
    renderErrorAnalysis(xaiData) {
        try {
            const container = document.getElementById('error-analysis-chart');
            if (!container || !xaiData?.error_analysis) {
                console.warn('⚠️ Error analysis data or container not found');
                return;
            }
            
            const data = xaiData.error_analysis;
            
            const traces = [
                {
                    x: data.feature_ranges,
                    y: data.false_positives,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'False Positives',
                    line: { color: '#e74a3b', width: 3 },
                    marker: { size: 6 }
                },
                {
                    x: data.feature_ranges,
                    y: data.false_negatives,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'False Negatives',
                    line: { color: '#f6c23e', width: 3 },
                    marker: { size: 6 }
                }
            ];
            
            const layout = {
                ...this.defaultLayout,
                xaxis: {
                    title: 'Feature Value Range'
                },
                yaxis: {
                    title: 'Error Rate'
                },
                height: 350,
                margin: { t: 20, r: 20, b: 50, l: 60 },
                legend: {
                    orientation: 'h',
                    y: -0.2,
                    x: 0.5,
                    xanchor: 'center'
                }
            };
            
            Plotly.newPlot(container, traces, layout, this.defaultConfig);
            console.log('✅ Error analysis chart rendered');
            
        } catch (error) {
            console.error('❌ Error analysis chart error:', error);
            this.renderErrorChart('error-analysis-chart', 'Error Analysis');
        }
    }
    
    /**
     * Render Edge Case Detection
     */
    renderEdgeCaseDetection(xaiData) {
        try {
            const container = document.getElementById('edge-case-chart');
            if (!container || !xaiData?.edge_cases) {
                console.warn('⚠️ Edge case data or container not found');
                return;
            }
            
            const data = xaiData.edge_cases;
            
            const traces = [
                {
                    x: data.normal_cases.x,
                    y: data.normal_cases.y,
                    mode: 'markers',
                    type: 'scatter',
                    name: 'Normal Cases',
                    marker: {
                        size: 6,
                        color: '#1cc88a',
                        opacity: 0.6
                    }
                },
                {
                    x: data.edge_cases.x,
                    y: data.edge_cases.y,
                    mode: 'markers',
                    type: 'scatter',
                    name: 'Edge Cases',
                    marker: {
                        size: 8,
                        color: '#e74a3b',
                        opacity: 0.8,
                        symbol: 'x'
                    }
                }
            ];
            
            const layout = {
                ...this.defaultLayout,
                xaxis: {
                    title: 'Feature 1'
                },
                yaxis: {
                    title: 'Feature 2'
                },
                height: 350,
                margin: { t: 20, r: 20, b: 50, l: 60 },
                legend: {
                    orientation: 'h',
                    y: -0.15,
                    x: 0.5,
                    xanchor: 'center'
                }
            };
            
            Plotly.newPlot(container, traces, layout, this.defaultConfig);
            console.log('✅ Edge case detection chart rendered');
            
        } catch (error) {
            console.error('❌ Edge case detection chart error:', error);
            this.renderErrorChart('edge-case-chart', 'Edge Case Detection');
        }
    }
    
    /**
     * Render Real-time Monitoring Chart
     */
    renderRealtimeMonitoring(xaiData) {
        try {
            const container = document.getElementById('realtime-monitoring-chart');
            if (!container || !xaiData?.realtime_monitoring) {
                console.warn('⚠️ Realtime monitoring data or container not found');
                return;
            }
            
            const data = xaiData.realtime_monitoring;
            
            const traces = [
                {
                    x: data.timestamps,
                    y: data.accuracy_over_time,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Accuracy',
                    line: { color: '#1cc88a', width: 2 },
                    yaxis: 'y'
                },
                {
                    x: data.timestamps,
                    y: data.drift_scores,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Drift Score',
                    line: { color: '#f6c23e', width: 2 },
                    yaxis: 'y2'
                }
            ];
            
            const layout = {
                ...this.defaultLayout,
                xaxis: {
                    title: 'Time'
                },
                yaxis: {
                    title: 'Accuracy',
                    side: 'left',
                    range: [0, 1]
                },
                yaxis2: {
                    title: 'Drift Score',
                    side: 'right',
                    overlaying: 'y',
                    range: [0, 1]
                },
                height: 300,
                margin: { t: 20, r: 60, b: 50, l: 60 },
                legend: {
                    orientation: 'h',
                    y: -0.2,
                    x: 0.5,
                    xanchor: 'center'
                }
            };
            
            Plotly.newPlot(container, traces, layout, this.defaultConfig);
            console.log('✅ Realtime monitoring chart rendered');
            
        } catch (error) {
            console.error('❌ Realtime monitoring chart error:', error);
            this.renderErrorChart('realtime-monitoring-chart', 'Realtime Monitoring');
        }
    }
    
    // ========================================
    // Processing Pipeline Charts
    // ========================================
    
    renderProcessingPipeline(data) {
        try {
            const container = document.getElementById('processing-pipeline-chart');
            if (!container) {
                console.warn('⚠️ Processing pipeline chart container not found');
                return;
            }
            
            const steps = ['Data Loading', 'Quality Check', 'Missing Values', 'Outliers', 'Feature Eng.', 'Split', 'Validation'];
            const status = [1, 1, 1, 0.8, 0.6, 0, 0]; // Completion status
            
            const trace = {
                x: steps,
                y: status,
                type: 'bar',
                marker: {
                    color: status.map(s => s === 1 ? '#28a745' : s > 0 ? '#ffc107' : '#6c757d'),
                    line: {
                        width: 1,
                        color: '#fff'
                    }
                },
                text: status.map(s => s === 1 ? '✅' : s > 0 ? '🔄' : '⏳'),
                textposition: 'inside',
                hovertemplate: '<b>%{x}</b><br>Status: %{text}<br>Progress: %{y:.0%}<extra></extra>'
            };
            
            const layout = {
                ...this.defaultLayout,
                title: 'Data Processing Pipeline Status',
                xaxis: {
                    title: 'Processing Steps',
                    tickangle: -45
                },
                yaxis: {
                    title: 'Completion Status',
                    tickformat: '.0%',
                    range: [0, 1.1]
                }
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('🔧 Processing pipeline chart rendered');
            
        } catch (error) {
            console.error('❌ Error rendering processing pipeline chart:', error);
        }
    }
    
    renderDataLeakageMatrix(data) {
        try {
            const container = document.getElementById('data-leakage-chart');
            if (!container) {
                console.warn('⚠️ Data leakage chart container not found');
                return;
            }
            
            const checks = ['Temporal', 'Target', 'Feature', 'Snooping', 'Look-ahead'];
            const riskLevels = ['Low', 'Medium', 'High'];
            const riskMatrix = [
                [3, 1, 0], // Temporal
                [4, 0, 0], // Target  
                [2, 1, 1], // Feature
                [3, 1, 0], // Snooping
                [4, 0, 0]  // Look-ahead
            ];
            
            const trace = {
                z: riskMatrix,
                x: riskLevels,
                y: checks,
                type: 'heatmap',
                colorscale: [
                    [0, '#28a745'],
                    [0.5, '#ffc107'], 
                    [1, '#dc3545']
                ],
                showscale: true,
                hovertemplate: '<b>%{y}</b><br>Risk Level: %{x}<br>Count: %{z}<extra></extra>'
            };
            
            const layout = {
                ...this.defaultLayout,
                title: 'Data Leakage Risk Assessment',
                xaxis: { title: 'Risk Level' },
                yaxis: { title: 'Check Type' }
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('🔒 Data leakage matrix chart rendered');
            
        } catch (error) {
            console.error('❌ Error rendering data leakage chart:', error);
        }
    }
    
    renderOverfittingMonitor(data) {
        try {
            const container = document.getElementById('overfitting-chart');
            if (!container) {
                console.warn('⚠️ Overfitting chart container not found');
                return;
            }
            
            const epochs = Array.from({length: 50}, (_, i) => i + 1);
            const trainAcc = epochs.map(e => 0.85 + (e / 50) * 0.1 + Math.sin(e * 0.2) * 0.02);
            const valAcc = epochs.map(e => 0.83 + (e / 50) * 0.08 + Math.sin(e * 0.15) * 0.015);
            
            const trainTrace = {
                x: epochs,
                y: trainAcc,
                type: 'scatter',
                mode: 'lines',
                name: 'Training Accuracy',
                line: { color: '#007bff', width: 2 }
            };
            
            const valTrace = {
                x: epochs,
                y: valAcc,
                type: 'scatter',
                mode: 'lines',
                name: 'Validation Accuracy',
                line: { color: '#28a745', width: 2 }
            };
            
            const layout = {
                ...this.defaultLayout,
                title: 'Training vs Validation Accuracy (Overfitting Monitor)',
                xaxis: { title: 'Epoch' },
                yaxis: { 
                    title: 'Accuracy',
                    tickformat: '.1%',
                    range: [0.8, 1.0]
                },
                legend: {
                    x: 0.7,
                    y: 0.9
                }
            };
            
            Plotly.newPlot(container, [trainTrace, valTrace], layout, this.defaultConfig);
            console.log('📊 Overfitting monitor chart rendered');
            
        } catch (error) {
            console.error('❌ Error rendering overfitting chart:', error);
        }
    }
    
    renderTrainingProgress(data) {
        try {
            const container = document.getElementById('training-progress-chart');
            if (!container) {
                console.warn('⚠️ Training progress chart container not found');
                return;
            }
            
            const epochs = Array.from({length: 30}, (_, i) => i + 1);
            const trainLoss = epochs.map(e => 0.8 - (e / 30) * 0.6 + Math.random() * 0.1);
            const valLoss = epochs.map(e => 0.85 - (e / 30) * 0.55 + Math.random() * 0.12);
            
            const trainTrace = {
                x: epochs,
                y: trainLoss,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Training Loss',
                line: { color: '#dc3545', width: 2 },
                marker: { size: 4 }
            };
            
            const valTrace = {
                x: epochs,
                y: valLoss,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Validation Loss',
                line: { color: '#fd7e14', width: 2 },
                marker: { size: 4 }
            };
            
            const layout = {
                ...this.defaultLayout,
                title: 'Training Progress - Loss Curves',
                xaxis: { title: 'Epoch' },
                yaxis: { 
                    title: 'Loss',
                    type: 'log'
                },
                legend: {
                    x: 0.7,
                    y: 0.9
                }
            };
            
            Plotly.newPlot(container, [trainTrace, valTrace], layout, this.defaultConfig);
            console.log('🎯 Training progress chart rendered');
            
        } catch (error) {
            console.error('❌ Error rendering training progress chart:', error);
        }
    }
    
    renderParameterComparison(data) {
        try {
            const container = document.getElementById('parameter-comparison-chart');
            if (!container) {
                console.warn('⚠️ Parameter comparison chart container not found');
                return;
            }
            
            const parameters = ['Learning Rate', 'Batch Size', 'Dropout', 'L2 Reg', 'Layers'];
            const model1 = [0.001, 32, 0.3, 0.001, 5];
            const model2 = [0.01, 64, 0.2, 0.01, 3];
            const model3 = [0.005, 16, 0.4, 0.005, 4];
            
            const trace1 = {
                x: parameters,
                y: model1,
                type: 'bar',
                name: 'Current Model',
                marker: { color: '#007bff' }
            };
            
            const trace2 = {
                x: parameters,
                y: model2,
                type: 'bar',
                name: 'Previous Model',
                marker: { color: '#6c757d' }
            };
            
            const trace3 = {
                x: parameters,
                y: model3,
                type: 'bar',
                name: 'Best Model',
                marker: { color: '#28a745' }
            };
            
            const layout = {
                ...this.defaultLayout,
                title: 'Model Parameter Comparison',
                xaxis: { title: 'Parameters' },
                yaxis: { 
                    title: 'Value',
                    type: 'log'
                },
                barmode: 'group'
            };
            
            Plotly.newPlot(container, [trace1, trace2, trace3], layout, this.defaultConfig);
            console.log('📊 Parameter comparison chart rendered');
            
        } catch (error) {
            console.error('❌ Error rendering parameter comparison chart:', error);
        }
    }
    
    // ========================================
    // Model Analysis Charts
    // ========================================
    
    renderFraudFeatureImportance(fraudData) {
        try {
            const container = document.getElementById('fraud-feature-importance-main-chart') || 
                             document.getElementById('fraud-feature-importance-chart');
            if (!container) {
                console.warn('⚠️ Fraud feature importance chart container not found');
                return;
            }
            
            console.log('Fraud data received:', fraudData);
            
            // Use feature importance from charts data
            let features, importance;
            if (fraudData && fraudData.feature_importance && fraudData.feature_importance.fraud) {
                features = fraudData.feature_importance.fraud.labels;
                importance = fraudData.feature_importance.fraud.data.map(v => v * 100);
            } else {
                // Fallback data
                features = ['Amount_zscore', 'Time_hour', 'V14', 'V12', 'V10'];
                importance = [23.4, 18.7, 15.6, 14.3, 12.8];
                console.log('Using fallback fraud feature importance data');
            }
            // Features and importance already defined above
            
            const trace = {
                x: importance,
                y: features,
                type: 'bar',
                orientation: 'h',
                marker: {
                    color: importance.map(imp => 
                        imp > 20 ? '#dc3545' : 
                        imp > 15 ? '#fd7e14' : 
                        imp > 10 ? '#ffc107' : '#28a745'
                    ),
                    line: { width: 1, color: '#fff' }
                },
                text: importance.map(imp => `${imp.toFixed(1)}%`),
                textposition: 'inside',
                hovertemplate: '<b>%{y}</b><br>Importance: %{x:.1f}%<extra></extra>'
            };
            
            const layout = {
                ...this.defaultLayout,
                title: 'Feature Importance (사기 탐지)',
                xaxis: { title: 'Importance (%)' },
                yaxis: { title: 'Features' },
                height: 300
            };
            
            if (typeof Plotly !== 'undefined') {
                Plotly.newPlot(container, [trace], layout, this.defaultConfig);
                console.log('🛡️ Fraud feature importance chart rendered');
            } else {
                console.error('❌ Plotly is not loaded');
                container.innerHTML = '<div class="alert alert-warning">Chart library not loaded</div>';
            }
            
        } catch (error) {
            console.error('❌ Error rendering fraud feature importance chart:', error);
        }
    }
    
    renderSentimentModelComparison(sentimentData) {
        try {
            const container = document.getElementById('sentiment-model-comparison-chart');
            if (!container) {
                console.warn('⚠️ Sentiment model comparison chart container not found');
                return;
            }
            
            const models = Object.keys(sentimentData.individual_models);
            const accuracy = models.map(model => sentimentData.individual_models[model].accuracy * 100);
            const f1 = models.map(model => sentimentData.individual_models[model].f1 * 100);
            
            const accuracyTrace = {
                x: models,
                y: accuracy,
                type: 'bar',
                name: 'Accuracy',
                marker: { color: '#007bff' },
                text: accuracy.map(acc => `${acc.toFixed(1)}%`),
                textposition: 'outside'
            };
            
            const f1Trace = {
                x: models,
                y: f1,
                type: 'bar',
                name: 'F1-Score',
                marker: { color: '#28a745' },
                text: f1.map(score => `${score.toFixed(1)}%`),
                textposition: 'outside'
            };
            
            const layout = {
                ...this.defaultLayout,
                title: 'Individual Model Performance',
                xaxis: { title: 'Models' },
                yaxis: { title: 'Performance (%)', range: [0, 100] },
                barmode: 'group',
                height: 300
            };
            
            Plotly.newPlot(container, [accuracyTrace, f1Trace], layout, this.defaultConfig);
            console.log('💭 Sentiment model comparison chart rendered');
            
        } catch (error) {
            console.error('❌ Error rendering sentiment model comparison chart:', error);
        }
    }
    
    renderCustomerSegmentAnalysis(attritionData) {
        try {
            const container = document.getElementById('customer-segment-chart');
            if (!container) {
                console.warn('⚠️ Customer segment chart container not found');
                return;
            }
            
            const segments = Object.keys(attritionData.segments);
            const counts = segments.map(seg => attritionData.segments[seg].count);
            const churnProbs = segments.map(seg => attritionData.segments[seg].churn_prob * 100);
            
            const trace = {
                x: counts,
                y: churnProbs,
                mode: 'markers+text',
                type: 'scatter',
                text: segments,
                textposition: 'top center',
                marker: {
                    size: counts.map(count => Math.sqrt(count) / 10 + 10),
                    color: churnProbs,
                    colorscale: [
                        [0, '#28a745'],
                        [0.5, '#ffc107'],
                        [1, '#dc3545']
                    ],
                    showscale: true,
                    colorbar: {
                        title: 'Churn Risk (%)'
                    }
                },
                hovertemplate: '<b>%{text}</b><br>' +
                              'Count: %{x:,}<br>' +
                              'Churn Risk: %{y:.1f}%<br>' +
                              '<extra></extra>'
            };
            
            const layout = {
                ...this.defaultLayout,
                title: 'Customer Segments Analysis',
                xaxis: { title: 'Customer Count' },
                yaxis: { title: 'Churn Probability (%)' },
                height: 300
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('👥 Customer segment analysis chart rendered');
            
        } catch (error) {
            console.error('❌ Error rendering customer segment chart:', error);
        }
    }
    
    renderHyperparameterComparison(allModelsData) {
        try {
            const container = document.getElementById('hyperparameter-comparison-chart');
            if (!container) {
                console.warn('⚠️ Hyperparameter comparison chart container not found');
                return;
            }
            
            const categories = ['Learning Rate', 'Model Complexity', 'Regularization', 'Cross Validation', 'Early Stopping'];
            
            const fraudTrace = {
                r: [0.1, 0.8, 0.7, 1.0, 0.8],
                theta: categories,
                fill: 'toself',
                type: 'scatterpolar',
                name: 'Fraud Detection',
                line: { color: '#dc3545' }
            };
            
            const sentimentTrace = {
                r: [0.9, 0.6, 0.9, 0.6, 0.6],
                theta: categories,
                fill: 'toself',
                type: 'scatterpolar',
                name: 'Sentiment Analysis',
                line: { color: '#007bff' }
            };
            
            const attritionTrace = {
                r: [0.8, 0.9, 0.8, 1.0, 1.0],
                theta: categories,
                fill: 'toself',
                type: 'scatterpolar',
                name: 'Customer Attrition',
                line: { color: '#28a745' }
            };
            
            const layout = {
                ...this.defaultLayout,
                title: 'Hyperparameter Configuration',
                polar: {
                    radialaxis: {
                        visible: true,
                        range: [0, 1]
                    }
                },
                height: 350
            };
            
            Plotly.newPlot(container, [fraudTrace, sentimentTrace, attritionTrace], layout, this.defaultConfig);
            console.log('⚙️ Hyperparameter comparison chart rendered');
            
        } catch (error) {
            console.error('❌ Error rendering hyperparameter comparison chart:', error);
        }
    }
    
    renderPerformanceRadar(allModelsData) {
        try {
            const container = document.getElementById('performance-radar-chart');
            if (!container) {
                console.warn('⚠️ Performance radar chart container not found');
                return;
            }
            
            const metrics = ['Accuracy', 'Precision', 'Recall', 'Business Impact', 'Data Quality', 'Interpretability'];
            
            const fraudPerf = {
                r: [0.999, 0.857, 0.857, 0.95, 0.96, 0.8],
                theta: metrics,
                fill: 'toself',
                type: 'scatterpolar',
                name: 'Fraud Detection',
                line: { color: '#dc3545', width: 2 }
            };
            
            const sentimentPerf = {
                r: [0.887, 0.85, 0.84, 0.8, 0.94, 0.9],
                theta: metrics,
                fill: 'toself',
                type: 'scatterpolar',
                name: 'Sentiment Analysis',
                line: { color: '#007bff', width: 2 }
            };
            
            const attritionPerf = {
                r: [0.85, 0.798, 0.756, 0.92, 0.97, 0.85],
                theta: metrics,
                fill: 'toself',
                type: 'scatterpolar',
                name: 'Customer Attrition',
                line: { color: '#28a745', width: 2 }
            };
            
            const layout = {
                ...this.defaultLayout,
                title: 'Overall Performance Metrics',
                polar: {
                    radialaxis: {
                        visible: true,
                        range: [0, 1],
                        tickformat: '.1%'
                    }
                },
                height: 350
            };
            
            Plotly.newPlot(container, [fraudPerf, sentimentPerf, attritionPerf], layout, this.defaultConfig);
            console.log('📊 Performance radar chart rendered');
            
        } catch (error) {
            console.error('❌ Error rendering performance radar chart:', error);
        }
    }
    
    // ========================================
    // Page-Specific Charts
    // ========================================
    
    renderSentimentTimeline(sentimentData) {
        try {
            const container = document.getElementById('sentiment-timeline-chart');
            if (!container || !sentimentData?.time_series) {
                console.warn('⚠️ Sentiment timeline chart container not found');
                return;
            }
            
            const positiveTrace = {
                x: sentimentData.time_series.dates,
                y: sentimentData.time_series.positive,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Positive',
                line: { color: '#28a745', width: 2 },
                marker: { size: 4 }
            };
            
            const neutralTrace = {
                x: sentimentData.time_series.dates,
                y: sentimentData.time_series.neutral,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Neutral',
                line: { color: '#6c757d', width: 2 },
                marker: { size: 4 }
            };
            
            const negativeTrace = {
                x: sentimentData.time_series.dates,
                y: sentimentData.time_series.negative,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Negative',
                line: { color: '#dc3545', width: 2 },
                marker: { size: 4 }
            };
            
            const layout = {
                ...this.defaultLayout,
                title: 'Sentiment Trends Over Time',
                xaxis: { title: 'Date' },
                yaxis: { title: 'Count' },
                height: 350
            };
            
            Plotly.newPlot(container, [positiveTrace, neutralTrace, negativeTrace], layout, this.defaultConfig);
            console.log('💭 Sentiment timeline chart rendered');
            
        } catch (error) {
            console.error('❌ Error rendering sentiment timeline chart:', error);
        }
    }
    
    renderDomainSentiment(sentimentData) {
        try {
            const container = document.getElementById('domain-sentiment-chart');
            if (!container || !sentimentData?.domain_specific_insights) {
                console.warn('⚠️ Domain sentiment chart container not found');
                return;
            }
            
            const domains = Object.keys(sentimentData.domain_specific_insights.sector_sentiment);
            const scores = Object.values(sentimentData.domain_specific_insights.sector_sentiment);
            
            const trace = {
                x: domains,
                y: scores,
                type: 'bar',
                marker: {
                    color: scores.map(score => 
                        score > 0.3 ? '#28a745' :
                        score > 0 ? '#ffc107' : '#dc3545'
                    ),
                    line: { width: 1, color: '#fff' }
                },
                text: scores.map(score => `${(score * 100).toFixed(0)}%`),
                textposition: 'outside'
            };
            
            const layout = {
                ...this.defaultLayout,
                title: 'Sector-wise Sentiment Performance',
                xaxis: { title: 'Sectors' },
                yaxis: { title: 'Sentiment Score', range: [-0.5, 1] },
                height: 350
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('🏢 Domain sentiment chart rendered');
            
        } catch (error) {
            console.error('❌ Error rendering domain sentiment chart:', error);
        }
    }
    
    renderAttritionFeatureImportance(attritionData) {
        try {
            const container = document.getElementById('attrition-feature-importance-chart');
            if (!container || !attritionData?.feature_importance) {
                console.warn('⚠️ Attrition feature importance chart container not found');
                return;
            }
            
            const features = attritionData.feature_importance.map(f => f.feature);
            const importance = attritionData.feature_importance.map(f => f.importance * 100);
            
            const trace = {
                x: importance,
                y: features,
                type: 'bar',
                orientation: 'h',
                marker: {
                    color: importance.map(imp => 
                        imp > 25 ? '#dc3545' : 
                        imp > 20 ? '#fd7e14' : 
                        imp > 15 ? '#ffc107' : '#28a745'
                    )
                },
                text: importance.map(imp => `${imp.toFixed(1)}%`),
                textposition: 'inside'
            };
            
            const layout = {
                ...this.defaultLayout,
                title: 'Customer Attrition Feature Importance',
                xaxis: { title: 'Importance (%)' },
                yaxis: { title: 'Features' },
                height: 350
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('👥 Attrition feature importance chart rendered');
            
        } catch (error) {
            console.error('❌ Error rendering attrition feature importance chart:', error);
        }
    }
    
    renderAttritionConfidence(attritionData) {
        try {
            const container = document.getElementById('attrition-confidence-chart');
            if (!container) {
                console.warn('⚠️ Attrition confidence chart container not found');
                return;
            }
            
            // Generate mock confidence data
            const confidenceRanges = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
            const counts = [120, 450, 1200, 800, 300];
            
            const trace = {
                labels: confidenceRanges,
                values: counts,
                type: 'pie',
                marker: {
                    colors: ['#28a745', '#20c997', '#ffc107', '#fd7e14', '#dc3545']
                },
                textinfo: 'label+percent',
                hole: 0.4
            };
            
            const layout = {
                ...this.defaultLayout,
                title: 'Attrition Prediction Confidence',
                height: 300
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('🎯 Attrition confidence chart rendered');
            
        } catch (error) {
            console.error('❌ Error rendering attrition confidence chart:', error);
        }
    }
    
    renderMonthlyChurnTrend(attritionData) {
        try {
            const container = document.getElementById('monthly-churn-trend');
            if (!container || !attritionData?.churn_prediction_timeline) {
                console.warn('⚠️ Monthly churn trend chart container not found');
                return;
            }
            
            const trace = {
                x: attritionData.churn_prediction_timeline.dates,
                y: attritionData.churn_prediction_timeline.churn_predictions.map(p => p * 100),
                type: 'scatter',
                mode: 'lines+markers',
                line: { color: '#dc3545', width: 2 },
                marker: { size: 6 },
                fill: 'tonexty'
            };
            
            const layout = {
                ...this.defaultLayout,
                xaxis: { title: 'Month' },
                yaxis: { title: 'Churn Rate (%)' },
                height: 150,
                margin: { t: 20, r: 20, b: 40, l: 40 }
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('📈 Monthly churn trend chart rendered');
            
        } catch (error) {
            console.error('❌ Error rendering monthly churn trend chart:', error);
        }
    }
    
    renderGlobalFeatureImportance(data) {
        try {
            const container = document.getElementById('global-feature-importance-chart');
            if (!container) {
                console.warn('⚠️ Global feature importance chart container not found');
                return;
            }
            
            // Mock data for global feature importance across all models
            const features = ['Amount/Value', 'Time/Age', 'Activity', 'History', 'Location', 'Behavior'];
            const fraudImportance = [0.30, 0.25, 0.15, 0.12, 0.10, 0.08];
            const sentimentImportance = [0.10, 0.15, 0.35, 0.20, 0.05, 0.15];
            const attritionImportance = [0.20, 0.30, 0.25, 0.15, 0.05, 0.05];
            
            const fraudTrace = {
                x: features,
                y: fraudImportance,
                type: 'bar',
                name: 'Fraud Detection',
                marker: { color: '#dc3545' }
            };
            
            const sentimentTrace = {
                x: features,
                y: sentimentImportance,
                type: 'bar',
                name: 'Sentiment Analysis',
                marker: { color: '#007bff' }
            };
            
            const attritionTrace = {
                x: features,
                y: attritionImportance,
                type: 'bar',
                name: 'Customer Attrition',
                marker: { color: '#28a745' }
            };
            
            const layout = {
                ...this.defaultLayout,
                title: 'Global Feature Importance Across Models',
                xaxis: { title: 'Feature Categories' },
                yaxis: { title: 'Importance Score', tickformat: '.1%' },
                barmode: 'group',
                height: 350
            };
            
            Plotly.newPlot(container, [fraudTrace, sentimentTrace, attritionTrace], layout, this.defaultConfig);
            console.log('🌍 Global feature importance chart rendered');
            
        } catch (error) {
            console.error('❌ Error rendering global feature importance chart:', error);
        }
    }
    
    renderModelComparisonXAI(data) {
        try {
            const container = document.getElementById('model-comparison-xai-chart');
            if (!container) {
                console.warn('⚠️ Model comparison XAI chart container not found');
                return;
            }
            
            const models = ['Fraud Detection', 'Sentiment Analysis', 'Customer Attrition'];
            const interpretability = [75, 90, 85];
            const complexity = [85, 60, 70];
            const accuracy = [92, 89, 85];
            
            const interpretabilityTrace = {
                x: models,
                y: interpretability,
                type: 'bar',
                name: 'Interpretability',
                marker: { color: '#28a745' }
            };
            
            const complexityTrace = {
                x: models,
                y: complexity,
                type: 'bar',
                name: 'Complexity',
                marker: { color: '#ffc107' }
            };
            
            const accuracyTrace = {
                x: models,
                y: accuracy,
                type: 'bar',
                name: 'Accuracy',
                marker: { color: '#007bff' }
            };
            
            const layout = {
                ...this.defaultLayout,
                title: 'Model Comparison Dashboard',
                xaxis: { title: 'Models' },
                yaxis: { title: 'Score (%)' },
                barmode: 'group',
                height: 350
            };
            
            Plotly.newPlot(container, [interpretabilityTrace, complexityTrace, accuracyTrace], layout, this.defaultConfig);
            console.log('📈 Model comparison XAI chart rendered');
            
        } catch (error) {
            console.error('❌ Error rendering model comparison XAI chart:', error);
        }
    }
    
    // ========================================
    // Missing Chart Functions
    // ========================================
    
    renderXAIFeatureImportance(data) {
        try {
            const container = document.getElementById('fraud-feature-importance-main-chart') || 
                             document.getElementById('feature-importance-chart');
            if (!container) {
                console.warn('⚠️ XAI feature importance chart container not found');
                return;
            }
            
            const features = data.feature_importance.features;
            const values = data.feature_importance.values.map(v => v * 100);
            
            const trace = {
                x: values,
                y: features,
                type: 'bar',
                orientation: 'h',
                marker: { 
                    color: values.map(v => v > 20 ? '#dc3545' : v > 15 ? '#ffc107' : '#28a745')
                },
                text: values.map(v => `${v.toFixed(1)}%`),
                textposition: 'inside'
            };
            
            const layout = {
                ...this.defaultLayout,
                title: 'XAI Feature Importance',
                xaxis: { title: 'Importance (%)' },
                yaxis: { title: 'Features' }
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('🎯 XAI feature importance rendered');
            
        } catch (error) {
            console.error('❌ Error rendering XAI feature importance:', error);
        }
    }
    
    renderSHAPSummary(data) {
        try {
            const container = document.getElementById('shap-summary-chart');
            if (!container) {
                console.warn('⚠️ SHAP summary chart container not found');
                return;
            }
            
            const features = data.shap_values.features;
            const shapValues = data.shap_values.shap_values;
            
            const trace = {
                x: shapValues,
                y: features,
                type: 'bar',
                orientation: 'h',
                marker: {
                    color: shapValues.map(v => v > 0 ? '#28a745' : '#dc3545')
                },
                text: shapValues.map(v => v.toFixed(2)),
                textposition: 'inside'
            };
            
            const layout = {
                ...this.defaultLayout,
                title: 'SHAP Summary Plot',
                xaxis: { title: 'SHAP Value' },
                yaxis: { title: 'Features' }
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('🔍 SHAP summary rendered');
            
        } catch (error) {
            console.error('❌ Error rendering SHAP summary:', error);
        }
    }
    
    renderLIMEExplanation(data) {
        try {
            const container = document.getElementById('lime-explanation-chart') || document.getElementById('lime-explanation-xai-chart');
            if (!container) {
                console.warn('⚠️ LIME explanation chart container not found');
                return;
            }
            
            const features = data.lime_explanation.features;
            const values = data.lime_explanation.values;
            
            const trace = {
                x: values,
                y: features,
                type: 'bar',
                orientation: 'h',
                marker: {
                    color: values.map(v => v > 0 ? '#28a745' : '#dc3545')
                },
                text: values.map(v => v.toFixed(2)),
                textposition: 'inside'
            };
            
            const layout = {
                ...this.defaultLayout,
                title: 'LIME Local Explanation',
                xaxis: { title: 'Contribution' },
                yaxis: { title: 'Features' }
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('🔬 LIME explanation rendered');
            
        } catch (error) {
            console.error('❌ Error rendering LIME explanation:', error);
        }
    }
    
    renderPartialDependence(data) {
        try {
            const container = document.getElementById('partial-dependence-chart');
            if (!container) {
                console.warn('⚠️ Partial dependence chart container not found');
                return;
            }
            
            const trace = {
                x: data.partial_dependence.feature_values,
                y: data.partial_dependence.partial_dependence_values,
                type: 'scatter',
                mode: 'lines+markers',
                line: { color: '#007bff', width: 3 },
                marker: { size: 6 }
            };
            
            const layout = {
                ...this.defaultLayout,
                title: `Partial Dependence: ${data.partial_dependence.feature_name}`,
                xaxis: { title: data.partial_dependence.feature_name },
                yaxis: { title: 'Partial Dependence' }
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('📈 Partial dependence rendered');
            
        } catch (error) {
            console.error('❌ Error rendering partial dependence:', error);
        }
    }
    
    renderDecisionTree(data) {
        try {
            const container = document.getElementById('decision-tree-chart');
            if (!container) {
                console.warn('⚠️ Decision tree chart container not found');
                return;
            }
            
            const trace = {
                x: data.decision_tree.x_positions,
                y: data.decision_tree.y_positions,
                mode: 'markers+text',
                type: 'scatter',
                text: data.decision_tree.node_labels,
                textposition: 'middle center',
                marker: {
                    size: data.decision_tree.node_sizes,
                    color: data.decision_tree.node_colors,
                    colorscale: 'RdYlGn',
                    showscale: true
                },
                hovertemplate: '<b>%{text}</b><extra></extra>'
            };
            
            const layout = {
                ...this.defaultLayout,
                title: 'Model Decision Tree',
                xaxis: { showticklabels: false, showgrid: false },
                yaxis: { showticklabels: false, showgrid: false },
                showlegend: false
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('🌳 Decision tree rendered');
            
        } catch (error) {
            console.error('❌ Error rendering decision tree:', error);
        }
    }
    
    renderAccuracyByFeature(data) {
        try {
            const container = document.getElementById('accuracy-by-feature-chart');
            if (!container) {
                console.warn('⚠️ Accuracy by feature chart container not found');
                return;
            }
            
            const trace = {
                x: data.accuracy_by_feature.feature_ranges,
                y: data.accuracy_by_feature.accuracy_scores.map(s => s * 100),
                type: 'bar',
                marker: { color: '#007bff' },
                text: data.accuracy_by_feature.accuracy_scores.map(s => `${(s * 100).toFixed(1)}%`),
                textposition: 'outside'
            };
            
            const layout = {
                ...this.defaultLayout,
                title: 'Accuracy by Feature Range',
                xaxis: { title: 'Feature Range' },
                yaxis: { title: 'Accuracy (%)' }
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('🎯 Accuracy by feature rendered');
            
        } catch (error) {
            console.error('❌ Error rendering accuracy by feature:', error);
        }
    }
    
    renderCorrelationNetwork(data) {
        try {
            const container = document.getElementById('correlation-network-chart');
            if (!container) {
                console.warn('⚠️ Correlation network chart container not found');
                return;
            }
            
            const trace = {
                x: data.correlation_network.x_positions,
                y: data.correlation_network.y_positions,
                mode: 'markers+text',
                type: 'scatter',
                text: data.correlation_network.feature_names,
                textposition: 'middle center',
                marker: {
                    size: data.correlation_network.node_sizes,
                    color: data.correlation_network.correlation_strengths,
                    colorscale: 'Viridis',
                    showscale: true
                },
                hovertemplate: '<b>%{text}</b><br>Strength: %{marker.color}<extra></extra>'
            };
            
            const layout = {
                ...this.defaultLayout,
                title: 'Feature Correlation Network',
                xaxis: { showticklabels: false, showgrid: false },
                yaxis: { showticklabels: false, showgrid: false },
                showlegend: false
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('🔗 Correlation network rendered');
            
        } catch (error) {
            console.error('❌ Error rendering correlation network:', error);
        }
    }
    
    renderSHAPWaterfall(data) {
        try {
            const container = document.getElementById('shap-waterfall-chart');
            if (!container) {
                console.warn('⚠️ SHAP waterfall chart container not found');
                return;
            }
            
            const trace = {
                x: data.shap_waterfall.features,
                y: data.shap_waterfall.cumulative_values,
                type: 'waterfall',
                orientation: 'v',
                measure: data.shap_waterfall.measures,
                text: data.shap_waterfall.shap_values.map(v => v.toFixed(3)),
                textposition: 'outside',
                connector: { line: { color: 'rgb(63, 63, 63)' } }
            };
            
            const layout = {
                ...this.defaultLayout,
                title: 'SHAP Waterfall Plot',
                xaxis: { title: 'Features' },
                yaxis: { title: 'Prediction' }
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('🌊 SHAP waterfall rendered');
            
        } catch (error) {
            console.error('❌ Error rendering SHAP waterfall:', error);
        }
    }
    
    renderFairnessAnalysis(data) {
        try {
            const container = document.getElementById('fairness-analysis-chart');
            if (!container) {
                console.warn('⚠️ Fairness analysis chart container not found');
                return;
            }
            
            const traces = data.fairness_analysis.metrics.map((metric, i) => {
                return {
                    x: data.fairness_analysis.demographic_groups,
                    y: data.fairness_analysis.metric_values[i],
                    type: 'bar',
                    name: metric,
                    marker: { color: data.fairness_analysis.colors[i] }
                };
            });
            
            const layout = {
                ...this.defaultLayout,
                title: 'Fairness Analysis Across Groups',
                xaxis: { title: 'Demographic Groups' },
                yaxis: { title: 'Performance Score' },
                barmode: 'group'
            };
            
            Plotly.newPlot(container, traces, layout, this.defaultConfig);
            console.log('⚖️ Fairness analysis rendered');
            
        } catch (error) {
            console.error('❌ Error rendering fairness analysis:', error);
        }
    }
    
    renderDataPipeline(data) {
        try {
            const container = document.getElementById('data-pipeline-chart');
            if (!container) {
                console.warn('⚠️ Data pipeline chart container not found');
                return;
            }
            
            const trace = {
                x: data.data_pipeline.x_positions,
                y: data.data_pipeline.y_positions,
                mode: 'markers+text+lines',
                type: 'scatter',
                text: data.data_pipeline.step_names,
                textposition: 'top center',
                marker: {
                    size: 20,
                    color: data.data_pipeline.step_colors,
                    colorscale: 'Viridis'
                },
                line: { color: '#007bff', width: 3 }
            };
            
            const layout = {
                ...this.defaultLayout,
                title: 'Data Processing Pipeline',
                xaxis: { showticklabels: false, showgrid: false },
                yaxis: { showticklabels: false, showgrid: false },
                showlegend: false
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('🔄 Data pipeline rendered');
            
        } catch (error) {
            console.error('❌ Error rendering data pipeline:', error);
        }
    }
    
    renderErrorAnalysis(data) {
        try {
            const container = document.getElementById('error-analysis-chart');
            if (!container) {
                console.warn('⚠️ Error analysis chart container not found');
                return;
            }
            
            const fpTrace = {
                x: data.error_analysis.feature_ranges,
                y: data.error_analysis.false_positives.map(v => v * 100),
                type: 'bar',
                name: 'False Positives',
                marker: { color: '#dc3545' }
            };
            
            const fnTrace = {
                x: data.error_analysis.feature_ranges,
                y: data.error_analysis.false_negatives.map(v => v * 100),
                type: 'bar',
                name: 'False Negatives',
                marker: { color: '#ffc107' }
            };
            
            const layout = {
                ...this.defaultLayout,
                title: 'Error Analysis by Feature Range',
                xaxis: { title: 'Feature Range' },
                yaxis: { title: 'Error Rate (%)' },
                barmode: 'group'
            };
            
            Plotly.newPlot(container, [fpTrace, fnTrace], layout, this.defaultConfig);
            console.log('❌ Error analysis rendered');
            
        } catch (error) {
            console.error('❌ Error rendering error analysis:', error);
        }
    }
    
    renderRealtimeMonitoring(data) {
        try {
            const container = document.getElementById('realtime-monitoring-chart');
            if (!container) {
                console.warn('⚠️ Realtime monitoring chart container not found');
                return;
            }
            
            const accTrace = {
                x: data.realtime_monitoring.timestamps,
                y: data.realtime_monitoring.accuracy_over_time.map(v => v * 100),
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Accuracy',
                line: { color: '#28a745' },
                yaxis: 'y'
            };
            
            const driftTrace = {
                x: data.realtime_monitoring.timestamps,
                y: data.realtime_monitoring.drift_scores.map(v => v * 100),
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Drift Score',
                line: { color: '#dc3545' },
                yaxis: 'y2'
            };
            
            const layout = {
                ...this.defaultLayout,
                title: 'Real-time Model Monitoring',
                xaxis: { title: 'Time' },
                yaxis: { title: 'Accuracy (%)', side: 'left' },
                yaxis2: { title: 'Drift Score (%)', side: 'right', overlaying: 'y' }
            };
            
            Plotly.newPlot(container, [accTrace, driftTrace], layout, this.defaultConfig);
            console.log('📊 Realtime monitoring rendered');
            
        } catch (error) {
            console.error('❌ Error rendering realtime monitoring:', error);
        }
    }
    
    /**
     * Render fraud feature importance chart
     */
    renderFraudFeatureImportance(chartsData) {
        try {
            const container = document.getElementById('fraud-feature-importance-main-chart') || 
                             document.getElementById('fraud-feature-importance-chart');
            if (!container) {
                console.warn('⚠️ Fraud feature importance chart container not found');
                return;
            }
            
            // Use correct data structure from charts.json
            let data;
            if (chartsData?.feature_importance?.fraud) {
                data = {
                    features: chartsData.feature_importance.fraud.labels,
                    values: chartsData.feature_importance.fraud.data
                };
                console.log('Using charts.json fraud feature importance data');
            } else {
                // Fallback data
                data = {
                    features: ['V4', 'V11', 'V12', 'V14', 'V17', 'V10', 'Amount', 'V18', 'V16', 'V3'],
                    values: [0.15, 0.12, 0.11, 0.10, 0.09, 0.08, 0.07, 0.06, 0.05, 0.04]
                };
                console.log('Using fallback fraud feature importance data');
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
                hovertemplate: '<b>%{y}</b><br>Importance: %{text}<extra></extra>'
            };
            
            const layout = {
                ...this.defaultLayout,
                title: {
                    text: 'Fraud Detection - Feature Importance',
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
                margin: { t: 50, r: 30, b: 50, l: 80 },
                height: 350
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('✅ Fraud feature importance chart rendered');
            
        } catch (error) {
            console.error('❌ Fraud feature importance chart error:', error);
            this.renderErrorChart('fraud-feature-importance-main-chart', 'Fraud Feature Importance');
        }
    }
}

// Initialize charts when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if Plotly is loaded
    if (typeof Plotly !== 'undefined') {
        window.FCACharts = new FCACharts();
        console.log('📊 FCACharts ready');
    } else {
        console.error('❌ Plotly.js not loaded');
        
        // Fallback: show error messages in chart containers
        const chartContainers = [
            'model-performance-chart',
            'fraud-risk-chart', 
            'sentiment-distribution-chart',
            'customer-segments-chart'
        ];
        
        chartContainers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="chart-loading" style="background-color: #f8d7da; color: #721c24;">
                        <span>Plotly.js library not loaded</span>
                    </div>
                `;
            }
        });
    }
});

// Initialize and export for global access
if (typeof window !== 'undefined') {
    window.FCACharts = new FCACharts();
}