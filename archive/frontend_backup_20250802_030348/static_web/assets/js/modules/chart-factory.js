// FCA Chart Factory Module - Centralized chart creation and management

export class ChartFactory {
    constructor() {
        this.chartInstances = new Map();
        this.chartConfigs = new Map();
        this.themeManager = null;
    }

    // Set theme manager
    setThemeManager(themeManager) {
        this.themeManager = themeManager;
    }

    // Register chart configuration
    registerChartConfig(chartType, config) {
        this.chartConfigs.set(chartType, config);
    }

    // Create chart with specified type and data
    async createChart(containerId, chartType, data, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container element not found: ${containerId}`);
        }

        // Get chart configuration
        const config = this.chartConfigs.get(chartType);
        if (!config) {
            throw new Error(`Unknown chart type: ${chartType}`);
        }

        // Apply theme if available
        let finalConfig = { ...config };
        if (this.themeManager) {
            finalConfig = this.themeManager.applyTheme(finalConfig, options.theme);
        }

        // Merge with custom options
        finalConfig = this._mergeDeep(finalConfig, options);

        // Create chart instance
        const chartInstance = await this._createChartInstance(container, chartType, data, finalConfig);
        
        // Store instance for management
        this.chartInstances.set(containerId, {
            instance: chartInstance,
            type: chartType,
            data: data,
            config: finalConfig
        });

        return chartInstance;
    }

    // Create chart instance based on type
    async _createChartInstance(container, chartType, data, config) {
        switch (chartType) {
            case 'plotly':
                return this._createPlotlyChart(container, data, config);
            case 'chartjs':
                return this._createChartjsChart(container, data, config);
            case 'academic':
                return this._createAcademicChart(container, data, config);
            default:
                throw new Error(`Unsupported chart library: ${chartType}`);
        }
    }

    // Create Plotly chart
    async _createPlotlyChart(container, data, config) {
        if (typeof Plotly === 'undefined') {
            throw new Error('Plotly library not loaded');
        }

        await Plotly.newPlot(container, data.traces || [data], config.layout || {}, config.options || {});
        return {
            type: 'plotly',
            container,
            data,
            config,
            update: (newData, newLayout) => Plotly.react(container, newData, newLayout),
            destroy: () => Plotly.purge(container)
        };
    }

    // Create Chart.js chart
    async _createChartjsChart(container, data, config) {
        if (typeof Chart === 'undefined') {
            throw new Error('Chart.js library not loaded');
        }

        const canvas = container.querySelector('canvas') || document.createElement('canvas');
        if (!container.querySelector('canvas')) {
            container.appendChild(canvas);
        }

        const chartInstance = new Chart(canvas, {
            type: config.type || 'bar',
            data: data,
            options: config.options || {}
        });

        return {
            type: 'chartjs',
            container,
            instance: chartInstance,
            data,
            config,
            update: (newData) => {
                chartInstance.data = newData;
                chartInstance.update();
            },
            destroy: () => chartInstance.destroy()
        };
    }

    // Create academic-style chart
    async _createAcademicChart(container, data, config) {
        // Use Plotly with academic styling
        const academicLayout = {
            font: { family: 'Times New Roman, serif', size: 14 },
            paper_bgcolor: 'white',
            plot_bgcolor: 'white',
            ...config.layout
        };

        await Plotly.newPlot(container, data.traces || [data], academicLayout, config.options || {});
        
        return {
            type: 'academic',
            container,
            data,
            config,
            update: (newData, newLayout) => Plotly.react(container, newData, newLayout),
            destroy: () => Plotly.purge(container),
            exportImage: (format = 'png', width = 800, height = 600) => {
                return Plotly.toImage(container, { format, width, height, scale: 2 });
            }
        };
    }

    // Update existing chart
    async updateChart(containerId, newData, newConfig = {}) {
        const chartInfo = this.chartInstances.get(containerId);
        if (!chartInfo) {
            throw new Error(`Chart not found: ${containerId}`);
        }

        const mergedConfig = this._mergeDeep(chartInfo.config, newConfig);
        await chartInfo.instance.update(newData, mergedConfig.layout);
        
        // Update stored info
        chartInfo.data = newData;
        chartInfo.config = mergedConfig;
    }

    // Destroy chart
    destroyChart(containerId) {
        const chartInfo = this.chartInstances.get(containerId);
        if (chartInfo) {
            chartInfo.instance.destroy();
            this.chartInstances.delete(containerId);
        }
    }

    // Destroy all charts
    destroyAllCharts() {
        for (const [containerId, chartInfo] of this.chartInstances.entries()) {
            chartInfo.instance.destroy();
        }
        this.chartInstances.clear();
    }

    // Get chart instance
    getChart(containerId) {
        const chartInfo = this.chartInstances.get(containerId);
        return chartInfo ? chartInfo.instance : null;
    }

    // Export chart as image
    async exportChart(containerId, filename, format = 'png', options = {}) {
        const chartInfo = this.chartInstances.get(containerId);
        if (!chartInfo) {
            throw new Error(`Chart not found: ${containerId}`);
        }

        if (chartInfo.instance.exportImage) {
            const dataURL = await chartInfo.instance.exportImage(format, options.width, options.height);
            this._downloadImage(dataURL, `${filename}.${format}`);
        } else {
            throw new Error('Export not supported for this chart type');
        }
    }

    // Download image
    _downloadImage(dataURL, filename) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataURL;
        link.click();
    }

    // Deep merge objects
    _mergeDeep(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    result[key] = this._mergeDeep(result[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }
        
        return result;
    }

    // Resize all charts (useful for responsive design)
    resizeAllCharts() {
        for (const [containerId, chartInfo] of this.chartInstances.entries()) {
            if (chartInfo.type === 'plotly' || chartInfo.type === 'academic') {
                Plotly.Plots.resize(chartInfo.container);
            } else if (chartInfo.type === 'chartjs') {
                chartInfo.instance.instance.resize();
            }
        }
    }
}