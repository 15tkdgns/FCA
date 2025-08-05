/**
 * Configuration Manager
 * ====================
 * Centralized configuration management with environment support,
 * validation, and secure storage
 */

class ConfigManager {
    constructor() {
        this.config = {};
        this.environment = this.detectEnvironment();
        this.validators = new Map();
        this.secureKeys = new Set(['apiKey', 'secret', 'token', 'password']);
        
        // Load default configuration
        this.loadDefaults();
        
        // Load environment-specific config
        this.loadEnvironmentConfig();
        
        // Load user preferences from localStorage
        this.loadUserPreferences();
    }
    
    /**
     * Detect current environment
     */
    detectEnvironment() {
        if (typeof window === 'undefined') return 'server';
        
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
            return 'development';
        }
        
        if (hostname.includes('staging') || hostname.includes('dev.')) {
            return 'staging';
        }
        
        return 'production';
    }
    
    /**
     * Load default configuration
     */
    loadDefaults() {
        this.config = {
            // Application settings
            app: {
                name: 'FCA Dashboard',
                version: '2.0.0',
                debug: false,
                logLevel: 'info'
            },
            
            // API settings
            api: {
                baseUrl: '',
                timeout: 30000,
                retryAttempts: 3,
                retryDelay: 1000,
                endpoints: {
                    fraud: 'data/fraud_data.json',
                    xai: 'data/xai_data.json',
                    sentiment: 'data/sentiment_data.json',
                    model: 'data/model_data.json',
                    performance: 'data/performance_metrics.json',
                    business: 'data/business_metrics.json'
                }
            },
            
            // Chart settings
            charts: {
                defaultRenderer: 'plotly',
                responsive: true,
                displayModeBar: true,
                theme: 'light',
                animation: {
                    enabled: true,
                    duration: 500,
                    easing: 'cubic-in-out'
                },
                colors: {
                    primary: '#4e73df',
                    success: '#1cc88a',
                    warning: '#f6c23e',
                    danger: '#e74a3b',
                    info: '#36b9cc',
                    dark: '#5a5c69',
                    light: '#f8f9fc'
                }
            },
            
            // Performance settings
            performance: {
                cacheTimeout: 300000, // 5 minutes
                lazyLoading: true,
                debounceDelay: 300,
                throttleDelay: 100,
                maxConcurrentRequests: 6
            },
            
            // Security settings
            security: {
                sanitizeInputs: true,
                validateXSS: true,
                allowedDomains: ['localhost', '127.0.0.1'],
                contentSecurityPolicy: true
            },
            
            // UI settings
            ui: {
                theme: 'light',
                language: 'en',
                dateFormat: 'YYYY-MM-DD',
                timeFormat: '24h',
                showTooltips: true,
                showAnimations: true,
                compactMode: false
            },
            
            // Feature flags
            features: {
                asyncLoading: false, // Temporarily disabled
                advancedCharts: true,
                exportFunctionality: true,
                realTimeUpdates: false,
                betaFeatures: false
            }
        };
    }
    
    /**
     * Load environment-specific configuration
     */
    loadEnvironmentConfig() {
        const envConfigs = {
            development: {
                app: {
                    debug: true,
                    logLevel: 'debug'
                },
                api: {
                    timeout: 60000
                },
                charts: {
                    animation: { enabled: false } // Faster development
                },
                features: {
                    betaFeatures: true
                }
            },
            
            staging: {
                app: {
                    debug: true,
                    logLevel: 'warn'
                },
                features: {
                    betaFeatures: true,
                    realTimeUpdates: true
                }
            },
            
            production: {
                app: {
                    debug: false,
                    logLevel: 'error'
                },
                performance: {
                    cacheTimeout: 600000, // 10 minutes in production
                    maxConcurrentRequests: 4 // Conservative for production
                },
                security: {
                    allowedDomains: [] // Will be set from server
                }
            }
        };
        
        const envConfig = envConfigs[this.environment];
        if (envConfig) {
            this.config = this.deepMerge(this.config, envConfig);
        }
    }
    
    /**
     * Load user preferences from localStorage
     */
    loadUserPreferences() {
        try {
            const userPrefs = localStorage.getItem('fca-dashboard-config');
            if (userPrefs) {
                const prefs = JSON.parse(userPrefs);
                // Only merge non-sensitive settings
                const safePaths = ['ui', 'charts.theme', 'charts.animation', 'performance.cacheTimeout'];
                this.mergeUserPreferences(prefs, safePaths);
            }
        } catch (error) {
            console.warn('⚠️ Failed to load user preferences:', error);
        }
    }
    
    /**
     * Get configuration value by path
     */
    get(path, defaultValue = null) {
        try {
            const keys = path.split('.');
            let value = this.config;
            
            for (const key of keys) {
                if (value && typeof value === 'object' && key in value) {
                    value = value[key];
                } else {
                    return defaultValue;
                }
            }
            
            return value;
        } catch (error) {
            console.warn(`⚠️ Failed to get config value for '${path}':`, error);
            return defaultValue;
        }
    }
    
    /**
     * Set configuration value by path
     */
    set(path, value, options = {}) {
        try {
            // Validate if validator exists
            if (this.validators.has(path)) {
                const validator = this.validators.get(path);
                if (!validator(value)) {
                    throw new Error(`Invalid value for '${path}': ${value}`);
                }
            }
            
            const keys = path.split('.');
            let target = this.config;
            
            // Navigate to parent object
            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                if (!target[key] || typeof target[key] !== 'object') {
                    target[key] = {};
                }
                target = target[key];
            }
            
            // Set the value
            const finalKey = keys[keys.length - 1];
            target[finalKey] = value;
            
            // Save to localStorage if persistent
            if (options.persistent !== false && this.isUserPreferencePath(path)) {
                this.saveUserPreferences();
            }
            
            // Emit change event
            this.emitConfigChange(path, value);
            
            return true;
        } catch (error) {
            console.error(`❌ Failed to set config value for '${path}':`, error);
            return false;
        }
    }
    
    /**
     * Register validator for configuration path
     */
    addValidator(path, validator) {
        if (typeof validator === 'function') {
            this.validators.set(path, validator);
        }
    }
    
    /**
     * Remove validator
     */
    removeValidator(path) {
        this.validators.delete(path);
    }
    
    /**
     * Get current environment
     */
    getEnvironment() {
        return this.environment;
    }
    
    /**
     * Check if in development mode
     */
    isDevelopment() {
        return this.environment === 'development';
    }
    
    /**
     * Check if in production mode
     */
    isProduction() {
        return this.environment === 'production';
    }
    
    /**
     * Get all configuration (excluding sensitive data)
     */
    getAll(includeSensitive = false) {
        if (includeSensitive) {
            return JSON.parse(JSON.stringify(this.config));
        }
        
        return this.sanitizeConfig(this.config);
    }
    
    /**
     * Reset configuration to defaults
     */
    reset() {
        this.loadDefaults();
        this.loadEnvironmentConfig();
        localStorage.removeItem('fca-dashboard-config');
    }
    
    /**
     * Export configuration as JSON
     */
    export(includeSensitive = false) {
        const config = this.getAll(includeSensitive);
        return JSON.stringify(config, null, 2);
    }
    
    /**
     * Import configuration from JSON
     */
    import(jsonConfig, merge = true) {
        try {
            const importedConfig = JSON.parse(jsonConfig);
            
            if (merge) {
                this.config = this.deepMerge(this.config, importedConfig);
            } else {
                this.config = importedConfig;
            }
            
            return true;
        } catch (error) {
            console.error('❌ Failed to import configuration:', error);
            return false;
        }
    }
    
    /**
     * Utility methods
     */
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    result[key] = this.deepMerge(result[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }
        
        return result;
    }
    
    mergeUserPreferences(prefs, allowedPaths) {
        for (const path of allowedPaths) {
            const value = this.getValueByPath(prefs, path);
            if (value !== null) {
                this.set(path, value, { persistent: false });
            }
        }
    }
    
    getValueByPath(obj, path) {
        const keys = path.split('.');
        let value = obj;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return null;
            }
        }
        
        return value;
    }
    
    isUserPreferencePath(path) {
        const userPrefPaths = ['ui.', 'charts.theme', 'charts.animation', 'performance.cacheTimeout'];
        return userPrefPaths.some(prefPath => path.startsWith(prefPath));
    }
    
    saveUserPreferences() {
        try {
            const userPrefs = {
                ui: this.config.ui,
                charts: {
                    theme: this.config.charts.theme,
                    animation: this.config.charts.animation
                },
                performance: {
                    cacheTimeout: this.config.performance.cacheTimeout
                }
            };
            
            localStorage.setItem('fca-dashboard-config', JSON.stringify(userPrefs));
        } catch (error) {
            console.warn('⚠️ Failed to save user preferences:', error);
        }
    }
    
    sanitizeConfig(config) {
        const sanitized = {};
        
        for (const key in config) {
            if (config.hasOwnProperty(key)) {
                if (this.secureKeys.has(key)) {
                    sanitized[key] = '[REDACTED]';
                } else if (config[key] && typeof config[key] === 'object' && !Array.isArray(config[key])) {
                    sanitized[key] = this.sanitizeConfig(config[key]);
                } else {
                    sanitized[key] = config[key];
                }
            }
        }
        
        return sanitized;
    }
    
    emitConfigChange(path, value) {
        if (typeof window !== 'undefined') {
            const event = new CustomEvent('configChange', {
                detail: { path, value, config: this.config }
            });
            window.dispatchEvent(event);
        }
    }
}

// Create global instance
const configManager = new ConfigManager();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ConfigManager, configManager };
}

// Make available globally
if (typeof window !== 'undefined') {
    window.ConfigManager = ConfigManager;
    window.configManager = configManager;
}