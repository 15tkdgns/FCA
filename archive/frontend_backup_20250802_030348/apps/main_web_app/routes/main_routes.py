"""
Main Routes Module
==================
Web application routes for the FCA Dashboard
"""

from flask import render_template
from datetime import datetime

def register_main_routes(app, sample_data):
    """Register all main page routes"""
    
    @app.route('/')
    def index():
        """통합 대시보드 메인 페이지"""
        return render_template('unified_dashboard.html', 
                             stats=sample_data['stats'], 
                             datasets=sample_data['datasets'][:3])

    @app.route('/dashboard')
    def dashboard():
        """기본 대시보드 페이지"""
        return render_template('index.html', 
                             stats=sample_data['stats'], 
                             datasets=sample_data['datasets'][:3])

    @app.route('/dashboard/enhanced')
    def enhanced_dashboard():
        """고급 대시보드 페이지"""
        return render_template('enhanced_dashboard.html', 
                             stats=sample_data['stats'], 
                             datasets=sample_data['datasets'][:3])

    @app.route('/dashboard/simple')
    def simple_dashboard():
        """간단한 대시보드 페이지"""
        return render_template('simple_dashboard.html')

    @app.route('/datasets')
    def datasets():
        """데이터셋 관리 페이지"""
        return render_template('datasets.html', datasets=sample_data['datasets'])

    @app.route('/detection')
    def detection():
        """사기 탐지 페이지"""
        return render_template('fraud.html')

    @app.route('/analytics')
    def analytics():
        """분석 페이지"""
        return render_template('visualizations.html')

    @app.route('/sentiment')
    def sentiment():
        """감정 분석 페이지"""
        return render_template('sentiment.html')

    @app.route('/visualizations')
    def visualizations():
        """시각화 페이지"""
        return render_template('visualizations.html')

    @app.route('/xai')
    def xai():
        """설명 가능한 AI 페이지"""
        return render_template('xai.html')

    @app.route('/transparency')
    def transparency():
        """투명성 대시보드 페이지"""
        return render_template('transparency.html')

    @app.route('/comparison')
    def comparison():
        """모델 비교 페이지"""
        return render_template('comparison.html')

    @app.route('/attrition')
    def attrition():
        """고객 이탈 예측 페이지"""
        return render_template('attrition.html')