/**
 * API Service - Unified Data Access Layer
 * =====================================
 * Centralized service for all data fetching operations
 * with caching, error handling, and retry logic
 */

class ApiService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.baseUrl = '';
        this.retryAttempts = 3;
        this.retryDelay = 1000;
        
        this.endpoints = {
            FRAUD_DATA: 'data/fraud_data.json',
            XAI_DATA: 'data/xai_data.json',
            SENTIMENT_DATA: 'data/sentiment_data.json',
            MODEL_DATA: 'data/model_data.json',
            PERFORMANCE_DATA: 'data/performance_metrics.json',
            BUSINESS_DATA: 'data/business_metrics.json'
        };
    }
    
    /**
     * Generic fetch with retry logic and caching
     */
    async fetch(url, options = {}) {
        const cacheKey = this.getCacheKey(url, options);
        
        // Check cache first
        if (this.isCached(cacheKey)) {
            return this.getFromCache(cacheKey);
        }
        
        let lastError;
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                const response = await this.performFetch(url, options);
                const data = await response.json();
                
                // Cache successful response
                this.setCache(cacheKey, data);
                return data;
                
            } catch (error) {
                lastError = error;
                if (attempt < this.retryAttempts) {
                    await this.delay(this.retryDelay * attempt);
                }
            }
        }
        
        throw new Error(`Failed to fetch ${url} after ${this.retryAttempts} attempts: ${lastError.message}`);
    }
    
    /**
     * Load dashboard data with priority-based loading
     */
    async loadDashboardData() {
        const dataSources = [
            { name: 'fraud_data', endpoint: this.endpoints.FRAUD_DATA, priority: 'critical' },
            { name: 'xai_data', endpoint: this.endpoints.XAI_DATA, priority: 'high' },
            { name: 'model_data', endpoint: this.endpoints.MODEL_DATA, priority: 'high' },
            { name: 'performance_data', endpoint: this.endpoints.PERFORMANCE_DATA, priority: 'normal' },
            { name: 'sentiment_data', endpoint: this.endpoints.SENTIMENT_DATA, priority: 'normal' },
            { name: 'business_data', endpoint: this.endpoints.BUSINESS_DATA, priority: 'low' }
        ];
        
        return this.loadDataWithPriority(dataSources);
    }
    
    /**
     * Load data sources based on priority
     */
    async loadDataWithPriority(dataSources) {
        const result = {};
        const priorities = ['critical', 'high', 'normal', 'low'];
        
        for (const priority of priorities) {
            const sources = dataSources.filter(s => s.priority === priority);
            
            if (priority === 'critical' || priority === 'high') {
                // Sequential loading for critical/high priority
                for (const source of sources) {
                    try {
                        result[source.name] = await this.fetch(source.endpoint);
                    } catch (error) {
                        console.warn(`⚠️ Failed to load ${source.name}:`, error.message);
                        result[source.name] = this.getFallbackData(source.name);
                    }
                }
            } else {
                // Parallel loading for normal/low priority
                const promises = sources.map(async source => {
                    try {
                        const data = await this.fetch(source.endpoint);
                        return { name: source.name, data, success: true };
                    } catch (error) {
                        console.warn(`⚠️ Failed to load ${source.name}:`, error.message);
                        return { name: source.name, data: this.getFallbackData(source.name), success: false };
                    }
                });
                
                const results = await Promise.allSettled(promises);
                results.forEach(result => {
                    if (result.status === 'fulfilled') {
                        const { name, data } = result.value;
                        result[name] = data;
                    }
                });
            }
        }
        
        return result;
    }
    
    /**
     * Load specific data type
     */
    async loadFraudData() {
        return this.fetch(this.endpoints.FRAUD_DATA);
    }
    
    async loadXAIData() {
        return this.fetch(this.endpoints.XAI_DATA);
    }
    
    async loadSentimentData() {
        return this.fetch(this.endpoints.SENTIMENT_DATA);
    }
    
    async loadModelData() {
        return this.fetch(this.endpoints.MODEL_DATA);
    }
    
    async loadPerformanceData() {
        return this.fetch(this.endpoints.PERFORMANCE_DATA);
    }
    
    async loadBusinessData() {
        return this.fetch(this.endpoints.BUSINESS_DATA);
    }
    
    /**
     * Batch load multiple data sources
     */
    async batchLoad(dataTypes) {
        const promises = dataTypes.map(type => {
            const methodName = `load${type.charAt(0).toUpperCase() + type.slice(1)}Data`;
            if (typeof this[methodName] === 'function') {
                return this[methodName]().catch(error => ({ error: error.message, type }));
            }
            return Promise.resolve({ error: `Unknown data type: ${type}`, type });
        });
        
        const results = await Promise.allSettled(promises);
        const data = {};
        
        results.forEach((result, index) => {
            const type = dataTypes[index];
            if (result.status === 'fulfilled' && !result.value.error) {
                data[type] = result.value;
            } else {
                data[type] = this.getFallbackData(type);
            }
        });
        
        return data;
    }
    
    /**
     * Cache management
     */
    getCacheKey(url, options = {}) {
        return `${url}_${JSON.stringify(options)}`;
    }
    
    isCached(key) {
        const cached = this.cache.get(key);
        if (!cached) return false;
        
        const isExpired = Date.now() - cached.timestamp > this.cacheTimeout;
        if (isExpired) {
            this.cache.delete(key);
            return false;
        }
        
        return true;
    }
    
    getFromCache(key) {
        return this.cache.get(key).data;
    }
    
    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }
    
    clearCache() {
        this.cache.clear();
    }
    
    /**
     * Helper methods
     */
    async performFetch(url, options) {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response;
    }
    
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Fallback data for when real data fails to load
     */
    getFallbackData(dataType) {
        const fallbacks = {
            fraud_data: {
                transactions: [],
                summary: { total: 0, fraudulent: 0, legitimate: 0 },
                timestamp: new Date().toISOString()
            },
            xai_data: {
                lime_explanations: { fraud_detection: { features: [] } },
                model_decision_process: { fraud_detection: { decision_tree_path: [] } }
            },
            model_data: {
                models: [],
                performance: {},
                timestamp: new Date().toISOString()
            },
            performance_data: {
                metrics: {},
                benchmarks: {},
                timestamp: new Date().toISOString()
            },
            sentiment_data: {
                analysis: [],
                summary: {},
                timestamp: new Date().toISOString()
            },
            business_data: {
                kpis: {},
                trends: {},
                timestamp: new Date().toISOString()
            }
        };
        
        return fallbacks[dataType] || {};
    }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiService;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.ApiService = ApiService;
}