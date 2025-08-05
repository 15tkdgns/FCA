#!/usr/bin/env python3
import pandas as pd
import numpy as np

# Load transaction data
print('=== IBM AML Dataset Analysis ===')
df_tx = pd.read_csv('transactions.csv')
print(f'Transactions: {len(df_tx):,} rows, {len(df_tx.columns)} columns')
print(f'Columns: {list(df_tx.columns)}')
print(f'Memory usage: {df_tx.memory_usage(deep=True).sum() / 1024**2:.1f} MB')

# Check fraud distribution
fraud_dist = df_tx['IS_FRAUD'].value_counts()
print(f'\nFraud Distribution:')
print(f'  Normal: {fraud_dist[False]:,} ({fraud_dist[False]/len(df_tx)*100:.2f}%)')
print(f'  Fraud: {fraud_dist[True]:,} ({fraud_dist[True]/len(df_tx)*100:.2f}%)')

# Load accounts data
df_acc = pd.read_csv('accounts.csv')
print(f'\nAccounts: {len(df_acc):,} rows, {len(df_acc.columns)} columns')

# Load alerts data  
df_alerts = pd.read_csv('alerts.csv')
print(f'Alerts: {len(df_alerts):,} rows, {len(df_alerts.columns)} columns')

print(f'\nTransaction Amount Statistics:')
print(f'  Mean: ${df_tx["TX_AMOUNT"].mean():.2f}')
print(f'  Median: ${df_tx["TX_AMOUNT"].median():.2f}')
print(f'  Max: ${df_tx["TX_AMOUNT"].max():.2f}')
print(f'  Min: ${df_tx["TX_AMOUNT"].min():.2f}')

# Check transaction types
print(f'\nTransaction Types:')
tx_types = df_tx['TX_TYPE'].value_counts()
for tx_type, count in tx_types.items():
    print(f'  {tx_type}: {count:,} ({count/len(df_tx)*100:.1f}%)')

# Check alert types
print(f'\nAlert Types:')
alert_types = df_alerts['ALERT_TYPE'].value_counts()
for alert_type, count in alert_types.items():
    print(f'  {alert_type}: {count:,}')