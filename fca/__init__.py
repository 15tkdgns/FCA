"""
FCA (Fraud & Customer Analytics) 메인 패키지
==========================================

모듈화된 사기 탐지 및 고객 분석 시스템
"""

from .core import config, get_config, get_logger
from .data import DataProcessor, DataLoader
from .engines import FraudDetectionEngine
from .api import APIManager

__version__ = "2.0.0"
__author__ = "Advanced Analytics Team"

__all__ = [
    'config', 'get_config', 'get_logger',
    'DataProcessor', 'DataLoader',
    'FraudDetectionEngine',
    'APIManager'
]


def create_app():
    """FCA Flask 애플리케이션 팩토리"""
    from flask import Flask
    
    app = Flask(__name__)
    
    # 설정 적용
    app.config.update({
        'SECRET_KEY': config.security.secret_key,
        'DEBUG': config.debug,
        'MAX_CONTENT_LENGTH': config.security.max_request_size
    })
    
    # API 매니저 초기화
    api_manager = APIManager(app)
    
    return app, api_manager