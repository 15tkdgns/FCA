#!/usr/bin/env python3
"""
API Routes Module
Main API blueprint that combines all modularized endpoints
"""

from flask import Blueprint
import logging

logger = logging.getLogger(__name__)

# Create main API Blueprint
api_bp = Blueprint('api', __name__)

# Try to import full modules, fallback to basic routes if dependencies missing
try:
    from .endpoints import base_bp, chart_bp, xai_bp, viz_bp
    
    # Register all modular blueprints
    api_bp.register_blueprint(base_bp)
    api_bp.register_blueprint(chart_bp) 
    api_bp.register_blueprint(xai_bp)
    api_bp.register_blueprint(viz_bp)
    
    logger.info("✅ All modular API endpoints loaded successfully")
    
except ImportError as e:
    logger.warning(f"⚠️ Full modules not available ({e}), using fallback routes")
    
    # Import fallback routes
    from .endpoints.fallback_routes import fallback_bp
    api_bp.register_blueprint(fallback_bp)
    
    logger.info("✅ Fallback API endpoints loaded")

# All endpoint logic has been moved to specialized modules
# This file now only orchestrates the modular blueprints