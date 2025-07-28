"""
Security Manager Module
=======================

보안 관련 기능 통합 관리 모듈
- 입력 검증 및 새니타이제이션
- CSRF 보호
- 레이트 리미팅
- 보안 헤더 설정
- 세션 관리
"""

import re
import hmac
import hashlib
import secrets
import time
from typing import Dict, Any, Optional, List, Union
from datetime import datetime, timedelta
from functools import wraps
import logging
from urllib.parse import urlparse
import html


class InputValidator:
    """입력 검증 클래스"""
    
    # 정규식 패턴들
    PATTERNS = {
        'email': re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'),
        'phone': re.compile(r'^[\+]?[1-9][\d]{0,15}$'),
        'alphanumeric': re.compile(r'^[a-zA-Z0-9]+$'),
        'safe_string': re.compile(r'^[a-zA-Z0-9\s\-_.]+$'),
        'sql_injection': re.compile(r'(union|select|insert|delete|update|drop|create|alter|exec|script)', re.IGNORECASE),
        'xss': re.compile(r'(<script|javascript:|on\w+\s*=)', re.IGNORECASE)
    }
    
    @classmethod
    def validate_email(cls, email: str) -> bool:
        """이메일 형식 검증"""
        return bool(cls.PATTERNS['email'].match(email))
    
    @classmethod
    def validate_phone(cls, phone: str) -> bool:
        """전화번호 형식 검증"""
        return bool(cls.PATTERNS['phone'].match(phone))
    
    @classmethod
    def is_safe_string(cls, text: str) -> bool:
        """안전한 문자열 검증"""
        return bool(cls.PATTERNS['safe_string'].match(text))
    
    @classmethod
    def has_sql_injection(cls, text: str) -> bool:
        """SQL 인젝션 패턴 검출"""
        return bool(cls.PATTERNS['sql_injection'].search(text))
    
    @classmethod
    def has_xss(cls, text: str) -> bool:
        """XSS 패턴 검출"""
        return bool(cls.PATTERNS['xss'].search(text))
    
    @classmethod
    def sanitize_html(cls, text: str) -> str:
        """HTML 이스케이프"""
        return html.escape(text)
    
    @classmethod
    def validate_length(cls, text: str, min_len: int = 0, max_len: int = 1000) -> bool:
        """길이 검증"""
        return min_len <= len(text) <= max_len
    
    @classmethod
    def validate_url(cls, url: str) -> bool:
        """URL 형식 검증"""
        try:
            result = urlparse(url)
            return all([result.scheme, result.netloc])
        except Exception:
            return False


class CSRFProtection:
    """CSRF 보호 클래스"""
    
    def __init__(self, secret_key: str):
        self.secret_key = secret_key.encode() if isinstance(secret_key, str) else secret_key
    
    def generate_token(self, session_id: str) -> str:
        """CSRF 토큰 생성"""
        timestamp = str(int(time.time()))
        nonce = secrets.token_hex(16)
        
        # HMAC 서명 생성
        message = f"{session_id}:{timestamp}:{nonce}"
        signature = hmac.new(
            self.secret_key,
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return f"{timestamp}:{nonce}:{signature}"
    
    def validate_token(self, token: str, session_id: str, max_age: int = 3600) -> bool:
        """CSRF 토큰 검증"""
        try:
            timestamp_str, nonce, signature = token.split(':', 2)
            timestamp = int(timestamp_str)
            
            # 토큰 만료 확인
            if time.time() - timestamp > max_age:
                return False
            
            # 서명 검증
            message = f"{session_id}:{timestamp_str}:{nonce}"
            expected_signature = hmac.new(
                self.secret_key,
                message.encode(),
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(signature, expected_signature)
            
        except (ValueError, TypeError):
            return False


class RateLimiter:
    """레이트 리미터 클래스"""
    
    def __init__(self):
        self.requests = {}  # {client_id: [(timestamp, count), ...]}
        self.cleanup_interval = 3600  # 1시간마다 정리
        self.last_cleanup = time.time()
    
    def _cleanup_old_entries(self):
        """오래된 요청 기록 정리"""
        now = time.time()
        if now - self.last_cleanup > self.cleanup_interval:
            cutoff_time = now - 3600  # 1시간 전
            
            for client_id in list(self.requests.keys()):
                self.requests[client_id] = [
                    (timestamp, count) for timestamp, count in self.requests[client_id]
                    if timestamp > cutoff_time
                ]
                
                if not self.requests[client_id]:
                    del self.requests[client_id]
            
            self.last_cleanup = now
    
    def is_allowed(self, client_id: str, limit: int, window: int = 3600) -> bool:
        """요청 허용 여부 확인"""
        self._cleanup_old_entries()
        
        now = time.time()
        window_start = now - window
        
        if client_id not in self.requests:
            self.requests[client_id] = []
        
        # 윈도우 내 요청 수 계산
        current_requests = sum(
            count for timestamp, count in self.requests[client_id]
            if timestamp > window_start
        )
        
        if current_requests >= limit:
            return False
        
        # 새 요청 기록
        self.requests[client_id].append((now, 1))
        return True
    
    def get_remaining(self, client_id: str, limit: int, window: int = 3600) -> int:
        """남은 요청 횟수"""
        if client_id not in self.requests:
            return limit
        
        now = time.time()
        window_start = now - window
        
        current_requests = sum(
            count for timestamp, count in self.requests[client_id]
            if timestamp > window_start
        )
        
        return max(0, limit - current_requests)


class SessionManager:
    """세션 관리 클래스"""
    
    def __init__(self, secret_key: str, timeout: int = 3600):
        self.secret_key = secret_key
        self.timeout = timeout
        self.sessions = {}  # {session_id: session_data}
    
    def create_session(self, user_data: Dict[str, Any]) -> str:
        """세션 생성"""
        session_id = secrets.token_urlsafe(32)
        
        session_data = {
            'id': session_id,
            'user': user_data,
            'created_at': datetime.now(),
            'last_activity': datetime.now(),
            'csrf_token': secrets.token_hex(16)
        }
        
        self.sessions[session_id] = session_data
        return session_id
    
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """세션 조회"""
        if session_id not in self.sessions:
            return None
        
        session = self.sessions[session_id]
        
        # 세션 만료 확인
        if self._is_expired(session):
            del self.sessions[session_id]
            return None
        
        # 활동 시간 업데이트
        session['last_activity'] = datetime.now()
        return session
    
    def update_session(self, session_id: str, data: Dict[str, Any]) -> bool:
        """세션 업데이트"""
        if session_id not in self.sessions:
            return False
        
        session = self.sessions[session_id]
        if self._is_expired(session):
            del self.sessions[session_id]
            return False
        
        session.update(data)
        session['last_activity'] = datetime.now()
        return True
    
    def delete_session(self, session_id: str) -> bool:
        """세션 삭제"""
        if session_id in self.sessions:
            del self.sessions[session_id]
            return True
        return False
    
    def _is_expired(self, session: Dict[str, Any]) -> bool:
        """세션 만료 여부"""
        last_activity = session['last_activity']
        return (datetime.now() - last_activity).total_seconds() > self.timeout
    
    def cleanup_expired_sessions(self):
        """만료된 세션 정리"""
        expired_sessions = [
            session_id for session_id, session in self.sessions.items()
            if self._is_expired(session)
        ]
        
        for session_id in expired_sessions:
            del self.sessions[session_id]
        
        return len(expired_sessions)


class SecurityManager:
    """보안 관리자 클래스"""
    
    def __init__(self, config=None):
        from .config import config as default_config
        self.config = config or default_config.security
        
        self.logger = logging.getLogger('fca.security')
        
        # 보안 컴포넌트 초기화
        self.csrf = CSRFProtection(self.config.secret_key)
        self.rate_limiter = RateLimiter()
        self.session_manager = SessionManager(
            self.config.secret_key,
            self.config.session_timeout
        )
        
        # 실패한 로그인 시도 추적
        self.failed_attempts = {}  # {ip: [(timestamp, count), ...]}
    
    def validate_input(self, data: Dict[str, Any], rules: Dict[str, Dict]) -> Dict[str, Any]:
        """입력 데이터 검증"""
        errors = {}
        cleaned_data = {}
        
        for field, value in data.items():
            if field not in rules:
                continue
            
            rule = rules[field]
            
            # 필수 필드 확인
            if rule.get('required', False) and not value:
                errors[field] = 'This field is required'
                continue
            
            if not value and not rule.get('required', False):
                cleaned_data[field] = value
                continue
            
            # 타입 검증
            expected_type = rule.get('type', str)
            if not isinstance(value, expected_type):
                try:
                    value = expected_type(value)
                except (ValueError, TypeError):
                    errors[field] = f'Invalid type, expected {expected_type.__name__}'
                    continue
            
            # 길이 검증
            if 'min_length' in rule or 'max_length' in rule:
                min_len = rule.get('min_length', 0)
                max_len = rule.get('max_length', 1000)
                if not InputValidator.validate_length(str(value), min_len, max_len):
                    errors[field] = f'Length must be between {min_len} and {max_len}'
                    continue
            
            # 패턴 검증
            if 'pattern' in rule:
                pattern = rule['pattern']
                if pattern == 'email' and not InputValidator.validate_email(value):
                    errors[field] = 'Invalid email format'
                    continue
                elif pattern == 'phone' and not InputValidator.validate_phone(value):
                    errors[field] = 'Invalid phone format'
                    continue
                elif pattern == 'safe_string' and not InputValidator.is_safe_string(value):
                    errors[field] = 'Contains invalid characters'
                    continue
            
            # 보안 검사
            if isinstance(value, str):
                if InputValidator.has_sql_injection(value):
                    errors[field] = 'Potentially unsafe content detected'
                    self.logger.warning(f"SQL injection attempt detected in field {field}")
                    continue
                
                if InputValidator.has_xss(value):
                    errors[field] = 'Potentially unsafe content detected'
                    self.logger.warning(f"XSS attempt detected in field {field}")
                    continue
                
                # HTML 이스케이프
                if rule.get('sanitize', True):
                    value = InputValidator.sanitize_html(value)
            
            cleaned_data[field] = value
        
        return {'data': cleaned_data, 'errors': errors, 'valid': len(errors) == 0}
    
    def check_rate_limit(self, client_id: str, endpoint: str) -> Dict[str, Any]:
        """레이트 리미트 확인"""
        # 엔드포인트별 제한 설정
        limits = {
            '/api/login': (5, 300),     # 5회/5분
            '/api/register': (3, 3600), # 3회/1시간
            '/api/': (100, 3600),       # 일반 API: 100회/1시간
            'default': (1000, 3600)     # 기본: 1000회/1시간
        }
        
        # 매칭되는 제한 찾기
        limit_key = 'default'
        for pattern, limit_info in limits.items():
            if endpoint.startswith(pattern):
                limit_key = pattern
                break
        
        limit, window = limits[limit_key]
        
        # 제한 확인
        allowed = self.rate_limiter.is_allowed(client_id, limit, window)
        remaining = self.rate_limiter.get_remaining(client_id, limit, window)
        
        if not allowed:
            self.logger.warning(f"Rate limit exceeded for {client_id} on {endpoint}")
        
        return {
            'allowed': allowed,
            'limit': limit,
            'remaining': remaining,
            'window': window,
            'retry_after': window if not allowed else None
        }
    
    def track_failed_login(self, ip_address: str) -> bool:
        """실패한 로그인 추적"""
        now = time.time()
        window = 900  # 15분
        
        if ip_address not in self.failed_attempts:
            self.failed_attempts[ip_address] = []
        
        # 오래된 기록 정리
        self.failed_attempts[ip_address] = [
            timestamp for timestamp in self.failed_attempts[ip_address]
            if now - timestamp < window
        ]
        
        # 새 실패 기록
        self.failed_attempts[ip_address].append(now)
        
        # 잠금 여부 확인
        is_locked = len(self.failed_attempts[ip_address]) >= self.config.max_login_attempts
        
        if is_locked:
            self.logger.warning(f"IP {ip_address} locked due to {self.config.max_login_attempts} failed login attempts")
        
        return is_locked
    
    def is_ip_locked(self, ip_address: str) -> bool:
        """IP 잠금 상태 확인"""
        if ip_address not in self.failed_attempts:
            return False
        
        now = time.time()
        window = self.config.lockout_duration
        
        # 잠금 해제 시간이 지났는지 확인
        recent_attempts = [
            timestamp for timestamp in self.failed_attempts[ip_address]
            if now - timestamp < window
        ]
        
        return len(recent_attempts) >= self.config.max_login_attempts
    
    def clear_failed_attempts(self, ip_address: str):
        """실패한 로그인 기록 클리어"""
        if ip_address in self.failed_attempts:
            del self.failed_attempts[ip_address]
    
    def get_security_headers(self) -> Dict[str, str]:
        """보안 헤더 반환"""
        return {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.plot.ly https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https:; connect-src 'self';",
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
        }
    
    def generate_csrf_token(self, session_id: str) -> str:
        """CSRF 토큰 생성"""
        return self.csrf.generate_token(session_id)
    
    def validate_csrf_token(self, token: str, session_id: str) -> bool:
        """CSRF 토큰 검증"""
        return self.csrf.validate_token(token, session_id)
    
    def audit_log(self, event: str, user_id: str = None, ip_address: str = None, 
                  details: Dict[str, Any] = None):
        """보안 감사 로그"""
        from .logging import logging_manager
        
        audit_data = {
            'event': event,
            'user_id': user_id,
            'ip_address': ip_address,
            'timestamp': datetime.now().isoformat(),
            'details': details or {}
        }
        
        logging_manager.log_security(
            f"Security audit: {event}",
            level='INFO',
            **audit_data
        )
    
    def get_security_stats(self) -> Dict[str, Any]:
        """보안 통계"""
        now = time.time()
        recent_window = 3600  # 1시간
        
        # 최근 실패한 로그인 시도
        recent_failed_attempts = 0
        locked_ips = 0
        
        for ip, attempts in self.failed_attempts.items():
            recent_attempts = [t for t in attempts if now - t < recent_window]
            recent_failed_attempts += len(recent_attempts)
            
            if len(recent_attempts) >= self.config.max_login_attempts:
                locked_ips += 1
        
        return {
            'failed_login_attempts_1h': recent_failed_attempts,
            'locked_ips': locked_ips,
            'active_sessions': len(self.session_manager.sessions),
            'rate_limit_clients': len(self.rate_limiter.requests),
            'config': {
                'max_login_attempts': self.config.max_login_attempts,
                'lockout_duration': self.config.lockout_duration,
                'session_timeout': self.config.session_timeout
            }
        }


# 전역 보안 관리자 인스턴스
security_manager = SecurityManager()