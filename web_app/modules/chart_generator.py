#!/usr/bin/env python3
"""
Chart Generator Module
Creates interactive charts and visualizations for web display
"""

import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import json
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class ChartGenerator:
    """Generate interactive charts using Plotly"""
    
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
        
        # XAI-specific color schemes
        self.xai_colors = {
            'positive_shap': '#059669',
            'negative_shap': '#dc2626',
            'neutral': '#64748b',
            'feature_high': '#2563eb',
            'feature_low': '#d97706'
        }
    
    def create_performance_overview(self, fraud_df: pd.DataFrame, 
                                  sentiment_df: pd.DataFrame, 
                                  attrition_df: pd.DataFrame) -> str:
        """Create overview performance chart"""
        try:
            # Calculate average performance by domain
            fraud_avg = fraud_df['AUC-ROC'].astype(float).mean()
            sentiment_avg = sentiment_df['Accuracy'].astype(float).mean()
            attrition_avg = attrition_df['AUC-ROC'].astype(float).mean()
            
            domains = ['Fraud Detection', 'Sentiment Analysis', 'Customer Attrition']
            scores = [fraud_avg, sentiment_avg, attrition_avg]
            colors = [self.color_palette['primary'], self.color_palette['secondary'], self.color_palette['success']]
            
            fig = go.Figure(data=[
                go.Bar(
                    x=domains,
                    y=scores,
                    text=[f'{score:.3f}' for score in scores],
                    textposition='outside',
                    marker_color=colors,
                    name='Average Performance'
                )
            ])
            
            fig.update_layout(
                title={
                    'text': 'Model Performance Overview by Domain',
                    'font': {'size': 16, 'color': self.color_palette['accent']}
                },
                xaxis_title='Analysis Domain',
                yaxis_title='Performance Score',
                yaxis=dict(range=[0, 1.1]),
                template='plotly_white',
                height=400,
                font={'family': 'Inter, sans-serif', 'color': self.color_palette['secondary']},
                plot_bgcolor='rgba(0,0,0,0)',
                paper_bgcolor='rgba(0,0,0,0)'
            )
            
            return fig.to_json()
            
        except Exception as e:
            logger.error(f"Error creating performance overview: {e}")
            return "{}"
    
    def create_fraud_comparison(self, fraud_df: pd.DataFrame) -> str:
        """Create fraud detection model comparison chart"""
        try:
            fig = px.bar(
                fraud_df,
                x='Model',
                y='AUC-ROC',
                color='Dataset',
                title='Fraud Detection Models Performance',
                text='AUC-ROC',
                height=500
            )
            
            fig.update_traces(texttemplate='%{text:.3f}', textposition='outside')
            fig.update_layout(
                xaxis_title='Model Type',
                yaxis_title='AUC-ROC Score',
                yaxis=dict(range=[0, 1.1]),
                template='plotly_white'
            )
            
            return fig.to_json()
            
        except Exception as e:
            logger.error(f"Error creating fraud comparison: {e}")
            return "{}"
    
    def create_sentiment_performance(self, sentiment_df: pd.DataFrame) -> str:
        """Create sentiment analysis performance chart"""
        try:
            # Melt the dataframe for better visualization
            metrics = ['Accuracy', 'Macro F1', 'Weighted F1']
            melted_df = pd.melt(
                sentiment_df, 
                id_vars=['Model'], 
                value_vars=metrics,
                var_name='Metric', 
                value_name='Score'
            )
            melted_df['Score'] = melted_df['Score'].astype(float)
            
            fig = px.bar(
                melted_df,
                x='Model',
                y='Score',
                color='Metric',
                title='Sentiment Analysis Model Performance',
                text='Score',
                height=450,
                barmode='group'
            )
            
            fig.update_traces(texttemplate='%{text:.3f}', textposition='outside')
            fig.update_layout(
                xaxis_title='Model Type',
                yaxis_title='Performance Score',
                yaxis=dict(range=[0, 1.1]),
                template='plotly_white'
            )
            
            return fig.to_json()
            
        except Exception as e:
            logger.error(f"Error creating sentiment performance: {e}")
            return "{}"
    
    def create_model_distribution(self, fraud_df: pd.DataFrame,
                                sentiment_df: pd.DataFrame,
                                attrition_df: pd.DataFrame) -> str:
        """Create model type distribution pie chart"""
        try:
            # Count models by type across all domains
            all_models = (list(fraud_df['Model']) + 
                         list(sentiment_df['Model']) + 
                         list(attrition_df['Model']))
            
            model_counts = pd.Series(all_models).value_counts()
            
            fig = go.Figure(data=[
                go.Pie(
                    labels=model_counts.index,
                    values=model_counts.values,
                    hole=0.4,
                    textinfo='label+percent+value',
                    textposition='outside'
                )
            ])
            
            fig.update_layout(
                title='Model Type Distribution Across All Domains',
                template='plotly_white',
                height=400
            )
            
            return fig.to_json()
            
        except Exception as e:
            logger.error(f"Error creating model distribution: {e}")
            return "{}"
    
    def create_performance_radar(self, summary_stats: Dict[str, Any]) -> str:
        """Create radar chart for overall performance"""
        try:
            if 'performance' not in summary_stats:
                return "{}"
            
            perf = summary_stats['performance']
            categories = ['Fraud Detection', 'Sentiment Analysis', 'Customer Attrition']
            values = [perf['fraud_avg'], perf['sentiment_avg'], perf['attrition_avg']]
            
            fig = go.Figure()
            
            fig.add_trace(go.Scatterpolar(
                r=values,
                theta=categories,
                fill='toself',
                name='Performance',
                line_color=self.color_palette['primary']
            ))
            
            fig.update_layout(
                polar=dict(
                    radialaxis=dict(
                        visible=True,
                        range=[0, 1]
                    )
                ),
                title='Performance Radar Chart',
                template='plotly_white',
                height=400
            )
            
            return fig.to_json()
            
        except Exception as e:
            logger.error(f"Error creating performance radar: {e}")
            return "{}"
    
    def create_success_metrics(self, fraud_df: pd.DataFrame,
                              sentiment_df: pd.DataFrame,
                              attrition_df: pd.DataFrame) -> str:
        """Create success metrics gauge charts"""
        try:
            # Calculate success rates (models with score >= 0.8)
            fraud_success = (fraud_df['AUC-ROC'].astype(float) >= 0.8).mean()
            sentiment_success = (sentiment_df['Accuracy'].astype(float) >= 0.8).mean()
            attrition_success = (attrition_df['AUC-ROC'].astype(float) >= 0.8).mean()
            
            fig = make_subplots(
                rows=1, cols=3,
                specs=[[{'type': 'indicator'}, {'type': 'indicator'}, {'type': 'indicator'}]],
                subplot_titles=['Fraud Detection', 'Sentiment Analysis', 'Customer Attrition']
            )
            
            # Fraud gauge
            fig.add_trace(
                go.Indicator(
                    mode="gauge+number+delta",
                    value=fraud_success * 100,
                    domain={'x': [0, 1], 'y': [0, 1]},
                    title={'text': "Success Rate %"},
                    gauge={'axis': {'range': [None, 100]},
                           'bar': {'color': self.color_palette['danger']},
                           'steps': [{'range': [0, 50], 'color': "lightgray"},
                                    {'range': [50, 80], 'color': "yellow"},
                                    {'range': [80, 100], 'color': "lightgreen"}],
                           'threshold': {'line': {'color': "red", 'width': 4},
                                        'thickness': 0.75, 'value': 90}}
                ),
                row=1, col=1
            )
            
            # Sentiment gauge
            fig.add_trace(
                go.Indicator(
                    mode="gauge+number+delta",
                    value=sentiment_success * 100,
                    domain={'x': [0, 1], 'y': [0, 1]},
                    title={'text': "Success Rate %"},
                    gauge={'axis': {'range': [None, 100]},
                           'bar': {'color': self.color_palette['info']},
                           'steps': [{'range': [0, 50], 'color': "lightgray"},
                                    {'range': [50, 80], 'color': "yellow"},
                                    {'range': [80, 100], 'color': "lightgreen"}],
                           'threshold': {'line': {'color': "red", 'width': 4},
                                        'thickness': 0.75, 'value': 90}}
                ),
                row=1, col=2
            )
            
            # Attrition gauge
            fig.add_trace(
                go.Indicator(
                    mode="gauge+number+delta",
                    value=attrition_success * 100,
                    domain={'x': [0, 1], 'y': [0, 1]},
                    title={'text': "Success Rate %"},
                    gauge={'axis': {'range': [None, 100]},
                           'bar': {'color': self.color_palette['success']},
                           'steps': [{'range': [0, 50], 'color': "lightgray"},
                                    {'range': [50, 80], 'color': "yellow"},
                                    {'range': [80, 100], 'color': "lightgreen"}],
                           'threshold': {'line': {'color': "red", 'width': 4},
                                        'thickness': 0.75, 'value': 90}}
                ),
                row=1, col=3
            )
            
            fig.update_layout(
                title='Success Rate by Domain (≥80% threshold)',
                template='plotly_white',
                height=300
            )
            
            return fig.to_json()
            
        except Exception as e:
            logger.error(f"Error creating success metrics: {e}")
            return "{}"
    
    def create_dataset_overview(self, eda_data: Optional[Dict[str, Any]]) -> str:
        """Create dataset overview chart"""
        try:
            if not eda_data or 'dataset_summaries' not in eda_data:
                return "{}"
            
            datasets = []
            sizes = []
            memory_usage = []
            
            for name, info in eda_data['dataset_summaries'].items():
                datasets.append(name.replace('_', ' ').title())
                sizes.append(info['shape'][0])  # Number of rows
                memory_usage.append(info['memory_mb'])
            
            fig = make_subplots(
                rows=1, cols=2,
                subplot_titles=['Dataset Sizes (Records)', 'Memory Usage (MB)'],
                specs=[[{'type': 'bar'}, {'type': 'bar'}]]
            )
            
            # Dataset sizes
            fig.add_trace(
                go.Bar(x=datasets, y=sizes, name='Records', 
                      marker_color=self.color_palette['primary']),
                row=1, col=1
            )
            
            # Memory usage
            fig.add_trace(
                go.Bar(x=datasets, y=memory_usage, name='Memory (MB)',
                      marker_color=self.color_palette['secondary']),
                row=1, col=2
            )
            
            fig.update_layout(
                title='Dataset Overview',
                template='plotly_white',
                height=400,
                showlegend=False
            )
            
            # Rotate x-axis labels
            fig.update_xaxes(tickangle=45)
            
            return fig.to_json()
            
        except Exception as e:
            logger.error(f"Error creating dataset overview: {e}")
            return "{}"
    
    # XAI-specific chart generation methods
    def create_shap_importance_chart(self, features: list, shap_values: list) -> str:
        """Create SHAP feature importance bar chart"""
        try:
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
            
            fig.update_layout(
                title='SHAP Feature Importance',
                xaxis_title='SHAP Value',
                yaxis_title='Features',
                template='plotly_white',
                height=400,
                margin=dict(l=150, r=20, t=50, b=50)
            )
            
            return fig.to_json()
            
        except Exception as e:
            logger.error(f"Error creating SHAP importance chart: {e}")
            return "{}"
    
    def create_shap_waterfall_chart(self, features: list, contributions: list, base_value: float) -> str:
        """Create SHAP waterfall chart for individual prediction"""
        try:
            # Add base value and final prediction
            labels = ['Base Value'] + features + ['Final Prediction']
            values = [base_value] + contributions + [sum(contributions)]
            
            fig = go.Figure(go.Waterfall(
                name="SHAP Values",
                orientation="v",
                measure=["absolute"] + ["relative"] * len(features) + ["total"],
                x=labels,
                textposition="outside",
                text=[f"{v:.3f}" for v in values],
                y=values,
                connector={"line": {"color": "rgb(63, 63, 63)"}},
                increasing={"marker": {"color": self.xai_colors['positive_shap']}},
                decreasing={"marker": {"color": self.xai_colors['negative_shap']}},
                totals={"marker": {"color": self.color_palette['primary']}}
            ))
            
            fig.update_layout(
                title="SHAP Waterfall Plot - Individual Prediction",
                xaxis_title="Features",
                yaxis_title="SHAP Value",
                template='plotly_white',
                height=400,
                showlegend=False
            )
            
            return fig.to_json()
            
        except Exception as e:
            logger.error(f"Error creating SHAP waterfall chart: {e}")
            return "{}"
    
    def create_lime_explanation_chart(self, features: list, contributions: list) -> str:
        """Create LIME local explanation chart"""
        try:
            colors = [self.xai_colors['positive_shap'] if val > 0 else self.xai_colors['negative_shap'] 
                     for val in contributions]
            
            fig = go.Figure(data=[
                go.Bar(
                    y=features,
                    x=contributions,
                    orientation='h',
                    marker=dict(color=colors, opacity=0.8),
                    hovertemplate='<b>%{y}</b><br>Contribution: %{x:.3f}<extra></extra>'
                )
            ])
            
            fig.update_layout(
                title='LIME Local Explanation',
                xaxis_title='Feature Contribution',
                yaxis_title='Features',
                template='plotly_white',
                height=350,
                margin=dict(l=140, r=20, t=50, b=50)
            )
            
            return fig.to_json()
            
        except Exception as e:
            logger.error(f"Error creating LIME explanation chart: {e}")
            return "{}"
    
    def create_partial_dependence_plot(self, feature_values: list, pd_values: list, feature_name: str) -> str:
        """Create Partial Dependence Plot"""
        try:
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
            
            fig.update_layout(
                title=f'Partial Dependence Plot: {feature_name}',
                xaxis_title=feature_name,
                yaxis_title='Partial Dependence',
                template='plotly_white',
                height=350,
                showlegend=False
            )
            
            return fig.to_json()
            
        except Exception as e:
            logger.error(f"Error creating partial dependence plot: {e}")
            return "{}"
    
    def create_interpretability_radar_chart(self, domains: list, metrics: dict) -> str:
        """Create interpretability comparison radar chart"""
        try:
            metric_names = list(metrics.keys())
            
            data = []
            colors = [self.color_palette['primary'], self.color_palette['success'], self.color_palette['warning']]
            
            for i, domain in enumerate(domains):
                values = [metrics[metric][i] for metric in metric_names]
                
                data.append(go.Scatterpolar(
                    r=values + [values[0]],  # Close the polygon
                    theta=metric_names + [metric_names[0]],
                    fill='toself',
                    name=domain,
                    marker=dict(color=colors[i % len(colors)]),
                    fillcolor=f'rgba({int(colors[i % len(colors)][1:3], 16)}, {int(colors[i % len(colors)][3:5], 16)}, {int(colors[i % len(colors)][5:7], 16)}, 0.1)'
                ))
            
            fig = go.Figure(data=data)
            
            fig.update_layout(
                polar=dict(
                    radialaxis=dict(
                        visible=True,
                        range=[0, 100],
                        gridcolor='#e5e7eb'
                    ),
                    angularaxis=dict(gridcolor='#e5e7eb')
                ),
                title='Model Interpretability Comparison',
                template='plotly_white',
                showlegend=True,
                legend=dict(orientation="h", yanchor="bottom", y=-0.1, xanchor="center", x=0.5),
                height=400
            )
            
            return fig.to_json()
            
        except Exception as e:
            logger.error(f"Error creating interpretability radar chart: {e}")
            return "{}"
    
    def create_feature_importance_pie_chart(self, features: list, importance: list) -> str:
        """Create feature importance pie chart"""
        try:
            colors = [self.color_palette['primary'], self.color_palette['success'], 
                     self.color_palette['warning'], self.color_palette['danger'],
                     self.color_palette['secondary'], '#0891b2']
            
            fig = go.Figure(data=[
                go.Pie(
                    labels=features,
                    values=importance,
                    hole=0.4,
                    marker=dict(colors=colors[:len(features)], line=dict(color='#ffffff', width=2)),
                    textinfo='label+percent',
                    textposition='outside',
                    hovertemplate='<b>%{label}</b><br>Importance: %{value:.3f}<br>Percentage: %{percent}<extra></extra>'
                )
            ])
            
            fig.update_layout(
                title='Global Feature Importance Distribution',
                template='plotly_white',
                showlegend=False,
                height=400
            )
            
            return fig.to_json()
            
        except Exception as e:
            logger.error(f"Error creating feature importance pie chart: {e}")
            return "{}"
    
    # Advanced Visualization Methods
    def create_correlation_heatmap(self, data: pd.DataFrame, title: str = "Correlation Heatmap") -> str:
        """Create correlation heatmap"""
        try:
            # Calculate correlation matrix
            corr_matrix = data.corr()
            
            # Create mask for upper triangle (optional)
            import numpy as np
            mask = np.triu(np.ones_like(corr_matrix, dtype=bool))
            
            fig = go.Figure(data=go.Heatmap(
                z=corr_matrix.values,
                x=corr_matrix.columns,
                y=corr_matrix.columns,
                colorscale='RdBu',
                zmid=0,
                text=np.round(corr_matrix.values, 2),
                texttemplate="%{text}",
                textfont={"size": 10},
                hovertemplate='<b>%{x} vs %{y}</b><br>Correlation: %{z:.3f}<extra></extra>',
                colorbar=dict(title="Correlation", titleside="right")
            ))
            
            fig.update_layout(
                title=title,
                template='plotly_white',
                height=500,
                width=500,
                xaxis_title="Features",
                yaxis_title="Features"
            )
            
            return fig.to_json()
            
        except Exception as e:
            logger.error(f"Error creating correlation heatmap: {e}")
            return "{}"
    
    def create_confusion_matrix_heatmap(self, y_true: list, y_pred: list, labels: list = None) -> str:
        """Create confusion matrix heatmap"""
        try:
            from sklearn.metrics import confusion_matrix
            import numpy as np
            
            # Calculate confusion matrix
            cm = confusion_matrix(y_true, y_pred)
            
            if labels is None:
                labels = ['Negative', 'Positive']
            
            # Normalize confusion matrix
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
            
            fig.update_layout(
                title='Confusion Matrix',
                template='plotly_white',
                height=400,
                width=400,
                xaxis_title="Predicted Label",
                yaxis_title="True Label"
            )
            
            return fig.to_json()
            
        except Exception as e:
            logger.error(f"Error creating confusion matrix heatmap: {e}")
            return "{}"
    
    def create_performance_heatmap(self, model_scores: dict, metrics: list) -> str:
        """Create performance heatmap across models and metrics"""
        try:
            import numpy as np
            
            models = list(model_scores.keys())
            z_data = []
            
            for metric in metrics:
                row = []
                for model in models:
                    if metric in model_scores[model]:
                        row.append(model_scores[model][metric])
                    else:
                        row.append(0)
                z_data.append(row)
            
            fig = go.Figure(data=go.Heatmap(
                z=z_data,
                x=models,
                y=metrics,
                colorscale='Viridis',
                text=np.round(z_data, 3),
                texttemplate="%{text}",
                textfont={"size": 10, "color": "white"},
                hovertemplate='<b>Model: %{x}<br>Metric: %{y}</b><br>Score: %{z:.3f}<extra></extra>',
                colorbar=dict(title="Score", titleside="right")
            ))
            
            fig.update_layout(
                title='Model Performance Heatmap',
                template='plotly_white',
                height=400,
                xaxis_title="Models",
                yaxis_title="Metrics"
            )
            
            return fig.to_json()
            
        except Exception as e:
            logger.error(f"Error creating performance heatmap: {e}")
            return "{}"
    
    def create_feature_distribution_heatmap(self, data: pd.DataFrame, bins: int = 20) -> str:
        """Create feature distribution heatmap"""
        try:
            import numpy as np
            
            # Select numerical columns
            numeric_cols = data.select_dtypes(include=[np.number]).columns[:10]  # Limit to 10 features
            
            z_data = []
            feature_names = []
            
            for col in numeric_cols:
                hist, bin_edges = np.histogram(data[col].dropna(), bins=bins)
                z_data.append(hist)
                feature_names.append(col)
            
            bin_centers = [(bin_edges[i] + bin_edges[i+1])/2 for i in range(len(bin_edges)-1)]
            
            fig = go.Figure(data=go.Heatmap(
                z=z_data,
                x=bin_centers,
                y=feature_names,
                colorscale='Hot',
                hovertemplate='<b>Feature: %{y}<br>Bin: %{x:.2f}</b><br>Count: %{z}<extra></extra>',
                colorbar=dict(title="Count", titleside="right")
            ))
            
            fig.update_layout(
                title='Feature Distribution Heatmap',
                template='plotly_white',
                height=500,
                xaxis_title="Value Bins",
                yaxis_title="Features"
            )
            
            return fig.to_json()
            
        except Exception as e:
            logger.error(f"Error creating feature distribution heatmap: {e}")
            return "{}"
    
    def create_time_series_heatmap(self, data: pd.DataFrame, time_col: str, value_col: str, 
                                 category_col: str = None) -> str:
        """Create time series heatmap"""
        try:
            import numpy as np
            
            if category_col and category_col in data.columns:
                # Pivot data for heatmap
                pivot_data = data.pivot_table(
                    values=value_col, 
                    index=category_col, 
                    columns=time_col, 
                    aggfunc='mean'
                )
            else:
                # Create bins for time series
                data['time_bin'] = pd.cut(data[time_col], bins=20)
                pivot_data = data.groupby('time_bin')[value_col].mean().to_frame().T
            
            fig = go.Figure(data=go.Heatmap(
                z=pivot_data.values,
                x=pivot_data.columns,
                y=pivot_data.index,
                colorscale='Plasma',
                hovertemplate='<b>Time: %{x}<br>Category: %{y}</b><br>Value: %{z:.3f}<extra></extra>',
                colorbar=dict(title="Value", titleside="right")
            ))
            
            fig.update_layout(
                title='Time Series Heatmap',
                template='plotly_white',
                height=400,
                xaxis_title="Time",
                yaxis_title="Categories"
            )
            
            return fig.to_json()
            
        except Exception as e:
            logger.error(f"Error creating time series heatmap: {e}")
            return "{}"
    
    def create_scatter_plot_matrix(self, data: pd.DataFrame, features: list = None, color_col: str = None) -> str:
        """Create interactive scatter plot matrix"""
        try:
            if features is None:
                import numpy as np
                numeric_cols = data.select_dtypes(include=[np.number]).columns
                features = list(numeric_cols[:6])  # Limit to 6 features for readability
            
            fig = px.scatter_matrix(
                data, 
                dimensions=features,
                color=color_col if color_col and color_col in data.columns else None,
                title="Interactive Scatter Plot Matrix",
                color_continuous_scale='Viridis'
            )
            
            fig.update_layout(
                template='plotly_white',
                height=600,
                width=600
            )
            
            return fig.to_json()
            
        except Exception as e:
            logger.error(f"Error creating scatter plot matrix: {e}")
            return "{}"
    
    def create_violin_plot(self, data: pd.DataFrame, x_col: str, y_col: str, 
                          color_col: str = None) -> str:
        """Create violin plot"""
        try:
            fig = go.Figure()
            
            if color_col and color_col in data.columns:
                categories = data[color_col].unique()
                colors = px.colors.qualitative.Set3[:len(categories)]
                
                for i, category in enumerate(categories):
                    subset = data[data[color_col] == category]
                    fig.add_trace(go.Violin(
                        x=subset[x_col],
                        y=subset[y_col],
                        name=str(category),
                        box_visible=True,
                        meanline_visible=True,
                        fillcolor=colors[i],
                        opacity=0.6
                    ))
            else:
                fig.add_trace(go.Violin(
                    x=data[x_col],
                    y=data[y_col],
                    box_visible=True,
                    meanline_visible=True,
                    fillcolor=self.color_palette['primary'],
                    opacity=0.6
                ))
            
            fig.update_layout(
                title=f'Violin Plot: {y_col} by {x_col}',
                template='plotly_white',
                height=400,
                xaxis_title=x_col,
                yaxis_title=y_col
            )
            
            return fig.to_json()
            
        except Exception as e:
            logger.error(f"Error creating violin plot: {e}")
            return "{}"
    
    def create_box_plot(self, data: pd.DataFrame, x_col: str, y_col: str, 
                       color_col: str = None) -> str:
        """Create box plot"""
        try:
            if color_col and color_col in data.columns:
                fig = px.box(
                    data, 
                    x=x_col, 
                    y=y_col, 
                    color=color_col,
                    title=f'Box Plot: {y_col} by {x_col}',
                    color_discrete_sequence=px.colors.qualitative.Set3
                )
            else:
                fig = px.box(
                    data, 
                    x=x_col, 
                    y=y_col,
                    title=f'Box Plot: {y_col} by {x_col}'
                )
            
            fig.update_layout(
                template='plotly_white',
                height=400
            )
            
            return fig.to_json()
            
        except Exception as e:
            logger.error(f"Error creating box plot: {e}")
            return "{}"
    
    def create_sunburst_chart(self, data: pd.DataFrame, path_cols: list, value_col: str) -> str:
        """Create sunburst chart"""
        try:
            fig = px.sunburst(
                data,
                path=path_cols,
                values=value_col,
                title='Sunburst Chart',
                color_discrete_sequence=px.colors.qualitative.Set3
            )
            
            fig.update_layout(
                template='plotly_white',
                height=500
            )
            
            return fig.to_json()
            
        except Exception as e:
            logger.error(f"Error creating sunburst chart: {e}")
            return "{}"
    
    def create_treemap_chart(self, data: pd.DataFrame, path_cols: list, value_col: str, 
                           color_col: str = None) -> str:
        """Create treemap chart"""
        try:
            fig = px.treemap(
                data,
                path=path_cols,
                values=value_col,
                color=color_col if color_col and color_col in data.columns else value_col,
                title='Treemap Chart',
                color_continuous_scale='Viridis'
            )
            
            fig.update_layout(
                template='plotly_white',
                height=500
            )
            
            return fig.to_json()
            
        except Exception as e:
            logger.error(f"Error creating treemap chart: {e}")
            return "{}"
    
    def create_3d_scatter_plot(self, data: pd.DataFrame, x_col: str, y_col: str, z_col: str, 
                             color_col: str = None, size_col: str = None) -> str:
        """Create 3D scatter plot"""
        try:
            fig = px.scatter_3d(
                data,
                x=x_col,
                y=y_col,
                z=z_col,
                color=color_col if color_col and color_col in data.columns else None,
                size=size_col if size_col and size_col in data.columns else None,
                title=f'3D Scatter Plot: {x_col} vs {y_col} vs {z_col}',
                color_continuous_scale='Viridis'
            )
            
            fig.update_layout(
                template='plotly_white',
                height=600,
                scene=dict(
                    xaxis_title=x_col,
                    yaxis_title=y_col,
                    zaxis_title=z_col
                )
            )
            
            return fig.to_json()
            
        except Exception as e:
            logger.error(f"Error creating 3D scatter plot: {e}")
            return "{}"
    
    def create_parallel_coordinates(self, data: pd.DataFrame, features: list, color_col: str = None) -> str:
        """Create parallel coordinates plot"""
        try:
            fig = px.parallel_coordinates(
                data,
                dimensions=features,
                color=color_col if color_col and color_col in data.columns else features[0],
                title='Parallel Coordinates Plot',
                color_continuous_scale='Viridis'
            )
            
            fig.update_layout(
                template='plotly_white',
                height=500
            )
            
            return fig.to_json()
            
        except Exception as e:
            logger.error(f"Error creating parallel coordinates plot: {e}")
            return "{}"
    
    def create_density_heatmap(self, data: pd.DataFrame, x_col: str, y_col: str) -> str:
        """Create 2D density heatmap"""
        try:
            fig = px.density_heatmap(
                data,
                x=x_col,
                y=y_col,
                title=f'Density Heatmap: {x_col} vs {y_col}',
                color_continuous_scale='Hot'
            )
            
            fig.update_layout(
                template='plotly_white',
                height=400
            )
            
            return fig.to_json()
            
        except Exception as e:
            logger.error(f"Error creating density heatmap: {e}")
            return "{}"
    
    def create_ridgeline_plot(self, data: pd.DataFrame, x_col: str, category_col: str) -> str:
        """Create ridgeline plot (density plots stacked)"""
        try:
            categories = data[category_col].unique()
            fig = go.Figure()
            
            colors = px.colors.qualitative.Set3[:len(categories)]
            
            for i, category in enumerate(categories):
                subset = data[data[category_col] == category]
                
                fig.add_trace(go.Violin(
                    x=subset[x_col],
                    y=[category] * len(subset),
                    name=str(category),
                    orientation='h',
                    side='positive',
                    fillcolor=colors[i],
                    opacity=0.7,
                    line_color=colors[i]
                ))
            
            fig.update_layout(
                title=f'Ridgeline Plot: {x_col} by {category_col}',
                template='plotly_white',
                height=400,
                xaxis_title=x_col,
                yaxis_title=category_col,
                showlegend=False
            )
            
            return fig.to_json()
            
        except Exception as e:
            logger.error(f"Error creating ridgeline plot: {e}")
            return "{}"