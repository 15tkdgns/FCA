#!/usr/bin/env python3
"""
통합 로깅 관리자
==============

FCA 프로젝트의 모든 로깅을 중앙 집중식으로 관리
"""

import logging
import logging.handlers
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
from functools import wraps

from .config import get_config


class StructuredFormatter(logging.Formatter):
    """구조화된 JSON 로그 포맷터"""
    
    def format(self, record):
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        
        # 추가 컨텍스트 정보가 있으면 포함
        if hasattr(record, 'extra_data'):
            log_entry.update(record.extra_data)
            
        return json.dumps(log_entry, ensure_ascii=False)


class LoggingManager:
    """로깅 관리자"""
    
    def __init__(self):
        self.config = get_config()
        self._loggers: Dict[str, logging.Logger] = {}
        self._setup_root_logger()
    
    def _setup_root_logger(self):
        """루트 로거 설정"""
        root_logger = logging.getLogger()
        root_logger.setLevel(logging.DEBUG if self.config.debug else logging.INFO)
        
        # 기존 핸들러 제거
        for handler in root_logger.handlers[:]:
            root_logger.removeHandler(handler)
    
    def get_logger(self, name: str, 
                   log_to_file: bool = True,
                   log_to_console: bool = True,
                   structured: bool = True) -> logging.Logger:
        """로거 인스턴스 반환"""
        
        if name in self._loggers:
            return self._loggers[name]
        
        logger = logging.getLogger(name)
        logger.setLevel(logging.DEBUG if self.config.debug else logging.INFO)
        
        # 파일 핸들러
        if log_to_file:
            file_handler = logging.handlers.RotatingFileHandler(
                self.config.get_log_path(name),
                maxBytes=10*1024*1024,  # 10MB
                backupCount=5
            )
            
            if structured:
                file_handler.setFormatter(StructuredFormatter())
            else:
                file_handler.setFormatter(
                    logging.Formatter(
                        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
                    )
                )
            
            logger.addHandler(file_handler)
        
        # 콘솔 핸들러
        if log_to_console:
            console_handler = logging.StreamHandler()
            console_handler.setFormatter(
                logging.Formatter(
                    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
                )
            )
            logger.addHandler(console_handler)
        
        self._loggers[name] = logger
        return logger


# 글로벌 로깅 매니저 인스턴스
_logging_manager = LoggingManager()


def get_logger(name: str, **kwargs) -> logging.Logger:
    """로거 인스턴스 반환 - 편의 함수"""
    return _logging_manager.get_logger(name, **kwargs)


def setup_logging(debug: bool = False):
    """로깅 시스템 초기화"""
    level = logging.DEBUG if debug else logging.INFO
    logging.basicConfig(level=level)


def log_calls(logger_name: Optional[str] = None):
    """함수 호출을 로깅하는 데코레이터"""
    
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            nonlocal logger_name
            if logger_name is None:
                logger_name = func.__module__
            
            logger = get_logger(logger_name)
            
            start_time = datetime.utcnow()
            logger.debug(f"함수 {func.__name__} 시작", extra={
                'extra_data': {
                    'function': func.__name__,
                    'args_count': len(args),
                    'kwargs_count': len(kwargs)
                }
            })
            
            try:
                result = func(*args, **kwargs)
                execution_time = (datetime.utcnow() - start_time).total_seconds()
                
                logger.debug(f"함수 {func.__name__} 완료", extra={
                    'extra_data': {
                        'function': func.__name__,
                        'execution_time': execution_time,
                        'success': True
                    }
                })
                
                return result
                
            except Exception as e:
                execution_time = (datetime.utcnow() - start_time).total_seconds()
                
                logger.error(f"함수 {func.__name__} 오류: {str(e)}", extra={
                    'extra_data': {
                        'function': func.__name__,
                        'execution_time': execution_time,
                        'success': False,
                        'error': str(e),
                        'error_type': type(e).__name__
                    }
                })
                
                raise
        
        return wrapper
    return decorator