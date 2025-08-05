# FCA 프로젝트 구조 문서

## 📁 전체 프로젝트 구조

```
FCA/
├── 📱 apps/                          # 웹 애플리케이션
│   ├── main_web_app/                # 메인 웹 애플리케이션 (기존)
│   │   ├── templates/               # HTML 템플릿 (index.html 포함)
│   │   ├── static/                  # CSS, JS, 이미지
│   │   ├── modules/                 # 백엔드 모듈
│   │   ├── api/                     # API 엔드포인트
│   │   ├── routes/                  # 페이지 라우팅
│   │   ├── utils/                   # 유틸리티
│   │   ├── app.py                   # Flask 메인 애플리케이션
│   │   └── run_web_app.py          # 실행 파일
│   └── modular_web_app/            # 모듈화된 웹 애플리케이션 (권장)
│       ├── api/                     # API 모듈
│       ├── charts/                  # 차트 생성 모듈
│       ├── config/                  # 설정 관리
│       ├── data/                    # 데이터 로딩
│       ├── routes/                  # 페이지 라우팅
│       ├── templates/               # 템플릿 관리
│       └── web_app_modular_app.py   # 실행 파일
├── 🔧 fca/                          # 핵심 FCA 라이브러리
│   ├── api/                         # API 관리 모듈
│   ├── core/                        # 핵심 기능
│   ├── data/                        # 데이터 처리
│   ├── engines/                     # 분석 엔진 (사기탐지, 감정분석, 이탈예측)
│   └── utils/                       # 유틸리티 함수
├── 📊 data/                         # 데이터셋
│   ├── credit_card_fraud_2023/      # 신용카드 사기 데이터
│   ├── customer_attrition/          # 고객 이탈 데이터
│   ├── financial_phrasebank/        # 금융 감정 분석 데이터
│   ├── ibm_aml/                     # IBM AML 데이터
│   └── [기타 데이터셋들]/
├── 📚 docs/                         # 프로젝트 문서
│   ├── deployment/                  # 배포 가이드
│   ├── guides/                      # 사용 가이드
│   └── reports/                     # 분석 리포트
├── 🧪 tests/                        # 테스트 파일
│   ├── test_modular_system.py       # 모듈 시스템 테스트
│   ├── test_dataset_api.py          # 데이터셋 API 테스트
│   ├── test_ibm_aml_integration.py  # IBM AML 통합 테스트
│   └── [기타 테스트 파일들]
├── 🛠️ tools/                        # 개발 도구
│   ├── notebooks/                   # Jupyter 노트북
│   └── utilities/                   # 유틸리티 스크립트
├── ⚙️ config/                       # 설정 파일
│   ├── requirements.txt             # Python 의존성
│   ├── requirements_detection.txt   # 탐지 전용 의존성
│   ├── pyproject.toml              # 프로젝트 설정
│   ├── Makefile                    # Make 설정
│   └── .pre-commit-config.yaml     # Pre-commit 설정
├── 🖥️ backend/                      # 백엔드 서버
│   └── server.py                   # 백엔드 서버 실행 파일
├── 🗄️ archive/                      # 아카이브된 파일
│   ├── deprecated/                 # 사용 중단된 파일들
│   └── logs/                       # 이전 로그 파일들
├── 🔧 core/                         # 코어 유틸리티
├── 🚫 fraud_detection/              # 레거시 사기 탐지 모듈
└── 📄 [설정 파일들]
    ├── .env.example                # 환경 변수 예시
    ├── .gitignore                  # Git 무시 파일
    ├── README.md                   # 프로젝트 메인 문서
    └── PROJECT_STRUCTURE.md        # 이 파일
```

## 🔑 주요 디렉토리 설명

### 1. `/apps` - 웹 애플리케이션
프로젝트의 두 가지 주요 웹 애플리케이션을 포함합니다:

#### `main_web_app/` (포트 5003)
- **특징**: 풍부한 기능과 고급 시각화
- **용도**: 프로덕션 환경, 완전한 기능 필요시
- **진입점**: `app.py`

#### `modular_web_app/` (포트 5002) ⭐ **권장**
- **특징**: 깔끔한 모듈 구조, 빠른 성능
- **용도**: 개발, 테스트, 유지보수
- **진입점**: `web_app_modular_app.py`

### 2. `/fca` - 핵심 라이브러리
프로젝트의 핵심 비즈니스 로직을 포함합니다:
- **engines/**: 머신러닝 분석 엔진
- **data/**: 데이터 처리 및 로딩
- **api/**: API 관리 기능
- **utils/**: 공통 유틸리티 함수

### 3. `/data` - 데이터셋
머신러닝 모델 학습에 사용되는 모든 데이터셋:
- 신용카드 사기 탐지 데이터
- 고객 이탈 예측 데이터  
- 금융 뉴스 감정 분석 데이터
- IBM AML 통합 데이터

### 4. `/config` - 설정 관리
프로젝트의 모든 설정 파일을 중앙 집중 관리:
- Python 의존성 관리
- 개발 도구 설정
- 빌드 및 배포 설정

## 🚀 실행 방법

### 모듈화된 웹 앱 (권장)
```bash
cd apps/modular_web_app
python web_app_modular_app.py
# 접속: http://localhost:5002
```

### 메인 웹 앱
```bash
cd apps/main_web_app  
python app.py
# 접속: http://localhost:5003
```

## 📋 파일 관리 규칙

### ✅ 활성 파일
- `apps/`: 현재 사용 중인 웹 애플리케이션
- `fca/`: 핵심 라이브러리 코드
- `data/`: 프로덕션 데이터셋
- `tests/`: 활성 테스트 코드
- `config/`: 현재 설정 파일

### 📦 아카이브 파일  
- `archive/deprecated/`: 사용 중단된 코드
- `archive/logs/`: 이전 로그 파일
- 이전 버전의 실험적 코드

### 🗑️ 제거된 파일
- 중복된 웹 애플리케이션 파일
- 사용하지 않는 분석 도구
- 임시 실험 파일
- 오래된 로그 파일

## 🔧 개발 워크플로우

### 1. 새 기능 개발
```bash
# 1. 적절한 모듈에서 작업
cd apps/modular_web_app/[module]

# 2. 테스트 작성
cd tests/
```

### 2. 설정 변경
```bash
# 환경 변수 설정
cp .env.example .env
# .env 편집

# 의존성 관리
pip install -r config/requirements.txt
```

### 3. 테스트 실행
```bash
# 전체 테스트
python -m pytest tests/

# 특정 테스트
python -m pytest tests/test_modular_system.py
```

## 📈 프로젝트 성장 방향

### Phase 1: 정리 완료 ✅
- 코드 모듈화
- 파일 구조 정리
- 문서화 개선

### Phase 2: 기능 확장 (진행 중)
- 사용자 인증 추가
- 데이터베이스 통합
- API 확장

### Phase 3: 프로덕션 준비 (계획)
- Docker 컨테이너
- CI/CD 파이프라인
- 클라우드 배포

---

이 구조는 협업과 유지보수를 위해 최적화되었습니다. 각 디렉토리는 명확한 책임을 가지며, 모듈 간 의존성이 최소화되어 있습니다.