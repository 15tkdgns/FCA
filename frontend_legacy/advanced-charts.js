// Advanced Chart System
class AdvancedCharts {
    constructor(dashboard) {
        this.dashboard = dashboard;
        this.charts = new Map();
        this.chartConfigs = new Map();
        this.animationOptions = {
            duration: 1000,
            easing: 'easeInOutQuart'
        };
    }

    // Create advanced performance comparison chart
    createPerformanceComparison(containerId, data) {
        const ctx = document.getElementById(containerId);
        if (!ctx) return null;

        const config = {
            type: 'radar',
            data: {
                labels: ['Accuracy', 'Precision', 'Recall', 'F1-Score', 'Speed', 'Robustness'],
                datasets: this.generateDatasets(data)
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Model Performance Comparison',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.r.toFixed(3)}`;
                            }
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 1,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        pointLabels: {
                            font: { size: 12 }
                        },
                        ticks: {
                            callback: function(value) {
                                return (value * 100).toFixed(0) + '%';
                            }
                        }
                    }
                },
                animation: this.animationOptions
            }
        };

        const chart = new Chart(ctx, config);
        this.charts.set(containerId, chart);
        this.chartConfigs.set(containerId, config);
        return chart;
    }

    // Create real-time line chart with streaming data
    createRealtimeChart(containerId, options = {}) {
        const ctx = document.getElementById(containerId);
        if (!ctx) return null;

        const config = {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: options.label || 'Real-time Data',
                    data: [],
                    borderColor: options.color || '#007bff',
                    backgroundColor: options.backgroundColor || 'rgba(0, 123, 255, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 3,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    title: {
                        display: true,
                        text: options.title || 'Real-time Monitoring',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'minute',
                            displayFormats: {
                                minute: 'HH:mm'
                            }
                        },
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: options.yLabel || 'Value'
                        }
                    }
                },
                animation: {
                    duration: 0 // Disable animation for real-time data
                }
            }
        };

        const chart = new Chart(ctx, config);
        this.charts.set(containerId, chart);
        this.chartConfigs.set(containerId, config);
        return chart;
    }

    // Create confusion matrix heatmap
    createConfusionMatrix(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        // Clear container
        container.innerHTML = '';

        // Create confusion matrix using HTML/CSS for better control
        const matrix = document.createElement('div');
        matrix.className = 'confusion-matrix';
        
        const matrixHTML = `
            <div class="matrix-header">
                <h4>Confusion Matrix</h4>
                <div class="matrix-labels">
                    <span class="y-label">Actual</span>
                    <span class="x-label">Predicted</span>
                </div>
            </div>
            <div class="matrix-grid">
                <div class="matrix-cell true-positive" data-value="${data.tp}">
                    <span class="cell-label">TP</span>
                    <span class="cell-value">${data.tp}</span>
                </div>
                <div class="matrix-cell false-positive" data-value="${data.fp}">
                    <span class="cell-label">FP</span>
                    <span class="cell-value">${data.fp}</span>
                </div>
                <div class="matrix-cell false-negative" data-value="${data.fn}">
                    <span class="cell-label">FN</span>
                    <span class="cell-value">${data.fn}</span>
                </div>
                <div class="matrix-cell true-negative" data-value="${data.tn}">
                    <span class="cell-label">TN</span>
                    <span class="cell-value">${data.tn}</span>
                </div>
            </div>
            <div class="matrix-metrics">
                <div class="metric">
                    <span class="metric-label">Accuracy:</span>
                    <span class="metric-value">${((data.tp + data.tn) / (data.tp + data.tn + data.fp + data.fn)).toFixed(3)}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Precision:</span>
                    <span class="metric-value">${(data.tp / (data.tp + data.fp)).toFixed(3)}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Recall:</span>
                    <span class="metric-value">${(data.tp / (data.tp + data.fn)).toFixed(3)}</span>
                </div>
            </div>
        `;
        
        matrix.innerHTML = matrixHTML;
        container.appendChild(matrix);
        
        // Add animation
        setTimeout(() => {
            matrix.classList.add('animated');
        }, 100);
        
        return matrix;
    }

    // Create feature importance chart
    createFeatureImportance(containerId, data) {
        const ctx = document.getElementById(containerId);
        if (!ctx) return null;

        const sortedData = data.sort((a, b) => b.importance - a.importance).slice(0, 15);

        const config = {
            type: 'bar',
            data: {
                labels: sortedData.map(d => d.feature),
                datasets: [{
                    label: 'Feature Importance',
                    data: sortedData.map(d => d.importance),
                    backgroundColor: sortedData.map((_, i) => {
                        const intensity = 1 - (i / sortedData.length);
                        return `rgba(0, 123, 255, ${0.3 + intensity * 0.7})`;
                    }),
                    borderColor: '#007bff',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Top 15 Feature Importance',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Importance Score'
                        }
                    }
                },
                animation: this.animationOptions
            }
        };

        const chart = new Chart(ctx, config);
        this.charts.set(containerId, chart);
        this.chartConfigs.set(containerId, config);
        return chart;
    }

    // Create model training progress chart
    createTrainingProgress(containerId, trainingData) {
        const ctx = document.getElementById(containerId);
        if (!ctx) return null;

        const config = {
            type: 'line',
            data: {
                labels: trainingData.epochs,
                datasets: [{
                    label: 'Training Loss',
                    data: trainingData.trainLoss,
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    yAxisID: 'y'
                }, {
                    label: 'Validation Loss',
                    data: trainingData.valLoss,
                    borderColor: '#fd7e14',
                    backgroundColor: 'rgba(253, 126, 20, 0.1)',
                    yAxisID: 'y'
                }, {
                    label: 'Training Accuracy',
                    data: trainingData.trainAcc,
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    yAxisID: 'y1'
                }, {
                    label: 'Validation Accuracy',
                    data: trainingData.valAcc,
                    borderColor: '#20c997',
                    backgroundColor: 'rgba(32, 201, 151, 0.1)',
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Training Progress',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Epoch'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Loss'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Accuracy'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                },
                animation: this.animationOptions
            }
        };

        const chart = new Chart(ctx, config);
        this.charts.set(containerId, chart);
        this.chartConfigs.set(containerId, config);
        return chart;
    }

    // Create ROC curve chart
    createROCCurve(containerId, rocData) {
        const ctx = document.getElementById(containerId);
        if (!ctx) return null;

        const config = {
            type: 'line',
            data: {
                datasets: [{
                    label: 'ROC Curve',
                    data: rocData.points,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    fill: true,
                    tension: 0
                }, {
                    label: 'Random Classifier',
                    data: [{x: 0, y: 0}, {x: 1, y: 1}],
                    borderColor: '#6c757d',
                    borderDash: [5, 5],
                    fill: false,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `ROC Curve (AUC = ${rocData.auc.toFixed(3)})`,
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'False Positive Rate'
                        },
                        min: 0,
                        max: 1
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'True Positive Rate'
                        },
                        min: 0,
                        max: 1
                    }
                },
                animation: this.animationOptions
            }
        };

        const chart = new Chart(ctx, config);
        this.charts.set(containerId, chart);
        this.chartConfigs.set(containerId, config);
        return chart;
    }

    // Update real-time chart with new data
    updateRealtimeChart(chartId, newData) {
        const chart = this.charts.get(chartId);
        if (!chart) return;

        const now = new Date();
        
        // Add new data point
        chart.data.labels.push(now);
        chart.data.datasets[0].data.push(newData);

        // Remove old data points (keep last 50)
        if (chart.data.labels.length > 50) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
        }

        chart.update('none'); // Update without animation for real-time
    }

    // Generate datasets for radar chart
    generateDatasets(data) {
        const colors = [
            { border: '#007bff', background: 'rgba(0, 123, 255, 0.2)' },
            { border: '#28a745', background: 'rgba(40, 167, 69, 0.2)' },
            { border: '#dc3545', background: 'rgba(220, 53, 69, 0.2)' },
            { border: '#ffc107', background: 'rgba(255, 193, 7, 0.2)' },
            { border: '#17a2b8', background: 'rgba(23, 162, 184, 0.2)' }
        ];

        return data.map((item, index) => ({
            label: item.model,
            data: [
                item.accuracy || 0,
                item.precision || 0,
                item.recall || 0,
                item.f1Score || 0,
                item.speed || 0,
                item.robustness || 0
            ],
            borderColor: colors[index % colors.length].border,
            backgroundColor: colors[index % colors.length].background,
            pointBackgroundColor: colors[index % colors.length].border,
            pointBorderColor: '#ffffff',
            pointHoverBackgroundColor: '#ffffff',
            pointHoverBorderColor: colors[index % colors.length].border,
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
        }));
    }

    // Utility methods
    destroyChart(chartId) {
        const chart = this.charts.get(chartId);
        if (chart) {
            chart.destroy();
            this.charts.delete(chartId);
            this.chartConfigs.delete(chartId);
        }
    }

    destroyAllCharts() {
        this.charts.forEach((chart, id) => {
            chart.destroy();
        });
        this.charts.clear();
        this.chartConfigs.clear();
    }

    resizeChart(chartId) {
        const chart = this.charts.get(chartId);
        if (chart) {
            chart.resize();
        }
    }

    exportChart(chartId, format = 'png') {
        const chart = this.charts.get(chartId);
        if (chart) {
            const url = chart.toBase64Image();
            const link = document.createElement('a');
            link.download = `${chartId}.${format}`;
            link.href = url;
            link.click();
        }
    }

    // Get chart instance
    getChart(chartId) {
        return this.charts.get(chartId);
    }

    // Update chart theme
    updateChartTheme(theme) {
        const isDark = theme === 'dark';
        const textColor = isDark ? '#ffffff' : '#333333';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

        this.charts.forEach((chart) => {
            // Update text colors
            chart.options.plugins.title.color = textColor;
            chart.options.plugins.legend.labels.color = textColor;
            
            // Update scale colors
            Object.values(chart.options.scales || {}).forEach(scale => {
                if (scale.title) scale.title.color = textColor;
                if (scale.ticks) scale.ticks.color = textColor;
                if (scale.grid) scale.grid.color = gridColor;
            });

            chart.update();
        });
    }
}

// Export for dashboard use
window.AdvancedCharts = AdvancedCharts;