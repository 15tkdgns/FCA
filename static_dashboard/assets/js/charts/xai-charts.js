/**
 * FCA Analysis Dashboard - XAI Charts
 * ==================================
 * 
 * Contains XAI-specific chart types for explainable AI
 * visualizations including SHAP, LIME, feature importance.
 */

class ModularXAICharts {
    constructor() {
        this.defaultConfig = {
            responsive: true,
            displayModeBar: true,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
            displaylogo: false,
            toImageButtonOptions: {
                format: 'png',
                filename: 'fca_xai_chart',
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
        
        console.log('🎯 XAICharts module initialized');
    }

    /**
     * Render feature importance chart
     */
    renderFeatureImportance(chartsData, modelType, containerId) {
        try {
            const container = document.getElementById(containerId);
            if (!container || !chartsData?.feature_importance) {
                console.warn('⚠️ Feature importance data or container not found');
                return;
            }
            
            const data = chartsData.feature_importance;
            
            const trace = {
                x: data.importance_scores,
                y: data.feature_names,
                type: 'bar',
                orientation: 'h',
                marker: {
                    color: data.importance_scores,
                    colorscale: 'Viridis',
                    showscale: true,
                    colorbar: {
                        title: 'Importance Score',
                        titleside: 'right'
                    }
                },
                text: data.importance_scores.map(score => score.toFixed(3)),
                textposition: 'outside',
                hovertemplate: '<b>%{y}</b><br>Importance: %{x:.3f}<extra></extra>'
            };
            
            const layout = {
                ...this.defaultLayout,
                title: {
                    text: `${modelType} Feature Importance`,
                    font: { size: 16, color: '#5a5c69' }
                },
                xaxis: {
                    title: 'Importance Score',
                    range: [0, Math.max(...data.importance_scores) * 1.1]
                },
                yaxis: {
                    title: 'Features',
                    automargin: true
                },
                height: Math.max(400, data.feature_names.length * 25)
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('✅ Feature importance chart rendered');
            
        } catch (error) {
            console.error('❌ Feature importance chart error:', error);
            this.renderErrorChart(containerId, 'Feature Importance');
        }
    }

    /**
     * Render SHAP summary plot
     */
    renderSHAPSummary(xaiData) {
        try {
            const container = document.getElementById('shap-summary-chart');
            if (!container || !xaiData?.shap_values) {
                console.warn('⚠️ SHAP data or container not found');
                return;
            }
            
            const data = xaiData.shap_values;
            
            const trace = {
                x: data.shap_values,
                y: data.features,
                type: 'bar',
                orientation: 'h',
                marker: {
                    color: data.shap_values.map(val => val >= 0 ? '#1cc88a' : '#e74a3b')
                },
                text: data.shap_values.map(val => val.toFixed(3)),
                textposition: 'outside',
                hovertemplate: '<b>%{y}</b><br>SHAP Value: %{x:.3f}<extra></extra>'
            };
            
            const layout = {
                ...this.defaultLayout,
                title: {
                    text: 'SHAP Values Summary',
                    font: { size: 16, color: '#5a5c69' }
                },
                xaxis: {
                    title: 'SHAP Value',
                    zeroline: true,
                    zerolinecolor: '#858796',
                    zerolinewidth: 2
                },
                yaxis: {
                    title: 'Features',
                    automargin: true
                },
                height: Math.max(400, data.features.length * 30)
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('✅ SHAP summary chart rendered');
            
        } catch (error) {
            console.error('❌ SHAP summary chart error:', error);
            this.renderErrorChart('shap-summary-chart', 'SHAP Summary');
        }
    }

    /**
     * Render LIME explanation
     */
    renderLIMEExplanation(xaiData) {
        try {
            const container = document.getElementById('lime-explanation-chart');
            if (!container || !xaiData?.lime_explanation) {
                console.warn('⚠️ LIME data or container not found');
                return;
            }
            
            const data = xaiData.lime_explanation;
            
            const trace = {
                x: data.values,
                y: data.features,
                type: 'bar',
                orientation: 'h',
                marker: {
                    color: data.values.map(val => val >= 0 ? '#36b9cc' : '#f6c23e')
                },
                text: data.values.map(val => val.toFixed(3)),
                textposition: 'outside',
                hovertemplate: '<b>%{y}</b><br>LIME Weight: %{x:.3f}<extra></extra>'
            };
            
            const layout = {
                ...this.defaultLayout,
                title: {
                    text: 'LIME Local Explanation',
                    font: { size: 16, color: '#5a5c69' }
                },
                xaxis: {
                    title: 'Feature Weight',
                    zeroline: true,
                    zerolinecolor: '#858796',
                    zerolinewidth: 2
                },
                yaxis: {
                    title: 'Features',
                    automargin: true
                }
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('✅ LIME explanation chart rendered');
            
        } catch (error) {
            console.error('❌ LIME explanation chart error:', error);
            this.renderErrorChart('lime-explanation-chart', 'LIME Explanation');
        }
    }

    /**
     * Render partial dependence plot
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
                    color: '#4e73df',
                    width: 3
                },
                marker: {
                    size: 6,
                    color: '#4e73df'
                },
                hovertemplate: `<b>${data.feature_name}</b><br>Value: %{x}<br>Effect: %{y:.3f}<extra></extra>`
            };
            
            const layout = {
                ...this.defaultLayout,
                title: {
                    text: `Partial Dependence Plot - ${data.feature_name}`,
                    font: { size: 16, color: '#5a5c69' }
                },
                xaxis: {
                    title: data.feature_name
                },
                yaxis: {
                    title: 'Partial Dependence'
                }
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('✅ Partial dependence chart rendered');
            
        } catch (error) {
            console.error('❌ Partial dependence chart error:', error);
            this.renderErrorChart('partial-dependence-chart', 'Partial Dependence');
        }
    }

    /**
     * Render decision tree visualization
     */
    renderDecisionTree(xaiData) {
        try {
            const container = document.getElementById('decision-tree-chart');
            if (!container || !xaiData?.decision_tree) {
                console.warn('⚠️ Decision tree data or container not found');
                return;
            }
            
            const data = xaiData.decision_tree;
            
            const trace = {
                x: data.x_positions,
                y: data.y_positions,
                type: 'scatter',
                mode: 'markers+text',
                marker: {
                    size: data.node_sizes,
                    color: data.node_colors,
                    colorscale: 'RdYlBu',
                    showscale: true,
                    colorbar: {
                        title: 'Decision Score',
                        titleside: 'right'
                    },
                    line: {
                        color: '#333333',
                        width: 2
                    }
                },
                text: data.node_labels,
                textposition: 'middle center',
                textfont: {
                    size: 10,
                    color: '#333333'
                },
                hovertemplate: '<b>%{text}</b><br>Position: (%{x}, %{y})<extra></extra>'
            };
            
            const layout = {
                ...this.defaultLayout,
                title: {
                    text: 'Decision Tree Visualization',
                    font: { size: 16, color: '#5a5c69' }
                },
                xaxis: {
                    showgrid: false,
                    zeroline: false,
                    showticklabels: false
                },
                yaxis: {
                    showgrid: false,
                    zeroline: false,
                    showticklabels: false
                },
                showlegend: false
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('✅ Decision tree chart rendered');
            
        } catch (error) {
            console.error('❌ Decision tree chart error:', error);
            this.renderErrorChart('decision-tree-chart', 'Decision Tree');
        }
    }

    /**
     * Render confidence distribution
     */
    renderConfidenceDistribution(xaiData) {
        try {
            const container = document.getElementById('confidence-distribution-chart');
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
                    color: '#36b9cc',
                    opacity: 0.7,
                    line: {
                        color: '#2c9faf',
                        width: 1
                    }
                },
                hovertemplate: 'Confidence Range: %{x}<br>Count: %{y}<extra></extra>'
            };
            
            const layout = {
                ...this.defaultLayout,
                title: {
                    text: 'Prediction Confidence Distribution',
                    font: { size: 16, color: '#5a5c69' }
                },
                xaxis: {
                    title: 'Confidence Score',
                    range: [0, 1]
                },
                yaxis: {
                    title: 'Frequency'
                }
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('✅ Confidence distribution chart rendered');
            
        } catch (error) {
            console.error('❌ Confidence distribution chart error:', error);
            this.renderErrorChart('confidence-distribution-chart', 'Confidence Distribution');
        }
    }

    /**
     * Render SHAP waterfall plot
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
                text: data.shap_values.map((val, i) => i === 0 || i === data.shap_values.length - 1 ? '' : (val > 0 ? '+' : '') + val.toFixed(3)),
                textposition: 'outside',
                connector: {
                    line: {
                        color: '#858796',
                        width: 2
                    }
                },
                increasing: { marker: { color: '#1cc88a' } },
                decreasing: { marker: { color: '#e74a3b' } },
                totals: { marker: { color: '#4e73df' } }
            };
            
            const layout = {
                ...this.defaultLayout,
                title: {
                    text: 'SHAP Waterfall Plot',
                    font: { size: 16, color: '#5a5c69' }
                },
                xaxis: {
                    title: 'Features',
                    tickangle: -45
                },
                yaxis: {
                    title: 'Prediction Value'
                }
            };
            
            Plotly.newPlot(container, [trace], layout, this.defaultConfig);
            console.log('✅ SHAP waterfall chart rendered');
            
        } catch (error) {
            console.error('❌ SHAP waterfall chart error:', error);
            this.renderErrorChart('shap-waterfall-chart', 'SHAP Waterfall');
        }
    }

    /**
     * Render fairness analysis
     */
    renderFairnessAnalysis(xaiData) {
        try {
            const container = document.getElementById('fairness-analysis-chart');
            if (!container || !xaiData?.fairness_analysis) {
                console.warn('⚠️ Fairness analysis data or container not found');
                return;
            }
            
            const data = xaiData.fairness_analysis;
            
            const traces = data.metrics.map((metric, i) => ({
                x: data.demographic_groups,
                y: data.metric_values[i],
                type: 'bar',
                name: metric,
                marker: {
                    color: data.colors[i],
                    opacity: 0.8
                },
                hovertemplate: `<b>${metric}</b><br>Group: %{x}<br>Score: %{y:.3f}<extra></extra>`
            }));
            
            const layout = {
                ...this.defaultLayout,
                title: {
                    text: 'Fairness Analysis Across Demographics',
                    font: { size: 16, color: '#5a5c69' }
                },
                xaxis: {
                    title: 'Demographic Groups'
                },
                yaxis: {
                    title: 'Metric Score',
                    range: [0, 1]
                },
                barmode: 'group',
                showlegend: true
            };
            
            Plotly.newPlot(container, traces, layout, this.defaultConfig);
            console.log('✅ Fairness analysis chart rendered');
            
        } catch (error) {
            console.error('❌ Fairness analysis chart error:', error);
            this.renderErrorChart('fairness-analysis-chart', 'Fairness Analysis');
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
                            <i class="fas fa-brain fa-3x text-muted"></i>
                        </div>
                        <h6 class="text-muted mb-2">${chartName} Unavailable</h6>
                        <p class="text-muted small">XAI chart could not be loaded at this time.</p>
                    </div>
                </div>
            `;
        }
    }
}

// Export for use in other modules
window.ModularXAICharts = ModularXAICharts;