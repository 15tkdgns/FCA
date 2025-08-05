import pandas as pd

file_path = '/root/FCA/data/online_retail_ii/online_retail_II.csv'
df = pd.read_csv(file_path)

# Re-apply previous preprocessing steps for robustness
df['InvoiceDate'] = pd.to_datetime(df['InvoiceDate'])
df['Customer ID'] = df['Customer ID'].fillna(0).astype(int)
df['Description'] = df['Description'].fillna('Unknown')

print("Separating sales and returns based on 'Quantity'...")
sales_df = df[df['Quantity'] > 0]
returns_df = df[df['Quantity'] < 0]

print(f"Original DataFrame shape: {df.shape}")
print(f"Sales DataFrame shape (Quantity > 0): {sales_df.shape}")
print(f"Returns DataFrame shape (Quantity < 0): {returns_df.shape}")

# In a real scenario, you might save these separated DataFrames:
# sales_df.to_csv('/root/FCA/data/online_retail_ii/online_retail_II_sales.csv', index=False)
# returns_df.to_csv('/root/FCA/data/online_retail_ii/online_retail_II_returns.csv', index=False)