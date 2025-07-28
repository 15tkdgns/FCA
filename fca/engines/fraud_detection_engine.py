#!/usr/bin/env python3
"""
사기 탐지 엔진 (리팩토링됨)
========================

기존의 advanced_fraud_detection_engine.py를 모듈화하고 정리한 버전
"""

import time
import hashlib
import pickle
from functools import wraps
from typing import Dict, List, Tuple, Optional, Union, Any, Callable
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

from ..core import get_logger, get_config

logger = get_logger("FraudDetectionEngine")
config = get_config()

ArrayLike = Union[np.ndarray, pd.DataFrame, List[List[float]]]


@dataclass
class ModelMetrics:
    """모델 성능 메트릭 컨테이너"""
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
    """사기 탐지 결과 컨테이너"""
    predictions: np.ndarray
    anomaly_scores: np.ndarray
    confidence: np.ndarray
    model_name: str
    processing_time: float
    metadata: Dict[str, Any] = field(default_factory=dict)


class PerformanceMonitor:
    """성능 모니터링 및 캐시 시스템"""
    
    def __init__(self, max_cache_size: int = 1000):
        self._cache: Dict[str, Any] = {}
        self._cache_access_times: Dict[str, float] = {}
        self._max_cache_size = max_cache_size
        self._lock = Lock()
        self._hit_count = 0
        self._miss_count = 0
    
    def _generate_cache_key(self, data: ArrayLike, model_params: Dict) -> str:
        """데이터와 파라미터로 고유 캐시 키 생성"""
        if isinstance(data, pd.DataFrame):
            data_hash = hashlib.md5(pd.util.hash_pandas_object(data).values).hexdigest()
        else:
            data_hash = hashlib.md5(np.asarray(data).tobytes()).hexdigest()
        
        params_str = str(sorted(model_params.items()))
        params_hash = hashlib.md5(params_str.encode()).hexdigest()
        return f"{data_hash}_{params_hash}"
    
    def get_cached_result(self, cache_key: str) -> Optional[Any]:
        """LRU 업데이트와 함께 캐시된 결과 조회"""
        with self._lock:
            if cache_key in self._cache:
                self._cache_access_times[cache_key] = time.time()
                self._hit_count += 1
                return self._cache[cache_key]
            self._miss_count += 1
            return None
    
    def cache_result(self, cache_key: str, result: Any) -> None:
        """LRU 제거와 함께 결과 캐시"""
        with self._lock:
            if len(self._cache) >= self._max_cache_size:
                oldest_key = min(self._cache_access_times.keys(), 
                               key=lambda k: self._cache_access_times[k])
                del self._cache[oldest_key]
                del self._cache_access_times[oldest_key]
            
            self._cache[cache_key] = result
            self._cache_access_times[cache_key] = time.time()
    
    @property
    def cache_hit_rate(self) -> float:
        """캐시 적중률 계산"""
        total = self._hit_count + self._miss_count
        return self._hit_count / total if total > 0 else 0.0


def performance_monitor(func: Callable) -> Callable:
    """함수 성능 모니터링 데코레이터"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            execution_time = time.time() - start_time
            logger.info(f"{func.__name__} 실행시간: {execution_time:.4f}초")
            return result
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"{func.__name__} {execution_time:.4f}초 후 실패: {str(e)}")
            raise
    return wrapper


class FraudDetectionEngine:
    """
    첨단 사기 탐지 엔진
    
    여러 ML 알고리즘을 사용한 앙상블 사기 탐지:
    1. Isolation Forest - O(n log n) 이상 탐지
    2. Local Outlier Factor - O(n²) 밀도 기반 이상값 탐지  
    3. One-Class SVM - 서포트 벡터 기반 신규성 탐지
    """
    
    def __init__(self, 
                 contamination: float = None,
                 n_estimators: int = None,
                 random_state: int = None,
                 enable_cache: bool = True,
                 max_cache_size: int = 1000):
        """
        사기 탐지 엔진 초기화
        
        Args:
            contamination: 이상값 비율 (기본값: config에서 가져옴)
            n_estimators: 트리 개수 (기본값: config에서 가져옴)
            random_state: 랜덤 시드 (기본값: config에서 가져옴)
            enable_cache: 캐시 활성화 여부
            max_cache_size: 최대 캐시 크기
        """
        # 설정값 또는 기본값 사용
        self.contamination = contamination or config.model.default_contamination
        self.n_estimators = n_estimators or config.model.n_estimators
        self.random_state = random_state or config.model.random_state
        
        # 모델들 초기화
        self.models = self._initialize_models()
        self.scalers = {}
        self.is_fitted = False
        
        # 성능 모니터링
        self.performance_monitor = PerformanceMonitor(max_cache_size) if enable_cache else None
        self.metrics_history = []
        
        logger.info("사기 탐지 엔진 초기화 완료", extra={
            'extra_data': {
                'contamination': self.contamination,
                'n_estimators': self.n_estimators,
                'cache_enabled': enable_cache
            }
        })
    
    def _initialize_models(self) -> Dict[str, Any]:
        """ML 모델들 초기화"""
        return {
            'isolation_forest': IsolationForest(
                contamination=self.contamination,
                n_estimators=self.n_estimators,
                random_state=self.random_state,
                n_jobs=-1
            ),
            'local_outlier_factor': LocalOutlierFactor(
                contamination=self.contamination,
                n_neighbors=20,
                novelty=True,
                n_jobs=-1
            ),
            'one_class_svm': OneClassSVM(
                nu=self.contamination,
                kernel='rbf',
                gamma='scale'
            )
        }
    
    @performance_monitor
    def fit(self, X: ArrayLike, y: Optional[ArrayLike] = None) -> 'FraudDetectionEngine':
        """
        모델 학습
        
        Args:
            X: 학습 데이터
            y: 레이블 (선택적, 비지도 학습이므로 사용되지 않음)
            
        Returns:
            self: 학습된 인스턴스
        """
        X = self._validate_input(X)
        
        # 데이터 스케일링
        for name in self.models.keys():
            if name == 'isolation_forest':
                # Isolation Forest는 스케일링이 필요하지 않음
                continue
            else:
                scaler = StandardScaler()
                self.scalers[name] = scaler
                scaler.fit(X)
        
        start_time = time.time()
        
        # 각 모델 학습
        for name, model in self.models.items():
            model_start = time.time()
            
            if name == 'isolation_forest':
                X_scaled = X
            else:
                X_scaled = self.scalers[name].transform(X)
            
            model.fit(X_scaled)
            
            model_time = time.time() - model_start
            logger.info(f"{name} 학습 완료: {model_time:.4f}초")
        
        total_time = time.time() - start_time
        self.is_fitted = True
        
        logger.info(f"전체 모델 학습 완료: {total_time:.4f}초")
        return self
    
    @performance_monitor
    def predict(self, X: ArrayLike) -> DetectionResult:
        """
        사기 예측
        
        Args:
            X: 예측할 데이터
            
        Returns:
            DetectionResult: 예측 결과
        """
        if not self.is_fitted:
            raise ValueError("모델이 학습되지 않았습니다. fit()을 먼저 호출하세요.")
        
        X = self._validate_input(X)
        
        # 캐시 확인
        if self.performance_monitor:
            cache_key = self.performance_monitor._generate_cache_key(
                X, {'contamination': self.contamination}
            )
            cached_result = self.performance_monitor.get_cached_result(cache_key)
            if cached_result:
                logger.info("캐시에서 결과 반환")
                return cached_result
        
        start_time = time.time()
        predictions_dict = {}
        scores_dict = {}
        
        # 각 모델로 예측
        for name, model in self.models.items():
            if name == 'isolation_forest':
                X_scaled = X
            else:
                X_scaled = self.scalers[name].transform(X)
            
            # 예측 및 스코어
            pred = model.predict(X_scaled)
            score = model.decision_function(X_scaled)
            
            # -1을 0으로, 1을 1로 변환 (일부 모델의 경우)
            if name in ['isolation_forest', 'local_outlier_factor']:
                pred = np.where(pred == -1, 1, 0)  # 이상값을 1로
            
            predictions_dict[name] = pred
            scores_dict[name] = score
        
        # 앙상블 예측 (가중 투표)
        weights = {'isolation_forest': 0.4, 'local_outlier_factor': 0.3, 'one_class_svm': 0.3}
        
        ensemble_scores = np.zeros(len(X))
        for name, weight in weights.items():
            normalized_scores = (scores_dict[name] - scores_dict[name].min()) / \
                              (scores_dict[name].max() - scores_dict[name].min() + 1e-8)
            ensemble_scores += weight * normalized_scores
        
        # 임계값 기반 최종 예측
        threshold = np.percentile(ensemble_scores, (1 - self.contamination) * 100)
        final_predictions = (ensemble_scores >= threshold).astype(int)
        
        # 신뢰도 계산
        confidence = np.abs(ensemble_scores - threshold) / (ensemble_scores.max() - ensemble_scores.min() + 1e-8)
        
        processing_time = time.time() - start_time
        
        result = DetectionResult(
            predictions=final_predictions,
            anomaly_scores=ensemble_scores,
            confidence=confidence,
            model_name="ensemble",
            processing_time=processing_time,
            metadata={
                'individual_predictions': predictions_dict,
                'individual_scores': scores_dict,
                'weights': weights,
                'threshold': threshold
            }
        )
        
        # 결과 캐시
        if self.performance_monitor:
            self.performance_monitor.cache_result(cache_key, result)
        
        logger.info(f"예측 완료: {processing_time:.4f}초, "
                   f"이상값 {final_predictions.sum()}/{len(final_predictions)}개 탐지")
        
        return result
    
    def _validate_input(self, X: ArrayLike) -> np.ndarray:
        """입력 데이터 검증 및 변환"""
        if isinstance(X, pd.DataFrame):
            X = X.values
        elif isinstance(X, list):
            X = np.array(X)
        
        if X.ndim != 2:
            raise ValueError("입력 데이터는 2차원이어야 합니다.")
        
        if np.isnan(X).any():
            logger.warning("입력 데이터에 NaN 값이 있습니다. 0으로 대체합니다.")
            X = np.nan_to_num(X, 0)
        
        return X
    
    def save_model(self, filepath: str = None) -> str:
        """모델 저장"""
        if not self.is_fitted:
            raise ValueError("모델이 학습되지 않았습니다.")
        
        if filepath is None:
            filepath = config.get_model_path("fraud_detection_ensemble")
        
        model_data = {
            'models': self.models,
            'scalers': self.scalers,
            'contamination': self.contamination,
            'n_estimators': self.n_estimators,
            'random_state': self.random_state,
            'is_fitted': self.is_fitted
        }
        
        joblib.dump(model_data, filepath)
        logger.info(f"모델 저장 완료: {filepath}")
        return str(filepath)
    
    def load_model(self, filepath: str) -> 'FraudDetectionEngine':
        """모델 로드"""
        model_data = joblib.load(filepath)
        
        self.models = model_data['models']
        self.scalers = model_data['scalers']
        self.contamination = model_data['contamination']
        self.n_estimators = model_data['n_estimators']
        self.random_state = model_data['random_state']
        self.is_fitted = model_data['is_fitted']
        
        logger.info(f"모델 로드 완료: {filepath}")
        return self
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """성능 통계 반환"""
        stats = {
            'is_fitted': self.is_fitted,
            'contamination': self.contamination,
            'n_estimators': self.n_estimators
        }
        
        if self.performance_monitor:
            stats.update({
                'cache_hit_rate': self.performance_monitor.cache_hit_rate,
                'cache_size': len(self.performance_monitor._cache)
            })
        
        return stats