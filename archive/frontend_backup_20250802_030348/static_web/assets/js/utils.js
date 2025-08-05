/**
 * Utility Functions for Static Web
 * ===============================
 */

class Utils {
    static showLoading(loadingId = 'loading') {
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) {
            loadingEl.style.display = 'block';
        }
    }

    static hideLoading(loadingId = 'loading', contentId = 'page-content') {
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }

        const contentEl = document.getElementById(contentId);
        if (contentEl) {
            contentEl.style.display = 'block';
        }
    }

    static showError(message, containerId = 'error-container') {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    ${message}
                </div>
            `;
            container.style.display = 'block';
        } else {
            console.error('Error:', message);
        }
    }

    static formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    static formatPercentage(num) {
        return `${(num * 100).toFixed(1)}%`;
    }

    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 전역 사용을 위해 window에 추가
window.Utils = Utils;

console.log('✅ Utils loaded');