from flask import Flask, send_from_directory, request, jsonify
import pandas as pd
from datasets import load_dataset
import os

app = Flask(__name__, static_folder='../frontend')

# Define dataset paths and types - Updated with all processed datasets
dataset_configs = {
    "online_retail_ii": {
        "path": "/root/FCA/data/online_retail_ii/online_retail_II.csv",
        "type": "csv"
    },
    "creditcardfraud": {
        "path": "/root/FCA/data/creditcardfraud/creditcard.csv",
        "type": "csv"
    },
    "credit_card_fraud_2023": {
        "path": "/root/FCA/data/credit_card_fraud_2023/creditcard_2023_processed.csv",
        "type": "csv"
    },
    "hf_creditcardfraud": {
        "path": "/root/FCA/data/hf_creditcard_fraud/hf_creditcard_processed.csv",
        "type": "csv"
    },
    "financial_phrasebank": {
        "path": "/root/FCA/data/financial_phrasebank/financial_sentences_processed.csv",
        "type": "csv"
    },
    "ibm_aml": {
        "path": "/root/FCA/data/ibm_aml/",
        "type": "empty"
    },
    "incribo_fraud": {
        "path": "/root/FCA/data/incribo_fraud/incribo_fraud_processed.csv",
        "type": "csv"
    },
    "wamc_fraud": {
        "path": "/root/FCA/data/wamc_fraud/wamc_fraud_processed.csv",
        "type": "csv"
    },
    "customer_attrition": {
        "path": "/root/FCA/data/customer_attrition/customer_attrition_processed.csv",
        "type": "csv"
    },
    "dhanush_fraud": {
        "path": "/root/FCA/data/dhanush_fraud/dhanush_fraud_processed.csv",
        "type": "csv"
    }
}

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/datasets')
def datasets():
    return send_from_directory(app.static_folder, 'datasets.html')

@app.route('/work_flow.xml')
def workflow_xml():
    return send_from_directory('/root/FCA', 'work_flow.xml')

@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory(app.static_folder + '/js', filename)

@app.route('/get_dataset_head/<dataset_name>')
def get_dataset_head(dataset_name):
    config = dataset_configs.get(dataset_name)
    if not config:
        return f"<p class='error'>Dataset '{dataset_name}' not found in configuration.</p>", 404

    try:
        if config["type"] == "empty":
            return f"""
            <div class="alert alert-warning">
                <h4>Dataset Not Available</h4>
                <p>The <strong>{dataset_name}</strong> dataset could not be downloaded due to infrastructure limitations.</p>
                <p>Status: Download failed (timeout errors)</p>
            </div>
            """

        if config["type"] == "csv":
            if not os.path.exists(config["path"]):
                return f"<p class='error'>File not found: {config['path']}</p>", 404
            
            df = pd.read_csv(config["path"])
        elif config["type"] == "hf":
            dataset = load_dataset(config["path"], split="train")
            df = dataset.to_pandas()
        else:
            return f"<p class='error'>Unknown dataset type: {config['type']}</p>", 400

        if df is not None and len(df) > 0:
            # Get basic info
            rows, cols = df.shape
            memory_usage = df.memory_usage(deep=True).sum() / 1024 / 1024  # MB
            
            # Create info header
            info_html = f"""
            <div class="dataset-info-header" style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
                <h4 style="margin: 0 0 10px 0; color: #0056b3;">Dataset: {dataset_name}</h4>
                <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                    <span><strong>Rows:</strong> {rows:,}</span>
                    <span><strong>Columns:</strong> {cols}</span>
                    <span><strong>Memory:</strong> {memory_usage:.1f} MB</span>
                    <span><strong>File:</strong> {os.path.basename(config['path'])}</span>
                </div>
            </div>
            """
            
            # Get column info
            columns_info = []
            for col in df.columns:
                dtype = str(df[col].dtype)
                null_count = df[col].isnull().sum()
                null_pct = (null_count / len(df)) * 100 if len(df) > 0 else 0
                columns_info.append(f"{col} ({dtype}, {null_count} nulls, {null_pct:.1f}%)")
            
            columns_html = f"""
            <div style="margin-bottom: 15px;">
                <strong>Columns:</strong> {', '.join(columns_info[:5])}
                {'...' if len(columns_info) > 5 else ''}
            </div>
            """
            
            # Generate table with better styling
            table_html = df.head(10).to_html(
                classes="table table-striped table-hover",
                table_id="dataset-preview-table",
                escape=False
            )
            
            return info_html + columns_html + table_html
        else:
            return "<p class='error'>Dataset is empty or failed to load.</p>", 500

    except FileNotFoundError:
        return f"<p class='error'>File not found: {config['path']}</p>", 404
    except pd.errors.EmptyDataError:
        return "<p class='error'>The CSV file is empty.</p>", 400
    except Exception as e:
        return f"<p class='error'>Error loading dataset: {str(e)}</p>", 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)