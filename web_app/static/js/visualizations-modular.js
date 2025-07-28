// Advanced Visualizations Dashboard - Modular Architecture
// Main entry point that loads all visualization modules

/**
 * Modular JavaScript Architecture for Visualizations
 * 
 * Structure:
 * - core.js: Main initialization and event handling (136 lines)
 * - heatmaps.js: Correlation, confusion matrix, performance heatmaps (145 lines)
 * - distributions.js: Violin plots, box plots, ridgeline plots (134 lines)
 * - relationships.js: Scatter matrices, parallel coordinates (118 lines)
 * - hierarchical.js: Sunburst charts, treemaps (78 lines)
 * - threed.js: 3D scatter plots, surface plots (135 lines)
 * 
 * Total: 6 modules, each under 150 lines
 * Original: 786 lines → Modularized for better maintainability
 */

// Module loading configuration
const MODULE_CONFIG = {
    basePath: '/static/js/modules/',
    modules: [
        'core.js',
        'heatmaps.js', 
        'distributions.js',
        'relationships.js',
        'hierarchical.js',
        'threed.js'
    ],
    loadTimeout: 5000
};

// Dynamic module loader
class ModuleLoader {
    constructor(config) {
        this.config = config;
        this.loadedModules = new Set();
        this.failedModules = new Set();
    }

    async loadModule(moduleName) {
        return new Promise((resolve, reject) => {
            if (this.loadedModules.has(moduleName)) {
                resolve(moduleName);
                return;
            }

            const script = document.createElement('script');
            script.src = this.config.basePath + moduleName;
            script.async = true;
            
            const timeout = setTimeout(() => {
                this.failedModules.add(moduleName);
                reject(new Error(`Module ${moduleName} failed to load (timeout)`));
            }, this.config.loadTimeout);

            script.onload = () => {
                clearTimeout(timeout);
                this.loadedModules.add(moduleName);
                console.log(`✅ Module loaded: ${moduleName}`);
                resolve(moduleName);
            };

            script.onerror = () => {
                clearTimeout(timeout);
                this.failedModules.add(moduleName);
                reject(new Error(`Module ${moduleName} failed to load (error)`));
            };

            document.head.appendChild(script);
        });
    }

    async loadAllModules() {
        console.log('📦 Loading visualization modules...');
        
        const loadPromises = this.config.modules.map(module => 
            this.loadModule(module).catch(error => {
                console.warn(`⚠️ ${error.message}`);
                return null;
            })
        );

        const results = await Promise.all(loadPromises);
        const loaded = results.filter(r => r !== null);
        
        console.log(`📊 Loaded ${loaded.length}/${this.config.modules.length} modules`);
        
        if (this.failedModules.size > 0) {
            console.warn('❌ Failed modules:', Array.from(this.failedModules));
        }

        return {
            loaded: this.loadedModules,
            failed: this.failedModules,
            total: this.config.modules.length
        };
    }
}

// Initialize modular visualization system
async function initializeModularVisualizations() {
    try {
        const loader = new ModuleLoader(MODULE_CONFIG);
        const result = await loader.loadAllModules();
        
        console.log('🎉 Modular visualization system initialized');
        console.log(`📈 System status: ${result.loaded.size}/${result.total} modules ready`);
        
        // Verify core module is loaded
        if (!window.vizCore) {
            console.error('❌ Core module failed to initialize');
            throw new Error('Core visualization module not available');
        }
        
        return result;
    } catch (error) {
        console.error('💥 Failed to initialize modular visualization system:', error);
        throw error;
    }
}

// Fallback loader for direct inclusion
function loadModulesDirectly() {
    console.log('📦 Loading modules directly...');
    
    const modules = [
        '/static/js/modules/core.js',
        '/static/js/modules/heatmaps.js',
        '/static/js/modules/distributions.js', 
        '/static/js/modules/relationships.js',
        '/static/js/modules/hierarchical.js',
        '/static/js/modules/threed.js'
    ];
    
    modules.forEach(src => {
        const script = document.createElement('script');
        script.src = src;
        script.async = false; // Maintain order
        document.head.appendChild(script);
    });
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeModularVisualizations);
} else {
    initializeModularVisualizations();
}

// Export for manual initialization if needed
window.initializeModularVisualizations = initializeModularVisualizations;
window.loadModulesDirectly = loadModulesDirectly;