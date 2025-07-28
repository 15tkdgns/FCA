import pandas as pd

file_path = '/root/FCA/data/online_retail_ii/online_retail_II.csv'
df = pd.read_csv(file_path)

print("Converting 'InvoiceDate' to datetime...")
df['InvoiceDate'] = pd.to_datetime(df['InvoiceDate'])

print("Checking updated info:")
print(df.info())

# Save the processed DataFrame back to a new CSV or overwrite the old one
# For now, we'll just print info, but in a real scenario, you'd save it.
# df.to_csv('/root/FCA/data/online_retail_ii/online_retail_II_processed.csv', index=False)