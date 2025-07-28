# FCA 웹페이지 네비게이션 및 동작 분석 📊
========================================

## 🌟 INDEX 중심 네비게이션 구조

```
                   📱 FCA Dashboard (/)
                          │
         ┌────────────────┼────────────────┐
         │                │                │
    🛡️ Fraud         💬 Sentiment      👥 Attrition
   Detection         Analysis         Analysis
      /fraud         /sentiment       /attrition
         │                │                │
         │                │                │
    📊 실시간         📈 금융뉴스        🔄 고객이탈
    사기탐지          감정분석          예측분석
    
         └────────────────┼────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
    📚 Datasets      ⚖️ Comparison    🔍 XAI
      /datasets       /comparison      /xai
         │                │                │
    📂 데이터셋       📈 모델비교       🧠 설명가능
    관리페이지        성능분석          AI 해석
```

## 🔄 페이지 이동 테스트 결과

| 페이지 | URL | HTTP 상태 | 기능 | 데이터 소스 |
|--------|-----|-----------|------|------------|
| **메인 대시보드** | `/` | ✅ 200 | 프로젝트 요약, 성능 모니터링 | 전체 API 집계 |
| **사기 탐지** | `/fraud` | ✅ 200 | 실시간 사기 통계, 차트 | 1.8M+ 거래 데이터 |
| **감정 분석** | `/sentiment` | ✅ 200 | 금융 뉴스 감정 분류 | 14.7K 문장 데이터 |
| **고객 이탈** | `/attrition` | ✅ 200 | 은행 고객 이탈 예측 | 고객 행동 데이터 |
| **데이터셋** | `/datasets` | ✅ 200 | 데이터셋 관리 및 메타데이터 | 실시간 파일 스캔 |
| **모델 비교** | `/comparison` | ✅ 200 | 도메인별 모델 성능 비교 | ML 모델 결과 |
| **고급 시각화** | `/visualizations` | ✅ 200 | 3D 차트, 대화형 시각화 | Plotly.js 기반 |
| **XAI 분석** | `/xai` | ✅ 200 | 모델 해석, 피처 중요도 | 모델 설명 데이터 |

## 🏗️ 프로젝트 아키텍처 투명성

### 1. **라우팅 계층 (Route Layer)**
```python
RouteManager
├── 📄 Page Routes (HTML 렌더링)
│   ├── / → dashboard_page()
│   ├── /fraud → fraud_page()
│   ├── /sentiment → sentiment_page()
│   └── ... (8개 페이지)
│
├── 🔌 API Routes (JSON 응답)
│   ├── /api/health → 시스템 상태
│   ├── /api/summary → 프로젝트 요약
│   ├── /api/fraud/statistics → 사기 통계
│   └── ... (15개 API)
│
└── ❌ Error Handlers
    ├── 404 → Page Not Found
    ├── 500 → Internal Error
    └── Exception → 일반 예외
```

### 2. **데이터 처리 계층 (Data Layer)**
```python
DataProcessor
├── 🔍 load_fraud_data()
│   ├── credit_card_fraud_2023 (568K 거래)
│   ├── wamc_fraud (283K 거래)
│   └── dhanush_fraud (1M+ 거래)
│
├── 💭 load_sentiment_data()
│   └── financial_phrasebank (14.7K 문장)
│
├── 👥 load_attrition_data()
│   └── customer_attrition (고객 행동)
│
└── 📊 generate_statistics()
    └── 실시간 통계 생성
```

### 3. **프론트엔드 계층 (Frontend Layer)**
```javascript
Frontend Architecture
├── 🎨 CSS Modules (9개)
│   ├── variables.css (색상, 변수)
│   ├── animations.css (18가지 애니메이션)
│   ├── responsive.css (반응형)
│   └── ... (컴포넌트별 모듈)
│
├── 📡 JavaScript Clients
│   ├── APIClient (HTTP 통신, 캐싱)
│   ├── Dashboard (메인 대시보드)
│   ├── FraudAnalysis (사기 탐지)
│   └── Utils (공통 기능)
│
└── 📊 Chart Rendering
    ├── Plotly.js (고급 차트)
    ├── 로딩 애니메이션
    └── 에러 처리
```

## 🔄 동작 플로우 다이어그램

### **사용자 요청 → 응답 플로우**

```
1. 브라우저 요청
   ↓
2. Flask RouteManager
   ├── 페이지 요청? → PageHandlers → HTML 템플릿
   └── API 요청? → APIHandlers → JSON 응답
   ↓
3. 템플릿 렌더링
   ├── base.html (공통 레이아웃)
   ├── CSS 모듈 로딩
   └── JavaScript 클라이언트 초기화
   ↓
4. 클라이언트 사이드
   ├── API 데이터 요청 (캐싱 확인)
   ├── 차트 렌더링 (로딩 애니메이션)
   └── 사용자 인터랙션 처리
   ↓
5. 실시간 업데이트
   ├── 5분마다 자동 새로고침
   ├── 헬스체크 모니터링
   └── 성능 메트릭 업데이트
```

### **데이터 플로우**

```
📁 Raw Data Files
   ↓
🔄 DataProcessor
   ├── CSV 파싱
   ├── 통계 계산
   └── 메모리 캐싱
   ↓
📡 API Handlers
   ├── JSON 직렬화
   ├── 에러 처리
   └── 응답 포맷팅
   ↓
🌐 HTTP Response
   ↓
💻 Client Cache (5분 TTL)
   ↓
📊 Chart Rendering
   └── 사용자 화면 표시
```

## 🎯 핵심 기능 구현 방식

### **1. 네비게이션 시스템**
- **Flask url_for()**: 동적 URL 생성으로 유연한 라우팅
- **Bootstrap 네비게이션**: 반응형 메뉴, 모바일 친화적
- **애니메이션 효과**: 클릭 시 스케일 효과, 부드러운 전환

### **2. 데이터 로딩 최적화**
- **메모리 캐싱**: DataProcessor 레벨에서 데이터 캐시
- **API 캐싱**: 클라이언트 5분 TTL 캐시
- **지연 로딩**: 차트 데이터는 페이지 로드 후 비동기 요청

### **3. 사용자 경험 (UX)**
- **로딩 상태**: Shimmer 효과, 스피너 애니메이션
- **에러 처리**: 사용자 친화적 에러 메시지
- **시각적 피드백**: 호버 효과, 상태 표시기

### **4. 성능 모니터링**
- **실시간 헬스체크**: API 응답 시간, 시스템 상태
- **자동 새로고침**: 5분마다 대시보드 데이터 업데이트
- **메트릭 표시**: 메모리 사용량, CPU 사용률, API 응답 시간

## 📊 실시간 데이터 통계

| 메트릭 | 값 | 설명 |
|--------|----|----- |
| **총 데이터 레코드** | 1,852,355개 | 모든 데이터셋 합계 |
| **사기 탐지 데이터셋** | 3개 | credit_card, wamc, dhanush |
| **감정 분석 문장** | 14,780개 | 금융 뉴스 문장 |
| **API 엔드포인트** | 15개 | REST API 제공 |
| **웹 페이지** | 8개 | 완전 기능 페이지 |
| **평균 응답 시간** | 50-250ms | API 응답 최적화 |

## 🔧 기술 스택 투명성

### **백엔드**
- **Flask**: 경량 웹 프레임워크
- **Pandas**: 데이터 처리 및 분석
- **Python 3.12**: 최신 언어 기능 활용

### **프론트엔드**
- **Bootstrap 5.3**: 모던 UI 컴포넌트
- **Plotly.js 2.25**: 고급 데이터 시각화
- **Font Awesome 6.0**: 아이콘 시스템
- **Inter Font**: 깔끔한 타이포그래피

### **데이터**
- **CSV 파일**: 실제 금융 데이터셋
- **JSON API**: RESTful 데이터 교환
- **실시간 처리**: 메모리 기반 고속 연산

## 🚀 확장 가능성

### **모듈형 설계**
- 새로운 데이터셋 추가 시 `DataProcessor`에 메소드만 추가
- 새로운 페이지 추가 시 `RouteManager`에 라우트만 등록
- CSS 모듈을 통한 스타일 확장성

### **API 중심 아키텍처**
- 프론트엔드와 백엔드 완전 분리
- REST API로 다른 클라이언트에서도 활용 가능
- 마이크로서비스로 확장 가능

이 투명한 분석을 통해 FCA 프로젝트의 모든 동작 방식과 구현 세부사항을 명확히 파악할 수 있습니다.