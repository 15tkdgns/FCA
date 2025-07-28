#!/usr/bin/env python3
"""
FCA 검증 유틸리티
===============

데이터 및 입력 검증 함수들
"""

import numpy as np
import pandas as pd
from typing import Union, List, Any, Optional
import re


def validate_dataframe(df: pd.DataFrame, required_columns: List[str] = None,
                      min_rows: int = 1) -> tuple[bool, str]:
    """데이터프레임 검증"""
    if not isinstance(df, pd.DataFrame):
        return False, "입력이 DataFrame이 아닙니다"
    
    if len(df) < min_rows:
        return False, f"최소 {min_rows}개의 행이 필요합니다"
    
    if required_columns:
        missing_cols = [col for col in required_columns if col not in df.columns]
        if missing_cols:
            return False, f"필수 컬럼 누락: {', '.join(missing_cols)}"
    
    return True, "검증 통과"


def validate_numeric_array(arr: Union[np.ndarray, List, pd.Series],
                          min_length: int = 1,
                          allow_nan: bool = False) -> tuple[bool, str]:
    """숫자 배열 검증"""
    try:
        arr = np.asarray(arr)
    except Exception:
        return False, "배열로 변환할 수 없습니다"
    
    if len(arr) < min_length:
        return False, f"최소 {min_length}개의 요소가 필요합니다"
    
    if not np.issubdtype(arr.dtype, np.number):
        return False, "숫자 타입이 아닙니다"
    
    if not allow_nan and np.any(np.isnan(arr)):
        return False, "NaN 값이 포함되어 있습니다"
    
    return True, "검증 통과"


def validate_email(email: str) -> bool:
    """이메일 형식 검증"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_phone_number(phone: str) -> bool:
    """전화번호 형식 검증 (한국 형식)"""
    # 기본적인 한국 전화번호 패턴
    patterns = [
        r'^010-\d{4}-\d{4}$',  # 010-1234-5678
        r'^01[016789]-\d{3,4}-\d{4}$',  # 다른 휴대폰 번호
        r'^0\d{1,2}-\d{3,4}-\d{4}$',  # 지역번호
    ]
    
    return any(re.match(pattern, phone) for pattern in patterns)


def validate_credit_card_number(card_number: str) -> bool:
    """신용카드 번호 검증 (Luhn 알고리즘)"""
    # 숫자만 추출
    card_number = re.sub(r'\D', '', card_number)
    
    if len(card_number) < 13 or len(card_number) > 19:
        return False
    
    # Luhn 알고리즘
    def luhn_check(card_num):
        digits = [int(d) for d in card_num]
        checksum = 0
        
        # 뒤에서부터 두 번째 자리부터 시작하여 매 두 번째 자리를 2배
        for i in range(len(digits) - 2, -1, -2):
            doubled = digits[i] * 2
            if doubled > 9:
                doubled = doubled // 10 + doubled % 10
            checksum += doubled
        
        # 나머지 자리수들을 더함
        for i in range(len(digits) - 1, -1, -2):
            checksum += digits[i]
        
        return checksum % 10 == 0
    
    return luhn_check(card_number)


def validate_date_range(start_date: str, end_date: str) -> tuple[bool, str]:
    """날짜 범위 검증"""
    try:
        from datetime import datetime
        
        start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        if start >= end:
            return False, "시작 날짜가 종료 날짜보다 늦습니다"
        
        # 미래 날짜 체크 (선택적)
        now = datetime.now()
        if start > now:
            return False, "시작 날짜가 미래입니다"
        
        return True, "검증 통과"
        
    except Exception as e:
        return False, f"날짜 형식 오류: {str(e)}"


def validate_model_parameters(params: dict, required_params: List[str] = None,
                             param_ranges: dict = None) -> tuple[bool, str]:
    """모델 파라미터 검증"""
    if required_params:
        missing_params = [p for p in required_params if p not in params]
        if missing_params:
            return False, f"필수 파라미터 누락: {', '.join(missing_params)}"
    
    if param_ranges:
        for param, value in params.items():
            if param in param_ranges:
                min_val, max_val = param_ranges[param]
                if not (min_val <= value <= max_val):
                    return False, f"파라미터 {param}는 {min_val}과 {max_val} 사이여야 합니다"
    
    return True, "검증 통과"


def validate_file_path(file_path: str, allowed_extensions: List[str] = None) -> tuple[bool, str]:
    """파일 경로 검증"""
    from pathlib import Path
    
    path = Path(file_path)
    
    if not path.exists():
        return False, "파일이 존재하지 않습니다"
    
    if not path.is_file():
        return False, "디렉토리가 아닌 파일이어야 합니다"
    
    if allowed_extensions:
        if path.suffix.lower() not in [ext.lower() for ext in allowed_extensions]:
            return False, f"허용된 확장자: {', '.join(allowed_extensions)}"
    
    return True, "검증 통과"


def sanitize_input(text: str, max_length: int = 1000) -> str:
    """입력 텍스트 정제"""
    if not isinstance(text, str):
        text = str(text)
    
    # 길이 제한
    text = text[:max_length]
    
    # 위험한 문자 제거 (기본적인 XSS 방지)
    dangerous_chars = ['<', '>', '"', "'", '&']
    for char in dangerous_chars:
        text = text.replace(char, '')
    
    # 공백 정리
    text = text.strip()
    
    return text