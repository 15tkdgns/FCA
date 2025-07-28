/**
 * 타겟 누출 감지 및 방지 시스템
 * 타겟 변수와 강한 상관관계를 가진 위험한 특성들을 식별하고 제거합니다
 */

export class TargetLeakageDetector {
    constructor() {
        this.correlationThreshold = 0.8; // 높은 상관관계 임계값
        this.suspiciousPatterns = [
            /risk_score/i,
            /fraud_probability/i,
            /prediction/i,
            /_predicted/i,
            /target_/i,
            /label_/i,
            /class_/i,
            /decision/i,
            /approval/i,
            /rejection/i,
            /outcome/i,
            /result/i,
            /status(?!.*(?:initial|original))/i, // status but not initial_status
            /final_/i,
            /approved/i,
            /declined/i,
            /processed/i
        ];
        this.timeBasedRisks = [
            /current/i,
            /real_time/i,
            /live/i,
            /now/i,
            /latest/i,
            /instant/i
        ];
    }

    /**
     * 타겟 누출 위험이 있는 특성들을 감지
     * @param {Array} data - 데이터셋
     * @param {string} targetCol - 타겟 컬럼명
     * @returns {Object} 감지 결과
     */
    detectTargetLeakage(data, targetCol) {
        console.log('🔍 Detecting target leakage...');
        
        if (!data || data.length === 0) {
            throw new Error('Data is empty or undefined');
        }

        const features = Object.keys(data[0]).filter(col => col !== targetCol);
        const leakageReport = {
            riskyFeatures: [],
            suspiciousPatterns: [],
            correlationAnalysis: {},
            recommendations: []
        };

        // 1. 패턴 기반 위험 특성 감지
        leakageReport.suspiciousPatterns = this.detectSuspiciousPatterns(features);

        // 2. 상관관계 분석
        leakageReport.correlationAnalysis = this.analyzeCorrelations(data, targetCol, features);

        // 3. 시간 기반 위험 특성 감지
        const timeRisks = this.detectTimeBasedRisks(features);

        // 4. 종합 위험 특성 목록 생성
        leakageReport.riskyFeatures = this.compileRiskyFeatures(
            leakageReport.suspiciousPatterns,
            leakageReport.correlationAnalysis.highCorrelations,
            timeRisks
        );

        // 5. 권장사항 생성
        leakageReport.recommendations = this.generateRecommendations(leakageReport);

        console.log(`⚠️ Found ${leakageReport.riskyFeatures.length} risky features`);
        
        return leakageReport;
    }

    /**
     * 위험한 패턴을 가진 특성명 감지
     */
    detectSuspiciousPatterns(features) {
        const suspicious = [];

        features.forEach(feature => {
            this.suspiciousPatterns.forEach(pattern => {
                if (pattern.test(feature)) {
                    suspicious.push({
                        feature,
                        pattern: pattern.source,
                        risk: 'HIGH',
                        reason: `Feature name matches suspicious pattern: ${pattern.source}`
                    });
                }
            });
        });

        return suspicious;
    }

    /**
     * 타겟과의 상관관계 분석
     */
    analyzeCorrelations(data, targetCol, features) {
        const correlations = {};
        const highCorrelations = [];

        // 타겟 값들 추출
        const targetValues = data.map(row => this.parseNumeric(row[targetCol]));

        features.forEach(feature => {
            try {
                const featureValues = data.map(row => this.parseNumeric(row[feature]));
                const correlation = this.calculateCorrelation(targetValues, featureValues);
                
                correlations[feature] = {
                    correlation: correlation,
                    absoluteCorrelation: Math.abs(correlation)
                };

                // 높은 상관관계 특성 식별
                if (Math.abs(correlation) > this.correlationThreshold) {
                    highCorrelations.push({
                        feature,
                        correlation: correlation,
                        risk: Math.abs(correlation) > 0.95 ? 'CRITICAL' : 'HIGH',
                        reason: `Very high correlation with target: ${correlation.toFixed(3)}`
                    });
                }
            } catch (error) {
                console.warn(`Could not calculate correlation for ${feature}: ${error.message}`);
                correlations[feature] = { correlation: 0, absoluteCorrelation: 0 };
            }
        });

        return {
            correlations,
            highCorrelations
        };
    }

    /**
     * 시간 기반 위험 특성 감지
     */
    detectTimeBasedRisks(features) {
        const timeRisks = [];

        features.forEach(feature => {
            this.timeBasedRisks.forEach(pattern => {
                if (pattern.test(feature)) {
                    timeRisks.push({
                        feature,
                        pattern: pattern.source,
                        risk: 'MEDIUM',
                        reason: `Feature uses current/real-time data that may contain future information`
                    });
                }
            });
        });

        return timeRisks;
    }

    /**
     * 종합 위험 특성 목록 컴파일
     */
    compileRiskyFeatures(patternRisks, correlationRisks, timeRisks) {
        const allRisks = [...patternRisks, ...correlationRisks, ...timeRisks];
        const riskyFeatures = new Map();

        allRisks.forEach(risk => {
            if (!riskyFeatures.has(risk.feature)) {
                riskyFeatures.set(risk.feature, {
                    feature: risk.feature,
                    risks: [],
                    maxRisk: 'LOW'
                });
            }

            const feature = riskyFeatures.get(risk.feature);
            feature.risks.push({
                type: this.getRiskType(risk),
                level: risk.risk,
                reason: risk.reason
            });

            // 최대 위험도 업데이트
            if (this.getRiskLevel(risk.risk) > this.getRiskLevel(feature.maxRisk)) {
                feature.maxRisk = risk.risk;
            }
        });

        return Array.from(riskyFeatures.values());
    }

    /**
     * 안전한 데이터셋 생성 (위험 특성 제거)
     */
    createSafeDataset(data, targetCol, options = {}) {
        console.log('🛡️ Creating safe dataset by removing risky features...');
        
        const leakageReport = this.detectTargetLeakage(data, targetCol);
        const removeThreshold = options.removeThreshold || 'MEDIUM';
        
        // 제거할 특성 결정
        const featuresToRemove = leakageReport.riskyFeatures
            .filter(risk => this.getRiskLevel(risk.maxRisk) >= this.getRiskLevel(removeThreshold))
            .map(risk => risk.feature);

        // 안전한 특성만 포함한 데이터셋 생성
        const safeData = data.map(row => {
            const safeRow = {};
            Object.keys(row).forEach(key => {
                if (!featuresToRemove.includes(key)) {
                    safeRow[key] = row[key];
                }
            });
            return safeRow;
        });

        console.log(`✅ Removed ${featuresToRemove.length} risky features`);
        console.log(`📊 Safe dataset: ${Object.keys(safeData[0]).length} features remaining`);

        return {
            safeData,
            removedFeatures: featuresToRemove,
            leakageReport,
            summary: {
                originalFeatures: Object.keys(data[0]).length,
                safeFeatures: Object.keys(safeData[0]).length,
                removedCount: featuresToRemove.length
            }
        };
    }

    /**
     * 권장사항 생성
     */
    generateRecommendations(leakageReport) {
        const recommendations = [];

        if (leakageReport.riskyFeatures.length > 0) {
            recommendations.push({
                priority: 'HIGH',
                action: 'Remove high-risk features',
                features: leakageReport.riskyFeatures
                    .filter(f => f.maxRisk === 'CRITICAL' || f.maxRisk === 'HIGH')
                    .map(f => f.feature),
                reason: 'These features have strong correlation with target or suspicious naming patterns'
            });
        }

        if (leakageReport.suspiciousPatterns.length > 0) {
            recommendations.push({
                priority: 'HIGH',
                action: 'Review feature engineering pipeline',
                details: 'Features with suspicious names suggest they may be generated after target determination',
                affectedFeatures: leakageReport.suspiciousPatterns.map(p => p.feature)
            });
        }

        const highCorrelationFeatures = leakageReport.correlationAnalysis.highCorrelations
            .filter(c => Math.abs(c.correlation) > 0.95);
        
        if (highCorrelationFeatures.length > 0) {
            recommendations.push({
                priority: 'CRITICAL',
                action: 'Investigate extremely high correlations',
                features: highCorrelationFeatures.map(c => c.feature),
                reason: 'Correlations > 0.95 strongly suggest target leakage'
            });
        }

        return recommendations;
    }

    /**
     * 특성 타이밍 검증 (언제 특성이 생성되었는지)
     */
    validateFeatureTiming(featureMetadata) {
        const timingAnalysis = {};

        Object.entries(featureMetadata).forEach(([feature, metadata]) => {
            const timing = metadata.creationTiming || 'unknown';
            const isProblematic = this.isTimingProblematic(timing, metadata);
            
            timingAnalysis[feature] = {
                timing,
                isProblematic,
                recommendation: isProblematic ? 'Remove or recreate before target determination' : 'Safe to use'
            };
        });

        return timingAnalysis;
    }

    /**
     * 유틸리티 메서드들
     */
    parseNumeric(value) {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            // Boolean 문자열 처리
            if (value.toLowerCase() === 'true') return 1;
            if (value.toLowerCase() === 'false') return 0;
            
            // 숫자 문자열 처리
            const parsed = parseFloat(value);
            return isNaN(parsed) ? 0 : parsed;
        }
        if (typeof value === 'boolean') return value ? 1 : 0;
        return 0;
    }

    calculateCorrelation(x, y) {
        if (x.length !== y.length || x.length === 0) return 0;

        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
        const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
        const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0);

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

        return denominator === 0 ? 0 : numerator / denominator;
    }

    getRiskType(risk) {
        if (risk.pattern) return 'PATTERN';
        if (risk.correlation !== undefined) return 'CORRELATION';
        return 'OTHER';
    }

    getRiskLevel(riskString) {
        const levels = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4 };
        return levels[riskString] || 0;
    }

    isTimingProblematic(timing, metadata) {
        const problematicTimings = [
            'after_target_determination',
            'post_processing',
            'after_labeling',
            'real_time'
        ];
        
        return problematicTimings.includes(timing) || 
               (metadata.targetDependent === true) ||
               (metadata.futureInformation === true);
    }

    /**
     * 안전한 특성 생성 가이드라인
     */
    getSafeFeatureGuidelines() {
        return {
            temporal: {
                safe: [
                    'Use only historical data before target event',
                    'Apply proper time windows (e.g., 30 days before transaction)',
                    'Use lagged features (1 day, 7 days, 30 days ago)',
                    'Create rolling statistics with strict temporal boundaries'
                ],
                unsafe: [
                    'Using current or real-time values',
                    'Including future information in rolling windows',
                    'Creating features after target determination'
                ]
            },
            correlation: {
                safe: [
                    'Correlation with target < 0.8',
                    'Features derived from independent data sources',
                    'Engineered features using domain knowledge'
                ],
                unsafe: [
                    'Perfect or near-perfect correlation (> 0.95)',
                    'Features that are transformations of the target',
                    'Direct encoding of target information'
                ]
            },
            naming: {
                safe: [
                    'Descriptive names based on raw data',
                    'Clear temporal context (e.g., amount_30d_avg)',
                    'Domain-specific terminology'
                ],
                unsafe: [
                    'Names suggesting predictions or outcomes',
                    'Risk, score, probability in feature names',
                    'Decision, approval, status without temporal context'
                ]
            }
        };
    }
}

/**
 * 타겟 누출 방지 파이프라인
 */
export function createTargetSafePipeline() {
    const detector = new TargetLeakageDetector();
    
    return {
        detector,
        
        // 안전한 특성 파이프라인
        processFeatures: async (data, targetCol, options = {}) => {
            console.log('🔒 Processing features with target leakage protection...');
            
            // 1. 타겟 누출 감지
            const leakageReport = detector.detectTargetLeakage(data, targetCol);
            
            // 2. 안전한 데이터셋 생성
            const safeResult = detector.createSafeDataset(data, targetCol, options);
            
            // 3. 가이드라인 제공
            const guidelines = detector.getSafeFeatureGuidelines();
            
            console.log('✅ Target leakage protection completed');
            
            return {
                ...safeResult,
                guidelines,
                validation: {
                    totalRisksFound: leakageReport.riskyFeatures.length,
                    criticalRisks: leakageReport.riskyFeatures.filter(f => f.maxRisk === 'CRITICAL').length,
                    highRisks: leakageReport.riskyFeatures.filter(f => f.maxRisk === 'HIGH').length,
                    safetyScore: this.calculateSafetyScore(leakageReport, safeResult.summary)
                }
            };
        },
        
        calculateSafetyScore: (leakageReport, summary) => {
            const totalFeatures = summary.originalFeatures;
            const riskyFeatures = leakageReport.riskyFeatures.length;
            const removedFeatures = summary.removedCount;
            
            // 기본 점수 (80점)
            let score = 80;
            
            // 위험 특성 비율에 따른 감점
            const riskRatio = riskyFeatures / totalFeatures;
            score -= riskRatio * 30;
            
            // 제거된 특성 비율에 따른 가점
            const removalRatio = removedFeatures / Math.max(riskyFeatures, 1);
            score += removalRatio * 20;
            
            return Math.max(0, Math.min(100, Math.round(score)));
        }
    };
}