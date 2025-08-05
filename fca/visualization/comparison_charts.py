#!/usr/bin/env python3
"""
Comparison Charts Module
========================

Chart generators for model and data comparison visualization
"""

import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
from typing import Dict, Any, Optional, List
import logging

from .base_chart import BaseChart

logger = logging.getLogger(__name__)

class ComparisonChartGenerator(BaseChart):
    """Generate comparison-related charts"""
    
    def create_model_comparison_table(self, models_data: List[Dict]) -> str:
        """Create comparison table for models"""
        try:
            if not models_data:
                return self.create_error_chart("No model comparison data")
            
            # Extract data for table
            model_names = [m.get('name', 'Unknown') for m in models_data]
            accuracies = [m.get('accuracy', 0) for m in models_data]
            precisions = [m.get('precision', 0) for m in models_data]
            recalls = [m.get('recall', 0) for m in models_data]
            f1_scores = [m.get('f1_score', 0) for m in models_data]
            
            fig = go.Figure(data=[go.Table(
                header=dict(
                    values=['Model', 'Accuracy', 'Precision', 'Recall', 'F1-Score'],
                    fill_color=self.color_palette['primary'],
                    font=dict(color='white', size=12),
                    align='center',
                    height=40
                ),
                cells=dict(
                    values=[
                        model_names,
                        [f"{a:.3f}" for a in accuracies],
                        [f"{p:.3f}" for p in precisions], 
                        [f"{r:.3f}" for r in recalls],
                        [f"{f:.3f}" for f in f1_scores]
                    ],
                    fill_color='white',
                    align='center',
                    height=35,
                    font=dict(size=11)
                )
            )])
            
            fig.update_layout(
                title='Model Performance Comparison',
                height=400
            )
            
            fig = self._apply_base_styling(fig)
            return self.to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating comparison table: {e}")
            return self.create_error_chart("Failed to create comparison table")
    
    def create_metric_comparison_bar(self, models_data: List[Dict], metric: str = 'accuracy') -> str:
        """Create bar chart comparing specific metric across models"""
        try:
            if not models_data:
                return self.create_error_chart("No model data for comparison")
            
            model_names = [m.get('name', 'Unknown') for m in models_data]
            metric_values = [m.get(metric, 0) for m in models_data]
            colors = self._get_color_sequence(len(model_names))
            
            fig = go.Figure(data=[go.Bar(
                x=model_names,
                y=metric_values,
                marker_color=colors,
                text=[f"{v:.3f}" for v in metric_values],
                textposition='auto',
                hovertemplate=f'<b>%{{x}}</b><br>{metric.title()}: %{{y:.3f}}<extra></extra>'
            )])
            
            fig.update_layout(
                title=f'{metric.title()} Comparison Across Models',
                xaxis_title='Model',
                yaxis_title=metric.title(),
                height=400
            )
            
            fig = self._apply_base_styling(fig)
            return self.to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating metric comparison: {e}")
            return self.create_error_chart("Failed to create metric comparison")
    
    def create_training_time_comparison(self, models_data: List[Dict]) -> str:
        """Create training time comparison chart"""
        try:
            if not models_data:
                return self.create_error_chart("No training time data")
            
            model_names = [m.get('name', 'Unknown') for m in models_data]
            training_times = [m.get('training_time', 0) for m in models_data]
            colors = self._get_color_sequence(len(model_names))
            
            fig = go.Figure(data=[go.Bar(
                x=training_times,
                y=model_names,
                orientation='h',
                marker_color=colors,
                text=[f"{t:.1f}s" for t in training_times],
                textposition='auto',
                hovertemplate='<b>%{y}</b><br>Training Time: %{x:.1f}s<extra></extra>'
            )])
            
            fig.update_layout(
                title='Model Training Time Comparison',
                xaxis_title='Training Time (seconds)',
                yaxis_title='Model',
                height=400
            )
            
            fig = self._apply_base_styling(fig)
            return self.to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating training time comparison: {e}")
            return self.create_error_chart("Failed to create training time comparison")
    
    def create_multi_metric_comparison(self, models_data: List[Dict], 
                                     metrics: List[str] = ['accuracy', 'precision', 'recall', 'f1_score']) -> str:
        """Create grouped bar chart for multiple metrics"""
        try:
            if not models_data or not metrics:
                return self.create_error_chart("No data for multi-metric comparison")
            
            model_names = [m.get('name', 'Unknown') for m in models_data]
            colors = self._get_color_sequence(len(metrics))
            
            fig = go.Figure()
            
            for i, metric in enumerate(metrics):
                values = [m.get(metric, 0) for m in models_data]
                fig.add_trace(go.Bar(
                    name=metric.title(),
                    x=model_names,
                    y=values,
                    marker_color=colors[i],
                    hovertemplate=f'<b>%{{x}}</b><br>{metric.title()}: %{{y:.3f}}<extra></extra>'
                ))
            
            fig.update_layout(
                title='Multi-Metric Model Comparison',
                xaxis_title='Model',
                yaxis_title='Score',
                barmode='group',
                height=400
            )
            
            fig = self._apply_base_styling(fig)
            return self.to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating multi-metric comparison: {e}")
            return self.create_error_chart("Failed to create multi-metric comparison")
    
    def create_dataset_size_comparison(self, dataset_info: List[Dict]) -> str:
        """Create dataset size comparison chart"""
        try:
            if not dataset_info:
                return self.create_error_chart("No dataset information")
            
            dataset_names = [d.get('name', 'Unknown') for d in dataset_info]
            sizes = [d.get('size', 0) for d in dataset_info]
            colors = self._get_color_sequence(len(dataset_names))
            
            # Format sizes for display
            formatted_sizes = [self._format_number(s) for s in sizes]
            
            fig = go.Figure(data=[go.Bar(
                x=dataset_names,
                y=sizes,
                marker_color=colors,
                text=formatted_sizes,
                textposition='auto',
                hovertemplate='<b>%{x}</b><br>Size: %{text} records<extra></extra>'
            )])
            
            fig.update_layout(
                title='Dataset Size Comparison',
                xaxis_title='Dataset',
                yaxis_title='Number of Records',
                height=400
            )
            
            fig = self._apply_base_styling(fig)
            return self.to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating dataset size comparison: {e}")
            return self.create_error_chart("Failed to create dataset comparison")
    
    def create_roc_curve_comparison(self, roc_data: List[Dict]) -> str:
        """Create ROC curve comparison"""
        try:
            if not roc_data:
                return self.create_error_chart("No ROC curve data")
            
            fig = go.Figure()
            colors = self._get_color_sequence(len(roc_data))
            
            for i, roc in enumerate(roc_data):
                model_name = roc.get('name', f'Model {i+1}')
                fpr = roc.get('fpr', [])
                tpr = roc.get('tpr', [])
                auc = roc.get('auc', 0)
                
                fig.add_trace(go.Scatter(
                    x=fpr,
                    y=tpr,
                    mode='lines',
                    name=f'{model_name} (AUC = {auc:.3f})',
                    line=dict(color=colors[i]),
                    hovertemplate=f'<b>{model_name}</b><br>FPR: %{{x:.3f}}<br>TPR: %{{y:.3f}}<extra></extra>'
                ))
            
            # Add diagonal line
            fig.add_trace(go.Scatter(
                x=[0, 1],
                y=[0, 1],
                mode='lines',
                name='Random Classifier',
                line=dict(dash='dash', color='gray')
            ))
            
            fig.update_layout(
                title='ROC Curve Comparison',
                xaxis_title='False Positive Rate',
                yaxis_title='True Positive Rate',
                height=400
            )
            
            fig = self._apply_base_styling(fig)
            return self.to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating ROC comparison: {e}")
            return self.create_error_chart("Failed to create ROC comparison")