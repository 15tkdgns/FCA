/**
 * Utils Module
 * ============
 * 
 * 공통 유틸리티 함수 모듈화
 * - 로딩 관리
 * - 에러 표시
 * - 숫자 포맷팅
 * - 성능 모니터링
 */

/**
 * 로딩 status 관리
 */
export class LoadingManager {
    constructor() {
        this.activeLoaders = new Set();
    }

    show(id = 'global') {
        this.activeLoaders.add(id);
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.style.display = 'flex';
        }
    }

    hide(id = 'global') {
        this.activeLoaders.delete(id);
        if (this.activeLoaders.size === 0) {
            const spinner = document.getElementById('loading-spinner');
            if (spinner) {
                spinner.style.display = 'none';
            }
        }
    }

    showInContainer(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="text-center p-4">
                    <div class="spinner-border text-primary mb-3" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <h6>Loading...</h6>
                    <small class="text-muted">데이터를 불러오는 중입니다</small>
                </div>
            `;
        }
    }

    hideFromContainer(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '';
        }
    }
}

/**
 * 에러 표시 관리
 */
export class ErrorManager {
    constructor() {
        this.errorHistory = [];
    }

    show(message, containerId = null, details = null) {
        const error = {
            message,
            containerId,
            details,
            timestamp: new Date(),
            id: Date.now()
        };

        this.errorHistory.push(error);

        const errorHtml = `
            <div class="error-state text-center p-4">
                <i class="fas fa-exclamation-triangle text-warning fa-3x mb-3"></i>
                <h5>error 발생</h5>
                <p class="text-muted">${message}</p>
                ${details ? `<small class="text-muted d-block mb-2">${details}</small>` : ''}
                <button class="btn btn-outline-primary btn-sm" onclick="location.reload()">
                    <i class="fas fa-redo me-1"></i>refresh
                </button>
            </div>
        `;

        if (containerId) {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = errorHtml;
            }
        } else {
            console.error('Error:', message, details);
            this._showToastError(message);
        }
    }

    _showToastError(message) {
        // Enhanced error display 사용 또는 간단한 토스트
        if (window.ErrorDisplay) {
            window.ErrorDisplay.showError({
                category: 'client_error',
                message: message,
                severity: 'medium'
            });
        } else {
            // 간단한 토스트 구현
            this._createToast(message, 'error');
        }
    }

    _createToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : 'info'} border-0 position-fixed`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999;';
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;
        
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    }

    getErrorHistory() {
        return this.errorHistory;
    }

    clearErrorHistory() {
        this.errorHistory = [];
    }
}

/**
 * 숫자 포맷팅 유틸리티
 */
export const NumberFormatter = {
    format(num, decimals = 3) {
        if (typeof num !== 'number') return '-';
        if (decimals === 0) return Math.round(num).toLocaleString();
        return num.toFixed(decimals);
    },

    formatPercent(num, decimals = 1) {
        if (typeof num !== 'number') return '-';
        return (num * 100).toFixed(decimals) + '%';
    },

    formatCurrency(num, currency = 'KRW') {
        if (typeof num !== 'number') return '-';
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: currency
        }).format(num);
    },

    formatCompact(num) {
        if (typeof num !== 'number') return '-';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
        return num.toString();
    },

    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
};

/**
 * 성능 분류 유틸리티
 */
export const PerformanceUtils = {
    getClass(score) {
        if (score >= 0.9) return 'excellent';
        if (score >= 0.8) return 'good';
        if (score >= 0.7) return 'fair';
        return 'poor';
    },

    getColor(score) {
        if (score >= 0.9) return '#10b981'; // green
        if (score >= 0.8) return '#3b82f6'; // blue
        if (score >= 0.7) return '#f59e0b'; // yellow
        return '#ef4444'; // red
    },

    getBootstrapClass(score) {
        if (score >= 0.9) return 'text-success';
        if (score >= 0.8) return 'text-info';
        if (score >= 0.7) return 'text-warning';
        return 'text-danger';
    }
};

/**
 * 애니메이션 유틸리티
 */
export class AnimationUtils {
    static animateCounter(element, start, end, duration = 1000) {
        if (!element) return;
        
        const startTime = performance.now();
        
        function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentValue = start + (end - start) * progress;
            element.textContent = Math.round(currentValue);
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        }
        
        requestAnimationFrame(updateCounter);
    }

    static fadeIn(element, duration = 300) {
        if (!element) return;
        
        element.style.opacity = '0';
        element.style.transition = `opacity ${duration}ms ease-in-out`;
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
        });
    }

    static slideIn(element, direction = 'left', duration = 300) {
        if (!element) return;
        
        const transforms = {
            left: 'translateX(-20px)',
            right: 'translateX(20px)',
            top: 'translateY(-20px)',
            bottom: 'translateY(20px)'
        };

        element.style.transform = transforms[direction];
        element.style.opacity = '0';
        element.style.transition = `all ${duration}ms ease-out`;
        
        requestAnimationFrame(() => {
            element.style.transform = 'translate(0)';
            element.style.opacity = '1';
        });
    }

    static pulse(element, duration = 600) {
        if (!element) return;
        
        element.style.animation = `pulse ${duration}ms ease-in-out`;
        setTimeout(() => {
            element.style.animation = '';
        }, duration);
    }
}

/**
 * time 유틸리티
 */
export const TimeUtils = {
    formatTime(date = new Date()) {
        return date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    },

    formatTimeShort(date = new Date()) {
        return date.toLocaleString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    },

    formatRelative(date) {
        const now = new Date();
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}일 전`;
        if (hours > 0) return `${hours}time 전`;
        if (minutes > 0) return `${minutes}분 전`;
        return `${seconds}초 전`;
    },

    updateTimeElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = this.formatTime();
        }
    }
};

/**
 * DOM 유틸리티
 */
export const DOMUtils = {
    ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    },

    createElement(tag, options = {}) {
        const element = document.createElement(tag);
        
        if (options.className) element.className = options.className;
        if (options.id) element.id = options.id;
        if (options.innerHTML) element.innerHTML = options.innerHTML;
        if (options.textContent) element.textContent = options.textContent;
        
        if (options.attributes) {
            Object.entries(options.attributes).forEach(([key, value]) => {
                element.setAttribute(key, value);
            });
        }
        
        if (options.styles) {
            Object.assign(element.style, options.styles);
        }
        
        return element;
    },

    findElement(selector, context = document) {
        return context.querySelector(selector);
    },

    findElements(selector, context = document) {
        return Array.from(context.querySelectorAll(selector));
    }
};

/**
 * 통합 Utils 클래스
 */
export class Utils {
    constructor() {
        this.loading = new LoadingManager();
        this.error = new ErrorManager();
        this.number = NumberFormatter;
        this.performance = PerformanceUtils;
        this.animation = AnimationUtils;
        this.time = TimeUtils;
        this.dom = DOMUtils;
    }

    // 하위 호환성을 위한 직접 메서드들
    showLoading(id) { return this.loading.show(id); }
    hideLoading(id) { return this.loading.hide(id); }
    showLoadingInContainer(containerId) { return this.loading.showInContainer(containerId); }
    
    showError(message, containerId, details) { return this.error.show(message, containerId, details); }
    
    formatNumber(num, decimals) { return this.number.format(num, decimals); }
    formatPercent(num, decimals) { return this.number.formatPercent(num, decimals); }
    
    getPerformanceClass(score) { return this.performance.getClass(score); }
    
    animateCounter(element, start, end, duration) { 
        return this.animation.animateCounter(element, start, end, duration); 
    }
    
    updateTime(elementId = 'current-time') { return this.time.updateTimeElement(elementId); }
}

// 기본 인스턴스 생성 및 내보내기
export const utils = new Utils();
export default utils;