#!/usr/bin/env python3
"""
Data Bundle Creator for FCA Dashboard
=====================================

Combines all JSON data files into a single bundle to reduce HTTP requests.
"""

import json
import os
from pathlib import Path

def bundle_data():
    """Bundle all JSON data files into a single file"""
    
    data_dir = Path(__file__).parent / 'data'
    bundle_file = data_dir / 'bundle.json'
    
    if not data_dir.exists():
        print("❌ Data directory not found")
        return False
    
    bundle = {}
    total_size = 0
    
    print("📦 Bundling data files...")
    
    # List of data files to bundle
    data_files = [
        'summary.json',
        'fraud_data.json',
        'sentiment_data.json', 
        'attrition_data.json',
        'charts.json',
        'datasets.json',
        'xai_data.json'
    ]
    
    for file_name in data_files:
        file_path = data_dir / file_name
        if file_path.exists():
            try:
                with open(file_path, 'r') as f:
                    data = json.load(f)
                    key = file_name.replace('.json', '')
                    bundle[key] = data
                    
                    file_size = file_path.stat().st_size
                    total_size += file_size
                    print(f"  ✅ {file_name} ({file_size:,} bytes)")
                    
            except Exception as e:
                print(f"  ❌ {file_name}: {e}")
        else:
            print(f"  ⚠️ {file_name}: Not found")
    
    # Write bundle file
    try:
        with open(bundle_file, 'w') as f:
            json.dump(bundle, f, separators=(',', ':'))  # Compact format
        
        bundle_size = bundle_file.stat().st_size
        compression_ratio = (1 - bundle_size / total_size) * 100 if total_size > 0 else 0
        
        print(f"\n📊 Bundle created:")
        print(f"  Original size: {total_size:,} bytes")
        print(f"  Bundle size:   {bundle_size:,} bytes")
        print(f"  Compression:   {compression_ratio:.1f}%")
        print(f"  Files:         {len(bundle)} files bundled")
        print(f"  Output:        {bundle_file}")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to create bundle: {e}")
        return False

if __name__ == '__main__':
    success = bundle_data()
    exit(0 if success else 1)