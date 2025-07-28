#!/usr/bin/env python3
"""
Hierarchical Visualization Module
Specialized chart generators for hierarchical data structures
"""

import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
import numpy as np
from typing import Dict, Any, Optional, List
import logging
from .base_chart import BaseChartGenerator

logger = logging.getLogger(__name__)

class HierarchicalGenerator(BaseChartGenerator):
    """Specialized generator for hierarchical visualizations"""
    
    def create_sunburst_chart(self, data: pd.DataFrame, path_cols: List[str], 
                             value_col: str, title: str = None) -> str:
        """Create sunburst chart for hierarchical data"""
        try:
            if not self.validate_data(data, path_cols + [value_col]):
                return self.create_error_chart("Missing required columns for sunburst chart")
            
            # Clean data - remove rows with missing values
            clean_data = data[path_cols + [value_col]].dropna()
            
            if clean_data.empty:
                return self.create_error_chart("No valid data for sunburst chart")
            
            fig = px.sunburst(
                clean_data,
                path=path_cols,
                values=value_col,
                title=title or 'Sunburst Chart',
                color_discrete_sequence=self.get_categorical_colors(10)
            )
            
            fig = self.apply_standard_layout(fig, title or "Sunburst Chart", height=500)
            
            return self.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating sunburst chart: {e}")
            return self.create_error_chart("Sunburst chart generation failed")
    
    def create_treemap_chart(self, data: pd.DataFrame, path_cols: List[str], 
                           value_col: str, color_col: str = None, title: str = None) -> str:
        """Create treemap chart for hierarchical data"""
        try:
            required_cols = path_cols + [value_col]
            if color_col and color_col in data.columns:
                required_cols.append(color_col)
                
            if not self.validate_data(data, required_cols):
                return self.create_error_chart("Missing required columns for treemap chart")
            
            # Clean data
            clean_data = data[required_cols].dropna()
            
            if clean_data.empty:
                return self.create_error_chart("No valid data for treemap chart")
            
            fig = px.treemap(
                clean_data,
                path=path_cols,
                values=value_col,
                color=color_col if color_col and color_col in clean_data.columns else value_col,
                title=title or 'Treemap Chart',
                color_continuous_scale=self.get_color_scale('sequential')
            )
            
            fig = self.apply_standard_layout(fig, title or "Treemap Chart", height=500)
            
            return self.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating treemap chart: {e}")
            return self.create_error_chart("Treemap chart generation failed")
    
    def create_icicle_chart(self, data: pd.DataFrame, path_cols: List[str],
                           value_col: str, title: str = None) -> str:
        """Create icicle chart for hierarchical data"""
        try:
            if not self.validate_data(data, path_cols + [value_col]):
                return self.create_error_chart("Missing required columns for icicle chart")
            
            # Clean data
            clean_data = data[path_cols + [value_col]].dropna()
            
            if clean_data.empty:
                return self.create_error_chart("No valid data for icicle chart")
            
            fig = px.icicle(
                clean_data,
                path=path_cols,
                values=value_col,
                title=title or 'Icicle Chart',
                color_discrete_sequence=self.get_categorical_colors(10)
            )
            
            fig = self.apply_standard_layout(fig, title or "Icicle Chart", height=500)
            
            return self.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating icicle chart: {e}")
            return self.create_error_chart("Icicle chart generation failed")
    
    def create_sankey_diagram(self, source: List[str], target: List[str], 
                             value: List[float], labels: List[str] = None,
                             title: str = None) -> str:
        """Create Sankey diagram for flow visualization"""
        try:
            if len(source) != len(target) or len(source) != len(value):
                return self.create_error_chart("Source, target, and value lists must have same length")
            
            if not source or not target or not value:
                return self.create_error_chart("Empty data for Sankey diagram")
            
            # Create unique labels if not provided
            if labels is None:
                unique_nodes = list(set(source + target))
                labels = unique_nodes
            else:
                unique_nodes = labels
            
            # Map source and target to indices
            node_map = {label: i for i, label in enumerate(unique_nodes)}
            source_indices = [node_map.get(s, 0) for s in source]
            target_indices = [node_map.get(t, 0) for t in target]
            
            # Generate colors for nodes and links
            node_colors = self.get_categorical_colors(len(labels))
            link_colors = [f'rgba{(*px.colors.hex_to_rgb(node_colors[i]), 0.4)}' 
                          for i in source_indices]
            
            fig = go.Figure(data=[go.Sankey(
                node=dict(
                    pad=15,
                    thickness=20,
                    line=dict(color="black", width=0.5),
                    label=labels,
                    color=node_colors
                ),
                link=dict(
                    source=source_indices,
                    target=target_indices,
                    value=value,
                    color=link_colors
                )
            )])
            
            fig = self.apply_standard_layout(fig, title or "Sankey Diagram", height=500)
            
            return self.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating Sankey diagram: {e}")
            return self.create_error_chart("Sankey diagram generation failed")
    
    def create_dendrogram(self, data: pd.DataFrame, features: List[str] = None,
                         method: str = 'ward', title: str = None) -> str:
        """Create dendrogram for hierarchical clustering"""
        try:
            if not self.validate_data(data):
                return self.create_error_chart("Invalid data for dendrogram")
            
            # Select features for clustering
            if features is None:
                numeric_data = data.select_dtypes(include=[np.number])
                if numeric_data.empty:
                    return self.create_error_chart("No numeric columns for clustering")
                features = list(numeric_data.columns[:10])  # Limit features
            else:
                numeric_data = data[features]
            
            # Clean data
            clean_data = numeric_data.dropna()
            
            if clean_data.empty or len(clean_data) < 2:
                return self.create_error_chart("Insufficient data for clustering")
            
            try:
                from scipy.cluster.hierarchy import dendrogram, linkage
                from scipy.spatial.distance import pdist
                
                # Standardize data
                from sklearn.preprocessing import StandardScaler
                scaler = StandardScaler()
                scaled_data = scaler.fit_transform(clean_data)
                
                # Perform hierarchical clustering
                linkage_matrix = linkage(scaled_data, method=method)
                
                # Create dendrogram
                dend = dendrogram(linkage_matrix, no_plot=True)
                
                # Extract dendrogram data
                x_coords = dend['icoord']
                y_coords = dend['dcoord']
                
                fig = go.Figure()
                
                # Add dendrogram lines
                for i in range(len(x_coords)):
                    fig.add_trace(go.Scatter(
                        x=x_coords[i],
                        y=y_coords[i],
                        mode='lines',
                        line=dict(color=self.color_palette['primary'], width=2),
                        showlegend=False,
                        hoverinfo='skip'
                    ))
                
                fig = self.apply_standard_layout(
                    fig, title or f"Dendrogram ({method} linkage)", height=500,
                    xaxis_title="Sample Index",
                    yaxis_title="Distance"
                )
                
                return self.safe_to_json(fig)
                
            except ImportError:
                return self.create_error_chart("SciPy and scikit-learn required for dendrogram")
            
        except Exception as e:
            logger.error(f"Error creating dendrogram: {e}")
            return self.create_error_chart("Dendrogram generation failed")
    
    def create_circular_packing(self, data: pd.DataFrame, size_col: str, 
                               label_col: str, color_col: str = None,
                               title: str = None) -> str:
        """Create circular packing visualization"""
        try:
            required_cols = [size_col, label_col]
            if color_col and color_col in data.columns:
                required_cols.append(color_col)
                
            if not self.validate_data(data, required_cols):
                return self.create_error_chart("Missing required columns for circular packing")
            
            # Clean data
            clean_data = data[required_cols].dropna()
            
            if clean_data.empty:
                return self.create_error_chart("No valid data for circular packing")
            
            # Simple implementation using scatter plot with varying sizes
            # For true circular packing, would need more complex algorithm
            
            fig = go.Figure()
            
            # Calculate bubble sizes (scaled to reasonable range)
            sizes = clean_data[size_col]
            size_range = sizes.max() - sizes.min()
            if size_range > 0:
                normalized_sizes = 20 + 60 * (sizes - sizes.min()) / size_range
            else:
                normalized_sizes = [40] * len(sizes)
            
            # Generate positions (simplified grid layout)
            n_items = len(clean_data)
            grid_size = int(np.ceil(np.sqrt(n_items)))
            positions = [(i % grid_size, i // grid_size) for i in range(n_items)]
            
            colors = (clean_data[color_col] if color_col and color_col in clean_data.columns 
                     else self.color_palette['primary'])
            
            fig.add_trace(go.Scatter(
                x=[pos[0] for pos in positions],
                y=[pos[1] for pos in positions],
                mode='markers+text',
                marker=dict(
                    size=normalized_sizes,
                    color=colors,
                    opacity=0.7,
                    line=dict(width=2, color='white')
                ),
                text=clean_data[label_col],
                textposition="middle center",
                textfont=dict(size=10),
                hovertemplate='<b>%{text}</b><br>Size: %{marker.size}<extra></extra>',
                showlegend=False
            ))
            
            fig.update_layout(
                title=title or "Circular Packing",
                xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                template='plotly_white',
                height=500
            )
            
            return self.safe_to_json(fig)
            
        except Exception as e:
            logger.error(f"Error creating circular packing: {e}")
            return self.create_error_chart("Circular packing generation failed")