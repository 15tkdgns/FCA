#!/usr/bin/env python3
"""
Base Chart Module
================

차트 생성을 위한 기본 클래스와 공통 기능을 제공합니다.
"""

import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import json
from typing import Dict, Any, Optional, List
import logging
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class BaseChart(ABC):
    """모든 차트 클래스의 기본 클래스"""
    
    def __init__(self):
        self.color_palette = {
            'primary': '#2563eb',
            'secondary': '#64748b', 
            'success': '#059669',
            'danger': '#dc2626',
            'warning': '#d97706',
            'accent': '#0f172a',
            'surface': '#ffffff',
            'background': '#f8fafc'
        }
        
        self.default_layout = {
            'font': {'family': 'Inter, sans-serif', 'size': 12},
            'paper_bgcolor': 'rgba(0,0,0,0)',
            'plot_bgcolor': 'rgba(0,0,0,0)',
            'margin': dict(l=50, r=50, t=80, b=50),
            'showlegend': True,
            'legend': dict(
                orientation="h",
                yanchor="bottom",
                y=1.02,
                xanchor="right",
                x=1
            )
        }
    
    @abstractmethod
    def generate(self, data: Any, **kwargs) -> str:
        """차트 생성 메서드 - 하위 클래스에서 구현"""
        pass
    
    def _apply_theme(self, fig: go.Figure, theme: str = 'light') -> go.Figure:
        """차트에 테마 적용"""
        if theme == 'dark':
            fig.update_layout(
                paper_bgcolor='#1f2937',
                plot_bgcolor='#1f2937',
                font_color='white'
            )
        else:
            fig.update_layout(self.default_layout)
        
        return fig
    
    def _format_hover_data(self, fig: go.Figure) -> go.Figure:
        """호버 데이터 포맷팅"""
        fig.update_traces(
            hovertemplate="<b>%{x}</b><br>" +
                         "Value: %{y:.3f}<br>" +
                         "<extra></extra>"
        )
        return fig
    
    def _add_grid(self, fig: go.Figure, show_grid: bool = True) -> go.Figure:
        """그리드 추가"""
        if show_grid:
            fig.update_xaxes(showgrid=True, gridwidth=1, gridcolor='rgba(0,0,0,0.1)')
            fig.update_yaxes(showgrid=True, gridwidth=1, gridcolor='rgba(0,0,0,0.1)')
        else:
            fig.update_xaxes(showgrid=False)
            fig.update_yaxes(showgrid=False)
        
        return fig
    
    def _add_annotations(self, fig: go.Figure, annotations: List[Dict]) -> go.Figure:
        """주석 추가"""
        for annotation in annotations:
            fig.add_annotation(
                x=annotation.get('x', 0),
                y=annotation.get('y', 0),
                text=annotation.get('text', ''),
                showarrow=annotation.get('showarrow', True),
                arrowhead=annotation.get('arrowhead', 2),
                arrowsize=annotation.get('arrowsize', 1),
                arrowwidth=annotation.get('arrowwidth', 2),
                arrowcolor=annotation.get('arrowcolor', self.color_palette['primary'])
            )
        
        return fig
    
    def _export_config(self) -> Dict[str, Any]:
        """차트 내보내기 설정"""
        return {
            'toImageButtonOptions': {
                'format': 'png',
                'filename': 'chart',
                'height': 600,
                'width': 1000,
                'scale': 2
            },
            'displayModeBar': True,
            'modeBarButtonsToRemove': ['pan2d', 'lasso2d', 'select2d'],
            'displaylogo': False
        }
    
    def to_json(self, fig: go.Figure) -> str:
        """차트를 JSON으로 변환"""
        try:
            return fig.to_json()
        except Exception as e:
            logger.error(f"Error converting chart to JSON: {e}")
            return json.dumps({"error": "Failed to generate chart"})
    
    def to_html(self, fig: go.Figure, include_plotlyjs: str = 'cdn', 
               div_id: Optional[str] = None) -> str:
        """차트를 HTML로 변환"""
        try:
            return fig.to_html(
                include_plotlyjs=include_plotlyjs,
                div_id=div_id,
                config=self._export_config()
            )
        except Exception as e:
            logger.error(f"Error converting chart to HTML: {e}")
            return f"<div>Error generating chart: {e}</div>"
    
    def validate_data(self, data: pd.DataFrame, required_columns: List[str]) -> bool:
        """데이터 유효성 검사"""
        if data is None or data.empty:
            logger.warning("Data is None or empty")
            return False
        
        missing_columns = [col for col in required_columns if col not in data.columns]
        if missing_columns:
            logger.warning(f"Missing required columns: {missing_columns}")
            return False
        
        return True
    
    def get_color_scale(self, color_type: str = 'sequential') -> List[str]:
        """색상 스케일 반환"""
        color_scales = {
            'sequential': ['#f0f9ff', '#0369a1', '#1e40af'],
            'diverging': ['#dc2626', '#ffffff', '#059669'],
            'categorical': ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed'],
            'performance': ['#dc2626', '#d97706', '#059669']
        }
        
        return color_scales.get(color_type, color_scales['sequential'])
    
    def format_number(self, value: float, format_type: str = 'decimal') -> str:
        """숫자 포맷팅"""
        if format_type == 'percentage':
            return f"{value:.1%}"
        elif format_type == 'currency':
            return f"${value:,.2f}"
        elif format_type == 'integer':
            return f"{int(value):,}"
        else:  # decimal
            return f"{value:.3f}"


class ChartFactory:
    """차트 팩토리 클래스"""
    
    def __init__(self):
        self._chart_types = {}
    
    def register_chart(self, chart_type: str, chart_class):
        """차트 타입 등록"""
        self._chart_types[chart_type] = chart_class
    
    def create_chart(self, chart_type: str) -> BaseChart:
        """차트 인스턴스 생성"""
        chart_class = self._chart_types.get(chart_type)
        if not chart_class:
            raise ValueError(f"Unknown chart type: {chart_type}")
        
        return chart_class()
    
    def get_available_types(self) -> List[str]:
        """사용 가능한 차트 타입 반환"""
        return list(self._chart_types.keys())


# 글로벌 차트 팩토리 인스턴스
chart_factory = ChartFactory()