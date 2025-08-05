#!/usr/bin/env python3
"""
Real-time Detection API Endpoints
=================================

실제 탐지 기능을 위한 핵심 API 엔드포인트:
1. 사기 탐지 API (최우선)
2. 고객 이탈 예측 API (고우선순위)
3. 감정 분석 API (중간 우선순위)
4. 통합 대시보드 API
"""

from flask import Blueprint, request, jsonify, current_app
import pandas as pd
import numpy as np
from typing import Dict, List, Any
import logging
import asyncio
from datetime import datetime
import traceback
import sys
import os

# FCA 엔진 임포트
sys.path.append(os.path.join(os.path.dirname(__file__), '../../../..'))
from fca.core.detection_manager import DetectionManager, WebIntegrationManager

logger = logging.getLogger(__name__)

# Blueprint 생성
detection_bp = Blueprint('detection', __name__, url_prefix='/api/detection')

# 전역 Detection Manager (앱 시작시 초기화)
detection_manager = None
web_integration = None

def initialize_detection_system():
    """탐지 시스템 초기화"""
    global detection_manager, web_integration
    
    try:
        detection_manager = DetectionManager()
        web_integration = WebIntegrationManager(detection_manager)
        
        # 기본 모델들 초기화 (실제 데이터 로드 필요)
        logger.info("Detection system initialization started...")
        
        # 샘플 데이터로 모델 초기화 (실제 환경에서는 실제 데이터 사용)
        fraud_data = _create_sample_fraud_data()
        churn_data = _create_sample_churn_data()
        sentiment_data = _create_sample_sentiment_data()
        
        detection_manager.initialize_fraud_detection(fraud_data)
        detection_manager.initialize_churn_prediction(churn_data)
        detection_manager.initialize_sentiment_analysis(sentiment_data)
        
        logger.info("✅ Detection system initialized successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Detection system initialization failed: {e}")
        logger.error(traceback.format_exc())
        return False

def _create_sample_fraud_data():
    """샘플 사기 탐지 데이터 생성"""
    np.random.seed(42)
    n_samples = 1000
    
    return pd.DataFrame({
        'Time': np.random.randint(0, 172800, n_samples),
        'V1': np.random.normal(0, 1, n_samples),
        'V2': np.random.normal(0, 1, n_samples),
        'V3': np.random.normal(0, 1, n_samples),
        'V4': np.random.normal(0, 1, n_samples),
        'V5': np.random.normal(0, 1, n_samples),
        'Amount': np.random.lognormal(3, 2, n_samples),
        'Class': np.random.choice([0, 1], n_samples, p=[0.95, 0.05])
    })

def _create_sample_churn_data():
    """샘플 고객 이탈 데이터 생성"""
    np.random.seed(42)
    n_samples = 800
    
    return pd.DataFrame({
        'CustomerId': range(1, n_samples + 1),
        'CreditScore': np.random.randint(300, 850, n_samples),
        'Age': np.random.randint(18, 92, n_samples),
        'Tenure': np.random.randint(0, 10, n_samples),
        'Balance': np.random.lognormal(8, 2, n_samples),
        'NumOfProducts': np.random.choice([1, 2, 3, 4], n_samples, p=[0.5, 0.3, 0.15, 0.05]),
        'IsActiveMember': np.random.choice([0, 1], n_samples),
        'EstimatedSalary': np.random.normal(100000, 50000, n_samples),
        'Exited': np.random.choice([0, 1], n_samples, p=[0.8, 0.2])
    })

def _create_sample_sentiment_data():
    """샘플 감정 분석 데이터 생성"""
    texts = [
        "Great product, highly recommend!",
        "Terrible service, very disappointed",
        "Average quality, nothing special",
        "Excellent customer support",
        "Product broke after one day"
    ] * 100
    
    sentiments = np.random.choice(['positive', 'negative', 'neutral'], 500)
    
    return pd.DataFrame({
        'text': texts,
        'sentiment': sentiments
    })

@detection_bp.route('/fraud/detect', methods=['POST'])
def detect_fraud():
    """
    시스템 사기 탐지 API
    우선순위: CRITICAL
    """
    try:
        if not detection_manager:
            return jsonify({
                'status': 'error',
                'message': 'Detection system not initialized'
            }), 503
        
        # 입력 데이터 검증
        data = request.get_json()
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No data provided'
            }), 400
        
        # 필수 필드 확인
        required_fields = ['Time', 'Amount', 'V1', 'V2', 'V3', 'V4', 'V5']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                'status': 'error',
                'message': f'Missing required fields: {missing_fields}'
            }), 400
        
        # 비동기 사기 탐지 실행
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            result = loop.run_until_complete(detection_manager.detect_fraud(data))
        finally:
            loop.close()
        
        # 응답 형식 변환
        response = {
            'status': 'success',
            'data': {
                'transaction_id': result.entity_id,
                'is_fraud': result.action_required,
                'fraud_probability': result.risk_score,
                'risk_level': result.risk_level,
                'timestamp': result.timestamp.isoformat(),
                'details': result.details
            }
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Fraud detection API error: {e}")
        logger.error(traceback.format_exc())
        
        return jsonify({
            'status': 'error',
            'message': 'Internal server error',
            'details': str(e) if current_app.debug else None
        }), 500

@detection_bp.route('/customer/churn', methods=['POST'])
def predict_churn():
    """
    고객 이탈 예측 API
    우선순위: HIGH
    """
    try:
        if not detection_manager:
            return jsonify({
                'status': 'error',
                'message': 'Detection system not initialized'
            }), 503
        
        # 입력 데이터 검증
        data = request.get_json()
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No data provided'
            }), 400
        
        # 필수 필드 확인
        required_fields = ['CustomerId', 'CreditScore', 'Age', 'Tenure', 'Balance']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                'status': 'error',
                'message': f'Missing required fields: {missing_fields}'
            }), 400
        
        # 비동기 이탈 예측 실행
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            result = loop.run_until_complete(detection_manager.predict_churn(data))
        finally:
            loop.close()
        
        # 응답 형식 변환
        response = {
            'status': 'success',
            'data': {
                'customer_id': result.entity_id,
                'will_churn': result.action_required,
                'churn_probability': result.risk_score,
                'risk_level': result.risk_level,
                'customer_segment': result.details.get('customer_value_segment'),
                'retention_strategies': result.details.get('retention_strategies', []),
                'timestamp': result.timestamp.isoformat()
            }
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Churn prediction API error: {e}")
        logger.error(traceback.format_exc())
        
        return jsonify({
            'status': 'error',  
            'message': 'Internal server error',
            'details': str(e) if current_app.debug else None
        }), 500

@detection_bp.route('/sentiment/analyze', methods=['POST'])
def analyze_sentiment():
    """
    감정 분석 API
    우선순위: MEDIUM
    """
    try:
        if not detection_manager:
            return jsonify({
                'status': 'error',
                'message': 'Detection system not initialized'
            }), 503
        
        # 입력 데이터 검증
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({
                'status': 'error',
                'message': 'Text field is required'
            }), 400
        
        text = data['text']
        if not text or not text.strip():
            return jsonify({
                'status': 'error',
                'message': 'Text cannot be empty'
            }), 400
        
        # 비동기 감정 분석 실행
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            result = loop.run_until_complete(detection_manager.analyze_sentiment(data))
        finally:
            loop.close()
        
        # 응답 형식 변환
        response = {
            'status': 'success',
            'data': {
                'text_id': result.entity_id,
                'sentiment': result.details.get('sentiment'),
                'confidence': result.details.get('confidence'),
                'risk_score': result.risk_score,
                'requires_attention': result.action_required,
                'timestamp': result.timestamp.isoformat()
            }
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Sentiment analysis API error: {e}")
        logger.error(traceback.format_exc())
        
        return jsonify({
            'status': 'error',
            'message': 'Internal server error',
            'details': str(e) if current_app.debug else None
        }), 500

@detection_bp.route('/batch/analyze', methods=['POST'])
def batch_analyze():
    """
    배치 분석 API
    여러 데이터를 한번에 처리
    """
    try:
        if not detection_manager:
            return jsonify({
                'status': 'error',
                'message': 'Detection system not initialized'
            }), 503
        
        # 입력 데이터 검증
        data = request.get_json()
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No data provided'
            }), 400
        
        # 비동기 배치 처리 실행
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            results = loop.run_until_complete(detection_manager.process_batch(data))
        finally:
            loop.close()
        
        # 결과 형식 변환
        formatted_results = {}
        
        for detection_type, result_list in results.items():
            formatted_results[detection_type] = [
                {
                    'entity_id': r.entity_id,
                    'risk_score': r.risk_score,
                    'risk_level': r.risk_level,
                    'action_required': r.action_required,
                    'timestamp': r.timestamp.isoformat(),
                    'details': r.details
                }
                for r in result_list
            ]
        
        response = {
            'status': 'success',
            'data': formatted_results,
            'summary': {
                'total_processed': sum(len(results) for results in formatted_results.values()),
                'fraud_alerts': len([r for r in results.get('fraud', []) if r.action_required]),
                'churn_alerts': len([r for r in results.get('churn', []) if r.action_required]),
                'sentiment_alerts': len([r for r in results.get('sentiment', []) if r.action_required])
            }
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Batch analysis API error: {e}")
        logger.error(traceback.format_exc())
        
        return jsonify({
            'status': 'error',
            'message': 'Internal server error',
            'details': str(e) if current_app.debug else None
        }), 500

@detection_bp.route('/dashboard/summary', methods=['GET'])
def get_dashboard_summary():
    """
    대시보드 요약 정보 API
    시스템 현황 데이터 제공
    """
    try:
        if not detection_manager:
            return jsonify({
                'status': 'error',
                'message': 'Detection system not initialized'
            }), 503
        
        # 대시보드 요약 정보 조회
        summary = detection_manager.get_dashboard_summary()
        
        response = {
            'status': 'success',
            'data': summary
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Dashboard summary API error: {e}")
        logger.error(traceback.format_exc())
        
        return jsonify({
            'status': 'error',
            'message': 'Internal server error',
            'details': str(e) if current_app.debug else None
        }), 500

@detection_bp.route('/alerts/critical', methods=['GET'])
def get_critical_alerts():
    """
    중요 알림 조회 API
    """
    try:
        if not detection_manager:
            return jsonify({
                'status': 'error',
                'message': 'Detection system not initialized'
            }), 503
        
        # 시간 범위 파라미터
        hours = request.args.get('hours', 24, type=int)
        
        # 중요 알림 조회
        alerts = detection_manager.get_critical_alerts(hours=hours)
        
        # 웹 표시용 형식으로 변환
        formatted_alerts = web_integration.format_for_web_display(alerts)
        
        response = {
            'status': 'success',
            'data': {
                'alerts': formatted_alerts,
                'total_count': len(formatted_alerts),
                'time_range_hours': hours
            }
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Critical alerts API error: {e}")
        logger.error(traceback.format_exc())
        
        return jsonify({
            'status': 'error',
            'message': 'Internal server error',
            'details': str(e) if current_app.debug else None
        }), 500

@detection_bp.route('/charts/fraud', methods=['GET'])
def get_fraud_chart_data():
    """사기 탐지 차트 데이터 API"""
    try:
        if not web_integration:
            return jsonify({
                'status': 'error',
                'message': 'Web integration not initialized'
            }), 503
        
        chart_data = web_integration.get_fraud_chart_data()
        
        return jsonify({
            'status': 'success',
            'chart': chart_data
        }), 200
        
    except Exception as e:
        logger.error(f"Fraud chart API error: {e}")
        
        return jsonify({
            'status': 'error',
            'message': 'Internal server error'
        }), 500

@detection_bp.route('/charts/sentiment', methods=['GET'])
def get_sentiment_chart_data():
    """감정 분석 차트 데이터 API"""
    try:
        if not web_integration:
            return jsonify({
                'status': 'error',
                'message': 'Web integration not initialized'
            }), 503
        
        chart_data = web_integration.get_sentiment_chart_data()
        
        return jsonify({
            'status': 'success',
            'chart': chart_data
        }), 200
        
    except Exception as e:
        logger.error(f"Sentiment chart API error: {e}")
        
        return jsonify({
            'status': 'error',
            'message': 'Internal server error'
        }), 500

@detection_bp.route('/charts/churn', methods=['GET'])
def get_churn_chart_data():
    """고객 이탈 차트 데이터 API"""
    try:
        if not web_integration:
            return jsonify({
                'status': 'error',
                'message': 'Web integration not initialized'
            }), 503
        
        chart_data = web_integration.get_churn_chart_data()
        
        return jsonify({
            'status': 'success',
            'chart': chart_data
        }), 200
        
    except Exception as e:
        logger.error(f"Churn chart API error: {e}")
        
        return jsonify({
            'status': 'error',
            'message': 'Internal server error'
        }), 500

@detection_bp.route('/system/health', methods=['GET'])
def system_health():
    """시스템 상태 점검 API"""
    try:
        if not detection_manager:
            return jsonify({
                'status': 'error',
                'message': 'Detection system not initialized',
                'healthy': False
            }), 503
        
        is_healthy = detection_manager._check_system_health()
        engine_status = {
            'fraud_detection': detection_manager.engines.get('fraud') is not None,
            'churn_prediction': detection_manager.engines.get('churn') is not None,
            'sentiment_analysis': detection_manager.engines.get('sentiment') is not None
        }
        
        return jsonify({
            'status': 'success',
            'healthy': is_healthy,
            'engines': engine_status,
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Health check API error: {e}")
        
        return jsonify({
            'status': 'error',
            'message': 'Health check failed',
            'healthy': False
        }), 500

# 에러 핸들러
@detection_bp.errorhandler(404)
def not_found(error):
    return jsonify({
        'status': 'error',
        'message': 'Endpoint not found'
    }), 404

@detection_bp.errorhandler(405)
def method_not_allowed(error):
    return jsonify({
        'status': 'error',
        'message': 'Method not allowed'
    }), 405

@detection_bp.errorhandler(500) 
def internal_error(error):
    return jsonify({
        'status': 'error',
        'message': 'Internal server error'
    }), 500