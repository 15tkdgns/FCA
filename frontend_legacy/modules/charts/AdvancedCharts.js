/**
 * Advanced Charts Module
 * 고급 차트 기능 및 최적화
 */
import { BaseModule } from '../core/BaseModule.js';

export class AdvancedCharts extends BaseModule {
    constructor() {
        super('AdvancedCharts', ['chart.js']);
        this.chartInstances = new Map();
        this.chartQueue = [];
        this.isProcessing = false;
    }

    async onInitialize() {
        this.logger.info('Advanced charts initializing...');
        
        // Add advanced chart styles
        this.addAdvancedChartStyles();
        
        // Initialize chart optimization
        this.initializeChartOptimization();
    }

    async onDestroy() {
        // Destroy all chart instances
        this.chartInstances.forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        
        this.chartInstances.clear();
    }

    addAdvancedChartStyles() {
        const styles = `
            .chart-container {
                position: relative;
                margin: 1rem 0;
            }
            
            .chart-loading {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #666;
                font-size: 14px;
            }
            
            .chart-error {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #dc3545;
                font-size: 14px;
                text-align: center;
            }
            
            .chart-controls {
                display: flex;
                gap: 0.5rem;
                margin: 0.5rem 0;
                flex-wrap: wrap;
            }
            
            .chart-control-btn {
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 4px;
                padding: 0.25rem 0.5rem;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .chart-control-btn:hover {
                background: #e9ecef;
            }
            
            .chart-control-btn.active {
                background: #007bff;
                color: white;
                border-color: #007bff;
            }
        `;
        
        this.addStyles(styles);
    }

    initializeChartOptimization() {
        // Create chart pool for reuse
        this.chartPool = new Map();
        
        // Set up intersection observer for lazy chart loading
        this.setupLazyChartLoading();
        
        this.logger.info('Chart optimization initialized');
    }

    setupLazyChartLoading() {
        if ('IntersectionObserver' in window) {
            this.chartObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const chartContainer = entry.target;
                        this.loadChartForContainer(chartContainer);
                        this.chartObserver.unobserve(chartContainer);
                    }
                });
            }, {
                rootMargin: '50px'
            });
            
            // Observe all chart containers
            document.querySelectorAll('[id$="-chart"]').forEach(container => {
                this.chartObserver.observe(container);
            });
        }
    }

    async loadChartForContainer(container) {
        const chartId = container.id;
        
        // Show loading indicator
        this.showChartLoading(container);
        
        try {
            // Determine chart type and load appropriate chart
            if (chartId.includes('fraud')) {
                await this.createFraudChart(container);
            } else if (chartId.includes('sentiment')) {
                await this.createSentimentChart(container);
            } else if (chartId.includes('attrition')) {
                await this.createAttritionChart(container);
            }
            
        } catch (error) {
            this.logger.error(`Failed to load chart for ${chartId}:`, error);
            this.showChartError(container, error.message);
        }
    }

    showChartLoading(container) {
        const loading = this.createElement('div', { 
            className: 'chart-loading' 
        }, 'Loading chart...');
        
        container.appendChild(loading);
    }

    showChartError(container, message) {
        // Remove loading indicator
        const loading = container.querySelector('.chart-loading');
        if (loading) loading.remove();
        
        const error = this.createElement('div', { 
            className: 'chart-error' 
        }, `Failed to load chart: ${message}`);
        
        container.appendChild(error);
    }

    async createFraudChart(container) {
        // Implementation would create fraud detection charts
        this.logger.info('Creating fraud chart for container:', container.id);
        
        // Simulate chart creation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Remove loading indicator
        const loading = container.querySelector('.chart-loading');
        if (loading) loading.remove();
    }

    async createSentimentChart(container) {
        // Implementation would create sentiment analysis charts
        this.logger.info('Creating sentiment chart for container:', container.id);
        
        // Simulate chart creation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Remove loading indicator
        const loading = container.querySelector('.chart-loading');
        if (loading) loading.remove();
    }

    async createAttritionChart(container) {
        // Implementation would create attrition analysis charts
        this.logger.info('Creating attrition chart for container:', container.id);
        
        // Simulate chart creation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Remove loading indicator
        const loading = container.querySelector('.chart-loading');
        if (loading) loading.remove();
    }

    // Chart utility methods
    createChartControls(container, options = {}) {
        const controls = this.createElement('div', { className: 'chart-controls' });
        
        // Add common controls
        if (options.allowExport !== false) {
            const exportBtn = this.createElement('button', { 
                className: 'chart-control-btn' 
            }, '📊 Export');
            
            this.addEventListener(exportBtn, 'click', () => {
                this.exportChart(container);
            });
            
            controls.appendChild(exportBtn);
        }
        
        if (options.allowFullscreen !== false) {
            const fullscreenBtn = this.createElement('button', { 
                className: 'chart-control-btn' 
            }, '🔍 Fullscreen');
            
            this.addEventListener(fullscreenBtn, 'click', () => {
                this.toggleFullscreen(container);
            });
            
            controls.appendChild(fullscreenBtn);
        }
        
        container.parentNode.insertBefore(controls, container);
        return controls;
    }

    exportChart(container) {
        // Export chart as image or data
        this.logger.info('Exporting chart:', container.id);
        
        const chart = this.chartInstances.get(container.id);
        if (chart && chart.toBase64Image) {
            const link = this.createElement('a', {
                href: chart.toBase64Image(),
                download: `${container.id}-${Date.now()}.png`
            });
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    toggleFullscreen(container) {
        // Toggle fullscreen mode for chart
        container.classList.toggle('chart-fullscreen');
        
        if (container.classList.contains('chart-fullscreen')) {
            // Add fullscreen styles
            container.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: white;
                z-index: 10000;
                padding: 2rem;
                box-sizing: border-box;
            `;
            
            // Add close button
            const closeBtn = this.createElement('button', {
                style: `
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: #dc3545;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    cursor: pointer;
                    font-size: 18px;
                `
            }, '×');
            
            this.addEventListener(closeBtn, 'click', () => {
                this.toggleFullscreen(container);
            });
            
            container.appendChild(closeBtn);
            
        } else {
            // Remove fullscreen styles
            container.style.cssText = '';
            
            // Remove close button
            const closeBtn = container.querySelector('button');
            if (closeBtn) closeBtn.remove();
        }
    }

    // Public API
    getChartInstance(chartId) {
        return this.chartInstances.get(chartId);
    }

    getStatus() {
        return {
            chartCount: this.chartInstances.size,
            queueLength: this.chartQueue.length,
            processing: this.isProcessing
        };
    }
}

export default AdvancedCharts;