#!/usr/bin/env python3
"""
Base API Routes
Core API endpoints for health checks, summary data, and basic operations
"""

from flask import Blueprint, jsonify, send_from_directory, request
import os
import logging
from typing import Dict, Any

# Import data loader
import sys
sys.path.append('/root/FCA/web_app')
from modules.data_loader import DataLoader

logger = logging.getLogger(__name__)

# Create Blueprint
base_bp = Blueprint('base_api', __name__, url_prefix='/api')

# Initialize data loader
data_loader = DataLoader()

@base_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        health = data_loader.health_check()
        return jsonify({
            'status': 'healthy',
            'data_sources': health,
            'all_available': all(health.values())
        })
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({'status': 'unhealthy', 'error': str(e)}), 500

@base_bp.route('/summary', methods=['GET'])
def get_summary():
    """Get project summary statistics"""
    try:
        summary = data_loader.get_summary_stats()
        if not summary:
            return jsonify({'error': 'No data available'}), 404
        
        return jsonify({
            'status': 'success',
            'data': summary
        })
    except Exception as e:
        logger.error(f"Error getting summary: {e}")
        return jsonify({'error': str(e)}), 500

@base_bp.route('/results/<domain>', methods=['GET'])
def get_domain_results(domain: str):
    """Get results for specific domain"""
    try:
        domain_map = {
            'fraud': data_loader.get_fraud_results,
            'sentiment': data_loader.get_sentiment_results,
            'attrition': data_loader.get_attrition_results
        }
        
        if domain not in domain_map:
            return jsonify({'error': 'Invalid domain'}), 400
        
        results = domain_map[domain]()
        if results is None:
            return jsonify({'error': f'No data available for {domain}'}), 404
        
        return jsonify({
            'status': 'success',
            'domain': domain,
            'data': results.to_dict('records')
        })
    except Exception as e:
        logger.error(f"Error getting {domain} results: {e}")
        return jsonify({'error': str(e)}), 500

@base_bp.route('/images', methods=['GET'])
def get_available_images():
    """Get list of available visualization images"""
    try:
        images = data_loader.get_available_images()
        return jsonify({
            'status': 'success',
            'images': images
        })
    except Exception as e:
        logger.error(f"Error getting images: {e}")
        return jsonify({'error': str(e)}), 500

@base_bp.route('/chart/<chart_type>', methods=['GET'])
def get_chart(chart_type: str):
    """Get chart data for different chart types"""
    try:
        from modules.simple_chart_generator import SimpleChartGenerator
        chart_generator = SimpleChartGenerator()
        
        fraud_df = data_loader.get_fraud_results()
        sentiment_df = data_loader.get_sentiment_results()
        attrition_df = data_loader.get_attrition_results()
        
        if fraud_df is None:
            fraud_df = pd.DataFrame()
        if sentiment_df is None:
            sentiment_df = pd.DataFrame()
        if attrition_df is None:
            attrition_df = pd.DataFrame()
        
        chart_map = {
            'overview': lambda: chart_generator.create_performance_overview(fraud_df, sentiment_df, attrition_df),
            'distribution': lambda: chart_generator.create_distribution_chart(fraud_df),
            'success': lambda: chart_generator.create_success_chart(fraud_df, sentiment_df, attrition_df),
            'radar': lambda: chart_generator.create_radar_chart(fraud_df, sentiment_df, attrition_df)
        }
        
        if chart_type not in chart_map:
            return jsonify({'error': 'Invalid chart type'}), 400
        
        chart_json = chart_map[chart_type]()
        
        return jsonify({
            'status': 'success',
            'chart': chart_json
        })
    except Exception as e:
        logger.error(f"Error generating {chart_type} chart: {e}")
        return jsonify({'error': str(e)}), 500

@base_bp.route('/images/<image_name>', methods=['GET'])
def serve_image(image_name: str):
    """Serve visualization images"""
    try:
        docs_dir = "/root/FCA/docs"
        if os.path.exists(os.path.join(docs_dir, image_name)):
            return send_from_directory(docs_dir, image_name)
        else:
            return jsonify({'error': 'Image not found'}), 404
    except Exception as e:
        logger.error(f"Error serving image {image_name}: {e}")
        return jsonify({'error': str(e)}), 500

@base_bp.route('/models/compare', methods=['GET'])
def compare_models():
    """Compare all models across domains"""
    try:
        results = data_loader.get_all_results()
        summary = data_loader.get_summary_stats()
        
        comparison_data = []
        
        # Fraud detection
        if results['fraud'] is not None:
            for _, row in results['fraud'].iterrows():
                comparison_data.append({
                    'domain': 'Fraud Detection',
                    'dataset': row['Dataset'],
                    'model': row['Model'],
                    'primary_metric': 'AUC-ROC',
                    'primary_score': float(row['AUC-ROC']),
                    'secondary_metric': 'F1-Score',
                    'secondary_score': float(row['F1-Score']) if 'F1-Score' in row else 0
                })
        
        # Sentiment analysis
        if results['sentiment'] is not None:
            for _, row in results['sentiment'].iterrows():
                comparison_data.append({
                    'domain': 'Sentiment Analysis',
                    'dataset': 'Financial Phrasebank',
                    'model': row['Model'],
                    'primary_metric': 'Accuracy',
                    'primary_score': float(row['Accuracy']),
                    'secondary_metric': 'Macro F1',
                    'secondary_score': float(row['Macro F1'])
                })
        
        # Customer attrition
        if results['attrition'] is not None:
            for _, row in results['attrition'].iterrows():
                comparison_data.append({
                    'domain': 'Customer Attrition',
                    'dataset': 'Customer Attrition',
                    'model': row['Model'],
                    'primary_metric': 'AUC-ROC',
                    'primary_score': float(row['AUC-ROC']),
                    'secondary_metric': 'F1-Score',
                    'secondary_score': float(row['F1-Score'])
                })
        
        return jsonify({
            'status': 'success',
            'comparison': comparison_data,
            'summary': summary
        })
    except Exception as e:
        logger.error(f"Error comparing models: {e}")
        return jsonify({'error': str(e)}), 500

@base_bp.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Endpoint not found'}), 404

@base_bp.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error'}), 500