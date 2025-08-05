#!/usr/bin/env python3
"""
XAI Charts Module
=================

Chart generators for Explainable AI (XAI) visualization
"""

import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
from typing import Dict, Any, Optional, List
import logging

from .base_chart import BaseChart

logger = logging.getLogger(__name__)

class XAIChartGenerator(BaseChart):
    """Generate XAI-related charts"""
    
    def __init__(self):
        super().__init__()
        # XAI-specific color schemes
        self.xai_colors = {
            'positive_shap': '#059669',
            'negative_shap': '#dc2626', 
            'neutral': '#64748b',
            'feature_high': '#2563eb',
            'feature_low': '#d97706'
        }
    
    def create_shap_summary_plot(self, shap_values: List[Dict]) -> str:
        """Create SHAP summary plot"""
        try:
            if not shap_values:
                return self.create_error_chart("No SHAP values available")
            
            features = [s.get('feature', 'Unknown') for s in shap_values]
            values = [s.get('shap_value', 0) for s in shap_values]
            
            # Color based on positive/negative impact
            colors = [self.xai_colors['positive_shap'] if v > 0 
                     else self.xai_colors['negative_shap'] for v in values]
            
            fig = go.Figure(data=[go.Bar(
                x=values,
                y=features,
                orientation='h',
                marker_color=colors,
                text=[f"{v:.3f}" for v in values],
                textposition='auto',
                hovertemplate='<b>%{y}</b><br>SHAP Value: %{x:.3f}<extra></extra>'
            )])
            
            fig.update_layout(
                title='SHAP Feature Importance',
                xaxis_title='SHAP Value',
                yaxis_title='Feature',
                height=400
            )
            
            fig = self._apply_base_styling(fig)
            return self.to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating SHAP summary plot: {e}")
            return self.create_error_chart("Failed to create SHAP visualization")
    
    def create_feature_importance_waterfall(self, importance_data: List[Dict]) -> str:
        """Create waterfall chart for feature importance"""
        try:
            if not importance_data:
                return self.create_error_chart("No importance data available")
            
            features = [d.get('feature', 'Unknown') for d in importance_data]
            values = [d.get('importance', 0) for d in importance_data]
            
            fig = go.Figure()
            
            # Create waterfall effect
            cumulative = 0
            for i, (feature, value) in enumerate(zip(features, values)):
                color = self.xai_colors['positive_shap'] if value > 0 else self.xai_colors['negative_shap']
                
                fig.add_trace(go.Bar(
                    x=[feature],
                    y=[abs(value)],
                    base=cumulative if value > 0 else cumulative + value,
                    name=feature,
                    marker_color=color,
                    hovertemplate=f'<b>{feature}</b><br>Importance: {value:.3f}<extra></extra>',
                    showlegend=False
                ))
                
                cumulative += value
            
            fig.update_layout(
                title='Feature Importance Waterfall',
                xaxis_title='Feature',
                yaxis_title='Cumulative Importance',
                height=400
            )
            
            fig = self._apply_base_styling(fig)
            return self.to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating waterfall chart: {e}")
            return self.create_error_chart("Failed to create waterfall chart")
    
    def create_decision_boundary_plot(self, decision_data: Dict) -> str:
        """Create decision boundary visualization"""
        try:
            if not decision_data:
                return self.create_error_chart("No decision boundary data")
            
            x_data = decision_data.get('x', [])
            y_data = decision_data.get('y', [])
            predictions = decision_data.get('predictions', [])
            
            if not all([x_data, y_data, predictions]):
                return self.create_error_chart("Incomplete decision boundary data")
            
            # Create scatter plot with color based on predictions
            fig = go.Figure()
            
            unique_predictions = list(set(predictions))
            colors = self._get_color_sequence(len(unique_predictions))
            
            for i, pred in enumerate(unique_predictions):
                mask = [p == pred for p in predictions]
                x_subset = [x for j, x in enumerate(x_data) if mask[j]]
                y_subset = [y for j, y in enumerate(y_data) if mask[j]]
                
                fig.add_trace(go.Scatter(
                    x=x_subset,
                    y=y_subset,
                    mode='markers',
                    name=f'Class {pred}',
                    marker=dict(color=colors[i], size=8),
                    hovertemplate=f'<b>Class {pred}</b><br>X: %{{x:.2f}}<br>Y: %{{y:.2f}}<extra></extra>'
                ))
            
            fig.update_layout(
                title='Decision Boundary Visualization',
                xaxis_title='Feature 1',
                yaxis_title='Feature 2',
                height=400
            )
            
            fig = self._apply_base_styling(fig)
            return self.to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating decision boundary plot: {e}")
            return self.create_error_chart("Failed to create decision boundary")
    
    def create_partial_dependence_plot(self, pdp_data: List[Dict]) -> str:
        """Create partial dependence plot"""
        try:
            if not pdp_data:
                return self.create_error_chart("No partial dependence data")
            
            fig = make_subplots(
                rows=len(pdp_data), cols=1,
                subplot_titles=[d.get('feature', 'Unknown') for d in pdp_data],
                vertical_spacing=0.1
            )
            
            for i, data in enumerate(pdp_data):
                feature_values = data.get('feature_values', [])
                dependence_values = data.get('dependence_values', [])
                
                fig.add_trace(
                    go.Scatter(
                        x=feature_values,
                        y=dependence_values,
                        mode='lines+markers',
                        name=data.get('feature', 'Unknown'),
                        line=dict(color=self.color_palette['primary']),
                        hovertemplate='Value: %{x}<br>Dependence: %{y:.3f}<extra></extra>'
                    ),
                    row=i+1, col=1
                )
            
            fig.update_layout(
                title='Partial Dependence Plots',
                height=max(400, len(pdp_data) * 200),
                showlegend=False
            )
            
            fig = self._apply_base_styling(fig)
            return self.to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating partial dependence plot: {e}")
            return self.create_error_chart("Failed to create partial dependence plot")
    
    def create_lime_explanation(self, lime_data: Dict) -> str:
        """Create LIME explanation visualization"""
        try:
            if not lime_data:
                return self.create_error_chart("No LIME explanation data")
            
            features = lime_data.get('features', [])
            weights = lime_data.get('weights', [])
            
            if not features or not weights:
                return self.create_error_chart("Incomplete LIME data")
            
            # Color based on positive/negative contribution
            colors = [self.xai_colors['positive_shap'] if w > 0 
                     else self.xai_colors['negative_shap'] for w in weights]
            
            fig = go.Figure(data=[go.Bar(
                x=weights,
                y=features,
                orientation='h',
                marker_color=colors,
                text=[f"{w:.3f}" for w in weights],
                textposition='auto',
                hovertemplate='<b>%{y}</b><br>Weight: %{x:.3f}<extra></extra>'
            )])
            
            fig.update_layout(
                title='LIME Feature Explanation',
                xaxis_title='Feature Weight',
                yaxis_title='Feature',
                height=400
            )
            
            fig = self._apply_base_styling(fig)
            return self.to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating LIME explanation: {e}")
            return self.create_error_chart("Failed to create LIME explanation")
    
    def create_model_confidence_plot(self, confidence_data: List[Dict]) -> str:
        """Create model confidence distribution plot"""
        try:
            if not confidence_data:
                return self.create_error_chart("No confidence data available")
            
            confidences = [d.get('confidence', 0) for d in confidence_data]
            predictions = [d.get('prediction', 'Unknown') for d in confidence_data]
            
            fig = go.Figure()
            
            unique_predictions = list(set(predictions))
            colors = self._get_color_sequence(len(unique_predictions))
            
            for i, pred in enumerate(unique_predictions):
                pred_confidences = [conf for conf, p in zip(confidences, predictions) if p == pred]
                
                fig.add_trace(go.Histogram(
                    x=pred_confidences,
                    name=f'{pred}',
                    marker_color=colors[i],
                    opacity=0.7,
                    hovertemplate=f'<b>{pred}</b><br>Confidence: %{{x:.3f}}<br>Count: %{{y}}<extra></extra>'
                ))
            
            fig.update_layout(
                title='Model Confidence Distribution',
                xaxis_title='Confidence Score',
                yaxis_title='Frequency',
                barmode='overlay',
                height=400
            )
            
            fig = self._apply_base_styling(fig)
            return self.to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating confidence plot: {e}")
            return self.create_error_chart("Failed to create confidence plot")