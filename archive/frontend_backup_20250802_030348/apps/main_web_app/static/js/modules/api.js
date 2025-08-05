/**
 * API Module
 * ==========
 * 
 * API 통신 관련 기능을 모듈화
 * - HTTP 요청 처리
 * - response caching
 * - error handling
 * - retry logic
 */

export class APIClient {
    constructor(config = {}) {
        this.baseURL = config.baseURL || window.location.origin;
        this.cache = new Map();
        this.cacheTTL = config.cacheTTL || 5 * 60 * 1000; // 5분
        this.defaultTimeout = config.timeout || 30000; // 30초
        this.maxRetries = config.maxRetries || 2;
        this.retryDelay = config.retryDelay || 1000;
    }

    /**
     * HTTP 요청 (retry logic 포함)
     */
    async request(endpoint, options = {}) {
        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                return await this._makeRequest(endpoint, options, attempt);
            } catch (error) {
                if (attempt === this.maxRetries || !this._shouldRetry(error)) {
                    throw error;
                }
                
                await this._delay(this.retryDelay * (attempt + 1));
            }
        }
    }

    /**
     * 실제 HTTP 요청 실행
     */
    async _makeRequest(endpoint, options, attempt = 0) {
        const url = `${this.baseURL}${endpoint}`;
        const cacheKey = `${endpoint}${JSON.stringify(options)}`;
        
        // 캐시 confirm (GET 요청만)
        if (!options.method || options.method === 'GET') {
            const cached = this._getFromCache(cacheKey);
            if (cached) return cached;
        }

        // 타임아웃 settings
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 
            options.timeout || this.defaultTimeout);
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                signal: controller.signal,
                ...options
            });
            
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await this._parseErrorResponse(response);
                const error = new Error(errorData.message || `HTTP ${response.status}`);
                error.status = response.status;
                error.data = errorData;
                throw error;
            }

            const data = await response.json();
            
            // success한 response caching (GET 요청만)
            if (!options.method || options.method === 'GET') {
                this._setCache(cacheKey, data);
            }

            return data;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                error.message = '요청 time이 초과되었습니다.';
            }
            throw error;
        }
    }

    /**
     * 에러 응답 파싱
     */
    async _parseErrorResponse(response) {
        try {
            return await response.json();
        } catch {
            return { message: response.statusText };
        }
    }

    /**
     * 재시도 가능한 에러인지 confirm
     */
    _shouldRetry(error) {
        return (
            error.name === 'TypeError' ||
            error.name === 'AbortError' ||
            (error.status >= 500 && error.status < 600)
        );
    }

    /**
     * 캐시에서 데이터 가져오기
     */
    _getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            return cached.data;
        }
        return null;
    }

    /**
     * 캐시에 데이터 save
     */
    _setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * 지연 함수
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 캐시 클리어
     */
    clearCache() {
        this.cache.clear();
    }
}

/**
 * API 엔드포인트 관리
 */
export class APIEndpoints {
    constructor(apiClient) {
        this.client = apiClient;
    }

    // 프로젝트 summary
    async getSummary() {
        return this.client.request('/api/summary');
    }

    // 차트 데이터
    async getChart(chartType) {
        return this.client.request(`/api/chart/${chartType}`);
    }

    // 시스템 헬스체크
    async getHealth() {
        return this.client.request('/api/health');
    }

    // fraud detection 통계
    async getFraudStatistics() {
        return this.client.request('/api/fraud/statistics');
    }

    // sentiment analysis 데이터
    async getSentimentData() {
        return this.client.request('/api/sentiment/data');
    }

    // 고객 이탈 데이터
    async getAttritionData() {
        return this.client.request('/api/attrition/data');
    }

    // 도메인 결과
    async getDomainResults(domain) {
        return this.client.request(`/api/results/${domain}`);
    }

    // 모델 비교
    async getModelComparison() {
        return this.client.request('/api/models/compare');
    }

    // 모니터링 status
    async getMonitoringHealth() {
        return this.client.request('/api/monitoring/health');
    }
}

/**
 * API 래퍼 클래스 (기존 코드와의 호환성)
 */
export class APIWrapper {
    constructor(config = {}) {
        this.client = new APIClient(config);
        this.endpoints = new APIEndpoints(this.client);
    }

    async getSummary() {
        try {
            const data = await this.endpoints.getSummary();
            return { status: 'success', data };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    async getChart(chartType) {
        try {
            const data = await this.endpoints.getChart(chartType);
            return { status: 'success', data };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    async getHealth() {
        try {
            const data = await this.endpoints.getHealth();
            return { status: 'success', data };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    async getFraudStatistics() {
        try {
            const data = await this.endpoints.getFraudStatistics();
            return { status: 'success', data };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    async getSentimentData() {
        try {
            const data = await this.endpoints.getSentimentData();
            return { status: 'success', data };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    async getAttritionData() {
        try {
            const data = await this.endpoints.getAttritionData();
            return { status: 'success', data };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    async getDomainResults(domain) {
        try {
            const data = await this.endpoints.getDomainResults(domain);
            return { status: 'success', data };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    async getModelComparison() {
        try {
            const data = await this.endpoints.getModelComparison();
            return { status: 'success', data };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    clearCache() {
        this.client.clearCache();
    }

    getErrorLog() {
        return JSON.parse(localStorage.getItem('fca_error_log') || '[]');
    }

    clearErrorLog() {
        localStorage.removeItem('fca_error_log');
    }

    async getSystemHealth() {
        const errorLog = this.getErrorLog();
        const recentErrors = errorLog.filter(
            err => Date.now() - new Date(err.timestamp).getTime() < 300000
        );
        
        return {
            status: recentErrors.length > 5 ? 'degraded' : 'healthy',
            totalErrors: errorLog.length,
            recentErrors: recentErrors.length,
            cacheSize: this.client.cache.size,
            timestamp: new Date().toISOString()
        };
    }
}