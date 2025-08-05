import pandas as pd

file_path = '/root/FCA/data/online_retail_ii/online_retail_II.csv'
df = pd.read_csv(file_path)

# Convert InvoiceDate to datetime (re-apply for robustness)
df['InvoiceDate'] = pd.to_datetime(df['InvoiceDate'])

print("Handling missing 'Customer ID' and converting to int...")
# Fill NaN with 0, then convert to Int64 (Pandas nullable integer type)
df['Customer ID'] = df['Customer ID'].fillna(0).astype(int)

print("Checking updated info and Customer ID value counts:")
print(df.info())
print(df['Customer ID'].value_counts(dropna=False).head())

# In a real scenario, you would save the processed DataFrame:
# df.to_csv('/root/FCA/data/online_retail_ii/online_retail_II_processed.csv', index=False)