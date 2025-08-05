# IBM AML Dataset Status

## ✅ Dataset Successfully Downloaded

**Status**: Download Complete  
**Date**: 2025-07-30  
**Source**: IBM AMLSim Example Dataset

## 📋 Dataset Details

- **Dataset Name**: IBM AMLSim Example Dataset (Anti-Money Laundering)
- **Kaggle ID**: `anshankul/ibm-amlsim-example-dataset`
- **Total Size**: ~221MB processed
- **Records**: 1,323,234 transactions
- **Features**: 24 (after processing)

## 📊 Dataset Statistics

- **Fraud Rate**: 0.130% (1,719 fraud cases)
- **Transaction Types**: TRANSFER (100%)
- **Average Amount**: $115,988.18
- **Median Amount**: $156.71
- **Alert Types**: cycle (936), fan_in (783)

## 📁 Available Files

- `transactions.csv` - Main transaction data (59MB)
- `accounts.csv` - Account information (319KB)  
- `alerts.csv` - Fraud alerts (87KB)
- `ibm_aml_processed.csv` - Processed data with derived features (162MB)
- `ibm_aml_summary.json` - Processing summary

## 🔧 Processing Features

The processed dataset includes:

**Original Features:**
- Transaction ID, sender/receiver accounts
- Transaction amount, timestamp, type
- Fraud labels, alert IDs

**Derived Features:**
- Sender/receiver account details (balance, country, type)
- Log-transformed amounts
- Cross-country transaction flags
- Balance ratio calculations
- Customer relationship indicators

## 🚀 Usage

The dataset is ready for:
- Anti-money laundering detection models
- Transaction pattern analysis
- Cross-border financial crime detection
- Alert system evaluation

## 📈 Model Readiness

- **Target Variable**: `IS_FRAUD` (binary)
- **Feature Count**: 24 numerical and categorical features
- **Data Quality**: No missing values, properly encoded
- **Size**: Suitable for both traditional ML and deep learning approaches