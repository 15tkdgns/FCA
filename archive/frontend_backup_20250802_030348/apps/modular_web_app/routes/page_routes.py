"""
페이지 라우트 모듈
================

FCA 웹 애플리케이션의 모든 페이지 라우트를 관리합니다.
- 대시보드, 사기 탐지, 감정 분석, 고객 이탈, 데이터셋, 모델 비교 페이지
- 템플릿 렌더링 및 데이터 전달
"""

from flask import render_template_string
from ..data import load_fraud_data, load_sentiment_data, load_attrition_data, get_datasets_info, get_summary_stats
from ..templates import get_base_template, get_dashboard_content, get_fraud_content, get_fraud_scripts


class PageRoutes:
    """페이지 라우트 관리 클래스"""
    
    def __init__(self):
        """PageRoutes 초기화"""
        self.base_template = get_base_template()
    
    def dashboard_page(self):
        """대시보드 메인 페이지"""
        fraud_data = load_fraud_data()
        sentiment_data = load_sentiment_data()
        attrition_data = load_attrition_data()
        summary = get_summary_stats()
        
        content = get_dashboard_content()
        
        return render_template_string(
            self.base_template,
            page_title="Dashboard",
            page_description="View overall system status and key metrics for FCA analysis",
            page_icon="fas fa-tachometer-alt",
            current_page="dashboard",
            content=content,
            page_scripts="",
            summary=summary,
            fraud_data=fraud_data,
            sentiment_data=sentiment_data,
            attrition_data=attrition_data
        )
    
    def fraud_page(self):
        """사기 탐지 분석 페이지"""
        fraud_data = load_fraud_data()
        content = get_fraud_content()
        scripts = get_fraud_scripts()
        
        return render_template_string(
            self.base_template,
            page_title="Fraud Detection Analysis",
            page_description="Credit card fraud transaction detection and analysis results",
            page_icon="fas fa-shield-alt",
            current_page="fraud",
            content=content,
            page_scripts=scripts,
            fraud_data=fraud_data
        )
    
    def sentiment_page(self):
        """감정 분석 페이지"""
        sentiment_data = load_sentiment_data()
        
        content = """
        <!-- Sentiment Analysis Metrics -->
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card metric-card">
                    <div class="metric-value">{{ "{:,.0f}".format(sentiment_data.total_sentences) }}</div>
                    <div class="metric-label">Total Sentences</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card metric-card">
                    <div class="metric-value">{{ sentiment_data.positive }}</div>
                    <div class="metric-label">Positive Sentiment</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card metric-card">
                    <div class="metric-value">{{ sentiment_data.negative }}</div>
                    <div class="metric-label">Negative Sentiment</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card metric-card">
                    <div class="metric-value">{{ sentiment_data.accuracy }}%</div>
                    <div class="metric-label">Classification Accuracy</div>
                </div>
            </div>
        </div>

        <div class="row">
            <!-- Sentiment Distribution Chart -->
            <div class="col-md-8">
                <div class="chart-container">
                    <div id="sentiment-chart"></div>
                </div>
            </div>
            
            <!-- Sentiment Statistics -->
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <i class="fas fa-chart-pie"></i>
                        Sentiment Analysis Statistics
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-1">
                                <span class="text-success">Positive</span>
                                <span>{{ sentiment_data.positive }} ({{ "%.1f" | format(sentiment_data.positive / sentiment_data.total_sentences * 100) }}%)</span>
                            </div>
                            <div class="progress">
                                <div class="progress-bar bg-success" style="width: {{ sentiment_data.positive / sentiment_data.total_sentences * 100 }}%"></div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-1">
                                <span class="text-secondary">Neutral</span>
                                <span>{{ sentiment_data.neutral }} ({{ "%.1f" | format(sentiment_data.neutral / sentiment_data.total_sentences * 100) }}%)</span>
                            </div>
                            <div class="progress">
                                <div class="progress-bar bg-secondary" style="width: {{ sentiment_data.neutral / sentiment_data.total_sentences * 100 }}%"></div>
                            </div>
                        </div>
                        <div class="mb-0">
                            <div class="d-flex justify-content-between mb-1">
                                <span class="text-danger">Negative</span>
                                <span>{{ sentiment_data.negative }} ({{ "%.1f" | format(sentiment_data.negative / sentiment_data.total_sentences * 100) }}%)</span>
                            </div>
                            <div class="progress">
                                <div class="progress-bar bg-danger" style="width: {{ sentiment_data.negative / sentiment_data.total_sentences * 100 }}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        """
        
        scripts = """
        document.addEventListener('DOMContentLoaded', function() {
            loadChart('/api/chart/sentiment', 'sentiment-chart');
        });
        """
        
        return render_template_string(
            self.base_template,
            page_title="Sentiment Analysis",
            page_description="Financial news text sentiment classification and analysis results",
            page_icon="fas fa-comments",
            current_page="sentiment",
            content=content,
            page_scripts=scripts,
            sentiment_data=sentiment_data
        )
    
    def attrition_page(self):
        """고객 이탈 분석 페이지"""
        attrition_data = load_attrition_data()
        
        content = """
        <!-- Customer Attrition Metrics -->
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card metric-card">
                    <div class="metric-value">{{ "{:,.0f}".format(attrition_data.total_customers) }}</div>
                    <div class="metric-label">Total Customers</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card metric-card">
                    <div class="metric-value">{{ "{:,.0f}".format(attrition_data.churned_customers) }}</div>
                    <div class="metric-label">Churned Customers</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card metric-card">
                    <div class="metric-value">{{ "%.1f" | format(attrition_data.churn_rate) }}%</div>
                    <div class="metric-label">Churn Rate</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card metric-card">
                    <div class="metric-value">{{ "%.1f" | format(attrition_data.accuracy) }}%</div>
                    <div class="metric-label">Prediction Accuracy</div>
                </div>
            </div>
        </div>

        <div class="row">
            <!-- Churn Rate by Age Group Chart -->
            <div class="col-md-8">
                <div class="chart-container">
                    <div id="attrition-chart"></div>
                </div>
            </div>
            
            <!-- Attrition Analysis Summary -->
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <i class="fas fa-user-times"></i>
                        Attrition Analysis Summary
                    </div>
                    <div class="card-body">
                        <div class="text-center mb-4">
                            <div class="h2 text-warning">{{ "%.1f" | format(attrition_data.churn_rate) }}%</div>
                            <p class="text-muted mb-0">Overall Churn Rate</p>
                        </div>
                        <hr>
                        <div class="row text-center">
                            <div class="col-6 mb-3">
                                <div class="h5 text-primary">{{ "%.1f" | format(attrition_data.accuracy) }}%</div>
                                <small class="text-muted">Prediction Accuracy</small>
                            </div>
                            <div class="col-6 mb-3">
                                <div class="h5 text-success">{{ "%.3f" | format(attrition_data.auc_score) }}</div>
                                <small class="text-muted">AUC Score</small>
                            </div>
                        </div>
                        <hr>
                        <div class="small text-muted">
                            <p><strong>Key Churn Factors:</strong></p>
                            <ul class="mb-0">
                                <li>Service Dissatisfaction</li>
                                <li>Price Competitiveness</li>
                                <li>Decreased Usage Frequency</li>
                                <li>Competitor Migration</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        """
        
        scripts = """
        document.addEventListener('DOMContentLoaded', function() {
            loadChart('/api/chart/attrition', 'attrition-chart');
        });
        """
        
        return render_template_string(
            self.base_template,
            page_title="Customer Attrition Analysis",
            page_description="Bank customer churn pattern analysis and prediction results",
            page_icon="fas fa-users",
            current_page="attrition",
            content=content,
            page_scripts=scripts,
            attrition_data=attrition_data
        )
    
    def datasets_page(self):
        """데이터셋 관리 페이지"""
        datasets = get_datasets_info()
        
        content = """
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card metric-card">
                    <div class="metric-value">{{ datasets|length }}</div>
                    <div class="metric-label">Total Datasets</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card metric-card">
                    <div class="metric-value">{{ "{:,.0f}".format(datasets|sum(attribute='records')) }}</div>
                    <div class="metric-label">Total Records</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card metric-card">
                    <div class="metric-value">{{ datasets|selectattr('data_loaded')|list|length }}</div>
                    <div class="metric-label">Real Data</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card metric-card">
                    <div class="metric-value">{{ datasets|selectattr('status', 'equalto', 'Active')|list|length }}</div>
                    <div class="metric-label">Active Status</div>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <i class="fas fa-database"></i>
Dataset List
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Dataset</th>
                                <th>Type</th>
                                <th>Records</th>
                                <th>Size</th>
                                <th>Accuracy</th>
                                <th>Data Status</th>
                                <th>Status</th>
                                <th>Last Updated</th>
                            </tr>
                        </thead>
                        <tbody>
                            {% for dataset in datasets %}
                            <tr class="dataset-row">
                                <td>
                                    <strong>{{ dataset.name }}</strong>
                                </td>
                                <td>
                                    <span class="badge bg-secondary">{{ dataset.type }}</span>
                                </td>
                                <td>{{ "{:,}".format(dataset.records) }}</td>
                                <td>{{ dataset.size }}</td>
                                <td>
                                    <span class="text-success">{{ "%.1f" | format(dataset.accuracy) }}%</span>
                                </td>
                                <td>
                                    <span class="data-status {{ 'data-loaded' if dataset.data_loaded else 'data-sample' }}">
                                        {{ 'Real Data' if dataset.data_loaded else 'Sample Data' }}
                                    </span>
                                </td>
                                <td>
                                    <span class="status-indicator status-active"></span>
                                    {{ dataset.status }}
                                </td>
                                <td>{{ dataset.last_updated }}</td>
                            </tr>
                            {% endfor %}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        """
        
        return render_template_string(
            self.base_template,
            page_title="Dataset Management",
            page_description="Manage status and metadata for all datasets",
            page_icon="fas fa-database",
            current_page="datasets",
            content=content,
            page_scripts="",
            datasets=datasets
        )
    
    def comparison_page(self):
        """모델 성능 비교 페이지"""
        content = """
        <div class="row mb-4">
            <div class="col-12">
                <div class="chart-container">
                    <div id="comparison-chart"></div>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <i class="fas fa-shield-alt"></i>
                        Fraud Detection Performance
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span>Random Forest</span>
                                <span class="text-primary">99.91%</span>
                            </div>
                            <div class="progress">
                                <div class="progress-bar bg-primary" style="width: 99.91%"></div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span>XGBoost</span>
                                <span class="text-success">99.89%</span>
                            </div>
                            <div class="progress">
                                <div class="progress-bar bg-success" style="width: 99.89%"></div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span>Neural Network</span>
                                <span class="text-info">99.85%</span>
                            </div>
                            <div class="progress">
                                <div class="progress-bar bg-info" style="width: 99.85%"></div>
                            </div>
                        </div>
                        <div class="mb-0">
                            <div class="d-flex justify-content-between">
                                <span>Logistic Regression</span>
                                <span class="text-warning">99.12%</span>
                            </div>
                            <div class="progress">
                                <div class="progress-bar bg-warning" style="width: 99.12%"></div>
                            </div>
                        </div>
                        <div class="mt-3 text-center">
                            <small class="text-muted">Best Performance: <strong>Random Forest</strong></small>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <i class="fas fa-comments"></i>
                        Sentiment Analysis Performance
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span>Neural Network</span>
                                <span class="text-primary">88.7%</span>
                            </div>
                            <div class="progress">
                                <div class="progress-bar bg-primary" style="width: 88.7%"></div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span>Random Forest</span>
                                <span class="text-success">87.3%</span>
                            </div>
                            <div class="progress">
                                <div class="progress-bar bg-success" style="width: 87.3%"></div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span>XGBoost</span>
                                <span class="text-info">85.9%</span>
                            </div>
                            <div class="progress">
                                <div class="progress-bar bg-info" style="width: 85.9%"></div>
                            </div>
                        </div>
                        <div class="mb-0">
                            <div class="d-flex justify-content-between">
                                <span>Logistic Regression</span>
                                <span class="text-warning">82.1%</span>
                            </div>
                            <div class="progress">
                                <div class="progress-bar bg-warning" style="width: 82.1%"></div>
                            </div>
                        </div>
                        <div class="mt-3 text-center">
                            <small class="text-muted">Best Performance: <strong>Neural Network</strong></small>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <i class="fas fa-users"></i>
                        Customer Attrition Performance
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span>XGBoost</span>
                                <span class="text-primary">91.2%</span>
                            </div>
                            <div class="progress">
                                <div class="progress-bar bg-primary" style="width: 91.2%"></div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span>Neural Network</span>
                                <span class="text-success">90.1%</span>
                            </div>
                            <div class="progress">
                                <div class="progress-bar bg-success" style="width: 90.1%"></div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span>Random Forest</span>
                                <span class="text-info">89.4%</span>
                            </div>
                            <div class="progress">
                                <div class="progress-bar bg-info" style="width: 89.4%"></div>
                            </div>
                        </div>
                        <div class="mb-0">
                            <div class="d-flex justify-content-between">
                                <span>Logistic Regression</span>
                                <span class="text-warning">85.7%</span>
                            </div>
                            <div class="progress">
                                <div class="progress-bar bg-warning" style="width: 85.7%"></div>
                            </div>
                        </div>
                        <div class="mt-3 text-center">
                            <small class="text-muted">Best Performance: <strong>XGBoost</strong></small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        """
        
        scripts = """
        document.addEventListener('DOMContentLoaded', function() {
            loadChart('/api/chart/comparison', 'comparison-chart');
        });
        """
        
        return render_template_string(
            self.base_template,
            page_title="Model Performance Comparison",
            page_description="Compare machine learning model performance across domains",
            page_icon="fas fa-balance-scale",
            current_page="comparison",
            content=content,
            page_scripts=scripts
        )


# 전역 페이지 라우트 인스턴스
page_routes = PageRoutes()


# 편의 함수들
def dashboard_page():
    """대시보드 페이지 (편의 함수)"""
    return page_routes.dashboard_page()


def fraud_page():
    """사기 탐지 페이지 (편의 함수)"""
    return page_routes.fraud_page()


def sentiment_page():
    """감정 분석 페이지 (편의 함수)"""
    return page_routes.sentiment_page()


def attrition_page():
    """고객 이탈 페이지 (편의 함수)"""
    return page_routes.attrition_page()


def datasets_page():
    """데이터셋 페이지 (편의 함수)"""
    return page_routes.datasets_page()


def comparison_page():
    """모델 비교 페이지 (편의 함수)"""
    return page_routes.comparison_page()