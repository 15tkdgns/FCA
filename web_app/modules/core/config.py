"""
Configuration Manager Module
============================

애플리케이션 설정 관리를 위한 모듈
- 환경별 설정 관리
- 설정 검증
- 동적 설정 업데이트
- 보안 설정 처리
"""

import os
import json
import logging
from typing import Dict, Any, Optional, Union
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class DatabaseConfig:
    """데이터베이스 설정"""
    host: str = 'localhost'
    port: int = 5432
    name: str = 'fca_db'
    user: str = 'fca_user'
    password: str = ''
    ssl_mode: str = 'prefer'
    pool_size: int = 10
    pool_timeout: int = 30


@dataclass
class APIConfig:
    """API 설정"""
    host: str = '0.0.0.0'
    port: int = 5000
    debug: bool = False
    cors_enabled: bool = True
    cors_origins: list = field(default_factory=lambda: ['*'])
    rate_limit: str = '100/minute'
    timeout: int = 30
    max_content_length: int = 16 * 1024 * 1024  # 16MB


@dataclass
class CacheConfig:
    """캐시 설정"""
    type: str = 'memory'  # memory, redis, memcached
    host: str = 'localhost'
    port: int = 6379
    db: int = 0
    password: str = ''
    ttl: int = 300  # 5분
    max_size: int = 1000


@dataclass
class LoggingConfig:
    """로깅 설정"""
    level: str = 'INFO'
    format: str = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    file_enabled: bool = True
    file_path: str = 'logs/app.log'
    file_max_size: int = 10 * 1024 * 1024  # 10MB
    file_backup_count: int = 5
    console_enabled: bool = True


@dataclass
class SecurityConfig:
    """보안 설정"""
    secret_key: str = ''
    csrf_enabled: bool = True
    session_timeout: int = 3600  # 1시간
    password_min_length: int = 8
    max_login_attempts: int = 5
    lockout_duration: int = 900  # 15분


@dataclass
class MonitoringConfig:
    """모니터링 설정"""
    enabled: bool = True
    interval: int = 60  # 1분
    metrics_retention: int = 86400  # 24시간
    alert_thresholds: Dict[str, float] = field(default_factory=lambda: {
        'cpu_usage': 80.0,
        'memory_usage': 85.0,
        'disk_usage': 90.0,
        'error_rate': 5.0
    })


class ConfigManager:
    """설정 관리자 클래스"""
    
    def __init__(self, config_path: Optional[str] = None):
        self.config_path = config_path or os.path.join(os.getcwd(), 'config')
        self.environment = os.getenv('FLASK_ENV', 'development')
        
        # 설정 객체들
        self.database = DatabaseConfig()
        self.api = APIConfig()
        self.cache = CacheConfig()
        self.logging = LoggingConfig()
        self.security = SecurityConfig()
        self.monitoring = MonitoringConfig()
        
        self._load_config()
        self._validate_config()
    
    def _load_config(self):
        """설정 파일 로드"""
        try:
            # 기본 설정 로드
            self._load_from_file('default.json')
            
            # 환경별 설정 로드
            env_config = f'{self.environment}.json'
            self._load_from_file(env_config)
            
            # 환경 변수에서 설정 로드
            self._load_from_env()
            
            logging.info(f"Configuration loaded for environment: {self.environment}")
            
        except Exception as e:
            logging.warning(f"Failed to load configuration: {e}")
            logging.info("Using default configuration")
    
    def _load_from_file(self, filename: str):
        """JSON 파일에서 설정 로드"""
        file_path = Path(self.config_path) / filename
        
        if not file_path.exists():
            logging.debug(f"Config file not found: {file_path}")
            return
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                config_data = json.load(f)
            
            self._update_config_from_dict(config_data)
            logging.debug(f"Loaded config from: {file_path}")
            
        except Exception as e:
            logging.error(f"Failed to load config from {file_path}: {e}")
    
    def _load_from_env(self):
        """환경 변수에서 설정 로드"""
        env_mappings = {
            # Database
            'FCA_DB_HOST': ('database', 'host'),
            'FCA_DB_PORT': ('database', 'port', int),
            'FCA_DB_NAME': ('database', 'name'),
            'FCA_DB_USER': ('database', 'user'),
            'FCA_DB_PASSWORD': ('database', 'password'),
            
            # API
            'FCA_API_HOST': ('api', 'host'),
            'FCA_API_PORT': ('api', 'port', int),
            'FCA_API_DEBUG': ('api', 'debug', self._parse_bool),
            
            # Security
            'FCA_SECRET_KEY': ('security', 'secret_key'),
            'FCA_CSRF_ENABLED': ('security', 'csrf_enabled', self._parse_bool),
            
            # Logging
            'FCA_LOG_LEVEL': ('logging', 'level'),
            'FCA_LOG_FILE': ('logging', 'file_path'),
            
            # Cache
            'FCA_CACHE_TYPE': ('cache', 'type'),
            'FCA_CACHE_HOST': ('cache', 'host'),
            'FCA_CACHE_PORT': ('cache', 'port', int),
        }
        
        for env_var, config_path in env_mappings.items():
            value = os.getenv(env_var)
            if value is not None:
                self._set_config_value(config_path, value)
    
    def _update_config_from_dict(self, config_data: Dict[str, Any]):
        """딕셔너리에서 설정 업데이트"""
        for section, values in config_data.items():
            if hasattr(self, section) and isinstance(values, dict):
                config_obj = getattr(self, section)
                for key, value in values.items():
                    if hasattr(config_obj, key):
                        setattr(config_obj, key, value)
    
    def _set_config_value(self, config_path: tuple, value: str):
        """설정 값 설정"""
        section, key = config_path[:2]
        converter = config_path[2] if len(config_path) > 2 else str
        
        if hasattr(self, section):
            config_obj = getattr(self, section)
            if hasattr(config_obj, key):
                try:
                    converted_value = converter(value)
                    setattr(config_obj, key, converted_value)
                    logging.debug(f"Set config {section}.{key} = {converted_value}")
                except ValueError as e:
                    logging.error(f"Failed to convert config value {section}.{key}: {e}")
    
    def _parse_bool(self, value: str) -> bool:
        """문자열을 불린으로 변환"""
        return value.lower() in ('true', '1', 'yes', 'on')
    
    def _validate_config(self):
        """설정 검증"""
        errors = []
        
        # 필수 설정 확인
        if not self.security.secret_key:
            self.security.secret_key = os.urandom(24).hex()
            logging.warning("Generated random secret key")
        
        # 포트 번호 검증
        if not (1 <= self.api.port <= 65535):
            errors.append(f"Invalid API port: {self.api.port}")
        
        if not (1 <= self.database.port <= 65535):
            errors.append(f"Invalid database port: {self.database.port}")
        
        # 로그 레벨 검증
        valid_levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
        if self.logging.level.upper() not in valid_levels:
            errors.append(f"Invalid log level: {self.logging.level}")
        
        # 캐시 타입 검증
        valid_cache_types = ['memory', 'redis', 'memcached']
        if self.cache.type not in valid_cache_types:
            errors.append(f"Invalid cache type: {self.cache.type}")
        
        if errors:
            error_msg = "Configuration validation errors:\n" + "\n".join(errors)
            logging.error(error_msg)
            raise ValueError(error_msg)
        
        logging.info("Configuration validation passed")
    
    def get_database_url(self) -> str:
        """데이터베이스 URL 생성"""
        return (f"postgresql://{self.database.user}:{self.database.password}@"
                f"{self.database.host}:{self.database.port}/{self.database.name}")
    
    def get_redis_url(self) -> str:
        """Redis URL 생성"""
        auth = f":{self.cache.password}@" if self.cache.password else ""
        return f"redis://{auth}{self.cache.host}:{self.cache.port}/{self.cache.db}"
    
    def to_dict(self) -> Dict[str, Any]:
        """설정을 딕셔너리로 변환"""
        return {
            'database': self.database.__dict__,
            'api': self.api.__dict__,
            'cache': self.cache.__dict__,
            'logging': self.logging.__dict__,
            'security': {k: v for k, v in self.security.__dict__.items() 
                        if k != 'secret_key'},  # 보안상 secret_key 제외
            'monitoring': self.monitoring.__dict__,
            'environment': self.environment
        }
    
    def update_config(self, section: str, key: str, value: Any):
        """설정 동적 업데이트"""
        if hasattr(self, section):
            config_obj = getattr(self, section)
            if hasattr(config_obj, key):
                old_value = getattr(config_obj, key)
                setattr(config_obj, key, value)
                logging.info(f"Updated config {section}.{key}: {old_value} -> {value}")
            else:
                raise AttributeError(f"Config key not found: {section}.{key}")
        else:
            raise AttributeError(f"Config section not found: {section}")
    
    def save_config(self, filename: Optional[str] = None):
        """설정을 파일로 저장"""
        if filename is None:
            filename = f"{self.environment}.json"
        
        file_path = Path(self.config_path) / filename
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(self.to_dict(), f, indent=2, ensure_ascii=False)
            
            logging.info(f"Configuration saved to: {file_path}")
            
        except Exception as e:
            logging.error(f"Failed to save configuration: {e}")
            raise


# 전역 설정 인스턴스
config = ConfigManager()