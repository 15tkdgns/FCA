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
        
        // Wait for modules to be available and initialize core
        let retries = 0;
        const maxRetries = 10;
        
        // Wait for VisualizationCore class to be available
        while (!window.VisualizationCore && retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 200));
            retries++;
        }
        
        if (window.VisualizationCore) {
            console.log('✅ VisualizationCore found, initializing...');
            setTimeout(() => {
                try {
                    window.visualizationCore = new window.VisualizationCore();
                    console.log('🎉 Visualization system fully initialized!');
                } catch (error) {
                    console.error('❌ Error initializing VisualizationCore:', error);
                    this.createFallbackVisualizations();
                }
            }, 300); // Give modules time to register
        } else {
            console.error('❌ VisualizationCore not available after retries');
            this.createFallbackVisualizations();
        }
        
        return result;
    } catch (error) {
        console.error('💥 Failed to initialize modular visualization system:', error);
        createFallbackVisualizations();
        throw error;
    }
}

// Create fallback visualizations if modules fail to load
function createFallbackVisualizations() {
    console.log('🔧 Creating fallback visualizations...');
    
    const chartContainers = [
        { id: 'correlation-heatmap-chart', title: 'Correlation Matrix', type: 'heatmap' },
        { id: 'confusion-matrix-chart', title: 'Confusion Matrix', type: 'heatmap' },
        { id: 'performance-heatmap-chart', title: 'Performance Metrics', type: 'bar' },
        { id: 'violin-plot-chart', title: 'Distribution Analysis', type: 'violin' },
        { id: 'box-plot-chart', title: 'Box Plot Analysis', type: 'box' },
        { id: 'scatter-matrix-chart', title: 'Scatter Matrix', type: 'scatter' },
        { id: 'sunburst-chart', title: 'Hierarchical Data', type: 'sunburst' },
        { id: 'treemap-chart', title: 'Treemap Visualization', type: 'treemap' },
        { id: '3d-scatter-chart', title: '3D Data Visualization', type: 'scatter3d' }
    ];
    
    chartContainers.forEach(({ id, title, type }) => {
        const container = document.getElementById(id);
        if (container) {
            createFallbackChart(container, title, type);
        }
    });
}

function createFallbackChart(container, title, chartType) {
    // Create different sample data based on chart type
    let data, layout;
    
    switch (chartType) {
        case 'heatmap':
            data = [{
                z: [[1, 0.8, 0.6], [0.8, 1, 0.4], [0.6, 0.4, 1]],
                x: ['Feature A', 'Feature B', 'Feature C'],
                y: ['Feature A', 'Feature B', 'Feature C'],
                type: 'heatmap',
                colorscale: 'Viridis'
            }];
            break;
            
        case 'violin':
            data = [{
                y: [1, 2, 3, 4, 5, 6, 7, 8, 9],
                type: 'violin',
                name: 'Sample Data',
                box: { visible: true },
                line: { color: 'blue' }
            }];
            break;
            
        case 'box':
            data = [{
                y: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                type: 'box',
                name: 'Sample Distribution'
            }];
            break;
            
        case 'scatter':
            data = [{
                x: [1, 2, 3, 4, 5],
                y: [2, 4, 6, 8, 10],
                mode: 'markers',
                type: 'scatter',
                name: 'Sample Points'
            }];
            break;
            
        case 'scatter3d':
            data = [{
                x: [1, 2, 3, 4, 5],
                y: [2, 4, 6, 8, 10],
                z: [1, 4, 9, 16, 25],
                mode: 'markers',
                type: 'scatter3d',
                name: '3D Sample'
            }];
            break;
            
        case 'sunburst':
            data = [{
                type: 'sunburst',
                labels: ['Root', 'A', 'B', 'A1', 'A2', 'B1'],
                parents: ['', 'Root', 'Root', 'A', 'A', 'B'],
                values: [10, 5, 5, 2, 3, 3]
            }];
            break;
            
        case 'treemap':
            data = [{
                type: 'treemap',
                labels: ['A', 'B', 'C', 'D'],
                parents: ['', '', '', ''],
                values: [10, 15, 12, 8]
            }];
            break;
            
        default:
            data = [{
                x: ['Category A', 'Category B', 'Category C'],
                y: [20, 14, 23],
                type: 'bar',
                marker: { color: '#4ECDC4' }
            }];
    }
    
    layout = {
        title: {
            text: title,
            font: { size: 16 }
        },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        margin: { t: 60, r: 30, b: 40, l: 40 },
        font: { family: 'Inter, Arial, sans-serif' }
    };
    
    const config = {
        responsive: true,
        displayModeBar: false
    };
    
    Plotly.newPlot(container, data, layout, config)
        .then(() => {
            console.log(`✅ Fallback chart created: ${title}`);
        })
        .catch(error => {
            console.error(`❌ Failed to create fallback chart for ${title}:`, error);
            container.innerHTML = `
                <div class="alert alert-warning text-center p-4">
                    <i class="fas fa-chart-bar fa-3x mb-3 text-muted"></i>
                    <h5>Chart Unavailable</h5>
                    <p class="text-muted">${title} visualization is temporarily unavailable.</p>
                    <button class="btn btn-sm btn-outline-primary" onclick="location.reload()">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </div>
            `;
        });
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