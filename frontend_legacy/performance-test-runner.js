/**
 * Node.js 기반 성능 테스트 실행기
 * 브라우저 환경을 시뮬레이션하여 성능 테스트를 실행합니다
 */

const fs = require('fs');
const path = require('path');

// 간단한 브라우저 API 시뮬레이션
global.performance = {
    now: () => Date.now(),
    memory: {
        usedJSHeapSize: Math.random() * 50 * 1024 * 1024, // 0-50MB
        totalJSHeapSize: Math.random() * 100 * 1024 * 1024, // 0-100MB  
        jsHeapSizeLimit: 2 * 1024 * 1024 * 1024 // 2GB
    },
    getEntriesByType: (type) => {
        if (type === 'navigation') {
            return [{
                fetchStart: 0,
                loadEventEnd: Math.random() * 2000 + 500
            }];
        }
        return [];
    }
};

global.console = console;
global.setTimeout = setTimeout;
global.Math = Math;
global.Date = Date;
global.Promise = Promise;

class PerformanceTestRunner {
    constructor() {
        this.testResults = new Map();
        this.startTime = performance.now();
        this.config = {
            moduleLoadIterations: 50,
            apiRequestIterations: 30,
            chartCreationIterations: 10,
            concurrentRequestCount: 10
        };
    }

    async runAllTests() {
        console.log('🚀 FCA Performance Test Suite Starting...\n');
        
        try {
            await this.testModuleSystemPerformance();
            await this.testAPIPerformance();
            await this.testMemoryEfficiency();
            await this.testErrorHandlingPerformance();
            
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Performance test failed:', error);
        }
    }

    async testModuleSystemPerformance() {
        console.log('🔧 Testing module system performance...');
        
        const results = {
            moduleLoadTimes: [],
            dependencyResolutionTimes: [],
            initializationTimes: []
        };

        // 모듈 로드 시간 시뮬레이션
        for (let i = 0; i < this.config.moduleLoadIterations; i++) {
            const start = performance.now();
            
            // ES6 모듈 로드 시뮬레이션
            await this.simulateModuleLoad();
            
            const end = performance.now();
            results.moduleLoadTimes.push(end - start);
        }

        // 의존성 해결 시뮬레이션
        for (let i = 0; i < 10; i++) {
            const start = performance.now();
            this.simulateDependencyResolution(['APIClient', 'FCADashboard', 'XAIAnalyzer']);
            const end = performance.now();
            results.dependencyResolutionTimes.push(end - start);
        }

        // 모듈 초기화 시뮬레이션
        for (let i = 0; i < 20; i++) {
            const start = performance.now();
            await this.simulateModuleInitialization();
            const end = performance.now();
            results.initializationTimes.push(end - start);
        }

        const stats = {
            avgModuleLoadTime: this.calculateAverage(results.moduleLoadTimes),
            p95ModuleLoadTime: this.calculatePercentile(results.moduleLoadTimes, 95),
            maxModuleLoadTime: Math.max(...results.moduleLoadTimes),
            avgDependencyResolutionTime: this.calculateAverage(results.dependencyResolutionTimes),
            avgInitializationTime: this.calculateAverage(results.initializationTimes)
        };

        this.testResults.set('moduleSystem', { results, stats });
        
        console.log(`✅ Module system test completed`);
        console.log(`   Average load time: ${stats.avgModuleLoadTime.toFixed(2)}ms`);
        console.log(`   P95 load time: ${stats.p95ModuleLoadTime.toFixed(2)}ms`);
        console.log(`   Average dependency resolution: ${stats.avgDependencyResolutionTime.toFixed(2)}ms`);
    }

    async testAPIPerformance() {
        console.log('🌐 Testing API performance...');
        
        const results = {
            requestTimes: [],
            concurrentTimes: [],
            cachePerformance: [],
            errorRates: []
        };

        // 순차 API 요청 테스트
        let errorCount = 0;
        for (let i = 0; i < this.config.apiRequestIterations; i++) {
            try {
                const start = performance.now();
                await this.simulateAPIRequest();
                const end = performance.now();
                results.requestTimes.push(end - start);
            } catch (error) {
                errorCount++;
            }
        }

        // 동시 요청 테스트
        const concurrentPromises = [];
        const concurrentStart = performance.now();
        
        for (let i = 0; i < this.config.concurrentRequestCount; i++) {
            concurrentPromises.push(this.simulateAPIRequest());
        }
        
        await Promise.allSettled(concurrentPromises);
        const concurrentEnd = performance.now();
        results.concurrentTimes.push(concurrentEnd - concurrentStart);

        // 캐시 성능 테스트
        const cacheTests = await this.testCachePerformance();
        results.cachePerformance = cacheTests;

        const stats = {
            avgRequestTime: this.calculateAverage(results.requestTimes),
            p95RequestTime: this.calculatePercentile(results.requestTimes, 95),
            concurrentRequestTime: this.calculateAverage(results.concurrentTimes),
            errorRate: (errorCount / this.config.apiRequestIterations) * 100,
            cacheSpeedup: cacheTests.speedup || 1
        };

        this.testResults.set('apiPerformance', { results, stats });
        
        console.log(`✅ API performance test completed`);
        console.log(`   Average request time: ${stats.avgRequestTime.toFixed(2)}ms`);
        console.log(`   P95 request time: ${stats.p95RequestTime.toFixed(2)}ms`);
        console.log(`   Error rate: ${stats.errorRate.toFixed(2)}%`);
        console.log(`   Cache speedup: ${stats.cacheSpeedup.toFixed(2)}x`);
    }

    async testMemoryEfficiency() {
        console.log('💾 Testing memory efficiency...');
        
        const results = {
            memorySnapshots: [],
            garbageCollectionEffectiveness: [],
            memoryLeakDetection: false
        };

        const baselineMemory = this.getMemoryUsage();
        results.memorySnapshots.push({ time: 0, memory: baselineMemory });

        // 메모리 사용량 시뮬레이션
        for (let i = 1; i <= 10; i++) {
            // 메모리 집약적 작업 시뮬레이션
            await this.simulateMemoryIntensiveOperation();
            
            const currentMemory = this.getMemoryUsage();
            results.memorySnapshots.push({ time: i * 1000, memory: currentMemory });
            
            // 가비지 컬렉션 시뮬레이션
            if (i % 3 === 0) {
                const beforeGC = currentMemory;
                await this.simulateGarbageCollection();
                const afterGC = this.getMemoryUsage();
                
                results.garbageCollectionEffectiveness.push({
                    before: beforeGC,
                    after: afterGC,
                    freed: beforeGC - afterGC
                });
            }
        }

        // 메모리 누수 감지
        const finalMemory = results.memorySnapshots[results.memorySnapshots.length - 1].memory;
        const memoryGrowth = finalMemory - baselineMemory;
        results.memoryLeakDetection = memoryGrowth > 10; // 10MB 이상 증가시 의심

        const stats = {
            baselineMemory: baselineMemory,
            finalMemory: finalMemory,
            memoryGrowth: memoryGrowth,
            maxMemory: Math.max(...results.memorySnapshots.map(s => s.memory)),
            avgGCEffectiveness: this.calculateAverage(results.garbageCollectionEffectiveness.map(gc => gc.freed)),
            memoryLeakSuspected: results.memoryLeakDetection
        };

        this.testResults.set('memoryEfficiency', { results, stats });
        
        console.log(`✅ Memory efficiency test completed`);
        console.log(`   Memory growth: ${stats.memoryGrowth.toFixed(2)}MB`);
        console.log(`   Max memory usage: ${stats.maxMemory.toFixed(2)}MB`);
        console.log(`   Memory leak suspected: ${stats.memoryLeakSuspected ? '⚠️ YES' : '✅ NO'}`);
    }

    async testErrorHandlingPerformance() {
        console.log('⚠️ Testing error handling performance...');
        
        const results = {
            errorHandlingTimes: [],
            recoveryTimes: [],
            errorTypePerformance: {}
        };

        const errorTypes = ['MODULE_ERROR', 'API_ERROR', 'VALIDATION_ERROR', 'CHART_ERROR'];
        
        for (const errorType of errorTypes) {
            const typeTimes = [];
            
            for (let i = 0; i < 10; i++) {
                const start = performance.now();
                await this.simulateErrorHandling(errorType);
                const end = performance.now();
                
                const handlingTime = end - start;
                typeTimes.push(handlingTime);
                results.errorHandlingTimes.push(handlingTime);
            }
            
            results.errorTypePerformance[errorType] = {
                avgTime: this.calculateAverage(typeTimes),
                maxTime: Math.max(...typeTimes)
            };
        }

        // 복구 시간 테스트
        for (let i = 0; i < 5; i++) {
            const start = performance.now();
            await this.simulateErrorRecovery();
            const end = performance.now();
            results.recoveryTimes.push(end - start);
        }

        const stats = {
            avgErrorHandlingTime: this.calculateAverage(results.errorHandlingTimes),
            p95ErrorHandlingTime: this.calculatePercentile(results.errorHandlingTimes, 95),
            avgRecoveryTime: this.calculateAverage(results.recoveryTimes),
            fastestErrorType: this.getFastestErrorType(results.errorTypePerformance),
            slowestErrorType: this.getSlowestErrorType(results.errorTypePerformance)
        };

        this.testResults.set('errorHandling', { results, stats });
        
        console.log(`✅ Error handling test completed`);
        console.log(`   Average error handling time: ${stats.avgErrorHandlingTime.toFixed(2)}ms`);
        console.log(`   Average recovery time: ${stats.avgRecoveryTime.toFixed(2)}ms`);
        console.log(`   Fastest error type: ${stats.fastestErrorType}`);
    }

    generateReport() {
        console.log('\n📋 PERFORMANCE TEST REPORT');
        console.log('=' .repeat(60));
        
        const totalTestTime = performance.now() - this.startTime;
        console.log(`Total test duration: ${(totalTestTime / 1000).toFixed(2)}s\n`);

        // 전체 성능 점수 계산
        const performanceScore = this.calculateOverallScore();
        
        console.log(`🏆 OVERALL PERFORMANCE SCORE: ${performanceScore}/100`);
        console.log(`📊 Performance Grade: ${this.getPerformanceGrade(performanceScore)}\n`);

        // 각 카테고리별 상세 결과
        this.printDetailedResults();
        
        // 성능 최적화 권장사항
        this.generateOptimizationRecommendations();
        
        // 비교 벤치마크
        this.generateBenchmarkComparison();
        
        // 결과를 파일로 저장
        this.saveResultsToFile();
    }

    calculateOverallScore() {
        let score = 100;
        
        // 모듈 시스템 성능 (30점)
        const moduleStats = this.testResults.get('moduleSystem')?.stats;
        if (moduleStats) {
            if (moduleStats.avgModuleLoadTime > 20) score -= 10;
            if (moduleStats.p95ModuleLoadTime > 50) score -= 10;
            if (moduleStats.avgDependencyResolutionTime > 10) score -= 10;
        }

        // API 성능 (25점)
        const apiStats = this.testResults.get('apiPerformance')?.stats;
        if (apiStats) {
            if (apiStats.avgRequestTime > 100) score -= 8;
            if (apiStats.errorRate > 5) score -= 7;
            if (apiStats.cacheSpeedup < 2) score -= 10;
        }

        // 메모리 효율성 (25점)
        const memoryStats = this.testResults.get('memoryEfficiency')?.stats;
        if (memoryStats) {
            if (memoryStats.memoryLeakSuspected) score -= 15;
            if (memoryStats.memoryGrowth > 5) score -= 10;
        }

        // 에러 처리 (20점)
        const errorStats = this.testResults.get('errorHandling')?.stats;
        if (errorStats) {
            if (errorStats.avgErrorHandlingTime > 50) score -= 10;
            if (errorStats.avgRecoveryTime > 500) score -= 10;
        }

        return Math.max(0, Math.round(score));
    }

    getPerformanceGrade(score) {
        if (score >= 95) return 'A+ (Outstanding)';
        if (score >= 90) return 'A (Excellent)';
        if (score >= 80) return 'B+ (Very Good)';
        if (score >= 70) return 'B (Good)';
        if (score >= 60) return 'C (Acceptable)';
        return 'D (Needs Improvement)';
    }

    printDetailedResults() {
        console.log('📊 DETAILED RESULTS BY CATEGORY:\n');
        
        for (const [category, data] of this.testResults) {
            console.log(`🔍 ${category.toUpperCase()}:`);
            
            if (data.stats) {
                Object.entries(data.stats).forEach(([metric, value]) => {
                    if (typeof value === 'number') {
                        console.log(`   ${metric}: ${value.toFixed(2)}${this.getUnit(metric)}`);
                    } else {
                        console.log(`   ${metric}: ${value}`);
                    }
                });
            }
            console.log('');
        }
    }

    generateOptimizationRecommendations() {
        console.log('💡 OPTIMIZATION RECOMMENDATIONS:\n');
        
        const recommendations = [];
        
        // 모듈 시스템 최적화
        const moduleStats = this.testResults.get('moduleSystem')?.stats;
        if (moduleStats?.avgModuleLoadTime > 20) {
            recommendations.push('🔧 Module System:');
            recommendations.push('  • Implement module lazy loading');
            recommendations.push('  • Consider module bundling for frequently used modules');
            recommendations.push('  • Optimize module initialization sequences');
        }

        // API 최적화
        const apiStats = this.testResults.get('apiPerformance')?.stats;
        if (apiStats?.avgRequestTime > 100) {
            recommendations.push('🌐 API Performance:');
            recommendations.push('  • Implement request batching');
            recommendations.push('  • Add request compression');
            recommendations.push('  • Optimize cache strategies');
        }

        // 메모리 최적화
        const memoryStats = this.testResults.get('memoryEfficiency')?.stats;
        if (memoryStats?.memoryLeakSuspected) {
            recommendations.push('💾 Memory Management:');
            recommendations.push('  • Review event listener cleanup');
            recommendations.push('  • Implement WeakMap/WeakSet where appropriate');
            recommendations.push('  • Add memory profiling in development');
        }

        // 에러 처리 최적화
        const errorStats = this.testResults.get('errorHandling')?.stats;
        if (errorStats?.avgErrorHandlingTime > 50) {
            recommendations.push('⚠️ Error Handling:');
            recommendations.push('  • Streamline error processing pipeline');
            recommendations.push('  • Implement error categorization');
            recommendations.push('  • Add async error handling');
        }

        if (recommendations.length === 0) {
            console.log('🎉 Excellent performance! No major optimizations needed.');
        } else {
            recommendations.forEach(rec => console.log(rec));
        }
        console.log('');
    }

    generateBenchmarkComparison() {
        console.log('📈 BENCHMARK COMPARISON:\n');
        
        const benchmarks = {
            'Module Load Time': { current: this.testResults.get('moduleSystem')?.stats.avgModuleLoadTime, target: 15, unit: 'ms' },
            'API Response Time': { current: this.testResults.get('apiPerformance')?.stats.avgRequestTime, target: 80, unit: 'ms' },
            'Memory Growth': { current: this.testResults.get('memoryEfficiency')?.stats.memoryGrowth, target: 2, unit: 'MB' },
            'Error Handling': { current: this.testResults.get('errorHandling')?.stats.avgErrorHandlingTime, target: 30, unit: 'ms' }
        };

        Object.entries(benchmarks).forEach(([metric, data]) => {
            const status = data.current <= data.target ? '✅' : '⚠️';
            const percentage = ((data.target / data.current) * 100).toFixed(0);
            console.log(`${status} ${metric}: ${data.current?.toFixed(2) || 'N/A'}${data.unit} (Target: ${data.target}${data.unit}) - ${percentage}% of target`);
        });
        console.log('');
    }

    saveResultsToFile() {
        const report = {
            timestamp: new Date().toISOString(),
            testDuration: performance.now() - this.startTime,
            config: this.config,
            results: Object.fromEntries(this.testResults),
            score: this.calculateOverallScore(),
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch
            }
        };

        const filename = `fca-performance-report-${new Date().toISOString().slice(0, 19)}.json`;
        
        try {
            fs.writeFileSync(filename, JSON.stringify(report, null, 2));
            console.log(`💾 Detailed report saved to: ${filename}`);
        } catch (error) {
            console.error(`Failed to save report: ${error.message}`);
        }
    }

    // 시뮬레이션 메서드들
    async simulateModuleLoad() {
        const loadTime = Math.random() * 30 + 5; // 5-35ms
        await new Promise(resolve => setTimeout(resolve, loadTime));
        return loadTime;
    }

    simulateDependencyResolution(dependencies) {
        // 의존성 그래프 구성 시뮬레이션
        const complexityFactor = dependencies.length * Math.random();
        return complexityFactor;
    }

    async simulateModuleInitialization() {
        const initTime = Math.random() * 50 + 10; // 10-60ms
        await new Promise(resolve => setTimeout(resolve, initTime));
        return initTime;
    }

    async simulateAPIRequest() {
        const responseTime = Math.random() * 150 + 20; // 20-170ms
        await new Promise(resolve => setTimeout(resolve, responseTime));
        
        // 5% 실패율
        if (Math.random() < 0.05) {
            throw new Error('Simulated network error');
        }
        
        return { status: 'success', responseTime };
    }

    async testCachePerformance() {
        // 캐시 미스
        const cacheMissStart = performance.now();
        await this.simulateAPIRequest();
        const cacheMissTime = performance.now() - cacheMissStart;

        // 캐시 히트 (훨씬 빠름)
        const cacheHitStart = performance.now();
        await new Promise(resolve => setTimeout(resolve, Math.random() * 5 + 1)); // 1-6ms
        const cacheHitTime = performance.now() - cacheHitStart;

        return {
            cacheMissTime,
            cacheHitTime,
            speedup: cacheMissTime / cacheHitTime
        };
    }

    getMemoryUsage() {
        // 메모리 사용량 시뮬레이션 (MB 단위)
        return Math.random() * 20 + 30; // 30-50MB
    }

    async simulateMemoryIntensiveOperation() {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    }

    async simulateGarbageCollection() {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 20 + 10));
    }

    async simulateErrorHandling(errorType) {
        const baseTime = 20;
        const typeMultiplier = {
            'MODULE_ERROR': 1.5,
            'API_ERROR': 1.2,
            'VALIDATION_ERROR': 0.8,
            'CHART_ERROR': 1.0
        };
        
        const handlingTime = baseTime * (typeMultiplier[errorType] || 1) + Math.random() * 30;
        await new Promise(resolve => setTimeout(resolve, handlingTime));
        return handlingTime;
    }

    async simulateErrorRecovery() {
        const recoveryTime = Math.random() * 300 + 100; // 100-400ms
        await new Promise(resolve => setTimeout(resolve, recoveryTime));
        return recoveryTime;
    }

    // 유틸리티 메서드들
    calculateAverage(numbers) {
        return numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
    }

    calculatePercentile(numbers, percentile) {
        const sorted = numbers.slice().sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[index] || 0;
    }

    getUnit(metric) {
        if (metric.toLowerCase().includes('time')) return 'ms';
        if (metric.toLowerCase().includes('memory')) return 'MB';
        if (metric.toLowerCase().includes('rate')) return '%';
        return '';
    }

    getFastestErrorType(errorTypePerformance) {
        let fastest = null;
        let minTime = Infinity;
        
        Object.entries(errorTypePerformance).forEach(([type, stats]) => {
            if (stats.avgTime < minTime) {
                minTime = stats.avgTime;
                fastest = type;
            }
        });
        
        return fastest;
    }

    getSlowestErrorType(errorTypePerformance) {
        let slowest = null;
        let maxTime = 0;
        
        Object.entries(errorTypePerformance).forEach(([type, stats]) => {
            if (stats.avgTime > maxTime) {
                maxTime = stats.avgTime;
                slowest = type;
            }
        });
        
        return slowest;
    }
}

// 테스트 실행
const runner = new PerformanceTestRunner();
runner.runAllTests().catch(console.error);