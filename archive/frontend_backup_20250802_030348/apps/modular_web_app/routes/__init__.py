"""
라우트 모듈 패키지
=================

FCA 웹 애플리케이션의 페이지 라우트 관리 기능을 제공합니다.
"""

from .page_routes import (
    PageRoutes,
    page_routes,
    dashboard_page,
    fraud_page,
    sentiment_page,
    attrition_page,
    datasets_page,
    comparison_page
)

__all__ = [
    'PageRoutes',
    'page_routes',
    'dashboard_page',
    'fraud_page',
    'sentiment_page',
    'attrition_page',
    'datasets_page',
    'comparison_page'
]