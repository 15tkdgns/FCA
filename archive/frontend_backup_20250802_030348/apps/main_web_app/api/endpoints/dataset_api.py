#!/usr/bin/env python3
"""
Dataset API Endpoints
=====================

데이터셋 관련 API 엔드포인트
- 데이터셋 미리보기
- 데이터셋 정보 조회
- 데이터셋 다운로드
"""

from flask import Blueprint, jsonify, request, send_file, current_app
import pandas as pd
import json
import os
import time
from datetime import datetime
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

# Blueprint 생성
dataset_bp = Blueprint('dataset', __name__, url_prefix='/api/dataset')

# 데이터셋 경로 매핑
DATASET_PATHS = {
    'credit_card_fraud_2023': '/root/FCA/data/credit_card_fraud_2023/creditcard_2023_processed.csv',
    'wamc_fraud': '/root/FCA/data/wamc_fraud/wamc_fraud_processed.csv',
    'financial_phrasebank': '/root/FCA/data/financial_phrasebank/financial_sentences_processed.csv',
    'dhanush_fraud': '/root/FCA/data/dhanush_fraud/dhanush_fraud_processed.csv',
    'customer_attrition': '/root/FCA/data/customer_attrition/customer_attrition_processed.csv',
    'ibm_aml': '/root/FCA/data/ibm_aml/ibm_aml_sample.csv',
    'hf_creditcard_fraud': '/root/FCA/data/hf_creditcard_fraud/hf_creditcard_processed.csv',
    'incribo_fraud': '/root/FCA/data/incribo_fraud/incribo_fraud_processed.csv'
}

@dataset_bp.route('/preview/<dataset_name>', methods=['GET'])
def dataset_preview(dataset_name):
    """
    데이터셋 미리보기 API
    
    Args:
        dataset_name: 데이터셋 이름
        
    Query Parameters:
        rows: 미리보기할 행 수 (기본값: 10)
        timeout: 타임아웃 시간 (초, 기본값: 30)
    """
    try:
        # 파라미터 가져오기
        rows = request.args.get('rows', 10, type=int)
        timeout_seconds = request.args.get('timeout', 30, type=int)
        
        logger.info(f"Loading preview for dataset: {dataset_name} (rows: {rows}, timeout: {timeout_seconds}s)")
        
        # 데이터셋 경로 확인
        if dataset_name not in DATASET_PATHS:
            return jsonify({
                'status': 'error',
                'message': f'Dataset not found: {dataset_name}',
                'available_datasets': list(DATASET_PATHS.keys())
            }), 404
        
        file_path = DATASET_PATHS[dataset_name]
        
        # 파일 존재 확인
        if not os.path.exists(file_path):
            return jsonify({
                'status': 'error',
                'message': f'Dataset file not found: {file_path}',
                'suggestion': 'Please ensure the dataset has been processed and stored correctly'
            }), 404
        
        # 타임아웃과 함께 데이터 로드
        start_time = time.time()
        
        try:
            # IBM AML 데이터셋의 경우 특별 처리
            if dataset_name == 'ibm_aml':
                df = pd.read_csv(file_path, nrows=rows, low_memory=False)
                
                # 컬럼명 정리 (특수문자 처리)
                df.columns = [col.strip() for col in df.columns]
                
            else:
                df = pd.read_csv(file_path, nrows=rows, low_memory=False)
            
            load_time = time.time() - start_time
            
            # 타임아웃 체크
            if load_time > timeout_seconds:
                return jsonify({
                    'status': 'timeout',
                    'message': f'Dataset loading exceeded timeout ({timeout_seconds}s)',
                    'actual_time': round(load_time, 2),
                    'suggestion': 'Try reducing the number of rows or increase timeout'
                }), 408
            
            # 데이터 변환
            preview_data = {
                'headers': df.columns.tolist(),
                'rows': df.values.tolist(),
                'total_rows': len(df),
                'total_columns': len(df.columns),
                'load_time_seconds': round(load_time, 3),
                'file_size_mb': round(os.path.getsize(file_path) / (1024 * 1024), 2)
            }
            
            return jsonify({
                'status': 'success',
                'dataset_name': dataset_name,
                'data': preview_data,
                'timestamp': datetime.now().isoformat(),
                'performance': {
                    'load_time': round(load_time, 3),
                    'rows_per_second': round(len(df) / load_time if load_time > 0 else 0, 0)
                }
            }), 200
            
        except pd.errors.EmptyDataError:
            return jsonify({
                'status': 'error',
                'message': 'Dataset file is empty',
                'file_path': file_path
            }), 400
            
        except pd.errors.ParserError as e:
            return jsonify({
                'status': 'error',
                'message': f'Failed to parse CSV file: {str(e)}',
                'suggestion': 'Check CSV format and encoding'
            }), 400
            
    except Exception as e:
        logger.error(f"Error loading dataset preview {dataset_name}: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Internal server error: {str(e)}',
            'dataset_name': dataset_name
        }), 500

@dataset_bp.route('/info/<dataset_name>', methods=['GET'])
def dataset_info(dataset_name):
    """
    데이터셋 정보 조회 API
    """
    try:
        if dataset_name not in DATASET_PATHS:
            return jsonify({
                'status': 'error',
                'message': f'Dataset not found: {dataset_name}'
            }), 404
        
        file_path = DATASET_PATHS[dataset_name]
        
        if not os.path.exists(file_path):
            return jsonify({
                'status': 'error',
                'message': 'Dataset file not found'
            }), 404
        
        # 파일 정보
        file_stat = os.stat(file_path)
        file_size_mb = file_stat.st_size / (1024 * 1024)
        
        # 빠른 행 개수 확인 (첫 번째 줄만 읽어서 컬럼 수 확인)
        with open(file_path, 'r') as f:
            first_line = f.readline()
            columns_count = len(first_line.split(','))
        
        # 총 행 수 (빠른 계산)
        with open(file_path, 'r') as f:
            row_count = sum(1 for line in f) - 1  # 헤더 제외
        
        dataset_info = {
            'dataset_name': dataset_name,
            'file_path': file_path,
            'file_size_mb': round(file_size_mb, 2),
            'estimated_rows': row_count,
            'estimated_columns': columns_count,
            'last_modified': datetime.fromtimestamp(file_stat.st_mtime).isoformat(),
            'status': 'available'
        }
        
        # IBM AML 특별 정보 추가
        if dataset_name == 'ibm_aml':
            info_file = '/root/FCA/data/ibm_aml/dataset_info.json'
            if os.path.exists(info_file):
                with open(info_file, 'r') as f:
                    aml_info = json.load(f)
                    dataset_info.update({
                        'source': 'KaggleHub',
                        'original_dataset': aml_info.get('dataset_id', ''),
                        'loading_method': aml_info.get('loading_method', ''),
                        'columns': aml_info.get('columns', [])
                    })
        
        return jsonify({
            'status': 'success',
            'data': dataset_info,
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting dataset info {dataset_name}: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@dataset_bp.route('/health', methods=['GET'])
def dataset_health():
    """
    데이터셋 API 상태 확인
    """
    try:
        available_datasets = []
        
        for dataset_name, file_path in DATASET_PATHS.items():
            status = 'available' if os.path.exists(file_path) else 'missing'
            file_size = 0
            
            if status == 'available':
                file_size = os.path.getsize(file_path) / (1024 * 1024)  # MB
            
            available_datasets.append({
                'name': dataset_name,
                'status': status,
                'file_size_mb': round(file_size, 2),
                'path': file_path
            })
        
        available_count = sum(1 for d in available_datasets if d['status'] == 'available')
        
        return jsonify({
            'status': 'healthy',
            'total_datasets': len(DATASET_PATHS),
            'available_datasets': available_count,
            'missing_datasets': len(DATASET_PATHS) - available_count,
            'datasets': available_datasets,
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error checking dataset health: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@dataset_bp.route('/test/ibm_aml', methods=['GET'])
def test_ibm_aml():
    """
    IBM AML 데이터셋 특별 테스트
    """
    try:
        logger.info("Testing IBM AML dataset specifically...")
        
        file_path = DATASET_PATHS['ibm_aml']
        
        if not os.path.exists(file_path):
            return jsonify({
                'status': 'error',
                'message': 'IBM AML dataset file not found',
                'expected_path': file_path,
                'suggestion': 'Run the kagglehub test script to reload data'
            }), 404
        
        start_time = time.time()
        
        # 데이터 로드 테스트
        df = pd.read_csv(file_path, nrows=5)  # 테스트용 5행만
        load_time = time.time() - start_time
        
        # 추가 정보 수집
        file_size = os.path.getsize(file_path)
        
        # dataset_info.json 확인
        info_file = '/root/FCA/data/ibm_aml/dataset_info.json'
        kaggle_info = {}
        if os.path.exists(info_file):
            with open(info_file, 'r') as f:
                kaggle_info = json.load(f)
        
        return jsonify({
            'status': 'success',
            'message': 'IBM AML dataset is working correctly',
            'test_results': {
                'file_exists': True,
                'load_time_seconds': round(load_time, 3),
                'file_size_bytes': file_size,
                'file_size_mb': round(file_size / (1024 * 1024), 2),
                'sample_shape': df.shape,
                'columns': df.columns.tolist(),
                'first_row': df.iloc[0].to_dict() if len(df) > 0 else None
            },
            'kaggle_info': kaggle_info,
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error testing IBM AML dataset: {e}")
        return jsonify({
            'status': 'error',
            'message': f'IBM AML dataset test failed: {str(e)}',
            'suggestion': 'Check file permissions and CSV format'
        }), 500