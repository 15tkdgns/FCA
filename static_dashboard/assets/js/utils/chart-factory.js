/**
 * Chart Factory
 * ==============
 * 
 * Centralized chart creation to reduce code duplication
 * and provide consistent chart styling and behavior.
 */

class ChartFactory {
    constructor() {
        // Safe initialization with fallback
        if (typeof CommonUtils !== 'undefined' && CommonUtils.chart) {
            this.defaultColors = CommonUtils.chart.getDefaultColors();
            this.defaultConfig = CommonUtils.chart.getDefaultConfig();
        } else {
            // Fallback defaults
            this.defaultColors = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b'];
            this.defaultConfig = {
                responsive: true,
                displayModeBar: true,
                displaylogo: false
            };
        }
    }

    /**
     * Create a standardized pie chart
     */
    async createPieChart(containerId, data, options = {}) {
        const trace = {
            type: 'pie',
            labels: data.labels || [],
            values: data.values || [],
            marker: {
                colors: options.colors || this.defaultColors,
                line: { color: '#ffffff', width: 2 }
            },
            textinfo: options.textinfo || 'label+percent',
            hovertemplate: options.hovertemplate || '<b>%{label}</b><br>Value: %{value}<br>Ratio: %{percent}<extra></extra>',
            showlegend: options.showlegend !== false
        };

        const layout = {
            ...CommonUtils.chart.getDefaultLayout(options.title || ''),
            showlegend: options.showlegend !== false,
            margin: { t: 60, r: 30, b: 30, l: 30 }
        };

        return this.renderChart(containerId, [trace], layout, options);
    }

    /**
     * Create a standardized bar chart
     */
    async createBarChart(containerId, data, options = {}) {
        const trace = {
            type: 'bar',
            x: data.x || [],
            y: data.y || [],
            marker: {
                color: options.color || this.defaultColors[0],
                opacity: options.opacity || 0.8,
                line: { color: '#ffffff', width: 1 }
            },
            hovertemplate: options.hovertemplate || '<b>%{x}</b><br>Value: %{y}<extra></extra>'
        };

        const layout = {
            ...CommonUtils.chart.getDefaultLayout(options.title || ''),
            xaxis: { title: options.xTitle || 'Category' },
            yaxis: { title: options.yTitle || 'Value' }
        };

        return this.renderChart(containerId, [trace], layout, options);
    }

    /**
     * Create a standardized line chart
     */
    async createLineChart(containerId, data, options = {}) {
        const trace = {
            type: 'scatter',
            mode: 'lines+markers',
            x: data.x || [],
            y: data.y || [],
            line: { 
                color: options.color || this.defaultColors[0], 
                width: options.lineWidth || 3 
            },
            marker: { 
                size: options.markerSize || 6,
                color: options.markerColor || options.color || this.defaultColors[0]
            },
            hovertemplate: options.hovertemplate || '<b>%{x}</b><br>Value: %{y}<extra></extra>'
        };

        const layout = {
            ...CommonUtils.chart.getDefaultLayout(options.title || ''),
            xaxis: { title: options.xTitle || 'X Axis' },
            yaxis: { title: options.yTitle || 'Y Axis' }
        };

        return this.renderChart(containerId, [trace], layout, options);
    }

    /**
     * Create a standardized heatmap chart
     */
    async createHeatmapChart(containerId, data, options = {}) {
        const trace = {
            type: 'heatmap',
            z: data.z || [],
            x: data.x || [],
            y: data.y || [],
            colorscale: options.colorscale || 'RdYlBu',
            hovertemplate: options.hovertemplate || '<b>X: %{x}</b><br>Y: %{y}<br>Value: %{z}<extra></extra>'
        };

        const layout = {
            ...CommonUtils.chart.getDefaultLayout(options.title || ''),
            xaxis: { title: options.xTitle || 'X Axis' },
            yaxis: { title: options.yTitle || 'Y Axis' }
        };

        return this.renderChart(containerId, [trace], layout, options);
    }

    /**
     * Create XAI LIME chart
     */
    async createLIMEChart(containerId, data, options = {}) {
        const features = data.features || [];
        
        const trace = {
            type: 'bar',
            orientation: 'h',
            x: features.map(f => f.impact),
            y: features.map(f => f.name),
            marker: {
                color: features.map(f => f.impact > 0 ? this.defaultColors[4] : this.defaultColors[1]),
                opacity: 0.8,
                line: { color: '#ffffff', width: 1 }
            },
            text: features.map(f => `${f.impact > 0 ? '+' : ''}${f.impact.toFixed(3)}`),
            textposition: 'auto',
            hovertemplate: '<b>%{y}</b><br>Impact: %{text}<extra></extra>'
        };

        const layout = {
            title: {
                text: options.title || 'LIME Local Explanation',
                font: { size: 16, color: '#5a5c69' }
            },
            font: {
                family: "'Nunito', sans-serif",
                size: 12
            },
            plot_bgcolor: 'rgba(0,0,0,0)',
            paper_bgcolor: 'rgba(0,0,0,0)',
            xaxis: {
                title: 'Feature Impact',
                zeroline: true,
                zerolinecolor: '#666',
                zerolinewidth: 2
            },
            yaxis: {
                title: 'Features',
                automargin: true
            },
            margin: { t: 60, r: 30, b: 50, l: 150 }
        };

        return this.renderChart(containerId, [trace], layout, options);
    }

    /**
     * Create scatter plot chart
     */
    async createScatterChart(containerId, data, options = {}) {
        const trace = {
            type: 'scatter',
            mode: 'markers+text',
            x: data.x || [],
            y: data.y || [],
            text: data.text || [],
            textposition: 'top center',
            marker: {
                size: options.markerSize || 12,
                color: options.color || this.defaultColors[0],
                opacity: 0.8,
                line: { color: '#ffffff', width: 1 }
            },
            hovertemplate: '<b>%{text}</b><br>X: %{x}<br>Y: %{y}<extra></extra>'
        };

        const layout = {
            ...CommonUtils.chart.getDefaultLayout(options.title || 'Scatter Plot'),
            xaxis: {
                title: options.xTitle || 'X Axis',
                showgrid: true
            },
            yaxis: {
                title: options.yTitle || 'Y Axis',
                showgrid: true
            },
            margin: { t: 60, r: 30, b: 50, l: 60 }
        };

        return this.renderChart(containerId, [trace], layout, options);
    }

    /**
     * Generic chart renderer with error handling and loading states
     */
    async renderChart(containerId, data, layout, options = {}) {
        try {
            // Show loading state if CommonUtils available
            if (typeof CommonUtils !== 'undefined' && CommonUtils.chart) {
                CommonUtils.chart.showLoadingState(containerId);
            }
            
            // Add small delay for better UX
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Render chart
            const result = await Plotly.newPlot(containerId, data, layout, this.defaultConfig);
            
            // Log success if CommonUtils available
            if (typeof CommonUtils !== 'undefined' && CommonUtils.log) {
                CommonUtils.log.info(`Chart rendered successfully: ${containerId}`, 'ChartFactory');
            } else {
                console.log(`✅ Chart rendered successfully: ${containerId}`);
            }
            
            return result;
            
        } catch (error) {
            // Handle error
            if (typeof CommonUtils !== 'undefined' && CommonUtils.chart) {
                CommonUtils.chart.showErrorState(containerId, error);
            } else {
                // Fallback error display
                const container = document.getElementById(containerId);
                if (container) {
                    container.innerHTML = `<div class="alert alert-danger">Chart rendering failed: ${error.message}</div>`;
                }
            }
            
            if (typeof CommonUtils !== 'undefined' && CommonUtils.log) {
                CommonUtils.log.error(`Chart rendering failed: ${containerId}`, error, 'ChartFactory');
            } else {
                console.error(`❌ Chart rendering failed: ${containerId}`, error);
            }
            
            throw error;
        }
    }

    /**
     * Create chart with retry logic
     */
    async createChartWithRetry(chartType, containerId, data, options = {}, maxRetries = 2) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
            try {
                CommonUtils.log.debug(`Chart creation attempt ${attempt}/${maxRetries + 1}: ${containerId}`, 'ChartFactory');
                
                switch (chartType) {
                    case 'pie':
                        return await this.createPieChart(containerId, data, options);
                    case 'bar':
                        return await this.createBarChart(containerId, data, options);
                    case 'line':
                        return await this.createLineChart(containerId, data, options);
                    case 'heatmap':
                        return await this.createHeatmapChart(containerId, data, options);
                    case 'scatter':
                        return await this.createScatterChart(containerId, data, options);
                    case 'lime':
                        return await this.createLIMEChart(containerId, data, options);
                    default:
                        throw new Error(`Unknown chart type: ${chartType}`);
                }
                
            } catch (error) {
                lastError = error;
                
                if (attempt <= maxRetries) {
                    CommonUtils.log.warn(`Chart creation failed, retrying... (${attempt}/${maxRetries})`, 'ChartFactory');
                    await CommonUtils.delay(1000 * attempt); // Exponential backoff
                } else {
                    CommonUtils.log.error(`Chart creation failed after ${maxRetries + 1} attempts`, error, 'ChartFactory');
                }
            }
        }
        
        throw lastError;
    }

    /**
     * Update existing chart
     */
    async updateChart(containerId, newData, newLayout = {}) {
        try {
            const result = await Plotly.react(containerId, newData, newLayout);
            CommonUtils.log.info(`Chart updated successfully: ${containerId}`, 'ChartFactory');
            return result;
        } catch (error) {
            CommonUtils.log.error(`Chart update failed: ${containerId}`, error, 'ChartFactory');
            throw error;
        }
    }

    /**
     * Clear and destroy chart
     */
    clearChart(containerId) {
        try {
            Plotly.purge(containerId);
            CommonUtils.log.info(`Chart cleared: ${containerId}`, 'ChartFactory');
        } catch (error) {
            CommonUtils.log.error(`Chart clearing failed: ${containerId}`, error, 'ChartFactory');
        }
    }
}

// Global instance
window.ChartFactory = new ChartFactory();