import os
import kaggle

dataset_name = "nelgiriyewithana/credit-card-fraud-detection-dataset-2023"
output_dir = "/root/FCA/data/credit_card_fraud_2023"

os.makedirs(output_dir, exist_ok=True)

print(f"Downloading Kaggle dataset '{dataset_name}' to {output_dir}...")
kaggle.api.dataset_download_files(dataset_name, path=output_dir, unzip=True)
print("Download complete.")