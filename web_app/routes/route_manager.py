#!/usr/bin/env python3
"""
Route Manager
============

FCA 웹 애플리케이션의 모든 라우트 관리 및 등록
- 페이지 라우트 (HTML 템플릿 렌더링)
- API 라우트 (JSON 응답)
- 에러 핸들러 설정
- 미들웨어 및 로깅 통합
"""

from flask import Flask, render_template, jsonify, request
from datetime import datetime
from typing import Dict, Any

from core.logging_manager import get_logger, log_api_calls
from core.module_loader import ModuleLoader
from .handlers.page_handlers import PageHandlers
from .handlers.api_handlers import APIHandlers

logger = get_logger("RouteManager")


class RouteManager:
    """
    라우트 등록 및 관리 클래스
    
    주요 기능:
    - Flask 앱에 모든 라우트 등록
    - 페이지와 API 핸들러 통합
    - 에러 처리 및 로깅 설정
    - 라우트별 권한 및 미들웨어 적용
    """
    
    def __init__(self, app: Flask, module_loader: ModuleLoader):
        """
        RouteManager 초기화
        
        Args:
            app: Flask 애플리케이션 인스턴스
            module_loader: 동적 모듈 로더
        """
        self.app = app                                              # Flask 앱 인스턴스
        self.module_loader = module_loader                          # 모듈 로더 (차트 생성 등)
        self.page_handlers = PageHandlers(module_loader)            # 페이지 렌더링 핸들러
        self.api_handlers = APIHandlers(module_loader)              # API 응답 핸들러
    
    def setup_routes(self):
        """
        모든 라우트 설정 메인 함수
        페이지 라우트 → API 라우트 → 에러 핸들러 순으로 등록
        """
        self._setup_page_routes()       # HTML 페이지 라우트 등록
        self._setup_api_routes()        # JSON API 라우트 등록
        self._setup_error_handlers()    # 404, 500 등 에러 핸들러 등록
        logger.info("✅ All routes configured")
    
    def _setup_page_routes(self):
        """
        HTML 페이지 라우트 설정
        각 분석 도메인별 페이지와 메인 대시보드 페이지 등록
        """
        
        @self.app.route('/')
        @log_api_calls()
        def index():
            """메인 대시보드 페이지 - 전체 프로젝트 요약과 주요 메트릭 표시"""
            return self.page_handlers.dashboard_page()
        
        @self.app.route('/fraud')
        @log_api_calls()
        def fraud_analysis():
            """사기 탐지 분석 페이지 - 실제 사기 데이터 통계 및 차트"""
            return self.page_handlers.fraud_page()
        
        @self.app.route('/sentiment')
        @log_api_calls()
        def sentiment_analysis():
            """감정 분석 페이지 - 금융 뉴스 감정 분류 결과"""
            return self.page_handlers.sentiment_page()
        
        @self.app.route('/attrition')
        @log_api_calls()
        def attrition_analysis():
            """고객 이탈 분석 페이지 - 은행 고객 이탈 예측"""
            return self.page_handlers.attrition_page()
        
        @self.app.route('/datasets')
        @log_api_calls()
        def datasets_page():
            """데이터셋 관리 페이지 - 모든 데이터셋 현황과 메타데이터"""
            return self.page_handlers.datasets_page()
        
        @self.app.route('/comparison')
        @log_api_calls()
        def comparison_page():
            """모델 비교 페이지 - 도메인별 모델 성능 비교"""
            return self.page_handlers.comparison_page()
        
        @self.app.route('/visualizations')
        @log_api_calls()
        def visualizations_page():
            """고급 시각화 페이지 - 3D 차트 및 대화형 시각화"""
            return self.page_handlers.visualizations_page()
        
        @self.app.route('/xai')
        @log_api_calls()
        def xai_page():
            """설명 가능한 AI 페이지 - 모델 해석 및 피처 중요도"""
            return self.page_handlers.xai_page()
        
        logger.info("📄 Page routes configured")
    
    def _setup_api_routes(self):
        """API 라우트 설정"""
        
        @self.app.route('/api/health')
        @log_api_calls()
        def api_health():
            """시스템 상태 체크"""
            return self.api_handlers.health_check()
        
        @self.app.route('/api/summary')
        @log_api_calls()
        def api_summary():
            """프로젝트 요약"""
            return self.api_handlers.project_summary()
        
        @self.app.route('/api/results/<domain>')
        @log_api_calls()
        def api_results(domain):
            """도메인별 결과"""
            return self.api_handlers.domain_results(domain)
        
        @self.app.route('/api/chart/<chart_type>')
        @log_api_calls()
        def api_chart(chart_type):
            """차트 데이터"""
            return self.api_handlers.chart_data(chart_type)
        
        @self.app.route('/api/models/compare')
        @log_api_calls()
        def api_models_compare():
            """모델 비교"""
            return self.api_handlers.model_comparison()
        
        @self.app.route('/api/models/train', methods=['POST'])
        @log_api_calls()
        def api_models_train():
            """모델 훈련"""
            return self.api_handlers.train_model()
        
        @self.app.route('/api/models/predict', methods=['POST'])
        @log_api_calls()
        def api_models_predict():
            """모델 예측"""
            return self.api_handlers.predict_model()
        
        @self.app.route('/api/images')
        @log_api_calls()
        def api_images():
            """이미지 목록"""
            return self.api_handlers.image_list()
        
        @self.app.route('/api/system/status')
        @log_api_calls()
        def api_system_status():
            """시스템 상태"""
            return self.api_handlers.system_status()
        
        @self.app.route('/api/system/modules')
        @log_api_calls()
        def api_system_modules():
            """로드된 모듈 목록"""
            return self.api_handlers.module_status()
        
        @self.app.route('/api/fraud/statistics')
        @log_api_calls()
        def api_fraud_statistics():
            """사기 탐지 통계"""
            return self.api_handlers.fraud_statistics()
        
        @self.app.route('/api/sentiment/data')
        @log_api_calls()
        def api_sentiment_data():
            """감정 분석 데이터"""
            return self.api_handlers.sentiment_data()
        
        @self.app.route('/api/attrition/data')
        @log_api_calls()
        def api_attrition_data():
            """고객 이탈 데이터"""
            return self.api_handlers.attrition_data()
        
        logger.info("🔌 API routes configured")
    
    def _setup_error_handlers(self):
        """에러 핸들러 설정"""
        
        @self.app.errorhandler(404)
        def not_found(error):
            """404 에러 처리"""
            logger.warning(f"404 error: {request.url}")
            return render_template('error.html', 
                                 error_code=404,
                                 error_message="Page not found"), 404
        
        @self.app.errorhandler(500)
        def internal_error(error):
            """500 에러 처리"""
            logger.error(f"500 error: {error}")
            return render_template('error.html',
                                 error_code=500,
                                 error_message="Internal server error"), 500
        
        @self.app.errorhandler(Exception)
        def handle_exception(e):
            """일반 예외 처리"""
            logger.error(f"Unhandled exception: {e}")
            return jsonify({
                'error': 'Internal server error',
                'message': str(e),
                'timestamp': datetime.now().isoformat()
            }), 500
        
        logger.info("❌ Error handlers configured")