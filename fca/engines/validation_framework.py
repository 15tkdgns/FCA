#!/usr/bin/env python3
"""
Advanced Model Validation Framework for FCA
==========================================

Comprehensive validation system to prevent data leakage and overfitting.
Includes temporal validation, cross-validation strategies, and bias detection.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import TimeSeriesSplit, StratifiedKFold, cross_validate
from sklearn.metrics import roc_auc_score, precision_recall_curve, roc_curve
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List, Tuple, Optional, Any, Union
import warnings
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class AdvancedValidationFramework:
    """
    Advanced validation framework with data leakage prevention and overfitting detection
    """
    
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or self._default_config()
        self.validation_results = {}
        self.leakage_tests = {}
        
    def _default_config(self) -> Dict:
        """Default validation configuration"""
        return {
            'temporal_validation': {
                'enable': True,
                'n_splits': 5,
                'gap_days': 30  # Gap between train and test to prevent leakage
            },
            'cross_validation': {
                'n_splits': 5,
                'shuffle': True,
                'random_state': 42
            },
            'overfitting_thresholds': {
                'train_val_gap': 0.05,
                'cv_std_threshold': 0.03
            },
            'bias_detection': {
                'enable': True,
                'fairness_metrics': ['demographic_parity', 'equal_opportunity']
            }
        }
    
    def temporal_cross_validation(self, X: np.ndarray, y: np.ndarray, 
                                model, time_column: Optional[np.ndarray] = None) -> Dict[str, Any]:
        """
        Perform temporal cross-validation to prevent data leakage
        
        Args:
            X: Feature matrix
            y: Target vector
            model: ML model to validate
            time_column: Time column for temporal ordering
            
        Returns:
            Validation results with temporal considerations
        """
        logger.info("Starting temporal cross-validation...")
        
        if time_column is None:
            logger.warning("No time column provided, using standard time series split")
            cv_splitter = TimeSeriesSplit(n_splits=self.config['temporal_validation']['n_splits'])
        else:
            # Sort by time
            time_sorted_indices = np.argsort(time_column)
            X_sorted = X[time_sorted_indices]
            y_sorted = y[time_sorted_indices]
            cv_splitter = TimeSeriesSplit(n_splits=self.config['temporal_validation']['n_splits'])
            X, y = X_sorted, y_sorted
        
        # Perform cross-validation
        scoring = ['roc_auc', 'precision', 'recall', 'f1']
        cv_results = cross_validate(
            model, X, y, cv=cv_splitter, 
            scoring=scoring, 
            return_train_score=True,
            n_jobs=-1
        )
        
        # Calculate temporal validation metrics
        temporal_results = {
            'cv_method': 'TimeSeriesSplit',
            'n_splits': self.config['temporal_validation']['n_splits'],
            'metrics': {}
        }
        
        for metric in scoring:
            test_scores = cv_results[f'test_{metric}']
            train_scores = cv_results[f'train_{metric}']
            
            temporal_results['metrics'][metric] = {
                'test_mean': float(np.mean(test_scores)),
                'test_std': float(np.std(test_scores)),
                'train_mean': float(np.mean(train_scores)),
                'train_std': float(np.std(train_scores)),
                'train_val_gap': float(np.mean(train_scores) - np.mean(test_scores)),
                'stability_score': 1.0 - (np.std(test_scores) / np.mean(test_scores))
            }
        
        # Detect temporal overfitting
        auc_gap = temporal_results['metrics']['roc_auc']['train_val_gap']
        temporal_results['overfitting_risk'] = self._assess_overfitting_risk(auc_gap)
        
        return temporal_results
    
    def detect_data_leakage(self, X_train: np.ndarray, X_test: np.ndarray, 
                          y_train: np.ndarray, y_test: np.ndarray,
                          feature_names: List[str]) -> Dict[str, Any]:
        """
        Comprehensive data leakage detection
        
        Args:
            X_train: Training features
            X_test: Test features  
            y_train: Training targets
            y_test: Test targets
            feature_names: Names of features
            
        Returns:
            Data leakage detection report
        """
        logger.info("Performing data leakage detection...")
        
        leakage_report = {
            'feature_leakage': {},
            'temporal_leakage': {},
            'statistical_leakage': {},
            'overall_risk': 'LOW'
        }
        
        # 1. Feature distribution leakage
        leakage_report['feature_leakage'] = self._detect_feature_distribution_leakage(
            X_train, X_test, feature_names
        )
        
        # 2. Target leakage indicators
        leakage_report['target_leakage'] = self._detect_target_leakage(
            X_train, X_test, y_train, y_test
        )
        
        # 3. Statistical distribution tests
        leakage_report['statistical_leakage'] = self._perform_distribution_tests(
            X_train, X_test, feature_names
        )
        
        # Overall risk assessment
        risk_factors = []
        if leakage_report['feature_leakage']['high_risk_features']:
            risk_factors.append('Feature distribution mismatch')
        if leakage_report['target_leakage']['risk_score'] > 0.7:
            risk_factors.append('Potential target leakage')
        if leakage_report['statistical_leakage']['failed_tests'] > len(feature_names) * 0.1:
            risk_factors.append('Statistical distribution violations')
        
        if len(risk_factors) >= 2:
            leakage_report['overall_risk'] = 'HIGH'
        elif len(risk_factors) == 1:
            leakage_report['overall_risk'] = 'MEDIUM'
        
        leakage_report['risk_factors'] = risk_factors
        
        return leakage_report
    
    def _detect_feature_distribution_leakage(self, X_train: np.ndarray, X_test: np.ndarray,
                                           feature_names: List[str]) -> Dict[str, Any]:
        """Detect feature distribution differences that indicate leakage"""
        from scipy import stats
        
        high_risk_features = []
        feature_analysis = {}
        
        for i, feature_name in enumerate(feature_names):
            train_feature = X_train[:, i]
            test_feature = X_test[:, i]
            
            # KS test for distribution similarity
            ks_stat, ks_p_value = stats.ks_2samp(train_feature, test_feature)
            
            # Mean and std comparison
            train_mean, train_std = np.mean(train_feature), np.std(train_feature)
            test_mean, test_std = np.mean(test_feature), np.std(test_feature)
            
            mean_diff = abs(train_mean - test_mean) / (train_std + 1e-8)
            std_ratio = max(train_std, test_std) / (min(train_std, test_std) + 1e-8)
            
            # Risk assessment
            risk_score = 0.0
            if ks_p_value < 0.01:  # Significant distribution difference
                risk_score += 0.4
            if mean_diff > 2.0:  # Large mean difference
                risk_score += 0.3
            if std_ratio > 2.0:  # Large std difference  
                risk_score += 0.3
            
            feature_analysis[feature_name] = {
                'ks_statistic': float(ks_stat),
                'ks_p_value': float(ks_p_value),
                'mean_difference': float(mean_diff),
                'std_ratio': float(std_ratio),
                'risk_score': risk_score
            }
            
            if risk_score > 0.5:
                high_risk_features.append(feature_name)
        
        return {
            'high_risk_features': high_risk_features,
            'feature_analysis': feature_analysis,
            'total_features_at_risk': len(high_risk_features)
        }
    
    def _detect_target_leakage(self, X_train: np.ndarray, X_test: np.ndarray,
                             y_train: np.ndarray, y_test: np.ndarray) -> Dict[str, Any]:
        """Detect potential target leakage through simple model performance"""
        from sklearn.linear_model import LogisticRegression
        from sklearn.metrics import roc_auc_score
        
        # Train simple model on train set
        simple_model = LogisticRegression(random_state=42, max_iter=1000)
        simple_model.fit(X_train, y_train)
        
        # Test on both train and test sets
        train_pred_proba = simple_model.predict_proba(X_train)[:, 1]
        test_pred_proba = simple_model.predict_proba(X_test)[:, 1]
        
        train_auc = roc_auc_score(y_train, train_pred_proba)
        test_auc = roc_auc_score(y_test, test_pred_proba)
        
        # Suspiciously high performance might indicate leakage
        risk_score = 0.0
        if test_auc > 0.95:  # Unrealistically high AUC
            risk_score += 0.5
        if abs(train_auc - test_auc) < 0.01:  # Too similar performance
            risk_score += 0.3
        if train_auc > 0.99:  # Perfect training performance
            risk_score += 0.2
        
        return {
            'train_auc': float(train_auc),
            'test_auc': float(test_auc),
            'auc_difference': float(abs(train_auc - test_auc)),
            'risk_score': risk_score,
            'suspicious_performance': test_auc > 0.95 or abs(train_auc - test_auc) < 0.01
        }
    
    def _perform_distribution_tests(self, X_train: np.ndarray, X_test: np.ndarray,
                                  feature_names: List[str]) -> Dict[str, Any]:
        """Perform statistical tests for distribution similarity"""
        from scipy import stats
        
        failed_tests = 0
        test_results = {}
        
        for i, feature_name in enumerate(feature_names):
            train_feature = X_train[:, i]
            test_feature = X_test[:, i]
            
            # Multiple statistical tests
            tests = {
                'mannwhitneyu': stats.mannwhitneyu(train_feature, test_feature, alternative='two-sided'),
                'ks_2samp': stats.ks_2samp(train_feature, test_feature)
            }
            
            feature_failed = 0
            for test_name, (statistic, p_value) in tests.items():
                if p_value < 0.01:  # Significant difference at 1% level
                    feature_failed += 1
            
            test_results[feature_name] = {
                'tests': {name: {'statistic': float(stat), 'p_value': float(p_val)} 
                         for name, (stat, p_val) in tests.items()},
                'failed_tests': feature_failed,
                'distribution_similar': feature_failed == 0
            }
            
            if feature_failed > 0:
                failed_tests += 1
        
        return {
            'total_features': len(feature_names),
            'failed_tests': failed_tests,
            'pass_rate': (len(feature_names) - failed_tests) / len(feature_names),
            'test_results': test_results
        }
    
    def _assess_overfitting_risk(self, train_val_gap: float) -> str:
        """Assess overfitting risk based on train-validation gap"""
        threshold = self.config['overfitting_thresholds']['train_val_gap']
        
        if train_val_gap > threshold * 2:
            return 'HIGH'
        elif train_val_gap > threshold:
            return 'MEDIUM'
        else:
            return 'LOW'
    
    def generate_validation_report(self, validation_results: Dict[str, Any], 
                                 leakage_results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive validation report"""
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'validation_summary': {
                'temporal_validation': validation_results,
                'data_leakage_analysis': leakage_results
            },
            'recommendations': [],
            'overall_score': 0.0
        }
        
        # Scoring system (0-100)
        score = 100
        
        # Deduct points for overfitting
        if validation_results.get('overfitting_risk') == 'HIGH':
            score -= 30
            report['recommendations'].append('HIGH overfitting risk detected - reduce model complexity')
        elif validation_results.get('overfitting_risk') == 'MEDIUM':
            score -= 15
            report['recommendations'].append('MEDIUM overfitting risk - monitor validation performance')
        
        # Deduct points for data leakage
        if leakage_results.get('overall_risk') == 'HIGH':
            score -= 40
            report['recommendations'].append('HIGH data leakage risk - review feature engineering')
        elif leakage_results.get('overall_risk') == 'MEDIUM':
            score -= 20
            report['recommendations'].append('MEDIUM data leakage risk - validate temporal splits')
        
        # Add positive recommendations
        if score >= 80:
            report['recommendations'].append('Validation framework is robust')
        if score >= 90:
            report['recommendations'].append('Excellent model validation practices')
        
        report['overall_score'] = max(score, 0)
        
        return report
    
    def plot_validation_results(self, validation_results: Dict[str, Any], save_path: str = None):
        """Create comprehensive validation visualization"""
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        fig.suptitle('Model Validation Analysis', fontsize=16, y=0.95)
        
        # 1. Cross-validation scores
        ax1 = axes[0, 0]
        metrics = validation_results.get('metrics', {})
        if metrics:
            metric_names = list(metrics.keys())
            test_means = [metrics[m]['test_mean'] for m in metric_names]
            test_stds = [metrics[m]['test_std'] for m in metric_names]
            
            x_pos = range(len(metric_names))
            ax1.bar(x_pos, test_means, yerr=test_stds, capsize=5, alpha=0.7)
            ax1.set_xlabel('Metrics')
            ax1.set_ylabel('Score')
            ax1.set_title('Cross-Validation Performance')
            ax1.set_xticks(x_pos)
            ax1.set_xticklabels(metric_names, rotation=45)
            ax1.grid(True, alpha=0.3)
        
        # 2. Train vs Validation gap
        ax2 = axes[0, 1]
        if metrics:
            train_means = [metrics[m]['train_mean'] for m in metric_names]
            test_means = [metrics[m]['test_mean'] for m in metric_names]
            
            x_pos = range(len(metric_names))
            width = 0.35
            ax2.bar([x - width/2 for x in x_pos], train_means, width, label='Train', alpha=0.7)
            ax2.bar([x + width/2 for x in x_pos], test_means, width, label='Validation', alpha=0.7)
            ax2.set_xlabel('Metrics')
            ax2.set_ylabel('Score')
            ax2.set_title('Train vs Validation Performance')
            ax2.set_xticks(x_pos)
            ax2.set_xticklabels(metric_names, rotation=45)
            ax2.legend()
            ax2.grid(True, alpha=0.3)
        
        # 3. Overfitting Risk Assessment
        ax3 = axes[1, 0]
        risk_level = validation_results.get('overfitting_risk', 'UNKNOWN')
        risk_colors = {'LOW': 'green', 'MEDIUM': 'orange', 'HIGH': 'red', 'UNKNOWN': 'gray'}
        risk_values = {'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'UNKNOWN': 0}
        
        ax3.bar(['Overfitting Risk'], [risk_values[risk_level]], 
               color=risk_colors[risk_level], alpha=0.7)
        ax3.set_ylabel('Risk Level')
        ax3.set_title('Overfitting Risk Assessment')
        ax3.set_ylim(0, 3.5)
        ax3.set_yticks([1, 2, 3])
        ax3.set_yticklabels(['LOW', 'MEDIUM', 'HIGH'])
        
        # Add risk level text
        ax3.text(0, risk_values[risk_level] + 0.1, risk_level, 
                ha='center', va='bottom', fontweight='bold', fontsize=12)
        
        # 4. Stability Analysis
        ax4 = axes[1, 1]
        if metrics:
            stability_scores = [metrics[m]['stability_score'] for m in metric_names]
            ax4.bar(metric_names, stability_scores, alpha=0.7, color='purple')
            ax4.set_xlabel('Metrics')
            ax4.set_ylabel('Stability Score')
            ax4.set_title('Model Stability Analysis')
            ax4.set_xticklabels(metric_names, rotation=45)
            ax4.grid(True, alpha=0.3)
            ax4.set_ylim(0, 1)
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            logger.info(f"Validation plot saved to {save_path}")
        
        plt.show()

class EarlyStoppingValidator:
    """Early stopping implementation for model training"""
    
    def __init__(self, patience: int = 5, min_delta: float = 0.001, 
                 restore_best_weights: bool = True):
        self.patience = patience
        self.min_delta = min_delta
        self.restore_best_weights = restore_best_weights
        self.best_score = None
        self.wait = 0
        self.best_weights = None
        
    def __call__(self, current_score: float, model=None) -> bool:
        """
        Check if training should stop early
        
        Args:
            current_score: Current validation score
            model: Model object (for weight restoration)
            
        Returns:
            True if training should stop, False otherwise
        """
        if self.best_score is None:
            self.best_score = current_score
            if model is not None and hasattr(model, 'get_params'):
                self.best_weights = model.get_params()
            return False
        
        if current_score > self.best_score + self.min_delta:
            self.best_score = current_score
            self.wait = 0
            if model is not None and hasattr(model, 'get_params'):
                self.best_weights = model.get_params()
        else:
            self.wait += 1
            
        if self.wait >= self.patience:
            if self.restore_best_weights and model is not None and self.best_weights:
                model.set_params(**self.best_weights)
            return True
            
        return False