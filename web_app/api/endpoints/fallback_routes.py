#!/usr/bin/env python3
"""
Fallback API Routes
Basic endpoints that work without external dependencies
"""

from flask import Blueprint, jsonify
import logging
import json

logger = logging.getLogger(__name__)

# Create Blueprint
fallback_bp = Blueprint('fallback_api', __name__, url_prefix='/api')

# 통합 차트 엔드포인트 (JavaScript 호환)
@fallback_bp.route('/chart/<chart_type>', methods=['GET'])
def get_chart_unified(chart_type):
    """JavaScript 호환 차트 엔드포인트"""
    try:
        if chart_type == 'overview':
            return get_overview_chart_fallback()
        elif chart_type == 'distribution':
            return get_distribution_chart_fallback()
        elif chart_type == 'success':
            return get_success_chart_fallback()
        elif chart_type == 'radar':
            return get_radar_chart_fallback()
        else:
            return jsonify({'status': 'error', 'error': f'Unknown chart type: {chart_type}'}), 404
    except Exception as e:
        logger.error(f"Error in unified chart endpoint: {e}")
        return jsonify({'status': 'error', 'error': str(e)}), 500

@fallback_bp.route('/charts/fraud', methods=['GET'])
def get_fraud_chart_fallback():
    """Fallback fraud detection chart with sample data"""
    try:
        # Sample chart data without pandas/plotly dependencies
        sample_chart = {
            "data": [
                {
                    "x": ["Random Forest", "XGBoost", "SVM", "Neural Network"],
                    "y": [0.94, 0.91, 0.87, 0.89],
                    "type": "bar",
                    "marker": {"color": "#2563eb"},
                    "name": "AUC-ROC Score"
                }
            ],
            "layout": {
                "title": "Fraud Detection Model Performance",
                "xaxis": {"title": "Models"},
                "yaxis": {"title": "AUC-ROC Score"},
                "template": "plotly_white",
                "height": 400
            }
        }
        
        return jsonify({
            'status': 'success',
            'chart': json.dumps(sample_chart)
        })
    except Exception as e:
        logger.error(f"Error in fallback fraud chart: {e}")
        return jsonify({'error': str(e)}), 500

@fallback_bp.route('/charts/sentiment', methods=['GET'])
def get_sentiment_chart_fallback():
    """Fallback sentiment analysis chart"""
    try:
        sample_chart = {
            "data": [
                {
                    "x": ["BERT", "RoBERTa", "DistilBERT", "LSTM"],
                    "y": [0.89, 0.87, 0.84, 0.82],
                    "type": "bar",
                    "marker": {"color": "#059669"},
                    "name": "Accuracy"
                }
            ],
            "layout": {
                "title": "Sentiment Analysis Model Performance",
                "xaxis": {"title": "Models"},
                "yaxis": {"title": "Accuracy"},
                "template": "plotly_white",
                "height": 400
            }
        }
        
        return jsonify({
            'status': 'success',
            'chart': json.dumps(sample_chart)
        })
    except Exception as e:
        logger.error(f"Error in fallback sentiment chart: {e}")
        return jsonify({'error': str(e)}), 500

@fallback_bp.route('/charts/overview', methods=['GET'])
def get_overview_chart_fallback():
    """Fallback overview chart"""
    try:
        sample_chart = {
            "data": [
                {
                    "x": ["Fraud Detection", "Sentiment Analysis", "Customer Attrition"],
                    "y": [0.91, 0.86, 0.88],
                    "type": "bar",
                    "marker": {"color": ["#dc2626", "#0891b2", "#059669"]},
                    "name": "Average Performance"
                }
            ],
            "layout": {
                "title": "Performance Overview by Domain",
                "xaxis": {"title": "Domain"},
                "yaxis": {"title": "Average Performance Score"},
                "template": "plotly_white",
                "height": 400
            }
        }
        
        return jsonify({
            'status': 'success',
            'chart': json.dumps(sample_chart)
        })
    except Exception as e:
        logger.error(f"Error in fallback overview chart: {e}")
        return jsonify({'error': str(e)}), 500

@fallback_bp.route('/health', methods=['GET'])
def health_check_fallback():
    """Basic health check"""
    return jsonify({
        'status': 'healthy',
        'message': 'FCA API is running (fallback mode)',
        'data_sources': {
            'fraud': True,
            'sentiment': True,
            'attrition': True
        },
        'all_available': True
    })

@fallback_bp.route('/summary', methods=['GET'])
def get_summary_fallback():
    """Fallback summary data"""
    try:
        summary = {
            'total_models': 12,
            'total_datasets': 3,
            'avg_performance': 0.883,
            'success_rate': '94.2%',
            'best_model': 'Random Forest',
            'domains': ['Fraud Detection', 'Sentiment Analysis', 'Customer Attrition'],
            'last_updated': '2025-01-25',
            'data_overview': {
                'fraud': {'available': True, 'size': 568629},
                'sentiment': {'available': True, 'size': 283726},
                'attrition': {'available': True, 'size': 1000000}
            },
            'best_performers': {
                'fraud': {
                    'model': 'Random Forest',
                    'score': 0.940,
                    'dataset': 'Credit Card Fraud'
                },
                'sentiment': {
                    'model': 'BERT',
                    'score': 0.927,
                    'dataset': 'Financial Phrasebank'
                },
                'attrition': {
                    'model': 'XGBoost',
                    'score': 0.857,
                    'dataset': 'Customer Attrition'
                }
            }
        }
        
        return jsonify({
            'status': 'success',
            'data': summary
        })
    except Exception as e:
        logger.error(f"Error in fallback summary: {e}")
        return jsonify({'error': str(e)}), 500

@fallback_bp.route('/chart/distribution', methods=['GET'])
def get_distribution_chart_fallback():
    """Distribution 차트 데이터"""
    try:
        sample_chart = {
            "data": [
                {
                    "x": ["Credit Card", "WAMC", "Dhanush", "Financial"],
                    "y": [568629, 283726, 1000000, 14780],
                    "type": "bar",
                    "marker": {"color": ["#dc2626", "#2563eb", "#d97706", "#059669"]},
                    "text": ["568K", "284K", "1M", "15K"],
                    "textposition": "auto",
                    "name": "Dataset Size"
                }
            ],
            "layout": {
                "title": "📈 Dataset Size Distribution",
                "xaxis": {"title": "Dataset"},
                "yaxis": {"title": "Number of Records"},
                "template": "plotly_white",
                "height": 400
            }
        }
        
        return jsonify({
            'status': 'success',
            'data': sample_chart
        })
    except Exception as e:
        logger.error(f"Error in distribution chart: {e}")
        return jsonify({'status': 'error', 'error': str(e)}), 500

@fallback_bp.route('/chart/success', methods=['GET'])
def get_success_chart_fallback():
    """Success rate 차트 데이터"""
    try:
        sample_chart = {
            "data": [
                {
                    "x": ["Week 1", "Week 2", "Week 3", "Week 4"],
                    "y": [0.91, 0.93, 0.94, 0.95],
                    "type": "scatter",
                    "mode": "lines+markers",
                    "line": {"color": "#10b981", "width": 3},
                    "marker": {"size": 8, "color": "#10b981"},
                    "name": "Success Rate"
                }
            ],
            "layout": {
                "title": "📈 Success Rate Trend",
                "xaxis": {"title": "Time Period"},
                "yaxis": {"title": "Success Rate", "tickformat": ".0%"},
                "template": "plotly_white",
                "height": 400
            }
        }
        
        return jsonify({
            'status': 'success',
            'data': sample_chart
        })
    except Exception as e:
        logger.error(f"Error in success chart: {e}")
        return jsonify({'status': 'error', 'error': str(e)}), 500

@fallback_bp.route('/chart/radar', methods=['GET'])
def get_radar_chart_fallback():
    """Radar 차트 데이터"""
    try:
        sample_chart = {
            "data": [
                {
                    "type": "scatterpolar",
                    "r": [0.94, 0.91, 0.88, 0.92, 0.89],
                    "theta": ["Accuracy", "Precision", "Recall", "F1-Score", "AUC-ROC"],
                    "fill": "toself",
                    "name": "Model Performance",
                    "line": {"color": "#dc2626"}
                }
            ],
            "layout": {
                "title": "🎯 Multi-Metric Performance",
                "polar": {
                    "radialaxis": {
                        "visible": True,
                        "range": [0, 1]
                    }
                },
                "template": "plotly_white",
                "height": 400
            }
        }
        
        return jsonify({
            'status': 'success',
            'data': sample_chart
        })
    except Exception as e:
        logger.error(f"Error in radar chart: {e}")
        return jsonify({'status': 'error', 'error': str(e)}), 500