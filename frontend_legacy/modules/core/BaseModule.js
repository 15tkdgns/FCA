/**
 * Base Module Class
 * 모든 모듈의 기본 클래스로 공통 기능을 제공
 */
export class BaseModule {
    constructor(name, dependencies = []) {
        this.name = name;
        this.dependencies = dependencies;
        this.initialized = false;
        this.destroyed = false;
        this.eventListeners = new Map();
        this.moduleId = `${name}_${Date.now()}`;
        
        this.logger = this.createLogger();
        this.logger.info(`Module ${this.name} created`);
    }

    /**
     * 모듈 초기화
     * 하위 클래스에서 반드시 구현해야 함
     */
    async initialize() {
        if (this.initialized) {
            this.logger.warn(`Module ${this.name} already initialized`);
            return;
        }

        try {
            await this.checkDependencies();
            await this.onInitialize();
            this.initialized = true;
            this.logger.info(`Module ${this.name} initialized successfully`);
        } catch (error) {
            this.logger.error(`Failed to initialize module ${this.name}:`, error);
            throw error;
        }
    }

    /**
     * 하위 클래스에서 구현할 초기화 메서드
     */
    async onInitialize() {
        throw new Error(`Module ${this.name} must implement onInitialize method`);
    }

    /**
     * 의존성 확인
     */
    async checkDependencies() {
        for (const dependency of this.dependencies) {
            if (!this.isDependencyAvailable(dependency)) {
                throw new Error(`Dependency ${dependency} not available for module ${this.name}`);
            }
        }
    }

    /**
     * 의존성 사용 가능 여부 확인
     */
    isDependencyAvailable(dependency) {
        // Chart.js 같은 외부 라이브러리 확인
        if (dependency === 'chart.js') {
            return typeof Chart !== 'undefined';
        }
        
        // 다른 모듈 확인
        return window[dependency] !== undefined;
    }

    /**
     * 이벤트 리스너 등록
     */
    addEventListener(element, event, handler, options = {}) {
        if (!element) return;

        const key = `${element.id || 'anonymous'}_${event}`;
        
        // 기존 리스너가 있으면 제거
        this.removeEventListener(key);
        
        // 새 리스너 등록
        element.addEventListener(event, handler, options);
        this.eventListeners.set(key, { element, event, handler, options });
    }

    /**
     * 이벤트 리스너 제거
     */
    removeEventListener(key) {
        const listener = this.eventListeners.get(key);
        if (listener) {
            listener.element.removeEventListener(listener.event, listener.handler, listener.options);
            this.eventListeners.delete(key);
        }
    }

    /**
     * 모든 이벤트 리스너 정리
     */
    cleanupEventListeners() {
        for (const [key, listener] of this.eventListeners) {
            listener.element.removeEventListener(listener.event, listener.handler, listener.options);
        }
        this.eventListeners.clear();
        this.logger.info(`Cleaned up ${this.eventListeners.size} event listeners`);
    }

    /**
     * DOM 요소 생성 헬퍼
     */
    createElement(tag, attributes = {}, textContent = '') {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else {
                element.setAttribute(key, value);
            }
        });
        
        if (textContent) {
            element.textContent = textContent;
        }
        
        return element;
    }

    /**
     * CSS 스타일 추가 헬퍼
     */
    addStyles(cssText, id = null) {
        const styleId = id || `${this.name}-styles`;
        
        // 기존 스타일 제거
        const existingStyle = document.getElementById(styleId);
        if (existingStyle) {
            existingStyle.remove();
        }
        
        // 새 스타일 추가
        const style = this.createElement('style', { id: styleId });
        style.textContent = cssText;
        document.head.appendChild(style);
        
        return style;
    }

    /**
     * 로거 생성
     */
    createLogger() {
        const logLevel = this.getLogLevel();
        
        return {
            debug: (message, ...args) => {
                if (logLevel >= 4) console.debug(`[${this.name}] ${message}`, ...args);
            },
            info: (message, ...args) => {
                if (logLevel >= 3) console.info(`[${this.name}] ${message}`, ...args);
            },
            warn: (message, ...args) => {
                if (logLevel >= 2) console.warn(`[${this.name}] ${message}`, ...args);
            },
            error: (message, ...args) => {
                if (logLevel >= 1) console.error(`[${this.name}] ${message}`, ...args);
            }
        };
    }

    /**
     * 로그 레벨 가져오기
     */
    getLogLevel() {
        // 개발 환경에서는 모든 로그, 프로덕션에서는 error만
        const isDevelopment = window.location.hostname === 'localhost' || 
                            window.location.hostname === '127.0.0.1';
        return isDevelopment ? 4 : 1;
    }

    /**
     * 모듈 상태 확인
     */
    getStatus() {
        return {
            name: this.name,
            id: this.moduleId,
            initialized: this.initialized,
            destroyed: this.destroyed,
            dependencies: this.dependencies,
            eventListeners: this.eventListeners.size
        };
    }

    /**
     * 모듈 파괴
     */
    async destroy() {
        if (this.destroyed) {
            this.logger.warn(`Module ${this.name} already destroyed`);
            return;
        }

        try {
            await this.onDestroy();
            this.cleanupEventListeners();
            this.destroyed = true;
            this.initialized = false;
            this.logger.info(`Module ${this.name} destroyed successfully`);
        } catch (error) {
            this.logger.error(`Failed to destroy module ${this.name}:`, error);
            throw error;
        }
    }

    /**
     * 하위 클래스에서 구현할 파괴 메서드
     */
    async onDestroy() {
        // 기본 구현은 비어있음 - 하위 클래스에서 필요시 구현
    }

    /**
     * 모듈 상태 검증
     */
    validate() {
        const errors = [];
        
        if (!this.name) {
            errors.push('Module name is required');
        }
        
        if (this.destroyed) {
            errors.push('Module has been destroyed');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * 성능 측정 헬퍼
     */
    measure(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        
        this.logger.debug(`${name} took ${(end - start).toFixed(2)}ms`);
        return result;
    }

    /**
     * 비동기 성능 측정 헬퍼
     */
    async measureAsync(name, fn) {
        const start = performance.now();
        const result = await fn();
        const end = performance.now();
        
        this.logger.debug(`${name} took ${(end - start).toFixed(2)}ms`);
        return result;
    }
}

export default BaseModule;