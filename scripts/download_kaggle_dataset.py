import os
import kaggle

dataset_name = "ealtman2019/ibm-transactions-for-anti-money-laundering-aml"
output_dir = "/root/FCA/data/ibm_aml"

os.makedirs(output_dir, exist_ok=True)

print(f"Downloading Kaggle dataset '{dataset_name}' to {output_dir}...")
kaggle.api.dataset_download_files(dataset_name, path=output_dir, unzip=True)
print("Download complete.")