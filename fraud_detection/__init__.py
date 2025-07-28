"""
FCA Fraud Detection Module
=========================

사기 탐지를 위한 모듈화된 라이브러리

Usage:
    from fraud_detection.models import IsolationForestDetector
    
    detector = IsolationForestDetector()
    detector.fit(X_train)
    result = detector.predict(X_test)
"""

__version__ = "1.0.0"
__author__ = "FCA Team"

from .models.base_detector import BaseDetector, ModelMetrics, DetectionResult
from .models.isolation_forest_detector import IsolationForestDetector

__all__ = [
    'BaseDetector',
    'ModelMetrics', 
    'DetectionResult',
    'IsolationForestDetector'
]