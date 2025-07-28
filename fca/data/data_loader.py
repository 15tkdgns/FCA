#!/usr/bin/env python3
"""
통합 데이터 로더
=============

모든 데이터셋 로딩을 중앙 집중식으로 관리
"""

import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Optional, Union
import json

from ..core import get_logger, get_config, log_calls

logger = get_logger("DataLoader")
config = get_config()


class DataLoader:
    """
    통합 데이터 로더 클래스
    
    주요 기능:
    - 다양한 데이터셋 형식 지원 (CSV, JSON, Excel)
    - 자동 데이터 타입 감지 및 변환
    - 데이터 검증 및 정제
    - 메모리 효율적인 대용량 데이터 처리
    """
    
    def __init__(self):
        self.data_root = config.data_root
        self.cache = {}
        self._supported_formats = {'.csv', '.json', '.xlsx', '.xls', '.parquet'}
    
    @log_calls()
    def load_dataset(self, dataset_name: str, **kwargs) -> pd.DataFrame:
        """
        데이터셋 로드
        
        Args:
            dataset_name: 데이터셋 이름 또는 경로
            **kwargs: pandas 로딩 옵션
            
        Returns:
            pd.DataFrame: 로드된 데이터프레임
        """
        # 캐시 확인
        cache_key = f"{dataset_name}_{hash(str(kwargs))}"
        if cache_key in self.cache:
            logger.info(f"캐시에서 데이터셋 반환: {dataset_name}")
            return self.cache[cache_key].copy()
        
        # 파일 경로 결정
        file_path = self._resolve_file_path(dataset_name)
        
        if not file_path.exists():
            raise FileNotFoundError(f"데이터셋 파일을 찾을 수 없습니다: {file_path}")
        
        # 파일 형식에 따른 로딩
        df = self._load_by_format(file_path, **kwargs)
        
        # 기본 정제
        df = self._basic_cleanup(df)
        
        # 캐시 저장
        self.cache[cache_key] = df.copy()
        
        logger.info(f"데이터셋 로드 완료: {dataset_name}, 형태: {df.shape}")
        return df
    
    def _resolve_file_path(self, dataset_name: str) -> Path:
        """데이터셋 이름으로부터 파일 경로 해결"""
        # 절대 경로인 경우
        if Path(dataset_name).is_absolute():
            return Path(dataset_name)
        
        # 상대 경로인 경우
        if '/' in dataset_name or '\\' in dataset_name:
            return self.data_root / dataset_name
        
        # 데이터셋 이름으로 검색
        possible_paths = [
            self.data_root / dataset_name,
            self.data_root / f"{dataset_name}.csv",
            self.data_root / f"{dataset_name}_processed.csv",
        ]
        
        # 서브디렉토리에서 검색
        for subdir in self.data_root.iterdir():
            if subdir.is_dir():
                possible_paths.extend([
                    subdir / f"{dataset_name}.csv",
                    subdir / f"{dataset_name}_processed.csv",
                ])
        
        for path in possible_paths:
            if path.exists():
                return path
        
        raise FileNotFoundError(f"데이터셋을 찾을 수 없습니다: {dataset_name}")
    
    def _load_by_format(self, file_path: Path, **kwargs) -> pd.DataFrame:
        """파일 형식에 따른 로딩"""
        suffix = file_path.suffix.lower()
        
        if suffix == '.csv':
            return pd.read_csv(file_path, **kwargs)
        elif suffix == '.json':
            return pd.read_json(file_path, **kwargs)
        elif suffix in ['.xlsx', '.xls']:
            return pd.read_excel(file_path, **kwargs)
        elif suffix == '.parquet':
            return pd.read_parquet(file_path, **kwargs)
        else:
            raise ValueError(f"지원하지 않는 파일 형식: {suffix}")
    
    def _basic_cleanup(self, df: pd.DataFrame) -> pd.DataFrame:
        """기본 데이터 정제"""
        # 공백 컬럼명 정리
        df.columns = df.columns.str.strip()
        
        # 중복 행 제거
        initial_rows = len(df)
        df = df.drop_duplicates()
        if len(df) < initial_rows:
            logger.info(f"중복 행 {initial_rows - len(df)}개 제거")
        
        # 공백 문자열을 NaN으로 변환
        df = df.replace(r'^\s*$', np.nan, regex=True)
        
        return df
    
    @log_calls()
    def get_dataset_info(self, dataset_name: str) -> Dict[str, Any]:
        """데이터셋 정보 반환"""
        df = self.load_dataset(dataset_name)
        
        info = {
            'shape': df.shape,
            'columns': list(df.columns),
            'dtypes': df.dtypes.to_dict(),
            'memory_usage': f"{df.memory_usage(deep=True).sum() / 1024 / 1024:.2f} MB",
            'missing_values': df.isnull().sum().to_dict(),
            'numeric_columns': list(df.select_dtypes(include=[np.number]).columns),
            'categorical_columns': list(df.select_dtypes(include=['object']).columns),
        }
        
        # 숫자형 컬럼 통계
        if info['numeric_columns']:
            info['numeric_stats'] = df[info['numeric_columns']].describe().to_dict()
        
        return info
    
    @log_calls()
    def list_available_datasets(self) -> List[str]:
        """사용 가능한 데이터셋 목록 반환"""
        datasets = []
        
        for file_path in self.data_root.rglob('*'):
            if file_path.suffix.lower() in self._supported_formats:
                # 데이터 루트 기준 상대 경로
                relative_path = file_path.relative_to(self.data_root)
                datasets.append(str(relative_path))
        
        return sorted(datasets)
    
    def clear_cache(self):
        """캐시 클리어"""
        self.cache.clear()
        logger.info("데이터 캐시 클리어 완료")
    
    def get_cache_info(self) -> Dict[str, Any]:
        """캐시 정보 반환"""
        total_memory = sum(
            df.memory_usage(deep=True).sum() 
            for df in self.cache.values() 
            if isinstance(df, pd.DataFrame)
        )
        
        return {
            'cached_datasets': len(self.cache),
            'total_memory_mb': total_memory / 1024 / 1024,
            'dataset_names': list(self.cache.keys())
        }