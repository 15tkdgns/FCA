# 🤖 FCA 자동화 모듈 가이드

## 📋 개요

FCA 프로젝트의 반복 작업을 자동화하기 위한 통합 모듈들입니다.

## 🏗️ 모듈 구조

```
fca/utils/
├── dataset_loader.py      # 데이터셋 자동 로딩
├── api_tester.py         # API 자동 테스트
├── server_manager.py     # 서버 관리 자동화
├── integration_tester.py # 통합 테스트 자동화
└── __init__.py          # 통합 인터페이스
```

## 🚀 주요 기능

### 1. 데이터셋 자동 로딩 (`dataset_loader.py`)

**지원 방식:**
- KaggleHub (권장)
- Kaggle API
- 로컬 파일
- URL 다운로드

**주요 특징:**
- ✅ 자동 캐싱 및 메타데이터 관리
- ✅ 다중 파일 경로 시도
- ✅ 에러 핸들링 및 재시도
- ✅ 성능 최적화 (샘플링 지원)

**사용 예제:**
```python
from fca.utils import load_dataset_by_name, DatasetLoader

# 간단한 사용법
df, metadata = load_dataset_by_name("ibm_aml", sample_size=1000)

# 고급 사용법
loader = DatasetLoader()
config = {
    "name": "custom_dataset",
    "method": "kagglehub",
    "kaggle_id": "user/dataset-name",
    "file_paths": ["data.csv", "main.csv"]
}
df, metadata = loader.load_dataset(config)
```

### 2. API 자동 테스트 (`api_tester.py`)

**테스트 유형:**
- 헬스 체크
- 포괄적 API 테스트
- 성능 벤치마크
- 연속 모니터링

**주요 특징:**
- ✅ 병렬 테스트 지원
- ✅ 자동 재시도 메커니즘
- ✅ 성능 메트릭 수집
- ✅ 상세 보고서 생성

**사용 예제:**
```python
from fca.utils import quick_health_check, APITester

# 빠른 헬스 체크
is_healthy = quick_health_check()

# 상세 테스트
tester = APITester()
results = tester.run_comprehensive_test()
print(f"성공률: {results['summary']['success_rate']:.1f}%")
```

### 3. 서버 관리 자동화 (`server_manager.py`)

**관리 기능:**
- 서버 시작/중지/재시작
- 프로세스 모니터링
- 로그 관리
- 자동 복구

**주요 특징:**
- ✅ 백그라운드 실행 지원
- ✅ PID 기반 프로세스 추적
- ✅ 자동 에러 복구
- ✅ 시스템 리소스 모니터링

**사용 예제:**
```python
from fca.utils import ensure_server_running, ServerManager

# 서버 자동 시작 보장
ensure_server_running(auto_start=True)

# 상세 서버 관리
manager = ServerManager()
manager.restart_server(host="0.0.0.0", port=5000)
status = manager.get_server_status()
```

### 4. 통합 테스트 자동화 (`integration_tester.py`)

**테스트 종류:**
- 데이터 파이프라인 테스트
- API 기능 테스트
- 엔드투엔드 워크플로우
- 성능 벤치마크

**주요 특징:**
- ✅ 전체 시스템 검증
- ✅ 성능 지표 측정
- ✅ 자동 보고서 생성
- ✅ CI/CD 통합 가능

**사용 예제:**
```python
from fca.utils import run_quick_integration_test, run_full_system_test

# 빠른 통합 테스트
success = run_quick_integration_test()

# 전체 시스템 테스트
results = run_full_system_test()
print(f"전체 상태: {results['overall_status']}")
```

## 📚 사전 정의된 설정

### 데이터셋 설정 (`DATASET_CONFIGS`)

```python
{
    "ibm_aml": {
        "method": "kagglehub",
        "kaggle_id": "ealtman2019/ibm-transactions-for-anti-money-laundering-aml",
        "file_paths": ["HI-Small_Trans.csv"],
        "target_column": "Is Laundering"
    },
    "credit_card_fraud": {
        "method": "kagglehub", 
        "kaggle_id": "mlg-ulb/creditcardfraud",
        "target_column": "Class"
    },
    "financial_phrasebank": {
        "method": "local",
        "file_path": "/root/FCA/data/financial_phrasebank/financial_sentences_processed.csv",
        "target_column": "sentiment"
    }
}
```

### API 테스트 스위트 (`FCA_TEST_SUITES`)

```python
{
    "basic": ["/api/health", "/api/summary"],
    "full": [
        "/api/health", "/api/summary", "/api/models/compare",
        "/api/results/fraud", "/api/results/sentiment",
        "/api/sentiment/data", "/api/chart/overview"
    ]
}
```

## 🔧 설치 및 설정

### 의존성 설치

```bash
pip install requests pandas psutil
pip install kagglehub[pandas-datasets]  # 선택사항
```

### 환경 설정

```bash
# Kaggle API 설정 (선택사항)
export KAGGLE_USERNAME="your_username"
export KAGGLE_KEY="your_api_key"
```

## 📖 실제 사용 시나리오

### 시나리오 1: 새로운 데이터셋 추가

```python
# 1. 서버가 실행 중인지 확인
ensure_server_running()

# 2. 새 데이터셋 로딩
df, metadata = load_dataset_by_name("ibm_aml", sample_size=500)

# 3. 데이터 품질 확인
if df is not None:
    print(f"데이터 로딩 성공: {df.shape}")
    print(f"메모리 사용량: {metadata['memory_usage_mb']:.1f}MB")
    
# 4. API 통합 테스트
success = run_quick_integration_test()
print(f"통합 테스트: {'통과' if success else '실패'}")
```

### 시나리오 2: 시스템 상태 모니터링

```python
from fca.utils import APITester, ServerManager

# 연속 모니터링 (10분간, 1분 간격)
tester = APITester()
monitoring_results = tester.monitor_continuous(
    interval_seconds=60, 
    duration_minutes=10
)

print(f"가동률: {monitoring_results[0]['uptime_percentage']:.1f}%")
```

### 시나리오 3: 자동 문제 해결

```python
from fca.utils import ServerManager, quick_health_check

manager = ServerManager()

# 문제 감지 및 자동 복구
if not quick_health_check():
    print("🔧 문제 감지, 자동 복구 시도...")
    
    # 서버 재시작
    manager.restart_server()
    
    # 복구 확인
    import time
    time.sleep(10)
    
    if quick_health_check():
        print("✅ 자동 복구 성공")
    else:
        print("❌ 수동 개입 필요")
```

## ⚡ 성능 최적화

### 데이터 로딩 최적화

```python
# 캐싱 활용
loader = DatasetLoader()
df1, _ = loader.load_dataset(config)  # 첫 로딩 (느림)
df2, _ = loader.load_dataset(config)  # 캐시 사용 (빠름)

# 샘플링으로 빠른 테스트
df, _ = load_dataset_by_name("large_dataset", sample_size=100)
```

### API 테스트 최적화

```python
# 병렬 테스트로 속도 향상
tester = APITester()
results = tester.test_multiple_endpoints(endpoints, parallel=True)
```

## 🐛 문제 해결

### 일반적인 문제들

1. **모듈 임포트 오류**
   ```python
   # 해결방법: 직접 경로 사용
   import sys
   sys.path.append('/root/FCA')
   from fca.utils.api_tester import quick_health_check
   ```

2. **Kaggle 인증 오류**
   ```bash
   # Kaggle API 키 설정
   mkdir -p ~/.kaggle
   echo '{"username":"user","key":"key"}' > ~/.kaggle/kaggle.json
   chmod 600 ~/.kaggle/kaggle.json
   ```

3. **서버 포트 충돌**
   ```python
   # 다른 포트 사용
   manager = ServerManager()
   manager.start_server(port=5001)
   ```

## 📈 확장 방법

### 새로운 데이터셋 추가

```python
# DATASET_CONFIGS에 추가
DATASET_CONFIGS["my_dataset"] = {
    "name": "my_dataset",
    "method": "kagglehub",
    "kaggle_id": "user/my-dataset",
    "file_paths": ["data.csv"],
    "target_column": "label"
}
```

### 새로운 API 테스트 추가

```python
# FCA_TEST_SUITES에 추가
FCA_TEST_SUITES["custom"] = [
    {"endpoint": "/api/custom", "method": "GET"},
    {"endpoint": "/api/custom/data", "method": "POST"}
]
```

## 🎯 Best Practices

1. **항상 헬스 체크 먼저**
   ```python
   if not quick_health_check():
       ensure_server_running()
   ```

2. **에러 핸들링 사용**
   ```python
   try:
       df, metadata = load_dataset_by_name("dataset")
       if df is None:
           # 대안 데이터셋 사용
           df, metadata = load_dataset_by_name("fallback_dataset")
   except Exception as e:
       logger.error(f"데이터 로딩 실패: {e}")
   ```

3. **정기적인 통합 테스트**
   ```python
   # 매일 자동 실행
   results = run_full_system_test()
   if results['overall_status'] != 'PASS':
       # 알림 발송
       send_alert(results)
   ```

## 🔗 관련 파일

- `automation_examples.py` - 사용 예제 모음
- `test_kagglehub_ibm_aml.py` - KaggleHub 테스트
- `test_ibm_aml_integration.py` - IBM AML 통합 테스트

---

**💡 팁:** 이 모듈들을 사용하면 반복적인 수동 작업을 90% 이상 줄일 수 있습니다!