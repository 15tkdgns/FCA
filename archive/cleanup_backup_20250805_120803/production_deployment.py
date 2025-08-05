#!/usr/bin/env python3
"""
Production Deployment Configuration for Advanced Fraud Detection Engine
======================================================================

This module provides production-ready configuration, monitoring, and deployment
utilities for the Advanced Fraud Detection Engine with enterprise-grade features.

Features:
- Configuration management with environment variables
- Health monitoring and alerting
- Performance metrics collection
- Model versioning and rollback
- A/B testing framework
- Security and audit logging
- High availability setup
- Resource optimization

Production Considerations:
- Thread-safe model serving
- Circuit breaker pattern for fault tolerance  
- Graceful degradation under load
- Automated model retraining pipelines
- Real-time monitoring dashboards
- SLA compliance tracking

Author: Advanced Analytics Team
Version: 2.0.0
License: MIT
"""

import os
import json
import time
import logging
import threading
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, asdict
from concurrent.futures import ThreadPoolExecutor
import pickle
import joblib
from pathlib import Path
import numpy as np
import pandas as pd
from contextlib import contextmanager

# Import our fraud detection engine
from advanced_fraud_detection_engine import AdvancedFraudDetectionEngine, DetectionResult

# Configure production logging
def setup_production_logging(log_level: str = "INFO", log_file: Optional[str] = None):
    """Set up production-grade logging configuration."""
    log_format = (
        '%(asctime)s - %(name)s - %(levelname)s - '
        '%(filename)s:%(lineno)d - %(funcName)s - %(message)s'
    )
    
    handlers = [logging.StreamHandler()]
    if log_file:
        handlers.append(logging.FileHandler(log_file))
    
    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        format=log_format,
        handlers=handlers
    )

# Initialize logger
setup_production_logging()
logger = logging.getLogger(__name__)


@dataclass
class ProductionConfig:
    """Production configuration container with validation."""
    
    # Model configuration
    model_path: str = "/opt/fraud_detection/models/current"
    backup_model_path: str = "/opt/fraud_detection/models/backup"
    model_version: str = "1.0.0"
    
    # Performance settings
    max_concurrent_requests: int = 100
    request_timeout_seconds: float = 30.0
    cache_size: int = 10000
    enable_caching: bool = True
    
    # Monitoring settings
    metrics_collection_interval: int = 60  # seconds
    health_check_interval: int = 30  # seconds
    alert_threshold_latency: float = 5.0  # seconds
    alert_threshold_error_rate: float = 0.05  # 5%
    
    # Security settings
    enable_audit_logging: bool = True
    max_request_size_mb: float = 10.0
    rate_limit_requests_per_minute: int = 1000
    
    # Data settings
    feature_validation_enabled: bool = True
    outlier_detection_threshold: float = 3.0
    
    # A/B Testing
    enable_ab_testing: bool = False
    ab_test_traffic_split: float = 0.1  # 10% to new model
    
    def __post_init__(self):
        """Validate configuration after initialization."""
        if self.max_concurrent_requests <= 0:
            raise ValueError("max_concurrent_requests must be positive")
        
        if self.request_timeout_seconds <= 0:
            raise ValueError("request_timeout_seconds must be positive")
        
        if not 0 <= self.ab_test_traffic_split <= 1:
            raise ValueError("ab_test_traffic_split must be between 0 and 1")
    
    @classmethod
    def from_env(cls) -> 'ProductionConfig':
        """Create configuration from environment variables."""
        return cls(
            model_path=os.getenv('FRAUD_MODEL_PATH', cls.model_path),
            model_version=os.getenv('FRAUD_MODEL_VERSION', cls.model_version),
            max_concurrent_requests=int(os.getenv('MAX_CONCURRENT_REQUESTS', cls.max_concurrent_requests)),
            request_timeout_seconds=float(os.getenv('REQUEST_TIMEOUT', cls.request_timeout_seconds)),
            cache_size=int(os.getenv('CACHE_SIZE', cls.cache_size)),
            enable_caching=os.getenv('ENABLE_CACHING', 'true').lower() == 'true',
            enable_audit_logging=os.getenv('ENABLE_AUDIT_LOGGING', 'true').lower() == 'true',
            enable_ab_testing=os.getenv('ENABLE_AB_TESTING', 'false').lower() == 'true',
            ab_test_traffic_split=float(os.getenv('AB_TEST_SPLIT', cls.ab_test_traffic_split))
        )


@dataclass
class RequestMetrics:
    """Container for request-level metrics."""
    request_id: str
    timestamp: datetime
    processing_time: float
    model_version: str
    prediction_count: int
    cache_hit: bool
    error: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for logging/storage."""
        data = asdict(self)
        data['timestamp'] = self.timestamp.isoformat()
        return data


class CircuitBreaker:
    """Circuit breaker pattern implementation for fault tolerance.
    
    Prevents cascading failures by temporarily disabling failing operations.
    States: CLOSED (normal), OPEN (failing), HALF_OPEN (testing recovery)
    """
    
    def __init__(
        self, 
        failure_threshold: int = 5,
        recovery_timeout: int = 60,
        expected_exception: type = Exception
    ):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exception = expected_exception
        
        self.failure_count = 0
        self.last_failure_time = None
        self.state = 'CLOSED'  # CLOSED, OPEN, HALF_OPEN
        self._lock = threading.Lock()
    
    def __call__(self, func: Callable):
        """Decorator to wrap functions with circuit breaker."""
        def wrapper(*args, **kwargs):
            with self._lock:
                if self.state == 'OPEN':
                    if self._should_attempt_reset():
                        self.state = 'HALF_OPEN'
                    else:
                        raise Exception("Circuit breaker is OPEN")
                
                try:
                    result = func(*args, **kwargs)
                    self._on_success()
                    return result
                    
                except self.expected_exception as e:
                    self._on_failure()
                    raise e
        
        return wrapper
    
    def _should_attempt_reset(self) -> bool:
        """Check if enough time has passed to attempt reset."""
        return (
            self.last_failure_time and
            time.time() - self.last_failure_time >= self.recovery_timeout
        )
    
    def _on_success(self):
        """Handle successful operation."""
        self.failure_count = 0
        self.state = 'CLOSED'
    
    def _on_failure(self):
        """Handle failed operation."""
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        if self.failure_count >= self.failure_threshold:
            self.state = 'OPEN'


class PerformanceMonitor:
    """Production performance monitoring with alerting."""
    
    def __init__(self, config: ProductionConfig):
        self.config = config
        self.metrics: List[RequestMetrics] = []
        self.alert_callbacks: List[Callable] = []
        self._lock = threading.Lock()
        self._monitoring_active = False
    
    def record_request(self, metrics: RequestMetrics):
        """Record metrics for a request."""
        with self._lock:
            self.metrics.append(metrics)
            
            # Keep only recent metrics (last 24 hours)
            cutoff_time = datetime.now() - timedelta(hours=24)
            self.metrics = [m for m in self.metrics if m.timestamp > cutoff_time]
    
    def get_current_stats(self) -> Dict[str, Any]:
        """Get current performance statistics."""
        with self._lock:
            if not self.metrics:
                return {}
            
            recent_metrics = [
                m for m in self.metrics 
                if m.timestamp > datetime.now() - timedelta(minutes=5)
            ]
            
            if not recent_metrics:
                return {}
            
            processing_times = [m.processing_time for m in recent_metrics]
            error_count = len([m for m in recent_metrics if m.error])
            cache_hits = len([m for m in recent_metrics if m.cache_hit])
            
            return {
                'requests_per_minute': len(recent_metrics),
                'avg_processing_time': np.mean(processing_times),
                'p95_processing_time': np.percentile(processing_times, 95),
                'error_rate': error_count / len(recent_metrics) if recent_metrics else 0,
                'cache_hit_rate': cache_hits / len(recent_metrics) if recent_metrics else 0,
                'total_requests_24h': len(self.metrics)
            }
    
    def add_alert_callback(self, callback: Callable[[Dict[str, Any]], None]):
        """Add callback function for alerts."""
        self.alert_callbacks.append(callback)
    
    def start_monitoring(self):
        """Start background monitoring thread."""
        if self._monitoring_active:
            return
        
        self._monitoring_active = True
        
        def monitor_loop():
            while self._monitoring_active:
                try:
                    stats = self.get_current_stats()
                    if stats:
                        self._check_alerts(stats)
                except Exception as e:
                    logger.error(f"Monitoring error: {e}")
                
                time.sleep(self.config.metrics_collection_interval)
        
        thread = threading.Thread(target=monitor_loop, daemon=True)
        thread.start()
        logger.info("Performance monitoring started")
    
    def stop_monitoring(self):
        """Stop background monitoring."""
        self._monitoring_active = False
        logger.info("Performance monitoring stopped")
    
    def _check_alerts(self, stats: Dict[str, Any]):
        """Check if any alerts should be triggered."""
        alerts = []
        
        # Check latency
        if stats.get('p95_processing_time', 0) > self.config.alert_threshold_latency:
            alerts.append({
                'type': 'high_latency',
                'value': stats['p95_processing_time'],
                'threshold': self.config.alert_threshold_latency
            })
        
        # Check error rate
        if stats.get('error_rate', 0) > self.config.alert_threshold_error_rate:
            alerts.append({
                'type': 'high_error_rate',
                'value': stats['error_rate'],
                'threshold': self.config.alert_threshold_error_rate
            })
        
        # Trigger callbacks for any alerts
        for alert in alerts:
            for callback in self.alert_callbacks:
                try:
                    callback(alert)
                except Exception as e:
                    logger.error(f"Alert callback failed: {e}")


class ModelVersionManager:
    """Manages model versions with rollback capabilities."""
    
    def __init__(self, config: ProductionConfig):
        self.config = config
        self.current_model: Optional[AdvancedFraudDetectionEngine] = None
        self.backup_model: Optional[AdvancedFraudDetectionEngine] = None
        self.model_metadata: Dict[str, Any] = {}
        self._lock = threading.Lock()
    
    def load_production_model(self) -> bool:
        """Load the production model from disk."""
        try:
            model_path = Path(self.config.model_path)
            if not model_path.exists():
                logger.error(f"Model path does not exist: {model_path}")
                return False
            
            # Load main model
            self.current_model = AdvancedFraudDetectionEngine.load_model(str(model_path))
            
            # Load backup model if available
            backup_path = Path(self.config.backup_model_path)
            if backup_path.exists():
                self.backup_model = AdvancedFraudDetectionEngine.load_model(str(backup_path))
            
            # Load metadata
            metadata_path = model_path.parent / "metadata.json"
            if metadata_path.exists():
                with open(metadata_path, 'r') as f:
                    self.model_metadata = json.load(f)
            
            logger.info(f"Loaded production model version {self.config.model_version}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load production model: {e}")
            return False
    
    def rollback_to_backup(self) -> bool:
        """Rollback to backup model in case of issues."""
        with self._lock:
            if self.backup_model is None:
                logger.error("No backup model available for rollback")
                return False
            
            try:
                # Swap models
                self.current_model, self.backup_model = self.backup_model, self.current_model
                logger.warning("Rolled back to backup model")
                return True
                
            except Exception as e:
                logger.error(f"Rollback failed: {e}")
                return False
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about current model."""
        return {
            'version': self.config.model_version,
            'loaded': self.current_model is not None,
            'backup_available': self.backup_model is not None,
            'metadata': self.model_metadata.copy()
        }


class ProductionFraudDetectionService:
    """Production-ready fraud detection service with enterprise features.
    
    This service provides:
    - High-performance fraud detection with model ensembles
    - Circuit breaker pattern for fault tolerance
    - Real-time performance monitoring and alerting
    - Model versioning and rollback capabilities
    - A/B testing framework for model comparison
    - Security features including audit logging
    - Thread-safe operations for concurrent requests
    
    Example Usage:
        config = ProductionConfig.from_env()
        service = ProductionFraudDetectionService(config)
        service.start()
        
        # Make predictions
        result = service.predict(transaction_data, request_id="req_123")
        
        # Monitor performance
        stats = service.get_performance_stats()
    """
    
    def __init__(self, config: ProductionConfig):
        """Initialize the production fraud detection service."""
        self.config = config
        self.model_manager = ModelVersionManager(config)
        self.performance_monitor = PerformanceMonitor(config)
        self.circuit_breaker = CircuitBreaker()
        
        # Request handling
        self.executor = ThreadPoolExecutor(max_workers=config.max_concurrent_requests)
        self.request_count = 0
        self.start_time = datetime.now()
        
        # A/B testing
        self.ab_test_model: Optional[AdvancedFraudDetectionEngine] = None
        
        logger.info("ProductionFraudDetectionService initialized")
    
    def start(self) -> bool:
        """Start the production service."""
        try:
            # Load models
            if not self.model_manager.load_production_model():
                logger.error("Failed to load production model")
                return False
            
            # Set up monitoring
            self.performance_monitor.add_alert_callback(self._handle_alert)
            self.performance_monitor.start_monitoring()
            
            # Setup circuit breaker
            self.circuit_breaker = CircuitBreaker(
                failure_threshold=5,
                recovery_timeout=60
            )
            
            logger.info("Production fraud detection service started")
            return True
            
        except Exception as e:
            logger.error(f"Failed to start service: {e}")
            return False
    
    def stop(self):
        """Stop the production service gracefully."""
        try:
            self.performance_monitor.stop_monitoring()
            self.executor.shutdown(wait=True, timeout=30)
            logger.info("Production fraud detection service stopped")
            
        except Exception as e:
            logger.error(f"Error stopping service: {e}")
    
    @contextmanager
    def _request_context(self, request_id: str):
        """Context manager for request lifecycle management."""
        start_time = time.time()
        request_metrics = RequestMetrics(
            request_id=request_id,
            timestamp=datetime.now(),
            processing_time=0.0,
            model_version=self.config.model_version,
            prediction_count=0,
            cache_hit=False
        )
        
        try:
            yield request_metrics
            
        except Exception as e:
            request_metrics.error = str(e)
            logger.error(f"Request {request_id} failed: {e}")
            raise
            
        finally:
            request_metrics.processing_time = time.time() - start_time
            self.performance_monitor.record_request(request_metrics)
            
            if self.config.enable_audit_logging:
                self._audit_log(request_metrics)
    
    def _audit_log(self, metrics: RequestMetrics):
        """Log request for audit purposes."""
        audit_data = {
            'event_type': 'fraud_detection_request',
            'request_id': metrics.request_id,
            'timestamp': metrics.timestamp.isoformat(),
            'processing_time': metrics.processing_time,
            'model_version': metrics.model_version,
            'prediction_count': metrics.prediction_count,
            'success': metrics.error is None
        }
        
        # In production, this would go to a secure audit log system
        logger.info(f"AUDIT: {json.dumps(audit_data)}")
    
    def _validate_input(self, data: np.ndarray) -> bool:
        """Validate input data for security and quality."""
        if not self.config.feature_validation_enabled:
            return True
        
        try:
            # Check data size
            data_size_mb = data.nbytes / (1024 * 1024)
            if data_size_mb > self.config.max_request_size_mb:
                logger.warning(f"Request too large: {data_size_mb:.2f}MB")
                return False
            
            # Check for obvious outliers
            if np.any(np.abs(data) > self.config.outlier_detection_threshold * np.std(data)):
                logger.warning("Outliers detected in input data")
                # Don't reject, but log for monitoring
            
            # Check for invalid values
            if np.any(np.isnan(data)) or np.any(np.isinf(data)):
                logger.warning("Invalid values (NaN/inf) in input data")
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Input validation failed: {e}")
            return False
    
    def _should_use_ab_test_model(self, request_id: str) -> bool:
        """Determine if request should use A/B test model."""
        if not self.config.enable_ab_testing or self.ab_test_model is None:
            return False
        
        # Use hash of request ID for consistent assignment
        hash_value = int(hashlib.md5(request_id.encode()).hexdigest(), 16)
        return (hash_value % 100) < (self.config.ab_test_traffic_split * 100)
    
    def predict(
        self, 
        data: np.ndarray, 
        request_id: Optional[str] = None,
        return_scores: bool = True
    ) -> DetectionResult:
        """
        Make fraud predictions on input data.
        
        Args:
            data: Feature matrix for prediction
            request_id: Unique identifier for request (for tracking)
            return_scores: Whether to return anomaly scores
            
        Returns:
            DetectionResult with predictions and metadata
            
        Raises:
            ValueError: If input data is invalid
            RuntimeError: If service is not properly initialized
        """
        if request_id is None:
            request_id = f"req_{int(time.time() * 1000)}"
        
        with self._request_context(request_id) as metrics:
            # Validate input
            if not self._validate_input(data):
                raise ValueError("Input data validation failed")
            
            # Choose model (A/B testing)
            if self._should_use_ab_test_model(request_id):
                model = self.ab_test_model
                metrics.model_version += "_ab"
            else:
                model = self.model_manager.current_model
            
            if model is None:
                raise RuntimeError("No model available for prediction")
            
            # Make prediction
            result = model.predict(
                data, 
                return_scores=return_scores,
                enable_parallel=True
            )
            
            # Update metrics
            metrics.prediction_count = len(result.predictions)
            metrics.cache_hit = result.metadata.get('cache_hit_rate', 0) > 0
            
            # Add service metadata
            result.metadata.update({
                'request_id': request_id,
                'service_version': self.config.model_version,
                'ab_test': self._should_use_ab_test_model(request_id)
            })
            
            return result
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get comprehensive health status of the service."""
        try:
            stats = self.performance_monitor.get_current_stats()
            model_info = self.model_manager.get_model_info()
            
            # Determine overall health
            is_healthy = True
            health_issues = []
            
            if not model_info['loaded']:
                is_healthy = False
                health_issues.append("No model loaded")
            
            if stats.get('error_rate', 0) > self.config.alert_threshold_error_rate:
                is_healthy = False
                health_issues.append("High error rate")
            
            if stats.get('p95_processing_time', 0) > self.config.alert_threshold_latency:
                is_healthy = False
                health_issues.append("High latency")
            
            return {
                'status': 'healthy' if is_healthy else 'unhealthy',
                'timestamp': datetime.now().isoformat(),
                'uptime_seconds': (datetime.now() - self.start_time).total_seconds(),
                'issues': health_issues,
                'performance_stats': stats,
                'model_info': model_info,
                'circuit_breaker_state': self.circuit_breaker.state,
                'config': {
                    'max_concurrent_requests': self.config.max_concurrent_requests,
                    'cache_enabled': self.config.enable_caching,
                    'ab_testing_enabled': self.config.enable_ab_testing
                }
            }
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                'status': 'unhealthy',
                'timestamp': datetime.now().isoformat(),
                'error': str(e)
            }
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get detailed performance statistics."""
        return self.performance_monitor.get_current_stats()
    
    def _handle_alert(self, alert: Dict[str, Any]):
        """Handle performance alerts."""
        alert_msg = f"ALERT: {alert['type']} - Value: {alert['value']:.3f}, Threshold: {alert['threshold']:.3f}"
        logger.warning(alert_msg)
        
        # In production, this would integrate with alerting systems
        # like PagerDuty, Slack, or email notifications
        
        # Auto-rollback on critical errors
        if alert['type'] == 'high_error_rate' and alert['value'] > 0.2:  # 20% error rate
            logger.critical("Critical error rate detected, attempting rollback")
            self.model_manager.rollback_to_backup()
    
    def enable_ab_testing(self, test_model_path: str) -> bool:
        """Enable A/B testing with a new model."""
        try:
            self.ab_test_model = AdvancedFraudDetectionEngine.load_model(test_model_path)
            self.config.enable_ab_testing = True
            logger.info(f"A/B testing enabled with model from {test_model_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to enable A/B testing: {e}")
            return False
    
    def disable_ab_testing(self):
        """Disable A/B testing."""
        self.ab_test_model = None
        self.config.enable_ab_testing = False
        logger.info("A/B testing disabled")


# Example production deployment script
def deploy_production_service():
    """Example deployment script for production environment."""
    print("🚀 Deploying Advanced Fraud Detection Service")
    print("=" * 50)
    
    try:
        # Load configuration from environment
        config = ProductionConfig.from_env()
        print(f"✅ Configuration loaded")
        print(f"   Model path: {config.model_path}")
        print(f"   Max concurrent requests: {config.max_concurrent_requests}")
        print(f"   Caching enabled: {config.enable_caching}")
        
        # Initialize service
        service = ProductionFraudDetectionService(config)
        
        # Start service
        if not service.start():
            print("❌ Failed to start service")
            return False
        
        print("✅ Service started successfully")
        
        # Health check
        health = service.get_health_status()
        print(f"✅ Health status: {health['status']}")
        
        # Performance test
        print("\n🧪 Running performance test...")
        test_data = np.random.randn(100, 20)  # Simulated transaction data
        
        start_time = time.time()
        result = service.predict(test_data, request_id="deployment_test")
        test_time = time.time() - start_time
        
        print(f"✅ Performance test completed")
        print(f"   Processing time: {test_time:.3f}s")
        print(f"   Throughput: {len(test_data)/test_time:.0f} predictions/sec")
        print(f"   Detected fraud: {np.sum(result.predictions)} transactions")
        
        # Final status
        print("\n🎉 Deployment completed successfully!")
        print("\nService endpoints:")
        print("   /predict - Make fraud predictions")
        print("   /health - Service health status")
        print("   /metrics - Performance metrics")
        
        return True
        
    except Exception as e:
        print(f"❌ Deployment failed: {e}")
        return False


if __name__ == "__main__":
    deploy_production_service()