"""
Core Module Package
===================

FCA 웹 애플리케이션의 핵심 모듈들을 정리한 패키지

모듈 구조:
- config: 설정 관리 모듈
- logging: 로깅 시스템 모듈  
- cache: 캐싱 시스템 모듈
- security: 보안 관련 모듈
- utils: 공통 유틸리티 모듈
"""

from .config import ConfigManager
from .logging import LoggingManager
from .cache import CacheManager
from .security import SecurityManager
from .utils import CoreUtils

__all__ = [
    'ConfigManager',
    'LoggingManager', 
    'CacheManager',
    'SecurityManager',
    'CoreUtils'
]

# 버전 정보
__version__ = '1.0.0'
__author__ = 'FCA Development Team'