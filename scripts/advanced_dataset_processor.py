#!/usr/bin/env python3
"""
Advanced Dataset Processor
Handles downloading and preprocessing of multiple datasets for FCA project
"""

import pandas as pd
import numpy as np
import os
from pathlib import Path
import json
from datetime import datetime
import requests
from datasets import load_dataset
import kaggle
from kaggle.api.kaggle_api_extended import KaggleApi
import zipfile
import io

class AdvancedDatasetProcessor:
    def __init__(self, data_dir="/root/FCA/data"):
        self.data_dir = Path(data_dir)
        self.api = KaggleApi()
        self.api.authenticate()
        self.processing_results = {}
        
    def process_hf_creditcard_fraud(self):
        """Process HuggingFace Credit Card Fraud dataset"""
        print("Processing HuggingFace Credit Card Fraud dataset...")
        
        try:
            # Load dataset from HuggingFace
            dataset = load_dataset("dazzle-nu/CIS435-CreditCardFraudDetection")
            df = dataset['train'].to_pandas()
            
            # Create directory
            output_dir = self.data_dir / "hf_creditcard_fraud"
            output_dir.mkdir(exist_ok=True)
            
            # Basic analysis
            analysis = {
                "dataset_name": "HuggingFace CIS435-CreditCardFraudDetection",
                "shape": df.shape,
                "columns": list(df.columns),
                "dtypes": df.dtypes.to_dict(),
                "missing_values": df.isnull().sum().to_dict(),
                "memory_usage": df.memory_usage(deep=True).sum()
            }
            
            preprocessing_steps = []
            
            # Check for target column variations
            target_col = None
            for col in ['is_fraud', 'Class', 'isFraud']:
                if col in df.columns:
                    target_col = col
                    break
            
            if target_col:
                class_dist = df[target_col].value_counts().to_dict()
                analysis["class_distribution"] = class_dist
                preprocessing_steps.append(f"Found target column '{target_col}' with distribution: {class_dist}")
            
            # Remove duplicates
            initial_rows = len(df)
            df_processed = df.drop_duplicates()
            removed_duplicates = initial_rows - len(df_processed)
            if removed_duplicates > 0:
                preprocessing_steps.append(f"Removed {removed_duplicates} duplicate rows")
            else:
                preprocessing_steps.append("No duplicate rows found")
            
            # Save processed dataset
            output_path = output_dir / "hf_creditcard_processed.csv"
            df_processed.to_csv(output_path, index=False)
            
            analysis["preprocessing_steps"] = preprocessing_steps
            analysis["processed_shape"] = df_processed.shape
            analysis["processed_file_path"] = str(output_path)
            
            return analysis
            
        except Exception as e:
            return {"error": f"Failed to process HF Credit Card Fraud dataset: {str(e)}"}
    
    def download_kaggle_dataset(self, dataset_id, output_dir_name):
        """Download a Kaggle dataset"""
        try:
            output_dir = self.data_dir / output_dir_name
            output_dir.mkdir(exist_ok=True)
            
            print(f"Downloading Kaggle dataset: {dataset_id}")
            self.api.dataset_download_files(dataset_id, path=str(output_dir), unzip=True)
            
            # Find CSV files
            csv_files = list(output_dir.glob("*.csv"))
            return csv_files
            
        except Exception as e:
            print(f"Error downloading {dataset_id}: {str(e)}")
            return []
    
    def process_csv_dataset(self, csv_path, dataset_name):
        """Generic CSV dataset processor"""
        try:
            print(f"Processing {dataset_name}: {csv_path}")
            df = pd.read_csv(csv_path)
            
            analysis = {
                "dataset_name": dataset_name,
                "file_path": str(csv_path),
                "shape": df.shape,
                "columns": list(df.columns),
                "dtypes": df.dtypes.to_dict(),
                "missing_values": df.isnull().sum().to_dict(),
                "memory_usage": df.memory_usage(deep=True).sum()
            }
            
            preprocessing_steps = []
            
            # Find potential target columns
            target_candidates = ['Class', 'is_fraud', 'isFraud', 'is_laundering', 'Is Laundering', 
                               'Attrition_Flag', 'Is Fraudulent']
            target_col = None
            for col in target_candidates:
                if col in df.columns:
                    target_col = col
                    break
            
            if target_col:
                class_dist = df[target_col].value_counts().to_dict()
                analysis["class_distribution"] = class_dist
                preprocessing_steps.append(f"Found target column '{target_col}' with distribution: {class_dist}")
            
            # Remove duplicates
            initial_rows = len(df)
            df_processed = df.drop_duplicates()
            removed_duplicates = initial_rows - len(df_processed)
            if removed_duplicates > 0:
                preprocessing_steps.append(f"Removed {removed_duplicates} duplicate rows")
            else:
                preprocessing_steps.append("No duplicate rows found")
            
            # Handle missing values
            total_missing = df_processed.isnull().sum().sum()
            if total_missing > 0:
                # For numeric columns, fill with median
                numeric_cols = df_processed.select_dtypes(include=[np.number]).columns
                df_processed[numeric_cols] = df_processed[numeric_cols].fillna(df_processed[numeric_cols].median())
                
                # For categorical columns, fill with mode
                categorical_cols = df_processed.select_dtypes(include=['object']).columns
                for col in categorical_cols:
                    mode_val = df_processed[col].mode()
                    if len(mode_val) > 0:
                        df_processed[col] = df_processed[col].fillna(mode_val[0])
                    else:
                        df_processed[col] = df_processed[col].fillna('Unknown')
                
                preprocessing_steps.append(f"Filled {total_missing} missing values")
            else:
                preprocessing_steps.append("No missing values found")
            
            # Save processed dataset
            processed_path = csv_path.parent / f"{csv_path.stem}_processed.csv"
            df_processed.to_csv(processed_path, index=False)
            
            analysis["preprocessing_steps"] = preprocessing_steps
            analysis["processed_shape"] = df_processed.shape
            analysis["processed_file_path"] = str(processed_path)
            
            return analysis
            
        except Exception as e:
            return {"error": f"Failed to process {dataset_name}: {str(e)}"}
    
    def download_financial_phrasebank(self):
        """Download Financial Phrasebank dataset"""
        try:
            # Financial-PhraseBank is available on multiple sources
            # Let's try to download from a common source
            output_dir = self.data_dir / "financial_phrasebank"
            output_dir.mkdir(exist_ok=True)
            
            # Try downloading from Kaggle if available
            csv_files = self.download_kaggle_dataset("ankurzing/sentiment-analysis-for-financial-news", "financial_phrasebank")
            
            if csv_files:
                return self.process_csv_dataset(csv_files[0], "Financial Phrasebank")
            else:
                return {"error": "Financial Phrasebank dataset not found on Kaggle"}
                
        except Exception as e:
            return {"error": f"Failed to download Financial Phrasebank: {str(e)}"}
    
    def process_all_datasets(self):
        """Process all available datasets"""
        results = {}
        
        # Dataset configurations
        datasets_config = [
            {
                "name": "hf_creditcard_fraud",
                "processor": self.process_hf_creditcard_fraud,
                "description": "HuggingFace Credit Card Fraud"
            },
            {
                "name": "financial_phrasebank", 
                "processor": self.download_financial_phrasebank,
                "description": "Financial Phrasebank"
            },
            {
                "name": "ibm_aml",
                "kaggle_id": "ealtman2019/ibm-transactions-for-anti-money-laundering-aml",
                "description": "IBM AML Dataset"
            },
            {
                "name": "incribo_fraud",
                "kaggle_id": "teamincribo/credit-card-fraud", 
                "description": "Incribo Credit Card Fraud"
            },
            {
                "name": "wamc_fraud",
                "kaggle_id": "whenamancodes/fraud-detection",
                "description": "WAMC Fraud Detection"
            },
            {
                "name": "customer_attrition",
                "kaggle_id": "thedevastator/predicting-credit-card-customer-attrition-with-m",
                "description": "Customer Attrition"
            },
            {
                "name": "dhanush_fraud",
                "kaggle_id": "dhanushnarayananr/credit-card-fraud",
                "description": "Dhanush Credit Card Fraud"
            }
        ]
        
        for config in datasets_config:
            try:
                if "processor" in config:
                    # Use custom processor
                    result = config["processor"]()
                elif "kaggle_id" in config:
                    # Download from Kaggle and process
                    csv_files = self.download_kaggle_dataset(config["kaggle_id"], config["name"])
                    if csv_files:
                        result = self.process_csv_dataset(csv_files[0], config["description"])
                    else:
                        result = {"error": f"No CSV files found for {config['description']}"}
                
                results[config["name"]] = result
                print(f"✅ Completed: {config['description']}")
                
            except Exception as e:
                results[config["name"]] = {"error": str(e)}
                print(f"❌ Failed: {config['description']} - {str(e)}")
        
        return results

def main():
    """Main processing function"""
    processor = AdvancedDatasetProcessor()
    
    print("=" * 80)
    print("ADVANCED DATASET PROCESSING - ALL DATASETS")
    print("=" * 80)
    
    results = processor.process_all_datasets()
    
    # Generate comprehensive report
    report = {
        "timestamp": datetime.now().isoformat(),
        "processing_results": results,
        "summary": {
            "total_datasets": len(results),
            "successful": len([r for r in results.values() if "error" not in r]),
            "failed": len([r for r in results.values() if "error" in r])
        }
    }
    
    # Save report
    report_path = "/root/FCA/data/advanced_preprocessing_report.json"
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2, default=str)
    
    print(f"\n📊 PROCESSING SUMMARY:")
    print(f"Total datasets: {report['summary']['total_datasets']}")
    print(f"Successful: {report['summary']['successful']}")
    print(f"Failed: {report['summary']['failed']}")
    print(f"\nDetailed report saved to: {report_path}")
    
    return report

if __name__ == "__main__":
    report = main()