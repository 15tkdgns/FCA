#!/usr/bin/env python3
"""
Test IBM AML Dataset Integration with FCA
=========================================
"""

import pandas as pd
import requests
import json

def test_ibm_aml_integration():
    """Test IBM AML dataset integration with FCA web application"""
    
    print("🔍 Testing IBM AML Dataset Integration")
    print("=" * 50)
    
    # Test 1: Check if sample data file exists and is readable
    print("\n📁 Test 1: Data File Check")
    try:
        df = pd.read_csv("/root/FCA/data/ibm_aml/ibm_aml_sample.csv")
        print(f"✅ File loaded successfully")
        print(f"📊 Shape: {df.shape}")
        print(f"📋 Columns: {list(df.columns)}")
        
        # Basic data analysis
        print(f"\n📈 Basic Analysis:")
        print(f"  - Total transactions: {len(df):,}")
        print(f"  - Laundering cases: {df['Is Laundering'].sum():,}")
        print(f"  - Normal cases: {(df['Is Laundering'] == 0).sum():,}")
        print(f"  - Laundering rate: {(df['Is Laundering'].mean() * 100):.2f}%")
        
        # Currency analysis
        currencies = df['Receiving Currency'].value_counts()
        print(f"  - Currencies: {list(currencies.index)}")
        
        # Payment formats
        formats = df['Payment Format'].value_counts()
        print(f"  - Payment formats: {list(formats.index)}")
        
    except Exception as e:
        print(f"❌ Error loading data file: {e}")
        return False
    
    # Test 2: Check API health
    print(f"\n🔌 Test 2: API Health Check")
    try:
        response = requests.get("http://localhost:5000/api/health", timeout=5)
        if response.status_code == 200:
            health_data = response.json()
            print(f"✅ API is healthy: {health_data['status']}")
        else:
            print(f"❌ API health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Error checking API health: {e}")
    
    # Test 3: Check if data can be loaded via FCA data loader
    print(f"\n📊 Test 3: FCA Data Loader Integration")
    try:
        import sys
        sys.path.append('/root/FCA/web_app')
        from modules.data_loader import DataLoader
        
        data_loader = DataLoader()
        
        # Check health of all data sources
        health = data_loader.health_check()
        print(f"✅ Data loader health check:")
        for source, status in health.items():
            status_icon = "✅" if status else "❌"
            print(f"  {status_icon} {source}: {status}")
        
    except Exception as e:
        print(f"❌ Error testing data loader: {e}")
    
    # Test 4: Generate basic fraud detection metrics
    print(f"\n🛡️ Test 4: Fraud Detection Metrics")
    try:
        # Calculate basic fraud metrics
        total_amount = df['Amount Received'].sum()
        fraud_amount = df[df['Is Laundering'] == 1]['Amount Received'].sum()
        
        print(f"✅ Fraud Detection Metrics:")
        print(f"  - Total transaction volume: ${total_amount:,.2f}")
        print(f"  - Fraudulent volume: ${fraud_amount:,.2f}")
        print(f"  - Fraud volume rate: {(fraud_amount/total_amount*100):.2f}%")
        
        # High-risk patterns
        high_amount_threshold = df['Amount Received'].quantile(0.95)
        high_risk_transactions = df[df['Amount Received'] > high_amount_threshold]
        print(f"  - High-value transactions (>95th percentile): {len(high_risk_transactions)}")
        print(f"  - High-value fraud rate: {(high_risk_transactions['Is Laundering'].mean()*100):.2f}%")
        
    except Exception as e:
        print(f"❌ Error calculating fraud metrics: {e}")
    
    print(f"\n🎉 IBM AML Dataset Integration Test Complete!")
    return True

def create_fraud_detection_summary():
    """Create a summary report for IBM AML dataset"""
    try:
        df = pd.read_csv("/root/FCA/data/ibm_aml/ibm_aml_sample.csv")
        
        summary = {
            "dataset_name": "IBM AML Dataset",
            "total_transactions": len(df),
            "fraud_cases": int(df['Is Laundering'].sum()),
            "fraud_rate": float(df['Is Laundering'].mean()),
            "total_volume": float(df['Amount Received'].sum()),
            "avg_transaction_amount": float(df['Amount Received'].mean()),
            "unique_banks": int(df['From Bank'].nunique()),
            "currencies": list(df['Receiving Currency'].unique()),
            "payment_formats": list(df['Payment Format'].unique()),
            "date_range": {
                "start": df['Timestamp'].min(),
                "end": df['Timestamp'].max()
            },
            "status": "active",
            "integration_method": "kagglehub"
        }
        
        # Save summary
        with open("/root/FCA/data/ibm_aml/fraud_summary.json", 'w') as f:
            json.dump(summary, f, indent=2)
        
        print(f"\n💾 Fraud Detection Summary saved to fraud_summary.json")
        print(f"📊 Key metrics:")
        print(f"  - Fraud rate: {summary['fraud_rate']*100:.2f}%")
        print(f"  - Avg transaction: ${summary['avg_transaction_amount']:,.2f}")
        print(f"  - Unique banks: {summary['unique_banks']}")
        
        return summary
        
    except Exception as e:
        print(f"❌ Error creating summary: {e}")
        return None

if __name__ == "__main__":
    # Run integration test
    test_ibm_aml_integration()
    
    # Create summary report
    summary = create_fraud_detection_summary()
    
    if summary:
        print(f"\n✅ SUCCESS: IBM AML dataset is ready for fraud detection analysis!")
        print(f"🎯 Use this dataset for:")
        print(f"   - Money laundering detection")
        print(f"   - Transaction pattern analysis") 
        print(f"   - Risk assessment models")
        print(f"   - Regulatory compliance testing")
    else:
        print(f"\n❌ FAILED: Could not prepare IBM AML dataset summary")