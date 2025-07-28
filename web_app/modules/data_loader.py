#!/usr/bin/env python3
"""
Data Loader Module
Handles loading and caching of analysis results
"""

import pandas as pd
import json
import os
from typing import Dict, Optional, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataLoader:
    """Centralized data loading and caching system"""
    
    def __init__(self, docs_dir: str = "/root/FCA/docs"):
        self.docs_dir = docs_dir
        self._cache = {}
        self._file_configs = {
            'fraud_results': 'quick_model_results.csv',
            'sentiment_results': 'sentiment_model_results.csv',
            'attrition_results': 'customer_attrition_model_results.csv',
            'eda_report': 'eda_report.json'
        }
    
    def get_fraud_results(self) -> Optional[pd.DataFrame]:
        """Load fraud detection model results"""
        return self._load_csv('fraud_results')
    
    def get_sentiment_results(self) -> Optional[pd.DataFrame]:
        """Load sentiment analysis model results"""
        return self._load_csv('sentiment_results')
    
    def get_attrition_results(self) -> Optional[pd.DataFrame]:
        """Load customer attrition model results"""
        return self._load_csv('attrition_results')
    
    def get_eda_report(self) -> Optional[Dict[str, Any]]:
        """Load EDA report data"""
        return self._load_json('eda_report')
    
    def get_all_results(self) -> Dict[str, Any]:
        """Load all analysis results"""
        return {
            'fraud': self.get_fraud_results(),
            'sentiment': self.get_sentiment_results(),
            'attrition': self.get_attrition_results(),
            'eda': self.get_eda_report()
        }
    
    def get_summary_stats(self) -> Dict[str, Any]:
        """Generate summary statistics across all results"""
        fraud_df = self.get_fraud_results()
        sentiment_df = self.get_sentiment_results()
        attrition_df = self.get_attrition_results()
        
        if fraud_df is None or sentiment_df is None or attrition_df is None:
            return {}
        
        # Calculate summary metrics
        total_models = len(fraud_df) + len(sentiment_df) + len(attrition_df)
        
        # Average performance by domain
        fraud_avg = fraud_df['AUC-ROC'].astype(float).mean()
        sentiment_avg = sentiment_df['Accuracy'].astype(float).mean()
        attrition_avg = attrition_df['AUC-ROC'].astype(float).mean()
        
        # Best performers
        best_fraud = fraud_df.loc[fraud_df['AUC-ROC'].astype(float).idxmax()]
        best_sentiment = sentiment_df.loc[sentiment_df['Accuracy'].astype(float).idxmax()]
        best_attrition = attrition_df.loc[attrition_df['AUC-ROC'].astype(float).idxmax()]
        
        return {
            'total_models': total_models,
            'domains': 3,
            'datasets': 7,
            'performance': {
                'fraud_avg': round(fraud_avg, 3),
                'sentiment_avg': round(sentiment_avg, 3),
                'attrition_avg': round(attrition_avg, 3),
                'overall_avg': round((fraud_avg + sentiment_avg + attrition_avg) / 3, 3)
            },
            'best_performers': {
                'fraud': {
                    'model': best_fraud['Model'],
                    'dataset': best_fraud['Dataset'],
                    'score': float(best_fraud['AUC-ROC'])
                },
                'sentiment': {
                    'model': best_sentiment['Model'],
                    'score': float(best_sentiment['Accuracy'])
                },
                'attrition': {
                    'model': best_attrition['Model'],
                    'score': float(best_attrition['AUC-ROC'])
                }
            }
        }
    
    def get_available_images(self) -> Dict[str, str]:
        """Get list of available visualization images"""
        image_files = {
            'dashboard': 'simple_model_dashboard.png',
            'fraud_distributions': 'fraud_class_distributions.png',
            'correlation_matrix': 'correlation_matrix.png',
            'sentiment_analysis': 'sentiment_analysis_results.png',
            'sentiment_distribution': 'sentiment_distribution.png',
            'customer_attrition': 'customer_attrition_results.png'
        }
        
        available_images = {}
        for key, filename in image_files.items():
            file_path = os.path.join(self.docs_dir, filename)
            if os.path.exists(file_path):
                available_images[key] = filename
        
        return available_images
    
    def _load_csv(self, key: str) -> Optional[pd.DataFrame]:
        """Load CSV file with caching"""
        if key in self._cache:
            return self._cache[key]
        
        filename = self._file_configs.get(key)
        if not filename:
            logger.error(f"No file configuration found for key: {key}")
            return None
        
        file_path = os.path.join(self.docs_dir, filename)
        
        try:
            if os.path.exists(file_path):
                df = pd.read_csv(file_path)
                self._cache[key] = df
                logger.info(f"Loaded {key} from {filename}")
                return df
            else:
                logger.warning(f"File not found: {file_path}")
                return None
        except Exception as e:
            logger.error(f"Error loading {filename}: {e}")
            return None
    
    def _load_json(self, key: str) -> Optional[Dict[str, Any]]:
        """Load JSON file with caching"""
        if key in self._cache:
            return self._cache[key]
        
        filename = self._file_configs.get(key)
        if not filename:
            logger.error(f"No file configuration found for key: {key}")
            return None
        
        file_path = os.path.join(self.docs_dir, filename)
        
        try:
            if os.path.exists(file_path):
                with open(file_path, 'r') as f:
                    data = json.load(f)
                self._cache[key] = data
                logger.info(f"Loaded {key} from {filename}")
                return data
            else:
                logger.warning(f"File not found: {file_path}")
                return None
        except Exception as e:
            logger.error(f"Error loading {filename}: {e}")
            return None
    
    def clear_cache(self):
        """Clear the data cache"""
        self._cache.clear()
        logger.info("Data cache cleared")
    
    def health_check(self) -> Dict[str, bool]:
        """Check availability of all data sources"""
        health = {}
        
        for key, filename in self._file_configs.items():
            file_path = os.path.join(self.docs_dir, filename)
            health[key] = os.path.exists(file_path)
        
        return health