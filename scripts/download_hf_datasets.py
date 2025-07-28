import os
from datasets import load_dataset

output_dir = "/root/FCA/data/financial_phrasebank"
os.makedirs(output_dir, exist_ok=True)

print(f"Downloading Financial Phrasebank dataset to {output_dir}...")
dataset = load_dataset("financial_phrasebank", "sentences_allagree")

# Save the dataset to disk
dataset.save_to_disk(output_dir)
print("Download complete.")