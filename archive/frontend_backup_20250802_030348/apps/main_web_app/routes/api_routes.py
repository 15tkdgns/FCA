"""
API Routes Module
=================
API endpoints for the FCA Dashboard
"""

from flask import jsonify, request
from datetime import datetime

def register_api_routes(app, sample_data, engines):
    """Register all API routes"""
    
    @app.route('/api/summary')
    def api_summary():
        """API 요약 정보"""
        return jsonify({
            'status': 'success',
            'data': sample_data['stats']
        })

    @app.route('/api/datasets')
    def api_datasets():
        """데이터셋 목록 API"""
        return jsonify({
            'status': 'success',
            'data': sample_data['datasets']
        })

    @app.route('/api/models/status')
    def api_models_status():
        """모델 상태 API"""
        fraud_detector, sentiment_analyzer, attrition_predictor = engines
        
        models_status = {
            'fraud_detector': {
                'name': 'Fraud Detection Engine',
                'status': 'active' if fraud_detector else 'inactive',
                'accuracy': 0.948 if fraud_detector else 0,
                'last_updated': datetime.now().isoformat()
            },
            'sentiment_analyzer': {
                'name': 'Sentiment Analysis Engine', 
                'status': 'active' if sentiment_analyzer else 'inactive',
                'accuracy': 0.892 if sentiment_analyzer else 0,
                'last_updated': datetime.now().isoformat()
            },
            'attrition_predictor': {
                'name': 'Customer Attrition Predictor',
                'status': 'active' if attrition_predictor else 'inactive', 
                'accuracy': 0.875 if attrition_predictor else 0,
                'last_updated': datetime.now().isoformat()
            }
        }
        
        return jsonify({
            'status': 'success',
            'models': models_status,
            'total_active': sum(1 for m in models_status.values() if m['status'] == 'active'),
            'overall_health': 'good' if all(m['status'] == 'active' for m in models_status.values()) else 'degraded'
        })

    @app.route('/api/models/compare')
    def api_model_comparison():
        """모델 비교 데이터 API"""
        
        # 기본 모델 데이터
        base_models = [
            {
                'model': 'Random Forest',
                'accuracy': 94.8,
                'precision': 98.5,
                'recall': 91.2,
                'f1_score': 94.7,
                'domain': 'Fraud Detection',
                'dataset': 'Financial Transactions'
            },
            {
                'model': 'XGBoost',
                'accuracy': 93.2,
                'precision': 97.8,
                'recall': 92.1,
                'f1_score': 94.9,
                'domain': 'Sentiment Analysis',
                'dataset': 'Customer Reviews'
            },
            {
                'model': 'Logistic Regression',
                'accuracy': 87.3,
                'precision': 89.3,
                'recall': 78.9,
                'f1_score': 83.8,
                'domain': 'Customer Attrition',
                'dataset': 'Customer Database'
            },
            {
                'model': 'Neural Network',
                'accuracy': 91.7,
                'precision': 95.2,
                'recall': 87.6,
                'f1_score': 91.2,
                'domain': 'Fraud Detection',
                'dataset': 'Transaction History'
            },
            {
                'model': 'SVM',
                'accuracy': 89.4,
                'precision': 88.7,
                'recall': 76.3,
                'f1_score': 82.1,
                'domain': 'Sentiment Analysis',
                'dataset': 'Social Media Posts'
            }
        ]
        
        # 프론트엔드가 기대하는 데이터 구조로 변환
        comparison_data = []
        for model in base_models:
            comparison_data.append({
                'domain': model['domain'],
                'dataset': model['dataset'],
                'model': model['model'],
                'primary_metric': 'Accuracy',
                'primary_score': model['accuracy'] / 100,  # 0-1 스케일로 변환
                'secondary_metric': 'F1-Score',
                'secondary_score': model['f1_score'] / 100
            })
        
        # Summary 데이터
        summary_data = {
            'total_models': len(base_models),
            'domains': 3,
            'datasets': 5,
            'performance': {
                'overall_avg': sum(m['accuracy'] for m in base_models) / len(base_models) / 100
            }
        }
        
        return jsonify({
            'status': 'success',
            'comparison': comparison_data,
            'summary': summary_data
        })

    @app.route('/health')
    def health():
        """헬스 체크"""
        try:
            return jsonify({
                'status': 'OK',
                'message': 'FCA Web Application is running',
                'version': '1.0.0',
                'engines_available': any(engines),
                'models_count': sum(1 for engine in engines if engine),
                'timestamp': datetime.now().isoformat()
            })
        except Exception as e:
            return jsonify({
                'status': 'DEGRADED',
                'message': f'Health check error: {str(e)}',
                'fallback_mode': True
            }), 206

    @app.route('/api/health')
    def api_health():
        """API 헬스 체크 (호환성)"""
        return health()

    @app.route('/api/chart/sentiment')
    def api_chart_sentiment():
        """감정 분석 차트 API"""
        return jsonify({
            'status': 'success',
            'chart_data': {
                'data': [
                    {
                        'x': ['Positive', 'Negative', 'Neutral'],
                        'y': [65, 20, 15],
                        'type': 'bar',
                        'name': 'Sentiment Distribution'
                    }
                ],
                'layout': {
                    'title': 'Customer Sentiment Analysis',
                    'xaxis': {'title': 'Sentiment'},
                    'yaxis': {'title': 'Percentage'}
                }
            }
        })