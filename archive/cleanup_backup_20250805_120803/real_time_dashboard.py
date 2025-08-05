#!/usr/bin/env python3
"""
Real-Time Dashboard for Fraud Detection System
=============================================

This module provides a comprehensive real-time dashboard with:
- Live system metrics visualization
- Fraud detection statistics
- Alert management interface
- Security monitoring
- Performance analytics

Author: Advanced Analytics Team
Version: 1.0.0
"""

import json
import time
import threading
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from flask import Flask, render_template_string, jsonify, request, Response
from flask_socketio import SocketIO, emit
import plotly.graph_objs as go
import plotly.utils
import pandas as pd
import numpy as np
from real_time_monitoring import RealTimeMonitor, Alert

class RealTimeDashboard:
    """Real-time dashboard for fraud detection monitoring."""
    
    def __init__(self, monitor: RealTimeMonitor, port: int = 5004):
        """Initialize the dashboard."""
        self.monitor = monitor
        self.port = port
        self.app = Flask(__name__)
        self.app.config['SECRET_KEY'] = 'fraud-detection-dashboard-2024'
        self.socketio = SocketIO(self.app, cors_allowed_origins="*")
        
        # Dashboard state
        self.connected_clients = set()
        self.last_broadcast = None
        
        # Setup routes
        self._setup_routes()
        self._setup_socketio_events()
        
        # Add alert callback to monitor
        self.monitor.add_alert_callback(self._handle_alert)
        
        # Start background update thread
        self.update_thread = None
        self.is_running = False
    
    def _setup_routes(self):
        """Setup Flask routes."""
        
        @self.app.route('/')
        def dashboard():
            """Main dashboard page."""
            return render_template_string(DASHBOARD_TEMPLATE)
        
        @self.app.route('/api/status')
        def get_status():
            """Get current system status."""
            return jsonify(self.monitor.get_current_status())
        
        @self.app.route('/api/metrics/<int:hours>')
        def get_metrics(hours):
            """Get metrics history."""
            return jsonify(self.monitor.get_metrics_history(hours))
        
        @self.app.route('/api/alerts')
        def get_alerts():
            """Get active alerts."""
            alerts = []
            for alert in self.monitor.active_alerts.values():
                alerts.append({
                    'alert_id': alert.alert_id,
                    'alert_type': alert.alert_type,
                    'severity': alert.severity,
                    'message': alert.message,
                    'current_value': alert.current_value,
                    'threshold': alert.threshold,
                    'triggered_at': alert.triggered_at.isoformat(),
                    'acknowledged': alert.acknowledged
                })
            return jsonify(alerts)
        
        @self.app.route('/api/alerts/<alert_id>/acknowledge', methods=['POST'])
        def acknowledge_alert(alert_id):
            """Acknowledge an alert."""
            success = self.monitor.acknowledge_alert(alert_id)
            return jsonify({'success': success})
        
        @self.app.route('/api/security-events')
        def get_security_events():
            """Get recent security events."""
            events = []
            for event in list(self.monitor.security_events)[-50:]:  # Last 50 events
                events.append({
                    'timestamp': event.timestamp.isoformat(),
                    'event_type': event.event_type,
                    'severity': event.severity,
                    'description': event.description,
                    'risk_score': event.risk_score
                })
            return jsonify(events)
        
        @self.app.route('/api/charts/system-metrics')
        def get_system_metrics_chart():
            """Get system metrics chart data."""
            return jsonify(self._create_system_metrics_chart())
        
        @self.app.route('/api/charts/prediction-metrics')
        def get_prediction_metrics_chart():
            """Get prediction metrics chart data."""
            return jsonify(self._create_prediction_metrics_chart())
        
        @self.app.route('/api/charts/fraud-detection')
        def get_fraud_detection_chart():
            """Get fraud detection chart data."""
            return jsonify(self._create_fraud_detection_chart())
    
    def _setup_socketio_events(self):
        """Setup SocketIO events."""
        
        @self.socketio.on('connect')
        def handle_connect():
            """Handle client connection."""
            self.connected_clients.add(request.sid)
            emit('status', {'message': 'Connected to real-time dashboard'})
        
        @self.socketio.on('disconnect')
        def handle_disconnect():
            """Handle client disconnection."""
            self.connected_clients.discard(request.sid)
        
        @self.socketio.on('request_update')
        def handle_update_request():
            """Handle update request from client."""
            self._broadcast_updates()
    
    def _handle_alert(self, alert: Alert):
        """Handle new alerts from monitor."""
        alert_data = {
            'alert_id': alert.alert_id,
            'alert_type': alert.alert_type,
            'severity': alert.severity,
            'message': alert.message,
            'triggered_at': alert.triggered_at.isoformat()
        }
        self.socketio.emit('new_alert', alert_data)
    
    def _create_system_metrics_chart(self) -> Dict[str, Any]:
        """Create system metrics chart."""
        if not self.monitor.system_metrics:
            return {'data': [], 'layout': {}}
        
        # Get last 100 data points
        metrics = list(self.monitor.system_metrics)[-100:]
        
        timestamps = [m.timestamp for m in metrics]
        cpu_data = [m.cpu_percent for m in metrics]
        memory_data = [m.memory_percent for m in metrics]
        
        traces = [
            go.Scatter(
                x=timestamps,
                y=cpu_data,
                mode='lines',
                name='CPU %',
                line=dict(color='#3498db', width=2)
            ),
            go.Scatter(
                x=timestamps,
                y=memory_data,
                mode='lines',
                name='Memory %',
                line=dict(color='#e74c3c', width=2)
            )
        ]
        
        layout = go.Layout(
            title='System Performance Metrics',
            xaxis=dict(title='Time'),
            yaxis=dict(title='Percentage', range=[0, 100]),
            hovermode='x unified',
            showlegend=True
        )
        
        fig = go.Figure(data=traces, layout=layout)
        return json.loads(plotly.utils.PlotlyJSONEncoder().encode(fig))
    
    def _create_prediction_metrics_chart(self) -> Dict[str, Any]:
        """Create prediction metrics chart."""
        if not self.monitor.prediction_metrics:
            return {'data': [], 'layout': {}}
        
        metrics = list(self.monitor.prediction_metrics)[-50:]
        
        timestamps = [m.timestamp for m in metrics]
        processing_times = [m.processing_time_ms for m in metrics]
        fraud_rates = [m.fraud_rate * 100 for m in metrics]  # Convert to percentage
        
        traces = [
            go.Scatter(
                x=timestamps,
                y=processing_times,
                mode='lines+markers',
                name='Processing Time (ms)',
                yaxis='y',
                line=dict(color='#2ecc71', width=2)
            ),
            go.Scatter(
                x=timestamps,
                y=fraud_rates,
                mode='lines+markers',
                name='Fraud Rate (%)',
                yaxis='y2',
                line=dict(color='#f39c12', width=2)
            )
        ]
        
        layout = go.Layout(
            title='Prediction Performance Metrics',
            xaxis=dict(title='Time'),
            yaxis=dict(title='Processing Time (ms)', side='left'),
            yaxis2=dict(title='Fraud Rate (%)', side='right', overlaying='y'),
            hovermode='x unified',
            showlegend=True
        )
        
        fig = go.Figure(data=traces, layout=layout)
        return json.loads(plotly.utils.PlotlyJSONEncoder().encode(fig))
    
    def _create_fraud_detection_chart(self) -> Dict[str, Any]:
        """Create fraud detection statistics chart."""
        if not self.monitor.prediction_metrics:
            return {'data': [], 'layout': {}}
        
        # Aggregate data from last 24 hours
        cutoff = datetime.now() - timedelta(hours=24)
        recent_metrics = [m for m in self.monitor.prediction_metrics if m.timestamp >= cutoff]
        
        if not recent_metrics:
            return {'data': [], 'layout': {}}
        
        # Calculate hourly aggregations
        hourly_data = {}
        for metric in recent_metrics:
            hour = metric.timestamp.replace(minute=0, second=0, microsecond=0)
            if hour not in hourly_data:
                hourly_data[hour] = {
                    'total_predictions': 0,
                    'fraud_count': 0,
                    'processing_times': []
                }
            
            hourly_data[hour]['total_predictions'] += metric.prediction_count
            hourly_data[hour]['fraud_count'] += int(metric.fraud_rate * metric.prediction_count)
            hourly_data[hour]['processing_times'].append(metric.processing_time_ms)
        
        hours = sorted(hourly_data.keys())
        predictions = [hourly_data[h]['total_predictions'] for h in hours]
        fraud_counts = [hourly_data[h]['fraud_count'] for h in hours]
        avg_times = [np.mean(hourly_data[h]['processing_times']) for h in hours]
        
        traces = [
            go.Bar(
                x=hours,
                y=predictions,
                name='Total Predictions',
                marker_color='#3498db'
            ),
            go.Bar(
                x=hours,
                y=fraud_counts,
                name='Fraud Detected',
                marker_color='#e74c3c'
            ),
            go.Scatter(
                x=hours,
                y=avg_times,
                mode='lines+markers',
                name='Avg Processing Time (ms)',
                yaxis='y2',
                line=dict(color='#2ecc71', width=2)
            )
        ]
        
        layout = go.Layout(
            title='Fraud Detection Statistics (24h)',
            xaxis=dict(title='Hour'),
            yaxis=dict(title='Count'),
            yaxis2=dict(title='Processing Time (ms)', side='right', overlaying='y'),
            hovermode='x unified',
            showlegend=True,
            barmode='group'
        )
        
        fig = go.Figure(data=traces, layout=layout)
        return json.loads(plotly.utils.PlotlyJSONEncoder().encode(fig))
    
    def _broadcast_updates(self):
        """Broadcast updates to all connected clients."""
        if not self.connected_clients:
            return
        
        data = {
            'timestamp': datetime.now().isoformat(),
            'status': self.monitor.get_current_status(),
            'system_chart': self._create_system_metrics_chart(),
            'prediction_chart': self._create_prediction_metrics_chart(),
            'fraud_chart': self._create_fraud_detection_chart()
        }
        
        self.socketio.emit('dashboard_update', data)
        self.last_broadcast = datetime.now()
    
    def _update_loop(self):
        """Background update loop."""
        while self.is_running:
            try:
                if self.connected_clients:
                    self._broadcast_updates()
                time.sleep(5)  # Update every 5 seconds
            except Exception as e:
                print(f"Error in update loop: {e}")
                time.sleep(5)
    
    def start(self):
        """Start the dashboard server."""
        self.is_running = True
        
        # Start background update thread
        self.update_thread = threading.Thread(target=self._update_loop)
        self.update_thread.daemon = True
        self.update_thread.start()
        
        print(f"🚀 Real-time dashboard starting on port {self.port}")
        print(f"📊 Dashboard URL: http://localhost:{self.port}")
        
        self.socketio.run(
            self.app,
            host='0.0.0.0',
            port=self.port,
            debug=False,
            allow_unsafe_werkzeug=True
        )
    
    def stop(self):
        """Stop the dashboard server."""
        self.is_running = False
        if self.update_thread:
            self.update_thread.join(timeout=5)

# Dashboard HTML Template
DASHBOARD_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fraud Detection - Real-Time Dashboard</title>
    <script src="https://cdn.socket.io/4.0.0/socket.io.min.js"></script>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
            color: #333;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem 2rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            font-size: 2rem;
            font-weight: 300;
        }
        
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        .status-active { background-color: #2ecc71; }
        .status-warning { background-color: #f39c12; }
        .status-error { background-color: #e74c3c; }
        
        .dashboard-container {
            padding: 2rem;
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .metric-card {
            background: white;
            border-radius: 8px;
            padding: 1.5rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-left: 4px solid #3498db;
        }
        
        .metric-card.warning { border-left-color: #f39c12; }
        .metric-card.error { border-left-color: #e74c3c; }
        .metric-card.success { border-left-color: #2ecc71; }
        
        .metric-value {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }
        
        .metric-label {
            color: #666;
            font-size: 0.9rem;
        }
        
        .charts-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            margin-bottom: 2rem;
        }
        
        .chart-container {
            background: white;
            border-radius: 8px;
            padding: 1rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            min-height: 400px;
        }
        
        .full-width {
            grid-column: 1 / -1;
        }
        
        .alerts-section {
            background: white;
            border-radius: 8px;
            padding: 1.5rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
        }
        
        .alert-item {
            display: flex;
            align-items: center;
            padding: 1rem;
            margin-bottom: 0.5rem;
            border-radius: 6px;
            border-left: 4px solid #3498db;
        }
        
        .alert-item.high { border-left-color: #e74c3c; background-color: #fdf2f2; }
        .alert-item.medium { border-left-color: #f39c12; background-color: #fefcf0; }
        .alert-item.low { border-left-color: #3498db; background-color: #f0f7ff; }
        
        .alert-icon {
            margin-right: 1rem;
            font-size: 1.2rem;
        }
        
        .alert-content {
            flex: 1;
        }
        
        .alert-message {
            font-weight: bold;
            margin-bottom: 0.25rem;
        }
        
        .alert-time {
            font-size: 0.8rem;
            color: #666;
        }
        
        .ack-button {
            background: #3498db;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.8rem;
        }
        
        .ack-button:hover {
            background: #2980b9;
        }
        
        .ack-button:disabled {
            background: #bdc3c7;
            cursor: not-allowed;
        }
        
        .connection-status {
            position: fixed;
            top: 1rem;
            right: 1rem;
            background: white;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            font-size: 0.8rem;
        }
        
        .loading {
            text-align: center;
            padding: 2rem;
            color: #666;
        }
        
        @media (max-width: 768px) {
            .charts-grid {
                grid-template-columns: 1fr;
            }
            
            .dashboard-container {
                padding: 1rem;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛡️ Fraud Detection Real-Time Dashboard</h1>
        <div id="headerStatus">
            <span class="status-indicator status-active"></span>
            <span>System Active</span>
        </div>
    </div>
    
    <div class="connection-status" id="connectionStatus">
        <span class="status-indicator status-warning"></span>
        Connecting...
    </div>
    
    <div class="dashboard-container">
        <!-- Key Metrics -->
        <div class="metrics-grid" id="metricsGrid">
            <div class="metric-card">
                <div class="metric-value" id="cpuMetric">--</div>
                <div class="metric-label">CPU Usage (%)</div>
            </div>
            <div class="metric-card">
                <div class="metric-value" id="memoryMetric">--</div>
                <div class="metric-label">Memory Usage (%)</div>
            </div>
            <div class="metric-card">
                <div class="metric-value" id="fraudRateMetric">--</div>
                <div class="metric-label">Fraud Rate (%)</div>
            </div>
            <div class="metric-card">
                <div class="metric-value" id="processingTimeMetric">--</div>
                <div class="metric-label">Avg Processing (ms)</div>
            </div>
        </div>
        
        <!-- Charts -->
        <div class="charts-grid">
            <div class="chart-container">
                <div id="systemChart">
                    <div class="loading">Loading system metrics...</div>
                </div>
            </div>
            <div class="chart-container">
                <div id="predictionChart">
                    <div class="loading">Loading prediction metrics...</div>
                </div>
            </div>
            <div class="chart-container full-width">
                <div id="fraudChart">
                    <div class="loading">Loading fraud detection stats...</div>
                </div>
            </div>
        </div>
        
        <!-- Alerts Section -->
        <div class="alerts-section">
            <h3>🚨 Active Alerts</h3>
            <div id="alertsList">
                <div class="loading">Loading alerts...</div>
            </div>
        </div>
    </div>
    
    <script>
        class FraudDashboard {
            constructor() {
                this.socket = io();
                this.setupSocketEvents();
                this.loadInitialData();
            }
            
            setupSocketEvents() {
                this.socket.on('connect', () => {
                    this.updateConnectionStatus('Connected', 'active');
                });
                
                this.socket.on('disconnect', () => {
                    this.updateConnectionStatus('Disconnected', 'error');
                });
                
                this.socket.on('dashboard_update', (data) => {
                    this.updateDashboard(data);
                });
                
                this.socket.on('new_alert', (alert) => {
                    this.showNewAlert(alert);
                });
            }
            
            updateConnectionStatus(status, type) {
                const statusEl = document.getElementById('connectionStatus');
                statusEl.innerHTML = `
                    <span class="status-indicator status-${type}"></span>
                    ${status}
                `;
            }
            
            async loadInitialData() {
                try {
                    // Load current status
                    const statusResponse = await fetch('/api/status');
                    const status = await statusResponse.json();
                    this.updateMetrics(status);
                    
                    // Load charts
                    await this.loadCharts();
                    
                    // Load alerts
                    await this.loadAlerts();
                    
                } catch (error) {
                    console.error('Error loading initial data:', error);
                }
            }
            
            async loadCharts() {
                try {
                    const [systemResponse, predictionResponse, fraudResponse] = await Promise.all([
                        fetch('/api/charts/system-metrics'),
                        fetch('/api/charts/prediction-metrics'),
                        fetch('/api/charts/fraud-detection')
                    ]);
                    
                    const systemChart = await systemResponse.json();
                    const predictionChart = await predictionResponse.json();
                    const fraudChart = await fraudResponse.json();
                    
                    Plotly.newPlot('systemChart', systemChart.data, systemChart.layout, {responsive: true});
                    Plotly.newPlot('predictionChart', predictionChart.data, predictionChart.layout, {responsive: true});
                    Plotly.newPlot('fraudChart', fraudChart.data, fraudChart.layout, {responsive: true});
                    
                } catch (error) {
                    console.error('Error loading charts:', error);
                }
            }
            
            async loadAlerts() {
                try {
                    const response = await fetch('/api/alerts');
                    const alerts = await response.json();
                    this.renderAlerts(alerts);
                } catch (error) {
                    console.error('Error loading alerts:', error);
                }
            }
            
            updateDashboard(data) {
                this.updateMetrics(data.status);
                
                // Update charts
                if (data.system_chart && data.system_chart.data) {
                    Plotly.redraw('systemChart', data.system_chart.data, data.system_chart.layout);
                }
                if (data.prediction_chart && data.prediction_chart.data) {
                    Plotly.redraw('predictionChart', data.prediction_chart.data, data.prediction_chart.layout);
                }
                if (data.fraud_chart && data.fraud_chart.data) {
                    Plotly.redraw('fraudChart', data.fraud_chart.data, data.fraud_chart.layout);
                }
            }
            
            updateMetrics(status) {
                if (status.system_metrics) {
                    const sys = status.system_metrics;
                    this.updateMetricCard('cpuMetric', sys.cpu_percent, '%', [70, 85]);
                    this.updateMetricCard('memoryMetric', sys.memory_percent, '%', [70, 85]);
                }
                
                if (status.prediction_metrics) {
                    const pred = status.prediction_metrics;
                    this.updateMetricCard('fraudRateMetric', (pred.fraud_rate * 100), '%', [5, 10]);
                    this.updateMetricCard('processingTimeMetric', pred.processing_time_ms, 'ms', [500, 1000]);
                }
            }
            
            updateMetricCard(elementId, value, unit, thresholds) {
                const element = document.getElementById(elementId);
                if (!element) return;
                
                const formattedValue = typeof value === 'number' ? value.toFixed(1) : '--';
                element.textContent = formattedValue + (value !== '--' ? unit : '');
                
                // Update card styling based on thresholds
                const card = element.closest('.metric-card');
                card.className = 'metric-card';
                
                if (typeof value === 'number') {
                    if (value >= thresholds[1]) {
                        card.classList.add('error');
                    } else if (value >= thresholds[0]) {
                        card.classList.add('warning');
                    } else {
                        card.classList.add('success');
                    }
                }
            }
            
            renderAlerts(alerts) {
                const alertsList = document.getElementById('alertsList');
                
                if (!alerts || alerts.length === 0) {
                    alertsList.innerHTML = '<div class="loading">No active alerts</div>';
                    return;
                }
                
                const alertsHtml = alerts.map(alert => `
                    <div class="alert-item ${alert.severity.toLowerCase()}">
                        <div class="alert-icon">
                            ${alert.severity === 'HIGH' ? '🔴' : alert.severity === 'MEDIUM' ? '🟡' : '🔵'}
                        </div>
                        <div class="alert-content">
                            <div class="alert-message">${alert.message}</div>
                            <div class="alert-time">
                                ${new Date(alert.triggered_at).toLocaleString()}
                            </div>
                        </div>
                        <button class="ack-button" 
                                onclick="dashboard.acknowledgeAlert('${alert.alert_id}')"
                                ${alert.acknowledged ? 'disabled' : ''}>
                            ${alert.acknowledged ? 'Acknowledged' : 'Acknowledge'}
                        </button>
                    </div>
                `).join('');
                
                alertsList.innerHTML = alertsHtml;
            }
            
            async acknowledgeAlert(alertId) {
                try {
                    await fetch(`/api/alerts/${alertId}/acknowledge`, {method: 'POST'});
                    await this.loadAlerts(); // Refresh alerts
                } catch (error) {
                    console.error('Error acknowledging alert:', error);
                }
            }
            
            showNewAlert(alert) {
                // Show notification for new alert
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('New Fraud Detection Alert', {
                        body: alert.message,
                        icon: '/static/images/alert-icon.png'
                    });
                }
                
                // Refresh alerts list
                this.loadAlerts();
            }
        }
        
        // Initialize dashboard
        const dashboard = new FraudDashboard();
        
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        
        // Auto-refresh every 30 seconds
        setInterval(() => {
            dashboard.socket.emit('request_update');
        }, 30000);
    </script>
</body>
</html>
"""

# Usage example
if __name__ == "__main__":
    from real_time_monitoring import RealTimeMonitor
    
    # Create monitor
    monitor = RealTimeMonitor()
    monitor.start_monitoring()
    
    # Create and start dashboard
    dashboard = RealTimeDashboard(monitor, port=5004)
    
    try:
        dashboard.start()
    except KeyboardInterrupt:
        print("\nShutting down dashboard...")
        dashboard.stop()
        monitor.stop_monitoring()