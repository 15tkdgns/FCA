/**
 * FCA API Client (Enhanced)
 * =========================
 * 
 * FCA backend API와 통신하기 위한 강화된 클라이언트 클래스
 * - 모듈화된 API 클라이언트로 업그레이드 지원
 * - HTTP 요청 처리
 * - response caching으로 performance optimization  
 * - 고급 error handling 및 retry logic
 * - 에러 모니터링 및 추적
 * - 사용자 친화적 에러 메시지
 * - 모든 API 엔드포인트에 대한 편의 메소드 제공
 */

// 모듈 지원 체크 및 로딩
const isModuleSupportedAPI = 'noModule' in HTMLScriptElement.prototype;

if (isModuleSupportedAPI) {
    import('./modules/api.js').then(module => {
        const { APIWrapper } = module;
        window.APIClient = new APIWrapper();
        console.log('✅ Modular API client loaded');
    }).catch(error => {
        console.warn('⚠️ Failed to load modular API client, falling back to legacy:', error);
        window.APIClient = new LegacyAPIClient();
    });
} else {
    // 레거시 브라우저 지원
    window.APIClient = new LegacyAPIClient();
}

class LegacyAPIClient {
    constructor() {
        this.baseURL = window.location.origin;      // current page의 origin 사용
        this.cache = new Map();                     // API 응답 cache storage
        this.cacheTTL = 5 * 60 * 1000;             // cache TTL (5분)
    }

    /**
     * generic HTTP request 메소드 (retry logic 포함)
     * 
     * @param {string} endpoint - API 엔드포인트 경로
     * @param {Object} options - fetch 옵션 (method, headers, body 등)
     * @returns {Promise<Object>} API 응답 데이터
     */
    async request(endpoint, options = {}) {
        // 요청 retry logic 추가
        const maxRetries = options.retries || 2;
        const retryDelay = options.retryDelay || 1000;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await this._makeRequest(endpoint, options, attempt);
            } catch (error) {
                if (attempt === maxRetries) {
                    throw error;
                }
                
                // 재시도 가능한 에러인지 confirm
                if (this._shouldRetry(error)) {
                    console.warn(`🔄 Retrying request ${attempt + 1}/${maxRetries} for ${endpoint}`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
                } else {
                    throw error;
                }
            }
        }
    }
    
    /**
     * 실제 HTTP 요청 실행
     * 
     * @param {string} endpoint - API 엔드포인트 경로
     * @param {Object} options - fetch 옵션
     * @param {number} attempt - 시도 횟수
     * @returns {Promise<Object>} API 응답 데이터
     */
    async _makeRequest(endpoint, options, attempt = 0) {
        const url = `${this.baseURL}${endpoint}`;
        
        // 캐시에서 먼저 confirm (GET 요청의 경우 성능 향상)
        const cacheKey = `${endpoint}${JSON.stringify(options)}`;
        if (!options.method || options.method === 'GET') {
            const cached = this.cache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
                console.log(`📦 Cache hit for ${endpoint}`);
                return cached.data;
            }
        }

        // 로딩 status 표시
        const startTime = performance.now();
        const attemptText = attempt > 0 ? ` (attempt ${attempt + 1})` : '';
        console.log(`🔄 API request starting: ${endpoint}${attemptText}`);

        // 타임아웃 settings
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);
        
        try {
            // HTTP 요청 실행
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                signal: controller.signal,
                ...options
            });
            
            clearTimeout(timeoutId);

            // HTTP 에러 status confirm
            if (!response.ok) {
                // 서버에서 에러 응답을 JSON으로 보낸 경우 파싱 시도
                let errorData;
                try {
                    errorData = await response.json();
                } catch {
                    errorData = { message: response.statusText };
                }
                
                const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
                error.status = response.status;
                error.errorData = errorData;
                throw error;
            }

            // JSON 응답 파싱
            const data = await response.json();
            
            // success한 응답을 캐시에 save (GET 요청만)
            if (!options.method || options.method === 'GET') {
                this.cache.set(cacheKey, {
                    data,
                    timestamp: Date.now()
                });
            }

            const duration = Math.round(performance.now() - startTime);
            console.log(`✅ API request completed: ${endpoint} (${duration}ms)`);

            return data;
        } catch (error) {
            clearTimeout(timeoutId);
            const duration = Math.round(performance.now() - startTime);
            
            // AbortError 처리
            if (error.name === 'AbortError') {
                error.message = '요청 time이 초과되었습니다.';
            }
            
            console.error(`❌ API request failed for ${endpoint} (${duration}ms):`, error);
            
            // 구조화된 에러 info 생성
            const errorInfo = this._processError(error, endpoint, duration);
            
            // 재시도 중이 아닌 경우에만 사용자에게 에러 표시
            if (attempt === 0 || !this._shouldRetry(error)) {
                this._showUserError(errorInfo);
                this._trackError(errorInfo);
            }
            
            throw errorInfo;
        }
    }

    /**
     * error handling 및 분류
     * 
     * @param {Error} error - 발생한 에러
     * @param {string} endpoint - API 엔드포인트
     * @param {number} duration - 요청 소요 time
     * @returns {Object} 구조화된 에러 info
     */
    _processError(error, endpoint, duration) {
        const timestamp = new Date().toISOString();
        const errorId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // 에러 타입별 분류
        let category = 'unknown';
        let severity = 'medium';
        let userMessage = '요청 processing error가 발생했습니다.';
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            category = 'network';
            severity = 'high';
            userMessage = '네트워크 연결을 confirm해주세요.';
        } else if (error.message.includes('HTTP 4')) {
            category = 'client_error';
            severity = 'medium';
            userMessage = '요청 데이터를 confirm해주세요.';
        } else if (error.message.includes('HTTP 5')) {
            category = 'server_error';
            severity = 'high';
            userMessage = '서버 error가 발생했습니다. 잠시 후 retry해주세요.';
        } else if (error.message.includes('JSON')) {
            category = 'parse_error';
            severity = 'medium';
            userMessage = '데이터 형식 error가 발생했습니다.';
        } else if (duration > 30000) {
            category = 'timeout';
            severity = 'medium';
            userMessage = '요청 time이 초과되었습니다.';
        }
        
        return {
            id: errorId,
            timestamp,
            endpoint,
            duration,
            category,
            severity,
            originalError: error,
            message: error.message,
            userMessage,
            stack: error.stack
        };
    }
    
    /**
     * 사용자에게 에러 메시지 표시
     * 
     * @param {Object} errorInfo - 구조화된 에러 info
     */
    _showUserError(errorInfo) {
        // 기존 Utils가 있다면 사용
        if (window.Utils && typeof Utils.showError === 'function') {
            Utils.showError(errorInfo.userMessage);
            return;
        }
        
        // 내장 에러 표시 시스템
        const existingToast = document.querySelector('.api-error-toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = 'api-error-toast alert alert-danger position-fixed';
        toast.style.cssText = `
            top: 20px; right: 20px; z-index: 9999; max-width: 400px;
            animation: slideIn 0.3s ease-out;
        `;
        
        toast.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <div class="flex-grow-1">
                    <strong>error 발생</strong><br>
                    <small>${errorInfo.userMessage}</small>
                </div>
                <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // 5초 후 자동 제거
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
    }
    
    /**
     * 에러 추적 및 모니터링
     * 
     * @param {Object} errorInfo - 구조화된 에러 info
     */
    _trackError(errorInfo) {
        // 로컬 에러 로그 save
        const errorLog = JSON.parse(localStorage.getItem('fca_error_log') || '[]');
        errorLog.push({
            id: errorInfo.id,
            timestamp: errorInfo.timestamp,
            endpoint: errorInfo.endpoint,
            category: errorInfo.category,
            severity: errorInfo.severity,
            message: errorInfo.message
        });
        
        // 최대 50개까지만 save
        if (errorLog.length > 50) {
            errorLog.splice(0, errorLog.length - 50);
        }
        
        localStorage.setItem('fca_error_log', JSON.stringify(errorLog));
        
        // 콘솔에 구조화된 에러 info 출력
        console.group(`🚨 API Error [${errorInfo.severity.toUpperCase()}]`);
        console.error('Error ID:', errorInfo.id);
        console.error('Endpoint:', errorInfo.endpoint);
        console.error('Category:', errorInfo.category);
        console.error('Duration:', `${errorInfo.duration}ms`);
        console.error('Message:', errorInfo.message);
        console.error('User Message:', errorInfo.userMessage);
        if (errorInfo.stack) {
            console.error('Stack:', errorInfo.stack);
        }
        console.groupEnd();
    }
    
    /**
     * 재시도 가능한 에러인지 confirm
     * 
     * @param {Error} error - 발생한 에러
     * @returns {boolean} 재시도 가능 여부
     */
    _shouldRetry(error) {
        // 네트워크 에러, 서버 에러(5xx), 타임아웃은 재시도
        return (
            error.name === 'TypeError' ||
            error.name === 'AbortError' ||
            (error.status >= 500 && error.status < 600)
        );
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
            const response = await this.request('/api/model-comparison');
            return response;
        } catch (error) {
            console.error('Model comparison API error:', error);
            return { status: 'error', error: error.message };
        }
    }

    // 통합 대시보드 전용 메소드들
    async getSummary() {
        try {
            const response = await this.request('/api/dashboard/summary');
            return response;
        } catch (error) {
            console.error('Dashboard summary API error:', error);
            return { status: 'error', error: error.message };
        }
    }

    async getPerformanceChart() {
        try {
            const response = await this.request('/api/dashboard/performance-chart');
            return response;
        } catch (error) {
            console.error('Performance chart API error:', error);
            return { status: 'error', error: error.message };
        }
    }

    async getModuleTest() {
        try {
            const response = await this.request('/api/test/modules/quick');
            return response;
        } catch (error) {
            console.error('Module test API error:', error);
            return { status: 'error', error: error.message };
        }
    }

    /**
     * 에러 로그 조회
     * 
     * @returns {Array} save된 에러 로그 list
     */
    getErrorLog() {
        return JSON.parse(localStorage.getItem('fca_error_log') || '[]');
    }
    
    /**
     * 에러 로그 초기화
     */
    clearErrorLog() {
        localStorage.removeItem('fca_error_log');
        console.log('📝 Error log cleared');
    }
    
    /**
     * 시스템 status 모니터링
     * 
     * @returns {Object} 시스템 status info
     */
    async getSystemHealth() {
        const errorLog = this.getErrorLog();
        const recentErrors = errorLog.filter(
            err => Date.now() - new Date(err.timestamp).getTime() < 300000 // 5분 이내
        );
        
        return {
            status: recentErrors.length > 5 ? 'degraded' : 'healthy',
            totalErrors: errorLog.length,
            recentErrors: recentErrors.length,
            cacheSize: this.cache.size,
            timestamp: new Date().toISOString()
        };
    }
    
    // Clear cache
    clearCache() {
        this.cache.clear();
        console.log('🗑️ API cache cleared');
    }
}

// 전역 에러 핸들러 settings
window.addEventListener('error', function(event) {
    console.group('🚨 Global JavaScript Error');
    console.error('Message:', event.message);
    console.error('Source:', event.filename);
    console.error('Line:', event.lineno);
    console.error('Column:', event.colno);
    console.error('Error Object:', event.error);
    console.groupEnd();
});

window.addEventListener('unhandledrejection', function(event) {
    console.group('🚨 Unhandled Promise Rejection');
    console.error('Reason:', event.reason);
    console.error('Promise:', event.promise);
    console.groupEnd();
    
    // 기본 동작 방지 (콘솔 에러 출력 방지)
    event.preventDefault();
});

// Create global instance (레거시 지원을 위해 유지)
if (!window.APIClient) {
    window.APIClient = new LegacyAPIClient();
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);