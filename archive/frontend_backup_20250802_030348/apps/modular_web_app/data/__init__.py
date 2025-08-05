"""
데이터 모듈 패키지
=================

FCA 웹 애플리케이션의 데이터 로딩 및 처리 기능을 제공합니다.
"""

from .data_loader import (
    DataLoader,
    data_loader,
    load_fraud_data,
    load_sentiment_data,
    load_attrition_data,
    get_datasets_info,
    get_summary_stats
)

__all__ = [
    'DataLoader',
    'data_loader',
    'load_fraud_data',
    'load_sentiment_data',
    'load_attrition_data',
    'get_datasets_info',
    'get_summary_stats'
]