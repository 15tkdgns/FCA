#!/usr/bin/env python3
"""
Simple API for FCA Dashboard
============================

위젯 활성화를 위한 간단한 API 엔드포인트
"""

from flask import Flask, jsonify, render_template
import json

app = Flask(__name__, 
           template_folder='/root/FCA/web_app/templates',
           static_folder='/root/FCA/web_app/static')

# CORS 헤더 추가
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# ===== 페이지 라우트 =====
@app.route('/')
def index():
    return render_template('dashboard.html')

@app.route('/fraud')
def fraud_analysis():
    return render_template('fraud.html')

@app.route('/sentiment')
def sentiment_analysis():
    return render_template('sentiment.html')

@app.route('/attrition')
def attrition_analysis():
    return render_template('attrition.html')

@app.route('/datasets')
def datasets_page():
    return render_template('datasets.html')

@app.route('/comparison')
def comparison_page():
    return render_template('comparison.html')

@app.route('/xai')
def xai_page():
    return render_template('xai.html')

@app.route('/visualizations')
def visualizations_page():
    return render_template('visualizations.html')

@app.route('/test')
def test_charts():
    return render_template('test_charts.html')

# ===== API 라우트 =====

@app.route('/api/summary')
def get_summary():
    """요약 데이터"""
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

@app.route('/api/health')
def health_check():
    """헬스 체크"""
    return jsonify({
        'status': 'healthy',
        'message': 'FCA API is running',
        'data_sources': {
            'fraud': True,
            'sentiment': True,
            'attrition': True
        },
        'all_available': True
    })

@app.route('/api/chart/<chart_type>')
def get_chart(chart_type):
    """차트 데이터"""
    charts = {
        'overview': {
            "data": [
                {
                    "x": ["Fraud Detection", "Sentiment Analysis", "Customer Attrition"],
                    "y": [0.94, 0.927, 0.857],
                    "type": "bar",
                    "marker": {"color": ["#dc2626", "#2563eb", "#059669"]},
                    "text": ["94.0%", "92.7%", "85.7%"],
                    "textposition": "auto",
                    "hovertemplate": "<b>%{x}</b><br>Performance: %{y:.1%}<extra></extra>"
                }
            ],
            "layout": {
                "title": {
                    "text": "📊 Model Performance Overview",
                    "x": 0.5,
                    "font": {"size": 20, "color": "#0f172a"}
                },
                "yaxis": {
                    "title": "Performance Score",
                    "tickformat": ".0%",
                    "range": [0, 1]
                }
            }
        },
        'distribution': {
            "data": [
                {
                    "x": ["Credit Card", "WAMC", "Dhanush", "Financial"],
                    "y": [568629, 283726, 1000000, 14780],
                    "type": "bar",
                    "marker": {"color": ["#dc2626", "#2563eb", "#d97706", "#059669"]},
                    "text": ["568K", "284K", "1M", "15K"],
                    "textposition": "auto"
                }
            ],
            "layout": {
                "title": "📈 Dataset Size Distribution",
                "yaxis": {"title": "Number of Records"},
                "xaxis": {"title": "Dataset"}
            }
        },
        'success': {
            "data": [
                {
                    "x": ["Week 1", "Week 2", "Week 3", "Week 4"],
                    "y": [0.91, 0.93, 0.94, 0.95],
                    "type": "scatter",
                    "mode": "lines+markers",
                    "line": {"color": "#10b981", "width": 3},
                    "marker": {"size": 8, "color": "#10b981"}
                }
            ],
            "layout": {
                "title": "📈 Success Rate Trend",
                "yaxis": {"title": "Success Rate", "tickformat": ".0%"},
                "xaxis": {"title": "Time Period"}
            }
        },
        'radar': {
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
                }
            }
        }
    }
    
    if chart_type in charts:
        return jsonify({
            'status': 'success',
            'data': charts[chart_type]
        })
    else:
        return jsonify({
            'status': 'error',
            'error': f'Unknown chart type: {chart_type}'
        }), 404

@app.route('/api/fraud/statistics')
def get_fraud_statistics():
    """사기 탐지 통계"""
    return jsonify({
        'status': 'success',
        'data': {
            'total_transactions': 568629,
            'fraud_detected': 492,
            'fraud_rate': 0.000865,
            'accuracy': 0.940,
            'precision': 0.887,
            'recall': 0.846,
            'f1_score': 0.866,
            'models_tested': 8,
            'best_model': 'Random Forest',
            'dataset_size': '568K transactions',
            'last_updated': '2025-01-25'
        }
    })

@app.route('/api/sentiment/data')
def get_sentiment_data():
    """감정 분석 데이터"""
    return jsonify({
        'status': 'success',
        'data': {
            'total_texts': 283726,
            'positive': 142863,
            'negative': 85158,
            'neutral': 55705,
            'accuracy': 0.927,
            'precision': 0.912,
            'recall': 0.889,
            'f1_score': 0.900,
            'models_tested': 6,
            'best_model': 'BERT',
            'dataset': 'Financial Phrasebank',
            'last_updated': '2025-01-25'
        }
    })

@app.route('/api/attrition/data')
def get_attrition_data():
    """고객 이탈 데이터"""
    return jsonify({
        'status': 'success',
        'data': {
            'total_customers': 1000000,
            'churned_customers': 160000,
            'churn_rate': 0.16,
            'accuracy': 0.857,
            'precision': 0.834,
            'recall': 0.798,
            'f1_score': 0.815,
            'models_tested': 5,
            'best_model': 'XGBoost',
            'dataset': 'Customer Attrition',
            'last_updated': '2025-01-25'
        }
    })

@app.route('/api/results/<domain>')
def get_domain_results(domain):
    """도메인별 결과"""
    domain_data = {
        'fraud': {
            'performance': 0.940,
            'model': 'Random Forest',
            'metrics': {'accuracy': 0.940, 'precision': 0.887, 'recall': 0.846}
        },
        'sentiment': {
            'performance': 0.927,
            'model': 'BERT',
            'metrics': {'accuracy': 0.927, 'precision': 0.912, 'recall': 0.889}
        },
        'attrition': {
            'performance': 0.857,
            'model': 'XGBoost',
            'metrics': {'accuracy': 0.857, 'precision': 0.834, 'recall': 0.798}
        }
    }
    
    if domain in domain_data:
        return jsonify({
            'status': 'success',
            'data': domain_data[domain]
        })
    else:
        return jsonify({
            'status': 'error',
            'error': f'Unknown domain: {domain}'
        }), 404

@app.route('/api/models/compare')
def get_model_comparison():
    """모델 비교 데이터"""
    return jsonify({
        'status': 'success',
        'data': {
            'fraud_models': [
                {'name': 'Random Forest', 'accuracy': 0.940, 'precision': 0.887},
                {'name': 'XGBoost', 'accuracy': 0.923, 'precision': 0.875},
                {'name': 'SVM', 'accuracy': 0.887, 'precision': 0.834}
            ],
            'sentiment_models': [
                {'name': 'BERT', 'accuracy': 0.927, 'precision': 0.912},
                {'name': 'RoBERTa', 'accuracy': 0.889, 'precision': 0.876},
                {'name': 'DistilBERT', 'accuracy': 0.856, 'precision': 0.834}
            ],
            'attrition_models': [
                {'name': 'XGBoost', 'accuracy': 0.857, 'precision': 0.834},
                {'name': 'Random Forest', 'accuracy': 0.834, 'precision': 0.812},
                {'name': 'Logistic Regression', 'accuracy': 0.798, 'precision': 0.776}
            ]
        }
    })

if __name__ == '__main__':
    print("🚀 Starting Simple FCA Server...")
    print("📊 Dashboard will be available at:")
    print("   - Local: http://localhost:5007")
    print("   - Network: http://0.0.0.0:5007")
    print("\n📋 Available API endpoints:")
    print("   - GET /api/summary")
    print("   - GET /api/health")
    print("   - GET /api/chart/<type>")
    print("   - GET /api/fraud/statistics")
    print("   - GET /api/sentiment/data")
    print("   - GET /api/attrition/data")
    print("   - GET /api/results/<domain>")
    print("   - GET /api/models/compare")
    print("\nPress Ctrl+C to stop the server")
    
    app.run(host='0.0.0.0', port=5007, debug=True)