#!/usr/bin/env python3
"""
Base Detector Module
===================

기본 사기 탐지 모델의 인터페이스와 공통 기능을 정의하는 모듈
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Tuple, Optional, Any, Protocol, runtime_checkable, Union
from dataclasses import dataclass
import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score, precision_recall_curve, average_precision_score


@runtime_checkable
class ModelProtocol(Protocol):
    """모델이 구현해야 하는 프로토콜"""
    
    def fit(self, X: np.ndarray) -> None:
        """모델 학습"""
        ...
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """예측 수행"""
        ...
    
    def decision_function(self, X: np.ndarray) -> np.ndarray:
        """결정 함수 값 반환"""
        ...


@dataclass
class ModelMetrics:
    """모델 성능 지표를 저장하는 데이터클래스"""
    
    auc_score: float = 0.0
    precision: float = 0.0
    recall: float = 0.0
    f1_score: float = 0.0
    average_precision: float = 0.0
    false_positive_rate: float = 0.0
    
    # 추가 메트릭
    contamination_rate: float = 0.1
    outlier_count: int = 0
    normal_count: int = 0
    
    # 성능 관련
    training_time: float = 0.0
    prediction_time: float = 0.0
    
    def to_dict(self) -> Dict[str, float]:
        """딕셔너리로 변환"""
        return {
            'auc_score': self.auc_score,
            'precision': self.precision,
            'recall': self.recall,
            'f1_score': self.f1_score,
            'average_precision': self.average_precision,
            'false_positive_rate': self.false_positive_rate,
            'contamination_rate': self.contamination_rate,
            'outlier_count': self.outlier_count,
            'normal_count': self.normal_count,
            'training_time': self.training_time,
            'prediction_time': self.prediction_time
        }


@dataclass
class DetectionResult:
    """탐지 결과를 저장하는 데이터클래스"""
    
    predictions: np.ndarray
    anomaly_scores: np.ndarray
    is_anomaly: np.ndarray
    confidence_scores: np.ndarray
    
    # 메타데이터
    model_name: str = "Unknown"
    timestamp: str = ""
    feature_count: int = 0
    sample_count: int = 0
    
    # 성능 지표
    metrics: Optional[ModelMetrics] = None
    
    def get_anomaly_indices(self) -> np.ndarray:
        """이상치 인덱스 반환"""
        return np.where(self.is_anomaly == -1)[0]
    
    def get_normal_indices(self) -> np.ndarray:
        """정상 인덱스 반환"""
        return np.where(self.is_anomaly == 1)[0]
    
    def get_top_anomalies(self, n: int = 10) -> np.ndarray:
        """상위 n개 이상치 인덱스 반환"""
        anomaly_indices = self.get_anomaly_indices()
        if len(anomaly_indices) == 0:
            return np.array([])
        
        anomaly_scores_subset = self.anomaly_scores[anomaly_indices]
        top_indices = np.argsort(anomaly_scores_subset)[-n:][::-1]
        return anomaly_indices[top_indices]


class BaseDetector(ABC):
    """모든 사기 탐지 모델의 베이스 클래스"""
    
    def __init__(self, name: str = "BaseDetector", **kwargs):
        self.name = name
        self.model = None
        self.is_fitted = False
        self.feature_names = None
        self.scaler = None
        self.metrics = ModelMetrics()
        
        # 하이퍼파라미터
        self.contamination = kwargs.get('contamination', 0.1)
        self.random_state = kwargs.get('random_state', 42)
        
    @abstractmethod
    def _create_model(self) -> Any:
        """구체적인 모델 인스턴스 생성"""
        pass
    
    @abstractmethod
    def _fit_model(self, X: np.ndarray) -> None:
        """모델 학습 수행"""
        pass
    
    @abstractmethod
    def _predict_model(self, X: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """모델 예측 수행
        
        Returns:
            Tuple[np.ndarray, np.ndarray]: (predictions, anomaly_scores)
        """
        pass
    
    def fit(self, X: Union[np.ndarray, pd.DataFrame], y: Optional[np.ndarray] = None) -> 'BaseDetector':
        """모델 학습
        
        Args:
            X: 입력 데이터
            y: 라벨 (비지도 학습에서는 사용하지 않음)
            
        Returns:
            BaseDetector: 학습된 모델 인스턴스
        """
        import time
        
        start_time = time.time()
        
        # 입력 검증
        X = self._validate_input(X)
        
        # 스케일링
        if self.scaler is not None:
            X = self.scaler.fit_transform(X)
        
        # 모델 생성 및 학습
        self.model = self._create_model()
        self._fit_model(X)
        
        self.is_fitted = True
        self.metrics.training_time = time.time() - start_time
        
        return self
    
    def predict(self, X: Union[np.ndarray, pd.DataFrame]) -> DetectionResult:
        """이상치 탐지 예측
        
        Args:
            X: 예측할 데이터
            
        Returns:
            DetectionResult: 탐지 결과
        """
        import time
        from datetime import datetime
        
        if not self.is_fitted:
            raise ValueError(f"{self.name} model must be fitted before prediction")
        
        start_time = time.time()
        
        # 입력 검증 및 전처리
        X = self._validate_input(X)
        if self.scaler is not None:
            X = self.scaler.transform(X)
        
        # 예측 수행
        predictions, anomaly_scores = self._predict_model(X)
        
        # 결과 생성
        result = DetectionResult(
            predictions=predictions,
            anomaly_scores=anomaly_scores,
            is_anomaly=predictions,
            confidence_scores=np.abs(anomaly_scores),
            model_name=self.name,
            timestamp=datetime.now().isoformat(),
            feature_count=X.shape[1],
            sample_count=X.shape[0],
            metrics=self.metrics
        )
        
        # 성능 업데이트
        self.metrics.prediction_time = time.time() - start_time
        self.metrics.outlier_count = np.sum(predictions == -1)
        self.metrics.normal_count = np.sum(predictions == 1)
        
        return result
    
    def evaluate(self, X: Union[np.ndarray, pd.DataFrame], y_true: np.ndarray) -> ModelMetrics:
        """모델 성능 평가
        
        Args:
            X: 입력 데이터
            y_true: 실제 라벨 (1: 정상, -1: 이상)
            
        Returns:
            ModelMetrics: 평가 결과
        """
        result = self.predict(X)
        
        # 이진 분류를 위한 라벨 변환
        y_pred_binary = (result.predictions == -1).astype(int)
        y_true_binary = (y_true == -1).astype(int)
        
        # 메트릭 계산
        if len(np.unique(y_true_binary)) > 1:
            auc = roc_auc_score(y_true_binary, result.anomaly_scores)
            precision, recall, _ = precision_recall_curve(y_true_binary, result.anomaly_scores)
            avg_precision = average_precision_score(y_true_binary, result.anomaly_scores)
            
            # Precision, Recall, F1 계산
            from sklearn.metrics import precision_score, recall_score, f1_score
            prec = precision_score(y_true_binary, y_pred_binary, zero_division=0)
            rec = recall_score(y_true_binary, y_pred_binary, zero_division=0)
            f1 = f1_score(y_true_binary, y_pred_binary, zero_division=0)
            
            self.metrics.auc_score = auc
            self.metrics.precision = prec
            self.metrics.recall = rec
            self.metrics.f1_score = f1
            self.metrics.average_precision = avg_precision
        
        return self.metrics
    
    def _validate_input(self, X: Union[np.ndarray, pd.DataFrame]) -> np.ndarray:
        """입력 데이터 검증 및 변환"""
        if isinstance(X, pd.DataFrame):
            if self.feature_names is None:
                self.feature_names = X.columns.tolist()
            X = X.values
        
        if not isinstance(X, np.ndarray):
            X = np.array(X)
        
        if X.ndim == 1:
            X = X.reshape(-1, 1)
        
        if np.any(np.isnan(X)) or np.any(np.isinf(X)):
            raise ValueError("Input data contains NaN or infinite values")
        
        return X
    
    def get_model_info(self) -> Dict[str, Any]:
        """모델 정보 반환"""
        return {
            'name': self.name,
            'is_fitted': self.is_fitted,
            'contamination': self.contamination,
            'random_state': self.random_state,
            'feature_count': len(self.feature_names) if self.feature_names else None,
            'metrics': self.metrics.to_dict()
        }
    
    def save_model(self, filepath: str) -> None:
        """모델 저장"""
        import joblib
        joblib.dump(self, filepath)
    
    @classmethod
    def load_model(cls, filepath: str) -> 'BaseDetector':
        """모델 로드"""
        import joblib
        return joblib.load(filepath)