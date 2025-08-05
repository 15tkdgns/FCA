"""
애플리케이션 설정 모듈
====================

FCA 웹 애플리케이션의 모든 설정을 관리합니다.
- Flask 앱 설정
- 데이터베이스 설정
- 로깅 설정
- 개발/프로덕션 환경 설정
"""

import os
from datetime import datetime


class Config:
    """기본 설정 클래스"""
    
    # Flask 기본 설정
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'fca-modular-web-app-2025'
    DEBUG = True
    
    # 애플리케이션 정보
    APP_NAME = 'FCA Analysis Dashboard'
    APP_VERSION = '2.0.0'
    APP_DESCRIPTION = 'Financial Crime Analysis Dashboard'
    
    # 데이터 경로 설정
    DATA_ROOT = os.environ.get('DATA_ROOT') or '/root/FCA/data'
    
    # 서버 설정
    HOST = os.environ.get('HOST') or '0.0.0.0'
    PORT = int(os.environ.get('PORT') or 5002)
    
    # 로깅 설정
    LOG_LEVEL = os.environ.get('LOG_LEVEL') or 'INFO'
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    # 캐시 설정
    CACHE_TIMEOUT = int(os.environ.get('CACHE_TIMEOUT') or 300)  # 5분
    
    # API 설정
    API_PREFIX = '/api'
    API_VERSION = 'v1'
    
    # CORS 설정
    CORS_ORIGINS = ['http://localhost:5002', 'http://127.0.0.1:5002']
    
    # 페이지네이션 설정
    ITEMS_PER_PAGE = 50
    
    # 차트 설정
    CHART_DEFAULT_HEIGHT = 400
    CHART_DEFAULT_TEMPLATE = 'plotly_white'
    
    @classmethod
    def get_startup_info(cls):
        """시작 정보 반환"""
        return {
            'app_name': cls.APP_NAME,
            'version': cls.APP_VERSION,
            'host': cls.HOST,
            'port': cls.PORT,
            'debug': cls.DEBUG,
            'data_root': cls.DATA_ROOT,
            'startup_time': datetime.now().isoformat()
        }


class DevelopmentConfig(Config):
    """개발 환경 설정"""
    DEBUG = True
    TESTING = False
    LOG_LEVEL = 'DEBUG'


class ProductionConfig(Config):
    """프로덕션 환경 설정"""
    DEBUG = False
    TESTING = False
    SECRET_KEY = os.environ.get('SECRET_KEY', 'fca-production-key-change-me')
    LOG_LEVEL = 'WARNING'


class TestingConfig(Config):
    """테스트 환경 설정"""
    DEBUG = True
    TESTING = True
    WTF_CSRF_ENABLED = False
    LOG_LEVEL = 'DEBUG'


# 환경별 설정 매핑
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}


def get_config(environment='default'):
    """환경에 따른 설정 반환"""
    return config.get(environment, config['default'])


# 현재 설정
current_config = get_config(os.environ.get('FLASK_ENV', 'default'))