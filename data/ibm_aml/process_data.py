#!/usr/bin/env python3
import pandas as pd
import numpy as np
from datetime import datetime

print('=== Processing IBM AML Dataset ===')

# Load data
df_tx = pd.read_csv('transactions.csv')
df_acc = pd.read_csv('accounts.csv')
df_alerts = pd.read_csv('alerts.csv')

# Merge transaction with account information
df_sender = df_acc.rename(columns={
    'ACCOUNT_ID': 'SENDER_ACCOUNT_ID',
    'CUSTOMER_ID': 'SENDER_CUSTOMER_ID',
    'INIT_BALANCE': 'SENDER_BALANCE',
    'COUNTRY': 'SENDER_COUNTRY',
    'ACCOUNT_TYPE': 'SENDER_ACCOUNT_TYPE',
    'IS_FRAUD': 'SENDER_IS_FRAUD',
    'TX_BEHAVIOR_ID': 'SENDER_BEHAVIOR_ID'
})

df_receiver = df_acc.rename(columns={
    'ACCOUNT_ID': 'RECEIVER_ACCOUNT_ID',
    'CUSTOMER_ID': 'RECEIVER_CUSTOMER_ID',
    'INIT_BALANCE': 'RECEIVER_BALANCE',
    'COUNTRY': 'RECEIVER_COUNTRY',
    'ACCOUNT_TYPE': 'RECEIVER_ACCOUNT_TYPE',
    'IS_FRAUD': 'RECEIVER_IS_FRAUD',
    'TX_BEHAVIOR_ID': 'RECEIVER_BEHAVIOR_ID'
})

# Merge transaction data with sender and receiver information
df_processed = df_tx.merge(df_sender, on='SENDER_ACCOUNT_ID', how='left')
df_processed = df_processed.merge(df_receiver, on='RECEIVER_ACCOUNT_ID', how='left')

# Add derived features
df_processed['AMOUNT_LOG'] = np.log1p(df_processed['TX_AMOUNT'])
df_processed['IS_SAME_CUSTOMER'] = (df_processed['SENDER_CUSTOMER_ID'] == df_processed['RECEIVER_CUSTOMER_ID'])
df_processed['IS_CROSS_COUNTRY'] = (df_processed['SENDER_COUNTRY'] != df_processed['RECEIVER_COUNTRY'])
df_processed['BALANCE_RATIO'] = df_processed['TX_AMOUNT'] / (df_processed['SENDER_BALANCE'] + 1)

# Convert boolean columns to integers for ML compatibility
bool_cols = ['IS_FRAUD', 'IS_SAME_CUSTOMER', 'IS_CROSS_COUNTRY', 'SENDER_IS_FRAUD', 'RECEIVER_IS_FRAUD']
for col in bool_cols:
    if col in df_processed.columns:
        df_processed[col] = df_processed[col].astype(int)

print(f'Processed dataset: {len(df_processed):,} rows, {len(df_processed.columns)} columns')
print(f'Features: {list(df_processed.columns)}')

# Save processed data
df_processed.to_csv('ibm_aml_processed.csv', index=False)
print('Saved: ibm_aml_processed.csv')

# Create summary statistics
summary = {
    'dataset_name': 'IBM AML (Anti-Money Laundering)',
    'total_transactions': int(len(df_processed)),
    'fraud_transactions': int(df_processed['IS_FRAUD'].sum()),
    'fraud_rate': f"{df_processed['IS_FRAUD'].mean()*100:.3f}%",
    'processing_date': datetime.now().isoformat(),
    'file_size_mb': f"{df_processed.memory_usage(deep=True).sum() / 1024**2:.1f}",
    'features': int(len(df_processed.columns)),
    'avg_amount': f"${df_processed['TX_AMOUNT'].mean():.2f}",
    'median_amount': f"${df_processed['TX_AMOUNT'].median():.2f}"
}

import json
with open('ibm_aml_summary.json', 'w') as f:
    json.dump(summary, f, indent=2)

print('\n=== Processing Summary ===')
for key, value in summary.items():
    print(f'{key}: {value}')