// Core Visualization Functions
// Main initialization and event handling

class VisualizationCore {
    constructor() {
        this.currentCategory = 'heatmaps';
        this.config = {
            dataset: 'sample',
            colorScheme: 'viridis',
            chartSize: 'medium',
            animationEnabled: true
        };
        this.init();
    }

    init() {
        console.log('📊 Advanced Visualizations Dashboard initializing...');
        this.setupEventListeners();
        this.initializeVisualizationDashboard();
        this.loadAllVisualizations();
    }

    initializeVisualizationDashboard() {
        // All sections are now visible by default - no tab switching needed
        console.log('📊 All visualization sections are now visible');
    }

    setupEventListeners() {
        // Control panel listeners
        const datasetSelector = document.getElementById('dataset-selector');
        if (datasetSelector) {
            datasetSelector.addEventListener('change', () => this.updateDataset());
        }
        
        const colorSchemeSelector = document.getElementById('color-scheme-selector');
        if (colorSchemeSelector) {
            colorSchemeSelector.addEventListener('change', () => this.updateColorScheme());
        }
        
        const chartSizeSelector = document.getElementById('chart-size-selector');
        if (chartSizeSelector) {
            chartSizeSelector.addEventListener('change', () => this.updateChartSize());
        }
        
        const animationToggle = document.getElementById('animation-toggle');
        if (animationToggle) {
            animationToggle.addEventListener('change', () => this.toggleAnimation());
        }
    }

    // Category switching method removed - all sections are now visible

    loadAllVisualizations() {
        console.log('Loading all visualizations...');
        // Load all categories since they're all visible now
        this.loadCategoryVisualizations('heatmaps');
        this.loadCategoryVisualizations('distributions');
        this.loadCategoryVisualizations('relationships');
        this.loadCategoryVisualizations('hierarchical');
        this.loadCategoryVisualizations('3d');
        this.loadCategoryVisualizations('advanced');
    }

    loadCategoryVisualizations(category) {
        console.log(`Loading ${category} visualizations...`);
        
        try {
            switch (category) {
            case 'heatmaps':
                if (window.HeatmapModule) {
                    window.HeatmapModule.loadAll();
                }
                break;
            case 'distributions':
                if (window.DistributionModule) {
                    window.DistributionModule.loadAll();
                }
                break;
            case 'relationships':
                if (window.RelationshipModule) {
                    window.RelationshipModule.loadAll();
                }
                break;
            case 'hierarchical':
                if (window.HierarchicalModule) {
                    window.HierarchicalModule.loadAll();
                }
                break;
            case '3d':
                if (window.ThreeDModule) {
                    window.ThreeDModule.loadAll();
                }
                break;
            case 'advanced':
                // Advanced visualizations - time series heatmap container exists but no module yet
                console.log('📊 Advanced visualizations - containers ready for future implementation');
                break;
            default:
                console.warn(`Unknown category: ${category}`);
            }
        } catch (error) {
            console.error(`❌ Error loading ${category} visualizations:`, error);
        }
    }

    updateDataset() {
        const selector = document.getElementById('dataset-selector');
        this.config.dataset = selector.value;
        console.log(`Dataset updated to: ${this.config.dataset}`);
        this.loadAllVisualizations();
    }

    updateColorScheme() {
        const selector = document.getElementById('color-scheme-selector');
        this.config.colorScheme = selector.value;
        console.log(`Color scheme updated to: ${this.config.colorScheme}`);
        this.loadAllVisualizations();
    }

    updateChartSize() {
        const selector = document.getElementById('chart-size-selector');
        this.config.chartSize = selector.value;
        console.log(`Chart size updated to: ${this.config.chartSize}`);
        this.loadAllVisualizations();
    }

    toggleAnimation() {
        const toggle = document.getElementById('animation-toggle');
        this.config.animationEnabled = toggle.checked;
        console.log(`Animation ${this.config.animationEnabled ? 'enabled' : 'disabled'}`);
        this.loadAllVisualizations();
    }

    showLoading(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '<div class="text-center p-4"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Loading visualization...</p></div>';
        }
    }

    showError(containerId, message) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `<div class="alert alert-danger"><strong>Error:</strong> ${message}</div>`;
        }
    }
}

// Export the class for external use
window.VisualizationCore = VisualizationCore;

// Note: Initialization is now handled by the main modular loader
// This prevents double initialization conflicts
console.log('📊 VisualizationCore class registered and ready for initialization');