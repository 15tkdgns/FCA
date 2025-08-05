#!/usr/bin/env python3
"""
Dataset Loader Module
====================

통합된 데이터셋 로딩 및 관리 모듈
- Kaggle API, KaggleHub 지원
- 자동 에러 핸들링 및 재시도
- 데이터 검증 및 샘플링
- 메타데이터 생성 및 저장
"""

import os
import json
import time
import pandas as pd
from typing import Dict, Any, Optional, Tuple, List
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatasetLoader:
    """통합 데이터셋 로더"""
    
    def __init__(self, base_data_dir: str = "/root/FCA/data"):
        self.base_data_dir = Path(base_data_dir)
        self.supported_methods = ['kagglehub', 'kaggle', 'local', 'url']
        
    def load_dataset(
        self,
        dataset_config: Dict[str, Any],
        sample_size: Optional[int] = None,
        force_reload: bool = False
    ) -> Tuple[Optional[pd.DataFrame], Dict[str, Any]]:
        """
        통합 데이터셋 로딩
        
        Args:
            dataset_config: 데이터셋 설정
            sample_size: 샘플 크기 (None이면 전체)
            force_reload: 강제 재로딩
            
        Returns:
            (DataFrame, metadata) 튜플
        """
        
        dataset_name = dataset_config.get('name', 'unknown')
        method = dataset_config.get('method', 'kagglehub')
        
        logger.info(f"🔄 Loading dataset: {dataset_name} using {method}")
        
        # 캐시된 데이터 확인
        if not force_reload:
            cached_data, cached_meta = self._load_cached_data(dataset_name)
            if cached_data is not None:
                logger.info(f"✅ Loaded cached data: {cached_data.shape}")
                return cached_data, cached_meta
        
        # 방법별 로딩
        try:
            if method == 'kagglehub':
                return self._load_with_kagglehub(dataset_config, sample_size)
            elif method == 'kaggle':
                return self._load_with_kaggle(dataset_config, sample_size)
            elif method == 'local':
                return self._load_local_file(dataset_config, sample_size)
            elif method == 'url':
                return self._load_from_url(dataset_config, sample_size)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
        except Exception as e:
            logger.error(f"❌ Failed to load {dataset_name}: {e}")
            return None, {"error": str(e), "status": "failed"}
    
    def _load_with_kagglehub(
        self, 
        config: Dict[str, Any], 
        sample_size: Optional[int]
    ) -> Tuple[Optional[pd.DataFrame], Dict[str, Any]]:
        """KaggleHub를 사용한 데이터 로딩"""
        
        try:
            import kagglehub
            from kagglehub import KaggleDatasetAdapter
            
            dataset_id = config['kaggle_id']
            dataset_name = config['name']
            file_paths = config.get('file_paths', [''])
            
            logger.info(f"📊 Loading {dataset_id} via KaggleHub")
            
            # 여러 파일 경로 시도
            for file_path in file_paths:
                try:
                    start_time = time.time()
                    
                    pandas_kwargs = {'low_memory': False}
                    if sample_size:
                        pandas_kwargs['nrows'] = sample_size
                    
                    df = kagglehub.load_dataset(
                        KaggleDatasetAdapter.PANDAS,
                        dataset_id,
                        file_path,
                        pandas_kwargs=pandas_kwargs
                    )
                    
                    loading_time = time.time() - start_time
                    
                    # 메타데이터 생성
                    metadata = self._generate_metadata(
                        df, dataset_name, 'kagglehub', 
                        loading_time, file_path, config
                    )
                    
                    # 캐시 저장
                    self._save_cached_data(dataset_name, df, metadata)
                    
                    logger.info(f"✅ Successfully loaded {file_path}: {df.shape}")
                    return df, metadata
                    
                except Exception as e:
                    logger.warning(f"⚠️ Failed with file_path '{file_path}': {e}")
                    continue
            
            raise Exception("All file paths failed")
            
        except Exception as e:
            logger.error(f"❌ KaggleHub loading failed: {e}")
            return None, {"error": str(e), "method": "kagglehub"}
    
    def _load_with_kaggle(
        self, 
        config: Dict[str, Any], 
        sample_size: Optional[int]
    ) -> Tuple[Optional[pd.DataFrame], Dict[str, Any]]:
        """Kaggle API를 사용한 데이터 로딩"""
        
        try:
            import kaggle
            
            dataset_id = config['kaggle_id']
            dataset_name = config['name']
            
            # 다운로드 디렉토리 생성
            download_dir = self.base_data_dir / dataset_name
            download_dir.mkdir(parents=True, exist_ok=True)
            
            logger.info(f"📥 Downloading {dataset_id} via Kaggle API")
            start_time = time.time()
            
            kaggle.api.dataset_download_files(
                dataset_id, 
                path=str(download_dir), 
                unzip=True
            )
            
            # CSV 파일 찾기
            csv_files = list(download_dir.glob("*.csv"))
            if not csv_files:
                raise Exception("No CSV files found after download")
            
            # 첫 번째 CSV 파일 로드
            df = pd.read_csv(csv_files[0], nrows=sample_size)
            loading_time = time.time() - start_time
            
            metadata = self._generate_metadata(
                df, dataset_name, 'kaggle', 
                loading_time, str(csv_files[0]), config
            )
            
            self._save_cached_data(dataset_name, df, metadata)
            
            logger.info(f"✅ Kaggle API loading successful: {df.shape}")
            return df, metadata
            
        except Exception as e:
            logger.error(f"❌ Kaggle API loading failed: {e}")
            return None, {"error": str(e), "method": "kaggle"}
    
    def _load_local_file(
        self, 
        config: Dict[str, Any], 
        sample_size: Optional[int]
    ) -> Tuple[Optional[pd.DataFrame], Dict[str, Any]]:
        """로컬 파일 로딩"""
        
        try:
            file_path = config['file_path']
            dataset_name = config['name']
            
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"File not found: {file_path}")
            
            logger.info(f"📁 Loading local file: {file_path}")
            start_time = time.time()
            
            df = pd.read_csv(file_path, nrows=sample_size)
            loading_time = time.time() - start_time
            
            metadata = self._generate_metadata(
                df, dataset_name, 'local', 
                loading_time, file_path, config
            )
            
            logger.info(f"✅ Local file loading successful: {df.shape}")
            return df, metadata
            
        except Exception as e:
            logger.error(f"❌ Local file loading failed: {e}")
            return None, {"error": str(e), "method": "local"}
    
    def _load_from_url(
        self, 
        config: Dict[str, Any], 
        sample_size: Optional[int]
    ) -> Tuple[Optional[pd.DataFrame], Dict[str, Any]]:
        """URL에서 데이터 로딩"""
        
        try:
            url = config['url']
            dataset_name = config['name']
            
            logger.info(f"🌐 Loading from URL: {url}")
            start_time = time.time()
            
            df = pd.read_csv(url, nrows=sample_size)
            loading_time = time.time() - start_time
            
            metadata = self._generate_metadata(
                df, dataset_name, 'url', 
                loading_time, url, config
            )
            
            self._save_cached_data(dataset_name, df, metadata)
            
            logger.info(f"✅ URL loading successful: {df.shape}")
            return df, metadata
            
        except Exception as e:
            logger.error(f"❌ URL loading failed: {e}")
            return None, {"error": str(e), "method": "url"}
    
    def _generate_metadata(
        self, 
        df: pd.DataFrame, 
        dataset_name: str, 
        method: str, 
        loading_time: float, 
        source: str, 
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """메타데이터 생성"""
        
        return {
            "dataset_name": dataset_name,
            "method": method,
            "source": source,
            "shape": df.shape,
            "columns": list(df.columns),
            "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
            "memory_usage_mb": df.memory_usage(deep=True).sum() / 1024**2,
            "loading_time_seconds": loading_time,
            "null_counts": df.isnull().sum().to_dict(),
            "sample_stats": {
                "numeric_columns": len(df.select_dtypes(include=['number']).columns),
                "categorical_columns": len(df.select_dtypes(include=['object']).columns),
                "total_missing": df.isnull().sum().sum(),
                "missing_percentage": (df.isnull().sum().sum() / (df.shape[0] * df.shape[1])) * 100
            },
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "status": "success",
            "config": config
        }
    
    def _save_cached_data(self, dataset_name: str, df: pd.DataFrame, metadata: Dict[str, Any]):
        """캐시된 데이터 저장"""
        
        try:
            cache_dir = self.base_data_dir / dataset_name
            cache_dir.mkdir(parents=True, exist_ok=True)
            
            # 데이터 저장
            data_path = cache_dir / f"{dataset_name}_cached.csv"
            df.to_csv(data_path, index=False)
            
            # 메타데이터 저장
            meta_path = cache_dir / f"{dataset_name}_metadata.json"
            with open(meta_path, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            logger.info(f"💾 Cached data saved: {data_path}")
            
        except Exception as e:
            logger.warning(f"⚠️ Failed to save cache: {e}")
    
    def _load_cached_data(self, dataset_name: str) -> Tuple[Optional[pd.DataFrame], Dict[str, Any]]:
        """캐시된 데이터 로딩"""
        
        try:
            cache_dir = self.base_data_dir / dataset_name
            data_path = cache_dir / f"{dataset_name}_cached.csv"
            meta_path = cache_dir / f"{dataset_name}_metadata.json"
            
            if data_path.exists() and meta_path.exists():
                df = pd.read_csv(data_path)
                with open(meta_path, 'r') as f:
                    metadata = json.load(f)
                
                logger.info(f"📦 Loaded cached data: {df.shape}")
                return df, metadata
            
        except Exception as e:
            logger.warning(f"⚠️ Failed to load cache: {e}")
        
        return None, {}
    
    def list_available_datasets(self) -> List[Dict[str, Any]]:
        """사용 가능한 데이터셋 목록"""
        
        datasets = []
        
        for dataset_dir in self.base_data_dir.iterdir():
            if dataset_dir.is_dir():
                meta_path = dataset_dir / f"{dataset_dir.name}_metadata.json"
                if meta_path.exists():
                    try:
                        with open(meta_path, 'r') as f:
                            metadata = json.load(f)
                        datasets.append(metadata)
                    except Exception:
                        continue
        
        return datasets
    
    def clear_cache(self, dataset_name: Optional[str] = None):
        """캐시 삭제"""
        
        if dataset_name:
            cache_dir = self.base_data_dir / dataset_name
            if cache_dir.exists():
                import shutil
                shutil.rmtree(cache_dir)
                logger.info(f"🗑️ Cleared cache for {dataset_name}")
        else:
            # 모든 캐시 삭제
            for dataset_dir in self.base_data_dir.iterdir():
                if dataset_dir.is_dir():
                    cached_file = dataset_dir / f"{dataset_dir.name}_cached.csv"
                    if cached_file.exists():
                        cached_file.unlink()
                        logger.info(f"🗑️ Cleared cache file: {cached_file}")


# 사전 정의된 데이터셋 설정
DATASET_CONFIGS = {
    "ibm_aml": {
        "name": "ibm_aml",
        "method": "kagglehub",
        "kaggle_id": "ealtman2019/ibm-transactions-for-anti-money-laundering-aml",
        "file_paths": ["HI-Small_Trans.csv", "transactions.csv", "aml_data.csv"],
        "description": "IBM AML Dataset - Financial transactions for money laundering detection",
        "target_column": "Is Laundering",
        "task_type": "binary_classification"
    },
    
    "credit_card_fraud": {
        "name": "credit_card_fraud",
        "method": "kagglehub",
        "kaggle_id": "mlg-ulb/creditcardfraud",
        "file_paths": ["creditcard.csv"],
        "description": "Credit Card Fraud Detection Dataset",
        "target_column": "Class",
        "task_type": "binary_classification"
    },
    
    "financial_phrasebank": {
        "name": "financial_phrasebank",
        "method": "local",
        "file_path": "/root/FCA/data/financial_phrasebank/financial_sentences_processed.csv",
        "description": "Financial Phrasebank for sentiment analysis",
        "target_column": "sentiment",
        "task_type": "classification"
    }
}


def load_dataset_by_name(dataset_name: str, sample_size: Optional[int] = None) -> Tuple[Optional[pd.DataFrame], Dict[str, Any]]:
    """이름으로 데이터셋 로딩 (편의 함수)"""
    
    if dataset_name not in DATASET_CONFIGS:
        raise ValueError(f"Unknown dataset: {dataset_name}. Available: {list(DATASET_CONFIGS.keys())}")
    
    loader = DatasetLoader()
    config = DATASET_CONFIGS[dataset_name]
    
    return loader.load_dataset(config, sample_size)