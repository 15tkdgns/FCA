/**
 * API Client Module
 * FCA 백엔드와의 통신을 담당하는 모듈
 */
import { BaseModule } from '../core/BaseModule.js';

export class APIClient extends BaseModule {
    constructor() {
        super('APIClient', ['chart.js']);
        this.baseURL = 'http://localhost:5000';
        this.cache = new Map();
        this.requestQueue = [];
        this.isProcessingQueue = false;
        this.performanceStats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            cacheHits: 0,
            activeRequests: 0,
            maxConcurrent: 5,
            queuedRequests: 0,
            cacheEntries: 0,
            totalCacheSize: '0 KB'
        };
        this.cacheTTL = 5 * 60 * 1000; // 5 minutes
    }

    async onInitialize() {
        this.logger.info('API Client initializing...');
        
        // Test connection and set up error handling
        try {
            await this.testConnection();
            this.logger.info('API connection established');
        } catch (error) {
            this.logger.warn('API connection failed, using demo mode');
        }

        // Start queue processor
        this.startQueueProcessor();
        
        // Set up cache cleanup
        this.setupCacheCleanup();
    }

    async onDestroy() {
        this.clearCache();
        this.requestQueue = [];
        this.isProcessingQueue = false;
    }

    async testConnection() {
        try {
            const start = Date.now();
            const response = await this.makeRequest('/api/health', { timeout: 5000 });
            const responseTime = Date.now() - start;

            return {
                connected: true,
                responseTime,
                message: 'Connection successful'
            };
        } catch (error) {
            this.logger.warn('API connection test failed:', error.message);
            return {
                connected: false,
                responseTime: 0,
                message: error.message
            };
        }
    }

    async makeRequest(endpoint, options = {}) {
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        return new Promise((resolve, reject) => {
            const request = {
                id: requestId,
                endpoint,
                options,
                resolve,
                reject,
                timestamp: Date.now()
            };

            this.requestQueue.push(request);
            this.performanceStats.queuedRequests = this.requestQueue.length;
            
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.isProcessingQueue || this.requestQueue.length === 0) {
            return;
        }

        if (this.performanceStats.activeRequests >= this.performanceStats.maxConcurrent) {
            return;
        }

        this.isProcessingQueue = true;
        const request = this.requestQueue.shift();
        this.performanceStats.queuedRequests = this.requestQueue.length;

        if (request) {
            await this.executeRequest(request);
        }

        this.isProcessingQueue = false;

        // Process next request if queue not empty
        if (this.requestQueue.length > 0 && this.performanceStats.activeRequests < this.performanceStats.maxConcurrent) {
            setTimeout(() => this.processQueue(), 10);
        }
    }

    async executeRequest(request) {
        const { endpoint, options, resolve, reject } = request;
        const cacheKey = this.getCacheKey(endpoint, options);
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTTL) {
                this.performanceStats.cacheHits++;
                resolve(cached.data);
                return;
            } else {
                this.cache.delete(cacheKey);
            }
        }

        this.performanceStats.activeRequests++;
        this.performanceStats.totalRequests++;
        
        const startTime = Date.now();

        try {
            const url = `${this.baseURL}${endpoint}`;
            const fetchOptions = {
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            };

            if (options.body && typeof options.body === 'object') {
                fetchOptions.body = JSON.stringify(options.body);
            }

            const response = await fetch(url, fetchOptions);
            const responseTime = Date.now() - startTime;

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Cache successful responses
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });

            // Update performance stats
            this.performanceStats.successfulRequests++;
            this.updateAverageResponseTime(responseTime);
            this.updateCacheStats();

            resolve(data);

        } catch (error) {
            this.performanceStats.failedRequests++;
            this.logger.error(`API request failed for ${endpoint}:`, error);
            
            // Return demo data for development
            const demoData = this.getDemoData(endpoint);
            if (demoData) {
                resolve(demoData);
            } else {
                reject(error);
            }
        } finally {
            this.performanceStats.activeRequests--;
        }
    }

    startQueueProcessor() {
        setInterval(() => {
            if (this.requestQueue.length > 0) {
                this.processQueue();
            }
        }, 100);
    }

    getCacheKey(endpoint, options) {
        return `${endpoint}_${JSON.stringify(options)}`;
    }

    updateAverageResponseTime(responseTime) {
        const total = this.performanceStats.totalRequests;
        const current = this.performanceStats.averageResponseTime;
        this.performanceStats.averageResponseTime = ((current * (total - 1)) + responseTime) / total;
    }

    updateCacheStats() {
        this.performanceStats.cacheEntries = this.cache.size;
        
        let totalSize = 0;
        for (const [key, value] of this.cache) {
            totalSize += JSON.stringify(value).length + key.length;
        }
        
        this.performanceStats.totalCacheSize = totalSize > 1024 
            ? `${(totalSize / 1024).toFixed(1)} KB`
            : `${totalSize} B`;
    }

    setupCacheCleanup() {
        setInterval(() => {
            const now = Date.now();
            for (const [key, value] of this.cache) {
                if (now - value.timestamp > this.cacheTTL) {
                    this.cache.delete(key);
                }
            }
            this.updateCacheStats();
        }, 60000); // Clean every minute
    }

    clearCache() {
        this.cache.clear();
        this.updateCacheStats();
    }

    getPerformanceStats() {
        return { ...this.performanceStats };
    }

    // API Endpoints
    async getSummary() {
        return this.makeRequest('/api/summary');
    }

    async getFraudData() {
        return this.makeRequest('/api/fraud/models');
    }

    async getSentimentData() {
        return this.makeRequest('/api/sentiment/models');
    }

    async getAttritionData() {
        return this.makeRequest('/api/attrition/models');
    }

    async getModels() {
        return this.makeRequest('/api/models');
    }

    async getDatasets() {
        return this.makeRequest('/api/datasets');
    }

    async preloadData() {
        this.logger.info('Preloading critical data...');
        
        const criticalEndpoints = [
            this.getSummary(),
            this.getFraudData(),
            this.getSentimentData(),
            this.getAttritionData()
        ];

        try {
            await Promise.allSettled(criticalEndpoints);
            this.logger.info('Data preloading completed');
        } catch (error) {
            this.logger.warn('Some data preloading failed:', error);
        }
    }

    // Demo data for development/fallback
    getDemoData(endpoint) {
        const demoResponses = {
            '/api/health': {
                status: 'ok',
                timestamp: new Date().toISOString()
            },
            '/api/summary': {
                status: 'success',
                data: {
                    total_models: 12,
                    avg_accuracy: 0.942,
                    attrition_models: 3,
                    total_datasets: 7
                }
            },
            '/api/fraud/models': {
                status: 'success',
                data: [
                    {
                        Dataset: 'Credit Card 2023',
                        Model: 'Random Forest',
                        'AUC-ROC': 0.994,
                        Precision: 0.987,
                        Recall: 0.991,
                        'F1-Score': 0.989,
                        Records: 284807
                    },
                    {
                        Dataset: 'Incribo Fraud',
                        Model: 'XGBoost',
                        'AUC-ROC': 0.989,
                        Precision: 0.982,
                        Recall: 0.985,
                        'F1-Score': 0.983,
                        Records: 156345
                    }
                ]
            },
            '/api/sentiment/models': {
                status: 'success',
                data: [
                    {
                        Model: 'BERT',
                        Accuracy: 0.942,
                        'Macro F1': 0.938,
                        'Weighted F1': 0.941
                    },
                    {
                        Model: 'RoBERTa',
                        Accuracy: 0.935,
                        'Macro F1': 0.931,
                        'Weighted F1': 0.934
                    }
                ]
            },
            '/api/attrition/models': {
                status: 'success',
                data: [
                    {
                        Model: 'Logistic Regression',
                        'AUC-ROC': 0.873,
                        Precision: 0.891,
                        Recall: 0.856,
                        'F1-Score': 0.873
                    }
                ]
            }
        };

        return demoResponses[endpoint] || null;
    }
}

// API 유틸리티 함수들
export class APIUtils {
    static isSuccess(response) {
        return response && response.status === 'success';
    }

    static formatNumber(num, decimals = 2) {
        if (isNaN(num)) return '0.00';
        return parseFloat(num).toFixed(decimals);
    }

    static formatModelName(name) {
        return name.replace(/([A-Z])/g, ' $1').trim();
    }

    static getPerformanceClass(score) {
        if (score >= 0.95) return 'excellent';
        if (score >= 0.90) return 'good';
        if (score >= 0.80) return 'fair';
        return 'poor';
    }

    static formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

export default APIClient;