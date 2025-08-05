/**
 * Performance Charts Module
 * =========================
 * 
 * Charts for model performance and comparison
 */

import { BaseChart } from './base-chart.js';

export class PerformanceCharts extends BaseChart {
    /**
     * Render model comparison chart
     */
    async renderModelComparison(data) {
        if (!data?.models) {
            this.showError('No model comparison data available');
            return;
        }

        const chartData = [{
            x: data.models.map(m => m.name),
            y: data.models.map(m => m.accuracy * 100),
            type: 'bar',
            name: 'Accuracy (%)',
            marker: {
                color: this.getColors()[0],
                opacity: 0.8
            },
            text: data.models.map(m => `${(m.accuracy * 100).toFixed(1)}%`),
            textposition: 'auto',
            hovertemplate: '<b>%{x}</b><br>' +
                          'Accuracy: %{y:.1f}%<br>' +
                          '<extra></extra>'
        }];

        const layout = {
            title: {
                text: 'Model Performance Comparison',
                font: { size: 16, weight: 'bold' }
            },
            xaxis: {
                title: 'Models',
                tickangle: -45
            },
            yaxis: {
                title: 'Accuracy (%)',
                range: [0, 100]
            },
            showlegend: false
        };

        await this.render(chartData, layout);
    }

    /**
     * Render ROC curve chart
     */
    async renderROCCurve(data) {
        if (!data?.roc_data) {
            this.showError('No ROC curve data available');
            return;
        }

        const colors = this.getColors();
        const chartData = [];

        // Add ROC curves for each model
        data.roc_data.forEach((model, index) => {
            chartData.push({
                x: model.fpr,
                y: model.tpr,
                type: 'scatter',
                mode: 'lines',
                name: `${model.name} (AUC: ${model.auc.toFixed(3)})`,
                line: {
                    color: colors[index % colors.length],
                    width: 3
                },
                hovertemplate: '<b>%{fullData.name}</b><br>' +
                              'FPR: %{x:.3f}<br>' +
                              'TPR: %{y:.3f}<br>' +
                              '<extra></extra>'
            });
        });

        // Add diagonal reference line
        chartData.push({
            x: [0, 1],
            y: [0, 1],
            type: 'scatter',
            mode: 'lines',
            name: 'Random Classifier',
            line: {
                color: 'gray',
                width: 2,
                dash: 'dash'
            },
            showlegend: true
        });

        const layout = {
            title: {
                text: 'ROC Curves',
                font: { size: 16, weight: 'bold' }
            },
            xaxis: {
                title: 'False Positive Rate',
                range: [0, 1]
            },
            yaxis: {
                title: 'True Positive Rate',
                range: [0, 1]
            },
            legend: {
                y: 0.1,
                x: 0.6
            }
        };

        await this.render(chartData, layout);
    }

    /**
     * Render confusion matrix heatmap
     */
    async renderConfusionMatrix(data) {
        if (!data?.confusion_matrix) {
            this.showError('No confusion matrix data available');
            return;
        }

        const matrix = data.confusion_matrix;
        const labels = data.labels || ['Negative', 'Positive'];

        const chartData = [{
            z: matrix,
            x: labels,
            y: labels,
            type: 'heatmap',
            colorscale: [
                [0, '#f8f9fc'],
                [1, this.getColors()[0]]
            ],
            showscale: true,
            text: matrix.map(row => 
                row.map(val => val.toString())
            ),
            texttemplate: '%{text}',
            textfont: { size: 14, color: 'white' },
            hovertemplate: 'Predicted: %{x}<br>' +
                          'Actual: %{y}<br>' +
                          'Count: %{z}<br>' +
                          '<extra></extra>'
        }];

        const layout = {
            title: {
                text: 'Confusion Matrix',
                font: { size: 16, weight: 'bold' }
            },
            xaxis: {
                title: 'Predicted',
                side: 'bottom'
            },
            yaxis: {
                title: 'Actual',
                autorange: 'reversed'
            }
        };

        await this.render(chartData, layout);
    }

    /**
     * Render feature importance chart
     */
    async renderFeatureImportance(data) {
        if (!data?.feature_importance) {
            this.showError('No feature importance data available');
            return;
        }

        const features = data.feature_importance
            .sort((a, b) => b.importance - a.importance)
            .slice(0, 15); // Top 15 features

        const chartData = [{
            x: features.map(f => f.importance),
            y: features.map(f => f.feature),
            type: 'bar',
            orientation: 'h',
            marker: {
                color: features.map((_, i) => this.getColors()[i % this.getColors().length]),
                opacity: 0.8
            },
            text: features.map(f => f.importance.toFixed(3)),
            textposition: 'auto',
            hovertemplate: '<b>%{y}</b><br>' +
                          'Importance: %{x:.3f}<br>' +
                          '<extra></extra>'
        }];

        const layout = {
            title: {
                text: 'Feature Importance (Top 15)',
                font: { size: 16, weight: 'bold' }
            },
            xaxis: {
                title: 'Importance Score'
            },
            yaxis: {
                title: 'Features',
                automargin: true
            },
            margin: { l: 150 },
            showlegend: false
        };

        await this.render(chartData, layout);
    }

    /**
     * Render precision-recall curve
     */
    async renderPrecisionRecallCurve(data) {
        if (!data?.pr_data) {
            this.showError('No precision-recall data available');
            return;
        }

        const colors = this.getColors();
        const chartData = [];

        data.pr_data.forEach((model, index) => {
            chartData.push({
                x: model.recall,
                y: model.precision,
                type: 'scatter',
                mode: 'lines',
                name: `${model.name} (AP: ${model.average_precision.toFixed(3)})`,
                line: {
                    color: colors[index % colors.length],
                    width: 3
                },
                hovertemplate: '<b>%{fullData.name}</b><br>' +
                              'Recall: %{x:.3f}<br>' +
                              'Precision: %{y:.3f}<br>' +
                              '<extra></extra>'
            });
        });

        const layout = {
            title: {
                text: 'Precision-Recall Curves',
                font: { size: 16, weight: 'bold' }
            },
            xaxis: {
                title: 'Recall',
                range: [0, 1]
            },
            yaxis: {
                title: 'Precision',
                range: [0, 1]
            }
        };

        await this.render(chartData, layout);
    }
}