#!/usr/bin/env python3
"""
Performance Charts Module
=========================

Chart generators for performance metrics visualization
"""

import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
from typing import Dict, Any, Optional
import logging

from .base_chart import BaseChart

logger = logging.getLogger(__name__)

class PerformanceChartGenerator(BaseChart):
    """Generate performance-related charts"""
    
    def create_performance_overview(self, fraud_df: pd.DataFrame, 
                                  sentiment_df: pd.DataFrame, 
                                  attrition_df: pd.DataFrame) -> str:
        """Create overview performance chart"""
        try:
            # Calculate average performance by domain
            fraud_avg = self._safe_dataframe_operation(fraud_df, 'mean', 'AUC-ROC')
            sentiment_avg = self._safe_dataframe_operation(sentiment_df, 'mean', 'Accuracy') 
            attrition_avg = self._safe_dataframe_operation(attrition_df, 'mean', 'AUC-ROC')
            
            domains = ['Fraud Detection', 'Sentiment Analysis', 'Customer Attrition']
            performance = [fraud_avg * 100, sentiment_avg * 100, attrition_avg * 100]
            colors = self._get_color_sequence(3)
            
            fig = go.Figure(data=[
                go.Bar(
                    x=domains,
                    y=performance,
                    marker_color=colors,
                    text=[f"{p:.1f}%" for p in performance],
                    textposition='auto',
                    hovertemplate='<b>%{x}</b><br>Performance: %{y:.1f}%<extra></extra>'
                )
            ])
            
            fig.update_layout(
                title='Model Performance Overview',
                xaxis_title='Analysis Domain',
                yaxis_title='Performance (%)',
                yaxis=dict(range=[0, 100]),
                height=400
            )
            
            fig = self._apply_base_styling(fig)
            return self.to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating performance overview: {e}")
            return self.create_error_chart("Failed to load performance data")
    
    def create_accuracy_comparison(self, models_data: list) -> str:
        """Create accuracy comparison chart"""
        try:
            if not models_data:
                return self.create_error_chart("No model data available")
            
            model_names = [model.get('name', 'Unknown') for model in models_data]
            accuracies = [model.get('accuracy', 0) * 100 for model in models_data]
            colors = self._get_color_sequence(len(model_names))
            
            fig = go.Figure(data=[
                go.Bar(
                    x=model_names,
                    y=accuracies,
                    marker_color=colors,
                    text=[f"{acc:.1f}%" for acc in accuracies],
                    textposition='auto',
                    hovertemplate='<b>%{x}</b><br>Accuracy: %{y:.1f}%<extra></extra>'
                )
            ])
            
            fig.update_layout(
                title='Model Accuracy Comparison',
                xaxis_title='Model',
                yaxis_title='Accuracy (%)',
                yaxis=dict(range=[0, 100]),
                height=400
            )
            
            fig = self._apply_base_styling(fig)
            return self.to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating accuracy comparison: {e}")
            return self.create_error_chart("Failed to load accuracy data")
    
    def create_metric_radar(self, model_metrics: Dict[str, float]) -> str:
        """Create radar chart for multiple metrics"""
        try:
            if not model_metrics:
                return self.create_error_chart("No metrics data available")
            
            metrics = list(model_metrics.keys())
            values = [v * 100 if v <= 1 else v for v in model_metrics.values()]
            
            fig = go.Figure()
            
            fig.add_trace(go.Scatterpolar(
                r=values,
                theta=metrics,
                fill='toself',
                name='Performance Metrics',
                line_color=self.color_palette['primary'],
                fillcolor=f"{self.color_palette['primary']}33"
            ))
            
            fig.update_layout(
                polar=dict(
                    radialaxis=dict(
                        visible=True,
                        range=[0, 100]
                    )
                ),
                title='Performance Radar Chart',
                height=400
            )
            
            fig = self._apply_base_styling(fig)
            return self.to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating radar chart: {e}")
            return self.create_error_chart("Failed to load metrics data")
    
    def create_training_progress(self, training_data: list) -> str:
        """Create training progress line chart"""
        try:
            if not training_data:
                return self.create_error_chart("No training data available")
            
            epochs = [d.get('epoch', i) for i, d in enumerate(training_data)]
            train_loss = [d.get('train_loss', 0) for d in training_data]
            val_loss = [d.get('val_loss', 0) for d in training_data]
            
            fig = go.Figure()
            
            fig.add_trace(go.Scatter(
                x=epochs,
                y=train_loss,
                mode='lines+markers',
                name='Training Loss',
                line=dict(color=self.color_palette['primary']),
                hovertemplate='Epoch: %{x}<br>Training Loss: %{y:.4f}<extra></extra>'
            ))
            
            fig.add_trace(go.Scatter(
                x=epochs,
                y=val_loss,
                mode='lines+markers', 
                name='Validation Loss',
                line=dict(color=self.color_palette['danger']),
                hovertemplate='Epoch: %{x}<br>Validation Loss: %{y:.4f}<extra></extra>'
            ))
            
            fig.update_layout(
                title='Training Progress',
                xaxis_title='Epoch',
                yaxis_title='Loss',
                height=400
            )
            
            fig = self._apply_base_styling(fig)
            return self.to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating training progress chart: {e}")
            return self.create_error_chart("Failed to load training data")
    
    def create_performance_heatmap(self, performance_matrix: pd.DataFrame) -> str:
        """Create performance heatmap"""
        try:
            if performance_matrix is None or performance_matrix.empty:
                return self.create_error_chart("No performance matrix data")
            
            fig = go.Figure(data=go.Heatmap(
                z=performance_matrix.values,
                x=performance_matrix.columns,
                y=performance_matrix.index,
                colorscale='RdYlBu_r',
                hoverongaps=False,
                hovertemplate='Model: %{y}<br>Metric: %{x}<br>Value: %{z:.3f}<extra></extra>'
            ))
            
            fig.update_layout(
                title='Model Performance Heatmap',
                height=400
            )
            
            fig = self._apply_base_styling(fig)
            return self.to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating performance heatmap: {e}")
            return self.create_error_chart("Failed to load heatmap data")