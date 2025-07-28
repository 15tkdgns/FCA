#!/usr/bin/env python3
"""
통합 데이터 처리기 (리팩토링됨)
============================

기존의 web_app/modules/data_processor.py를 개선하고 통합한 버전
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional, Union, Tuple
import json
from datetime import datetime

from ..core import get_logger, get_config, log_calls
from .data_loader import DataLoader

logger = get_logger("DataProcessor")
config = get_config()


class DataProcessor:
    """
    통합 데이터 처리기
    
    주요 기능:
    - 사기 탐지 데이터 분석
    - 감정 분석 데이터 처리
    - 고객 이탈 데이터 분석
    - 자동 특성 엔지니어링
    - 데이터 품질 검증
    """
    
    def __init__(self):
        self.data_loader = DataLoader()
        self.processing_cache = {}
    
    @log_calls()
    def load_fraud_data(self) -> Dict[str, Any]:
        """사기 탐지 데이터 로드 및 분석"""
        fraud_datasets = [
            'credit_card_fraud_2023/creditcard_2023_processed.csv',
            'dhanush_fraud/dhanush_fraud_processed.csv',
            'wamc_fraud/wamc_fraud_processed.csv',
            'hf_creditcard_fraud/hf_creditcard_processed.csv'
        ]
        
        results = {}
        
        for dataset_name in fraud_datasets:
            try:
                df = self.data_loader.load_dataset(dataset_name)
                
                # 기본 분석
                analysis = self._analyze_fraud_dataset(df, dataset_name)
                results[dataset_name] = analysis
                
                logger.info(f"사기 데이터셋 분석 완료: {dataset_name}")
                
            except FileNotFoundError:
                logger.warning(f"사기 데이터셋 파일 없음: {dataset_name}")
                continue
            except Exception as e:
                logger.error(f"사기 데이터셋 처리 오류 {dataset_name}: {str(e)}")
                continue
        
        return results
    
    def _analyze_fraud_dataset(self, df: pd.DataFrame, dataset_name: str) -> Dict[str, Any]:
        """사기 데이터셋 분석"""
        analysis = {
            'dataset_name': dataset_name,
            'total_records': len(df),
            'feature_count': len(df.columns),
            'missing_values': df.isnull().sum().sum(),
            'memory_usage_mb': df.memory_usage(deep=True).sum() / 1024 / 1024
        }
        
        # 사기 라벨 컬럼 찾기
        fraud_columns = ['Class', 'isFraud', 'is_fraud', 'fraud', 'target']
        fraud_col = None
        
        for col in fraud_columns:
            if col in df.columns:
                fraud_col = col
                break
        
        if fraud_col:
            fraud_distribution = df[fraud_col].value_counts()
            analysis.update({
                'fraud_column': fraud_col,
                'fraud_distribution': fraud_distribution.to_dict(),
                'fraud_rate': fraud_distribution.get(1, 0) / len(df) * 100,
                'class_balance': 'imbalanced' if fraud_distribution.min() / fraud_distribution.max() < 0.1 else 'balanced'
            })
        
        # 숫자형 특성 통계
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) > 0:
            analysis['numeric_stats'] = {
                'columns': list(numeric_cols),
                'mean_values': df[numeric_cols].mean().to_dict(),
                'std_values': df[numeric_cols].std().to_dict(),
                'correlation_with_fraud': {}
            }
            
            # 사기 컬럼과의 상관관계
            if fraud_col and fraud_col in df.columns:
                correlations = df[numeric_cols].corrwith(df[fraud_col])
                analysis['numeric_stats']['correlation_with_fraud'] = correlations.to_dict()
        
        return analysis
    
    @log_calls()
    def load_sentiment_data(self) -> Dict[str, Any]:
        """감정 분석 데이터 로드 및 처리"""
        sentiment_datasets = [
            'financial_phrasebank/financial_sentences_processed.csv',
            'financial_phrasebank/all-data.csv'
        ]
        
        results = {}
        
        for dataset_name in sentiment_datasets:
            try:
                df = self.data_loader.load_dataset(dataset_name)
                analysis = self._analyze_sentiment_dataset(df, dataset_name)
                results[dataset_name] = analysis
                
                logger.info(f"감정 데이터셋 분석 완료: {dataset_name}")
                
            except FileNotFoundError:
                logger.warning(f"감정 데이터셋 파일 없음: {dataset_name}")
                continue
            except Exception as e:
                logger.error(f"감정 데이터셋 처리 오류 {dataset_name}: {str(e)}")
                continue
        
        return results
    
    def _analyze_sentiment_dataset(self, df: pd.DataFrame, dataset_name: str) -> Dict[str, Any]:
        """감정 데이터셋 분석"""
        analysis = {
            'dataset_name': dataset_name,
            'total_records': len(df),
            'feature_count': len(df.columns),
            'missing_values': df.isnull().sum().sum()
        }
        
        # 감정 라벨 컬럼 찾기
        sentiment_columns = ['sentiment', 'label', 'emotion', 'class']
        sentiment_col = None
        
        for col in sentiment_columns:
            if col in df.columns:
                sentiment_col = col
                break
        
        if sentiment_col:
            sentiment_distribution = df[sentiment_col].value_counts()
            analysis.update({
                'sentiment_column': sentiment_col,
                'sentiment_distribution': sentiment_distribution.to_dict(),
                'sentiment_classes': list(sentiment_distribution.index)
            })
        
        # 텍스트 컬럼 분석
        text_columns = df.select_dtypes(include=['object']).columns
        if len(text_columns) > 0:
            text_col = text_columns[0]  # 첫 번째 텍스트 컬럼 사용
            
            analysis['text_stats'] = {
                'text_column': text_col,
                'avg_length': df[text_col].str.len().mean(),
                'max_length': df[text_col].str.len().max(),
                'min_length': df[text_col].str.len().min()
            }
        
        return analysis
    
    @log_calls()
    def load_attrition_data(self) -> Dict[str, Any]:
        """고객 이탈 데이터 로드 및 분석"""
        try:
            df = self.data_loader.load_dataset('customer_attrition/customer_attrition_processed.csv')
            analysis = self._analyze_attrition_dataset(df)
            
            logger.info("고객 이탈 데이터셋 분석 완료")
            return {'customer_attrition': analysis}
            
        except FileNotFoundError:
            logger.warning("고객 이탈 데이터셋 파일 없음")
            return {}
        except Exception as e:
            logger.error(f"고객 이탈 데이터셋 처리 오류: {str(e)}")
            return {}
    
    def _analyze_attrition_dataset(self, df: pd.DataFrame) -> Dict[str, Any]:
        """고객 이탈 데이터셋 분석"""
        analysis = {
            'dataset_name': 'customer_attrition',
            'total_records': len(df),
            'feature_count': len(df.columns),
            'missing_values': df.isnull().sum().sum()
        }
        
        # 이탈 라벨 컬럼 찾기
        attrition_columns = ['Attrition_Flag', 'attrition', 'churn', 'left']
        attrition_col = None
        
        for col in attrition_columns:
            if col in df.columns:
                attrition_col = col
                break
        
        if attrition_col:
            attrition_distribution = df[attrition_col].value_counts()
            analysis.update({
                'attrition_column': attrition_col,
                'attrition_distribution': attrition_distribution.to_dict(),
                'attrition_rate': attrition_distribution.get('Attrition Flag', 0) / len(df) * 100
            })
        
        # 범주형 변수 분석
        categorical_cols = df.select_dtypes(include=['object']).columns
        if len(categorical_cols) > 0:
            analysis['categorical_stats'] = {}
            for col in categorical_cols[:5]:  # 상위 5개만
                value_counts = df[col].value_counts()
                analysis['categorical_stats'][col] = {
                    'unique_values': len(value_counts),
                    'top_values': value_counts.head(3).to_dict()
                }
        
        return analysis
    
    @log_calls()
    def get_all_data_summary(self) -> Dict[str, Any]:
        """모든 데이터의 종합 요약"""
        summary = {
            'timestamp': datetime.utcnow().isoformat(),
            'available_datasets': self.data_loader.list_available_datasets(),
            'fraud_data': self.load_fraud_data(),
            'sentiment_data': self.load_sentiment_data(),
            'attrition_data': self.load_attrition_data()
        }
        
        # 전체 통계
        total_records = 0
        total_features = 0
        
        for category in ['fraud_data', 'sentiment_data', 'attrition_data']:
            for dataset_analysis in summary[category].values():
                if isinstance(dataset_analysis, dict):
                    total_records += dataset_analysis.get('total_records', 0)
                    total_features += dataset_analysis.get('feature_count', 0)
        
        summary['overall_stats'] = {
            'total_datasets': len(summary['available_datasets']),
            'total_records': total_records,
            'total_features': total_features,
            'cache_info': self.data_loader.get_cache_info()
        }
        
        return summary
    
    @log_calls()
    def prepare_model_data(self, dataset_name: str, target_column: str = None) -> Tuple[pd.DataFrame, pd.Series]:
        """모델링을 위한 데이터 준비"""
        df = self.data_loader.load_dataset(dataset_name)
        
        # 타겟 컬럼 자동 감지
        if target_column is None:
            possible_targets = ['Class', 'isFraud', 'is_fraud', 'fraud', 'target', 
                              'sentiment', 'label', 'Attrition_Flag']
            for col in possible_targets:
                if col in df.columns:
                    target_column = col
                    break
        
        if target_column is None or target_column not in df.columns:
            raise ValueError(f"타겟 컬럼을 찾을 수 없습니다: {target_column}")
        
        # 특성과 타겟 분리
        X = df.drop(columns=[target_column])
        y = df[target_column]
        
        # 숫자형 데이터만 선택 (기본 처리)
        numeric_columns = X.select_dtypes(include=[np.number]).columns
        X = X[numeric_columns]
        
        # 결측값 처리
        X = X.fillna(X.mean())
        
        logger.info(f"모델 데이터 준비 완료: {X.shape}, 타겟: {target_column}")
        return X, y
    
    def clear_cache(self):
        """캐시 클리어"""
        self.processing_cache.clear()
        self.data_loader.clear_cache()
        logger.info("데이터 처리 캐시 클리어 완료")