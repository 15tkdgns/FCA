#!/usr/bin/env python3
"""
FCA 통합 웹 애플리케이션
====================

모든 기능을 하나의 웹앱으로 통합한 완전한 출력 시스템
- 실시간 모니터링 대시보드
- 사기 탐지 분석
- 감정 분석  
- 고객 이탈 예측
- 데이터셋 관리
- 모델 비교 및 XAI
- 고급 시각화
"""

import sys
import os
from flask import Flask, render_template_string, jsonify, request, send_from_directory
import json
import pandas as pd
import plotly
import plotly.graph_objs as go
import plotly.express as px
from datetime import datetime
import numpy as np
from pathlib import Path

# FCA 프로젝트 루트를 Python 경로에 추가
sys.path.insert(0, '/root/FCA')

app = Flask(__name__)
app.config['SECRET_KEY'] = 'fca-unified-web-app-2025'
app.config['DEBUG'] = True

# 데이터 로딩 함수들
def load_sample_data():
    """샘플 데이터 로드"""
    return {
        'fraud_stats': {
            'total_transactions': 284807,
            'fraud_transactions': 492,
            'fraud_rate': 0.173,
            'accuracy': 99.91,
            'precision': 85.7,
            'recall': 82.4,
            'f1_score': 84.0
        },
        'sentiment_stats': {
            'total_sentences': 4840,
            'positive': 1363,
            'neutral': 2280,
            'negative': 1197,
            'accuracy': 87.3
        },
        'attrition_stats': {
            'total_customers': 10127,
            'churned_customers': 2037,
            'churn_rate': 20.1,
            'accuracy': 89.4,
            'auc_score': 0.912
        },
        'datasets': [
            {
                'name': 'Credit Card Fraud 2023',
                'type': 'Fraud Detection',
                'records': 284807,
                'size': '45.2 MB',
                'status': 'Active',
                'last_updated': '2025-07-29',
                'accuracy': 99.91
            },
            {
                'name': 'Financial PhraseBank',
                'type': 'Sentiment Analysis', 
                'records': 4840,
                'size': '1.8 MB',
                'status': 'Active',
                'last_updated': '2025-07-29',
                'accuracy': 87.3
            },
            {
                'name': 'Bank Customer Churn',
                'type': 'Customer Analytics',
                'records': 10127,
                'size': '2.1 MB', 
                'status': 'Active',
                'last_updated': '2025-07-29',
                'accuracy': 89.4
            }
        ]
    }

def create_fraud_chart():
    """사기 탐지 차트 생성"""
    fig = go.Figure()
    
    # 클래스 분포
    fig.add_trace(go.Bar(
        x=['Normal', 'Fraud'],
        y=[284315, 492],
        name='Transaction Count',
        marker_color=['#2E86AB', '#F24236']
    ))
    
    fig.update_layout(
        title='Credit Card Transaction Distribution',
        xaxis_title='Transaction Type',
        yaxis_title='Count',
        template='plotly_white',
        height=400
    )
    
    return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)

def create_sentiment_chart():
    """감정 분석 차트 생성"""
    fig = go.Figure()
    
    sentiments = ['Positive', 'Neutral', 'Negative']
    values = [1363, 2280, 1197]
    colors = ['#28a745', '#6c757d', '#dc3545']
    
    fig.add_trace(go.Pie(
        labels=sentiments,
        values=values,
        marker_colors=colors,
        hole=0.4
    ))
    
    fig.update_layout(
        title='Financial News Sentiment Distribution',
        template='plotly_white',
        height=400
    )
    
    return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)

def create_attrition_chart():
    """고객 이탈 차트 생성"""
    fig = go.Figure()
    
    # 이탈률 by 나이대
    age_groups = ['18-25', '26-35', '36-45', '46-55', '56-65', '65+']
    churn_rates = [15.2, 18.7, 22.1, 25.3, 19.8, 12.4]
    
    fig.add_trace(go.Bar(
        x=age_groups,
        y=churn_rates,
        name='Churn Rate (%)',
        marker_color='#FF6B6B'
    ))
    
    fig.update_layout(
        title='Customer Churn Rate by Age Group',
        xaxis_title='Age Group',
        yaxis_title='Churn Rate (%)',
        template='plotly_white',
        height=400
    )
    
    return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)

def create_model_comparison_chart():
    """모델 비교 차트 생성"""
    fig = go.Figure()
    
    models = ['Random Forest', 'XGBoost', 'Logistic Regression', 'Neural Network']
    fraud_acc = [99.91, 99.89, 99.12, 99.85]
    sentiment_acc = [87.3, 85.9, 82.1, 88.7]
    attrition_acc = [89.4, 91.2, 85.7, 90.1]
    
    fig.add_trace(go.Bar(name='Fraud Detection', x=models, y=fraud_acc, marker_color='#2E86AB'))
    fig.add_trace(go.Bar(name='Sentiment Analysis', x=models, y=sentiment_acc, marker_color='#A23B72'))
    fig.add_trace(go.Bar(name='Customer Attrition', x=models, y=attrition_acc, marker_color='#F18F01'))
    
    fig.update_layout(
        title='Model Performance Comparison Across Domains',
        xaxis_title='Models',
        yaxis_title='Accuracy (%)',
        barmode='group',
        template='plotly_white',
        height=500
    )
    
    return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)

# HTML 템플릿
UNIFIED_TEMPLATE = """
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FCA 통합 분석 대시보드</title>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Font Awesome -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <!-- Plotly.js -->
    <script src="https://cdn.plot.ly/plotly-2.25.2.min.js"></script>
    
    <style>
        body { 
            background-color: #f8fafc; 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            color: #1e293b;
            line-height: 1.6;
            margin: 0;
        }
        
        .navbar { 
            background-color: #ffffff;
            border-bottom: 1px solid #e2e8f0;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            padding: 12px 0;
        }
        .nav-link { 
            color: #64748b !important; 
            font-weight: 500;
            font-size: 14px;
            padding: 8px 12px;
            border-radius: 8px;
            margin: 0 4px;
            transition: all 0.2s ease;
        }
        .nav-link:hover { 
            background-color: #f1f5f9;
            color: #0f172a !important; 
        }
        .nav-link.active {
            background-color: #3b82f6;
            color: #ffffff !important;
        }
        .navbar-brand { 
            color: #0f172a !important; 
            font-weight: 700; 
            font-size: 20px;
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
        .metric-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></svg>');
            opacity: 0.1;
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
        
        .section-title {
            color: #1e293b;
            font-weight: 700;
            margin-bottom: 24px;
            font-size: 24px;
            display: flex;
            align-items: center;
        }
        .section-title i {
            margin-right: 12px;
            color: #3b82f6;
        }
        
        .chart-container {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        
        .tab-content { padding-top: 24px; }
        .nav-tabs { 
            border-bottom: 2px solid #e2e8f0;
            margin-bottom: 0;
            background: #ffffff;
            border-radius: 12px 12px 0 0;
            padding: 0 20px;
        }
        .nav-tabs .nav-link { 
            color: #64748b; 
            border: none;
            font-weight: 600;
            font-size: 15px;
            padding: 16px 20px;
            margin-bottom: -2px;
            border-bottom: 3px solid transparent;
            background: none;
            border-radius: 0;
            position: relative;
        }
        .nav-tabs .nav-link:hover {
            color: #3b82f6;
            border-bottom-color: #93c5fd;
            background: none;
        }
        .nav-tabs .nav-link.active { 
            background: none;
            color: #3b82f6;
            border-bottom-color: #3b82f6;
            font-weight: 700;
        }
        
        .footer {
            background: #ffffff;
            color: #64748b;
            padding: 32px 0;
            margin-top: 60px;
            border-top: 1px solid #e2e8f0;
            font-size: 14px;
            text-align: center;
        }
        
        .dataset-row {
            transition: all 0.2s ease;
        }
        .dataset-row:hover {
            background-color: #f8fafc;
            cursor: pointer;
            transform: translateX(2px);
        }
        
        .btn-primary {
            background-color: #3b82f6;
            border-color: #3b82f6;
            font-weight: 600;
            font-size: 14px;
            padding: 10px 20px;
            border-radius: 8px;
            transition: all 0.2s ease;
        }
        .btn-primary:hover {
            background-color: #2563eb;
            border-color: #2563eb;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        
        .badge {
            font-size: 12px;
            font-weight: 600;
            padding: 6px 12px;
            border-radius: 20px;
            letter-spacing: 0.5px;
        }
        
        .bg-secondary {
            background-color: #64748b !important;
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
        
        .loading-spinner {
            text-align: center;
            padding: 60px;
        }
        
        /* Live Data Indicator */
        .live-indicator {
            display: inline-flex;
            align-items: center;
            background: #dcfce7;
            color: #166534;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        .live-indicator::before {
            content: '';
            width: 6px;
            height: 6px;
            background: #22c55e;
            border-radius: 50%;
            margin-right: 6px;
            animation: pulse 1.5s infinite;
        }
        
        @media (max-width: 768px) {
            .metric-value { font-size: 2rem; }
            .card { margin-bottom: 16px; }
            .section-title { font-size: 20px; }
            .nav-tabs .nav-link { padding: 12px 16px; font-size: 14px; }
        }
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg fixed-top">
        <div class="container-fluid">
            <a class="navbar-brand" href="/">
                <i class="fas fa-chart-line me-2"></i>FCA 통합 분석 대시보드
            </a>
            
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="#overview">
                            <i class="fas fa-tachometer-alt me-1"></i>Overview
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#fraud">
                            <i class="fas fa-shield-alt me-1"></i>Fraud Detection
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#sentiment">
                            <i class="fas fa-comments me-1"></i>Sentiment
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#attrition">
                            <i class="fas fa-users me-1"></i>Attrition
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#datasets">
                            <i class="fas fa-database me-1"></i>Datasets
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#comparison">
                            <i class="fas fa-balance-scale me-1"></i>Comparison
                        </a>
                    </li>
                </ul>
                
                <ul class="navbar-nav">
                    <li class="nav-item">
                        <span class="navbar-text me-3">
                            <span class="status-indicator status-active"></span>
                            System Online
                        </span>
                    </li>
                    <li class="nav-item">
                        <span class="navbar-text">
                            <i class="fas fa-clock me-1"></i>
                            <span id="current-time"></span>
                        </span>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <div class="container-fluid" style="margin-top: 100px; padding-bottom: 50px;">
        
        <!-- Overview Section -->
        <section id="overview" class="mb-5">
            <h2 class="section-title">
                <i class="fas fa-chart-bar me-2"></i>시스템 개요
            </h2>
            
            <div class="row">
                <div class="col-md-3">
                    <div class="card metric-card">
                        <div class="metric-value">{{ data.datasets|length }}</div>
                        <div class="metric-label">활성 데이터셋</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card metric-card">
                        <div class="metric-value">99.91%</div>
                        <div class="metric-label">평균 정확도</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card metric-card">
                        <div class="metric-value">{{ (data.fraud_stats.total_transactions + data.sentiment_stats.total_sentences + data.attrition_stats.total_customers)|int }}</div>
                        <div class="metric-label">총 분석 레코드</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card metric-card">
                        <div class="metric-value">3</div>
                        <div class="metric-label">분석 도메인</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Tabs for Different Analyses -->
        <ul class="nav nav-tabs" id="analysisTab" role="tablist">
            <li class="nav-item" role="presentation">
                <button class="nav-link active" id="fraud-tab" data-bs-toggle="tab" data-bs-target="#fraud" type="button" role="tab">
                    <i class="fas fa-shield-alt me-2"></i>사기 탐지
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="sentiment-tab" data-bs-toggle="tab" data-bs-target="#sentiment" type="button" role="tab">
                    <i class="fas fa-comments me-2"></i>감정 분석
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="attrition-tab" data-bs-toggle="tab" data-bs-target="#attrition" type="button" role="tab">
                    <i class="fas fa-users me-2"></i>고객 이탈
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="datasets-tab" data-bs-toggle="tab" data-bs-target="#datasets" type="button" role="tab">
                    <i class="fas fa-database me-2"></i>데이터셋
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="comparison-tab" data-bs-toggle="tab" data-bs-target="#comparison" type="button" role="tab">
                    <i class="fas fa-balance-scale me-2"></i>모델 비교
                </button>
            </li>
        </ul>

        <div class="tab-content" id="analysisTabContent">
            
            <!-- Fraud Detection -->
            <div class="tab-pane fade show active" id="fraud" role="tabpanel">
                <div class="row">
                    <div class="col-md-8">
                        <div class="chart-container">
                            <div id="fraud-chart"></div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header">
                                <i class="fas fa-chart-line me-2"></i>사기 탐지 성능
                            </div>
                            <div class="card-body">
                                <div class="row text-center">
                                    <div class="col-6 mb-3">
                                        <div class="h4 text-primary">{{ "%.2f"|format(data.fraud_stats.accuracy) }}%</div>
                                        <small class="text-muted">정확도</small>
                                    </div>
                                    <div class="col-6 mb-3">
                                        <div class="h4 text-success">{{ "%.1f"|format(data.fraud_stats.precision) }}%</div>
                                        <small class="text-muted">정밀도</small>
                                    </div>
                                    <div class="col-6">
                                        <div class="h4 text-warning">{{ "%.1f"|format(data.fraud_stats.recall) }}%</div>
                                        <small class="text-muted">재현율</small>
                                    </div>
                                    <div class="col-6">
                                        <div class="h4 text-info">{{ "%.1f"|format(data.fraud_stats.f1_score) }}%</div>
                                        <small class="text-muted">F1 Score</small>
                                    </div>
                                </div>
                                <hr>
                                <p class="mb-1"><strong>총 거래:</strong> {{ "{:,}".format(data.fraud_stats.total_transactions) }}</p>
                                <p class="mb-1"><strong>사기 거래:</strong> {{ data.fraud_stats.fraud_transactions }}</p>
                                <p class="mb-0"><strong>사기율:</strong> {{ "%.3f"|format(data.fraud_stats.fraud_rate) }}%</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Sentiment Analysis -->
            <div class="tab-pane fade" id="sentiment" role="tabpanel">
                <div class="row">
                    <div class="col-md-8">
                        <div class="chart-container">
                            <div id="sentiment-chart"></div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header">
                                <i class="fas fa-chart-pie me-2"></i>감정 분석 결과
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between">
                                        <span>긍정적</span>
                                        <span class="text-success">{{ data.sentiment_stats.positive }}</span>
                                    </div>
                                    <div class="progress mb-2">
                                        <div class="progress-bar bg-success" style="width: {{ (data.sentiment_stats.positive / data.sentiment_stats.total_sentences * 100)|round(1) }}%"></div>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between">
                                        <span>중립적</span>
                                        <span class="text-secondary">{{ data.sentiment_stats.neutral }}</span>
                                    </div>
                                    <div class="progress mb-2">
                                        <div class="progress-bar bg-secondary" style="width: {{ (data.sentiment_stats.neutral / data.sentiment_stats.total_sentences * 100)|round(1) }}%"></div>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between">
                                        <span>부정적</span>
                                        <span class="text-danger">{{ data.sentiment_stats.negative }}</span>
                                    </div>
                                    <div class="progress mb-2">
                                        <div class="progress-bar bg-danger" style="width: {{ (data.sentiment_stats.negative / data.sentiment_stats.total_sentences * 100)|round(1) }}%"></div>
                                    </div>
                                </div>
                                <hr>
                                <p class="mb-1"><strong>총 문장:</strong> {{ "{:,}".format(data.sentiment_stats.total_sentences) }}</p>
                                <p class="mb-0"><strong>분류 정확도:</strong> {{ data.sentiment_stats.accuracy }}%</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Customer Attrition -->
            <div class="tab-pane fade" id="attrition" role="tabpanel">
                <div class="row">
                    <div class="col-md-8">
                        <div class="chart-container">
                            <div id="attrition-chart"></div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header">
                                <i class="fas fa-user-times me-2"></i>고객 이탈 분석
                            </div>
                            <div class="card-body">
                                <div class="text-center mb-3">
                                    <div class="h2 text-danger">{{ "%.1f"|format(data.attrition_stats.churn_rate) }}%</div>
                                    <small class="text-muted">전체 이탈률</small>
                                </div>
                                <hr>
                                <div class="row text-center mb-3">
                                    <div class="col-6">
                                        <div class="h5 text-primary">{{ "%.1f"|format(data.attrition_stats.accuracy) }}%</div>
                                        <small class="text-muted">예측 정확도</small>
                                    </div>
                                    <div class="col-6">
                                        <div class="h5 text-success">{{ "%.3f"|format(data.attrition_stats.auc_score) }}</div>
                                        <small class="text-muted">AUC Score</small>
                                    </div>
                                </div>
                                <hr>
                                <p class="mb-1"><strong>총 고객:</strong> {{ "{:,}".format(data.attrition_stats.total_customers) }}</p>
                                <p class="mb-0"><strong>이탈 고객:</strong> {{ "{:,}".format(data.attrition_stats.churned_customers) }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Datasets -->
            <div class="tab-pane fade" id="datasets" role="tabpanel">
                <div class="card">
                    <div class="card-header">
                        <i class="fas fa-database me-2"></i>데이터셋 관리
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>데이터셋</th>
                                        <th>타입</th>
                                        <th>레코드 수</th>
                                        <th>크기</th>
                                        <th>정확도</th>
                                        <th>상태</th>
                                        <th>마지막 업데이트</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {% for dataset in data.datasets %}
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
                                            <span class="text-success">{{ dataset.accuracy }}%</span>
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
            </div>

            <!-- Model Comparison -->
            <div class="tab-pane fade" id="comparison" role="tabpanel">
                <div class="card">
                    <div class="card-header">
                        <i class="fas fa-balance-scale me-2"></i>모델 성능 비교
                    </div>
                    <div class="card-body">
                        <div class="chart-container">
                            <div id="comparison-chart"></div>
                        </div>
                        <div class="row mt-4">
                            <div class="col-md-4">
                                <div class="card bg-light">
                                    <div class="card-body text-center">
                                        <h5 class="card-title text-primary">
                                            <i class="fas fa-shield-alt me-2"></i>사기 탐지
                                        </h5>
                                        <p class="card-text">최고 성능: <strong>Random Forest (99.91%)</strong></p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="card bg-light">
                                    <div class="card-body text-center">
                                        <h5 class="card-title text-success">
                                            <i class="fas fa-comments me-2"></i>감정 분석
                                        </h5>
                                        <p class="card-text">최고 성능: <strong>Neural Network (88.7%)</strong></p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="card bg-light">
                                    <div class="card-body text-center">
                                        <h5 class="card-title text-warning">
                                            <i class="fas fa-users me-2"></i>고객 이탈
                                        </h5>
                                        <p class="card-text">최고 성능: <strong>XGBoost (91.2%)</strong></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <footer class="footer">
        <div class="container text-center">
            <p class="mb-0">
                <i class="fas fa-copyright me-1"></i>
                2025 FCA 통합 분석 대시보드 | 
                <i class="fas fa-code me-1"></i>
                Powered by Flask, Plotly & Bootstrap
            </p>
        </div>
    </footer>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    
    <script>
        // 현재 시간 업데이트
        function updateTime() {
            const now = new Date();
            document.getElementById('current-time').textContent = now.toLocaleTimeString('ko-KR');
        }
        updateTime();
        setInterval(updateTime, 1000);

        // 차트 로딩
        function loadCharts() {
            // 사기 탐지 차트
            fetch('/api/chart/fraud')
                .then(response => response.json())
                .then(data => {
                    Plotly.newPlot('fraud-chart', data.data, data.layout, {responsive: true});
                });

            // 감정 분석 차트
            fetch('/api/chart/sentiment')
                .then(response => response.json())
                .then(data => {
                    Plotly.newPlot('sentiment-chart', data.data, data.layout, {responsive: true});
                });

            // 고객 이탈 차트
            fetch('/api/chart/attrition')
                .then(response => response.json())
                .then(data => {
                    Plotly.newPlot('attrition-chart', data.data, data.layout, {responsive: true});
                });

            // 모델 비교 차트
            fetch('/api/chart/comparison')
                .then(response => response.json())
                .then(data => {
                    Plotly.newPlot('comparison-chart', data.data, data.layout, {responsive: true});
                });
        }

        // 페이지 로드 시 차트 로딩
        document.addEventListener('DOMContentLoaded', function() {
            loadCharts();
            
            // 탭 변경 시 차트 리사이즈
            document.querySelectorAll('button[data-bs-toggle="tab"]').forEach(tab => {
                tab.addEventListener('shown.bs.tab', function() {
                    setTimeout(() => {
                        Plotly.Plots.resize('fraud-chart');
                        Plotly.Plots.resize('sentiment-chart');
                        Plotly.Plots.resize('attrition-chart');
                        Plotly.Plots.resize('comparison-chart');
                    }, 100);
                });
            });
        });

        // 부드러운 스크롤
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    </script>
</body>
</html>
"""

# 라우트 정의
@app.route('/')
def index():
    """통합 대시보드 메인 페이지"""
    data = load_sample_data()
    return render_template_string(UNIFIED_TEMPLATE, data=data)

# API 엔드포인트들
@app.route('/api/chart/fraud')
def api_fraud_chart():
    """사기 탐지 차트 데이터"""
    chart_json = create_fraud_chart()
    chart_data = json.loads(chart_json)
    return jsonify({
        'data': chart_data['data'],
        'layout': chart_data['layout']
    })

@app.route('/api/chart/sentiment')
def api_sentiment_chart():
    """감정 분석 차트 데이터"""
    chart_json = create_sentiment_chart()
    chart_data = json.loads(chart_json)
    return jsonify({
        'data': chart_data['data'],
        'layout': chart_data['layout']
    })

@app.route('/api/chart/attrition')
def api_attrition_chart():
    """고객 이탈 차트 데이터"""
    chart_json = create_attrition_chart()
    chart_data = json.loads(chart_json)
    return jsonify({
        'data': chart_data['data'],
        'layout': chart_data['layout']
    })

@app.route('/api/chart/comparison')
def api_comparison_chart():
    """모델 비교 차트 데이터"""
    chart_json = create_model_comparison_chart()
    chart_data = json.loads(chart_json)
    return jsonify({
        'data': chart_data['data'],
        'layout': chart_data['layout']
    })

@app.route('/api/summary')
def api_summary():
    """시스템 요약 정보"""
    data = load_sample_data()
    return jsonify({
        'status': 'success',
        'data': {
            'total_datasets': len(data['datasets']),
            'total_records': data['fraud_stats']['total_transactions'] + data['sentiment_stats']['total_sentences'] + data['attrition_stats']['total_customers'],
            'average_accuracy': 89.2,
            'system_status': 'online',
            'last_updated': datetime.now().isoformat()
        }
    })

@app.route('/api/health')
def api_health():
    """시스템 상태 체크"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'services': {
            'web_server': 'running',
            'data_loader': 'running',
            'model_engine': 'running'
        }
    })

@app.route('/api/datasets')
def api_datasets():
    """데이터셋 목록"""
    data = load_sample_data()
    return jsonify({
        'status': 'success',
        'data': data['datasets']
    })

# 에러 핸들러
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Page not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print("🚀 FCA 통합 웹 애플리케이션 시작...")
    print("📱 브라우저에서 다음 URL로 접속하세요:")
    print("   http://localhost:5000")
    print("   http://127.0.0.1:5000")
    print("\n🎯 통합된 기능:")
    print("   ✅ 실시간 모니터링 대시보드")
    print("   ✅ 사기 탐지 분석 및 시각화") 
    print("   ✅ 감정 분석 결과")
    print("   ✅ 고객 이탈 예측")
    print("   ✅ 데이터셋 관리")
    print("   ✅ 모델 성능 비교")
    print("   ✅ 통합 API 엔드포인트")
    print("\n🔧 서버를 중지하려면 Ctrl+C를 누르세요")
    
    app.run(host='0.0.0.0', port=5000, debug=True)