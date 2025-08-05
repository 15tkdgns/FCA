/**
 * DashboardLoader Module
 * ======================
 * 
 * Manages dashboard initialization with advanced async loading
 */

import { AsyncChartLoader } from './AsyncChartLoader.js';

export class DashboardLoader {
    constructor() {
        this.chartLoader = null;
        this.loadingProgress = 0;
        this.totalCharts = 0;
        this.isLoading = false;
        this.isInitialized = false;
        
        // Don't call init() in constructor - it should be called explicitly
    }

    /**
     * Initialize dashboard with async chart loading
     */
    async init() {
        if (this.isInitialized) {
            console.log('⚠️ DashboardLoader already initialized');
            return;
        }
        
        try {
            console.log('🚀 DashboardLoader: Starting initialization...');
            
            // Initialize async chart loader
            this.chartLoader = new AsyncChartLoader({
                retryAttempts: 3,
                retryDelay: 1500,
                lazyLoadOffset: 200,
                loadingDelay: 150,
                enableIntersectionObserver: true
            });

            await this.chartLoader.init();
            console.log('✅ DashboardLoader: AsyncChartLoader ready');

            // Setup page visibility handling
            this.setupVisibilityHandling();
            
            this.isInitialized = true;
            console.log('✅ DashboardLoader initialization complete');
            
        } catch (error) {
            console.error('❌ DashboardLoader initialization failed:', error);
            this.isInitialized = false;
            throw error;
        }
    }

    /**
     * Load dashboard with prioritized chart loading
     */
    async loadDashboard(page = 'fraud') {
        if (this.isLoading) {
            console.warn('⚠️ Dashboard loading already in progress');
            return;
        }

        this.isLoading = true;
        console.log(`📊 Loading dashboard: ${page}`);

        try {
            // Show global loading indicator
            this.showGlobalLoading();

            // Load charts based on page
            await this.loadPageCharts(page);

            // Start sequential loading for non-lazy charts
            const results = await this.chartLoader.loadChartsSequentially();
            
            // Update progress
            this.updateLoadingProgress(results);

            // Hide global loading indicator
            this.hideGlobalLoading();

            console.log('✅ Dashboard loading complete');
            
        } catch (error) {
            console.error('❌ Dashboard loading failed:', error);
            this.showLoadingError(error);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Load charts for specific page with priorities
     */
    async loadPageCharts(page) {
        const chartConfigs = this.getPageChartConfigs(page);
        
        console.log(`📋 Queueing ${chartConfigs.length} charts for page: ${page}`);
        this.totalCharts = chartConfigs.length;

        // Queue all charts
        for (const config of chartConfigs) {
            this.chartLoader.queueChart(config);
        }
    }

    /**
     * Get chart configurations for each page
     */
    getPageChartConfigs(page) {
        const configs = {
            fraud: this.getFraudPageCharts(),
            sentiment: this.getSentimentPageCharts(), 
            attrition: this.getAttritionPageCharts(),
            xai: this.getXAIPageCharts()
        };

        return configs[page] || [];
    }

    /**
     * Fraud detection page charts
     */
    getFraudPageCharts() {
        return [
            {
                containerId: 'fraud-distribution-chart',
                chartType: 'pie',
                data: {
                    labels: ['Normal Transaction', 'Fraud Transaction', 'Suspicious Transaction'],
                    values: [850, 120, 30]
                },
                options: { title: 'Fraud Transaction Distribution' },
                priority: 'critical',
                lazy: false
            },
            {
                containerId: 'fraud-feature-importance-chart',
                chartType: 'bar',
                data: {
                    x: ['V14', 'V12', 'V10', 'Amount', 'V17', 'V4'],
                    y: [0.42, 0.38, 0.31, 0.28, 0.25, 0.19]
                },
                options: { 
                    title: 'Feature Importance (Fraud Detection)',
                    xTitle: 'Features',
                    yTitle: 'Importance Score'
                },
                priority: 'high',
                lazy: false
            },
            {
                containerId: 'fraud-performance-trend-chart',
                chartType: 'line',
                data: {
                    x: ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06'],
                    y: [0.91, 0.93, 0.94, 0.96, 0.95, 0.97]
                },
                options: {
                    title: 'Monthly Performance Trend',
                    xTitle: 'Month',
                    yTitle: 'Accuracy'
                },
                priority: 'normal',
                lazy: true
            },
            {
                containerId: 'fraud-confusion-matrix-chart',
                chartType: 'heatmap',
                data: {
                    z: [[850, 23, 5], [12, 95, 8], [3, 7, 22]],
                    x: ['Normal', 'Fraud', 'Suspicious'],
                    y: ['Normal', 'Fraud', 'Suspicious']
                },
                options: {
                    title: 'Confusion Matrix',
                    xTitle: 'Predicted',
                    yTitle: 'Actual'
                },
                priority: 'normal',
                lazy: true
            }
        ];
    }

    /**
     * XAI page charts with special handling
     */
    getXAIPageCharts() {
        return [
            {
                containerId: 'lime-explanation-xai-chart',
                chartType: 'lime',
                data: {
                    features: [
                        { name: "Transaction Amount", impact: 0.42 },
                        { name: "Time Period", impact: 0.38 },
                        { name: "Transaction Count", impact: -0.31 },
                        { name: "Region Code", impact: 0.28 },
                        { name: "Card Type", impact: -0.25 }
                    ]
                },
                options: { title: 'LIME Local Explanation' },
                priority: 'critical',
                lazy: false
            },
            {
                containerId: 'decision-tree-xai-chart',
                chartType: 'decision',
                data: {
                    steps: [
                        { feature: "Transaction Amount", gini: 0.45, samples: 1000 },
                        { feature: "Time Period", gini: 0.32, samples: 234 },
                        { feature: "Transaction Count", gini: 0.18, samples: 89 },
                        { feature: "Region Code", gini: 0.08, samples: 23 }
                    ]
                },
                options: { 
                    title: 'Model Decision Process',
                    yTitle: 'Gini Impurity'
                },
                priority: 'high',
                lazy: false
            },
            {
                containerId: 'confidence-distribution-xai-chart',
                chartType: 'confidence',
                data: {
                    bins: ["0-10%", "10-20%", "20-30%", "30-40%", "40-50%", 
                           "50-60%", "60-70%", "70-80%", "80-90%", "90-100%"],
                    counts: [45, 123, 234, 456, 678, 543, 432, 321, 234, 156]
                },
                options: { title: 'Prediction Confidence Distribution' },
                priority: 'normal',
                lazy: true
            },
            {
                containerId: 'feature-interaction-xai-chart',
                chartType: 'heatmap',
                data: {
                    z: [
                        [1.00, 0.73, 0.45, 0.67, -0.23],
                        [0.73, 1.00, 0.56, 0.48, -0.19],
                        [0.45, 0.56, 1.00, 0.39, -0.15],
                        [0.67, 0.48, 0.39, 1.00, -0.21],
                        [-0.23, -0.19, -0.15, -0.21, 1.00]
                    ],
                    x: ["Transaction Amount", "Time Period", "Transaction Count", "Region Code", "Card Type"],
                    y: ["Transaction Amount", "Time Period", "Transaction Count", "Region Code", "Card Type"]
                },
                options: {
                    title: 'Feature Interaction Matrix',
                    xTitle: 'Features',
                    yTitle: 'Features'
                },
                priority: 'low',
                lazy: true
            }
        ];
    }

    /**
     * Sentiment analysis page charts
     */
    getSentimentPageCharts() {
        return [
            {
                containerId: 'sentiment-distribution-chart',
                chartType: 'pie',
                data: {
                    labels: ['Positive', 'Neutral', 'Negative'],
                    values: [60, 25, 15]
                },
                options: { title: 'Sentiment Distribution' },
                priority: 'critical',
                lazy: false
            },
            {
                containerId: 'sentiment-trend-chart',
                chartType: 'line',
                data: {
                    x: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    y: [0.65, 0.68, 0.72, 0.69, 0.74, 0.76]
                },
                options: {
                    title: 'Sentiment Trend Over Time',
                    xTitle: 'Month',
                    yTitle: 'Positive Sentiment Ratio'
                },
                priority: 'high',
                lazy: true
            }
        ];
    }

    /**
     * Customer attrition page charts
     */
    getAttritionPageCharts() {
        return [
            {
                containerId: 'customer-segments-chart',
                chartType: 'pie',
                data: {
                    labels: ['Champions', 'At Risk', 'VIP', 'Standard'],
                    values: [2456, 987, 456, 1834]
                },
                options: { title: 'Customer Segments' },
                priority: 'critical',
                lazy: false
            },
            {
                containerId: 'attrition-feature-importance-chart',
                chartType: 'bar',
                data: {
                    x: ['Customer_Value_Score', 'IsActiveMember', 'Age', 'NumOfProducts', 'Balance'],
                    y: [0.284, 0.223, 0.187, 0.156, 0.134]
                },
                options: {
                    title: 'Attrition Prediction Feature Importance',
                    xTitle: 'Features',
                    yTitle: 'Importance'
                },
                priority: 'high',
                lazy: true
            }
        ];
    }

    /**
     * Setup page visibility handling for performance
     */
    setupVisibilityHandling() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('📴 Page hidden, pausing chart loading');
                // Could pause loading here if needed
            } else {
                console.log('👁️ Page visible, resuming chart loading');
                // Could resume loading here if needed
            }
        });
    }

    /**
     * Show global loading indicator
     */
    showGlobalLoading() {
        const indicator = document.getElementById('global-loading-indicator');
        if (indicator) {
            indicator.style.display = 'flex';
        }

        // Create if doesn't exist
        if (!indicator) {
            const loadingHTML = `
                <div id="global-loading-indicator" class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
                     style="background: rgba(255,255,255,0.9); z-index: 9999; display: flex;">
                    <div class="text-center">
                        <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;"></div>
                        <div class="h5">Loading Dashboard...</div>
                        <div class="progress mt-3" style="width: 300px;">
                            <div id="loading-progress-bar" class="progress-bar" role="progressbar" style="width: 0%"></div>
                        </div>
                        <div id="loading-status" class="text-muted mt-2">Initializing...</div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', loadingHTML);
        }
    }

    /**
     * Hide global loading indicator
     */
    hideGlobalLoading() {
        const indicator = document.getElementById('global-loading-indicator');
        if (indicator) {
            setTimeout(() => {
                indicator.style.display = 'none';
            }, 500); // Smooth fade out
        }
    }

    /**
     * Update loading progress
     */
    updateLoadingProgress(results) {
        const successCount = results.filter(r => r.success).length;
        const progress = (successCount / this.totalCharts) * 100;
        
        const progressBar = document.getElementById('loading-progress-bar');
        const statusText = document.getElementById('loading-status');
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        if (statusText) {
            statusText.textContent = `Loaded ${successCount}/${this.totalCharts} charts`;
        }

        this.loadingProgress = progress;
    }

    /**
     * Show loading error
     */
    showLoadingError(error) {
        const statusText = document.getElementById('loading-status');
        if (statusText) {
            statusText.innerHTML = `<span class="text-danger">Loading Error: ${error.message}</span>`;
        }
        
        console.error('Dashboard loading error:', error);
    }

    /**
     * Get loading statistics
     */
    getLoadingStats() {
        if (!this.chartLoader) return null;
        
        return {
            ...this.chartLoader.getLoadingStats(),
            progress: this.loadingProgress,
            isLoading: this.isLoading
        };
    }

    /**
     * Force load visible charts (useful for debugging)
     */
    async forceLoadVisibleCharts() {
        if (!this.chartLoader) return;
        
        const visibleContainers = Array.from(this.chartLoader.loadingQueue.keys())
            .filter(containerId => {
                const element = document.getElementById(containerId);
                return element && this.isElementVisible(element);
            });

        console.log(`🔍 Force loading ${visibleContainers.length} visible charts`);
        
        for (const containerId of visibleContainers) {
            const config = this.chartLoader.loadingQueue.get(containerId);
            if (config && !this.chartLoader.loadedCharts.has(containerId)) {
                await this.chartLoader.loadChart(config);
            }
        }
    }

    /**
     * Check if element is visible in viewport
     */
    isElementVisible(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.chartLoader) {
            this.chartLoader.cleanup();
        }
    }
}

// Note: DashboardLoader should be instantiated and initialized manually
// Example: const loader = new DashboardLoader(); await loader.init();