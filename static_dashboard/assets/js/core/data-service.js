/**
 * FCA Data Service - Core Data Access Layer
 * ========================================
 * 
 * 시니어 개발자가 구축한 견고한 데이터 관리 시스템
 * 
 * 팀 규칙:
 * 1. 직접 fetch() 사용 금지 - 반드시 DataService 사용
 * 2. 새로운 데이터 로직 생성 금지 - 기존 메서드 활용
 * 3. AI가 임의로 데이터 구조 변경 금지
 * 
 * 사용법:
 * const fraudData = await DataService.getFraudData();
 * const xaiData = await DataService.getXAIData();
 */

class DataService {
    constructor() {
        this.cache = new Map();
        this.loadingPromises = new Map();
        this.cacheTimeout = 10 * 60 * 1000; // 10분 캐시
        this.maxRetries = 3;
        this.retryDelay = 1000;
        
        // 엔드포인트 정의 - 수정 금지
        this.endpoints = Object.freeze({
            FRAUD_DATA: 'data/fraud_data.json',
            XAI_DATA: 'data/xai_data.json', 
            SENTIMENT_DATA: 'data/sentiment_data.json',
            ATTRITION_DATA: 'data/attrition_data.json',
            PERFORMANCE_DATA: 'data/performance_metrics.json',
            BUNDLE_DATA: 'data/bundle.json',
            SUMMARY_DATA: 'data/summary.json',
            MODEL_DATA: 'data/model_data.json',
            BUSINESS_DATA: 'data/business_metrics.json',
            DATASET_METADATA: 'data/dataset_metadata.json'
        });

        // 데이터 검증 스키마
        this.schemas = Object.freeze({
            FRAUD_DATA: ['fraud_distribution', 'feature_importance'],
            XAI_DATA: ['lime_explanations', 'model_decision_process'],
            SENTIMENT_DATA: ['sentiment_distribution'],
            ATTRITION_DATA: ['attrition_prediction'],
            PERFORMANCE_DATA: ['model_performance'],
            BUNDLE_DATA: ['summary', 'fraud_data', 'xai_data']
        });

        this.init();
    }

    init() {
        this.log('📊 DataService initialized - Core data layer ready');
        this.startHealthCheck();
    }

    // ===========================================
    // 핵심 데이터 접근 메서드 (팀원 사용 필수)
    // ===========================================

    /**
     * 사기 탐지 데이터 획득
     * 사용: const data = await DataService.getFraudData();
     */
    async getFraudData() {
        return this.loadWithValidation('FRAUD_DATA', this.endpoints.FRAUD_DATA);
    }

    /**
     * XAI 분석 데이터 획득  
     * 사용: const data = await DataService.getXAIData();
     */
    async getXAIData() {
        return this.loadWithValidation('XAI_DATA', this.endpoints.XAI_DATA);
    }

    /**
     * 감정 분석 데이터 획득
     * 사용: const data = await DataService.getSentimentData();
     */
    async getSentimentData() {
        return this.loadWithValidation('SENTIMENT_DATA', this.endpoints.SENTIMENT_DATA);
    }

    /**
     * 이탈 예측 데이터 획득
     * 사용: const data = await DataService.getAttritionData();
     */
    async getAttritionData() {
        return this.loadWithValidation('ATTRITION_DATA', this.endpoints.ATTRITION_DATA);
    }

    /**
     * 성능 메트릭 데이터 획득
     * 사용: const data = await DataService.getPerformanceData();
     */
    async getPerformanceData() {
        return this.loadWithValidation('PERFORMANCE_DATA', this.endpoints.PERFORMANCE_DATA);
    }

    /**
     * 번들 데이터 획득 (모든 데이터 통합)
     * 사용: const data = await DataService.getBundleData();
     */
    async getBundleData() {
        return this.loadWithValidation('BUNDLE_DATA', this.endpoints.BUNDLE_DATA);
    }

    /**
     * 대시보드 초기화 데이터 일괄 로드
     * 사용: const allData = await DataService.loadDashboardData();
     */
    async loadDashboardData() {
        this.log('🚀 Loading dashboard data with priority system');
        
        const criticalData = await this.loadCriticalData();
        const normalData = await this.loadNormalData();
        
        return {
            ...criticalData,
            ...normalData,
            loadTimestamp: new Date().toISOString()
        };
    }

    // ===========================================
    // 내부 구현 (팀원 직접 사용 금지)
    // ===========================================

    async loadCriticalData() {
        const promises = [
            this.getFraudData().catch(e => this.handleCriticalError('fraud_data', e)),
            this.getXAIData().catch(e => this.handleCriticalError('xai_data', e))
        ];

        const [fraudData, xaiData] = await Promise.all(promises);
        
        return {
            fraud_data: fraudData,
            xai_data: xaiData
        };
    }

    async loadNormalData() {
        const promises = [
            this.getSentimentData().catch(e => this.getFallbackData('SENTIMENT_DATA')),
            this.getAttritionData().catch(e => this.getFallbackData('ATTRITION_DATA')),
            this.getPerformanceData().catch(e => this.getFallbackData('PERFORMANCE_DATA'))
        ];

        const [sentimentData, attritionData, performanceData] = await Promise.allSettled(promises);

        return {
            sentiment_data: this.extractValue(sentimentData),
            attrition_data: this.extractValue(attritionData),
            performance_data: this.extractValue(performanceData)
        };
    }

    async loadWithValidation(schemaKey, url) {
        const cacheKey = `validated_${url}`;
        
        // 캐시 확인
        if (this.isCached(cacheKey)) {
            return this.getFromCache(cacheKey);
        }

        // 로딩 중복 방지
        if (this.loadingPromises.has(cacheKey)) {
            return this.loadingPromises.get(cacheKey);
        }

        const loadingPromise = this.performLoadWithValidation(schemaKey, url);
        this.loadingPromises.set(cacheKey, loadingPromise);

        try {
            const data = await loadingPromise;
            this.setCache(cacheKey, data);
            return data;
        } finally {
            this.loadingPromises.delete(cacheKey);
        }
    }

    async performLoadWithValidation(schemaKey, url) {
        let lastError;
        
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const data = await this.fetchWithTimeout(url, 8000);
                this.validateData(data, schemaKey);
                
                this.log(`✅ Data loaded and validated: ${url} (attempt ${attempt})`);
                return data;
                
            } catch (error) {
                lastError = error;
                this.log(`⚠️ Load attempt ${attempt} failed for ${url}: ${error.message}`);
                
                if (attempt < this.maxRetries) {
                    await this.delay(this.retryDelay * attempt);
                }
            }
        }
        
        throw new Error(`Failed to load ${url} after ${this.maxRetries} attempts: ${lastError.message}`);
    }

    async fetchWithTimeout(url, timeout = 5000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            return data;
            
        } finally {
            clearTimeout(timeoutId);
        }
    }

    validateData(data, schemaKey) {
        const requiredFields = this.schemas[schemaKey];
        if (!requiredFields) return;

        const missingFields = requiredFields.filter(field => !(field in data));
        if (missingFields.length > 0) {
            throw new Error(`Data validation failed. Missing fields: ${missingFields.join(', ')}`);
        }
    }

    // ===========================================
    // 캐시 관리
    // ===========================================

    isCached(key) {
        const cached = this.cache.get(key);
        if (!cached) return false;
        
        const isExpired = Date.now() - cached.timestamp > this.cacheTimeout;
        if (isExpired) {
            this.cache.delete(key);
            return false;
        }
        
        return true;
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        return cached ? cached.data : null;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    clearCache(pattern = null) {
        if (pattern) {
            const regex = new RegExp(pattern);
            Array.from(this.cache.keys())
                .filter(key => regex.test(key))
                .forEach(key => this.cache.delete(key));
        } else {
            this.cache.clear();
        }
        this.log('🧹 Cache cleared');
    }

    // ===========================================
    // 오류 처리 및 폴백
    // ===========================================

    handleCriticalError(dataType, error) {
        this.log(`❌ Critical data load failed: ${dataType} - ${error.message}`, 'error');  
        throw new Error(`Critical system data unavailable: ${dataType}`);
    }

    getFallbackData(schemaKey) {
        const fallbacks = {
            FRAUD_DATA: {
                fraud_distribution: { legitimate: 95, fraudulent: 5 },
                feature_importance: [],
                timestamp: new Date().toISOString()
            },
            XAI_DATA: {
                lime_explanations: { fraud_detection: { features: [] } },
                model_decision_process: { fraud_detection: { decision_tree_path: [] } },
                timestamp: new Date().toISOString()
            },
            SENTIMENT_DATA: {
                sentiment_distribution: { positive: 40, neutral: 35, negative: 25 },
                timestamp: new Date().toISOString()
            },
            ATTRITION_DATA: {
                attrition_prediction: { risk_levels: [], features: [] },
                timestamp: new Date().toISOString()
            },
            PERFORMANCE_DATA: {
                model_performance: { accuracy: 0, precision: 0, recall: 0 },
                timestamp: new Date().toISOString()
            }
        };

        return fallbacks[schemaKey] || {};
    }

    extractValue(promiseResult) {
        return promiseResult.status === 'fulfilled' ? promiseResult.value : promiseResult.reason;
    }

    // ===========================================
    // 유틸리티
    // ===========================================

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '📊';
        console.log(`${prefix} [DataService] ${message}`);
    }

    startHealthCheck() {
        setInterval(() => {
            const stats = this.getSystemStats();
            if (stats.cacheSize > 50) {
                this.log('🧹 Cache size high, clearing old entries');
                this.clearCache();
            }
        }, 5 * 60 * 1000); // 5분마다 체크
    }

    getSystemStats() {
        return {
            cacheSize: this.cache.size,
            loadingInProgress: this.loadingPromises.size,
            cacheKeys: Array.from(this.cache.keys()),
            uptime: Date.now() - this.startTime || Date.now()
        };
    }

    // ===========================================
    // 개발자 디버깅 도구
    // ===========================================

    debug() {
        return {
            cache: Object.fromEntries(this.cache),
            loading: Array.from(this.loadingPromises.keys()),
            endpoints: this.endpoints,
            stats: this.getSystemStats()
        };
    }
}

// 전역 인스턴스 - 하나만 생성
window.DataService = new DataService();

// 모듈 시스템 지원
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataService;
}

/**
 * 팀 사용법 요약:
 * 
 * ✅ 올바른 사용법:
 * const fraudData = await DataService.getFraudData();
 * const xaiData = await DataService.getXAIData();  
 * const allData = await DataService.loadDashboardData();
 * 
 * ❌ 금지된 사용법:
 * fetch('data/fraud_data.json') // 직접 fetch 금지
 * 새로운 데이터 로직 작성 // 기존 메서드 사용
 * AI에게 데이터 구조 변경 요청 // 시니어 개발자 승인 필요
 */