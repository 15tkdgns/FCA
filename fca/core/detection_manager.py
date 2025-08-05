#!/usr/bin/env python3
"""
Detection Manager - Core Detection System
=========================================

핵심 탐지 시스템 관리자:
1. 우선순위 기반 기능 배치
2. 통합된 API 인터페이스
3. 실시간 처리 최적화
4. 웹 인터페이스와의 완벽한 연동
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
import logging
import asyncio
from dataclasses import dataclass
from enum import Enum
import json
from pathlib import Path

logger = logging.getLogger(__name__)

class Priority(Enum):
    """기능 우선순위 정의"""
    CRITICAL = 1    # 핵심 사기 탐지
    HIGH = 2        # 고객 이탈 위험
    MEDIUM = 3      # 감정 분석
    LOW = 4         # 기타 분석

@dataclass
class DetectionResult:
    """탐지 결과 표준화"""
    detection_type: str
    entity_id: str
    risk_score: float
    risk_level: str
    timestamp: datetime
    details: Dict[str, Any]
    priority: Priority
    action_required: bool = False

class DetectionManager:
    """
    중앙집중식 탐지 관리자
    - 우선순위 기반 처리
    - 실시간 성능 최적화
    - 웹 인터페이스 완벽 연동
    """
    
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or self._default_config()
        self.is_initialized = False
        self.engines = {}
        self.processing_queue = asyncio.PriorityQueue()
        self.results_cache = {}
        
        # 성능 모니터링
        self.performance_stats = {
            'total_processed': 0,
            'fraud_detected': 0,
            'high_risk_customers': 0,
            'avg_processing_time': 0.0
        }
        
        self._initialize_engines()
    
    def _default_config(self) -> Dict:
        """기본 설정 - 운영 환경 최적화"""
        return {
            'processing': {
                'max_concurrent': 10,
                'timeout_seconds': 30,
                'cache_size': 1000
            },
            'thresholds': {
                'fraud_critical': 0.85,
                'fraud_high': 0.65,
                'churn_critical': 0.80,
                'churn_high': 0.60,
                'sentiment_negative': -0.7
            },
            'priorities': {
                'fraud_detection': Priority.CRITICAL,
                'churn_prediction': Priority.HIGH,
                'sentiment_analysis': Priority.MEDIUM
            }
        }
    
    def _initialize_engines(self):
        """엔진 초기화 - 필요시에만 로드"""
        self.engines = {
            'fraud': None,      # 지연 로딩
            'churn': None,      # 지연 로딩
            'sentiment': None   # 지연 로딩
        }
    
    def initialize_fraud_detection(self, training_data: pd.DataFrame = None) -> bool:
        """사기 탐지 엔진 초기화 - 최우선"""
        try:
            from ..engines.fraud_detector import FraudDetector
            
            logger.info("Initializing fraud detection engine...")
            self.engines['fraud'] = FraudDetector()
            
            if training_data is not None:
                self.engines['fraud'].train(training_data)
            
            logger.info("✅ Fraud detection engine ready")
            return True
            
        except Exception as e:
            logger.error(f"❌ Fraud detection initialization failed: {e}")
            return False
    
    def initialize_churn_prediction(self, training_data: pd.DataFrame = None) -> bool:
        """고객 이탈 예측 엔진 초기화 - 고우선순위"""
        try:
            from ..engines.attrition_predictor import AttritionPredictor
            
            logger.info("Initializing churn prediction engine...")
            self.engines['churn'] = AttritionPredictor()
            
            if training_data is not None:
                self.engines['churn'].train(training_data)
            
            logger.info("✅ Churn prediction engine ready")
            return True
            
        except Exception as e:
            logger.error(f"❌ Churn prediction initialization failed: {e}")
            return False
    
    def initialize_sentiment_analysis(self, training_data: pd.DataFrame = None) -> bool:
        """감정 분석 엔진 초기화 - 중간 우선순위"""
        try:
            from ..engines.sentiment_analyzer import SentimentAnalyzer
            
            logger.info("Initializing sentiment analysis engine...")
            self.engines['sentiment'] = SentimentAnalyzer()
            
            if training_data is not None:
                self.engines['sentiment'].train(training_data)
            
            logger.info("✅ Sentiment analysis engine ready")
            return True
            
        except Exception as e:
            logger.error(f"❌ Sentiment analysis initialization failed: {e}")
            return False
    
    async def detect_fraud(self, transaction_data: Dict) -> DetectionResult:
        """실시간 사기 탐지 - 최고 우선순위"""
        if not self.engines.get('fraud'):
            raise RuntimeError("Fraud detection engine not initialized")
        
        start_time = datetime.now()
        
        try:
            # 사기 탐지 실행
            result = self.engines['fraud'].detect_real_time(transaction_data)
            
            # 결과 표준화
            risk_score = result['fraud_probability']
            
            if risk_score >= self.config['thresholds']['fraud_critical']:
                risk_level = 'CRITICAL'
                action_required = True
            elif risk_score >= self.config['thresholds']['fraud_high']:
                risk_level = 'HIGH'
                action_required = True
            else:
                risk_level = 'LOW'
                action_required = False
            
            detection_result = DetectionResult(
                detection_type='fraud',
                entity_id=transaction_data.get('transaction_id', 'unknown'),
                risk_score=risk_score,
                risk_level=risk_level,
                timestamp=datetime.now(),
                details={
                    'transaction_amount': transaction_data.get('Amount', 0),
                    'model_predictions': result.get('model_predictions', {}),
                    'risk_factors': result.get('risk_factors', {}),
                    'processing_time_ms': (datetime.now() - start_time).total_seconds() * 1000
                },
                priority=Priority.CRITICAL,
                action_required=action_required
            )
            
            # 통계 업데이트
            self.performance_stats['total_processed'] += 1
            if action_required:
                self.performance_stats['fraud_detected'] += 1
            
            return detection_result
            
        except Exception as e:
            logger.error(f"Fraud detection failed: {e}")
            raise
    
    async def predict_churn(self, customer_data: Dict) -> DetectionResult:
        """고객 이탈 예측 - 고우선순위"""
        if not self.engines.get('churn'):
            raise RuntimeError("Churn prediction engine not initialized")
        
        start_time = datetime.now()
        
        try:
            # 고객 데이터를 DataFrame으로 변환
            customer_df = pd.DataFrame([customer_data])
            
            # 이탈 예측 실행
            result = self.engines['churn'].predict(customer_df)
            
            # 결과 표준화
            risk_score = result['ensemble_probability'][0]
            risk_assessment = result['risk_assessments'][0]
            
            if risk_score >= self.config['thresholds']['churn_critical']:
                risk_level = 'CRITICAL'
                action_required = True
            elif risk_score >= self.config['thresholds']['churn_high']:
                risk_level = 'HIGH'
                action_required = True
            else:
                risk_level = 'LOW'
                action_required = False
            
            detection_result = DetectionResult(
                detection_type='churn',
                entity_id=customer_data.get('CustomerId', 'unknown'),
                risk_score=risk_score,
                risk_level=risk_level,
                timestamp=datetime.now(),
                details={
                    'customer_value_segment': risk_assessment.get('customer_value_segment'),
                    'risk_factors': risk_assessment.get('risk_factors', {}),
                    'retention_strategies': result['retention_strategies'][0]['recommended_strategies'][:3],
                    'processing_time_ms': (datetime.now() - start_time).total_seconds() * 1000
                },
                priority=Priority.HIGH,
                action_required=action_required
            )
            
            # 통계 업데이트
            self.performance_stats['total_processed'] += 1
            if action_required:
                self.performance_stats['high_risk_customers'] += 1
            
            return detection_result
            
        except Exception as e:
            logger.error(f"Churn prediction failed: {e}")
            raise
    
    async def analyze_sentiment(self, text_data: Union[str, Dict]) -> DetectionResult:
        """감정 분석 - 중간 우선순위"""
        if not self.engines.get('sentiment'):
            raise RuntimeError("Sentiment analysis engine not initialized")
        
        start_time = datetime.now()
        
        try:
            # 텍스트 추출
            if isinstance(text_data, str):
                text = text_data
                entity_id = f"text_{int(datetime.now().timestamp())}"
            else:
                text = text_data.get('text', '')
                entity_id = text_data.get('text_id', f"text_{int(datetime.now().timestamp())}")
            
            # 감정 분석 실행
            result = self.engines['sentiment'].predict([text])
            sentiment_result = result['ensemble_prediction'][0]
            
            # 결과 표준화
            sentiment = sentiment_result['sentiment']
            confidence = sentiment_result['confidence']
            
            # 위험 점수 계산 (부정적 감정의 강도)
            if sentiment == 'negative':
                risk_score = confidence
            elif sentiment == 'positive':
                risk_score = 1.0 - confidence
            else:  # neutral
                risk_score = 0.5
            
            # 위험 수준 결정
            if sentiment == 'negative' and confidence > 0.8:
                risk_level = 'HIGH'
                action_required = True
            elif sentiment == 'negative' and confidence > 0.6:
                risk_level = 'MEDIUM'
                action_required = False
            else:
                risk_level = 'LOW'
                action_required = False
            
            detection_result = DetectionResult(
                detection_type='sentiment',
                entity_id=entity_id,
                risk_score=risk_score,
                risk_level=risk_level,
                timestamp=datetime.now(),
                details={
                    'sentiment': sentiment,
                    'confidence': confidence,
                    'text_preview': text[:100] + '...' if len(text) > 100 else text,
                    'individual_predictions': result.get('individual_predictions', {}),
                    'processing_time_ms': (datetime.now() - start_time).total_seconds() * 1000
                },
                priority=Priority.MEDIUM,
                action_required=action_required
            )
            
            # 통계 업데이트
            self.performance_stats['total_processed'] += 1
            
            return detection_result
            
        except Exception as e:
            logger.error(f"Sentiment analysis failed: {e}")
            raise
    
    async def process_batch(self, data: Dict[str, List]) -> Dict[str, List[DetectionResult]]:
        """배치 처리 - 우선순위 기반"""
        results = {
            'fraud': [],
            'churn': [],
            'sentiment': []
        }
        
        # 우선순위 기반 처리 순서
        processing_order = [
            ('fraud', data.get('transactions', [])),
            ('churn', data.get('customers', [])),
            ('sentiment', data.get('texts', []))
        ]
        
        for detection_type, items in processing_order:
            if not items:
                continue
                
            logger.info(f"Processing {len(items)} {detection_type} items...")
            
            for item in items:
                try:
                    if detection_type == 'fraud':
                        result = await self.detect_fraud(item)
                    elif detection_type == 'churn':
                        result = await self.predict_churn(item)
                    elif detection_type == 'sentiment':
                        result = await self.analyze_sentiment(item)
                    
                    results[detection_type].append(result)
                    
                except Exception as e:
                    logger.error(f"Failed to process {detection_type} item: {e}")
        
        return results
    
    def get_critical_alerts(self, hours: int = 24) -> List[DetectionResult]:
        """중요 알림 조회"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        critical_alerts = []
        
        # 캐시에서 중요 결과 필터링
        for result_list in self.results_cache.values():
            for result in result_list:
                if (result.timestamp > cutoff_time and 
                    result.priority in [Priority.CRITICAL, Priority.HIGH] and
                    result.action_required):
                    critical_alerts.append(result)
        
        # 시간순 정렬 (최신순)
        critical_alerts.sort(key=lambda x: x.timestamp, reverse=True)
        
        return critical_alerts
    
    def get_dashboard_summary(self) -> Dict[str, Any]:
        """대시보드 요약 정보"""
        recent_alerts = self.get_critical_alerts(hours=1)
        
        summary = {
            'timestamp': datetime.now().isoformat(),
            'system_status': 'operational' if self._check_system_health() else 'degraded',
            'performance_stats': self.performance_stats.copy(),
            'recent_alerts': {
                'total': len(recent_alerts),
                'critical': len([a for a in recent_alerts if a.priority == Priority.CRITICAL]),
                'high': len([a for a in recent_alerts if a.priority == Priority.HIGH])
            },
            'engine_status': {
                'fraud_detection': self.engines.get('fraud') is not None,
                'churn_prediction': self.engines.get('churn') is not None,
                'sentiment_analysis': self.engines.get('sentiment') is not None
            }
        }
        
        return summary
    
    def _check_system_health(self) -> bool:
        """시스템 상태 점검"""
        # 최소한 사기 탐지는 작동해야 함
        return self.engines.get('fraud') is not None
    
    def get_api_endpoints_data(self) -> Dict[str, Any]:
        """API 엔드포인트용 데이터 제공"""
        return {
            '/api/fraud/detect': {
                'method': 'POST',
                'description': 'Real-time fraud detection',
                'required_fields': ['Time', 'Amount', 'V1', 'V2', 'V3', 'V4', 'V5'],
                'priority': 'CRITICAL'
            },
            '/api/customer/churn': {
                'method': 'POST', 
                'description': 'Customer churn prediction',
                'required_fields': ['CustomerId', 'CreditScore', 'Age', 'Tenure', 'Balance'],
                'priority': 'HIGH'
            },
            '/api/sentiment/analyze': {
                'method': 'POST',
                'description': 'Text sentiment analysis',
                'required_fields': ['text'],
                'priority': 'MEDIUM'
            },
            '/api/dashboard/summary': {
                'method': 'GET',
                'description': 'Dashboard summary data',
                'priority': 'LOW'
            }
        }

class WebIntegrationManager:
    """웹 인터페이스와의 완벽한 연동 관리"""
    
    def __init__(self, detection_manager: DetectionManager):
        self.detection_manager = detection_manager
        self.active_sessions = {}
    
    def get_fraud_chart_data(self) -> Dict[str, Any]:
        """사기 탐지 차트 데이터"""
        # 실제 사기 탐지 결과를 차트 형식으로 변환
        return {
            'type': 'bar',
            'data': {
                'labels': ['Low Risk', 'Medium Risk', 'High Risk', 'Critical'],
                'datasets': [{
                    'label': 'Fraud Detection Results',
                    'data': [65, 25, 8, 2],  # 실제 데이터로 교체 필요
                    'backgroundColor': ['#28a745', '#ffc107', '#fd7e14', '#dc3545']
                }]
            },
            'options': {
                'responsive': True,
                'scales': {
                    'y': {'beginAtZero': True}
                }
            }
        }
    
    def get_sentiment_chart_data(self) -> Dict[str, Any]:
        """감정 분석 차트 데이터"""
        return {
            'type': 'pie',
            'data': {
                'labels': ['Positive', 'Neutral', 'Negative'],
                'datasets': [{
                    'data': [45, 35, 20],  # 실제 데이터로 교체 필요
                    'backgroundColor': ['#28a745', '#6c757d', '#dc3545']
                }]
            },
            'options': {
                'responsive': True
            }
        }
    
    def get_churn_chart_data(self) -> Dict[str, Any]:
        """고객 이탈 차트 데이터"""
        return {
            'type': 'doughnut',
            'data': {
                'labels': ['Loyal', 'At Risk', 'High Risk'],
                'datasets': [{
                    'data': [70, 20, 10],  # 실제 데이터로 교체 필요
                    'backgroundColor': ['#28a745', '#ffc107', '#dc3545']
                }]
            },
            'options': {
                'responsive': True
            }
        }
    
    def format_for_web_display(self, results: List[DetectionResult]) -> List[Dict]:
        """웹 화면 표시용 포맷"""
        formatted_results = []
        
        for result in results:
            formatted_result = {
                'id': result.entity_id,
                'type': result.detection_type,
                'risk_score': f"{result.risk_score:.3f}",
                'risk_level': result.risk_level,
                'timestamp': result.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                'priority': result.priority.name,
                'action_required': result.action_required,
                'details': result.details
            }
            
            # 타입별 특화 정보 추가
            if result.detection_type == 'fraud':
                formatted_result['amount'] = result.details.get('transaction_amount', 0)
                formatted_result['icon'] = 'fas fa-exclamation-triangle'
                formatted_result['color'] = 'danger' if result.action_required else 'warning'
                
            elif result.detection_type == 'churn':
                formatted_result['customer_segment'] = result.details.get('customer_value_segment', 'Unknown')
                formatted_result['icon'] = 'fas fa-user-times'
                formatted_result['color'] = 'warning' if result.action_required else 'info'
                
            elif result.detection_type == 'sentiment':
                formatted_result['sentiment'] = result.details.get('sentiment', 'neutral')
                formatted_result['confidence'] = result.details.get('confidence', 0)
                formatted_result['icon'] = 'fas fa-comment-alt'
                formatted_result['color'] = 'secondary'
            
            formatted_results.append(formatted_result)
        
        return formatted_results