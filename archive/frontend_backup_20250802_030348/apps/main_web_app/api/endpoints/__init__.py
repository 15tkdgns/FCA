"""
API Endpoints Module
Provides modular API endpoints for different functionalities
"""

from .base_routes import base_bp
from .chart_routes import chart_bp  
from .xai_routes import xai_bp
from .visualization_routes import viz_bp

__all__ = ['base_bp', 'chart_bp', 'xai_bp', 'viz_bp']