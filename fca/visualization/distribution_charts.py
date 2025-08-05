#!/usr/bin/env python3
"""
Distribution Charts Module
==========================

Chart generators for data distribution visualization
"""

import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
from typing import Dict, Any, Optional, List
import logging

from .base_chart import BaseChart

logger = logging.getLogger(__name__)

class DistributionChartGenerator(BaseChart):
    """Generate distribution-related charts"""
    
    def create_model_distribution_pie(self, model_counts: Dict[str, int]) -> str:
        """Create pie chart for model distribution"""
        try:
            if not model_counts:
                return self.create_error_chart("No model distribution data")
            
            labels = list(model_counts.keys())
            values = list(model_counts.values())
            colors = self._get_color_sequence(len(labels))
            
            fig = go.Figure(data=[go.Pie(
                labels=labels,
                values=values,
                marker_colors=colors,
                textinfo='label+percent',
                textposition='outside',
                hovertemplate='<b>%{label}</b><br>Count: %{value}<br>Percentage: %{percent}<extra></extra>'
            )])
            
            fig.update_layout(
                title='Model Distribution by Algorithm',
                height=400,
                showlegend=True
            )
            
            fig = self._apply_base_styling(fig)
            return self.to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating model distribution pie: {e}")
            return self.create_error_chart("Failed to load distribution data")
    
    def create_data_distribution_histogram(self, data: List[float], title: str = "Data Distribution") -> str:
        """Create histogram for data distribution"""
        try:
            if not data:
                return self.create_error_chart("No data for distribution")
            
            fig = go.Figure(data=[go.Histogram(
                x=data,
                nbinsx=30,
                marker_color=self.color_palette['primary'],
                opacity=0.7,
                hovertemplate='Range: %{x}<br>Count: %{y}<extra></extra>'
            )])
            
            fig.update_layout(
                title=title,
                xaxis_title='Value',
                yaxis_title='Frequency',
                height=400
            )
            
            fig = self._apply_base_styling(fig)
            return self.to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating histogram: {e}")
            return self.create_error_chart("Failed to create histogram")
    
    def create_sentiment_distribution(self, sentiment_counts: Dict[str, int]) -> str:
        """Create sentiment distribution chart"""
        try:
            if not sentiment_counts:
                return self.create_error_chart("No sentiment data")
            
            sentiments = list(sentiment_counts.keys())
            counts = list(sentiment_counts.values())
            
            # Color mapping for sentiments
            color_map = {
                'positive': self.color_palette['success'],
                'negative': self.color_palette['danger'], 
                'neutral': self.color_palette['secondary']
            }
            colors = [color_map.get(s.lower(), self.color_palette['primary']) for s in sentiments]
            
            fig = go.Figure(data=[go.Bar(
                x=sentiments,
                y=counts,
                marker_color=colors,
                text=counts,
                textposition='auto',
                hovertemplate='<b>%{x}</b><br>Count: %{y}<extra></extra>'
            )])
            
            fig.update_layout(
                title='Sentiment Distribution',
                xaxis_title='Sentiment',
                yaxis_title='Count',
                height=400
            )
            
            fig = self._apply_base_styling(fig)
            return self.to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating sentiment distribution: {e}")
            return self.create_error_chart("Failed to load sentiment data")
    
    def create_feature_distribution_box(self, df: pd.DataFrame, feature_cols: List[str]) -> str:
        """Create box plots for feature distributions"""
        try:
            if df is None or df.empty or not feature_cols:
                return self.create_error_chart("No feature data available")
            
            fig = go.Figure()
            colors = self._get_color_sequence(len(feature_cols))
            
            for i, col in enumerate(feature_cols):
                if col in df.columns:
                    fig.add_trace(go.Box(
                        y=df[col],
                        name=col,
                        marker_color=colors[i],
                        hovertemplate=f'<b>{col}</b><br>Value: %{{y}}<extra></extra>'
                    ))
            
            fig.update_layout(
                title='Feature Distribution Analysis',
                yaxis_title='Value',
                height=400
            )
            
            fig = self._apply_base_styling(fig)
            return self.to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating box plot: {e}")
            return self.create_error_chart("Failed to create feature distribution")
    
    def create_class_distribution(self, class_counts: Dict[str, int], title: str = "Class Distribution") -> str:
        """Create class distribution chart"""
        try:
            if not class_counts:
                return self.create_error_chart("No class data available")
            
            classes = list(class_counts.keys())
            counts = list(class_counts.values())
            colors = self._get_color_sequence(len(classes))
            
            # Calculate percentages
            total = sum(counts)
            percentages = [(c / total) * 100 for c in counts]
            
            fig = go.Figure(data=[go.Bar(
                x=classes,
                y=counts,
                marker_color=colors,
                text=[f"{p:.1f}%" for p in percentages],
                textposition='auto',
                hovertemplate='<b>%{x}</b><br>Count: %{y}<br>Percentage: %{text}<extra></extra>'
            )])
            
            fig.update_layout(
                title=title,
                xaxis_title='Class',
                yaxis_title='Count',
                height=400
            )
            
            fig = self._apply_base_styling(fig)
            return self.to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating class distribution: {e}")
            return self.create_error_chart("Failed to load class data")
    
    def create_correlation_heatmap(self, correlation_matrix: pd.DataFrame) -> str:
        """Create correlation heatmap"""
        try:
            if correlation_matrix is None or correlation_matrix.empty:
                return self.create_error_chart("No correlation data")
            
            fig = go.Figure(data=go.Heatmap(
                z=correlation_matrix.values,
                x=correlation_matrix.columns,
                y=correlation_matrix.index,
                colorscale='RdBu',
                zmid=0,
                hoverongaps=False,
                hovertemplate='%{y} vs %{x}<br>Correlation: %{z:.3f}<extra></extra>'
            ))
            
            fig.update_layout(
                title='Feature Correlation Matrix',
                height=400
            )
            
            fig = self._apply_base_styling(fig)
            return self.to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating correlation heatmap: {e}")
            return self.create_error_chart("Failed to create correlation matrix")