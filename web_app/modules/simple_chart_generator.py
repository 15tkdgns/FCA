#!/usr/bin/env python3
"""
Simple Chart Generator
기본적인 차트 생성을 위한 간단한 구현
"""

import json
import pandas as pd
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

class SimpleChartGenerator:
    """간단한 차트 생성기"""
    
    def __init__(self):
        self.colors = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed']
    
    def create_performance_overview(self, fraud_df: pd.DataFrame, 
                                  sentiment_df: pd.DataFrame, 
                                  attrition_df: pd.DataFrame) -> str:
        """성능 개요 차트 생성"""
        try:
            # 각 도메인의 평균 성능 계산
            fraud_avg = fraud_df['AUC-ROC'].astype(float).mean() if len(fraud_df) > 0 else 0
            sentiment_avg = sentiment_df['Accuracy'].astype(float).mean() if len(sentiment_df) > 0 else 0
            attrition_avg = attrition_df['AUC-ROC'].astype(float).mean() if len(attrition_df) > 0 else 0
            
            chart_data = {
                'data': [{
                    'x': ['Fraud Detection', 'Sentiment Analysis', 'Customer Attrition'],
                    'y': [fraud_avg, sentiment_avg, attrition_avg],
                    'type': 'bar',
                    'marker': {'color': self.colors[:3]},
                    'name': 'Average Performance'
                }],
                'layout': {
                    'title': 'Performance Overview by Domain',
                    'xaxis': {'title': 'Domain'},
                    'yaxis': {'title': 'Performance Score'},
                    'showlegend': False
                }
            }
            
            return json.dumps(chart_data)
        except Exception as e:
            logger.error(f"Error creating overview chart: {e}")
            return self._create_error_chart("Overview chart error")
    
    def create_distribution_chart(self, fraud_df: pd.DataFrame) -> str:
        """분포 차트 생성"""
        try:
            if len(fraud_df) == 0:
                return self._create_error_chart("No data available")
            
            chart_data = {
                'data': [{
                    'labels': fraud_df['Model'].tolist(),
                    'values': fraud_df['AUC-ROC'].astype(float).tolist(),
                    'type': 'pie',
                    'marker': {'colors': self.colors}
                }],
                'layout': {
                    'title': 'Model Distribution'
                }
            }
            
            return json.dumps(chart_data)
        except Exception as e:
            logger.error(f"Error creating distribution chart: {e}")
            return self._create_error_chart("Distribution chart error")
    
    def create_success_chart(self, fraud_df: pd.DataFrame, 
                           sentiment_df: pd.DataFrame,
                           attrition_df: pd.DataFrame) -> str:
        """성공 메트릭 차트 생성"""
        try:
            models = len(fraud_df) + len(sentiment_df) + len(attrition_df)
            successful = models  # 모든 모델이 성공적이라고 가정
            
            chart_data = {
                'data': [{
                    'values': [successful, models - successful],
                    'labels': ['Successful', 'Failed'],
                    'type': 'pie',
                    'marker': {'colors': ['#059669', '#dc2626']}
                }],
                'layout': {
                    'title': f'Success Rate: {models}/{models} Models'
                }
            }
            
            return json.dumps(chart_data)
        except Exception as e:
            logger.error(f"Error creating success chart: {e}")
            return self._create_error_chart("Success chart error")
    
    def create_radar_chart(self, fraud_df: pd.DataFrame,
                          sentiment_df: pd.DataFrame, 
                          attrition_df: pd.DataFrame) -> str:
        """레이더 차트 생성"""
        try:
            # 각 도메인의 최고 성능
            fraud_max = fraud_df['AUC-ROC'].astype(float).max() if len(fraud_df) > 0 else 0
            sentiment_max = sentiment_df['Accuracy'].astype(float).max() if len(sentiment_df) > 0 else 0
            attrition_max = attrition_df['AUC-ROC'].astype(float).max() if len(attrition_df) > 0 else 0
            
            chart_data = {
                'data': [{
                    'type': 'scatterpolar',
                    'r': [fraud_max, sentiment_max, attrition_max, fraud_max],
                    'theta': ['Fraud', 'Sentiment', 'Attrition', 'Fraud'],
                    'fill': 'toself',
                    'name': 'Performance'
                }],
                'layout': {
                    'polar': {
                        'radialaxis': {
                            'visible': True,
                            'range': [0, 1]
                        }
                    },
                    'title': 'Performance Radar'
                }
            }
            
            return json.dumps(chart_data)
        except Exception as e:
            logger.error(f"Error creating radar chart: {e}")
            return self._create_error_chart("Radar chart error")
    
    def _create_error_chart(self, message: str) -> str:
        """에러 차트 생성"""
        chart_data = {
            'data': [{
                'x': [1],
                'y': [1],
                'type': 'scatter',
                'mode': 'text',
                'text': [message],
                'textposition': 'middle center'
            }],
            'layout': {
                'title': 'Chart Error',
                'showlegend': False,
                'xaxis': {'visible': False},
                'yaxis': {'visible': False}
            }
        }
        return json.dumps(chart_data)