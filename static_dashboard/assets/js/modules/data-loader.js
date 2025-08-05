/**
 * Data Loader Module
 * ==================
 * 
 * Handles all data loading operations for the FCA Dashboard
 */

export class DataLoader {
    constructor() {
        this.cache = new Map();
        this.loadingPromises = new Map();
    }

    /**
     * Load all dashboard data files
     */
    async loadAllData() {
        try {
            console.log('📊 Loading dashboard data...');
            
            const dataFiles = [
                'summary.json',
                'fraud_data.json', 
                'sentiment_data.json',
                'attrition_data.json',
                'charts.json',
                'datasets.json'
            ];

            const promises = dataFiles.map(file => this.loadDataFile(file));
            const results = await Promise.all(promises);
            
            const data = {};
            dataFiles.forEach((file, index) => {
                const key = file.replace('.json', '');
                data[key] = results[index];
            });

            console.log('✅ All data loaded successfully');
            return data;
            
        } catch (error) {
            console.error('❌ Failed to load data:', error);
            throw new Error('Data loading failed: ' + error.message);
        }
    }

    /**
     * Load individual data file with caching
     * @param {string} filename - Name of the JSON file to load
     */
    async loadDataFile(filename) {
        // Check cache first
        if (this.cache.has(filename)) {
            console.log(`📋 Using cached data for ${filename}`);
            return this.cache.get(filename);
        }

        // Check if already loading
        if (this.loadingPromises.has(filename)) {
            return await this.loadingPromises.get(filename);
        }

        // Create loading promise
        const loadPromise = this._fetchDataFile(filename);
        this.loadingPromises.set(filename, loadPromise);

        try {
            const data = await loadPromise;
            this.cache.set(filename, data);
            this.loadingPromises.delete(filename);
            return data;
        } catch (error) {
            this.loadingPromises.delete(filename);
            throw error;
        }
    }

    /**
     * Internal method to fetch data file
     * @private
     */
    async _fetchDataFile(filename) {
        try {
            console.log(`📥 Loading ${filename}...`);
            
            const response = await fetch(`data/${filename}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'default'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Validate data structure
            this._validateData(filename, data);
            
            console.log(`✅ Loaded ${filename} (${JSON.stringify(data).length} bytes)`);
            return data;
            
        } catch (error) {
            console.error(`❌ Failed to load ${filename}:`, error);
            throw new Error(`Failed to load ${filename}: ${error.message}`);
        }
    }

    /**
     * Validate data structure
     * @private
     */
    _validateData(filename, data) {
        if (!data || typeof data !== 'object') {
            throw new Error(`Invalid data format in ${filename}`);
        }

        // File-specific validation
        const requiredKeys = {
            'summary.json': ['system_status', 'total_datasets'],
            'fraud_data.json': ['performance_metrics', 'risk_distribution'],
            'sentiment_data.json': ['sentiment_distribution', 'model_performance'],
            'attrition_data.json': ['customer_segments', 'dataset_info'],
            'charts.json': ['model_comparison', 'fraud_distribution'],
            'datasets.json': ['available_datasets', 'dataset_statistics']
        };

        const required = requiredKeys[filename];
        if (required) {
            const missing = required.filter(key => !(key in data));
            if (missing.length > 0) {
                throw new Error(`Missing required keys in ${filename}: ${missing.join(', ')}`);
            }
        }
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Data cache cleared');
    }

    /**
     * Refresh specific data file
     */
    async refreshData(filename) {
        this.cache.delete(filename);
        return await this.loadDataFile(filename);
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
            totalSize: Array.from(this.cache.values())
                .reduce((total, data) => total + JSON.stringify(data).length, 0)
        };
    }
}