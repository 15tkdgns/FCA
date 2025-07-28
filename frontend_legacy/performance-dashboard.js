// Performance Dashboard Widget
class PerformanceDashboard {
    constructor() {
        this.metrics = {
            memory: [],
            api: [],
            charts: [],
            loading: []
        };
        this.isVisible = false;
        this.updateInterval = null;
        
        this.init();
    }

    init() {
        this.createWidget();
        this.bindEvents();
        this.startMonitoring();
    }

    createWidget() {
        // Create floating performance widget
        const widget = document.createElement('div');
        widget.id = 'performance-widget';
        widget.className = 'performance-widget';
        widget.innerHTML = `
            <div class="performance-header">
                <span class="performance-title">⚡ Performance</span>
                <div class="performance-controls">
                    <button class="toggle-details" title="Toggle Details">📊</button>
                    <button class="close-widget" title="Close">×</button>
                </div>
            </div>
            <div class="performance-summary">
                <div class="metric-item">
                    <span class="metric-label">Memory</span>
                    <span class="metric-value" id="perf-memory">--</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">API</span>
                    <span class="metric-value" id="perf-api">--</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Charts</span>
                    <span class="metric-value" id="perf-charts">--</span>
                </div>
            </div>
            <div class="performance-details" id="performance-details" style="display: none;">
                <div class="detail-section">
                    <h4>Memory Usage</h4>
                    <div class="detail-content" id="memory-details">Loading...</div>
                </div>
                <div class="detail-section">
                    <h4>API Performance</h4>
                    <div class="detail-content" id="api-details">Loading...</div>
                </div>
                <div class="detail-section">
                    <h4>Chart Performance</h4>
                    <div class="detail-content" id="chart-details">Loading...</div>
                </div>
                <div class="detail-section">
                    <h4>Module Loader</h4>
                    <div class="detail-content" id="module-details">Loading...</div>
                </div>
            </div>
        `;

        // Add CSS styles
        this.addStyles();
        
        // Add to page
        document.body.appendChild(widget);
        this.widget = widget;
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .performance-widget {
                position: fixed;
                top: 20px;
                left: 20px;
                background: rgba(255, 255, 255, 0.95);
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 10000;
                min-width: 200px;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                backdrop-filter: blur(10px);
            }

            .performance-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 12px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 8px 8px 0 0;
                cursor: move;
            }

            .performance-title {
                font-weight: bold;
                font-size: 13px;
            }

            .performance-controls {
                display: flex;
                gap: 4px;
            }

            .performance-controls button {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 2px 4px;
                border-radius: 3px;
                font-size: 12px;
            }

            .performance-controls button:hover {
                background: rgba(255, 255, 255, 0.2);
            }

            .performance-summary {
                padding: 8px 12px;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .metric-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .metric-label {
                color: #666;
                font-size: 11px;
            }

            .metric-value {
                font-weight: bold;
                color: #333;
                font-size: 11px;
            }

            .metric-value.good { color: #28a745; }
            .metric-value.warning { color: #ffc107; }
            .metric-value.critical { color: #dc3545; }

            .performance-details {
                border-top: 1px solid #eee;
                max-height: 300px;
                overflow-y: auto;
            }

            .detail-section {
                padding: 8px 12px;
                border-bottom: 1px solid #f0f0f0;
            }

            .detail-section:last-child {
                border-bottom: none;
            }

            .detail-section h4 {
                margin: 0 0 4px 0;
                font-size: 11px;
                color: #444;
                font-weight: bold;
            }

            .detail-content {
                font-size: 10px;
                color: #666;
                line-height: 1.3;
            }

            .performance-widget.hidden {
                display: none;
            }

            .performance-widget.collapsed .performance-summary,
            .performance-widget.collapsed .performance-details {
                display: none;
            }

            @media (max-width: 768px) {
                .performance-widget {
                    top: auto;
                    bottom: 20px;
                    left: 10px;
                    right: 10px;
                    min-width: auto;
                }
            }
        `;
        document.head.appendChild(style);
    }

    bindEvents() {
        const header = this.widget.querySelector('.performance-header');
        const toggleBtn = this.widget.querySelector('.toggle-details');
        const closeBtn = this.widget.querySelector('.close-widget');
        const details = this.widget.querySelector('.performance-details');

        // Toggle details
        toggleBtn.addEventListener('click', () => {
            const isVisible = details.style.display !== 'none';
            details.style.display = isVisible ? 'none' : 'block';
            toggleBtn.textContent = isVisible ? '📊' : '📈';
        });

        // Close widget
        closeBtn.addEventListener('click', () => {
            this.hide();
        });

        // Make draggable
        this.makeDraggable(header);

        // Keyboard shortcut to toggle
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'P') {
                this.toggle();
            }
        });
    }

    makeDraggable(handle) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        handle.addEventListener('mousedown', (e) => {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            
            if (e.target === handle || handle.contains(e.target)) {
                isDragging = true;
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                
                xOffset = currentX;
                yOffset = currentY;
                
                this.widget.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    startMonitoring() {
        this.updateInterval = setInterval(() => {
            this.updateMetrics();
        }, 2000); // Update every 2 seconds

        // Initial update
        this.updateMetrics();
    }

    updateMetrics() {
        try {
            // Collect performance data
            const memoryStats = window.memoryMonitor?.getMemoryStatus();
            const apiStats = window.dashboard?.apiClient?.getPerformanceStats();
            const moduleStats = window.moduleLoader?.getPerformanceMetrics();
            const chartCount = Object.keys(window.dashboard?.charts || {}).length;

            // Update summary
            this.updateSummary(memoryStats, apiStats, chartCount);
            
            // Update details if visible
            if (this.widget.querySelector('#performance-details').style.display !== 'none') {
                this.updateDetails(memoryStats, apiStats, moduleStats, chartCount);
            }

        } catch (error) {
            console.warn('Performance monitoring update failed:', error);
        }
    }

    updateSummary(memoryStats, apiStats, chartCount) {
        const memoryEl = document.getElementById('perf-memory');
        const apiEl = document.getElementById('perf-api');
        const chartsEl = document.getElementById('perf-charts');

        if (memoryEl && memoryStats) {
            memoryEl.textContent = memoryStats.current;
            memoryEl.className = `metric-value ${memoryStats.status}`;
        }

        if (apiEl && apiStats) {
            apiEl.textContent = `${apiStats.activeRequests}/${apiStats.maxConcurrent}`;
            const apiStatus = apiStats.queuedRequests > 0 ? 'warning' : 'good';
            apiEl.className = `metric-value ${apiStatus}`;
        }

        if (chartsEl) {
            chartsEl.textContent = chartCount.toString();
            const chartStatus = chartCount > 10 ? 'warning' : 'good';
            chartsEl.className = `metric-value ${chartStatus}`;
        }
    }

    updateDetails(memoryStats, apiStats, moduleStats, chartCount) {
        // Memory details
        const memoryDetails = document.getElementById('memory-details');
        if (memoryDetails && memoryStats) {
            memoryDetails.innerHTML = `
                Usage: ${memoryStats.current} (${memoryStats.percentage}%)<br>
                Trend: ${memoryStats.trend}<br>
                Status: ${memoryStats.status}
            `;
        }

        // API details
        const apiDetails = document.getElementById('api-details');
        if (apiDetails && apiStats) {
            apiDetails.innerHTML = `
                Active: ${apiStats.activeRequests}/${apiStats.maxConcurrent}<br>
                Queued: ${apiStats.queuedRequests}<br>
                Cache: ${apiStats.cacheEntries} entries (${apiStats.totalCacheSize})
            `;
        }

        // Chart details
        const chartDetails = document.getElementById('chart-details');
        if (chartDetails) {
            const poolSize = window.chartOptimizer?.chartPool.size || 0;
            chartDetails.innerHTML = `
                Active Charts: ${chartCount}<br>
                Chart Pool: ${poolSize}<br>
                Queue: ${window.chartOptimizer?.renderQueue.length || 0}
            `;
        }

        // Module details
        const moduleDetails = document.getElementById('module-details');
        if (moduleDetails && moduleStats) {
            moduleDetails.innerHTML = `
                Loaded: ${moduleStats.loadedModulesCount}<br>
                Cache Hits: ${(moduleStats.cacheHitRate * 100).toFixed(1)}%<br>
                Avg Load: ${moduleStats.averageLoadTime.toFixed(1)}ms
            `;
        }
    }

    show() {
        this.widget.classList.remove('hidden');
        this.isVisible = true;
    }

    hide() {
        this.widget.classList.add('hidden');
        this.isVisible = false;
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        if (this.widget && this.widget.parentNode) {
            this.widget.parentNode.removeChild(this.widget);
        }
    }

    // Public API for external access
    getPerformanceData() {
        return {
            memory: window.memoryMonitor?.getMemoryStatus(),
            api: window.dashboard?.apiClient?.getPerformanceStats(),
            modules: window.moduleLoader?.getPerformanceMetrics(),
            charts: {
                active: Object.keys(window.dashboard?.charts || {}).length,
                pool: window.chartOptimizer?.chartPool.size || 0,
                queue: window.chartOptimizer?.renderQueue.length || 0
            }
        };
    }

    exportPerformanceReport() {
        const data = {
            timestamp: new Date().toISOString(),
            performance: this.getPerformanceData(),
            navigator: {
                userAgent: navigator.userAgent,
                language: navigator.language,
                hardwareConcurrency: navigator.hardwareConcurrency,
                deviceMemory: navigator.deviceMemory
            }
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `performance-report-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize performance dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Delay initialization to ensure other modules are loaded
    setTimeout(() => {
        window.performanceDashboard = new PerformanceDashboard();
        console.log('📊 Performance dashboard initialized (Ctrl+Shift+P to toggle)');
    }, 1000);
});