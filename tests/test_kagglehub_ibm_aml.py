#!/usr/bin/env python3
"""
Test IBM AML Dataset Loading with KaggleHub
============================================
"""

import kagglehub
from kagglehub import KaggleDatasetAdapter
import pandas as pd
import os
import time

def test_kagglehub_ibm_aml():
    """Test loading IBM AML dataset using kagglehub"""
    
    print("🔍 Testing IBM AML Dataset Loading with KaggleHub")
    print("=" * 60)
    
    try:
        # Dataset information
        dataset_id = "ealtman2019/ibm-transactions-for-anti-money-laundering-aml"
        print(f"📊 Dataset ID: {dataset_id}")
        
        # First, let's check what files are available in the dataset
        print("\n📁 Checking available files in dataset...")
        
        # Load the dataset with empty file_path to see available files
        start_time = time.time()
        
        # Try to load the dataset metadata first
        try:
            # Load without specifying file_path to see what's available
            print("🔄 Attempting to load dataset metadata...")
            
            # Method 1: Try loading the main CSV file (common pattern)
            file_paths_to_try = [
                "",  # Let kagglehub decide
                "HI-Small_Trans.csv",  # Common filename pattern
                "transactions.csv",
                "aml_data.csv",
                "data.csv"
            ]
            
            successful_load = False
            
            for file_path in file_paths_to_try:
                try:
                    print(f"\n🔄 Trying file path: '{file_path}'")
                    
                    df = kagglehub.load_dataset(
                        KaggleDatasetAdapter.PANDAS,
                        dataset_id,
                        file_path,
                        # Add pandas kwargs for better performance
                        pandas_kwargs={
                            'nrows': 1000,  # Load only first 1000 rows for testing
                            'low_memory': False
                        }
                    )
                    
                    print(f"✅ Successfully loaded data with file_path: '{file_path}'")
                    print(f"📊 Dataset shape: {df.shape}")
                    print(f"📋 Columns: {list(df.columns)}")
                    print(f"⏱️  Loading time: {time.time() - start_time:.2f} seconds")
                    
                    # Show first few records
                    print("\n📋 First 5 records:")
                    print(df.head())
                    
                    # Basic statistics
                    print(f"\n📈 Dataset Info:")
                    print(f"  - Shape: {df.shape}")
                    print(f"  - Memory usage: {df.memory_usage(deep=True).sum() / 1024**2:.2f} MB")
                    print(f"  - Data types: {dict(df.dtypes)}")
                    
                    # Check for potential target columns
                    potential_targets = ['label', 'target', 'class', 'is_laundering', 'aml_flag', 'suspicious']
                    found_targets = [col for col in df.columns if any(target in col.lower() for target in potential_targets)]
                    if found_targets:
                        print(f"  - Potential target columns: {found_targets}")
                    
                    successful_load = True
                    return df, file_path
                    
                except Exception as e:
                    print(f"❌ Failed with file_path '{file_path}': {str(e)}")
                    continue
            
            if not successful_load:
                print("❌ Could not load dataset with any of the attempted file paths")
                return None, None
                
        except Exception as e:
            print(f"❌ Error during dataset loading: {e}")
            return None, None
            
    except Exception as e:
        print(f"❌ General error: {e}")
        return None, None

def save_sample_data(df, file_path_used):
    """Save a sample of the loaded data for integration"""
    if df is not None:
        try:
            # Create sample dataset for FCA integration
            sample_size = min(10000, len(df))  # Use up to 10k rows
            sample_df = df.head(sample_size).copy()
            
            # Save to FCA data directory
            output_path = "/root/FCA/data/ibm_aml/ibm_aml_sample.csv"
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            sample_df.to_csv(output_path, index=False)
            
            print(f"\n💾 Sample data saved to: {output_path}")
            print(f"📊 Sample size: {sample_df.shape}")
            
            # Update the dataset configuration
            config_info = {
                "dataset_id": "ealtman2019/ibm-transactions-for-anti-money-laundering-aml",
                "file_path_used": file_path_used,
                "sample_size": sample_df.shape[0],
                "total_columns": sample_df.shape[1],
                "columns": list(sample_df.columns),
                "loading_method": "kagglehub",
                "status": "success"
            }
            
            import json
            config_path = "/root/FCA/data/ibm_aml/dataset_info.json"
            with open(config_path, 'w') as f:
                json.dump(config_info, f, indent=2)
            
            print(f"📝 Dataset info saved to: {config_path}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error saving sample data: {e}")
            return False
    
    return False

if __name__ == "__main__":
    # Test the loading
    df, file_path_used = test_kagglehub_ibm_aml()
    
    if df is not None:
        print(f"\n🎉 SUCCESS: IBM AML dataset loaded successfully!")
        
        # Save sample data for FCA integration
        if save_sample_data(df, file_path_used):
            print("✅ Sample data prepared for FCA integration")
        else:
            print("⚠️  Could not save sample data")
            
    else:
        print(f"\n❌ FAILED: Could not load IBM AML dataset")
        print("💡 Possible reasons:")
        print("   - Kaggle authentication required")
        print("   - Dataset access restrictions")
        print("   - Network connectivity issues")
        print("   - Incorrect file path")