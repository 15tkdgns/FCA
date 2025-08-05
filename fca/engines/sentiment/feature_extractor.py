#!/usr/bin/env python3
"""
Sentiment Feature Extractor
===========================

Feature extraction for sentiment analysis
"""

import pandas as pd
import numpy as np
import re
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from sklearn.feature_extraction.text import TfidfVectorizer
from typing import Dict, List, Tuple, Optional, Any, Union
import logging

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('tokenizers/punkt_tab')
except LookupError:
    nltk.download('punkt_tab')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('wordnet')

try:
    nltk.data.find('vader_lexicon')
except LookupError:
    nltk.download('vader_lexicon')

logger = logging.getLogger(__name__)

class SentimentFeatureExtractor:
    """Extract features from text for sentiment analysis"""
    
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}
        
        # Initialize NLTK components
        self.stop_words = set(stopwords.words('english'))
        self.lemmatizer = WordNetLemmatizer()
        self.vader_analyzer = SentimentIntensityAnalyzer()
        
        # Initialize TF-IDF vectorizer
        vectorizer_config = self.config.get('vectorizer', {})
        self.tfidf_vectorizer = TfidfVectorizer(**vectorizer_config)
        
        # Financial lexicon will be passed from base analyzer
        self.financial_lexicon = {}
    
    def set_financial_lexicon(self, lexicon: Dict[str, float]):
        """Set financial lexicon for feature extraction"""
        self.financial_lexicon = lexicon
    
    def preprocess_text(self, text: str) -> str:
        """
        Preprocess text for sentiment analysis
        
        Args:
            text: Raw text input
            
        Returns:
            Cleaned and preprocessed text
        """
        if pd.isna(text) or not isinstance(text, str):
            return ""
        
        try:
            # Convert to lowercase
            text = text.lower()
            
            # Remove special characters and digits but keep spaces
            text = re.sub(r'[^a-zA-Z\s]', '', text)
            
            # Tokenize
            tokens = word_tokenize(text)
            
            # Remove stopwords and lemmatize
            tokens = [
                self.lemmatizer.lemmatize(token) 
                for token in tokens 
                if token not in self.stop_words and len(token) > 2
            ]
            
            return ' '.join(tokens)
            
        except Exception as e:
            logger.error(f"Error preprocessing text: {e}")
            return ""
    
    def extract_tfidf_features(self, texts: List[str], fit: bool = True) -> np.ndarray:
        """
        Extract TF-IDF features from texts
        
        Args:
            texts: List of text strings
            fit: Whether to fit the vectorizer (True for training, False for prediction)
            
        Returns:
            TF-IDF feature matrix
        """
        try:
            # Preprocess texts
            processed_texts = [self.preprocess_text(text) for text in texts]
            
            if fit:
                features = self.tfidf_vectorizer.fit_transform(processed_texts)
            else:
                features = self.tfidf_vectorizer.transform(processed_texts)
            
            return features
            
        except Exception as e:
            logger.error(f"Error extracting TF-IDF features: {e}")
            return np.array([])
    
    def extract_vader_features(self, texts: List[str]) -> np.ndarray:
        """
        Extract VADER sentiment features
        
        Args:
            texts: List of text strings
            
        Returns:
            VADER feature matrix [pos, neu, neg, compound]
        """
        try:
            vader_features = []
            
            for text in texts:
                if pd.isna(text) or not isinstance(text, str):
                    # Default neutral scores for invalid text
                    vader_features.append([0.0, 1.0, 0.0, 0.0])
                else:
                    scores = self.vader_analyzer.polarity_scores(text)
                    vader_features.append([
                        scores['pos'], 
                        scores['neu'], 
                        scores['neg'], 
                        scores['compound']
                    ])
            
            return np.array(vader_features)
            
        except Exception as e:
            logger.error(f"Error extracting VADER features: {e}")
            return np.zeros((len(texts), 4))
    
    def extract_financial_features(self, texts: List[str]) -> np.ndarray:
        """
        Extract financial lexicon-based features
        
        Args:
            texts: List of text strings
            
        Returns:
            Financial sentiment feature matrix
        """
        try:
            financial_features = []
            
            for text in texts:
                if pd.isna(text) or not isinstance(text, str):
                    financial_features.append([0.0])
                else:
                    score = self._calculate_financial_sentiment(text)
                    financial_features.append([score])
            
            return np.array(financial_features)
            
        except Exception as e:
            logger.error(f"Error extracting financial features: {e}")
            return np.zeros((len(texts), 1))
    
    def _calculate_financial_sentiment(self, text: str) -> float:
        """Calculate sentiment score using financial lexicon"""
        if not self.financial_lexicon:
            return 0.0
        
        words = text.lower().split()
        sentiment_score = 0.0
        word_count = 0
        
        for word in words:
            if word in self.financial_lexicon:
                sentiment_score += self.financial_lexicon[word]
                word_count += 1
        
        return sentiment_score / max(word_count, 1)
    
    def extract_text_statistics(self, texts: List[str]) -> np.ndarray:
        """
        Extract statistical features from texts
        
        Args:
            texts: List of text strings
            
        Returns:
            Text statistics feature matrix
        """
        try:
            stats_features = []
            
            for text in texts:
                if pd.isna(text) or not isinstance(text, str):
                    stats_features.append([0, 0, 0, 0, 0])
                else:
                    # Calculate various text statistics
                    char_count = len(text)
                    word_count = len(text.split())
                    sentence_count = len(re.split(r'[.!?]+', text))
                    avg_word_length = np.mean([len(word) for word in text.split()]) if word_count > 0 else 0
                    exclamation_count = text.count('!')
                    
                    stats_features.append([
                        char_count,
                        word_count, 
                        sentence_count,
                        avg_word_length,
                        exclamation_count
                    ])
            
            return np.array(stats_features)
            
        except Exception as e:
            logger.error(f"Error extracting text statistics: {e}")
            return np.zeros((len(texts), 5))
    
    def extract_all_features(self, texts: List[str], fit: bool = True) -> Dict[str, np.ndarray]:
        """
        Extract all types of features from texts
        
        Args:
            texts: List of text strings
            fit: Whether to fit vectorizers (True for training, False for prediction)
            
        Returns:
            Dictionary containing different feature representations
        """
        try:
            features = {}
            
            # TF-IDF features
            features['tfidf'] = self.extract_tfidf_features(texts, fit=fit)
            
            # VADER sentiment features
            features['vader'] = self.extract_vader_features(texts)
            
            # Financial lexicon features
            features['financial'] = self.extract_financial_features(texts)
            
            # Text statistics
            features['statistics'] = self.extract_text_statistics(texts)
            
            # Store processed texts for reference
            features['processed_texts'] = [self.preprocess_text(text) for text in texts]
            
            return features
            
        except Exception as e:
            logger.error(f"Error extracting all features: {e}")
            return {}
    
    def get_feature_names(self) -> Dict[str, List[str]]:
        """Get feature names for interpretability"""
        try:
            feature_names = {}
            
            # TF-IDF feature names
            if hasattr(self.tfidf_vectorizer, 'get_feature_names_out'):
                feature_names['tfidf'] = self.tfidf_vectorizer.get_feature_names_out().tolist()
            else:
                feature_names['tfidf'] = []
            
            # VADER feature names
            feature_names['vader'] = ['pos', 'neu', 'neg', 'compound']
            
            # Financial feature names
            feature_names['financial'] = ['financial_sentiment']
            
            # Statistics feature names
            feature_names['statistics'] = [
                'char_count', 'word_count', 'sentence_count', 
                'avg_word_length', 'exclamation_count'
            ]
            
            return feature_names
            
        except Exception as e:
            logger.error(f"Error getting feature names: {e}")
            return {}
    
    def get_vectorizer_info(self) -> Dict[str, Any]:
        """Get information about the vectorizer"""
        return {
            'vectorizer_type': 'TfidfVectorizer',
            'is_fitted': hasattr(self.tfidf_vectorizer, 'vocabulary_'),
            'vocabulary_size': len(getattr(self.tfidf_vectorizer, 'vocabulary_', {})),
            'config': self.config.get('vectorizer', {})
        }