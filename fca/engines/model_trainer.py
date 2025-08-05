#!/usr/bin/env python3
"""
Model Training and Evaluation System
====================================

Comprehensive system for training, evaluating, and optimizing ML models:
- Automated hyperparameter tuning
- Cross-validation and performance metrics
- Model comparison and selection
- Experiment tracking and versioning
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import GridSearchCV, RandomizedSearchCV, cross_validate
from sklearn.metrics import make_scorer, accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import optuna
import joblib
import logging
from typing import Dict, List, Tuple, Optional, Any, Union
from datetime import datetime
import json
import os
from pathlib import Path

from .fraud_detector import FraudDetector
from .sentiment_analyzer import SentimentAnalyzer
from .attrition_predictor import AttritionPredictor

logger = logging.getLogger(__name__)

class ModelTrainer:
    """
    Advanced model training system with automated optimization
    """
    
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or self._default_config()
        self.experiment_history = []
        self.best_models = {}
        
        # Initialize experiment tracking
        self.experiment_dir = Path(self.config.get('experiment_dir', './experiments'))
        self.experiment_dir.mkdir(exist_ok=True)
        
    def _default_config(self) -> Dict:
        """Default configuration for model training"""
        return {
            'experiment_dir': './experiments',
            'optimization': {
                'method': 'optuna',  # 'grid_search', 'random_search', 'optuna'
                'n_trials': 100,
                'timeout': 3600  # 1 hour
            },
            'cross_validation': {
                'cv_folds': 5,
                'scoring': ['accuracy', 'precision', 'recall', 'f1', 'roc_auc']
            },
            'model_selection': {
                'primary_metric': 'f1',
                'minimize': False
            }
        }
    
    def train_fraud_detection_models(self, df: pd.DataFrame, target_column: str = 'Class') -> Dict[str, Any]:
        """
        Train and optimize fraud detection models
        
        Args:
            df: Training DataFrame
            target_column: Target column name
            
        Returns:
            Training results with best models and performance metrics
        """
        logger.info("Starting fraud detection model training and optimization...")
        
        experiment_id = f"fraud_detection_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Define hyperparameter search spaces
        param_spaces = {
            'random_forest': {
                'n_estimators': [100, 200, 300],
                'max_depth': [10, 15, 20, None],
                'min_samples_split': [2, 5, 10],
                'min_samples_leaf': [1, 2, 4]
            },
            'logistic_regression': {
                'C': [0.1, 1.0, 10.0, 100.0],
                'penalty': ['l1', 'l2'],
                'solver': ['liblinear', 'saga']
            }
        }
        
        results = {}
        best_models = {}
        
        # Train and optimize each model type
        for model_type, param_space in param_spaces.items():
            logger.info(f"Optimizing {model_type}...")
            
            # Create detector instance
            detector = FraudDetector()
            
            # Prepare data
            df_processed = detector.preprocess_data(df)
            X = detector.extract_features(df_processed)
            y = df_processed[target_column]
            
            # Scale features if needed
            X_scaled = detector.scalers['standard'].fit_transform(X)
            X_data = X_scaled if model_type == 'logistic_regression' else X
            
            # Hyperparameter optimization
            if self.config['optimization']['method'] == 'optuna':
                best_params = self._optimize_with_optuna(
                    detector.models[model_type], X_data, y, param_space, experiment_id
                )
            else:
                best_params = self._optimize_with_sklearn(
                    detector.models[model_type], X_data, y, param_space
                )
            
            # Train final model with best parameters
            detector.models[model_type].set_params(**best_params)
            detector.models[model_type].fit(X_data, y)
            
            # Evaluate model
            cv_results = self._cross_validate_model(
                detector.models[model_type], X_data, y
            )
            
            results[model_type] = {
                'best_params': best_params,
                'cv_results': cv_results,
                'feature_importance': self._get_feature_importance(
                    detector.models[model_type], detector.feature_columns
                ) if hasattr(detector.models[model_type], 'feature_importances_') else None
            }
            
            best_models[model_type] = detector.models[model_type]
        
        # Select best overall model
        best_model_name = self._select_best_model(results)
        
        # Save experiment results
        experiment_results = {
            'experiment_id': experiment_id,
            'timestamp': datetime.now().isoformat(),
            'model_type': 'fraud_detection',
            'results': results,
            'best_model': best_model_name,
            'config': self.config
        }
        
        self._save_experiment(experiment_results)
        
        logger.info(f"Fraud detection training completed. Best model: {best_model_name}")
        
        return {
            'experiment_id': experiment_id,
            'results': results,
            'best_model': best_model_name,
            'best_models': best_models
        }
    
    def train_sentiment_analysis_models(self, df: pd.DataFrame, 
                                      text_column: str = 'text',
                                      target_column: str = 'sentiment') -> Dict[str, Any]:
        """
        Train and optimize sentiment analysis models
        
        Args:
            df: Training DataFrame
            text_column: Text column name
            target_column: Target column name
            
        Returns:
            Training results with best models and performance metrics
        """
        logger.info("Starting sentiment analysis model training and optimization...")
        
        experiment_id = f"sentiment_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Define hyperparameter search spaces
        param_spaces = {
            'svm': {
                'C': [0.1, 1.0, 10.0, 100.0],
                'kernel': ['linear', 'rbf'],
                'gamma': ['scale', 'auto', 0.001, 0.01]
            },
            'logistic_regression': {
                'C': [0.1, 1.0, 10.0, 100.0],
                'penalty': ['l1', 'l2'],
                'solver': ['liblinear', 'saga']
            },
            'naive_bayes': {
                'alpha': [0.1, 0.5, 1.0, 2.0, 5.0]
            }
        }
        
        # Vectorizer parameters
        vectorizer_params = {
            'max_features': [5000, 10000, 15000],
            'ngram_range': [(1, 1), (1, 2), (1, 3)],
            'min_df': [1, 2, 3]
        }
        
        results = {}
        best_models = {}
        
        # Create analyzer instance
        analyzer = SentimentAnalyzer()
        
        # Prepare data
        texts = df[text_column].astype(str).tolist()
        labels = df[target_column].tolist()
        labels_encoded = analyzer.label_encoder.fit_transform(labels)
        
        # Optimize vectorizer first
        logger.info("Optimizing text vectorizer...")
        best_vectorizer_params = self._optimize_vectorizer(
            texts, labels_encoded, vectorizer_params
        )
        analyzer.vectorizers['tfidf'].set_params(**best_vectorizer_params)
        
        # Extract features with optimized vectorizer
        features = analyzer.extract_features(texts)
        X = features['tfidf']
        
        # Train and optimize each model type
        for model_type, param_space in param_spaces.items():
            if model_type not in analyzer.models:
                continue
                
            logger.info(f"Optimizing {model_type}...")
            
            # Hyperparameter optimization
            if self.config['optimization']['method'] == 'optuna':
                best_params = self._optimize_with_optuna(
                    analyzer.models[model_type], X, labels_encoded, param_space, experiment_id
                )
            else:
                best_params = self._optimize_with_sklearn(
                    analyzer.models[model_type], X, labels_encoded, param_space
                )
            
            # Train final model with best parameters
            analyzer.models[model_type].set_params(**best_params)
            analyzer.models[model_type].fit(X, labels_encoded)
            
            # Evaluate model
            cv_results = self._cross_validate_model(
                analyzer.models[model_type], X, labels_encoded
            )
            
            results[model_type] = {
                'best_params': best_params,
                'cv_results': cv_results
            }
            
            best_models[model_type] = analyzer.models[model_type]
        
        # Select best overall model
        best_model_name = self._select_best_model(results)
        
        # Save experiment results
        experiment_results = {
            'experiment_id': experiment_id,
            'timestamp': datetime.now().isoformat(),
            'model_type': 'sentiment_analysis',
            'results': results,
            'best_model': best_model_name,
            'best_vectorizer_params': best_vectorizer_params,
            'config': self.config
        }
        
        self._save_experiment(experiment_results)
        
        logger.info(f"Sentiment analysis training completed. Best model: {best_model_name}")
        
        return {
            'experiment_id': experiment_id,
            'results': results,
            'best_model': best_model_name,
            'best_models': best_models,
            'best_vectorizer_params': best_vectorizer_params
        }
    
    def train_attrition_prediction_models(self, df: pd.DataFrame, 
                                        target_column: str = 'Exited') -> Dict[str, Any]:
        """
        Train and optimize customer attrition prediction models
        
        Args:
            df: Training DataFrame
            target_column: Target column name
            
        Returns:
            Training results with best models and performance metrics
        """
        logger.info("Starting attrition prediction model training and optimization...")
        
        experiment_id = f"attrition_prediction_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Define hyperparameter search spaces
        param_spaces = {
            'random_forest': {
                'n_estimators': [100, 200, 300],
                'max_depth': [10, 15, 20, None],
                'min_samples_split': [2, 5, 10],
                'min_samples_leaf': [1, 2, 4]
            },
            'xgboost': {
                'n_estimators': [100, 200, 300],
                'max_depth': [3, 6, 9],
                'learning_rate': [0.01, 0.1, 0.2],
                'subsample': [0.8, 0.9, 1.0],
                'colsample_bytree': [0.8, 0.9, 1.0]
            },
            'gradient_boosting': {
                'n_estimators': [100, 200, 300],
                'max_depth': [3, 5, 7],
                'learning_rate': [0.01, 0.1, 0.2]
            }
        }
        
        results = {}
        best_models = {}
        
        # Train and optimize each model type
        for model_type, param_space in param_spaces.items():
            logger.info(f"Optimizing {model_type}...")
            
            # Create predictor instance
            predictor = AttritionPredictor()
            
            # Prepare data
            df_processed = predictor.preprocess_data(df)
            X = predictor.extract_features(df_processed)
            y = df_processed[target_column]
            
            # Scale features if needed
            X_scaled = predictor.scalers['standard'].fit_transform(X)
            X_data = X_scaled if model_type == 'logistic_regression' else X
            
            # Hyperparameter optimization
            if self.config['optimization']['method'] == 'optuna':
                best_params = self._optimize_with_optuna(
                    predictor.models[model_type], X_data, y, param_space, experiment_id
                )
            else:
                best_params = self._optimize_with_sklearn(
                    predictor.models[model_type], X_data, y, param_space
                )
            
            # Train final model with best parameters
            predictor.models[model_type].set_params(**best_params)
            predictor.models[model_type].fit(X_data, y)
            
            # Evaluate model
            cv_results = self._cross_validate_model(
                predictor.models[model_type], X_data, y
            )
            
            results[model_type] = {
                'best_params': best_params,
                'cv_results': cv_results,
                'feature_importance': self._get_feature_importance(
                    predictor.models[model_type], predictor.feature_columns
                ) if hasattr(predictor.models[model_type], 'feature_importances_') else None
            }
            
            best_models[model_type] = predictor.models[model_type]
        
        # Select best overall model
        best_model_name = self._select_best_model(results)
        
        # Save experiment results
        experiment_results = {
            'experiment_id': experiment_id,
            'timestamp': datetime.now().isoformat(),
            'model_type': 'attrition_prediction',
            'results': results,
            'best_model': best_model_name,
            'config': self.config
        }
        
        self._save_experiment(experiment_results)
        
        logger.info(f"Attrition prediction training completed. Best model: {best_model_name}")
        
        return {
            'experiment_id': experiment_id,
            'results': results,
            'best_model': best_model_name,
            'best_models': best_models
        }
    
    def _optimize_with_optuna(self, model, X, y, param_space: Dict, experiment_id: str) -> Dict:
        """Optimize hyperparameters using Optuna"""
        
        def objective(trial):
            # Suggest parameters
            params = {}
            for param, values in param_space.items():
                if isinstance(values[0], int):
                    params[param] = trial.suggest_int(param, min(values), max(values))
                elif isinstance(values[0], float):
                    params[param] = trial.suggest_float(param, min(values), max(values))
                else:
                    params[param] = trial.suggest_categorical(param, values)
            
            # Set parameters and evaluate
            model.set_params(**params)
            
            # Cross-validation
            scores = cross_validate(
                model, X, y, 
                cv=self.config['cross_validation']['cv_folds'],
                scoring=self.config['model_selection']['primary_metric'],
                n_jobs=-1
            )
            
            return scores['test_score'].mean()
        
        # Create study
        study = optuna.create_study(
            direction='maximize' if not self.config['model_selection']['minimize'] else 'minimize',
            study_name=f"{experiment_id}_{model.__class__.__name__}"
        )
        
        # Optimize
        study.optimize(
            objective,
            n_trials=self.config['optimization']['n_trials'],
            timeout=self.config['optimization']['timeout']
        )
        
        return study.best_params
    
    def _optimize_with_sklearn(self, model, X, y, param_space: Dict) -> Dict:
        """Optimize hyperparameters using sklearn GridSearchCV or RandomizedSearchCV"""
        
        if self.config['optimization']['method'] == 'grid_search':
            search = GridSearchCV(
                model, param_space,
                cv=self.config['cross_validation']['cv_folds'],
                scoring=self.config['model_selection']['primary_metric'],
                n_jobs=-1
            )
        else:  # random_search
            search = RandomizedSearchCV(
                model, param_space,
                n_iter=self.config['optimization']['n_trials'],
                cv=self.config['cross_validation']['cv_folds'],
                scoring=self.config['model_selection']['primary_metric'],
                n_jobs=-1
            )
        
        search.fit(X, y)
        return search.best_params_
    
    def _optimize_vectorizer(self, texts: List[str], labels, param_space: Dict) -> Dict:
        """Optimize text vectorizer parameters"""
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.linear_model import LogisticRegression
        from sklearn.pipeline import Pipeline
        
        # Create pipeline
        pipeline = Pipeline([
            ('vectorizer', TfidfVectorizer()),
            ('classifier', LogisticRegression(random_state=42))
        ])
        
        # Prefix parameters with 'vectorizer__'
        vectorizer_param_space = {
            f'vectorizer__{k}': v for k, v in param_space.items()
        }
        
        # Grid search
        search = GridSearchCV(
            pipeline, vectorizer_param_space,
            cv=3, scoring='f1_weighted', n_jobs=-1
        )
        
        search.fit(texts, labels)
        
        # Extract vectorizer parameters
        best_params = {}
        for key, value in search.best_params_.items():
            if key.startswith('vectorizer__'):
                param_name = key.replace('vectorizer__', '')
                best_params[param_name] = value
        
        return best_params
    
    def _cross_validate_model(self, model, X, y) -> Dict:
        """Perform cross-validation and return detailed results"""
        scoring = self.config['cross_validation']['scoring']
        cv_folds = self.config['cross_validation']['cv_folds']
        
        cv_results = cross_validate(
            model, X, y,
            cv=cv_folds,
            scoring=scoring,
            return_train_score=True,
            n_jobs=-1
        )
        
        # Calculate statistics
        results = {}
        for metric in scoring:
            test_scores = cv_results[f'test_{metric}']
            train_scores = cv_results[f'train_{metric}']
            
            results[metric] = {
                'test_mean': float(np.mean(test_scores)),
                'test_std': float(np.std(test_scores)),
                'train_mean': float(np.mean(train_scores)),
                'train_std': float(np.std(train_scores)),
                'test_scores': test_scores.tolist(),
                'train_scores': train_scores.tolist()
            }
        
        return results
    
    def _get_feature_importance(self, model, feature_names: List[str]) -> List[Tuple[str, float]]:
        """Get feature importance from model"""
        if hasattr(model, 'feature_importances_'):
            importance = model.feature_importances_
            importance_pairs = list(zip(feature_names, importance))
            importance_pairs.sort(key=lambda x: x[1], reverse=True)
            return importance_pairs[:20]  # Top 20 features
        return []
    
    def _select_best_model(self, results: Dict) -> str:
        """Select best model based on primary metric"""
        primary_metric = self.config['model_selection']['primary_metric']
        best_score = -np.inf if not self.config['model_selection']['minimize'] else np.inf
        best_model = None
        
        for model_name, model_results in results.items():
            if 'cv_results' in model_results and primary_metric in model_results['cv_results']:
                score = model_results['cv_results'][primary_metric]['test_mean']
                
                if self.config['model_selection']['minimize']:
                    if score < best_score:
                        best_score = score
                        best_model = model_name
                else:
                    if score > best_score:
                        best_score = score
                        best_model = model_name
        
        return best_model or list(results.keys())[0]
    
    def _save_experiment(self, experiment_results: Dict):
        """Save experiment results to disk"""
        experiment_id = experiment_results['experiment_id']
        filepath = self.experiment_dir / f"{experiment_id}.json"
        
        with open(filepath, 'w') as f:
            json.dump(experiment_results, f, indent=2, default=str)
        
        self.experiment_history.append(experiment_results)
        logger.info(f"Experiment results saved to {filepath}")
    
    def get_experiment_history(self) -> List[Dict]:
        """Get history of all experiments"""
        return self.experiment_history
    
    def compare_experiments(self, experiment_ids: List[str]) -> Dict[str, Any]:
        """Compare results from multiple experiments"""
        experiments = []
        
        for exp_id in experiment_ids:
            filepath = self.experiment_dir / f"{exp_id}.json"
            if filepath.exists():
                with open(filepath, 'r') as f:
                    experiments.append(json.load(f))
        
        if not experiments:
            return {"error": "No valid experiments found"}
        
        # Compare primary metrics
        primary_metric = self.config['model_selection']['primary_metric']
        comparison = {
            'experiments': [],
            'best_overall': None,
            'metric_comparison': {}
        }
        
        best_score = -np.inf if not self.config['model_selection']['minimize'] else np.inf
        
        for exp in experiments:
            exp_summary = {
                'experiment_id': exp['experiment_id'],
                'model_type': exp['model_type'],
                'timestamp': exp['timestamp'],
                'best_model': exp['best_model'],
                'scores': {}
            }
            
            # Extract scores for best model
            if exp['best_model'] in exp['results']:
                best_model_results = exp['results'][exp['best_model']]
                if 'cv_results' in best_model_results:
                    for metric, metric_results in best_model_results['cv_results'].items():
                        exp_summary['scores'][metric] = metric_results['test_mean']
            
            # Check if this is the best overall
            if primary_metric in exp_summary['scores']:
                score = exp_summary['scores'][primary_metric]
                if self.config['model_selection']['minimize']:
                    if score < best_score:
                        best_score = score
                        comparison['best_overall'] = exp['experiment_id']
                else:
                    if score > best_score:
                        best_score = score
                        comparison['best_overall'] = exp['experiment_id']
            
            comparison['experiments'].append(exp_summary)
        
        return comparison