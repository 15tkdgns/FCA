/**
 * Error Display System
 * =====================
 * 
 * 사용자 친화적 에러 표시 및 관리 시스템
 * - 다양한 에러 타입별 맞춤 메시지
 * - 시각적 피드백 (토스트, 모달, 인라인 메시지)
 * - 에러 복구 가이드 제공
 * - 에러 로그 관리 및 분석
 */

class ErrorDisplaySystem {
    constructor() {
        this.errorQueue = [];
        this.maxQueueSize = 5;
        this.toastContainer = this.createToastContainer();
        
        // 에러 타입별 설정
        this.errorConfigs = {
            'network': {
                icon: 'fas fa-wifi',
                color: 'danger',
                title: '연결 문제',
                suggestions: [
                    '인터넷 연결을 확인해주세요',
                    '잠시 후 다시 시도해주세요',
                    '문제가 지속되면 관리자에게 문의하세요'
                ]
            },
            'server_error': {
                icon: 'fas fa-server',
                color: 'danger',
                title: '서버 오류',
                suggestions: [
                    '잠시 후 다시 시도해주세요',
                    '문제가 지속되면 새로고침 해보세요',
                    '긴급한 경우 관리자에게 문의하세요'
                ]
            },
            'validation': {
                icon: 'fas fa-exclamation-triangle',
                color: 'warning',
                title: '입력 오류',
                suggestions: [
                    '입력하신 정보를 다시 확인해주세요',
                    '필수 항목이 누락되지 않았는지 확인하세요',
                    '형식에 맞게 입력해주세요'
                ]
            },
            'permission': {
                icon: 'fas fa-lock',
                color: 'warning',
                title: '권한 부족',
                suggestions: [
                    '로그인 상태를 확인해주세요',
                    '페이지 접근 권한이 있는지 확인하세요',
                    '관리자에게 권한 요청을 하세요'
                ]
            },
            'timeout': {
                icon: 'fas fa-clock',
                color: 'info',
                title: '시간 초과',
                suggestions: [
                    '네트워크 상태를 확인해주세요',
                    '잠시 후 다시 시도해주세요',
                    '큰 파일의 경우 시간이 더 걸릴 수 있습니다'
                ]
            },
            'data_error': {
                icon: 'fas fa-database',
                color: 'warning',
                title: '데이터 문제',
                suggestions: [
                    '데이터를 다시 불러와보세요',
                    '페이지를 새로고침 해보세요',
                    '문제가 지속되면 관리자에게 문의하세요'
                ]
            }
        };
    }
    
    /**
     * 토스트 컨테이너 생성
     */
    createToastContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container position-fixed top-0 end-0 p-3';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
        }
        return container;
    }
    
    /**
     * 에러 표시 (메인 함수)
     */
    showError(errorInfo, displayType = 'toast') {
        // 큐 관리
        if (this.errorQueue.length >= this.maxQueueSize) {
            this.errorQueue.shift();
        }
        this.errorQueue.push(errorInfo);
        
        // 에러 타입에 따른 표시 방법 결정
        switch (displayType) {
            case 'toast':
                this.showToast(errorInfo);
                break;
            case 'modal':
                this.showModal(errorInfo);
                break;
            case 'inline':
                this.showInlineError(errorInfo);
                break;
            case 'banner':
                this.showBanner(errorInfo);
                break;
            default:
                this.showToast(errorInfo);
        }
        
        // 에러 통계 업데이트
        this.updateErrorStats(errorInfo);
    }
    
    /**
     * 토스트 알림 표시
     */
    showToast(errorInfo) {
        const config = this.getErrorConfig(errorInfo.category);
        const toastId = `toast-${Date.now()}`;
        
        const toastHTML = `
            <div id="${toastId}" class="toast align-items-center text-bg-${config.color} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        <div class="d-flex align-items-center">
                            <i class="${config.icon} me-2"></i>
                            <div>
                                <strong>${config.title}</strong><br>
                                <small>${errorInfo.userMessage || errorInfo.message}</small>
                                ${errorInfo.id ? `<br><small class="opacity-75">오류 ID: ${errorInfo.id}</small>` : ''}
                            </div>
                        </div>
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                            data-bs-dismiss="toast"></button>
                </div>
                ${this.shouldShowActions(errorInfo) ? this.generateActionButtons(errorInfo) : ''}
            </div>
        `;
        
        this.toastContainer.insertAdjacentHTML('beforeend', toastHTML);
        
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, {
            autohide: true,
            delay: this.getToastDelay(errorInfo.severity)
        });
        
        toast.show();
        
        // 토스트 제거 후 정리
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }
    
    /**
     * 모달 에러 표시
     */
    showModal(errorInfo) {
        const config = this.getErrorConfig(errorInfo.category);
        const modalId = 'error-modal';
        
        // 기존 모달 제거
        const existingModal = document.getElementById(modalId);
        if (existingModal) {
            existingModal.remove();
        }
        
        const modalHTML = `
            <div class="modal fade" id="${modalId}" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-${config.color} text-white">
                            <h5 class="modal-title">
                                <i class="${config.icon} me-2"></i>
                                ${config.title}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" 
                                    data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <strong>문제 상황:</strong><br>
                                ${errorInfo.userMessage || errorInfo.message}
                            </div>
                            
                            <div class="mb-3">
                                <strong>해결 방법:</strong>
                                <ul class="mt-2">
                                    ${config.suggestions.map(suggestion => 
                                        `<li>${suggestion}</li>`
                                    ).join('')}
                                </ul>
                            </div>
                            
                            ${errorInfo.id ? `
                                <div class="mb-3">
                                    <small class="text-muted">
                                        <strong>오류 ID:</strong> ${errorInfo.id}<br>
                                        <strong>발생 시간:</strong> ${errorInfo.timestamp || new Date().toLocaleString()}
                                    </small>
                                </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer">
                            ${this.generateModalActions(errorInfo)}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = new bootstrap.Modal(document.getElementById(modalId));
        modal.show();
        
        // 모달 닫힌 후 정리
        document.getElementById(modalId).addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }
    
    /**
     * 인라인 에러 표시
     */
    showInlineError(errorInfo, targetElement) {
        if (!targetElement) {
            console.warn('Inline error requires target element');
            return this.showToast(errorInfo);
        }
        
        const config = this.getErrorConfig(errorInfo.category);
        const errorId = `inline-error-${Date.now()}`;
        
        // 기존 인라인 에러 제거
        const existingError = targetElement.querySelector('.inline-error');
        if (existingError) {
            existingError.remove();
        }
        
        const errorHTML = `
            <div id="${errorId}" class="inline-error alert alert-${config.color} alert-dismissible fade show mt-2">
                <div class="d-flex align-items-center">
                    <i class="${config.icon} me-2"></i>
                    <div class="flex-grow-1">
                        <strong>${config.title}:</strong> ${errorInfo.userMessage || errorInfo.message}
                    </div>
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            </div>
        `;
        
        targetElement.insertAdjacentHTML('afterend', errorHTML);
        
        // 5초 후 자동 제거
        setTimeout(() => {
            const errorElement = document.getElementById(errorId);
            if (errorElement) {
                errorElement.remove();
            }
        }, 5000);
    }
    
    /**
     * 배너 에러 표시
     */
    showBanner(errorInfo) {
        const config = this.getErrorConfig(errorInfo.category);
        const bannerId = 'error-banner';
        
        // 기존 배너 제거
        const existingBanner = document.getElementById(bannerId);
        if (existingBanner) {
            existingBanner.remove();
        }
        
        const bannerHTML = `
            <div id="${bannerId}" class="alert alert-${config.color} alert-dismissible mb-0 rounded-0" 
                 style="position: fixed; top: 0; left: 0; right: 0; z-index: 9998;">
                <div class="container-fluid">
                    <div class="d-flex align-items-center">
                        <i class="${config.icon} me-2"></i>
                        <div class="flex-grow-1">
                            <strong>${config.title}:</strong> ${errorInfo.userMessage || errorInfo.message}
                        </div>
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('afterbegin', bannerHTML);
        
        // body에 패딩 추가
        document.body.style.paddingTop = '60px';
        
        // 배너 제거 시 패딩 제거
        document.getElementById(bannerId).addEventListener('closed.bs.alert', () => {
            document.body.style.paddingTop = '';
        });
    }
    
    /**
     * 에러 설정 가져오기
     */
    getErrorConfig(category) {
        return this.errorConfigs[category] || this.errorConfigs['data_error'];
    }
    
    /**
     * 토스트 표시 시간 결정
     */
    getToastDelay(severity) {
        const delays = {
            'low': 3000,
            'medium': 5000,
            'high': 8000,
            'critical': 10000
        };
        return delays[severity] || 5000;
    }
    
    /**
     * 액션 버튼이 필요한지 확인
     */
    shouldShowActions(errorInfo) {
        return errorInfo.category === 'network' || 
               errorInfo.category === 'server_error' ||
               errorInfo.severity === 'critical';
    }
    
    /**
     * 액션 버튼 생성
     */
    generateActionButtons(errorInfo) {
        return `
            <div class="toast-actions mt-2">
                <button class="btn btn-sm btn-outline-light me-2" 
                        onclick="ErrorDisplay.retryAction('${errorInfo.endpoint || ''}')">
                    <i class="fas fa-redo me-1"></i>다시 시도
                </button>
                <button class="btn btn-sm btn-outline-light" 
                        onclick="ErrorDisplay.showErrorDetails('${errorInfo.id || ''}')">
                    <i class="fas fa-info-circle me-1"></i>상세정보
                </button>
            </div>
        `;
    }
    
    /**
     * 모달 액션 버튼 생성
     */
    generateModalActions(errorInfo) {
        let actions = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                확인
            </button>
        `;
        
        if (this.shouldShowActions(errorInfo)) {
            actions = `
                <button type="button" class="btn btn-primary" 
                        onclick="ErrorDisplay.retryAction('${errorInfo.endpoint || ''}')">
                    <i class="fas fa-redo me-1"></i>다시 시도
                </button>
                <button type="button" class="btn btn-info" 
                        onclick="ErrorDisplay.reportError('${errorInfo.id || ''}')">
                    <i class="fas fa-bug me-1"></i>오류 신고
                </button>
            ` + actions;
        }
        
        return actions;
    }
    
    /**
     * 재시도 액션
     */
    retryAction(endpoint) {
        if (endpoint && window.APIClient) {
            console.log(`🔄 Retrying: ${endpoint}`);
            // 페이지 새로고침 또는 특정 API 재호출
            if (endpoint === 'reload') {
                window.location.reload();
            } else {
                // 캐시 클리어 후 재시도
                window.APIClient.clearCache();
                // 해당 엔드포인트 재호출 로직은 구체적인 상황에 따라 구현
            }
        }
    }
    
    /**
     * 에러 상세정보 표시
     */
    showErrorDetails(errorId) {
        if (window.APIClient) {
            const errorLog = window.APIClient.getErrorLog();
            const error = errorLog.find(e => e.id === errorId);
            if (error) {
                console.group('🔍 Error Details');
                console.log('Error ID:', error.id);
                console.log('Timestamp:', error.timestamp);
                console.log('Category:', error.category);
                console.log('Severity:', error.severity);
                console.log('Message:', error.message);
                console.groupEnd();
            }
        }
    }
    
    /**
     * 에러 신고
     */
    reportError(errorId) {
        // 실제 환경에서는 에러 리포팅 시스템으로 전송
        console.log(`📧 Reporting error: ${errorId}`);
        this.showToast({
            category: 'validation',
            message: '오류가 신고되었습니다. 빠른 시일 내에 해결하겠습니다.',
            severity: 'low'
        });
    }
    
    /**
     * 에러 통계 업데이트
     */
    updateErrorStats(errorInfo) {
        const stats = JSON.parse(localStorage.getItem('error_display_stats') || '{}');
        
        const today = new Date().toDateString();
        if (!stats[today]) {
            stats[today] = {};
        }
        
        const category = errorInfo.category || 'unknown';
        stats[today][category] = (stats[today][category] || 0) + 1;
        
        // 최근 7일 데이터만 유지
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        
        Object.keys(stats).forEach(date => {
            if (new Date(date) < cutoffDate) {
                delete stats[date];
            }
        });
        
        localStorage.setItem('error_display_stats', JSON.stringify(stats));
    }
    
    /**
     * 에러 통계 조회
     */
    getErrorStats() {
        return JSON.parse(localStorage.getItem('error_display_stats') || '{}');
    }
    
    /**
     * 모든 에러 표시 제거
     */
    clearAllErrors() {
        // 토스트 제거
        const toasts = this.toastContainer.querySelectorAll('.toast');
        toasts.forEach(toast => {
            const bsToast = bootstrap.Toast.getInstance(toast);
            if (bsToast) bsToast.hide();
        });
        
        // 모달 제거
        const modal = document.getElementById('error-modal');
        if (modal) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) bsModal.hide();
        }
        
        // 배너 제거
        const banner = document.getElementById('error-banner');
        if (banner) {
            banner.remove();
            document.body.style.paddingTop = '';
        }
        
        // 인라인 에러 제거
        const inlineErrors = document.querySelectorAll('.inline-error');
        inlineErrors.forEach(error => error.remove());
    }
}

// 전역 인스턴스 생성
window.ErrorDisplay = new ErrorDisplaySystem();

// Bootstrap 5가 로드되지 않은 경우 대체 구현
if (typeof bootstrap === 'undefined') {
    window.bootstrap = {
        Toast: function(element, options) {
            return {
                show: () => {
                    element.style.display = 'block';
                    element.classList.add('show');
                    setTimeout(() => {
                        element.style.display = 'none';
                        element.classList.remove('show');
                        element.dispatchEvent(new Event('hidden.bs.toast'));
                    }, options?.delay || 5000);
                }
            };
        },
        Modal: function(element) {
            return {
                show: () => {
                    element.style.display = 'block';
                    element.classList.add('show');
                },
                hide: () => {
                    element.style.display = 'none';
                    element.classList.remove('show');
                    element.dispatchEvent(new Event('hidden.bs.modal'));
                }
            };
        }
    };
}

console.log('✅ Error Display System initialized');