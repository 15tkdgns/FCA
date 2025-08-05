#!/usr/bin/env python3
"""
FCA 테스트 서버
=============

위젯 활성화 확인을 위한 간단한 Flask 서버
"""

import sys
import os
from pathlib import Path

# FCA 모듈 경로 추가
sys.path.append('/root/FCA')
sys.path.append('/root/FCA/web_app')

from flask import Flask, render_template

app = Flask(__name__, 
           template_folder='/root/FCA/web_app/templates',
           static_folder='/root/FCA/web_app/static')

# CORS 헤더 수동 추가
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# API 라우트 추가
try:
    from api.endpoints.fallback_routes import fallback_bp
    app.register_blueprint(fallback_bp)
    print("✅ API routes loaded successfully")
except Exception as e:
    print(f"⚠️ Failed to load API routes: {e}")

@app.route('/')
def index():
    """메인 대시보드 페이지"""
    return render_template('dashboard.html')

@app.route('/fraud')
def fraud_analysis():
    """사기 탐지 페이지"""
    return render_template('fraud.html')

@app.route('/sentiment')
def sentiment_analysis():
    """감정 분석 페이지"""
    return render_template('sentiment.html')

@app.route('/attrition')
def attrition_analysis():
    """고객 이탈 페이지"""
    return render_template('attrition.html')

@app.route('/datasets')
def datasets_page():
    """데이터셋 페이지"""
    return render_template('datasets.html')

@app.route('/comparison')
def comparison_page():
    """모델 비교 페이지"""
    return render_template('comparison.html')

@app.route('/xai')
def xai_page():
    """XAI 페이지"""
    return render_template('xai.html')

@app.route('/visualizations')
def visualizations_page():
    """시각화 페이지"""
    return render_template('visualizations.html')

if __name__ == '__main__':
    print("🚀 Starting FCA Test Server...")
    print("📊 Dashboard will be available at:")
    print("   - Local: http://localhost:5006")
    print("   - Network: http://0.0.0.0:5006")
    print("\nPress Ctrl+C to stop the server")
    
    app.run(host='0.0.0.0', port=5006, debug=True)