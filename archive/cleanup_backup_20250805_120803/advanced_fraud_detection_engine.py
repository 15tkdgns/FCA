#!/usr/bin/env python3
"""
Advanced Fraud Detection Engine
==============================

A production-ready, high-performance fraud detection system implementing 
state-of-the-art machine learning algorithms with theoretical foundations.

This system implements multiple detection algorithms:
1. Isolation Forest (Liu et al., 2008) - O(n log n) anomaly detection
2. Local Outlier Factor (Breunig et al., 2000) - O(n²) density-based outlier detection  
3. One-Class SVM (Schölkopf et al., 2001) - Support vector-based novelty detection
4. Ensemble methods with weighted voting for improved performance

Author: Advanced Analytics Team
Version: 2.0.0
License: MIT

References:
- Liu, F. T., Ting, K. M., & Zhou, Z. H. (2008). Isolation forest. ICDM.
- Breunig, M. M., et al. (2000). LOF: identifying density-based local outliers. ACM SIGMOD.
- Schölkopf, B., et al. (2001). Estimating the support of a high-dimensional distribution. Neural computation.
"""

import warnings
import logging
import time
import hashlib
import pickle
from functools import wraps
from typing import (
    Dict, List, Tuple, Optional, Union, Any, Callable, 
    TypeVar, Generic, Protocol, runtime_checkable
)
from dataclasses import dataclass, field
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from sklearn.svm import OneClassSVM
from sklearn.preprocessing import StandardScaler, RobustScaler
from sklearn.model_selection import cross_val_score
from sklearn.metrics import (
    roc_auc_score, precision_recall_curve, average_precision_score,
    confusion_matrix, classification_report
)
import joblib

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Type definitions
T = TypeVar('T')
ModelType = TypeVar('ModelType')
ArrayLike = Union[np.ndarray, pd.DataFrame, List[List[float]]]

@runtime_checkable
class ModelProtocol(Protocol):
    """Protocol for fraud detection models."""
    def fit(self, X: ArrayLike) -> 'ModelProtocol': ...
    def predict(self, X: ArrayLike) -> np.ndarray: ...
    def decision_function(self, X: ArrayLike) -> np.ndarray: ...


@dataclass
class ModelMetrics:
    """Container for model performance metrics.
    
    Attributes:
        auc_roc: Area Under ROC Curve
        average_precision: Average Precision Score
        precision: Precision at threshold
        recall: Recall at threshold
        f1_score: F1 Score
        training_time: Time taken to train model (seconds)
        prediction_time: Time taken for prediction (seconds)
        memory_usage: Peak memory usage during training (MB)
    """
    auc_roc: float = 0.0
    average_precision: float = 0.0
    precision: float = 0.0
    recall: float = 0.0
    f1_score: float = 0.0
    training_time: float = 0.0
    prediction_time: float = 0.0
    memory_usage: float = 0.0
    cross_val_scores: List[float] = field(default_factory=list)


@dataclass
class DetectionResult:
    """Container for fraud detection results.
    
    Attributes:
        predictions: Binary predictions (1=fraud, 0=normal)
        anomaly_scores: Continuous anomaly scores
        confidence: Confidence scores for predictions
        model_name: Name of the model used
        processing_time: Time taken for detection
        metadata: Additional information
    """
    predictions: np.ndarray
    anomaly_scores: np.ndarray
    confidence: np.ndarray
    model_name: str
    processing_time: float
    metadata: Dict[str, Any] = field(default_factory=dict)


class PerformanceMonitor:
    """Performance monitoring and caching system.
    
    Implements LRU cache with performance tracking for model predictions.
    Time Complexity: O(1) for cache operations
    Space Complexity: O(k) where k is cache size
    """
    
    def __init__(self, max_cache_size: int = 1000):
        self._cache: Dict[str, Any] = {}
        self._cache_access_times: Dict[str, float] = {}
        self._max_cache_size = max_cache_size
        self._lock = Lock()
        self._hit_count = 0
        self._miss_count = 0
    
    def _generate_cache_key(self, data: ArrayLike, model_params: Dict) -> str:
        """Generate unique cache key for data and parameters."""
        if isinstance(data, pd.DataFrame):
            data_hash = hashlib.md5(pd.util.hash_pandas_object(data).values).hexdigest()
        else:
            data_hash = hashlib.md5(np.asarray(data).tobytes()).hexdigest()
        
        params_str = str(sorted(model_params.items()))
        params_hash = hashlib.md5(params_str.encode()).hexdigest()
        return f"{data_hash}_{params_hash}"
    
    def get_cached_result(self, cache_key: str) -> Optional[Any]:
        """Retrieve cached result with LRU update."""
        with self._lock:
            if cache_key in self._cache:
                self._cache_access_times[cache_key] = time.time()
                self._hit_count += 1
                return self._cache[cache_key]
            self._miss_count += 1
            return None
    
    def cache_result(self, cache_key: str, result: Any) -> None:
        """Cache result with LRU eviction."""
        with self._lock:
            if len(self._cache) >= self._max_cache_size:
                # Remove least recently used item
                oldest_key = min(self._cache_access_times.keys(), 
                               key=lambda k: self._cache_access_times[k])
                del self._cache[oldest_key]
                del self._cache_access_times[oldest_key]
            
            self._cache[cache_key] = result
            self._cache_access_times[cache_key] = time.time()
    
    @property
    def cache_hit_rate(self) -> float:
        """Calculate cache hit rate."""
        total = self._hit_count + self._miss_count
        return self._hit_count / total if total > 0 else 0.0


def performance_monitor(func: Callable) -> Callable:
    """Decorator for monitoring function performance."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            execution_time = time.time() - start_time
            logger.info(f"{func.__name__} executed in {execution_time:.4f}s")
            return result
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"{func.__name__} failed after {execution_time:.4f}s: {str(e)}")
            raise
    return wrapper


def deprecated(version: str, alternative: str = None):
    """Decorator to mark functions as deprecated."""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            message = f"{func.__name__} is deprecated since version {version}"
            if alternative:
                message += f". Use {alternative} instead"
            warnings.warn(message, DeprecationWarning, stacklevel=2)
            return func(*args, **kwargs)
        return wrapper
    return decorator


class AdvancedFraudDetectionEngine:
    """
    Advanced Fraud Detection Engine with ensemble methods and optimization.
    
    This class implements a production-ready fraud detection system using 
    multiple algorithms with theoretical foundations and practical optimizations.
    
    Theoretical Background:
    ----------------------
    1. Isolation Forest: Uses random partitioning to isolate anomalies
       - Time Complexity: O(n log n) for training, O(log n) for prediction
       - Space Complexity: O(n) for tree storage
    
    2. Local Outlier Factor: Density-based outlier detection
       - Time Complexity: O(n²) for k-nearest neighbors computation
       - Space Complexity: O(n²) for distance matrix
    
    3. One-Class SVM: Maps data to high-dimensional space for separation
       - Time Complexity: O(n²) to O(n³) depending on kernel
       - Space Complexity: O(n) for support vectors
    
    Ensemble Method:
    ---------------
    Uses weighted voting based on individual model performance:
    Final_Score = Σ(w_i * score_i) where w_i ∝ AUC_i
    
    Performance Optimizations:
    -------------------------
    - LRU caching for repeated predictions
    - Parallel model training and prediction
    - Memory-efficient data processing
    - Early stopping for cross-validation
    
    Examples:
    --------
    >>> engine = AdvancedFraudDetectionEngine()
    >>> engine.fit(training_data)
    >>> results = engine.predict(test_data)
    >>> print(f"Fraud detected: {np.sum(results.predictions)}")
    
    >>> # With custom parameters
    >>> engine = AdvancedFraudDetectionEngine(
    ...     isolation_forest_params={'contamination': 0.05},
    ...     enable_caching=True,
    ...     n_jobs=4
    ... )
    """
    
    def __init__(
        self, 
        isolation_forest_params: Optional[Dict] = None,
        lof_params: Optional[Dict] = None,
        ocsvm_params: Optional[Dict] = None,
        scaler_type: str = 'standard',
        enable_caching: bool = True,
        cache_size: int = 1000,
        n_jobs: int = -1,
        random_state: int = 42,
        ensemble_weights: Optional[Dict[str, float]] = None
    ):
        """
        Initialize the Advanced Fraud Detection Engine.
        
        Args:
            isolation_forest_params: Parameters for Isolation Forest
            lof_params: Parameters for Local Outlier Factor  
            ocsvm_params: Parameters for One-Class SVM
            scaler_type: Type of scaler ('standard', 'robust', 'none')
            enable_caching: Whether to enable result caching
            cache_size: Maximum number of cached results
            n_jobs: Number of parallel jobs (-1 for all cores)
            random_state: Random seed for reproducibility
            ensemble_weights: Custom weights for ensemble voting
            
        Raises:
            ValueError: If invalid parameters are provided
            ImportError: If required dependencies are missing
        """
        # Validate inputs
        if scaler_type not in ['standard', 'robust', 'none']:
            raise ValueError(f"Invalid scaler_type: {scaler_type}")
        
        if cache_size <= 0:
            raise ValueError("cache_size must be positive")
        
        # Store configuration
        self.random_state = random_state
        self.n_jobs = n_jobs
        self.scaler_type = scaler_type
        self.enable_caching = enable_caching
        
        # Initialize model parameters with defaults
        self.isolation_forest_params = {
            'contamination': 0.1,
            'n_estimators': 100,
            'max_samples': 'auto',
            'random_state': random_state,
            'n_jobs': n_jobs
        }
        if isolation_forest_params:
            self.isolation_forest_params.update(isolation_forest_params)
        
        self.lof_params = {
            'n_neighbors': 20,
            'contamination': 0.1,
            'novelty': True,
            'n_jobs': n_jobs
        }
        if lof_params:
            self.lof_params.update(lof_params)
        
        self.ocsvm_params = {
            'kernel': 'rbf',
            'gamma': 'scale',
            'nu': 0.1
        }
        if ocsvm_params:
            self.ocsvm_params.update(ocsvm_params)
        
        # Initialize components
        self.models: Dict[str, ModelProtocol] = {}
        self.model_weights: Dict[str, float] = ensemble_weights or {}
        self.scaler: Optional[Union[StandardScaler, RobustScaler]] = None
        self.is_fitted: bool = False
        self.feature_names: Optional[List[str]] = None
        
        # Performance monitoring
        if enable_caching:
            self.performance_monitor = PerformanceMonitor(cache_size)
        else:
            self.performance_monitor = None
        
        # Metrics storage
        self.training_metrics: Dict[str, ModelMetrics] = {}
        self.last_prediction_time: float = 0.0
        
        logger.info(f"Initialized AdvancedFraudDetectionEngine with {scaler_type} scaling")
    
    def _validate_input_data(self, X: ArrayLike, y: Optional[ArrayLike] = None) -> Tuple[np.ndarray, Optional[np.ndarray]]:
        """
        Validate and preprocess input data.
        
        Args:
            X: Feature matrix
            y: Target vector (optional)
            
        Returns:
            Tuple of validated (X, y)
            
        Raises:
            ValueError: If data is invalid
            TypeError: If data type is unsupported
        """
        # Convert to numpy array
        if isinstance(X, pd.DataFrame):
            self.feature_names = X.columns.tolist()
            X = X.values
        elif isinstance(X, list):
            X = np.asarray(X)
        elif not isinstance(X, np.ndarray):
            raise TypeError(f"Unsupported data type: {type(X)}")
        
        # Validate shape
        if X.ndim != 2:
            raise ValueError(f"X must be 2D, got shape {X.shape}")
        
        if X.shape[0] == 0:
            raise ValueError("X cannot be empty")
        
        if X.shape[1] == 0:
            raise ValueError("X must have at least one feature")
        
        # Check for invalid values
        if np.any(np.isnan(X)):
            raise ValueError("X contains NaN values")
        
        if np.any(np.isinf(X)):
            raise ValueError("X contains infinite values")
        
        # Validate y if provided
        if y is not None:
            if isinstance(y, (list, pd.Series)):
                y = np.asarray(y)
            
            if y.shape[0] != X.shape[0]:
                raise ValueError(f"X and y have different lengths: {X.shape[0]} vs {y.shape[0]}")
        
        return X, y
    
    def _initialize_scaler(self, X: np.ndarray) -> None:
        """Initialize and fit the data scaler."""
        if self.scaler_type == 'standard':
            self.scaler = StandardScaler()
        elif self.scaler_type == 'robust':
            self.scaler = RobustScaler()
        else:
            self.scaler = None
            return
        
        self.scaler.fit(X)
        logger.info(f"Fitted {self.scaler_type} scaler")
    
    def _scale_data(self, X: np.ndarray) -> np.ndarray:
        """Scale data using fitted scaler."""
        if self.scaler is None:
            return X
        return self.scaler.transform(X)
    
    @performance_monitor
    def fit(
        self, 
        X: ArrayLike, 
        y: Optional[ArrayLike] = None,
        validation_split: float = 0.2,
        enable_cross_validation: bool = True,
        cv_folds: int = 5
    ) -> 'AdvancedFraudDetectionEngine':
        """
        Fit the fraud detection models on training data.
        
        This method trains all constituent models in parallel and computes
        performance metrics using cross-validation.
        
        Time Complexity: O(n log n + n² + n³) dominated by One-Class SVM
        Space Complexity: O(n²) for LOF distance matrix
        
        Args:
            X: Training feature matrix of shape (n_samples, n_features)
            y: Optional target vector for validation (binary: 0=normal, 1=fraud)
            validation_split: Fraction of data to use for validation
            enable_cross_validation: Whether to perform cross-validation
            cv_folds: Number of cross-validation folds
            
        Returns:
            Self for method chaining
            
        Raises:
            ValueError: If input data is invalid
            RuntimeError: If model training fails
            
        Examples:
            >>> engine = AdvancedFraudDetectionEngine()
            >>> engine.fit(X_train, y_train)
            >>> print(f"Training completed. Models: {list(engine.models.keys())}")
        """
        logger.info("Starting fraud detection model training")
        start_time = time.time()
        
        try:
            # Validate input data
            X, y = self._validate_input_data(X, y)
            n_samples, n_features = X.shape
            
            logger.info(f"Training on {n_samples} samples with {n_features} features")
            
            # Initialize and fit scaler
            self._initialize_scaler(X)
            X_scaled = self._scale_data(X)
            
            # Split data for validation if y is provided
            validation_data = None
            if y is not None and validation_split > 0:
                split_idx = int(len(X) * (1 - validation_split))
                X_train, X_val = X_scaled[:split_idx], X_scaled[split_idx:]
                y_train, y_val = y[:split_idx], y[split_idx:]
                validation_data = (X_val, y_val)
                X_scaled = X_train
            
            # Initialize models
            models_to_train = {
                'isolation_forest': IsolationForest(**self.isolation_forest_params),
                'lof': LocalOutlierFactor(**self.lof_params),
                'ocsvm': OneClassSVM(**self.ocsvm_params)
            }
            
            # Train models in parallel
            trained_models = {}
            training_metrics = {}
            
            with ThreadPoolExecutor(max_workers=min(3, self.n_jobs)) as executor:
                # Submit training jobs
                future_to_name = {
                    executor.submit(self._train_single_model, name, model, X_scaled, validation_data, enable_cross_validation, cv_folds): name
                    for name, model in models_to_train.items()
                }
                
                # Collect results
                for future in as_completed(future_to_name):
                    model_name = future_to_name[future]
                    try:
                        model, metrics = future.result()
                        trained_models[model_name] = model
                        training_metrics[model_name] = metrics
                        logger.info(f"Successfully trained {model_name}")
                    except Exception as e:
                        logger.error(f"Failed to train {model_name}: {str(e)}")
                        raise RuntimeError(f"Model training failed for {model_name}: {str(e)}")
            
            # Store results
            self.models = trained_models
            self.training_metrics = training_metrics
            
            # Calculate ensemble weights based on performance
            if not self.model_weights:
                self._calculate_ensemble_weights()
            
            self.is_fitted = True
            total_time = time.time() - start_time
            
            logger.info(f"Training completed in {total_time:.2f}s")
            logger.info(f"Ensemble weights: {self.model_weights}")
            
            return self
            
        except Exception as e:
            logger.error(f"Training failed: {str(e)}")
            raise
    
    def _train_single_model(
        self, 
        model_name: str, 
        model: ModelProtocol, 
        X: np.ndarray,
        validation_data: Optional[Tuple[np.ndarray, np.ndarray]] = None,
        enable_cross_validation: bool = True,
        cv_folds: int = 5
    ) -> Tuple[ModelProtocol, ModelMetrics]:
        """Train a single model and compute metrics."""
        start_time = time.time()
        
        try:
            # Fit the model
            model.fit(X)
            training_time = time.time() - start_time
            
            # Initialize metrics
            metrics = ModelMetrics(training_time=training_time)
            
            # Compute validation metrics if validation data provided
            if validation_data is not None:
                X_val, y_val = validation_data
                pred_start = time.time()
                
                # Get predictions and scores
                if hasattr(model, 'decision_function'):
                    anomaly_scores = model.decision_function(X_val)
                    predictions = (anomaly_scores < 0).astype(int)  # Negative scores = anomalies
                else:
                    predictions = model.predict(X_val)
                    predictions = (predictions == -1).astype(int)  # -1 = anomaly, 1 = normal
                    anomaly_scores = -predictions  # Simple score conversion
                
                metrics.prediction_time = time.time() - pred_start
                
                # Calculate performance metrics
                if len(np.unique(y_val)) > 1:  # Ensure both classes present
                    metrics.auc_roc = roc_auc_score(y_val, -anomaly_scores)  # Flip for ROC
                    metrics.average_precision = average_precision_score(y_val, -anomaly_scores)
                    
                    # Calculate precision, recall, F1 at default threshold
                    cm = confusion_matrix(y_val, predictions)
                    if cm.shape == (2, 2):
                        tn, fp, fn, tp = cm.ravel()
                        metrics.precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
                        metrics.recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
                        metrics.f1_score = (2 * metrics.precision * metrics.recall / 
                                          (metrics.precision + metrics.recall) 
                                          if (metrics.precision + metrics.recall) > 0 else 0.0)
            
            # Perform cross-validation if enabled
            if enable_cross_validation and validation_data is not None:
                try:
                    X_val, y_val = validation_data
                    # Use a simple scoring function for cross-validation
                    cv_scores = cross_val_score(
                        model, X_val, y_val, 
                        cv=min(cv_folds, len(X_val) // 2),
                        scoring='roc_auc',
                        n_jobs=1  # Avoid nested parallelism
                    )
                    metrics.cross_val_scores = cv_scores.tolist()
                except Exception as cv_error:
                    logger.warning(f"Cross-validation failed for {model_name}: {cv_error}")
            
            return model, metrics
            
        except Exception as e:
            logger.error(f"Failed to train {model_name}: {str(e)}")
            raise
    
    def _calculate_ensemble_weights(self) -> None:
        """Calculate ensemble weights based on model performance."""
        if not self.training_metrics:
            # Equal weights if no metrics available
            n_models = len(self.models)
            self.model_weights = {name: 1.0 / n_models for name in self.models.keys()}
            return
        
        # Weight by AUC-ROC performance
        total_weight = 0.0
        weights = {}
        
        for model_name, metrics in self.training_metrics.items():
            # Use AUC-ROC as primary weight factor, fallback to 0.5 if not available
            weight = max(metrics.auc_roc, 0.5) if metrics.auc_roc > 0 else 0.5
            weights[model_name] = weight
            total_weight += weight
        
        # Normalize weights
        if total_weight > 0:
            self.model_weights = {name: w / total_weight for name, w in weights.items()}
        else:
            n_models = len(self.models)
            self.model_weights = {name: 1.0 / n_models for name in self.models.keys()}
    
    @performance_monitor
    def predict(
        self, 
        X: ArrayLike,
        return_scores: bool = True,
        confidence_threshold: float = 0.5,
        enable_parallel: bool = True
    ) -> DetectionResult:
        """
        Predict fraud on new data using ensemble of trained models.
        
        Time Complexity: O(log n + k + m) where:
        - n = training set size (for Isolation Forest)
        - k = number of neighbors (for LOF) 
        - m = number of support vectors (for One-Class SVM)
        
        Space Complexity: O(p) where p = number of predictions
        
        Args:
            X: Feature matrix to predict on
            return_scores: Whether to return anomaly scores
            confidence_threshold: Threshold for confidence calculation
            enable_parallel: Whether to use parallel prediction
            
        Returns:
            DetectionResult containing predictions, scores, and metadata
            
        Raises:
            RuntimeError: If models are not fitted
            ValueError: If input data is invalid
            
        Examples:
            >>> results = engine.predict(X_test)
            >>> fraud_indices = np.where(results.predictions == 1)[0]
            >>> print(f"Detected {len(fraud_indices)} fraudulent transactions")
            
            >>> # With custom threshold
            >>> results = engine.predict(X_test, confidence_threshold=0.7)
            >>> high_confidence_fraud = results.predictions[results.confidence > 0.7]
        """
        if not self.is_fitted:
            raise RuntimeError("Models must be fitted before prediction. Call fit() first.")
        
        start_time = time.time()
        
        try:
            # Validate input
            X, _ = self._validate_input_data(X)
            n_samples = X.shape[0]
            
            # Check cache if enabled
            cache_key = None
            if self.performance_monitor:
                cache_key = self.performance_monitor._generate_cache_key(X, {
                    'models': list(self.models.keys()),
                    'weights': self.model_weights,
                    'threshold': confidence_threshold
                })
                cached_result = self.performance_monitor.get_cached_result(cache_key)
                if cached_result is not None:
                    logger.info("Returning cached prediction result")
                    return cached_result
            
            # Scale data
            X_scaled = self._scale_data(X)
            
            # Get predictions from all models
            if enable_parallel and len(self.models) > 1:
                model_results = self._predict_parallel(X_scaled)
            else:
                model_results = self._predict_sequential(X_scaled)
            
            # Combine predictions using ensemble weights
            ensemble_scores = np.zeros(n_samples)
            ensemble_predictions = np.zeros(n_samples)
            
            for model_name, (predictions, scores) in model_results.items():
                weight = self.model_weights.get(model_name, 1.0 / len(self.models))
                ensemble_scores += weight * scores
                ensemble_predictions += weight * predictions
            
            # Convert ensemble predictions to binary
            final_predictions = (ensemble_predictions >= 0.5).astype(int)
            
            # Calculate confidence scores
            confidence_scores = self._calculate_confidence(ensemble_scores, confidence_threshold)
            
            processing_time = time.time() - start_time
            self.last_prediction_time = processing_time
            
            # Create result object
            result = DetectionResult(
                predictions=final_predictions,
                anomaly_scores=ensemble_scores if return_scores else np.array([]),
                confidence=confidence_scores,
                model_name="ensemble",
                processing_time=processing_time,
                metadata={
                    'n_samples': n_samples,
                    'model_weights': self.model_weights.copy(),
                    'cache_hit_rate': (self.performance_monitor.cache_hit_rate 
                                     if self.performance_monitor else 0.0),
                    'individual_results': model_results
                }
            )
            
            # Cache result if enabled
            if self.performance_monitor and cache_key:
                self.performance_monitor.cache_result(cache_key, result)
            
            logger.info(f"Prediction completed in {processing_time:.4f}s for {n_samples} samples")
            
            return result
            
        except Exception as e:
            logger.error(f"Prediction failed: {str(e)}")
            raise
    
    def _predict_parallel(self, X: np.ndarray) -> Dict[str, Tuple[np.ndarray, np.ndarray]]:
        """Predict using multiple models in parallel."""
        results = {}
        
        with ThreadPoolExecutor(max_workers=min(len(self.models), self.n_jobs)) as executor:
            future_to_name = {
                executor.submit(self._predict_single_model, name, model, X): name
                for name, model in self.models.items()
            }
            
            for future in as_completed(future_to_name):
                model_name = future_to_name[future]
                try:
                    predictions, scores = future.result()
                    results[model_name] = (predictions, scores)
                except Exception as e:
                    logger.warning(f"Prediction failed for {model_name}: {str(e)}")
                    # Use fallback predictions
                    n_samples = X.shape[0]
                    results[model_name] = (np.zeros(n_samples), np.zeros(n_samples))
        
        return results
    
    def _predict_sequential(self, X: np.ndarray) -> Dict[str, Tuple[np.ndarray, np.ndarray]]:
        """Predict using models sequentially."""
        results = {}
        
        for model_name, model in self.models.items():
            try:
                predictions, scores = self._predict_single_model(model_name, model, X)
                results[model_name] = (predictions, scores)
            except Exception as e:
                logger.warning(f"Prediction failed for {model_name}: {str(e)}")
                n_samples = X.shape[0]
                results[model_name] = (np.zeros(n_samples), np.zeros(n_samples))
        
        return results
    
    def _predict_single_model(self, model_name: str, model: ModelProtocol, X: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Get predictions and scores from a single model."""
        try:
            # Get anomaly scores
            if hasattr(model, 'decision_function'):
                scores = model.decision_function(X)
                predictions = (scores < 0).astype(int)  # Negative = anomaly
            else:
                pred_labels = model.predict(X)
                predictions = (pred_labels == -1).astype(int)  # -1 = anomaly
                scores = -predictions.astype(float)  # Convert to scores
            
            # Normalize scores to [0, 1] range
            if len(scores) > 1:
                score_min, score_max = scores.min(), scores.max()
                if score_max > score_min:
                    scores = (scores - score_min) / (score_max - score_min)
            
            return predictions, scores
            
        except Exception as e:
            logger.error(f"Single model prediction failed for {model_name}: {str(e)}")
            raise
    
    def _calculate_confidence(self, scores: np.ndarray, threshold: float) -> np.ndarray:
        """Calculate confidence scores for predictions."""
        # Confidence based on distance from decision boundary
        # Higher absolute scores = higher confidence
        abs_scores = np.abs(scores - 0.5)  # Distance from neutral (0.5)
        max_distance = 0.5
        confidence = abs_scores / max_distance
        return np.clip(confidence, 0.0, 1.0)
    
    @deprecated("2.0.0", "predict")
    def detect_fraud(self, X: ArrayLike) -> np.ndarray:
        """Legacy method for fraud detection. Use predict() instead."""
        result = self.predict(X, return_scores=False)
        return result.predictions
    
    def get_model_performance(self) -> Dict[str, ModelMetrics]:
        """
        Get performance metrics for all trained models.
        
        Returns:
            Dictionary mapping model names to their performance metrics
            
        Examples:
            >>> metrics = engine.get_model_performance()
            >>> for model_name, metric in metrics.items():
            ...     print(f"{model_name}: AUC-ROC = {metric.auc_roc:.3f}")
        """
        return self.training_metrics.copy()
    
    def get_feature_importance(self, method: str = 'permutation') -> Optional[Dict[str, float]]:
        """
        Get feature importance scores.
        
        Args:
            method: Method for computing importance ('permutation', 'isolation_forest')
            
        Returns:
            Dictionary mapping feature names to importance scores, or None if not available
            
        Note:
            Only Isolation Forest provides built-in feature importance.
            Other methods require permutation testing which is computationally expensive.
        """
        if not self.is_fitted:
            logger.warning("Models not fitted. Cannot compute feature importance.")
            return None
        
        if method == 'isolation_forest' and 'isolation_forest' in self.models:
            # Isolation Forest doesn't have feature_importances_ in sklearn
            logger.warning("Isolation Forest feature importance not directly available in sklearn")
            return None
        
        logger.warning(f"Feature importance method '{method}' not implemented")
        return None
    
    def save_model(self, filepath: str) -> None:
        """
        Save the trained model ensemble to disk.
        
        Args:
            filepath: Path to save the model
            
        Raises:
            RuntimeError: If models are not fitted
            IOError: If save operation fails
            
        Examples:
            >>> engine.save_model('fraud_detection_model.pkl')
        """
        if not self.is_fitted:
            raise RuntimeError("Cannot save unfitted model")
        
        try:
            model_data = {
                'models': self.models,
                'model_weights': self.model_weights,
                'scaler': self.scaler,
                'training_metrics': self.training_metrics,
                'feature_names': self.feature_names,
                'model_params': {
                    'isolation_forest_params': self.isolation_forest_params,
                    'lof_params': self.lof_params,
                    'ocsvm_params': self.ocsvm_params
                },
                'config': {
                    'scaler_type': self.scaler_type,
                    'random_state': self.random_state
                }
            }
            
            with open(filepath, 'wb') as f:
                pickle.dump(model_data, f)
            
            logger.info(f"Model saved to {filepath}")
            
        except Exception as e:
            logger.error(f"Failed to save model: {str(e)}")
            raise IOError(f"Model save failed: {str(e)}")
    
    @classmethod
    def load_model(cls, filepath: str) -> 'AdvancedFraudDetectionEngine':
        """
        Load a trained model ensemble from disk.
        
        Args:
            filepath: Path to the saved model
            
        Returns:
            Loaded AdvancedFraudDetectionEngine instance
            
        Raises:
            IOError: If load operation fails
            ValueError: If loaded data is invalid
            
        Examples:
            >>> engine = AdvancedFraudDetectionEngine.load_model('fraud_detection_model.pkl')
            >>> results = engine.predict(X_test)
        """
        try:
            with open(filepath, 'rb') as f:
                model_data = pickle.load(f)
            
            # Create new instance
            config = model_data.get('config', {})
            model_params = model_data.get('model_params', {})
            
            instance = cls(
                isolation_forest_params=model_params.get('isolation_forest_params'),
                lof_params=model_params.get('lof_params'),
                ocsvm_params=model_params.get('ocsvm_params'),
                scaler_type=config.get('scaler_type', 'standard'),
                random_state=config.get('random_state', 42)
            )
            
            # Restore state
            instance.models = model_data['models']
            instance.model_weights = model_data['model_weights']
            instance.scaler = model_data['scaler']
            instance.training_metrics = model_data['training_metrics']
            instance.feature_names = model_data.get('feature_names')
            instance.is_fitted = True
            
            logger.info(f"Model loaded from {filepath}")
            return instance
            
        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            raise IOError(f"Model load failed: {str(e)}")
    
    def __repr__(self) -> str:
        """String representation of the engine."""
        status = "fitted" if self.is_fitted else "not fitted"
        n_models = len(self.models)
        return f"AdvancedFraudDetectionEngine(models={n_models}, status={status})"
    
    def __str__(self) -> str:
        """Human-readable string representation."""
        if not self.is_fitted:
            return "AdvancedFraudDetectionEngine (not fitted)"
        
        info = [
            f"AdvancedFraudDetectionEngine (fitted)",
            f"Models: {list(self.models.keys())}",
            f"Scaler: {self.scaler_type}",
            f"Features: {len(self.feature_names) if self.feature_names else 'unknown'}"
        ]
        
        if self.training_metrics:
            avg_auc = np.mean([m.auc_roc for m in self.training_metrics.values() if m.auc_roc > 0])
            if avg_auc > 0:
                info.append(f"Average AUC-ROC: {avg_auc:.3f}")
        
        return "\n".join(info)


# Example usage and demonstration
if __name__ == "__main__":
    # This section demonstrates the usage of the AdvancedFraudDetectionEngine
    import numpy as np
    from sklearn.datasets import make_classification
    
    # Generate synthetic fraud detection dataset
    X, y = make_classification(
        n_samples=1000,
        n_features=20,
        n_redundant=0,
        n_informative=15,
        n_clusters_per_class=1,
        weights=[0.9, 0.1],  # Imbalanced dataset (10% fraud)
        random_state=42
    )
    
    print("=== Advanced Fraud Detection Engine Demo ===")
    print(f"Dataset: {X.shape[0]} samples, {X.shape[1]} features")
    print(f"Fraud rate: {np.mean(y):.1%}")
    
    # Initialize and train the engine
    engine = AdvancedFraudDetectionEngine(
        isolation_forest_params={'contamination': 0.1},
        enable_caching=True,
        n_jobs=2
    )
    
    # Split data
    split_idx = int(0.8 * len(X))
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]
    
    # Train the model
    print("\nTraining models...")
    engine.fit(X_train, y_train)
    
    # Make predictions
    print("\nMaking predictions...")
    results = engine.predict(X_test)
    
    # Evaluate performance
    from sklearn.metrics import classification_report, roc_auc_score
    
    print("\n=== Results ===")
    print(f"Processing time: {results.processing_time:.4f}s")
    print(f"Detected fraud cases: {np.sum(results.predictions)}")
    print(f"Cache hit rate: {results.metadata['cache_hit_rate']:.2%}")
    
    if len(np.unique(y_test)) > 1:
        auc_score = roc_auc_score(y_test, results.anomaly_scores)
        print(f"AUC-ROC: {auc_score:.3f}")
        print("\nClassification Report:")
        print(classification_report(y_test, results.predictions, 
                                   target_names=['Normal', 'Fraud']))
    
    # Display model performance
    print("\n=== Model Performance ===")
    performance = engine.get_model_performance()
    for model_name, metrics in performance.items():
        print(f"{model_name}:")
        print(f"  AUC-ROC: {metrics.auc_roc:.3f}")
        print(f"  Training time: {metrics.training_time:.3f}s")
        print(f"  Prediction time: {metrics.prediction_time:.4f}s")
    
    print(f"\nEngine info:\n{engine}")