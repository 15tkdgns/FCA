#!/usr/bin/env python3
"""
투명성 대시보드 API 엔드포인트
"""

from flask import jsonify
from modules.core.transparency import transparency_manager


def get_processing_steps():
    """처리 단계별 상세 정보 API"""
    result = transparency_manager.get_processing_steps()
    
    if result['status'] == 'success':
        return jsonify(result)
    else:
        return jsonify(result), 500


def get_data_flow():
    """데이터 흐름 실시간 모니터링 API"""
    result = transparency_manager.get_data_flow_metrics()
    
    if result['status'] == 'success':
        return jsonify(result)
    else:
        return jsonify(result), 500


def get_fraud_statistics():
    """사기 탐지 통계 API"""
    try:
        from utils.performance_calculator import performance_calculator
        
        # 실제 성능 메트릭 가져오기
        performance_metrics = performance_calculator.get_all_performance_metrics()
        fraud_metrics = performance_metrics['fraud_detection']
        
        data = {
            'total_transactions': fraud_metrics['total_samples'],
            'fraud_detected': int(fraud_metrics['total_samples'] * fraud_metrics['fraud_rate'] / 100),
            'fraud_rate': fraud_metrics['fraud_rate'] / 100,
            'accuracy': fraud_metrics['accuracy'],
            'precision': fraud_metrics['precision'],
            'recall': fraud_metrics['recall'],
            'f1_score': fraud_metrics['f1_score'],
            'auc_roc': fraud_metrics['auc_roc'],
            'best_model': fraud_metrics['model_type'],
            'dataset_size': f"{fraud_metrics['total_samples']//1000}K transactions",
            'last_updated': fraud_metrics['calculated_at'][:10]
        }
        
        return jsonify({
            'status': 'success',
            'data': data
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500


def get_sentiment_data():
    """감정 분석 데이터 API"""
    try:
        from utils.performance_calculator import performance_calculator
        
        # 실제 성능 메트릭 가져오기
        performance_metrics = performance_calculator.get_all_performance_metrics()
        sentiment_metrics = performance_metrics['sentiment_analysis']
        
        # 감정 분포 계산
        total_samples = sentiment_metrics['total_samples']
        sentiment_dist = sentiment_metrics['sentiment_distribution']
        
        data = {
            'total_texts': total_samples,
            'positive': int(total_samples * sentiment_dist['positive'] / 100),
            'negative': int(total_samples * sentiment_dist['negative'] / 100),
            'neutral': int(total_samples * sentiment_dist['neutral'] / 100),
            'accuracy': sentiment_metrics['accuracy'],
            'precision': sentiment_metrics['precision'],
            'recall': sentiment_metrics['recall'],
            'f1_score': sentiment_metrics['f1_score'],
            'best_model': sentiment_metrics['model_type'],
            'dataset': sentiment_metrics['dataset_name']
        }
        
        return jsonify({
            'status': 'success',
            'data': data
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500


def get_attrition_data():
    """고객 이탈 데이터 API"""
    try:
        from utils.performance_calculator import performance_calculator
        
        # 실제 성능 메트릭 가져오기
        performance_metrics = performance_calculator.get_all_performance_metrics()
        attrition_metrics = performance_metrics['customer_attrition']
        
        # 고객 수 계산
        total_customers = attrition_metrics['total_samples']
        churn_rate = attrition_metrics['churn_rate'] / 100
        churned_customers = int(total_customers * churn_rate)
        
        data = {
            'total_customers': total_customers,
            'churned_customers': churned_customers,
            'retained_customers': total_customers - churned_customers,
            'churn_rate': churn_rate,
            'accuracy': attrition_metrics['accuracy'],
            'precision': attrition_metrics['precision'],
            'recall': attrition_metrics['recall'],
            'f1_score': attrition_metrics['f1_score'],
            'best_model': attrition_metrics['model_type'],
            'dataset': attrition_metrics['dataset_name'],
            'models_tested': 5
        }
        
        return jsonify({
            'status': 'success',
            'data': data
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500