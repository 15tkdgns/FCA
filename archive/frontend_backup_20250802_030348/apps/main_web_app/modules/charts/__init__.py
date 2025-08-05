"""
Chart Generation Modules
========================

차트 생성을 위한 모듈들
"""

from .base_chart import BaseChart, ChartFactory, chart_factory
from .performance_charts import (
    PerformanceOverviewChart,
    ModelComparisonChart,
    PerformanceDistributionChart,
    PerformanceRadarChart,
    PerformanceTrendChart
)

# 차트 팩토리에 차트 타입들 등록
chart_factory.register_chart('performance_overview', PerformanceOverviewChart)
chart_factory.register_chart('model_comparison', ModelComparisonChart)
chart_factory.register_chart('performance_distribution', PerformanceDistributionChart)
chart_factory.register_chart('performance_radar', PerformanceRadarChart)
chart_factory.register_chart('performance_trend', PerformanceTrendChart)

__all__ = [
    'BaseChart',
    'ChartFactory',
    'chart_factory',
    'PerformanceOverviewChart',
    'ModelComparisonChart', 
    'PerformanceDistributionChart',
    'PerformanceRadarChart',
    'PerformanceTrendChart'
]