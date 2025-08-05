/**
 * Navigation Controller for Static Web
 * ===================================
 */

class NavigationController {
    constructor() {
        this.currentPage = 'dashboard';
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupPageTitleUpdater();
        console.log('✅ Navigation controller initialized');
    }

    setupNavigation() {
        // 네비게이션 링크에 이벤트 리스너 추가
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const pageId = link.getAttribute('data-page');
                if (pageId) {
                    this.navigateTo(pageId);
                }
            });
        });
    }

    setupPageTitleUpdater() {
        // 페이지 제목과 아이콘 업데이트 매핑
        this.pageTitleMap = {
            'dashboard': {
                title: 'Overview',
                subtitle: 'View overall system status and key metrics for FCA analysis',
                icon: 'fas fa-tachometer-alt'
            },
            'fraud': {
                title: 'Fraud Detection Analysis',
                subtitle: 'Credit card fraud transaction detection and analysis results',
                icon: 'fas fa-shield-alt'
            },
            'sentiment': {
                title: 'Sentiment Analysis',
                subtitle: 'Financial news text sentiment classification and analysis results',
                icon: 'fas fa-comments'
            },
            'attrition': {
                title: 'Customer Attrition Analysis',
                subtitle: 'Bank customer churn pattern analysis and prediction results',
                icon: 'fas fa-users'
            },
            'datasets': {
                title: 'Dataset Management',
                subtitle: 'Manage status and metadata for all datasets',
                icon: 'fas fa-database'
            },
            'comparison': {
                title: 'Model Performance Comparison',
                subtitle: 'Compare machine learning model performance across domains',
                icon: 'fas fa-balance-scale'
            },
            'xai': {
                title: 'XAI Explainability',
                subtitle: 'Explainable AI analysis with SHAP, LIME, and feature importance',
                icon: 'fas fa-brain'
            },
            'validation': {
                title: 'Model Validation & Bias Detection',
                subtitle: 'Comprehensive model validation, overfitting detection, and bias analysis',
                icon: 'fas fa-shield-check'
            }
        };
    }

    navigateTo(pageId) {
        if (pageId === this.currentPage) return;

        // 모든 페이지 숨기기
        document.querySelectorAll('.page-content').forEach(page => {
            page.style.display = 'none';
        });

        // 선택된 페이지 표시
        const targetPage = document.getElementById(`${pageId}-page`);
        if (targetPage) {
            targetPage.style.display = 'block';
        }

        // 네비게이션 상태 업데이트
        this.updateNavigation(pageId);
        
        // 페이지 헤더 업데이트
        this.updatePageHeader(pageId);

        // 현재 페이지 업데이트
        this.currentPage = pageId;

        // 페이지별 초기화
        this.initializePage(pageId);

        console.log(`📄 Navigated to: ${pageId}`);
    }

    updateNavigation(pageId) {
        // 모든 네비게이션 링크에서 active 클래스 제거
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // 선택된 링크에 active 클래스 추가
        const activeLink = document.querySelector(`[data-page="${pageId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    updatePageHeader(pageId) {
        const pageInfo = this.pageTitleMap[pageId];
        if (!pageInfo) return;

        // 페이지 제목 업데이트
        const titleEl = document.getElementById('page-title-text');
        if (titleEl) {
            titleEl.textContent = pageInfo.title;
        }

        // 페이지 부제목 업데이트
        const subtitleEl = document.getElementById('page-subtitle');
        if (subtitleEl) {
            subtitleEl.textContent = pageInfo.subtitle;
        }

        // 페이지 아이콘 업데이트
        const iconEl = document.getElementById('page-icon');
        if (iconEl) {
            iconEl.className = pageInfo.icon;
        }
    }

    async initializePage(pageId) {
        // 대시보드가 있다면 페이지별 초기화 호출
        if (window.dashboard && typeof window.dashboard.initializePage === 'function') {
            await window.dashboard.initializePage(pageId);
        }
    }

    getCurrentPage() {
        return this.currentPage;
    }
}

// 전역 네비게이션 컨트롤러
window.NavigationController = NavigationController;

// DOM 로드 후 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.navigation = new NavigationController();
});

// 사이드바 토글 함수 (모바일)
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('show');
    }
}

// 테마 토글 함수
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    
    if (body.classList.contains('dark-theme')) {
        body.classList.remove('dark-theme');
        themeIcon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.add('dark-theme');
        themeIcon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'dark');
    }
}

// 저장된 테마 복원
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            themeIcon.className = 'fas fa-sun';
        }
    }
});

console.log('✅ Navigation script loaded');