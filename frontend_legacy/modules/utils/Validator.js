/**
 * Validation Utilities
 * 데이터 검증 및 유효성 검사 유틸리티
 */

export class Validator {
    /**
     * 모듈 의존성 검증
     * @param {string} moduleName - 모듈 이름
     * @param {Array<string>} dependencies - 의존성 목록
     * @returns {Object} 검증 결과
     */
    static validateModuleDependencies(moduleName, dependencies = []) {
        const results = {
            valid: true,
            missing: [],
            errors: []
        };

        if (!moduleName || typeof moduleName !== 'string') {
            results.valid = false;
            results.errors.push('Module name is required and must be a string');
        }

        dependencies.forEach(dependency => {
            if (!this.isDependencyAvailable(dependency)) {
                results.valid = false;
                results.missing.push(dependency);
            }
        });

        return results;
    }

    /**
     * 의존성 사용 가능 여부 확인
     * @param {string} dependency - 의존성 이름
     * @returns {boolean} 사용 가능 여부
     */
    static isDependencyAvailable(dependency) {
        const knownDependencies = {
            'chart.js': () => typeof Chart !== 'undefined',
            'APIClient': () => window.APIClient !== undefined || window.apiClient !== undefined,
            'FCADashboard': () => window.FCADashboard !== undefined || window.dashboard !== undefined
        };

        const checker = knownDependencies[dependency];
        if (checker) {
            return checker();
        }

        // Check if it's available globally
        return window[dependency] !== undefined;
    }

    /**
     * API 응답 검증
     * @param {Object} response - API 응답
     * @returns {Object} 검증 결과
     */
    static validateAPIResponse(response) {
        const results = {
            valid: true,
            errors: []
        };

        if (!response) {
            results.valid = false;
            results.errors.push('Response is null or undefined');
            return results;
        }

        if (typeof response !== 'object') {
            results.valid = false;
            results.errors.push('Response must be an object');
            return results;
        }

        // Check for standard API response structure
        if (!response.hasOwnProperty('status')) {
            results.valid = false;
            results.errors.push('Response missing status field');
        }

        if (response.status === 'error' && !response.message) {
            results.valid = false;
            results.errors.push('Error responses must include message');
        }

        if (response.status === 'success' && !response.data) {
            results.valid = false;
            results.errors.push('Success responses must include data');
        }

        return results;
    }

    /**
     * 차트 설정 검증
     * @param {Object} config - 차트 설정
     * @returns {Object} 검증 결과
     */
    static validateChartConfig(config) {
        const results = {
            valid: true,
            errors: []
        };

        if (!config) {
            results.valid = false;
            results.errors.push('Chart config is required');
            return results;
        }

        if (!config.type) {
            results.valid = false;
            results.errors.push('Chart type is required');
        }

        if (!config.data) {
            results.valid = false;
            results.errors.push('Chart data is required');
        } else {
            if (!config.data.labels || !Array.isArray(config.data.labels)) {
                results.valid = false;
                results.errors.push('Chart data must include labels array');
            }

            if (!config.data.datasets || !Array.isArray(config.data.datasets)) {
                results.valid = false;
                results.errors.push('Chart data must include datasets array');
            }
        }

        return results;
    }

    /**
     * 모듈 상태 검증
     * @param {Object} module - 모듈 인스턴스
     * @returns {Object} 검증 결과
     */
    static validateModuleState(module) {
        const results = {
            valid: true,
            errors: [],
            warnings: []
        };

        if (!module) {
            results.valid = false;
            results.errors.push('Module is null or undefined');
            return results;
        }

        // Check essential properties
        if (!module.name) {
            results.warnings.push('Module missing name property');
        }

        if (typeof module.initialize !== 'function') {
            results.warnings.push('Module missing initialize method');
        }

        if (typeof module.destroy !== 'function') {
            results.warnings.push('Module missing destroy method');
        }

        // Check initialization state
        if (module.initialized === false && typeof module.initialize === 'function') {
            results.warnings.push('Module not yet initialized');
        }

        if (module.destroyed === true) {
            results.valid = false;
            results.errors.push('Module has been destroyed');
        }

        return results;
    }

    /**
     * 데이터 타입 검증
     * @param {any} value - 검증할 값
     * @param {string} expectedType - 예상 타입
     * @returns {boolean} 타입 일치 여부
     */
    static validateType(value, expectedType) {
        switch (expectedType) {
            case 'string':
                return typeof value === 'string';
            case 'number':
                return typeof value === 'number' && !isNaN(value);
            case 'boolean':
                return typeof value === 'boolean';
            case 'array':
                return Array.isArray(value);
            case 'object':
                return typeof value === 'object' && value !== null && !Array.isArray(value);
            case 'function':
                return typeof value === 'function';
            case 'date':
                return value instanceof Date;
            default:
                return false;
        }
    }

    /**
     * 성능 메트릭 검증
     * @param {Object} metrics - 성능 메트릭
     * @returns {Object} 검증 결과
     */
    static validatePerformanceMetrics(metrics) {
        const results = {
            valid: true,
            errors: [],
            warnings: []
        };

        if (!metrics || typeof metrics !== 'object') {
            results.valid = false;
            results.errors.push('Performance metrics must be an object');
            return results;
        }

        // Check for negative values where they shouldn't be
        const positiveFields = ['totalRequests', 'successfulRequests', 'averageResponseTime', 'cacheHits'];
        positiveFields.forEach(field => {
            if (metrics[field] !== undefined && metrics[field] < 0) {
                results.warnings.push(`${field} should not be negative`);
            }
        });

        // Check for reasonable response times (> 10 seconds might indicate issues)
        if (metrics.averageResponseTime > 10000) {
            results.warnings.push('Average response time is unusually high (>10s)');
        }

        // Check cache hit rate
        if (metrics.cacheHitRate !== undefined) {
            if (metrics.cacheHitRate < 0 || metrics.cacheHitRate > 1) {
                results.warnings.push('Cache hit rate should be between 0 and 1');
            }
        }

        return results;
    }

    /**
     * DOM 요소 검증
     * @param {Element} element - DOM 요소
     * @param {string} expectedTag - 예상 태그명 (선택사항)
     * @returns {Object} 검증 결과
     */
    static validateDOMElement(element, expectedTag = null) {
        const results = {
            valid: true,
            errors: []
        };

        if (!element) {
            results.valid = false;
            results.errors.push('DOM element is null or undefined');
            return results;
        }

        if (!(element instanceof Element)) {
            results.valid = false;
            results.errors.push('Value is not a DOM element');
            return results;
        }

        if (expectedTag && element.tagName.toLowerCase() !== expectedTag.toLowerCase()) {
            results.valid = false;
            results.errors.push(`Expected ${expectedTag} element, got ${element.tagName}`);
        }

        return results;
    }

    /**
     * 설정 객체 검증
     * @param {Object} config - 설정 객체
     * @param {Object} schema - 검증 스키마
     * @returns {Object} 검증 결과
     */
    static validateConfig(config, schema) {
        const results = {
            valid: true,
            errors: [],
            warnings: []
        };

        if (!config || typeof config !== 'object') {
            results.valid = false;
            results.errors.push('Config must be an object');
            return results;
        }

        if (!schema || typeof schema !== 'object') {
            results.valid = false;
            results.errors.push('Schema must be an object');
            return results;
        }

        // Check required fields
        Object.entries(schema).forEach(([key, rules]) => {
            if (rules.required && !(key in config)) {
                results.valid = false;
                results.errors.push(`Required field '${key}' is missing`);
                return;
            }

            if (key in config) {
                const value = config[key];

                // Type validation
                if (rules.type && !this.validateType(value, rules.type)) {
                    results.valid = false;
                    results.errors.push(`Field '${key}' should be of type ${rules.type}`);
                }

                // Range validation for numbers
                if (rules.type === 'number' && typeof value === 'number') {
                    if (rules.min !== undefined && value < rules.min) {
                        results.valid = false;
                        results.errors.push(`Field '${key}' should be >= ${rules.min}`);
                    }
                    if (rules.max !== undefined && value > rules.max) {
                        results.valid = false;
                        results.errors.push(`Field '${key}' should be <= ${rules.max}`);
                    }
                }

                // Array length validation
                if (rules.type === 'array' && Array.isArray(value)) {
                    if (rules.minLength !== undefined && value.length < rules.minLength) {
                        results.warnings.push(`Field '${key}' should have at least ${rules.minLength} items`);
                    }
                    if (rules.maxLength !== undefined && value.length > rules.maxLength) {
                        results.warnings.push(`Field '${key}' should have at most ${rules.maxLength} items`);
                    }
                }

                // Custom validation
                if (rules.validate && typeof rules.validate === 'function') {
                    try {
                        const customResult = rules.validate(value);
                        if (customResult !== true) {
                            results.warnings.push(`Field '${key}': ${customResult}`);
                        }
                    } catch (error) {
                        results.warnings.push(`Field '${key}' validation error: ${error.message}`);
                    }
                }
            }
        });

        return results;
    }

    /**
     * 메모리 사용량 검증
     * @param {Object} memoryInfo - 메모리 정보
     * @returns {Object} 검증 결과
     */
    static validateMemoryUsage(memoryInfo) {
        const results = {
            valid: true,
            warnings: []
        };

        if (!memoryInfo) {
            results.warnings.push('Memory information not available');
            return results;
        }

        // Check for high memory usage (>80% of available)
        if (memoryInfo.used && memoryInfo.total) {
            const usage = memoryInfo.used / memoryInfo.total;
            if (usage > 0.8) {
                results.warnings.push(`High memory usage: ${(usage * 100).toFixed(1)}%`);
            }
        }

        // Check for memory leaks (rapid growth)
        if (memoryInfo.trend === 'increasing rapidly') {
            results.warnings.push('Potential memory leak detected');
        }

        return results;
    }
}

export default Validator;