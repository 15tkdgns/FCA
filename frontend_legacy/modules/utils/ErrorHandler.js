/**
 * Error Handling Utilities
 * 전역 에러 처리 및 로깅 시스템
 */

/**
 * 에러 타입 정의
 */
export const ErrorTypes = {
    MODULE_ERROR: 'MODULE_ERROR',
    API_ERROR: 'API_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    DEPENDENCY_ERROR: 'DEPENDENCY_ERROR',
    CHART_ERROR: 'CHART_ERROR',
    PERFORMANCE_ERROR: 'PERFORMANCE_ERROR',
    USER_ERROR: 'USER_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

/**
 * 에러 심각도 레벨
 */
export const ErrorSeverity = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

/**
 * 커스텀 에러 클래스들
 */
export class BaseError extends Error {
    constructor(message, type = ErrorTypes.UNKNOWN_ERROR, severity = ErrorSeverity.MEDIUM, context = {}) {
        super(message);
        this.name = this.constructor.name;
        this.type = type;
        this.severity = severity;
        this.context = context;
        this.timestamp = new Date().toISOString();
        this.stack = (new Error()).stack;
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            type: this.type,
            severity: this.severity,
            context: this.context,
            timestamp: this.timestamp,
            stack: this.stack
        };
    }
}

export class ModuleError extends BaseError {
    constructor(message, moduleName, context = {}) {
        super(message, ErrorTypes.MODULE_ERROR, ErrorSeverity.HIGH, {
            moduleName,
            ...context
        });
    }
}

export class APIError extends BaseError {
    constructor(message, endpoint, statusCode, context = {}) {
        super(message, ErrorTypes.API_ERROR, ErrorSeverity.MEDIUM, {
            endpoint,
            statusCode,
            ...context
        });
    }
}

export class ValidationError extends BaseError {
    constructor(message, field, value, context = {}) {
        super(message, ErrorTypes.VALIDATION_ERROR, ErrorSeverity.LOW, {
            field,
            value,
            ...context
        });
    }
}

export class DependencyError extends BaseError {
    constructor(message, dependency, context = {}) {
        super(message, ErrorTypes.DEPENDENCY_ERROR, ErrorSeverity.HIGH, {
            dependency,
            ...context
        });
    }
}

export class ChartError extends BaseError {
    constructor(message, chartId, chartType, context = {}) {
        super(message, ErrorTypes.CHART_ERROR, ErrorSeverity.MEDIUM, {
            chartId,
            chartType,
            ...context
        });
    }
}

/**
 * 전역 에러 핸들러 클래스
 */
export class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 1000;
        this.errorListeners = new Map();
        this.setupGlobalHandlers();
    }

    /**
     * 전역 에러 핸들러 설정
     */
    setupGlobalHandlers() {
        // 일반 JavaScript 에러
        window.addEventListener('error', (event) => {
            const error = new BaseError(
                event.message,
                ErrorTypes.UNKNOWN_ERROR,
                ErrorSeverity.HIGH,
                {
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    source: 'window.error'
                }
            );
            this.handleError(error);
        });

        // Promise rejection 에러
        window.addEventListener('unhandledrejection', (event) => {
            const error = new BaseError(
                event.reason?.message || 'Unhandled Promise Rejection',
                ErrorTypes.UNKNOWN_ERROR,
                ErrorSeverity.HIGH,
                {
                    reason: event.reason,
                    source: 'unhandledrejection'
                }
            );
            this.handleError(error);
            event.preventDefault(); // 콘솔 스팸 방지
        });

        // 네트워크 에러
        window.addEventListener('offline', () => {
            const error = new BaseError(
                'Network connection lost',
                ErrorTypes.NETWORK_ERROR,
                ErrorSeverity.HIGH,
                { source: 'offline' }
            );
            this.handleError(error);
        });
    }

    /**
     * 에러 처리 메인 메서드
     * @param {Error|BaseError} error - 처리할 에러
     * @param {Object} additionalContext - 추가 컨텍스트
     */
    handleError(error, additionalContext = {}) {
        // BaseError가 아닌 경우 변환
        if (!(error instanceof BaseError)) {
            error = new BaseError(
                error.message || 'Unknown error',
                ErrorTypes.UNKNOWN_ERROR,
                ErrorSeverity.MEDIUM,
                {
                    originalError: error,
                    ...additionalContext
                }
            );
        }

        // 에러 로그에 추가
        this.logError(error);

        // 에러 리스너들에게 알림
        this.notifyListeners(error);

        // 심각도에 따른 처리
        this.handleBySeverity(error);

        // 사용자에게 알림 (필요한 경우)
        this.notifyUser(error);
    }

    /**
     * 에러 로깅
     * @param {BaseError} error - 로깅할 에러
     */
    logError(error) {
        // 로그 크기 제한
        if (this.errorLog.length >= this.maxLogSize) {
            this.errorLog.shift(); // 가장 오래된 로그 제거
        }

        this.errorLog.push(error);

        // 콘솔 출력
        switch (error.severity) {
            case ErrorSeverity.CRITICAL:
                console.error('🚨 CRITICAL ERROR:', error);
                break;
            case ErrorSeverity.HIGH:
                console.error('❌ HIGH ERROR:', error);
                break;
            case ErrorSeverity.MEDIUM:
                console.warn('⚠️ MEDIUM ERROR:', error);
                break;
            case ErrorSeverity.LOW:
                console.info('ℹ️ LOW ERROR:', error);
                break;
        }

        // 서버로 에러 전송 (선택적)
        this.sendErrorToServer(error);
    }

    /**
     * 심각도에 따른 에러 처리
     * @param {BaseError} error - 처리할 에러
     */
    handleBySeverity(error) {
        switch (error.severity) {
            case ErrorSeverity.CRITICAL:
                this.handleCriticalError(error);
                break;
            case ErrorSeverity.HIGH:
                this.handleHighError(error);
                break;
            case ErrorSeverity.MEDIUM:
                this.handleMediumError(error);
                break;
            case ErrorSeverity.LOW:
                this.handleLowError(error);
                break;
        }
    }

    /**
     * 치명적 에러 처리
     * @param {BaseError} error - 치명적 에러
     */
    handleCriticalError(error) {
        // 애플리케이션 상태 저장
        this.saveApplicationState();

        // 긴급 복구 시도
        this.attemptEmergencyRecovery(error);

        // 사용자에게 긴급 알림
        this.showCriticalErrorMessage(error);
    }

    /**
     * 높은 심각도 에러 처리
     * @param {BaseError} error - 높은 심각도 에러
     */
    handleHighError(error) {
        // 관련 모듈 재시작 시도
        if (error.type === ErrorTypes.MODULE_ERROR) {
            this.attemptModuleRecovery(error.context.moduleName);
        }

        // API 에러인 경우 재시도 로직
        if (error.type === ErrorTypes.API_ERROR) {
            this.attemptAPIRetry(error.context.endpoint);
        }
    }

    /**
     * 중간 심각도 에러 처리
     * @param {BaseError} error - 중간 심각도 에러
     */
    handleMediumError(error) {
        // 성능 저하 방지를 위한 제한적 복구
        if (error.type === ErrorTypes.CHART_ERROR) {
            this.handleChartError(error);
        }
    }

    /**
     * 낮은 심각도 에러 처리
     * @param {BaseError} error - 낮은 심각도 에러
     */
    handleLowError(error) {
        // 단순 로깅만 수행
        // 사용자 경험에 영향을 주지 않도록 최소한의 처리
    }

    /**
     * 에러 리스너 등록
     * @param {string} type - 에러 타입
     * @param {Function} listener - 리스너 함수
     */
    addErrorListener(type, listener) {
        if (!this.errorListeners.has(type)) {
            this.errorListeners.set(type, []);
        }
        this.errorListeners.get(type).push(listener);
    }

    /**
     * 에러 리스너 제거
     * @param {string} type - 에러 타입
     * @param {Function} listener - 제거할 리스너 함수
     */
    removeErrorListener(type, listener) {
        const listeners = this.errorListeners.get(type);
        if (listeners) {
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * 에러 리스너들에게 알림
     * @param {BaseError} error - 알림할 에러
     */
    notifyListeners(error) {
        const listeners = this.errorListeners.get(error.type) || [];
        listeners.forEach(listener => {
            try {
                listener(error);
            } catch (listenerError) {
                console.error('Error in error listener:', listenerError);
            }
        });
    }

    /**
     * 사용자에게 에러 알림
     * @param {BaseError} error - 알림할 에러
     */
    notifyUser(error) {
        // 높은 심각도 에러만 사용자에게 알림
        if (error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL) {
            this.showUserNotification(error);
        }
    }

    /**
     * 사용자 알림 표시
     * @param {BaseError} error - 표시할 에러
     */
    showUserNotification(error) {
        const message = this.getUserFriendlyMessage(error);
        
        if (window.dashboard && typeof window.dashboard.showNotification === 'function') {
            window.dashboard.showNotification(message, 'error');
        } else {
            // 기본 알림 방식
            this.showBasicNotification(message);
        }
    }

    /**
     * 사용자 친화적 메시지 생성
     * @param {BaseError} error - 에러 객체
     * @returns {string} 사용자 친화적 메시지
     */
    getUserFriendlyMessage(error) {
        const messages = {
            [ErrorTypes.MODULE_ERROR]: 'System component error occurred. Please refresh the page.',
            [ErrorTypes.API_ERROR]: 'Unable to load data. Please check your connection and try again.',
            [ErrorTypes.NETWORK_ERROR]: 'Network connection lost. Please check your internet connection.',
            [ErrorTypes.CHART_ERROR]: 'Chart loading failed. Some visualizations may not be available.',
            [ErrorTypes.DEPENDENCY_ERROR]: 'System dependency error. Please refresh the page.',
            [ErrorTypes.UNKNOWN_ERROR]: 'An unexpected error occurred. Please refresh the page.'
        };

        return messages[error.type] || messages[ErrorTypes.UNKNOWN_ERROR];
    }

    /**
     * 기본 알림 표시
     * @param {string} message - 알림 메시지
     */
    showBasicNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 300px;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    /**
     * 치명적 에러 메시지 표시
     * @param {BaseError} error - 치명적 에러
     */
    showCriticalErrorMessage(error) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        overlay.innerHTML = `
            <div style="
                background: white;
                padding: 2rem;
                border-radius: 8px;
                max-width: 400px;
                text-align: center;
            ">
                <h2 style="color: #dc3545; margin: 0 0 1rem;">Critical Error</h2>
                <p>A critical error has occurred. The application will attempt to recover.</p>
                <button onclick="location.reload()" style="
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    cursor: pointer;
                ">Reload Application</button>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }

    /**
     * 애플리케이션 상태 저장
     */
    saveApplicationState() {
        try {
            const state = {
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                errorLog: this.errorLog.slice(-10), // 최근 10개 에러만
                performance: performance.getEntriesByType('navigation')[0]
            };
            
            localStorage.setItem('fca_emergency_state', JSON.stringify(state));
        } catch (error) {
            console.error('Failed to save application state:', error);
        }
    }

    /**
     * 긴급 복구 시도
     * @param {BaseError} error - 복구 대상 에러
     */
    attemptEmergencyRecovery(error) {
        // 메모리 정리
        if (window.gc && typeof window.gc === 'function') {
            window.gc();
        }

        // 모든 타이머 정리
        this.clearAllTimers();

        // 캐시 정리
        this.clearCaches();
    }

    /**
     * 모듈 복구 시도
     * @param {string} moduleName - 복구할 모듈명
     */
    attemptModuleRecovery(moduleName) {
        if (window.moduleManager && typeof window.moduleManager.restart === 'function') {
            window.moduleManager.restart(moduleName).catch(error => {
                console.error(`Failed to restart module ${moduleName}:`, error);
            });
        }
    }

    /**
     * API 재시도
     * @param {string} endpoint - 재시도할 엔드포인트
     */
    attemptAPIRetry(endpoint) {
        // 간단한 재시도 로직
        setTimeout(() => {
            if (window.apiClient && typeof window.apiClient.makeRequest === 'function') {
                window.apiClient.makeRequest(endpoint).catch(error => {
                    console.warn(`API retry failed for ${endpoint}:`, error);
                });
            }
        }, 5000);
    }

    /**
     * 차트 에러 처리
     * @param {BaseError} error - 차트 에러
     */
    handleChartError(error) {
        const chartId = error.context.chartId;
        const chartContainer = document.getElementById(chartId);
        
        if (chartContainer) {
            chartContainer.innerHTML = `
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 200px;
                    color: #6c757d;
                    text-align: center;
                ">
                    <div>
                        <div>⚠️</div>
                        <div>Chart failed to load</div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * 모든 타이머 정리
     */
    clearAllTimers() {
        const highestTimeoutId = setTimeout(() => {});
        for (let i = 0; i < highestTimeoutId; i++) {
            clearTimeout(i);
        }
        
        const highestIntervalId = setInterval(() => {});
        for (let i = 0; i < highestIntervalId; i++) {
            clearInterval(i);
        }
    }

    /**
     * 캐시 정리
     */
    clearCaches() {
        // API 캐시 정리
        if (window.apiClient && typeof window.apiClient.clearCache === 'function') {
            window.apiClient.clearCache();
        }

        // 브라우저 캐시 정리
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => {
                    caches.delete(name);
                });
            });
        }
    }

    /**
     * 서버로 에러 전송
     * @param {BaseError} error - 전송할 에러
     */
    sendErrorToServer(error) {
        // 개발 환경에서는 전송하지 않음
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return;
        }

        // 중요한 에러만 서버로 전송
        if (error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL) {
            fetch('/api/errors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(error.toJSON())
            }).catch(sendError => {
                console.warn('Failed to send error to server:', sendError);
            });
        }
    }

    /**
     * 에러 로그 조회
     * @param {string} [type] - 특정 타입의 에러만 조회
     * @returns {Array<BaseError>} 에러 로그
     */
    getErrorLog(type = null) {
        if (type) {
            return this.errorLog.filter(error => error.type === type);
        }
        return [...this.errorLog];
    }

    /**
     * 에러 통계 조회
     * @returns {Object} 에러 통계
     */
    getErrorStats() {
        const stats = {
            total: this.errorLog.length,
            byType: {},
            bySeverity: {},
            recent: this.errorLog.slice(-10)
        };

        this.errorLog.forEach(error => {
            // 타입별 통계
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
            
            // 심각도별 통계
            stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
        });

        return stats;
    }

    /**
     * 에러 로그 정리
     */
    clearErrorLog() {
        this.errorLog = [];
    }
}

// 전역 에러 핸들러 인스턴스 생성
export const errorHandler = new ErrorHandler();

export default errorHandler;