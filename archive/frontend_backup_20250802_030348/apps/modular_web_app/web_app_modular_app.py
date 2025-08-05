#!/usr/bin/env python3
"""
FCA 모듈화된 웹 애플리케이션
=========================

모듈화를 통해 재구성된 FCA 웹 애플리케이션입니다.
- 깔끔한 코드 구조
- 모듈 간 명확한 분리
- 유지보수성 향상
- 확장성 개선
"""

import sys
import os
from flask import Flask

# FCA 프로젝트 루트를 Python 경로에 추가
sys.path.insert(0, '/root/FCA')

# 모듈화된 컴포넌트 import
from apps.modular_web_app.config import current_config
from apps.modular_web_app.routes import (
    dashboard_page,
    fraud_page,
    sentiment_page,
    attrition_page,
    datasets_page,
    comparison_page
)
from apps.modular_web_app.api import (
    fraud_distribution_chart,
    fraud_performance_chart,
    sentiment_chart,
    attrition_chart,
    comparison_chart,
    dataset_overview_chart,
    system_summary,
    datasets_info,
    health_check,
    system_info
)


def create_app(config_name='default'):
    """Flask 애플리케이션 팩토리"""
    app = Flask(__name__)
    
    # 설정 로드
    app.config.from_object(current_config)
    
    # 페이지 라우트 등록
    register_page_routes(app)
    
    # API 라우트 등록
    register_api_routes(app)
    
    # 에러 핸들러 등록
    register_error_handlers(app)
    
    return app


def register_page_routes(app):
    """페이지 라우트 등록"""
    
    @app.route('/')
    def dashboard():
        """대시보드 페이지"""
        return dashboard_page()
    
    @app.route('/fraud')
    def fraud():
        """사기 탐지 페이지"""
        return fraud_page()
    
    @app.route('/sentiment')
    def sentiment():
        """감정 분석 페이지"""  
        return sentiment_page()
    
    @app.route('/attrition')
    def attrition():
        """고객 이탈 페이지"""
        return attrition_page()
    
    @app.route('/datasets')
    def datasets():
        """데이터셋 관리 페이지"""
        return datasets_page()
    
    @app.route('/comparison')
    def comparison():
        """모델 비교 페이지"""
        return comparison_page()


def register_api_routes(app):
    """API 라우트 등록"""
    
    # 차트 API
    @app.route('/api/chart/fraud-distribution')
    def api_fraud_distribution():
        return fraud_distribution_chart()
    
    @app.route('/api/chart/fraud-performance')
    def api_fraud_performance():
        return fraud_performance_chart()
    
    @app.route('/api/chart/sentiment')
    def api_sentiment():
        return sentiment_chart()
    
    @app.route('/api/chart/attrition')
    def api_attrition():
        return attrition_chart()
    
    @app.route('/api/chart/comparison')
    def api_comparison():
        return comparison_chart()
    
    @app.route('/api/chart/dataset-overview')
    def api_dataset_overview():
        return dataset_overview_chart()
    
    # 시스템 API
    @app.route('/api/summary')
    def api_summary():
        return system_summary()
    
    @app.route('/api/datasets')
    def api_datasets():
        return datasets_info()
    
    @app.route('/api/health')
    def api_health():
        return health_check()
    
    @app.route('/api/system/info')
    def api_system_info():
        return system_info()


def register_error_handlers(app):
    """에러 핸들러 등록"""
    
    @app.errorhandler(404)
    def not_found(error):
        from flask import jsonify
        return jsonify({
            'error': 'Page not found',
            'status_code': 404,
            'message': 'The requested resource was not found on this server.'
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        from flask import jsonify
        return jsonify({
            'error': 'Internal server error',
            'status_code': 500,
            'message': 'An internal server error occurred.'
        }), 500
    
    @app.errorhandler(Exception)
    def handle_exception(e):
        from flask import jsonify
        return jsonify({
            'error': 'Unexpected error',
            'status_code': 500,
            'message': str(e)
        }), 500


def print_startup_info():
    """시작 정보 출력"""
    config_info = current_config.get_startup_info()
    
    print("🚀 FCA 모듈화된 웹 애플리케이션 시작...")
    print(f"📱 애플리케이션: {config_info['app_name']} v{config_info['version']}")
    print(f"🌐 서버 주소: http://{config_info['host']}:{config_info['port']}")
    print(f"🔧 디버그 모드: {'ON' if config_info['debug'] else 'OFF'}")
    print(f"📁 데이터 루트: {config_info['data_root']}")
    print()
    print("🎯 사용 가능한 페이지:")
    print("   📊 / - Overview (대시보드)")
    print("   🛡️ /fraud - Fraud Detection (사기 탐지)")
    print("   💬 /sentiment - Sentiment Analysis (감정 분석)")
    print("   👥 /attrition - Customer Attrition (고객 이탈)")
    print("   📊 /datasets - Dataset Management (데이터셋 관리)")
    print("   ⚖️ /comparison - Model Comparison (모델 비교)")
    print()
    print("🔌 API 엔드포인트:")
    print("   📈 /api/chart/* - 차트 데이터")
    print("   📋 /api/summary - 시스템 요약")
    print("   💾 /api/datasets - 데이터셋 정보")
    print("   ❤️ /api/health - 헬스 체크")
    print("   🔧 /api/system/info - 시스템 정보")
    print()
    print("✨ 모듈화된 특징:")
    print("   ✅ 깔끔한 코드 구조")
    print("   ✅ 모듈 간 명확한 분리")
    print("   ✅ 유지보수성 향상")
    print("   ✅ 확장성 개선")
    print("   ✅ 에러 처리 강화")
    print()
    print("🔧 서버를 중지하려면 Ctrl+C를 누르세요")


if __name__ == '__main__':
    # 시작 정보 출력
    print_startup_info()
    
    # Flask 앱 생성 및 실행
    app = create_app()
    
    try:
        app.run(
            host=current_config.HOST,
            port=current_config.PORT,
            debug=current_config.DEBUG
        )
    except KeyboardInterrupt:
        print("\n👋 FCA 웹 애플리케이션이 종료되었습니다.")
    except Exception as e:
        print(f"\n❌ 애플리케이션 실행 중 오류 발생: {e}")
        sys.exit(1)