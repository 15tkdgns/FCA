#!/usr/bin/env python3
"""
Relationship Analysis Module
Specialized chart generators for analyzing relationships between variables
"""

import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
import numpy as np
from typing import Dict, Any, Optional, List
import logging
from .base_chart import BaseChartGenerator

logger = logging.getLogger(__name__)

class RelationshipGenerator(BaseChartGenerator):
    """Specialized generator for relationship analysis visualizations"""
    
    def create_scatter_plot_matrix(self, data: pd.DataFrame, features: List[str] = None, 
                                  color_col: str = None, title: str = None) -> str:
        """Create interactive scatter plot matrix"""
        try:
            if not self.validate_data(data):
                return self.create_error_chart("Invalid data for scatter plot matrix")
            
            if features is None:
                # Select numeric columns (limit to 6 for readability)
                numeric_cols = data.select_dtypes(include=[np.number]).columns
                features = list(numeric_cols[:6])
            
            if len(features) < 2:
                return self.create_error_chart("Need at least 2 features for scatter matrix")
            
            # Validate features exist in data
            missing_features = [f for f in features if f not in data.columns]
            if missing_features:
                return self.create_error_chart(f"Missing features: {missing_features}")
            
            fig = px.scatter_matrix(
                data, 
                dimensions=features,
                color=color_col if color_col and color_col in data.columns else None,
                title=title or "Interactive Scatter Plot Matrix",
                color_continuous_scale=self.get_color_scale('sequential')
            )
            
            fig = self.apply_standard_layout(fig, title or "Scatter Plot Matrix", height=600)
            
            return self.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating scatter plot matrix: {e}")
            return self.create_error_chart("Scatter plot matrix generation failed")
    
    def create_parallel_coordinates(self, data: pd.DataFrame, features: List[str], 
                                   color_col: str = None, title: str = None) -> str:
        """Create parallel coordinates plot"""
        try:
            if not self.validate_data(data, features):
                return self.create_error_chart("Missing required features for parallel coordinates")
            
            # Clean data - remove rows with any missing values in selected features
            clean_data = data[features + ([color_col] if color_col else [])].dropna()
            
            if clean_data.empty:
                return self.create_error_chart("No complete data rows for parallel coordinates")
            
            fig = px.parallel_coordinates(
                clean_data,
                dimensions=features,
                color=color_col if color_col and color_col in clean_data.columns else features[0],
                title=title or 'Parallel Coordinates Plot',
                color_continuous_scale=self.get_color_scale('sequential')
            )
            
            fig = self.apply_standard_layout(fig, title or "Parallel Coordinates Plot", height=500)
            
            return self.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating parallel coordinates plot: {e}")
            return self.create_error_chart("Parallel coordinates generation failed")
    
    def create_correlation_network(self, data: pd.DataFrame, threshold: float = 0.5,
                                  title: str = None) -> str:
        """Create correlation network visualization"""
        try:
            if not self.validate_data(data):
                return self.create_error_chart("Invalid data for correlation network")
            
            # Calculate correlation matrix for numeric columns
            numeric_data = data.select_dtypes(include=[np.number])
            if numeric_data.shape[1] < 2:
                return self.create_error_chart("Need at least 2 numeric columns")
            
            corr_matrix = numeric_data.corr()
            
            # Create network data
            features = corr_matrix.columns
            edges_x = []
            edges_y = []
            edge_weights = []
            
            for i, feat1 in enumerate(features):
                for j, feat2 in enumerate(features):
                    if i < j and abs(corr_matrix.loc[feat1, feat2]) >= threshold:
                        # Add edge coordinates (simplified circular layout)
                        angle1 = 2 * np.pi * i / len(features)
                        angle2 = 2 * np.pi * j / len(features)
                        
                        x1, y1 = np.cos(angle1), np.sin(angle1)
                        x2, y2 = np.cos(angle2), np.sin(angle2)
                        
                        edges_x.extend([x1, x2, None])
                        edges_y.extend([y1, y2, None])
                        edge_weights.append(abs(corr_matrix.loc[feat1, feat2]))
            
            # Node coordinates
            node_x = [np.cos(2 * np.pi * i / len(features)) for i in range(len(features))]
            node_y = [np.sin(2 * np.pi * i / len(features)) for i in range(len(features))]
            
            fig = go.Figure()
            
            # Add edges
            if edges_x:
                fig.add_trace(go.Scatter(
                    x=edges_x, y=edges_y,
                    line=dict(width=2, color=self.color_palette['secondary']),
                    hoverinfo='none',
                    mode='lines',
                    showlegend=False
                ))
            
            # Add nodes
            fig.add_trace(go.Scatter(
                x=node_x, y=node_y,
                mode='markers+text',
                marker=dict(
                    size=20,
                    color=self.color_palette['primary'],
                    line=dict(width=2, color='white')
                ),
                text=features,
                textposition="middle center",
                textfont=dict(color='white', size=10),
                hovertemplate='<b>%{text}</b><extra></extra>',
                showlegend=False
            ))
            
            fig.update_layout(
                title=title or f'Correlation Network (threshold: {threshold})',
                showlegend=False,
                xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                template='plotly_white',
                height=500
            )
            
            return self.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating correlation network: {e}")
            return self.create_error_chart("Correlation network generation failed")
    
    def create_pairwise_scatter(self, data: pd.DataFrame, x_col: str, y_col: str,
                               color_col: str = None, size_col: str = None,
                               title: str = None) -> str:
        """Create detailed pairwise scatter plot"""
        try:
            if not self.validate_data(data, [x_col, y_col]):
                return self.create_error_chart("Missing required columns for scatter plot")
            
            # Clean data
            required_cols = [x_col, y_col]
            if color_col and color_col in data.columns:
                required_cols.append(color_col)
            if size_col and size_col in data.columns:
                required_cols.append(size_col)
            
            clean_data = data[required_cols].dropna()
            
            if clean_data.empty:
                return self.create_error_chart("No valid data for scatter plot")
            
            fig = px.scatter(
                clean_data,
                x=x_col,
                y=y_col,
                color=color_col if color_col and color_col in clean_data.columns else None,
                size=size_col if size_col and size_col in clean_data.columns else None,
                title=title or f'{y_col} vs {x_col}',
                color_continuous_scale=self.get_color_scale('sequential'),
                hover_data=required_cols
            )
            
            # Add trend line
            try:
                from sklearn.linear_model import LinearRegression
                from sklearn.preprocessing import PolynomialFeatures
                
                X = clean_data[[x_col]].values
                y = clean_data[y_col].values
                
                # Fit linear regression
                reg = LinearRegression().fit(X, y)
                x_trend = np.linspace(X.min(), X.max(), 100).reshape(-1, 1)
                y_trend = reg.predict(x_trend)
                
                fig.add_trace(go.Scatter(
                    x=x_trend.flatten(),
                    y=y_trend,
                    mode='lines',
                    name='Trend Line',
                    line=dict(color=self.color_palette['danger'], dash='dash')
                ))
                
            except ImportError:
                logger.warning("Scikit-learn not available for trend line")
            except Exception as e:
                logger.warning(f"Could not add trend line: {e}")
            
            fig = self.apply_standard_layout(
                fig, title or f'{y_col} vs {x_col}', height=500,
                xaxis_title=x_col,
                yaxis_title=y_col
            )
            
            return self.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating pairwise scatter plot: {e}")
            return self.create_error_chart("Scatter plot generation failed")
    
    def create_bubble_chart(self, data: pd.DataFrame, x_col: str, y_col: str,
                           size_col: str, color_col: str = None, title: str = None) -> str:
        """Create bubble chart for multi-dimensional relationships"""
        try:
            required_cols = [x_col, y_col, size_col]
            if not self.validate_data(data, required_cols):
                return self.create_error_chart("Missing required columns for bubble chart")
            
            # Add color column if specified
            if color_col and color_col in data.columns:
                required_cols.append(color_col)
            
            clean_data = data[required_cols].dropna()
            
            if clean_data.empty:
                return self.create_error_chart("No valid data for bubble chart")
            
            fig = px.scatter(
                clean_data,
                x=x_col,
                y=y_col,
                size=size_col,
                color=color_col if color_col and color_col in clean_data.columns else None,
                title=title or f'Bubble Chart: {y_col} vs {x_col} (size: {size_col})',
                color_continuous_scale=self.get_color_scale('sequential'),
                size_max=60,
                hover_data=required_cols
            )
            
            fig = self.apply_standard_layout(
                fig, title or f'Bubble Chart: {y_col} vs {x_col}', height=500,
                xaxis_title=x_col,
                yaxis_title=y_col
            )
            
            return self.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating bubble chart: {e}")
            return self.create_error_chart("Bubble chart generation failed")