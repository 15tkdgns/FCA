#!/usr/bin/env python3
"""
3D Visualization Module
Specialized chart generators for three-dimensional visualizations
"""

import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
import numpy as np
from typing import Dict, Any, Optional, List
import logging
from .base_chart import BaseChartGenerator

logger = logging.getLogger(__name__)

class ThreeDGenerator(BaseChartGenerator):
    """Specialized generator for 3D visualizations"""
    
    def create_3d_scatter_plot(self, data: pd.DataFrame, x_col: str, y_col: str, z_col: str,
                              color_col: str = None, size_col: str = None, 
                              title: str = None) -> str:
        """Create 3D scatter plot"""
        try:
            required_cols = [x_col, y_col, z_col]
            if not self.validate_data(data, required_cols):
                return self.create_error_chart("Missing required columns for 3D scatter plot")
            
            # Add optional columns to requirements if they exist
            if color_col and color_col in data.columns:
                required_cols.append(color_col)
            if size_col and size_col in data.columns:
                required_cols.append(size_col)
            
            # Clean data
            clean_data = data[required_cols].dropna()
            
            if clean_data.empty:
                return self.create_error_chart("No valid data for 3D scatter plot")
            
            fig = px.scatter_3d(
                clean_data,
                x=x_col,
                y=y_col,
                z=z_col,
                color=color_col if color_col and color_col in clean_data.columns else None,
                size=size_col if size_col and size_col in clean_data.columns else None,
                title=title or f'3D Scatter Plot: {x_col} vs {y_col} vs {z_col}',
                color_continuous_scale=self.get_color_scale('sequential'),
                hover_data=required_cols
            )
            
            fig.update_layout(
                template='plotly_white',
                height=600,
                scene=dict(
                    xaxis_title=x_col,
                    yaxis_title=y_col,
                    zaxis_title=z_col,
                    camera=dict(
                        eye=dict(x=1.2, y=1.2, z=1.2)
                    )
                )
            )
            
            return self.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating 3D scatter plot: {e}")
            return self.create_error_chart("3D scatter plot generation failed")
    
    def create_3d_surface_plot(self, data: pd.DataFrame, x_col: str, y_col: str, z_col: str,
                              title: str = None) -> str:
        """Create 3D surface plot"""
        try:
            if not self.validate_data(data, [x_col, y_col, z_col]):
                return self.create_error_chart("Missing required columns for 3D surface plot")
            
            # Clean data
            clean_data = data[[x_col, y_col, z_col]].dropna()
            
            if clean_data.empty or len(clean_data) < 9:  # Need minimum points for surface
                return self.create_error_chart("Insufficient data for 3D surface plot")
            
            try:
                # Create grid for surface plot
                x_unique = sorted(clean_data[x_col].unique())
                y_unique = sorted(clean_data[y_col].unique())
                
                if len(x_unique) < 3 or len(y_unique) < 3:
                    return self.create_error_chart("Need at least 3 unique values in each dimension")
                
                # Create meshgrid
                X, Y = np.meshgrid(x_unique, y_unique)
                
                # Interpolate Z values
                from scipy.interpolate import griddata
                
                points = clean_data[[x_col, y_col]].values
                values = clean_data[z_col].values
                Z = griddata(points, values, (X, Y), method='linear', fill_value=0)
                
                fig = go.Figure(data=[go.Surface(
                    x=X,
                    y=Y,
                    z=Z,
                    colorscale=self.get_color_scale('sequential'),
                    hovertemplate=f'<b>{x_col}: %{{x}}<br>{y_col}: %{{y}}<br>{z_col}: %{{z}}</b><extra></extra>'
                )])
                
                fig.update_layout(
                    title=title or f'3D Surface Plot: {z_col} over {x_col} and {y_col}',
                    template='plotly_white',
                    height=600,
                    scene=dict(
                        xaxis_title=x_col,
                        yaxis_title=y_col,
                        zaxis_title=z_col,
                        camera=dict(
                            eye=dict(x=1.2, y=1.2, z=1.2)
                        )
                    )
                )
                
                return self.safe_to_json(fig)
                
            except ImportError:
                return self.create_error_chart("SciPy required for 3D surface interpolation")
            
        except Exception as e:
            logger.error(f"Error creating 3D surface plot: {e}")
            return self.create_error_chart("3D surface plot generation failed")
    
    def create_3d_mesh_plot(self, data: pd.DataFrame, x_col: str, y_col: str, z_col: str,
                           intensity_col: str = None, title: str = None) -> str:
        """Create 3D mesh plot"""
        try:
            required_cols = [x_col, y_col, z_col]
            if intensity_col and intensity_col in data.columns:
                required_cols.append(intensity_col)
                
            if not self.validate_data(data, required_cols):
                return self.create_error_chart("Missing required columns for 3D mesh plot")
            
            # Clean data
            clean_data = data[required_cols].dropna()
            
            if clean_data.empty or len(clean_data) < 4:
                return self.create_error_chart("Insufficient data for 3D mesh plot")
            
            # Create triangular mesh
            x = clean_data[x_col].values
            y = clean_data[y_col].values
            z = clean_data[z_col].values
            
            intensity = (clean_data[intensity_col].values 
                        if intensity_col and intensity_col in clean_data.columns 
                        else z)
            
            fig = go.Figure(data=[go.Mesh3d(
                x=x,
                y=y,
                z=z,
                intensity=intensity,
                colorscale=self.get_color_scale('sequential'),
                opacity=0.8,
                hovertemplate=f'<b>{x_col}: %{{x}}<br>{y_col}: %{{y}}<br>{z_col}: %{{z}}</b><extra></extra>'
            )])
            
            fig.update_layout(
                title=title or f'3D Mesh Plot',
                template='plotly_white',
                height=600,
                scene=dict(
                    xaxis_title=x_col,
                    yaxis_title=y_col,
                    zaxis_title=z_col,
                    camera=dict(
                        eye=dict(x=1.2, y=1.2, z=1.2)
                    )
                )
            )
            
            return self.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating 3D mesh plot: {e}")
            return self.create_error_chart("3D mesh plot generation failed")
    
    def create_3d_line_plot(self, data: pd.DataFrame, x_col: str, y_col: str, z_col: str,
                           color_col: str = None, title: str = None) -> str:
        """Create 3D line plot"""
        try:
            required_cols = [x_col, y_col, z_col]
            if color_col and color_col in data.columns:
                required_cols.append(color_col)
                
            if not self.validate_data(data, required_cols):
                return self.create_error_chart("Missing required columns for 3D line plot")
            
            # Clean and sort data
            clean_data = data[required_cols].dropna()
            
            if clean_data.empty:
                return self.create_error_chart("No valid data for 3D line plot")
            
            # Sort by first column for better line continuity
            clean_data = clean_data.sort_values(x_col)
            
            fig = go.Figure()
            
            if color_col and color_col in clean_data.columns:
                # Create separate lines for different categories
                for category in clean_data[color_col].unique():
                    subset = clean_data[clean_data[color_col] == category]
                    if not subset.empty:
                        fig.add_trace(go.Scatter3d(
                            x=subset[x_col],
                            y=subset[y_col],
                            z=subset[z_col],
                            mode='lines+markers',
                            name=str(category),
                            line=dict(width=4),
                            marker=dict(size=3),
                            hovertemplate=f'<b>{category}</b><br>{x_col}: %{{x}}<br>{y_col}: %{{y}}<br>{z_col}: %{{z}}<extra></extra>'
                        ))
            else:
                fig.add_trace(go.Scatter3d(
                    x=clean_data[x_col],
                    y=clean_data[y_col],
                    z=clean_data[z_col],
                    mode='lines+markers',
                    line=dict(width=4, color=self.color_palette['primary']),
                    marker=dict(size=3, color=self.color_palette['primary']),
                    hovertemplate=f'<b>{x_col}: %{{x}}<br>{y_col}: %{{y}}<br>{z_col}: %{{z}}</b><extra></extra>',
                    showlegend=False
                ))
            
            fig.update_layout(
                title=title or f'3D Line Plot: {x_col}, {y_col}, {z_col}',
                template='plotly_white',
                height=600,
                scene=dict(
                    xaxis_title=x_col,
                    yaxis_title=y_col,
                    zaxis_title=z_col,
                    camera=dict(
                        eye=dict(x=1.2, y=1.2, z=1.2)
                    )
                )
            )
            
            return self.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating 3D line plot: {e}")
            return self.create_error_chart("3D line plot generation failed")
    
    def create_3d_bar_plot(self, data: pd.DataFrame, x_col: str, y_col: str, z_col: str,
                          title: str = None) -> str:
        """Create 3D bar plot"""
        try:
            if not self.validate_data(data, [x_col, y_col, z_col]):
                return self.create_error_chart("Missing required columns for 3D bar plot")
            
            # Clean data
            clean_data = data[[x_col, y_col, z_col]].dropna()
            
            if clean_data.empty:
                return self.create_error_chart("No valid data for 3D bar plot")
            
            # Aggregate data if needed (group by x and y, sum z)
            if len(clean_data) > 50:  # Limit number of bars
                agg_data = clean_data.groupby([x_col, y_col])[z_col].sum().reset_index()
            else:
                agg_data = clean_data
            
            # Create 3D bar plot using multiple traces
            fig = go.Figure()
            
            x_vals = agg_data[x_col].values
            y_vals = agg_data[y_col].values
            z_vals = agg_data[z_col].values
            
            # Normalize colors based on z values
            colors = plt.cm.viridis((z_vals - z_vals.min()) / (z_vals.max() - z_vals.min())) if len(set(z_vals)) > 1 else ['blue'] * len(z_vals)
            
            for i, (x, y, z) in enumerate(zip(x_vals, y_vals, z_vals)):
                fig.add_trace(go.Mesh3d(
                    x=[x-0.4, x+0.4, x+0.4, x-0.4, x-0.4, x+0.4, x+0.4, x-0.4],
                    y=[y-0.4, y-0.4, y+0.4, y+0.4, y-0.4, y-0.4, y+0.4, y+0.4],
                    z=[0, 0, 0, 0, z, z, z, z],
                    i=[7, 0, 0, 0, 4, 4, 6, 6, 4, 0, 3, 2],
                    j=[3, 4, 1, 2, 5, 6, 5, 2, 0, 1, 6, 3],
                    k=[0, 7, 2, 3, 6, 7, 1, 1, 5, 5, 7, 6],
                    opacity=0.8,
                    color=self.color_palette['primary'],
                    showlegend=False,
                    hovertemplate=f'<b>{x_col}: {x}<br>{y_col}: {y}<br>{z_col}: {z}</b><extra></extra>'
                ))
            
            fig.update_layout(
                title=title or f'3D Bar Plot: {z_col} by {x_col} and {y_col}',
                template='plotly_white',
                height=600,
                scene=dict(
                    xaxis_title=x_col,
                    yaxis_title=y_col,
                    zaxis_title=z_col,
                    camera=dict(
                        eye=dict(x=1.2, y=1.2, z=1.2)
                    )
                )
            )
            
            return self.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating 3D bar plot: {e}")
            return self.create_error_chart("3D bar plot generation failed")