// FCA Data Manager Module - Centralized data loading and management

export class DataManager {
    constructor() {
        this.cache = new Map();
        this.loadingPromises = new Map();
        this.dataValidators = new Map();
        this.eventEmitter = new EventTarget();
    }

    // Load data with caching and validation
    async loadData(dataType, forceReload = false) {
        // Check cache first
        if (!forceReload && this.cache.has(dataType)) {
            return this.cache.get(dataType);
        }

        // Check if already loading
        if (this.loadingPromises.has(dataType)) {
            return this.loadingPromises.get(dataType);
        }

        // Start loading
        const loadingPromise = this._loadDataFromSource(dataType);
        this.loadingPromises.set(dataType, loadingPromise);

        try {
            const data = await loadingPromise;
            
            // Validate data
            if (this.dataValidators.has(dataType)) {
                const validator = this.dataValidators.get(dataType);
                if (!validator(data)) {
                    throw new Error(`Data validation failed for ${dataType}`);
                }
            }

            // Cache the data
            this.cache.set(dataType, data);
            
            // Clean up loading promise
            this.loadingPromises.delete(dataType);
            
            // Emit event
            this.eventEmitter.dispatchEvent(new CustomEvent('dataLoaded', {
                detail: { dataType, data }
            }));

            return data;
        } catch (error) {
            this.loadingPromises.delete(dataType);
            throw error;
        }
    }

    // Load data from source (JSON files)
    async _loadDataFromSource(dataType) {
        const dataFileMap = {
            'fraud': 'fraud_data.json',
            'sentiment': 'sentiment_data.json',
            'attrition': 'attrition_data.json',
            'datasets': 'datasets.json',
            'summary': 'summary.json',
            'charts': 'charts.json'
        };

        const filename = dataFileMap[dataType];
        if (!filename) {
            throw new Error(`Unknown data type: ${dataType}`);
        }

        const response = await fetch(`data/${filename}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    }

    // Register data validator
    registerValidator(dataType, validator) {
        this.dataValidators.set(dataType, validator);
    }

    // Clear cache
    clearCache(dataType = null) {
        if (dataType) {
            this.cache.delete(dataType);
        } else {
            this.cache.clear();
        }
    }

    // Get cached data
    getCached(dataType) {
        return this.cache.get(dataType);
    }

    // Check if data is cached
    isCached(dataType) {
        return this.cache.has(dataType);
    }

    // Listen to data events
    addEventListener(eventType, callback) {
        this.eventEmitter.addEventListener(eventType, callback);
    }

    // Remove event listener
    removeEventListener(eventType, callback) {
        this.eventEmitter.removeEventListener(eventType, callback);
    }
}