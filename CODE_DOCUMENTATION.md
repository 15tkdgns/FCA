# FCA 웹 대시보드 코드 문서
=========================

## 📁 프로젝트 구조

```
/root/FCA/
├── 🎯 core/                              # 핵심 모듈
│   ├── logging_manager.py                # 통합 로깅 시스템
│   └── module_loader.py                  # 동적 모듈 로더
├── 🔧 web_app/                           # 웹 애플리케이션
│   ├── app_minimal.py                    # Flask 앱 실행기 (50줄)
│   ├── 📊 modules/                       # 백엔드 모듈
│   │   └── data_processor.py             # 실제 데이터 처리
│   ├── 🛣️ routes/                        # 라우팅 시스템
│   │   ├── route_manager.py              # 라우트 관리자
│   │   └── handlers/                     # 요청 핸들러
│   │       ├── page_handlers.py          # HTML 페이지 핸들러
│   │       └── api_handlers.py           # JSON API 핸들러
│   ├── 🎨 static/                        # 정적 파일
│   │   ├── css/                          # 스타일시트
│   │   └── js/                           # JavaScript
│   │       ├── api-client.js             # API 통신 클라이언트
│   │       ├── dashboard.js              # 대시보드 로직
│   │       ├── fraud.js                  # 사기 탐지 페이지
│   │       └── common.js                 # 공통 유틸리티
│   └── 📄 templates/                     # HTML 템플릿
└── 📊 data/                              # 실제 데이터셋
    ├── credit_card_fraud_2023/           # 신용카드 사기 (568K 거래)
    ├── financial_phrasebank/             # 금융 감정분석 (14K 문장)
    └── customer_attrition/               # 고객 이탈 데이터
```

## 🔧 핵심 컴포넌트

### 1. **데이터 처리 계층** (`data_processor.py`)
```python
class DataProcessor:
    """
    실제 데이터 로딩 및 분석 담당
    - 1,852,355개 사기 탐지 거래 데이터
    - 14,780개 금융 감정 분석 문장
    - 메모리 캐싱으로 성능 최적화
    """
```

**주요 메소드:**
- `load_fraud_data()` - 3개 사기 탐지 데이터셋 로드
- `load_sentiment_data()` - 금융 뉴스 감정 분석 데이터
- `load_attrition_data()` - 은행 고객 이탈 데이터
- `generate_fraud_statistics()` - 사기 탐지 통계 생성

### 2. **API 계층** (`api_handlers.py`)
```python
class APIHandlers:
    """
    모든 REST API 엔드포인트 처리
    - JSON 응답 및 에러 처리
    - 실시간 통계 데이터 제공
    """
```

**주요 API 엔드포인트:**
- `GET /api/summary` - 전체 프로젝트 요약
- `GET /api/fraud/statistics` - 사기 탐지 상세 통계
- `GET /api/sentiment/data` - 감정 분석 데이터
- `GET /api/health` - 시스템 헬스체크

### 3. **프론트엔드 계층** (JavaScript)

#### **API 클라이언트** (`api-client.js`)
```javascript
class APIClient {
    // HTTP 통신 및 캐싱 담당
    // 5분 TTL 캐시로 성능 최적화
}
```

#### **대시보드** (`dashboard.js`)
```javascript
class Dashboard {
    // 메인 대시보드 동적 기능
    // - 실시간 데이터 업데이트
    // - Plotly.js 차트 렌더링
    // - 성능 모니터링
}
```

#### **사기 탐지** (`fraud.js`)
```javascript
class FraudAnalysis {
    // 사기 탐지 페이지 전용 로직
    // - 데이터셋별 비교 차트
    // - 상세 통계 테이블
}
```

## 📊 실제 데이터 현황

### **사기 탐지 데이터셋**
| 데이터셋 | 거래 수 | 사기율 | 평균 금액 |
|---------|---------|--------|----------|
| credit_card_fraud_2023 | 568,629 | 50.0% | $12,041 |
| wamc_fraud | 283,726 | 0.17% | $88 |
| dhanush_fraud | 1,000,000+ | 변동 | 변동 |

### **감정 분석 데이터**
- **데이터소스**: FinancialPhraseBank
- **총 문장**: 14,780개
- **감정 라벨**: 3가지 (positive, negative, neutral)
- **평균 문장 길이**: 126자

## 🛣️ 라우팅 구조

### **페이지 라우트** (HTML 렌더링)
- `/` - 메인 대시보드
- `/fraud` - 사기 탐지 분석
- `/sentiment` - 감정 분석
- `/attrition` - 고객 이탈 분석
- `/datasets` - 데이터셋 관리
- `/comparison` - 모델 비교
- `/visualizations` - 고급 시각화
- `/xai` - 설명 가능한 AI

### **API 라우트** (JSON 응답)
- `/api/health` - 시스템 상태
- `/api/summary` - 프로젝트 요약
- `/api/fraud/statistics` - 사기 탐지 통계
- `/api/sentiment/data` - 감정 분석 데이터
- `/api/attrition/data` - 고객 이탈 데이터
- `/api/chart/{type}` - 차트 데이터

## 🔧 주요 기능

### **1. 실시간 데이터 연동**
- 실제 CSV 파일에서 데이터 로드
- 메모리 캐싱으로 빠른 응답
- 자동 새로고침 (5분 간격)

### **2. 대화형 차트**
- Plotly.js 기반 고급 차트
- 데이터셋별 비교 시각화
- 반응형 디자인

### **3. 성능 최적화**
- API 응답 캐싱 (5분 TTL)
- 모듈화된 JavaScript 로딩
- 비동기 데이터 처리

### **4. 에러 처리**
- 전역 에러 핸들러
- 사용자 친화적 에러 메시지
- 로그 기반 디버깅

## 🚀 실행 방법

```bash
# 1. 가상환경 활성화
source venv/bin/activate

# 2. Flask 서버 실행
python3 web_app/app_minimal.py

# 3. 브라우저에서 접속
http://localhost:5003
```

## 📝 개발 가이드

### **새로운 API 엔드포인트 추가**
1. `api_handlers.py`에 메소드 추가
2. `route_manager.py`에 라우트 등록
3. `api-client.js`에 클라이언트 메소드 추가

### **새로운 페이지 추가**
1. `templates/` 폴더에 HTML 템플릿 생성
2. `page_handlers.py`에 핸들러 메소드 추가
3. `route_manager.py`에 페이지 라우트 등록
4. `static/js/`에 전용 JavaScript 파일 생성

### **새로운 데이터셋 추가**
1. `data/` 폴더에 CSV 파일 배치
2. `data_processor.py`에 로더 메소드 추가
3. `api_handlers.py`에 API 엔드포인트 추가

## 🎯 성능 메트릭

- **API 응답 시간**: 평균 50-250ms
- **페이지 로딩 시간**: 2-4초 (초기 로드)
- **메모리 사용량**: 8.5% (3.5GB / 47GB)
- **CPU 사용률**: 0.3-0.6%

---

**📞 문의사항이나 개선 사항은 GitHub Issues를 통해 제보해 주세요.**