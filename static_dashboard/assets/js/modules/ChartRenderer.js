/**
 * Chart Renderer Module
 * Modular chart rendering with dependency isolation
 */

class ChartRenderer {
    constructor() {
        this.config = {
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
        
        this.layout = {
            font: {
                family: "'Nunito', sans-serif",
                size: 12
            },
            plot_bgcolor: 'rgba(0,0,0,0)',
            paper_bgcolor: 'rgba(0,0,0,0)',
            margin: { t: 30, r: 30, b: 50, l: 50 }
        };
        
        this.initialized = false;
        this.init();
    }
    
    init() {
        if (typeof Plotly === 'undefined') {
            console.error('❌ Plotly.js not loaded');
            return false;
        }
        this.initialized = true;
        console.log('📈 ChartRenderer initialized');
        return true;
    }
    
    /**
     * Safely find chart container with fallback options
     */
    findContainer(containerIds) {
        const ids = Array.isArray(containerIds) ? containerIds : [containerIds];
        
        for (const id of ids) {
            const container = document.getElementById(id);
            if (container) {
                console.log(`✅ Found container: ${id}`);
                return container;
            }
        }
        
        console.error(`❌ No container found for IDs: ${ids.join(', ')}`);
        return null;
    }
    
    /**
     * Validate and prepare chart data
     */
    validateData(data, requiredFields = []) {
        if (!data) {
            console.error('❌ No data provided');
            return false;
        }
        
        for (const field of requiredFields) {
            if (!data[field]) {
                console.error(`❌ Missing required field: ${field}`);
                return false;
            }
        }
        
        console.log('✅ Data validation passed');
        return true;
    }
    
    /**
     * Render error chart with message
     */
    renderError(containerId, title, message = 'Chart failed to load') {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="chart-error" style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 250px;
                    background-color: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                    border-radius: 5px;
                    text-align: center;
                ">
                    <h6>${title}</h6>
                    <p>${message}</p>
                    <small>Check console for details</small>
                </div>
            `;
        }
    }
    
    /**
     * Generic chart rendering method
     */
    render(containerId, traces, layout = {}, config = {}) {
        if (!this.initialized) {
            console.error('❌ ChartRenderer not initialized');
            return false;
        }
        
        const container = this.findContainer(containerId);
        if (!container) {
            return false;
        }
        
        const finalLayout = { ...this.layout, ...layout };
        const finalConfig = { ...this.config, ...config };
        
        try {
            // Validate traces have data
            if (!this.validateTraces(traces)) {
                console.warn(`⚠️ Chart ${container.id} has no data to display`);
                this.renderStaticFallback(container.id, 'No Data Available');
                return false;
            }
            
            Plotly.newPlot(container, traces, finalLayout, finalConfig);
            console.log(`✅ Chart rendered successfully in ${container.id}`);
            
            // Post-render validation with increased delay
            setTimeout(() => this.validateRenderedChart(container.id), 500);
            
            return true;
        } catch (error) {
            console.error(`❌ Error rendering chart in ${container.id}:`, error);
            this.renderError(container.id, 'Chart Error', error.message);
            return false;
        }
    }
    
    /**
     * Validate traces contain actual data
     */
    validateTraces(traces) {
        if (!traces || traces.length === 0) {
            console.warn('⚠️ No traces provided');
            return false;
        }
        
        for (let trace of traces) {
            // Check for data arrays
            if (trace.x && trace.x.length > 0) return true;
            if (trace.y && trace.y.length > 0) return true;
            if (trace.values && trace.values.length > 0) return true;
            if (trace.z && trace.z.length > 0) return true;
        }
        
        console.warn('⚠️ All traces appear to be empty');
        return false;
    }
    
    /**
     * Validate chart actually rendered with content
     */
    validateRenderedChart(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Skip validation if container is not visible (on another page)
        if (container.offsetParent === null && container.style.display !== 'none') {
            // Container exists but is on hidden page - skip validation
            return;
        }
        
        const plotElement = container.querySelector('.plotly-graph-div');
        if (!plotElement) {
            console.warn(`⚠️ Chart ${containerId} DOM element not found after render`);
            this.renderStaticFallback(containerId, 'Rendering Failed');
            return;
        }
        
        // Check if chart has visible content
        const svgElements = plotElement.querySelectorAll('svg');
        if (svgElements.length === 0) {
            console.warn(`⚠️ Chart ${containerId} has no SVG content`);
            this.renderStaticFallback(containerId, 'No Visual Content');
            return;
        }
        
        // Check for actual data points
        const dataPoints = plotElement.querySelectorAll('path, circle, rect, polygon');
        if (dataPoints.length === 0) {
            console.warn(`⚠️ Chart ${containerId} has no data points visible`);
            this.renderStaticFallback(containerId, 'No Data Points');
            return;
        }
        
        console.log(`✅ Chart ${containerId} validation passed - ${dataPoints.length} data elements found`);
    }
    
    /**
     * Render static image fallback when JavaScript chart fails
     */
    renderStaticFallback(containerId, message = 'Loading static chart...') {
        // Use the dedicated StaticChartFallback system
        if (window.staticChartFallback) {
            return window.staticChartFallback.applyFallback(containerId, message);
        } else {
            console.warn('⚠️ StaticChartFallback not available, using empty chart');
            return this.renderEmptyChart(containerId, message);
        }
    }
    
    /**
     * Render empty chart placeholder
     */
    renderEmptyChart(containerId, message = 'No data available') {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="chart-empty" style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    min-height: 200px;
                    background-color: #f8f9fa;
                    color: #6c757d;
                    border: 2px dashed #dee2e6;
                    border-radius: 5px;
                    text-align: center;
                    font-family: var(--font-family-sans-serif);
                ">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
                    <h6 style="margin-bottom: 0.5rem; color: #495057;">Chart Empty</h6>
                    <p style="margin: 0; font-size: 0.9rem;">${message}</p>
                    <small style="margin-top: 0.5rem; opacity: 0.7;">Check console for details</small>
                </div>
            `;
        }
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