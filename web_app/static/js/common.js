/**
 * Common JavaScript functions for FCA Dashboard
 * ============================================
 * 
 * 공통 기능 및 유틸리티
 * - 모듈화된 Utils로 업그레이드 지원
 * - 레거시 브라우저 호환성 유지
 */

// 모듈 지원 체크
const isModuleSupportedUtils = 'noModule' in HTMLScriptElement.prototype;

// 모듈화된 Utils 로딩
if (isModuleSupportedUtils) {
    import('./modules/utils.js').then(module => {
        const { utils } = module;
        window.Utils = utils;
        console.log('✅ Modular utilities loaded');
    }).catch(error => {
        console.warn('⚠️ Failed to load modular utilities, falling back to legacy:', error);
        window.Utils = LegacyUtils;
    });
} else {
    window.Utils = LegacyUtils;
}

// Legacy utility functions
const LegacyUtils = {
    // Show loading spinner
    showLoading() {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.style.display = 'flex';
        }
    },

    // Hide loading spinner
    hideLoading() {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.style.display = 'none';
        }
    },

    // Format numbers
    formatNumber(num, decimals = 3) {
        if (typeof num !== 'number') return '-';
        return num.toFixed(decimals);
    },

    // Format percentage
    formatPercent(num, decimals = 1) {
        if (typeof num !== 'number') return '-';
        return (num * 100).toFixed(decimals) + '%';
    },

    // Show error message
    showError(message, containerId = null) {
        const errorHtml = `
            <div class="error-state text-center p-4">
                <i class="fas fa-exclamation-triangle text-warning fa-3x mb-3"></i>
                <h5>Error</h5>
                <p class="text-muted">${message}</p>
                <button class="btn btn-outline-primary btn-sm" onclick="location.reload()">
                    <i class="fas fa-redo me-1"></i>새로고침
                </button>
            </div>
        `;
        
        if (containerId) {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = errorHtml;
            }
        } else {
            console.error('Error:', message);
            // Enhanced error display 사용
            if (window.ErrorDisplay) {
                window.ErrorDisplay.showError({
                    category: 'client_error',
                    message: message,
                    severity: 'medium'
                });
            }
        }
    },

    // Get performance class based on score
    getPerformanceClass(score) {
        if (score >= 0.9) return 'text-success';
        if (score >= 0.8) return 'text-info';
        if (score >= 0.7) return 'text-warning';
        return 'text-danger';
    },

    // Enhanced number formatting
    formatNumber(num, decimals = 3) {
        if (typeof num !== 'number') return '-';
        if (decimals === 0) return Math.round(num).toLocaleString();
        return num.toFixed(decimals);
    },

    // Show loading in specific container
    showLoadingInContainer(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="text-center p-4">
                    <div class="spinner-border text-primary mb-3" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <h6>Loading chart...</h6>
                    <small class="text-muted">Please wait while we fetch the data</small>
                </div>
            `;
        }
    },

    // Show success message
    showSuccess(message, containerId = null) {
        const successHtml = `
            <div class="success-state">
                <i class="fas fa-check-circle text-success"></i>
                <h5>Success</h5>
                <p>${message}</p>
            </div>
        `;
        
        if (containerId) {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = successHtml;
            }
        }
    },

    // Update current time
    updateTime() {
        const timeElement = document.getElementById('current-time');
        if (timeElement) {
            const now = new Date();
            const timeString = now.toLocaleString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            timeElement.textContent = timeString;
        }
    },

    // Get performance class based on score
    getPerformanceClass(score) {
        if (score >= 0.9) return 'excellent';
        if (score >= 0.8) return 'good';
        if (score >= 0.7) return 'fair';
        return 'poor';
    },

    // Animate number counter
    animateCounter(element, start, end, duration = 1000) {
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
};

// API client
const APIClient = {
    baseURL: '/api',

    // Generic fetch wrapper
    async fetch(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    },

    // Get summary data
    async getSummary() {
        return this.fetch('/summary');
    },

    // Get domain results
    async getDomainResults(domain) {
        return this.fetch(`/results/${domain}`);
    },

    // Get charts
    async getChart(chartType) {
        return this.fetch(`/chart/${chartType}`);
    },

    // Get model comparison
    async getModelComparison() {
        return this.fetch('/models/compare');
    },

    // Get available images
    async getImages() {
        return this.fetch('/images');
    },

    // Health check
    async healthCheck() {
        return this.fetch('/health');
    }
};

// Chart utilities
const ChartUtils = {
    // Default plotly configuration
    defaultConfig: {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
        displaylogo: false,
        toImageButtonOptions: {
            format: 'png',
            filename: 'fca_chart',
            height: 500,
            width: 800,
            scale: 1
        }
    },

    // Default layout
    defaultLayout: {
        font: {
            family: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
            size: 12
        },
        margin: {
            l: 50,
            r: 50,
            t: 50,
            b: 50
        },
        plot_bgcolor: 'rgba(0,0,0,0)',
        paper_bgcolor: 'rgba(0,0,0,0)'
    },

    // Render chart
    async renderChart(containerId, chartData) {
        try {
            const container = document.getElementById(containerId);
            if (!container) {
                throw new Error(`Container ${containerId} not found`);
            }

            const plotData = JSON.parse(chartData);
            
            // Merge with default layout
            if (plotData.layout) {
                plotData.layout = { ...this.defaultLayout, ...plotData.layout };
            }

            await Plotly.newPlot(containerId, plotData.data, plotData.layout, this.defaultConfig);
        } catch (error) {
            console.error(`Error rendering chart in ${containerId}:`, error);
            Utils.showError(`Failed to render chart: ${error.message}`, containerId);
        }
    },

    // Clear chart
    clearChart(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            Plotly.purge(containerId);
        }
    }
};

// Initialize common functionality
document.addEventListener('DOMContentLoaded', function() {
    // Update time immediately and then every second
    Utils.updateTime();
    setInterval(Utils.updateTime, 1000);

    // Add fade-in animation to main content
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.classList.add('fade-in');
    }

    // Add loading shimmer to cards while data loads
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.classList.add('hover-lift');
    });

    // Add smooth transitions to navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Add active state animation
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    });

    // Initialize tooltips for better UX
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    if (window.bootstrap) {
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    }

    // Health check on page load with visual feedback
    const healthIndicator = document.getElementById('health-status');
    APIClient.healthCheck()
        .then(data => {
            console.log('✅ Health check:', data);
            if (healthIndicator) {
                healthIndicator.className = 'status-online';
                healthIndicator.title = 'System healthy';
            }
            if (!data.all_available) {
                console.warn('⚠️ Some data sources are not available:', data.data_sources);
            }
        })
        .catch(error => {
            console.error('❌ Health check failed:', error);
            if (healthIndicator) {
                healthIndicator.className = 'status-error';
                healthIndicator.title = 'System error';
            }
        });

    // Add progressive enhancement for charts
    const chartContainers = document.querySelectorAll('[id$="-chart"]');
    chartContainers.forEach(container => {
        container.classList.add('chart-container');
        
        // Add loading state
        if (!container.innerHTML.trim()) {
            container.innerHTML = `
                <div class="d-flex justify-content-center align-items-center" style="height: 300px;">
                    <div class="loading-spin">
                        <i class="fas fa-spinner fa-2x text-primary"></i>
                    </div>
                </div>
            `;
        }
    });
});

// Export utilities for use in other scripts (레거시 지원)
if (!window.Utils) {
    window.Utils = LegacyUtils;
}
if (!window.APIClient) {
    window.APIClient = APIClient;
}
if (!window.ChartUtils) {
    window.ChartUtils = ChartUtils;
}