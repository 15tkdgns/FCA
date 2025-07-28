#!/usr/bin/env python3
"""
Error Handler Utility
=====================

FCA 웹 애플리케이션의 통합 에러 처리 시스템
- 구조화된 에러 로깅
- 사용자 친화적 에러 메시지
- 에러 분류 및 심각도 관리
- 디버깅 정보 수집
"""

import logging
import traceback
import time
from datetime import datetime
from typing import Dict, Any, Optional
from enum import Enum
from functools import wraps

# 에러 심각도 레벨
class ErrorSeverity(Enum):
    LOW = "low"           # 경미한 오류 (캐시 미스, 선택적 기능 실패)
    MEDIUM = "medium"     # 중간 오류 (API 지연, 일부 데이터 누락)
    HIGH = "high"         # 심각한 오류 (API 실패, 페이지 로딩 실패)
    CRITICAL = "critical" # 치명적 오류 (시스템 다운, 보안 문제)

# 에러 카테고리
class ErrorCategory(Enum):
    API = "api"                    # API 관련 오류
    DATABASE = "database"          # 데이터베이스 오류
    NETWORK = "network"           # 네트워크 연결 오류
    VALIDATION = "validation"     # 데이터 검증 오류
    PERMISSION = "permission"     # 권한 관련 오류
    SYSTEM = "system"             # 시스템 리소스 오류
    USER_INPUT = "user_input"     # 사용자 입력 오류
    EXTERNAL = "external"         # 외부 서비스 오류

class ErrorHandler:
    """통합 에러 처리 클래스"""
    
    def __init__(self, logger_name: str = "FCA_ErrorHandler"):
        self.logger = logging.getLogger(logger_name)
        self.error_count = {}  # 에러 발생 횟수 추적
        
    def log_error(self, 
                  error: Exception,
                  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
                  category: ErrorCategory = ErrorCategory.SYSTEM,
                  context: Optional[Dict[str, Any]] = None,
                  user_message: Optional[str] = None) -> Dict[str, Any]:
        """
        구조화된 에러 로깅
        
        Args:
            error: 발생한 예외
            severity: 에러 심각도
            category: 에러 카테고리
            context: 추가 컨텍스트 정보
            user_message: 사용자에게 표시할 메시지
            
        Returns:
            에러 정보 딕셔너리
        """
        error_id = f"{category.value}_{int(time.time())}"
        timestamp = datetime.now().isoformat()
        
        # 에러 발생 횟수 추적
        error_key = f"{category.value}_{type(error).__name__}"
        self.error_count[error_key] = self.error_count.get(error_key, 0) + 1
        
        error_info = {
            "error_id": error_id,
            "timestamp": timestamp,
            "severity": severity.value,
            "category": category.value,
            "error_type": type(error).__name__,
            "message": str(error),
            "user_message": user_message or self._get_user_friendly_message(category, error),
            "context": context or {},
            "traceback": traceback.format_exc() if severity in [ErrorSeverity.HIGH, ErrorSeverity.CRITICAL] else None,
            "occurrence_count": self.error_count[error_key]
        }
        
        # 심각도에 따른 로그 레벨 결정
        log_level = self._get_log_level(severity)
        self.logger.log(log_level, f"🚨 {severity.value.upper()} ERROR [{error_id}]: {str(error)}", 
                       extra={"error_details": error_info})
        
        return error_info
    
    def _get_log_level(self, severity: ErrorSeverity) -> int:
        """심각도에 따른 로그 레벨 반환"""
        level_map = {
            ErrorSeverity.LOW: logging.INFO,
            ErrorSeverity.MEDIUM: logging.WARNING,
            ErrorSeverity.HIGH: logging.ERROR,
            ErrorSeverity.CRITICAL: logging.CRITICAL
        }
        return level_map.get(severity, logging.WARNING)
    
    def _get_user_friendly_message(self, category: ErrorCategory, error: Exception) -> str:
        """사용자 친화적 에러 메시지 생성"""
        
        friendly_messages = {
            ErrorCategory.API: {
                "ConnectionError": "서버 연결에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
                "Timeout": "요청 시간이 초과되었습니다. 네트워크 상태를 확인해주세요.",
                "JSONDecodeError": "데이터 처리 중 오류가 발생했습니다.",
                "default": "API 요청 처리 중 오류가 발생했습니다."
            },
            ErrorCategory.DATABASE: {
                "FileNotFoundError": "필요한 데이터 파일을 찾을 수 없습니다.",
                "PermissionError": "데이터 파일에 접근할 수 없습니다.",
                "default": "데이터 처리 중 문제가 발생했습니다."
            },
            ErrorCategory.NETWORK: {
                "ConnectionError": "인터넷 연결을 확인해주세요.",
                "DNSError": "서버 주소를 확인할 수 없습니다.",
                "default": "네트워크 연결에 문제가 있습니다."
            },
            ErrorCategory.VALIDATION: {
                "ValueError": "입력된 데이터 형식이 올바르지 않습니다.",
                "TypeError": "데이터 타입이 일치하지 않습니다.",
                "default": "입력 데이터를 확인해주세요."
            },
            ErrorCategory.SYSTEM: {
                "MemoryError": "시스템 메모리가 부족합니다.",
                "FileNotFoundError": "필요한 파일을 찾을 수 없습니다.",
                "default": "시스템 오류가 발생했습니다."
            },
            ErrorCategory.USER_INPUT: {
                "default": "입력하신 정보를 다시 확인해주세요."
            },
            ErrorCategory.EXTERNAL: {
                "default": "외부 서비스 연결에 문제가 있습니다."
            }
        }
        
        error_type = type(error).__name__
        category_messages = friendly_messages.get(category, {})
        return category_messages.get(error_type, category_messages.get("default", "예상치 못한 오류가 발생했습니다."))

def handle_api_errors(category: ErrorCategory = ErrorCategory.API):
    """API 함수용 에러 핸들링 데코레이터"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            error_handler = ErrorHandler()
            try:
                return func(*args, **kwargs)
            except Exception as e:
                error_info = error_handler.log_error(
                    error=e,
                    severity=ErrorSeverity.HIGH,
                    category=category,
                    context={
                        "function": func.__name__,
                        "args": str(args)[:200],  # 처음 200자만
                        "kwargs": str(kwargs)[:200]
                    }
                )
                
                # Flask JSON 응답 형태로 반환
                from flask import jsonify
                return jsonify({
                    "status": "error",
                    "error_id": error_info["error_id"],
                    "message": error_info["user_message"],
                    "timestamp": error_info["timestamp"],
                    "details": str(e) if error_handler.logger.level <= logging.DEBUG else None
                }), 500
                
        return wrapper
    return decorator

def create_error_response(error_info: Dict[str, Any], http_code: int = 500) -> tuple:
    """표준화된 에러 응답 생성"""
    response_data = {
        "status": "error",
        "error_id": error_info["error_id"],
        "message": error_info["user_message"],
        "timestamp": error_info["timestamp"],
        "category": error_info["category"],
        "severity": error_info["severity"]
    }
    
    # 디버그 모드에서만 상세 정보 포함
    if logging.getLogger().level <= logging.DEBUG:
        response_data["details"] = {
            "error_type": error_info["error_type"],
            "technical_message": error_info["message"],
            "context": error_info["context"]
        }
    
    try:
        from flask import jsonify
        return jsonify(response_data), http_code
    except RuntimeError:
        # Flask 컨텍스트 밖에서 호출된 경우
        import json
        return json.dumps(response_data), http_code

# 전역 에러 핸들러 인스턴스
global_error_handler = ErrorHandler()

# 편의 함수들
def log_api_error(error: Exception, context: Dict[str, Any] = None) -> Dict[str, Any]:
    """API 에러 로깅 편의 함수"""
    return global_error_handler.log_error(
        error=error,
        severity=ErrorSeverity.HIGH,
        category=ErrorCategory.API,
        context=context
    )

def log_data_error(error: Exception, context: Dict[str, Any] = None) -> Dict[str, Any]:
    """데이터 처리 에러 로깅 편의 함수"""
    return global_error_handler.log_error(
        error=error,
        severity=ErrorSeverity.MEDIUM,
        category=ErrorCategory.DATABASE,
        context=context
    )

def log_system_error(error: Exception, context: Dict[str, Any] = None) -> Dict[str, Any]:
    """시스템 에러 로깅 편의 함수"""
    return global_error_handler.log_error(
        error=error,
        severity=ErrorSeverity.CRITICAL,
        category=ErrorCategory.SYSTEM,
        context=context
    )