# FCA 프로젝트 데이터 접근 규칙 및 가이드라인

## 📋 개요

이 문서는 FCA 프로젝트에서 **데이터 관리의 일관성과 안정성**을 보장하기 위한 필수 규칙입니다.

> ⚠️ **중요**: AI가 임의로 새로운 데이터 로직을 생성하거나 기존 구조를 변경하는 것을 방지하기 위한 규칙입니다.

## 🏗️ 핵심 원칙

### 1. 중앙집중식 데이터 관리
- **모든 데이터 접근은 `DataService`를 통해서만 수행**
- 직접 `fetch()`, `XMLHttpRequest`, `axios` 등 사용 금지
- 개별 컴포넌트에서 별도 데이터 로직 생성 금지

### 2. 상태 관리 통일
- **모든 상태 변경은 `StateManager`를 통해서만 수행**
- 글로벌 변수, `window` 객체 직접 사용 금지
- 컴포넌트 간 데이터 공유는 `StateManager.subscribe()` 사용

### 3. 견고성 우선
- 시니어 개발자가 검증한 코어 모듈만 사용
- AI가 임의로 API 엔드포인트나 데이터 구조 변경 금지
- 새로운 데이터 요구사항은 기존 메서드 확장으로 해결

---

## 📚 사용법 가이드

### ✅ 올바른 데이터 접근 방법

```javascript
// 1. 사기 탐지 데이터 로드
const fraudData = await DataService.getFraudData();

// 2. XAI 분석 데이터 로드  
const xaiData = await DataService.getXAIData();

// 3. 대시보드 전체 데이터 로드
const allData = await DataService.loadDashboardData();

// 4. 상태 관리
StateManager.dispatch('SET_FRAUD_DATA', fraudData);
const currentData = StateManager.get('fraudData');

// 5. 상태 변화 구독
StateManager.subscribe('fraudData', (newData, oldData) => {
    console.log('Fraud data updated:', newData);
});
```

### ❌ 금지된 방법들

```javascript
// ❌ 직접 fetch 사용 금지
const response = await fetch('data/fraud_data.json');

// ❌ 글로벌 변수 생성 금지
window.fraudData = data;

// ❌ 임의의 데이터 로직 생성 금지
function loadMyCustomData() {
    // 새로운 데이터 로직 작성 금지
}

// ❌ 상태 직접 변경 금지
someGlobalState.fraudData = newData;
```

---

## 🛠️ DataService API 레퍼런스

### 핵심 메서드

| 메서드 | 용도 | 반환값 |
|--------|------|--------|
| `DataService.getFraudData()` | 사기 탐지 데이터 | Promise\<FraudData\> |
| `DataService.getXAIData()` | XAI 분석 데이터 | Promise\<XAIData\> |
| `DataService.getSentimentData()` | 감정 분석 데이터 | Promise\<SentimentData\> |
| `DataService.getAttritionData()` | 이탈 예측 데이터 | Promise\<AttritionData\> |
| `DataService.getPerformanceData()` | 성능 메트릭 데이터 | Promise\<PerformanceData\> |
| `DataService.loadDashboardData()` | 전체 대시보드 데이터 | Promise\<AllData\> |

### 특징
- ✅ 자동 캐싱 (10분)
- ✅ 재시도 로직 (3회)
- ✅ 타임아웃 처리 (8초)
- ✅ 데이터 검증
- ✅ 오류 처리 및 폴백

---

## 🏪 StateManager API 레퍼런스

### 상태 조회
```javascript
// 전체 상태 조회
const state = StateManager.getState();

// 특정 값 조회
const fraudData = StateManager.get('fraudData');
```

### 상태 변경
```javascript
// 액션 디스패치 (상태 변경의 유일한 방법)
StateManager.dispatch('SET_FRAUD_DATA', newData);
StateManager.dispatch('SET_LOADING', { key: 'fraud', loading: true });
```

### 상태 구독
```javascript
// 변화 감지
const unsubscribe = StateManager.subscribe('fraudData', (newValue, oldValue) => {
    // 데이터 변화 처리
});

// 일회성 구독
StateManager.subscribeOnce('systemReady', () => {
    console.log('System is ready!');
});
```

### 편의 메서드
```javascript
StateManager.setLoading('fraud', true);
StateManager.addError({ type: 'DATA_ERROR', message: 'Load failed' });
StateManager.navigateTo('fraud');
StateManager.markChartFailed('chart-id');
```

---

## 🚨 팀 규칙 (필수 준수)

### 개발자 규칙
1. **데이터가 필요하면 새로 만들지 말고 `DataService.getXXXData()` 사용**
2. **상태 관리가 필요하면 `StateManager` 사용**
3. **새로운 엔드포인트 필요시 시니어 개발자와 상의**

### AI 사용 규칙
1. **AI에게 "새로운 데이터 로직 만들어줘" 요청 금지**
2. **AI에게 "fetch로 데이터 가져와줘" 요청 금지** 
3. **AI에게 "데이터 구조 바꿔줘" 요청 금지**

### 코드 리뷰 체크리스트
- [ ] `fetch()` 직접 사용하지 않았는가?
- [ ] `DataService` 메서드를 올바르게 사용했는가?
- [ ] `StateManager`를 통해 상태를 관리하는가?
- [ ] 새로운 글로벌 변수를 생성하지 않았는가?

---

## 📁 파일 구조

```
static_dashboard/assets/js/core/
├── data-service.js      # 🔒 DataService (시니어 개발자 관리)
├── state-manager.js     # 🔒 StateManager (시니어 개발자 관리)
└── api-service.js       # 🔒 기존 API 서비스 (deprecated)

static_dashboard/assets/js/utils/
├── data-manager.js      # 🔒 기존 DataManager (deprecated)
└── common-utils.js      # 공통 유틸리티
```

> 🔒 표시된 파일들은 **시니어 개발자만 수정 가능**합니다.

---

## 🔧 마이그레이션 가이드

### 기존 코드 → 새로운 시스템

```javascript
// Before (기존 방식)
const response = await fetch('data/fraud_data.json');
const fraudData = await response.json();
window.globalFraudData = fraudData;

// After (새로운 방식)
const fraudData = await DataService.getFraudData();
StateManager.dispatch('SET_FRAUD_DATA', fraudData);
```

### 차트 컴포넌트 마이그레이션

```javascript
// Before
async function loadChartData() {
    const response = await fetch('data/xai_data.json');
    const data = await response.json();
    renderChart(data);
}

// After  
async function loadChartData() {
    const data = await DataService.getXAIData();
    StateManager.dispatch('SET_XAI_DATA', data);
    
    StateManager.subscribe('xaiData', (newData) => {
        renderChart(newData);
    });
}
```

---

## 🔍 디버깅 도구

### DataService 디버깅
```javascript
// 콘솔에서 실행
console.log(DataService.debug());
```

### StateManager 디버깅
```javascript
// 콘솔에서 실행  
console.log(StateManager.debug());
```

---

## ❓ FAQ

**Q: 새로운 API 엔드포인트가 필요한데 어떻게 하나요?**
A: 시니어 개발자에게 요청하여 `DataService`에 새 메서드를 추가해 달라고 하세요.

**Q: AI에게 "데이터 로딩 코드 만들어줘"라고 하면 안 되나요?**  
A: 안 됩니다. 대신 "기존 DataService.getXXXData() 메서드 사용해줘"라고 요청하세요.

**Q: 성능상 직접 fetch를 써야 할 것 같은데요?**
A: DataService는 이미 캐싱과 최적화가 적용되어 있습니다. 직접 구현하지 마세요.

**Q: 상태 관리 라이브러리(Redux, Zustand 등) 추가하면 안 되나요?**
A: 안 됩니다. StateManager가 이미 필요한 기능을 제공합니다.

---

## 📞 문의 및 지원

- **데이터 구조 변경**: 시니어 개발자와 상의
- **새로운 API 추가**: 시니어 개발자에게 요청
- **버그 리포트**: GitHub Issues 사용
- **사용법 문의**: 이 문서의 예제 참조

---

**마지막 업데이트**: 2025-08-04  
**관리자**: 시니어 개발자  
**준수 필수**: 모든 팀원 및 AI 어시스턴트