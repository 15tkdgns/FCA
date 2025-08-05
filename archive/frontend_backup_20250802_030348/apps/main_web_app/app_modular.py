#!/usr/bin/env python3
"""
FCA 웹 애플리케이션 (모듈화된 버전)
"""

import sys
import os
from flask import Flask, render_template

# 모듈 imports
sys.path.append('/root/FCA/apps/main_web_app')
sys.path.insert(0, '/root/FCA')

from config.app_config import SAMPLE_DATA, get_app_config
from routes.main_routes import register_main_routes
from routes.api_routes import register_api_routes

# FCA 엔진들 import
try:
    from fca.engines.fraud_detector import FraudDetector
    FRAUD_AVAILABLE = True
except ImportError as e:
    print(f"⚠️  Fraud Detector 로드 실패: {e}")
    FRAUD_AVAILABLE = False

try:
    from fca.engines.sentiment_analyzer import SentimentAnalyzer
    SENTIMENT_AVAILABLE = True
except ImportError as e:
    print(f"⚠️  Sentiment Analyzer 로드 실패: {e}")
    SENTIMENT_AVAILABLE = False

try:
    from fca.engines.attrition_predictor import AttritionPredictor
    ATTRITION_AVAILABLE = True
except ImportError as e:
    print(f"⚠️  Attrition Predictor 로드 실패: {e}")
    ATTRITION_AVAILABLE = False

print(f"✅ 사용 가능한 엔진: Fraud={FRAUD_AVAILABLE}, Sentiment={SENTIMENT_AVAILABLE}, Attrition={ATTRITION_AVAILABLE}")

def initialize_engines():
    """Initialize FCA engines"""
    print("🔧 FCA 엔진들을 초기화 중...")
    
    engines = [None, None, None]  # [fraud, sentiment, attrition]
    
    # Fraud Detector 초기화
    if FRAUD_AVAILABLE:
        try:
            engines[0] = FraudDetector()
            print("✅ Fraud Detector 초기화 완료")
        except Exception as e:
            print(f"❌ Fraud Detector 초기화 실패: {e}")
    
    # Sentiment Analyzer 초기화
    if SENTIMENT_AVAILABLE:
        try:
            engines[1] = SentimentAnalyzer()
            print("✅ Sentiment Analyzer 초기화 완료")
        except Exception as e:
            print(f"❌ Sentiment Analyzer 초기화 실패: {e}")
    
    # Attrition Predictor 초기화
    if ATTRITION_AVAILABLE:
        try:
            engines[2] = AttritionPredictor()
            print("✅ Attrition Predictor 초기화 완료")
        except Exception as e:
            print(f"❌ Attrition Predictor 초기화 실패: {e}")
    
    engines_count = sum(1 for engine in engines if engine)
    print(f"🎯 초기화된 엔진 수: {engines_count}/3")
    
    return engines

def create_app():
    """Create Flask application"""
    app = Flask(__name__)
    config = get_app_config()
    app.secret_key = config['SECRET_KEY']
    
    # Initialize engines
    engines = initialize_engines()
    
    # Register routes
    register_main_routes(app, SAMPLE_DATA)
    register_api_routes(app, SAMPLE_DATA, engines)
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return render_template('error.html', 
                             error_code=404,
                             error_message='Page not found'), 404
    
    @app.errorhandler(500) 
    def internal_error(error):
        return render_template('error.html',
                             error_code=500,
                             error_message='Internal server error'), 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    config = get_app_config()
    
    print("🚀 FCA 웹 애플리케이션 시작...")
    print("📱 브라우저에서 다음 URL로 접속하세요:")
    print("   http://localhost:5000")
    print("   http://127.0.0.1:5000")
    print("\n📊 사용 가능한 페이지:")
    print("   / - Unified Dashboard (통합 대시보드)")
    print("   /dashboard - 기본 대시보드")
    print("   /datasets - 데이터셋 관리")
    print("   /detection - 사기 탐지")
    print("   /sentiment - 감정 분석")
    print("   /comparison - 모델 비교")
    print("   /visualizations - 시각화")
    print("   /xai - 설명 가능한 AI")
    print("\n🔧 서버를 중지하려면 Ctrl+C를 누르세요")
    
    app.run(host=config['HOST'], port=config['PORT'], debug=config['DEBUG'])