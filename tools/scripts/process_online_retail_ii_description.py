import pandas as pd

file_path = '/root/FCA/data/online_retail_ii/online_retail_II.csv'
df = pd.read_csv(file_path)

# Convert InvoiceDate to datetime
df['InvoiceDate'] = pd.to_datetime(df['InvoiceDate'])

# Handle missing Customer ID and convert to int
df['Customer ID'] = df['Customer ID'].fillna(0).astype(int)

print("Handling missing 'Description'...")
df['Description'] = df['Description'].fillna('Unknown')

print("Checking updated info and Description value counts:")
print(df.info())
print(df['Description'].value_counts(dropna=False).head())

# In a real scenario, you would save the processed DataFrame:
# df.to_csv('/root/FCA/data/online_retail_ii/online_retail_II_processed.csv', index=False)