"""
템플릿 모듈 패키지
=================

FCA 웹 애플리케이션의 HTML 템플릿 관리 기능을 제공합니다.
"""

from .base_template import (
    TemplateManager,
    template_manager,
    get_base_template,
    get_dashboard_content,
    get_fraud_content,
    get_fraud_scripts
)

__all__ = [
    'TemplateManager',
    'template_manager',
    'get_base_template',
    'get_dashboard_content',
    'get_fraud_content', 
    'get_fraud_scripts'
]