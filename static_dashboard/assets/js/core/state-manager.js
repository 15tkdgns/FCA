/**
 * FCA State Manager - Global State Management
 * ==========================================
 * 
 * 시니어 개발자가 구축한 상태 관리 시스템
 * Redux 패턴을 단순화한 중앙집중식 상태 관리
 * 
 * 팀 규칙:
 * 1. 직접 글로벌 변수 생성 금지
 * 2. 상태 변경은 반드시 액션을 통해서만
 * 3. 컴포넌트는 구독(subscribe)을 통해 상태 변화 감지
 * 
 * 사용법:
 * StateManager.dispatch('SET_FRAUD_DATA', data);
 * StateManager.getState().fraudData;
 * StateManager.subscribe('fraudData', callback);
 */

class StateManager {
    constructor() {
        this.state = {
            // 데이터 상태
            fraudData: null,
            xaiData: null,
            sentimentData: null,
            attritionData: null,
            performanceData: null,
            
            // UI 상태
            currentPage: 'dashboard',
            loading: {
                fraud: false,
                xai: false,
                sentiment: false,
                attrition: false,
                performance: false
            },
            
            // 차트 상태
            chartsInitialized: false,
            failedCharts: new Set(),
            
            // 시스템 상태
            systemReady: false,
            lastDataLoad: null,
            errors: []
        };

        this.subscribers = new Map();
        this.actionHistory = [];
        this.maxHistorySize = 100;
        this.middleware = [];

        this.setupActions();
        this.init();
    }

    init() {
        this.log('🏪 StateManager initialized - Centralized state ready');
        this.startStateMonitoring();
    }

    // ===========================================
    // 핵심 상태 관리 메서드
    // ===========================================

    /**
     * 상태 조회
     * 사용: const fraudData = StateManager.getState().fraudData;
     */
    getState() {
        return { ...this.state }; // 불변성 보장
    }

    /**
     * 특정 상태값 조회  
     * 사용: const fraudData = StateManager.get('fraudData');
     */
    get(key) {
        return this.state[key];
    }

    /**
     * 액션 디스패치 (상태 변경의 유일한 방법)
     * 사용: StateManager.dispatch('SET_FRAUD_DATA', data);
     */
    dispatch(actionType, payload = null) {
        const action = { type: actionType, payload, timestamp: Date.now() };
        
        this.log(`🔄 Dispatching action: ${actionType}`);
        
        // 미들웨어 실행
        let processedAction = action;
        for (const middleware of this.middleware) {
            processedAction = middleware(processedAction, this.state);
        }

        // 액션 처리
        const newState = this.handleAction(processedAction);
        
        if (newState !== this.state) {
            const oldState = this.state;
            this.state = newState;
            
            // 액션 히스토리 저장
            this.addToHistory(processedAction);
            
            // 구독자들에게 알림
            this.notifySubscribers(oldState, newState);
        }

        return processedAction;
    }

    /**
     * 상태 변화 구독
     * 사용: StateManager.subscribe('fraudData', (newValue, oldValue) => {...});
     */
    subscribe(key, callback) {
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());
        }
        
        this.subscribers.get(key).add(callback);
        
        // 구독 해제 함수 반환
        return () => {
            const keySubscribers = this.subscribers.get(key);
            if (keySubscribers) {
                keySubscribers.delete(callback);
            }
        };
    }

    /**
     * 한 번만 실행되는 구독
     * 사용: StateManager.subscribeOnce('systemReady', callback);
     */
    subscribeOnce(key, callback) {
        const unsubscribe = this.subscribe(key, (...args) => {
            callback(...args);
            unsubscribe();
        });
        return unsubscribe;
    }

    // ===========================================
    // 액션 정의 및 처리
    // ===========================================

    setupActions() {
        this.actions = {
            // 데이터 액션
            SET_FRAUD_DATA: (state, payload) => ({
                ...state,
                fraudData: payload,
                loading: { ...state.loading, fraud: false }
            }),

            SET_XAI_DATA: (state, payload) => ({
                ...state,
                xaiData: payload,
                loading: { ...state.loading, xai: false }
            }),

            SET_SENTIMENT_DATA: (state, payload) => ({
                ...state,
                sentimentData: payload,
                loading: { ...state.loading, sentiment: false }
            }),

            SET_ATTRITION_DATA: (state, payload) => ({
                ...state,
                attritionData: payload,
                loading: { ...state.loading, attrition: false }
            }),

            SET_PERFORMANCE_DATA: (state, payload) => ({
                ...state,
                performanceData: payload,
                loading: { ...state.loading, performance: false }
            }),

            // 로딩 상태 액션
            SET_LOADING: (state, { key, loading }) => ({
                ...state,
                loading: { ...state.loading, [key]: loading }
            }),

            // UI 액션
            SET_CURRENT_PAGE: (state, page) => ({
                ...state,
                currentPage: page
            }),

            // 차트 상태 액션
            SET_CHARTS_INITIALIZED: (state, initialized) => ({
                ...state,
                chartsInitialized: initialized
            }),

            ADD_FAILED_CHART: (state, chartId) => ({
                ...state,
                failedCharts: new Set([...state.failedCharts, chartId])
            }),

            REMOVE_FAILED_CHART: (state, chartId) => {
                const newFailedCharts = new Set(state.failedCharts);
                newFailedCharts.delete(chartId);
                return {
                    ...state,
                    failedCharts: newFailedCharts
                };
            },

            // 시스템 액션
            SET_SYSTEM_READY: (state, ready) => ({
                ...state,
                systemReady: ready
            }),

            SET_LAST_DATA_LOAD: (state, timestamp) => ({
                ...state,
                lastDataLoad: timestamp
            }),

            ADD_ERROR: (state, error) => ({
                ...state,
                errors: [...state.errors.slice(-9), { ...error, timestamp: Date.now() }]
            }),

            CLEAR_ERRORS: (state) => ({
                ...state,
                errors: []
            }),

            // 전체 초기화
            RESET_STATE: () => ({
                ...this.getInitialState()
            })
        };
    }

    handleAction(action) {
        const handler = this.actions[action.type];
        
        if (!handler) {
            this.log(`⚠️ Unknown action type: ${action.type}`, 'warn');
            return this.state;
        }

        try {
            return handler(this.state, action.payload);
        } catch (error) {
            this.log(`❌ Action handler error: ${action.type} - ${error.message}`, 'error');
            return this.state;
        }
    }

    // ===========================================
    // 편의 메서드 (팀원 사용 권장)
    // ===========================================

    /**
     * 데이터 로딩 상태 설정
     * 사용: StateManager.setLoading('fraud', true);
     */
    setLoading(key, loading) {
        this.dispatch('SET_LOADING', { key, loading });
    }

    /**
     * 에러 추가
     * 사용: StateManager.addError({ type: 'DATA_LOAD_ERROR', message: '...' });
     */
    addError(error) {
        this.dispatch('ADD_ERROR', error);
    }

    /**
     * 페이지 변경
     * 사용: StateManager.navigateTo('fraud');
     */
    navigateTo(page) {
        this.dispatch('SET_CURRENT_PAGE', page);
    }

    /**
     * 차트 실패 추가/제거
     * 사용: StateManager.markChartFailed('lime-chart');
     */
    markChartFailed(chartId) {
        this.dispatch('ADD_FAILED_CHART', chartId);
    }

    markChartRecovered(chartId) {
        this.dispatch('REMOVE_FAILED_CHART', chartId);
    }

    /**
     * 시스템 준비 완료 표시
     * 사용: StateManager.setSystemReady(true);
     */
    setSystemReady(ready) {
        this.dispatch('SET_SYSTEM_READY', ready);
    }

    // ===========================================
    // 내부 구현
    // ===========================================

    notifySubscribers(oldState, newState) {
        for (const [key, callbacks] of this.subscribers) {
            const oldValue = oldState[key];
            const newValue = newState[key];
            
            if (oldValue !== newValue) {
                callbacks.forEach(callback => {
                    try {
                        callback(newValue, oldValue);
                    } catch (error) {
                        this.log(`❌ Subscriber callback error for ${key}: ${error.message}`, 'error');
                    }
                });
            }
        }
    }

    addToHistory(action) {
        this.actionHistory.push(action);
        
        if (this.actionHistory.length > this.maxHistorySize) {
            this.actionHistory = this.actionHistory.slice(-this.maxHistorySize);
        }
    }

    getInitialState() {
        return {
            fraudData: null,
            xaiData: null,
            sentimentData: null,
            attritionData: null,
            performanceData: null,
            currentPage: 'dashboard',
            loading: {
                fraud: false,
                xai: false,
                sentiment: false,
                attrition: false,
                performance: false
            },
            chartsInitialized: false,
            failedCharts: new Set(),
            systemReady: false,
            lastDataLoad: null,
            errors: []
        };
    }

    // ===========================================
    // 모니터링 및 디버깅
    // ===========================================

    startStateMonitoring() {
        // 5분마다 상태 검증
        setInterval(() => {
            this.validateState();
        }, 5 * 60 * 1000);
    }

    validateState() {
        const now = Date.now();
        const lastLoad = this.state.lastDataLoad;
        
        if (lastLoad && now - lastLoad > 30 * 60 * 1000) { // 30분 초과
            this.log('⚠️ Data is stale, consider refreshing', 'warn');
        }

        if (this.state.errors.length > 10) {
            this.log('⚠️ Too many errors, clearing old ones', 'warn');
            this.dispatch('CLEAR_ERRORS');
        }
    }

    // 미들웨어 추가
    addMiddleware(middleware) {
        this.middleware.push(middleware);
    }

    // 디버깅 정보
    debug() {
        return {
            state: this.state,
            subscribers: Object.fromEntries(
                Array.from(this.subscribers.entries()).map(([key, callbacks]) => 
                    [key, callbacks.size]
                )
            ),
            actionHistory: this.actionHistory.slice(-10),
            middleware: this.middleware.length
        };
    }

    log(message, level = 'info') {
        const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '🏪';
        console.log(`${prefix} [StateManager] ${message}`);
    }
}

// 전역 인스턴스
window.StateManager = new StateManager();

// 모듈 지원
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateManager;
}

/**
 * 팀 사용법 요약:
 * 
 * ✅ 올바른 사용법:
 * StateManager.dispatch('SET_FRAUD_DATA', data);
 * const fraudData = StateManager.get('fraudData');
 * StateManager.subscribe('fraudData', callback);
 * StateManager.setLoading('fraud', true);
 * 
 * ❌ 금지된 사용법:
 * window.globalData = data; // 글로벌 변수 금지
 * state.fraudData = data; // 직접 변경 금지
 * 새로운 상태 관리 라이브러리 추가 // 기존 StateManager 사용
 */