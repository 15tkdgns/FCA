#!/usr/bin/env python3
"""
Page Handlers
============

페이지 렌더링을 담당하는 핸들러들
"""

from flask import render_template
from datetime import datetime
from typing import Dict, Any

from core.logging_manager import get_logger, log_calls
from core.module_loader import ModuleLoader

logger = get_logger("PageHandlers")


class PageHandlers:
    """페이지 핸들러 클래스"""
    
    def __init__(self, module_loader: ModuleLoader):
        self.module_loader = module_loader
    
    @log_calls()
    def dashboard_page(self):
        """메인 대시보드 페이지"""
        try:
            context = {
                'title': 'FCA Analysis Dashboard',
                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'system_status': self.module_loader.get_system_status()
            }
            return render_template('index.html', **context)
        except Exception as e:
            logger.error(f"Dashboard page error: {e}")
            return self._error_page("Dashboard loading failed")
    
    @log_calls()
    def fraud_page(self):
        """사기 탐지 분석 페이지"""
        try:
            context = {
                'title': 'Fraud Detection Analysis',
                'timestamp': datetime.now().isoformat(),
                'module_available': 'isolation_forest' in self.module_loader.module_registry._modules
            }
            return render_template('fraud.html', **context)
        except Exception as e:
            logger.error(f"Fraud page error: {e}")
            return self._error_page("Fraud analysis page loading failed")
    
    @log_calls()
    def sentiment_page(self):
        """감정 분석 페이지"""
        try:
            context = {
                'title': 'Sentiment Analysis',
                'timestamp': datetime.now().isoformat()
            }
            return render_template('sentiment.html', **context)
        except Exception as e:
            logger.error(f"Sentiment page error: {e}")
            return self._error_page("Sentiment analysis page loading failed")
    
    @log_calls()
    def attrition_page(self):
        """고객 이탈 분석 페이지"""
        try:
            context = {
                'title': 'Customer Attrition Analysis',
                'timestamp': datetime.now().isoformat()
            }
            return render_template('attrition.html', **context)
        except Exception as e:
            logger.error(f"Attrition page error: {e}")
            return self._error_page("Attrition analysis page loading failed")
    
    @log_calls()
    def datasets_page(self):
        """데이터셋 페이지"""
        try:
            context = {
                'title': 'Datasets Overview',
                'timestamp': datetime.now().isoformat()
            }
            return render_template('datasets.html', **context)
        except Exception as e:
            logger.error(f"Datasets page error: {e}")
            return self._error_page("Datasets page loading failed")
    
    @log_calls()
    def comparison_page(self):
        """모델 비교 페이지"""
        try:
            context = {
                'title': 'Model Comparison',
                'timestamp': datetime.now().isoformat(),
                'loaded_modules': self.module_loader.module_registry.get_loaded_modules()
            }
            return render_template('comparison.html', **context)
        except Exception as e:
            logger.error(f"Comparison page error: {e}")
            return self._error_page("Model comparison page loading failed")
    
    @log_calls()
    def visualizations_page(self):
        """시각화 페이지"""
        try:
            context = {
                'title': 'Data Visualizations',
                'timestamp': datetime.now().isoformat()
            }
            return render_template('visualizations.html', **context)
        except Exception as e:
            logger.error(f"Visualizations page error: {e}")
            return self._error_page("Visualizations page loading failed")
    
    @log_calls()
    def xai_page(self):
        """XAI 분석 페이지"""
        try:
            context = {
                'title': 'Explainable AI Analysis',
                'timestamp': datetime.now().isoformat()
            }
            return render_template('xai.html', **context)
        except Exception as e:
            logger.error(f"XAI page error: {e}")
            return self._error_page("XAI analysis page loading failed")
    
    @log_calls()
    def transparency_page(self):
        """시스템 투명성 페이지"""
        try:
            context = {
                'title': 'System Transparency',
                'timestamp': datetime.now().isoformat()
            }
            return render_template('transparency.html', **context)
        except Exception as e:
            logger.error(f"Transparency page error: {e}")
            return self._error_page("Transparency page loading failed")
    
    def _error_page(self, message: str):
        """에러 페이지 생성"""
        context = {
            'error_code': 500,
            'error_message': message,
            'timestamp': datetime.now().isoformat()
        }
        return render_template('error.html', **context)