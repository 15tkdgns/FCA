// Module Loader System for Performance Optimization
class ModuleLoader {
    constructor() {
        this.loadedModules = new Map();
        this.loadingPromises = new Map();
        this.observers = new Map();
        this.performanceMetrics = {
            loadTimes: new Map(),
            cacheHits: 0,
            totalRequests: 0
        };
        
        this.init();
    }

    init() {
        this.setupIntersectionObserver();
        this.setupPerformanceMonitoring();
        console.log('📦 Module loader initialized');
    }

    // Lazy load modules when they come into view
    setupIntersectionObserver() {
        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const moduleName = entry.target.dataset.lazyModule;
                    if (moduleName) {
                        this.loadModule(moduleName);
                        this.intersectionObserver.unobserve(entry.target);
                    }
                }
            });
        }, {
            rootMargin: '50px' // Start loading 50px before element comes into view
        });
    }

    // Setup performance monitoring
    setupPerformanceMonitoring() {
        if ('PerformanceObserver' in window) {
            this.performanceObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    if (entry.name.includes('.js') && entry.name.includes('frontend')) {
                        this.performanceMetrics.loadTimes.set(
                            entry.name, 
                            entry.responseEnd - entry.responseStart
                        );
                    }
                });
            });
            
            this.performanceObserver.observe({ entryTypes: ['resource'] });
        }
    }

    // Register element for lazy loading
    registerLazyElement(element, moduleName) {
        element.dataset.lazyModule = moduleName;
        this.intersectionObserver.observe(element);
    }

    // Load module with caching and error handling
    async loadModule(moduleName) {
        this.performanceMetrics.totalRequests++;

        // Check if module is already loaded
        if (this.loadedModules.has(moduleName)) {
            this.performanceMetrics.cacheHits++;
            return this.loadedModules.get(moduleName);
        }

        // Check if module is currently loading
        if (this.loadingPromises.has(moduleName)) {
            return this.loadingPromises.get(moduleName);
        }

        const startTime = performance.now();
        console.log(`📥 Loading module: ${moduleName}`);

        const loadingPromise = this.createModuleLoadPromise(moduleName, startTime);
        this.loadingPromises.set(moduleName, loadingPromise);

        try {
            const module = await loadingPromise;
            this.loadedModules.set(moduleName, module);
            this.loadingPromises.delete(moduleName);
            
            const loadTime = performance.now() - startTime;
            console.log(`✅ Module ${moduleName} loaded in ${loadTime.toFixed(2)}ms`);
            
            return module;
        } catch (error) {
            this.loadingPromises.delete(moduleName);
            console.error(`❌ Failed to load module ${moduleName}:`, error);
            throw error;
        }
    }

    // Create module loading promise based on module type
    createModuleLoadPromise(moduleName, startTime) {
        const moduleConfig = this.getModuleConfig(moduleName);
        
        if (moduleConfig.type === 'script') {
            return this.loadScript(moduleConfig.url);
        } else if (moduleConfig.type === 'css') {
            return this.loadCSS(moduleConfig.url);
        } else if (moduleConfig.type === 'chart') {
            return this.loadChartModule(moduleConfig);
        } else if (moduleConfig.type === 'data') {
            return this.loadDataModule(moduleConfig);
        }
        
        throw new Error(`Unknown module type: ${moduleConfig.type}`);
    }

    // Get module configuration
    getModuleConfig(moduleName) {
        const configs = {
            'advanced-charts': {
                type: 'script',
                url: './advanced-charts.js',
                dependencies: ['chart.js'],
                factory: () => window.AdvancedCharts
            },
            'real-time-monitor': {
                type: 'script',
                url: './real-time-monitor.js',
                dependencies: []
            },
            'training-monitor': {
                type: 'script', 
                url: './training-monitor.js',
                dependencies: []
            },
            'xai-analyzer': {
                type: 'script',
                url: './xai-analyzer.js',
                dependencies: ['chart.js']
            },
            'advanced-statistics': {
                type: 'script',
                url: './advanced-statistics.js',
                dependencies: ['chart.js']
            },
            'performance-dashboard': {
                type: 'script',
                url: './performance-dashboard.js',
                dependencies: []
            }
        };

        return configs[moduleName] || { type: 'script', url: `./${moduleName}.js`, dependencies: [] };
    }

    // Load JavaScript module
    async loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = () => resolve(script);
            script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
            document.head.appendChild(script);
        });
    }

    // Load CSS module
    async loadCSS(url) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            link.onload = () => resolve(link);
            link.onerror = () => reject(new Error(`Failed to load CSS: ${url}`));
            document.head.appendChild(link);
        });
    }

    // Load chart module with dependency management
    async loadChartModule(config) {
        // Ensure Chart.js is loaded first
        if (!window.Chart) {
            await this.loadScript('https://cdn.jsdelivr.net/npm/chart.js');
        }

        if (config.factory) {
            return config.factory();
        }
        
        throw new Error('Chart module factory not defined');
    }

    // Load data module with caching
    async loadDataModule(config) {
        const cacheKey = `data_${config.url}`;
        const cachedData = this.getCachedData(cacheKey, config.cacheDuration);
        
        if (cachedData) {
            return cachedData;
        }

        const response = await fetch(config.url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        this.setCachedData(cacheKey, data);
        return data;
    }

    // Cache management
    getCachedData(key, maxAge = 60000) {
        const cached = localStorage.getItem(key);
        if (!cached) return null;

        try {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < maxAge) {
                return data;
            }
        } catch (error) {
            console.warn('Cache parse error:', error);
        }

        localStorage.removeItem(key);
        return null;
    }

    setCachedData(key, data) {
        try {
            const cacheEntry = {
                data: data,
                timestamp: Date.now()
            };
            localStorage.setItem(key, JSON.stringify(cacheEntry));
        } catch (error) {
            console.warn('Cache storage error:', error);
        }
    }

    // Preload critical modules
    async preloadCriticalModules() {
        const criticalModules = ['api-client', 'dashboard'];
        const preloadPromises = criticalModules.map(module => 
            this.loadModule(module).catch(error => 
                console.warn(`Failed to preload ${module}:`, error)
            )
        );
        
        await Promise.allSettled(preloadPromises);
        console.log('🚀 Critical modules preloaded');
    }

    // Get performance metrics
    getPerformanceMetrics() {
        const avgLoadTime = Array.from(this.performanceMetrics.loadTimes.values())
            .reduce((sum, time, _, arr) => sum + time / arr.length, 0);

        return {
            ...this.performanceMetrics,
            cacheHitRate: this.performanceMetrics.totalRequests > 0 ? 
                         this.performanceMetrics.cacheHits / this.performanceMetrics.totalRequests : 0,
            averageLoadTime: avgLoadTime || 0,
            loadedModulesCount: this.loadedModules.size
        };
    }

    // Clear cache
    clearCache() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('data_') || key.startsWith('module_')) {
                localStorage.removeItem(key);
            }
        });
        console.log('🧹 Module cache cleared');
    }

    // Memory cleanup
    destroy() {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
        }
        
        this.loadedModules.clear();
        this.loadingPromises.clear();
        
        console.log('🧹 Module loader destroyed');
    }
}

// Chart optimization utilities
class ChartOptimizer {
    constructor() {
        this.chartPool = new Map();
        this.renderQueue = [];
        this.isProcessing = false;
        this.maxConcurrentCharts = 3;
    }

    // Queue chart for optimized rendering
    queueChart(chartConfig) {
        return new Promise((resolve, reject) => {
            this.renderQueue.push({
                config: chartConfig,
                resolve,
                reject,
                priority: chartConfig.priority || 1
            });
            
            this.processQueue();
        });
    }

    // Process chart rendering queue
    async processQueue() {
        if (this.isProcessing || this.renderQueue.length === 0) {
            return;
        }

        this.isProcessing = true;
        
        // Sort by priority
        this.renderQueue.sort((a, b) => b.priority - a.priority);
        
        const batch = this.renderQueue.splice(0, this.maxConcurrentCharts);
        const renderPromises = batch.map(item => this.renderChart(item));
        
        try {
            await Promise.allSettled(renderPromises);
        } catch (error) {
            console.error('Chart rendering error:', error);
        }
        
        this.isProcessing = false;
        
        // Process next batch if queue has items
        if (this.renderQueue.length > 0) {
            setTimeout(() => this.processQueue(), 10);
        }
    }

    // Render individual chart with optimization
    async renderChart(item) {
        const { config, resolve, reject } = item;
        
        try {
            // Use requestIdleCallback for non-critical charts
            if (config.priority < 3 && 'requestIdleCallback' in window) {
                await new Promise(resolve => requestIdleCallback(resolve));
            }
            
            const chart = await this.createOptimizedChart(config);
            resolve(chart);
        } catch (error) {
            reject(error);
        }
    }

    // Create optimized chart instance
    async createOptimizedChart(config) {
        const optimizedConfig = this.optimizeChartConfig(config);
        
        // Ensure Chart.js is available
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not available, loading...');
            await this.loadScript('https://cdn.jsdelivr.net/npm/chart.js');
        }
        
        // Reuse chart instance if possible
        const poolKey = this.getChartPoolKey(config);
        if (this.chartPool.has(poolKey)) {
            const pooledChart = this.chartPool.get(poolKey);
            if (pooledChart && !pooledChart.destroyed) {
                this.updateChartData(pooledChart, optimizedConfig.data);
                return pooledChart;
            } else {
                this.chartPool.delete(poolKey);
            }
        }
        
        try {
            const chart = new Chart(config.ctx, optimizedConfig);
            
            // Add to pool for reuse
            this.chartPool.set(poolKey, chart);
            
            return chart;
        } catch (error) {
            console.error('Failed to create chart:', error);
            throw error;
        }
    }

    // Optimize chart configuration for performance
    optimizeChartConfig(config) {
        const optimized = { ...config };
        
        // Disable animations for large datasets
        if (this.isLargeDataset(config.data)) {
            optimized.options = optimized.options || {};
            optimized.options.animation = false;
            optimized.options.responsive = true;
            optimized.options.maintainAspectRatio = false;
        }
        
        // Optimize point radius for line charts with many points
        if (config.type === 'line' && this.hasLargeDataset(config.data)) {
            optimized.data.datasets.forEach(dataset => {
                dataset.pointRadius = 0;
                dataset.pointHoverRadius = 3;
            });
        }
        
        return optimized;
    }

    // Check if dataset is large
    isLargeDataset(data) {
        const pointCount = data.datasets?.reduce((total, dataset) => 
            total + (dataset.data?.length || 0), 0) || 0;
        return pointCount > 100;
    }

    hasLargeDataset(data) {
        return this.isLargeDataset(data);
    }

    // Generate pool key for chart reuse
    getChartPoolKey(config) {
        return `${config.type}_${config.ctx?.canvas?.id || 'anonymous'}`;
    }

    // Update chart data efficiently
    updateChartData(chart, newData) {
        chart.data = newData;
        chart.update('none'); // Update without animation
    }

    // Clear chart pool
    clearPool() {
        this.chartPool.forEach(chart => chart.destroy());
        this.chartPool.clear();
    }
}

// Memory monitor
class MemoryMonitor {
    constructor() {
        this.measurements = [];
        this.thresholds = {
            warning: 50 * 1024 * 1024, // 50MB
            critical: 100 * 1024 * 1024 // 100MB
        };
        
        this.startMonitoring();
    }

    startMonitoring() {
        if ('memory' in performance) {
            setInterval(() => {
                this.takeMeasurement();
            }, 10000); // Check every 10 seconds
        }
    }

    takeMeasurement() {
        if (!('memory' in performance)) return null;

        const measurement = {
            timestamp: Date.now(),
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit
        };

        this.measurements.push(measurement);
        
        // Keep only last 100 measurements
        if (this.measurements.length > 100) {
            this.measurements.shift();
        }

        this.checkThresholds(measurement);
        return measurement;
    }

    checkThresholds(measurement) {
        if (measurement.used > this.thresholds.critical) {
            console.warn('🚨 Critical memory usage detected:', this.formatBytes(measurement.used));
            this.triggerGarbageCollection();
        } else if (measurement.used > this.thresholds.warning) {
            console.warn('⚠️ High memory usage:', this.formatBytes(measurement.used));
        }
    }

    triggerGarbageCollection() {
        // Attempt to free memory
        if ('gc' in window && typeof window.gc === 'function') {
            window.gc();
        }
        
        // Clear caches
        if (window.moduleLoader) {
            window.moduleLoader.clearCache();
        }
    }

    formatBytes(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    getMemoryStatus() {
        const latest = this.measurements[this.measurements.length - 1];
        if (!latest) return null;

        return {
            current: this.formatBytes(latest.used),
            percentage: ((latest.used / latest.limit) * 100).toFixed(1),
            trend: this.getMemoryTrend(),
            status: this.getMemoryHealthStatus(latest)
        };
    }

    getMemoryTrend() {
        if (this.measurements.length < 5) return 'stable';
        
        const recent = this.measurements.slice(-5);
        const trend = recent[recent.length - 1].used - recent[0].used;
        
        if (trend > 5 * 1024 * 1024) return 'increasing';
        if (trend < -5 * 1024 * 1024) return 'decreasing';
        return 'stable';
    }

    getMemoryHealthStatus(measurement) {
        if (measurement.used > this.thresholds.critical) return 'critical';
        if (measurement.used > this.thresholds.warning) return 'warning';
        return 'good';
    }
}

// Initialize performance optimization
window.moduleLoader = new ModuleLoader();
window.chartOptimizer = new ChartOptimizer();
window.memoryMonitor = new MemoryMonitor();

console.log('⚡ Performance optimization modules loaded');