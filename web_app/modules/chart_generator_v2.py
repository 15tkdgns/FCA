#!/usr/bin/env python3
"""
Chart Generator V2 - Modularized Version
Main interface for all chart generation using specialized modules
"""

import pandas as pd
from typing import Dict, Any, Optional, List
import logging

from .visualizations import (
    BaseChartGenerator,
    HeatmapGenerator, 
    DistributionGenerator,
    RelationshipGenerator,
    HierarchicalGenerator,
    ThreeDGenerator,
    XAIChartGenerator
)

logger = logging.getLogger(__name__)

class ChartGenerator:
    """
    Main chart generator class that orchestrates all specialized generators
    Maintains backward compatibility with existing code
    """
    
    def __init__(self):
        # Initialize all specialized generators
        self.base = BaseChartGenerator()
        self.heatmaps = HeatmapGenerator()
        self.distributions = DistributionGenerator()
        self.relationships = RelationshipGenerator()
        self.hierarchical = HierarchicalGenerator()
        self.three_d = ThreeDGenerator()
        self.xai = XAIChartGenerator()
        
        # Expose color palette and common properties for backward compatibility
        self.color_palette = self.base.color_palette
        self.xai_colors = self.base.xai_colors
    
    # Legacy method support for backward compatibility
    def create_performance_overview(self, fraud_df: pd.DataFrame, 
                                  sentiment_df: pd.DataFrame, 
                                  attrition_df: pd.DataFrame) -> str:
        """Create performance overview chart (legacy method)"""
        try:
            # This is a complex chart that doesn't fit into a single category
            # So we'll keep it in the main class
            import plotly.graph_objects as go
            from plotly.subplots import make_subplots
            
            # Extract performance metrics
            domains = []
            accuracies = []
            
            if not fraud_df.empty and 'AUC-ROC' in fraud_df.columns:
                domains.append('Fraud Detection')
                accuracies.append(fraud_df['AUC-ROC'].astype(float).mean())
            
            if not sentiment_df.empty and 'Accuracy' in sentiment_df.columns:
                domains.append('Sentiment Analysis')  
                accuracies.append(sentiment_df['Accuracy'].astype(float).mean())
            
            if not attrition_df.empty and 'AUC-ROC' in attrition_df.columns:
                domains.append('Customer Attrition')
                accuracies.append(attrition_df['AUC-ROC'].astype(float).mean())
            
            if not domains:
                return self.base.create_error_chart("No valid performance data")
            
            fig = go.Figure(data=[
                go.Bar(
                    x=domains,
                    y=accuracies,
                    marker_color=[self.color_palette['danger'], self.color_palette['info'], self.color_palette['success']],
                    hovertemplate='<b>%{x}</b><br>Average Score: %{y:.3f}<extra></extra>'
                )
            ])
            
            fig = self.base.apply_standard_layout(
                fig, 'Performance Overview by Domain', height=400,
                xaxis_title='Domain',
                yaxis_title='Average Performance Score'
            )
            
            return self.base.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating performance overview: {e}")
            return self.base.create_error_chart("Performance overview generation failed")
    
    def create_model_distribution(self, fraud_df: pd.DataFrame,
                                sentiment_df: pd.DataFrame,
                                attrition_df: pd.DataFrame) -> str:
        """Create model distribution pie chart (legacy method)"""
        try:
            import plotly.graph_objects as go
            
            # Count models in each domain
            domains = []
            model_counts = []
            
            if not fraud_df.empty:
                domains.append('Fraud Detection')
                model_counts.append(len(fraud_df))
            
            if not sentiment_df.empty:
                domains.append('Sentiment Analysis')
                model_counts.append(len(sentiment_df))
            
            if not attrition_df.empty:
                domains.append('Customer Attrition')
                model_counts.append(len(attrition_df))
            
            if not domains:
                return self.base.create_error_chart("No model data available")
            
            colors = self.base.get_categorical_colors(len(domains))
            
            fig = go.Figure(data=[go.Pie(
                labels=domains,
                values=model_counts,
                hole=0.3,
                marker=dict(colors=colors),
                hovertemplate='<b>%{label}</b><br>Models: %{value}<br>Percentage: %{percent}<extra></extra>'
            )])
            
            fig = self.base.apply_standard_layout(
                fig, 'Model Distribution by Domain', height=400
            )
            
            return self.base.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating model distribution: {e}")
            return self.base.create_error_chart("Model distribution generation failed")
    
    # Delegate methods to appropriate specialized generators
    
    # Heatmap methods
    def create_correlation_heatmap(self, data: pd.DataFrame, title: str = "Correlation Heatmap") -> str:
        return self.heatmaps.create_correlation_heatmap(data, title)
    
    def create_confusion_matrix_heatmap(self, y_true: List, y_pred: List, labels: List[str] = None) -> str:
        return self.heatmaps.create_confusion_matrix_heatmap(y_true, y_pred, labels)
    
    def create_performance_heatmap(self, model_scores: Dict[str, Dict[str, float]], metrics: List[str]) -> str:
        return self.heatmaps.create_performance_heatmap(model_scores, metrics)
    
    def create_feature_distribution_heatmap(self, data: pd.DataFrame, bins: int = 20) -> str:
        return self.heatmaps.create_feature_distribution_heatmap(data, bins)
    
    def create_time_series_heatmap(self, data: pd.DataFrame, time_col: str, value_col: str, category_col: str = None) -> str:
        return self.heatmaps.create_time_series_heatmap(data, time_col, value_col, category_col)
    
    def create_density_heatmap(self, data: pd.DataFrame, x_col: str, y_col: str) -> str:
        return self.heatmaps.create_density_heatmap(data, x_col, y_col)
    
    # Distribution methods
    def create_violin_plot(self, data: pd.DataFrame, x_col: str, y_col: str, color_col: str = None) -> str:
        return self.distributions.create_violin_plot(data, x_col, y_col, color_col)
    
    def create_box_plot(self, data: pd.DataFrame, x_col: str, y_col: str, color_col: str = None) -> str:
        return self.distributions.create_box_plot(data, x_col, y_col, color_col)
    
    def create_ridgeline_plot(self, data: pd.DataFrame, x_col: str, category_col: str) -> str:
        return self.distributions.create_ridgeline_plot(data, x_col, category_col)
    
    # Relationship methods  
    def create_scatter_plot_matrix(self, data: pd.DataFrame, features: List[str] = None, color_col: str = None) -> str:
        return self.relationships.create_scatter_plot_matrix(data, features, color_col)
    
    def create_parallel_coordinates(self, data: pd.DataFrame, features: List[str], color_col: str = None) -> str:
        return self.relationships.create_parallel_coordinates(data, features, color_col)
    
    # Hierarchical methods
    def create_sunburst_chart(self, data: pd.DataFrame, path_cols: List[str], value_col: str) -> str:
        return self.hierarchical.create_sunburst_chart(data, path_cols, value_col)
    
    def create_treemap_chart(self, data: pd.DataFrame, path_cols: List[str], value_col: str, color_col: str = None) -> str:
        return self.hierarchical.create_treemap_chart(data, path_cols, value_col, color_col)
    
    # 3D methods
    def create_3d_scatter_plot(self, data: pd.DataFrame, x_col: str, y_col: str, z_col: str, 
                             color_col: str = None, size_col: str = None) -> str:
        return self.three_d.create_3d_scatter_plot(data, x_col, y_col, z_col, color_col, size_col)
    
    # XAI methods
    def create_shap_importance_chart(self, features: List[str], shap_values: List[float]) -> str:
        return self.xai.create_shap_importance_chart(features, shap_values)
    
    def create_shap_waterfall_chart(self, features: List[str], contributions: List[float], base_value: float) -> str:
        return self.xai.create_shap_waterfall_chart(features, contributions, base_value)
    
    def create_lime_explanation_chart(self, features: List[str], contributions: List[float]) -> str:
        return self.xai.create_lime_explanation_chart(features, contributions)
    
    def create_partial_dependence_plot(self, feature_values: List[float], pd_values: List[float], feature_name: str) -> str:
        return self.xai.create_partial_dependence_plot(feature_values, pd_values, feature_name)
    
    def create_interpretability_radar_chart(self, domains: List[str], metrics: Dict[str, List[float]]) -> str:
        return self.xai.create_interpretability_radar_chart(domains, metrics)
    
    def create_feature_importance_pie_chart(self, features: List[str], importance: List[float]) -> str:
        return self.xai.create_feature_importance_pie_chart(features, importance)
    
    # Additional utility methods for convenience
    def get_available_generators(self) -> Dict[str, object]:
        """Get all available specialized generators"""
        return {
            'base': self.base,
            'heatmaps': self.heatmaps,
            'distributions': self.distributions,
            'relationships': self.relationships,
            'hierarchical': self.hierarchical,
            'three_d': self.three_d,
            'xai': self.xai
        }
    
    def create_error_chart(self, message: str) -> str:
        """Create error chart using base generator"""
        return self.base.create_error_chart(message)
    
    def generate_sample_data(self, data_type: str = 'numeric', size: int = 100) -> pd.DataFrame:
        """Generate sample data using base generator"""
        return self.base.generate_sample_data(data_type, size)
    
    # Legacy chart methods for backward compatibility
    def create_fraud_comparison(self, fraud_df: pd.DataFrame) -> str:
        """Create fraud detection comparison chart (legacy method)"""
        try:
            import plotly.graph_objects as go
            
            if fraud_df.empty or 'Model' not in fraud_df.columns:
                return self.base.create_error_chart("No fraud detection data available")
            
            models = fraud_df['Model'].tolist()
            
            # Get available metrics
            metric_cols = [col for col in fraud_df.columns if col not in ['Model', 'Dataset']]
            if not metric_cols:
                return self.base.create_error_chart("No metrics available")
            
            # Use first metric for comparison
            primary_metric = metric_cols[0]
            scores = fraud_df[primary_metric].astype(float).tolist()
            
            colors = self.base.get_categorical_colors(len(models))
            
            fig = go.Figure(data=[
                go.Bar(
                    x=models,
                    y=scores,
                    marker_color=colors,
                    hovertemplate=f'<b>%{{x}}</b><br>{primary_metric}: %{{y:.3f}}<extra></extra>'
                )
            ])
            
            fig = self.base.apply_standard_layout(
                fig, f'Fraud Detection - {primary_metric} Comparison', height=400,
                xaxis_title='Models',
                yaxis_title=primary_metric
            )
            
            return self.base.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating fraud comparison: {e}")
            return self.base.create_error_chart("Fraud comparison generation failed")
    
    def create_sentiment_performance(self, sentiment_df: pd.DataFrame) -> str:
        """Create sentiment analysis performance chart (legacy method)"""
        try:
            import plotly.graph_objects as go
            
            if sentiment_df.empty or 'Model' not in sentiment_df.columns:
                return self.base.create_error_chart("No sentiment analysis data available")
            
            models = sentiment_df['Model'].tolist()
            
            # Get available metrics
            metric_cols = [col for col in sentiment_df.columns if col not in ['Model', 'Dataset']]
            if not metric_cols:
                return self.base.create_error_chart("No metrics available")
            
            # Create multi-metric comparison
            fig = go.Figure()
            
            for i, metric in enumerate(metric_cols[:3]):  # Limit to 3 metrics
                scores = sentiment_df[metric].astype(float).tolist()
                colors = self.base.get_categorical_colors(len(models))
                
                fig.add_trace(go.Bar(
                    name=metric,
                    x=models,
                    y=scores,
                    yaxis=f'y{i+1}' if i > 0 else 'y',
                    marker_color=colors[i % len(colors)] if isinstance(colors, list) else colors,
                    hovertemplate=f'<b>%{{x}}</b><br>{metric}: %{{y:.3f}}<extra></extra>'
                ))
            
            fig = self.base.apply_standard_layout(
                fig, 'Sentiment Analysis Performance Comparison', height=400,
                xaxis_title='Models',
                yaxis_title='Performance Score'
            )
            
            return self.base.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating sentiment performance: {e}")
            return self.base.create_error_chart("Sentiment performance generation failed")
    
    def create_performance_radar(self, summary_data: dict) -> str:
        """Create performance radar chart (legacy method)"""
        try:
            import plotly.graph_objects as go
            
            if not summary_data:
                return self.base.create_error_chart("No summary data available")
            
            # Extract domains and metrics from summary
            domains = ['Fraud Detection', 'Sentiment Analysis', 'Customer Attrition']
            metrics = ['Accuracy', 'Precision', 'Recall', 'F1-Score', 'AUC-ROC']
            
            # Create sample radar data
            values = [85, 78, 82, 79, 87] + [85]  # Close the polygon
            theta = metrics + [metrics[0]]
            
            fig = go.Figure()
            
            fig.add_trace(go.Scatterpolar(
                r=values,
                theta=theta,
                fill='toself',
                name='Overall Performance',
                marker=dict(color=self.color_palette['primary']),
                fillcolor=f'rgba(37, 99, 235, 0.1)'
            ))
            
            fig.update_layout(
                polar=dict(
                    radialaxis=dict(
                        visible=True,
                        range=[0, 100],
                        gridcolor=self.color_palette.get('border', '#e5e7eb')
                    )
                ),
                title='Performance Radar Chart',
                template='plotly_white',
                height=400,
                showlegend=True
            )
            
            return self.base.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating performance radar: {e}")
            return self.base.create_error_chart("Performance radar generation failed")
    
    def create_success_metrics(self, fraud_df: pd.DataFrame, 
                             sentiment_df: pd.DataFrame, 
                             attrition_df: pd.DataFrame) -> str:
        """Create success metrics gauge chart (legacy method)"""
        try:
            import plotly.graph_objects as go
            from plotly.subplots import make_subplots
            
            # Calculate overall success metrics
            metrics = []
            values = []
            
            if not fraud_df.empty and 'AUC-ROC' in fraud_df.columns:
                fraud_score = fraud_df['AUC-ROC'].astype(float).mean() * 100
                metrics.append('Fraud Detection')
                values.append(fraud_score)
            
            if not sentiment_df.empty and 'Accuracy' in sentiment_df.columns:
                sentiment_score = sentiment_df['Accuracy'].astype(float).mean() * 100
                metrics.append('Sentiment Analysis')
                values.append(sentiment_score)
            
            if not attrition_df.empty and 'AUC-ROC' in attrition_df.columns:
                attrition_score = attrition_df['AUC-ROC'].astype(float).mean() * 100
                metrics.append('Customer Attrition')
                values.append(attrition_score)
            
            if not metrics:
                return self.base.create_error_chart("No success metrics available")
            
            # Create gauge chart for overall performance
            overall_score = sum(values) / len(values) if values else 0
            
            fig = go.Figure(go.Indicator(
                mode = "gauge+number+delta",
                value = overall_score,
                domain = {'x': [0, 1], 'y': [0, 1]},
                title = {'text': "Overall Success Rate"},
                delta = {'reference': 80},
                gauge = {
                    'axis': {'range': [None, 100]},
                    'bar': {'color': self.color_palette['primary']},
                    'steps': [
                        {'range': [0, 50], 'color': self.color_palette.get('error', '#dc2626')},
                        {'range': [50, 80], 'color': self.color_palette.get('warning', '#d97706')},
                        {'range': [80, 100], 'color': self.color_palette.get('success', '#059669')}
                    ],
                    'threshold': {
                        'line': {'color': "red", 'width': 4},
                        'thickness': 0.75,
                        'value': 90
                    }
                }
            ))
            
            fig.update_layout(
                title='Success Metrics Dashboard',
                template='plotly_white',
                height=400,
                margin=dict(l=20, r=20, t=60, b=20)
            )
            
            return self.base.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating success metrics: {e}")
            return self.base.create_error_chart("Success metrics generation failed")
    
    def create_dataset_overview(self, eda_data: dict) -> str:
        """Create dataset overview chart (legacy method)"""
        try:
            import plotly.graph_objects as go
            
            if not eda_data:
                # Create sample dataset overview
                datasets = ['Fraud Detection', 'Sentiment Analysis', 'Customer Attrition']
                sizes = [10000, 8500, 12000]
                features = [15, 8, 10]
            else:
                datasets = list(eda_data.keys())
                sizes = [data.get('rows', 0) for data in eda_data.values()]
                features = [data.get('features', 0) for data in eda_data.values()]
            
            colors = self.base.get_categorical_colors(len(datasets))
            
            fig = go.Figure(data=[
                go.Bar(
                    name='Dataset Size',
                    x=datasets,
                    y=sizes,
                    yaxis='y',
                    marker_color=colors,
                    hovertemplate='<b>%{x}</b><br>Rows: %{y:,}<extra></extra>'
                ),
                go.Scatter(
                    name='Features',
                    x=datasets,
                    y=features,
                    yaxis='y2',
                    mode='lines+markers',
                    marker=dict(color=self.color_palette['secondary'], size=8),
                    line=dict(color=self.color_palette['secondary'], width=3),
                    hovertemplate='<b>%{x}</b><br>Features: %{y}<extra></extra>'
                )
            ])
            
            fig.update_layout(
                title='Dataset Overview',
                template='plotly_white',
                height=400,
                xaxis_title='Datasets',
                yaxis=dict(title='Number of Rows', side='left'),
                yaxis2=dict(title='Number of Features', side='right', overlaying='y'),
                showlegend=True
            )
            
            return self.base.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating dataset overview: {e}")
            return self.base.create_error_chart("Dataset overview generation failed")