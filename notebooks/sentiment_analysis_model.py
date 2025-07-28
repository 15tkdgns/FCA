#!/usr/bin/env python3
"""
Sentiment Analysis Model for Financial Phrasebank Dataset
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.preprocessing import LabelEncoder
import warnings
warnings.filterwarnings('ignore')

class SentimentAnalyzer:
    def __init__(self, data_path="/root/FCA/data/financial_phrasebank/financial_sentences_processed.csv"):
        self.data_path = data_path
        self.df = None
        self.models = {}
        self.results = {}
        self.vectorizer = None
        
    def load_data(self):
        """Load the financial phrasebank dataset"""
        print("🔄 Loading Financial Phrasebank dataset...")
        
        try:
            self.df = pd.read_csv(self.data_path)
            print(f"✅ Loaded {len(self.df):,} sentences")
            print(f"📋 Columns: {list(self.df.columns)}")
            
            # Check for text and sentiment columns
            if 'sentence' not in self.df.columns:
                # Try to find text column
                text_cols = [col for col in self.df.columns if 'text' in col.lower() or 'sentence' in col.lower()]
                if text_cols:
                    self.df['sentence'] = self.df[text_cols[0]]
                    print(f"📝 Using '{text_cols[0]}' as text column")
            
            if 'sentiment' not in self.df.columns:
                # Try to find sentiment column
                sentiment_cols = [col for col in self.df.columns if 'sentiment' in col.lower() or 'label' in col.lower()]
                if sentiment_cols:
                    self.df['sentiment'] = self.df[sentiment_cols[0]]
                    print(f"💭 Using '{sentiment_cols[0]}' as sentiment column")
            
            # Display basic info
            if 'sentiment' in self.df.columns:
                sentiment_counts = self.df['sentiment'].value_counts()
                print(f"\n📊 Sentiment distribution:")
                for sentiment, count in sentiment_counts.items():
                    pct = (count / len(self.df)) * 100
                    print(f"   - {sentiment}: {count:,} ({pct:.1f}%)")
            
            return True
            
        except Exception as e:
            print(f"❌ Error loading dataset: {e}")
            return False
    
    def preprocess_data(self):
        """Preprocess text data for analysis"""
        print("\n🔧 Preprocessing data...")
        
        # Check required columns
        if 'sentence' not in self.df.columns or 'sentiment' not in self.df.columns:
            print("❌ Required columns 'sentence' and 'sentiment' not found")
            return False
        
        # Remove empty sentences
        initial_count = len(self.df)
        self.df = self.df.dropna(subset=['sentence', 'sentiment'])
        self.df = self.df[self.df['sentence'].str.len() > 0]
        print(f"📊 Removed {initial_count - len(self.df)} empty sentences")
        
        # Encode sentiment labels
        le = LabelEncoder()
        self.df['sentiment_encoded'] = le.fit_transform(self.df['sentiment'])
        
        # Map encoded labels
        label_mapping = dict(zip(le.transform(le.classes_), le.classes_))
        print(f"🏷️ Label mapping: {label_mapping}")
        
        print(f"✅ Final dataset: {len(self.df):,} sentences")
        return True
    
    def train_models(self):
        """Train sentiment analysis models"""
        print("\n🤖 Training sentiment analysis models...")
        
        # Prepare data
        X = self.df['sentence']
        y = self.df['sentiment_encoded']
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        print(f"📊 Training set: {len(X_train):,}, Test set: {len(X_test):,}")
        
        # Vectorize text
        print("📝 Converting text to features...")
        self.vectorizer = TfidfVectorizer(
            max_features=5000,
            stop_words='english',
            lowercase=True,
            ngram_range=(1, 2)
        )
        
        X_train_vec = self.vectorizer.fit_transform(X_train)
        X_test_vec = self.vectorizer.transform(X_test)
        
        print(f"🔤 Feature vector shape: {X_train_vec.shape}")
        
        # Define models
        models = {
            'Naive Bayes': MultinomialNB(),
            'Logistic Regression': LogisticRegression(random_state=42, max_iter=1000),
            'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
        }
        
        # Train and evaluate models
        for model_name, model in models.items():
            print(f"\n   🔄 Training {model_name}...")
            
            try:
                # Train
                model.fit(X_train_vec, y_train)
                
                # Predict
                y_pred = model.predict(X_test_vec)
                
                # Calculate metrics
                accuracy = accuracy_score(y_test, y_pred)
                report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
                
                # Store results
                self.results[model_name] = {
                    'accuracy': accuracy,
                    'macro_f1': report['macro avg']['f1-score'],
                    'weighted_f1': report['weighted avg']['f1-score'],
                    'y_test': y_test,
                    'y_pred': y_pred,
                    'detailed_report': report
                }
                
                print(f"      ✅ Accuracy: {accuracy:.3f}, Macro F1: {report['macro avg']['f1-score']:.3f}")
                
            except Exception as e:
                print(f"      ❌ Error training {model_name}: {e}")
        
        return self.results
    
    def create_visualizations(self):
        """Create sentiment analysis visualizations"""
        print("\n🎨 Creating visualizations...")
        
        # Create figure
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        fig.suptitle('Financial Sentiment Analysis Results', fontsize=16)
        
        # 1. Sentiment distribution
        ax1 = axes[0, 0]
        sentiment_counts = self.df['sentiment'].value_counts()
        colors = ['lightgreen', 'lightblue', 'lightcoral']
        bars = ax1.bar(sentiment_counts.index, sentiment_counts.values, color=colors[:len(sentiment_counts)])
        ax1.set_title('Sentiment Distribution')
        ax1.set_xlabel('Sentiment')
        ax1.set_ylabel('Count')
        
        # Add percentage labels
        for bar, count in zip(bars, sentiment_counts.values):
            pct = (count / len(self.df)) * 100
            ax1.text(bar.get_x() + bar.get_width()/2, bar.get_height() + len(self.df)*0.01,
                    f'{count:,}\n({pct:.1f}%)', ha='center', va='bottom', fontweight='bold')
        
        # 2. Model accuracy comparison
        ax2 = axes[0, 1]
        if self.results:
            model_names = list(self.results.keys())
            accuracies = [self.results[model]['accuracy'] for model in model_names]
            
            bars = ax2.bar(model_names, accuracies, color=['skyblue', 'lightgreen', 'orange'])
            ax2.set_title('Model Accuracy Comparison')
            ax2.set_xlabel('Model')
            ax2.set_ylabel('Accuracy')
            ax2.set_ylim(0, 1)
            
            # Add value labels
            for bar, acc in zip(bars, accuracies):
                ax2.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.01,
                        f'{acc:.3f}', ha='center', va='bottom', fontweight='bold')
        
        # 3. F1-Score comparison
        ax3 = axes[1, 0]
        if self.results:
            macro_f1s = [self.results[model]['macro_f1'] for model in model_names]
            weighted_f1s = [self.results[model]['weighted_f1'] for model in model_names]
            
            x = np.arange(len(model_names))
            width = 0.35
            
            ax3.bar(x - width/2, macro_f1s, width, label='Macro F1', color='lightblue')
            ax3.bar(x + width/2, weighted_f1s, width, label='Weighted F1', color='lightcoral')
            
            ax3.set_title('F1-Score Comparison')
            ax3.set_xlabel('Model')
            ax3.set_ylabel('F1-Score')
            ax3.set_xticks(x)
            ax3.set_xticklabels(model_names, rotation=45)
            ax3.legend()
            ax3.set_ylim(0, 1)
        
        # 4. Confusion matrix for best model
        ax4 = axes[1, 1]
        if self.results:
            best_model = max(self.results.keys(), key=lambda k: self.results[k]['accuracy'])
            cm = confusion_matrix(self.results[best_model]['y_test'], self.results[best_model]['y_pred'])
            
            # Get unique sentiment labels
            unique_labels = sorted(self.df['sentiment'].unique())
            
            sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=ax4,
                       xticklabels=unique_labels, yticklabels=unique_labels)
            ax4.set_title(f'Confusion Matrix: {best_model}')
            ax4.set_xlabel('Predicted')
            ax4.set_ylabel('Actual')
        
        plt.tight_layout()
        plt.savefig('/root/FCA/docs/sentiment_analysis_results.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        print("✅ Visualization saved to /root/FCA/docs/sentiment_analysis_results.png")
    
    def generate_report(self):
        """Generate sentiment analysis report"""
        print("\n📋 Generating sentiment analysis report...")
        
        if not self.results:
            print("❌ No results to report")
            return
        
        # Create summary
        summary_data = []
        for model_name, metrics in self.results.items():
            summary_data.append({
                'Model': model_name,
                'Accuracy': f"{metrics['accuracy']:.3f}",
                'Macro F1': f"{metrics['macro_f1']:.3f}",
                'Weighted F1': f"{metrics['weighted_f1']:.3f}"
            })
        
        summary_df = pd.DataFrame(summary_data)
        
        print("\n🏆 SENTIMENT ANALYSIS RESULTS")
        print("="*60)
        print(summary_df.to_string(index=False))
        
        # Save results
        summary_df.to_csv('/root/FCA/docs/sentiment_model_results.csv', index=False)
        print(f"\n✅ Results saved to /root/FCA/docs/sentiment_model_results.csv")
        
        # Best model details
        best_model = max(self.results.keys(), key=lambda k: self.results[k]['accuracy'])
        print(f"\n🥇 Best Model: {best_model}")
        print(f"   - Accuracy: {self.results[best_model]['accuracy']:.3f}")
        print(f"   - Macro F1: {self.results[best_model]['macro_f1']:.3f}")
        print(f"   - Weighted F1: {self.results[best_model]['weighted_f1']:.3f}")
        
        return summary_df

def main():
    """Main execution"""
    print("🚀 Financial Sentiment Analysis")
    print("="*60)
    
    # Initialize analyzer
    analyzer = SentimentAnalyzer()
    
    # Load and preprocess data
    if not analyzer.load_data():
        return
    
    if not analyzer.preprocess_data():
        return
    
    # Train models
    results = analyzer.train_models()
    
    if results:
        # Create visualizations
        analyzer.create_visualizations()
        
        # Generate report
        analyzer.generate_report()
        
        print(f"\n🎉 Sentiment Analysis Complete!")
        print("📁 Results saved to /root/FCA/docs/")
        print("   - sentiment_analysis_results.png")
        print("   - sentiment_model_results.csv")
    else:
        print("❌ No results generated")

if __name__ == "__main__":
    main()