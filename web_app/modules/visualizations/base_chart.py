#!/usr/bin/env python3
"""
Base Chart Generator Module
Provides common functionality and configuration for all chart types
"""

import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import json
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class BaseChartGenerator:
    """Base class for all chart generators with common functionality"""
    
    def __init__(self):
        # Standard color palette for consistent styling
        self.color_palette = {
            'primary': '#2563eb',
            'secondary': '#64748b', 
            'success': '#059669',
            'danger': '#dc2626',
            'warning': '#d97706',
            'info': '#0891b2',
            'accent': '#0f172a',
            'surface': '#ffffff',
            'background': '#f8fafc'
        }
        
        # XAI-specific color schemes
        self.xai_colors = {
            'positive_shap': '#059669',
            'negative_shap': '#dc2626',
            'neutral': '#64748b',
            'feature_high': '#2563eb',
            'feature_low': '#d97706'
        }
        
        # Standard layout configuration
        self.default_layout = {
            'template': 'plotly_white',
            'font': {'family': 'Inter, sans-serif', 'size': 12, 'color': '#374151'},
            'margin': {'l': 60, 'r': 60, 't': 60, 'b': 60},
            'paper_bgcolor': 'white',
            'plot_bgcolor': 'white'
        }
        
        # Color scales for different chart types
        self.color_scales = {
            'diverging': 'RdBu',
            'sequential': 'Viridis', 
            'heatmap': 'Hot',
            'correlation': 'RdBu',
            'performance': 'Viridis'
        }
    
    def get_color_scale(self, chart_type: str = 'sequential') -> str:
        """Get appropriate color scale for chart type"""
        return self.color_scales.get(chart_type, 'Viridis')
    
    def apply_standard_layout(self, fig: go.Figure, title: str, height: int = 400, **kwargs) -> go.Figure:
        """Apply standard layout configuration to figure"""
        layout_config = self.default_layout.copy()
        layout_config.update({
            'title': {'text': title, 'font': {'size': 14, 'color': '#374151'}},
            'height': height,
            **kwargs
        })
        
        fig.update_layout(**layout_config)
        return fig
    
    def safe_to_json(self, fig: go.Figure) -> str:
        """Safely convert figure to JSON with error handling"""
        try:
            return fig.to_json()
        except Exception as e:
            logger.error(f"Error converting figure to JSON: {e}")
            return "{}"
    
    def validate_data(self, data: pd.DataFrame, required_cols: list = None) -> bool:
        """Validate input data before processing"""
        if data is None or data.empty:
            logger.warning("Empty or None data provided")
            return False
        
        if required_cols:
            missing_cols = [col for col in required_cols if col not in data.columns]
            if missing_cols:
                logger.warning(f"Missing required columns: {missing_cols}")
                return False
        
        return True
    
    def get_responsive_config(self) -> dict:
        """Get standard responsive configuration"""
        return {
            'responsive': True,
            'displayModeBar': False
        }
    
    def create_error_chart(self, error_message: str = "Chart generation failed") -> str:
        """Create a simple error chart when generation fails"""
        try:
            fig = go.Figure()
            fig.add_annotation(
                text=f"⚠️ {error_message}",
                xref="paper", yref="paper",
                x=0.5, y=0.5,
                xanchor='center', yanchor='middle',
                showarrow=False,
                font={'size': 16, 'color': '#dc2626'}
            )
            
            fig.update_layout(
                template='plotly_white',
                height=300,
                margin={'l': 20, 'r': 20, 't': 20, 'b': 20}
            )
            
            return fig.to_json()
        except Exception:
            return "{}"
    
    def generate_sample_data(self, data_type: str = 'numeric', size: int = 100) -> pd.DataFrame:
        """Generate sample data for testing purposes"""
        import numpy as np
        
        if data_type == 'numeric':
            return pd.DataFrame({
                'feature_a': np.random.normal(50, 15, size),
                'feature_b': np.random.exponential(25, size),
                'feature_c': np.random.uniform(0, 100, size),
                'category': np.random.choice(['A', 'B', 'C'], size)
            })
        elif data_type == 'fraud':
            fraud_factor = np.random.choice([0.7, 1.5], size, p=[0.8, 0.2])
            return pd.DataFrame({
                'amount': np.random.exponential(100, size) * fraud_factor,
                'balance': np.random.normal(1000, 500, size) / fraud_factor,
                'age': np.random.normal(40, 12, size),
                'risk_score': np.random.beta(2, 5, size) * 100 * fraud_factor,
                'is_fraud': fraud_factor > 1.0
            })
        
        return pd.DataFrame()
    
    def format_hover_template(self, x_label: str, y_label: str, z_label: str = None) -> str:
        """Generate consistent hover template"""
        if z_label:
            return f'<b>{x_label}: %{{x}}<br>{y_label}: %{{y}}<br>{z_label}: %{{z}}</b><extra></extra>'
        else:
            return f'<b>{x_label}: %{{x}}<br>{y_label}: %{{y}}</b><extra></extra>'
    
    def get_categorical_colors(self, n_categories: int) -> list:
        """Get consistent colors for categorical data"""
        base_colors = [
            self.color_palette['primary'],
            self.color_palette['success'], 
            self.color_palette['warning'],
            self.color_palette['danger'],
            self.color_palette['info'],
            self.color_palette['secondary']
        ]
        
        # Extend with Plotly qualitative colors if needed
        if n_categories > len(base_colors):
            base_colors.extend(px.colors.qualitative.Set3[:n_categories - len(base_colors)])
        
        return base_colors[:n_categories]
    
    def safe_to_json(self, fig) -> str:
        """Safely convert plotly figure to JSON"""
        try:
            import plotly
            return plotly.io.to_json(fig)
        except Exception as e:
            logger.error(f"Error converting figure to JSON: {e}")
            return self.create_error_chart("Chart generation failed")
    
    def apply_standard_layout(self, fig, title: str, height: int = 400, 
                            xaxis_title: str = None, yaxis_title: str = None,
                            **kwargs) -> object:
        """Apply standard layout to figure"""
        layout_config = {
            'title': title,
            'template': 'plotly_white',
            'height': height,
            'margin': {'l': 60, 'r': 60, 't': 80, 'b': 60},
            'showlegend': True,
            'hovermode': 'closest'
        }
        
        if xaxis_title:
            layout_config['xaxis'] = {'title': xaxis_title}
        
        if yaxis_title:
            layout_config['yaxis'] = {'title': yaxis_title}
        
        # Add any additional kwargs
        layout_config.update(kwargs)
        
        fig.update_layout(**layout_config)
        return fig
    
    def create_error_chart(self, message: str) -> str:
        """Create error chart when data loading fails"""
        try:
            import plotly.graph_objects as go
            
            fig = go.Figure()
            
            fig.add_annotation(
                x=0.5, y=0.5,
                text=f"❌ {message}",
                showarrow=False,
                font=dict(size=16, color=self.color_palette['danger']),
                xref="paper", yref="paper",
                xanchor="center", yanchor="middle"
            )
            
            fig.update_layout(
                title="Chart Generation Error",
                template='plotly_white',
                height=300,
                showlegend=False,
                xaxis={'visible': False},
                yaxis={'visible': False},
                margin={'l': 20, 'r': 20, 't': 60, 'b': 20}
            )
            
            return self.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating error chart: {e}")
            return '{"data": [], "layout": {"title": "Chart Error"}}'