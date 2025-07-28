# FCA 모듈화 프로젝트 가이드

## 새로운 모듈 구조

이 프로젝트는 모듈화와 코드 품질 개선을 위해 재구성되었습니다.

### 디렉토리 구조

```
fca/                         # 새로운 메인 패키지
├── core/                    # 핵심 기능
│   ├── __init__.py
│   ├── config.py           # 중앙 집중식 설정 관리
│   └── logging_manager.py  # 통합 로깅 시스템
├── data/                   # 데이터 처리
│   ├── __init__.py
│   ├── data_loader.py      # 통합 데이터 로더
│   └── data_processor.py   # 데이터 처리 및 분석
├── engines/                # 분석 엔진
│   ├── __init__.py
│   └── fraud_detection_engine.py  # 사기 탐지 엔진 (리팩토링됨)
├── api/                    # API 관리
│   ├── __init__.py
│   └── api_manager.py      # 통합 API 관리자
├── utils/                  # 유틸리티
│   ├── __init__.py
│   ├── helpers.py          # 공통 헬퍼 함수
│   └── validators.py       # 검증 함수
└── __init__.py            # 패키지 초기화
```

### 주요 개선사항

#### 1. 중앙 집중식 설정 관리
- `fca/core/config.py`: 모든 설정을 한 곳에서 관리
- 환경변수 지원
- 타입 안전성을 위한 데이터클래스 사용

#### 2. 통합 로깅 시스템
- `fca/core/logging_manager.py`: 구조화된 JSON 로그
- 자동 로그 파일 순환
- 성능 모니터링 데코레이터

#### 3. 모듈화된 데이터 처리
- `fca/data/data_loader.py`: 다양한 형식 지원
- `fca/data/data_processor.py`: 캐시와 함께 효율적인 처리
- 자동 데이터 타입 감지

#### 4. 개선된 사기 탐지 엔진
- `fca/engines/fraud_detection_engine.py`: 성능 최적화
- 캐시 시스템으로 빠른 예측
- 앙상블 모델 지원

#### 5. RESTful API 관리
- `fca/api/api_manager.py`: 체계적인 엔드포인트 관리
- 자동 오류 처리
- 요청 데이터 검증

### 사용법

#### 1. 새로운 모듈화된 앱 실행
```bash
python app_modular.py
```

#### 2. 기본 사용 예제
```python
from fca import DataProcessor, FraudDetectionEngine, get_config

# 설정 확인
config = get_config()
print(f"데이터 경로: {config.data_root}")

# 데이터 처리
processor = DataProcessor()
summary = processor.get_all_data_summary()

# 사기 탐지
engine = FraudDetectionEngine()
# 모델 학습 및 예측...
```

#### 3. API 엔드포인트

새로운 모듈화된 시스템은 다음 API를 제공합니다:

##### 시스템 정보
- `GET /api/health` - 헬스 체크
- `GET /api/info` - 시스템 정보

##### 데이터 관련
- `GET /api/data/summary` - 전체 데이터 요약
- `GET /api/data/fraud` - 사기 탐지 데이터
- `GET /api/data/sentiment` - 감정 분석 데이터
- `GET /api/data/attrition` - 고객 이탈 데이터
- `GET /api/data/datasets` - 사용 가능한 데이터셋 목록

##### 모델 관련
- `POST /api/model/fraud/train` - 사기 탐지 모델 학습
- `POST /api/model/fraud/predict` - 사기 예측
- `GET /api/model/fraud/status` - 모델 상태 확인

##### 모니터링
- `GET /api/monitoring/cache` - 캐시 상태
- `POST /api/monitoring/cache/clear` - 캐시 클리어

### 환경 변수

다음 환경 변수로 시스템을 구성할 수 있습니다:

```bash
export FCA_DEBUG=true                    # 디버그 모드
export FCA_ENV=production               # 환경 (development/production)
export FCA_DATA_ROOT=/path/to/data      # 데이터 루트 경로
```

### 기존 코드와의 호환성

기존 코드는 그대로 유지되며, 새로운 모듈화된 시스템과 병행하여 사용할 수 있습니다:

- 기존 앱: `python web_app/app.py`
- 새로운 앱: `python app_modular.py`

### 개발 지침

#### 1. 새로운 모듈 추가
```python
# fca/새모듈/새기능.py
from ..core import get_logger, get_config

logger = get_logger("새기능")
config = get_config()

class 새기능:
    def __init__(self):
        self.설정 = config.새설정
```

#### 2. API 엔드포인트 추가
```python
from fca.api import APIManager

def my_custom_endpoint():
    return {"message": "커스텀 엔드포인트"}

api_manager.register_custom_route(
    '/api/custom', 
    my_custom_endpoint,
    methods=['GET']
)
```

#### 3. 로깅 사용
```python
from fca.core import get_logger, log_calls

logger = get_logger("MyModule")

@log_calls()
def my_function():
    logger.info("함수 실행")
    return "결과"
```

### 테스트

모듈화된 시스템을 테스트하려면:

```bash
# 새로운 앱 실행
python app_modular.py

# 브라우저에서 확인
http://localhost:5000/api/health
http://localhost:5000/api/info
http://localhost:5000/api/data/summary
```

### 마이그레이션 가이드

기존 코드를 새로운 모듈 구조로 마이그레이션하려면:

1. 기존 `import` 문을 새로운 모듈 경로로 변경
2. 설정 관련 하드코딩을 `config` 객체 사용으로 변경
3. 로깅을 통합 로깅 시스템으로 변경
4. 데이터 처리를 새로운 `DataProcessor` 사용으로 변경

### 성능 개선

새로운 모듈 구조의 주요 성능 개선사항:

- **캐시 시스템**: 데이터 로딩 및 모델 예측 캐시
- **메모리 최적화**: 효율적인 데이터 처리
- **병렬 처리**: 다중 스레드 지원
- **구조화된 로깅**: 성능 모니터링 개선