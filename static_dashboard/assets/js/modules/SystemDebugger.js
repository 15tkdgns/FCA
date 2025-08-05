/**
 * System Debugger
 * Comprehensive debugging and monitoring for the FCA Dashboard
 */

class SystemDebugger {
    constructor() {
        this.initialized = false;
        this.diagnostics = {
            modules: {},
            images: {},
            charts: {},
            timing: {}
        };
        this.init();
    }
    
    init() {
        this.initialized = true;
        console.log('🔧 SystemDebugger initialized');
        
        // Set up global debug methods
        this.setupGlobalDebugMethods();
        
        // Start system monitoring
        setTimeout(() => this.runSystemDiagnostics(), 1000);
    }
    
    setupGlobalDebugMethods() {
        window.debugFCA = {
            ...window.debugFCA,
            
            // System diagnostics
            systemCheck: () => this.runSystemDiagnostics(),
            moduleCheck: () => this.checkModuleAvailability(),
            imageCheck: () => this.checkImageAvailability(),
            chartCheck: () => this.checkChartStatus(),
            
            // Force actions
            forceStaticFallbacks: () => this.forceAllStaticFallbacks(),
            resetFallbacks: () => this.resetAllFallbacks(),
            
            // Information
            getStats: () => this.getSystemStats(),
            showPaths: () => this.showImagePaths(),
            
            // Testing
            testImageLoading: () => this.testImageLoading(),
            runFullTest: () => this.runFullSystemTest()
        };
    }
    
    /**
     * Run comprehensive system diagnostics
     */
    runSystemDiagnostics() {
        console.group('🔧 FCA System Diagnostics');
        
        const modules = this.checkModuleAvailability();
        const images = this.checkImageAvailability();
        const charts = this.checkChartStatus();
        
        this.diagnostics = {
            modules,
            images,
            charts,
            timing: { lastCheck: new Date().toISOString() }
        };
        
        this.printDiagnosticSummary();
        console.groupEnd();
        
        return this.diagnostics;
    }
    
    /**
     * Check if all required modules are loaded
     */
    checkModuleAvailability() {
        const requiredModules = {
            'Plotly': () => typeof Plotly !== 'undefined',
            'StaticChartFallback': () => typeof window.staticChartFallback !== 'undefined',
            'ChartRenderer': () => typeof window.ChartRenderer !== 'undefined',
            'ChartMonitor': () => typeof window.chartMonitor !== 'undefined',
            'ChartManager': () => typeof window.ChartManager !== 'undefined'
        };
        
        const results = {};
        let availableCount = 0;
        
        for (const [name, checker] of Object.entries(requiredModules)) {
            const available = checker();
            results[name] = available;
            if (available) availableCount++;
            
            console.log(`${available ? '✅' : '❌'} ${name}: ${available ? 'Available' : 'Missing'}`);
        }
        
        results.summary = `${availableCount}/${Object.keys(requiredModules).length} modules available`;
        
        return results;
    }
    
    /**
     * Check if static chart images are accessible
     */
    async checkImageAvailability() {
        if (!window.staticChartFallback) {
            console.warn('⚠️ StaticChartFallback not available for image check');
            return { error: 'StaticChartFallback not available' };
        }
        
        const chartIds = Object.keys(window.staticChartFallback.chartMapping);
        const results = {
            total: chartIds.length,
            accessible: 0,
            inaccessible: 0,
            details: {}
        };
        
        console.log(`🖼️ Checking ${chartIds.length} static chart images...`);
        
        for (const chartId of chartIds.slice(0, 5)) { // Test first 5 to avoid overload
            const imagePath = window.staticChartFallback.getImagePath(chartId);
            if (imagePath) {
                try {
                    const accessible = await this.checkImageExists(imagePath);
                    results.details[chartId] = { imagePath, accessible };
                    
                    if (accessible) {
                        results.accessible++;
                        console.log(`✅ ${chartId}: ${imagePath}`);
                    } else {
                        results.inaccessible++;
                        console.log(`❌ ${chartId}: ${imagePath} (not accessible)`);
                    }
                } catch (error) {
                    results.inaccessible++;
                    results.details[chartId] = { imagePath, accessible: false, error: error.message };
                    console.log(`❌ ${chartId}: ${imagePath} (error: ${error.message})`);
                }
            }
        }
        
        return results;
    }
    
    /**
     * Check if an image exists and is accessible
     */
    checkImageExists(imagePath) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = imagePath;
            
            // Timeout after 3 seconds
            setTimeout(() => resolve(false), 3000);
        });
    }
    
    /**
     * Check current chart status
     */
    checkChartStatus() {
        const containers = document.querySelectorAll('[id$="-chart"]');
        const results = {
            total: containers.length,
            withPlotly: 0,
            withStaticFallback: 0,
            empty: 0,
            error: 0,
            details: {}
        };
        
        containers.forEach(container => {
            const id = container.id;
            const status = this.analyzeChartContainer(container);
            results.details[id] = status;
            
            switch (status.type) {
                case 'plotly': results.withPlotly++; break;
                case 'static': results.withStaticFallback++; break;
                case 'empty': results.empty++; break;
                case 'error': results.error++; break;
            }
        });
        
        return results;
    }
    
    /**
     * Analyze individual chart container
     */
    analyzeChartContainer(container) {
        const hasPlotly = container.querySelector('.plotly-graph-div');
        const hasStatic = container.querySelector('.chart-static-fallback') || 
                         container.classList.contains('chart-static-fallback-applied');
        const hasError = container.querySelector('.chart-error');
        const isEmpty = container.innerHTML.trim().length === 0;
        
        if (hasPlotly) {
            const svgCount = container.querySelectorAll('svg').length;
            const dataPoints = container.querySelectorAll('path, circle, rect, polygon').length;
            return {
                type: 'plotly',
                hasContent: svgCount > 0 && dataPoints > 0,
                svgCount,
                dataPoints
            };
        } else if (hasStatic) {
            const img = container.querySelector('img');
            return {
                type: 'static',
                hasImage: !!img,
                imageSrc: img ? img.src : null,
                imageLoaded: img ? img.complete && img.naturalHeight !== 0 : false
            };
        } else if (hasError) {
            return { type: 'error', message: 'Chart has error state' };
        } else if (isEmpty) {
            return { type: 'empty', message: 'Container is empty' };
        } else {
            return { type: 'unknown', content: container.innerHTML.substring(0, 100) };
        }
    }
    
    /**
     * Print diagnostic summary
     */
    printDiagnosticSummary() {
        const { modules, images, charts } = this.diagnostics;
        
        console.log('\n📊 SUMMARY:');
        console.log(`Modules: ${modules.summary || 'Not checked'}`);
        console.log(`Images: ${images.total ? `${images.accessible}/${images.total} accessible` : 'Not checked'}`);
        console.log(`Charts: ${charts.total ? `${charts.withPlotly} Plotly, ${charts.withStaticFallback} Static, ${charts.empty} Empty` : 'Not checked'}`);
    }
    
    /**
     * Force static fallbacks for all chart containers
     */
    forceAllStaticFallbacks() {
        if (!window.staticChartFallback) {
            console.error('❌ StaticChartFallback not available');
            return;
        }
        
        const containers = document.querySelectorAll('[id$="-chart"]');
        const containerIds = Array.from(containers).map(c => c.id);
        
        console.log(`🖼️ Forcing static fallbacks for ${containerIds.length} containers...`);
        
        const results = window.staticChartFallback.batchApplyFallbacks(
            containerIds,
            'Forced by system debugger'
        );
        
        console.log('Results:', results);
        return results;
    }
    
    /**
     * Reset all fallback attempts
     */
    resetAllFallbacks() {
        if (!window.staticChartFallback) {
            console.error('❌ StaticChartFallback not available');
            return;
        }
        
        const containers = document.querySelectorAll('[id$="-chart"]');
        containers.forEach(container => {
            window.staticChartFallback.resetAttempts(container.id);
            container.classList.remove('chart-static-fallback-applied', 'chart-no-fallback-applied');
        });
        
        console.log('🔄 All fallback attempts reset');
    }
    
    /**
     * Show all image paths for debugging
     */
    showImagePaths() {
        if (!window.staticChartFallback) {
            console.error('❌ StaticChartFallback not available');
            return;
        }
        
        console.group('🖼️ Image Path Mappings');
        Object.entries(window.staticChartFallback.chartMapping).forEach(([containerId, filename]) => {
            const fullPath = window.staticChartFallback.getImagePath(containerId);
            console.log(`${containerId} → ${fullPath}`);
        });
        console.groupEnd();
    }
    
    /**
     * Test image loading with a sample image
     */
    async testImageLoading() {
        const testPath = 'assets/images/charts/model_comparison.png';
        console.log(`🧪 Testing image loading: ${testPath}`);
        
        const accessible = await this.checkImageExists(testPath);
        console.log(`Result: ${accessible ? '✅ Accessible' : '❌ Not accessible'}`);
        
        return { testPath, accessible };
    }
    
    /**
     * Run full system test
     */
    async runFullSystemTest() {
        console.group('🧪 Full System Test');
        
        // 1. Module check
        console.log('1️⃣ Checking modules...');
        this.checkModuleAvailability();
        
        // 2. Image accessibility test
        console.log('2️⃣ Testing image accessibility...');
        await this.testImageLoading();
        
        // 3. Force one fallback
        console.log('3️⃣ Testing fallback system...');
        if (window.staticChartFallback) {
            const testContainer = document.querySelector('[id$="-chart"]');
            if (testContainer) {
                const result = window.staticChartFallback.applyFallback(
                    testContainer.id, 
                    'System test'
                );
                console.log(`Fallback test result: ${result ? '✅ Success' : '❌ Failed'}`);
            }
        }
        
        // 4. Final status check
        console.log('4️⃣ Final status check...');
        this.checkChartStatus();
        
        console.groupEnd();
    }
    
    /**
     * Get system statistics
     */
    getSystemStats() {
        const stats = {
            timestamp: new Date().toISOString(),
            modules: this.diagnostics.modules,
            fallbackSystem: window.staticChartFallback ? window.staticChartFallback.getStats() : null,
            chartMonitor: window.chartMonitor ? {
                chartCount: window.chartMonitor.charts.size,
                initialized: window.chartMonitor.initialized
            } : null
        };
        
        console.log('📊 System Statistics:', stats);
        return stats;
    }
}

// Initialize system debugger
window.systemDebugger = new SystemDebugger();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SystemDebugger;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.SystemDebugger = SystemDebugger;
}