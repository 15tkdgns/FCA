#!/usr/bin/env python3
"""
Quick Fraud Detection Models - Optimized for faster execution
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score
import warnings
warnings.filterwarnings('ignore')

def quick_model_analysis(dataset_path, target_col, dataset_name, sample_size=5000):
    """Quick model analysis for a single dataset"""
    print(f"\n🔧 Analyzing {dataset_name}")
    
    try:
        # Load dataset
        df = pd.read_csv(dataset_path)
        print(f"📊 Original size: {len(df):,} rows")
        
        # Sample for quick analysis
        if len(df) > sample_size:
            df = df.sample(sample_size, random_state=42)
            print(f"📊 Sampled to: {len(df):,} rows")
        
        # Basic preprocessing
        if target_col not in df.columns:
            print(f"❌ Target column '{target_col}' not found")
            return None
        
        # Prepare features
        X = df.drop(columns=[target_col])
        y = df[target_col]
        
        # Handle categorical features
        categorical_cols = X.select_dtypes(include=['object']).columns
        if len(categorical_cols) > 0:
            le = LabelEncoder()
            for col in categorical_cols:
                X[col] = le.fit_transform(X[col].astype(str))
        
        # Fill missing values
        X = X.fillna(X.median())
        
        print(f"🎯 Features: {X.shape[1]}, Fraud rate: {y.mean()*100:.2f}%")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Train models
        models = {
            'Logistic Regression': LogisticRegression(random_state=42, max_iter=1000),
            'Random Forest': RandomForestClassifier(n_estimators=50, random_state=42, 
                                                   class_weight='balanced', n_jobs=-1)
        }
        
        results = {}
        
        for model_name, model in models.items():
            print(f"   🤖 Training {model_name}...")
            
            # Train
            if model_name == 'Logistic Regression':
                model.fit(X_train_scaled, y_train)
                y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]
            else:
                model.fit(X_train, y_train)
                y_pred_proba = model.predict_proba(X_test)[:, 1]
            
            # Evaluate
            auc_score = roc_auc_score(y_test, y_pred_proba)
            
            # Predictions
            y_pred = (y_pred_proba > 0.5).astype(int)
            report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
            
            results[model_name] = {
                'auc_roc': auc_score,
                'precision': report.get('1', {}).get('precision', 0),
                'recall': report.get('1', {}).get('recall', 0),
                'f1_score': report.get('1', {}).get('f1-score', 0)
            }
            
            print(f"      ✅ AUC: {auc_score:.3f}, F1: {results[model_name]['f1_score']:.3f}")
        
        return results
        
    except Exception as e:
        print(f"❌ Error processing {dataset_name}: {e}")
        return None

def main():
    """Main execution"""
    print("🚀 Quick Fraud Detection Analysis")
    print("="*60)
    
    # Dataset configurations
    datasets = {
        'Credit Card Fraud 2023': {
            'path': '/root/FCA/data/credit_card_fraud_2023/creditcard_2023_processed.csv',
            'target': 'Class'
        },
        'HF Credit Card Fraud': {
            'path': '/root/FCA/data/hf_creditcard_fraud/hf_creditcard_processed.csv',
            'target': 'is_fraud'
        },
        'Dhanush Fraud': {
            'path': '/root/FCA/data/dhanush_fraud/dhanush_fraud_processed.csv',
            'target': 'fraud'
        },
        'WAMC Fraud': {
            'path': '/root/FCA/data/wamc_fraud/wamc_fraud_processed.csv',
            'target': 'Class'
        },
        'Incribo Fraud': {
            'path': '/root/FCA/data/incribo_fraud/incribo_fraud_processed.csv',
            'target': 'Fraud Flag or Label'
        }
    }
    
    all_results = {}
    
    # Analyze each dataset
    for name, config in datasets.items():
        result = quick_model_analysis(
            config['path'], 
            config['target'], 
            name,
            sample_size=5000  # Small sample for quick execution
        )
        if result:
            all_results[name] = result
    
    # Summary
    if all_results:
        print(f"\n📊 FRAUD DETECTION MODEL COMPARISON")
        print("="*80)
        
        comparison_data = []
        for dataset, models in all_results.items():
            for model, metrics in models.items():
                comparison_data.append({
                    'Dataset': dataset,
                    'Model': model,
                    'AUC-ROC': f"{metrics['auc_roc']:.3f}",
                    'Precision': f"{metrics['precision']:.3f}",
                    'Recall': f"{metrics['recall']:.3f}",
                    'F1-Score': f"{metrics['f1_score']:.3f}"
                })
        
        comparison_df = pd.DataFrame(comparison_data)
        print(comparison_df.to_string(index=False))
        
        # Save results
        comparison_df.to_csv('/root/FCA/docs/quick_model_results.csv', index=False)
        print(f"\n✅ Results saved to /root/FCA/docs/quick_model_results.csv")
    
    print(f"\n🎉 Quick Analysis Complete!")

if __name__ == "__main__":
    main()