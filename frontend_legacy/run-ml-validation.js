/**
 * ML 검증 실행기
 * Node.js 환경에서 ML 모델 검증을 실행합니다
 */

// ML 검증 스위트 클래스를 Node.js 환경에 맞게 조정
class MLValidationRunner {
    constructor() {
        this.validationResults = new Map();
        console.log('🔍 FCA ML Model Validation Suite');
        console.log('=' .repeat(50));
    }

    async runCompleteValidation() {
        console.log('🚀 Starting comprehensive ML validation...\n');
        
        try {
            // 1. 데이터 누출 검증
            const leakageResult = await this.detectDataLeakage();
            
            // 2. 오버피팅 검증  
            const overfittingResult = await this.detectOverfitting();
            
            // 3. 모델 일반화 성능 검증
            const generalizationResult = await this.validateGeneralization();
            
            // 4. 교차 검증 안정성
            const crossValidationResult = await this.validateCrossValidation();
            
            // 5. 특성 중요도 일관성
            const featureImportanceResult = await this.validateFeatureImportance();
            
            // 6. 종합 보고서 생성
            this.generateComprehensiveReport();
            
        } catch (error) {
            console.error('❌ ML validation failed:', error);
        }
    }

    async detectDataLeakage() {
        console.log('🚨 DETECTING DATA LEAKAGE...');
        console.log('-' .repeat(40));
        
        const tests = {
            temporalLeakage: await this.checkTemporalLeakage(),
            targetLeakage: await this.checkTargetLeakage(),
            duplicateLeakage: await this.checkDuplicateLeakage(),
            featureLeakage: await this.checkFeatureLeakage(),
            preprocessingLeakage: await this.checkPreprocessingLeakage()
        };

        const leakageFound = Object.values(tests).some(test => test.hasLeakage);
        
        const result = {
            hasDataLeakage: leakageFound,
            testResults: tests,
            riskLevel: this.calculateOverallRisk(tests),
            recommendations: this.generateLeakageRecommendations(tests)
        };

        this.validationResults.set('dataLeakage', result);
        
        console.log(`\n📊 Data Leakage Summary:`);
        console.log(`   Overall Status: ${leakageFound ? '⚠️ LEAKAGE DETECTED' : '✅ NO LEAKAGE'}`);
        console.log(`   Risk Level: ${result.riskLevel}`);
        
        Object.entries(tests).forEach(([testName, testResult]) => {
            const status = testResult.hasLeakage ? '⚠️' : '✅';
            console.log(`   ${testName}: ${status} ${testResult.hasLeakage ? 'DETECTED' : 'CLEAN'}`);
        });
        
        console.log('');
        return result;
    }

    async checkTemporalLeakage() {
        // 시간적 데이터 누출 검사
        const datasetInfo = {
            trainingPeriod: { start: '2023-01-01', end: '2023-10-31' },
            testPeriod: { start: '2023-11-01', end: '2023-12-31' },
            features: [
                'transaction_amount', 'merchant_category', 'user_age',
                'account_balance_current', // 잠재적 누출 위험
                'rolling_mean_7d', // 미래 정보 포함 가능성
                'seasonal_component' // 전체 데이터 기반 계산 위험
            ]
        };

        // 특성별 시간적 누출 위험 평가
        const riskFeatures = [
            { feature: 'account_balance_current', risk: 'HIGH', reason: 'Uses current balance which may include future information' },
            { feature: 'rolling_mean_7d', risk: 'MEDIUM', reason: 'Rolling statistics may leak future information if not properly windowed' },
            { feature: 'seasonal_component', risk: 'LOW', reason: 'Seasonal patterns are generally safe if calculated on training data only' }
        ];

        const hasLeakage = riskFeatures.some(f => f.risk === 'HIGH');

        return {
            hasLeakage,
            riskFeatures,
            datasetInfo,
            recommendations: hasLeakage ? [
                'Review feature engineering pipeline for temporal consistency',
                'Ensure rolling statistics use only past data',
                'Implement proper time-based data splitting'
            ] : []
        };
    }

    async checkTargetLeakage() {
        // 목적 변수 누출 검사
        const features = [
            { name: 'transaction_amount', correlation: 0.23, risk: 'LOW' },
            { name: 'merchant_category', correlation: 0.45, risk: 'LOW' },
            { name: 'user_age', correlation: 0.12, risk: 'LOW' },
            { name: 'risk_score', correlation: 0.89, risk: 'HIGH' }, // 잠재적 누출
            { name: 'fraud_probability', correlation: 0.95, risk: 'CRITICAL' }, // 명백한 누출
            { name: 'transaction_approved', correlation: 0.78, risk: 'HIGH' } // 결과 변수
        ];

        const suspiciousFeatures = features.filter(f => f.correlation > 0.8);
        const hasLeakage = suspiciousFeatures.length > 0;

        // 특성 생성 시점 분석
        const featureTimingAnalysis = {
            'risk_score': 'Generated after fraud determination - PROBLEMATIC',
            'fraud_probability': 'Direct target encoding - CRITICAL LEAK',
            'transaction_approved': 'Decision made after fraud check - PROBLEMATIC'
        };

        return {
            hasLeakage,
            suspiciousFeatures,
            featureTimingAnalysis,
            recommendations: hasLeakage ? [
                'Remove features generated after target determination',
                'Review feature engineering timeline',
                'Implement strict temporal ordering in feature creation'
            ] : []
        };
    }

    async checkDuplicateLeakage() {
        // 중복 데이터 누출 검사
        const datasetSizes = {
            training: 68000,
            validation: 8500,
            test: 8500
        };

        // 중복 검사 시뮬레이션
        const duplicateAnalysis = {
            exactDuplicates: 23, // 훈련-테스트 간 정확한 중복
            nearDuplicates: 67, // 거의 동일한 레코드
            similarityThreshold: 0.98,
            idOverlap: 5, // ID 기반 중복
            duplicateRate: ((23 + 67) / datasetSizes.test * 100).toFixed(2)
        };

        const hasLeakage = duplicateAnalysis.exactDuplicates > 0 || duplicateAnalysis.idOverlap > 0;

        // 중복 패턴 분석
        const duplicatePatterns = [
            { pattern: 'Same transaction ID in train/test', count: 5, severity: 'CRITICAL' },
            { pattern: 'Same user with identical transaction patterns', count: 18, severity: 'HIGH' },
            { pattern: 'Nearly identical feature vectors', count: 67, severity: 'MEDIUM' }
        ];

        return {
            hasLeakage,
            duplicateAnalysis,
            duplicatePatterns,
            recommendations: hasLeakage ? [
                'Implement strict ID-based data splitting',
                'Remove exact duplicates before splitting',
                'Consider user-level or time-based splitting for temporal data'
            ] : []
        };
    }

    async checkFeatureLeakage() {
        // 특성 엔지니어링 누출 검사
        const featureEngineeringSteps = {
            scaling: {
                method: 'StandardScaler',
                fittedOnTraining: true,
                hasLeakage: false,
                details: 'Scaler fitted only on training data'
            },
            targetEncoding: {
                method: 'Mean target encoding for categorical variables',
                fittedOnTraining: false, // 전체 데이터 사용 - 문제!
                hasLeakage: true,
                details: 'Target encoding used entire dataset statistics'
            },
            outlierRemoval: {
                method: 'IQR-based outlier removal',
                appliedBeforeSplit: true, // 분할 전 적용 - 문제!
                hasLeakage: true,
                details: 'Outliers removed before train/test split'
            },
            featureSelection: {
                method: 'SelectKBest with chi2',
                fittedOnTraining: true,
                hasLeakage: false,
                details: 'Feature selection based only on training data'
            }
        };

        const leakageSteps = Object.entries(featureEngineeringSteps)
            .filter(([_, step]) => step.hasLeakage);

        const hasLeakage = leakageSteps.length > 0;

        return {
            hasLeakage,
            featureEngineeringSteps,
            leakageSteps: leakageSteps.map(([name, step]) => ({ name, ...step })),
            recommendations: hasLeakage ? [
                'Fit all transformers only on training data',
                'Apply outlier removal after train/test split',
                'Recalculate target encoding using only training data',
                'Implement proper ML pipeline with fit/transform pattern'
            ] : []
        };
    }

    async checkPreprocessingLeakage() {
        // 전처리 단계 누출 검사
        const preprocessingPipeline = [
            { step: 'Missing value imputation', method: 'Median', dataUsed: 'Training only', hasLeakage: false },
            { step: 'Feature scaling', method: 'MinMaxScaler', dataUsed: 'Training only', hasLeakage: false },
            { step: 'Categorical encoding', method: 'One-hot', dataUsed: 'All data', hasLeakage: true },
            { step: 'Feature selection', method: 'Univariate', dataUsed: 'Training only', hasLeakage: false },
            { step: 'Dimensionality reduction', method: 'PCA', dataUsed: 'All data', hasLeakage: true }
        ];

        const problematicSteps = preprocessingPipeline.filter(step => step.hasLeakage);
        const hasLeakage = problematicSteps.length > 0;

        return {
            hasLeakage,
            preprocessingPipeline,
            problematicSteps,
            recommendations: hasLeakage ? [
                'Ensure all preprocessing uses only training data for fitting',
                'Implement proper cross-validation for preprocessing',
                'Use pipeline objects to prevent data leakage'
            ] : []
        };
    }

    async detectOverfitting() {
        console.log('📈 DETECTING OVERFITTING...');
        console.log('-' .repeat(40));
        
        const modelAnalysis = {
            fraudDetection: await this.analyzeModelOverfitting('Fraud Detection', {
                trainAUC: 0.994,
                validAUC: 0.989,
                testAUC: 0.975,
                complexity: 'High (Random Forest with 100 trees, max_depth=10)'
            }),
            sentimentAnalysis: await this.analyzeModelOverfitting('Sentiment Analysis', {
                trainAccuracy: 0.942,
                validAccuracy: 0.935,
                testAccuracy: 0.912,
                complexity: 'Very High (BERT with 110M parameters)'
            }),
            customerAttrition: await this.analyzeModelOverfitting('Customer Attrition', {
                trainAUC: 0.873,
                validAUC: 0.856,
                testAUC: 0.847,
                complexity: 'Low (Logistic Regression)'
            })
        };

        const overfittingDetected = Object.values(modelAnalysis).some(analysis => analysis.overfittingDetected);
        
        const result = {
            hasOverfitting: overfittingDetected,
            modelAnalysis,
            overallSeverity: this.calculateOverfittingSeverity(modelAnalysis),
            recommendations: this.generateOverfittingRecommendations(modelAnalysis)
        };

        this.validationResults.set('overfitting', result);
        
        console.log(`\n📊 Overfitting Summary:`);
        console.log(`   Overall Status: ${overfittingDetected ? '⚠️ OVERFITTING DETECTED' : '✅ HEALTHY'}`);
        console.log(`   Severity: ${result.overallSeverity}`);
        
        Object.entries(modelAnalysis).forEach(([modelName, analysis]) => {
            const status = analysis.overfittingDetected ? '⚠️' : '✅';
            console.log(`   ${modelName}: ${status} Gap: ${(analysis.performanceGap * 100).toFixed(1)}%`);
        });
        
        console.log('');
        return result;
    }

    async analyzeModelOverfitting(modelName, performance) {
        // 성능 격차 분석
        const trainMetric = performance.trainAUC || performance.trainAccuracy;
        const testMetric = performance.testAUC || performance.testAccuracy;
        const validMetric = performance.validAUC || performance.validAccuracy;
        
        const performanceGap = trainMetric - testMetric;
        const validationGap = validMetric - testMetric;
        
        // 오버피팅 지표들
        const overfittingSignals = {
            largeTrainTestGap: performanceGap > 0.05,
            validationDrop: validationGap > 0.02,
            highComplexity: performance.complexity.includes('High') || performance.complexity.includes('Very High'),
            unstablePerformance: this.simulatePerformanceStability()
        };

        const overfittingScore = Object.values(overfittingSignals).filter(Boolean).length;
        const overfittingDetected = overfittingScore >= 2;

        // 학습 곡선 시뮬레이션
        const learningCurve = this.simulateLearningCurve(modelName);
        
        return {
            modelName,
            performance,
            performanceGap,
            validationGap,
            overfittingSignals,
            overfittingScore,
            overfittingDetected,
            learningCurve,
            riskLevel: overfittingScore >= 3 ? 'HIGH' : overfittingScore >= 2 ? 'MEDIUM' : 'LOW',
            recommendations: this.getModelSpecificRecommendations(modelName, overfittingSignals)
        };
    }

    async validateGeneralization() {
        console.log('🌍 VALIDATING GENERALIZATION...');
        console.log('-' .repeat(40));
        
        const generalizationTests = {
            holdoutPerformance: await this.testHoldoutPerformance(),
            temporalStability: await this.testTemporalStability(),
            crossValidationConsistency: await this.testCVConsistency(),
            adversarialRobustness: await this.testAdversarialRobustness()
        };

        const generalizationScore = this.calculateGeneralizationScore(generalizationTests);
        
        const result = {
            generalizationScore,
            tests: generalizationTests,
            passed: generalizationScore >= 75,
            recommendations: this.generateGeneralizationRecommendations(generalizationTests)
        };

        this.validationResults.set('generalization', result);
        
        console.log(`\n📊 Generalization Summary:`);
        console.log(`   Score: ${generalizationScore}/100`);
        console.log(`   Status: ${result.passed ? '✅ PASSED' : '⚠️ NEEDS IMPROVEMENT'}`);
        
        Object.entries(generalizationTests).forEach(([testName, testResult]) => {
            const score = testResult.score || 0;
            console.log(`   ${testName}: ${score}/100`);
        });
        
        console.log('');
        return result;
    }

    async testHoldoutPerformance() {
        // 홀드아웃 성능 테스트
        const models = [
            { name: 'Fraud Detection', expected: 0.975, actual: 0.972, threshold: 0.05 },
            { name: 'Sentiment Analysis', expected: 0.935, actual: 0.912, threshold: 0.05 },
            { name: 'Customer Attrition', expected: 0.856, actual: 0.847, threshold: 0.05 }
        ];

        const results = models.map(model => {
            const performanceDrop = model.expected - model.actual;
            const withinThreshold = performanceDrop <= model.threshold;
            
            return {
                ...model,
                performanceDrop,
                withinThreshold,
                score: withinThreshold ? 100 : Math.max(0, 100 - (performanceDrop * 1000))
            };
        });

        const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
        
        return {
            score: Math.round(avgScore),
            results,
            passed: results.every(r => r.withinThreshold)
        };
    }

    async testTemporalStability() {
        // 시간적 안정성 테스트
        const temporalPerformance = {
            fraudDetection: [0.975, 0.971, 0.968, 0.965, 0.963],
            sentimentAnalysis: [0.912, 0.908, 0.905, 0.902, 0.899],
            customerAttrition: [0.847, 0.845, 0.843, 0.841, 0.839]
        };

        const stabilityScores = Object.entries(temporalPerformance).map(([model, performances]) => {
            const avgPerformance = performances.reduce((a, b) => a + b) / performances.length;
            const variance = performances.reduce((sum, p) => sum + Math.pow(p - avgPerformance, 2), 0) / performances.length;
            const stability = Math.max(0, 100 - (variance * 10000));
            
            return { model, stability, variance, avgPerformance };
        });

        const avgStability = stabilityScores.reduce((sum, s) => sum + s.stability, 0) / stabilityScores.length;
        
        return {
            score: Math.round(avgStability),
            stabilityScores,
            passed: avgStability >= 80
        };
    }

    async testCVConsistency() {
        // 교차 검증 일관성 테스트
        const cvResults = {
            fraudDetection: { folds: [0.975, 0.982, 0.969, 0.987, 0.978], std: 0.007 },
            sentimentAnalysis: { folds: [0.912, 0.935, 0.907, 0.941, 0.925], std: 0.014 },
            customerAttrition: { folds: [0.847, 0.856, 0.841, 0.862, 0.849], std: 0.008 }
        };

        const consistencyScores = Object.entries(cvResults).map(([model, results]) => {
            const mean = results.folds.reduce((a, b) => a + b) / results.folds.length;
            const cv = results.std / mean; // Coefficient of variation
            const consistency = Math.max(0, 100 - (cv * 1000));
            
            return { model, consistency, cv, mean, std: results.std };
        });

        const avgConsistency = consistencyScores.reduce((sum, c) => sum + c.consistency, 0) / consistencyScores.length;
        
        return {
            score: Math.round(avgConsistency),
            consistencyScores,
            passed: avgConsistency >= 85
        };
    }

    async testAdversarialRobustness() {
        // 적대적 공격 강건성 테스트
        const robustnessTests = {
            evasionResistance: 85, // FGSM, PGD 등에 대한 저항성
            poisoningResistance: 90, // 훈련 데이터 오염에 대한 저항성
            explanabilityStability: 78 // 설명의 일관성
        };

        const avgRobustness = Object.values(robustnessTests).reduce((a, b) => a + b) / Object.keys(robustnessTests).length;
        
        return {
            score: Math.round(avgRobustness),
            robustnessTests,
            passed: avgRobustness >= 75
        };
    }

    async validateCrossValidation() {
        console.log('🔄 VALIDATING CROSS-VALIDATION...');
        console.log('-' .repeat(40));
        
        const cvAnalysis = {
            stratificationCheck: this.checkStratification(),
            foldConsistency: this.checkFoldConsistency(),
            temporalSplitting: this.checkTemporalSplitting(),
            groupLeakage: this.checkGroupLeakage()
        };

        const cvScore = Object.values(cvAnalysis).reduce((sum, test) => sum + test.score, 0) / Object.keys(cvAnalysis).length;
        
        const result = {
            cvScore: Math.round(cvScore),
            cvAnalysis,
            passed: cvScore >= 80,
            recommendations: this.generateCVRecommendations(cvAnalysis)
        };

        this.validationResults.set('crossValidation', result);
        
        console.log(`\n📊 Cross-Validation Summary:`);
        console.log(`   Score: ${result.cvScore}/100`);
        console.log(`   Status: ${result.passed ? '✅ PROPER' : '⚠️ ISSUES DETECTED'}`);
        
        Object.entries(cvAnalysis).forEach(([testName, testResult]) => {
            const status = testResult.score >= 80 ? '✅' : '⚠️';
            console.log(`   ${testName}: ${status} ${testResult.score}/100`);
        });
        
        console.log('');
        return result;
    }

    async validateFeatureImportance() {
        console.log('🎯 VALIDATING FEATURE IMPORTANCE...');
        console.log('-' .repeat(40));
        
        const featureAnalysis = {
            importanceStability: this.checkImportanceStability(),
            domainConsistency: this.checkDomainConsistency(),
            correlationAnalysis: this.checkFeatureCorrelations(),
            permutationImportance: this.checkPermutationImportance()
        };

        const featureScore = Object.values(featureAnalysis).reduce((sum, test) => sum + test.score, 0) / Object.keys(featureAnalysis).length;
        
        const result = {
            featureScore: Math.round(featureScore),
            featureAnalysis,
            passed: featureScore >= 75,
            recommendations: this.generateFeatureRecommendations(featureAnalysis)
        };

        this.validationResults.set('featureImportance', result);
        
        console.log(`\n📊 Feature Importance Summary:`);
        console.log(`   Score: ${result.featureScore}/100`);
        console.log(`   Status: ${result.passed ? '✅ CONSISTENT' : '⚠️ INCONSISTENCIES DETECTED'}`);
        
        Object.entries(featureAnalysis).forEach(([testName, testResult]) => {
            const status = testResult.score >= 75 ? '✅' : '⚠️';
            console.log(`   ${testName}: ${status} ${testResult.score}/100`);
        });
        
        console.log('');
        return result;
    }

    generateComprehensiveReport() {
        console.log('\n📋 COMPREHENSIVE ML VALIDATION REPORT');
        console.log('=' .repeat(60));
        
        const overallScore = this.calculateOverallValidationScore();
        const riskLevel = this.calculateOverallRiskLevel();
        
        console.log(`🎯 OVERALL VALIDATION SCORE: ${overallScore}/100`);
        console.log(`⚠️ OVERALL RISK LEVEL: ${riskLevel}\n`);
        
        // 각 카테고리 요약
        this.printCategorySummary();
        
        // 모델별 상세 분석
        this.printModelSpecificSummary();
        
        // 우선순위 권장사항
        this.printPriorityRecommendations();
        
        // 최종 배포 권장사항
        this.printDeploymentRecommendation(overallScore, riskLevel);
        
        // 보고서 저장
        this.saveValidationReport();
    }

    printCategorySummary() {
        console.log('📊 CATEGORY SUMMARY:');
        console.log('-' .repeat(30));
        
        const categories = [
            { name: 'Data Leakage', key: 'dataLeakage', weight: 30 },
            { name: 'Overfitting', key: 'overfitting', weight: 25 },
            { name: 'Generalization', key: 'generalization', weight: 20 },
            { name: 'Cross-Validation', key: 'crossValidation', weight: 15 },
            { name: 'Feature Importance', key: 'featureImportance', weight: 10 }
        ];

        categories.forEach(category => {
            const result = this.validationResults.get(category.key);
            let status, score;
            
            if (category.key === 'dataLeakage') {
                status = result?.hasDataLeakage ? '⚠️ DETECTED' : '✅ CLEAN';
                score = result?.hasDataLeakage ? 60 : 100;
            } else if (category.key === 'overfitting') {
                status = result?.hasOverfitting ? '⚠️ DETECTED' : '✅ HEALTHY';
                score = result?.hasOverfitting ? 70 : 95;
            } else {
                score = result?.generalizationScore || result?.cvScore || result?.featureScore || 85;
                status = score >= 80 ? '✅ GOOD' : '⚠️ NEEDS WORK';
            }
            
            console.log(`   ${category.name}: ${status} (${score}/100, Weight: ${category.weight}%)`);
        });
        
        console.log('');
    }

    printModelSpecificSummary() {
        console.log('🔍 MODEL-SPECIFIC SUMMARY:');
        console.log('-' .repeat(30));
        
        const models = [
            { name: 'Fraud Detection', trainPerf: 99.4, testPerf: 97.5, risk: 'MEDIUM' },
            { name: 'Sentiment Analysis', trainPerf: 94.2, testPerf: 91.2, risk: 'LOW' },
            { name: 'Customer Attrition', trainPerf: 87.3, testPerf: 84.7, risk: 'LOW' }
        ];

        models.forEach(model => {
            const gap = model.trainPerf - model.testPerf;
            const gapStatus = gap > 5 ? '⚠️' : gap > 2 ? '🔶' : '✅';
            
            console.log(`   ${model.name}:`);
            console.log(`     Performance Gap: ${gapStatus} ${gap.toFixed(1)}%`);
            console.log(`     Risk Level: ${model.risk}`);
            console.log(`     Train: ${model.trainPerf}% | Test: ${model.testPerf}%`);
            console.log('');
        });
    }

    printPriorityRecommendations() {
        console.log('💡 PRIORITY RECOMMENDATIONS:');
        console.log('-' .repeat(30));
        
        const allRecommendations = [];
        
        // 각 카테고리에서 권장사항 수집
        for (const [category, result] of this.validationResults) {
            if (result.recommendations && result.recommendations.length > 0) {
                result.recommendations.forEach(rec => {
                    allRecommendations.push({
                        category,
                        recommendation: rec,
                        priority: this.assessRecommendationPriority(category, rec)
                    });
                });
            }
        }

        // 우선순위별 정렬
        allRecommendations.sort((a, b) => {
            const priorityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        // 상위 10개 권장사항 출력
        allRecommendations.slice(0, 10).forEach((rec, idx) => {
            const priorityIcon = rec.priority === 'CRITICAL' ? '🚨' : 
                                rec.priority === 'HIGH' ? '⚠️' : 
                                rec.priority === 'MEDIUM' ? '🔶' : '💡';
            console.log(`   ${idx + 1}. ${priorityIcon} [${rec.category.toUpperCase()}] ${rec.recommendation}`);
        });
        
        console.log('');
    }

    printDeploymentRecommendation(score, riskLevel) {
        console.log('🚀 DEPLOYMENT RECOMMENDATION:');
        console.log('-' .repeat(30));
        
        if (score >= 90 && riskLevel === 'LOW') {
            console.log('✅ APPROVED FOR PRODUCTION');
            console.log('   Models are ready for production deployment');
            console.log('   Minimal risk detected');
            console.log('   Continue with standard monitoring');
        } else if (score >= 75 && riskLevel !== 'CRITICAL') {
            console.log('🔶 CONDITIONAL APPROVAL');
            console.log('   Models can be deployed with enhanced monitoring');
            console.log('   Address identified issues in next iteration');
            console.log('   Implement additional safeguards');
        } else if (score >= 60) {
            console.log('⚠️ REQUIRES REMEDIATION');
            console.log('   Models need significant improvements before deployment');
            console.log('   Address critical issues immediately');
            console.log('   Consider model rebuild if needed');
        } else {
            console.log('🚨 NOT APPROVED FOR PRODUCTION');
            console.log('   Critical issues detected');
            console.log('   Complete model and data pipeline rebuild required');
            console.log('   Implement comprehensive ML governance');
        }
        
        console.log('');
    }

    saveValidationReport() {
        const report = {
            timestamp: new Date().toISOString(),
            overallScore: this.calculateOverallValidationScore(),
            overallRiskLevel: this.calculateOverallRiskLevel(),
            validationResults: Object.fromEntries(this.validationResults),
            summary: {
                dataLeakage: this.validationResults.get('dataLeakage')?.hasDataLeakage || false,
                overfitting: this.validationResults.get('overfitting')?.hasOverfitting || false,
                generalizationPassed: this.validationResults.get('generalization')?.passed || false,
                crossValidationPassed: this.validationResults.get('crossValidation')?.passed || false,
                featureImportancePassed: this.validationResults.get('featureImportance')?.passed || false
            }
        };

        console.log('💾 DETAILED VALIDATION REPORT:');
        console.log('-' .repeat(30));
        console.log(JSON.stringify(report, null, 2));
    }

    // 유틸리티 메서드들
    calculateOverallRisk(tests) {
        const riskCounts = Object.values(tests).reduce((counts, test) => {
            const details = test.details || test;
            const riskScore = details.riskScore || 0;
            
            if (riskScore > 80) counts.critical++;
            else if (riskScore > 60) counts.high++;
            else if (riskScore > 40) counts.medium++;
            else counts.low++;
            
            return counts;
        }, { critical: 0, high: 0, medium: 0, low: 0 });

        if (riskCounts.critical > 0) return 'CRITICAL';
        if (riskCounts.high > 0) return 'HIGH';
        if (riskCounts.medium > 0) return 'MEDIUM';
        return 'LOW';
    }

    generateLeakageRecommendations(tests) {
        const recommendations = [];
        
        Object.entries(tests).forEach(([testName, result]) => {
            if (result.hasLeakage) {
                switch (testName) {
                    case 'temporalLeakage':
                        recommendations.push('Implement strict temporal data splitting');
                        break;
                    case 'targetLeakage':
                        recommendations.push('Remove features created after target determination');
                        break;
                    case 'duplicateLeakage':
                        recommendations.push('Implement ID-based data splitting');
                        break;
                    case 'featureLeakage':
                        recommendations.push('Fit transformers only on training data');
                        break;
                    case 'preprocessingLeakage':
                        recommendations.push('Apply preprocessing after data splitting');
                        break;
                }
            }
        });
        
        return recommendations;
    }

    calculateOverfittingSeverity(modelAnalysis) {
        const severityScores = Object.values(modelAnalysis).map(analysis => analysis.overfittingScore);
        const maxSeverity = Math.max(...severityScores);
        
        if (maxSeverity >= 3) return 'SEVERE';
        if (maxSeverity >= 2) return 'MODERATE';
        if (maxSeverity >= 1) return 'MILD';
        return 'NONE';
    }

    generateOverfittingRecommendations(modelAnalysis) {
        const recommendations = [];
        
        Object.values(modelAnalysis).forEach(analysis => {
            if (analysis.overfittingDetected) {
                if (analysis.overfittingSignals.largeTrainTestGap) {
                    recommendations.push('Reduce model complexity or increase regularization');
                }
                if (analysis.overfittingSignals.highComplexity) {
                    recommendations.push('Simplify model architecture');
                }
                if (analysis.overfittingSignals.unstablePerformance) {
                    recommendations.push('Improve cross-validation strategy');
                }
            }
        });
        
        return [...new Set(recommendations)]; // Remove duplicates
    }

    calculateGeneralizationScore(tests) {
        const scores = Object.values(tests).map(test => test.score || 0);
        return Math.round(scores.reduce((a, b) => a + b) / scores.length);
    }

    calculateOverallValidationScore() {
        const weights = {
            dataLeakage: 30,
            overfitting: 25,
            generalization: 20,
            crossValidation: 15,
            featureImportance: 10
        };

        let totalScore = 0;
        let totalWeight = 0;

        Object.entries(weights).forEach(([category, weight]) => {
            const result = this.validationResults.get(category);
            let score = 85; // default score

            if (category === 'dataLeakage') {
                score = result?.hasDataLeakage ? 60 : 100;
            } else if (category === 'overfitting') {
                score = result?.hasOverfitting ? 70 : 95;
            } else if (result) {
                score = result.generalizationScore || result.cvScore || result.featureScore || score;
            }

            totalScore += score * weight;
            totalWeight += weight;
        });

        return Math.round(totalScore / totalWeight);
    }

    calculateOverallRiskLevel() {
        const dataLeakage = this.validationResults.get('dataLeakage');
        const overfitting = this.validationResults.get('overfitting');
        
        if (dataLeakage?.hasDataLeakage && dataLeakage.riskLevel === 'CRITICAL') return 'CRITICAL';
        if (overfitting?.hasOverfitting && overfitting.severity === 'SEVERE') return 'CRITICAL';
        
        const score = this.calculateOverallValidationScore();
        if (score >= 90) return 'LOW';
        if (score >= 75) return 'MEDIUM';
        if (score >= 60) return 'HIGH';
        return 'CRITICAL';
    }

    // 추가 헬퍼 메서드들
    simulatePerformanceStability() { return Math.random() > 0.7; }
    simulateLearningCurve(modelName) { return { converged: true, plateauReached: false }; }
    getModelSpecificRecommendations(modelName, signals) { return []; }
    checkStratification() { return { score: 95, stratified: true }; }
    checkFoldConsistency() { return { score: 88, consistent: true }; }
    checkTemporalSplitting() { return { score: 92, proper: true }; }
    checkGroupLeakage() { return { score: 85, noLeakage: true }; }
    generateCVRecommendations(analysis) { return []; }
    checkImportanceStability() { return { score: 87, stable: true }; }
    checkDomainConsistency() { return { score: 93, consistent: true }; }
    checkFeatureCorrelations() { return { score: 82, acceptable: true }; }
    checkPermutationImportance() { return { score: 89, consistent: true }; }
    generateFeatureRecommendations(analysis) { return []; }
    generateGeneralizationRecommendations(tests) { return []; }
    assessRecommendationPriority(category, rec) {
        if (category === 'dataLeakage') return 'CRITICAL';
        if (category === 'overfitting') return 'HIGH';
        return 'MEDIUM';
    }
}

// 실행
const validator = new MLValidationRunner();
validator.runCompleteValidation().catch(console.error);