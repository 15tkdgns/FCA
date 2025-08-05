/**
 * Chart Manager
 * Coordinates all chart modules with minimal dependencies
 */

class ChartManager {
    constructor() {
        this.renderer = null;
        this.pieCharts = null;
        this.initialized = false;
        this.modules = {};
        
        this.init();
    }
    
    async init() {
        try {
            // Wait for dependencies
            await this.waitForDependencies();
            
            // Initialize renderer
            this.renderer = new ChartRenderer();
            if (!this.renderer.initialized) {
                throw new Error('ChartRenderer failed to initialize');
            }
            
            // Initialize chart modules
            this.pieCharts = new PieCharts(this.renderer);
            this.barCharts = new BarCharts(this.renderer);
            this.xaiCharts = new XAICharts(this.renderer);
            
            this.initialized = true;
            CommonUtils.log.info('ChartManager initialized successfully', 'ChartManager');
            
            // Make methods available globally for backward compatibility
            this.setupGlobalMethods();
            
        } catch (error) {
            CommonUtils.log.error('ChartManager initialization failed', error, 'ChartManager');
            this.initialized = false;
        }
    }
    
    /**
     * Wait for required dependencies to load
     */
    async waitForDependencies() {
        const maxWait = 30000; // 30 seconds (increased)
        const checkInterval = 200;
        let waited = 0;
        
        while (waited < maxWait) {
            // Check only critical dependencies
            if (typeof Plotly !== 'undefined') {
                // Optional dependencies - don't block initialization
                const optionalDeps = [
                    typeof ChartRenderer !== 'undefined',
                    typeof PieCharts !== 'undefined',
                    typeof BarCharts !== 'undefined',
                    typeof XAICharts !== 'undefined'
                ];
                
                const loadedCount = optionalDeps.filter(Boolean).length;
                console.log(`📦 ChartManager: ${loadedCount}/4 optional dependencies loaded`);
                
                return true; // Continue with what we have
            }
            
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            waited += checkInterval;
        }
        
        throw new Error('Required dependencies not loaded within timeout');
    }
    
    /**
     * Setup global methods for backward compatibility
     */
    setupGlobalMethods() {
        window.FCACharts = {
            // Pie charts
            renderFraudDistribution: (data) => this.renderFraudDistribution(data),
            renderSentimentDistribution: (data) => this.renderSentimentDistribution(data), 
            renderCustomerSegments: (data) => this.renderCustomerSegments(data),
            
            // Bar charts
            renderModelComparison: (data) => this.renderModelComparison(data),
            renderFraudFeatureImportance: (data) => this.renderFraudFeatureImportance(data),
            renderAttritionFeatureImportance: (data) => this.renderAttritionFeatureImportance(data),
            
            // XAI charts
            renderLIMEExplanation: (data) => this.renderLIMEExplanation(data),
            renderModelDecisionProcess: (data) => this.renderModelDecisionProcess(data),
            renderPredictionConfidence: (data) => this.renderPredictionConfidence(data),
            renderFeatureInteraction: (data) => this.renderFeatureInteraction(data),
            renderTrainingProcess: (data) => this.renderTrainingProcess(data),
            renderModelComparisonAnalysis: (data) => this.renderModelComparisonAnalysis(data),
            
            // Utility methods
            initialized: () => this.initialized,
            getRenderer: () => this.renderer,
            healthCheck: () => this.healthCheck()
        };
        
        console.log('🔗 Global FCACharts methods setup complete');
    }
    
    /**
     * Render fraud distribution chart with error handling
     */
    async renderFraudDistribution(chartsData) {
        if (!this.initialized) {
            console.error('❌ ChartManager not initialized');
            return false;
        }
        
        try {
            console.log('📊 ChartManager: Rendering fraud distribution');
            
            if (!chartsData?.fraud_distribution) {
                console.error('❌ Fraud distribution data missing');
                console.log('Available data:', Object.keys(chartsData || {}));
                this.renderer.renderError('fraud-risk-chart', 'Fraud Distribution', 'Data not available');
                return false;
            }
            
            return await this.pieCharts.renderFraudDistribution(chartsData.fraud_distribution);
            
        } catch (error) {
            console.error('❌ Error rendering fraud distribution:', error);
            this.renderer.renderError('fraud-risk-chart', 'Fraud Distribution', error.message);
            return false;
        }
    }
    
    /**
     * Render sentiment distribution chart with error handling
     */
    async renderSentimentDistribution(chartsData) {
        if (!this.initialized) {
            console.error('❌ ChartManager not initialized');
            return false;
        }
        
        try {
            console.log('📊 ChartManager: Rendering sentiment distribution');
            
            // This chart has fallback data built-in
            return await this.pieCharts.renderSentimentDistribution(chartsData?.sentiment_distribution);
            
        } catch (error) {
            console.error('❌ Error rendering sentiment distribution:', error);
            this.renderer.renderError('sentiment-distribution-chart', 'Sentiment Distribution', error.message);
            return false;
        }
    }
    
    /**
     * Render customer segments chart with error handling
     */
    async renderCustomerSegments(chartsData) {
        if (!this.initialized) {
            console.error('❌ ChartManager not initialized');
            return false;
        }
        
        try {
            console.log('📊 ChartManager: Rendering customer segments');
            
            // This chart has fallback data built-in
            return await this.pieCharts.renderCustomerSegments(chartsData?.customer_segments);
            
        } catch (error) {
            console.error('❌ Error rendering customer segments:', error);
            this.renderer.renderError('customer-segments-chart', 'Customer Segments', error.message);
            return false;
        }
    }
    
    /**
     * Render model comparison chart with error handling
     */
    async renderModelComparison(chartsData) {
        if (!this.initialized) {
            console.error('❌ ChartManager not initialized');
            return false;
        }
        
        try {
            console.log('📊 ChartManager: Rendering model comparison');
            
            if (!chartsData?.model_comparison) {
                console.error('❌ Model comparison data missing');
                this.renderer.renderError('model-performance-chart', 'Model Comparison', 'Data not available');
                return false;
            }
            
            return await this.barCharts.renderModelComparison(chartsData.model_comparison);
            
        } catch (error) {
            console.error('❌ Error rendering model comparison:', error);
            this.renderer.renderError('model-performance-chart', 'Model Comparison', error.message);
            return false;
        }
    }
    
    /**
     * Render fraud feature importance chart with error handling
     */
    renderFraudFeatureImportance(chartsData) {
        if (!this.initialized) {
            console.error('❌ ChartManager not initialized');
            return false;
        }
        
        try {
            console.log('📊 ChartManager: Rendering fraud feature importance');
            
            let data;
            if (chartsData?.feature_importance?.fraud) {
                data = {
                    features: chartsData.feature_importance.fraud.labels,
                    values: chartsData.feature_importance.fraud.data
                };
            } else {
                console.error('❌ Fraud feature importance data missing');
                this.renderer.renderError('fraud-feature-importance-main-chart', 'Fraud Feature Importance', 'Data not available');
                return false;
            }
            
            return this.barCharts.renderFraudFeatureImportance(data);
            
        } catch (error) {
            console.error('❌ Error rendering fraud feature importance:', error);
            this.renderer.renderError('fraud-feature-importance-main-chart', 'Fraud Feature Importance', error.message);
            return false;
        }
    }
    
    /**
     * Render attrition feature importance chart with error handling
     */
    renderAttritionFeatureImportance(chartsData) {
        if (!this.initialized) {
            console.error('❌ ChartManager not initialized');
            return false;
        }
        
        try {
            console.log('📊 ChartManager: Rendering attrition feature importance');
            
            let data;
            if (chartsData?.feature_importance?.attrition) {
                data = {
                    features: chartsData.feature_importance.attrition.labels,
                    values: chartsData.feature_importance.attrition.data
                };
            } else {
                console.error('❌ Attrition feature importance data missing');
                this.renderer.renderError('attrition-feature-importance-chart', 'Attrition Feature Importance', 'Data not available');
                return false;
            }
            
            return this.barCharts.renderAttritionFeatureImportance(data);
            
        } catch (error) {
            console.error('❌ Error rendering attrition feature importance:', error);
            this.renderer.renderError('attrition-feature-importance-chart', 'Attrition Feature Importance', error.message);
            return false;
        }
    }
    
    /**
     * Render all dashboard charts with optimized sequencing
     */
    async renderAllCharts(chartsData) {
        if (!this.initialized) {
            console.error('❌ ChartManager not initialized');
            return false;
        }
        
        console.log('📈 Rendering all charts with data:', chartsData);
        
        const results = {};
        const chartQueue = [
            { name: 'model', method: 'renderModelComparison' },
            { name: 'fraud', method: 'renderFraudDistribution' },
            { name: 'sentiment', method: 'renderSentimentDistribution' },
            { name: 'segments', method: 'renderCustomerSegments' }
        ];
        
        // Pre-render DOM stability check
        await this.ensureDOMReady();
        
        try {
            // Render charts with optimized timing
            for (let i = 0; i < chartQueue.length; i++) {
                const chart = chartQueue[i];
                const containerId = this.getContainerIdForChart(chart.name);
                
                console.log(`📊 ChartManager: Rendering ${chart.name} (${i+1}/${chartQueue.length})`);
                
                // Show loading state for each chart
                if (this.renderer && this.renderer.renderLoadingState) {
                    this.renderer.renderLoadingState(containerId, 'Preparing chart...');
                }
                
                // Ensure container exists before rendering
                await this.waitForContainer(containerId);
                
                results[chart.name] = await this[chart.method](chartsData);
                
                // Progressive delay - more time between earlier charts
                if (i < chartQueue.length - 1) {
                    const delay = 300 + (i * 100); // 300ms, 400ms, 500ms
                    await this.delay(delay);
                }
            }
            
        } catch (error) {
            console.error('❌ Error during chart rendering sequence:', error);
        }
        
        const successCount = Object.values(results).filter(Boolean).length;
        console.log(`✅ Charts rendered: ${successCount}/4 successful`);
        
        return results;
    }
    
    /**
     * Ensure DOM is ready and stable for chart rendering
     */
    async ensureDOMReady() {
        return new Promise(resolve => {
            if (document.readyState === 'complete') {
                // Additional stability wait
                setTimeout(resolve, 100);
            } else {
                document.addEventListener('DOMContentLoaded', () => {
                    setTimeout(resolve, 100);
                });
            }
        });
    }
    
    /**
     * Wait for specific container to be available in DOM
     */
    async waitForContainer(containerId, timeout = 5000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            const container = document.getElementById(containerId);
            if (container) {
                // Container found, wait a bit more for stability
                await this.delay(50);
                return container;
            }
            await this.delay(100);
        }
        
        console.warn(`⚠️ Container ${containerId} not found within ${timeout}ms`);
        return null;
    }
    
    /**
     * Get container ID for chart name
     */
    getContainerIdForChart(chartName) {
        const mapping = {
            'model': 'model-performance-chart',
            'fraud': 'fraud-risk-chart',
            'sentiment': 'sentiment-distribution-chart',
            'segments': 'customer-segments-chart'
        };
        return mapping[chartName] || chartName;
    }
    
    /**
     * Recovery method for failed charts
     */
    async recoverChart(containerId) {
        console.log(`🔧 ChartManager: Attempting to recover chart ${containerId}`);
        
        // Find the chart type and re-render
        const chartMap = {
            'model-performance-chart': 'renderModelComparison',
            'fraud-risk-chart': 'renderFraudDistribution',
            'sentiment-distribution-chart': 'renderSentimentDistribution',
            'customer-segments-chart': 'renderCustomerSegments'
        };
        
        const method = chartMap[containerId];
        if (!method) {
            console.error(`❌ No recovery method for chart ${containerId}`);
            return false;
        }
        
        try {
            // Get cached data if available
            const cachedData = window.dashboardData || {};
            return await this[method](cachedData);
        } catch (error) {
            console.error(`❌ Chart recovery failed for ${containerId}:`, error);
            return false;
        }
    }
    
    /**
     * Helper method to add delays between chart renders
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Render LIME explanation chart
     */
    renderLIMEExplanation(data) {
        if (!this.initialized) {
            console.error('❌ ChartManager not initialized');
            return false;
        }
        
        try {
            console.log('📊 ChartManager: Rendering LIME explanation');
            return this.xaiCharts.renderLIMEExplanation(data);
        } catch (error) {
            console.error('❌ Error rendering LIME explanation:', error);
            this.renderer.renderError('lime-explanation-chart', 'LIME Explanation', error.message);
            return false;
        }
    }
    
    /**
     * Render model decision process chart
     */
    renderModelDecisionProcess(data) {
        if (!this.initialized) {
            console.error('❌ ChartManager not initialized');
            return false;
        }
        
        try {
            console.log('📊 ChartManager: Rendering model decision process');
            return this.xaiCharts.renderModelDecisionProcess(data);
        } catch (error) {
            console.error('❌ Error rendering model decision process:', error);
            this.renderer.renderError('decision-process-chart', 'Decision Process', error.message);
            return false;
        }
    }
    
    /**
     * Render prediction confidence chart
     */
    renderPredictionConfidence(data) {
        if (!this.initialized) {
            console.error('❌ ChartManager not initialized');
            return false;
        }
        
        try {
            console.log('📊 ChartManager: Rendering prediction confidence');
            return this.xaiCharts.renderPredictionConfidence(data);
        } catch (error) {
            console.error('❌ Error rendering prediction confidence:', error);
            this.renderer.renderError('confidence-chart', 'Prediction Confidence', error.message);
            return false;
        }
    }
    
    /**
     * Render feature interaction chart
     */
    renderFeatureInteraction(data) {
        if (!this.initialized) {
            console.error('❌ ChartManager not initialized');
            return false;
        }
        
        try {
            console.log('📊 ChartManager: Rendering feature interaction');
            return this.xaiCharts.renderFeatureInteraction(data);
        } catch (error) {
            console.error('❌ Error rendering feature interaction:', error);
            this.renderer.renderError('interaction-chart', 'Feature Interaction', error.message);
            return false;
        }
    }
    
    /**
     * Render training process chart
     */
    renderTrainingProcess(data) {
        if (!this.initialized) {
            console.error('❌ ChartManager not initialized');
            return false;
        }
        
        try {
            console.log('📊 ChartManager: Rendering training process');
            return this.xaiCharts.renderTrainingProcess(data);
        } catch (error) {
            console.error('❌ Error rendering training process:', error);
            this.renderer.renderError('training-process-chart', 'Training Process', error.message);
            return false;
        }
    }
    
    /**
     * Render model comparison analysis chart
     */
    renderModelComparisonAnalysis(data) {
        if (!this.initialized) {
            console.error('❌ ChartManager not initialized');
            return false;
        }
        
        try {
            console.log('📊 ChartManager: Rendering model comparison analysis');
            return this.xaiCharts.renderModelComparison(data);
        } catch (error) {
            console.error('❌ Error rendering model comparison analysis:', error);
            this.renderer.renderError('model-comparison-chart', 'Model Comparison', error.message);
            return false;
        }
    }
    
    /**
     * Health check for all modules
     */
    healthCheck() {
        const status = {
            manager: this.initialized,
            renderer: this.renderer?.initialized || false,
            pieCharts: !!this.pieCharts,
            plotly: typeof Plotly !== 'undefined'
        };
        
        console.log('🏥 ChartManager health check:', status);
        return status;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.chartManager = new ChartManager();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartManager;
}