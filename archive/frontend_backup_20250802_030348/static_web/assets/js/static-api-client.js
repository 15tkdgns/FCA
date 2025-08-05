/**
 * Static Web API Client
 * ====================
 * 
 * 정적 웹을 위한 API 클라이언트
 * JSON 파일에서 데이터를 로드하여 기존 API와 호환
 */

class StaticAPIClient {
    constructor() {
        this.baseURL = './data';
        this.cache = new Map();
        this.cacheTTL = 30 * 60 * 1000; // 30분 캐시
    }

    /**
     * JSON 파일에서 데이터 로드
     */
    async request(endpoint, options = {}) {
        try {
            // 캐시 확인
            const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
            const cached = this.cache.get(cacheKey);
            
            if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
                return cached.data;
            }

            // 엔드포인트를 파일 경로로 변환
            const filePath = this.endpointToFilePath(endpoint);
            
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // 캐시 저장
            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });

            return data;

        } catch (error) {
            console.error(`API request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    /**
     * API 엔드포인트를 JSON 파일 경로로 변환
     */
    endpointToFilePath(endpoint) {
        const mapping = {
            '/api/summary': './data/summary.json',
            '/api/fraud': './data/fraud_data.json',
            '/api/sentiment': './data/sentiment_data.json',
            '/api/attrition': './data/attrition_data.json',
            '/api/charts': './data/charts.json',
            '/api/datasets': './data/datasets.json',
            '/api/health': './data/summary.json' // health는 summary로 대체
        };

        return mapping[endpoint] || `${this.baseURL}/${endpoint.replace('/api/', '')}.json`;
    }

    // 편의 메소드들
    async getSummary() {
        return this.request('/api/summary');
    }

    async getFraudData() {
        return this.request('/api/fraud');
    }

    async getSentimentData() {
        return this.request('/api/sentiment');
    }

    async getAttritionData() {
        return this.request('/api/attrition');
    }

    async getChartsData() {
        return this.request('/api/charts');
    }

    async getDatasetsInfo() {
        return this.request('/api/datasets');
    }

    // 추가 메소드들 (호환성을 위해)
    async getFraudStatistics() {
        return this.getFraudData();
    }

    async getSentimentStatistics() {
        return this.getSentimentData();
    }

    async getAttritionStatistics() {
        return this.getAttritionData();
    }

    async getHealthStatus() {
        const summary = await this.getSummary();
        return {
            status: summary.system_status || 'operational',
            timestamp: summary.last_updated || new Date().toISOString(),
            message: 'Static web version running'
        };
    }

    // 차트별 데이터 조회
    async getChart(chartType) {
        const charts = await this.getChartsData();
        return charts[chartType] || null;
    }
}

// 전역 API 클라이언트 인스턴스 생성
window.APIClient = new StaticAPIClient();
window.StaticAPIClient = StaticAPIClient;

console.log('✅ Static API Client loaded');