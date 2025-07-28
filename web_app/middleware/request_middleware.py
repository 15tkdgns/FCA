#!/usr/bin/env python3
"""
Request Middleware
=================

요청 처리 미들웨어
"""

import time
from flask import Flask, request, g
from datetime import datetime

from core.logging_manager import get_logger

logger = get_logger("RequestMiddleware")


class RequestMiddleware:
    """요청 처리 미들웨어"""
    
    def __init__(self, app: Flask):
        self.app = app
    
    def setup(self):
        """미들웨어 설정"""
        
        @self.app.before_request
        def before_request():
            """요청 전 처리"""
            g.start_time = time.time()
            g.request_id = f"{int(time.time() * 1000)}-{id(request)}"
            
            # 요청 로깅
            logger.info("🔄 Request started", extra={
                'request_id': g.request_id,
                'method': request.method,
                'path': request.path,
                'user_agent': request.headers.get('User-Agent', ''),
                'client_ip': request.remote_addr,
                'timestamp': datetime.now().isoformat()
            })
        
        @self.app.after_request
        def after_request(response):
            """요청 후 처리"""
            duration = time.time() - g.get('start_time', time.time())
            
            # 응답 로깅
            logger.info("✅ Request completed", extra={
                'request_id': g.get('request_id', 'unknown'),
                'status_code': response.status_code,
                'duration_ms': round(duration * 1000, 2),
                'content_length': response.content_length,
                'timestamp': datetime.now().isoformat()
            })
            
            # CORS 헤더 추가
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            
            # 보안 헤더 추가
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['X-Frame-Options'] = 'DENY'
            response.headers['X-XSS-Protection'] = '1; mode=block'
            
            return response
        
        @self.app.teardown_request
        def teardown_request(exception):
            """요청 정리"""
            if exception:
                logger.error("💥 Request failed", extra={
                    'request_id': g.get('request_id', 'unknown'),
                    'exception': str(exception),
                    'timestamp': datetime.now().isoformat()
                })
        
        logger.info("🔧 Request middleware configured")