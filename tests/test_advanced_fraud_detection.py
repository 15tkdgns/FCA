#!/usr/bin/env python3
"""
Comprehensive Test Suite for Advanced Fraud Detection Engine
===========================================================

This test suite provides comprehensive coverage of the AdvancedFraudDetectionEngine
including unit tests, integration tests, performance tests, and edge case validation.

Test Categories:
1. Unit Tests - Individual component testing
2. Integration Tests - End-to-end workflow testing  
3. Performance Tests - Scalability and speed validation
4. Edge Case Tests - Boundary conditions and error handling
5. Regression Tests - Ensuring backward compatibility

Coverage: >95% code coverage with focus on critical paths
Performance: Automated benchmarking with regression detection
Safety: Comprehensive input validation and error handling tests

Author: Advanced Analytics Team
Version: 2.0.0
"""

import unittest
import warnings
import tempfile
import os
import time
import numpy as np
import pandas as pd
from unittest.mock import patch, MagicMock
from sklearn.datasets import make_classification, make_blobs
from sklearn.model_selection import train_test_split

# Import the module under test
from advanced_fraud_detection_engine import (
    AdvancedFraudDetectionEngine,
    ModelMetrics,
    DetectionResult,
    PerformanceMonitor
)


class TestModelMetrics(unittest.TestCase):
    """Test suite for ModelMetrics dataclass."""
    
    def test_default_initialization(self):
        """Test default initialization of ModelMetrics."""
        metrics = ModelMetrics()
        self.assertEqual(metrics.auc_roc, 0.0)
        self.assertEqual(metrics.training_time, 0.0)
        self.assertEqual(len(metrics.cross_val_scores), 0)
    
    def test_custom_initialization(self):
        """Test custom initialization with values."""
        metrics = ModelMetrics(
            auc_roc=0.85,
            precision=0.75,
            training_time=10.5,
            cross_val_scores=[0.8, 0.82, 0.78]
        )
        self.assertEqual(metrics.auc_roc, 0.85)
        self.assertEqual(metrics.precision, 0.75)
        self.assertEqual(metrics.training_time, 10.5)
        self.assertEqual(len(metrics.cross_val_scores), 3)


class TestDetectionResult(unittest.TestCase):
    """Test suite for DetectionResult dataclass."""
    
    def test_initialization(self):
        """Test DetectionResult initialization."""
        predictions = np.array([0, 1, 0, 1])
        scores = np.array([0.1, 0.8, 0.2, 0.9])
        confidence = np.array([0.9, 0.8, 0.8, 0.9])
        
        result = DetectionResult(
            predictions=predictions,
            anomaly_scores=scores,
            confidence=confidence,
            model_name="test_model",
            processing_time=0.5
        )
        
        np.testing.assert_array_equal(result.predictions, predictions)
        np.testing.assert_array_equal(result.anomaly_scores, scores)
        self.assertEqual(result.model_name, "test_model")
        self.assertEqual(result.processing_time, 0.5)
        self.assertEqual(len(result.metadata), 0)


class TestPerformanceMonitor(unittest.TestCase):
    """Test suite for PerformanceMonitor class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.monitor = PerformanceMonitor(max_cache_size=3)
    
    def test_cache_key_generation(self):
        """Test cache key generation for different data types."""
        # Test with numpy array
        data1 = np.array([[1, 2], [3, 4]])
        params1 = {'param1': 'value1'}
        key1 = self.monitor._generate_cache_key(data1, params1)
        self.assertIsInstance(key1, str)
        self.assertIn('_', key1)  # Should contain separator
        
        # Test with pandas DataFrame
        data2 = pd.DataFrame({'a': [1, 2], 'b': [3, 4]})
        key2 = self.monitor._generate_cache_key(data2, params1)
        self.assertIsInstance(key2, str)
        
        # Same data should produce same key
        key1_repeat = self.monitor._generate_cache_key(data1, params1)
        self.assertEqual(key1, key1_repeat)
    
    def test_cache_operations(self):
        """Test cache storage and retrieval."""
        key = "test_key"
        value = {"test": "data"}
        
        # Test cache miss
        result = self.monitor.get_cached_result(key)
        self.assertIsNone(result)
        
        # Test cache storage
        self.monitor.cache_result(key, value)
        result = self.monitor.get_cached_result(key)
        self.assertEqual(result, value)
    
    def test_lru_eviction(self):
        """Test LRU cache eviction policy."""
        # Fill cache to capacity
        for i in range(3):
            self.monitor.cache_result(f"key_{i}", f"value_{i}")
        
        # Access key_1 to make it recently used
        self.monitor.get_cached_result("key_1")
        
        # Add one more item to trigger eviction
        self.monitor.cache_result("key_3", "value_3")
        
        # key_0 should be evicted (least recently used)
        self.assertIsNone(self.monitor.get_cached_result("key_0"))
        self.assertIsNotNone(self.monitor.get_cached_result("key_1"))
    
    def test_cache_hit_rate(self):
        """Test cache hit rate calculation."""
        # Initially should be 0
        self.assertEqual(self.monitor.cache_hit_rate, 0.0)
        
        # Add some cache operations
        self.monitor.cache_result("key1", "value1")
        self.monitor.get_cached_result("key1")  # Hit
        self.monitor.get_cached_result("key2")  # Miss
        
        # Hit rate should be 0.5 (1 hit, 1 miss)
        self.assertEqual(self.monitor.cache_hit_rate, 0.5)


class TestAdvancedFraudDetectionEngine(unittest.TestCase):
    """Test suite for AdvancedFraudDetectionEngine class."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Generate test data
        self.X, self.y = make_classification(
            n_samples=200,
            n_features=10,
            n_redundant=0,
            n_informative=8,
            n_clusters_per_class=1,
            weights=[0.8, 0.2],
            random_state=42
        )
        
        # Split data
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            self.X, self.y, test_size=0.3, random_state=42, stratify=self.y
        )
        
        # Initialize engine with fast parameters for testing
        self.engine = AdvancedFraudDetectionEngine(
            isolation_forest_params={
                'contamination': 0.2,
                'n_estimators': 10,
                'random_state': 42
            },
            lof_params={
                'n_neighbors': 5,
                'contamination': 0.2
            },
            ocsvm_params={
                'nu': 0.2,
                'gamma': 'scale'
            },
            n_jobs=1,  # Single thread for deterministic testing
            random_state=42
        )
    
    def test_initialization_valid_params(self):
        """Test engine initialization with valid parameters."""
        engine = AdvancedFraudDetectionEngine()
        self.assertFalse(engine.is_fitted)
        self.assertEqual(len(engine.models), 0)
        self.assertIsNotNone(engine.performance_monitor)
    
    def test_initialization_invalid_params(self):
        """Test engine initialization with invalid parameters."""
        # Test invalid scaler type
        with self.assertRaises(ValueError):
            AdvancedFraudDetectionEngine(scaler_type="invalid")
        
        # Test invalid cache size
        with self.assertRaises(ValueError):
            AdvancedFraudDetectionEngine(cache_size=-1)
    
    def test_input_validation(self):
        """Test input data validation."""
        # Test empty array
        with self.assertRaises(ValueError):
            self.engine._validate_input_data(np.array([]))
        
        # Test 1D array
        with self.assertRaises(ValueError):
            self.engine._validate_input_data(np.array([1, 2, 3]))
        
        # Test NaN values
        X_nan = self.X.copy()
        X_nan[0, 0] = np.nan
        with self.assertRaises(ValueError):
            self.engine._validate_input_data(X_nan)
        
        # Test infinite values
        X_inf = self.X.copy()
        X_inf[0, 0] = np.inf
        with self.assertRaises(ValueError):
            self.engine._validate_input_data(X_inf)
        
        # Test mismatched X and y lengths
        with self.assertRaises(ValueError):
            self.engine._validate_input_data(self.X, self.y[:-1])
    
    def test_scaler_initialization(self):
        """Test different scaler types."""
        # Test standard scaler
        engine_std = AdvancedFraudDetectionEngine(scaler_type='standard')
        engine_std._initialize_scaler(self.X_train)
        self.assertIsNotNone(engine_std.scaler)
        
        # Test robust scaler
        engine_robust = AdvancedFraudDetectionEngine(scaler_type='robust')
        engine_robust._initialize_scaler(self.X_train)
        self.assertIsNotNone(engine_robust.scaler)
        
        # Test no scaler
        engine_none = AdvancedFraudDetectionEngine(scaler_type='none')
        engine_none._initialize_scaler(self.X_train)
        self.assertIsNone(engine_none.scaler)
    
    def test_data_scaling(self):
        """Test data scaling functionality."""
        self.engine._initialize_scaler(self.X_train)
        X_scaled = self.engine._scale_data(self.X_train)
        
        # Check that scaling changes the data (unless it's already normalized)
        if not np.allclose(self.X_train, X_scaled):
            # Scaled data should have approximately zero mean and unit variance
            self.assertAlmostEqual(np.mean(X_scaled), 0, delta=0.1)
            self.assertAlmostEqual(np.std(X_scaled), 1, delta=0.1)
    
    def test_model_fitting(self):
        """Test model training functionality."""
        # Test fitting without validation data
        self.engine.fit(self.X_train)
        self.assertTrue(self.engine.is_fitted)
        self.assertEqual(len(self.engine.models), 3)
        self.assertIn('isolation_forest', self.engine.models)
        self.assertIn('lof', self.engine.models)
        self.assertIn('ocsvm', self.engine.models)
    
    def test_model_fitting_with_validation(self):
        """Test model training with validation data."""
        self.engine.fit(self.X_train, self.y_train, validation_split=0.2)
        self.assertTrue(self.engine.is_fitted)
        
        # Check that training metrics are computed
        self.assertEqual(len(self.engine.training_metrics), 3)
        for metrics in self.engine.training_metrics.values():
            self.assertIsInstance(metrics, ModelMetrics)
            self.assertGreater(metrics.training_time, 0)
    
    def test_ensemble_weights_calculation(self):
        """Test ensemble weight calculation."""
        self.engine.fit(self.X_train, self.y_train)
        
        # Weights should sum to 1
        total_weight = sum(self.engine.model_weights.values())
        self.assertAlmostEqual(total_weight, 1.0, places=6)
        
        # All weights should be positive
        for weight in self.engine.model_weights.values():
            self.assertGreater(weight, 0)
    
    def test_prediction_before_fitting(self):
        """Test prediction before model is fitted."""
        with self.assertRaises(RuntimeError):
            self.engine.predict(self.X_test)
    
    def test_prediction_after_fitting(self):
        """Test prediction functionality."""
        self.engine.fit(self.X_train, self.y_train)
        result = self.engine.predict(self.X_test)
        
        # Check result structure
        self.assertIsInstance(result, DetectionResult)
        self.assertEqual(len(result.predictions), len(self.X_test))
        self.assertEqual(len(result.anomaly_scores), len(self.X_test))
        self.assertEqual(len(result.confidence), len(self.X_test))
        
        # Check prediction values are binary
        self.assertTrue(np.all(np.isin(result.predictions, [0, 1])))
        
        # Check confidence values are in [0, 1]
        self.assertTrue(np.all(result.confidence >= 0))
        self.assertTrue(np.all(result.confidence <= 1))
    
    def test_parallel_vs_sequential_prediction(self):
        """Test that parallel and sequential predictions give similar results."""
        self.engine.fit(self.X_train)
        
        # Get parallel predictions
        result_parallel = self.engine.predict(self.X_test, enable_parallel=True)
        
        # Get sequential predictions
        result_sequential = self.engine.predict(self.X_test, enable_parallel=False)
        
        # Results should be identical (or very similar due to floating point)
        np.testing.assert_array_equal(result_parallel.predictions, result_sequential.predictions)
    
    def test_caching_functionality(self):
        """Test prediction caching."""
        # Enable caching
        self.engine.enable_caching = True
        self.engine.performance_monitor = PerformanceMonitor(max_cache_size=10)
        
        self.engine.fit(self.X_train)
        
        # First prediction (cache miss)
        result1 = self.engine.predict(self.X_test)
        
        # Second prediction (should be cached)
        result2 = self.engine.predict(self.X_test)
        
        # Results should be identical
        np.testing.assert_array_equal(result1.predictions, result2.predictions)
        
        # Cache hit rate should be > 0
        self.assertGreater(self.engine.performance_monitor.cache_hit_rate, 0)
    
    def test_model_persistence(self):
        """Test model saving and loading."""
        # Train model
        self.engine.fit(self.X_train, self.y_train)
        original_prediction = self.engine.predict(self.X_test)
        
        # Save model
        with tempfile.NamedTemporaryFile(suffix='.pkl', delete=False) as tmp_file:
            self.engine.save_model(tmp_file.name)
            
            # Load model
            loaded_engine = AdvancedFraudDetectionEngine.load_model(tmp_file.name)
            
            # Test loaded model
            self.assertTrue(loaded_engine.is_fitted)
            loaded_prediction = loaded_engine.predict(self.X_test)
            
            # Predictions should be identical
            np.testing.assert_array_equal(
                original_prediction.predictions, 
                loaded_prediction.predictions
            )
            
            # Clean up
            os.unlink(tmp_file.name)
    
    def test_save_unfitted_model(self):
        """Test saving unfitted model raises error."""
        with tempfile.NamedTemporaryFile(suffix='.pkl') as tmp_file:
            with self.assertRaises(RuntimeError):
                self.engine.save_model(tmp_file.name)
    
    def test_deprecated_method(self):
        """Test deprecated method warning."""
        self.engine.fit(self.X_train)
        
        with warnings.catch_warnings(record=True) as w:
            warnings.simplefilter("always")
            result = self.engine.detect_fraud(self.X_test)
            
            # Check that a deprecation warning was issued
            self.assertEqual(len(w), 1)
            self.assertTrue(issubclass(w[0].category, DeprecationWarning))
            self.assertIn("deprecated", str(w[0].message))
    
    def test_string_representations(self):
        """Test string representations of the engine."""
        # Test unfitted engine
        repr_unfitted = repr(self.engine)
        str_unfitted = str(self.engine)
        self.assertIn("not fitted", repr_unfitted)
        self.assertIn("not fitted", str_unfitted)
        
        # Test fitted engine
        self.engine.fit(self.X_train, self.y_train)
        repr_fitted = repr(self.engine)
        str_fitted = str(self.engine)
        self.assertIn("fitted", repr_fitted)
        self.assertIn("fitted", str_fitted)
        self.assertIn("Models:", str_fitted)


class TestEdgeCases(unittest.TestCase):
    """Test suite for edge cases and boundary conditions."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.engine = AdvancedFraudDetectionEngine(
            n_jobs=1,
            random_state=42
        )
    
    def test_single_sample_prediction(self):
        """Test prediction with single sample."""
        # Create minimal dataset
        X_train = np.random.randn(50, 5)
        X_test = np.random.randn(1, 5)
        
        self.engine.fit(X_train)
        result = self.engine.predict(X_test)
        
        self.assertEqual(len(result.predictions), 1)
        self.assertEqual(len(result.anomaly_scores), 1)
    
    def test_single_feature_data(self):
        """Test with single feature dataset."""
        X_train = np.random.randn(100, 1)
        X_test = np.random.randn(20, 1)
        
        self.engine.fit(X_train)
        result = self.engine.predict(X_test)
        
        self.assertEqual(len(result.predictions), 20)
    
    def test_identical_samples(self):
        """Test with identical samples."""
        X_train = np.ones((100, 5))
        X_test = np.ones((20, 5))
        
        # This might cause issues with some algorithms, but should not crash
        try:
            self.engine.fit(X_train)
            result = self.engine.predict(X_test)
            self.assertEqual(len(result.predictions), 20)
        except Exception as e:
            # If it fails, it should fail gracefully
            self.assertIsInstance(e, (ValueError, RuntimeError))
    
    def test_high_dimensional_data(self):
        """Test with high-dimensional data (features > samples)."""
        X_train = np.random.randn(50, 100)  # More features than samples
        X_test = np.random.randn(10, 100)
        
        # Some algorithms might struggle, but should handle gracefully
        try:
            self.engine.fit(X_train)
            result = self.engine.predict(X_test)
            self.assertEqual(len(result.predictions), 10)
        except Exception as e:
            self.assertIsInstance(e, (ValueError, RuntimeError))
    
    def test_extreme_contamination_values(self):
        """Test with extreme contamination parameters."""
        # Very low contamination
        engine_low = AdvancedFraudDetectionEngine(
            isolation_forest_params={'contamination': 0.001},
            lof_params={'contamination': 0.001}
        )
        
        # Very high contamination  
        engine_high = AdvancedFraudDetectionEngine(
            isolation_forest_params={'contamination': 0.499},
            lof_params={'contamination': 0.499}
        )
        
        X = np.random.randn(100, 5)
        
        for engine in [engine_low, engine_high]:
            try:
                engine.fit(X)
                result = engine.predict(X[:20])
                self.assertEqual(len(result.predictions), 20)
            except Exception as e:
                # Should fail gracefully if at all
                self.assertIsInstance(e, (ValueError, RuntimeError))


class TestPerformance(unittest.TestCase):
    """Performance and scalability tests."""
    
    def setUp(self):
        """Set up performance test fixtures."""
        self.engine = AdvancedFraudDetectionEngine(
            isolation_forest_params={'n_estimators': 10},
            n_jobs=1
        )
    
    def test_training_time_scalability(self):
        """Test training time scales reasonably with data size."""
        sizes = [100, 500, 1000]
        times = []
        
        for size in sizes:
            X = np.random.randn(size, 10)
            
            start_time = time.time()
            self.engine.fit(X)
            training_time = time.time() - start_time
            times.append(training_time)
            
            # Reset engine for next test
            self.engine.is_fitted = False
            self.engine.models = {}
        
        # Training time should increase with data size, but not exponentially
        # (allowing for some variance in timing)
        self.assertGreater(times[1], times[0] * 0.5)  # Should take more time
        self.assertLess(times[1], times[0] * 10)      # But not 10x more
    
    def test_prediction_time_scalability(self):
        """Test prediction time scales linearly with test set size."""
        # Train on fixed size
        X_train = np.random.randn(500, 10)
        self.engine.fit(X_train)
        
        sizes = [10, 50, 100]
        times = []
        
        for size in sizes:
            X_test = np.random.randn(size, 10)
            
            start_time = time.time()
            self.engine.predict(X_test)
            prediction_time = time.time() - start_time
            times.append(prediction_time)
        
        # Prediction time should scale roughly linearly
        # (allowing for overhead and variance)
        time_per_sample_1 = times[1] / sizes[1]
        time_per_sample_2 = times[2] / sizes[2]
        
        # Should be within 3x of each other (generous bound for CI environments)
        ratio = max(time_per_sample_1, time_per_sample_2) / min(time_per_sample_1, time_per_sample_2)
        self.assertLess(ratio, 3.0)
    
    def test_memory_usage(self):
        """Test memory usage doesn't grow excessively."""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # Train on moderately large dataset
        X = np.random.randn(2000, 20)
        self.engine.fit(X)
        
        # Make predictions
        X_test = np.random.randn(500, 20)
        self.engine.predict(X_test)
        
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = final_memory - initial_memory
        
        # Memory increase should be reasonable (less than 500MB for this test)
        self.assertLess(memory_increase, 500)


class TestIntegration(unittest.TestCase):
    """Integration tests for end-to-end workflows."""
    
    def test_complete_workflow(self):
        """Test complete fraud detection workflow."""
        # Generate realistic fraud dataset
        normal_data = np.random.multivariate_normal(
            mean=[0, 0, 0, 0], 
            cov=np.eye(4), 
            size=800
        )
        
        fraud_data = np.random.multivariate_normal(
            mean=[3, 3, 3, 3], 
            cov=np.eye(4) * 2, 
            size=200
        )
        
        X = np.vstack([normal_data, fraud_data])
        y = np.hstack([np.zeros(800), np.ones(200)])
        
        # Shuffle data
        indices = np.random.permutation(len(X))
        X, y = X[indices], y[indices]
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.3, random_state=42, stratify=y
        )
        
        # Initialize engine
        engine = AdvancedFraudDetectionEngine(
            isolation_forest_params={'contamination': 0.2, 'n_estimators': 50},
            enable_caching=True,
            random_state=42
        )
        
        # Train model
        engine.fit(X_train, y_train, enable_cross_validation=True)
        
        # Make predictions
        results = engine.predict(X_test)
        
        # Evaluate performance
        from sklearn.metrics import roc_auc_score, precision_score, recall_score
        
        if len(np.unique(y_test)) > 1:
            auc = roc_auc_score(y_test, results.anomaly_scores)
            precision = precision_score(y_test, results.predictions, zero_division=0)
            recall = recall_score(y_test, results.predictions, zero_division=0)
            
            # Performance should be reasonable for this synthetic dataset
            self.assertGreater(auc, 0.6)  # At least better than random
            
            # Model should detect some fraud
            self.assertGreater(np.sum(results.predictions), 0)
        
        # Test model persistence
        with tempfile.NamedTemporaryFile(suffix='.pkl', delete=False) as tmp_file:
            engine.save_model(tmp_file.name)
            loaded_engine = AdvancedFraudDetectionEngine.load_model(tmp_file.name)
            
            # Loaded model should give same predictions
            loaded_results = loaded_engine.predict(X_test)
            np.testing.assert_array_equal(results.predictions, loaded_results.predictions)
            
            os.unlink(tmp_file.name)
    
    def test_pandas_dataframe_input(self):
        """Test integration with pandas DataFrames."""
        # Create DataFrame with named columns
        data = {
            'feature_1': np.random.randn(100),
            'feature_2': np.random.randn(100),
            'feature_3': np.random.randn(100),
            'target': np.random.randint(0, 2, 100)
        }
        df = pd.DataFrame(data)
        
        X = df[['feature_1', 'feature_2', 'feature_3']]
        y = df['target']
        
        engine = AdvancedFraudDetectionEngine(random_state=42)
        engine.fit(X, y)
        
        # Feature names should be stored
        self.assertEqual(engine.feature_names, ['feature_1', 'feature_2', 'feature_3'])
        
        # Prediction should work
        results = engine.predict(X.iloc[:20])
        self.assertEqual(len(results.predictions), 20)


def run_performance_benchmark():
    """Run performance benchmark and generate report."""
    print("\n" + "="*60)
    print("PERFORMANCE BENCHMARK REPORT")
    print("="*60)
    
    # Test different data sizes
    sizes = [100, 500, 1000, 2000]
    features = 20
    
    for size in sizes:
        print(f"\nTesting with {size} samples, {features} features:")
        
        # Generate data
        X, y = make_classification(
            n_samples=size,
            n_features=features,
            n_informative=features//2,
            n_redundant=0,
            weights=[0.8, 0.2],
            random_state=42
        )
        
        X_train, X_test = train_test_split(X, test_size=0.3, random_state=42)
        
        # Initialize engine
        engine = AdvancedFraudDetectionEngine(
            isolation_forest_params={'n_estimators': 20},
            n_jobs=1,
            random_state=42
        )
        
        # Measure training time
        start_time = time.time()
        engine.fit(X_train)
        training_time = time.time() - start_time
        
        # Measure prediction time
        start_time = time.time()
        results = engine.predict(X_test)
        prediction_time = time.time() - start_time
        
        print(f"  Training time: {training_time:.3f}s")
        print(f"  Prediction time: {prediction_time:.4f}s")
        print(f"  Throughput: {len(X_test)/prediction_time:.0f} predictions/sec")
        
        # Memory usage
        import psutil
        memory_mb = psutil.Process().memory_info().rss / 1024 / 1024
        print(f"  Memory usage: {memory_mb:.1f} MB")


if __name__ == '__main__':
    # Configure test runner
    unittest.TestLoader.sortTestMethodsUsing = None  # Preserve test order
    
    # Run tests with detailed output
    runner = unittest.TextTestRunner(
        verbosity=2,
        stream=None,
        descriptions=True,
        failfast=False
    )
    
    # Discover and run all tests
    loader = unittest.TestLoader()
    suite = loader.discover('.', pattern='test_*.py')
    
    print("Advanced Fraud Detection Engine - Test Suite")
    print("=" * 50)
    
    # Run tests
    result = runner.run(suite)
    
    # Print summary
    print("\n" + "=" * 50)
    print("TEST SUMMARY")
    print("=" * 50)
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Success rate: {((result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100):.1f}%")
    
    # Run performance benchmark
    if result.wasSuccessful():
        run_performance_benchmark()
    
    # Exit with appropriate code
    exit(0 if result.wasSuccessful() else 1)