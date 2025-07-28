#!/usr/bin/env python3
"""
FCA Web Application
Main Flask application for viewing analysis results
"""

from flask import Flask, render_template, send_from_directory
import os
import logging
from datetime import datetime

# Import route manager instead of API routes
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from routes.route_manager import RouteManager
from utils.monitoring_middleware import MonitoringMiddleware
from utils.system_monitor import global_monitor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app():
    """Application factory"""
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = 'fca-analysis-dashboard-2025'
    app.config['DEBUG'] = True
    
    # Initialize monitoring middleware
    monitoring_middleware = MonitoringMiddleware(app)
    
    # Initialize module loader and route manager
    from core.module_loader import ModuleLoader
    module_loader = ModuleLoader()
    route_manager = RouteManager(app, module_loader)
    route_manager.setup_routes()
    
    # Add monitoring API endpoint
    @app.route('/api/monitoring/health')
    def monitoring_health():
        """시스템 모니터링 상태 API"""
        from flask import jsonify
        from utils.system_monitor import get_health_status, get_monitoring_stats
        
        return jsonify({
            'health': get_health_status(),
            'monitoring_stats': get_monitoring_stats(),
            'timestamp': datetime.now().isoformat()
        })
    
    # Add debug page for widget troubleshooting
    @app.route('/debug')
    def debug_page():
        """위젯 디버깅 페이지"""
        return send_from_directory('/root/FCA', 'test_widget_debug.html')
    
    return app

if __name__ == '__main__':
    app = create_app()
    
    logger.info("Starting FCA Web Application...")
    logger.info("Dashboard available at: http://localhost:5003")
    
    app.run(host='0.0.0.0', port=5003, debug=True)