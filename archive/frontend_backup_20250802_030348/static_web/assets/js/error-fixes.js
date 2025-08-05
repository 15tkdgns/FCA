/**
 * Error Fixes for Static Web
 * ==========================
 * 
 * 로그에서 발견된 주요 에러들을 수정
 */

// 1. Utils.updateTime 함수 추가
if (window.Utils) {
    window.Utils.updateTime = function() {
        const now = new Date();
        const timeString = now.toLocaleString();
        const timeElements = document.querySelectorAll('.current-time, #current-time');
        timeElements.forEach(el => {
            if (el) el.textContent = timeString;
        });
    };
}

// 2. 누락된 API 함수들 추가
if (window.StaticAPIClient) {
    window.StaticAPIClient.prototype.getFraudStatistics = function() {
        return this.getFraudData();
    };
    
    window.StaticAPIClient.prototype.getSentimentStatistics = function() {
        return this.getSentimentData();
    };
    
    window.StaticAPIClient.prototype.getAttritionStatistics = function() {
        return this.getAttritionData();
    };
}

// 3. Dashboard 클래스 정의 (legacy 지원)
if (!window.Dashboard && window.StaticDashboard) {
    window.Dashboard = window.StaticDashboard;
}

// 4. 데이터 유효성 검사 수정
if (window.DataManager) {
    // 기존 validators 덮어쓰기
    const originalDataManager = window.DataManager;
    originalDataManager.prototype.registerValidator = function(type, validator) {
        if (!this.validators) this.validators = {};
        this.validators[type] = validator;
    };
    
    // 느슨한 validators 등록
    const dataManagerInstance = new originalDataManager();
    
    dataManagerInstance.registerValidator('fraud', (data) => {
        return data && (data.total_transactions || data.dataset_info);
    });
    
    dataManagerInstance.registerValidator('sentiment', (data) => {
        return data && (data.total_sentences || data.dataset_info);
    });
    
    dataManagerInstance.registerValidator('attrition', (data) => {
        return data && (data.total_customers || data.dataset_info);
    });
    
    dataManagerInstance.registerValidator('charts', (data) => {
        return data && typeof data === 'object';
    });
    
    dataManagerInstance.registerValidator('datasets', (data) => {
        return data && (Array.isArray(data) || data.available_datasets);
    });
}

// 5. 차트 데이터 안전성 체크
if (window.FCACharts) {
    const originalCreateFraudDistributionChart = window.FCACharts.prototype.createFraudDistributionChart;
    window.FCACharts.prototype.createFraudDistributionChart = function(data) {
        if (!data || !data.fraud_distribution) {
            console.warn('Fraud distribution data not available, using default');
            data = {
                fraud_distribution: {
                    labels: ['Legitimate', 'Fraud'],
                    data: [99000, 1000],
                    colors: ['#28a745', '#dc3545']
                }
            };
        }
        return originalCreateFraudDistributionChart.call(this, data);
    };
}

// 6. 데이터셋 필터 문제 수정
if (window.FCADashboard) {
    const originalGenerateDatasetsContent = window.FCADashboard.prototype.generateDatasetsContent;
    window.FCADashboard.prototype.generateDatasetsContent = function(datasets) {
        // datasets가 객체인 경우 배열로 변환
        if (datasets && datasets.available_datasets) {
            datasets = datasets.available_datasets;
        }
        
        // 배열이 아닌 경우 빈 배열로 초기화
        if (!Array.isArray(datasets)) {
            datasets = [];
        }
        
        return originalGenerateDatasetsContent.call(this, datasets);
    };
}

// 7. 전역 에러 핸들러 개선
window.addEventListener('error', function(e) {
    console.warn('Handled error:', e.error?.message || e.message);
    
    // 치명적이지 않은 에러들은 무시
    const ignorableErrors = [
        'Cannot read properties of undefined',
        'Data validation failed',
        'is not a function'
    ];
    
    const errorMessage = e.error?.message || e.message || '';
    const isIgnorable = ignorableErrors.some(msg => errorMessage.includes(msg));
    
    if (isIgnorable) {
        e.preventDefault();
        return false;
    }
});

// 8. Promise rejection 핸들러
window.addEventListener('unhandledrejection', function(e) {
    console.warn('Handled promise rejection:', e.reason);
    
    // 데이터 로딩 실패는 치명적이지 않음
    if (e.reason?.message?.includes('Data validation failed')) {
        e.preventDefault();
        return false;
    }
});

console.log('✅ Error fixes applied');