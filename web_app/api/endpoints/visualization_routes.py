#!/usr/bin/env python3
"""
Visualization API Routes
API endpoints for advanced visualizations including heatmaps, distributions, and 3D charts
"""

from flask import Blueprint, jsonify, request
import logging
from typing import Dict, Any, List
import pandas as pd
import numpy as np

# Import data loader and chart generator
import sys
sys.path.append('/root/FCA/web_app')
from modules.data_loader import DataLoader
from modules.chart_generator_v2 import ChartGenerator

logger = logging.getLogger(__name__)

# Create Blueprint
viz_bp = Blueprint('viz_api', __name__, url_prefix='/api/visualizations')

# Initialize modules
data_loader = DataLoader()
chart_generator = ChartGenerator()

@viz_bp.route('/heatmap/correlation', methods=['POST'])
def get_correlation_heatmap():
    """Get correlation heatmap"""
    try:
        data = request.get_json()
        if not data or 'data' not in data:
            return jsonify({'error': 'Data required for correlation heatmap'}), 400
        
        df = pd.DataFrame(data['data'])
        title = data.get('title', 'Correlation Heatmap')
        
        chart_json = chart_generator.create_correlation_heatmap(df, title)
        
        return jsonify({
            'status': 'success',
            'chart': chart_json
        })
    except Exception as e:
        logger.error(f"Error creating correlation heatmap: {e}")
        return jsonify({'error': str(e)}), 500

@viz_bp.route('/heatmap/confusion-matrix', methods=['POST'])
def get_confusion_matrix_heatmap():
    """Get confusion matrix heatmap"""
    try:
        data = request.get_json()
        if not data or 'y_true' not in data or 'y_pred' not in data:
            return jsonify({'error': 'y_true and y_pred required for confusion matrix'}), 400
        
        y_true = data['y_true']
        y_pred = data['y_pred']
        labels = data.get('labels')
        
        chart_json = chart_generator.create_confusion_matrix_heatmap(y_true, y_pred, labels)
        
        return jsonify({
            'status': 'success',
            'chart': chart_json
        })
    except Exception as e:
        logger.error(f"Error creating confusion matrix heatmap: {e}")
        return jsonify({'error': str(e)}), 500

@viz_bp.route('/distribution/violin', methods=['POST'])
def get_violin_plot():
    """Get violin plot for distribution analysis"""
    try:
        data = request.get_json()
        if not data or 'data' not in data or 'x_col' not in data or 'y_col' not in data:
            return jsonify({'error': 'Data, x_col, and y_col required for violin plot'}), 400
        
        df = pd.DataFrame(data['data'])
        x_col = data['x_col']
        y_col = data['y_col']
        color_col = data.get('color_col')
        
        chart_json = chart_generator.create_violin_plot(df, x_col, y_col, color_col)
        
        return jsonify({
            'status': 'success',
            'chart': chart_json
        })
    except Exception as e:
        logger.error(f"Error creating violin plot: {e}")
        return jsonify({'error': str(e)}), 500

@viz_bp.route('/distribution/box', methods=['POST'])
def get_box_plot():
    """Get box plot for distribution analysis"""
    try:
        data = request.get_json()
        if not data or 'data' not in data or 'x_col' not in data or 'y_col' not in data:
            return jsonify({'error': 'Data, x_col, and y_col required for box plot'}), 400
        
        df = pd.DataFrame(data['data'])
        x_col = data['x_col']
        y_col = data['y_col']
        color_col = data.get('color_col')
        
        chart_json = chart_generator.create_box_plot(df, x_col, y_col, color_col)
        
        return jsonify({
            'status': 'success',
            'chart': chart_json
        })
    except Exception as e:
        logger.error(f"Error creating box plot: {e}")
        return jsonify({'error': str(e)}), 500

@viz_bp.route('/relationship/scatter-matrix', methods=['POST'])
def get_scatter_plot_matrix():
    """Get scatter plot matrix for relationship analysis"""
    try:
        data = request.get_json()
        if not data or 'data' not in data:
            return jsonify({'error': 'Data required for scatter plot matrix'}), 400
        
        df = pd.DataFrame(data['data'])
        features = data.get('features')
        color_col = data.get('color_col')
        
        chart_json = chart_generator.create_scatter_plot_matrix(df, features, color_col)
        
        return jsonify({
            'status': 'success',
            'chart': chart_json
        })
    except Exception as e:
        logger.error(f"Error creating scatter plot matrix: {e}")
        return jsonify({'error': str(e)}), 500

@viz_bp.route('/relationship/parallel-coordinates', methods=['POST'])
def get_parallel_coordinates():
    """Get parallel coordinates plot"""
    try:
        data = request.get_json()
        if not data or 'data' not in data or 'features' not in data:
            return jsonify({'error': 'Data and features required for parallel coordinates'}), 400
        
        df = pd.DataFrame(data['data'])
        features = data['features']
        color_col = data.get('color_col')
        
        chart_json = chart_generator.create_parallel_coordinates(df, features, color_col)
        
        return jsonify({
            'status': 'success',
            'chart': chart_json
        })
    except Exception as e:
        logger.error(f"Error creating parallel coordinates plot: {e}")
        return jsonify({'error': str(e)}), 500

@viz_bp.route('/hierarchical/sunburst', methods=['POST'])
def get_sunburst_chart():
    """Get sunburst chart for hierarchical data"""
    try:
        data = request.get_json()
        if not data or 'data' not in data or 'path_cols' not in data or 'value_col' not in data:
            return jsonify({'error': 'Data, path_cols, and value_col required for sunburst chart'}), 400
        
        df = pd.DataFrame(data['data'])
        path_cols = data['path_cols']
        value_col = data['value_col']
        
        chart_json = chart_generator.create_sunburst_chart(df, path_cols, value_col)
        
        return jsonify({
            'status': 'success',
            'chart': chart_json
        })
    except Exception as e:
        logger.error(f"Error creating sunburst chart: {e}")
        return jsonify({'error': str(e)}), 500

@viz_bp.route('/hierarchical/treemap', methods=['POST'])
def get_treemap_chart():
    """Get treemap chart for hierarchical data"""
    try:
        data = request.get_json()
        if not data or 'data' not in data or 'path_cols' not in data or 'value_col' not in data:
            return jsonify({'error': 'Data, path_cols, and value_col required for treemap chart'}), 400
        
        df = pd.DataFrame(data['data'])
        path_cols = data['path_cols']
        value_col = data['value_col']
        color_col = data.get('color_col')
        
        chart_json = chart_generator.create_treemap_chart(df, path_cols, value_col, color_col)
        
        return jsonify({
            'status': 'success',
            'chart': chart_json
        })
    except Exception as e:
        logger.error(f"Error creating treemap chart: {e}")
        return jsonify({'error': str(e)}), 500

@viz_bp.route('/3d/scatter', methods=['POST'])
def get_3d_scatter_plot():
    """Get 3D scatter plot"""
    try:
        data = request.get_json()
        if not data or 'data' not in data or 'x_col' not in data or 'y_col' not in data or 'z_col' not in data:
            return jsonify({'error': 'Data, x_col, y_col, and z_col required for 3D scatter plot'}), 400
        
        df = pd.DataFrame(data['data'])
        x_col = data['x_col']
        y_col = data['y_col']
        z_col = data['z_col']
        color_col = data.get('color_col')
        size_col = data.get('size_col')
        
        chart_json = chart_generator.create_3d_scatter_plot(df, x_col, y_col, z_col, color_col, size_col)
        
        return jsonify({
            'status': 'success',
            'chart': chart_json
        })
    except Exception as e:
        logger.error(f"Error creating 3D scatter plot: {e}")
        return jsonify({'error': str(e)}), 500

@viz_bp.route('/sample-data/<chart_type>', methods=['GET'])
def get_sample_data(chart_type: str):
    """Generate sample data for different chart types"""
    try:
        sample_data = {}
        
        if chart_type == 'correlation':
            # Sample data for correlation heatmap
            np.random.seed(42)
            sample_data = {
                'data': {
                    'Feature_A': np.random.normal(0, 1, 100).tolist(),
                    'Feature_B': np.random.normal(0, 1, 100).tolist(),
                    'Feature_C': np.random.normal(0, 1, 100).tolist(),
                    'Feature_D': np.random.normal(0, 1, 100).tolist()
                }
            }
            
        elif chart_type == 'violin':
            # Sample data for violin plot
            np.random.seed(42)
            categories = ['A', 'B', 'C'] * 50
            values = np.concatenate([
                np.random.normal(10, 2, 50),
                np.random.normal(15, 3, 50),
                np.random.normal(12, 2.5, 50)
            ])
            sample_data = {
                'data': {
                    'Category': categories,
                    'Value': values.tolist()
                },
                'x_col': 'Category',
                'y_col': 'Value'
            }
            
        elif chart_type == 'scatter-matrix':
            # Sample data for scatter plot matrix
            np.random.seed(42)
            n_samples = 100
            sample_data = {
                'data': {
                    'X1': np.random.normal(0, 1, n_samples).tolist(),
                    'X2': np.random.normal(0, 1, n_samples).tolist(),
                    'X3': np.random.normal(0, 1, n_samples).tolist(),
                    'Category': np.random.choice(['A', 'B', 'C'], n_samples).tolist()
                },
                'features': ['X1', 'X2', 'X3'],
                'color_col': 'Category'
            }
            
        elif chart_type == 'sunburst':
            # Sample hierarchical data
            sample_data = {
                'data': {
                    'Region': ['North', 'North', 'North', 'South', 'South', 'South'],
                    'Country': ['USA', 'USA', 'Canada', 'Brazil', 'Brazil', 'Argentina'],
                    'City': ['NYC', 'LA', 'Toronto', 'Rio', 'São Paulo', 'Buenos Aires'],
                    'Sales': [100, 80, 60, 90, 120, 70]
                },
                'path_cols': ['Region', 'Country', 'City'],
                'value_col': 'Sales'
            }
            
        elif chart_type == '3d-scatter':
            # Sample 3D data
            np.random.seed(42)
            n_samples = 50
            sample_data = {
                'data': {
                    'X': np.random.normal(0, 1, n_samples).tolist(),
                    'Y': np.random.normal(0, 1, n_samples).tolist(),
                    'Z': np.random.normal(0, 1, n_samples).tolist(),
                    'Category': np.random.choice(['A', 'B', 'C'], n_samples).tolist(),
                    'Size': np.random.uniform(5, 20, n_samples).tolist()
                },
                'x_col': 'X',
                'y_col': 'Y',
                'z_col': 'Z',
                'color_col': 'Category',
                'size_col': 'Size'
            }
            
        else:
            return jsonify({'error': f'Unknown chart type: {chart_type}'}), 400
        
        return jsonify({
            'status': 'success',
            'chart_type': chart_type,
            'sample_data': sample_data
        })
        
    except Exception as e:
        logger.error(f"Error generating sample data for {chart_type}: {e}")
        return jsonify({'error': str(e)}), 500

@viz_bp.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Visualization endpoint not found'}), 404

@viz_bp.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error in visualization module'}), 500