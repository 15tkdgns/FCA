#!/usr/bin/env python3
"""
FCA 공통 설정 모듈
================

모든 모듈에서 사용하는 공통 설정을 중앙 집중식으로 관리
"""

import os
from pathlib import Path
from typing import Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class DatabaseConfig:
    """데이터베이스 설정"""
    host: str = "localhost"
    port: int = 5432
    database: str = "fca_db"
    username: str = "fca_user"
    password: str = ""
    

@dataclass  
class CacheConfig:
    """캐시 설정"""
    redis_host: str = "localhost"
    redis_port: int = 6379
    cache_ttl: int = 3600
    enable_cache: bool = True


@dataclass
class ModelConfig:
    """ML 모델 설정"""
    default_contamination: float = 0.1
    n_estimators: int = 100
    random_state: int = 42
    max_samples: str = "auto"


@dataclass
class SecurityConfig:
    """보안 설정"""
    secret_key: str = "fca-analysis-dashboard-2025"
    token_expiry: int = 3600
    max_request_size: int = 16 * 1024 * 1024  # 16MB
    

class Config:
    """FCA 메인 설정 클래스"""
    
    def __init__(self):
        self.project_root = Path(__file__).parent.parent.parent
        self.data_root = self.project_root / "data"
        self.logs_root = self.project_root / "logs"
        self.models_root = self.project_root / "models"
        
        # 환경별 설정
        self.debug = os.getenv('FCA_DEBUG', 'False').lower() == 'true'
        self.environment = os.getenv('FCA_ENV', 'development')
        
        # 각 모듈별 설정
        self.database = DatabaseConfig()
        self.cache = CacheConfig()
        self.model = ModelConfig()
        self.security = SecurityConfig()
        
        # 디렉토리 생성
        self._ensure_directories()
    
    def _ensure_directories(self):
        """필요한 디렉토리들 생성"""
        for directory in [self.data_root, self.logs_root, self.models_root]:
            directory.mkdir(parents=True, exist_ok=True)
    
    def get_data_path(self, dataset_name: str) -> Path:
        """데이터셋 경로 반환"""
        return self.data_root / dataset_name
    
    def get_log_path(self, log_name: str) -> Path:
        """로그 파일 경로 반환"""
        return self.logs_root / f"{log_name}.log"
    
    def get_model_path(self, model_name: str) -> Path:
        """모델 파일 경로 반환"""
        return self.models_root / f"{model_name}.pkl"


# 글로벌 설정 인스턴스
config = Config()


def get_config() -> Config:
    """설정 인스턴스 반환"""
    return config