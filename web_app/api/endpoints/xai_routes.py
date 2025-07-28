#!/usr/bin/env python3
"""
XAI API Routes
API endpoints for Explainable AI features and visualizations
"""

from flask import Blueprint, jsonify, request
import logging
from typing import Dict, Any, List
import numpy as np

# Import data loader and chart generator
import sys
sys.path.append('/root/FCA/web_app')
from modules.data_loader import DataLoader
from modules.chart_generator_v2 import ChartGenerator

logger = logging.getLogger(__name__)

# Create Blueprint
xai_bp = Blueprint('xai_api', __name__, url_prefix='/api/xai')

# Initialize modules
data_loader = DataLoader()
chart_generator = ChartGenerator()

@xai_bp.route('/shap/importance', methods=['POST'])
def get_shap_importance():
    """Get SHAP feature importance chart"""
    try:
        data = request.get_json()
        if not data or 'features' not in data or 'shap_values' not in data:
            return jsonify({'error': 'Features and SHAP values required'}), 400
        
        features = data['features']
        shap_values = data['shap_values']
        title = data.get('title', 'SHAP Feature Importance')
        
        chart_json = chart_generator.create_shap_importance_chart(features, shap_values, title)
        
        return jsonify({
            'status': 'success',
            'chart': chart_json
        })
    except Exception as e:
        logger.error(f"Error creating SHAP importance chart: {e}")
        return jsonify({'error': str(e)}), 500

@xai_bp.route('/shap/waterfall', methods=['POST'])
def get_shap_waterfall():
    """Get SHAP waterfall chart for individual prediction"""
    try:
        data = request.get_json()
        if not data or 'features' not in data or 'contributions' not in data or 'base_value' not in data:
            return jsonify({'error': 'Features, contributions, and base_value required'}), 400
        
        features = data['features']
        contributions = data['contributions']
        base_value = data['base_value']
        title = data.get('title', 'SHAP Waterfall Plot')
        
        chart_json = chart_generator.create_shap_waterfall_chart(features, contributions, base_value, title)
        
        return jsonify({
            'status': 'success',
            'chart': chart_json
        })
    except Exception as e:
        logger.error(f"Error creating SHAP waterfall chart: {e}")
        return jsonify({'error': str(e)}), 500

@xai_bp.route('/lime/explanation', methods=['POST'])
def get_lime_explanation():
    """Get LIME local explanation chart"""
    try:
        data = request.get_json()
        if not data or 'features' not in data or 'contributions' not in data:
            return jsonify({'error': 'Features and contributions required'}), 400
        
        features = data['features']
        contributions = data['contributions']
        title = data.get('title', 'LIME Local Explanation')
        
        chart_json = chart_generator.create_lime_explanation_chart(features, contributions, title)
        
        return jsonify({
            'status': 'success',
            'chart': chart_json
        })
    except Exception as e:
        logger.error(f"Error creating LIME explanation chart: {e}")
        return jsonify({'error': str(e)}), 500

@xai_bp.route('/partial-dependence', methods=['POST'])
def get_partial_dependence():
    """Get partial dependence plot"""
    try:
        data = request.get_json()
        if not data or 'feature_values' not in data or 'pd_values' not in data or 'feature_name' not in data:
            return jsonify({'error': 'Feature values, PD values, and feature name required'}), 400
        
        feature_values = data['feature_values']
        pd_values = data['pd_values']
        feature_name = data['feature_name']
        title = data.get('title')
        
        chart_json = chart_generator.create_partial_dependence_plot(feature_values, pd_values, feature_name, title)
        
        return jsonify({
            'status': 'success',
            'chart': chart_json
        })
    except Exception as e:
        logger.error(f"Error creating partial dependence plot: {e}")
        return jsonify({'error': str(e)}), 500

@xai_bp.route('/interpretability/radar', methods=['POST'])
def get_interpretability_radar():
    """Get interpretability comparison radar chart"""
    try:
        data = request.get_json()
        if not data or 'domains' not in data or 'metrics' not in data:
            return jsonify({'error': 'Domains and metrics required'}), 400
        
        domains = data['domains']
        metrics = data['metrics']
        title = data.get('title', 'Model Interpretability Comparison')
        
        chart_json = chart_generator.create_interpretability_radar_chart(domains, metrics, title)
        
        return jsonify({
            'status': 'success',
            'chart': chart_json
        })
    except Exception as e:
        logger.error(f"Error creating interpretability radar chart: {e}")
        return jsonify({'error': str(e)}), 500

@xai_bp.route('/feature-importance/pie', methods=['POST'])
def get_feature_importance_pie():
    """Get feature importance pie chart"""
    try:
        data = request.get_json()
        if not data or 'features' not in data or 'importance' not in data:
            return jsonify({'error': 'Features and importance values required'}), 400
        
        features = data['features']
        importance = data['importance']
        title = data.get('title', 'Global Feature Importance Distribution')
        
        chart_json = chart_generator.create_feature_importance_pie_chart(features, importance, title)
        
        return jsonify({
            'status': 'success',
            'chart': chart_json
        })
    except Exception as e:
        logger.error(f"Error creating feature importance pie chart: {e}")
        return jsonify({'error': str(e)}), 500

@xai_bp.route('/sample-data', methods=['GET'])
def get_sample_xai_data():
    """Generate sample XAI data for demonstration"""
    try:
        # Generate sample SHAP data
        features = ['Age', 'Income', 'Credit_Score', 'Account_Balance', 'Transaction_Count']
        shap_values = [0.2, -0.1, 0.15, 0.05, -0.3]
        
        # Generate sample LIME data
        lime_features = ['Transaction_Amount', 'Merchant_Category', 'Time_of_Day', 'Location']
        lime_contributions = [0.25, -0.15, 0.1, -0.05]
        
        # Generate sample partial dependence data
        pd_feature_values = list(np.linspace(18, 80, 20))
        pd_values = [0.1 + 0.02 * x - 0.0003 * x**2 for x in pd_feature_values]
        
        # Generate interpretability metrics
        domains = ['Fraud Detection', 'Sentiment Analysis', 'Customer Attrition']
        metrics = {
            'Accuracy': [92, 87, 89],
            'Interpretability': [85, 78, 82],
            'Feature Clarity': [88, 81, 86],
            'Decision Transparency': [90, 75, 84]
        }
        
        return jsonify({
            'status': 'success',
            'sample_data': {
                'shap': {
                    'features': features,
                    'values': shap_values
                },
                'lime': {
                    'features': lime_features,
                    'contributions': lime_contributions
                },
                'partial_dependence': {
                    'feature_name': 'Age',
                    'feature_values': pd_feature_values,
                    'pd_values': pd_values
                },
                'interpretability_radar': {
                    'domains': domains,
                    'metrics': metrics
                }
            }
        })
    except Exception as e:
        logger.error(f"Error generating sample XAI data: {e}")
        return jsonify({'error': str(e)}), 500

@xai_bp.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'XAI endpoint not found'}), 404

@xai_bp.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error in XAI module'}), 500