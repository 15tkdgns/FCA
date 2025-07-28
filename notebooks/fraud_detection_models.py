#!/usr/bin/env python3
"""
Fraud Detection Models for FCA Project
Comprehensive fraud detection modeling with multiple datasets and techniques
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, roc_curve
from sklearn.metrics import precision_recall_curve, average_precision_score
from imblearn.over_sampling import SMOTE
from imblearn.under_sampling import RandomUnderSampler
import warnings
warnings.filterwarnings('ignore')

class FraudDetectionModeler:
    def __init__(self, data_dir="/root/FCA/data"):
        self.data_dir = data_dir
        self.datasets = {}
        self.models = {}
        self.results = {}
        
    def load_fraud_datasets(self):
        """Load fraud detection datasets"""
        fraud_configs = {
            'credit_card_fraud_2023': {
                'path': 'credit_card_fraud_2023/creditcard_2023_processed.csv',
                'target': 'Class',
                'type': 'balanced'
            },
            'hf_creditcard_fraud': {
                'path': 'hf_creditcard_fraud/hf_creditcard_processed.csv', 
                'target': 'is_fraud',
                'type': 'highly_imbalanced'
            },
            'dhanush_fraud': {
                'path': 'dhanush_fraud/dhanush_fraud_processed.csv',
                'target': 'fraud', 
                'type': 'moderately_imbalanced'
            },
            'wamc_fraud': {
                'path': 'wamc_fraud/wamc_fraud_processed.csv',
                'target': 'Class',
                'type': 'extremely_imbalanced'
            },
            'incribo_fraud': {
                'path': 'incribo_fraud/incribo_fraud_processed.csv',
                'target': 'Fraud Flag or Label',
                'type': 'balanced'
            }
        }
        
        print("🔄 Loading fraud detection datasets...")
        for name, config in fraud_configs.items():
            try:
                full_path = f"{self.data_dir}/{config['path']}"
                df = pd.read_csv(full_path)
                
                # Basic preprocessing
                df = self._preprocess_dataset(df, name, config['target'])
                
                self.datasets[name] = {
                    'data': df,
                    'target': config['target'],
                    'type': config['type']
                }
                
                fraud_rate = df[config['target']].mean() * 100
                print(f"✅ {name}: {len(df):,} rows, {fraud_rate:.2f}% fraud rate ({config['type']})")
                
            except Exception as e:
                print(f"❌ Failed to load {name}: {e}")
        
        return self.datasets
    
    def _preprocess_dataset(self, df, name, target_col):
        """Preprocess individual dataset"""
        # Handle missing values
        if df.isnull().sum().sum() > 0:
            # For numeric columns, fill with median
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())
            
            # For categorical columns, fill with mode or 'Unknown'
            categorical_cols = df.select_dtypes(include=['object']).columns
            for col in categorical_cols:
                if col != target_col:
                    df[col] = df[col].fillna(df[col].mode().iloc[0] if len(df[col].mode()) > 0 else 'Unknown')
        
        # Handle specific dataset preprocessing
        if name == 'hf_creditcard_fraud':
            # Convert categorical columns to numeric if needed
            le = LabelEncoder()
            categorical_cols = df.select_dtypes(include=['object']).columns
            for col in categorical_cols:
                if col != target_col:
                    df[col] = le.fit_transform(df[col].astype(str))
        
        # Ensure target is binary
        if target_col in df.columns:
            if df[target_col].dtype == 'object':
                # Convert categorical target to binary
                df[target_col] = (df[target_col] == '1').astype(int)
            else:
                df[target_col] = df[target_col].astype(int)
        
        return df
    
    def build_models_for_dataset(self, dataset_name, sample_size=None):
        """Build multiple models for a single dataset"""
        print(f"\\n🔧 Building models for {dataset_name}")
        
        if dataset_name not in self.datasets:
            print(f"❌ Dataset {dataset_name} not found")
            return
        
        dataset_info = self.datasets[dataset_name]
        df = dataset_info['data']
        target_col = dataset_info['target']
        
        # Sample data if too large
        if sample_size and len(df) > sample_size:
            df = df.sample(sample_size, random_state=42)
            print(f"📊 Sampled {sample_size:,} rows for faster training")
        
        # Prepare features and target
        X = df.drop(columns=[target_col])
        y = df[target_col]
        
        # Handle categorical features
        categorical_cols = X.select_dtypes(include=['object']).columns
        if len(categorical_cols) > 0:
            le = LabelEncoder()
            for col in categorical_cols:
                X[col] = le.fit_transform(X[col].astype(str))
        
        print(f"📋 Features: {X.shape[1]}, Samples: {len(X):,}")
        print(f"🎯 Fraud rate: {y.mean()*100:.2f}%")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Define models
        models = {
            'Logistic Regression': LogisticRegression(random_state=42, max_iter=1000),
            'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1),
            'Gradient Boosting': GradientBoostingClassifier(random_state=42)
        }
        
        results = {}
        
        # Train and evaluate each model
        for model_name, model in models.items():
            print(f"\\n🤖 Training {model_name}...")
            
            try:
                # Handle imbalanced data with SMOTE for some models
                if dataset_info['type'] in ['highly_imbalanced', 'extremely_imbalanced'] and model_name != 'Random Forest':
                    smote = SMOTE(random_state=42)
                    X_train_balanced, y_train_balanced = smote.fit_resample(X_train_scaled, y_train)
                    model.fit(X_train_balanced, y_train_balanced)
                    print(f"   ⚖️ Applied SMOTE balancing")
                else:
                    if model_name == 'Random Forest':
                        model.set_params(class_weight='balanced')
                    model.fit(X_train_scaled, y_train)
                
                # Predictions
                y_pred = model.predict(X_test_scaled)
                y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]
                
                # Metrics
                auc_score = roc_auc_score(y_test, y_pred_proba)
                avg_precision = average_precision_score(y_test, y_pred_proba)
                
                # Classification report
                report = classification_report(y_test, y_pred, output_dict=True)
                
                results[model_name] = {
                    'auc_roc': auc_score,
                    'avg_precision': avg_precision,
                    'precision': report['1']['precision'],
                    'recall': report['1']['recall'],
                    'f1_score': report['1']['f1-score'],
                    'support': report['1']['support'],
                    'y_test': y_test,
                    'y_pred': y_pred,
                    'y_pred_proba': y_pred_proba
                }
                
                print(f"   ✅ AUC-ROC: {auc_score:.4f}, Precision: {report['1']['precision']:.4f}, Recall: {report['1']['recall']:.4f}")
                
            except Exception as e:
                print(f"   ❌ Failed to train {model_name}: {e}")
        
        self.results[dataset_name] = results
        return results
    
    def visualize_model_performance(self, dataset_name):
        """Create visualizations for model performance"""
        if dataset_name not in self.results:
            print(f"❌ No results found for {dataset_name}")
            return
        
        results = self.results[dataset_name]
        
        # Create subplots
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        fig.suptitle(f'Model Performance: {dataset_name.replace("_", " ").title()}', fontsize=16)
        
        # 1. ROC Curves
        ax1 = axes[0, 0]
        for model_name, result in results.items():
            if 'y_test' in result:
                fpr, tpr, _ = roc_curve(result['y_test'], result['y_pred_proba'])
                auc = result['auc_roc']
                ax1.plot(fpr, tpr, label=f'{model_name} (AUC = {auc:.3f})')
        
        ax1.plot([0, 1], [0, 1], 'k--', alpha=0.5)
        ax1.set_xlabel('False Positive Rate')
        ax1.set_ylabel('True Positive Rate')
        ax1.set_title('ROC Curves')
        ax1.legend()
        ax1.grid(True, alpha=0.3)
        
        # 2. Precision-Recall Curves
        ax2 = axes[0, 1]
        for model_name, result in results.items():
            if 'y_test' in result:
                precision, recall, _ = precision_recall_curve(result['y_test'], result['y_pred_proba'])
                avg_precision = result['avg_precision']
                ax2.plot(recall, precision, label=f'{model_name} (AP = {avg_precision:.3f})')
        
        ax2.set_xlabel('Recall')
        ax2.set_ylabel('Precision')
        ax2.set_title('Precision-Recall Curves')
        ax2.legend()
        ax2.grid(True, alpha=0.3)
        
        # 3. Performance Metrics Comparison
        ax3 = axes[1, 0]
        metrics = ['auc_roc', 'avg_precision', 'precision', 'recall', 'f1_score']
        model_names = list(results.keys())
        
        x = np.arange(len(metrics))
        width = 0.25
        
        for i, model_name in enumerate(model_names):
            values = [results[model_name].get(metric, 0) for metric in metrics]
            ax3.bar(x + i*width, values, width, label=model_name)
        
        ax3.set_xlabel('Metrics')
        ax3.set_ylabel('Score')
        ax3.set_title('Performance Metrics Comparison')
        ax3.set_xticks(x + width)
        ax3.set_xticklabels(metrics, rotation=45)
        ax3.legend()
        ax3.grid(True, alpha=0.3)
        
        # 4. Confusion Matrix (best model)
        ax4 = axes[1, 1]
        best_model = max(results.keys(), key=lambda k: results[k]['f1_score'])
        cm = confusion_matrix(results[best_model]['y_test'], results[best_model]['y_pred'])
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=ax4)
        ax4.set_title(f'Confusion Matrix: {best_model}')
        ax4.set_xlabel('Predicted')
        ax4.set_ylabel('Actual')
        
        plt.tight_layout()
        plt.savefig(f'/root/FCA/docs/model_performance_{dataset_name}.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        print(f"✅ Performance visualization saved to /root/FCA/docs/model_performance_{dataset_name}.png")
    
    def compare_datasets_performance(self):
        """Compare model performance across different datasets"""
        if not self.results:
            print("❌ No results to compare")
            return
        
        print("\\n📊 Comparing performance across datasets...")
        
        # Create comparison dataframe
        comparison_data = []
        
        for dataset_name, models in self.results.items():
            dataset_type = self.datasets[dataset_name]['type']
            fraud_rate = self.datasets[dataset_name]['data'][self.datasets[dataset_name]['target']].mean() * 100
            
            for model_name, metrics in models.items():
                comparison_data.append({
                    'Dataset': dataset_name,
                    'Dataset Type': dataset_type,
                    'Fraud Rate (%)': f"{fraud_rate:.2f}%",
                    'Model': model_name,
                    'AUC-ROC': metrics['auc_roc'],
                    'Precision': metrics['precision'],
                    'Recall': metrics['recall'],
                    'F1-Score': metrics['f1_score']
                })
        
        comparison_df = pd.DataFrame(comparison_data)
        
        # Display results
        print("\\n🏆 MODEL PERFORMANCE COMPARISON")
        print("="*80)
        print(comparison_df.round(4).to_string(index=False))
        
        # Save comparison
        comparison_df.to_csv('/root/FCA/docs/model_comparison.csv', index=False)
        print("\\n✅ Comparison saved to /root/FCA/docs/model_comparison.csv")
        
        # Create comparison visualization
        plt.figure(figsize=(15, 10))
        
        # F1-Score comparison
        plt.subplot(2, 2, 1)
        pivot_f1 = comparison_df.pivot(index='Dataset', columns='Model', values='F1-Score')
        sns.heatmap(pivot_f1, annot=True, fmt='.3f', cmap='YlOrRd')
        plt.title('F1-Score Comparison Across Datasets')
        plt.xticks(rotation=45)
        plt.yticks(rotation=0)
        
        # AUC-ROC comparison
        plt.subplot(2, 2, 2)
        pivot_auc = comparison_df.pivot(index='Dataset', columns='Model', values='AUC-ROC')
        sns.heatmap(pivot_auc, annot=True, fmt='.3f', cmap='YlGnBu')
        plt.title('AUC-ROC Comparison Across Datasets')
        plt.xticks(rotation=45)
        plt.yticks(rotation=0)
        
        # Precision vs Recall scatter
        plt.subplot(2, 2, 3)
        for model in comparison_df['Model'].unique():
            model_data = comparison_df[comparison_df['Model'] == model]
            plt.scatter(model_data['Recall'], model_data['Precision'], 
                       label=model, alpha=0.7, s=100)
        
        plt.xlabel('Recall')
        plt.ylabel('Precision')
        plt.title('Precision vs Recall by Model')
        plt.legend()
        plt.grid(True, alpha=0.3)
        
        # Performance by dataset type
        plt.subplot(2, 2, 4)
        type_performance = comparison_df.groupby(['Dataset Type', 'Model'])['F1-Score'].mean().reset_index()
        for model in type_performance['Model'].unique():
            model_data = type_performance[type_performance['Model'] == model]
            plt.plot(model_data['Dataset Type'], model_data['F1-Score'], 
                    marker='o', label=model, linewidth=2, markersize=8)
        
        plt.xlabel('Dataset Type')
        plt.ylabel('Average F1-Score')
        plt.title('Performance by Dataset Imbalance Type')
        plt.legend()
        plt.xticks(rotation=45)
        plt.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig('/root/FCA/docs/dataset_comparison.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        print("✅ Dataset comparison visualization saved to /root/FCA/docs/dataset_comparison.png")
        
        return comparison_df

def main():
    """Main modeling execution"""
    print("🚀 Starting Fraud Detection Modeling")
    print("="*80)
    
    # Initialize modeler
    modeler = FraudDetectionModeler()
    
    # Load datasets
    datasets = modeler.load_fraud_datasets()
    
    if not datasets:
        print("❌ No datasets loaded. Exiting.")
        return
    
    print(f"\\n📊 Loaded {len(datasets)} fraud detection datasets")
    
    # Build models for each dataset (reduced sample sizes for faster execution)
    sample_sizes = {
        'credit_card_fraud_2023': 20000,  # Reduced for faster training
        'hf_creditcard_fraud': 30000,     # Reduced for faster training
        'dhanush_fraud': 25000,           # Reduced for faster training
        'wamc_fraud': None,               # Use full dataset (smaller)
        'incribo_fraud': None             # Use full dataset (small)
    }
    
    for dataset_name in datasets.keys():
        sample_size = sample_sizes.get(dataset_name)
        modeler.build_models_for_dataset(dataset_name, sample_size)
        modeler.visualize_model_performance(dataset_name)
    
    # Compare across datasets
    comparison_df = modeler.compare_datasets_performance()
    
    print("\\n🎉 Fraud Detection Modeling Complete!")
    print("📁 Results saved to /root/FCA/docs/")
    print("   - model_performance_*.png (per dataset)")
    print("   - dataset_comparison.png")
    print("   - model_comparison.csv")

if __name__ == "__main__":
    main()