/**
 * Chart Demo & Integration Example
 * ================================
 * 
 * New modular chart system usage examples
 * - Legacy code migration guide
 * - Practical usage examples
 * - Performance testing
 */

// Wait for module loading
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Chart Demo starting...');
    
    try {
        // Initialize new chart system
        await EasyChart.init({
            defaultTheme: 'light',
            enableCaching: true
        });
        
        console.log('✅ Chart system initialized');
        
        // Render demo charts
        await renderDemoCharts();
        
        // Test legacy compatibility
        await testLegacyCompatibility();
        
        // Performance test
        await runPerformanceTest();
        
    } catch (error) {
        console.error('❌ Demo initialization failed:', error);
        showDemoError(error);
    }
});

/**
 * Render demo charts
 */
async function renderDemoCharts() {
    console.log('📊 Rendering demo charts...');
    
    // 1. Pie chart example
    await renderFraudDistributionDemo();
    
    // 2. Bar chart example
    await renderModelComparisonDemo();
    
    // 3. Line chart example
    await renderPerformanceTrendDemo();
    
    // 4. Scatter chart example
    await renderFeatureCorrelationDemo();
    
    // 5. Histogram example
    await renderDataDistributionDemo();
    
    // 6. Heatmap example
    await renderConfusionMatrixDemo();
    
    // 7. XAI charts
    await renderLIMEDemo();
    await renderDecisionProcessDemo();
    await renderConfidenceDistributionDemo();
    await renderFeatureInteractionDemo();
}

/**
 * Fraud distribution chart (pie chart)
 */
async function renderFraudDistributionDemo() {
    const data = {
        title: 'Fraud Transaction Distribution',
        labels: ['Normal Transaction', 'Fraud Transaction', 'Suspicious Transaction'],
        values: [850, 120, 30]
    };
    
    try {
        await EasyChart.pie('fraud-distribution-demo', data, {
            showValues: true,
            showPercent: true
        });
        console.log('✅ Fraud distribution chart rendered');
    } catch (error) {
        console.error('❌ Fraud distribution chart failed:', error);
    }
}

/**
 * Model performance comparison (bar chart)
 */
async function renderModelComparisonDemo() {
    const data = {
        title: 'Model Performance Comparison',
        x: ['Random Forest', 'XGBoost', 'SVM', 'Neural Network', 'Logistic Regression'],
        y: [0.94, 0.96, 0.89, 0.92, 0.87],
        xTitle: 'Model',
        yTitle: 'Accuracy'
    };
    
    try {
        await EasyChart.bar('model-comparison-demo', data, {
            orientation: 'vertical'
        });
        console.log('✅ Model comparison chart rendered');
    } catch (error) {
        console.error('❌ Model comparison chart failed:', error);
    }
}

/**
 * Performance trend (line chart)
 */
async function renderPerformanceTrendDemo() {
    const data = {
        title: 'Daily Model Performance Trend',
        x: ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06'],
        y: [0.91, 0.93, 0.94, 0.96, 0.95, 0.97],
        xTitle: 'Date',
        yTitle: 'Accuracy'
    };
    
    try {
        await EasyChart.line('performance-trend-demo', data, {
            showMarkers: true,
            lineWidth: 3
        });
        console.log('✅ Performance trend chart rendered');
    } catch (error) {
        console.error('❌ Performance trend chart failed:', error);
    }
}

/**
 * Feature correlation (scatter chart)
 */
async function renderFeatureCorrelationDemo() {
    // Generate random data
    const n = 100;
    const x = Array.from({length: n}, () => Math.random() * 100);
    const y = x.map(val => val * 0.8 + Math.random() * 20);
    
    const data = {
        title: 'Feature Correlation',
        x: x,
        y: y,
        xTitle: 'Feature A',
        yTitle: 'Feature B'
    };
    
    try {
        await EasyChart.scatter('feature-correlation-demo', data, {
            showTrendline: true,
            markerSize: 6
        });
        console.log('✅ Feature correlation chart rendered');
    } catch (error) {
        console.error('❌ Feature correlation chart failed:', error);
    }
}

/**
 * Data distribution (histogram)
 */
async function renderDataDistributionDemo() {
    // 정규분포 데이터 생성
    const values = Array.from({length: 1000}, () => {
        return Math.random() + Math.random() + Math.random() + Math.random() - 2; // 근사 정규분포
    });
    
    const data = {
        title: '거래 금액 분포',
        values: values.map(v => v * 1000 + 5000), // 스케일링
        xTitle: '거래 금액 (원)',
        yTitle: '빈도'
    };
    
    try {
        await EasyChart.histogram('data-distribution-demo', data, {
            bins: 30,
            opacity: 0.7
        });
        console.log('✅ Data distribution chart rendered');
    } catch (error) {
        console.error('❌ Data distribution chart failed:', error);
    }
}

/**
 * 혼동 행렬 (히트맵)
 */
async function renderConfusionMatrixDemo() {
    const data = {
        title: 'Confusion Matrix',
        z: [
            [850, 23, 5],
            [12, 95, 8], 
            [3, 7, 22]
        ],
        x: ['Normal', 'Fraud', 'Suspicious'],
        y: ['Normal', 'Fraud', 'Suspicious'],
        xTitle: 'Predicted',
        yTitle: 'Actual'
    };
    
    try {
        await EasyChart.heatmap('confusion-matrix-demo', data, {
            colorscale: 'Blues'
        });
        console.log('✅ Confusion matrix chart rendered');
    } catch (error) {
        console.error('❌ Confusion matrix chart failed:', error);
    }
}

/**
 * LIME 로컬 설명 차트 데모
 */
async function renderLIMEDemo() {
    const data = {
        title: 'LIME Local Explanation',
        features: [
            { name: "거래금액", impact: 0.42, direction: "increases_fraud" },
            { name: "시간대", impact: 0.38, direction: "increases_fraud" },
            { name: "거래횟수", impact: -0.31, direction: "decreases_fraud" },
            { name: "지역코드", impact: 0.28, direction: "increases_fraud" },
            { name: "카드타입", impact: -0.25, direction: "decreases_fraud" }
        ]
    };
    
    try {
        await EasyChart.lime('lime-explanation-demo', data);
        console.log('✅ LIME explanation chart rendered');
    } catch (error) {
        console.error('❌ LIME explanation chart failed:', error);
    }
}

/**
 * 모델 의사결정 과정 차트 데모
 */
async function renderDecisionProcessDemo() {
    const data = {
        title: '모델 의사결정 과정',
        steps: [
            { feature: "거래금액", threshold: 500, gini: 0.45, samples: 1000 },
            { feature: "시간대", threshold: 22, gini: 0.32, samples: 234 },
            { feature: "거래횟수", threshold: 5, gini: 0.18, samples: 89 },
            { feature: "지역코드", threshold: null, gini: 0.08, samples: 23 }
        ],
        yTitle: 'Gini 불순도'
    };
    
    try {
        await EasyChart.decision('model-decision-demo', data);
        console.log('✅ Model decision process chart rendered');
    } catch (error) {
        console.error('❌ Model decision process chart failed:', error);
    }
}

/**
 * 예측 신뢰도 분포 차트 데모
 */
async function renderConfidenceDistributionDemo() {
    const data = {
        title: '예측 신뢰도 분포',
        bins: ["0-10%", "10-20%", "20-30%", "30-40%", "40-50%", "50-60%", "60-70%", "70-80%", "80-90%", "90-100%"],
        counts: [45, 123, 234, 456, 678, 543, 432, 321, 234, 156],
        colors: ["#ffe6e6", "#ffcccc", "#ffb3b3", "#ff9999", "#ff8080", "#ff6666", "#ff4d4d", "#ff3333", "#ff1a1a", "#ff0000"]
    };
    
    try {
        await EasyChart.confidence('prediction-confidence-demo', data);
        console.log('✅ Prediction confidence chart rendered');
    } catch (error) {
        console.error('❌ Prediction confidence chart failed:', error);
    }
}

/**
 * 특성 상호작용 히트맵 데모
 */
async function renderFeatureInteractionDemo() {
    const features = ["거래금액", "시간대", "거래횟수", "지역코드", "카드타입"];
    const data = {
        title: '특성 상호작용 매트릭스',
        z: [
            [1.00, 0.73, 0.45, 0.67, -0.23],
            [0.73, 1.00, 0.56, 0.48, -0.19],
            [0.45, 0.56, 1.00, 0.39, -0.15],
            [0.67, 0.48, 0.39, 1.00, -0.21],
            [-0.23, -0.19, -0.15, -0.21, 1.00]
        ],
        x: features,
        y: features,
        xTitle: '특성',
        yTitle: '특성'
    };
    
    try {
        await EasyChart.heatmap('feature-interaction-demo', data, {
            colorscale: 'RdBu'
        });
        console.log('✅ Feature interaction heatmap rendered');
    } catch (error) {
        console.error('❌ Feature interaction heatmap failed:', error);
    }
}

/**
 * 기존 코드 호환성 테스트
 */
async function testLegacyCompatibility() {
    console.log('🔄 Testing legacy compatibility...');
    
    // 기존 방식 시뮬레이션
    const legacyData = {
        fraud_distribution: {
            labels: ['Normal', 'Fraud'],
            data: [920, 80]
        }
    };
    
    try {
        // 새로운 방식으로 기존 데이터 처리
        await EasyChart.pie('legacy-compatibility-test', {
            title: '기존 코드 호환성 테스트',
            labels: legacyData.fraud_distribution.labels,
            values: legacyData.fraud_distribution.data
        });
        
        console.log('✅ Legacy compatibility test passed');
        
    } catch (error) {
        console.error('❌ Legacy compatibility test failed:', error);
    }
}

/**
 * 성능 테스트
 */
async function runPerformanceTest() {
    console.log('⚡ Running performance test...');
    
    const startTime = performance.now();
    
    try {
        // 여러 차트 동시 렌더링
        const promises = [];
        
        for (let i = 0; i < 5; i++) {
            const containerId = `perf-test-${i}`;
            
            // 컨테이너가 존재하는지 확인
            if (document.getElementById(containerId)) {
                promises.push(
                    EasyChart.bar(containerId, {
                        title: `성능 테스트 ${i + 1}`,
                        x: ['A', 'B', 'C', 'D'],
                        y: [Math.random() * 100, Math.random() * 100, Math.random() * 100, Math.random() * 100]
                    })
                );
            }
        }
        
        await Promise.all(promises);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        console.log(`✅ Performance test completed in ${duration.toFixed(2)}ms`);
        
        // 성능 결과 표시
        showPerformanceResult(duration, promises.length);
        
    } catch (error) {
        console.error('❌ Performance test failed:', error);
    }
}

/**
 * 성능 결과 표시
 */
function showPerformanceResult(duration, chartCount) {
    const resultElement = document.getElementById('performance-result');
    if (resultElement) {
        resultElement.innerHTML = `
            <div class="alert alert-success">
                <h6><i class="fas fa-stopwatch me-2"></i>성능 테스트 결과</h6>
                <p class="mb-1">렌더링 시간: <strong>${duration.toFixed(2)}ms</strong></p>
                <p class="mb-1">차트 수: <strong>${chartCount}개</strong></p>
                <p class="mb-0">평균 렌더링 시간: <strong>${(duration / chartCount).toFixed(2)}ms/차트</strong></p>
            </div>
        `;
    }
}

/**
 * 데모 에러 표시
 */
function showDemoError(error) {
    const errorElement = document.getElementById('demo-error');
    if (errorElement) {
        errorElement.innerHTML = `
            <div class="alert alert-danger">
                <h6><i class="fas fa-exclamation-triangle me-2"></i>데모 오류</h6>
                <p class="mb-0">${error.message}</p>
            </div>
        `;
    }
}

/**
 * 마이그레이션 가이드 예시
 */
const migrationExamples = {
    // 기존 방식
    legacy: `
// 기존 방식 (복잡하고 의존성 많음)
const chartManager = new ChartManager();
await chartManager.init();
const pieCharts = new PieCharts(chartManager.renderer);
pieCharts.renderFraudDistribution(data);
    `,
    
    // 새로운 방식
    modern: `
// 새로운 방식 (간단하고 직관적)
await EasyChart.pie('chart-container', {
    title: '사기 분포',
    labels: ['정상', '사기'],
    values: [920, 80]
});
    `
};

/**
 * 사용법 가이드 표시
 */
function showUsageGuide() {
    const guideElement = document.getElementById('usage-guide');
    if (guideElement) {
        guideElement.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6>기존 방식</h6>
                    <pre><code>${migrationExamples.legacy}</code></pre>
                </div>
                <div class="col-md-6">
                    <h6>새로운 방식</h6>
                    <pre><code>${migrationExamples.modern}</code></pre>
                </div>
            </div>
        `;
    }
}

// 페이지 로드 시 사용법 가이드 표시
document.addEventListener('DOMContentLoaded', () => {
    showUsageGuide();
});

// 전역 함수로 노출 (테스트용)
window.chartDemo = {
    renderDemoCharts,
    testLegacyCompatibility,
    runPerformanceTest,
    migrationExamples
};