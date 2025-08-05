/**
 * Widget Stability Test - Advanced testing for chart loading stability
 * Tests the enhanced stability improvements
 */

// Test configuration
const TEST_CONFIG = {
    iterations: 10,
    chartIds: [
        'model-performance-chart',
        'fraud-risk-chart', 
        'sentiment-distribution-chart',
        'customer-segments-chart'
    ],
    timeouts: {
        chartRender: 10000,
        validation: 15000,
        recovery: 20000
    }
};

class StabilityTester {
    constructor() {
        this.results = {
            iterations: 0,
            successful: 0,
            failed: 0,
            recovered: 0,
            chartResults: {},
            timings: []
        };
        
        this.currentIteration = 0;
    }
    
    async runStabilityTest() {
        console.log('🧪 Starting Widget Stability Test...');
        console.log(`Configuration: ${TEST_CONFIG.iterations} iterations, ${TEST_CONFIG.chartIds.length} charts`);
        
        // Initialize chart results tracking
        TEST_CONFIG.chartIds.forEach(chartId => {
            this.results.chartResults[chartId] = {
                successful: 0,
                failed: 0,
                recovered: 0,
                avgRenderTime: 0,
                timings: []
            };
        });
        
        for (let i = 0; i < TEST_CONFIG.iterations; i++) {
            this.currentIteration = i + 1;
            console.log(`\n📊 Iteration ${this.currentIteration}/${TEST_CONFIG.iterations}`);
            
            const iterationStart = Date.now();
            const iterationResult = await this.runSingleIteration();
            const iterationTime = Date.now() - iterationStart;
            
            this.results.iterations++;
            this.results.timings.push(iterationTime);
            
            if (iterationResult.success) {
                this.results.successful++;
                console.log(`✅ Iteration ${this.currentIteration} successful (${iterationTime}ms)`);
            } else {
                this.results.failed++;
                console.log(`❌ Iteration ${this.currentIteration} failed (${iterationTime}ms)`);
                
                if (iterationResult.recovered) {
                    this.results.recovered++;
                    console.log(`🔧 Recovery successful`);
                }
            }
            
            // Wait between iterations
            if (i < TEST_CONFIG.iterations - 1) {
                await this.delay(2000);
            }
        }
        
        // Generate final report
        this.generateReport();
    }
    
    async runSingleIteration() {
        const iterationResult = {
            success: true,
            recovered: false,
            chartResults: {}
        };
        
        try {
            // Step 1: Clear all charts
            await this.clearAllCharts();
            await this.delay(500);
            
            // Step 2: Verify charts are cleared
            const clearCheck = this.verifyChartsCleared();
            if (!clearCheck) {
                console.warn('⚠️ Charts not properly cleared');
            }
            
            // Step 3: Trigger chart rendering
            const renderStart = Date.now();
            await this.triggerChartRendering();
            
            // Step 4: Wait for initial rendering
            await this.delay(3000);
            
            // Step 5: Validate chart rendering with timeout
            const validationResults = await this.validateAllChartsWithTimeout();
            const renderTime = Date.now() - renderStart;
            
            // Step 6: Analyze results
            let allChartsSuccessful = true;
            let recoveryAttempted = false;
            
            for (const [chartId, result] of Object.entries(validationResults)) {
                const chartResult = this.results.chartResults[chartId];
                chartResult.timings.push(renderTime);
                
                iterationResult.chartResults[chartId] = result;
                
                if (result.success) {
                    chartResult.successful++;
                } else {
                    chartResult.failed++;
                    allChartsSuccessful = false;
                    
                    console.log(`⚠️ Chart ${chartId} failed: ${result.error}`);
                    
                    // Attempt recovery
                    const recoveryResult = await this.attemptChartRecovery(chartId);
                    if (recoveryResult) {
                        chartResult.recovered++;
                        recoveryAttempted = true;
                        console.log(`🔧 Chart ${chartId} recovered`);
                    }
                }
            }
            
            iterationResult.success = allChartsSuccessful;
            iterationResult.recovered = recoveryAttempted;
            
            return iterationResult;
            
        } catch (error) {
            console.error(`❌ Iteration error:`, error);
            iterationResult.success = false;
            return iterationResult;
        }
    }
    
    async clearAllCharts() {
        console.log('🧹 Clearing all charts...');
        
        TEST_CONFIG.chartIds.forEach(chartId => {
            const container = document.getElementById(chartId);
            if (container) {
                container.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="sr-only">Loading...</span></div>';
            }
        });
    }
    
    verifyChartsCleared() {
        for (const chartId of TEST_CONFIG.chartIds) {
            const container = document.getElementById(chartId);
            if (!container) continue;
            
            const plotlyDiv = container.querySelector('.plotly-graph-div');
            if (plotlyDiv) {
                return false; // Chart not cleared
            }
        }
        return true;
    }
    
    async triggerChartRendering() {
        console.log('🎨 Triggering chart rendering...');
        
        try {
            // Use the enhanced dashboard rendering system
            if (window.FCADashboard && window.FCADashboard.renderDashboardCharts) {
                await window.FCADashboard.renderDashboardCharts();
            } else if (window.chartManager && window.chartManager.renderAllCharts) {
                const cachedData = window.dashboardData || {};\n                await window.chartManager.renderAllCharts(cachedData);\n            } else {\n                throw new Error('No chart rendering system available');\n            }\n        } catch (error) {\n            console.error('❌ Chart rendering trigger failed:', error);\n            throw error;\n        }\n    }\n    \n    async validateAllChartsWithTimeout() {\n        console.log('🔍 Validating chart rendering...');\n        \n        const results = {};\n        const validationPromises = TEST_CONFIG.chartIds.map(async (chartId) => {\n            try {\n                const result = await this.validateSingleChart(chartId);\n                results[chartId] = result;\n            } catch (error) {\n                results[chartId] = { success: false, error: error.message };\n            }\n        });\n        \n        await Promise.all(validationPromises);\n        return results;\n    }\n    \n    async validateSingleChart(chartId) {\n        const timeout = TEST_CONFIG.timeouts.validation;\n        const startTime = Date.now();\n        \n        return new Promise((resolve) => {\n            const checkChart = () => {\n                const elapsed = Date.now() - startTime;\n                \n                if (elapsed > timeout) {\n                    resolve({ success: false, error: 'Validation timeout', elapsed });\n                    return;\n                }\n                \n                const container = document.getElementById(chartId);\n                if (!container) {\n                    resolve({ success: false, error: 'Container not found', elapsed });\n                    return;\n                }\n                \n                // Check for static fallback (considered success)\n                if (container.querySelector('.chart-static-fallback') || \n                    container.classList.contains('chart-static-fallback-applied')) {\n                    resolve({ success: true, type: 'static_fallback', elapsed });\n                    return;\n                }\n                \n                // Check for Plotly content\n                const plotlyDiv = container.querySelector('.plotly-graph-div');\n                if (!plotlyDiv) {\n                    setTimeout(checkChart, 200);\n                    return;\n                }\n                \n                // Check for SVG content\n                const svgElements = plotlyDiv.querySelectorAll('svg');\n                if (svgElements.length === 0) {\n                    setTimeout(checkChart, 200);\n                    return;\n                }\n                \n                resolve({ success: true, type: 'plotly', elapsed });\n            };\n            \n            checkChart();\n        });\n    }\n    \n    async attemptChartRecovery(chartId) {\n        console.log(`🔧 Attempting recovery for ${chartId}...`);\n        \n        try {\n            // Use enhanced recovery systems\n            if (window.chartManager && window.chartManager.recoverChart) {\n                return await window.chartManager.recoverChart(chartId);\n            }\n            \n            if (window.chartRenderer && window.chartRenderer.attemptChartRecovery) {\n                return await window.chartRenderer.attemptChartRecovery(chartId);\n            }\n            \n            if (window.chartMonitor && window.chartMonitor.attemptAutoRecovery) {\n                return await window.chartMonitor.attemptAutoRecovery(chartId);\n            }\n            \n            console.warn('⚠️ No recovery system available');\n            return false;\n            \n        } catch (error) {\n            console.error(`❌ Recovery failed for ${chartId}:`, error);\n            return false;\n        }\n    }\n    \n    generateReport() {\n        console.log('\\n📊 Widget Stability Test Report');\n        console.log('='.repeat(50));\n        \n        const successRate = (this.results.successful / this.results.iterations * 100).toFixed(1);\n        const recoveryRate = (this.results.recovered / this.results.failed * 100).toFixed(1);\n        const avgTime = (this.results.timings.reduce((a, b) => a + b, 0) / this.results.timings.length).toFixed(0);\n        \n        console.log(`📈 Overall Results:`);\n        console.log(`   Total Iterations: ${this.results.iterations}`);\n        console.log(`   Successful: ${this.results.successful} (${successRate}%)`);\n        console.log(`   Failed: ${this.results.failed}`);\n        console.log(`   Recovered: ${this.results.recovered} (${recoveryRate}% of failures)`);\n        console.log(`   Average Time: ${avgTime}ms`);\n        \n        console.log(`\\n📊 Chart-by-Chart Results:`);\n        for (const [chartId, result] of Object.entries(this.results.chartResults)) {\n            const chartSuccessRate = (result.successful / this.results.iterations * 100).toFixed(1);\n            const avgChartTime = result.timings.length > 0 ? \n                (result.timings.reduce((a, b) => a + b, 0) / result.timings.length).toFixed(0) : 'N/A';\n            \n            console.log(`   ${chartId}:`);\n            console.log(`     Success: ${result.successful}/${this.results.iterations} (${chartSuccessRate}%)`);\n            console.log(`     Failed: ${result.failed}`);\n            console.log(`     Recovered: ${result.recovered}`);\n            console.log(`     Avg Time: ${avgChartTime}ms`);\n        }\n        \n        // Stability assessment\n        let stabilityLevel = 'EXCELLENT';\n        if (successRate < 95) stabilityLevel = 'GOOD';\n        if (successRate < 90) stabilityLevel = 'MODERATE';\n        if (successRate < 80) stabilityLevel = 'POOR';\n        if (successRate < 70) stabilityLevel = 'CRITICAL';\n        \n        console.log(`\\n🎯 Stability Assessment: ${stabilityLevel}`);\n        \n        if (stabilityLevel !== 'EXCELLENT') {\n            console.log('\\n💡 Recommendations:');\n            if (successRate < 90) {\n                console.log('   - Increase DOM stabilization delays');\n                console.log('   - Enhance container validation timing');\n            }\n            if (this.results.recovered / this.results.failed < 0.8) {\n                console.log('   - Improve recovery mechanisms');\n                console.log('   - Add more fallback strategies');\n            }\n        }\n        \n        return {\n            successRate: parseFloat(successRate),\n            stabilityLevel,\n            avgTime: parseInt(avgTime),\n            chartResults: this.results.chartResults\n        };\n    }\n    \n    delay(ms) {\n        return new Promise(resolve => setTimeout(resolve, ms));\n    }\n}\n\n// Make test available globally\nwindow.StabilityTester = StabilityTester;\n\n// Auto-run test function\nwindow.runStabilityTest = async () => {\n    const tester = new StabilityTester();\n    return await tester.runStabilityTest();\n};\n\nconsole.log('🧪 Stability Tester loaded. Run with: runStabilityTest()');