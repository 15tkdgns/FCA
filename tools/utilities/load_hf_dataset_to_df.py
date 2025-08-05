import os
from datasets import load_dataset
import pandas as pd

print("Loading HuggingFace dataset 'dazzle-nu/CIS435-CreditCardFraudDetection'...")
dataset = load_dataset("dazzle-nu/CIS435-CreditCardFraudDetection", split="train")

print("Converting to Pandas DataFrame...")
df = dataset.to_pandas()

print("DataFrame head:")
print(df.head())