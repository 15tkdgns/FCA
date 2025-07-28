/**
 * Type Safety Utilities
 * JavaScript 환경에서의 타입 안전성 제공
 */

/**
 * 타입 정의 클래스
 */
export class TypeDefinitions {
    /**
     * 모듈 설정 타입
     * @typedef {Object} ModuleConfig
     * @property {string} name - 모듈 이름
     * @property {Array<string>} dependencies - 의존성 목록
     * @property {Object} [options] - 추가 옵션
     */

    /**
     * API 응답 타입
     * @typedef {Object} APIResponse
     * @property {string} status - 응답 상태 ('success'|'error')
     * @property {any} [data] - 응답 데이터 (성공시)
     * @property {string} [message] - 에러 메시지 (실패시)
     * @property {string} [timestamp] - 응답 시간
     */

    /**
     * 성능 메트릭 타입
     * @typedef {Object} PerformanceMetrics
     * @property {number} totalRequests - 총 요청 수
     * @property {number} successfulRequests - 성공한 요청 수
     * @property {number} failedRequests - 실패한 요청 수
     * @property {number} averageResponseTime - 평균 응답 시간
     * @property {number} cacheHits - 캐시 히트 수
     * @property {number} activeRequests - 활성 요청 수
     */

    /**
     * 차트 설정 타입
     * @typedef {Object} ChartConfig
     * @property {string} type - 차트 타입
     * @property {Object} data - 차트 데이터
     * @property {Object} [options] - 차트 옵션
     */
}

/**
 * 타입 체크 데코레이터
 */
export class TypeChecker {
    /**
     * 메서드 파라미터 타입 체크 데코레이터
     * @param {Array} types - 예상 타입 배열
     * @returns {Function} 데코레이터 함수
     */
    static validateParams(...types) {
        return function(target, propertyName, descriptor) {
            const method = descriptor.value;
            
            descriptor.value = function(...args) {
                // 파라미터 수 체크
                if (args.length < types.length) {
                    throw new TypeError(`Method ${propertyName} expects ${types.length} arguments, got ${args.length}`);
                }
                
                // 각 파라미터 타입 체크
                types.forEach((expectedType, index) => {
                    if (args[index] !== undefined && !TypeChecker.isType(args[index], expectedType)) {
                        throw new TypeError(`Method ${propertyName} parameter ${index} expects ${expectedType}, got ${typeof args[index]}`);
                    }
                });
                
                return method.apply(this, args);
            };
            
            return descriptor;
        };
    }

    /**
     * 반환값 타입 체크 데코레이터
     * @param {string} expectedType - 예상 반환 타입
     * @returns {Function} 데코레이터 함수
     */
    static validateReturn(expectedType) {
        return function(target, propertyName, descriptor) {
            const method = descriptor.value;
            
            descriptor.value = function(...args) {
                const result = method.apply(this, args);
                
                if (result !== undefined && !TypeChecker.isType(result, expectedType)) {
                    throw new TypeError(`Method ${propertyName} should return ${expectedType}, got ${typeof result}`);
                }
                
                return result;
            };
            
            return descriptor;
        };
    }

    /**
     * 값이 특정 타입인지 체크
     * @param {any} value - 체크할 값
     * @param {string} type - 예상 타입
     * @returns {boolean} 타입 일치 여부
     */
    static isType(value, type) {
        switch (type) {
            case 'string':
                return typeof value === 'string';
            case 'number':
                return typeof value === 'number' && !isNaN(value);
            case 'boolean':
                return typeof value === 'boolean';
            case 'function':
                return typeof value === 'function';
            case 'object':
                return typeof value === 'object' && value !== null && !Array.isArray(value);
            case 'array':
                return Array.isArray(value);
            case 'date':
                return value instanceof Date;
            case 'promise':
                return value instanceof Promise || (value && typeof value.then === 'function');
            case 'element':
                return value instanceof Element;
            case 'undefined':
                return value === undefined;
            case 'null':
                return value === null;
            default:
                return false;
        }
    }

    /**
     * 복합 타입 체크 (여러 타입 허용)
     * @param {any} value - 체크할 값
     * @param {Array<string>} types - 허용되는 타입들
     * @returns {boolean} 타입 일치 여부
     */
    static isOneOfTypes(value, types) {
        return types.some(type => this.isType(value, type));
    }

    /**
     * 인터페이스 구조 체크
     * @param {Object} obj - 체크할 객체
     * @param {Object} interface - 인터페이스 정의
     * @returns {boolean} 인터페이스 일치 여부
     */
    static implementsInterface(obj, interface) {
        if (!this.isType(obj, 'object')) {
            return false;
        }

        for (const [key, expectedType] of Object.entries(interface)) {
            if (!(key in obj)) {
                return false;
            }
            
            if (!this.isType(obj[key], expectedType)) {
                return false;
            }
        }

        return true;
    }
}

/**
 * 런타임 타입 가드
 */
export class TypeGuards {
    /**
     * 문자열 타입 가드
     * @param {any} value - 체크할 값
     * @returns {boolean} 문자열 여부
     */
    static isString(value) {
        return typeof value === 'string';
    }

    /**
     * 숫자 타입 가드
     * @param {any} value - 체크할 값
     * @returns {boolean} 숫자 여부
     */
    static isNumber(value) {
        return typeof value === 'number' && !isNaN(value);
    }

    /**
     * 배열 타입 가드
     * @param {any} value - 체크할 값
     * @returns {boolean} 배열 여부
     */
    static isArray(value) {
        return Array.isArray(value);
    }

    /**
     * 비어있지 않은 배열 타입 가드
     * @param {any} value - 체크할 값
     * @returns {boolean} 비어있지 않은 배열 여부
     */
    static isNonEmptyArray(value) {
        return Array.isArray(value) && value.length > 0;
    }

    /**
     * 객체 타입 가드
     * @param {any} value - 체크할 값
     * @returns {boolean} 객체 여부
     */
    static isObject(value) {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }

    /**
     * 함수 타입 가드
     * @param {any} value - 체크할 값
     * @returns {boolean} 함수 여부
     */
    static isFunction(value) {
        return typeof value === 'function';
    }

    /**
     * DOM 요소 타입 가드
     * @param {any} value - 체크할 값
     * @returns {boolean} DOM 요소 여부
     */
    static isElement(value) {
        return value instanceof Element;
    }

    /**
     * Promise 타입 가드
     * @param {any} value - 체크할 값
     * @returns {boolean} Promise 여부
     */
    static isPromise(value) {
        return value instanceof Promise || (value && typeof value.then === 'function');
    }

    /**
     * API 응답 타입 가드
     * @param {any} value - 체크할 값
     * @returns {boolean} 유효한 API 응답 여부
     */
    static isValidAPIResponse(value) {
        return this.isObject(value) && 
               this.isString(value.status) && 
               ['success', 'error'].includes(value.status);
    }

    /**
     * 모듈 인스턴스 타입 가드
     * @param {any} value - 체크할 값
     * @returns {boolean} 유효한 모듈 인스턴스 여부
     */
    static isValidModule(value) {
        return this.isObject(value) && 
               this.isString(value.name) && 
               this.isFunction(value.initialize) && 
               this.isFunction(value.destroy);
    }

    /**
     * 차트 설정 타입 가드
     * @param {any} value - 체크할 값
     * @returns {boolean} 유효한 차트 설정 여부
     */
    static isValidChartConfig(value) {
        return this.isObject(value) && 
               this.isString(value.type) && 
               this.isObject(value.data) && 
               this.isArray(value.data.labels) && 
               this.isArray(value.data.datasets);
    }

    /**
     * 성능 메트릭 타입 가드
     * @param {any} value - 체크할 값
     * @returns {boolean} 유효한 성능 메트릭 여부
     */
    static isValidPerformanceMetrics(value) {
        return this.isObject(value) && 
               this.isNumber(value.totalRequests) && 
               this.isNumber(value.successfulRequests) && 
               this.isNumber(value.failedRequests) && 
               this.isNumber(value.averageResponseTime);
    }
}

/**
 * 타입 안전한 유틸리티 함수들
 */
export class SafeUtils {
    /**
     * 안전한 프로퍼티 접근
     * @param {Object} obj - 객체
     * @param {string} path - 프로퍼티 경로 (예: 'a.b.c')
     * @param {any} defaultValue - 기본값
     * @returns {any} 프로퍼티 값 또는 기본값
     */
    static safeGet(obj, path, defaultValue = undefined) {
        if (!TypeGuards.isObject(obj) || !TypeGuards.isString(path)) {
            return defaultValue;
        }

        try {
            return path.split('.').reduce((current, key) => {
                return (current && current[key] !== undefined) ? current[key] : undefined;
            }, obj) ?? defaultValue;
        } catch (error) {
            return defaultValue;
        }
    }

    /**
     * 안전한 JSON 파싱
     * @param {string} jsonString - JSON 문자열
     * @param {any} defaultValue - 파싱 실패시 기본값
     * @returns {any} 파싱된 객체 또는 기본값
     */
    static safeJSONParse(jsonString, defaultValue = null) {
        if (!TypeGuards.isString(jsonString)) {
            return defaultValue;
        }

        try {
            return JSON.parse(jsonString);
        } catch (error) {
            return defaultValue;
        }
    }

    /**
     * 안전한 배열 접근
     * @param {Array} array - 배열
     * @param {number} index - 인덱스
     * @param {any} defaultValue - 기본값
     * @returns {any} 배열 요소 또는 기본값
     */
    static safeArrayAccess(array, index, defaultValue = undefined) {
        if (!TypeGuards.isArray(array) || !TypeGuards.isNumber(index)) {
            return defaultValue;
        }

        if (index < 0 || index >= array.length) {
            return defaultValue;
        }

        return array[index];
    }

    /**
     * 안전한 함수 호출
     * @param {Function} fn - 호출할 함수
     * @param {Array} args - 함수 인자
     * @param {any} defaultValue - 호출 실패시 기본값
     * @returns {any} 함수 결과 또는 기본값
     */
    static safeCall(fn, args = [], defaultValue = undefined) {
        if (!TypeGuards.isFunction(fn)) {
            return defaultValue;
        }

        try {
            return fn.apply(null, args);
        } catch (error) {
            console.warn('Safe call failed:', error);
            return defaultValue;
        }
    }

    /**
     * 안전한 비동기 함수 호출
     * @param {Function} fn - 호출할 비동기 함수
     * @param {Array} args - 함수 인자
     * @param {any} defaultValue - 호출 실패시 기본값
     * @returns {Promise<any>} 함수 결과 또는 기본값
     */
    static async safeCallAsync(fn, args = [], defaultValue = undefined) {
        if (!TypeGuards.isFunction(fn)) {
            return defaultValue;
        }

        try {
            const result = fn.apply(null, args);
            return TypeGuards.isPromise(result) ? await result : result;
        } catch (error) {
            console.warn('Safe async call failed:', error);
            return defaultValue;
        }
    }

    /**
     * 타입 안전한 배열 매핑
     * @param {Array} array - 원본 배열
     * @param {Function} mapper - 매핑 함수
     * @param {Array} defaultValue - 기본값
     * @returns {Array} 매핑된 배열 또는 기본값
     */
    static safeMap(array, mapper, defaultValue = []) {
        if (!TypeGuards.isArray(array) || !TypeGuards.isFunction(mapper)) {
            return defaultValue;
        }

        try {
            return array.map(mapper);
        } catch (error) {
            console.warn('Safe map failed:', error);
            return defaultValue;
        }
    }

    /**
     * 타입 안전한 배열 필터링
     * @param {Array} array - 원본 배열
     * @param {Function} predicate - 필터 함수
     * @param {Array} defaultValue - 기본값
     * @returns {Array} 필터된 배열 또는 기본값
     */
    static safeFilter(array, predicate, defaultValue = []) {
        if (!TypeGuards.isArray(array) || !TypeGuards.isFunction(predicate)) {
            return defaultValue;
        }

        try {
            return array.filter(predicate);
        } catch (error) {
            console.warn('Safe filter failed:', error);
            return defaultValue;
        }
    }
}

/**
 * 컴파일 타임 체크를 위한 JSDoc 템플릿들
 */
export const JSDocTemplates = {
    /**
     * 모듈 클래스 템플릿
     * @example
     * \/**
     *  * @class MyModule
     *  * @extends {BaseModule}
     *  * @param {string} name - 모듈 이름
     *  * @param {string[]} dependencies - 의존성 목록
     *\/
     */
    moduleClass: '',

    /**
     * API 메서드 템플릿
     * @example
     * \/**
     *  * @async
     *  * @method getData
     *  * @param {string} endpoint - API 엔드포인트
     *  * @param {Object} [options] - 요청 옵션
     *  * @returns {Promise<APIResponse>} API 응답
     *  * @throws {Error} 네트워크 오류 시
     *\/
     */
    apiMethod: '',

    /**
     * 이벤트 핸들러 템플릿
     * @example
     * \/**
     *  * @method handleClick
     *  * @param {MouseEvent} event - 클릭 이벤트
     *  * @returns {void}
     *\/
     */
    eventHandler: ''
};

export default TypeChecker;