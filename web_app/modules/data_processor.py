#!/usr/bin/env python3
"""
Data Processor
=============

실제 데이터 로딩 및 처리를 담당하는 모듈
FCA 프로젝트의 모든 데이터셋 처리 및 분석을 위한 중앙 집중식 데이터 처리기
"""

import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Optional
import json

from core.logging_manager import get_logger, log_calls

logger = get_logger("DataProcessor")


class DataProcessor:
    """
    데이터 처리 클래스
    
    주요 기능:
    - 사기 탐지 데이터 로딩 및 분석
    - 감정 분석 데이터 처리
    - 고객 이탈 데이터 분석
    - 데이터 캐싱으로 성능 최적화
    """
    
    def __init__(self):
        """
        DataProcessor 초기화
        
        - 데이터 디렉토리 경로 설정
        - 캐시 시스템 초기화
        """
        self.data_dir = Path("/root/FCA/data")  # 모든 데이터셋이 저장된 루트 디렉토리
        self.cache = {}  # 로드된 데이터를 메모리에 캐시하여 재로딩 방지
    
    @log_calls()
    def load_fraud_data(self) -> Dict[str, Any]:
        """
        사기 탐지 데이터 로드 및 분석
        
        지원 데이터셋:
        - credit_card_fraud_2023: 2023년 신용카드 사기 데이터
        - dhanush_fraud: Dhanush 사기 탐지 데이터셋
        - wamc_fraud: WAMC 사기 탐지 데이터셋
        
        Returns:
            Dict[str, Any]: {
                'datasets': 각 데이터셋의 상세 정보,
                'total_records': 전체 레코드 수,
                'total_features': 총 피처 수,
                'summary': 전체 요약 통계
            }
        """
        # 캐시에서 데이터 확인 (성능 최적화)
        if 'fraud_data' in self.cache:
            return self.cache['fraud_data']
        
        try:
            # 처리할 사기 탐지 데이터셋 목록
            fraud_files = [
                'credit_card_fraud_2023/creditcard_2023_processed.csv',  # 신용카드 사기 데이터
                'dhanush_fraud/dhanush_fraud_processed.csv',             # Dhanush 사기 데이터
                'wamc_fraud/wamc_fraud_processed.csv'                    # WAMC 사기 데이터
            ]
            
            datasets = {}
            
            # 각 데이터셋 파일을 순회하며 로드 및 분석
            for file_path in fraud_files:
                full_path = self.data_dir / file_path
                
                # 파일 존재 여부 확인
                if full_path.exists():
                    # CSV 파일을 DataFrame으로 로드
                    df = pd.read_csv(full_path)
                    dataset_name = file_path.split('/')[0]  # 디렉토리명을 데이터셋 이름으로 사용
                    
                    # 각 데이터셋의 메타데이터 및 통계 정보 생성
                    datasets[dataset_name] = {
                        'data': df,                                                         # 원본 데이터
                        'shape': df.shape,                                                  # (행, 열) 크기
                        'fraud_rate': df['Class'].mean() if 'Class' in df.columns else 0,  # 사기 비율 계산
                        'features': list(df.columns),                                       # 모든 컬럼명
                        'missing_values': df.isnull().sum().sum()                          # 결측값 총 개수
                    }
            
            # 전체 결과 통합
            result = {
                'datasets': datasets,                                           # 각 데이터셋 정보
                'total_records': sum(d['shape'][0] for d in datasets.values()), # 총 레코드 수
                'total_features': len(datasets),                                # 총 데이터셋 수
                'summary': self._generate_fraud_summary(datasets)               # 요약 통계
            }
            
            # 결과를 캐시에 저장하여 다음 요청 시 빠른 응답
            self.cache['fraud_data'] = result
            return result
            
        except Exception as e:
            logger.error(f"Error loading fraud data: {e}")
            return {'error': str(e), 'datasets': {}}
    
    @log_calls()
    def load_sentiment_data(self) -> Dict[str, Any]:
        """
        감정 분석 데이터 로드 및 처리
        
        금융 관련 문장들의 감정(긍정/부정/중립)을 분석하기 위한 데이터셋 로드
        
        데이터 소스:
        - FinancialPhraseBank: 금융 뉴스 문장들의 감정 라벨링 데이터
        
        Returns:
            Dict[str, Any]: {
                'shape': 데이터 크기 (행, 열),
                'sentiment_distribution': 감정별 분포,
                'total_sentences': 총 문장 수,
                'unique_sentiments': 고유 감정 수,
                'average_length': 평균 문장 길이,
                'sample_data': 샘플 데이터 (10개)
            }
        """
        # 캐시 확인으로 중복 로딩 방지
        if 'sentiment_data' in self.cache:
            return self.cache['sentiment_data']
        
        try:
            # 감정 분석 데이터 파일 경로
            sentiment_file = self.data_dir / 'financial_phrasebank/financial_sentences_processed.csv'
            
            # 파일 존재 여부 확인
            if not sentiment_file.exists():
                return {'error': 'Sentiment data not found', 'data': None}
            
            # CSV 파일을 DataFrame으로 로드
            df = pd.read_csv(sentiment_file)
            
            # 감정 분석 데이터 통계 및 메타데이터 생성
            result = {
                'shape': df.shape,                                                                  # 데이터 크기
                'sentiment_distribution': df['sentiment'].value_counts().to_dict() if 'sentiment' in df.columns else {},  # 감정별 분포 (positive, negative, neutral)
                'total_sentences': len(df),                                                         # 총 문장 수
                'unique_sentiments': df['sentiment'].nunique() if 'sentiment' in df.columns else 0,  # 고유 감정 수
                'average_length': float(df['sentence'].str.len().mean()) if 'sentence' in df.columns else 0,  # 평균 문장 길이
                'sample_data': df.head(10).to_dict('records') if len(df) > 0 else []              # 샘플 데이터 (처음 10개 문장)
            }
            
            # 캐시에 저장
            self.cache['sentiment_data'] = result
            return result
            
        except Exception as e:
            logger.error(f"Error loading sentiment data: {e}")
            return {'error': str(e), 'data': None}
    
    @log_calls()
    def load_attrition_data(self) -> Dict[str, Any]:
        """고객 이탈 데이터 로드"""
        try:
            attrition_file = self.data_dir / 'customer_attrition/customer_attrition_processed.csv'
            if not attrition_file.exists():
                return {'error': 'Attrition data not found'}
            
            df = pd.read_csv(attrition_file)
            
            # Attrition_Flag 컬럼을 숫자형으로 변환
            attrition_rate = 0.0
            if 'Attrition_Flag' in df.columns:
                # "Attrited Customer"를 1, "Existing Customer"를 0으로 변환
                attrition_count = (df['Attrition_Flag'] == 'Attrited Customer').sum()
                total_count = len(df)
                attrition_rate = float(attrition_count / total_count) if total_count > 0 else 0.0
            
            # 기본적인 통계만 반환 (JSON 직렬화 문제 방지)
            numerical_cols = []
            categorical_cols = []
            
            for col in df.columns:
                try:
                    if df[col].dtype in ['int64', 'float64']:
                        numerical_cols.append(col)
                    else:
                        categorical_cols.append(col)
                except:
                    categorical_cols.append(col)
            
            result = {
                'shape': [int(df.shape[0]), int(df.shape[1])],  # 명시적으로 int로 변환
                'attrition_rate': round(attrition_rate, 4),
                'total_customers': int(len(df)),
                'features': list(df.columns)[:20],  # 처음 20개 컬럼만
                'numerical_features': numerical_cols[:10],   # 처음 10개만
                'categorical_features': categorical_cols[:10], # 처음 10개만
                'sample_data': [
                    {'info': 'Data loaded successfully', 
                     'customers': int(len(df)), 
                     'attrition_percent': f"{attrition_rate*100:.2f}%"}
                ]
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error loading attrition data: {e}")
            return {'error': str(e)}
    
    @log_calls()
    def get_dataset_overview(self) -> Dict[str, Any]:
        """전체 데이터셋 개요"""
        fraud_data = self.load_fraud_data()
        sentiment_data = self.load_sentiment_data()
        attrition_data = self.load_attrition_data()
        
        return {
            'fraud_detection': {
                'total_datasets': len(fraud_data.get('datasets', {})),
                'total_records': fraud_data.get('total_records', 0),
                'available': len(fraud_data.get('datasets', {})) > 0
            },
            'sentiment_analysis': {
                'total_sentences': sentiment_data.get('total_sentences', 0),
                'unique_sentiments': sentiment_data.get('unique_sentiments', 0),
                'available': 'error' not in sentiment_data
            },
            'customer_attrition': {
                'total_customers': attrition_data.get('total_customers', 0),
                'attrition_rate': attrition_data.get('attrition_rate', 0),
                'available': 'error' not in attrition_data
            }
        }
    
    def _generate_fraud_summary(self, datasets: Dict) -> Dict[str, Any]:
        """사기 탐지 데이터 요약 생성"""
        total_records = sum(d['shape'][0] for d in datasets.values())
        total_fraud = sum(int(d['fraud_rate'] * d['shape'][0]) for d in datasets.values())
        
        return {
            'total_records': total_records,
            'total_fraud_cases': total_fraud,
            'overall_fraud_rate': total_fraud / total_records if total_records > 0 else 0,
            'datasets_count': len(datasets),
            'features_available': any('V1' in d['features'] for d in datasets.values())
        }
    
    @log_calls()
    def generate_fraud_statistics(self) -> Dict[str, Any]:
        """사기 탐지 통계 생성"""
        fraud_data = self.load_fraud_data()
        if 'error' in fraud_data:
            return fraud_data
        
        stats = {}
        for name, dataset in fraud_data['datasets'].items():
            df = dataset['data']
            if 'Class' in df.columns:
                stats[name] = {
                    'total_transactions': len(df),
                    'fraud_transactions': int(df['Class'].sum()),
                    'fraud_rate': float(df['Class'].mean()),
                    'amount_stats': {
                        'mean': float(df['Amount'].mean()) if 'Amount' in df.columns else 0,
                        'median': float(df['Amount'].median()) if 'Amount' in df.columns else 0,
                        'std': float(df['Amount'].std()) if 'Amount' in df.columns else 0
                    } if 'Amount' in df.columns else {}
                }
        
        return {
            'dataset_statistics': stats,
            'summary': fraud_data['summary']
        }