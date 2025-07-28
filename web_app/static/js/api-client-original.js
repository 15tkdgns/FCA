/**
 * FCA API Client
 * ==============
 * 
 * FCA 백엔드 API와 통신하기 위한 클라이언트 클래스
 * - HTTP 요청 처리
 * - 응답 캐싱으로 성능 최적화  
 * - 에러 처리 및 재시도 로직
 * - 모든 API 엔드포인트에 대한 편의 메소드 제공
 */
class APIClient {
    constructor() {
        this.baseURL = window.location.origin;      // 현재 페이지의 origin 사용
        this.cache = new Map();                     // API 응답 캐시 저장소
        this.cacheTTL = 5 * 60 * 1000;             // 캐시 유효 시간 (5분)
    }

    /**
     * 범용 HTTP 요청 메소드
     * 
     * @param {string} endpoint - API 엔드포인트 경로
     * @param {Object} options - fetch 옵션 (method, headers, body 등)
     * @returns {Promise<Object>} API 응답 데이터
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        // 캐시에서 먼저 확인 (GET 요청의 경우 성능 향상)
        const cacheKey = `${endpoint}${JSON.stringify(options)}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            console.log(`📦 Cache hit for ${endpoint}`);
            return cached.data;
        }

        // 로딩 상태 표시
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

            // HTTP 에러 상태 확인
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // JSON 응답 파싱
            const data = await response.json();
            
            // 성공한 응답을 캐시에 저장
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
                Utils.showError(`네트워크 오류: ${endpoint}`);
            }
            
            throw error;
        }
    }

    /**
     * 프로젝트 요약 정보 API 호출
     * 대시보드 메인 화면에서 사용할 전체 프로젝트 통계
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
     * Plotly.js 차트 렌더링을 위한 데이터 요청
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
     * 서버 상태 및 모듈 로딩 상태 확인
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
     * 사기 탐지 통계 API 호출
     * 실제 사기 탐지 데이터셋의 상세 통계 정보
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