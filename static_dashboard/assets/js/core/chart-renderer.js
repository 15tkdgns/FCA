/**
 * Chart Renderer - Unified Plotting Engine
 * =======================================
 * Abstract rendering layer for all chart operations
 * with standardized configuration and error handling
 */

class ChartRenderer {
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
            margin: { t: 50, r: 30, b: 50, l: 60 },
            showlegend: true,
            legend: {
                x: 0.02,
                y: 0.98,
                bgcolor: 'rgba(255,255,255,0.8)'
            }
        };
        
        this.themes = {
            light: {
                background: '#ffffff',
                text: '#5a5c69',
                grid: '#e3e6f0',
                primary: '#4e73df',
                success: '#1cc88a',
                warning: '#f6c23e',
                danger: '#e74a3b'
            },
            dark: {
                background: '#2c2c54',
                text: '#ffffff',
                grid: '#40407a',
                primary: '#5b9bd5',
                success: '#70a1ff',
                warning: '#ffa502',
                danger: '#ff3838'
            }
        };
        
        this.currentTheme = 'light';
    }
    
    /**
     * Main render method - handles all chart types
     */
    async render(containerIds, traces, layout = {}, config = {}) {
        const containers = Array.isArray(containerIds) ? containerIds : [containerIds];
        const mergedLayout = this.mergeLayout(layout);
        const mergedConfig = this.mergeConfig(config);
        
        const results = [];
        
        for (const containerId of containers) {
            try {
                const container = this.getContainer(containerId);
                if (!container) {
                    console.warn(`⚠️ Container '${containerId}' not found`);
                    continue;
                }
                
                // Apply theme to layout
                const themedLayout = this.applyTheme(mergedLayout);
                
                // Render chart
                await Plotly.newPlot(container, traces, themedLayout, mergedConfig);
                
                // Add resize listener
                this.addResizeListener(container);
                
                results.push({ containerId, success: true });
                
            } catch (error) {
                console.error(`❌ Failed to render chart in '${containerId}':`, error);
                this.renderErrorFallback(containerId, error);
                results.push({ containerId, success: false, error: error.message });
            }
        }
        
        return results;
    }
    
    /**
     * Update existing chart
     */
    async update(containerId, traces, layout = {}) {
        try {
            const container = this.getContainer(containerId);
            if (!container) return false;
            
            const themedLayout = this.applyTheme(this.mergeLayout(layout));
            await Plotly.react(container, traces, themedLayout);
            return true;
            
        } catch (error) {
            console.error(`❌ Failed to update chart '${containerId}':`, error);
            return false;
        }
    }
    
    /**
     * Resize chart
     */
    async resize(containerId) {
        try {
            const container = this.getContainer(containerId);
            if (container && typeof Plotly.Plots.resize === 'function') {
                await Plotly.Plots.resize(container);
            }
        } catch (error) {
            console.warn(`⚠️ Failed to resize chart '${containerId}':`, error);
        }
    }
    
    /**
     * Clear chart
     */
    clear(containerId) {
        try {
            const container = this.getContainer(containerId);
            if (container) {
                Plotly.purge(container);
            }
        } catch (error) {
            console.warn(`⚠️ Failed to clear chart '${containerId}':`, error);
        }
    }
    
    /**
     * Export chart as image
     */
    async exportChart(containerId, format = 'png', filename = 'chart') {
        try {
            const container = this.getContainer(containerId);
            if (!container) return null;
            
            const image = await Plotly.toImage(container, {
                format: format,
                width: 800,
                height: 600,
                scale: 2
            });
            
            // Trigger download
            const link = document.createElement('a');
            link.download = `${filename}.${format}`;
            link.href = image;
            link.click();
            
            return image;
            
        } catch (error) {
            console.error(`❌ Failed to export chart '${containerId}':`, error);
            return null;
        }
    }
    
    /**
     * Configuration management
     */
    mergeLayout(layout) {
        return {
            ...this.defaultLayout,
            ...layout
        };
    }
    
    mergeConfig(config) {
        return {
            ...this.defaultConfig,
            ...config
        };
    }
    
    /**
     * Theme management
     */
    setTheme(theme) {
        if (this.themes[theme]) {
            this.currentTheme = theme;
        }
    }
    
    applyTheme(layout) {
        const theme = this.themes[this.currentTheme];
        
        return {
            ...layout,
            paper_bgcolor: theme.background,
            plot_bgcolor: theme.background,
            font: {
                ...layout.font,
                color: theme.text
            },
            xaxis: {
                ...layout.xaxis,
                gridcolor: theme.grid,
                linecolor: theme.text,
                tickcolor: theme.text,
                titlefont: { color: theme.text }
            },
            yaxis: {
                ...layout.yaxis,
                gridcolor: theme.grid,
                linecolor: theme.text,
                tickcolor: theme.text,
                titlefont: { color: theme.text }
            }
        };
    }
    
    /**
     * Utility methods
     */
    getContainer(containerId) {
        if (typeof containerId === 'string') {
            return document.getElementById(containerId);
        }
        return containerId; // Already a DOM element
    }
    
    addResizeListener(container) {
        if (!container._resizeListener) {
            const resizeHandler = () => this.resize(container.id);
            window.addEventListener('resize', resizeHandler);
            container._resizeListener = resizeHandler;
        }
    }
    
    renderErrorFallback(containerId, error) {
        const container = this.getContainer(containerId);
        if (container) {
            container.innerHTML = `
                <div class="text-center text-muted p-4">
                    <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                    <p>Failed to render chart</p>
                    <small>${error.message}</small>
                </div>
            `;
        }
    }
    
    /**
     * Common chart type factories
     */
    createBarTrace(data, options = {}) {
        return {
            type: 'bar',
            x: data.x,
            y: data.y,
            name: options.name || 'Data',
            marker: {
                color: options.color || this.themes[this.currentTheme].primary,
                opacity: options.opacity || 0.8
            },
            text: options.showValues ? data.y : undefined,
            textposition: options.textPosition || 'auto',
            ...options.trace
        };
    }
    
    createLineTrace(data, options = {}) {
        return {
            type: 'scatter',
            mode: 'lines+markers',
            x: data.x,
            y: data.y,
            name: options.name || 'Data',
            line: {
                color: options.color || this.themes[this.currentTheme].primary,
                width: options.lineWidth || 2
            },
            marker: {
                size: options.markerSize || 6,
                color: options.markerColor || options.color || this.themes[this.currentTheme].primary
            },
            ...options.trace
        };
    }
    
    createPieTrace(data, options = {}) {
        return {
            type: 'pie',
            labels: data.labels,
            values: data.values,
            name: options.name || 'Data',
            marker: {
                colors: options.colors || this.getDefaultColors()
            },
            textinfo: options.textInfo || 'label+percent',
            hovertemplate: options.hoverTemplate || '<b>%{label}</b><br>%{value}<br>%{percent}<extra></extra>',
            ...options.trace
        };
    }
    
    createHeatmapTrace(data, options = {}) {
        return {
            type: 'heatmap',
            z: data.z,
            x: data.x,
            y: data.y,
            colorscale: options.colorscale || 'Viridis',
            showscale: options.showColorbar !== false,
            hovertemplate: options.hoverTemplate || '<b>%{y} - %{x}</b><br>Value: %{z}<extra></extra>',
            ...options.trace
        };
    }
    
    getDefaultColors() {
        const theme = this.themes[this.currentTheme];
        return [theme.primary, theme.success, theme.warning, theme.danger, '#6f42c1', '#20c997', '#fd7e14'];
    }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartRenderer;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.ChartRenderer = ChartRenderer;
}