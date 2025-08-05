#!/usr/bin/env python3
"""
Comprehensive Dataset Preprocessing Script
Analyzes and preprocesses available datasets in the FCA project
"""

import pandas as pd
import numpy as np
import os
from pathlib import Path
import json
from datetime import datetime

class DatasetPreprocessor:
    def __init__(self, data_dir="/root/FCA/data"):
        self.data_dir = Path(data_dir)
        self.processing_results = {}
        
    def analyze_creditcard_2023(self):
        """Analyze and preprocess Credit Card Fraud 2023 dataset"""
        file_path = self.data_dir / "credit_card_fraud_2023" / "creditcard_2023.csv"
        
        if not file_path.exists():
            return {"error": "Credit Card Fraud 2023 dataset not found"}
        
        print(f"Processing Credit Card Fraud 2023 dataset: {file_path}")
        
        # Load dataset
        df = pd.read_csv(file_path)
        
        # Basic analysis
        analysis = {
            "dataset_name": "Credit Card Fraud 2023",
            "file_path": str(file_path),
            "shape": df.shape,
            "columns": list(df.columns),
            "dtypes": df.dtypes.to_dict(),
            "missing_values": df.isnull().sum().to_dict(),
            "memory_usage": df.memory_usage(deep=True).sum(),
            "class_distribution": df['Class'].value_counts().to_dict() if 'Class' in df.columns else None
        }
        
        # Advanced preprocessing
        preprocessing_steps = []
        
        # Step 1: Remove ID column if exists
        if 'id' in df.columns:
            df_processed = df.drop('id', axis=1)
            preprocessing_steps.append("Removed 'id' column as it's not predictive")
        else:
            df_processed = df.copy()
            preprocessing_steps.append("No 'id' column found - dataset already clean")
        
        # Step 2: Check for duplicates
        duplicates = df_processed.duplicated().sum()
        if duplicates > 0:
            df_processed = df_processed.drop_duplicates()
            preprocessing_steps.append(f"Removed {duplicates} duplicate rows")
        else:
            preprocessing_steps.append("No duplicate rows found")
        
        # Step 3: Feature analysis
        feature_columns = [col for col in df_processed.columns if col.startswith('V')]
        analysis["feature_columns_count"] = len(feature_columns)
        analysis["feature_statistics"] = df_processed[feature_columns].describe().to_dict()
        
        # Step 4: Class balance analysis
        if 'Class' in df_processed.columns:
            class_counts = df_processed['Class'].value_counts()
            class_percentages = df_processed['Class'].value_counts(normalize=True) * 100
            analysis["class_balance"] = {
                "counts": class_counts.to_dict(),
                "percentages": class_percentages.to_dict()
            }
            preprocessing_steps.append(f"Class distribution: {dict(zip(class_counts.index, class_counts.values))}")
        
        # Step 5: Amount column analysis
        if 'Amount' in df_processed.columns:
            amount_stats = df_processed['Amount'].describe().to_dict()
            analysis["amount_statistics"] = amount_stats
            preprocessing_steps.append(f"Amount range: ${amount_stats['min']:.2f} - ${amount_stats['max']:.2f}")
        
        analysis["preprocessing_steps"] = preprocessing_steps
        analysis["processed_shape"] = df_processed.shape
        
        # Save processed dataset
        output_path = self.data_dir / "credit_card_fraud_2023" / "creditcard_2023_processed.csv"
        df_processed.to_csv(output_path, index=False)
        analysis["processed_file_path"] = str(output_path)
        
        return analysis
    
    def check_other_datasets(self):
        """Check for other datasets in the data directory"""
        datasets_found = {}
        
        for item in self.data_dir.iterdir():
            if item.is_dir():
                csv_files = list(item.glob("*.csv"))
                if csv_files:
                    datasets_found[item.name] = [str(f) for f in csv_files]
                else:
                    datasets_found[item.name] = "No CSV files found"
        
        return datasets_found
    
    def generate_preprocessing_report(self):
        """Generate comprehensive preprocessing report"""
        report = {
            "timestamp": datetime.now().isoformat(),
            "preprocessing_results": {}
        }
        
        # Process Credit Card Fraud 2023
        cc_result = self.analyze_creditcard_2023()
        report["preprocessing_results"]["credit_card_fraud_2023"] = cc_result
        
        # Check other datasets
        other_datasets = self.check_other_datasets()
        report["available_datasets"] = other_datasets
        
        return report

def main():
    """Main preprocessing function"""
    preprocessor = DatasetPreprocessor()
    
    print("=" * 60)
    print("COMPREHENSIVE DATASET PREPROCESSING")
    print("=" * 60)
    
    # Generate comprehensive report
    report = preprocessor.generate_preprocessing_report()
    
    # Display results
    for dataset_name, results in report["preprocessing_results"].items():
        print(f"\n--- {dataset_name.upper()} ---")
        if "error" in results:
            print(f"ERROR: {results['error']}")
        else:
            print(f"Shape: {results['shape']}")
            print(f"Columns: {len(results['columns'])}")
            print(f"Missing values: {sum(results['missing_values'].values())}")
            
            if results.get('class_distribution'):
                print("Class distribution:")
                for class_val, count in results['class_distribution'].items():
                    print(f"  Class {class_val}: {count}")
            
            print("Preprocessing steps completed:")
            for i, step in enumerate(results.get('preprocessing_steps', []), 1):
                print(f"  {i}. {step}")
    
    # Save report
    report_path = "/root/FCA/data/preprocessing_report.json"
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2, default=str)
    
    print(f"\nDetailed preprocessing report saved to: {report_path}")
    
    return report

if __name__ == "__main__":
    report = main()