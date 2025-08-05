#!/usr/bin/env python3
"""
Improved Fraud Detection Example
===============================

Demonstrates the enhanced fraud detection system with data leakage prevention
and comprehensive validation framework.
"""

import pandas as pd
import numpy as np
import sys
import os
sys.path.append('/root/FCA')

from fca.engines.fraud_detector import FraudDetector
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def load_sample_data():
    """Load sample fraud detection data"""
    # Create synthetic transaction data with temporal structure
    np.random.seed(42)
    n_samples = 10000
    
    # Time-based features (simulate 30 days of transactions)
    time_range = np.linspace(0, 30 * 24 * 3600, n_samples)  # 30 days in seconds
    
    # Normal transaction patterns
    amount_normal = np.random.lognormal(3, 1, int(n_samples * 0.95))
    amount_fraud = np.random.lognormal(6, 1.5, int(n_samples * 0.05))
    
    # Create features
    data = {
        'Time': time_range,
        'V1': np.random.normal(0, 1, n_samples),
        'V2': np.random.normal(0, 1, n_samples),
        'V3': np.random.normal(0, 1, n_samples),
        'V4': np.random.normal(0, 1, n_samples),
        'V5': np.random.normal(0, 1, n_samples),
        'Amount': np.concatenate([amount_normal, amount_fraud])
    }
    
    # Create target (fraud labels)
    labels = np.concatenate([
        np.zeros(int(n_samples * 0.95)),  # Normal transactions
        np.ones(int(n_samples * 0.05))   # Fraud transactions
    ])
    
    # Shuffle the data
    indices = np.random.permutation(n_samples)
    for key in data:
        data[key] = data[key][indices]
    labels = labels[indices]
    
    df = pd.DataFrame(data)
    df['Class'] = labels.astype(int)
    
    return df

def demonstrate_improved_fraud_detection():
    """Demonstrate the improved fraud detection capabilities"""
    
    print("🚀 Improved Fraud Detection System Demo")
    print("=" * 50)
    
    # Load sample data
    logger.info("Loading sample transaction data...")
    df = load_sample_data()
    print(f"📊 Dataset: {len(df):,} transactions, {df['Class'].mean()*100:.2f}% fraud rate")
    
    # Initialize improved fraud detector
    logger.info("Initializing improved fraud detector...")
    config = {
        'random_forest': {
            'n_estimators': 50,  # Reduced for demo
            'max_depth': 8,
            'random_state': 42
        },
        'logistic_regression': {
            'random_state': 42,
            'max_iter': 500
        },
        'isolation_forest': {
            'contamination': 0.05,
            'random_state': 42
        }
    }
    
    detector = FraudDetector(config=config)
    
    # Train with temporal split to prevent data leakage
    logger.info("Training with temporal split to prevent data leakage...")
    results = detector.train(df, target_column='Class', use_temporal_split=True)
    
    print("\n📈 Training Results:")
    print("-" * 30)
    
    # Display model performance
    for model_name in ['random_forest', 'logistic_regression']:
        model_results = results[model_name]
        print(f"\n🤖 {model_name.replace('_', ' ').title()}:")
        print(f"  Accuracy: {model_results['accuracy']:.4f}")
        print(f"  AUC-ROC: {model_results['auc_roc']:.4f}")
        
        cv_scores = model_results['cross_val_scores']
        print(f"  CV Mean: {np.mean(cv_scores):.4f} (±{np.std(cv_scores):.4f})")
        
        # Check for overfitting
        learning_curve = model_results.get('learning_curve', {})
        if learning_curve and 'overfitting_gap' in learning_curve:
            final_gap = learning_curve['overfitting_gap'][-1]
            print(f"  Overfitting Gap: {final_gap:.4f}")
    
    # Display advanced validation results
    if 'advanced_validation' in results:
        validation = results['advanced_validation']
        print(f"\n🔍 Advanced Validation Analysis:")
        print("-" * 30)
        
        # Validation score
        validation_score = validation['validation_report']['overall_score']
        print(f"Overall Validation Score: {validation_score:.1f}/100")
        
        # Temporal validation
        temporal = validation['temporal_validation']
        if 'metrics' in temporal:
            auc_metrics = temporal['metrics'].get('roc_auc', {})
            print(f"Temporal AUC: {auc_metrics.get('test_mean', 0):.4f} (±{auc_metrics.get('test_std', 0):.4f})")
            print(f"Overfitting Risk: {temporal.get('overfitting_risk', 'UNKNOWN')}")
        
        # Data leakage analysis
        leakage = validation['leakage_detection']
        print(f"Data Leakage Risk: {leakage.get('overall_risk', 'UNKNOWN')}")
        
        high_risk_features = leakage.get('feature_leakage', {}).get('high_risk_features', [])
        if high_risk_features:
            print(f"High-risk features: {', '.join(high_risk_features[:3])}")
        
        # Recommendations
        recommendations = validation['validation_report'].get('recommendations', [])
        if recommendations:
            print(f"\n💡 Recommendations:")
            for rec in recommendations[:3]:
                print(f"  • {rec}")
    
    # Test overfitting detection
    print(f"\n🎯 Overfitting Analysis:")
    print("-" * 30)
    
    overfitting_report = detector.detect_overfitting()
    print(f"Overall Risk: {overfitting_report['overall_risk']}")
    
    for model_name, model_analysis in overfitting_report['models'].items():
        print(f"\n{model_name.replace('_', ' ').title()}:")
        print(f"  Risk Level: {model_analysis['risk_level']}")
        print(f"  Train-Val Gap: {model_analysis['train_val_gap']:.4f}")
        print(f"  CV Std: {model_analysis['cv_std']:.4f}")
        
        if model_analysis['issues']:
            print(f"  Issues: {'; '.join(model_analysis['issues'])}")
    
    # Test prediction with new data
    print(f"\n🔮 Testing Predictions:")
    print("-" * 30)
    
    # Create test transactions
    test_data = pd.DataFrame({
        'Time': [3600, 7200, 10800],  # Different times
        'V1': [0.5, -1.2, 2.1],
        'V2': [1.1, 0.3, -0.8],
        'V3': [-0.2, 1.5, 0.7],
        'V4': [0.8, -0.5, 1.2],
        'V5': [-1.1, 0.9, -0.3],
        'Amount': [100.0, 5000.0, 25000.0]  # Low, medium, high amounts
    })
    
    predictions = detector.predict(test_data)
    
    for i, prob in enumerate(predictions['ensemble_probability']):
        risk_level = predictions['risk_levels'][i]
        amount = test_data.iloc[i]['Amount']
        print(f"  Transaction ${amount:,.0f}: {prob:.3f} fraud probability ({risk_level} risk)")
    
    # Plot learning curves (if available)
    print(f"\n📊 Generating Visualizations...")
    print("-" * 30)
    
    try:
        detector.plot_learning_curve('random_forest', '/root/FCA/docs/improved_fraud_learning_curve.png')
        print("✅ Learning curve saved to /root/FCA/docs/improved_fraud_learning_curve.png")
    except Exception as e:
        print(f"⚠️  Could not generate learning curve: {e}")
    
    # Plot validation results
    try:
        if 'advanced_validation' in results:
            detector.validation_framework.plot_validation_results(
                results['advanced_validation']['temporal_validation'],
                '/root/FCA/docs/improved_validation_analysis.png'
            )
            print("✅ Validation analysis saved to /root/FCA/docs/improved_validation_analysis.png")
    except Exception as e:
        print(f"⚠️  Could not generate validation plot: {e}")
    
    print(f"\n🎉 Improved Fraud Detection Demo Complete!")
    print(f"Key improvements:")
    print(f"  ✅ Temporal data split to prevent leakage")
    print(f"  ✅ Feature statistics calculated on training data only")
    print(f"  ✅ Comprehensive overfitting detection")
    print(f"  ✅ Advanced validation framework")
    print(f"  ✅ Data leakage detection and prevention")

if __name__ == "__main__":
    demonstrate_improved_fraud_detection()