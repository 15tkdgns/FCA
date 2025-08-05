import pandas as pd

file_path = '/root/FCA/data/online_retail_ii/online_retail_II.csv'
df = pd.read_csv(file_path)

# Re-apply previous preprocessing steps for robustness
df['InvoiceDate'] = pd.to_datetime(df['InvoiceDate'])
df['Customer ID'] = df['Customer ID'].fillna(0).astype(int)
df['Description'] = df['Description'].fillna('Unknown')

# Feature Engineering: TotalPrice
print("Creating 'TotalPrice' feature...")
df['TotalPrice'] = df['Quantity'] * df['Price']

# Feature Engineering: Time-based features from InvoiceDate
print("Extracting time-based features from 'InvoiceDate'...")
df['Year'] = df['InvoiceDate'].dt.year
df['Month'] = df['InvoiceDate'].dt.month
df['Day'] = df['InvoiceDate'].dt.day
df['Hour'] = df['InvoiceDate'].dt.hour

print("Checking updated info and head with new features:")
print(df.info())
print(df.head())

# In a real scenario, you would save the processed DataFrame:
# df.to_csv('/root/FCA/data/online_retail_ii/online_retail_II_features.csv', index=False)