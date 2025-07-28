#!/usr/bin/env python3
"""
Isolation Forest Detector
=========================

Isolation Forest 알고리즘을 사용한 이상치 탐지 모델
"""

import numpy as np
from typing import Tuple, Any
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

from .base_detector import BaseDetector


class IsolationForestDetector(BaseDetector):
    """
    Isolation Forest 기반 사기 탐지 모델
    
    Isolation Forest는 이상치를 격리하는데 필요한 분할 횟수가 
    정상 데이터보다 적다는 원리를 사용합니다.
    
    References:
        Liu, F. T., Ting, K. M., & Zhou, Z. H. (2008). 
        Isolation forest. ICDM.
    """
    
    def __init__(self, 
                 n_estimators: int = 100,
                 max_samples: str = 'auto',
                 contamination: float = 0.1,
                 max_features: float = 1.0,
                 bootstrap: bool = False,
                 n_jobs: int = -1,
                 random_state: int = 42,
                 verbose: int = 0,
                 **kwargs):
        """
        Args:
            n_estimators: 트리 개수
            max_samples: 각 트리에서 사용할 샘플 수
            contamination: 이상치 비율
            max_features: 각 트리에서 사용할 피처 비율
            bootstrap: 부트스트랩 샘플링 사용 여부
            n_jobs: 병렬 처리 수
            random_state: 랜덤 시드
            verbose: 로그 레벨
        """
        super().__init__(name="IsolationForest", contamination=contamination, 
                         random_state=random_state)
        
        self.n_estimators = n_estimators
        self.max_samples = max_samples
        self.max_features = max_features
        self.bootstrap = bootstrap
        self.n_jobs = n_jobs
        self.verbose = verbose
        
        # 데이터 전처리용 스케일러
        self.scaler = StandardScaler()
        
    def _create_model(self) -> IsolationForest:
        """Isolation Forest 모델 생성"""
        return IsolationForest(
            n_estimators=self.n_estimators,
            max_samples=self.max_samples,
            contamination=self.contamination,
            max_features=self.max_features,
            bootstrap=self.bootstrap,
            n_jobs=self.n_jobs,
            random_state=self.random_state,
            verbose=self.verbose
        )
    
    def _fit_model(self, X: np.ndarray) -> None:
        """모델 학습"""
        self.model.fit(X)
        
        # 학습 데이터에 대한 기본 통계 계산
        anomaly_scores = self.model.decision_function(X)
        predictions = self.model.predict(X)
        
        self.metrics.outlier_count = np.sum(predictions == -1)
        self.metrics.normal_count = np.sum(predictions == 1)
        self.metrics.contamination_rate = self.metrics.outlier_count / len(X)
    
    def _predict_model(self, X: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """예측 수행"""
        predictions = self.model.predict(X)
        anomaly_scores = self.model.decision_function(X)
        
        return predictions, anomaly_scores
    
    def get_feature_importance(self, X: np.ndarray) -> np.ndarray:
        """
        피처 중요도 계산 (근사치)
        
        Isolation Forest는 직접적인 피처 중요도를 제공하지 않으므로,
        각 피처를 제거했을 때의 성능 변화를 측정하여 중요도를 계산합니다.
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before calculating feature importance")
        
        n_features = X.shape[1]
        feature_importance = np.zeros(n_features)
        
        # 원본 이상치 스코어
        original_scores = self.model.decision_function(X)
        original_anomalies = np.sum(original_scores < 0)
        
        for i in range(n_features):
            # i번째 피처를 제거한 데이터
            X_reduced = np.delete(X, i, axis=1)
            
            # 임시 모델로 예측
            temp_model = IsolationForest(
                n_estimators=50,  # 빠른 계산을 위해 적은 수
                contamination=self.contamination,
                random_state=self.random_state
            )
            temp_model.fit(X_reduced)
            reduced_scores = temp_model.decision_function(X_reduced)
            reduced_anomalies = np.sum(reduced_scores < 0)
            
            # 이상치 탐지 성능 변화를 중요도로 사용
            feature_importance[i] = abs(original_anomalies - reduced_anomalies)
        
        # 정규화
        if np.sum(feature_importance) > 0:
            feature_importance = feature_importance / np.sum(feature_importance)
        
        return feature_importance
    
    def get_anomaly_paths(self, X: np.ndarray) -> np.ndarray:
        """
        각 샘플의 평균 경로 길이 반환
        
        경로 길이가 짧을수록 이상치일 가능성이 높습니다.
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before calculating paths")
        
        # sklearn의 IsolationForest에서 경로 길이를 직접 접근하는 방법이 제한적이므로
        # decision_function의 역수를 사용하여 근사
        decision_scores = self.model.decision_function(X)
        
        # decision function 값을 경로 길이로 변환 (근사)
        # 더 낮은 점수(더 음수) = 더 짧은 경로 = 더 이상한 샘플
        path_lengths = 1.0 / (1.0 + np.exp(decision_scores))
        
        return path_lengths
    
    def explain_prediction(self, X: np.ndarray, sample_idx: int) -> dict:
        """
        특정 샘플의 예측 결과 설명
        
        Args:
            X: 입력 데이터
            sample_idx: 설명할 샘플의 인덱스
            
        Returns:
            dict: 예측 설명 정보
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before explanation")
        
        if sample_idx >= len(X):
            raise ValueError("Sample index out of range")
        
        sample = X[sample_idx:sample_idx+1]
        prediction = self.model.predict(sample)[0]
        anomaly_score = self.model.decision_function(sample)[0]
        
        # 피처별 기여도 계산 (근사)
        feature_contributions = np.zeros(X.shape[1])
        
        for i in range(X.shape[1]):
            # i번째 피처를 평균값으로 대체
            modified_sample = sample.copy()
            modified_sample[0, i] = np.mean(X[:, i])
            
            modified_score = self.model.decision_function(modified_sample)[0]
            feature_contributions[i] = anomaly_score - modified_score
        
        return {
            'sample_index': sample_idx,
            'prediction': 'Anomaly' if prediction == -1 else 'Normal',
            'anomaly_score': anomaly_score,
            'feature_contributions': feature_contributions,
            'top_contributing_features': np.argsort(np.abs(feature_contributions))[-5:][::-1],
            'model_confidence': abs(anomaly_score)
        }
    
    def get_model_parameters(self) -> dict:
        """모델 하이퍼파라미터 반환"""
        return {
            'n_estimators': self.n_estimators,
            'max_samples': self.max_samples,
            'contamination': self.contamination,
            'max_features': self.max_features,
            'bootstrap': self.bootstrap,
            'random_state': self.random_state
        }
    
    def tune_contamination(self, X: np.ndarray, contamination_range: tuple = (0.01, 0.3), 
                          n_trials: int = 10) -> float:
        """
        최적의 contamination 값을 찾습니다.
        
        Args:
            X: 학습 데이터
            contamination_range: contamination 값의 범위
            n_trials: 시도할 값의 개수
            
        Returns:
            float: 최적의 contamination 값
        """
        from sklearn.metrics import silhouette_score
        
        contamination_values = np.linspace(contamination_range[0], contamination_range[1], n_trials)
        best_score = -1
        best_contamination = self.contamination
        
        for contamination in contamination_values:
            # 임시 모델 생성
            temp_model = IsolationForest(
                n_estimators=self.n_estimators,
                contamination=contamination,
                random_state=self.random_state,
                n_jobs=self.n_jobs
            )
            
            # 학습 및 예측
            temp_model.fit(X)
            labels = temp_model.predict(X)
            
            # 실루엣 스코어 계산 (클러스터링 품질 측정)
            if len(np.unique(labels)) > 1:
                score = silhouette_score(X, labels)
                if score > best_score:
                    best_score = score
                    best_contamination = contamination
        
        self.contamination = best_contamination
        return best_contamination