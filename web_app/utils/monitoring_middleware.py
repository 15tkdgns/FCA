#!/usr/bin/env python3
"""
Monitoring Middleware
====================

Flask 애플리케이션의 모든 요청을 모니터링하는 미들웨어
- 요청/응답 시간 측정
- 에러 추적
- 시스템 모니터링과 통합
"""

import time
from flask import request, g
from functools import wraps

from core.logging_manager import get_logger
from web_app.utils.system_monitor import global_monitor

logger = get_logger("MonitoringMiddleware")


class MonitoringMiddleware:
    """Flask 애플리케이션 모니터링 미들웨어"""
    
    def __init__(self, app=None):
        self.app = app
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Flask 앱에 미들웨어 등록"""
        app.before_request(self.before_request)
        app.after_request(self.after_request)
        app.teardown_appcontext(self.teardown_request)
        
        # 모니터링 시작
        global_monitor.start_monitoring()
        
        logger.info("📊 Monitoring middleware initialized")
    
    def before_request(self):
        """요청 시작 시 호출"""
        g.start_time = time.time()
        g.request_id = f"req_{int(time.time())}_{id(request)}"
        
        # 요청 정보 로깅
        logger.debug(f"🔄 Request started: {request.method} {request.path}")
        
    def after_request(self, response):
        """응답 완료 시 호출"""
        if hasattr(g, 'start_time'):
            duration_ms = (time.time() - g.start_time) * 1000
            
            # 에러 메시지 추출
            error_message = None
            if response.status_code >= 400:
                try:
                    if response.is_json:
                        data = response.get_json()
                        error_message = data.get('message') or data.get('error')
                except:
                    error_message = f"HTTP {response.status_code}"
            
            # 모니터링 시스템에 추적 정보 전송
            global_monitor.track_api_request(
                endpoint=request.path,
                method=request.method,
                status_code=response.status_code,
                duration_ms=duration_ms,
                error_message=error_message
            )
            
            # 성능 로깅
            if duration_ms > 1000:  # 1초 이상
                logger.warning(f"🐌 Slow request: {request.method} {request.path} ({duration_ms:.1f}ms)")
            elif response.status_code >= 400:
                logger.warning(f"❌ Error response: {request.method} {request.path} - {response.status_code}")
            else:
                logger.debug(f"✅ Request completed: {request.method} {request.path} ({duration_ms:.1f}ms)")
        
        return response
    
    def teardown_request(self, exception):
        """요청 정리 시 호출"""
        if exception:
            # 예외 발생 시 추가 로깅
            if hasattr(g, 'start_time'):
                duration_ms = (time.time() - g.start_time) * 1000
                
                global_monitor.track_api_request(
                    endpoint=request.path,
                    method=request.method,
                    status_code=500,
                    duration_ms=duration_ms,
                    error_message=str(exception)
                )
            
            logger.error(f"💥 Request exception: {request.method} {request.path} - {exception}")


def monitor_function(func):
    """함수 실행 시간 모니터링 데코레이터"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        function_name = f"{func.__module__}.{func.__name__}"
        
        try:
            result = func(*args, **kwargs)
            duration_ms = (time.time() - start_time) * 1000
            
            if duration_ms > 100:  # 100ms 이상인 경우만 로깅
                logger.debug(f"⏱️ Function timing: {function_name} ({duration_ms:.1f}ms)")
            
            return result
            
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            logger.error(f"❌ Function error: {function_name} ({duration_ms:.1f}ms) - {e}")
            raise
            
    return wrapper


def monitor_api_endpoint(category: str = "api"):
    """API 엔드포인트 모니터링 데코레이터"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            endpoint = request.path
            method = request.method
            
            try:
                response = func(*args, **kwargs)
                duration_ms = (time.time() - start_time) * 1000
                
                # Flask Response 객체인지 확인
                if hasattr(response, 'status_code'):
                    status_code = response.status_code
                else:
                    # 튜플 형태의 응답 (data, status_code)
                    if isinstance(response, tuple) and len(response) >= 2:
                        status_code = response[1]
                    else:
                        status_code = 200
                
                logger.info(f"📡 API call: {method} {endpoint} - {status_code} ({duration_ms:.1f}ms)")
                return response
                
            except Exception as e:
                duration_ms = (time.time() - start_time) * 1000
                logger.error(f"❌ API error: {method} {endpoint} ({duration_ms:.1f}ms) - {e}")
                raise
                
        return wrapper
    return decorator