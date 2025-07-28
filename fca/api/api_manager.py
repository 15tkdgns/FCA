#!/usr/bin/env python3
"""
통합 API 관리자
=============

Flask API 라우트 및 엔드포인트를 중앙 집중식으로 관리
"""

from flask import Flask, jsonify, request, current_app
from typing import Dict, Any, Callable, Optional, List
from functools import wraps
import time
from datetime import datetime

from ..core import get_logger, get_config
from ..data import DataProcessor
from ..engines import FraudDetectionEngine

logger = get_logger("APIManager")
config = get_config()


def api_error_handler(func: Callable) -> Callable:
    """API 오류 처리 데코레이터"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            start_time = time.time()
            result = func(*args, **kwargs)
            
            # 실행 시간 로깅
            execution_time = time.time() - start_time
            logger.info(f"API {func.__name__} 실행시간: {execution_time:.4f}초")
            
            return result
            
        except Exception as e:
            logger.error(f"API {func.__name__} 오류: {str(e)}")
            return jsonify({
                'error': str(e),
                'success': False,
                'timestamp': datetime.utcnow().isoformat()
            }), 500
    
    return wrapper


def validate_request_data(required_fields: List[str] = None):
    """요청 데이터 검증 데코레이터"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            if required_fields and request.method in ['POST', 'PUT']:
                data = request.get_json()
                if not data:
                    return jsonify({
                        'error': 'JSON 데이터가 필요합니다',
                        'success': False
                    }), 400
                
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    return jsonify({
                        'error': f'필수 필드 누락: {", ".join(missing_fields)}',
                        'success': False
                    }), 400
            
            return func(*args, **kwargs)
        return wrapper
    return decorator


class APIManager:
    """
    통합 API 관리자
    
    주요 기능:
    - Flask 앱 라우트 등록
    - API 엔드포인트 관리
    - 오류 처리 및 로깅
    - 성능 모니터링
    """
    
    def __init__(self, app: Flask = None):
        self.app = app
        self.data_processor = DataProcessor()
        self.fraud_engine = None
        self._endpoints = {}
        
        if app:
            self.init_app(app)
    
    def init_app(self, app: Flask):
        """Flask 앱 초기화"""
        self.app = app
        self._register_core_routes()
        self._register_data_routes()
        self._register_model_routes()
        self._register_monitoring_routes()
        
        logger.info("API Manager 초기화 완료")
    
    def _register_core_routes(self):
        """핵심 라우트 등록"""
        
        @self.app.route('/api/health')
        @api_error_handler
        def health_check():
            """헬스 체크 엔드포인트"""
            return jsonify({
                'status': 'healthy',
                'timestamp': datetime.utcnow().isoformat(),
                'version': '2.0.0',
                'success': True
            })
        
        @self.app.route('/api/info')
        @api_error_handler
        def system_info():
            """시스템 정보 엔드포인트"""
            return jsonify({
                'system': 'FCA (Fraud & Customer Analytics)',
                'version': '2.0.0',
                'environment': config.environment,
                'debug': config.debug,
                'available_datasets': self.data_processor.data_loader.list_available_datasets(),
                'success': True
            })
    
    def _register_data_routes(self):
        """데이터 관련 라우트 등록"""
        
        @self.app.route('/api/data/summary')
        @api_error_handler
        def data_summary():
            """전체 데이터 요약"""
            summary = self.data_processor.get_all_data_summary()
            return jsonify({
                'data': summary,
                'success': True
            })
        
        @self.app.route('/api/data/fraud')
        @api_error_handler
        def fraud_data():
            """사기 탐지 데이터"""
            fraud_data = self.data_processor.load_fraud_data()
            return jsonify({
                'data': fraud_data,
                'success': True
            })
        
        @self.app.route('/api/data/sentiment')
        @api_error_handler
        def sentiment_data():
            """감정 분석 데이터"""
            sentiment_data = self.data_processor.load_sentiment_data()
            return jsonify({
                'data': sentiment_data,
                'success': True
            })
        
        @self.app.route('/api/data/attrition')
        @api_error_handler
        def attrition_data():
            """고객 이탈 데이터"""
            attrition_data = self.data_processor.load_attrition_data()
            return jsonify({
                'data': attrition_data,
                'success': True
            })
        
        @self.app.route('/api/data/datasets')
        @api_error_handler
        def list_datasets():
            """사용 가능한 데이터셋 목록"""
            datasets = self.data_processor.data_loader.list_available_datasets()
            return jsonify({
                'datasets': datasets,
                'count': len(datasets),
                'success': True
            })
        
        @self.app.route('/api/data/dataset/<dataset_name>/info')
        @api_error_handler
        def dataset_info(dataset_name: str):
            """특정 데이터셋 정보"""
            info = self.data_processor.data_loader.get_dataset_info(dataset_name)
            return jsonify({
                'dataset': dataset_name,
                'info': info,
                'success': True
            })
    
    def _register_model_routes(self):
        """모델 관련 라우트 등록"""
        
        @self.app.route('/api/model/fraud/train', methods=['POST'])
        @api_error_handler
        @validate_request_data(['dataset_name'])
        def train_fraud_model():
            """사기 탐지 모델 학습"""
            data = request.get_json()
            dataset_name = data['dataset_name']
            
            # 데이터 준비
            X, y = self.data_processor.prepare_model_data(dataset_name)
            
            # 모델 초기화 및 학습
            self.fraud_engine = FraudDetectionEngine()
            self.fraud_engine.fit(X)
            
            # 모델 저장
            model_path = self.fraud_engine.save_model()
            
            return jsonify({
                'message': '사기 탐지 모델 학습 완료',
                'model_path': model_path,
                'dataset_used': dataset_name,
                'data_shape': X.shape,
                'success': True
            })
        
        @self.app.route('/api/model/fraud/predict', methods=['POST'])
        @api_error_handler
        @validate_request_data(['data'])
        def predict_fraud():
            """사기 예측"""
            if not self.fraud_engine or not self.fraud_engine.is_fitted:
                return jsonify({
                    'error': '모델이 학습되지 않았습니다. 먼저 /api/model/fraud/train을 호출하세요',
                    'success': False
                }), 400
            
            data = request.get_json()
            input_data = data['data']
            
            # 예측 수행
            result = self.fraud_engine.predict(input_data)
            
            return jsonify({
                'predictions': result.predictions.tolist(),
                'anomaly_scores': result.anomaly_scores.tolist(),
                'confidence': result.confidence.tolist(),
                'processing_time': result.processing_time,
                'success': True
            })
        
        @self.app.route('/api/model/fraud/status')
        @api_error_handler
        def fraud_model_status():
            """사기 탐지 모델 상태"""
            if not self.fraud_engine:
                return jsonify({
                    'status': 'not_initialized',
                    'is_fitted': False,
                    'success': True
                })
            
            stats = self.fraud_engine.get_performance_stats()
            return jsonify({
                'status': 'initialized',
                'stats': stats,
                'success': True
            })
    
    def _register_monitoring_routes(self):
        """모니터링 관련 라우트 등록"""
        
        @self.app.route('/api/monitoring/cache')
        @api_error_handler
        def cache_status():
            """캐시 상태 조회"""
            cache_info = self.data_processor.data_loader.get_cache_info()
            return jsonify({
                'cache_info': cache_info,
                'success': True
            })
        
        @self.app.route('/api/monitoring/cache/clear', methods=['POST'])
        @api_error_handler
        def clear_cache():
            """캐시 클리어"""
            self.data_processor.clear_cache()
            return jsonify({
                'message': '캐시가 클리어되었습니다',
                'success': True
            })
    
    def register_custom_route(self, rule: str, func: Callable, methods: List[str] = None):
        """커스텀 라우트 등록"""
        if methods is None:
            methods = ['GET']
        
        self.app.add_url_rule(rule, func.__name__, func, methods=methods)
        self._endpoints[rule] = {
            'function': func.__name__,
            'methods': methods
        }
        
        logger.info(f"커스텀 라우트 등록: {rule} -> {func.__name__}")
    
    def get_registered_endpoints(self) -> Dict[str, Any]:
        """등록된 엔드포인트 목록 반환"""
        endpoints = {}
        
        for rule in self.app.url_map.iter_rules():
            if rule.endpoint != 'static':
                endpoints[str(rule)] = {
                    'endpoint': rule.endpoint,
                    'methods': list(rule.methods - {'HEAD', 'OPTIONS'})
                }
        
        return endpoints