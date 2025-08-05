# FCA Tests

## 테스트 개요

이 디렉토리는 FCA 프로젝트의 모든 테스트 파일을 포함합니다.

## 테스트 파일 설명

### 시스템 테스트
- `test_modular_system.py` - 모듈화된 시스템 테스트
- `test_minimal_system.py` - 최소 시스템 테스트
- `test_server.py` - 서버 기능 테스트

### API 테스트
- `test_dataset_api.py` - 데이터셋 API 테스트
- `test_simple_server.py` - 단순 서버 테스트

### 통합 테스트
- `test_ibm_aml_integration.py` - IBM AML 통합 테스트
- `test_kagglehub_ibm_aml.py` - Kaggle Hub 통합 테스트

### 고급 기능 테스트
- `test_advanced_fraud_detection.py` - 고급 사기 탐지 테스트

## 테스트 실행

### 전체 테스트 실행
```bash
python -m pytest tests/
```

### 특정 테스트 실행
```bash
python -m pytest tests/test_modular_system.py -v
```

### 커버리지 포함 테스트
```bash
python -m pytest --cov=fca tests/
```

## 테스트 요구사항

- Python 3.8+
- pytest
- pytest-cov (커버리지용)
- 모든 의존성 패키지 설치 필요

## 새 테스트 추가

1. 적절한 네이밍 규칙 사용 (`test_*.py`)
2. 각 기능별로 별도 테스트 파일 생성
3. 테스트 함수는 `test_` 접두사 사용
4. 의미있는 테스트 이름 사용
5. 문서화 및 주석 추가