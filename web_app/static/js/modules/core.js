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
        // Set up category switching
        const categoryButtons = document.querySelectorAll('.viz-category-btn');
        const sections = document.querySelectorAll('.visualization-section');
        
        // Show heatmaps section by default
        const defaultSection = document.getElementById('heatmaps-section');
        if (defaultSection) {
            defaultSection.style.display = 'block';
        }
        
        const defaultButton = document.querySelector('[data-category="heatmaps"]');
        if (defaultButton) {
            defaultButton.classList.add('active');
        }
    }

    setupEventListeners() {
        // Category switching
        document.querySelectorAll('.viz-category-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.switchVisualizationCategory(category);
                
                // Update active button
                document.querySelectorAll('.viz-category-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
        
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

    switchVisualizationCategory(category) {
        // Hide all sections
        document.querySelectorAll('.visualization-section').forEach(section => {
            section.style.display = 'none';
        });
        
        // Show selected section
        const targetSection = document.getElementById(`${category}-section`);
        if (targetSection) {
            targetSection.style.display = 'block';
            this.currentCategory = category;
            
            // Load category-specific visualizations
            this.loadCategoryVisualizations(category);
        }
    }

    loadAllVisualizations() {
        console.log('Loading all visualizations...');
        // Load heatmaps (default category)
        this.loadCategoryVisualizations('heatmaps');
    }

    loadCategoryVisualizations(category) {
        console.log(`Loading ${category} visualizations...`);
        
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
            default:
                console.warn(`Unknown category: ${category}`);
        }
    }

    updateDataset() {
        const selector = document.getElementById('dataset-selector');
        this.config.dataset = selector.value;
        console.log(`Dataset updated to: ${this.config.dataset}`);
        this.loadCategoryVisualizations(this.currentCategory);
    }

    updateColorScheme() {
        const selector = document.getElementById('color-scheme-selector');
        this.config.colorScheme = selector.value;
        console.log(`Color scheme updated to: ${this.config.colorScheme}`);
        this.loadCategoryVisualizations(this.currentCategory);
    }

    updateChartSize() {
        const selector = document.getElementById('chart-size-selector');
        this.config.chartSize = selector.value;
        console.log(`Chart size updated to: ${this.config.chartSize}`);
        this.loadCategoryVisualizations(this.currentCategory);
    }

    toggleAnimation() {
        const toggle = document.getElementById('animation-toggle');
        this.config.animationEnabled = toggle.checked;
        console.log(`Animation ${this.config.animationEnabled ? 'enabled' : 'disabled'}`);
        this.loadCategoryVisualizations(this.currentCategory);
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.vizCore = new VisualizationCore();
});