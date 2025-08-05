/**
 * Static Dashboard Controller
 * ==========================
 * 
 * 정적 웹을 위한 대시보드 컨트롤러
 * 메인 웹앱의 기능을 정적 환경에서 구현
 */

class StaticDashboard {
    constructor() {
        this.summaryData = null;
        this.chartsData = null;
        this.init();
    }

    async init() {
        try {
            this.showLoading();
            await this.loadData();
            await this.initializeUI();
            await this.loadCharts();
            this.hideLoading();
            console.log('✅ Static Dashboard initialized');
        } catch (error) {
            console.error('❌ Dashboard initialization error:', error);
            this.showError('Failed to initialize dashboard');
        }
    }

    async loadData() {
        try {
            this.summaryData = await window.APIClient.getSummary();
            this.chartsData = await window.APIClient.getChartsData();
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    async initializeUI() {
        this.updateSummaryCards();
        this.updateSystemStatus();
        this.updatePerformanceMetrics();
    }

    updateSummaryCards() {
        if (!this.summaryData) return;

        const summary = this.summaryData;
        
        // 총 모델 수
        const totalModelsEl = document.getElementById('total-models');
        if (totalModelsEl) {
            totalModelsEl.textContent = summary.models_trained || 3;
        }

        // 총 데이터셋 수
        const totalDatasetsEl = document.getElementById('total-datasets');
        if (totalDatasetsEl) {
            totalDatasetsEl.textContent = summary.total_datasets || 3;
        }

        // 평균 성능
        const avgPerformanceEl = document.getElementById('avg-performance');
        if (avgPerformanceEl && summary.overall_metrics) {
            const accuracy = (summary.overall_metrics.avg_accuracy * 100).toFixed(1);
            avgPerformanceEl.textContent = `${accuracy}%`;
        }

        console.log('✅ Summary cards updated');
    }

    updateSystemStatus() {
        const statusEl = document.getElementById('system-status');
        if (statusEl && this.summaryData) {
            const status = this.summaryData.system_status || 'operational';
            statusEl.textContent = status.toUpperCase();
            statusEl.className = `badge ${status === 'operational' ? 'bg-success' : 'bg-warning'}`;
        }
    }

    updatePerformanceMetrics() {
        if (!this.summaryData || !this.summaryData.domain_summary) return;

        const domains = this.summaryData.domain_summary;

        // 사기 탐지 메트릭
        this.updateDomainMetric('fraud', domains.fraud_detection);
        
        // 감정 분석 메트릭
        this.updateDomainMetric('sentiment', domains.sentiment_analysis);
        
        // 고객 이탈 메트릭
        this.updateDomainMetric('attrition', domains.attrition_prediction);
    }

    updateDomainMetric(domain, data) {
        if (!data) return;

        const accuracyEl = document.getElementById(`${domain}-accuracy`);
        const statusEl = document.getElementById(`${domain}-status`);
        const dataPointsEl = document.getElementById(`${domain}-datapoints`);

        if (accuracyEl) {
            accuracyEl.textContent = `${(data.accuracy * 100).toFixed(1)}%`;
        }

        if (statusEl) {
            statusEl.textContent = data.status.toUpperCase();
            statusEl.className = `badge ${data.status === 'active' ? 'bg-success' : 'bg-warning'}`;
        }

        if (dataPointsEl) {
            dataPointsEl.textContent = data.data_points.toLocaleString();
        }
    }

    async loadCharts() {
        if (!this.chartsData) return;

        // 모델 성능 비교 차트
        this.renderModelComparisonChart();
        
        // 도메인별 분포 차트
        this.renderDomainDistributionCharts();
        
        // 특성 중요도 차트 (선택적)
        this.renderFeatureImportanceCharts();
    }

    renderModelComparisonChart() {
        const chartEl = document.getElementById('model-comparison-chart');
        if (!chartEl || !this.chartsData.model_comparison) return;

        const data = this.chartsData.model_comparison;
        
        const trace = {
            x: data.models,
            y: data.accuracy,
            type: 'bar',
            marker: {
                color: data.colors || ['#007bff', '#28a745', '#ffc107']
            },
            text: data.accuracy.map(acc => `${(acc * 100).toFixed(1)}%`),
            textposition: 'auto',
        };

        const layout = {
            title: 'Model Performance Comparison',
            xaxis: { title: 'Models' },
            yaxis: { title: 'Accuracy', range: [0, 1] },
            margin: { l: 50, r: 50, t: 50, b: 100 }
        };

        Plotly.newPlot(chartEl, [trace], layout, {responsive: true});
        console.log('✅ Model comparison chart rendered');
    }

    renderDomainDistributionCharts() {
        // 사기 탐지 분포
        this.renderPieChart('fraud-distribution-chart', this.chartsData.fraud_distribution, 'Fraud vs Legitimate');
        
        // 감정 분석 분포
        this.renderPieChart('sentiment-distribution-chart', this.chartsData.sentiment_distribution, 'Sentiment Distribution');
        
        // 고객 이탈 분포
        this.renderPieChart('attrition-distribution-chart', this.chartsData.attrition_distribution, 'Customer Retention vs Churn');
    }

    renderPieChart(elementId, data, title) {
        const chartEl = document.getElementById(elementId);
        if (!chartEl || !data) return;

        const trace = {
            labels: data.labels,
            values: data.data,
            type: 'pie',
            marker: {
                colors: data.colors
            },
            textinfo: 'label+percent',
            textposition: 'auto'
        };

        const layout = {
            title: title,
            margin: { t: 50, b: 50, l: 50, r: 50 }
        };

        Plotly.newPlot(chartEl, [trace], layout, {responsive: true});
        console.log(`✅ ${title} chart rendered`);
    }

    renderFeatureImportanceCharts() {
        // 사기 탐지 특성 중요도
        if (this.chartsData.feature_importance && this.chartsData.feature_importance.fraud) {
            this.renderFeatureImportanceChart('fraud-features-chart', this.chartsData.feature_importance.fraud, 'Fraud Detection Feature Importance');
        }

        // 고객 이탈 특성 중요도
        if (this.chartsData.feature_importance && this.chartsData.feature_importance.attrition) {
            this.renderFeatureImportanceChart('attrition-features-chart', this.chartsData.feature_importance.attrition, 'Attrition Prediction Feature Importance');
        }
    }

    renderFeatureImportanceChart(elementId, data, title) {
        const chartEl = document.getElementById(elementId);
        if (!chartEl || !data) return;

        const features = Object.keys(data);
        const importance = Object.values(data);

        const trace = {
            x: importance,
            y: features,
            type: 'bar',
            orientation: 'h',
            marker: { color: '#17a2b8' }
        };

        const layout = {
            title: title,
            xaxis: { title: 'Importance Score' },
            yaxis: { title: 'Features' },
            margin: { l: 120, r: 50, t: 50, b: 50 }
        };

        Plotly.newPlot(chartEl, [trace], layout, {responsive: true});
        console.log(`✅ ${title} chart rendered`);
    }

    // 페이지 네비게이션
    showPage(pageId) {
        // 모든 페이지 숨기기
        document.querySelectorAll('.page-content').forEach(page => {
            page.style.display = 'none';
        });

        // 선택된 페이지 표시
        const targetPage = document.getElementById(`${pageId}-page`);
        if (targetPage) {
            targetPage.style.display = 'block';
        }

        // 네비게이션 업데이트
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        const activeLink = document.querySelector(`[data-page="${pageId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // 페이지별 초기화
        this.initializePage(pageId);
    }

    async initializePage(pageId) {
        switch(pageId) {
            case 'fraud':
                await this.initializeFraudPage();
                break;
            case 'sentiment':
                await this.initializeSentimentPage();
                break;
            case 'attrition':
                await this.initializeAttritionPage();
                break;
            case 'datasets':
                await this.initializeDatasetsPage();
                break;
        }
    }

    async initializeFraudPage() {
        const fraudData = await window.APIClient.getFraudData();
        // 사기 탐지 페이지 특화 차트 렌더링
        console.log('Fraud page initialized');
    }

    async initializeSentimentPage() {
        try {
            const sentimentData = await window.APIClient.getSentimentData();
            
            // 페이지별 데이터 업데이트
            this.updateSentimentPageData(sentimentData);
            
            // 페이지별 차트 렌더링
            this.renderSentimentPageCharts(sentimentData);
            
            console.log('✅ Sentiment page initialized');
        } catch (error) {
            console.warn('Sentiment page initialization failed:', error);
        }
    }

    async initializeAttritionPage() {
        try {
            const attritionData = await window.APIClient.getAttritionData();
            
            // 페이지별 데이터 업데이트
            this.updateAttritionPageData(attritionData);
            
            // 페이지별 차트 렌더링  
            this.renderAttritionPageCharts(attritionData);
            
            console.log('✅ Attrition page initialized');
        } catch (error) {
            console.warn('Attrition page initialization failed:', error);
        }
    }

    updateSentimentPageData(data) {
        if (!data || !data.dataset_info) return;

        const info = data.dataset_info;
        const perf = data.model_performance || {};

        // 총 문장 수
        const totalEl = document.getElementById('sentiment-total-sentences');
        if (totalEl) totalEl.textContent = info.total_sentences?.toLocaleString() || '4,846';

        // 모델 정확도
        const accuracyEl = document.getElementById('sentiment-accuracy-display');
        if (accuracyEl) accuracyEl.textContent = `${(perf.accuracy * 100).toFixed(1)}%`;

        // 평균 문장 길이
        const lengthEl = document.getElementById('sentiment-avg-length');
        if (lengthEl) lengthEl.textContent = info.avg_sentence_length?.toFixed(1) || '142.3';

        // 평균 단어 수
        const wordCountEl = document.getElementById('sentiment-word-count');
        if (wordCountEl) wordCountEl.textContent = info.avg_word_count?.toFixed(1) || '21.8';

        // 감정별 카운트 업데이트
        if (data.sentiment_distribution) {
            const dist = data.sentiment_distribution;
            
            ['positive', 'negative', 'neutral'].forEach(sentiment => {
                const countEl = document.getElementById(`${sentiment}-count`);
                if (countEl && dist[sentiment]) {
                    countEl.textContent = dist[sentiment].toLocaleString();
                }
            });
        }
    }

    updateAttritionPageData(data) {
        if (!data || !data.dataset_info) return;

        const info = data.dataset_info;
        const perf = data.model_performance || {};

        // 총 고객 수
        const totalEl = document.getElementById('attrition-total-customers');
        if (totalEl) totalEl.textContent = info.total_customers?.toLocaleString() || '10,127';

        // 이탈 고객 수
        const churnedEl = document.getElementById('attrition-churned-customers');
        if (churnedEl) churnedEl.textContent = info.churned_customers?.toLocaleString() || '8,500';

        // 이탈률
        const rateEl = document.getElementById('attrition-churn-rate');
        if (rateEl) rateEl.textContent = `${info.churn_rate?.toFixed(1)}%` || '83.9%';

        // 모델 정확도
        const accuracyEl = document.getElementById('attrition-accuracy-display');
        if (accuracyEl) accuracyEl.textContent = `${(perf.accuracy * 100).toFixed(1)}%`;
    }

    renderSentimentPageCharts(data) {
        // 감정 분포 차트
        if (data.sentiment_distribution) {
            const dist = data.sentiment_distribution;
            const chartData = {
                labels: Object.keys(dist),
                data: Object.values(dist),
                colors: ['#28a745', '#dc3545', '#6c757d']
            };
            this.renderPieChart('sentiment-page-distribution-chart', chartData, 'Sentiment Distribution');
        }

        // 모델 성능 차트
        if (data.model_performance) {
            const perf = data.model_performance;
            this.renderPerformanceChart('sentiment-performance-chart', perf, 'Sentiment Analysis Performance');
        }
    }

    renderAttritionPageCharts(data) {
        // 이탈 분포 차트
        if (data.dataset_info) {
            const info = data.dataset_info;
            const retained = info.total_customers - info.churned_customers;
            const chartData = {
                labels: ['Retained', 'Churned'],
                data: [retained, info.churned_customers],
                colors: ['#28a745', '#dc3545']
            };
            this.renderPieChart('attrition-page-distribution-chart', chartData, 'Customer Retention vs Churn');
        }

        // 고객 세그먼트 차트
        if (data.customer_segments) {
            const segments = data.customer_segments;
            const chartData = {
                labels: Object.keys(segments),
                data: Object.values(segments),
                colors: ['#17a2b8', '#28a745', '#ffc107', '#dc3545']
            };
            this.renderPieChart('attrition-segments-chart', chartData, 'Customer Segments');
        }

        // 특성 중요도 차트
        if (data.feature_importance) {
            this.renderFeatureImportanceChart('attrition-page-features-chart', data.feature_importance, 'Key Factors in Customer Churn');
        }
    }

    renderPerformanceChart(elementId, performance, title) {
        const chartEl = document.getElementById(elementId);
        if (!chartEl || !performance) return;

        const metrics = ['accuracy', 'precision', 'recall', 'f1_score'];
        const values = metrics.map(metric => performance[metric] || 0);
        const labels = metrics.map(metric => metric.replace('_', ' ').toUpperCase());

        const trace = {
            x: labels,
            y: values,
            type: 'bar',
            marker: { color: '#17a2b8' },
            text: values.map(val => `${(val * 100).toFixed(1)}%`),
            textposition: 'auto'
        };

        const layout = {
            title: title,
            xaxis: { title: 'Metrics' },
            yaxis: { title: 'Score', range: [0, 1] },
            margin: { l: 50, r: 50, t: 50, b: 50 }
        };

        Plotly.newPlot(chartEl, [trace], layout, {responsive: true});
        console.log(`✅ ${title} chart rendered`);
    }

    async initializeDatasetsPage() {
        const datasetsData = await window.APIClient.getDatasetsInfo();
        // 데이터셋 페이지 특화 내용 렌더링
        console.log('Datasets page initialized');
    }

    // 유틸리티 메소드
    showLoading() {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.style.display = 'block';
        }
    }

    hideLoading() {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }

        const contentEl = document.getElementById('page-content');
        if (contentEl) {
            contentEl.style.display = 'block';
        }
    }

    showError(message) {
        const errorEl = document.getElementById('error-message');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
        this.hideLoading();
    }
}

// 전역 대시보드 인스턴스 생성
window.dashboard = new StaticDashboard();

console.log('✅ Static Dashboard loaded');