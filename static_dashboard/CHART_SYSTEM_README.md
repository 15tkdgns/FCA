# FCA 모듈화 차트 시스템

## 🚀 개요

고성능, 재사용성, 가독성을 중시한 모듈화된 차트 시스템입니다. 기존의 복잡한 차트 코드를 단순하고 직관적인 API로 대체하여 개발 효율성을 크게 향상시킵니다.

## ✨ 주요 특징

- **🔧 모듈화 구조**: 각 컴포넌트가 독립적으로 동작
- **⚡ 고성능**: 메모리 효율적 관리 및 최적화된 렌더링
- **📱 반응형**: 모든 디바이스에서 완벽한 표시
- **🎨 테마 지원**: 라이트/다크 테마 자동 전환
- **🛡️ 에러 처리**: 자동화된 에러 처리 및 폴백
- **🔗 단일 의존성**: Plotly.js만 필요
- **📚 간편 API**: 직관적이고 사용하기 쉬운 인터페이스

## 📦 설치 및 설정

### 1. 의존성 추가

```html
<!-- HTML 헤더에 추가 -->
<script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
```

### 2. 모듈 로드

```html
<!-- 모듈 스크립트 로드 -->
<script type="module" src="assets/js/modules/ChartLoader.js"></script>
<script type="module" src="assets/js/modules/ChartComponents.js"></script>
<script type="module" src="assets/js/modules/ChartInterface.js"></script>
```

### 3. 초기화

```javascript
// 자동 초기화 (권장)
// DOMContentLoaded 시 자동으로 초기화됩니다

// 수동 초기화
await EasyChart.init({
    defaultTheme: 'light',
    enableCaching: true
});
```

## 🎯 사용법

### 기본 사용법

```javascript
// 파이 차트
await EasyChart.pie('chart-container', {
    title: '사기 거래 분포',
    labels: ['정상 거래', '사기 거래'],
    values: [920, 80]
});

// 바 차트
await EasyChart.bar('chart-container', {
    title: '모델 성능',
    x: ['Random Forest', 'XGBoost', 'SVM'],
    y: [0.94, 0.96, 0.89],
    xTitle: '모델',
    yTitle: '정확도'
});

// 라인 차트
await EasyChart.line('chart-container', {
    title: '성능 추세',
    x: ['Jan', 'Feb', 'Mar'],
    y: [0.91, 0.93, 0.95],
    xTitle: '월',
    yTitle: '정확도'
});
```

### 고급 사용법

```javascript
// 옵션과 함께 차트 생성
const chart = await EasyChart.create('scatter', 'chart-container', {
    title: '특성 상관관계',
    x: [1, 2, 3, 4, 5],
    y: [2, 4, 6, 8, 10]
}, {
    theme: 'dark',
    showTrendline: true,
    markerSize: 8
});

// 차트 업데이트
await EasyChart.interface.updateChart('chart-container', newData);

// 차트 삭제
EasyChart.interface.destroyChart('chart-container');
```

## 📊 지원하는 차트 타입

| 타입 | 메서드 | 설명 |
|------|--------|------|
| `pie` | `EasyChart.pie()` | 파이/도넛 차트 |
| `bar` | `EasyChart.bar()` | 막대 차트 |
| `line` | `EasyChart.line()` | 라인 차트 |
| `scatter` | `EasyChart.scatter()` | 산점도 |
| `histogram` | `EasyChart.histogram()` | 히스토그램 |
| `heatmap` | `EasyChart.heatmap()` | 히트맵 |

## 🔄 기존 코드 마이그레이션

### Before (기존 방식)
```javascript
const chartManager = new ChartManager();
await chartManager.init();
const renderer = chartManager.getRenderer();
const pieCharts = new PieCharts(renderer);

if (chartsData?.fraud_distribution) {
    const result = pieCharts.renderFraudDistribution(chartsData.fraud_distribution);
    if (!result) {
        renderer.renderError('fraud-chart', 'Fraud Distribution', 'Render failed');
    }
}
```

### After (새로운 방식)
```javascript
await EasyChart.pie('fraud-chart', {
    title: 'Fraud Distribution',
    labels: chartsData.fraud_distribution.labels,
    values: chartsData.fraud_distribution.data
});
```

## 🎨 테마 시스템

### 테마 설정
```javascript
// 테마 변경
EasyChart.interface.setTheme('dark');

// 테마별 차트 생성
await EasyChart.pie('chart-container', data, {
    theme: 'dark'
});
```

### CSS 변수 기반 테마
```css
:root {
    --theme-mode: 'light';
    --primary-color: #4e73df;
    --accent-color: #1cc88a;
}

[data-theme="dark"] {
    --theme-mode: 'dark';
    --primary-color: #5a9fd4;
    --accent-color: #2dd4bf;
}
```

## 🛠️ 고급 기능

### 이벤트 시스템
```javascript
// 차트 이벤트 리스너
EasyChart.interface.on('chartRendered', (event) => {
    console.log('Chart rendered:', event);
});

EasyChart.interface.on('chartError', (event) => {
    console.error('Chart error:', event);
});
```

### 커스텀 컴포넌트
```javascript
// 커스텀 차트 컴포넌트 생성
class CustomChartComponent extends BaseChartComponent {
    async render(data) {
        // 커스텀 렌더링 로직
    }
}

// 팩토리에 등록
ChartFactory.registerType('custom', CustomChartComponent);
```

### 메모리 관리
```javascript
// 모든 차트 정리
EasyChart.interface.cleanup();

// 특정 차트 정리
EasyChart.interface.destroyChart('chart-container');

// 헬스체크
const health = EasyChart.interface.healthCheck();
console.log('System health:', health);
```

## 🔧 설정 옵션

### ChartInterface 옵션
```javascript
await EasyChart.init({
    autoInit: true,              // 자동 초기화
    dependencyTimeout: 10000,    // 의존성 대기 시간
    enableCaching: true,         // 캐싱 활성화
    defaultTheme: 'light',       // 기본 테마
    memoryLimit: 100            // 메모리 제한 (MB)
});
```

### 차트별 옵션
```javascript
// 파이 차트 옵션
await EasyChart.pie('container', data, {
    showValues: true,
    showPercent: true,
    showLegend: true
});

// 바 차트 옵션
await EasyChart.bar('container', data, {
    orientation: 'horizontal',
    showGrid: true,
    tickAngle: -45
});

// 라인 차트 옵션
await EasyChart.line('container', data, {
    showMarkers: true,
    lineWidth: 3,
    markerSize: 6
});
```

## 📈 성능 최적화

### 권장사항
- 큰 데이터셋의 경우 페이징 또는 샘플링 사용
- 불필요한 차트는 즉시 정리
- 테마 변경 시 모든 차트를 한 번에 업데이트
- 리사이즈 이벤트는 자동으로 디바운싱됨

### 성능 모니터링
```javascript
// 성능 테스트
const startTime = performance.now();
await EasyChart.pie('container', data);
const duration = performance.now() - startTime;
console.log(`Render time: ${duration}ms`);

// 메모리 사용량 확인
const status = EasyChart.interface.getStatus();
console.log('Chart count:', status.chartCount);
```

## 🐛 에러 처리

### 자동 에러 처리
시스템은 다음과 같은 에러를 자동으로 처리합니다:
- 컨테이너 없음
- 잘못된 데이터 형식
- Plotly.js 렌더링 실패
- 메모리 부족

### 커스텀 에러 처리
```javascript
try {
    await EasyChart.pie('container', data);
} catch (error) {
    console.error('Chart creation failed:', error);
    // 커스텀 에러 처리
}

// 에러 이벤트 리스너
EasyChart.interface.on('chartError', (event) => {
    // 전역 에러 처리
    logError(event.error);
    showUserNotification('차트 로드에 실패했습니다.');
});
```

## 🧪 테스트

### 단위 테스트
```javascript
// 차트 시스템 상태 확인
const health = EasyChart.interface.healthCheck();
console.assert(health.healthy, 'Chart system should be healthy');

// 차트 생성 테스트
const chart = await EasyChart.pie('test-container', testData);
console.assert(chart.isRendered, 'Chart should be rendered');
```

### 통합 테스트
```javascript
// 데모 페이지에서 제공되는 테스트 실행
await chartDemo.runPerformanceTest();
await chartDemo.testLegacyCompatibility();
```

## 📁 파일 구조

```
assets/js/modules/
├── ChartLoader.js          # 차트 로딩 및 관리
├── ChartComponents.js      # 재사용 가능한 차트 컴포넌트
├── ChartInterface.js       # 통합 인터페이스
└── base-chart.js          # 기본 차트 클래스 (기존)

chart-demo.html             # 데모 페이지
chart-demo.js              # 데모 및 예시 코드
CHART_SYSTEM_README.md     # 이 문서
```

## 🤝 기여하기

1. 새로운 차트 타입 추가
2. 성능 최적화
3. 테마 개선
4. 문서 업데이트
5. 버그 리포트

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 제공됩니다.

## 📞 지원

- 문서: 이 README 파일
- 데모: `chart-demo.html` 페이지
- 예시: `chart-demo.js` 파일
- 이슈: GitHub Issues

---

**Made with ❤️ for better data visualization**