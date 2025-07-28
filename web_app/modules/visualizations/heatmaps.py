#!/usr/bin/env python3
"""
Heatmap Visualization Module
Specialized chart generators for various types of heatmaps
"""

import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
import numpy as np
from typing import Dict, Any, Optional, List
import logging
from .base_chart import BaseChartGenerator

logger = logging.getLogger(__name__)

class HeatmapGenerator(BaseChartGenerator):
    """Specialized generator for heatmap visualizations"""
    
    def create_correlation_heatmap(self, data: pd.DataFrame, title: str = "Correlation Heatmap") -> str:
        """Create correlation heatmap"""
        try:
            if not self.validate_data(data):
                return self.create_error_chart("Invalid data for correlation heatmap")
            
            # Calculate correlation matrix
            numeric_data = data.select_dtypes(include=[np.number])
            if numeric_data.empty:
                return self.create_error_chart("No numeric columns found")
            
            corr_matrix = numeric_data.corr()
            
            fig = go.Figure(data=go.Heatmap(
                z=corr_matrix.values,
                x=corr_matrix.columns,
                y=corr_matrix.columns,
                colorscale=self.get_color_scale('correlation'),
                zmid=0,
                text=np.round(corr_matrix.values, 2),
                texttemplate="%{text}",
                textfont={"size": 10},
                hovertemplate=self.format_hover_template('%{x}', '%{y}', 'Correlation: %{z:.3f}'),
                colorbar=dict(title="Correlation", titleside="right")
            ))
            
            fig = self.apply_standard_layout(
                fig, title, height=500, 
                xaxis_title="Features", 
                yaxis_title="Features"
            )
            
            return self.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating correlation heatmap: {e}")
            return self.create_error_chart("Correlation heatmap generation failed")
    
    def create_confusion_matrix_heatmap(self, y_true: List, y_pred: List, 
                                      labels: List[str] = None) -> str:
        """Create confusion matrix heatmap"""
        try:
            from sklearn.metrics import confusion_matrix
            
            # Calculate confusion matrix
            cm = confusion_matrix(y_true, y_pred)
            
            if labels is None:
                labels = [f'Class {i}' for i in range(len(cm))]
            
            # Normalize confusion matrix for color display
            cm_normalized = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]
            
            fig = go.Figure(data=go.Heatmap(
                z=cm_normalized,
                x=labels,
                y=labels,
                colorscale='Blues',
                text=cm,
                texttemplate="%{text}",
                textfont={"size": 14, "color": "white"},
                hovertemplate='<b>True: %{y}<br>Predicted: %{x}</b><br>Count: %{text}<br>Rate: %{z:.3f}<extra></extra>',
                colorbar=dict(title="Rate", titleside="right")
            ))
            
            fig = self.apply_standard_layout(
                fig, 'Confusion Matrix', height=400,
                xaxis_title="Predicted Label",
                yaxis_title="True Label"
            )
            
            return self.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating confusion matrix heatmap: {e}")
            return self.create_error_chart("Confusion matrix generation failed")
    
    def create_performance_heatmap(self, model_scores: Dict[str, Dict[str, float]], 
                                 metrics: List[str]) -> str:
        """Create performance heatmap across models and metrics"""
        try:
            models = list(model_scores.keys())
            z_data = []
            
            for metric in metrics:
                row = []
                for model in models:
                    score = model_scores.get(model, {}).get(metric, 0)
                    row.append(score)
                z_data.append(row)
            
            fig = go.Figure(data=go.Heatmap(
                z=z_data,
                x=models,
                y=metrics,
                colorscale=self.get_color_scale('performance'),
                text=np.round(z_data, 3),
                texttemplate="%{text}",
                textfont={"size": 10, "color": "white"},
                hovertemplate='<b>Model: %{x}<br>Metric: %{y}</b><br>Score: %{z:.3f}<extra></extra>',
                colorbar=dict(title="Score", titleside="right")
            ))
            
            fig = self.apply_standard_layout(
                fig, 'Model Performance Heatmap', height=400,
                xaxis_title="Models",
                yaxis_title="Metrics"
            )
            
            return self.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating performance heatmap: {e}")
            return self.create_error_chart("Performance heatmap generation failed")
    
    def create_feature_distribution_heatmap(self, data: pd.DataFrame, bins: int = 20) -> str:
        """Create feature distribution heatmap"""
        try:
            if not self.validate_data(data):
                return self.create_error_chart("Invalid data for feature distribution")
            
            # Select numerical columns (limit to avoid overcrowding)
            numeric_cols = data.select_dtypes(include=[np.number]).columns[:10]
            
            if len(numeric_cols) == 0:
                return self.create_error_chart("No numeric columns found")
            
            z_data = []
            feature_names = []
            
            for col in numeric_cols:
                col_data = data[col].dropna()
                if len(col_data) > 0:
                    hist, bin_edges = np.histogram(col_data, bins=bins)
                    z_data.append(hist)
                    feature_names.append(col)
            
            if not z_data:
                return self.create_error_chart("No valid data for distribution")
            
            bin_centers = [(bin_edges[i] + bin_edges[i+1])/2 for i in range(len(bin_edges)-1)]
            
            fig = go.Figure(data=go.Heatmap(
                z=z_data,
                x=bin_centers,
                y=feature_names,
                colorscale=self.get_color_scale('heatmap'),
                hovertemplate='<b>Feature: %{y}<br>Bin: %{x:.2f}</b><br>Count: %{z}<extra></extra>',
                colorbar=dict(title="Count", titleside="right")
            ))
            
            fig = self.apply_standard_layout(
                fig, 'Feature Distribution Heatmap', height=500,
                xaxis_title="Value Bins",
                yaxis_title="Features"
            )
            
            return self.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating feature distribution heatmap: {e}")
            return self.create_error_chart("Feature distribution heatmap generation failed")
    
    def create_time_series_heatmap(self, data: pd.DataFrame, time_col: str, 
                                 value_col: str, category_col: str = None) -> str:
        """Create time series heatmap"""
        try:
            if not self.validate_data(data, [time_col, value_col]):
                return self.create_error_chart("Missing required columns for time series")
            
            if category_col and category_col in data.columns:
                # Pivot data for heatmap
                pivot_data = data.pivot_table(
                    values=value_col, 
                    index=category_col, 
                    columns=time_col, 
                    aggfunc='mean',
                    fill_value=0
                )
            else:
                # Create time bins for single series
                data_copy = data.copy()
                data_copy['time_bin'] = pd.cut(data_copy[time_col], bins=20, duplicates='drop')
                pivot_data = data_copy.groupby('time_bin')[value_col].mean().to_frame().T
            
            if pivot_data.empty:
                return self.create_error_chart("No data available for time series heatmap")
            
            fig = go.Figure(data=go.Heatmap(
                z=pivot_data.values,
                x=pivot_data.columns,
                y=pivot_data.index,
                colorscale='Plasma',
                hovertemplate='<b>Time: %{x}<br>Category: %{y}</b><br>Value: %{z:.3f}<extra></extra>',
                colorbar=dict(title="Value", titleside="right")
            ))
            
            fig = self.apply_standard_layout(
                fig, 'Time Series Heatmap', height=400,
                xaxis_title="Time",
                yaxis_title="Categories"
            )
            
            return self.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating time series heatmap: {e}")
            return self.create_error_chart("Time series heatmap generation failed")
    
    def create_density_heatmap(self, data: pd.DataFrame, x_col: str, y_col: str) -> str:
        """Create 2D density heatmap"""
        try:
            if not self.validate_data(data, [x_col, y_col]):
                return self.create_error_chart("Missing required columns for density heatmap")
            
            # Remove missing values
            clean_data = data[[x_col, y_col]].dropna()
            
            if clean_data.empty:
                return self.create_error_chart("No valid data for density heatmap")
            
            fig = px.density_heatmap(
                clean_data,
                x=x_col,
                y=y_col,
                title=f'Density Heatmap: {x_col} vs {y_col}',
                color_continuous_scale=self.get_color_scale('heatmap')
            )
            
            fig = self.apply_standard_layout(fig, f'Density Heatmap: {x_col} vs {y_col}', height=400)
            
            return self.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating density heatmap: {e}")
            return self.create_error_chart("Density heatmap generation failed")