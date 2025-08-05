/**
 * Dependency Injection Container
 * =============================
 * Lightweight DI container for managing dependencies,
 * reducing coupling, and improving testability
 */

class DIContainer {
    constructor() {
        this.services = new Map();
        this.instances = new Map();
        this.factories = new Map();
        this.singletons = new Set();
        this.loading = new Set();
        this.dependencies = new Map();
        
        // Register core services
        this.registerCoreServices();
    }
    
    /**
     * Register a service
     */
    register(name, definition, options = {}) {
        try {
            const {
                singleton = false,
                factory = false,
                dependencies = [],
                lazy = false
            } = options;
            
            this.validateServiceName(name);
            
            if (this.services.has(name)) {
                console.warn(`⚠️ Service '${name}' is being overwritten`);
            }
            
            const serviceConfig = {
                definition,
                singleton,
                factory,
                dependencies,
                lazy,
                registered: Date.now()
            };
            
            this.services.set(name, serviceConfig);
            this.dependencies.set(name, dependencies);
            
            if (singleton) {
                this.singletons.add(name);
            }
            
            if (factory) {
                this.factories.set(name, definition);
            }
            
            // Immediately create instance if not lazy and no dependencies
            if (!lazy && !singleton && dependencies.length === 0) {
                this.resolve(name);
            }
            
            console.log(`📦 Service registered: ${name}${singleton ? ' (singleton)' : ''}${factory ? ' (factory)' : ''}`);
            return true;
            
        } catch (error) {
            console.error(`❌ Failed to register service '${name}':`, error);
            return false;
        }
    }
    
    /**
     * Register singleton service
     */
    registerSingleton(name, definition, options = {}) {
        return this.register(name, definition, { ...options, singleton: true });
    }
    
    /**
     * Register factory service
     */
    registerFactory(name, factory, options = {}) {
        return this.register(name, factory, { ...options, factory: true });
    }
    
    /**
     * Register value as service
     */
    registerValue(name, value) {
        this.instances.set(name, value);
        console.log(`📦 Value registered: ${name}`);
        return true;
    }
    
    /**
     * Resolve service by name
     */
    resolve(name) {
        try {
            // Check for circular dependency
            if (this.loading.has(name)) {
                throw new Error(`Circular dependency detected for service '${name}'`);
            }
            
            // Return existing instance for singletons
            if (this.singletons.has(name) && this.instances.has(name)) {
                return this.instances.get(name);
            }
            
            // Check if service is registered
            if (!this.services.has(name) && !this.instances.has(name)) {
                throw new Error(`Service '${name}' is not registered`);
            }
            
            // Return direct value if exists
            if (this.instances.has(name) && !this.services.has(name)) {
                return this.instances.get(name);
            }
            
            const serviceConfig = this.services.get(name);
            this.loading.add(name);
            
            try {
                const instance = this.createInstance(name, serviceConfig);
                
                // Store singleton instance
                if (serviceConfig.singleton) {
                    this.instances.set(name, instance);
                }
                
                this.loading.delete(name);
                return instance;
                
            } catch (error) {
                this.loading.delete(name);
                throw error;
            }
            
        } catch (error) {
            console.error(`❌ Failed to resolve service '${name}':`, error);
            throw error;
        }
    }
    
    /**
     * Check if service exists
     */
    has(name) {
        return this.services.has(name) || this.instances.has(name);
    }
    
    /**
     * Remove service
     */
    remove(name) {
        const removed = this.services.delete(name) || this.instances.delete(name);
        this.singletons.delete(name);
        this.factories.delete(name);
        this.dependencies.delete(name);
        
        if (removed) {
            console.log(`📦 Service removed: ${name}`);
        }
        
        return removed;
    }
    
    /**
     * Clear all services
     */
    clear() {
        const count = this.services.size + this.instances.size;
        this.services.clear();
        this.instances.clear();
        this.factories.clear();
        this.singletons.clear();
        this.dependencies.clear();
        this.loading.clear();
        
        console.log(`📦 Cleared ${count} services`);
        return count;
    }
    
    /**
     * Get all registered service names
     */
    getServiceNames() {
        const serviceNames = Array.from(this.services.keys());
        const instanceNames = Array.from(this.instances.keys()).filter(name => !this.services.has(name));
        return [...serviceNames, ...instanceNames];
    }
    
    /**
     * Get service info
     */
    getServiceInfo(name) {
        if (this.services.has(name)) {
            const config = this.services.get(name);
            return {
                name,
                type: 'service',
                singleton: config.singleton,
                factory: config.factory,
                dependencies: config.dependencies,
                hasInstance: this.instances.has(name),
                registered: config.registered
            };
        } else if (this.instances.has(name)) {
            return {
                name,
                type: 'value',
                singleton: false,
                factory: false,
                dependencies: [],
                hasInstance: true,
                registered: null
            };
        }
        
        return null;
    }
    
    /**
     * Create auto-wired instance
     */
    createAutoWired(Constructor, dependencies = []) {
        const resolvedDeps = dependencies.map(dep => this.resolve(dep));
        return new Constructor(...resolvedDeps);
    }
    
    /**
     * Batch register services
     */
    registerBatch(services) {
        const results = [];
        
        for (const [name, config] of Object.entries(services)) {
            const result = this.register(name, config.definition || config, {
                singleton: config.singleton,
                factory: config.factory,
                dependencies: config.dependencies,
                lazy: config.lazy
            });
            
            results.push({ name, success: result });
        }
        
        return results;
    }
    
    /**
     * Register core framework services
     */
    registerCoreServices() {
        // Register existing global services if available
        if (typeof window !== 'undefined') {
            if (window.eventBus) {
                this.registerValue('eventBus', window.eventBus);
            }
            
            if (window.configManager) {
                this.registerValue('configManager', window.configManager);
            }
            
            if (window.ApiService) {
                this.registerSingleton('apiService', () => new window.ApiService());
            }
            
            if (window.ChartRenderer) {
                this.registerSingleton('chartRenderer', () => new window.ChartRenderer());
            }
            
            if (window.CommonUtils) {
                this.registerValue('commonUtils', window.CommonUtils);
            }
        }
    }
    
    /**
     * Private helper methods
     */
    createInstance(name, config) {
        const { definition, factory, dependencies } = config;
        
        // Resolve dependencies first
        const resolvedDeps = dependencies.map(dep => this.resolve(dep));
        
        if (factory) {
            // Factory function
            return definition.apply(null, resolvedDeps);
        } else if (typeof definition === 'function') {
            // Constructor function
            return new definition(...resolvedDeps);
        } else if (typeof definition === 'object') {
            // Object definition
            return definition;
        } else {
            throw new Error(`Invalid service definition for '${name}'`);
        }
    }
    
    validateServiceName(name) {
        if (typeof name !== 'string' || name.length === 0) {
            throw new Error('Service name must be a non-empty string');
        }
        
        if (name.includes('.') || name.includes('/')) {
            throw new Error('Service name cannot contain dots or slashes');
        }
    }
    
    /**
     * Advanced features
     */
    
    /**
     * Create child container
     */
    createChild() {
        const child = new DIContainer();
        
        // Copy parent services
        for (const [name, config] of this.services.entries()) {
            child.services.set(name, { ...config });
        }
        
        // Copy parent instances (singletons)
        for (const [name, instance] of this.instances.entries()) {
            if (this.singletons.has(name)) {
                child.instances.set(name, instance);
            }
        }
        
        child.singletons = new Set(this.singletons);
        child.dependencies = new Map(this.dependencies);
        
        return child;
    }
    
    /**
     * Get dependency graph
     */
    getDependencyGraph() {
        const graph = {};
        
        for (const [name, deps] of this.dependencies.entries()) {
            graph[name] = [...deps];
        }
        
        return graph;
    }
    
    /**
     * Validate dependency graph for circular dependencies
     */
    validateDependencies() {
        const visited = new Set();
        const visiting = new Set();
        const errors = [];
        
        const visit = (name) => {
            if (visiting.has(name)) {
                errors.push(`Circular dependency detected: ${name}`);
                return;
            }
            
            if (visited.has(name)) {
                return;
            }
            
            visiting.add(name);
            
            const deps = this.dependencies.get(name) || [];
            for (const dep of deps) {
                visit(dep);
            }
            
            visiting.delete(name);
            visited.add(name);
        };
        
        for (const name of this.dependencies.keys()) {
            visit(name);
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

// Create global container instance
const container = new DIContainer();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DIContainer, container };
}

// Make available globally
if (typeof window !== 'undefined') {
    window.DIContainer = DIContainer;
    window.container = container;
}