/**
 * Static Chart Fallback System
 * Handles fallback to static chart images when JavaScript charts fail
 */

class StaticChartFallback {
    constructor() {
        this.baseImagePath = 'assets/images/charts';
        this.chartMapping = this.initializeChartMapping();
        this.fallbackAttempts = new Map();
        this.maxRetries = 3;
        
        console.log('🖼️ StaticChartFallback initialized');
    }
    
    /**
     * Initialize chart ID to image filename mapping
     */
    initializeChartMapping() {
        return {
            // Dashboard main charts
            'model-performance-chart': 'model_comparison.png',
            'fraud-risk-chart': 'fraud_distribution.png',
            'sentiment-distribution-chart': 'sentiment_distribution.png',
            'customer-segments-chart': 'customer_segments.png',
            
            // XAI charts
            'lime-explanation-chart': 'lime_explanation.png',
            'decision-tree-chart': 'lime_explanation.png',
            'confidence-distribution-chart': 'prediction_confidence.png',
            'feature-interaction-chart': 'feature_interaction.png',
            
            // XAI charts (new IDs)
            'lime-explanation-xai-chart': 'lime_explanation.png',
            'decision-tree-xai-chart': 'lime_explanation.png',
            'confidence-distribution-xai-chart': 'prediction_confidence.png',
            'feature-interaction-xai-chart': 'feature_interaction.png',
            'training-curves-chart': 'training_process.png',
            'model-comparison-chart': 'model_comparison.png',
            'fraud-feature-importance-chart': 'fraud_feature_importance.png',
            
            // Additional XAI charts
            'partial-dependence-chart': 'partial_dependence.png',
            'accuracy-by-feature-chart': 'accuracy_by_feature.png',
            'correlation-network-chart': 'correlation_network.png',
            'shap-waterfall-chart': 'shap_waterfall.png',
            'fairness-analysis-chart': 'fairness_analysis.png',
            
            // Global charts (fallbacks)
            'global-feature-importance-chart': 'fraud_feature_importance.png',
            'model-comparison-xai-chart': 'model_comparison.png',
            'complexity-analysis-chart': 'feature_interaction.png',
            'data-pipeline-chart': 'training_process.png',
            'error-analysis-chart': 'prediction_confidence.png',
            'edge-case-chart': 'shap_waterfall.png',
            'processing-pipeline-chart': 'training_process.png',
            'data-leakage-chart': 'correlation_network.png',
            'overfitting-chart': 'training_process.png',
            'validation-metrics-chart': 'model_comparison.png',
            'hyperparameter-optimization-chart': 'partial_dependence.png',
            'model-complexity-chart': 'feature_interaction.png',
            'cross-validation-chart': 'model_comparison.png',
            'realtime-monitoring-chart': 'training_process.png'
        };
    }
    
    /**
     * Get static image path for a chart container
     */
    getImagePath(containerId) {
        const filename = this.chartMapping[containerId];
        if (!filename) {
            console.warn(`⚠️ No static image mapping for ${containerId}`);
            return null;
        }
        return `${this.baseImagePath}/${filename}`;
    }
    
    /**
     * Check if fallback should be applied (with retry logic)
     */
    shouldApplyFallback(containerId) {
        const attempts = this.fallbackAttempts.get(containerId) || 0;
        if (attempts >= this.maxRetries) {
            console.warn(`⚠️ Max fallback attempts reached for ${containerId}`);
            return false;
        }
        return true;
    }
    
    /**
     * Apply static chart fallback
     */
    applyFallback(containerId, reason = 'Chart rendering failed') {
        if (!this.shouldApplyFallback(containerId)) {
            return false;
        }
        
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`❌ Container ${containerId} not found for fallback`);
            return false;
        }
        
        const imagePath = this.getImagePath(containerId);
        if (!imagePath) {
            console.warn(`⚠️ No static image available for ${containerId}`);
            this.renderNoImagePlaceholder(container, containerId, reason);
            return false;
        }
        
        // Increment attempt counter
        const attempts = this.fallbackAttempts.get(containerId) || 0;
        this.fallbackAttempts.set(containerId, attempts + 1);
        
        console.log(`🖼️ Applying static fallback for ${containerId}: ${imagePath} (attempt ${attempts + 1})`);
        
        // Create fallback HTML
        const fallbackHTML = this.createFallbackHTML(containerId, imagePath, reason);
        container.innerHTML = fallbackHTML;
        
        // Add success class for monitoring
        container.classList.add('chart-static-fallback-applied');
        
        return true;
    }
    
    /**
     * Create fallback HTML content
     */
    createFallbackHTML(containerId, imagePath, reason) {
        const chartTitle = this.getChartTitle(containerId);
        
        return `
            <div class="chart-static-fallback" style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                min-height: 300px;
                background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
                border: 1px solid #e9ecef;
                border-radius: 8px;
                text-align: center;
                padding: 20px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            ">
                <div style="margin-bottom: 15px;">
                    <h6 style="margin: 0; color: #495057; font-weight: 600;">${chartTitle}</h6>
                    <small style="color: #6c757d; font-size: 0.8rem;">Static Chart (JavaScript Fallback)</small>
                </div>
                
                <div style="position: relative; max-width: 100%; max-height: 400px; overflow: hidden; border-radius: 6px;">
                    <img src="${imagePath}" 
                         alt="Static Chart - ${containerId}" 
                         style="
                             width: 100%;
                             height: auto;
                             max-width: 100%;
                             max-height: 400px;
                             object-fit: contain;
                             border-radius: 6px;
                             box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                         "
                         onload="this.parentElement.parentElement.style.minHeight = 'auto'"
                         onerror="this.parentElement.innerHTML='<div style=\\"padding: 40px; color: #dc3545; text-align: center;\\"><i class=\\"fas fa-exclamation-triangle\\" style=\\"font-size: 2rem; margin-bottom: 10px;\\"></i><br><strong>Chart Image Unavailable</strong><br><small>${reason}</small></div>'">
                </div>
                
                <div style="margin-top: 10px; font-size: 0.75rem; color: #6c757d; display: flex; align-items: center; gap: 5px;">
                    <i class="fas fa-image" style="opacity: 0.7;"></i>
                    <span>Generated by matplotlib</span>
                </div>
            </div>
        `;
    }
    
    /**
     * Render placeholder when no image is available
     */
    renderNoImagePlaceholder(container, containerId, reason) {
        const chartTitle = this.getChartTitle(containerId);
        
        container.innerHTML = `
            <div class="chart-no-fallback" style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                min-height: 250px;
                background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
                border: 2px dashed #ffc107;
                border-radius: 8px;
                text-align: center;
                padding: 30px;
            ">
                <div style="font-size: 3rem; margin-bottom: 15px; color: #856404;">📊</div>
                <h6 style="margin-bottom: 10px; color: #856404; font-weight: 600;">${chartTitle}</h6>
                <p style="margin: 0; color: #856404; font-size: 0.9rem;">Chart Temporarily Unavailable</p>
                <small style="margin-top: 10px; color: #6c757d; font-size: 0.75rem;">${reason}</small>
            </div>
        `;
        
        container.classList.add('chart-no-fallback-applied');
    }
    
    /**
     * Get human-readable chart title from container ID
     */
    getChartTitle(containerId) {
        const titleMap = {
            'model-performance-chart': 'Model Performance Comparison',
            'fraud-risk-chart': 'Fraud Risk Distribution',
            'sentiment-distribution-chart': 'Sentiment Distribution',
            'customer-segments-chart': 'Customer Segments',
            'lime-explanation-chart': 'LIME Local Explanation',
            'decision-tree-chart': 'Model Decision Process',
            'confidence-distribution-chart': 'Prediction Confidence',
            'feature-interaction-chart': 'Feature Interaction Matrix',
            'training-curves-chart': 'Training Process',
            'model-comparison-chart': 'Model Comparison Analysis',
            'fraud-feature-importance-chart': 'Feature Importance',
            'partial-dependence-chart': 'Partial Dependence Plot',
            'accuracy-by-feature-chart': 'Model Accuracy by Feature',
            'correlation-network-chart': 'Feature Correlation Network',
            'shap-waterfall-chart': 'SHAP Waterfall Plot',
            'fairness-analysis-chart': 'Fairness Analysis'
        };
        
        return titleMap[containerId] || containerId.replace(/-/g, ' ').replace(/chart$/, '').trim();
    }
    
    /**
     * Check if container has static fallback applied
     */
    hasFallbackApplied(containerId) {
        const container = document.getElementById(containerId);
        return container && (
            container.classList.contains('chart-static-fallback-applied') ||
            container.classList.contains('chart-no-fallback-applied') ||
            container.querySelector('.chart-static-fallback') ||
            container.querySelector('.chart-no-fallback')
        );
    }
    
    /**
     * Reset fallback attempts for a container
     */
    resetAttempts(containerId) {
        this.fallbackAttempts.delete(containerId);
    }
    
    /**
     * Get fallback statistics
     */
    getStats() {
        return {
            totalMappings: Object.keys(this.chartMapping).length,
            appliedFallbacks: this.fallbackAttempts.size,
            attempts: Array.from(this.fallbackAttempts.values()).reduce((sum, count) => sum + count, 0)
        };
    }
    
    /**
     * Batch apply fallbacks to multiple containers
     */
    batchApplyFallbacks(containerIds, reason = 'Bulk fallback application') {
        const results = [];
        
        for (const containerId of containerIds) {
            const success = this.applyFallback(containerId, reason);
            results.push({ containerId, success });
        }
        
        const successful = results.filter(r => r.success).length;
        console.log(`📊 Batch fallback applied: ${successful}/${containerIds.length} successful`);
        
        return results;
    }
}

// Create global instance
window.staticChartFallback = new StaticChartFallback();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StaticChartFallback;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.StaticChartFallback = StaticChartFallback;
}