// FCA Static Web Dashboard - ML Validation and Overfitting Prevention

class MLValidation {
    constructor() {
        this.validationMetrics = {};
        this.crossValidationResults = {};
        this.dataLeakageChecks = {};
    }

    // Cross-validation results for overfitting detection
    generateCrossValidationData() {
        return {
            fraud_detection: {
                cv_folds: 5,
                train_scores: [0.9995, 0.9992, 0.9994, 0.9993, 0.9991],
                val_scores: [0.9891, 0.9887, 0.9889, 0.9892, 0.9888],
                std_train: 0.0002,
                std_val: 0.0002,
                overfitting_score: 0.0104, // train - val average
                is_overfitting: true, // > 0.01 threshold
                learning_curves: {
                    train_sizes: [0.1, 0.2, 0.4, 0.6, 0.8, 1.0],
                    train_scores: [0.892, 0.934, 0.967, 0.984, 0.996, 0.999],
                    val_scores: [0.885, 0.926, 0.952, 0.965, 0.975, 0.989],
                    gap_trend: [0.007, 0.008, 0.015, 0.019, 0.021, 0.010]
                }
            },
            sentiment_analysis: {
                cv_folds: 5,
                train_scores: [0.891, 0.887, 0.889, 0.892, 0.888],
                val_scores: [0.873, 0.869, 0.871, 0.874, 0.870],
                std_train: 0.002,
                std_val: 0.002,
                overfitting_score: 0.018,
                is_overfitting: true,
                learning_curves: {
                    train_sizes: [0.1, 0.2, 0.4, 0.6, 0.8, 1.0],
                    train_scores: [0.721, 0.768, 0.812, 0.851, 0.879, 0.891],
                    val_scores: [0.718, 0.762, 0.798, 0.834, 0.859, 0.873],
                    gap_trend: [0.003, 0.006, 0.014, 0.017, 0.020, 0.018]
                }
            },
            customer_attrition: {
                cv_folds: 5,
                train_scores: [0.912, 0.908, 0.910, 0.913, 0.909],
                val_scores: [0.894, 0.890, 0.892, 0.895, 0.891],
                std_train: 0.002,
                std_val: 0.002,
                overfitting_score: 0.018,
                is_overfitting: true,
                learning_curves: {
                    train_sizes: [0.1, 0.2, 0.4, 0.6, 0.8, 1.0],
                    train_scores: [0.743, 0.798, 0.846, 0.881, 0.903, 0.912],
                    val_scores: [0.741, 0.791, 0.832, 0.863, 0.884, 0.894],
                    gap_trend: [0.002, 0.007, 0.014, 0.018, 0.019, 0.018]
                }
            }
        };
    }

    // Data leakage detection results
    generateDataLeakageResults() {
        return {
            fraud_detection: {
                temporal_leakage: {
                    detected: false,
                    score: 0.02,
                    description: "Future information correctly excluded from training"
                },
                target_leakage: {
                    detected: true,
                    score: 0.87,
                    features_affected: ['transaction_amount_normalized', 'merchant_risk_score'],
                    description: "High correlation between features and target detected"
                },
                duplicate_records: {
                    detected: false,
                    count: 0,
                    percentage: 0.0
                },
                feature_importance_shift: {
                    detected: true,
                    shifted_features: ['V1', 'V2', 'V14'],
                    importance_change: [0.23, 0.18, 0.15]
                }
            },
            sentiment_analysis: {
                temporal_leakage: {
                    detected: false,
                    score: 0.01,
                    description: "News articles properly time-ordered"
                },
                target_leakage: {
                    detected: false,
                    score: 0.12,
                    features_affected: [],
                    description: "No direct sentiment words found in features"
                },
                duplicate_records: {
                    detected: true,
                    count: 42,
                    percentage: 0.87
                },
                feature_importance_shift: {
                    detected: false,
                    shifted_features: [],
                    importance_change: []
                }
            },
            customer_attrition: {
                temporal_leakage: {
                    detected: false,
                    score: 0.03,
                    description: "Customer data timeline properly maintained"
                },
                target_leakage: {
                    detected: true,
                    score: 0.65,
                    features_affected: ['last_transaction_date', 'account_balance_trend'],
                    description: "Features may contain post-churn information"
                },
                duplicate_records: {
                    detected: false,
                    count: 0,
                    percentage: 0.0
                },
                feature_importance_shift: {
                    detected: true,
                    shifted_features: ['tenure', 'num_products'],
                    importance_change: [0.34, 0.28]
                }
            }
        };
    }

    // Regularization and model complexity analysis
    generateRegularizationAnalysis() {
        return {
            fraud_detection: {
                l1_regularization: {
                    alpha_values: [0.001, 0.01, 0.1, 1.0, 10.0],
                    train_scores: [0.999, 0.995, 0.989, 0.967, 0.923],
                    val_scores: [0.989, 0.991, 0.989, 0.985, 0.945],
                    optimal_alpha: 0.01,
                    feature_sparsity: [98, 87, 62, 34, 12]
                },
                l2_regularization: {
                    alpha_values: [0.001, 0.01, 0.1, 1.0, 10.0],
                    train_scores: [0.999, 0.996, 0.991, 0.975, 0.935],
                    val_scores: [0.989, 0.992, 0.990, 0.987, 0.952],
                    optimal_alpha: 0.1
                },
                dropout_analysis: {
                    dropout_rates: [0.0, 0.1, 0.2, 0.3, 0.5],
                    train_scores: [0.999, 0.994, 0.988, 0.981, 0.967],
                    val_scores: [0.989, 0.991, 0.992, 0.989, 0.982],
                    optimal_rate: 0.2
                }
            },
            sentiment_analysis: {
                l1_regularization: {
                    alpha_values: [0.001, 0.01, 0.1, 1.0, 10.0],
                    train_scores: [0.891, 0.887, 0.881, 0.856, 0.812],
                    val_scores: [0.873, 0.875, 0.874, 0.871, 0.845],
                    optimal_alpha: 0.01,
                    feature_sparsity: [2847, 2156, 1634, 897, 234]
                },
                l2_regularization: {
                    alpha_values: [0.001, 0.01, 0.1, 1.0, 10.0],
                    train_scores: [0.891, 0.888, 0.883, 0.862, 0.823],
                    val_scores: [0.873, 0.874, 0.875, 0.873, 0.851],
                    optimal_alpha: 0.1
                }
            },
            customer_attrition: {
                l1_regularization: {
                    alpha_values: [0.001, 0.01, 0.1, 1.0, 10.0],
                    train_scores: [0.912, 0.908, 0.901, 0.882, 0.845],
                    val_scores: [0.894, 0.896, 0.895, 0.891, 0.867],
                    optimal_alpha: 0.01,
                    feature_sparsity: [23, 21, 18, 12, 7]
                },
                early_stopping: {
                    epochs: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
                    train_scores: [0.834, 0.867, 0.889, 0.903, 0.912, 0.918, 0.923, 0.927, 0.929, 0.931],
                    val_scores: [0.832, 0.863, 0.881, 0.892, 0.894, 0.895, 0.894, 0.893, 0.891, 0.889],
                    optimal_epoch: 50,
                    patience_triggered: 60
                }
            }
        };
    }

    // Model stability and robustness metrics
    generateStabilityMetrics() {
        return {
            bootstrap_stability: {
                fraud_detection: {
                    accuracy_std: 0.0023,
                    precision_std: 0.0156,
                    recall_std: 0.0234,
                    f1_std: 0.0187,
                    stability_score: 0.87
                },
                sentiment_analysis: {
                    accuracy_std: 0.0089,
                    precision_std: 0.0134,
                    recall_std: 0.0156,
                    f1_std: 0.0145,
                    stability_score: 0.79
                },
                customer_attrition: {
                    accuracy_std: 0.0067,
                    precision_std: 0.0123,
                    recall_std: 0.0178,
                    f1_std: 0.0149,
                    stability_score: 0.82
                }
            },
            feature_stability: {
                fraud_detection: {
                    top_features: ['V14', 'V12', 'V10', 'V4', 'V11'],
                    stability_scores: [0.94, 0.91, 0.89, 0.87, 0.85],
                    rank_correlation: 0.89
                },
                sentiment_analysis: {
                    top_features: ['word_sentiment_score', 'sentence_length', 'pos_ratio', 'neg_ratio', 'compound_score'],
                    stability_scores: [0.92, 0.78, 0.81, 0.79, 0.88],
                    rank_correlation: 0.84
                },
                customer_attrition: {
                    top_features: ['tenure', 'monthly_charges', 'total_charges', 'contract_type', 'payment_method'],
                    stability_scores: [0.96, 0.93, 0.91, 0.89, 0.86],
                    rank_correlation: 0.93
                }
            }
        };
    }

    // Generate comprehensive validation report
    generateValidationReport() {
        return {
            cross_validation: this.generateCrossValidationData(),
            data_leakage: this.generateDataLeakageResults(),
            regularization: this.generateRegularizationAnalysis(),
            stability: this.generateStabilityMetrics(),
            recommendations: this.generateRecommendations()
        };
    }

    // AI recommendations for improving model validation
    generateRecommendations() {
        return {
            fraud_detection: [
                {
                    type: "overfitting",
                    severity: "high",
                    issue: "Large train-validation gap detected (1.04%)",
                    recommendation: "Implement stronger L2 regularization (α=0.1) and increase dropout to 0.3",
                    impact: "Expected to reduce overfitting by ~40%"
                },
                {
                    type: "data_leakage",
                    severity: "high",
                    issue: "Target leakage in merchant_risk_score feature",
                    recommendation: "Remove or engineer feature to exclude post-transaction information",
                    impact: "May reduce accuracy by 2-3% but improve generalization"
                }
            ],
            sentiment_analysis: [
                {
                    type: "data_quality",
                    severity: "medium",
                    issue: "42 duplicate records detected",
                    recommendation: "Remove duplicates and re-train with stratified sampling",
                    impact: "Improved model stability and reduced variance"
                },
                {
                    type: "overfitting",
                    severity: "medium",
                    issue: "Train-validation gap of 1.8%",
                    recommendation: "Apply L1 regularization (α=0.1) and feature selection",
                    impact: "Better generalization to unseen news articles"
                }
            ],
            customer_attrition: [
                {
                    type: "data_leakage",
                    severity: "high",
                    issue: "Temporal leakage in account_balance_trend",
                    recommendation: "Use only pre-churn account balance information",
                    impact: "Critical for real-world deployment accuracy"
                },
                {
                    type: "model_complexity",
                    severity: "low",
                    issue: "Early stopping triggered at epoch 60",
                    recommendation: "Reduce learning rate and extend training with patience=10",
                    impact: "Potential 1-2% accuracy improvement"
                }
            ]
        };
    }

    // Bias and fairness analysis
    generateBiasAnalysis() {
        return {
            fraud_detection: {
                demographic_parity: {
                    overall_positive_rate: 0.501,
                    group_rates: {
                        'low_amount': 0.485,
                        'medium_amount': 0.502,
                        'high_amount': 0.515
                    },
                    max_difference: 0.030,
                    fairness_threshold: 0.05,
                    is_fair: true
                },
                equalized_odds: {
                    tpr_difference: 0.023,
                    fpr_difference: 0.011,
                    is_fair: true
                }
            },
            customer_attrition: {
                demographic_parity: {
                    overall_churn_rate: 0.201,
                    group_rates: {
                        'young': 0.234,
                        'middle_aged': 0.187,
                        'senior': 0.189
                    },
                    max_difference: 0.047,
                    fairness_threshold: 0.05,
                    is_fair: true
                }
            }
        };
    }

    // Initialize validation data
    init() {
        this.validationMetrics = this.generateValidationReport();
        this.biasAnalysis = this.generateBiasAnalysis();
        console.log('✅ ML Validation system initialized');
    }
}

// Initialize ML validation system
window.MLValidation = new MLValidation();
window.MLValidation.init();