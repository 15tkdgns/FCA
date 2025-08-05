#!/usr/bin/env python3
"""
Fraud Detection Engine
=====================

Real-time fraud detection using multiple ML algorithms and ensemble methods.
Supports transaction analysis, anomaly detection, and risk scoring.
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score, TimeSeriesSplit, learning_curve, validation_curve
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
import matplotlib.pyplot as plt
import joblib
import logging
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

from .validation_framework import AdvancedValidationFramework, EarlyStoppingValidator

logger = logging.getLogger(__name__)

class FraudDetector:
    """
    Advanced fraud detection system with multiple detection strategies:
    1. Supervised learning models (Random Forest, Logistic Regression)
    2. Unsupervised anomaly detection (Isolation Forest)
    3. Rule-based detection for known fraud patterns
    4. Real-time risk scoring
    """
    
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or self._default_config()
        self.models = {}
        self.scalers = {}
        self.encoders = {}
        self.feature_columns = []
        self.target_column = 'Class'
        self.is_trained = False
        self.feature_stats = {}  # Store training feature statistics
        self.validation_history = {}  # Store validation history
        self.validation_framework = AdvancedValidationFramework()  # Advanced validation
        
        # Initialize models
        self._initialize_models()
        
    def _default_config(self) -> Dict:
        """Default configuration for fraud detection"""
        return {
            'random_forest': {
                'n_estimators': 100,
                'max_depth': 10,
                'random_state': 42
            },
            'logistic_regression': {
                'random_state': 42,
                'max_iter': 1000
            },
            'isolation_forest': {
                'contamination': 0.1,
                'random_state': 42
            },
            'risk_thresholds': {
                'low': 0.3,
                'medium': 0.6,
                'high': 0.8
            }
        }
    
    def _initialize_models(self):
        """Initialize ML models with configuration"""
        self.models = {
            'random_forest': RandomForestClassifier(**self.config['random_forest']),
            'logistic_regression': LogisticRegression(**self.config['logistic_regression']),
            'isolation_forest': IsolationForest(**self.config['isolation_forest'])
        }
        
    def preprocess_data(self, df: pd.DataFrame, is_training: bool = True) -> pd.DataFrame:
        """
        Preprocess transaction data for fraud detection with leak prevention
        
        Args:
            df: Raw transaction DataFrame
            is_training: Whether this is training data (affects feature statistics)
            
        Returns:
            Preprocessed DataFrame ready for model training/prediction
        """
        df_processed = df.copy()
        
        # Handle missing values
        df_processed = df_processed.fillna(df_processed.median(numeric_only=True))
        
        # Feature engineering for fraud detection
        if 'Time' in df_processed.columns:
            df_processed['Hour'] = (df_processed['Time'] / 3600) % 24
            df_processed['Day'] = (df_processed['Time'] / (3600 * 24)) % 7
        
        if 'Amount' in df_processed.columns:
            df_processed['Amount_log'] = np.log1p(df_processed['Amount'])
            
            # Prevent data leakage in amount normalization
            if is_training:
                # Store statistics from training data only
                self.feature_stats['Amount_mean'] = df_processed['Amount'].mean()
                self.feature_stats['Amount_std'] = df_processed['Amount'].std()
            
            # Use training data statistics for both train and test
            if 'Amount_mean' in self.feature_stats:
                df_processed['Amount_zscore'] = np.abs(
                    (df_processed['Amount'] - self.feature_stats['Amount_mean']) / 
                    self.feature_stats['Amount_std']
                )
            else:
                # Fallback if no training stats available
                df_processed['Amount_zscore'] = np.abs(
                    (df_processed['Amount'] - df_processed['Amount'].mean()) / 
                    df_processed['Amount'].std()
                )
        
        # Encode categorical variables
        categorical_columns = df_processed.select_dtypes(include=['object']).columns
        for col in categorical_columns:
            if col != self.target_column:
                if col not in self.encoders:
                    self.encoders[col] = LabelEncoder()
                    df_processed[col] = self.encoders[col].fit_transform(df_processed[col].astype(str))
                else:
                    # Handle unseen categories
                    unique_values = set(df_processed[col].unique())
                    known_values = set(self.encoders[col].classes_)
                    unknown_values = unique_values - known_values
                    
                    if unknown_values:
                        df_processed[col] = df_processed[col].replace(
                            list(unknown_values), 'unknown'
                        )
                    
                    df_processed[col] = self.encoders[col].transform(df_processed[col].astype(str))
        
        return df_processed
    
    def extract_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Extract relevant features for fraud detection"""
        feature_df = df.copy()
        
        # Remove target column from features if present
        if self.target_column in feature_df.columns:
            feature_df = feature_df.drop(columns=[self.target_column])
            
        # Select numeric columns and engineered features
        numeric_columns = feature_df.select_dtypes(include=[np.number]).columns
        feature_df = feature_df[numeric_columns]
        
        return feature_df
    
    def train(self, df: pd.DataFrame, target_column: str = 'Class', use_temporal_split: bool = False) -> Dict[str, Any]:
        """
        Train fraud detection models
        
        Args:
            df: Training DataFrame with features and target
            target_column: Name of target column
            
        Returns:
            Training results and model performance metrics
        """
        logger.info("Starting fraud detection model training...")
        
        self.target_column = target_column
        
        # Preprocess data with training flag
        df_processed = self.preprocess_data(df, is_training=True)
        
        # Extract features and target
        X = self.extract_features(df_processed)
        y = df_processed[target_column] if target_column in df_processed.columns else None
        
        if y is None:
            raise ValueError(f"Target column '{target_column}' not found in DataFrame")
        
        self.feature_columns = X.columns.tolist()
        
        # Scale features
        self.scalers['standard'] = StandardScaler()
        X_scaled = self.scalers['standard'].fit_transform(X)
        
        # Split data with temporal consideration
        if use_temporal_split and 'Time' in df.columns:
            # Sort by time for temporal split
            time_sorted_indices = df['Time'].argsort()
            X_sorted = X_scaled[time_sorted_indices]
            y_sorted = y.iloc[time_sorted_indices]
            
            # Use last 20% as test set (most recent data)
            split_idx = int(len(X_sorted) * 0.8)
            X_train, X_test = X_sorted[:split_idx], X_sorted[split_idx:]
            y_train, y_test = y_sorted[:split_idx], y_sorted[split_idx:]
            
            logger.info("Using temporal split to prevent data leakage")
        else:
            # Standard stratified split
            X_train, X_test, y_train, y_test = train_test_split(
                X_scaled, y, test_size=0.2, random_state=42, stratify=y
            )
        
        results = {}
        
        # Implement time series cross-validation if temporal data
        if use_temporal_split and 'Time' in df.columns:
            cv_splitter = TimeSeriesSplit(n_splits=5)
        else:
            cv_splitter = 5
        
        # Train supervised models
        for model_name in ['random_forest', 'logistic_regression']:
            logger.info(f"Training {model_name}...")
            
            model = self.models[model_name]
            model.fit(X_train, y_train)
            
            # Evaluate model
            y_pred = model.predict(X_test)
            y_prob = model.predict_proba(X_test)[:, 1] if hasattr(model, 'predict_proba') else y_pred
            
            cv_scores = cross_val_score(model, X_train, y_train, cv=cv_splitter).tolist()
            learning_curve_data = self._generate_learning_curve(model, X_train, y_train, cv_splitter)
            
            results[model_name] = {
                'accuracy': model.score(X_test, y_test),
                'auc_roc': roc_auc_score(y_test, y_prob),
                'classification_report': classification_report(y_test, y_pred, output_dict=True),
                'confusion_matrix': confusion_matrix(y_test, y_pred).tolist(),
                'cross_val_scores': cv_scores,
                'learning_curve': learning_curve_data
            }
            
            # Store in validation history for overfitting detection
            self.validation_history[model_name] = {
                'cross_val_scores': cv_scores,
                'learning_curve': learning_curve_data
            }
        
        # Train unsupervised model (Isolation Forest)
        logger.info("Training isolation_forest...")
        isolation_model = self.models['isolation_forest']
        isolation_model.fit(X_train)
        
        # Evaluate anomaly detection
        anomaly_pred = isolation_model.predict(X_test)
        anomaly_pred_binary = (anomaly_pred == -1).astype(int)  # -1 = anomaly, 1 = normal
        
        results['isolation_forest'] = {
            'accuracy': np.mean(anomaly_pred_binary == y_test),
            'anomaly_ratio': np.mean(anomaly_pred_binary),
            'detection_rate': np.mean(anomaly_pred_binary[y_test == 1])  # True positive rate for fraud
        }
        
        self.is_trained = True
        
        # Perform comprehensive validation analysis
        logger.info("Performing advanced validation analysis...")
        
        # Temporal validation
        time_column = df['Time'].values if 'Time' in df.columns else None
        temporal_validation = self.validation_framework.temporal_cross_validation(
            X_scaled, y, self.models['random_forest'], time_column
        )
        
        # Data leakage detection
        leakage_detection = self.validation_framework.detect_data_leakage(
            X_train, X_test, y_train, y_test, self.feature_columns
        )
        
        # Generate comprehensive validation report
        validation_report = self.validation_framework.generate_validation_report(
            temporal_validation, leakage_detection
        )
        
        # Store validation results
        results['advanced_validation'] = {
            'temporal_validation': temporal_validation,
            'leakage_detection': leakage_detection,
            'validation_report': validation_report
        }
        
        logger.info("Fraud detection model training completed!")
        logger.info(f"Validation Score: {validation_report['overall_score']}/100")
        
        if validation_report['recommendations']:
            logger.warning("Validation Recommendations:")
            for rec in validation_report['recommendations']:
                logger.warning(f"  - {rec}")
        
        return results
    
    def predict(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Predict fraud probability for transactions
        
        Args:
            df: DataFrame with transaction features
            
        Returns:
            Dictionary with predictions, probabilities, and risk scores
        """
        if not self.is_trained:
            raise ValueError("Models must be trained before making predictions")
        
        # Preprocess data with test flag
        df_processed = self.preprocess_data(df, is_training=False)
        X = self.extract_features(df_processed)
        
        # Ensure feature consistency
        missing_cols = set(self.feature_columns) - set(X.columns)
        if missing_cols:
            for col in missing_cols:
                X[col] = 0
        
        extra_cols = set(X.columns) - set(self.feature_columns)
        if extra_cols:
            X = X.drop(columns=list(extra_cols))
        
        X = X[self.feature_columns]  # Ensure correct order
        
        # Scale features
        X_scaled = self.scalers['standard'].transform(X)
        
        # Get predictions from all models
        predictions = {}
        probabilities = {}
        
        # Supervised models
        for model_name in ['random_forest', 'logistic_regression']:
            model = self.models[model_name]
            pred = model.predict(X_scaled)
            prob = model.predict_proba(X_scaled)[:, 1] if hasattr(model, 'predict_proba') else pred
            
            predictions[model_name] = pred.tolist()
            probabilities[model_name] = prob.tolist()
        
        # Unsupervised model
        anomaly_pred = self.models['isolation_forest'].predict(X_scaled)
        anomaly_scores = self.models['isolation_forest'].score_samples(X_scaled)
        
        predictions['isolation_forest'] = (anomaly_pred == -1).astype(int).tolist()
        probabilities['isolation_forest'] = ((anomaly_scores - anomaly_scores.min()) / 
                                           (anomaly_scores.max() - anomaly_scores.min())).tolist()
        
        # Ensemble prediction (weighted average)
        ensemble_prob = (
            np.array(probabilities['random_forest']) * 0.4 +
            np.array(probabilities['logistic_regression']) * 0.4 +
            np.array(probabilities['isolation_forest']) * 0.2
        )
        
        # Risk scoring
        risk_scores = self._calculate_risk_scores(ensemble_prob, df_processed)
        
        return {
            'predictions': predictions,
            'probabilities': probabilities,
            'ensemble_probability': ensemble_prob.tolist(),
            'risk_scores': risk_scores,
            'risk_levels': self._assign_risk_levels(ensemble_prob),
            'transaction_count': len(df)
        }
    
    def _calculate_risk_scores(self, probabilities: np.ndarray, df: pd.DataFrame) -> List[Dict]:
        """Calculate detailed risk scores for each transaction"""
        risk_scores = []
        
        for i, prob in enumerate(probabilities):
            risk_factors = {}
            
            # Amount-based risk
            if 'Amount' in df.columns:
                amount = df.iloc[i]['Amount']
                amount_percentile = (df['Amount'] <= amount).mean() * 100
                risk_factors['high_amount'] = amount_percentile > 95
                risk_factors['amount_zscore'] = abs((amount - df['Amount'].mean()) / df['Amount'].std())
            
            # Time-based risk
            if 'Time' in df.columns:
                hour = (df.iloc[i]['Time'] / 3600) % 24
                risk_factors['unusual_hour'] = hour < 6 or hour > 22  # Night transactions
            
            # Model confidence
            risk_factors['fraud_probability'] = float(prob)
            risk_factors['confidence_score'] = min(prob * 2, 1.0) if prob > 0.5 else min((1-prob) * 2, 1.0)
            
            risk_scores.append(risk_factors)
        
        return risk_scores
    
    def _assign_risk_levels(self, probabilities: np.ndarray) -> List[str]:
        """Assign risk levels based on probability thresholds"""
        risk_levels = []
        thresholds = self.config['risk_thresholds']
        
        for prob in probabilities:
            if prob >= thresholds['high']:
                risk_levels.append('HIGH')
            elif prob >= thresholds['medium']:
                risk_levels.append('MEDIUM')
            elif prob >= thresholds['low']:
                risk_levels.append('LOW')
            else:
                risk_levels.append('MINIMAL')
        
        return risk_levels
    
    def detect_real_time(self, transaction_data: Dict) -> Dict[str, Any]:
        """
        Real-time fraud detection for single transaction
        
        Args:
            transaction_data: Dictionary containing transaction features
            
        Returns:
            Fraud detection result with risk assessment
        """
        # Convert to DataFrame
        df = pd.DataFrame([transaction_data])
        
        # Get prediction
        result = self.predict(df)
        
        # Extract single transaction result
        single_result = {
            'transaction_id': transaction_data.get('transaction_id', 'unknown'),
            'is_fraud': result['ensemble_probability'][0] > 0.5,
            'fraud_probability': result['ensemble_probability'][0],
            'risk_level': result['risk_levels'][0],
            'risk_factors': result['risk_scores'][0],
            'model_predictions': {k: v[0] for k, v in result['predictions'].items()},
            'timestamp': datetime.now().isoformat()
        }
        
        return single_result
    
    def get_feature_importance(self) -> Dict[str, List[Tuple[str, float]]]:
        """Get feature importance from trained models"""
        if not self.is_trained:
            raise ValueError("Models must be trained first")
        
        importance_dict = {}
        
        # Random Forest feature importance
        if 'random_forest' in self.models:
            rf_importance = self.models['random_forest'].feature_importances_
            importance_dict['random_forest'] = [
                (feature, importance) 
                for feature, importance in zip(self.feature_columns, rf_importance)
            ]
            importance_dict['random_forest'].sort(key=lambda x: x[1], reverse=True)
        
        # Logistic Regression coefficients
        if 'logistic_regression' in self.models:
            lr_coef = abs(self.models['logistic_regression'].coef_[0])
            importance_dict['logistic_regression'] = [
                (feature, coef) 
                for feature, coef in zip(self.feature_columns, lr_coef)
            ]
            importance_dict['logistic_regression'].sort(key=lambda x: x[1], reverse=True)
        
        return importance_dict
    
    def save_models(self, filepath: str):
        """Save trained models to disk"""
        if not self.is_trained:
            raise ValueError("No trained models to save")
        
        model_data = {
            'models': self.models,
            'scalers': self.scalers,
            'encoders': self.encoders,
            'feature_columns': self.feature_columns,
            'target_column': self.target_column,
            'config': self.config
        }
        
        joblib.dump(model_data, filepath)
        logger.info(f"Models saved to {filepath}")
    
    def load_models(self, filepath: str):
        """Load trained models from disk"""
        model_data = joblib.load(filepath)
        
        self.models = model_data['models']
        self.scalers = model_data['scalers']
        self.encoders = model_data['encoders']
        self.feature_columns = model_data['feature_columns']
        self.target_column = model_data['target_column']
        self.config = model_data.get('config', self._default_config())
        self.is_trained = True
        
        logger.info(f"Models loaded from {filepath}")
    
    def _generate_learning_curve(self, model, X, y, cv_splitter) -> Dict[str, List]:
        """Generate learning curve data to detect overfitting"""
        try:
            train_sizes, train_scores, val_scores = learning_curve(
                model, X, y, cv=cv_splitter,
                train_sizes=np.linspace(0.1, 1.0, 10),
                scoring='roc_auc',
                n_jobs=-1,
                random_state=42
            )
            
            return {
                'train_sizes': train_sizes.tolist(),
                'train_scores_mean': np.mean(train_scores, axis=1).tolist(),
                'train_scores_std': np.std(train_scores, axis=1).tolist(),
                'val_scores_mean': np.mean(val_scores, axis=1).tolist(),
                'val_scores_std': np.std(val_scores, axis=1).tolist(),
                'overfitting_gap': (np.mean(train_scores, axis=1) - np.mean(val_scores, axis=1)).tolist()
            }
        except Exception as e:
            logger.warning(f"Learning curve generation failed: {e}")
            return {}
    
    def plot_learning_curve(self, model_name: str, save_path: str = None):
        """Plot learning curve for overfitting detection"""
        if model_name not in self.validation_history:
            logger.error(f"No validation history found for {model_name}")
            return
        
        curve_data = self.validation_history[model_name].get('learning_curve', {})
        if not curve_data:
            logger.error(f"No learning curve data for {model_name}")
            return
        
        plt.figure(figsize=(10, 6))
        
        train_sizes = curve_data['train_sizes']
        train_mean = curve_data['train_scores_mean']
        train_std = curve_data['train_scores_std']
        val_mean = curve_data['val_scores_mean']
        val_std = curve_data['val_scores_std']
        
        # Plot training scores
        plt.plot(train_sizes, train_mean, 'o-', color='blue', label='Training Score')
        plt.fill_between(train_sizes, 
                        np.array(train_mean) - np.array(train_std),
                        np.array(train_mean) + np.array(train_std),
                        alpha=0.1, color='blue')
        
        # Plot validation scores
        plt.plot(train_sizes, val_mean, 'o-', color='red', label='Validation Score')
        plt.fill_between(train_sizes,
                        np.array(val_mean) - np.array(val_std),
                        np.array(val_mean) + np.array(val_std),
                        alpha=0.1, color='red')
        
        plt.xlabel('Training Set Size')
        plt.ylabel('AUC-ROC Score')
        plt.title(f'Learning Curve - {model_name}')
        plt.legend(loc='best')
        plt.grid(True)
        
        # Add overfitting detection
        final_gap = curve_data['overfitting_gap'][-1]
        if final_gap > 0.05:
            plt.text(0.02, 0.95, f'Overfitting detected! Gap: {final_gap:.3f}', 
                    transform=plt.gca().transAxes, 
                    bbox=dict(boxstyle='round', facecolor='red', alpha=0.7),
                    color='white', fontweight='bold')
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            logger.info(f"Learning curve saved to {save_path}")
        
        plt.show()
    
    def detect_overfitting(self) -> Dict[str, Any]:
        """Comprehensive overfitting detection"""
        overfitting_report = {
            'models': {},
            'overall_risk': 'LOW',
            'recommendations': []
        }
        
        high_risk_count = 0
        
        for model_name in ['random_forest', 'logistic_regression']:
            if model_name not in self.validation_history:
                continue
                
            model_data = self.validation_history[model_name]
            curve_data = model_data.get('learning_curve', {})
            
            if not curve_data:
                continue
            
            # Check train-validation gap
            final_gap = curve_data['overfitting_gap'][-1] if curve_data['overfitting_gap'] else 0
            
            # Check cross-validation consistency
            cv_scores = model_data.get('cross_val_scores', [])
            cv_std = np.std(cv_scores) if cv_scores else 0
            
            risk_level = 'LOW'
            issues = []
            
            if final_gap > 0.1:
                risk_level = 'HIGH'
                issues.append(f'Large train-validation gap: {final_gap:.3f}')
                high_risk_count += 1
            elif final_gap > 0.05:
                risk_level = 'MEDIUM'
                issues.append(f'Moderate train-validation gap: {final_gap:.3f}')
            
            if cv_std > 0.05:
                if risk_level == 'LOW':
                    risk_level = 'MEDIUM'
                issues.append(f'High CV score variance: {cv_std:.3f}')
            
            overfitting_report['models'][model_name] = {
                'risk_level': risk_level,
                'train_val_gap': final_gap,
                'cv_std': cv_std,
                'issues': issues
            }
        
        # Overall assessment
        if high_risk_count > 0:
            overfitting_report['overall_risk'] = 'HIGH'
            overfitting_report['recommendations'].extend([
                'Reduce model complexity (fewer features, simpler models)',
                'Increase regularization strength',
                'Collect more training data',
                'Apply cross-validation more rigorously'
            ])
        elif any(model['risk_level'] == 'MEDIUM' for model in overfitting_report['models'].values()):
            overfitting_report['overall_risk'] = 'MEDIUM'
            overfitting_report['recommendations'].extend([
                'Monitor validation performance closely',
                'Consider ensemble methods',
                'Implement early stopping'
            ])
        
        return overfitting_report

class RuleBasedFraudDetector:
    """
    Rule-based fraud detection for known patterns and business rules
    """
    
    def __init__(self):
        self.rules = self._initialize_rules()
    
    def _initialize_rules(self) -> List[Dict]:
        """Initialize fraud detection rules"""
        return [
            {
                'name': 'high_amount_transaction',
                'condition': lambda row: row.get('Amount', 0) > 10000,
                'risk_score': 0.7,
                'description': 'Transaction amount exceeds $10,000'
            },
            {
                'name': 'multiple_transactions_short_time',
                'condition': self._check_multiple_transactions,
                'risk_score': 0.8,
                'description': 'Multiple transactions in short time frame'
            },
            {
                'name': 'unusual_merchant_category',
                'condition': lambda row: row.get('merchant_category') in ['gambling', 'adult', 'cash_advance'],
                'risk_score': 0.6,
                'description': 'Transaction in high-risk merchant category'
            },
            {
                'name': 'international_transaction',
                'condition': lambda row: row.get('country') not in ['US', 'CA'] and row.get('Amount', 0) > 1000,
                'risk_score': 0.5,
                'description': 'High-amount international transaction'
            }
        ]
    
    def _check_multiple_transactions(self, row: Dict) -> bool:
        """Check for multiple transactions pattern (placeholder)"""
        # This would need transaction history to implement properly
        return False
    
    def apply_rules(self, transaction_data: Dict) -> Dict[str, Any]:
        """Apply rule-based fraud detection"""
        triggered_rules = []
        total_risk_score = 0
        
        for rule in self.rules:
            try:
                if rule['condition'](transaction_data):
                    triggered_rules.append({
                        'rule_name': rule['name'],
                        'description': rule['description'],
                        'risk_score': rule['risk_score']
                    })
                    total_risk_score += rule['risk_score']
            except Exception as e:
                logger.warning(f"Rule {rule['name']} failed: {e}")
        
        # Normalize risk score
        normalized_risk = min(total_risk_score, 1.0)
        
        return {
            'triggered_rules': triggered_rules,
            'rule_based_risk_score': normalized_risk,
            'is_suspicious': normalized_risk > 0.5,
            'rule_count': len(triggered_rules)
        }