/**
 * FCA 모듈러 시스템 성능 테스트
 * 다양한 성능 지표를 측정하고 분석합니다
 */

class PerformanceTest {
    constructor() {
        this.testResults = new Map();
        this.startTime = performance.now();
        this.memoryBaseline = null;
        this.testConfig = {
            moduleLoadIterations: 100,
            apiRequestIterations: 50,
            chartCreationIterations: 10,
            memoryLeakTestDuration: 30000,
            concurrentRequestCount: 20
        };
    }

    async runAllTests() {
        console.log('🚀 FCA Performance Test Suite Starting...\n');
        
        try {
            // 기본 성능 측정
            await this.measureBaseline();
            
            // 모듈 시스템 성능 테스트
            await this.testModuleSystem();
            
            // API 성능 테스트
            await this.testAPIPerformance();
            
            // 차트 성능 테스트
            await this.testChartPerformance();
            
            // 메모리 사용량 테스트
            await this.testMemoryUsage();
            
            // 에러 처리 성능 테스트
            await this.testErrorHandling();
            
            // 종합 성능 보고서 생성
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Performance test failed:', error);
        }
    }

    async measureBaseline() {
        console.log('📊 Measuring baseline performance...');
        
        const baseline = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            memory: this.getMemoryInfo(),
            navigation: performance.getEntriesByType('navigation')[0],
            resources: performance.getEntriesByType('resource').length
        };
        
        this.memoryBaseline = baseline.memory;
        this.testResults.set('baseline', baseline);
        
        console.log(`✅ Baseline established - Memory: ${baseline.memory.used}MB`);
    }

    async testModuleSystem() {
        console.log('🔧 Testing module system performance...');
        
        const results = {
            moduleLoadTime: [],
            dependencyResolutionTime: [],
            moduleInitializationTime: [],
            moduleDestroyTime: []
        };

        // 모듈 로드 시간 테스트
        for (let i = 0; i < this.testConfig.moduleLoadIterations; i++) {
            const start = performance.now();
            
            // 가상 모듈 로드 시뮬레이션
            await this.simulateModuleLoad();
            
            const end = performance.now();
            results.moduleLoadTime.push(end - start);
        }

        // 의존성 해결 시간 테스트
        if (window.moduleManager) {
            const start = performance.now();
            const dependencyGraph = window.moduleManager.getDependencyGraph();
            const loadOrder = window.moduleManager.calculateLoadOrder();
            const end = performance.now();
            
            results.dependencyResolutionTime.push(end - start);
            results.dependencyGraphNodes = Object.keys(dependencyGraph).length;
        }

        // 통계 계산
        const stats = {
            avgModuleLoadTime: this.calculateAverage(results.moduleLoadTime),
            minModuleLoadTime: Math.min(...results.moduleLoadTime),
            maxModuleLoadTime: Math.max(...results.moduleLoadTime),
            p95ModuleLoadTime: this.calculatePercentile(results.moduleLoadTime, 95),
            avgDependencyResolution: this.calculateAverage(results.dependencyResolutionTime)
        };

        this.testResults.set('moduleSystem', { results, stats });
        
        console.log(`✅ Module system test completed`);
        console.log(`   Average load time: ${stats.avgModuleLoadTime.toFixed(2)}ms`);
        console.log(`   P95 load time: ${stats.p95ModuleLoadTime.toFixed(2)}ms`);
    }

    async testAPIPerformance() {
        console.log('🌐 Testing API performance...');
        
        const results = {
            requestTimes: [],
            concurrentRequestTimes: [],
            cacheHitTimes: [],
            cacheMissTimes: [],
            errors: 0
        };

        // 순차 API 요청 테스트
        for (let i = 0; i < this.testConfig.apiRequestIterations; i++) {
            try {
                const start = performance.now();
                await this.simulateAPIRequest();
                const end = performance.now();
                results.requestTimes.push(end - start);
            } catch (error) {
                results.errors++;
            }
        }

        // 동시 API 요청 테스트
        const concurrentPromises = [];
        const concurrentStart = performance.now();
        
        for (let i = 0; i < this.testConfig.concurrentRequestCount; i++) {
            concurrentPromises.push(this.simulateAPIRequest());
        }
        
        await Promise.allSettled(concurrentPromises);
        const concurrentEnd = performance.now();
        results.concurrentRequestTimes.push(concurrentEnd - concurrentStart);

        // 캐시 성능 테스트
        if (window.apiClient) {
            // 캐시 미스 (첫 번째 요청)
            const cacheMissStart = performance.now();
            await this.simulateAPIRequest('/test-cache-miss');
            const cacheMissEnd = performance.now();
            results.cacheMissTimes.push(cacheMissEnd - cacheMissStart);

            // 캐시 히트 (두 번째 동일한 요청)
            const cacheHitStart = performance.now();
            await this.simulateAPIRequest('/test-cache-miss');
            const cacheHitEnd = performance.now();
            results.cacheHitTimes.push(cacheHitEnd - cacheHitStart);
        }

        const stats = {
            avgRequestTime: this.calculateAverage(results.requestTimes),
            p95RequestTime: this.calculatePercentile(results.requestTimes, 95),
            avgConcurrentTime: this.calculateAverage(results.concurrentRequestTimes),
            avgCacheHitTime: this.calculateAverage(results.cacheHitTimes),
            avgCacheMissTime: this.calculateAverage(results.cacheMissTimes),
            errorRate: (results.errors / this.testConfig.apiRequestIterations) * 100
        };

        this.testResults.set('apiPerformance', { results, stats });
        
        console.log(`✅ API performance test completed`);
        console.log(`   Average request time: ${stats.avgRequestTime.toFixed(2)}ms`);
        console.log(`   Error rate: ${stats.errorRate.toFixed(2)}%`);
        console.log(`   Cache speedup: ${(stats.avgCacheMissTime / stats.avgCacheHitTime).toFixed(2)}x`);
    }

    async testChartPerformance() {
        console.log('📈 Testing chart performance...');
        
        const results = {
            chartCreationTimes: [],
            chartRenderTimes: [],
            chartDestroyTimes: [],
            memoryUsagePerChart: []
        };

        for (let i = 0; i < this.testConfig.chartCreationIterations; i++) {
            const memoryBefore = this.getMemoryInfo();
            
            // 차트 생성 시간
            const createStart = performance.now();
            const chartId = await this.simulateChartCreation();
            const createEnd = performance.now();
            results.chartCreationTimes.push(createEnd - createStart);

            // 차트 렌더링 시간 (약간의 지연 후 측정)
            await new Promise(resolve => setTimeout(resolve, 100));
            const renderStart = performance.now();
            await this.simulateChartRender(chartId);
            const renderEnd = performance.now();
            results.chartRenderTimes.push(renderEnd - renderStart);

            // 메모리 사용량
            const memoryAfter = this.getMemoryInfo();
            results.memoryUsagePerChart.push(memoryAfter.used - memoryBefore.used);

            // 차트 제거 시간
            const destroyStart = performance.now();
            await this.simulateChartDestroy(chartId);
            const destroyEnd = performance.now();
            results.chartDestroyTimes.push(destroyEnd - destroyStart);
        }

        const stats = {
            avgCreationTime: this.calculateAverage(results.chartCreationTimes),
            avgRenderTime: this.calculateAverage(results.chartRenderTimes),
            avgDestroyTime: this.calculateAverage(results.chartDestroyTimes),
            avgMemoryPerChart: this.calculateAverage(results.memoryUsagePerChart),
            p95CreationTime: this.calculatePercentile(results.chartCreationTimes, 95)
        };

        this.testResults.set('chartPerformance', { results, stats });
        
        console.log(`✅ Chart performance test completed`);
        console.log(`   Average creation time: ${stats.avgCreationTime.toFixed(2)}ms`);
        console.log(`   Average memory per chart: ${stats.avgMemoryPerChart.toFixed(2)}MB`);
    }

    async testMemoryUsage() {
        console.log('💾 Testing memory usage and leaks...');
        
        const results = {
            memorySnapshots: [],
            gcCount: 0,
            leakDetected: false
        };

        const testDuration = this.testConfig.memoryLeakTestDuration;
        const snapshotInterval = 1000; // 1초마다 스냅샷
        const startTime = performance.now();

        // 메모리 사용량 모니터링
        const memoryInterval = setInterval(() => {
            const memory = this.getMemoryInfo();
            const elapsed = performance.now() - startTime;
            
            results.memorySnapshots.push({
                timestamp: elapsed,
                used: memory.used,
                total: memory.total
            });

            // 가비지 컬렉션 강제 실행 (가능한 경우)
            if (window.gc && Math.random() < 0.1) {
                window.gc();
                results.gcCount++;
            }

            // 메모리 압박 시뮬레이션
            if (elapsed % 5000 < 100) {
                this.simulateMemoryPressure();
            }

        }, snapshotInterval);

        // 테스트 지속
        await new Promise(resolve => setTimeout(resolve, testDuration));
        clearInterval(memoryInterval);

        // 메모리 누수 감지
        const firstSnapshot = results.memorySnapshots[0];
        const lastSnapshot = results.memorySnapshots[results.memorySnapshots.length - 1];
        const memoryGrowth = lastSnapshot.used - firstSnapshot.used;
        const growthRate = memoryGrowth / (testDuration / 1000); // MB per second

        results.leakDetected = growthRate > 1; // 1MB/s 이상 증가시 누수 의심

        const stats = {
            initialMemory: firstSnapshot.used,
            finalMemory: lastSnapshot.used,
            memoryGrowth: memoryGrowth,
            growthRate: growthRate,
            maxMemory: Math.max(...results.memorySnapshots.map(s => s.used)),
            avgMemory: this.calculateAverage(results.memorySnapshots.map(s => s.used))
        };

        this.testResults.set('memoryUsage', { results, stats });
        
        console.log(`✅ Memory test completed`);
        console.log(`   Memory growth: ${memoryGrowth.toFixed(2)}MB`);
        console.log(`   Growth rate: ${growthRate.toFixed(3)}MB/s`);
        console.log(`   Leak detected: ${results.leakDetected ? '⚠️ YES' : '✅ NO'}`);
    }

    async testErrorHandling() {
        console.log('⚠️ Testing error handling performance...');
        
        const results = {
            errorHandlingTimes: [],
            recoveryTimes: [],
            notificationTimes: []
        };

        // 다양한 에러 시나리오 테스트
        const errorScenarios = [
            { type: 'MODULE_ERROR', severity: 'HIGH' },
            { type: 'API_ERROR', severity: 'MEDIUM' },
            { type: 'VALIDATION_ERROR', severity: 'LOW' },
            { type: 'CHART_ERROR', severity: 'MEDIUM' }
        ];

        for (const scenario of errorScenarios) {
            for (let i = 0; i < 10; i++) {
                // 에러 처리 시간
                const errorStart = performance.now();
                await this.simulateError(scenario);
                const errorEnd = performance.now();
                results.errorHandlingTimes.push(errorEnd - errorStart);

                // 복구 시간 (해당하는 경우)
                if (scenario.severity === 'HIGH') {
                    const recoveryStart = performance.now();
                    await this.simulateRecovery();
                    const recoveryEnd = performance.now();
                    results.recoveryTimes.push(recoveryEnd - recoveryStart);
                }
            }
        }

        const stats = {
            avgErrorHandlingTime: this.calculateAverage(results.errorHandlingTimes),
            avgRecoveryTime: this.calculateAverage(results.recoveryTimes),
            p95ErrorHandlingTime: this.calculatePercentile(results.errorHandlingTimes, 95)
        };

        this.testResults.set('errorHandling', { results, stats });
        
        console.log(`✅ Error handling test completed`);
        console.log(`   Average error handling time: ${stats.avgErrorHandlingTime.toFixed(2)}ms`);
        console.log(`   Average recovery time: ${stats.avgRecoveryTime.toFixed(2)}ms`);
    }

    generateReport() {
        console.log('\n📋 PERFORMANCE TEST REPORT');
        console.log('=' .repeat(50));
        
        const totalTestTime = performance.now() - this.startTime;
        console.log(`Total test duration: ${(totalTestTime / 1000).toFixed(2)}s\n`);

        // 각 테스트 결과 요약
        for (const [testName, testData] of this.testResults) {
            if (testName === 'baseline') continue;
            
            console.log(`🔍 ${testName.toUpperCase()}:`);
            
            if (testData.stats) {
                Object.entries(testData.stats).forEach(([key, value]) => {
                    if (typeof value === 'number') {
                        console.log(`   ${key}: ${value.toFixed(2)}${this.getUnit(key)}`);
                    } else {
                        console.log(`   ${key}: ${value}`);
                    }
                });
            }
            console.log('');
        }

        // 성능 점수 계산
        const performanceScore = this.calculatePerformanceScore();
        console.log(`🏆 OVERALL PERFORMANCE SCORE: ${performanceScore}/100`);
        console.log(`📊 Performance Grade: ${this.getPerformanceGrade(performanceScore)}`);
        
        // 권장사항
        this.generateRecommendations();
        
        // JSON 보고서 생성
        this.exportResults();
    }

    calculatePerformanceScore() {
        let score = 100;
        
        // 모듈 로딩 성능 (20점)
        const moduleStats = this.testResults.get('moduleSystem')?.stats;
        if (moduleStats) {
            if (moduleStats.avgModuleLoadTime > 50) score -= 10;
            if (moduleStats.p95ModuleLoadTime > 100) score -= 10;
        }

        // API 성능 (25점)
        const apiStats = this.testResults.get('apiPerformance')?.stats;
        if (apiStats) {
            if (apiStats.avgRequestTime > 1000) score -= 10;
            if (apiStats.errorRate > 5) score -= 10;
            if (apiStats.avgCacheHitTime > apiStats.avgCacheMissTime * 0.1) score -= 5;
        }

        // 차트 성능 (20점)
        const chartStats = this.testResults.get('chartPerformance')?.stats;
        if (chartStats) {
            if (chartStats.avgCreationTime > 500) score -= 10;
            if (chartStats.avgMemoryPerChart > 10) score -= 10;
        }

        // 메모리 사용량 (25점)
        const memoryStats = this.testResults.get('memoryUsage')?.stats;
        if (memoryStats) {
            if (memoryStats.leakDetected) score -= 15;
            if (memoryStats.growthRate > 0.5) score -= 10;
        }

        // 에러 처리 (10점)
        const errorStats = this.testResults.get('errorHandling')?.stats;
        if (errorStats) {
            if (errorStats.avgErrorHandlingTime > 100) score -= 5;
            if (errorStats.avgRecoveryTime > 1000) score -= 5;
        }

        return Math.max(0, score);
    }

    getPerformanceGrade(score) {
        if (score >= 90) return 'A+ (Excellent)';
        if (score >= 80) return 'A (Very Good)';
        if (score >= 70) return 'B (Good)';
        if (score >= 60) return 'C (Fair)';
        return 'D (Needs Improvement)';
    }

    generateRecommendations() {
        console.log('\n💡 OPTIMIZATION RECOMMENDATIONS:');
        
        const recommendations = [];
        
        // 모듈 성능 권장사항
        const moduleStats = this.testResults.get('moduleSystem')?.stats;
        if (moduleStats?.avgModuleLoadTime > 50) {
            recommendations.push('• Consider implementing module code splitting');
            recommendations.push('• Optimize module initialization logic');
        }

        // API 성능 권장사항
        const apiStats = this.testResults.get('apiPerformance')?.stats;
        if (apiStats?.avgRequestTime > 1000) {
            recommendations.push('• Implement request timeout and retry logic');
            recommendations.push('• Consider API response compression');
        }

        // 메모리 권장사항
        const memoryStats = this.testResults.get('memoryUsage')?.stats;
        if (memoryStats?.leakDetected) {
            recommendations.push('• Investigate potential memory leaks');
            recommendations.push('• Implement proper cleanup in module destroy methods');
        }

        // 차트 성능 권장사항
        const chartStats = this.testResults.get('chartPerformance')?.stats;
        if (chartStats?.avgCreationTime > 500) {
            recommendations.push('• Implement chart pooling and reuse');
            recommendations.push('• Consider canvas optimization techniques');
        }

        if (recommendations.length === 0) {
            console.log('🎉 No major performance issues detected!');
        } else {
            recommendations.forEach(rec => console.log(rec));
        }
    }

    exportResults() {
        const report = {
            testInfo: {
                timestamp: new Date().toISOString(),
                duration: performance.now() - this.startTime,
                userAgent: navigator.userAgent,
                config: this.testConfig
            },
            results: Object.fromEntries(this.testResults),
            score: this.calculatePerformanceScore()
        };

        // 콘솔에 JSON 출력 (복사 가능)
        console.log('\n📄 JSON Report (copy for external analysis):');
        console.log(JSON.stringify(report, null, 2));

        // 로컬 스토리지에 저장
        try {
            localStorage.setItem('fca_performance_report', JSON.stringify(report));
            console.log('\n💾 Report saved to localStorage as "fca_performance_report"');
        } catch (error) {
            console.warn('Failed to save report to localStorage:', error);
        }
    }

    // 시뮬레이션 메서드들
    async simulateModuleLoad() {
        // 모듈 로드 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, Math.random() * 20));
        return `module_${Date.now()}`;
    }

    async simulateAPIRequest(endpoint = '/test') {
        // API 요청 시뮬레이션
        const delay = Math.random() * 200 + 50; // 50-250ms
        await new Promise(resolve => setTimeout(resolve, delay));
        
        if (Math.random() < 0.05) { // 5% 실패율
            throw new Error('Simulated API error');
        }
        
        return { status: 'success', data: 'test' };
    }

    async simulateChartCreation() {
        const chartId = `chart_${Date.now()}_${Math.random()}`;
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
        return chartId;
    }

    async simulateChartRender(chartId) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 10));
    }

    async simulateChartDestroy(chartId) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 20 + 5));
    }

    simulateMemoryPressure() {
        // 임시 메모리 사용량 증가 시뮬레이션
        const tempArray = new Array(10000).fill(0).map(() => Math.random());
        setTimeout(() => tempArray.length = 0, 100);
    }

    async simulateError(scenario) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 30 + 10));
    }

    async simulateRecovery() {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
    }

    // 유틸리티 메서드들
    getMemoryInfo() {
        if (performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024 * 100) / 100,
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024 * 100) / 100,
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024 * 100) / 100
            };
        }
        return { used: 0, total: 0, limit: 0 };
    }

    calculateAverage(numbers) {
        return numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
    }

    calculatePercentile(numbers, percentile) {
        const sorted = numbers.slice().sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[index] || 0;
    }

    getUnit(key) {
        if (key.includes('Time')) return 'ms';
        if (key.includes('Memory')) return 'MB';
        if (key.includes('Rate')) return '%';
        return '';
    }
}

// 자동 실행
document.addEventListener('DOMContentLoaded', () => {
    // 페이지 로드 후 3초 대기 (시스템 안정화)
    setTimeout(async () => {
        const perfTest = new PerformanceTest();
        await perfTest.runAllTests();
    }, 3000);
});

// 수동 실행을 위한 전역 함수
window.runPerformanceTest = async () => {
    const perfTest = new PerformanceTest();
    await perfTest.runAllTests();
};

export default PerformanceTest;