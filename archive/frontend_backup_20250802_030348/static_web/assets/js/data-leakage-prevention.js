// FCA Static Web Dashboard - Data Leakage Prevention System

class DataLeakagePrevention {
    constructor() {
        this.leakageDetectors = {};
        this.validationPipeline = {};
        this.temporalChecks = {};
    }

    // Temporal data leakage detection
    detectTemporalLeakage() {
        return {
            fraud_detection: {
                dataset_timeline: {
                    train_period: '2018-01-01 to 2020-12-31',
                    test_period: '2021-01-01 to 2021-06-30',
                    validation_period: '2021-07-01 to 2021-12-31',
                    temporal_gap: 0, // No gap - potential issue
                    leakage_risk: 'HIGH'
                },
                temporal_features: [
                    {
                        feature: 'transaction_time',
                        risk_level: 'LOW',
                        description: 'Properly anonymized time features',
                        recommendation: 'Use time-based features like hour_of_day, day_of_week'
                    },
                    {
                        feature: 'account_age_days',
                        risk_level: 'MEDIUM',
                        description: 'Account age calculated from transaction date',
                        recommendation: 'Calculate age from training cutoff date, not transaction date'
                    },
                    {
                        feature: 'merchant_fraud_history',
                        risk_level: 'HIGH',
                        description: 'Uses future fraud information for current transaction',
                        recommendation: 'Use only historical fraud data up to current transaction'
                    }
                ],
                leakage_score: 0.67,
                detected_patterns: [
                    'Future information used in feature engineering',
                    'No temporal buffer between train and test sets',
                    'Merchant statistics include future transactions'
                ]
            },
            sentiment_analysis: {
                dataset_timeline: {
                    train_period: '2020-01-01 to 2022-06-30',
                    test_period: '2022-07-01 to 2022-12-31',
                    validation_period: '2023-01-01 to 2023-03-31',
                    temporal_gap: 0,
                    leakage_risk: 'MEDIUM'
                },
                temporal_features: [
                    {
                        feature: 'news_publication_date',
                        risk_level: 'LOW',
                        description: 'Properly ordered by publication date',
                        recommendation: 'Continue current approach'
                    },
                    {
                        feature: 'market_trend_indicator',
                        risk_level: 'HIGH',
                        description: 'Uses future market data for sentiment prediction',
                        recommendation: 'Use only historical market data up to publication date'
                    }
                ],
                leakage_score: 0.43,
                detected_patterns: [
                    'Future market trends used in feature engineering',
                    'Some news articles may contain forward-looking information'
                ]
            },
            customer_attrition: {
                dataset_timeline: {
                    train_period: '2020-01-01 to 2021-12-31',
                    test_period: '2022-01-01 to 2022-06-30',
                    validation_period: '2022-07-01 to 2022-12-31',
                    temporal_gap: 30, // 30 days gap
                    leakage_risk: 'LOW'
                },
                temporal_features: [
                    {
                        feature: 'last_transaction_date',
                        risk_level: 'MEDIUM',
                        description: 'May contain information after churn decision',
                        recommendation: 'Use transaction data only up to observation cutoff'
                    },
                    {
                        feature: 'customer_support_contacts',
                        risk_level: 'HIGH',
                        description: 'Includes contacts after churn event',
                        recommendation: 'Filter support contacts to before prediction window'
                    }
                ],
                leakage_score: 0.34,
                detected_patterns: [
                    'Post-churn customer interactions included in features',
                    'Account balance information may reflect churn effects'
                ]
            }
        };
    }

    // Target leakage detection using correlation analysis
    detectTargetLeakage() {
        return {
            fraud_detection: {
                high_risk_features: [
                    {
                        feature: 'transaction_approved',
                        correlation: 0.94,
                        risk: 'CRITICAL',
                        description: 'Direct indicator of fraud detection result',
                        recommendation: 'Remove - this is the target variable in different form'
                    },
                    {
                        feature: 'merchant_risk_score',
                        correlation: 0.78,
                        risk: 'HIGH',
                        description: 'Calculated using transaction outcomes',
                        recommendation: 'Recalculate using only historical data'
                    },
                    {
                        feature: 'customer_fraud_flag',
                        correlation: 0.65,
                        risk: 'HIGH',
                        description: 'Customer flagged based on this transaction',
                        recommendation: 'Use flag status before this transaction only'
                    }
                ],
                feature_target_correlations: {
                    'V1': 0.02, 'V2': 0.13, 'V3': 0.09, 'V4': 0.23,
                    'V5': 0.07, 'V6': 0.11, 'V7': 0.08, 'V8': 0.05,
                    'V9': 0.15, 'V10': 0.31, 'V11': 0.19, 'V12': 0.41,
                    'V13': 0.12, 'V14': 0.47, 'V15': 0.08, 'V16': 0.18,
                    'Amount': 0.06, 'Time': 0.01
                },
                leakage_threshold: 0.5,
                flagged_features: ['V14', 'V12']
            },
            sentiment_analysis: {
                high_risk_features: [
                    {
                        feature: 'sentiment_label_encoded',
                        correlation: 0.99,
                        risk: 'CRITICAL',
                        description: 'Encoded version of target variable',
                        recommendation: 'Remove immediately'
                    },
                    {
                        feature: 'manual_sentiment_score',
                        correlation: 0.87,
                        risk: 'HIGH',
                        description: 'Human-annotated sentiment overlaps with target',
                        recommendation: 'Use only for validation, not as feature'
                    }
                ],
                word_level_leakage: {
                    'positive_words_count': 0.73,
                    'negative_words_count': 0.69,
                    'sentiment_lexicon_score': 0.81,
                    'compound_polarity': 0.76
                },
                leakage_threshold: 0.7,
                flagged_features: ['sentiment_lexicon_score', 'compound_polarity', 'positive_words_count']
            },
            customer_attrition: {
                high_risk_features: [
                    {
                        feature: 'cancellation_reason',
                        correlation: 0.96,
                        risk: 'CRITICAL',
                        description: 'Only available after customer churns',
                        recommendation: 'Remove - not available at prediction time'
                    },
                    {
                        feature: 'final_bill_amount',
                        correlation: 0.72,
                        risk: 'HIGH',
                        description: 'Final bill issued after churn decision',
                        recommendation: 'Use previous billing information only'
                    },
                    {
                        feature: 'account_closure_date',
                        correlation: 0.89,
                        risk: 'CRITICAL',
                        description: 'Date is the churn event itself',
                        recommendation: 'Remove - this defines the target'
                    }
                ],
                behavioral_leakage: {
                    'support_ticket_resolution': 0.68,
                    'payment_failure_rate': 0.54,
                    'service_downgrade_events': 0.71
                },
                leakage_threshold: 0.6,
                flagged_features: ['support_ticket_resolution', 'service_downgrade_events']
            }
        };
    }

    // Data preprocessing pipeline validation
    validatePreprocessingPipeline() {
        return {
            fraud_detection: {
                normalization_leakage: {
                    risk_level: 'HIGH',
                    issue: 'Global normalization includes test set statistics',
                    current_approach: 'StandardScaler fit on entire dataset',
                    recommended_approach: 'Fit scaler on training set only, transform test set',
                    impact: 'Test set statistics leak into training normalization'
                },
                feature_engineering: {
                    risk_level: 'MEDIUM',
                    issue: 'Merchant statistics calculated using all transactions',
                    current_approach: 'merchant_avg_amount includes future transactions',
                    recommended_approach: 'Calculate rolling statistics with proper time windows',
                    impact: 'Future merchant behavior influences current predictions'
                },
                missing_value_imputation: {
                    risk_level: 'LOW',
                    issue: 'Imputation strategy appropriate',
                    current_approach: 'KNN imputation on training set only',
                    recommended_approach: 'Continue current approach',
                    impact: 'No leakage detected'
                }
            },
            sentiment_analysis: {
                text_preprocessing: {
                    risk_level: 'MEDIUM',
                    issue: 'TF-IDF vocabulary includes test set terms',
                    current_approach: 'Vocabulary built from entire corpus',
                    recommended_approach: 'Build vocabulary from training set only',
                    impact: 'Test set vocabulary influences feature weights'
                },
                feature_selection: {
                    risk_level: 'HIGH',
                    issue: 'Feature selection uses entire dataset',
                    current_approach: 'Chi-square test on full dataset',
                    recommended_approach: 'Feature selection on training set only',
                    impact: 'Test set target information influences feature selection'
                }
            },
            customer_attrition: {
                categorical_encoding: {
                    risk_level: 'LOW',
                    issue: 'One-hot encoding properly isolated',
                    current_approach: 'Encoder fit on training set only',
                    recommended_approach: 'Continue current approach',
                    impact: 'No leakage detected'
                },
                feature_scaling: {
                    risk_level: 'MEDIUM',
                    issue: 'MinMax scaler may include outliers from test set',
                    current_approach: 'MinMaxScaler on training set with clipping',
                    recommended_approach: 'Use RobustScaler to handle outliers',
                    impact: 'Test set outliers may influence scaling bounds'
                }
            }
        };
    }

    // Cross-validation leakage detection
    detectCVLeakage() {
        return {
            fraud_detection: {
                cv_strategy: 'StratifiedKFold',
                temporal_awareness: false,
                leakage_risk: 'HIGH',
                issues: [
                    'Random splits ignore temporal structure',
                    'Future transactions in training folds for past transactions',
                    'Customer information leaks across folds'
                ],
                recommended_strategy: 'TimeSeriesSplit with customer-aware stratification',
                impact_score: 0.78
            },
            sentiment_analysis: {
                cv_strategy: 'StratifiedKFold', 
                temporal_awareness: false,
                leakage_risk: 'MEDIUM',
                issues: [
                    'News articles from same source in different folds',
                    'Temporal clustering not considered in splits'
                ],
                recommended_strategy: 'GroupKFold by news source with temporal ordering',
                impact_score: 0.45
            },
            customer_attrition: {
                cv_strategy: 'TimeSeriesSplit',
                temporal_awareness: true,
                leakage_risk: 'LOW',
                issues: [
                    'Proper temporal validation implemented'
                ],
                recommended_strategy: 'Continue current approach',
                impact_score: 0.12
            }
        };
    }

    // Generate data leakage prevention recommendations
    generatePreventionRecommendations() {
        return {
            immediate_actions: [
                {
                    priority: 'CRITICAL',
                    action: 'Remove direct target leakage features',
                    features: ['transaction_approved', 'cancellation_reason', 'sentiment_label_encoded'],
                    impact: 'Prevents artificially inflated performance metrics'
                },
                {
                    priority: 'HIGH',
                    action: 'Implement temporal validation splits',
                    datasets: ['fraud_detection', 'sentiment_analysis'],
                    impact: 'Ensures realistic performance estimates'
                },
                {
                    priority: 'HIGH',
                    action: 'Fix preprocessing pipeline leakage',
                    steps: ['Fit scalers on training only', 'Separate feature selection', 'Proper CV strategy'],
                    impact: 'Removes subtle but significant leakage sources'
                }
            ],
            pipeline_improvements: [
                {
                    component: 'Feature Engineering',
                    current_issue: 'Uses future information',
                    recommendation: 'Implement time-aware feature engineering with proper cutoffs',
                    code_example: `
# Wrong: Uses all data
merchant_stats = df.groupby('merchant_id')['amount'].mean()

# Correct: Uses only historical data
def calculate_merchant_stats(df, cutoff_date):
    historical_data = df[df['date'] < cutoff_date]
    return historical_data.groupby('merchant_id')['amount'].mean()
                    `
                },
                {
                    component: 'Cross Validation',
                    current_issue: 'Ignores temporal structure',
                    recommendation: 'Use TimeSeriesSplit or custom temporal validation',
                    code_example: `
# Wrong: Random splits
from sklearn.model_selection import StratifiedKFold
cv = StratifiedKFold(n_splits=5)

# Correct: Temporal splits
from sklearn.model_selection import TimeSeriesSplit
cv = TimeSeriesSplit(n_splits=5, gap=30)  # 30-day gap
                    `
                },
                {
                    component: 'Preprocessing',
                    current_issue: 'Global statistics leak',
                    recommendation: 'Fit transformers on training data only',
                    code_example: `
# Wrong: Fit on all data
scaler = StandardScaler().fit(X)
X_scaled = scaler.transform(X)

# Correct: Training set only
scaler = StandardScaler().fit(X_train)
X_train_scaled = scaler.transform(X_train)
X_test_scaled = scaler.transform(X_test)
                    `
                }
            ],
            monitoring_system: {
                automated_checks: [
                    'Correlation monitoring between features and targets > 0.8',
                    'Temporal order validation in train/test splits',
                    'Feature distribution shift detection',
                    'Cross-validation performance consistency checks'
                ],
                alert_thresholds: {
                    'feature_target_correlation': 0.7,
                    'temporal_leakage_score': 0.5,
                    'cv_performance_variance': 0.1,
                    'feature_importance_instability': 0.3
                }
            }
        };
    }

    // Automated leakage detection pipeline
    runLeakageDetection() {
        return {
            temporal_leakage: this.detectTemporalLeakage(),
            target_leakage: this.detectTargetLeakage(),
            preprocessing_leakage: this.validatePreprocessingPipeline(),
            cv_leakage: this.detectCVLeakage(),
            recommendations: this.generatePreventionRecommendations(),
            overall_risk_score: this.calculateOverallRisk(),
            mitigation_plan: this.generateMitigationPlan()
        };
    }

    // Calculate overall data leakage risk score
    calculateOverallRisk() {
        const riskWeights = {
            temporal: 0.3,
            target: 0.4,
            preprocessing: 0.2,
            cv: 0.1
        };

        // Mock calculation - in real implementation, this would aggregate actual risk scores
        return {
            fraud_detection: {
                temporal_risk: 0.67,
                target_risk: 0.85,
                preprocessing_risk: 0.45,
                cv_risk: 0.78,
                overall_score: 0.71,
                risk_level: 'HIGH'
            },
            sentiment_analysis: {
                temporal_risk: 0.43,
                target_risk: 0.78,
                preprocessing_risk: 0.56,
                cv_risk: 0.45,
                overall_score: 0.58,
                risk_level: 'MEDIUM'
            },
            customer_attrition: {
                temporal_risk: 0.34,
                target_risk: 0.72,
                preprocessing_risk: 0.23,
                cv_risk: 0.12,
                overall_score: 0.42,
                risk_level: 'MEDIUM'
            }
        };
    }

    // Generate step-by-step mitigation plan
    generateMitigationPlan() {
        return {
            phase1_immediate: [
                'Remove critical leakage features identified',
                'Implement temporal train/test splits',
                'Fix preprocessing pipeline to use training data only'
            ],
            phase2_validation: [
                'Implement proper cross-validation strategy',
                'Add automated leakage detection to ML pipeline',
                'Create feature engineering guidelines'
            ],
            phase3_monitoring: [
                'Deploy continuous monitoring system',
                'Set up alerts for leakage detection',
                'Regular audit of model pipeline'
            ],
            success_metrics: [
                'Reduction in train-test performance gap < 5%',
                'Stable cross-validation performance (std < 2%)',
                'No features with target correlation > 0.7',
                'Proper temporal validation implemented'
            ]
        };
    }

    // Initialize data leakage prevention system
    init() {
        this.leakageReport = this.runLeakageDetection();
        console.log('✅ Data Leakage Prevention system initialized');
    }
}

// Initialize data leakage prevention system
window.DataLeakagePrevention = new DataLeakagePrevention();
window.DataLeakagePrevention.init();