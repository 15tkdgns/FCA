/**
 * API Override for Static Web
 * ===========================
 * 
 * 모든 API 호출을 정적 파일로 리다이렉트
 */

// API 모듈의 요청들을 가로채기
document.addEventListener('DOMContentLoaded', function() {
    
    // api.js의 API 클래스 오버라이드
    if (window.API) {
        const OriginalAPI = window.API;
        window.API = function() {
            const instance = new OriginalAPI();
            
            // request 메소드 오버라이드
            const originalRequest = instance.request;
            instance.request = async function(endpoint, options = {}) {
                try {
                    // 정적 파일 매핑
                    const staticMapping = {
                        '/api/summary': './data/summary.json',
                        '/summary': './data/summary.json',
                        '/api/fraud': './data/fraud_data.json', 
                        '/fraud': './data/fraud_data.json',
                        '/api/sentiment': './data/sentiment_data.json',
                        '/sentiment': './data/sentiment_data.json',
                        '/api/sentiment/data': './data/sentiment_data.json',
                        '/api/attrition': './data/attrition_data.json',
                        '/attrition': './data/attrition_data.json',
                        '/api/attrition/data': './data/attrition_data.json',
                        '/api/charts': './data/charts.json',
                        '/charts': './data/charts.json',
                        '/api/datasets': './data/datasets.json',
                        '/datasets': './data/datasets.json',
                        '/api/health': './data/summary.json',
                        '/health': './data/summary.json'
                    };
                    
                    const staticUrl = staticMapping[endpoint];
                    if (staticUrl) {
                        console.log(`🔄 API Override: ${endpoint} → ${staticUrl}`);
                        const response = await fetch(staticUrl);
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }
                        return await response.json();
                    }
                    
                    // 원본 요청 시도
                    return await originalRequest.call(this, endpoint, options);
                    
                } catch (error) {
                    console.warn(`API request failed: ${endpoint}`, error);
                    
                    // 기본값 반환
                    const fallbacks = {
                        '/api/summary': { system_status: 'operational', models_trained: 3 },
                        '/summary': { system_status: 'operational', models_trained: 3 },
                        '/api/fraud': { dataset_info: { total_transactions: 0 } },
                        '/fraud': { dataset_info: { total_transactions: 0 } },
                        '/api/sentiment': { dataset_info: { total_sentences: 0 } },
                        '/sentiment': { dataset_info: { total_sentences: 0 } },
                        '/api/attrition': { dataset_info: { total_customers: 0 } },
                        '/attrition': { dataset_info: { total_customers: 0 } },
                        '/api/charts': {},
                        '/charts': {},
                        '/api/datasets': { available_datasets: [] },
                        '/datasets': { available_datasets: [] }
                    };
                    
                    return fallbacks[endpoint] || {};
                }
            };
            
            return instance;
        };
    }
    
    // APIWrapper 클래스도 오버라이드
    if (window.APIWrapper) {
        const OriginalAPIWrapper = window.APIWrapper;
        window.APIWrapper = function() {
            const instance = new OriginalAPIWrapper();
            
            // API 인스턴스가 있다면 새로운 API로 교체
            if (instance.api) {
                instance.api = new window.API();
            }
            
            return instance;
        };
    }
    
    // 기존 APIClient 인스턴스가 있다면 업데이트
    if (window.APIClient && window.API) {
        try {
            window.APIClient = new window.API();
            console.log('✅ APIClient updated with static file support');
        } catch (error) {
            console.warn('Failed to update APIClient:', error);
        }
    }
    
    // common.js의 API 함수들도 오버라이드
    if (window.API && window.API.prototype) {
        // healthCheck 함수 오버라이드
        window.healthCheck = async function() {
            try {
                const data = await fetch('./data/summary.json').then(r => r.json());
                return {
                    status: data.system_status || 'operational',
                    timestamp: data.last_updated || new Date().toISOString()
                };
            } catch (error) {
                return { status: 'operational', timestamp: new Date().toISOString() };
            }
        };
    }
    
    console.log('✅ API overrides applied');
});

// fetch 글로벌 오버라이드도 강화
if (window.fetch) {
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        if (typeof url === 'string') {
            // localhost:5500 또는 다른 포트로 가는 API 요청 감지
            if (url.includes('/api/') && (url.includes('localhost') || url.startsWith('/api/'))) {
                let endpoint = url;
                
                // URL에서 엔드포인트 추출
                if (url.includes('/api/')) {
                    endpoint = url.substring(url.indexOf('/api/'));
                }
                
                const staticMapping = {
                    '/api/summary': './data/summary.json',
                    '/api/fraud': './data/fraud_data.json',  
                    '/api/sentiment': './data/sentiment_data.json',
                    '/api/sentiment/data': './data/sentiment_data.json',
                    '/api/attrition': './data/attrition_data.json',
                    '/api/attrition/data': './data/attrition_data.json',
                    '/api/charts': './data/charts.json',
                    '/api/datasets': './data/datasets.json',
                    '/api/health': './data/summary.json'
                };
                
                const staticUrl = staticMapping[endpoint];
                if (staticUrl) {
                    console.log(`🔄 Fetch Override: ${url} → ${staticUrl}`);
                    return originalFetch(staticUrl, options);
                }
            }
        }
        
        return originalFetch(url, options);
    };
}

console.log('✅ API Override system loaded');