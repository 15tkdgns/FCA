#!/usr/bin/env python3
"""
Customer Attrition Prediction Model
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, roc_curve
from sklearn.metrics import precision_recall_curve, average_precision_score
import warnings
warnings.filterwarnings('ignore')

class CustomerAttritionPredictor:
    def __init__(self, data_path="/root/FCA/data/customer_attrition/customer_attrition_processed.csv"):
        self.data_path = data_path
        self.df = None
        self.models = {}
        self.results = {}
        self.feature_importance = {}
        
    def load_data(self):
        """Load the customer attrition dataset"""
        print("🔄 Loading Customer Attrition dataset...")
        
        try:
            self.df = pd.read_csv(self.data_path)
            print(f"✅ Loaded {len(self.df):,} customer records")
            print(f"📋 Columns: {self.df.shape[1]} features")
            
            # Identify attrition column
            attrition_cols = [col for col in self.df.columns if 'attrition' in col.lower() or 'churn' in col.lower()]
            if attrition_cols:
                target_col = attrition_cols[0]
                print(f"🎯 Target column: {target_col}")
                
                # Check attrition rate
                if self.df[target_col].dtype == 'object':
                    attrition_rate = (self.df[target_col] == 'Yes').mean() * 100
                else:
                    attrition_rate = self.df[target_col].mean() * 100
                    
                print(f"📊 Attrition rate: {attrition_rate:.1f}%")
            
            # Display basic statistics
            print(f"\n📈 Dataset overview:")
            print(f"   - Numeric columns: {len(self.df.select_dtypes(include=[np.number]).columns)}")
            print(f"   - Categorical columns: {len(self.df.select_dtypes(include=['object']).columns)}")
            print(f"   - Missing values: {self.df.isnull().sum().sum()}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error loading dataset: {e}")
            return False
    
    def preprocess_data(self):
        """Preprocess customer data for modeling"""
        print("\n🔧 Preprocessing customer data...")
        
        # Identify target column
        attrition_cols = [col for col in self.df.columns if 'attrition' in col.lower() or 'churn' in col.lower()]
        if not attrition_cols:
            print("❌ No attrition/churn column found")
            return False
        
        target_col = attrition_cols[0]
        
        # Convert target to binary
        if self.df[target_col].dtype == 'object':
            # Check for different attrition indicators
            if 'Attrited Customer' in self.df[target_col].values:
                self.df['attrition_binary'] = (self.df[target_col] == 'Attrited Customer').astype(int)
            elif 'Yes' in self.df[target_col].values:
                self.df['attrition_binary'] = (self.df[target_col] == 'Yes').astype(int)
            else:
                # Convert to binary based on unique values
                unique_vals = self.df[target_col].unique()
                if len(unique_vals) == 2:
                    self.df['attrition_binary'] = (self.df[target_col] == unique_vals[1]).astype(int)
                else:
                    print(f"❌ Unexpected target values: {unique_vals}")
                    return False
        else:
            self.df['attrition_binary'] = self.df[target_col].astype(int)
        
        # Handle categorical variables
        categorical_cols = self.df.select_dtypes(include=['object']).columns
        categorical_cols = [col for col in categorical_cols if col != target_col]
        
        print(f"🔤 Encoding {len(categorical_cols)} categorical columns...")
        
        # Label encode categorical variables
        label_encoders = {}
        for col in categorical_cols:
            if self.df[col].nunique() < 50:  # Only encode if not too many unique values
                le = LabelEncoder()
                self.df[col + '_encoded'] = le.fit_transform(self.df[col].astype(str))
                label_encoders[col] = le
        
        # Select features for modeling
        feature_cols = []
        
        # Numeric columns
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        feature_cols.extend([col for col in numeric_cols if col != 'attrition_binary' and 'id' not in col.lower()])
        
        # Encoded categorical columns
        encoded_cols = [col for col in self.df.columns if col.endswith('_encoded')]
        feature_cols.extend(encoded_cols)
        
        print(f"📊 Selected {len(feature_cols)} features for modeling")
        
        # Handle missing values
        for col in feature_cols:
            if col in self.df.columns:
                self.df[col] = self.df[col].fillna(self.df[col].median())
        
        self.feature_cols = feature_cols
        self.target_col = 'attrition_binary'
        
        return True
    
    def train_models(self):
        """Train customer attrition prediction models"""
        print("\n🤖 Training customer attrition models...")
        
        # Prepare data
        X = self.df[self.feature_cols]
        y = self.df[self.target_col]
        
        print(f"📊 Features: {X.shape[1]}, Samples: {len(X):,}")
        print(f"🎯 Attrition rate: {y.mean()*100:.1f}%")
        
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
        
        # Train and evaluate models
        for model_name, model in models.items():
            print(f"\n   🔄 Training {model_name}...")
            
            try:
                # Train
                if model_name == 'Logistic Regression':
                    model.fit(X_train_scaled, y_train)
                    y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]
                    y_pred = model.predict(X_test_scaled)
                else:
                    model.fit(X_train, y_train)
                    y_pred_proba = model.predict_proba(X_test)[:, 1]
                    y_pred = model.predict(X_test)
                
                # Calculate metrics
                auc_score = roc_auc_score(y_test, y_pred_proba)
                avg_precision = average_precision_score(y_test, y_pred_proba)
                
                # Classification report
                report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
                
                # Store results
                self.results[model_name] = {
                    'auc_roc': auc_score,
                    'avg_precision': avg_precision,
                    'precision': report['1']['precision'] if '1' in report else 0,
                    'recall': report['1']['recall'] if '1' in report else 0,
                    'f1_score': report['1']['f1-score'] if '1' in report else 0,
                    'accuracy': report['accuracy'],
                    'y_test': y_test,
                    'y_pred': y_pred,
                    'y_pred_proba': y_pred_proba
                }
                
                # Feature importance (for tree-based models)
                if hasattr(model, 'feature_importances_'):
                    feature_imp = dict(zip(self.feature_cols, model.feature_importances_))
                    self.feature_importance[model_name] = sorted(feature_imp.items(), 
                                                               key=lambda x: x[1], reverse=True)[:10]
                
                print(f"      ✅ AUC: {auc_score:.3f}, F1: {report['1']['f1-score'] if '1' in report else 0:.3f}, Accuracy: {report['accuracy']:.3f}")
                
            except Exception as e:
                print(f"      ❌ Error training {model_name}: {e}")
        
        return self.results
    
    def create_visualizations(self):
        """Create customer attrition analysis visualizations"""
        print("\n🎨 Creating visualizations...")
        
        # Create figure
        fig, axes = plt.subplots(2, 3, figsize=(18, 12))
        fig.suptitle('Customer Attrition Analysis Results', fontsize=16)
        
        # 1. Attrition distribution
        ax1 = axes[0, 0]
        attrition_counts = self.df[self.target_col].value_counts()
        labels = ['Retained', 'Churned']
        colors = ['lightgreen', 'lightcoral']
        
        wedges, texts, autotexts = ax1.pie(attrition_counts.values, labels=labels, colors=colors,
                                          autopct='%1.1f%%', startangle=90)
        ax1.set_title('Customer Attrition Distribution')
        
        # 2. Model performance comparison
        ax2 = axes[0, 1]
        if self.results:
            model_names = list(self.results.keys())
            auc_scores = [self.results[model]['auc_roc'] for model in model_names]
            
            bars = ax2.bar(model_names, auc_scores, color=['skyblue', 'lightgreen', 'orange'])
            ax2.set_title('Model AUC-ROC Comparison')
            ax2.set_xlabel('Model')
            ax2.set_ylabel('AUC-ROC Score')
            ax2.set_ylim(0, 1)
            
            # Add value labels
            for bar, auc in zip(bars, auc_scores):
                ax2.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.01,
                        f'{auc:.3f}', ha='center', va='bottom', fontweight='bold')
        
        # 3. ROC Curves
        ax3 = axes[0, 2]
        if self.results:
            for model_name, result in self.results.items():
                fpr, tpr, _ = roc_curve(result['y_test'], result['y_pred_proba'])
                auc = result['auc_roc']
                ax3.plot(fpr, tpr, label=f'{model_name} (AUC = {auc:.3f})')
            
            ax3.plot([0, 1], [0, 1], 'k--', alpha=0.5)
            ax3.set_xlabel('False Positive Rate')
            ax3.set_ylabel('True Positive Rate')
            ax3.set_title('ROC Curves')
            ax3.legend()
            ax3.grid(True, alpha=0.3)
        
        # 4. Precision-Recall Curves
        ax4 = axes[1, 0]
        if self.results:
            for model_name, result in self.results.items():
                precision, recall, _ = precision_recall_curve(result['y_test'], result['y_pred_proba'])
                avg_precision = result['avg_precision']
                ax4.plot(recall, precision, label=f'{model_name} (AP = {avg_precision:.3f})')
            
            ax4.set_xlabel('Recall')
            ax4.set_ylabel('Precision')
            ax4.set_title('Precision-Recall Curves')
            ax4.legend()
            ax4.grid(True, alpha=0.3)
        
        # 5. Feature importance (best model)
        ax5 = axes[1, 1]
        if self.feature_importance:
            best_model = max(self.results.keys(), key=lambda k: self.results[k]['auc_roc'])
            if best_model in self.feature_importance:
                features, importances = zip(*self.feature_importance[best_model])
                
                y_pos = np.arange(len(features))
                ax5.barh(y_pos, importances, color='lightblue')
                ax5.set_yticks(y_pos)
                ax5.set_yticklabels([f.replace('_encoded', '') for f in features])
                ax5.set_xlabel('Feature Importance')
                ax5.set_title(f'Top Features: {best_model}')
        
        # 6. Performance metrics comparison
        ax6 = axes[1, 2]
        if self.results:
            metrics = ['auc_roc', 'precision', 'recall', 'f1_score', 'accuracy']
            model_names = list(self.results.keys())
            
            x = np.arange(len(metrics))
            width = 0.25
            
            for i, model_name in enumerate(model_names):
                values = [self.results[model_name].get(metric, 0) for metric in metrics]
                ax6.bar(x + i*width, values, width, label=model_name)
            
            ax6.set_xlabel('Metrics')
            ax6.set_ylabel('Score')
            ax6.set_title('Performance Metrics Comparison')
            ax6.set_xticks(x + width)
            ax6.set_xticklabels(['AUC', 'Precision', 'Recall', 'F1', 'Accuracy'], rotation=45)
            ax6.legend()
            ax6.set_ylim(0, 1)
        
        plt.tight_layout()
        plt.savefig('/root/FCA/docs/customer_attrition_results.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        print("✅ Visualization saved to /root/FCA/docs/customer_attrition_results.png")
    
    def generate_report(self):
        """Generate customer attrition analysis report"""
        print("\n📋 Generating customer attrition report...")
        
        if not self.results:
            print("❌ No results to report")
            return
        
        # Create summary
        summary_data = []
        for model_name, metrics in self.results.items():
            summary_data.append({
                'Model': model_name,
                'AUC-ROC': f"{metrics['auc_roc']:.3f}",
                'Precision': f"{metrics['precision']:.3f}",
                'Recall': f"{metrics['recall']:.3f}",
                'F1-Score': f"{metrics['f1_score']:.3f}",
                'Accuracy': f"{metrics['accuracy']:.3f}"
            })
        
        summary_df = pd.DataFrame(summary_data)
        
        print("\n🏆 CUSTOMER ATTRITION PREDICTION RESULTS")
        print("="*80)
        print(summary_df.to_string(index=False))
        
        # Save results
        summary_df.to_csv('/root/FCA/docs/customer_attrition_model_results.csv', index=False)
        print(f"\n✅ Results saved to /root/FCA/docs/customer_attrition_model_results.csv")
        
        # Best model details
        best_model = max(self.results.keys(), key=lambda k: self.results[k]['auc_roc'])
        print(f"\n🥇 Best Model: {best_model}")
        print(f"   - AUC-ROC: {self.results[best_model]['auc_roc']:.3f}")
        print(f"   - Precision: {self.results[best_model]['precision']:.3f}")
        print(f"   - Recall: {self.results[best_model]['recall']:.3f}")
        print(f"   - F1-Score: {self.results[best_model]['f1_score']:.3f}")
        
        # Feature importance insights
        if best_model in self.feature_importance:
            print(f"\n🔍 Top 5 Predictive Features ({best_model}):")
            for i, (feature, importance) in enumerate(self.feature_importance[best_model][:5]):
                print(f"   {i+1}. {feature.replace('_encoded', '')}: {importance:.3f}")
        
        return summary_df

def main():
    """Main execution"""
    print("🚀 Customer Attrition Prediction Analysis")
    print("="*80)
    
    # Initialize predictor
    predictor = CustomerAttritionPredictor()
    
    # Load and preprocess data
    if not predictor.load_data():
        return
    
    if not predictor.preprocess_data():
        return
    
    # Train models
    results = predictor.train_models()
    
    if results:
        # Create visualizations
        predictor.create_visualizations()
        
        # Generate report
        predictor.generate_report()
        
        print(f"\n🎉 Customer Attrition Analysis Complete!")
        print("📁 Results saved to /root/FCA/docs/")
        print("   - customer_attrition_results.png")
        print("   - customer_attrition_model_results.csv")
    else:
        print("❌ No results generated")

if __name__ == "__main__":
    main()