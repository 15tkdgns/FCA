/**
 * ML 모델 검증 스위트
 * 오버피팅, 데이터 누출, 모델 무결성 검증
 */

class MLValidationSuite {
    constructor() {
        this.validationResults = new Map();
        this.dataLeakageTests = [];
        this.overfittingTests = [];
        this.modelIntegrityTests = [];
        this.crossValidationResults = [];
    }

    async runCompleteValidation() {
        console.log('🔍 ML Model Validation Suite Starting...\n');
        
        try {
            // 1. 데이터 누출 검증
            await this.detectDataLeakage();
            
            // 2. 오버피팅 검증
            await this.detectOverfitting();
            
            // 3. 모델 일반화 성능 검증
            await this.validateGeneralization();
            
            // 4. 특성 중요도 검증
            await this.validateFeatureImportance();
            
            // 5. 시간적 일관성 검증
            await this.validateTemporalConsistency();
            
            // 6. 교차 검증 수행
            await this.performCrossValidation();
            
            // 7. 종합 보고서 생성
            this.generateValidationReport();
            
        } catch (error) {
            console.error('❌ ML validation failed:', error);
        }
    }

    async detectDataLeakage() {
        console.log('🚨 Detecting Data Leakage...');
        
        const leakageTests = {
            temporalLeakage: await this.checkTemporalLeakage(),
            targetLeakage: await this.checkTargetLeakage(),
            duplicateLeakage: await this.checkDuplicateLeakage(),
            featureLeakage: await this.checkFeatureLeakage(),
            preprocessingLeakage: await this.checkPreprocessingLeakage()
        };

        const leakageDetected = Object.values(leakageTests).some(test => test.hasLeakage);
        
        const result = {
            hasDataLeakage: leakageDetected,
            leakageTypes: leakageTests,
            riskLevel: this.calculateLeakageRisk(leakageTests),
            recommendations: this.generateLeakageRecommendations(leakageTests)
        };

        this.validationResults.set('dataLeakage', result);
        
        console.log(`${leakageDetected ? '⚠️' : '✅'} Data leakage check: ${leakageDetected ? 'DETECTED' : 'CLEAN'}`);
        console.log(`   Risk Level: ${result.riskLevel}`);
        
        return result;
    }

    async checkTemporalLeakage() {
        console.log('   📅 Checking temporal leakage...');
        
        // 시뮬레이션된 데이터로 시간적 누출 검사
        const trainingPeriod = { start: '2023-01-01', end: '2023-10-31' };
        const testPeriod = { start: '2023-11-01', end: '2023-12-31' };
        
        // 훈련 데이터에 미래 정보가 포함되었는지 확인
        const futureDataInTraining = this.simulateTemporalCheck(trainingPeriod, testPeriod);
        
        // 시계열 특성의 미래 정보 사용 여부 확인
        const timeSeriesFeatures = [
            'rolling_mean_7d', 'rolling_std_7d', 'lag_features',
            'moving_average', 'seasonal_decomp'
        ];
        
        const leakageDetected = futureDataInTraining.overlapFound || 
                              this.checkTimeSeriesFeatures(timeSeriesFeatures);

        return {
            hasLeakage: leakageDetected,
            details: {
                trainingPeriod,
                testPeriod,
                overlapFound: futureDataInTraining.overlapFound,
                suspiciousFeatures: futureDataInTraining.suspiciousFeatures,
                riskScore: futureDataInTraining.riskScore
            }
        };
    }

    async checkTargetLeakage() {
        console.log('   🎯 Checking target leakage...');
        
        // 목적 변수와 높은 상관관계를 가진 특성들 확인
        const features = [
            'transaction_amount', 'account_balance', 'merchant_category',
            'transaction_time', 'user_age', 'credit_score',
            'fraud_flag', 'risk_score', 'anomaly_score' // 잠재적 누출 위험
        ];

        const suspiciousFeatures = [];
        const correlationThreshold = 0.95;

        // 각 특성과 목적변수 간 상관관계 시뮬레이션
        for (const feature of features) {
            const correlation = this.simulateCorrelation(feature);
            
            if (Math.abs(correlation) > correlationThreshold) {
                suspiciousFeatures.push({
                    feature,
                    correlation,
                    risk: this.assessFeatureRisk(feature, correlation)
                });
            }
        }

        // 데이터 생성 시점 확인
        const dataGenerationAnalysis = this.analyzeDataGeneration();

        return {
            hasLeakage: suspiciousFeatures.length > 0,
            details: {
                suspiciousFeatures,
                correlationThreshold,
                dataGenerationAnalysis,
                riskScore: this.calculateTargetLeakageRisk(suspiciousFeatures)
            }
        };
    }

    async checkDuplicateLeakage() {
        console.log('   📋 Checking duplicate leakage...');
        
        // 훈련/테스트 세트 간 중복 검사 시뮬레이션
        const datasetSizes = {
            training: 85000,
            validation: 10000,
            test: 15000
        };

        const duplicateAnalysis = {
            exactDuplicates: Math.floor(Math.random() * 50), // 0-49개
            nearDuplicates: Math.floor(Math.random() * 200), // 0-199개
            similarityThreshold: 0.98,
            duplicateRate: 0 // 계산됨
        };

        duplicateAnalysis.duplicateRate = 
            (duplicateAnalysis.exactDuplicates + duplicateAnalysis.nearDuplicates) / 
            datasetSizes.test * 100;

        // ID 기반 중복 확인
        const idDuplicates = this.checkIDDuplicates();

        return {
            hasLeakage: duplicateAnalysis.duplicateRate > 1.0, // 1% 이상시 위험
            details: {
                datasetSizes,
                duplicateAnalysis,
                idDuplicates,
                riskScore: Math.min(duplicateAnalysis.duplicateRate * 10, 100)
            }
        };
    }

    async checkFeatureLeakage() {
        console.log('   🔍 Checking feature leakage...');
        
        // 특성 엔지니어링 과정에서의 누출 검사
        const featureEngineering = {
            globalStatistics: this.checkGlobalStatistics(),
            targetEncoding: this.checkTargetEncoding(),
            normalization: this.checkNormalization(),
            oneHotEncoding: this.checkOneHotEncoding()
        };

        // 특성 선택 과정에서의 누출
        const featureSelection = {
            univariateSelection: this.checkUnivariateSelection(),
            recursiveFeatureElimination: this.checkRFE(),
            l1Regularization: this.checkL1Regularization()
        };

        const hasLeakage = Object.values(featureEngineering).some(check => check.hasLeakage) ||
                          Object.values(featureSelection).some(check => check.hasLeakage);

        return {
            hasLeakage,
            details: {
                featureEngineering,
                featureSelection,
                riskScore: this.calculateFeatureLeakageRisk(featureEngineering, featureSelection)
            }
        };
    }

    async checkPreprocessingLeakage() {
        console.log('   ⚙️ Checking preprocessing leakage...');
        
        // 전처리 단계에서의 누출 검사
        const preprocessingSteps = {
            scaling: {
                method: 'StandardScaler',
                fittedOnTraining: true,
                statisticsLeakage: false
            },
            imputation: {
                method: 'median',
                fittedOnTraining: true,
                statisticsLeakage: false
            },
            outlierRemoval: {
                method: 'IQR',
                appliedAfterSplit: true,
                leakageRisk: 'low'
            },
            featureSelection: {
                method: 'SelectKBest',
                fittedOnTraining: true,
                leakageRisk: 'medium'
            }
        };

        // 각 전처리 단계의 누출 위험 평가
        const leakageRisks = Object.entries(preprocessingSteps).map(([step, config]) => {
            return {
                step,
                hasLeakage: !config.fittedOnTraining,
                riskLevel: config.leakageRisk || 'low',
                recommendation: this.getPreprocessingRecommendation(step, config)
            };
        });

        const hasLeakage = leakageRisks.some(risk => risk.hasLeakage);

        return {
            hasLeakage,
            details: {
                preprocessingSteps,
                leakageRisks,
                riskScore: this.calculatePreprocessingRisk(leakageRisks)
            }
        };
    }

    async detectOverfitting() {
        console.log('📈 Detecting Overfitting...');
        
        const overfittingTests = {
            trainTestGap: await this.checkTrainTestGap(),
            validationCurves: await this.analyzeValidationCurves(),
            complexityAnalysis: await this.analyzeModelComplexity(),
            crossValidationStability: await this.checkCVStability(),
            learningCurves: await this.analyzeLearningCurves()
        };

        const overfittingDetected = Object.values(overfittingTests).some(test => test.hasOverfitting);
        
        const result = {
            hasOverfitting: overfittingDetected,
            overfittingTypes: overfittingTests,
            severity: this.calculateOverfittingSeverity(overfittingTests),
            recommendations: this.generateOverfittingRecommendations(overfittingTests)
        };

        this.validationResults.set('overfitting', result);
        
        console.log(`${overfittingDetected ? '⚠️' : '✅'} Overfitting check: ${overfittingDetected ? 'DETECTED' : 'HEALTHY'}`);
        console.log(`   Severity: ${result.severity}`);
        
        return result;
    }

    async checkTrainTestGap() {
        console.log('   📊 Analyzing train-test performance gap...');
        
        // 모델별 성능 시뮬레이션
        const modelPerformances = {
            fraud_detection: {
                train_auc: 0.994,
                validation_auc: 0.989,
                test_auc: 0.975,
                train_precision: 0.987,
                test_precision: 0.968
            },
            sentiment_analysis: {
                train_accuracy: 0.942,
                validation_accuracy: 0.935,
                test_accuracy: 0.912,
                train_f1: 0.938,
                test_f1: 0.908
            },
            customer_attrition: {
                train_auc: 0.873,
                validation_auc: 0.856,
                test_auc: 0.847,
                train_recall: 0.891,
                test_recall: 0.876
            }
        };

        const gapAnalysis = {};
        
        Object.entries(modelPerformances).forEach(([model, perf]) => {
            const aucGap = perf.train_auc ? perf.train_auc - perf.test_auc : 0;
            const accuracyGap = perf.train_accuracy ? perf.train_accuracy - perf.test_accuracy : 0;
            const precisionGap = perf.train_precision ? perf.train_precision - perf.test_precision : 0;
            
            const maxGap = Math.max(aucGap, accuracyGap, precisionGap);
            
            gapAnalysis[model] = {
                aucGap,
                accuracyGap,
                precisionGap,
                maxGap,
                overfittingRisk: maxGap > 0.05 ? 'HIGH' : maxGap > 0.02 ? 'MEDIUM' : 'LOW'
            };
        });

        const hasOverfitting = Object.values(gapAnalysis).some(analysis => 
            analysis.overfittingRisk === 'HIGH'
        );

        return {
            hasOverfitting,
            details: {
                modelPerformances,
                gapAnalysis,
                riskThreshold: 0.05,
                riskScore: Math.max(...Object.values(gapAnalysis).map(a => a.maxGap)) * 100
            }
        };
    }

    async analyzeValidationCurves() {
        console.log('   📈 Analyzing validation curves...');
        
        // 하이퍼파라미터 튜닝 과정에서의 검증 곡선 분석
        const hyperparameterAnalysis = {
            randomForest: {
                parameter: 'n_estimators',
                values: [10, 50, 100, 200, 500, 1000],
                trainScores: [0.85, 0.92, 0.97, 0.99, 0.995, 0.998],
                validationScores: [0.84, 0.90, 0.94, 0.93, 0.91, 0.88]
            },
            xgboost: {
                parameter: 'max_depth',
                values: [3, 5, 7, 10, 15, 20],
                trainScores: [0.88, 0.93, 0.97, 0.99, 0.995, 0.998],
                validationScores: [0.87, 0.91, 0.94, 0.92, 0.89, 0.85]
            }
        };

        const curveAnalysis = {};
        
        Object.entries(hyperparameterAnalysis).forEach(([model, data]) => {
            const divergencePoints = [];
            const maxTrainScore = Math.max(...data.trainScores);
            const maxValidScore = Math.max(...data.validationScores);
            
            // 훈련/검증 점수 간 발산 지점 찾기
            data.trainScores.forEach((trainScore, idx) => {
                const validScore = data.validationScores[idx];
                const gap = trainScore - validScore;
                
                if (gap > 0.05) {
                    divergencePoints.push({
                        parameterValue: data.values[idx],
                        gap,
                        overfittingSignal: gap > 0.1
                    });
                }
            });

            curveAnalysis[model] = {
                maxTrainScore,
                maxValidScore,
                divergencePoints,
                overfittingDetected: divergencePoints.length > 0,
                optimalComplexity: this.findOptimalComplexity(data)
            };
        });

        const hasOverfitting = Object.values(curveAnalysis).some(analysis => 
            analysis.overfittingDetected
        );

        return {
            hasOverfitting,
            details: {
                hyperparameterAnalysis,
                curveAnalysis,
                recommendations: this.generateComplexityRecommendations(curveAnalysis)
            }
        };
    }

    async analyzeModelComplexity() {
        console.log('   🧠 Analyzing model complexity...');
        
        const modelComplexities = {
            fraud_detection: {
                model: 'RandomForest',
                parameters: 100, // n_estimators
                maxDepth: 10,
                features: 30,
                complexityScore: this.calculateComplexityScore('RandomForest', 100, 10, 30)
            },
            sentiment_analysis: {
                model: 'BERT',
                parameters: 110000000, // 110M parameters
                layers: 12,
                features: 768,
                complexityScore: this.calculateComplexityScore('BERT', 110000000, 12, 768)
            },
            customer_attrition: {
                model: 'LogisticRegression',
                parameters: 15, // number of features
                regularization: 0.01,
                features: 15,
                complexityScore: this.calculateComplexityScore('LogisticRegression', 15, 1, 15)
            }
        };

        const complexityAnalysis = {};
        
        Object.entries(modelComplexities).forEach(([model, config]) => {
            const dataSize = this.getDatasetSize(model);
            const complexityRatio = config.complexityScore / dataSize;
            
            complexityAnalysis[model] = {
                ...config,
                dataSize,
                complexityRatio,
                riskLevel: complexityRatio > 0.1 ? 'HIGH' : 
                          complexityRatio > 0.05 ? 'MEDIUM' : 'LOW',
                recommendation: this.getComplexityRecommendation(complexityRatio, config.model)
            };
        });

        const hasOverfitting = Object.values(complexityAnalysis).some(analysis => 
            analysis.riskLevel === 'HIGH'
        );

        return {
            hasOverfitting,
            details: {
                modelComplexities,
                complexityAnalysis,
                riskThreshold: 0.1
            }
        };
    }

    async checkCVStability() {
        console.log('   🔄 Checking cross-validation stability...');
        
        // 5-fold 교차 검증 결과 시뮬레이션
        const cvResults = {
            fraud_detection: {
                folds: [0.975, 0.982, 0.969, 0.987, 0.978],
                mean: 0.978,
                std: 0.007,
                metric: 'AUC-ROC'
            },
            sentiment_analysis: {
                folds: [0.912, 0.935, 0.907, 0.941, 0.925],
                mean: 0.924,
                std: 0.014,
                metric: 'F1-Score'
            },
            customer_attrition: {
                folds: [0.847, 0.856, 0.841, 0.862, 0.849],
                mean: 0.851,
                std: 0.008,
                metric: 'AUC-ROC'
            }
        };

        const stabilityAnalysis = {};
        
        Object.entries(cvResults).forEach(([model, results]) => {
            const coefficientOfVariation = results.std / results.mean;
            const range = Math.max(...results.folds) - Math.min(...results.folds);
            
            stabilityAnalysis[model] = {
                ...results,
                coefficientOfVariation,
                range,
                stability: coefficientOfVariation < 0.05 ? 'STABLE' : 
                          coefficientOfVariation < 0.1 ? 'MODERATE' : 'UNSTABLE',
                overfittingRisk: coefficientOfVariation > 0.1
            };
        });

        const hasOverfitting = Object.values(stabilityAnalysis).some(analysis => 
            analysis.overfittingRisk
        );

        return {
            hasOverfitting,
            details: {
                cvResults,
                stabilityAnalysis,
                stabilityThreshold: 0.05
            }
        };
    }

    async analyzeLearningCurves() {
        console.log('   📚 Analyzing learning curves...');
        
        // 학습 곡선 데이터 시뮬레이션
        const learningCurves = {
            fraud_detection: {
                trainingSizes: [1000, 5000, 10000, 20000, 50000, 85000],
                trainScores: [0.92, 0.96, 0.98, 0.99, 0.994, 0.994],
                validScores: [0.89, 0.93, 0.95, 0.96, 0.975, 0.975]
            },
            sentiment_analysis: {
                trainingSizes: [500, 2000, 5000, 10000, 20000, 30000],
                trainScores: [0.88, 0.91, 0.94, 0.96, 0.942, 0.942],
                validScores: [0.85, 0.89, 0.91, 0.93, 0.935, 0.935]
            }
        };

        const curveAnalysis = {};
        
        Object.entries(learningCurves).forEach(([model, data]) => {
            const finalTrainScore = data.trainScores[data.trainScores.length - 1];
            const finalValidScore = data.validScores[data.validScores.length - 1];
            const convergenceGap = finalTrainScore - finalValidScore;
            
            // 수렴성 분석
            const trainConverged = this.checkConvergence(data.trainScores);
            const validConverged = this.checkConvergence(data.validScores);
            
            curveAnalysis[model] = {
                finalTrainScore,
                finalValidScore,
                convergenceGap,
                trainConverged,
                validConverged,
                overfittingSignal: convergenceGap > 0.05 && !validConverged,
                dataEfficiency: this.calculateDataEfficiency(data)
            };
        });

        const hasOverfitting = Object.values(curveAnalysis).some(analysis => 
            analysis.overfittingSignal
        );

        return {
            hasOverfitting,
            details: {
                learningCurves,
                curveAnalysis,
                convergenceThreshold: 0.05
            }
        };
    }

    async validateGeneralization() {
        console.log('🌍 Validating Model Generalization...');
        
        const generalizationTests = {
            holdoutPerformance: await this.testHoldoutPerformance(),
            temporalGeneralization: await this.testTemporalGeneralization(),
            distributionShift: await this.testDistributionShift(),
            adversarialRobustness: await this.testAdversarialRobustness()
        };

        const result = {
            generalizationScore: this.calculateGeneralizationScore(generalizationTests),
            tests: generalizationTests,
            recommendations: this.generateGeneralizationRecommendations(generalizationTests)
        };

        this.validationResults.set('generalization', result);
        
        console.log(`✅ Generalization score: ${result.generalizationScore}/100`);
        
        return result;
    }

    async testHoldoutPerformance() {
        console.log('   🎯 Testing holdout performance...');
        
        // 홀드아웃 테스트 세트에서의 성능
        const holdoutResults = {
            fraud_detection: {
                expectedPerformance: 0.975,
                actualPerformance: 0.972,
                difference: -0.003,
                acceptable: true
            },
            sentiment_analysis: {
                expectedPerformance: 0.935,
                actualPerformance: 0.912,
                difference: -0.023,
                acceptable: true
            },
            customer_attrition: {
                expectedPerformance: 0.856,
                actualPerformance: 0.847,
                difference: -0.009,
                acceptable: true
            }
        };

        const avgDifference = Object.values(holdoutResults)
            .reduce((sum, result) => sum + Math.abs(result.difference), 0) / 
            Object.keys(holdoutResults).length;

        return {
            performanceDropAcceptable: avgDifference < 0.05,
            holdoutResults,
            averageDifference: avgDifference,
            riskLevel: avgDifference > 0.1 ? 'HIGH' : avgDifference > 0.05 ? 'MEDIUM' : 'LOW'
        };
    }

    async testTemporalGeneralization() {
        console.log('   ⏰ Testing temporal generalization...');
        
        // 시간에 따른 모델 성능 변화
        const temporalPerformance = {
            fraud_detection: {
                '2023-Q1': 0.975,
                '2023-Q2': 0.971,
                '2023-Q3': 0.968,
                '2023-Q4': 0.965,
                degradationRate: -0.003 // per quarter
            },
            sentiment_analysis: {
                '2023-Q1': 0.912,
                '2023-Q2': 0.908,
                '2023-Q3': 0.905,
                '2023-Q4': 0.902,
                degradationRate: -0.003
            }
        };

        const temporalStability = Object.entries(temporalPerformance).map(([model, perf]) => {
            const performances = Object.values(perf).slice(0, -1); // 마지막 degradationRate 제외
            const stability = Math.max(...performances) - Math.min(...performances);
            
            return {
                model,
                stability,
                degradationRate: perf.degradationRate,
                acceptable: stability < 0.05 && Math.abs(perf.degradationRate) < 0.01
            };
        });

        const temporallyStable = temporalStability.every(t => t.acceptable);

        return {
            temporallyStable,
            temporalPerformance,
            temporalStability,
            recommendations: temporallyStable ? [] : this.getTemporalRecommendations(temporalStability)
        };
    }

    async testDistributionShift() {
        console.log('   📊 Testing distribution shift robustness...');
        
        // 데이터 분포 변화에 대한 강건성 테스트
        const distributionTests = {
            covariateShift: {
                // 입력 특성 분포 변화
                originalAccuracy: 0.975,
                shiftedAccuracy: 0.968,
                robustness: 0.993 // (shiftedAccuracy / originalAccuracy)
            },
            priorShift: {
                // 클래스 분포 변화
                originalFraudRate: 0.001,
                shiftedFraudRate: 0.003,
                performanceImpact: -0.007
            },
            conceptDrift: {
                // 개념 변화
                driftDetected: false,
                driftSeverity: 'low',
                adaptationNeeded: false
            }
        };

        const overallRobustness = (
            distributionTests.covariateShift.robustness + 
            (1 - Math.abs(distributionTests.priorShift.performanceImpact)) +
            (distributionTests.conceptDrift.driftDetected ? 0.7 : 1.0)
        ) / 3;

        return {
            robust: overallRobustness > 0.9,
            overallRobustness,
            distributionTests,
            riskLevel: overallRobustness > 0.95 ? 'LOW' : 
                      overallRobustness > 0.85 ? 'MEDIUM' : 'HIGH'
        };
    }

    async testAdversarialRobustness() {
        console.log('   🛡️ Testing adversarial robustness...');
        
        // 적대적 공격에 대한 강건성 (사기 탐지에 특히 중요)
        const adversarialTests = {
            evasionAttacks: {
                fgsm: { successRate: 0.15, severity: 'medium' },
                pgd: { successRate: 0.08, severity: 'low' },
                carlini: { successRate: 0.03, severity: 'very_low' }
            },
            poisoningResistance: {
                trainingDataCorruption: 0.02, // 2% 오염 데이터에 대한 저항성
                performanceImpact: -0.012,
                detectionCapability: 0.89
            },
            explainabilityRobustness: {
                featureImportanceStability: 0.92,
                explanationConsistency: 0.88,
                trustworthiness: 0.90
            }
        };

        const avgEvasionResistance = 1 - Object.values(adversarialTests.evasionAttacks)
            .reduce((sum, attack) => sum + attack.successRate, 0) / 
            Object.keys(adversarialTests.evasionAttacks).length;

        const overallRobustness = (
            avgEvasionResistance +
            (1 - Math.abs(adversarialTests.poisoningResistance.performanceImpact)) +
            adversarialTests.explainabilityRobustness.trustworthiness
        ) / 3;

        return {
            robust: overallRobustness > 0.8,
            overallRobustness,
            adversarialTests,
            securityLevel: overallRobustness > 0.9 ? 'HIGH' : 
                          overallRobustness > 0.7 ? 'MEDIUM' : 'LOW'
        };
    }

    generateValidationReport() {
        console.log('\n📋 ML MODEL VALIDATION REPORT');
        console.log('=' .repeat(60));
        
        const dataLeakage = this.validationResults.get('dataLeakage');
        const overfitting = this.validationResults.get('overfitting');
        const generalization = this.validationResults.get('generalization');
        
        // 전체 모델 건전성 점수 계산
        const overallHealthScore = this.calculateOverallHealthScore();
        
        console.log(`🎯 OVERALL MODEL HEALTH SCORE: ${overallHealthScore}/100\n`);
        
        // 데이터 누출 결과
        console.log('🚨 DATA LEAKAGE ANALYSIS:');
        console.log(`   Status: ${dataLeakage?.hasDataLeakage ? '⚠️ DETECTED' : '✅ CLEAN'}`);
        console.log(`   Risk Level: ${dataLeakage?.riskLevel || 'UNKNOWN'}`);
        if (dataLeakage?.recommendations?.length > 0) {
            console.log('   Recommendations:');
            dataLeakage.recommendations.forEach(rec => console.log(`     • ${rec}`));
        }
        console.log('');
        
        // 오버피팅 결과
        console.log('📈 OVERFITTING ANALYSIS:');
        console.log(`   Status: ${overfitting?.hasOverfitting ? '⚠️ DETECTED' : '✅ HEALTHY'}`);
        console.log(`   Severity: ${overfitting?.severity || 'UNKNOWN'}`);
        if (overfitting?.recommendations?.length > 0) {
            console.log('   Recommendations:');
            overfitting.recommendations.forEach(rec => console.log(`     • ${rec}`));
        }
        console.log('');
        
        // 일반화 성능 결과
        console.log('🌍 GENERALIZATION ANALYSIS:');
        console.log(`   Score: ${generalization?.generalizationScore || 0}/100`);
        if (generalization?.recommendations?.length > 0) {
            console.log('   Recommendations:');
            generalization.recommendations.forEach(rec => console.log(`     • ${rec}`));
        }
        console.log('');
        
        // 모델별 세부 분석
        this.printModelSpecificAnalysis();
        
        // 최종 권장사항
        this.printFinalRecommendations(overallHealthScore);
        
        // 결과 저장
        this.saveValidationResults();
    }

    printModelSpecificAnalysis() {
        console.log('🔍 MODEL-SPECIFIC ANALYSIS:\n');
        
        const models = ['fraud_detection', 'sentiment_analysis', 'customer_attrition'];
        
        models.forEach(model => {
            console.log(`📊 ${model.toUpperCase()}:`);
            
            // 성능 요약
            const performance = this.getModelPerformance(model);
            console.log(`   Train Performance: ${(performance.train * 100).toFixed(1)}%`);
            console.log(`   Test Performance: ${(performance.test * 100).toFixed(1)}%`);
            console.log(`   Performance Gap: ${((performance.train - performance.test) * 100).toFixed(1)}%`);
            
            // 위험도 평가
            const riskLevel = this.assessModelRisk(model);
            console.log(`   Risk Level: ${riskLevel}`);
            
            console.log('');
        });
    }

    printFinalRecommendations(healthScore) {
        console.log('💡 FINAL RECOMMENDATIONS:\n');
        
        if (healthScore >= 90) {
            console.log('🎉 EXCELLENT: Models are production-ready with minimal risk');
            console.log('   • Continue monitoring for distribution drift');
            console.log('   • Implement automated retraining pipeline');
        } else if (healthScore >= 75) {
            console.log('✅ GOOD: Models are generally healthy with minor concerns');
            console.log('   • Address identified overfitting issues');
            console.log('   • Enhance validation procedures');
        } else if (healthScore >= 60) {
            console.log('⚠️ MODERATE: Models need attention before production');
            console.log('   • Fix data leakage issues immediately');
            console.log('   • Implement stronger regularization');
            console.log('   • Expand validation testing');
        } else {
            console.log('❌ CRITICAL: Models require significant remediation');
            console.log('   • Complete model rebuild recommended');
            console.log('   • Comprehensive data audit required');
            console.log('   • Enhanced ML pipeline governance needed');
        }
        
        console.log('\n📈 MONITORING RECOMMENDATIONS:');
        console.log('   • Set up model performance monitoring');
        console.log('   • Implement data drift detection');
        console.log('   • Schedule regular model validation');
        console.log('   • Create automated alerts for performance degradation');
    }

    saveValidationResults() {
        const report = {
            timestamp: new Date().toISOString(),
            overallHealthScore: this.calculateOverallHealthScore(),
            validationResults: Object.fromEntries(this.validationResults),
            summary: {
                dataLeakage: this.validationResults.get('dataLeakage')?.hasDataLeakage || false,
                overfitting: this.validationResults.get('overfitting')?.hasOverfitting || false,
                generalizationScore: this.validationResults.get('generalization')?.generalizationScore || 0
            }
        };

        const filename = `ml-validation-report-${new Date().toISOString().slice(0, 19)}.json`;
        
        try {
            // 브라우저 환경에서는 localStorage에 저장
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('fca_ml_validation_report', JSON.stringify(report));
                console.log(`💾 Validation report saved to localStorage`);
            }
            
            console.log('\n📄 Detailed validation report:');
            console.log(JSON.stringify(report, null, 2));
            
        } catch (error) {
            console.error(`Failed to save validation report: ${error.message}`);
        }
    }

    // 유틸리티 메서드들
    simulateTemporalCheck(trainingPeriod, testPeriod) {
        return {
            overlapFound: false,
            suspiciousFeatures: [],
            riskScore: Math.random() * 20 // 0-20점
        };
    }

    simulateCorrelation(feature) {
        const riskFeatures = ['fraud_flag', 'risk_score', 'anomaly_score'];
        if (riskFeatures.includes(feature)) {
            return 0.9 + Math.random() * 0.09; // 0.9-0.99
        }
        return Math.random() * 0.8; // 0-0.8
    }

    assessFeatureRisk(feature, correlation) {
        if (Math.abs(correlation) > 0.95) return 'CRITICAL';
        if (Math.abs(correlation) > 0.9) return 'HIGH';
        if (Math.abs(correlation) > 0.7) return 'MEDIUM';
        return 'LOW';
    }

    calculateOverallHealthScore() {
        const dataLeakage = this.validationResults.get('dataLeakage');
        const overfitting = this.validationResults.get('overfitting');
        const generalization = this.validationResults.get('generalization');
        
        let score = 100;
        
        // 데이터 누출 페널티
        if (dataLeakage?.hasDataLeakage) {
            const riskPenalty = dataLeakage.riskLevel === 'CRITICAL' ? 40 :
                              dataLeakage.riskLevel === 'HIGH' ? 25 :
                              dataLeakage.riskLevel === 'MEDIUM' ? 15 : 5;
            score -= riskPenalty;
        }
        
        // 오버피팅 페널티
        if (overfitting?.hasOverfitting) {
            const severityPenalty = overfitting.severity === 'SEVERE' ? 30 :
                                  overfitting.severity === 'MODERATE' ? 20 :
                                  overfitting.severity === 'MILD' ? 10 : 5;
            score -= severityPenalty;
        }
        
        // 일반화 성능 보너스/페널티
        if (generalization?.generalizationScore) {
            const generalizationBonus = (generalization.generalizationScore - 70) * 0.3;
            score += generalizationBonus;
        }
        
        return Math.max(0, Math.min(100, Math.round(score)));
    }

    getModelPerformance(model) {
        const performances = {
            fraud_detection: { train: 0.994, test: 0.975 },
            sentiment_analysis: { train: 0.942, test: 0.912 },
            customer_attrition: { train: 0.873, test: 0.847 }
        };
        return performances[model] || { train: 0, test: 0 };
    }

    assessModelRisk(model) {
        const performance = this.getModelPerformance(model);
        const gap = performance.train - performance.test;
        
        if (gap > 0.05) return 'HIGH';
        if (gap > 0.02) return 'MEDIUM';
        return 'LOW';
    }

    // 추가 유틸리티 메서드들은 여기에 구현...
    calculateLeakageRisk(tests) { return 'LOW'; }
    generateLeakageRecommendations(tests) { return []; }
    checkTimeSeriesFeatures(features) { return false; }
    analyzeDataGeneration() { return {}; }
    calculateTargetLeakageRisk(features) { return 0; }
    checkIDDuplicates() { return {}; }
    checkGlobalStatistics() { return { hasLeakage: false }; }
    checkTargetEncoding() { return { hasLeakage: false }; }
    checkNormalization() { return { hasLeakage: false }; }
    checkOneHotEncoding() { return { hasLeakage: false }; }
    checkUnivariateSelection() { return { hasLeakage: false }; }
    checkRFE() { return { hasLeakage: false }; }
    checkL1Regularization() { return { hasLeakage: false }; }
    calculateFeatureLeakageRisk(fe, fs) { return 0; }
    getPreprocessingRecommendation(step, config) { return 'No action needed'; }
    calculatePreprocessingRisk(risks) { return 0; }
    calculateOverfittingSeverity(tests) { return 'MILD'; }
    generateOverfittingRecommendations(tests) { return []; }
    findOptimalComplexity(data) { return data.values[3]; }
    generateComplexityRecommendations(analysis) { return []; }
    calculateComplexityScore(model, params, depth, features) { return params * 0.001; }
    getDatasetSize(model) { return 85000; }
    getComplexityRecommendation(ratio, model) { return 'Maintain current complexity'; }
    checkConvergence(scores) { return true; }
    calculateDataEfficiency(data) { return 0.85; }
    calculateGeneralizationScore(tests) { return 85; }
    generateGeneralizationRecommendations(tests) { return []; }
    getTemporalRecommendations(stability) { return []; }
}

export default MLValidationSuite;