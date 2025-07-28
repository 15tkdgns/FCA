#!/usr/bin/env python3
"""
Performance Charts Module
=========================

성능 관련 차트를 생성하는 모듈
"""

import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
from typing import Dict, Any, Optional
import logging

from .base_chart import BaseChart

logger = logging.getLogger(__name__)


class PerformanceOverviewChart(BaseChart):
    """성능 개요 차트"""
    
    def generate(self, fraud_df: pd.DataFrame, sentiment_df: pd.DataFrame, 
                attrition_df: pd.DataFrame, **kwargs) -> str:
        """성능 개요 차트 생성"""
        try:
            # 평균 성능 계산
            fraud_avg = fraud_df['AUC-ROC'].astype(float).mean()
            sentiment_avg = sentiment_df['Accuracy'].astype(float).mean()
            attrition_avg = attrition_df['AUC-ROC'].astype(float).mean()
            
            domains = ['Fraud Detection', 'Sentiment Analysis', 'Customer Attrition']
            values = [fraud_avg, sentiment_avg, attrition_avg]
            colors = [self.color_palette['danger'], self.color_palette['primary'], 
                     self.color_palette['warning']]
            
            fig = go.Figure(data=[
                go.Bar(
                    x=domains,
                    y=values,
                    marker_color=colors,
                    text=[f'{v:.1%}' for v in values],
                    textposition='auto',
                    hovertemplate="<b>%{x}</b><br>Performance: %{y:.1%}<extra></extra>"
                )
            ])
            
            fig.update_layout(
                title={
                    'text': "📊 Model Performance Overview",
                    'x': 0.5,
                    'font': {'size': 20, 'color': self.color_palette['accent']}
                },
                yaxis_title="Performance Score",
                yaxis=dict(tickformat='.0%', range=[0, 1]),
                **self.default_layout
            )
            
            fig = self._apply_theme(fig, kwargs.get('theme', 'light'))
            fig = self._add_grid(fig, kwargs.get('show_grid', True))
            
            return self.to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating performance overview chart: {e}")
            return self._error_chart("Performance Overview")


class ModelComparisonChart(BaseChart):
    """모델 비교 차트"""
    
    def generate(self, data: pd.DataFrame, **kwargs) -> str:
        """모델 비교 차트 생성"""
        try:
            if not self.validate_data(data, ['Model', 'AUC-ROC']):
                return self._error_chart("Model Comparison")
            
            # 성능 등급 매핑
            def get_grade(score):
                if score >= 0.95: return 'Excellent'
                elif score >= 0.8: return 'Good'
                elif score >= 0.7: return 'Fair'
                else: return 'Poor'
            
            data['Grade'] = data['AUC-ROC'].astype(float).apply(get_grade)
            
            # 색상 매핑
            color_map = {
                'Excellent': self.color_palette['success'],
                'Good': self.color_palette['primary'],
                'Fair': self.color_palette['warning'],
                'Poor': self.color_palette['danger']
            }
            
            fig = go.Figure(data=[
                go.Scatter(
                    x=data['Model'],
                    y=data['AUC-ROC'].astype(float),
                    mode='markers+lines',
                    marker=dict(
                        size=15,
                        color=[color_map[grade] for grade in data['Grade']],
                        line=dict(width=2, color='white')
                    ),
                    line=dict(width=3, color=self.color_palette['secondary']),
                    text=data['Grade'],
                    hovertemplate="<b>%{x}</b><br>" +
                                "AUC-ROC: %{y:.3f}<br>" +
                                "Grade: %{text}<extra></extra>"
                )
            ])
            
            # 성능 임계값 선 추가
            fig.add_hline(y=0.95, line_dash="dash", line_color=self.color_palette['success'],
                         annotation_text="Excellent (0.95+)")
            fig.add_hline(y=0.8, line_dash="dash", line_color=self.color_palette['warning'],
                         annotation_text="Good (0.8+)")
            
            fig.update_layout(
                title={
                    'text': "🎯 Model Performance Comparison",
                    'x': 0.5,
                    'font': {'size': 18}
                },
                yaxis_title="AUC-ROC Score",
                xaxis_title="Model",
                yaxis=dict(range=[0.5, 1.0]),
                **self.default_layout
            )
            
            fig = self._apply_theme(fig, kwargs.get('theme', 'light'))
            
            return self.to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating model comparison chart: {e}")
            return self._error_chart("Model Comparison")


class PerformanceDistributionChart(BaseChart):
    """성능 분포 차트"""
    
    def generate(self, data: pd.DataFrame, metric: str = 'AUC-ROC', **kwargs) -> str:
        """성능 분포 차트 생성"""
        try:
            if not self.validate_data(data, [metric]):
                return self._error_chart("Performance Distribution")
            
            values = data[metric].astype(float)
            
            fig = go.Figure()
            
            # 히스토그램
            fig.add_trace(go.Histogram(
                x=values,
                nbinsx=20,
                name='Distribution',
                marker_color=self.color_palette['primary'],
                opacity=0.7,
                hovertemplate="Range: %{x}<br>Count: %{y}<extra></extra>"
            ))
            
            # 박스플롯 (상단에 표시)
            fig.add_trace(go.Box(
                x=values,
                name='Box Plot',
                marker_color=self.color_palette['secondary'],
                yaxis='y2'
            ))
            
            # 평균선 추가
            mean_val = values.mean()
            fig.add_vline(x=mean_val, line_dash="dash", 
                         line_color=self.color_palette['danger'],
                         annotation_text=f"Mean: {mean_val:.3f}")
            
            fig.update_layout(
                title={
                    'text': f"📈 {metric} Distribution",
                    'x': 0.5,
                    'font': {'size': 18}
                },
                xaxis_title=metric,
                yaxis_title="Frequency",
                yaxis2=dict(
                    overlaying='y',
                    side='right',
                    showticklabels=False
                ),
                **self.default_layout
            )
            
            fig = self._apply_theme(fig, kwargs.get('theme', 'light'))
            
            return self.to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating performance distribution chart: {e}")
            return self._error_chart("Performance Distribution")


class PerformanceRadarChart(BaseChart):
    """성능 레이더 차트"""
    
    def generate(self, data: Dict[str, float], **kwargs) -> str:
        """성능 레이더 차트 생성"""
        try:
            categories = list(data.keys())
            values = list(data.values())
            
            # 레이더 차트는 closed loop 필요
            categories.append(categories[0])
            values.append(values[0])
            
            fig = go.Figure()
            
            fig.add_trace(go.Scatterpolar(
                r=values,
                theta=categories,
                fill='toself',
                fillcolor=f'rgba(37, 99, 235, 0.3)',  # primary color with opacity
                line_color=self.color_palette['primary'],
                line_width=3,
                marker=dict(
                    size=8,
                    color=self.color_palette['primary']
                ),
                hovertemplate="<b>%{theta}</b><br>Score: %{r:.3f}<extra></extra>"
            ))
            
            fig.update_layout(
                polar=dict(
                    radialaxis=dict(
                        visible=True,
                        range=[0, 1],
                        tickformat='.1%'
                    )
                ),
                title={
                    'text': "🎯 Performance Radar",
                    'x': 0.5,
                    'font': {'size': 18}
                },
                showlegend=False,
                **self.default_layout
            )
            
            fig = self._apply_theme(fig, kwargs.get('theme', 'light'))
            
            return self.to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating performance radar chart: {e}")
            return self._error_chart("Performance Radar")


class PerformanceTrendChart(BaseChart):
    """성능 트렌드 차트"""
    
    def generate(self, data: pd.DataFrame, **kwargs) -> str:
        """성능 트렌드 차트 생성"""
        try:
            if not self.validate_data(data, ['Date', 'Performance']):
                return self._error_chart("Performance Trend")
            
            fig = go.Figure()
            
            # 트렌드 라인
            fig.add_trace(go.Scatter(
                x=data['Date'],
                y=data['Performance'],
                mode='lines+markers',
                name='Performance',
                line=dict(
                    color=self.color_palette['primary'],
                    width=3
                ),
                marker=dict(
                    size=8,
                    color=self.color_palette['primary'],
                    line=dict(width=2, color='white')
                ),
                hovertemplate="<b>Date:</b> %{x}<br>" +
                             "<b>Performance:</b> %{y:.3f}<extra></extra>"
            ))
            
            # 이동평균선 (7일)
            if len(data) >= 7:
                moving_avg = data['Performance'].rolling(window=7).mean()
                fig.add_trace(go.Scatter(
                    x=data['Date'],
                    y=moving_avg,
                    mode='lines',
                    name='7-day Moving Average',
                    line=dict(
                        color=self.color_palette['secondary'],
                        width=2,
                        dash='dash'
                    ),
                    hovertemplate="<b>7-day MA:</b> %{y:.3f}<extra></extra>"
                ))
            
            fig.update_layout(
                title={
                    'text': "📈 Performance Trend",
                    'x': 0.5,
                    'font': {'size': 18}
                },
                xaxis_title="Date",
                yaxis_title="Performance Score",
                yaxis=dict(tickformat='.0%'),
                **self.default_layout
            )
            
            fig = self._apply_theme(fig, kwargs.get('theme', 'light'))
            fig = self._add_grid(fig, kwargs.get('show_grid', True))
            
            return self.to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating performance trend chart: {e}")
            return self._error_chart("Performance Trend")
    
    def _error_chart(self, chart_name: str) -> str:
        """에러 차트 생성"""
        fig = go.Figure()
        fig.add_annotation(
            text=f"Error generating {chart_name}",
            xref="paper", yref="paper",
            x=0.5, y=0.5, xanchor='center', yanchor='middle',
            showarrow=False,
            font=dict(size=16, color=self.color_palette['danger'])
        )
        fig.update_layout(
            xaxis=dict(visible=False),
            yaxis=dict(visible=False),
            **self.default_layout
        )
        
        return self.to_json(fig)