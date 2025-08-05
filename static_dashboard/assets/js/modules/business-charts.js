/**
 * Business Charts Module
 * ======================
 * 
 * Charts for business insights and analytics
 */

import { BaseChart } from './base-chart.js';

export class BusinessCharts extends BaseChart {
    /**
     * Render fraud risk distribution pie chart
     */
    async renderFraudRiskDistribution(data) {
        if (!data?.risk_distribution) {
            this.showError('No fraud risk distribution data available');
            return;
        }

        const dist = data.risk_distribution;
        const colors = this.getColors();

        const chartData = [{
            values: [dist.low, dist.medium, dist.high],
            labels: ['Low Risk', 'Medium Risk', 'High Risk'],
            type: 'pie',
            marker: {
                colors: [colors[1], colors[3], colors[4]], // Green, Yellow, Red
                line: {
                    color: '#ffffff',
                    width: 2
                }
            },
            textinfo: 'label+percent+value',
            textposition: 'auto',
            hovertemplate: '<b>%{label}</b><br>' +
                          'Count: %{value}<br>' +
                          'Percentage: %{percent}<br>' +
                          '<extra></extra>'
        }];

        const layout = {
            title: {
                text: 'Fraud Risk Distribution',
                font: { size: 16, weight: 'bold' }
            },
            showlegend: true,
            legend: {
                orientation: 'v',
                x: 1.02,
                y: 0.5
            }
        };

        await this.render(chartData, layout);
    }

    /**
     * Render sentiment distribution chart
     */
    async renderSentimentDistribution(data) {
        if (!data?.sentiment_distribution) {
            this.showError('No sentiment distribution data available');
            return;
        }

        const dist = data.sentiment_distribution;
        const colors = this.getColors();

        const chartData = [{
            x: ['Positive', 'Neutral', 'Negative'],
            y: [dist.positive, dist.neutral, dist.negative],
            type: 'bar',
            marker: {
                color: [colors[1], colors[2], colors[4]], // Green, Blue, Red
                opacity: 0.8
            },
            text: [
                `${dist.positive} (${((dist.positive / dist.total) * 100).toFixed(1)}%)`,
                `${dist.neutral} (${((dist.neutral / dist.total) * 100).toFixed(1)}%)`,
                `${dist.negative} (${((dist.negative / dist.total) * 100).toFixed(1)}%)`
            ],
            textposition: 'auto',
            hovertemplate: '<b>%{x}</b><br>' +
                          'Count: %{y}<br>' +
                          'Percentage: %{text}<br>' +
                          '<extra></extra>'
        }];

        const layout = {
            title: {
                text: 'Sentiment Analysis Distribution',
                font: { size: 16, weight: 'bold' }
            },
            xaxis: {
                title: 'Sentiment Categories'
            },
            yaxis: {
                title: 'Number of Texts'
            },
            showlegend: false
        };

        await this.render(chartData, layout);
    }

    /**
     * Render customer segments chart
     */
    async renderCustomerSegments(data) {
        if (!data?.customer_segments) {
            this.showError('No customer segments data available');
            return;
        }

        const segments = data.customer_segments;
        const colors = this.getColors();

        const chartData = [{
            values: segments.map(s => s.count),
            labels: segments.map(s => s.name),
            type: 'pie',
            marker: {
                colors: colors,
                line: {
                    color: '#ffffff',
                    width: 2
                }
            },
            textinfo: 'label+percent',
            textposition: 'auto',
            hovertemplate: '<b>%{label}</b><br>' +
                          'Customers: %{value}<br>' +
                          'Percentage: %{percent}<br>' +
                          '<extra></extra>'
        }];

        const layout = {
            title: {
                text: 'Customer Segmentation',
                font: { size: 16, weight: 'bold' }
            },
            showlegend: true,
            legend: {
                orientation: 'v',
                x: 1.02,
                y: 0.5
            }
        };

        await this.render(chartData, layout);
    }

    /**
     * Render time series trend chart
     */
    async renderTimeSeriesTrend(data) {
        if (!data?.time_series) {
            this.showError('No time series data available');
            return;
        }

        const series = data.time_series;
        const colors = this.getColors();
        const chartData = [];

        // Add multiple time series if available
        Object.keys(series).forEach((key, index) => {
            const seriesData = series[key];
            chartData.push({
                x: seriesData.dates,
                y: seriesData.values,
                type: 'scatter',
                mode: 'lines+markers',
                name: key.charAt(0).toUpperCase() + key.slice(1),
                line: {
                    color: colors[index % colors.length],
                    width: 3
                },
                marker: {
                    size: 6,
                    color: colors[index % colors.length]
                },
                hovertemplate: '<b>%{fullData.name}</b><br>' +
                              'Date: %{x}<br>' +
                              'Value: %{y}<br>' +
                              '<extra></extra>'
            });
        });

        const layout = {
            title: {
                text: 'Trend Analysis Over Time',
                font: { size: 16, weight: 'bold' }
            },
            xaxis: {
                title: 'Date',
                type: 'date'
            },
            yaxis: {
                title: 'Value'
            },
            hovermode: 'x unified'
        };

        await this.render(chartData, layout);
    }

    /**
     * Render geographic distribution map
     */
    async renderGeographicDistribution(data) {
        if (!data?.geographic_data) {
            this.showError('No geographic data available');
            return;
        }

        const geoData = data.geographic_data;
        const colors = this.getColors();

        const chartData = [{
            type: 'choropleth',
            locations: geoData.map(d => d.code),
            z: geoData.map(d => d.value),
            text: geoData.map(d => d.name),
            colorscale: [
                [0, '#f8f9fc'],
                [1, colors[0]]
            ],
            showscale: true,
            hovertemplate: '<b>%{text}</b><br>' +
                          'Value: %{z}<br>' +
                          '<extra></extra>'
        }];

        const layout = {
            title: {
                text: 'Geographic Distribution',
                font: { size: 16, weight: 'bold' }
            },
            geo: {
                showframe: false,
                showcoastlines: true,
                projection: { type: 'mercator' }
            }
        };

        await this.render(chartData, layout);
    }

    /**
     * Render correlation matrix heatmap
     */
    async renderCorrelationMatrix(data) {
        if (!data?.correlation_matrix) {
            this.showError('No correlation matrix data available');
            return;
        }

        const matrix = data.correlation_matrix;
        const features = data.feature_names || [];

        const chartData = [{
            z: matrix,
            x: features,
            y: features,
            type: 'heatmap',
            colorscale: [
                [0, '#d32f2f'],
                [0.5, '#ffffff'],
                [1, '#1976d2']
            ],
            zmid: 0,
            showscale: true,
            text: matrix.map(row => 
                row.map(val => val.toFixed(2))
            ),
            texttemplate: '%{text}',
            textfont: { size: 10 },
            hovertemplate: 'Feature 1: %{x}<br>' +
                          'Feature 2: %{y}<br>' +
                          'Correlation: %{z:.3f}<br>' +
                          '<extra></extra>'
        }];

        const layout = {
            title: {
                text: 'Feature Correlation Matrix',
                font: { size: 16, weight: 'bold' }
            },
            xaxis: {
                title: 'Features',
                tickangle: 45
            },
            yaxis: {
                title: 'Features',
                autorange: 'reversed'
            },
            margin: { l: 100, b: 100 }
        };

        await this.render(chartData, layout);
    }

    /**
     * Render performance metrics radar chart
     */
    async renderPerformanceRadar(data) {
        if (!data?.metrics) {
            this.showError('No performance metrics data available');
            return;
        }

        const metrics = data.metrics;
        const colors = this.getColors();

        const chartData = [{
            type: 'scatterpolar',
            r: Object.values(metrics),
            theta: Object.keys(metrics).map(key => 
                key.charAt(0).toUpperCase() + key.slice(1)
            ),
            fill: 'toself',
            name: 'Performance Metrics',
            marker: {
                color: colors[0],
                size: 8
            },
            line: {
                color: colors[0],
                width: 3
            },
            fillcolor: colors[0].replace(')', ', 0.3)').replace('rgb', 'rgba'),
            hovertemplate: '<b>%{theta}</b><br>' +
                          'Score: %{r:.3f}<br>' +
                          '<extra></extra>'
        }];

        const layout = {
            title: {
                text: 'Model Performance Radar',
                font: { size: 16, weight: 'bold' }
            },
            polar: {
                radialaxis: {
                    visible: true,
                    range: [0, 1]
                }
            },
            showlegend: false
        };

        await this.render(chartData, layout);
    }
}