import pandas as pd

file_path = '/root/FCA/data/online_retail_ii/online_retail_II.csv'
df = pd.read_csv(file_path)

# Re-apply previous preprocessing steps for robustness
df['InvoiceDate'] = pd.to_datetime(df['InvoiceDate'])
df['Customer ID'] = df['Customer ID'].fillna(0).astype(int)
df['Description'] = df['Description'].fillna('Unknown')

print("Separating sales and cancelled orders based on 'Invoice'...")
cancelled_df = df[df['Invoice'].astype(str).str.startswith('C')]
sales_df = df[~df['Invoice'].astype(str).str.startswith('C')]

print(f"Original DataFrame shape: {df.shape}")
print(f"Sales DataFrame shape (non-cancelled): {sales_df.shape}")
print(f"Cancelled Orders DataFrame shape: {cancelled_df.shape}")

# In a real scenario, you might save these separated DataFrames:
# sales_df.to_csv('/root/FCA/data/online_retail_ii/online_retail_II_sales_non_cancelled.csv', index=False)
# cancelled_df.to_csv('/root/FCA/data/online_retail_ii/online_retail_II_cancelled.csv', index=False)