#!/usr/bin/env python3
"""
Exploratory Data Analysis (EDA) for FCA Project
Comprehensive analysis of all processed datasets
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import warnings
warnings.filterwarnings('ignore')

# Set style
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")

class FCADataAnalyzer:
    def __init__(self, data_dir="/root/FCA/data"):
        self.data_dir = data_dir
        self.datasets = {}
        self.analysis_results = {}
        
    def load_datasets(self):
        """Load all processed datasets"""
        dataset_configs = {
            'credit_card_fraud_2023': 'credit_card_fraud_2023/creditcard_2023_processed.csv',
            'hf_creditcard_fraud': 'hf_creditcard_fraud/hf_creditcard_processed.csv',
            'financial_phrasebank': 'financial_phrasebank/financial_sentences_processed.csv',
            'dhanush_fraud': 'dhanush_fraud/dhanush_fraud_processed.csv',
            'wamc_fraud': 'wamc_fraud/wamc_fraud_processed.csv',
            'customer_attrition': 'customer_attrition/customer_attrition_processed.csv',
            'incribo_fraud': 'incribo_fraud/incribo_fraud_processed.csv'
        }
        
        print("🔄 Loading datasets...")
        for name, path in dataset_configs.items():
            try:
                full_path = f"{self.data_dir}/{path}"
                df = pd.read_csv(full_path)
                self.datasets[name] = df
                print(f"✅ {name}: {df.shape[0]:,} rows × {df.shape[1]} columns")
            except Exception as e:
                print(f"❌ Failed to load {name}: {e}")
        
        print(f"\n📊 총 {len(self.datasets)}개 데이터셋 로드 완료")
        return self.datasets
    
    def dataset_overview(self):
        """Generate comprehensive dataset overview"""
        print("\n" + "="*80)
        print("📋 DATASET OVERVIEW")
        print("="*80)
        
        overview_data = []
        total_records = 0
        total_memory = 0
        
        for name, df in self.datasets.items():
            memory_mb = df.memory_usage(deep=True).sum() / 1024 / 1024
            total_records += len(df)
            total_memory += memory_mb
            
            # Identify target column
            target_col = None
            target_dist = "N/A"
            for col in df.columns:
                if any(keyword in col.lower() for keyword in ['class', 'fraud', 'sentiment', 'attrition']):
                    target_col = col
                    if df[col].dtype in ['object', 'category']:
                        target_dist = df[col].value_counts().to_dict()
                    else:
                        target_dist = df[col].value_counts().to_dict()
                    break
            
            overview_data.append({
                'Dataset': name,
                'Rows': f"{len(df):,}",
                'Columns': df.shape[1],
                'Memory (MB)': f"{memory_mb:.1f}",
                'Target Column': target_col or 'None',
                'Target Distribution': str(target_dist)[:50] + "..." if len(str(target_dist)) > 50 else str(target_dist),
                'Missing Values': df.isnull().sum().sum()
            })
        
        overview_df = pd.DataFrame(overview_data)
        print(overview_df.to_string(index=False))
        
        print(f"\n🎯 총계:")
        print(f"   - 총 레코드: {total_records:,}")
        print(f"   - 총 메모리: {total_memory:.1f} MB")
        print(f"   - 평균 데이터셋 크기: {total_records/len(self.datasets):,.0f} 레코드")
        
        return overview_df
    
    def analyze_fraud_datasets(self):
        """Analyze fraud detection datasets specifically"""
        print("\n" + "="*80)
        print("🎯 FRAUD DETECTION DATASETS ANALYSIS")
        print("="*80)
        
        fraud_datasets = {
            'credit_card_fraud_2023': 'Class',
            'hf_creditcard_fraud': 'is_fraud', 
            'dhanush_fraud': 'fraud',
            'wamc_fraud': 'Class',
            'incribo_fraud': 'Fraud Flag or Label'
        }
        
        fraud_analysis = []
        
        for dataset_name, target_col in fraud_datasets.items():
            if dataset_name in self.datasets:
                df = self.datasets[dataset_name]
                
                if target_col in df.columns:
                    fraud_count = df[target_col].sum() if df[target_col].dtype in ['int64', 'float64'] else len(df[df[target_col] == 1])
                    total_count = len(df)
                    fraud_rate = (fraud_count / total_count) * 100
                    
                    fraud_analysis.append({
                        'Dataset': dataset_name,
                        'Total Records': f"{total_count:,}",
                        'Fraud Cases': f"{fraud_count:,}",
                        'Fraud Rate (%)': f"{fraud_rate:.2f}%",
                        'Class Balance': 'Balanced' if 40 <= fraud_rate <= 60 else 'Imbalanced',
                        'Imbalance Ratio': f"1:{total_count/fraud_count:.1f}" if fraud_count > 0 else "N/A"
                    })
        
        fraud_df = pd.DataFrame(fraud_analysis)
        print(fraud_df.to_string(index=False))
        
        return fraud_df
    
    def visualize_class_distributions(self):
        """Create visualizations for class distributions"""
        print("\n🎨 Creating class distribution visualizations...")
        
        fraud_datasets = {
            'credit_card_fraud_2023': 'Class',
            'hf_creditcard_fraud': 'is_fraud', 
            'dhanush_fraud': 'fraud',
            'wamc_fraud': 'Class',
            'incribo_fraud': 'Fraud Flag or Label'
        }
        
        # Create subplot
        fig, axes = plt.subplots(2, 3, figsize=(18, 10))
        axes = axes.ravel()
        
        for idx, (dataset_name, target_col) in enumerate(fraud_datasets.items()):
            if dataset_name in self.datasets and idx < 6:
                df = self.datasets[dataset_name]
                
                if target_col in df.columns:
                    # Count plot
                    counts = df[target_col].value_counts()
                    colors = ['lightblue', 'lightcoral']
                    
                    axes[idx].bar(counts.index, counts.values, color=colors[:len(counts)])
                    axes[idx].set_title(f'{dataset_name.replace("_", " ").title()}\\nFraud Distribution')
                    axes[idx].set_xlabel('Class (0=Normal, 1=Fraud)')
                    axes[idx].set_ylabel('Count')
                    
                    # Add percentage labels
                    total = counts.sum()
                    for i, (class_val, count) in enumerate(counts.items()):
                        pct = (count / total) * 100
                        axes[idx].text(i, count + total*0.01, f'{count:,}\\n({pct:.1f}%)', 
                                     ha='center', va='bottom', fontweight='bold')
        
        # Remove empty subplot
        if len(fraud_datasets) < 6:
            fig.delaxes(axes[5])
        
        plt.tight_layout()
        plt.savefig('/root/FCA/docs/fraud_class_distributions.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        print("✅ Class distribution visualization saved to /root/FCA/docs/fraud_class_distributions.png")
    
    def analyze_feature_types(self):
        """Analyze feature types across datasets"""
        print("\n" + "="*80)
        print("🔍 FEATURE TYPE ANALYSIS")
        print("="*80)
        
        feature_analysis = []
        
        for name, df in self.datasets.items():
            numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
            categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
            datetime_cols = df.select_dtypes(include=['datetime64']).columns.tolist()
            
            feature_analysis.append({
                'Dataset': name,
                'Total Features': df.shape[1],
                'Numeric': len(numeric_cols),
                'Categorical': len(categorical_cols),
                'Datetime': len(datetime_cols),
                'Sample Numeric': ', '.join(numeric_cols[:3]) + ('...' if len(numeric_cols) > 3 else ''),
                'Sample Categorical': ', '.join(categorical_cols[:3]) + ('...' if len(categorical_cols) > 3 else '')
            })
        
        feature_df = pd.DataFrame(feature_analysis)
        print(feature_df.to_string(index=False))
        
        return feature_df
    
    def generate_correlation_analysis(self):
        """Generate correlation analysis for numeric features"""
        print("\n🔗 Generating correlation analysis...")
        
        # Focus on Credit Card Fraud 2023 (most complete dataset)
        if 'credit_card_fraud_2023' in self.datasets:
            df = self.datasets['credit_card_fraud_2023']
            
            # Select numeric columns (excluding target)
            numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
            if 'Class' in numeric_cols:
                numeric_cols.remove('Class')
            
            # Sample for correlation (if dataset is large)
            if len(df) > 10000:
                df_sample = df.sample(10000, random_state=42)
            else:
                df_sample = df
            
            # Calculate correlation matrix
            corr_matrix = df_sample[numeric_cols[:15]].corr()  # Limit to first 15 features
            
            # Create heatmap
            plt.figure(figsize=(12, 10))
            mask = np.triu(np.ones_like(corr_matrix, dtype=bool))
            sns.heatmap(corr_matrix, mask=mask, annot=True, fmt='.2f', 
                       cmap='coolwarm', center=0, square=True, linewidths=0.5)
            plt.title('Feature Correlation Matrix (Credit Card Fraud 2023)')
            plt.tight_layout()
            plt.savefig('/root/FCA/docs/correlation_matrix.png', dpi=300, bbox_inches='tight')
            plt.show()
            
            print("✅ Correlation matrix saved to /root/FCA/docs/correlation_matrix.png")
    
    def sentiment_analysis_overview(self):
        """Analyze sentiment distribution in financial phrasebank"""
        print("\n" + "="*80)
        print("💭 SENTIMENT ANALYSIS OVERVIEW")
        print("="*80)
        
        if 'financial_phrasebank' in self.datasets:
            df = self.datasets['financial_phrasebank']
            
            print(f"📝 Financial Phrasebank Dataset:")
            print(f"   - 총 문장 수: {len(df):,}")
            print(f"   - 컬럼: {list(df.columns)}")
            
            if 'sentiment' in df.columns:
                sentiment_counts = df['sentiment'].value_counts()
                print(f"\\n📊 감정 분포:")
                for sentiment, count in sentiment_counts.items():
                    pct = (count / len(df)) * 100
                    print(f"   - {sentiment}: {count:,} ({pct:.1f}%)")
                
                # Visualize sentiment distribution
                plt.figure(figsize=(10, 6))
                colors = ['lightgreen', 'lightblue', 'lightcoral']
                bars = plt.bar(sentiment_counts.index, sentiment_counts.values, color=colors)
                plt.title('Financial News Sentiment Distribution')
                plt.xlabel('Sentiment')
                plt.ylabel('Count')
                
                # Add percentage labels
                for bar, count in zip(bars, sentiment_counts.values):
                    pct = (count / len(df)) * 100
                    plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + len(df)*0.01, 
                            f'{count:,}\\n({pct:.1f}%)', ha='center', va='bottom', fontweight='bold')
                
                plt.tight_layout()
                plt.savefig('/root/FCA/docs/sentiment_distribution.png', dpi=300, bbox_inches='tight')
                plt.show()
                
                print("✅ Sentiment distribution saved to /root/FCA/docs/sentiment_distribution.png")
    
    def generate_comprehensive_report(self):
        """Generate comprehensive EDA report"""
        print("\\n" + "="*80)
        print("📋 GENERATING COMPREHENSIVE EDA REPORT")
        print("="*80)
        
        # Create report
        report = {
            'timestamp': pd.Timestamp.now().isoformat(),
            'datasets_analyzed': len(self.datasets),
            'total_records': sum(len(df) for df in self.datasets.values()),
            'total_memory_mb': sum(df.memory_usage(deep=True).sum() / 1024 / 1024 for df in self.datasets.values())
        }
        
        # Dataset summaries
        report['dataset_summaries'] = {}
        for name, df in self.datasets.items():
            report['dataset_summaries'][name] = {
                'shape': df.shape,
                'memory_mb': df.memory_usage(deep=True).sum() / 1024 / 1024,
                'missing_values': df.isnull().sum().sum(),
                'dtypes': df.dtypes.to_dict()
            }
        
        # Save report
        import json
        with open('/root/FCA/docs/eda_report.json', 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        print("✅ EDA report saved to /root/FCA/docs/eda_report.json")
        return report

def main():
    """Main EDA execution"""
    print("🚀 Starting Comprehensive Exploratory Data Analysis")
    print("="*80)
    
    # Initialize analyzer
    analyzer = FCADataAnalyzer()
    
    # Load datasets
    datasets = analyzer.load_datasets()
    
    if not datasets:
        print("❌ No datasets loaded. Exiting.")
        return
    
    # Perform analyses
    print("\\n🔍 Performing comprehensive analysis...")
    
    # 1. Dataset overview
    overview = analyzer.dataset_overview()
    
    # 2. Fraud dataset analysis
    fraud_analysis = analyzer.analyze_fraud_datasets()
    
    # 3. Feature type analysis
    feature_analysis = analyzer.analyze_feature_types()
    
    # 4. Visualizations
    analyzer.visualize_class_distributions()
    analyzer.generate_correlation_analysis()
    analyzer.sentiment_analysis_overview()
    
    # 5. Generate report
    report = analyzer.generate_comprehensive_report()
    
    print("\\n🎉 EDA Analysis Complete!")
    print("📁 Results saved to /root/FCA/docs/")
    print("   - fraud_class_distributions.png")
    print("   - correlation_matrix.png") 
    print("   - sentiment_distribution.png")
    print("   - eda_report.json")

if __name__ == "__main__":
    main()