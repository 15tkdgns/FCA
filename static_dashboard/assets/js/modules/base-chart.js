/**
 * Base Chart Module
 * =================
 * 
 * Base class for all chart components using Plotly.js
 * Refactored to use CommonUtils for reduced duplication
 */

export class BaseChart {
    constructor(containerId, themeManager) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.themeManager = themeManager;
        this.plotlyInstance = null;
        this.isRendered = false;
        
        if (!this.container) {
            throw new Error(`Chart container not found: ${containerId}`);
        }

        this.defaultConfig = {
            ...CommonUtils.chart.getDefaultConfig(),
            displayModeBar: true,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
            toImageButtonOptions: {
                format: 'png',
                filename: `fca_${containerId}`,
                height: 500,
                width: 700,
                scale: 1
            }
        };

        this.setupThemeListener();
    }

    /**
     * Setup theme change listener
     */
    setupThemeListener() {
        if (this.themeManager) {
            this.themeManager.onThemeChange((newTheme, oldTheme) => {
                if (this.isRendered) {
                    this.updateTheme(newTheme);
                }
            });
        }
    }

    /**
     * Get base layout configuration
     */
    getBaseLayout() {
        const themeConfig = this.themeManager?.getThemeConfig() || {
            background: '#ffffff',
            text: '#5a5c69',
            border: '#e3e6f0'
        };

        return {
            font: {
                family: "'Nunito', sans-serif",
                size: 12,
                color: themeConfig.text
            },
            plot_bgcolor: 'rgba(0,0,0,0)',
            paper_bgcolor: 'rgba(0,0,0,0)',
            margin: { t: 50, r: 30, b: 50, l: 50 },
            showlegend: true,
            legend: {
                orientation: 'h',
                yanchor: 'bottom',
                y: -0.2,
                xanchor: 'center',
                x: 0.5,
                font: { color: themeConfig.text }
            },
            hoverlabel: {
                bgcolor: themeConfig.surface || '#f8f9fc',
                bordercolor: themeConfig.border,
                font: { color: themeConfig.text }
            }
        };
    }

    /**
     * Get theme-aware colors
     */
    getColors() {
        const themeConfig = this.themeManager?.getThemeConfig();
        
        if (themeConfig) {
            return [
                themeConfig.primary,
                themeConfig.accent,
                ...CommonUtils.chart.getDefaultColors().slice(2)
            ];
        }

        return CommonUtils.chart.getDefaultColors();
    }

    /**
     * Render chart with data
     * @param {Array} data - Plotly data array
     * @param {Object} layout - Plotly layout object
     * @param {Object} config - Plotly config object
     */
    async render(data, layout = {}, config = {}) {
        try {
            this.showLoading();

            const finalLayout = { ...this.getBaseLayout(), ...layout };
            const finalConfig = { ...this.defaultConfig, ...config };

            // Apply theme colors to data if not specified
            data = this.applyThemeColors(data);

            if (this.plotlyInstance) {
                // Update existing chart
                await Plotly.react(this.container, data, finalLayout, finalConfig);
            } else {
                // Create new chart
                this.plotlyInstance = await Plotly.newPlot(
                    this.container, 
                    data, 
                    finalLayout, 
                    finalConfig
                );
            }

            this.isRendered = true;
            this.hideLoading();
            
            CommonUtils.log.info(`Chart rendered: ${this.containerId}`, 'BaseChart');

        } catch (error) {
            this.hideLoading();
            this.showError(`Chart rendering failed: ${error.message}`);
            CommonUtils.log.error(`Chart render error (${this.containerId})`, error, 'BaseChart');
        }
    }

    /**
     * Apply theme colors to chart data
     */
    applyThemeColors(data) {
        const colors = this.getColors();
        
        return data.map((trace, index) => {
            if (!trace.marker && !trace.line) {
                trace.marker = { color: colors[index % colors.length] };
            } else if (trace.marker && !trace.marker.color) {
                trace.marker.color = colors[index % colors.length];
            } else if (trace.line && !trace.line.color) {
                trace.line.color = colors[index % colors.length];
            }
            
            return trace;
        });
    }

    /**
     * Update chart theme
     */
    updateTheme(theme) {
        if (!this.isRendered || !this.plotlyInstance) return;

        const newLayout = this.getBaseLayout();
        Plotly.relayout(this.container, newLayout);
        
        CommonUtils.log.info(`Chart theme updated: ${this.containerId}`, 'BaseChart');
    }

    /**
     * Resize chart
     */
    resize() {
        if (this.isRendered && this.plotlyInstance) {
            Plotly.Plots.resize(this.container);
        }
    }

    /**
     * Show loading indicator
     */
    showLoading() {
        CommonUtils.chart.showLoadingState(this.containerId);
    }

    /**
     * Hide loading indicator
     */
    hideLoading() {
        const loading = this.container.querySelector('.chart-loading');
        if (loading) {
            loading.remove();
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        CommonUtils.chart.showErrorState(this.containerId, new Error(message));
    }

    /**
     * Clear chart
     */
    clear() {
        if (this.plotlyInstance) {
            Plotly.purge(this.container);
            this.plotlyInstance = null;
            this.isRendered = false;
        }
    }

    /**
     * Download chart as image
     * @param {string} format - Image format (png, jpeg, pdf, svg)
     * @param {string} filename - Download filename
     */
    async downloadImage(format = 'png', filename = null) {
        if (!this.isRendered) return;

        try {
            const downloadFilename = filename || `fca_${this.containerId}_${Date.now()}`;
            
            await Plotly.downloadImage(this.container, {
                format: format,
                filename: downloadFilename,
                height: 600,
                width: 900,
                scale: 2
            });

            CommonUtils.log.info(`Chart downloaded: ${downloadFilename}.${format}`, 'BaseChart');

        } catch (error) {
            CommonUtils.log.error('Chart download failed', error, 'BaseChart');
        }
    }

    /**
     * Get chart data
     */
    getData() {
        return this.plotlyInstance?.data || [];
    }

    /**
     * Get chart layout
     */
    getLayout() {
        return this.plotlyInstance?.layout || {};
    }

    /**
     * Check if chart is rendered
     */
    isChartRendered() {
        return this.isRendered;
    }

    /**
     * Destroy chart instance
     */
    destroy() {
        this.clear();
        this.container = null;
    }
}