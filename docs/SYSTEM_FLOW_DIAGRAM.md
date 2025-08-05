# FCA 시스템 동작 플로우 다이어그램 🔄
==========================================

## 🌐 전체 시스템 아키텍처 플로우

```
┌─────────────────────────────────────────────────────────────────────┐
│                           🌐 User Browser                           │
├─────────────────────────────────────────────────────────────────────┤
│  📱 Frontend Layer                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│
│  │   HTML      │  │     CSS     │  │ JavaScript  │  │   Charts    ││
│  │ Templates   │  │   Modules   │  │   Clients   │  │ (Plotly.js) ││
│  │             │  │ (9개 모듈)   │  │ (API통신)    │  │             ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘│
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ HTTP Request
┌─────────────────────────────────────────────────────────────────────┐
│                        🚀 Flask Web Server                         │
├─────────────────────────────────────────────────────────────────────┤
│  🛣️ Route Manager                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │    Page     │  │     API     │  │    Error    │                  │
│  │   Routes    │  │   Routes    │  │  Handlers   │                  │
│  │  (8 pages)  │  │ (15 APIs)   │  │ (404/500)   │                  │
│  └─────────────┘  └─────────────┘  └─────────────┘                  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ Handler Dispatch
┌─────────────────────────────────────────────────────────────────────┐
│                      🔧 Handler Layer                               │
├─────────────────────────────────────────────────────────────────────┤
│  📄 Page Handlers          │         📡 API Handlers               │
│  ┌─────────────────────┐    │    ┌─────────────────────────────────┐│
│  │ dashboard_page()    │    │    │ health_check()                  ││
│  │ fraud_page()        │    │    │ project_summary()               ││
│  │ sentiment_page()    │    │    │ fraud_statistics()              ││
│  │ datasets_page()     │    │    │ sentiment_data()                ││
│  │ ...                 │    │    │ chart_data()                    ││
│  └─────────────────────┘    │    └─────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ Data Request
┌─────────────────────────────────────────────────────────────────────┐
│                       💾 Data Processing Layer                     │
├─────────────────────────────────────────────────────────────────────┤
│  🔄 DataProcessor                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│
│  │    Fraud    │  │  Sentiment  │  │  Attrition  │  │   Cache     ││
│  │    Data     │  │    Data     │  │    Data     │  │  Manager    ││
│  │  (1.8M+)    │  │  (14.7K)    │  │ (Customer)  │  │ (5min TTL)  ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘│
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ File System Access
┌─────────────────────────────────────────────────────────────────────┐
│                        📁 Data Storage Layer                       │
├─────────────────────────────────────────────────────────────────────┤
│  📊 CSV Files                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ /data/credit_card_fraud_2023/creditcard_2023.csv               ││
│  │ /data/wamc_fraud/creditcard.csv                                 ││
│  │ /data/financial_phrasebank/all-data.csv                        ││
│  │ /data/customer_attrition/BankChurners.csv                      ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

## 🔄 사용자 요청 처리 플로우

### **1. 페이지 요청 플로우**
```
User clicks navigation link
         │
         ▼
┌─────────────────┐
│   🌐 Browser    │ → GET /fraud
│   Request       │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  🛣️ RouteManager │ → @app.route('/fraud')
│  URL Matching   │   @log_api_calls()
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ 📄 PageHandlers │ → fraud_page()
│ Template Render │   render_template('fraud.html')
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  🎨 HTML + CSS  │ → base.html + fraud.html
│  + JavaScript   │   + CSS modules + JS clients
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ 📊 Data Loading │ → APIClient.getFraudStatistics()
│ via AJAX        │   (비동기 데이터 로딩)
└─────────────────┘
```

### **2. API 요청 플로우**
```
JavaScript API call
         │
         ▼
┌─────────────────┐
│ 📦 Cache Check  │ → 5분 TTL 캐시 확인
│ (Client Side)   │   Hit: 즉시 반환
└─────────────────┘
         │ Miss
         ▼
┌─────────────────┐
│ 🌐 HTTP Request │ → fetch('/api/fraud/statistics')
│ to Flask API    │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ 🛣️ API Route    │ → @app.route('/api/fraud/statistics')
│ Matching        │   @log_api_calls()
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ 📡 APIHandlers  │ → fraud_statistics()
│ Method Call     │   
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ 💾 DataProcessor│ → load_fraud_data()
│ Data Loading    │   generate_fraud_statistics()
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ 📊 Data         │ → pandas processing
│ Processing      │   statistical calculations
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ 🔄 JSON         │ → jsonify(results)
│ Serialization   │   HTTP 200 response
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ 📦 Cache Store  │ → 클라이언트 캐시 저장
│ & UI Update     │   차트 렌더링
└─────────────────┘
```

## 📊 데이터 처리 세부 플로우

### **사기 탐지 데이터 플로우**
```
CSV Files → DataProcessor → Statistics → API → Charts
    │            │              │         │       │
    ▼            ▼              ▼         ▼       ▼
568K rows → load_fraud_data() → 사기율    → JSON → Plotly.js
283K rows → pandas.read_csv() → 평균금액  → 계산   → Bar Chart
1M+ rows  → memory caching   → 거래수    → 캐싱   → Table
```

### **감정 분석 데이터 플로우**
```
FinancialPhraseBank → DataProcessor → Analysis → API → Visualization
        │                 │            │        │         │
        ▼                 ▼            ▼        ▼         ▼
   14.7K sentences → load_sentiment_data() → 감정분포 → JSON → Pie Chart
   3 sentiment     → text processing      → 문장길이 → 응답   → Statistics
   categories      → statistical calc     → 신뢰도   → 전송   → Word Cloud
```

## 🎯 실시간 업데이트 플로우

### **자동 새로고침 메커니즘**
```
Page Load
    │
    ▼
┌─────────────────┐
│ ⏰ Timer Setup  │ → setInterval(5분)
│ (JavaScript)    │
└─────────────────┘
    │
    ▼ (Every 5 minutes)
┌─────────────────┐
│ 🔄 Auto Refresh │ → dashboard.refresh()
│ Trigger         │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ 📦 Cache Clear  │ → APIClient.clearCache()
│ & Data Reload   │   전체 데이터 재로딩
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ 📊 UI Update    │ → 차트 재렌더링
│ with New Data   │   애니메이션 효과
└─────────────────┘
```

### **헬스체크 모니터링**
```
Page Load → Health API → Status Display
    │           │            │
    ▼           ▼            ▼
DOM Ready → /api/health → 🟢 status-online
Timer     → system check → 🟡 status-warning  
(5초마다)  → module status → 🔴 status-error
```

## 🔧 에러 처리 플로우

### **계층별 에러 처리**
```
┌─────────────────┐
│ 🌐 Client Error │ → Network timeout, 404, 500
│ (JavaScript)    │   → Utils.showError()
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ 🛣️ Route Error  │ → 404 Page Not Found
│ (Flask)         │   → 500 Internal Error
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ 💾 Data Error   │ → File not found
│ (DataProcessor) │   → Invalid CSV format
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ 📊 Chart Error  │ → Plotly.js rendering error
│ (Frontend)      │   → Fallback HTML display
└─────────────────┘
```

## 🚀 성능 최적화 플로우

### **다층 캐싱 전략**
```
Request → L1 Cache → L2 Cache → Database → Response
   │         │         │         │           │
   ▼         ▼         ▼         ▼           ▼
User → Client Cache → API Cache → CSV Files → JSON
      (5분 TTL)    (메모리)     (파일시스템)  (HTTP)
      ↑                                        │
      └────────── 캐시 저장 ←──────────────────┘
```

### **비동기 로딩 최적화**
```
Page Load
    │
    ├─ HTML Template (즉시)
    ├─ CSS Modules (병렬)
    ├─ JavaScript (병렬)
    └─ API Data (비동기)
         │
         ├─ Summary Data
         ├─ Chart Data (병렬)
         └─ Statistics (병렬)
              │
              ▼
         Progressive Loading
         (데이터별 순차 렌더링)
```

이 상세한 플로우 다이어그램을 통해 FCA 시스템의 모든 동작 과정과 데이터 흐름을 완전히 투명하게 파악할 수 있습니다.