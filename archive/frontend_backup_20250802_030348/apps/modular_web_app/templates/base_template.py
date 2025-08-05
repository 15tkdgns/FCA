"""
HTML 템플릿 모듈
===============

FCA 웹 애플리케이션의 모든 HTML 템플릿을 관리합니다.
- 기본 레이아웃 템플릿
- 페이지별 템플릿
- CSS 스타일 정의
"""


class TemplateManager:
    """HTML 템플릿 관리 클래스"""
    
    def __init__(self):
        """TemplateManager 초기화"""
        self.base_styles = self._get_base_styles()
        self.base_scripts = self._get_base_scripts()
    
    def _get_base_styles(self):
        """기본 CSS 스타일 정의"""
        return """
        body { 
            background-color: #f8fafc; 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            color: #1e293b;
            line-height: 1.6;
            margin: 0;
        }
        
        /* 사이드바 스타일 */
        .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            width: 280px;
            background: #ffffff;
            border-right: 1px solid #e2e8f0;
            box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
            z-index: 1000;
            transition: transform 0.3s ease;
        }
        
        .sidebar-header {
            padding: 24px 20px;
            border-bottom: 1px solid #e2e8f0;
            background: #3b82f6;
            color: white;
        }
        
        .sidebar-brand {
            font-size: 20px;
            font-weight: 700;
            color: white;
            text-decoration: none;
        }
        
        .sidebar-nav {
            padding: 20px 0;
        }
        
        .nav-item {
            margin: 4px 16px;
        }
        
        .nav-link {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            color: #64748b;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 500;
            transition: all 0.2s ease;
            font-size: 14px;
        }
        
        .nav-link:hover {
            background-color: #f1f5f9;
            color: #3b82f6;
            text-decoration: none;
        }
        
        .nav-link.active {
            background-color: #3b82f6;
            color: white;
        }
        
        .nav-link i {
            width: 20px;
            margin-right: 12px;
            font-size: 16px;
        }
        
        /* 메인 컨텐츠 */
        .main-content {
            margin-left: 280px;
            min-height: 100vh;
            padding: 24px;
        }
        
        .page-header {
            background: white;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        
        .page-title {
            font-size: 28px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
        }
        
        .page-title i {
            margin-right: 16px;
            color: #3b82f6;
        }
        
        .page-subtitle {
            color: #64748b;
            font-size: 16px;
            margin: 0;
        }
        
        .card {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            transition: all 0.2s ease;
            margin-bottom: 20px;
            background-color: #ffffff;
            overflow: hidden;
        }
        .card:hover { 
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transform: translateY(-1px);
        }
        
        .card-header {
            background-color: #ffffff;
            color: #1e293b;
            border-bottom: 1px solid #e2e8f0;
            border-radius: 0;
            font-weight: 600;
            font-size: 16px;
            padding: 20px 24px;
            display: flex;
            align-items: center;
        }
        .card-header i {
            margin-right: 8px;
            color: #3b82f6;
        }
        
        .metric-card {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: #ffffff;
            text-align: center;
            padding: 32px 24px;
            border: none;
            position: relative;
            overflow: hidden;
        }
        
        .metric-value {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 8px;
            color: #ffffff;
            position: relative;
            z-index: 1;
        }
        
        .metric-label {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.9);
            font-weight: 500;
            position: relative;
            z-index: 1;
        }
        
        .status-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 8px;
            position: relative;
        }
        .status-indicator::after {
            content: '';
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        
        .status-active { background-color: #10b981; }
        .status-active::after { background-color: #10b981; }
        .status-warning { background-color: #f59e0b; }
        .status-warning::after { background-color: #f59e0b; }
        .status-error { background-color: #ef4444; }
        .status-error::after { background-color: #ef4444; }
        
        @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.5); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
        }
        
        .chart-container {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        
        .table {
            font-size: 14px;
            margin-bottom: 0;
        }
        .table th {
            font-weight: 700;
            color: #1e293b;
            border-top: none;
            border-bottom: 2px solid #e2e8f0;
            padding: 16px 20px;
            background-color: #f8fafc;
        }
        .table td {
            border-top: 1px solid #e2e8f0;
            padding: 16px 20px;
            vertical-align: middle;
        }
        
        .badge {
            font-size: 12px;
            font-weight: 600;
            padding: 6px 12px;
            border-radius: 20px;
            letter-spacing: 0.5px;
        }
        
        .progress {
            height: 8px;
            background-color: #e2e8f0;
            border-radius: 20px;
            overflow: hidden;
        }
        .progress-bar {
            border-radius: 20px;
            transition: width 0.6s ease;
        }
        
        /* 모바일 반응형 */
        .mobile-toggle {
            display: none;
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 1001;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 12px;
            font-size: 18px;
        }
        
        @media (max-width: 768px) {
            .sidebar {
                transform: translateX(-100%);
            }
            .sidebar.show {
                transform: translateX(0);
            }
            .main-content {
                margin-left: 0;
                padding: 80px 16px 16px;
            }
            .mobile-toggle {
                display: block;
            }
            .metric-value { font-size: 2rem; }
            .page-title { font-size: 24px; }
        }
        
        .data-status {
            display: inline-flex;
            align-items: center;
            font-size: 12px;
            padding: 4px 8px;
            border-radius: 12px;
            font-weight: 600;
        }
        .data-loaded {
            background: #dcfce7;
            color: #166534;
        }
        .data-sample {
            background: #fef3c7;
            color: #92400e;
        }
        """
    
    def _get_base_scripts(self):
        """기본 JavaScript 코드 정의"""
        return """
        // 사이드바 토글
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('show');
        }
        
        // 모바일에서 메인 컨텐츠 클릭 시 사이드바 닫기
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                const sidebar = document.getElementById('sidebar');
                const toggle = document.querySelector('.mobile-toggle');
                
                if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
                    sidebar.classList.remove('show');
                }
            }
        });
        
        // 차트 로딩 함수
        function loadChart(endpoint, containerId) {
            fetch(endpoint)
                .then(response => response.json())
                .then(data => {
                    Plotly.newPlot(containerId, data.data, data.layout, {responsive: true});
                })
                .catch(error => {
                    console.error('Chart loading error:', error);
                    document.getElementById(containerId).innerHTML = '<p class="text-center text-muted">Chart loading failed</p>';
                });
        }
        """
    
    def get_base_template(self):
        """기본 HTML 템플릿 반환"""
        return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FCA Analysis Dashboard - {{{{ page_title }}}}</title>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Font Awesome -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <!-- Plotly.js -->
    <script src="https://cdn.plot.ly/plotly-2.25.2.min.js"></script>
    
    <style>
        {self.base_styles}
    </style>
</head>
<body>
    <!-- 모바일 토글 버튼 -->
    <button class="mobile-toggle" onclick="toggleSidebar()">
        <i class="fas fa-bars"></i>
    </button>

    <!-- 사이드바 -->
    <div class="sidebar" id="sidebar">
        <div class="sidebar-header">
            <a href="/" class="sidebar-brand">
                <i class="fas fa-chart-line me-2"></i>FCA Dashboard
            </a>
        </div>
        
        <nav class="sidebar-nav">
            <div class="nav-item">
                <a href="/" class="nav-link {{{{ 'active' if current_page == 'dashboard' else '' }}}}">
                    <i class="fas fa-tachometer-alt"></i>
                    Overview
                </a>
            </div>
            <div class="nav-item">
                <a href="/fraud" class="nav-link {{{{ 'active' if current_page == 'fraud' else '' }}}}">
                    <i class="fas fa-shield-alt"></i>
                    Fraud Detection
                </a>
            </div>
            <div class="nav-item">
                <a href="/sentiment" class="nav-link {{{{ 'active' if current_page == 'sentiment' else '' }}}}">
                    <i class="fas fa-comments"></i>
                    Sentiment
                </a>
            </div>
            <div class="nav-item">
                <a href="/attrition" class="nav-link {{{{ 'active' if current_page == 'attrition' else '' }}}}">
                    <i class="fas fa-users"></i>
                    Attrition
                </a>
            </div>
            <div class="nav-item">
                <a href="/datasets" class="nav-link {{{{ 'active' if current_page == 'datasets' else '' }}}}">
                    <i class="fas fa-database"></i>
                    Datasets
                </a>
            </div>
            <div class="nav-item">
                <a href="/comparison" class="nav-link {{{{ 'active' if current_page == 'comparison' else '' }}}}">
                    <i class="fas fa-balance-scale"></i>
                    Comparison
                </a>
            </div>
        </nav>
    </div>

    <!-- 메인 컨텐츠 -->
    <div class="main-content">
        <div class="page-header">
            <h1 class="page-title">
                <i class="{{{{ page_icon }}}}"></i>
                {{{{ page_title }}}}
            </h1>
            <p class="page-subtitle">{{{{ page_description }}}}</p>
        </div>
        
        {{{{ content | safe }}}}
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    
    <script>
        {self.base_scripts}
        
        // 페이지별 스크립트
        {{{{ page_scripts | safe }}}}
    </script>
</body>
</html>
        """
    
    def get_dashboard_content(self):
        """대시보드 페이지 컨텐츠"""
        return """
        <!-- System Overview Metrics -->
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card metric-card">
                    <div class="metric-value">{{ summary.total_datasets }}</div>
                    <div class="metric-label">Active Datasets</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card metric-card">
                    <div class="metric-value">99.2%</div>
                    <div class="metric-label">Average Accuracy</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card metric-card">
                    <div class="metric-value">{{ "{:,.0f}".format(summary.total_records) }}</div>
                    <div class="metric-label">Total Records</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card metric-card">
                    <div class="metric-value">3</div>
                    <div class="metric-label">Analysis Domains</div>
                </div>
            </div>
        </div>

        <!-- Domain Summary -->
        <div class="row">
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <i class="fas fa-shield-alt"></i>
                        Fraud Detection
                        <span class="data-status {{ 'data-loaded' if fraud_data.data_loaded else 'data-sample' }} ms-2">
                            {{ 'Real Data' if fraud_data.data_loaded else 'Sample Data' }}
                        </span>
                    </div>
                    <div class="card-body">
                        <div class="row text-center">
                            <div class="col-6 mb-3">
                                <div class="h4 text-primary">{{ "{:,.0f}".format(fraud_data.total_transactions) }}</div>
                                <small class="text-muted">Total Transactions</small>
                            </div>
                            <div class="col-6 mb-3">
                                <div class="h4 text-danger">{{ fraud_data.fraud_transactions }}</div>
                                <small class="text-muted">Fraud Cases</small>
                            </div>
                            <div class="col-12">
                                <div class="h4 text-success">{{ "%.2f" | format(fraud_data.accuracy) }}%</div>
                                <small class="text-muted">Model Accuracy</small>
                            </div>
                        </div>
                        <a href="/fraud" class="btn btn-primary btn-sm mt-2">View Details</a>
                    </div>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <i class="fas fa-comments"></i>
                        Sentiment Analysis
                        <span class="data-status {{ 'data-loaded' if sentiment_data.data_loaded else 'data-sample' }} ms-2">
                            {{ 'Real Data' if sentiment_data.data_loaded else 'Sample Data' }}
                        </span>
                    </div>
                    <div class="card-body">
                        <div class="row text-center">
                            <div class="col-4 mb-3">
                                <div class="h5 text-success">{{ sentiment_data.positive }}</div>
                                <small class="text-muted">Positive</small>
                            </div>
                            <div class="col-4 mb-3">
                                <div class="h5 text-secondary">{{ sentiment_data.neutral }}</div>
                                <small class="text-muted">Neutral</small>
                            </div>
                            <div class="col-4 mb-3">
                                <div class="h5 text-danger">{{ sentiment_data.negative }}</div>
                                <small class="text-muted">Negative</small>
                            </div>
                            <div class="col-12">
                                <div class="h4 text-success">{{ sentiment_data.accuracy }}%</div>
                                <small class="text-muted">Classification Accuracy</small>
                            </div>
                        </div>
                        <a href="/sentiment" class="btn btn-primary btn-sm mt-2">View Details</a>
                    </div>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <i class="fas fa-users"></i>
                        Customer Attrition
                        <span class="data-status {{ 'data-loaded' if attrition_data.data_loaded else 'data-sample' }} ms-2">
                            {{ 'Real Data' if attrition_data.data_loaded else 'Sample Data' }}
                        </span>
                    </div>
                    <div class="card-body">
                        <div class="row text-center">
                            <div class="col-6 mb-3">
                                <div class="h4 text-info">{{ "{:,.0f}".format(attrition_data.total_customers) }}</div>
                                <small class="text-muted">Total Customers</small>
                            </div>
                            <div class="col-6 mb-3">
                                <div class="h4 text-warning">{{ "{:,.0f}".format(attrition_data.churned_customers) }}</div>
                                <small class="text-muted">Churned Customers</small>
                            </div>
                            <div class="col-12">
                                <div class="h4 text-success">{{ "%.1f" | format(attrition_data.accuracy) }}%</div>
                                <small class="text-muted">Prediction Accuracy</small>
                            </div>
                        </div>
                        <a href="/attrition" class="btn btn-primary btn-sm mt-2">View Details</a>
                    </div>
                </div>
            </div>
        </div>

        <!-- System Status -->
        <div class="row mt-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <i class="fas fa-server"></i>
                        System Status
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-4">
                                <div class="d-flex align-items-center mb-3">
                                    <span class="status-indicator status-active"></span>
                                    <strong>Web Server:</strong> <span class="ms-2 text-success">Running</span>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="d-flex align-items-center mb-3">
                                    <span class="status-indicator status-active"></span>
                                    <strong>Data Loader:</strong> <span class="ms-2 text-success">Active</span>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="d-flex align-items-center mb-3">
                                    <span class="status-indicator status-active"></span>
                                    <strong>ML Engine:</strong> <span class="ms-2 text-success">Ready</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        """
    
    def get_fraud_content(self):
        """사기 탐지 페이지 컨텐츠"""
        return """
        <!-- Fraud Detection Metrics -->
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card metric-card">
                    <div class="metric-value">{{ "{:,.0f}".format(fraud_data.total_transactions) }}</div>
                    <div class="metric-label">Total Transactions</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card metric-card">
                    <div class="metric-value">{{ fraud_data.fraud_transactions }}</div>
                    <div class="metric-label">Fraud Cases</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card metric-card">
                    <div class="metric-value">{{ "%.3f" | format(fraud_data.fraud_rate) }}%</div>
                    <div class="metric-label">Fraud Rate</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card metric-card">
                    <div class="metric-value">{{ "%.2f" | format(fraud_data.accuracy) }}%</div>
                    <div class="metric-label">Model Accuracy</div>
                </div>
            </div>
        </div>

        <div class="row">
            <!-- Transaction Distribution Chart -->
            <div class="col-md-8">
                <div class="chart-container">
                    <div id="fraud-distribution-chart"></div>
                </div>
            </div>
            
            <!-- Performance Metrics -->
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <i class="fas fa-chart-bar"></i>
                        Model Performance Metrics
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-1">
                                <span>Accuracy</span>
                                <span class="text-primary">{{ "%.2f" | format(fraud_data.accuracy) }}%</span>
                            </div>
                            <div class="progress">
                                <div class="progress-bar bg-primary" style="width: {{ fraud_data.accuracy }}%"></div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-1">
                                <span>Precision</span>
                                <span class="text-success">{{ "%.1f" | format(fraud_data.precision) }}%</span>
                            </div>
                            <div class="progress">
                                <div class="progress-bar bg-success" style="width: {{ fraud_data.precision }}%"></div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-1">
                                <span>Recall</span>
                                <span class="text-warning">{{ "%.1f" | format(fraud_data.recall) }}%</span>
                            </div>
                            <div class="progress">
                                <div class="progress-bar bg-warning" style="width: {{ fraud_data.recall }}%"></div>
                            </div>
                        </div>
                        <div class="mb-0">
                            <div class="d-flex justify-content-between mb-1">
                                <span>F1-Score</span>
                                <span class="text-info">{{ "%.1f" | format(fraud_data.f1_score) }}%</span>
                            </div>
                            <div class="progress">
                                <div class="progress-bar bg-info" style="width: {{ fraud_data.f1_score }}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Performance Comparison Chart -->
        <div class="row mt-4">
            <div class="col-12">
                <div class="chart-container">
                    <div id="fraud-performance-chart"></div>
                </div>
            </div>
        </div>
        """
    
    def get_fraud_scripts(self):
        """사기 탐지 페이지 스크립트"""
        return """
        document.addEventListener('DOMContentLoaded', function() {
            loadChart('/api/chart/fraud-distribution', 'fraud-distribution-chart');
            loadChart('/api/chart/fraud-performance', 'fraud-performance-chart');
        });
        """


# 전역 템플릿 매니저 인스턴스
template_manager = TemplateManager()


# 편의 함수들
def get_base_template():
    """기본 템플릿 반환 (편의 함수)"""
    return template_manager.get_base_template()


def get_dashboard_content():
    """대시보드 컨텐츠 반환 (편의 함수)"""
    return template_manager.get_dashboard_content()


def get_fraud_content():
    """사기 탐지 컨텐츠 반환 (편의 함수)"""
    return template_manager.get_fraud_content()


def get_fraud_scripts():
    """사기 탐지 스크립트 반환 (편의 함수)"""
    return template_manager.get_fraud_scripts()