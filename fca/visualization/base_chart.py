#!/usr/bin/env python3
"""
Base Chart Module
================

Base class for all chart generators with common functionality
"""

import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import json
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class BaseChart:
    """Base class for all chart generators"""
    
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
            'paper_bgcolor': 'rgba(0,0,0,0)',
            'plot_bgcolor': 'rgba(0,0,0,0)',
            'font': {'family': 'Inter, sans-serif', 'size': 12},
            'margin': {'l': 50, 'r': 50, 't': 80, 'b': 50},
            'showlegend': True
        }
        
    def _apply_base_styling(self, fig: go.Figure, title: str = None) -> go.Figure:
        """Apply consistent base styling to all charts"""
        fig.update_layout(**self.default_layout)
        
        if title:
            fig.update_layout(title={
                'text': title,
                'x': 0.5,
                'xanchor': 'center',
                'font': {'size': 16, 'family': 'Inter, sans-serif'}
            })
            
        return fig
    
    def _get_color_sequence(self, n_colors: int) -> list:
        """Get color sequence for charts"""
        colors = [
            self.color_palette['primary'],
            self.color_palette['success'], 
            self.color_palette['warning'],
            self.color_palette['danger'],
            self.color_palette['secondary'],
            self.color_palette['accent']
        ]
        
        # Repeat colors if needed
        return (colors * ((n_colors // len(colors)) + 1))[:n_colors]
    
    def _format_number(self, value: float, decimal_places: int = 2) -> str:
        """Format numbers consistently"""
        if value >= 1000000:
            return f"{value/1000000:.{decimal_places}f}M"
        elif value >= 1000:
            return f"{value/1000:.{decimal_places}f}K"
        else:
            return f"{value:.{decimal_places}f}"
    
    def _safe_dataframe_operation(self, df: pd.DataFrame, operation: str, column: str = None) -> Any:
        """Safely perform DataFrame operations with error handling"""
        try:
            if df is None or df.empty:
                logger.warning(f"Empty or None DataFrame for operation: {operation}")
                return 0
                
            if operation == 'mean' and column:
                return df[column].astype(float).mean()
            elif operation == 'count':
                return len(df)
            elif operation == 'sum' and column:
                return df[column].astype(float).sum()
            else:
                logger.warning(f"Unknown operation: {operation}")
                return 0
                
        except Exception as e:
            logger.error(f"Error in DataFrame operation {operation}: {e}")
            return 0
    
    def to_json(self, fig: go.Figure) -> str:
        """Convert Plotly figure to JSON string"""
        try:
            return json.dumps(fig.to_dict(), cls=plotly.utils.PlotlyJSONEncoder)
        except Exception as e:
            logger.error(f"Error converting figure to JSON: {e}")
            return "{}"
    
    def create_error_chart(self, error_message: str) -> str:
        """Create error chart when data is unavailable"""
        fig = go.Figure()
        fig.add_annotation(
            text=f"Error: {error_message}",
            xref="paper", yref="paper",
            x=0.5, y=0.5,
            showarrow=False,
            font=dict(size=16, color=self.color_palette['danger'])
        )
        
        fig.update_layout(
            xaxis={'visible': False},
            yaxis={'visible': False},
            height=400,
            **self.default_layout
        )
        
        return self.to_json(fig)