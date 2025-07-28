#!/usr/bin/env python3
"""
Logging Manager
==============

FCA 프로젝트의 통합 로깅 시스템
"""

import logging
import logging.handlers
import os
import json
import datetime
from typing import Dict, Any, Optional
from pathlib import Path
from functools import wraps
import traceback


class FCALogger:
    """FCA 프로젝트 전용 로거"""
    
    def __init__(self, name: str = "FCA", log_level: str = "INFO"):
        self.name = name
        self.logger = logging.getLogger(name)
        self.log_level = getattr(logging, log_level.upper())
        
        # 로그 디렉토리 생성
        self.log_dir = Path("/root/FCA/logs")
        self.log_dir.mkdir(exist_ok=True)
        
        self._setup_logger()
    
    def _setup_logger(self):
        """로거 설정"""
        self.logger.setLevel(self.log_level)
        
        # 기존 핸들러 제거
        for handler in self.logger.handlers[:]:
            self.logger.removeHandler(handler)
        
        # 포맷터 설정
        formatter = logging.Formatter(
            '%(asctime)s | %(name)s | %(levelname)s | %(module)s:%(funcName)s:%(lineno)d | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        
        # 콘솔 핸들러
        console_handler = logging.StreamHandler()
        console_handler.setLevel(self.log_level)
        console_handler.setFormatter(formatter)
        self.logger.addHandler(console_handler)
        
        # 파일 핸들러 (일별 로테이션)
        file_handler = logging.handlers.TimedRotatingFileHandler(
            self.log_dir / f"{self.name.lower()}.log",
            when='midnight',
            interval=1,
            backupCount=30,
            encoding='utf-8'
        )
        file_handler.setLevel(self.log_level)
        file_handler.setFormatter(formatter)
        self.logger.addHandler(file_handler)
        
        # JSON 로그 핸들러 (구조화된 로그)
        json_handler = logging.handlers.TimedRotatingFileHandler(
            self.log_dir / f"{self.name.lower()}_structured.log",
            when='midnight',
            interval=1,
            backupCount=30,
            encoding='utf-8'
        )
        json_handler.setLevel(self.log_level)
        json_handler.setFormatter(JSONFormatter())
        self.logger.addHandler(json_handler)
    
    def info(self, message: str, extra: Optional[Dict[str, Any]] = None):
        """정보 로그"""
        self.logger.info(message, extra=extra or {})
    
    def warning(self, message: str, extra: Optional[Dict[str, Any]] = None):
        """경고 로그"""
        self.logger.warning(message, extra=extra or {})
    
    def error(self, message: str, extra: Optional[Dict[str, Any]] = None):
        """에러 로그"""
        self.logger.error(message, extra=extra or {})
    
    def debug(self, message: str, extra: Optional[Dict[str, Any]] = None):
        """디버그 로그"""
        self.logger.debug(message, extra=extra or {})
    
    def critical(self, message: str, extra: Optional[Dict[str, Any]] = None):
        """심각한 에러 로그"""
        self.logger.critical(message, extra=extra or {})
    
    def log_function_call(self, func_name: str, args: tuple = (), kwargs: Dict = None, 
                         result: Any = None, duration: float = None, error: Exception = None):
        """함수 호출 로깅"""
        log_data = {
            'function': func_name,
            'args_count': len(args),
            'kwargs_keys': list(kwargs.keys()) if kwargs else [],
            'duration_ms': round(duration * 1000, 2) if duration else None,
            'success': error is None,
            'error_type': type(error).__name__ if error else None,
            'error_message': str(error) if error else None
        }
        
        if error:
            self.error(f"Function call failed: {func_name}", extra=log_data)
        else:
            self.info(f"Function call: {func_name}", extra=log_data)
    
    def log_api_call(self, endpoint: str, method: str, status_code: int, 
                    duration: float, user_agent: str = None, ip: str = None):
        """API 호출 로깅"""
        log_data = {
            'endpoint': endpoint,
            'method': method,
            'status_code': status_code,
            'duration_ms': round(duration * 1000, 2),
            'user_agent': user_agent,
            'client_ip': ip,
            'success': 200 <= status_code < 400
        }
        
        if status_code >= 400:
            self.warning(f"API call failed: {method} {endpoint}", extra=log_data)
        else:
            self.info(f"API call: {method} {endpoint}", extra=log_data)
    
    def log_model_operation(self, operation: str, model_name: str, 
                           data_shape: tuple = None, performance: Dict = None,
                           duration: float = None, error: Exception = None):
        """모델 연산 로깅"""
        log_data = {
            'operation': operation,
            'model_name': model_name,
            'data_shape': data_shape,
            'performance': performance,
            'duration_ms': round(duration * 1000, 2) if duration else None,
            'success': error is None,
            'error_type': type(error).__name__ if error else None
        }
        
        if error:
            self.error(f"Model operation failed: {operation} on {model_name}", extra=log_data)
        else:
            self.info(f"Model operation: {operation} on {model_name}", extra=log_data)


class JSONFormatter(logging.Formatter):
    """JSON 형식 로그 포맷터"""
    
    def format(self, record):
        log_entry = {
            'timestamp': datetime.datetime.fromtimestamp(record.created).isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
            'message': record.getMessage()
        }
        
        # extra 데이터 추가
        if hasattr(record, '__dict__'):
            for key, value in record.__dict__.items():
                if key not in ['name', 'msg', 'args', 'levelname', 'levelno', 'pathname', 
                              'filename', 'module', 'lineno', 'funcName', 'created', 'msecs',
                              'relativeCreated', 'thread', 'threadName', 'processName', 
                              'process', 'getMessage', 'exc_info', 'exc_text', 'stack_info']:
                    log_entry[key] = value
        
        return json.dumps(log_entry, ensure_ascii=False, default=str)


def log_calls(logger: Optional[FCALogger] = None):
    """함수 호출 로깅 데코레이터"""
    if logger is None:
        logger = get_logger()
    
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            import time
            start_time = time.time()
            error = None
            result = None
            
            try:
                result = func(*args, **kwargs)
                return result
            except Exception as e:
                error = e
                raise
            finally:
                duration = time.time() - start_time
                logger.log_function_call(
                    func_name=f"{func.__module__}.{func.__name__}",
                    args=args,
                    kwargs=kwargs,
                    result=result,
                    duration=duration,
                    error=error
                )
        
        return wrapper
    return decorator


def log_api_calls(logger: Optional[FCALogger] = None):
    """API 호출 로깅 데코레이터"""
    if logger is None:
        logger = get_logger()
    
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            import time
            
            start_time = time.time()
            status_code = 200
            
            try:
                result = func(*args, **kwargs)
                if hasattr(result, 'status_code'):
                    status_code = result.status_code
                return result
            except Exception as e:
                status_code = 500
                raise
            finally:
                duration = time.time() - start_time
                
                # Flask 컨텍스트 안에서만 request 정보 로깅
                try:
                    from flask import request, has_request_context
                    if has_request_context():
                        logger.log_api_call(
                            endpoint=getattr(request, 'endpoint', '') or getattr(request, 'path', ''),
                            method=getattr(request, 'method', ''),
                            status_code=status_code,
                            duration=duration,
                            user_agent=request.headers.get('User-Agent') if hasattr(request, 'headers') else None,
                            ip=getattr(request, 'remote_addr', None)
                        )
                    else:
                        # 컨텍스트 외부에서는 간단한 로깅
                        logger.log_function_call(
                            func_name=f"{func.__module__}.{func.__name__}",
                            duration=duration
                        )
                except ImportError:
                    # Flask 없는 환경에서는 함수 호출 로깅만
                    logger.log_function_call(
                        func_name=f"{func.__module__}.{func.__name__}",
                        duration=duration
                    )
        
        return wrapper
    return decorator


def log_model_ops(logger: Optional[FCALogger] = None):
    """모델 연산 로깅 데코레이터"""
    if logger is None:
        logger = get_logger()
    
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            import time
            start_time = time.time()
            error = None
            
            try:
                result = func(self, *args, **kwargs)
                
                # 성능 메트릭 추출
                performance = None
                if hasattr(result, 'metrics') and result.metrics:
                    if hasattr(result.metrics, 'to_dict'):
                        performance = result.metrics.to_dict()
                
                # 데이터 형태 추출
                data_shape = None
                if args and hasattr(args[0], 'shape'):
                    data_shape = args[0].shape
                
                return result
            except Exception as e:
                error = e
                raise
            finally:
                duration = time.time() - start_time
                logger.log_model_operation(
                    operation=func.__name__,
                    model_name=getattr(self, 'name', self.__class__.__name__),
                    data_shape=data_shape,
                    performance=performance,
                    duration=duration,
                    error=error
                )
        
        return wrapper
    return decorator


# 글로벌 로거 인스턴스
_global_logger = None

def get_logger(name: str = "FCA", log_level: str = "INFO") -> FCALogger:
    """글로벌 로거 인스턴스 반환"""
    global _global_logger
    if _global_logger is None:
        _global_logger = FCALogger(name, log_level)
    return _global_logger

def set_log_level(level: str):
    """로그 레벨 설정"""
    logger = get_logger()
    logger.log_level = getattr(logging, level.upper())
    logger._setup_logger()

# 편의 함수들
def info(message: str, extra: Optional[Dict[str, Any]] = None):
    get_logger().info(message, extra)

def warning(message: str, extra: Optional[Dict[str, Any]] = None):
    get_logger().warning(message, extra)

def error(message: str, extra: Optional[Dict[str, Any]] = None):
    get_logger().error(message, extra)

def debug(message: str, extra: Optional[Dict[str, Any]] = None):
    get_logger().debug(message, extra)

def critical(message: str, extra: Optional[Dict[str, Any]] = None):
    get_logger().critical(message, extra)