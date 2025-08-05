/**
 * Chart Monitor
 * Monitors chart loading status and provides diagnostics
 */

class ChartMonitor {
    constructor() {
        this.charts = new Map();
        this.observers = [];
        this.initialized = false;
        this.init();
    }
    
    init() {
        this.initialized = true;
        console.log('👁️ ChartMonitor initialized');
        
        // Start monitoring after a delay
        setTimeout(() => this.startMonitoring(), 2000);
    }
    
    /**
     * Register a chart for monitoring
     */
    registerChart(containerId, chartType, expectedData = null) {
        const status = {
            containerId,
            chartType,
            expectedData,
            status: 'pending',
            lastChecked: Date.now(),
            attempts: 0,
            errors: []
        };
        
        this.charts.set(containerId, status);
        console.log(`📝 Registered chart ${containerId} for monitoring`);
        
        return status;
    }
    
    /**
     * Start monitoring all registered charts
     */
    startMonitoring() {
        console.log('👁️ Starting chart monitoring...');
        
        // Initial check
        this.checkAllCharts();
        
        // Set up periodic monitoring with enhanced recovery
        setInterval(() => this.checkAllChartsWithRecovery(), 5000); // Check every 5 seconds
        
        // Set up DOM observers
        this.setupDOMObservers();
    }
    
    /**
     * Check all registered charts
     */
    checkAllCharts() {
        console.log(`🔍 Checking ${this.charts.size} registered charts...`);
        
        let emptyCharts = [];
        let loadingCharts = [];
        let successfulCharts = [];
        
        for (let [containerId, status] of this.charts) {
            const result = this.checkChart(containerId);
            status.lastChecked = Date.now();
            status.attempts++;
            
            switch (result.status) {
                case 'empty':
                    emptyCharts.push(containerId);
                    status.status = 'empty';
                    status.errors.push(result.message);
                    break;
                case 'loading':
                    loadingCharts.push(containerId);
                    status.status = 'loading';
                    break;
                case 'success':
                    successfulCharts.push(containerId);
                    status.status = 'success';
                    break;
                case 'error':
                    status.status = 'error';
                    status.errors.push(result.message);
                    break;
            }
        }
        
        // Report results and trigger static fallbacks
        if (emptyCharts.length > 0) {
            console.warn(`⚠️ Empty charts detected: ${emptyCharts.join(', ')}`);
            this.triggerStaticFallbacks(emptyCharts);
        }
        
        if (loadingCharts.length > 0) {
            console.log(`⏳ Charts still loading: ${loadingCharts.join(', ')}`);
        }
        
        if (successfulCharts.length > 0) {
            console.log(`✅ Successful charts: ${successfulCharts.length}/${this.charts.size}`);
        }
        
        // Auto-register visible chart containers
        this.autoRegisterCharts();
    }
    
    /**
     * Check individual chart status
     */
    checkChart(containerId) {
        const container = document.getElementById(containerId);
        
        if (!container) {
            return { status: 'error', message: 'Container not found' };
        }
        
        // Check if container is visible
        if (!this.isVisible(container)) {
            return { status: 'loading', message: 'Container not visible' };
        }
        
        // Check for static fallback first
        const staticFallback = container.querySelector('.chart-static-fallback') || 
                              container.classList.contains('chart-static-fallback-applied');
        if (staticFallback) {
            return { status: 'success', message: 'Static fallback image loaded' };
        }
        
        // Check for no-fallback placeholder
        const noFallback = container.querySelector('.chart-no-fallback') ||
                          container.classList.contains('chart-no-fallback-applied');
        if (noFallback) {
            return { status: 'success', message: 'Fallback placeholder shown' };
        }
        
        // Check for Plotly content
        const plotlyDiv = container.querySelector('.plotly-graph-div');
        if (!plotlyDiv) {
            // Check for custom empty state
            const emptyDiv = container.querySelector('.chart-empty');
            if (emptyDiv) {
                return { status: 'empty', message: 'Chart marked as empty' };
            }
            
            // Check for error state
            const errorDiv = container.querySelector('.chart-error');
            if (errorDiv) {
                return { status: 'error', message: 'Chart has error state' };
            }
            
            return { status: 'empty', message: 'No Plotly content found' };
        }
        
        // Check for actual chart content
        const svgElements = plotlyDiv.querySelectorAll('svg');
        if (svgElements.length === 0) {
            return { status: 'empty', message: 'No SVG elements found' };
        }
        
        // Check for data points
        const dataElements = plotlyDiv.querySelectorAll('path, circle, rect, polygon, line');
        if (dataElements.length === 0) {
            return { status: 'empty', message: 'No data elements found' };
        }
        
        return { 
            status: 'success', 
            message: `Chart loaded with ${dataElements.length} data elements` 
        };
    }
    
    /**
     * Check if element is visible
     */
    isVisible(element) {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        
        return (
            rect.width > 0 &&
            rect.height > 0 &&
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0'
        );
    }
    
    /**
     * Auto-register chart containers found in DOM
     */
    autoRegisterCharts() {
        const chartContainers = document.querySelectorAll('[id*="chart"]');
        
        chartContainers.forEach(container => {
            if (!this.charts.has(container.id) && this.isVisible(container)) {
                this.registerChart(container.id, 'auto-detected');
            }
        });
    }
    
    /**
     * Setup DOM observers for dynamic content
     */
    setupDOMObservers() {
        // Observe chart container changes
        const observer = new MutationObserver((mutations) => {
            let hasChartChanges = false;
            
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && node.id && node.id.includes('chart')) {
                            hasChartChanges = true;
                        }
                    });
                }
            });
            
            if (hasChartChanges) {
                console.log('👁️ Chart DOM changes detected, re-checking...');
                setTimeout(() => this.checkAllCharts(), 1000);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        this.observers.push(observer);
    }
    
    /**
     * Get monitoring report
     */
    getReport() {
        const report = {
            totalCharts: this.charts.size,
            successful: 0,
            empty: 0,
            loading: 0,
            errors: 0,
            details: []
        };
        
        for (let [containerId, status] of this.charts) {
            report.details.push({
                containerId,
                status: status.status,
                attempts: status.attempts,
                lastChecked: new Date(status.lastChecked).toLocaleString(),
                errors: status.errors
            });
            
            switch (status.status) {
                case 'success': report.successful++; break;
                case 'empty': report.empty++; break;
                case 'loading': report.loading++; break;
                case 'error': report.errors++; break;
            }
        }
        
        return report;
    }
    
    /**
     * Print monitoring report to console
     */
    printReport() {
        const report = this.getReport();
        
        console.group('📊 Chart Monitoring Report');
        console.log(`Total Charts: ${report.totalCharts}`);
        console.log(`✅ Successful: ${report.successful}`);
        console.log(`⚠️ Empty: ${report.empty}`);
        console.log(`⏳ Loading: ${report.loading}`);
        console.log(`❌ Errors: ${report.errors}`);
        
        if (report.empty > 0) {
            console.group('⚠️ Empty Charts Details:');
            report.details
                .filter(d => d.status === 'empty')
                .forEach(d => {
                    console.log(`${d.containerId}: ${d.errors[d.errors.length - 1] || 'Unknown'}`);
                });
            console.groupEnd();
        }
        
        console.groupEnd();
    }
    
    /**
     * Trigger static fallback images for empty charts
     */
    triggerStaticFallbacks(emptyChartIds) {
        // Use dedicated StaticChartFallback system
        if (window.staticChartFallback) {
            const results = window.staticChartFallback.batchApplyFallbacks(
                emptyChartIds, 
                'JavaScript chart monitoring detected empty state'
            );
            
            // Update chart status for successful fallbacks
            results.forEach(({ containerId, success }) => {
                const chartStatus = this.charts.get(containerId);
                if (chartStatus && success) {
                    chartStatus.fallbackTriggered = true;
                    chartStatus.status = 'static_fallback';
                }
            });
        } else {
            console.warn('⚠️ StaticChartFallback system not available');
        }
    }
    
    /**
     * Enhanced auto-recovery system for failed charts
     */
    async attemptAutoRecovery(chartId, maxAttempts = 3) {
        const chartStatus = this.charts.get(chartId);
        if (!chartStatus) return false;
        
        const attempts = chartStatus.recoveryAttempts || 0;
        if (attempts >= maxAttempts) {
            console.error(`❌ Auto-recovery failed for ${chartId} after ${maxAttempts} attempts`);
            return false;
        }
        
        chartStatus.recoveryAttempts = attempts + 1;
        console.log(`🔧 Auto-recovery attempt ${attempts + 1} for chart ${chartId}`);
        
        // Wait with progressive backoff
        const delay = 1000 + (attempts * 1000); // 1s, 2s, 3s
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Try ChartManager recovery first
        if (window.chartManager && window.chartManager.recoverChart) {
            try {
                const success = await window.chartManager.recoverChart(chartId);
                if (success) {
                    console.log(`✅ Auto-recovery successful for ${chartId}`);
                    chartStatus.recoveryAttempts = 0;
                    return true;
                }
            } catch (error) {
                console.warn(`⚠️ ChartManager recovery failed for ${chartId}:`, error);
            }
        }
        
        // Try ChartRenderer recovery
        if (window.chartRenderer && window.chartRenderer.attemptChartRecovery) {
            try {
                const success = await window.chartRenderer.attemptChartRecovery(chartId);
                if (success) {
                    console.log(`✅ Auto-recovery successful for ${chartId}`);
                    chartStatus.recoveryAttempts = 0;
                    return true;
                }
            } catch (error) {
                console.warn(`⚠️ ChartRenderer recovery failed for ${chartId}:`, error);
            }
        }
        
        // If recovery failed, try again if under max attempts
        if (attempts < maxAttempts - 1) {
            return this.attemptAutoRecovery(chartId, maxAttempts);
        }
        
        return false;
    }
    
    /**
     * Enhanced monitoring with auto-recovery
     */
    async checkAllChartsWithRecovery() {
        console.log(`🔍 Checking ${this.charts.size} registered charts with auto-recovery...`);
        
        const emptyCharts = [];
        const failedCharts = [];
        let healthyCharts = 0;
        
        for (let [containerId, status] of this.charts) {
            const result = this.checkChart(containerId);
            status.lastChecked = Date.now();
            status.attempts++;
            
            switch (result.status) {
                case 'empty':
                    emptyCharts.push(containerId);
                    status.status = 'empty';
                    status.errors.push(result.message);
                    break;
                case 'error':
                    failedCharts.push(containerId);
                    status.status = 'error';
                    status.errors.push(result.message);
                    break;
                case 'success':
                    healthyCharts++;
                    status.status = 'success';
                    status.recoveryAttempts = 0; // Reset recovery attempts on success
                    break;
                default:
                    status.status = result.status;
            }
        }
        
        // Attempt auto-recovery for failed charts
        if (failedCharts.length > 0) {
            console.warn(`⚠️ Failed charts detected: ${failedCharts.join(', ')}`);
            for (const chartId of failedCharts) {
                // Non-blocking recovery
                this.attemptAutoRecovery(chartId).catch(error => {
                    console.error(`❌ Auto-recovery error for ${chartId}:`, error);
                });
            }
        }
        
        // Apply static fallbacks for persistently empty charts (only if > 5 empty)
        if (emptyCharts.length > 5) {
            console.warn(`⚠️ Many empty charts detected (${emptyCharts.length}): ${emptyCharts.slice(0, 3).join(', ')}${emptyCharts.length > 3 ? '...' : ''}`);
            this.triggerStaticFallbacks(emptyCharts);
        } else if (emptyCharts.length > 0) {
            console.log(`🔍 ${emptyCharts.length} empty charts: ${emptyCharts.join(', ')}`);
        }
        
        console.log(`✅ Healthy charts: ${healthyCharts}/${this.charts.size}`);
        return { healthy: healthyCharts, total: this.charts.size };
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.chartMonitor = new ChartMonitor();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartMonitor;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.ChartMonitor = ChartMonitor;
}