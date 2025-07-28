#!/usr/bin/env python3
"""
Chart API Routes
API endpoints for generating various charts and visualizations
"""

from flask import Blueprint, jsonify, request
import logging
from typing import Dict, Any

# Import data loader and chart generator
import sys
sys.path.append('/root/FCA/web_app')
from modules.data_loader import DataLoader
from modules.simple_chart_generator import SimpleChartGenerator

logger = logging.getLogger(__name__)

# Create Blueprint
chart_bp = Blueprint('chart_api', __name__, url_prefix='/api/charts')

# Initialize modules
data_loader = DataLoader()
chart_generator = SimpleChartGenerator()

@chart_bp.route('/overview', methods=['GET'])
def get_overview_chart():
    """Get performance overview chart"""
    try:
        fraud_df = data_loader.get_fraud_results()
        sentiment_df = data_loader.get_sentiment_results()
        attrition_df = data_loader.get_attrition_results()
        
        if fraud_df is None or sentiment_df is None or attrition_df is None:
            return jsonify({'error': 'Required data not available'}), 404
        
        chart_json = chart_generator.create_performance_overview(
            fraud_df, sentiment_df, attrition_df
        )
        
        return jsonify({
            'status': 'success',
            'chart': chart_json
        })
    except Exception as e:
        logger.error(f"Error creating overview chart: {e}")
        return jsonify({'error': str(e)}), 500

@chart_bp.route('/fraud', methods=['GET'])
def get_fraud_chart():
    """Get fraud detection comparison chart"""
    try:
        fraud_df = data_loader.get_fraud_results()
        if fraud_df is None:
            return jsonify({'error': 'Fraud data not available'}), 404
        
        chart_json = chart_generator.create_fraud_comparison(fraud_df)
        
        return jsonify({
            'status': 'success',
            'chart': chart_json
        })
    except Exception as e:
        logger.error(f"Error creating fraud chart: {e}")
        return jsonify({'error': str(e)}), 500

@chart_bp.route('/sentiment', methods=['GET'])
def get_sentiment_chart():
    """Get sentiment analysis performance chart"""
    try:
        sentiment_df = data_loader.get_sentiment_results()
        if sentiment_df is None:
            return jsonify({'error': 'Sentiment data not available'}), 404
        
        chart_json = chart_generator.create_sentiment_performance(sentiment_df)
        
        return jsonify({
            'status': 'success',
            'chart': chart_json
        })
    except Exception as e:
        logger.error(f"Error creating sentiment chart: {e}")
        return jsonify({'error': str(e)}), 500

@chart_bp.route('/distribution', methods=['GET'])
def get_distribution_chart():
    """Get model distribution chart"""
    try:
        fraud_df = data_loader.get_fraud_results()
        sentiment_df = data_loader.get_sentiment_results()
        attrition_df = data_loader.get_attrition_results()
        
        if fraud_df is None or sentiment_df is None or attrition_df is None:
            return jsonify({'error': 'Required data not available'}), 404
        
        chart_json = chart_generator.create_model_distribution(
            fraud_df, sentiment_df, attrition_df
        )
        
        return jsonify({
            'status': 'success',
            'chart': chart_json
        })
    except Exception as e:
        logger.error(f"Error creating distribution chart: {e}")
        return jsonify({'error': str(e)}), 500

@chart_bp.route('/radar', methods=['GET'])
def get_radar_chart():
    """Get performance radar chart"""
    try:
        summary = data_loader.get_summary_stats()
        if not summary:
            return jsonify({'error': 'Summary data not available'}), 404
        
        chart_json = chart_generator.create_performance_radar(summary)
        
        return jsonify({
            'status': 'success',
            'chart': chart_json
        })
    except Exception as e:
        logger.error(f"Error creating radar chart: {e}")
        return jsonify({'error': str(e)}), 500

@chart_bp.route('/success', methods=['GET'])
def get_success_chart():
    """Get success metrics gauge chart"""
    try:
        fraud_df = data_loader.get_fraud_results()
        sentiment_df = data_loader.get_sentiment_results()
        attrition_df = data_loader.get_attrition_results()
        
        if fraud_df is None or sentiment_df is None or attrition_df is None:
            return jsonify({'error': 'Required data not available'}), 404
        
        chart_json = chart_generator.create_success_metrics(
            fraud_df, sentiment_df, attrition_df
        )
        
        return jsonify({
            'status': 'success',
            'chart': chart_json
        })
    except Exception as e:
        logger.error(f"Error creating success chart: {e}")
        return jsonify({'error': str(e)}), 500

@chart_bp.route('/datasets', methods=['GET'])
def get_dataset_chart():
    """Get dataset overview chart"""
    try:
        eda_data = data_loader.get_eda_report()
        chart_json = chart_generator.create_dataset_overview(eda_data)
        
        return jsonify({
            'status': 'success',
            'chart': chart_json
        })
    except Exception as e:
        logger.error(f"Error creating dataset chart: {e}")
        return jsonify({'error': str(e)}), 500