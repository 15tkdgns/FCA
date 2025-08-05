/**
 * FCA API Client
 * ==============
 * 
 * FCA backend API와 통신하기 위한 클라이언트 클래스
 * - HTTP 요청 처리
 * - response caching으로 performance optimization  
 * - error handling 및 retry logic
 * - 모든 API 엔드포인트에 대한 편의 메소드 제공
 */
class APIClient {
    constructor() {
        this.baseURL = window.location.origin;      // current page의 origin 사용
        this.cache = new Map();                     // API 응답 cache storage
        this.cacheTTL = 5 * 60 * 1000;             // cache TTL (5분)
    }

    /**
     * generic HTTP request 메소드
     * 
     * @param {string} endpoint - API 엔드포인트 경로
     * @param {Object} options - fetch 옵션 (method, headers, body 등)
     * @returns {Promise<Object>} API 응답 데이터
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        // 캐시에서 먼저 confirm (GET 요청의 경우 성능 향상)
        const cacheKey = `${endpoint}${JSON.stringify(options)}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            console.log(`📦 Cache hit for ${endpoint}`);
            return cached.data;
        }

        // 로딩 status 표시
        const startTime = performance.now();
        console.log(`🔄 API request starting: ${endpoint}`);

        try {
            // HTTP 요청 실행
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            // HTTP 에러 status confirm
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // JSON 응답 파싱
            const data = await response.json();
            
            // success한 응답을 캐시에 save
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });

            const duration = Math.round(performance.now() - startTime);
            console.log(`✅ API request completed: ${endpoint} (${duration}ms)`);

            return data;
        } catch (error) {
            const duration = Math.round(performance.now() - startTime);
            console.error(`❌ API request failed for ${endpoint} (${duration}ms):`, error);
            
            // 사용자 친화적 에러 메시지 표시
            if (window.Utils) {
                Utils.showError(`네트워크 error: ${endpoint}`);
            }
            
            throw error;
        }
    }

    /**
     * 프로젝트 summary info API 호출
     * dashboard 메인 화면에서 사용할 all 프로젝트 통계
     * 
     * @returns {Promise<Object>} { status: 'success'|'error', data|error }
     */
    async getSummary() {
        try {
            const data = await this.request('/api/summary');
            return { status: 'success', data };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    /**
     * 차트 데이터 API 호출
     * Plotly.js chart rendering을 위한 데이터 요청
     * 
     * @param {string} chartType - 차트 타입 (overview, distribution, success, radar)
     * @returns {Promise<Object>} { status: 'success'|'error', data|error }
     */
    async getChart(chartType) {
        try {
            const data = await this.request(`/api/chart/${chartType}`);
            return { status: 'success', data };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    /**
     * 시스템 헬스체크 API 호출
     * 서버 status 및 모듈 로딩 status confirm
     * 
     * @returns {Promise<Object>} { status: 'success'|'error', data|error }
     */
    async getHealth() {
        try {
            const data = await this.request('/api/health');
            return { status: 'success', data };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    /**
     * fraud detection 통계 API 호출
     * 실제 fraud detection 데이터셋의 상세 통계 info
     * 
     * @returns {Promise<Object>} { status: 'success'|'error', data|error }
     */
    async getFraudStatistics() {
        try {
            const data = await this.request('/api/fraud/statistics');
            return { status: 'success', data };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    // Sentiment data
    async getSentimentData() {
        try {
            const data = await this.request('/api/sentiment/data');
            return { status: 'success', data };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    // Attrition data
    async getAttritionData() {
        try {
            const data = await this.request('/api/attrition/data');
            return { status: 'success', data };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    // Domain results
    async getDomainResults(domain) {
        try {
            const data = await this.request(`/api/results/${domain}`);
            return { status: 'success', data };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    // Model comparison
    async getModelComparison() {
        try {
            const data = await this.request('/api/models/compare');
            return { status: 'success', data };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }
}

// Create global instance
window.APIClient = new APIClient();