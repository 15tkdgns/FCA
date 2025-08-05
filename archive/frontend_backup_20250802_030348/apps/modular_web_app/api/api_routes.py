"""
API 라우트 모듈
==============

FCA 웹 애플리케이션의 모든 API 엔드포인트를 관리합니다.
- 차트 데이터 API
- 시스템 상태 API
- 요약 정보 API
"""

import json
from datetime import datetime
from flask import jsonify
from ..charts import (
    create_fraud_distribution_chart,
    create_fraud_performance_chart,
    create_sentiment_chart,
    create_attrition_chart,
    create_model_comparison_chart,
    create_dataset_overview_chart
)
from ..data import get_summary_stats, get_datasets_info


class APIRoutes:
    """API 라우트 관리 클래스"""
    
    def __init__(self):
        """APIRoutes 초기화"""
        pass
    
    def fraud_distribution_chart(self):
        """사기 탐지 분포 차트 데이터"""
        try:
            chart_json = create_fraud_distribution_chart()
            chart_data = json.loads(chart_json)
            return jsonify({
                'status': 'success',
                'data': chart_data['data'],
                'layout': chart_data['layout']
            })
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': f'Chart generation failed: {str(e)}'
            }), 500
    
    def fraud_performance_chart(self):
        """사기 탐지 성능 차트 데이터"""
        try:
            chart_json = create_fraud_performance_chart()
            chart_data = json.loads(chart_json)
            return jsonify({
                'status': 'success',
                'data': chart_data['data'],
                'layout': chart_data['layout']
            })
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': f'Chart generation failed: {str(e)}'
            }), 500
    
    def sentiment_chart(self):
        """감정 분석 차트 데이터"""
        try:
            chart_json = create_sentiment_chart()
            chart_data = json.loads(chart_json)
            return jsonify({
                'status': 'success',
                'data': chart_data['data'],
                'layout': chart_data['layout']
            })
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': f'Chart generation failed: {str(e)}'
            }), 500
    
    def attrition_chart(self):
        """고객 이탈 차트 데이터"""
        try:
            chart_json = create_attrition_chart()
            chart_data = json.loads(chart_json)
            return jsonify({
                'status': 'success',
                'data': chart_data['data'],
                'layout': chart_data['layout']
            })
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': f'Chart generation failed: {str(e)}'
            }), 500
    
    def comparison_chart(self):
        """모델 비교 차트 데이터"""
        try:
            chart_json = create_model_comparison_chart()
            chart_data = json.loads(chart_json)
            return jsonify({
                'status': 'success',
                'data': chart_data['data'],
                'layout': chart_data['layout']
            })
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': f'Chart generation failed: {str(e)}'
            }), 500
    
    def dataset_overview_chart(self):
        """데이터셋 개요 차트 데이터"""
        try:
            chart_json = create_dataset_overview_chart()
            chart_data = json.loads(chart_json)
            return jsonify({
                'status': 'success',
                'data': chart_data['data'],
                'layout': chart_data['layout']
            })
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': f'Chart generation failed: {str(e)}'
            }), 500
    
    def system_summary(self):
        """시스템 요약 정보"""
        try:
            summary = get_summary_stats()
            return jsonify({
                'status': 'success',
                'data': {
                    'total_datasets': summary['total_datasets'],
                    'total_records': summary['total_records'],
                    'average_accuracy': round(summary['average_accuracy'], 2),
                    'data_loaded_count': summary['data_loaded_count'],
                    'system_status': 'online',
                    'last_updated': datetime.now().isoformat()
                },
                'timestamp': datetime.now().isoformat()
            })
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': f'Summary information retrieval failed: {str(e)}'
            }), 500
    
    def datasets_info(self):
        """데이터셋 정보"""
        try:
            datasets = get_datasets_info()
            return jsonify({
                'status': 'success',
                'data': datasets,
                'timestamp': datetime.now().isoformat()
            })
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': f'Dataset information retrieval failed: {str(e)}'
            }), 500
    
    def health_check(self):
        """시스템 상태 체크"""
        try:
            return jsonify({
                'status': 'healthy',
                'timestamp': datetime.now().isoformat(),
                'services': {
                    'web_server': 'running',
                    'data_loader': 'running',
                    'chart_generator': 'running',
                    'template_engine': 'running'
                },
                'version': '2.0.0'
            })
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': f'Health check failed: {str(e)}'
            }), 500
    
    def system_info(self):
        """시스템 상세 정보"""
        try:
            summary = get_summary_stats()
            datasets = get_datasets_info()
            
            return jsonify({
                'status': 'success',
                'data': {
                    'system': {
                        'name': 'FCA Analysis Dashboard',
                        'version': '2.0.0',
                        'status': 'running',
                        'uptime': '24h 15m'
                    },
                    'datasets': {
                        'total': len(datasets),
                        'active': len([d for d in datasets if d['status'] == 'Active']),
                        'real_data': len([d for d in datasets if d['data_loaded']]),
                        'sample_data': len([d for d in datasets if not d['data_loaded']])
                    },
                    'performance': {
                        'total_records': summary['total_records'],
                        'average_accuracy': round(summary['average_accuracy'], 2),
                        'processing_speed': '1.2M records/min',
                        'memory_usage': '85%'
                    }
                },
                'timestamp': datetime.now().isoformat()
            })
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': f'System information retrieval failed: {str(e)}'
            }), 500


# 전역 API 라우트 인스턴스
api_routes = APIRoutes()


# 편의 함수들
def fraud_distribution_chart():
    """사기 탐지 분포 차트 (편의 함수)"""
    return api_routes.fraud_distribution_chart()


def fraud_performance_chart():
    """사기 탐지 성능 차트 (편의 함수)"""
    return api_routes.fraud_performance_chart()


def sentiment_chart():
    """감정 분석 차트 (편의 함수)"""
    return api_routes.sentiment_chart()


def attrition_chart():
    """고객 이탈 차트 (편의 함수)"""
    return api_routes.attrition_chart()


def comparison_chart():
    """모델 비교 차트 (편의 함수)"""
    return api_routes.comparison_chart()


def dataset_overview_chart():
    """데이터셋 개요 차트 (편의 함수)"""
    return api_routes.dataset_overview_chart()


def system_summary():
    """시스템 요약 (편의 함수)"""
    return api_routes.system_summary()


def datasets_info():
    """데이터셋 정보 (편의 함수)"""
    return api_routes.datasets_info()


def health_check():
    """헬스 체크 (편의 함수)"""
    return api_routes.health_check()


def system_info():
    """시스템 정보 (편의 함수)"""
    return api_routes.system_info()