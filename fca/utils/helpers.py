#!/usr/bin/env python3
"""
FCA 유틸리티 함수들
=================

공통으로 사용되는 헬퍼 함수들을 모음
"""

import numpy as np
import pandas as pd
from typing import Union, Any, Dict, List
from datetime import datetime
import json


def format_number(number: float, decimal_places: int = 2) -> str:
    """숫자를 포맷팅하여 문자열로 반환"""
    if pd.isna(number):
        return "N/A"
    
    if abs(number) >= 1e6:
        return f"{number/1e6:.{decimal_places}f}M"
    elif abs(number) >= 1e3:
        return f"{number/1e3:.{decimal_places}f}K"
    else:
        return f"{number:.{decimal_places}f}"


def safe_division(numerator: float, denominator: float, default: float = 0.0) -> float:
    """안전한 나눗셈 (0으로 나누기 방지)"""
    if denominator == 0 or pd.isna(denominator) or pd.isna(numerator):
        return default
    return numerator / denominator


def calculate_percentage(part: float, total: float) -> float:
    """백분율 계산"""
    return safe_division(part, total, 0.0) * 100


def normalize_array(arr: np.ndarray, method: str = 'minmax') -> np.ndarray:
    """배열 정규화"""
    if method == 'minmax':
        min_val = np.min(arr)
        max_val = np.max(arr)
        return (arr - min_val) / (max_val - min_val + 1e-8)
    elif method == 'zscore':
        mean_val = np.mean(arr)
        std_val = np.std(arr)
        return (arr - mean_val) / (std_val + 1e-8)
    else:
        raise ValueError(f"지원하지 않는 정규화 방법: {method}")


def convert_to_serializable(obj: Any) -> Any:
    """JSON 직렬화 가능한 형태로 변환"""
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, pd.DataFrame):
        return obj.to_dict('records')
    elif isinstance(obj, pd.Series):
        return obj.to_dict()
    elif isinstance(obj, datetime):
        return obj.isoformat()
    elif isinstance(obj, dict):
        return {k: convert_to_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_to_serializable(item) for item in obj]
    else:
        return obj


def create_response_dict(data: Any = None, success: bool = True, 
                        message: str = None, error: str = None) -> Dict:
    """표준 API 응답 딕셔너리 생성"""
    response = {
        'success': success,
        'timestamp': datetime.utcnow().isoformat()
    }
    
    if data is not None:
        response['data'] = convert_to_serializable(data)
    
    if message:
        response['message'] = message
    
    if error:
        response['error'] = error
        response['success'] = False
    
    return response


def memory_usage_mb(obj: Any) -> float:
    """객체의 메모리 사용량을 MB 단위로 반환"""
    if isinstance(obj, pd.DataFrame):
        return obj.memory_usage(deep=True).sum() / 1024 / 1024
    elif isinstance(obj, np.ndarray):
        return obj.nbytes / 1024 / 1024
    else:
        # 대략적인 추정
        import sys
        return sys.getsizeof(obj) / 1024 / 1024


def timing_decorator(func):
    """함수 실행 시간 측정 데코레이터"""
    from functools import wraps
    import time
    
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        execution_time = time.time() - start_time
        
        # 결과에 실행 시간 추가 (딕셔너리인 경우)
        if isinstance(result, dict):
            result['_execution_time'] = execution_time
        
        return result
    
    return wrapper


def batch_process(items: List[Any], batch_size: int = 100):
    """리스트를 배치 단위로 처리하는 제너레이터"""
    for i in range(0, len(items), batch_size):
        yield items[i:i + batch_size]


def get_file_size_mb(file_path: str) -> float:
    """파일 크기를 MB 단위로 반환"""
    from pathlib import Path
    
    path = Path(file_path)
    if path.exists():
        return path.stat().st_size / 1024 / 1024
    return 0.0