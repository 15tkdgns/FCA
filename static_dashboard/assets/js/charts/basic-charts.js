/**
 * Basic Charts Module
 * ==================
 * Standard chart types: bar, line, pie, scatter
 * Extracted from monolithic charts.js for better modularity
 */

class BasicCharts {
    constructor(renderer) {
        this.renderer = renderer || new ChartRenderer();
    }
    
    /**
     * Render bar chart
     */
    renderBarChart(data, containerIds = [], options = {}) {
        const trace = this.renderer.createBarTrace(data, {
            name: options.name || 'Bar Chart',
            color: options.color,
            showValues: options.showValues,
            ...options
        });
        
        const layout = {
            title: {
                text: options.title || 'Bar Chart',
                font: { size: 16, color: '#5a5c69' }
            },
            xaxis: {
                title: options.xTitle || 'X Axis',
                tickangle: options.xTickAngle || 0
            },
            yaxis: {
                title: options.yTitle || 'Y Axis'
            },
            height: options.height || 350,
            ...options.layout
        };
        
        return this.renderer.render(containerIds, [trace], layout, options.config);
    }
    
    /**
     * Render horizontal bar chart
     */
    renderHorizontalBarChart(data, containerIds = [], options = {}) {
        const trace = {
            type: 'bar',
            orientation: 'h',
            x: data.y, // Swapped for horizontal
            y: data.x, // Swapped for horizontal
            name: options.name || 'Horizontal Bar',
            marker: {
                color: options.color || this.renderer.themes[this.renderer.currentTheme].primary,
                opacity: 0.8
            },
            text: options.showValues ? data.y : undefined,
            textposition: 'auto'
        };
        
        const layout = {
            title: {
                text: options.title || 'Horizontal Bar Chart',
                font: { size: 16, color: '#5a5c69' }
            },
            xaxis: {
                title: options.xTitle || 'Value'
            },
            yaxis: {
                title: options.yTitle || 'Category',
                automargin: true
            },
            height: options.height || 350,
            ...options.layout
        };
        
        return this.renderer.render(containerIds, [trace], layout, options.config);
    }
    
    /**
     * Render line chart
     */
    renderLineChart(data, containerIds = [], options = {}) {
        const trace = this.renderer.createLineTrace(data, {
            name: options.name || 'Line Chart',
            color: options.color,
            lineWidth: options.lineWidth,
            markerSize: options.markerSize,
            ...options
        });
        
        const layout = {
            title: {
                text: options.title || 'Line Chart',
                font: { size: 16, color: '#5a5c69' }
            },
            xaxis: {
                title: options.xTitle || 'X Axis',
                type: options.xType || 'linear'
            },
            yaxis: {
                title: options.yTitle || 'Y Axis',
                type: options.yType || 'linear'
            },
            height: options.height || 350,
            ...options.layout
        };
        
        return this.renderer.render(containerIds, [trace], layout, options.config);
    }
    
    /**
     * Render multi-line chart
     */
    renderMultiLineChart(datasets, containerIds = [], options = {}) {
        const traces = datasets.map((dataset, index) => {
            const colors = this.renderer.getDefaultColors();
            return this.renderer.createLineTrace(dataset, {
                name: dataset.name || `Series ${index + 1}`,
                color: colors[index % colors.length],
                ...options.traceOptions
            });
        });
        
        const layout = {
            title: {
                text: options.title || 'Multi-Line Chart',
                font: { size: 16, color: '#5a5c69' }
            },
            xaxis: {
                title: options.xTitle || 'X Axis'
            },
            yaxis: {
                title: options.yTitle || 'Y Axis'
            },
            height: options.height || 350,
            legend: {
                x: 0.02,
                y: 0.98,
                bgcolor: 'rgba(255,255,255,0.8)'
            },
            ...options.layout
        };
        
        return this.renderer.render(containerIds, traces, layout, options.config);
    }
    
    /**
     * Render pie chart
     */
    renderPieChart(data, containerIds = [], options = {}) {
        const trace = this.renderer.createPieTrace(data, {
            name: options.name || 'Pie Chart',
            colors: options.colors,
            textInfo: options.textInfo,
            hoverTemplate: options.hoverTemplate,
            ...options
        });
        
        const layout = {
            title: {
                text: options.title || 'Pie Chart',
                font: { size: 16, color: '#5a5c69' }
            },
            height: options.height || 350,
            showlegend: options.showLegend !== false,
            ...options.layout
        };
        
        return this.renderer.render(containerIds, [trace], layout, options.config);
    }
    
    /**
     * Render donut chart
     */
    renderDonutChart(data, containerIds = [], options = {}) {
        const trace = this.renderer.createPieTrace(data, {
            hole: options.holeSize || 0.4,
            name: options.name || 'Donut Chart',
            colors: options.colors,
            textInfo: options.textInfo || 'label+percent',
            ...options
        });
        
        const layout = {
            title: {
                text: options.title || 'Donut Chart',
                font: { size: 16, color: '#5a5c69' }
            },
            height: options.height || 350,
            showlegend: options.showLegend !== false,
            annotations: options.centerText ? [{
                text: options.centerText,
                x: 0.5, y: 0.5,
                font: { size: 20 },
                showarrow: false
            }] : [],
            ...options.layout
        };
        
        return this.renderer.render(containerIds, [trace], layout, options.config);
    }
    
    /**
     * Render scatter plot
     */
    renderScatterPlot(data, containerIds = [], options = {}) {
        const trace = {
            type: 'scatter',
            mode: 'markers',
            x: data.x,
            y: data.y,
            name: options.name || 'Scatter Plot',
            marker: {
                size: options.markerSize || 8,
                color: data.colors || options.color || this.renderer.themes[this.renderer.currentTheme].primary,
                opacity: options.opacity || 0.7,
                colorscale: options.colorscale,
                showscale: options.showColorbar || false,
                colorbar: options.colorbar || {}
            },
            text: data.text,
            hovertemplate: options.hoverTemplate || '<b>(%{x}, %{y})</b><extra></extra>'
        };
        
        const layout = {
            title: {
                text: options.title || 'Scatter Plot',
                font: { size: 16, color: '#5a5c69' }
            },
            xaxis: {
                title: options.xTitle || 'X Axis'
            },
            yaxis: {
                title: options.yTitle || 'Y Axis'
            },
            height: options.height || 350,
            ...options.layout
        };
        
        return this.renderer.render(containerIds, [trace], layout, options.config);
    }
    
    /**
     * Render bubble chart
     */
    renderBubbleChart(data, containerIds = [], options = {}) {
        const trace = {
            type: 'scatter',
            mode: 'markers',
            x: data.x,
            y: data.y,
            name: options.name || 'Bubble Chart',
            marker: {
                size: data.size || options.defaultSize || 20,
                sizemode: 'diameter',
                sizeref: options.sizeRef || 1,
                sizemin: options.sizeMin || 4,
                color: data.colors || options.color || this.renderer.themes[this.renderer.currentTheme].primary,
                opacity: options.opacity || 0.7,
                line: {
                    color: options.borderColor || '#ffffff',
                    width: options.borderWidth || 1
                }
            },
            text: data.text,
            hovertemplate: options.hoverTemplate || '<b>%{text}</b><br>X: %{x}<br>Y: %{y}<br>Size: %{marker.size}<extra></extra>'
        };
        
        const layout = {
            title: {
                text: options.title || 'Bubble Chart',
                font: { size: 16, color: '#5a5c69' }
            },
            xaxis: {
                title: options.xTitle || 'X Axis'
            },
            yaxis: {
                title: options.yTitle || 'Y Axis'
            },
            height: options.height || 350,
            ...options.layout
        };
        
        return this.renderer.render(containerIds, [trace], layout, options.config);
    }
    
    /**
     * Render stacked bar chart
     */
    renderStackedBarChart(datasets, containerIds = [], options = {}) {
        const colors = this.renderer.getDefaultColors();
        const traces = datasets.map((dataset, index) => ({
            type: 'bar',
            name: dataset.name || `Series ${index + 1}`,
            x: dataset.x,
            y: dataset.y,
            marker: {
                color: colors[index % colors.length],
                opacity: 0.8
            }
        }));
        
        const layout = {
            title: {
                text: options.title || 'Stacked Bar Chart',
                font: { size: 16, color: '#5a5c69' }
            },
            xaxis: {
                title: options.xTitle || 'X Axis'
            },
            yaxis: {
                title: options.yTitle || 'Y Axis'
            },
            barmode: 'stack',
            height: options.height || 350,
            legend: {
                x: 0.02,
                y: 0.98,
                bgcolor: 'rgba(255,255,255,0.8)'
            },
            ...options.layout
        };
        
        return this.renderer.render(containerIds, traces, layout, options.config);
    }
    
    /**
     * Render grouped bar chart
     */
    renderGroupedBarChart(datasets, containerIds = [], options = {}) {
        const colors = this.renderer.getDefaultColors();
        const traces = datasets.map((dataset, index) => ({
            type: 'bar',
            name: dataset.name || `Series ${index + 1}`,
            x: dataset.x,
            y: dataset.y,
            marker: {
                color: colors[index % colors.length],
                opacity: 0.8
            }
        }));
        
        const layout = {
            title: {
                text: options.title || 'Grouped Bar Chart',
                font: { size: 16, color: '#5a5c69' }
            },
            xaxis: {
                title: options.xTitle || 'X Axis'
            },
            yaxis: {
                title: options.yTitle || 'Y Axis'
            },
            barmode: 'group',
            height: options.height || 350,
            legend: {
                x: 0.02,
                y: 0.98,
                bgcolor: 'rgba(255,255,255,0.8)'
            },
            ...options.layout
        };
        
        return this.renderer.render(containerIds, traces, layout, options.config);
    }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BasicCharts;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.BasicCharts = BasicCharts;
}