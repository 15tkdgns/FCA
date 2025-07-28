#!/usr/bin/env python3
"""
FCA Web Application - Minimal
============================

최소화된 Flask 애플리케이션 - 호출 기능만 담당
"""

import sys
import os
from pathlib import Path

# FCA 모듈 경로 추가
sys.path.append(str(Path(__file__).parent.parent))

from flask import Flask
from core.logging_manager import get_logger, log_api_calls
from core.module_loader import get_module_loader
from web_app.routes.route_manager import RouteManager
from web_app.middleware.request_middleware import RequestMiddleware

# 로거 설정
logger = get_logger("WebApp")

@log_api_calls()
def create_app():
    """최소화된 애플리케이션 팩토리"""
    
    logger.info("🚀 Starting FCA Web Application...")
    
    # Flask 앱 생성
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'fca-analysis-dashboard-2025'
    app.config['DEBUG'] = True
    
    # 모듈 로더 초기화
    module_loader = get_module_loader()
    logger.info("📦 Module loader initialized")
    
    # 미들웨어 설정
    middleware = RequestMiddleware(app)
    middleware.setup()
    logger.info("🔧 Middleware configured")
    
    # 라우트 매니저 설정
    route_manager = RouteManager(app, module_loader)
    route_manager.setup_routes()
    logger.info("🛣️  Routes configured")
    
    # 시스템 상태 로깅
    status = module_loader.get_system_status()
    logger.info("📊 System status", extra=status)
    
    return app

def main():
    """메인 실행 함수"""
    try:
        app = create_app()
        
        # 서버 정보 로깅
        logger.info("🌐 Starting web server...", extra={
            'host': '0.0.0.0',
            'port': 5003,
            'debug': True
        })
        
        print("📊 Dashboard will be available at:")
        print("   - Local: http://localhost:5003")
        print("   - Network: http://0.0.0.0:5003")
        print("\nPress Ctrl+C to stop the server")
        
        app.run(host='0.0.0.0', port=5003, debug=True)
        
    except KeyboardInterrupt:
        logger.info("🛑 Server stopped by user")
    except Exception as e:
        logger.critical(f"💥 Server failed to start: {e}")
        raise

if __name__ == '__main__':
    main()