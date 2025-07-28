#!/usr/bin/env python3
"""
Distribution Analysis Module
Specialized chart generators for distribution analysis
"""

import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
import numpy as np
from typing import Dict, Any, Optional, List
import logging
from .base_chart import BaseChartGenerator

logger = logging.getLogger(__name__)

class DistributionGenerator(BaseChartGenerator):
    """Specialized generator for distribution analysis visualizations"""
    
    def create_violin_plot(self, data: pd.DataFrame, x_col: str, y_col: str, 
                          color_col: str = None, title: str = None) -> str:
        """Create violin plot for distribution analysis"""
        try:
            if not self.validate_data(data, [x_col, y_col]):
                return self.create_error_chart("Missing required columns for violin plot")
            
            fig = go.Figure()
            
            if color_col and color_col in data.columns:
                categories = data[color_col].unique()
                colors = self.get_categorical_colors(len(categories))
                
                for i, category in enumerate(categories):
                    subset = data[data[color_col] == category]
                    if not subset.empty:
                        fig.add_trace(go.Violin(
                            x=subset[x_col],
                            y=subset[y_col],
                            name=str(category),
                            box_visible=True,
                            meanline_visible=True,
                            fillcolor=colors[i],
                            opacity=0.6,
                            line_color=colors[i]
                        ))
            else:
                fig.add_trace(go.Violin(
                    x=data[x_col],
                    y=data[y_col],
                    box_visible=True,
                    meanline_visible=True,
                    fillcolor=self.color_palette['primary'],
                    opacity=0.6,
                    showlegend=False
                ))
            
            plot_title = title or f'Violin Plot: {y_col} by {x_col}'
            fig = self.apply_standard_layout(
                fig, plot_title, height=400,
                xaxis_title=x_col,
                yaxis_title=y_col
            )
            
            return self.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating violin plot: {e}")
            return self.create_error_chart("Violin plot generation failed")
    
    def create_box_plot(self, data: pd.DataFrame, x_col: str, y_col: str, 
                       color_col: str = None, title: str = None) -> str:
        """Create box plot for distribution analysis"""
        try:
            if not self.validate_data(data, [x_col, y_col]):
                return self.create_error_chart("Missing required columns for box plot")
            
            if color_col and color_col in data.columns:
                fig = px.box(
                    data, 
                    x=x_col, 
                    y=y_col, 
                    color=color_col,
                    title=title or f'Box Plot: {y_col} by {x_col}',
                    color_discrete_sequence=self.get_categorical_colors(data[color_col].nunique())
                )
            else:
                fig = px.box(
                    data, 
                    x=x_col, 
                    y=y_col,
                    title=title or f'Box Plot: {y_col} by {x_col}'
                )
            
            fig = self.apply_standard_layout(fig, title or f'Box Plot: {y_col} by {x_col}', height=400)
            
            return self.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating box plot: {e}")
            return self.create_error_chart("Box plot generation failed")
    
    def create_histogram(self, data: pd.DataFrame, column: str, bins: int = 30, 
                        color_col: str = None, title: str = None) -> str:
        """Create histogram for single variable distribution"""
        try:
            if not self.validate_data(data, [column]):
                return self.create_error_chart("Missing required column for histogram")
            
            if color_col and color_col in data.columns:
                fig = px.histogram(
                    data,
                    x=column,
                    color=color_col,
                    nbins=bins,
                    title=title or f'Distribution of {column}',
                    color_discrete_sequence=self.get_categorical_colors(data[color_col].nunique())
                )
            else:
                fig = px.histogram(
                    data,
                    x=column,
                    nbins=bins,
                    title=title or f'Distribution of {column}'
                )
            
            fig = self.apply_standard_layout(
                fig, title or f'Distribution of {column}', height=400,
                xaxis_title=column,
                yaxis_title="Count"
            )
            
            return self.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating histogram: {e}")
            return self.create_error_chart("Histogram generation failed")
    
    def create_ridgeline_plot(self, data: pd.DataFrame, x_col: str, category_col: str,
                             title: str = None) -> str:
        """Create ridgeline plot (stacked density plots)"""
        try:
            if not self.validate_data(data, [x_col, category_col]):
                return self.create_error_chart("Missing required columns for ridgeline plot")
            
            categories = data[category_col].unique()
            colors = self.get_categorical_colors(len(categories))
            
            fig = go.Figure()
            
            for i, category in enumerate(categories):
                subset = data[data[category_col] == category]
                if not subset.empty and len(subset) > 1:
                    fig.add_trace(go.Violin(
                        x=subset[x_col],
                        y=[category] * len(subset),
                        name=str(category),
                        orientation='h',
                        side='positive',
                        fillcolor=colors[i],
                        opacity=0.7,
                        line_color=colors[i],
                        showlegend=False
                    ))
            
            plot_title = title or f'Ridgeline Plot: {x_col} by {category_col}'
            fig = self.apply_standard_layout(
                fig, plot_title, height=400,
                xaxis_title=x_col,
                yaxis_title=category_col
            )
            
            return self.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating ridgeline plot: {e}")
            return self.create_error_chart("Ridgeline plot generation failed")
    
    def create_distribution_comparison(self, data: pd.DataFrame, columns: List[str],
                                     title: str = None) -> str:
        """Create overlayed distribution comparison"""
        try:
            if not self.validate_data(data, columns):
                return self.create_error_chart("Missing required columns for distribution comparison")
            
            fig = go.Figure()
            colors = self.get_categorical_colors(len(columns))
            
            for i, col in enumerate(columns):
                col_data = data[col].dropna()
                if not col_data.empty:
                    fig.add_trace(go.Histogram(
                        x=col_data,
                        name=col,
                        opacity=0.7,
                        marker_color=colors[i],
                        nbinsx=30
                    ))
            
            fig.update_layout(barmode='overlay')
            
            plot_title = title or 'Distribution Comparison'
            fig = self.apply_standard_layout(
                fig, plot_title, height=400,
                xaxis_title="Value",
                yaxis_title="Count"
            )
            
            return self.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating distribution comparison: {e}")
            return self.create_error_chart("Distribution comparison generation failed")
    
    def create_qq_plot(self, data: pd.DataFrame, column: str, distribution: str = 'norm',
                      title: str = None) -> str:
        """Create Q-Q plot for distribution testing"""
        try:
            if not self.validate_data(data, [column]):
                return self.create_error_chart("Missing required column for Q-Q plot")
            
            from scipy import stats
            
            col_data = data[column].dropna()
            if col_data.empty or len(col_data) < 3:
                return self.create_error_chart("Insufficient data for Q-Q plot")
            
            # Get theoretical quantiles
            if distribution == 'norm':
                theoretical_q = stats.norm.ppf(np.linspace(0.01, 0.99, len(col_data)))
            else:
                theoretical_q = stats.uniform.ppf(np.linspace(0.01, 0.99, len(col_data)))
            
            # Get sample quantiles
            sample_q = np.sort(col_data)
            
            # Create Q-Q plot
            fig = go.Figure()
            
            # Add scatter points
            fig.add_trace(go.Scatter(
                x=theoretical_q,
                y=sample_q,
                mode='markers',
                name='Data Points',
                marker=dict(color=self.color_palette['primary'], size=6, opacity=0.7)
            ))
            
            # Add reference line
            line_start = min(min(theoretical_q), min(sample_q))
            line_end = max(max(theoretical_q), max(sample_q))
            
            fig.add_trace(go.Scatter(
                x=[line_start, line_end],
                y=[line_start, line_end],
                mode='lines',
                name='Reference Line',
                line=dict(color=self.color_palette['danger'], dash='dash')
            ))
            
            plot_title = title or f'Q-Q Plot: {column} vs {distribution.title()} Distribution'
            fig = self.apply_standard_layout(
                fig, plot_title, height=400,
                xaxis_title=f'Theoretical Quantiles ({distribution})',
                yaxis_title=f'Sample Quantiles ({column})'
            )
            
            return self.safe_to_json(fig)
            
        except ImportError:
            logger.warning("SciPy not available for Q-Q plot")
            return self.create_error_chart("SciPy required for Q-Q plot")
        except Exception as e:
            logger.error(f"Error creating Q-Q plot: {e}")
            return self.create_error_chart("Q-Q plot generation failed")