#!/usr/bin/env python3
"""
Real-Time Monitoring System for Fraud Detection
==============================================

This module provides comprehensive real-time monitoring capabilities including:
- System performance metrics
- Model prediction monitoring 
- Alert management
- Health checks
- Data security validation

Author: Advanced Analytics Team
Version: 1.0.0
"""

import time
import threading
import queue
import json
import logging
import psutil
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, asdict
from collections import deque, defaultdict
import sqlite3
import hashlib
import re
import socket
import ssl

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class SystemMetrics:
    """System performance metrics."""
    timestamp: datetime
    cpu_percent: float
    memory_percent: float
    memory_mb: float
    disk_usage_percent: float
    network_io: Dict[str, int]
    active_connections: int
    
@dataclass
class PredictionMetrics:
    """Model prediction metrics."""
    timestamp: datetime
    prediction_count: int
    fraud_rate: float
    avg_score: float
    processing_time_ms: float
    error_count: int
    cache_hit_rate: float

@dataclass
class SecurityEvent:
    """Security event data."""
    timestamp: datetime
    event_type: str
    severity: str
    description: str
    source_ip: Optional[str] = None
    user_id: Optional[str] = None
    risk_score: float = 0.0

@dataclass
class Alert:
    """Alert configuration and status."""
    alert_id: str
    alert_type: str
    threshold: float
    current_value: float
    message: str
    severity: str
    triggered_at: datetime
    acknowledged: bool = False

class DataLeakageDetector:
    """Detects potential data leakage and security issues."""
    
    def __init__(self):
        self.sensitive_patterns = [
            r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b',  # Credit card
            r'\b\d{3}[-.]?\d{2}[-.]?\d{4}\b',  # SSN
            r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',  # Email
            r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b',  # IP Address
        ]
        self.api_key_patterns = [
            r'(?i)api[_-]?key[_-]?[:=]\s*[\'"]?([a-zA-Z0-9_-]{16,})[\'"]?',
            r'(?i)secret[_-]?key[_-]?[:=]\s*[\'"]?([a-zA-Z0-9_-]{16,})[\'"]?',
            r'(?i)password[_-]?[:=]\s*[\'"]?([a-zA-Z0-9_-]{8,})[\'"]?',
        ]
        
    def scan_text(self, text: str) -> List[SecurityEvent]:
        """Scan text for sensitive data patterns."""
        events = []
        
        # Check for sensitive data patterns
        for pattern in self.sensitive_patterns:
            matches = re.finditer(pattern, text)
            for match in matches:
                events.append(SecurityEvent(
                    timestamp=datetime.now(),
                    event_type="SENSITIVE_DATA_DETECTED",
                    severity="HIGH",
                    description=f"Potential sensitive data found: {match.group()[:10]}...",
                    risk_score=0.8
                ))
        
        # Check for API keys/secrets
        for pattern in self.api_key_patterns:
            matches = re.finditer(pattern, text)
            for match in matches:
                events.append(SecurityEvent(
                    timestamp=datetime.now(),
                    event_type="API_KEY_EXPOSED",
                    severity="CRITICAL",
                    description=f"Potential API key/secret exposed",
                    risk_score=0.9
                ))
                
        return events
    
    def validate_data_flow(self, data: Dict[str, Any]) -> List[SecurityEvent]:
        """Validate data flow for security issues."""
        events = []
        
        # Check for data serialization without encryption
        if isinstance(data, dict):
            json_data = json.dumps(data)
            if len(json_data) > 1000:  # Large data payloads
                events.append(SecurityEvent(
                    timestamp=datetime.now(),
                    event_type="LARGE_DATA_TRANSFER",
                    severity="MEDIUM",
                    description=f"Large data payload detected: {len(json_data)} bytes",
                    risk_score=0.5
                ))
        
        # Check for unencrypted sensitive fields
        sensitive_fields = ['ssn', 'credit_card', 'password', 'api_key']
        for field in sensitive_fields:
            if field in str(data).lower():
                events.append(SecurityEvent(
                    timestamp=datetime.now(),
                    event_type="UNENCRYPTED_SENSITIVE_FIELD",
                    severity="HIGH",
                    description=f"Sensitive field '{field}' may be unencrypted",
                    risk_score=0.7
                ))
                
        return events

class RealTimeMonitor:
    """Real-time monitoring system for fraud detection."""
    
    def __init__(self, 
                 alert_thresholds: Optional[Dict[str, float]] = None,
                 monitoring_interval: float = 5.0):
        """
        Initialize the real-time monitor.
        
        Args:
            alert_thresholds: Custom alert thresholds
            monitoring_interval: Monitoring frequency in seconds
        """
        self.monitoring_interval = monitoring_interval
        self.is_running = False
        self.monitor_thread = None
        
        # Data storage
        self.system_metrics = deque(maxlen=1000)
        self.prediction_metrics = deque(maxlen=1000)
        self.security_events = deque(maxlen=500)
        self.active_alerts = {}
        
        # Metrics aggregation
        self.metrics_queue = queue.Queue()
        self.prediction_stats = defaultdict(list)
        
        # Security components
        self.leak_detector = DataLeakageDetector()
        
        # Default alert thresholds
        self.alert_thresholds = alert_thresholds or {
            'cpu_percent': 80.0,
            'memory_percent': 85.0,
            'fraud_rate': 0.1,  # 10%
            'processing_time_ms': 1000.0,
            'error_rate': 0.05,  # 5%
            'disk_usage_percent': 90.0
        }
        
        # Alert callbacks
        self.alert_callbacks: List[Callable[[Alert], None]] = []
        
        # Database for persistent storage
        self.db_path = '/root/FCA/monitoring.db'
        self._init_database()
        
        logger.info("Real-time monitor initialized")
    
    def _init_database(self):
        """Initialize SQLite database for monitoring data."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # System metrics table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS system_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT,
                    cpu_percent REAL,
                    memory_percent REAL,
                    memory_mb REAL,
                    disk_usage_percent REAL,
                    active_connections INTEGER
                )
            ''')
            
            # Prediction metrics table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS prediction_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT,
                    prediction_count INTEGER,
                    fraud_rate REAL,
                    avg_score REAL,
                    processing_time_ms REAL,
                    error_count INTEGER,
                    cache_hit_rate REAL
                )
            ''')
            
            # Security events table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS security_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT,
                    event_type TEXT,
                    severity TEXT,
                    description TEXT,
                    source_ip TEXT,
                    user_id TEXT,
                    risk_score REAL
                )
            ''')
            
            # Alerts table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS alerts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    alert_id TEXT UNIQUE,
                    alert_type TEXT,
                    threshold REAL,
                    current_value REAL,
                    message TEXT,
                    severity TEXT,
                    triggered_at TEXT,
                    acknowledged BOOLEAN DEFAULT FALSE
                )
            ''')
            
            conn.commit()
            conn.close()
            logger.info("Database initialized successfully")
            
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
    
    def start_monitoring(self):
        """Start the real-time monitoring."""
        if self.is_running:
            logger.warning("Monitor is already running")
            return
        
        self.is_running = True
        self.monitor_thread = threading.Thread(target=self._monitor_loop)
        self.monitor_thread.daemon = True
        self.monitor_thread.start()
        
        logger.info("Real-time monitoring started")
    
    def stop_monitoring(self):
        """Stop the real-time monitoring."""
        self.is_running = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=10)
        
        logger.info("Real-time monitoring stopped")
    
    def _monitor_loop(self):
        """Main monitoring loop."""
        while self.is_running:
            try:
                # Collect system metrics
                system_metrics = self._collect_system_metrics()
                self.system_metrics.append(system_metrics)
                self._save_system_metrics(system_metrics)
                
                # Check for alerts
                self._check_system_alerts(system_metrics)
                
                # Process queued prediction metrics
                self._process_prediction_queue()
                
                # Security scanning
                self._perform_security_scan()
                
                time.sleep(self.monitoring_interval)
                
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                time.sleep(self.monitoring_interval)
    
    def _collect_system_metrics(self) -> SystemMetrics:
        """Collect current system metrics."""
        try:
            # CPU and Memory
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            
            # Disk usage
            disk = psutil.disk_usage('/')
            
            # Network I/O
            network = psutil.net_io_counters()
            network_io = {
                'bytes_sent': network.bytes_sent,
                'bytes_recv': network.bytes_recv,
                'packets_sent': network.packets_sent,
                'packets_recv': network.packets_recv
            }
            
            # Active connections (estimate)
            active_connections = len(psutil.net_connections())
            
            return SystemMetrics(
                timestamp=datetime.now(),
                cpu_percent=cpu_percent,
                memory_percent=memory.percent,
                memory_mb=memory.used / (1024 * 1024),
                disk_usage_percent=disk.percent,
                network_io=network_io,
                active_connections=active_connections
            )
            
        except Exception as e:
            logger.error(f"Error collecting system metrics: {e}")
            return SystemMetrics(
                timestamp=datetime.now(),
                cpu_percent=0, memory_percent=0, memory_mb=0,
                disk_usage_percent=0, network_io={}, active_connections=0
            )
    
    def _save_system_metrics(self, metrics: SystemMetrics):
        """Save system metrics to database."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO system_metrics 
                (timestamp, cpu_percent, memory_percent, memory_mb, 
                 disk_usage_percent, active_connections)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                metrics.timestamp.isoformat(),
                metrics.cpu_percent,
                metrics.memory_percent,
                metrics.memory_mb,
                metrics.disk_usage_percent,
                metrics.active_connections
            ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Error saving system metrics: {e}")
    
    def _check_system_alerts(self, metrics: SystemMetrics):
        """Check system metrics against alert thresholds."""
        alerts_to_check = [
            ('cpu_percent', metrics.cpu_percent, 'HIGH_CPU_USAGE'),
            ('memory_percent', metrics.memory_percent, 'HIGH_MEMORY_USAGE'),
            ('disk_usage_percent', metrics.disk_usage_percent, 'HIGH_DISK_USAGE')
        ]
        
        for metric_name, current_value, alert_type in alerts_to_check:
            threshold = self.alert_thresholds.get(metric_name)
            if threshold and current_value > threshold:
                self._trigger_alert(
                    alert_type=alert_type,
                    threshold=threshold,
                    current_value=current_value,
                    message=f"{metric_name} is {current_value:.1f}% (threshold: {threshold}%)"
                )
    
    def _trigger_alert(self, alert_type: str, threshold: float, 
                      current_value: float, message: str):
        """Trigger an alert."""
        alert_id = f"{alert_type}_{int(time.time())}"
        
        # Avoid duplicate alerts for the same type within 5 minutes
        existing_alerts = [a for a in self.active_alerts.values() 
                          if a.alert_type == alert_type and 
                          (datetime.now() - a.triggered_at).seconds < 300]
        
        if existing_alerts:
            return
        
        severity = "HIGH" if current_value > threshold * 1.2 else "MEDIUM"
        
        alert = Alert(
            alert_id=alert_id,
            alert_type=alert_type,
            threshold=threshold,
            current_value=current_value,
            message=message,
            severity=severity,
            triggered_at=datetime.now()
        )
        
        self.active_alerts[alert_id] = alert
        self._save_alert(alert)
        
        # Call alert callbacks
        for callback in self.alert_callbacks:
            try:
                callback(alert)
            except Exception as e:
                logger.error(f"Error in alert callback: {e}")
        
        logger.warning(f"ALERT: {alert.message}")
    
    def _save_alert(self, alert: Alert):
        """Save alert to database."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT OR REPLACE INTO alerts 
                (alert_id, alert_type, threshold, current_value, message, 
                 severity, triggered_at, acknowledged)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                alert.alert_id, alert.alert_type, alert.threshold,
                alert.current_value, alert.message, alert.severity,
                alert.triggered_at.isoformat(), alert.acknowledged
            ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Error saving alert: {e}")
    
    def record_prediction(self, processing_time_ms: float, fraud_score: float, 
                         is_fraud: bool, error: bool = False, cache_hit: bool = False):
        """Record a prediction for monitoring."""
        self.metrics_queue.put({
            'timestamp': datetime.now(),
            'processing_time_ms': processing_time_ms,
            'fraud_score': fraud_score,
            'is_fraud': is_fraud,
            'error': error,
            'cache_hit': cache_hit
        })
    
    def _process_prediction_queue(self):
        """Process queued prediction metrics."""
        predictions = []
        
        # Collect all queued predictions
        while not self.metrics_queue.empty():
            try:
                prediction = self.metrics_queue.get_nowait()
                predictions.append(prediction)
            except queue.Empty:
                break
        
        if not predictions:
            return
        
        # Aggregate metrics
        total_predictions = len(predictions)
        fraud_count = sum(1 for p in predictions if p['is_fraud'])
        error_count = sum(1 for p in predictions if p['error'])
        cache_hits = sum(1 for p in predictions if p['cache_hit'])
        
        avg_processing_time = np.mean([p['processing_time_ms'] for p in predictions])
        avg_fraud_score = np.mean([p['fraud_score'] for p in predictions])
        fraud_rate = fraud_count / total_predictions if total_predictions > 0 else 0
        cache_hit_rate = cache_hits / total_predictions if total_predictions > 0 else 0
        
        # Create metrics object
        metrics = PredictionMetrics(
            timestamp=datetime.now(),
            prediction_count=total_predictions,
            fraud_rate=fraud_rate,
            avg_score=avg_fraud_score,
            processing_time_ms=avg_processing_time,
            error_count=error_count,
            cache_hit_rate=cache_hit_rate
        )
        
        self.prediction_metrics.append(metrics)
        self._save_prediction_metrics(metrics)
        
        # Check prediction-based alerts
        self._check_prediction_alerts(metrics)
    
    def _save_prediction_metrics(self, metrics: PredictionMetrics):
        """Save prediction metrics to database."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO prediction_metrics 
                (timestamp, prediction_count, fraud_rate, avg_score, 
                 processing_time_ms, error_count, cache_hit_rate)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                metrics.timestamp.isoformat(),
                metrics.prediction_count,
                metrics.fraud_rate,
                metrics.avg_score,
                metrics.processing_time_ms,
                metrics.error_count,
                metrics.cache_hit_rate
            ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Error saving prediction metrics: {e}")
    
    def _check_prediction_alerts(self, metrics: PredictionMetrics):
        """Check prediction metrics against alert thresholds."""
        alerts_to_check = [
            ('fraud_rate', metrics.fraud_rate, 'HIGH_FRAUD_RATE'),
            ('processing_time_ms', metrics.processing_time_ms, 'SLOW_PROCESSING'),
            ('error_rate', metrics.error_count / max(metrics.prediction_count, 1), 'HIGH_ERROR_RATE')
        ]
        
        for metric_name, current_value, alert_type in alerts_to_check:
            threshold = self.alert_thresholds.get(metric_name)
            if threshold and current_value > threshold:
                self._trigger_alert(
                    alert_type=alert_type,
                    threshold=threshold,
                    current_value=current_value,
                    message=f"{metric_name} is {current_value:.3f} (threshold: {threshold})"
                )
    
    def _perform_security_scan(self):
        """Perform security scanning for data leakage."""
        try:
            # Scan recent log files for sensitive data
            log_files = ['/tmp/fraud_detection.log', '/var/log/application.log']
            
            for log_file in log_files:
                try:
                    with open(log_file, 'r') as f:
                        # Read last 1000 lines
                        lines = f.readlines()[-1000:]
                        content = ''.join(lines)
                        
                        events = self.leak_detector.scan_text(content)
                        for event in events:
                            self.security_events.append(event)
                            self._save_security_event(event)
                            
                except FileNotFoundError:
                    pass  # Log file doesn't exist yet
                except Exception as e:
                    logger.error(f"Error scanning log file {log_file}: {e}")
        
        except Exception as e:
            logger.error(f"Error in security scan: {e}")
    
    def _save_security_event(self, event: SecurityEvent):
        """Save security event to database."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO security_events 
                (timestamp, event_type, severity, description, 
                 source_ip, user_id, risk_score)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                event.timestamp.isoformat(),
                event.event_type,
                event.severity,
                event.description,
                event.source_ip,
                event.user_id,
                event.risk_score
            ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Error saving security event: {e}")
    
    def get_current_status(self) -> Dict[str, Any]:
        """Get current monitoring status."""
        latest_system = self.system_metrics[-1] if self.system_metrics else None
        latest_prediction = self.prediction_metrics[-1] if self.prediction_metrics else None
        
        return {
            'monitoring_active': self.is_running,
            'last_update': datetime.now().isoformat(),
            'system_metrics': asdict(latest_system) if latest_system else None,
            'prediction_metrics': asdict(latest_prediction) if latest_prediction else None,
            'active_alerts': len(self.active_alerts),
            'security_events_today': len([e for e in self.security_events 
                                        if e.timestamp.date() == datetime.now().date()])
        }
    
    def get_metrics_history(self, hours: int = 24) -> Dict[str, Any]:
        """Get metrics history for the specified number of hours."""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        # Filter metrics by time
        recent_system = [m for m in self.system_metrics if m.timestamp >= cutoff_time]
        recent_predictions = [m for m in self.prediction_metrics if m.timestamp >= cutoff_time]
        recent_security = [e for e in self.security_events if e.timestamp >= cutoff_time]
        
        return {
            'system_metrics': [asdict(m) for m in recent_system],
            'prediction_metrics': [asdict(m) for m in recent_predictions],
            'security_events': [asdict(e) for e in recent_security],
            'time_range_hours': hours
        }
    
    def acknowledge_alert(self, alert_id: str) -> bool:
        """Acknowledge an alert."""
        if alert_id in self.active_alerts:
            self.active_alerts[alert_id].acknowledged = True
            self._save_alert(self.active_alerts[alert_id])
            logger.info(f"Alert {alert_id} acknowledged")
            return True
        return False
    
    def add_alert_callback(self, callback: Callable[[Alert], None]):
        """Add a callback function for alert notifications."""
        self.alert_callbacks.append(callback)
    
    def validate_data_security(self, data: Any) -> List[SecurityEvent]:
        """Validate data for security issues and potential leakage."""
        events = []
        
        try:
            # Convert data to string for scanning
            if isinstance(data, (dict, list)):
                data_str = json.dumps(data)
            else:
                data_str = str(data)
            
            # Scan for sensitive patterns
            events.extend(self.leak_detector.scan_text(data_str))
            
            # Validate data flow
            if isinstance(data, dict):
                events.extend(self.leak_detector.validate_data_flow(data))
            
            # Save security events
            for event in events:
                self.security_events.append(event)
                self._save_security_event(event)
        
        except Exception as e:
            logger.error(f"Error validating data security: {e}")
        
        return events

# Example alert callback functions
def email_alert_callback(alert: Alert):
    """Example email alert callback."""
    logger.info(f"EMAIL ALERT: {alert.message} (Severity: {alert.severity})")

def slack_alert_callback(alert: Alert):
    """Example Slack alert callback."""
    logger.info(f"SLACK ALERT: {alert.message} (Severity: {alert.severity})")

def sms_alert_callback(alert: Alert):
    """Example SMS alert callback."""
    if alert.severity in ['HIGH', 'CRITICAL']:
        logger.info(f"SMS ALERT: {alert.message}")

# Usage example
if __name__ == "__main__":
    # Create monitor with custom thresholds
    monitor = RealTimeMonitor(
        alert_thresholds={
            'cpu_percent': 75.0,
            'memory_percent': 80.0,
            'fraud_rate': 0.08,  # 8%
            'processing_time_ms': 800.0,
            'error_rate': 0.03  # 3%
        }
    )
    
    # Add alert callbacks
    monitor.add_alert_callback(email_alert_callback)
    monitor.add_alert_callback(slack_alert_callback)
    monitor.add_alert_callback(sms_alert_callback)
    
    try:
        # Start monitoring
        monitor.start_monitoring()
        
        # Simulate some predictions
        import random
        for i in range(10):
            monitor.record_prediction(
                processing_time_ms=random.uniform(50, 200),
                fraud_score=random.uniform(0, 1),
                is_fraud=random.random() < 0.05,
                cache_hit=random.random() < 0.7
            )
            time.sleep(1)
        
        # Get current status
        status = monitor.get_current_status()
        print("Current Status:", json.dumps(status, indent=2, default=str))
        
        # Test data security validation
        test_data = {
            "user_id": "user123",
            "transaction_amount": 100.50,
            "credit_card": "4532-1234-5678-9012",  # This should trigger an alert
            "email": "user@example.com"
        }
        
        security_events = monitor.validate_data_security(test_data)
        print(f"Security events detected: {len(security_events)}")
        for event in security_events:
            print(f"- {event.event_type}: {event.description}")
        
        # Keep running for demo
        time.sleep(30)
        
    except KeyboardInterrupt:
        print("\nStopping monitor...")
    finally:
        monitor.stop_monitoring()