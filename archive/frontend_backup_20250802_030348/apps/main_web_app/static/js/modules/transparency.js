/**
 * 투명성 dashboard JavaScript 모듈
 * ====================================
 * 
 * 투명성 dashboard의 핵심 기능을 담당하는 모듈
 */

class TransparencyDashboard {
    constructor() {
        this.updateInterval = 2000;
        this.fraudCount = 0;
        this.sentimentCount = 0;
        this.attritionCount = 0;
        this.performanceData = {
            labels: [],
            fraudAccuracy: [],
            sentimentAccuracy: [],
            attritionAccuracy: []
        };
        this.apiEndpoints = {
            metrics: '/api/metrics',
            processingSteps: '/api/transparency/processing-steps',
            dataFlow: '/api/transparency/data-flow'
        };
    }

    async init() {
        console.log('🚀 투명성 dashboard 초기화...');
        try {
            await this.loadMetrics();
            this.startRealTimeUpdates();
            this.initPerformanceChart();
            console.log('✅ 투명성 dashboard 초기화 complete');
        } catch (error) {
            console.error('❌ 투명성 dashboard 초기화 failed:', error);
            this.showError('dashboard 초기화에 failed했습니다.');
        }
    }

    async loadMetrics() {
        try {
            const response = await fetch(this.apiEndpoints.metrics);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.updateProcessingCounts(data);
            this.updateProcessDetails(data);
            this.updatePerformanceMetrics(data);
        } catch (error) {
            console.error('메트릭 로드 failed:', error);
            this.loadFallbackData();
        }
    }

    updateProcessingCounts(data) {
        this.fraudCount = data.fraud_detection?.processed_transactions || 50000;
        this.sentimentCount = data.sentiment_analysis?.analyzed_texts || 4840;
        this.attritionCount = data.attrition_prediction?.analyzed_customers || 10127;

        this.updateElement('fraud-processing-count', this.fraudCount.toLocaleString());
        this.updateElement('sentiment-processing-count', this.sentimentCount.toLocaleString());
        this.updateElement('attrition-processing-count', this.attritionCount.toLocaleString());
    }

    updateProcessDetails(data) {
        // fraud detection 상세 info
        const fraudData = data.fraud_detection;
        this.updateElement('fraud-data-info', `${fraudData.dataset || 'WAMC Credit Card'} 데이터셋`);
        this.updateElement('fraud-normal-count', (fraudData.processed_transactions - fraudData.detected_fraud).toLocaleString());
        this.updateElement('fraud-fraud-count', fraudData.detected_fraud.toLocaleString());
        this.updateElement('fraud-accuracy', fraudData.accuracy + '%');
        this.updateElement('fraud-precision', fraudData.precision + '%');

        // sentiment analysis 상세 info
        const sentimentData = data.sentiment_analysis;
        this.updateElement('sentiment-data-info', `${sentimentData.dataset || 'Financial Phrasebank'} 데이터셋`);
        this.updateElement('sentiment-positive', sentimentData.positive_ratio + '%');
        this.updateElement('sentiment-neutral', sentimentData.neutral_ratio + '%');
        this.updateElement('sentiment-negative', sentimentData.negative_ratio + '%');
        this.updateElement('sentiment-accuracy', sentimentData.accuracy + '%');
        this.updateElement('sentiment-f1', sentimentData.f1_score + '%');

        // 이탈 예측 상세 info
        const attritionData = data.attrition_prediction;
        this.updateElement('attrition-data-info', `${attritionData.dataset || 'Bank Churners'} 데이터셋`);
        this.updateElement('attrition-retained', (100 - attritionData.churn_rate).toFixed(1) + '%');
        this.updateElement('attrition-churned', attritionData.churn_rate + '%');
        this.updateElement('attrition-accuracy', attritionData.accuracy + '%');
        this.updateElement('attrition-recall', attritionData.recall + '%');
    }

    updatePerformanceMetrics(data) {
        const now = new Date();
        const timeLabel = now.toLocaleTimeString();
        
        this.performanceData.labels.push(timeLabel);
        this.performanceData.fraudAccuracy.push(data.fraud_detection.accuracy);
        this.performanceData.sentimentAccuracy.push(data.sentiment_analysis.accuracy);
        this.performanceData.attritionAccuracy.push(data.attrition_prediction.accuracy);

        // 최근 20개 데이터 포인트만 유지
        if (this.performanceData.labels.length > 20) {
            this.performanceData.labels.shift();
            this.performanceData.fraudAccuracy.shift();
            this.performanceData.sentimentAccuracy.shift();
            this.performanceData.attritionAccuracy.shift();
        }

        this.updatePerformanceChart();
    }

    initPerformanceChart() {
        if (typeof Plotly === 'undefined') {
            console.warn('Plotly.js가 로드되지 않았습니다.');
            return;
        }

        const data = [{
            x: this.performanceData.labels,
            y: this.performanceData.fraudAccuracy,
            type: 'scatter',
            mode: 'lines+markers',
            name: 'fraud detection',
            line: { color: '#dc3545' }
        }, {
            x: this.performanceData.labels,
            y: this.performanceData.sentimentAccuracy,
            type: 'scatter',
            mode: 'lines+markers',
            name: 'sentiment analysis',
            line: { color: '#17a2b8' }
        }, {
            x: this.performanceData.labels,
            y: this.performanceData.attritionAccuracy,
            type: 'scatter',
            mode: 'lines+markers',
            name: '이탈 예측',
            line: { color: '#ffc107' }
        }];

        const layout = {
            title: '실time model performance 모니터링',
            xaxis: { title: 'time' },
            yaxis: { 
                title: '정확도 (%)',
                range: [80, 100]
            },
            responsive: true
        };

        const chartElement = document.getElementById('performance-monitoring-chart');
        if (chartElement) {
            Plotly.newPlot('performance-monitoring-chart', data, layout);
        }
    }

    updatePerformanceChart() {
        if (typeof Plotly !== 'undefined' && this.performanceData.labels.length > 0) {
            const chartElement = document.getElementById('performance-monitoring-chart');
            if (chartElement) {
                Plotly.redraw('performance-monitoring-chart');
            }
        }
    }

    startRealTimeUpdates() {
        // 진행률 바 애니메이션
        this.animateProgressBars();
        
        // 정기적 데이터 업데이트
        setInterval(() => {
            this.loadMetrics();
        }, this.updateInterval);
    }

    animateProgressBars() {
        const progressBars = [
            'fraud-training-progress',
            'sentiment-processing-progress',
            'attrition-training-progress'
        ];

        progressBars.forEach((id, index) => {
            setTimeout(() => {
                const bar = document.querySelector(`#${id} .progress-bar`);
                if (bar) {
                    let width = 0;
                    const interval = setInterval(() => {
                        width += Math.random() * 10;
                        if (width >= 100) {
                            width = 100;
                            clearInterval(interval);
                            bar.classList.remove('progress-bar-animated');
                        }
                        bar.style.width = width + '%';
                    }, 100);
                }
            }, index * 1000);
        });
    }

    loadFallbackData() {
        console.warn('⚠️ API 데이터 로드 failed, 대체 데이터 사용');
        
        const fallbackData = {
            fraud_detection: {
                processed_transactions: 50000,
                detected_fraud: 77,
                accuracy: 99.9,
                precision: 81.8,
                dataset: 'WAMC Credit Card'
            },
            sentiment_analysis: {
                analyzed_texts: 4840,
                positive_ratio: 58.5,
                neutral_ratio: 26.8,
                negative_ratio: 14.7,
                accuracy: 86.7,
                f1_score: 84.2,
                dataset: 'Financial Phrasebank'
            },
            attrition_prediction: {
                analyzed_customers: 10127,
                churn_rate: 20.3,
                accuracy: 85.4,
                recall: 69.5,
                dataset: 'Bank Churners'
            }
        };

        this.updateProcessingCounts(fallbackData);
        this.updateProcessDetails(fallbackData);
        this.updatePerformanceMetrics(fallbackData);
    }

    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        } else {
            console.warn(`Element with id '${id}' not found`);
        }
    }

    showError(message) {
        console.error('투명성 dashboard error:', message);
        // 사용자에게 error 표시 (옵션)
        const errorContainer = document.getElementById('error-container');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    ${message}
                </div>
            `;
        }
    }

    // 외부에서 호출할 수 있는 refresh 메서드
    async refresh() {
        console.log('🔄 투명성 dashboard refresh...');
        await this.loadMetrics();
    }

    // 리소스 정리
    destroy() {
        if (this.updateIntervalId) {
            clearInterval(this.updateIntervalId);
        }
    }
}

// 모듈 익스포트 (ES6 모듈 사용 시)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TransparencyDashboard;
}

// 전역 객체에 클래스 등록 (브라우저 환경)
if (typeof window !== 'undefined') {
    window.TransparencyDashboard = TransparencyDashboard;
}