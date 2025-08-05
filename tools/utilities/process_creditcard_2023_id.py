import pandas as pd

file_path = '/root/FCA/data/credit_card_fraud_2023/creditcard_2023.csv'
df = pd.read_csv(file_path)

print("Dropping 'id' column...")
df = df.drop('id', axis=1)

print("Checking updated info and head:")
print(df.info())
print(df.head())

# In a real scenario, you would save the processed DataFrame:
# df.to_csv('/root/FCA/data/credit_card_fraud_2023/creditcard_2023_processed.csv', index=False)