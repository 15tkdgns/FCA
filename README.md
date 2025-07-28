# FCA (Financial Crime Analysis) Dashboard

FCA는 금융범죄 분석을 위한 통합 웹 대시보드입니다. 머신러닝 모델을 활용하여 사기 탐지, 감정 분석, 고객 이탈 예측 등 다양한 분석 기능을 제공합니다.

## 🚀 주요 기능

### 📊 데이터 분석
- **사기 탐지 (Fraud Detection)**: 신용카드 거래 데이터를 활용한 실시간 사기 탐지
- **감정 분석 (Sentiment Analysis)**: 금융 뉴스 및 텍스트 데이터의 감정 분석
- **고객 이탈 예측 (Customer Attrition)**: 고객 행동 패턴 분석을 통한 이탈 예측

### 🎯 머신러닝 모델
- 다양한 알고리즘 지원 (Random Forest, SVM, Neural Networks 등)
- 모델 성능 비교 및 시각화
- 실시간 예측 및 분석

### 📈 시각화
- 인터랙티브 차트 (Plotly.js 기반)
- 실시간 성능 모니터링
- 커스터마이징 가능한 대시보드

## 🏗️ 아키텍처

### 백엔드 (Python/Flask)
```
web_app/
├── modules/
│   ├── core/                 # 핵심 모듈
│   │   ├── config.py        # 설정 관리
│   │   ├── logging.py       # 로깅 시스템
│   │   ├── cache.py         # 캐싱 시스템
│   │   ├── security.py      # 보안 관리
│   │   └── utils.py         # 유틸리티
│   ├── charts/              # 차트 생성
│   ├── data/                # 데이터 처리
│   └── api/                 # API 엔드포인트
├── utils/                   # 유틸리티
│   ├── error_handler.py     # 에러 처리
│   └── system_monitor.py    # 시스템 모니터링
└── app.py                   # 메인 애플리케이션
```

### 프론트엔드 (JavaScript/CSS)
```
static/
├── js/
│   ├── modules/             # 모듈화된 JavaScript
│   │   ├── api.js          # API 클라이언트
│   │   ├── charts.js       # 차트 렌더링
│   │   ├── dashboard.js    # 대시보드 로직
│   │   └── utils.js        # 유틸리티
│   ├── dashboard.js        # 레거시 호환 대시보드
│   ├── api-client.js       # 레거시 호환 API 클라이언트
│   └── common.js           # 공통 기능
└── css/
    ├── modules/            # 모듈화된 CSS
    │   ├── variables.css   # CSS 변수
    │   ├── base.css        # 기본 스타일
    │   ├── components.css  # 컴포넌트 스타일
    │   ├── charts.css      # 차트 스타일
    │   ├── performance.css # 성능 모니터링 스타일
    │   └── error-handling.css # 에러 처리 스타일
    └── dashboard-modular.css # 통합 CSS
```

## 🛠️ 설치 및 실행

### 1. 환경 설정
```bash
# 저장소 클론
git clone <repository-url>
cd FCA

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# 의존성 설치
pip install -r requirements.txt
```

### 2. 설정 파일
```bash
# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 필요한 설정 값 입력
```

### 3. 애플리케이션 실행
```bash
# 개발 모드로 실행
python web_app/app.py

# 또는 Flask CLI 사용
export FLASK_APP=web_app/app.py
export FLASK_ENV=development
flask run
```

### 4. 웹 브라우저에서 접속
```
http://localhost:5000
```

## 📋 환경 변수

`.env` 파일에서 설정 가능한 주요 환경 변수들:

```bash
# 애플리케이션 설정
FLASK_ENV=development
FCA_SECRET_KEY=your-secret-key
FCA_API_HOST=0.0.0.0
FCA_API_PORT=5000

# 데이터베이스 설정 (선택적)
FCA_DB_HOST=localhost
FCA_DB_PORT=5432
FCA_DB_NAME=fca_db
FCA_DB_USER=fca_user
FCA_DB_PASSWORD=your-password

# 캐시 설정 (선택적)
FCA_CACHE_TYPE=memory
FCA_CACHE_HOST=localhost
FCA_CACHE_PORT=6379

# 로깅 설정
FCA_LOG_LEVEL=INFO
FCA_LOG_FILE=logs/app.log
```

## 🔧 개발 가이드

### 코드 구조
- **모듈화**: 기능별로 명확하게 분리된 모듈 구조
- **의존성 주입**: 설정과 의존성을 외부에서 주입
- **에러 처리**: 구조화된 에러 처리 및 로깅
- **보안**: 입력 검증, CSRF 보호, 레이트 리미팅

### 새로운 기능 추가
1. **백엔드 API**: `web_app/api/endpoints/`에 새로운 라우트 추가
2. **프론트엔드**: `static/js/modules/`에 모듈 추가
3. **스타일**: `static/css/modules/`에 CSS 모듈 추가

### 테스트
```bash
# 단위 테스트 실행 (pytest 설치 후)
pytest tests/

# 코드 품질 검사 (flake8 설치 후)
flake8 web_app/

# 코드 포맷팅 (black 설치 후)
black web_app/
```

## 📊 API 엔드포인트

### 주요 API
- `GET /api/summary` - 프로젝트 요약 정보
- `GET /api/chart/{type}` - 차트 데이터 조회
- `GET /api/health` - 시스템 상태 확인
- `GET /api/fraud/statistics` - 사기 탐지 통계
- `GET /api/sentiment/data` - 감정 분석 데이터
- `GET /api/attrition/data` - 고객 이탈 데이터

### 응답 형식
```json
{
  "status": "success|error",
  "data": {},
  "message": "설명 메시지",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 🎨 UI/UX 특징

### 반응형 디자인
- Bootstrap 5.3 기반
- 모바일 친화적 레이아웃
- 다크/라이트 테마 지원

### 실시간 업데이트
- 자동 새로고침 (5분 간격)
- 실시간 성능 모니터링
- 에러 상황 즉시 알림

### 접근성
- WCAG 2.1 가이드라인 준수
- 키보드 네비게이션 지원
- 스크린 리더 호환

## 🔐 보안 기능

### 입력 검증
- SQL 인젝션 방지
- XSS 공격 방지
- 입력 데이터 새니타이제이션

### 인증 및 권한
- 세션 기반 인증
- CSRF 토큰 보호
- 레이트 리미팅

### 보안 헤더
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options

## 📈 성능 최적화

### 캐싱
- 메모리 캐시 (기본)
- Redis 지원 (선택적)
- API 응답 캐싱

### 모니터링
- 실시간 성능 메트릭
- 메모리 사용량 추적
- API 응답 시간 모니터링

## 🐛 문제 해결

### 일반적인 문제
1. **포트 충돌**: `FCA_API_PORT` 환경변수로 포트 변경
2. **메모리 부족**: 캐시 크기 조정 또는 Redis 사용
3. **차트 렌더링 오류**: 브라우저 콘솔에서 JavaScript 에러 확인

### 로그 확인
```bash
# 애플리케이션 로그
tail -f logs/app.log

# 에러 로그
tail -f logs/app.error.log

# 성능 로그
tail -f logs/app.performance.log
```

## 🤝 기여하기

1. Fork 프로젝트
2. 새로운 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 푸시 (`git push origin feature/amazing-feature`)
5. Pull Request 생성

## 📄 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 지원

- 이슈 리포트: [GitHub Issues](https://github.com/your-repo/FCA/issues)
- 문의사항: support@fca-dashboard.com
- 문서: [Wiki](https://github.com/your-repo/FCA/wiki)

---

**FCA Dashboard** - 금융범죄 분석을 위한 차세대 통합 솔루션