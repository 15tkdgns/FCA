#!/usr/bin/env python3
"""
XAI Visualization Module
Specialized chart generators for Explainable AI visualizations
"""

import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
import numpy as np
from typing import Dict, Any, Optional, List
import logging
from .base_chart import BaseChartGenerator

logger = logging.getLogger(__name__)

class XAIChartGenerator(BaseChartGenerator):
    """Specialized generator for XAI (Explainable AI) visualizations"""
    
    def create_shap_importance_chart(self, features: List[str], shap_values: List[float],
                                   title: str = None) -> str:
        """Create SHAP feature importance bar chart"""
        try:
            if len(features) != len(shap_values):
                return self.create_error_chart("Features and SHAP values must have same length")
            
            if not features or not shap_values:
                return self.create_error_chart("Empty features or SHAP values")
            
            # Determine colors based on positive/negative SHAP values
            colors = [self.xai_colors['positive_shap'] if val > 0 else self.xai_colors['negative_shap'] 
                     for val in shap_values]
            
            fig = go.Figure(data=[
                go.Bar(
                    y=features,
                    x=shap_values,
                    orientation='h',
                    marker=dict(color=colors, opacity=0.8),
                    hovertemplate='<b>%{y}</b><br>SHAP Value: %{x:.3f}<extra></extra>'
                )
            ])
            
            fig = self.apply_standard_layout(
                fig, title or 'SHAP Feature Importance', height=400,
                xaxis_title='SHAP Value',
                yaxis_title='Features'
            )
            
            # Add zero line
            fig.add_vline(x=0, line_dash="dash", line_color=self.color_palette['secondary'])
            
            return self.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating SHAP importance chart: {e}")
            return self.create_error_chart("SHAP importance chart generation failed")
    
    def create_shap_waterfall_chart(self, features: List[str], contributions: List[float], 
                                   base_value: float, title: str = None) -> str:
        """Create SHAP waterfall chart for individual prediction"""
        try:
            if len(features) != len(contributions):
                return self.create_error_chart("Features and contributions must have same length")
            
            if not features or not contributions:
                return self.create_error_chart("Empty features or contributions")
            
            # Prepare waterfall data
            labels = ['Base Value'] + features + ['Final Prediction']
            values = [base_value] + contributions + [base_value + sum(contributions)]
            
            # Calculate cumulative values for waterfall effect
            cumulative = [base_value]
            for contrib in contributions:
                cumulative.append(cumulative[-1] + contrib)
            cumulative.append(cumulative[-1])  # Final prediction
            
            fig = go.Figure(go.Waterfall(
                name="SHAP Values",
                orientation="v",
                measure=["absolute"] + ["relative"] * len(features) + ["total"],
                x=labels,
                textposition="outside",
                text=[f"{v:.3f}" for v in values],
                y=values,
                connector={"line": {"color": self.color_palette['secondary']}},
                increasing={"marker": {"color": self.xai_colors['positive_shap']}},
                decreasing={"marker": {"color": self.xai_colors['negative_shap']}},
                totals={"marker": {"color": self.color_palette['primary']}}
            ))
            
            fig = self.apply_standard_layout(
                fig, title or "SHAP Waterfall Plot", height=400,
                xaxis_title="Features",
                yaxis_title="SHAP Value"
            )
            
            return self.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating SHAP waterfall chart: {e}")
            return self.create_error_chart("SHAP waterfall chart generation failed")
    
    def create_shap_summary_plot(self, shap_data: Dict[str, List[float]], feature_values: Dict[str, List[float]] = None,
                                title: str = None) -> str:
        """Create SHAP summary plot showing distribution of SHAP values"""
        try:
            if not shap_data:
                return self.create_error_chart("Empty SHAP data")
            
            features = list(shap_data.keys())
            fig = go.Figure()
            
            for idx, feature in enumerate(features):
                shap_vals = shap_data[feature]
                if not shap_vals:
                    continue
                
                # Use feature values for coloring if provided
                if feature_values and feature in feature_values:
                    colors = feature_values[feature]
                    colorscale = 'RdYlBu'
                else:
                    colors = self.color_palette['primary']
                    colorscale = None
                
                fig.add_trace(go.Scatter(
                    x=shap_vals,
                    y=[idx] * len(shap_vals),
                    mode='markers',
                    marker=dict(
                        size=4,
                        color=colors,
                        colorscale=colorscale,
                        showscale=idx == 0 and colorscale is not None,
                        colorbar=dict(title='Feature Value', titleside='right') if idx == 0 and colorscale else None,
                        opacity=0.7
                    ),
                    name=feature,
                    showlegend=False,
                    hovertemplate=f'<b>{feature}</b><br>SHAP: %{{x:.3f}}<extra></extra>'
                ))
            
            fig = self.apply_standard_layout(
                fig, title or 'SHAP Summary Plot', height=400,
                xaxis_title='SHAP Value',
                yaxis=dict(
                    title='Features',
                    tickmode='array',
                    tickvals=list(range(len(features))),
                    ticktext=features
                )
            )
            
            # Add zero line
            fig.add_vline(x=0, line_dash="dash", line_color=self.color_palette['secondary'])
            
            return self.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating SHAP summary plot: {e}")
            return self.create_error_chart("SHAP summary plot generation failed")
    
    def create_lime_explanation_chart(self, features: List[str], contributions: List[float],
                                     title: str = None) -> str:
        """Create LIME local explanation chart"""
        try:
            if len(features) != len(contributions):
                return self.create_error_chart("Features and contributions must have same length")
            
            if not features or not contributions:
                return self.create_error_chart("Empty features or contributions")
            
            # Sort by absolute contribution for better visualization
            sorted_data = sorted(zip(features, contributions), key=lambda x: abs(x[1]), reverse=True)
            sorted_features, sorted_contributions = zip(*sorted_data)
            
            colors = [self.xai_colors['positive_shap'] if val > 0 else self.xai_colors['negative_shap'] 
                     for val in sorted_contributions]
            
            fig = go.Figure(data=[
                go.Bar(
                    y=list(sorted_features),
                    x=list(sorted_contributions),
                    orientation='h',
                    marker=dict(color=colors, opacity=0.8),
                    hovertemplate='<b>%{y}</b><br>Contribution: %{x:.3f}<extra></extra>'
                )
            ])
            
            fig = self.apply_standard_layout(
                fig, title or 'LIME Local Explanation', height=350,
                xaxis_title='Feature Contribution',
                yaxis_title='Features'
            )
            
            # Add zero line
            fig.add_vline(x=0, line_dash="dash", line_color=self.color_palette['secondary'])
            
            return self.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating LIME explanation chart: {e}")
            return self.create_error_chart("LIME explanation chart generation failed")
    
    def create_partial_dependence_plot(self, feature_values: List[float], pd_values: List[float], 
                                      feature_name: str, title: str = None) -> str:
        """Create Partial Dependence Plot"""
        try:
            if len(feature_values) != len(pd_values):
                return self.create_error_chart("Feature values and PD values must have same length")
            
            if not feature_values or not pd_values:
                return self.create_error_chart("Empty feature or PD values")
            
            fig = go.Figure(data=[
                go.Scatter(
                    x=feature_values,
                    y=pd_values,
                    mode='lines+markers',
                    line=dict(color=self.color_palette['primary'], width=3),
                    marker=dict(color=self.color_palette['primary'], size=6, opacity=0.7),
                    hovertemplate=f'<b>{feature_name}: %{{x}}</b><br>Effect: %{{y:.3f}}<extra></extra>'
                )
            ])
            
            fig = self.apply_standard_layout(
                fig, title or f'Partial Dependence: {feature_name}', height=350,
                xaxis_title=feature_name,
                yaxis_title='Partial Dependence'
            )
            
            return self.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating partial dependence plot: {e}")
            return self.create_error_chart("Partial dependence plot generation failed")
    
    def create_interpretability_radar_chart(self, domains: List[str], metrics: Dict[str, List[float]],
                                          title: str = None) -> str:
        """Create interpretability comparison radar chart"""
        try:
            if not domains or not metrics:
                return self.create_error_chart("Empty domains or metrics")
            
            metric_names = list(metrics.keys())
            if not metric_names:
                return self.create_error_chart("No metrics provided")
            
            # Validate that all metrics have same number of values as domains
            for metric, values in metrics.items():
                if len(values) != len(domains):
                    return self.create_error_chart(f"Metric {metric} has {len(values)} values but {len(domains)} domains")
            
            colors = self.get_categorical_colors(len(domains))
            data = []
            
            for i, domain in enumerate(domains):
                values = [metrics[metric][i] for metric in metric_names]
                
                # Close the polygon by adding first value at the end
                values_closed = values + [values[0]]
                theta_closed = metric_names + [metric_names[0]]
                
                data.append(go.Scatterpolar(
                    r=values_closed,
                    theta=theta_closed,
                    fill='toself',
                    name=domain,
                    marker=dict(color=colors[i]),
                    fillcolor=f'rgba{(*px.colors.hex_to_rgb(colors[i]), 0.1)}',
                    hovertemplate=f'<b>{domain}</b><br>%{{theta}}: %{{r}}<extra></extra>'
                ))
            
            fig = go.Figure(data=data)
            
            fig.update_layout(
                polar=dict(
                    radialaxis=dict(
                        visible=True,
                        range=[0, 100],
                        gridcolor=self.color_palette['border'] if 'border' in self.color_palette else '#e5e7eb'
                    ),
                    angularaxis=dict(
                        gridcolor=self.color_palette['border'] if 'border' in self.color_palette else '#e5e7eb'
                    )
                ),
                title=title or 'Model Interpretability Comparison',
                template='plotly_white',
                showlegend=True,
                legend=dict(orientation="h", yanchor="bottom", y=-0.1, xanchor="center", x=0.5),
                height=400
            )
            
            return self.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating interpretability radar chart: {e}")
            return self.create_error_chart("Interpretability radar chart generation failed")
    
    def create_feature_importance_pie_chart(self, features: List[str], importance: List[float],
                                          title: str = None) -> str:
        """Create feature importance pie chart"""
        try:
            if len(features) != len(importance):
                return self.create_error_chart("Features and importance must have same length")
            
            if not features or not importance:
                return self.create_error_chart("Empty features or importance values")
            
            colors = self.get_categorical_colors(len(features))
            
            fig = go.Figure(data=[
                go.Pie(
                    labels=features,
                    values=importance,
                    hole=0.4,
                    marker=dict(colors=colors, line=dict(color='#ffffff', width=2)),
                    textinfo='label+percent',
                    textposition='outside',
                    hovertemplate='<b>%{label}</b><br>Importance: %{value:.3f}<br>Percentage: %{percent}<extra></extra>'
                )
            ])
            
            fig = self.apply_standard_layout(
                fig, title or 'Global Feature Importance Distribution', height=400
            )
            
            return self.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating feature importance pie chart: {e}")
            return self.create_error_chart("Feature importance pie chart generation failed")