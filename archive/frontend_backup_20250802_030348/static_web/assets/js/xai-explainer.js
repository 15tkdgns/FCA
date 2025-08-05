// FCA Static Web Dashboard - XAI (Explainable AI) Components

class XAIExplainer {
    constructor() {
        this.shapeValues = {};
        this.featureImportance = {};
        this.localExplanations = {};
        this.globalExplanations = {};
    }

    // SHAP (SHapley Additive exPlanations) values
    generateSHAPValues() {
        return {
            fraud_detection: {
                global_shap: {
                    feature_names: ['V14', 'V12', 'V10', 'V4', 'V11', 'V2', 'V3', 'V16', 'V18', 'Amount'],
                    mean_shap_values: [0.342, 0.298, 0.234, 0.189, 0.167, 0.145, 0.134, 0.123, 0.112, 0.098],
                    positive_impact: [0.421, 0.356, 0.289, 0.234, 0.201, 0.178, 0.167, 0.145, 0.134, 0.123],
                    negative_impact: [-0.398, -0.312, -0.267, -0.189, -0.156, -0.134, -0.123, -0.112, -0.101, -0.089]
                },
                local_examples: [
                    {
                        prediction: 0.847,
                        true_label: 1,
                        features: {'V14': -5.23, 'V12': 2.45, 'V10': -1.87, 'Amount': 149.62},
                        shap_values: {'V14': 0.234, 'V12': 0.187, 'V10': -0.145, 'Amount': 0.098},
                        base_value: 0.501
                    },
                    {
                        prediction: 0.156,
                        true_label: 0,
                        features: {'V14': 1.34, 'V12': -0.87, 'V10': 0.45, 'Amount': 67.23},
                        shap_values: {'V14': -0.156, 'V12': -0.123, 'V10': 0.089, 'Amount': -0.034},
                        base_value: 0.501
                    }
                ]
            },
            sentiment_analysis: {
                global_shap: {
                    feature_names: ['compound_score', 'pos_ratio', 'neg_ratio', 'sentence_length', 'exclamation_count', 'question_count', 'capital_ratio', 'word_count'],
                    mean_shap_values: [0.456, 0.234, 0.198, 0.134, 0.098, 0.087, 0.076, 0.065],
                    positive_impact: [0.523, 0.298, 0.234, 0.167, 0.123, 0.109, 0.098, 0.087],
                    negative_impact: [-0.489, -0.267, -0.201, -0.145, -0.098, -0.076, -0.065, -0.054]
                },
                word_importance: {
                    positive_words: ['excellent', 'growth', 'profit', 'success', 'strong', 'bullish', 'gain', 'rise'],
                    negative_words: ['loss', 'decline', 'weak', 'bearish', 'fall', 'crisis', 'risk', 'drop'],
                    neutral_words: ['company', 'market', 'stock', 'price', 'trading', 'volume', 'analyst', 'report'],
                    importance_scores: {
                        'excellent': 0.234, 'loss': -0.198, 'growth': 0.189, 'decline': -0.167,
                        'profit': 0.156, 'weak': -0.134, 'company': 0.012, 'market': 0.008
                    }
                }
            },
            customer_attrition: {
                global_shap: {
                    feature_names: ['tenure', 'monthly_charges', 'total_charges', 'contract_type', 'payment_method', 'internet_service', 'phone_service', 'tech_support'],
                    mean_shap_values: [0.387, 0.298, 0.234, 0.189, 0.167, 0.145, 0.123, 0.098],
                    positive_impact: [0.456, 0.345, 0.289, 0.234, 0.201, 0.178, 0.145, 0.123],
                    negative_impact: [-0.423, -0.312, -0.267, -0.198, -0.156, -0.134, -0.109, -0.087]
                },
                customer_segments: {
                    'new_customers': {
                        key_factors: ['monthly_charges', 'contract_type', 'payment_method'],
                        churn_probability: 0.312,
                        main_drivers: ['high_monthly_charges', 'month_to_month_contract']
                    },
                    'long_term_customers': {
                        key_factors: ['total_charges', 'tech_support', 'internet_service'],
                        churn_probability: 0.089,
                        main_drivers: ['poor_tech_support', 'fiber_optic_issues']
                    }
                }
            }
        };
    }

    // LIME (Local Interpretable Model-agnostic Explanations)
    generateLIMEExplanations() {
        return {
            fraud_detection: {
                sample_explanations: [
                    {
                        instance_id: 'fraud_001',
                        prediction: 0.923,
                        explanation: [
                            {feature: 'V14 <= -3.2', weight: 0.234, contribution: 'fraud'},
                            {feature: 'V12 > 1.8', weight: 0.189, contribution: 'fraud'},
                            {feature: 'Amount <= 100', weight: -0.087, contribution: 'normal'},
                            {feature: 'V10 <= -2.1', weight: 0.156, contribution: 'fraud'}
                        ]
                    }
                ]
            },
            sentiment_analysis: {
                sample_explanations: [
                    {
                        instance_id: 'news_001',
                        text: "The company reported excellent quarterly profits with strong growth",
                        prediction: 0.867,
                        explanation: [
                            {word: 'excellent', weight: 0.298, sentiment: 'positive'},
                            {word: 'profits', weight: 0.234, sentiment: 'positive'},
                            {word: 'strong', weight: 0.189, sentiment: 'positive'},
                            {word: 'growth', weight: 0.167, sentiment: 'positive'},
                            {word: 'company', weight: 0.012, sentiment: 'neutral'}
                        ]
                    }
                ]
            }
        };
    }

    // Permutation Feature Importance
    generatePermutationImportance() {
        return {
            fraud_detection: {
                baseline_accuracy: 0.9991,
                feature_importance: [
                    {feature: 'V14', importance: 0.0234, drop_accuracy: 0.9757},
                    {feature: 'V12', importance: 0.0189, drop_accuracy: 0.9802},
                    {feature: 'V10', importance: 0.0156, drop_accuracy: 0.9835},
                    {feature: 'V4', importance: 0.0134, drop_accuracy: 0.9857},
                    {feature: 'V11', importance: 0.0123, drop_accuracy: 0.9868},
                    {feature: 'Amount', importance: 0.0098, drop_accuracy: 0.9893}
                ]
            },
            sentiment_analysis: {
                baseline_accuracy: 0.873,
                feature_importance: [
                    {feature: 'compound_score', importance: 0.087, drop_accuracy: 0.786},
                    {feature: 'pos_ratio', importance: 0.067, drop_accuracy: 0.806},
                    {feature: 'neg_ratio', importance: 0.054, drop_accuracy: 0.819},
                    {feature: 'sentence_length', importance: 0.032, drop_accuracy: 0.841},
                    {feature: 'exclamation_count', importance: 0.021, drop_accuracy: 0.852}
                ]
            },
            customer_attrition: {
                baseline_accuracy: 0.894,
                feature_importance: [
                    {feature: 'tenure', importance: 0.098, drop_accuracy: 0.796},
                    {feature: 'monthly_charges', importance: 0.076, drop_accuracy: 0.818},
                    {feature: 'total_charges', importance: 0.065, drop_accuracy: 0.829},
                    {feature: 'contract_type', importance: 0.054, drop_accuracy: 0.840},
                    {feature: 'payment_method', importance: 0.043, drop_accuracy: 0.851}
                ]
            }
        };
    }

    // Model Decision Boundaries
    generateDecisionBoundaries() {
        return {
            fraud_detection: {
                decision_tree_rules: [
                    {
                        rule: "IF V14 <= -3.2 AND V12 > 1.8 THEN Fraud (confidence: 0.89)",
                        support: 2847,
                        precision: 0.91
                    },
                    {
                        rule: "IF V10 <= -2.1 AND V4 > 2.5 THEN Fraud (confidence: 0.84)",
                        support: 1923,
                        precision: 0.87
                    },
                    {
                        rule: "IF Amount > 500 AND V16 <= -1.5 THEN Normal (confidence: 0.78)",
                        support: 3421,
                        precision: 0.82
                    }
                ],
                feature_interactions: [
                    {
                        features: ['V14', 'V12'],
                        interaction_strength: 0.234,
                        description: 'Strong negative correlation indicates fraud pattern'
                    },
                    {
                        features: ['V10', 'Amount'],
                        interaction_strength: 0.189,
                        description: 'Low amounts with specific V10 values suggest normal transactions'
                    }
                ]
            }
        };
    }

    // Counterfactual Explanations
    generateCounterfactualExplanations() {
        return {
            fraud_detection: {
                examples: [
                    {
                        original: {
                            features: {'V14': -5.23, 'V12': 2.45, 'Amount': 149.62},
                            prediction: 0.89,
                            label: 'Fraud'
                        },
                        counterfactual: {
                            features: {'V14': -1.23, 'V12': 0.45, 'Amount': 149.62},
                            prediction: 0.12,
                            label: 'Normal',
                            changes: ['V14: -5.23 → -1.23', 'V12: 2.45 → 0.45']
                        }
                    }
                ]
            },
            customer_attrition: {
                examples: [
                    {
                        original: {
                            features: {'tenure': 2, 'monthly_charges': 89.5, 'contract_type': 'Month-to-month'},
                            prediction: 0.78,
                            label: 'Will Churn'
                        },
                        counterfactual: {
                            features: {'tenure': 2, 'monthly_charges': 49.5, 'contract_type': 'Two year'},
                            prediction: 0.23,
                            label: 'Will Stay',
                            changes: ['monthly_charges: 89.5 → 49.5', 'contract_type: Month-to-month → Two year']
                        }
                    }
                ]
            }
        };
    }

    // Model Attention Weights (for neural networks)
    generateAttentionWeights() {
        return {
            sentiment_analysis: {
                attention_maps: [
                    {
                        sentence: "The company reported excellent quarterly results with strong growth prospects",
                        tokens: ["The", "company", "reported", "excellent", "quarterly", "results", "with", "strong", "growth", "prospects"],
                        attention_weights: [0.02, 0.05, 0.03, 0.28, 0.08, 0.15, 0.02, 0.23, 0.19, 0.14],
                        prediction: 'Positive',
                        confidence: 0.91
                    },
                    {
                        sentence: "Market uncertainty and declining sales pose significant risks for investors",
                        tokens: ["Market", "uncertainty", "and", "declining", "sales", "pose", "significant", "risks", "for", "investors"],
                        attention_weights: [0.08, 0.22, 0.01, 0.26, 0.18, 0.03, 0.15, 0.24, 0.02, 0.09],
                        prediction: 'Negative',
                        confidence: 0.87
                    }
                ]
            }
        };
    }

    // Uncertainty Quantification
    generateUncertaintyMetrics() {
        return {
            fraud_detection: {
                prediction_intervals: [
                    {confidence: 0.68, lower: 0.834, upper: 0.896},
                    {confidence: 0.95, lower: 0.812, upper: 0.923},
                    {confidence: 0.99, lower: 0.798, upper: 0.945}
                ],
                epistemic_uncertainty: 0.034,
                aleatoric_uncertainty: 0.021,
                total_uncertainty: 0.055
            },
            sentiment_analysis: {
                prediction_intervals: [
                    {confidence: 0.68, lower: 0.798, upper: 0.856},
                    {confidence: 0.95, lower: 0.774, upper: 0.879},
                    {confidence: 0.99, lower: 0.756, upper: 0.901}
                ],
                epistemic_uncertainty: 0.045,
                aleatoric_uncertainty: 0.032,
                total_uncertainty: 0.077
            },
            customer_attrition: {
                prediction_intervals: [
                    {confidence: 0.68, lower: 0.823, upper: 0.887},
                    {confidence: 0.95, lower: 0.801, upper: 0.912},
                    {confidence: 0.99, lower: 0.789, upper: 0.934}
                ],
                epistemic_uncertainty: 0.028,
                aleatoric_uncertainty: 0.019,
                total_uncertainty: 0.047
            }
        };
    }

    // Generate comprehensive XAI report
    generateXAIReport() {
        return {
            shap_values: this.generateSHAPValues(),
            lime_explanations: this.generateLIMEExplanations(),
            permutation_importance: this.generatePermutationImportance(),
            decision_boundaries: this.generateDecisionBoundaries(),
            counterfactuals: this.generateCounterfactualExplanations(),
            attention_weights: this.generateAttentionWeights(),
            uncertainty: this.generateUncertaintyMetrics()
        };
    }

    // Initialize XAI system
    init() {
        this.explainabilityData = this.generateXAIReport();
        console.log('✅ XAI Explainer system initialized');
    }
}

// Initialize XAI system
window.XAIExplainer = new XAIExplainer();
window.XAIExplainer.init();