/**
 * Data Manager
 * ============
 * 
 * Centralized data loading and caching to reduce code duplication
 * and improve performance through caching.
 */

class DataManager {
    constructor() {
        this.cache = new Map();
        this.loadingPromises = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Load data with caching and error handling
     */
    async loadData(url, options = {}) {
        const cacheKey = `${url}:${JSON.stringify(options)}`;
        
        // Return cached data if available and not expired
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                CommonUtils.log.debug(`Data loaded from cache: ${url}`, 'DataManager');
                return cached.data;
            } else {
                this.cache.delete(cacheKey);
            }
        }
        
        // Return existing loading promise if in progress
        if (this.loadingPromises.has(cacheKey)) {
            CommonUtils.log.debug(`Data loading already in progress: ${url}`, 'DataManager');
            return this.loadingPromises.get(cacheKey);
        }
        
        // Start new loading process
        const loadingPromise = this.fetchData(url, options);
        this.loadingPromises.set(cacheKey, loadingPromise);
        
        try {
            const data = await loadingPromise;
            
            // Cache the result
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            CommonUtils.log.info(`Data loaded successfully: ${url}`, 'DataManager');
            return data;
            
        } catch (error) {
            CommonUtils.log.error(`Data loading failed: ${url}`, error, 'DataManager');
            throw error;
        } finally {
            this.loadingPromises.delete(cacheKey);
        }
    }

    /**
     * Internal fetch method with timeout and validation
     */
    async fetchData(url, options = {}) {
        try {
            const timeout = options.timeout || 5000;
            const response = await CommonUtils.withTimeout(
                fetch(url, {
                    method: options.method || 'GET',
                    headers: options.headers || {},
                    ...options.fetchOptions
                }),
                timeout,
                `Data fetch timeout for ${url}`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Validate required fields if specified
            if (options.requiredFields) {
                CommonUtils.data.validateRequired(data, options.requiredFields);
            }
            
            return data;
            
        } catch (error) {
            if (error.name === 'SyntaxError') {
                throw new Error(`Invalid JSON response from ${url}`);
            }
            throw error;
        }
    }

    /**
     * Load multiple data sources in parallel
     */
    async loadMultipleData(urls, options = {}) {
        try {
            CommonUtils.log.debug(`Loading ${urls.length} data sources in parallel`, 'DataManager');
            
            const promises = urls.map(url => 
                typeof url === 'string' 
                    ? this.loadData(url, options)
                    : this.loadData(url.url, { ...options, ...url.options })
            );
            
            const results = await Promise.all(promises);
            
            CommonUtils.log.info(`Successfully loaded ${results.length} data sources`, 'DataManager');
            return results;
            
        } catch (error) {
            CommonUtils.log.error('Multiple data loading failed', error, 'DataManager');
            throw error;
        }
    }

    /**
     * Load data with priority queue
     */
    async loadDataWithPriority(dataSources) {
        const priorityOrder = ['critical', 'high', 'normal', 'low'];
        
        // Sort by priority
        const sortedSources = [...dataSources].sort((a, b) => {
            const aPriority = priorityOrder.indexOf(a.priority || 'normal');
            const bPriority = priorityOrder.indexOf(b.priority || 'normal');
            return aPriority - bPriority;
        });
        
        const results = {};
        let loadedCount = 0;
        
        for (const source of sortedSources) {
            try {
                CommonUtils.log.progress(
                    loadedCount + 1, 
                    sortedSources.length, 
                    `Loading ${source.name || source.url}`,
                    'DataManager'
                );
                
                results[source.name || source.url] = await this.loadData(source.url, source.options);
                loadedCount++;
                
            } catch (error) {
                CommonUtils.log.error(`Failed to load ${source.name || source.url}`, error, 'DataManager');
                
                // Continue with other sources unless marked as critical
                if (source.priority === 'critical') {
                    throw error;
                }
                
                results[source.name || source.url] = null;
            }
        }
        
        return results;
    }

    /**
     * Dashboard-specific data loading
     */
    async loadDashboardData() {
        const dataSources = [
            { 
                name: 'fraud_data', 
                url: 'data/fraud_data.json', 
                priority: 'critical',
                requiredFields: ['fraud_distribution', 'feature_importance']
            },
            { 
                name: 'xai_data', 
                url: 'data/xai_data.json', 
                priority: 'high',
                requiredFields: ['lime_explanation', 'decision_process']
            },
            { 
                name: 'sentiment_data', 
                url: 'data/sentiment_data.json', 
                priority: 'normal'
            },
            { 
                name: 'attrition_data', 
                url: 'data/attrition_data.json', 
                priority: 'normal'
            },
            { 
                name: 'summary', 
                url: 'data/summary.json', 
                priority: 'low'
            }
        ];
        
        return this.loadDataWithPriority(dataSources);
    }

    /**
     * Clear cache
     */
    clearCache(pattern = null) {
        if (pattern) {
            const regex = new RegExp(pattern);
            for (const [key] of this.cache) {
                if (regex.test(key)) {
                    this.cache.delete(key);
                }
            }
            CommonUtils.log.info(`Cache cleared for pattern: ${pattern}`, 'DataManager');
        } else {
            this.cache.clear();
            CommonUtils.log.info('All cache cleared', 'DataManager');
        }
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
            loadingInProgress: this.loadingPromises.size
        };
    }

    /**
     * Preload data for better performance
     */
    async preloadData(urls, options = {}) {
        try {
            CommonUtils.log.debug('Starting data preload', 'DataManager');
            
            // Load in background without blocking
            const promises = urls.map(url => 
                this.loadData(url, { ...options, priority: 'low' }).catch(error => {
                    CommonUtils.log.warn(`Preload failed for ${url}`, 'DataManager');
                    return null;
                })
            );
            
            await Promise.allSettled(promises);
            CommonUtils.log.info('Data preload completed', 'DataManager');
            
        } catch (error) {
            CommonUtils.log.warn('Data preload failed', 'DataManager');
        }
    }
}

// Global instance
window.DataManager = new DataManager();