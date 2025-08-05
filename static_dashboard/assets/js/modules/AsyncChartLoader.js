/**
 * AsyncChartLoader Module
 * =======================
 * 
 * Advanced asynchronous chart loading with:
 * - Promise-based async/await pattern
 * - Sequential loading with priority system
 * - Lazy loading for viewport visibility
 * - Comprehensive error handling and retry logic
 */

export class AsyncChartLoader {
    constructor(options = {}) {
        this.options = {
            retryAttempts: 3,
            retryDelay: 1000,
            lazyLoadOffset: 100, // pixels before element enters viewport
            loadingDelay: 100, // delay between sequential loads
            priorityLoadFirst: true,
            enableIntersectionObserver: true,
            ...options
        };
        
        this.loadingQueue = new Map();
        this.loadedCharts = new Set();
        this.failedCharts = new Set();
        this.observers = new Map();
        this.isInitialized = false;
        
        // Don't call init() in constructor - it should be called explicitly
    }

    /**
     * Initialize the async chart loader
     */
    async init() {
        try {
            await this.waitForDependencies();
            this.setupIntersectionObserver();
            this.isInitialized = true;
            console.log('✅ AsyncChartLoader initialized');
        } catch (error) {
            console.error('❌ AsyncChartLoader initialization failed:', error);
            throw error;
        }
    }

    /**
     * Wait for required dependencies
     */
    async waitForDependencies() {
        console.log('📋 Checking dependencies...');
        
        // Quick check first
        if (typeof Plotly !== 'undefined') {
            console.log('✅ Plotly already available');
            return;
        }
        
        console.log('⏳ Waiting for Plotly to load...');
        const maxWait = 5000; // 5 seconds (reduced timeout)
        const startTime = Date.now();
        
        return new Promise((resolve, reject) => {
            const checkDependencies = () => {
                console.log(`🔍 Checking Plotly... (${Date.now() - startTime}ms elapsed)`);
                
                if (typeof Plotly !== 'undefined') {
                    console.log('✅ Plotly dependency loaded');
                    resolve();
                    return;
                }
                
                if (Date.now() - startTime > maxWait) {
                    console.error('❌ Plotly loading timeout after 5 seconds');
                    reject(new Error('Plotly dependency loading timeout - check if Plotly.js is properly loaded'));
                    return;
                }
                
                setTimeout(checkDependencies, 200);
            };
            
            checkDependencies();
        });
    }

    /**
     * Setup Intersection Observer for lazy loading
     */
    setupIntersectionObserver() {
        if (!this.options.enableIntersectionObserver || !window.IntersectionObserver) {
            console.warn('⚠️ IntersectionObserver not available, falling back to immediate loading');
            return;
        }

        this.intersectionObserver = new IntersectionObserver(
            (entries) => this.handleIntersection(entries),
            {
                rootMargin: `${this.options.lazyLoadOffset}px`,
                threshold: 0.1
            }
        );
    }

    /**
     * Handle intersection observer events
     */
    async handleIntersection(entries) {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                const containerId = entry.target.id;
                const chartConfig = this.loadingQueue.get(containerId);
                
                if (chartConfig && !this.loadedCharts.has(containerId)) {
                    console.log(`👁️ Chart container visible: ${containerId}`);
                    await this.loadChart(chartConfig);
                    this.intersectionObserver.unobserve(entry.target);
                }
            }
        }
    }

    /**
     * Add chart to loading queue with priority
     */
    queueChart(config) {
        const {
            containerId,
            chartType,
            data,
            options = {},
            priority = 'normal', // 'critical', 'high', 'normal', 'low'
            lazy = true
        } = config;

        if (!containerId || !chartType) {
            throw new Error('containerId and chartType are required');
        }

        const chartConfig = {
            containerId,
            chartType,
            data,
            options,
            priority,
            lazy,
            queueTime: Date.now(),
            attempts: 0
        };

        this.loadingQueue.set(containerId, chartConfig);

        // Observe container for lazy loading
        if (lazy && this.intersectionObserver) {
            const container = document.getElementById(containerId);
            if (container) {
                this.intersectionObserver.observe(container);
            }
        }

        console.log(`📋 Chart queued: ${containerId} (priority: ${priority}, lazy: ${lazy})`);
        return chartConfig;
    }

    /**
     * Load charts sequentially based on priority
     */
    async loadChartsSequentially() {
        if (!this.isInitialized) {
            await this.init();
        }

        // Sort charts by priority
        const priorityOrder = ['critical', 'high', 'normal', 'low'];
        const sortedCharts = Array.from(this.loadingQueue.values())
            .filter(config => !config.lazy || !this.options.enableIntersectionObserver)
            .sort((a, b) => {
                const aPriority = priorityOrder.indexOf(a.priority);
                const bPriority = priorityOrder.indexOf(b.priority);
                return aPriority - bPriority;
            });

        console.log(`🚀 Starting sequential chart loading: ${sortedCharts.length} charts`);

        const results = [];
        for (const chartConfig of sortedCharts) {
            try {
                const result = await this.loadChart(chartConfig);
                results.push({ containerId: chartConfig.containerId, success: true, result });
                
                // Add delay between loads to prevent overwhelming
                if (this.options.loadingDelay > 0) {
                    await this.delay(this.options.loadingDelay);
                }
            } catch (error) {
                console.error(`❌ Failed to load chart: ${chartConfig.containerId}`, error);
                results.push({ containerId: chartConfig.containerId, success: false, error });
            }
        }

        return results;
    }

    /**
     * Load a single chart with retry logic
     */
    async loadChart(chartConfig) {
        const { containerId, chartType, data, options, attempts } = chartConfig;

        if (this.loadedCharts.has(containerId)) {
            console.log(`⚠️ Chart already loaded: ${containerId}`);
            return;
        }

        chartConfig.attempts = attempts + 1;

        try {
            console.log(`📊 Loading chart: ${containerId} (attempt ${chartConfig.attempts})`);
            
            // Show loading state
            this.showLoadingState(containerId);

            // Validate container
            const container = document.getElementById(containerId);
            if (!container) {
                throw new Error(`Container not found: ${containerId}`);
            }

            // Load chart based on type
            const result = await this.renderChartByType(chartType, containerId, data, options);
            
            // Mark as loaded
            this.loadedCharts.add(containerId);
            this.hideLoadingState(containerId);
            
            console.log(`✅ Chart loaded successfully: ${containerId}`);
            return result;

        } catch (error) {
            console.error(`❌ Chart loading failed: ${containerId}`, error);
            
            // Retry logic
            if (chartConfig.attempts < this.options.retryAttempts) {
                console.log(`🔄 Retrying chart load: ${containerId} (${chartConfig.attempts}/${this.options.retryAttempts})`);
                await this.delay(this.options.retryDelay);
                return this.loadChart(chartConfig);
            } else {
                this.failedCharts.add(containerId);
                this.showErrorState(containerId, error);
                throw error;
            }
        }
    }

    /**
     * Render chart based on type
     */
    async renderChartByType(chartType, containerId, data, options) {
        switch (chartType) {
            case 'pie':
                return await this.renderPieChart(containerId, data, options);
            case 'bar':
                return await this.renderBarChart(containerId, data, options);
            case 'line':
                return await this.renderLineChart(containerId, data, options);
            case 'scatter':
                return await this.renderScatterChart(containerId, data, options);
            case 'heatmap':
                return await this.renderHeatmapChart(containerId, data, options);
            case 'histogram':
                return await this.renderHistogramChart(containerId, data, options);
            case 'lime':
                return await this.renderLIMEChart(containerId, data, options);
            case 'decision':
                return await this.renderDecisionChart(containerId, data, options);
            case 'confidence':
                return await this.renderConfidenceChart(containerId, data, options);
            default:
                throw new Error(`Unknown chart type: ${chartType}`);
        }
    }

    /**
     * Render Pie Chart
     */
    async renderPieChart(containerId, data, options = {}) {
        const trace = {
            type: 'pie',
            labels: data.labels || [],
            values: data.values || [],
            marker: {
                colors: options.colors || this.getDefaultColors(),
                line: { color: '#ffffff', width: 2 }
            },
            textinfo: options.textinfo || 'label+percent',
            hovertemplate: '<b>%{label}</b><br>Value: %{value}<br>Ratio: %{percent}<extra></extra>'
        };

        const layout = {
            title: {
                text: options.title || '',
                x: 0.5,
                font: { size: 16, color: '#5a5c69' }
            },
            showlegend: options.showlegend !== false,
            margin: { t: 60, r: 30, b: 30, l: 30 },
            font: { family: "'Nunito', sans-serif", size: 12 }
        };

        return Plotly.newPlot(containerId, [trace], layout, this.getPlotlyConfig());
    }

    /**
     * Render Bar Chart
     */
    async renderBarChart(containerId, data, options = {}) {
        const trace = {
            type: 'bar',
            x: data.x || [],
            y: data.y || [],
            marker: {
                color: options.color || this.getDefaultColors()[0],
                opacity: options.opacity || 0.8,
                line: { color: '#ffffff', width: 1 }
            },
            hovertemplate: '<b>%{x}</b><br>Value: %{y}<extra></extra>'
        };

        const layout = {
            title: {
                text: options.title || '',
                x: 0.5,
                font: { size: 16, color: '#5a5c69' }
            },
            xaxis: { title: options.xTitle || 'Category' },
            yaxis: { title: options.yTitle || 'Value' },
            margin: { t: 60, r: 30, b: 60, l: 60 },
            font: { family: "'Nunito', sans-serif", size: 12 }
        };

        return Plotly.newPlot(containerId, [trace], layout, this.getPlotlyConfig());
    }

    /**
     * Render Line Chart
     */
    async renderLineChart(containerId, data, options = {}) {
        const trace = {
            type: 'scatter',
            mode: 'lines+markers',
            x: data.x || [],
            y: data.y || [],
            line: { 
                color: options.color || this.getDefaultColors()[0], 
                width: options.lineWidth || 3 
            },
            marker: { 
                size: options.markerSize || 6,
                color: options.markerColor || options.color || this.getDefaultColors()[0]
            },
            hovertemplate: '<b>%{x}</b><br>Value: %{y}<extra></extra>'
        };

        const layout = {
            title: {
                text: options.title || '',
                x: 0.5,
                font: { size: 16, color: '#5a5c69' }
            },
            xaxis: { title: options.xTitle || 'X Axis' },
            yaxis: { title: options.yTitle || 'Y Axis' },
            margin: { t: 60, r: 30, b: 60, l: 60 },
            font: { family: "'Nunito', sans-serif", size: 12 }
        };

        return Plotly.newPlot(containerId, [trace], layout, this.getPlotlyConfig());
    }

    /**
     * Render LIME Chart (XAI)
     */
    async renderLIMEChart(containerId, data, options = {}) {
        const features = data.features || [];
        const colors = this.getDefaultColors();
        
        const trace = {
            type: 'bar',
            orientation: 'h',
            x: features.map(f => f.impact),
            y: features.map(f => f.name),
            marker: {
                color: features.map(f => f.impact > 0 ? colors[4] : colors[1]), // Red/Green
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
                x: 0.5,
                font: { size: 16, color: '#5a5c69' }
            },
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
            margin: { t: 60, r: 30, b: 50, l: 100 },
            font: { family: "'Nunito', sans-serif", size: 12 }
        };

        return Plotly.newPlot(containerId, [trace], layout, this.getPlotlyConfig());
    }

    /**
     * Render Decision Chart (XAI)
     */
    async renderDecisionChart(containerId, data, options = {}) {
        const steps = data.steps || [];
        const colors = this.getDefaultColors();
        
        const trace = {
            type: 'bar',
            x: steps.map(s => s.feature),
            y: steps.map(s => s.gini),
            marker: {
                color: colors[2],
                opacity: 0.8,
                line: { color: '#ffffff', width: 1 }
            },
            text: steps.map(s => `Samples: ${s.samples}`),
            textposition: 'auto',
            hovertemplate: '<b>%{x}</b><br>Gini: %{y:.3f}<br>Samples: %{text}<extra></extra>'
        };

        const layout = {
            title: {
                text: options.title || 'Decision Process',
                x: 0.5,
                font: { size: 16, color: '#5a5c69' }
            },
            xaxis: { title: 'Features', tickangle: -45 },
            yaxis: { title: options.yTitle || 'Gini Impurity' },
            margin: { t: 60, r: 30, b: 100, l: 60 },
            font: { family: "'Nunito', sans-serif", size: 12 }
        };

        return Plotly.newPlot(containerId, [trace], layout, this.getPlotlyConfig());
    }

    /**
     * Render Confidence Chart (XAI)
     */
    async renderConfidenceChart(containerId, data, options = {}) {
        const trace = {
            type: 'bar',
            x: data.bins || [],
            y: data.counts || [],
            marker: {
                color: this.getDefaultColors()[3],
                opacity: 0.8,
                line: { color: '#ffffff', width: 1 }
            },
            hovertemplate: '<b>%{x}</b><br>Count: %{y}<extra></extra>'
        };

        const layout = {
            title: {
                text: options.title || 'Confidence Distribution',
                x: 0.5,
                font: { size: 16, color: '#5a5c69' }
            },
            xaxis: { title: 'Confidence Range' },
            yaxis: { title: 'Count' },
            margin: { t: 60, r: 30, b: 60, l: 60 },
            font: { family: "'Nunito', sans-serif", size: 12 }
        };

        return Plotly.newPlot(containerId, [trace], layout, this.getPlotlyConfig());
    }

    /**
     * Render Scatter Chart
     */
    async renderScatterChart(containerId, data, options = {}) {
        const trace = {
            type: 'scatter',
            mode: 'markers',
            x: data.x || [],
            y: data.y || [],
            marker: {
                size: options.markerSize || 8,
                color: options.color || this.getDefaultColors()[0],
                opacity: options.opacity || 0.7
            },
            hovertemplate: '<b>X: %{x}</b><br>Y: %{y}<extra></extra>'
        };

        const layout = {
            title: {
                text: options.title || '',
                x: 0.5,
                font: { size: 16, color: '#5a5c69' }
            },
            xaxis: { title: options.xTitle || 'X Axis' },
            yaxis: { title: options.yTitle || 'Y Axis' },
            margin: { t: 60, r: 30, b: 60, l: 60 },
            font: { family: "'Nunito', sans-serif", size: 12 }
        };

        return Plotly.newPlot(containerId, [trace], layout, this.getPlotlyConfig());
    }

    /**
     * Render Histogram Chart
     */
    async renderHistogramChart(containerId, data, options = {}) {
        const trace = {
            type: 'histogram',
            x: data.values || [],
            nbinsx: options.bins || 20,
            marker: {
                color: options.color || this.getDefaultColors()[1],
                opacity: 0.8,
                line: { color: '#ffffff', width: 1 }
            },
            hovertemplate: '<b>Range: %{x}</b><br>Count: %{y}<extra></extra>'
        };

        const layout = {
            title: {
                text: options.title || '',
                x: 0.5,
                font: { size: 16, color: '#5a5c69' }
            },
            xaxis: { title: options.xTitle || 'Value' },
            yaxis: { title: options.yTitle || 'Frequency' },
            margin: { t: 60, r: 30, b: 60, l: 60 },
            font: { family: "'Nunito', sans-serif", size: 12 }
        };

        return Plotly.newPlot(containerId, [trace], layout, this.getPlotlyConfig());
    }

    /**
     * Render Heatmap Chart
     */
    async renderHeatmapChart(containerId, data, options = {}) {
        const trace = {
            type: 'heatmap',
            z: data.z || [],
            x: data.x || [],
            y: data.y || [],
            colorscale: options.colorscale || 'RdYlBu',
            hovertemplate: '<b>X: %{x}</b><br>Y: %{y}<br>Value: %{z}<extra></extra>'
        };

        const layout = {
            title: {
                text: options.title || '',
                x: 0.5,
                font: { size: 16, color: '#5a5c69' }
            },
            xaxis: { title: options.xTitle || 'X Axis' },
            yaxis: { title: options.yTitle || 'Y Axis' },
            margin: { t: 60, r: 30, b: 60, l: 60 },
            font: { family: "'Nunito', sans-serif", size: 12 }
        };

        return Plotly.newPlot(containerId, [trace], layout, this.getPlotlyConfig());
    }

    /**
     * Show loading state
     */
    showLoadingState(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="chart-loading d-flex flex-column align-items-center justify-content-center" style="height: 300px;">
                <div class="spinner-border text-primary mb-3" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div class="text-muted">Loading chart...</div>
            </div>
        `;
    }

    /**
     * Hide loading state
     */
    hideLoadingState(containerId) {
        // Loading state will be replaced by chart content
    }

    /**
     * Show error state
     */
    showErrorState(containerId, error) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="chart-error d-flex flex-column align-items-center justify-content-center text-center p-4" style="height: 300px;">
                <i class="fas fa-exclamation-triangle text-warning fa-3x mb-3"></i>
                <div class="text-muted">
                    <strong>Chart Load Failed</strong><br>
                    ${error.message}
                </div>
                <button class="btn btn-outline-primary btn-sm mt-3" onclick="location.reload()">
                    <i class="fas fa-redo me-1"></i> Refresh Page
                </button>
            </div>
        `;
    }

    /**
     * Utility: Delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get default color palette
     */
    getDefaultColors() {
        return [
            '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b',
            '#858796', '#5a5c69', '#6f42c1', '#e83e8c', '#fd7e14'
        ];
    }

    /**
     * Get Plotly configuration
     */
    getPlotlyConfig() {
        return {
            displayModeBar: false,
            responsive: true,
            locale: 'en'
        };
    }

    /**
     * Get loading statistics
     */
    getLoadingStats() {
        return {
            total: this.loadingQueue.size,
            loaded: this.loadedCharts.size,
            failed: this.failedCharts.size,
            pending: this.loadingQueue.size - this.loadedCharts.size - this.failedCharts.size,
            success_rate: this.loadedCharts.size / Math.max(1, this.loadedCharts.size + this.failedCharts.size)
        };
    }

    /**
     * Clean up resources
     */
    cleanup() {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        this.loadingQueue.clear();
        this.loadedCharts.clear();
        this.failedCharts.clear();
        this.observers.clear();
    }
}

// Note: AsyncChartLoader should be instantiated and initialized manually
// Example: const loader = new AsyncChartLoader(options); await loader.init();