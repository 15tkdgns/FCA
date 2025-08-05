#!/usr/bin/env python3
"""
Base Sentiment Analyzer
=======================

Core sentiment analysis functionality and configuration
"""

import pandas as pd
import numpy as np
import logging
from typing import Dict, List, Tuple, Optional, Any, Union
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

class BaseSentimentAnalyzer:
    """
    Base sentiment analysis system with configuration and common utilities
    """
    
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or self._default_config()
        self.is_trained = False
        self.label_encoder = None
        
        # Financial sentiment lexicon
        self.financial_lexicon = self._build_financial_lexicon()
        
    def _default_config(self) -> Dict:
        """Default configuration for sentiment analysis"""
        return {
            'vectorizer': {
                'max_features': 10000,
                'ngram_range': (1, 2),
                'min_df': 2,
                'max_df': 0.95
            },
            'models': {
                'svm': {
                    'C': 1.0,
                    'kernel': 'linear',
                    'random_state': 42
                },
                'naive_bayes': {
                    'alpha': 1.0
                },
                'logistic_regression': {
                    'C': 1.0,
                    'random_state': 42,
                    'max_iter': 1000
                }
            },
            'ensemble_weights': {
                'svm': 0.3,
                'naive_bayes': 0.2,
                'logistic_regression': 0.3,
                'vader': 0.1,
                'financial_lexicon': 0.1
            }
        }
    
    def _build_financial_lexicon(self) -> Dict[str, float]:
        """Build financial domain-specific sentiment lexicon"""
        positive_financial_terms = {
            'profit': 0.8, 'growth': 0.7, 'revenue': 0.6, 'earnings': 0.6,
            'bullish': 0.9, 'surge': 0.8, 'rally': 0.7, 'outperform': 0.8,
            'dividend': 0.6, 'buyback': 0.7, 'acquisition': 0.5, 'merger': 0.5,
            'beat': 0.7, 'exceed': 0.6, 'strong': 0.6, 'solid': 0.5,
            'upgrade': 0.8, 'buy': 0.6, 'recommend': 0.5, 'bullish': 0.9,
            'gain': 0.7, 'rise': 0.6, 'increase': 0.5, 'positive': 0.7,
            'optimistic': 0.8, 'confident': 0.7, 'opportunity': 0.6
        }
        
        negative_financial_terms = {
            'loss': -0.8, 'decline': -0.7, 'fall': -0.6, 'drop': -0.6,
            'bearish': -0.9, 'crash': -1.0, 'plunge': -0.9, 'underperform': -0.8,
            'bankruptcy': -1.0, 'debt': -0.6, 'deficit': -0.7, 'recession': -0.9,
            'miss': -0.7, 'disappoint': -0.6, 'weak': -0.6, 'poor': -0.7,
            'downgrade': -0.8, 'sell': -0.6, 'avoid': -0.7, 'bearish': -0.9,
            'volatile': -0.5, 'uncertainty': -0.6, 'risk': -0.5, 'concern': -0.6,
            'pessimistic': -0.8, 'cautious': -0.4, 'threat': -0.7
        }
        
        return {**positive_financial_terms, **negative_financial_terms}
    
    def calculate_financial_sentiment(self, text: str) -> float:
        """Calculate sentiment score using financial lexicon"""
        if pd.isna(text) or not isinstance(text, str):
            return 0.0
        
        words = text.lower().split()
        sentiment_score = 0.0
        word_count = 0
        
        for word in words:
            if word in self.financial_lexicon:
                sentiment_score += self.financial_lexicon[word]
                word_count += 1
        
        return sentiment_score / max(word_count, 1)
    
    def validate_input_data(self, df: pd.DataFrame, text_column: str, 
                          target_column: str = None) -> Tuple[bool, str]:
        """Validate input data for sentiment analysis"""
        try:
            if df is None or df.empty:
                return False, "Empty or None DataFrame provided"
            
            if text_column not in df.columns:
                return False, f"Text column '{text_column}' not found in DataFrame"
            
            if target_column and target_column not in df.columns:
                return False, f"Target column '{target_column}' not found in DataFrame"
            
            # Check for minimum data requirements
            if len(df) < 10:
                return False, "Insufficient data: minimum 10 samples required"
            
            # Check text data quality
            valid_texts = df[text_column].dropna().astype(str)
            if len(valid_texts) < len(df) * 0.8:
                return False, "Too many missing or invalid text entries"
            
            return True, "Data validation passed"
            
        except Exception as e:
            logger.error(f"Error validating input data: {e}")
            return False, f"Validation error: {str(e)}"
    
    def get_sentiment_statistics(self, sentiments: List[str]) -> Dict[str, Any]:
        """Calculate sentiment distribution statistics"""
        try:
            sentiment_counts = pd.Series(sentiments).value_counts()
            total = len(sentiments)
            
            return {
                'distribution': sentiment_counts.to_dict(),
                'percentages': {k: (v / total) * 100 for k, v in sentiment_counts.items()},
                'total_samples': total,
                'unique_sentiments': len(sentiment_counts)
            }
            
        except Exception as e:
            logger.error(f"Error calculating sentiment statistics: {e}")
            return {}
    
    def format_sentiment_results(self, predictions: Dict[str, Any]) -> Dict[str, Any]:
        """Format prediction results for consistent output"""
        try:
            formatted_results = {
                'status': 'success',
                'timestamp': datetime.now().isoformat(),
                'model_info': {
                    'is_trained': self.is_trained,
                    'config': self.config
                },
                'predictions': predictions
            }
            
            # Add summary statistics if ensemble predictions exist
            if 'ensemble_prediction' in predictions:
                ensemble_preds = predictions['ensemble_prediction']
                sentiments = [pred['sentiment'] for pred in ensemble_preds]
                confidences = [pred['confidence'] for pred in ensemble_preds]
                
                formatted_results['summary'] = {
                    'sentiment_distribution': self.get_sentiment_statistics(sentiments),
                    'average_confidence': np.mean(confidences),
                    'confidence_std': np.std(confidences),
                    'high_confidence_count': sum(1 for c in confidences if c > 0.8)
                }
            
            return formatted_results
            
        except Exception as e:
            logger.error(f"Error formatting results: {e}")
            return {
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get model information and status"""
        return {
            'is_trained': self.is_trained,
            'config': self.config,
            'financial_lexicon_size': len(self.financial_lexicon),
            'available_methods': [
                'financial_lexicon',
                'vader_sentiment',
                'ml_models' if self.is_trained else 'ml_models (not trained)'
            ]
        }
    
    def reset_model(self):
        """Reset model to untrained state"""
        self.is_trained = False
        self.label_encoder = None
        logger.info("Sentiment analyzer reset to untrained state")
    
    def get_feature_names(self) -> List[str]:
        """Get list of available feature extraction methods"""
        return [
            'tfidf_features',
            'vader_features', 
            'financial_lexicon_features',
            'text_statistics'
        ]