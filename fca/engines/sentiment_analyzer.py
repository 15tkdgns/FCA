#!/usr/bin/env python3
"""
Sentiment Analysis Engine
========================

Advanced sentiment analysis using multiple approaches:
- BERT-based transformer models
- Traditional ML models (SVM, Naive Bayes)
- Lexicon-based analysis
- Financial domain-specific sentiment detection
"""

import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.svm import SVC
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.preprocessing import LabelEncoder
import re
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
import joblib
import logging
from typing import Dict, List, Tuple, Optional, Any, Union
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

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

class SentimentAnalyzer:
    """
    Advanced sentiment analysis system with multiple approaches:
    1. Machine learning models (SVM, Naive Bayes, Logistic Regression)
    2. VADER sentiment analyzer
    3. Financial domain-specific lexicon
    4. Ensemble prediction with confidence scoring
    """
    
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or self._default_config()
        self.models = {}
        self.vectorizers = {}
        self.label_encoder = LabelEncoder()
        self.is_trained = False
        
        # Initialize NLTK components
        self.stop_words = set(stopwords.words('english'))
        self.lemmatizer = WordNetLemmatizer()
        self.vader_analyzer = SentimentIntensityAnalyzer()
        
        # Initialize models
        self._initialize_models()
        
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
    
    def _initialize_models(self):
        """Initialize ML models with configuration"""
        config = self.config['models']
        self.models = {
            'svm': SVC(probability=True, **config['svm']),
            'naive_bayes': MultinomialNB(**config['naive_bayes']),
            'logistic_regression': LogisticRegression(**config['logistic_regression'])
        }
        
        # Initialize vectorizer
        self.vectorizers['tfidf'] = TfidfVectorizer(**self.config['vectorizer'])
    
    def _build_financial_lexicon(self) -> Dict[str, float]:
        """Build financial domain-specific sentiment lexicon"""
        positive_financial_terms = {
            'profit': 0.8, 'growth': 0.7, 'revenue': 0.6, 'earnings': 0.6,
            'bullish': 0.9, 'surge': 0.8, 'rally': 0.7, 'outperform': 0.8,
            'dividend': 0.6, 'buyback': 0.7, 'acquisition': 0.5, 'merger': 0.5,
            'beat': 0.7, 'exceed': 0.6, 'strong': 0.6, 'solid': 0.5,
            'upgrade': 0.8, 'buy': 0.6, 'recommend': 0.5, 'bullish': 0.9
        }
        
        negative_financial_terms = {
            'loss': -0.8, 'decline': -0.7, 'fall': -0.6, 'drop': -0.6,
            'bearish': -0.9, 'crash': -1.0, 'plunge': -0.9, 'underperform': -0.8,
            'bankruptcy': -1.0, 'debt': -0.6, 'deficit': -0.7, 'recession': -0.9,
            'miss': -0.7, 'disappoint': -0.6, 'weak': -0.6, 'poor': -0.7,
            'downgrade': -0.8, 'sell': -0.6, 'avoid': -0.7, 'bearish': -0.9
        }
        
        return {**positive_financial_terms, **negative_financial_terms}
    
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
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove special characters and digits
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
    
    def extract_features(self, texts: List[str]) -> Dict[str, Any]:
        """
        Extract features from text data
        
        Args:
            texts: List of text strings
            
        Returns:
            Dictionary containing different feature representations
        """
        # Preprocess texts
        processed_texts = [self.preprocess_text(text) for text in texts]
        
        # TF-IDF features
        if not hasattr(self.vectorizers['tfidf'], 'vocabulary_'):
            tfidf_features = self.vectorizers['tfidf'].fit_transform(processed_texts)
        else:
            tfidf_features = self.vectorizers['tfidf'].transform(processed_texts)
        
        # VADER sentiment features
        vader_features = []
        for text in texts:
            scores = self.vader_analyzer.polarity_scores(text)
            vader_features.append([
                scores['pos'], scores['neu'], scores['neg'], scores['compound']
            ])
        
        # Financial lexicon features
        financial_features = []
        for text in texts:
            financial_score = self._calculate_financial_sentiment(text)
            financial_features.append([financial_score])
        
        return {
            'tfidf': tfidf_features,
            'vader': np.array(vader_features),
            'financial': np.array(financial_features),
            'processed_texts': processed_texts
        }
    
    def _calculate_financial_sentiment(self, text: str) -> float:
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
    
    def train(self, df: pd.DataFrame, text_column: str = 'text', 
              target_column: str = 'sentiment') -> Dict[str, Any]:
        """
        Train sentiment analysis models
        
        Args:
            df: Training DataFrame
            text_column: Name of text column
            target_column: Name of target/label column
            
        Returns:
            Training results and performance metrics
        """
        logger.info("Starting sentiment analysis model training...")
        
        # Prepare data
        texts = df[text_column].astype(str).tolist()
        labels = df[target_column].tolist()
        
        # Encode labels
        labels_encoded = self.label_encoder.fit_transform(labels)
        
        # Extract features
        features = self.extract_features(texts)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            features['tfidf'], labels_encoded, test_size=0.2, 
            random_state=42, stratify=labels_encoded
        )
        
        results = {}
        
        # Train ML models
        for model_name, model in self.models.items():
            logger.info(f"Training {model_name}...")
            
            model.fit(X_train, y_train)
            
            # Evaluate model
            y_pred = model.predict(X_test)
            y_prob = model.predict_proba(X_test) if hasattr(model, 'predict_proba') else None
            
            results[model_name] = {
                'accuracy': accuracy_score(y_test, y_pred),
                'classification_report': classification_report(
                    y_test, y_pred, 
                    target_names=self.label_encoder.classes_,
                    output_dict=True
                ),
                'confusion_matrix': confusion_matrix(y_test, y_pred).tolist(),
                'cross_val_scores': cross_val_score(
                    model, X_train, y_train, cv=5
                ).tolist()
            }
            
            if y_prob is not None:
                results[model_name]['class_probabilities'] = y_prob.tolist()[:10]  # Sample
        
        # Evaluate ensemble on test set
        test_texts = [texts[i] for i in range(len(texts)) if i >= len(X_train)]
        if test_texts:
            ensemble_results = self._evaluate_ensemble(test_texts, y_test)
            results['ensemble'] = ensemble_results
        
        self.is_trained = True
        logger.info("Sentiment analysis model training completed!")
        
        return results
    
    def _evaluate_ensemble(self, texts: List[str], y_true: np.ndarray) -> Dict:
        """Evaluate ensemble prediction performance"""
        predictions = self.predict(texts)
        
        # Convert ensemble predictions to class labels
        predicted_labels = []
        for pred in predictions['ensemble_prediction']:
            if pred['sentiment'] == 'positive':
                predicted_labels.append(2)
            elif pred['sentiment'] == 'negative':
                predicted_labels.append(0)
            else:
                predicted_labels.append(1)
        
        accuracy = accuracy_score(y_true, predicted_labels)
        
        return {
            'accuracy': accuracy,
            'sample_predictions': predictions['ensemble_prediction'][:5]
        }
    
    def predict(self, texts: Union[str, List[str]]) -> Dict[str, Any]:
        """
        Predict sentiment for texts
        
        Args:
            texts: Single text string or list of texts
            
        Returns:
            Dictionary with predictions from all models and ensemble result
        """
        if not self.is_trained:
            raise ValueError("Models must be trained before making predictions")
        
        # Handle single text input
        if isinstance(texts, str):
            texts = [texts]
        
        # Extract features
        features = self.extract_features(texts)
        
        predictions = {}
        probabilities = {}
        
        # Get predictions from ML models
        for model_name, model in self.models.items():
            pred = model.predict(features['tfidf'])
            pred_labels = self.label_encoder.inverse_transform(pred)
            
            if hasattr(model, 'predict_proba'):
                prob = model.predict_proba(features['tfidf'])
                probabilities[model_name] = prob.tolist()
            
            predictions[model_name] = pred_labels.tolist()
        
        # VADER predictions
        vader_predictions = []
        vader_scores = []
        for scores in features['vader']:
            compound = scores[3]
            if compound >= 0.05:
                vader_predictions.append('positive')
            elif compound <= -0.05:
                vader_predictions.append('negative')
            else:
                vader_predictions.append('neutral')
            vader_scores.append(compound)
        
        predictions['vader'] = vader_predictions
        probabilities['vader'] = vader_scores
        
        # Financial lexicon predictions
        financial_predictions = []
        financial_scores = features['financial'].flatten().tolist()
        for score in financial_scores:
            if score >= 0.1:
                financial_predictions.append('positive')
            elif score <= -0.1:
                financial_predictions.append('negative')
            else:
                financial_predictions.append('neutral')
        
        predictions['financial_lexicon'] = financial_predictions
        probabilities['financial_lexicon'] = financial_scores
        
        # Ensemble prediction
        ensemble_predictions = self._ensemble_predict(predictions, probabilities)
        
        return {
            'individual_predictions': predictions,
            'individual_probabilities': probabilities,
            'ensemble_prediction': ensemble_predictions,
            'text_count': len(texts),
            'processed_texts': features['processed_texts']
        }
    
    def _ensemble_predict(self, predictions: Dict, probabilities: Dict) -> List[Dict]:
        """Create ensemble predictions with confidence scores"""
        ensemble_results = []
        weights = self.config['ensemble_weights']
        
        for i in range(len(next(iter(predictions.values())))):
            # Collect votes
            votes = {'positive': 0, 'negative': 0, 'neutral': 0}
            confidence_scores = []
            
            # ML model votes (weighted)
            for model_name in ['svm', 'naive_bayes', 'logistic_regression']:
                if model_name in predictions:
                    vote = predictions[model_name][i]
                    weight = weights.get(model_name, 0.1)
                    votes[vote] += weight
                    
                    # Add confidence based on probability
                    if model_name in probabilities:
                        prob_array = probabilities[model_name][i]
                        max_prob = max(prob_array)
                        confidence_scores.append(max_prob * weight)
            
            # VADER vote
            if 'vader' in predictions:
                vote = predictions['vader'][i]
                weight = weights.get('vader', 0.1)
                votes[vote] += weight
                
                # VADER confidence
                vader_score = abs(probabilities['vader'][i])
                confidence_scores.append(vader_score * weight)
            
            # Financial lexicon vote
            if 'financial_lexicon' in predictions:
                vote = predictions['financial_lexicon'][i]
                weight = weights.get('financial_lexicon', 0.1)
                votes[vote] += weight
                
                # Financial confidence
                fin_score = abs(probabilities['financial_lexicon'][i])
                confidence_scores.append(fin_score * weight)
            
            # Determine final prediction
            final_sentiment = max(votes, key=votes.get)
            confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.5
            
            ensemble_results.append({
                'sentiment': final_sentiment,
                'confidence': min(confidence, 1.0),
                'vote_distribution': votes,
                'individual_votes': {
                    model: predictions[model][i] for model in predictions
                }
            })
        
        return ensemble_results
    
    def analyze_sentiment_trends(self, df: pd.DataFrame, text_column: str, 
                                date_column: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze sentiment trends over time or across categories
        
        Args:
            df: DataFrame with text data
            text_column: Name of text column
            date_column: Optional date column for time series analysis
            
        Returns:
            Sentiment trend analysis results
        """
        texts = df[text_column].astype(str).tolist()
        predictions = self.predict(texts)
        
        # Extract sentiment labels
        sentiments = [pred['sentiment'] for pred in predictions['ensemble_prediction']]
        confidences = [pred['confidence'] for pred in predictions['ensemble_prediction']]
        
        # Basic sentiment distribution
        sentiment_counts = pd.Series(sentiments).value_counts()
        sentiment_distribution = sentiment_counts.to_dict()
        
        # Confidence statistics
        confidence_stats = {
            'mean_confidence': np.mean(confidences),
            'std_confidence': np.std(confidences),
            'min_confidence': np.min(confidences),
            'max_confidence': np.max(confidences)
        }
        
        results = {
            'sentiment_distribution': sentiment_distribution,
            'confidence_statistics': confidence_stats,
            'total_texts': len(texts),
            'sentiment_percentages': {
                k: (v / len(texts)) * 100 for k, v in sentiment_counts.items()
            }
        }
        
        # Time series analysis if date column provided
        if date_column and date_column in df.columns:
            df_analysis = df.copy()
            df_analysis['predicted_sentiment'] = sentiments
            df_analysis['confidence'] = confidences
            
            # Convert date column
            df_analysis[date_column] = pd.to_datetime(df_analysis[date_column])
            
            # Group by date and sentiment
            time_series = df_analysis.groupby([
                df_analysis[date_column].dt.date, 'predicted_sentiment'
            ]).size().unstack(fill_value=0)
            
            results['time_series'] = time_series.to_dict()
            results['trend_analysis'] = self._analyze_trends(time_series)
        
        return results
    
    def _analyze_trends(self, time_series: pd.DataFrame) -> Dict:
        """Analyze sentiment trends over time"""
        trends = {}
        
        for sentiment in time_series.columns:
            values = time_series[sentiment].values
            if len(values) > 1:
                # Simple trend analysis
                slope = np.polyfit(range(len(values)), values, 1)[0]
                trends[sentiment] = {
                    'slope': float(slope),
                    'trend': 'increasing' if slope > 0 else 'decreasing' if slope < 0 else 'stable',
                    'volatility': float(np.std(values))
                }
        
        return trends
    
    def get_feature_importance(self) -> Dict[str, List[Tuple[str, float]]]:
        """Get important features from trained models"""
        if not self.is_trained:
            raise ValueError("Models must be trained first")
        
        importance_dict = {}
        
        # Get feature names from vectorizer
        feature_names = self.vectorizers['tfidf'].get_feature_names_out()
        
        # Logistic Regression coefficients
        if 'logistic_regression' in self.models:
            lr_coef = self.models['logistic_regression'].coef_
            if lr_coef.shape[0] > 2:  # Multi-class
                # Average importance across classes
                avg_coef = np.mean(np.abs(lr_coef), axis=0)
            else:
                avg_coef = np.abs(lr_coef[0])
            
            importance_dict['logistic_regression'] = [
                (feature, importance) 
                for feature, importance in zip(feature_names, avg_coef)
            ]
            importance_dict['logistic_regression'].sort(key=lambda x: x[1], reverse=True)
            importance_dict['logistic_regression'] = importance_dict['logistic_regression'][:20]
        
        # Financial lexicon importance
        importance_dict['financial_lexicon'] = [
            (word, abs(score)) for word, score in self.financial_lexicon.items()
        ]
        importance_dict['financial_lexicon'].sort(key=lambda x: x[1], reverse=True)
        importance_dict['financial_lexicon'] = importance_dict['financial_lexicon'][:20]
        
        return importance_dict
    
    def save_models(self, filepath: str):
        """Save trained models to disk"""
        if not self.is_trained:
            raise ValueError("No trained models to save")
        
        model_data = {
            'models': self.models,
            'vectorizers': self.vectorizers,
            'label_encoder': self.label_encoder,
            'config': self.config,
            'financial_lexicon': self.financial_lexicon
        }
        
        joblib.dump(model_data, filepath)
        logger.info(f"Sentiment analysis models saved to {filepath}")
    
    def load_models(self, filepath: str):
        """Load trained models from disk"""
        model_data = joblib.load(filepath)
        
        self.models = model_data['models']
        self.vectorizers = model_data['vectorizers']
        self.label_encoder = model_data['label_encoder']
        self.config = model_data.get('config', self._default_config())
        self.financial_lexicon = model_data.get(
            'financial_lexicon', self._build_financial_lexicon()
        )
        self.is_trained = True
        
        logger.info(f"Sentiment analysis models loaded from {filepath}")

class RealTimeSentimentMonitor:
    """
    Real-time sentiment monitoring for streaming text data
    """
    
    def __init__(self, analyzer: SentimentAnalyzer, window_size: int = 100):
        self.analyzer = analyzer
        self.window_size = window_size
        self.sentiment_buffer = []
        self.confidence_buffer = []
        
    def process_text(self, text: str, timestamp: Optional[datetime] = None) -> Dict:
        """Process single text and update monitoring buffers"""
        if timestamp is None:
            timestamp = datetime.now()
        
        # Get sentiment prediction
        result = self.analyzer.predict([text])
        sentiment_result = result['ensemble_prediction'][0]
        
        # Update buffers
        self.sentiment_buffer.append({
            'text': text,
            'sentiment': sentiment_result['sentiment'],
            'confidence': sentiment_result['confidence'],
            'timestamp': timestamp
        })
        
        # Maintain window size
        if len(self.sentiment_buffer) > self.window_size:
            self.sentiment_buffer.pop(0)
        
        # Calculate running statistics
        recent_sentiments = [item['sentiment'] for item in self.sentiment_buffer]
        recent_confidences = [item['confidence'] for item in self.sentiment_buffer]
        
        sentiment_counts = pd.Series(recent_sentiments).value_counts()
        
        return {
            'current_sentiment': sentiment_result,
            'window_statistics': {
                'sentiment_distribution': sentiment_counts.to_dict(),
                'mean_confidence': np.mean(recent_confidences),
                'sentiment_trend': self._calculate_trend(),
                'window_size': len(self.sentiment_buffer)
            },
            'timestamp': timestamp.isoformat()
        }
    
    def _calculate_trend(self) -> str:
        """Calculate sentiment trend over the current window"""
        if len(self.sentiment_buffer) < 10:
            return "insufficient_data"
        
        # Convert sentiments to numeric values for trend analysis
        sentiment_values = []
        for item in self.sentiment_buffer[-10:]:
            if item['sentiment'] == 'positive':
                sentiment_values.append(1)
            elif item['sentiment'] == 'negative':
                sentiment_values.append(-1)
            else:
                sentiment_values.append(0)
        
        if len(sentiment_values) < 2:
            return "stable"
        
        slope = np.polyfit(range(len(sentiment_values)), sentiment_values, 1)[0]
        
        if slope > 0.1:
            return "improving"
        elif slope < -0.1:
            return "declining"
        else:
            return "stable"
    
    def get_summary(self) -> Dict:
        """Get summary of recent sentiment analysis"""
        if not self.sentiment_buffer:
            return {'status': 'no_data'}
        
        recent_sentiments = [item['sentiment'] for item in self.sentiment_buffer]
        recent_confidences = [item['confidence'] for item in self.sentiment_buffer]
        
        return {
            'total_analyzed': len(self.sentiment_buffer),
            'sentiment_distribution': pd.Series(recent_sentiments).value_counts().to_dict(),
            'average_confidence': np.mean(recent_confidences),
            'trend': self._calculate_trend(),
            'time_range': {
                'start': self.sentiment_buffer[0]['timestamp'].isoformat(),
                'end': self.sentiment_buffer[-1]['timestamp'].isoformat()
            }
        }