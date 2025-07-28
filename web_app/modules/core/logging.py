"""
Logging Manager Module
======================

통합 로깅 시스템 관리 모듈
- 구조화된 로깅
- 다중 핸들러 지원
- 성능 로깅
- 보안 로깅
- 로그 회전 및 압축
"""

import os
import sys
import json
import logging
import logging.handlers
from datetime import datetime
from typing import Dict, Any, Optional, Union, List
from pathlib import Path
import threading
from contextlib import contextmanager


class StructuredFormatter(logging.Formatter):
    """구조화된 로그 포맷터"""
    
    def __init__(self, include_extra: bool = True):
        super().__init__()
        self.include_extra = include_extra
    
    def format(self, record: logging.LogRecord) -> str:
        """로그 레코드를 JSON 형태로 포맷"""
        log_data = {
            'timestamp': datetime.fromtimestamp(record.created).isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        
        # 예외 정보 포함
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
        
        # 추가 필드 포함
        if self.include_extra:
            extra_fields = {k: v for k, v in record.__dict__.items() 
                          if k not in log_data and not k.startswith('_')}
            if extra_fields:
                log_data['extra'] = extra_fields
        
        return json.dumps(log_data, ensure_ascii=False)


class PerformanceFilter(logging.Filter):
    """성능 관련 로그 필터"""
    
    def filter(self, record: logging.LogRecord) -> bool:
        """성능 관련 로그만 통과"""
        return hasattr(record, 'performance') or 'performance' in record.getMessage().lower()


class SecurityFilter(logging.Filter):
    """보안 관련 로그 필터"""
    
    def filter(self, record: logging.LogRecord) -> bool:
        """보안 관련 로그만 통과"""
        security_keywords = ['auth', 'login', 'security', 'access', 'permission', 'csrf']
        return (hasattr(record, 'security') or 
                any(keyword in record.getMessage().lower() for keyword in security_keywords))


class LoggingManager:
    """로깅 관리자 클래스"""
    
    def __init__(self, config=None):
        from .config import config as default_config
        self.config = config or default_config.logging
        
        self.loggers: Dict[str, logging.Logger] = {}
        self.handlers: Dict[str, logging.Handler] = {}
        self.filters: Dict[str, logging.Filter] = {}
        
        self._setup_logging()
    
    def _setup_logging(self):
        """로깅 시스템 초기화"""
        # 루트 로거 설정
        root_logger = logging.getLogger()
        root_logger.setLevel(getattr(logging, self.config.level.upper()))
        
        # 기존 핸들러 제거
        for handler in root_logger.handlers[:]:
            root_logger.removeHandler(handler)
        
        # 콘솔 핸들러 설정
        if self.config.console_enabled:
            self._setup_console_handler()
        
        # 파일 핸들러 설정
        if self.config.file_enabled:
            self._setup_file_handlers()
        
        # 특수 로거 설정
        self._setup_special_loggers()
    
    def _setup_console_handler(self):
        """콘솔 핸들러 설정"""
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.INFO)
        
        # 개발 환경에서는 읽기 쉬운 포맷, 프로덕션에서는 구조화된 포맷
        if os.getenv('FLASK_ENV') == 'development':
            console_formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
        else:
            console_formatter = StructuredFormatter()
        
        console_handler.setFormatter(console_formatter)
        
        logging.getLogger().addHandler(console_handler)
        self.handlers['console'] = console_handler
    
    def _setup_file_handlers(self):
        """파일 핸들러 설정"""
        # 로그 디렉토리 생성
        log_dir = Path(self.config.file_path).parent
        log_dir.mkdir(parents=True, exist_ok=True)
        
        # 메인 로그 파일 핸들러
        file_handler = logging.handlers.RotatingFileHandler(
            filename=self.config.file_path,
            maxBytes=self.config.file_max_size,
            backupCount=self.config.file_backup_count,
            encoding='utf-8'
        )
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(StructuredFormatter())
        
        logging.getLogger().addHandler(file_handler)
        self.handlers['file'] = file_handler
        
        # 에러 전용 로그 파일
        error_file = str(Path(self.config.file_path).with_suffix('.error.log'))
        error_handler = logging.handlers.RotatingFileHandler(
            filename=error_file,
            maxBytes=self.config.file_max_size,
            backupCount=self.config.file_backup_count,
            encoding='utf-8'
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(StructuredFormatter())
        
        logging.getLogger().addHandler(error_handler)
        self.handlers['error_file'] = error_handler
    
    def _setup_special_loggers(self):
        """특수 목적 로거 설정"""
        # 성능 로거
        self._setup_performance_logger()
        
        # 보안 로거
        self._setup_security_logger()
        
        # API 로거
        self._setup_api_logger()
    
    def _setup_performance_logger(self):
        """성능 로깅 설정"""
        perf_logger = logging.getLogger('fca.performance')
        perf_logger.setLevel(logging.INFO)
        
        # 성능 로그 파일 핸들러
        perf_file = str(Path(self.config.file_path).with_suffix('.performance.log'))
        perf_handler = logging.handlers.RotatingFileHandler(
            filename=perf_file,
            maxBytes=self.config.file_max_size,
            backupCount=self.config.file_backup_count,
            encoding='utf-8'
        )
        perf_handler.setFormatter(StructuredFormatter())
        perf_handler.addFilter(PerformanceFilter())
        
        perf_logger.addHandler(perf_handler)
        perf_logger.propagate = False
        
        self.loggers['performance'] = perf_logger
        self.handlers['performance_file'] = perf_handler
    
    def _setup_security_logger(self):
        """보안 로깅 설정"""
        security_logger = logging.getLogger('fca.security')
        security_logger.setLevel(logging.INFO)
        
        # 보안 로그 파일 핸들러
        security_file = str(Path(self.config.file_path).with_suffix('.security.log'))
        security_handler = logging.handlers.RotatingFileHandler(
            filename=security_file,
            maxBytes=self.config.file_max_size,
            backupCount=self.config.file_backup_count,
            encoding='utf-8'
        )
        security_handler.setFormatter(StructuredFormatter())
        security_handler.addFilter(SecurityFilter())
        
        security_logger.addHandler(security_handler)
        security_logger.propagate = False
        
        self.loggers['security'] = security_logger
        self.handlers['security_file'] = security_handler
    
    def _setup_api_logger(self):
        """API 로깅 설정"""
        api_logger = logging.getLogger('fca.api')
        api_logger.setLevel(logging.INFO)
        
        # API 로그 파일 핸들러
        api_file = str(Path(self.config.file_path).with_suffix('.api.log'))
        api_handler = logging.handlers.RotatingFileHandler(
            filename=api_file,
            maxBytes=self.config.file_max_size,
            backupCount=self.config.file_backup_count,
            encoding='utf-8'
        )
        api_handler.setFormatter(StructuredFormatter())
        
        api_logger.addHandler(api_handler)
        api_logger.propagate = False
        
        self.loggers['api'] = api_logger
        self.handlers['api_file'] = api_handler
    
    def get_logger(self, name: str = None) -> logging.Logger:
        """로거 인스턴스 반환"""
        if name is None:
            return logging.getLogger()
        
        if name in self.loggers:
            return self.loggers[name]
        
        # 새로운 로거 생성
        logger = logging.getLogger(f'fca.{name}')
        self.loggers[name] = logger
        return logger
    
    def log_performance(self, operation: str, duration: float, **kwargs):
        """성능 로그 기록"""
        perf_logger = self.get_logger('performance')
        perf_data = {
            'operation': operation,
            'duration_ms': round(duration * 1000, 2),
            'performance': True,
            **kwargs
        }
        perf_logger.info(f"Performance: {operation}", extra=perf_data)
    
    def log_security(self, event: str, level: str = 'INFO', **kwargs):
        """보안 로그 기록"""
        security_logger = self.get_logger('security')
        security_data = {
            'security_event': event,
            'security': True,
            **kwargs
        }
        
        log_level = getattr(logging, level.upper(), logging.INFO)
        security_logger.log(log_level, f"Security: {event}", extra=security_data)
    
    def log_api_request(self, method: str, endpoint: str, status_code: int, 
                       duration: float, **kwargs):
        """API 요청 로그 기록"""
        api_logger = self.get_logger('api')
        api_data = {
            'method': method,
            'endpoint': endpoint,
            'status_code': status_code,
            'duration_ms': round(duration * 1000, 2),
            'api_request': True,
            **kwargs
        }
        
        level = logging.ERROR if status_code >= 500 else logging.WARNING if status_code >= 400 else logging.INFO
        api_logger.log(level, f"API {method} {endpoint} - {status_code}", extra=api_data)
    
    @contextmanager
    def performance_context(self, operation: str, **kwargs):
        """성능 측정 컨텍스트 매니저"""
        start_time = datetime.now()
        try:
            yield
        finally:
            duration = (datetime.now() - start_time).total_seconds()
            self.log_performance(operation, duration, **kwargs)
    
    def configure_logger(self, name: str, level: str = None, 
                        file_path: str = None, **kwargs):
        """로거 개별 설정"""
        logger = self.get_logger(name)
        
        if level:
            logger.setLevel(getattr(logging, level.upper()))
        
        if file_path:
            # 기존 파일 핸들러 제거
            for handler in logger.handlers[:]:
                if isinstance(handler, logging.FileHandler):
                    logger.removeHandler(handler)
            
            # 새 파일 핸들러 추가
            file_handler = logging.handlers.RotatingFileHandler(
                filename=file_path,
                maxBytes=kwargs.get('max_size', self.config.file_max_size),
                backupCount=kwargs.get('backup_count', self.config.file_backup_count),
                encoding='utf-8'
            )
            file_handler.setFormatter(StructuredFormatter())
            logger.addHandler(file_handler)
    
    def set_log_level(self, level: str, logger_name: str = None):
        """로그 레벨 동적 변경"""
        log_level = getattr(logging, level.upper())
        
        if logger_name:
            logger = self.get_logger(logger_name)
            logger.setLevel(log_level)
        else:
            logging.getLogger().setLevel(log_level)
            
        self.get_logger().info(f"Log level changed to {level} for {logger_name or 'root'}")
    
    def get_log_stats(self) -> Dict[str, Any]:
        """로깅 통계 반환"""
        stats = {
            'handlers': len(self.handlers),
            'loggers': len(self.loggers),
            'root_level': logging.getLogger().level,
            'handler_details': {}
        }
        
        for name, handler in self.handlers.items():
            if isinstance(handler, logging.FileHandler):
                try:
                    file_size = os.path.getsize(handler.baseFilename)
                    stats['handler_details'][name] = {
                        'type': 'file',
                        'file': handler.baseFilename,
                        'size_bytes': file_size,
                        'level': handler.level
                    }
                except (AttributeError, OSError):
                    stats['handler_details'][name] = {
                        'type': 'file',
                        'level': handler.level
                    }
            else:
                stats['handler_details'][name] = {
                    'type': type(handler).__name__,
                    'level': handler.level
                }
        
        return stats
    
    def cleanup(self):
        """로깅 시스템 정리"""
        for handler in self.handlers.values():
            handler.close()
        
        for logger in self.loggers.values():
            for handler in logger.handlers[:]:
                logger.removeHandler(handler)
        
        self.handlers.clear()
        self.loggers.clear()


# 전역 로깅 매니저 인스턴스
logging_manager = LoggingManager()