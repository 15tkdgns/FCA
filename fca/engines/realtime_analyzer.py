#!/usr/bin/env python3
"""
Real-Time Analysis Engine
========================

Coordinates real-time analysis across all detection systems:
- Fraud detection
- Sentiment analysis  
- Customer attrition prediction
- Risk assessment and alerting
- Performance monitoring
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
import asyncio
import threading
import queue
import logging
from collections import deque
import json
import time

from .fraud_detector import FraudDetector, RuleBasedFraudDetector
from .sentiment_analyzer import SentimentAnalyzer, RealTimeSentimentMonitor
from .attrition_predictor import AttritionPredictor, CustomerLifecycleAnalyzer

logger = logging.getLogger(__name__)

class RealTimeAnalyzer:
    """
    Central real-time analysis engine that coordinates all detection systems
    """
    
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or self._default_config()
        
        # Initialize detection engines
        self.fraud_detector = FraudDetector()
        self.rule_based_fraud = RuleBasedFraudDetector()
        self.sentiment_analyzer = SentimentAnalyzer()
        self.attrition_predictor = AttritionPredictor()
        self.lifecycle_analyzer = CustomerLifecycleAnalyzer()
        
        # Real-time monitoring
        self.sentiment_monitor = None  # Will be initialized after training
        
        # Data buffers for real-time analysis
        self.transaction_buffer = deque(maxlen=1000)
        self.sentiment_buffer = deque(maxlen=1000)
        self.customer_buffer = deque(maxlen=1000)
        
        # Performance tracking
        self.performance_metrics = {
            'fraud_detection': deque(maxlen=100),
            'sentiment_analysis': deque(maxlen=100),
            'attrition_prediction': deque(maxlen=100)
        }
        
        # Alert system
        self.alert_queue = queue.Queue()
        self.alert_thresholds = self.config['alert_thresholds']
        
        # Status tracking
        self.is_initialized = False
        self.last_health_check = datetime.now()
        
    def _default_config(self) -> Dict:
        """Default configuration for real-time analyzer"""
        return {
            'alert_thresholds': {
                'fraud_probability': 0.8,
                'sentiment_threshold': -0.7,
                'churn_probability': 0.75,
                'high_value_customer_risk': 0.6
            },
            'buffer_sizes': {
                'transaction': 1000,
                'sentiment': 1000,
                'customer': 1000
            },
            'performance_tracking': {
                'enable': True,
                'window_size': 100
            }
        }
    
    def initialize_models(self, training_data: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
        """
        Initialize and train all detection models
        
        Args:
            training_data: Dictionary with training datasets for each model
                          Keys: 'fraud', 'sentiment', 'attrition'
        
        Returns:
            Training results for all models
        """
        logger.info("Initializing real-time analysis models...")
        
        results = {}
        
        # Train fraud detection model
        if 'fraud' in training_data:
            logger.info("Training fraud detection model...")
            fraud_results = self.fraud_detector.train(training_data['fraud'])
            results['fraud_detection'] = fraud_results
        
        # Train sentiment analysis model
        if 'sentiment' in training_data:
            logger.info("Training sentiment analysis model...")
            sentiment_results = self.sentiment_analyzer.train(
                training_data['sentiment'], 
                text_column='text' if 'text' in training_data['sentiment'].columns else training_data['sentiment'].columns[0],
                target_column='sentiment' if 'sentiment' in training_data['sentiment'].columns else training_data['sentiment'].columns[-1]
            )
            results['sentiment_analysis'] = sentiment_results
            
            # Initialize real-time sentiment monitor
            self.sentiment_monitor = RealTimeSentimentMonitor(self.sentiment_analyzer)
        
        # Train attrition prediction model
        if 'attrition' in training_data:
            logger.info("Training attrition prediction model...")
            attrition_results = self.attrition_predictor.train(training_data['attrition'])
            results['attrition_prediction'] = attrition_results
        
        self.is_initialized = True
        logger.info("Real-time analysis models initialized successfully!")
        
        return results
    
    def analyze_transaction(self, transaction_data: Dict) -> Dict[str, Any]:
        """
        Analyze a single transaction in real-time
        
        Args:
            transaction_data: Dictionary with transaction information
            
        Returns:
            Analysis results with fraud detection and risk assessment
        """
        start_time = time.time()
        
        if not self.is_initialized:
            raise ValueError("Models must be initialized before analysis")
        
        analysis_results = {
            'transaction_id': transaction_data.get('transaction_id', f"txn_{int(time.time())}"),
            'timestamp': datetime.now().isoformat(),
            'analysis_type': 'transaction'
        }
        
        try:
            # Fraud detection using ML models
            fraud_result = self.fraud_detector.detect_real_time(transaction_data)
            analysis_results['fraud_detection'] = fraud_result
            
            # Rule-based fraud detection
            rule_result = self.rule_based_fraud.apply_rules(transaction_data)
            analysis_results['rule_based_fraud'] = rule_result
            
            # Combined fraud assessment
            combined_fraud_score = (
                fraud_result['fraud_probability'] * 0.7 + 
                rule_result['rule_based_risk_score'] * 0.3
            )
            
            analysis_results['combined_fraud_score'] = combined_fraud_score
            analysis_results['is_high_risk'] = combined_fraud_score > self.alert_thresholds['fraud_probability']
            
            # Add to buffer
            self.transaction_buffer.append({
                'data': transaction_data,
                'result': analysis_results,
                'timestamp': datetime.now()
            })
            
            # Check for alerts
            if analysis_results['is_high_risk']:
                self._trigger_alert('fraud', analysis_results)
            
            # Record performance
            processing_time = time.time() - start_time
            self.performance_metrics['fraud_detection'].append({
                'processing_time': processing_time,
                'timestamp': datetime.now()
            })
            
        except Exception as e:
            logger.error(f"Error in transaction analysis: {e}")
            analysis_results['error'] = str(e)
        
        return analysis_results
    
    def analyze_text_sentiment(self, text: str, metadata: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Analyze text sentiment in real-time
        
        Args:
            text: Text to analyze
            metadata: Optional metadata about the text
            
        Returns:
            Sentiment analysis results
        """
        start_time = time.time()
        
        if not self.is_initialized or not self.sentiment_monitor:
            raise ValueError("Sentiment models must be initialized before analysis")
        
        analysis_results = {
            'text_id': metadata.get('text_id', f"text_{int(time.time())}") if metadata else f"text_{int(time.time())}",
            'timestamp': datetime.now().isoformat(),
            'analysis_type': 'sentiment'
        }
        
        try:
            # Real-time sentiment monitoring
            sentiment_result = self.sentiment_monitor.process_text(text)
            analysis_results.update(sentiment_result)
            
            # Check for negative sentiment alerts
            current_sentiment = sentiment_result['current_sentiment']
            if (current_sentiment['sentiment'] == 'negative' and 
                current_sentiment['confidence'] > 0.8):
                self._trigger_alert('negative_sentiment', analysis_results)
            
            # Add to buffer
            self.sentiment_buffer.append({
                'text': text,
                'metadata': metadata or {},
                'result': analysis_results,
                'timestamp': datetime.now()
            })
            
            # Record performance
            processing_time = time.time() - start_time
            self.performance_metrics['sentiment_analysis'].append({
                'processing_time': processing_time,
                'timestamp': datetime.now()
            })
            
        except Exception as e:
            logger.error(f"Error in sentiment analysis: {e}")
            analysis_results['error'] = str(e)
        
        return analysis_results
    
    def analyze_customer_risk(self, customer_data: Dict) -> Dict[str, Any]:
        """
        Analyze customer churn risk in real-time
        
        Args:
            customer_data: Dictionary with customer information
            
        Returns:
            Customer risk analysis results
        """
        start_time = time.time()
        
        if not self.is_initialized:
            raise ValueError("Models must be initialized before analysis")
        
        analysis_results = {
            'customer_id': customer_data.get('CustomerId', f"cust_{int(time.time())}"),
            'timestamp': datetime.now().isoformat(),
            'analysis_type': 'customer_risk'
        }
        
        try:
            # Convert to DataFrame for prediction
            customer_df = pd.DataFrame([customer_data])
            
            # Attrition prediction
            attrition_result = self.attrition_predictor.predict(customer_df)
            churn_probability = attrition_result['ensemble_probability'][0]
            risk_assessment = attrition_result['risk_assessments'][0]
            retention_strategy = attrition_result['retention_strategies'][0]
            
            analysis_results.update({
                'churn_probability': churn_probability,
                'risk_assessment': risk_assessment,
                'retention_strategies': retention_strategy['recommended_strategies']
            })
            
            # Lifecycle analysis
            lifecycle_stage = self.lifecycle_analyzer.analyze_lifecycle_stage(customer_data)
            clv = self.lifecycle_analyzer.calculate_customer_lifetime_value(customer_data)
            lifecycle_actions = self.lifecycle_analyzer.recommend_lifecycle_actions(
                lifecycle_stage, customer_data
            )
            
            analysis_results.update({
                'lifecycle_stage': lifecycle_stage,
                'customer_lifetime_value': clv,
                'lifecycle_actions': lifecycle_actions
            })
            
            # Check for high-value customer at risk
            is_high_risk = (
                churn_probability > self.alert_thresholds['churn_probability'] or
                (clv > 10000 and churn_probability > self.alert_thresholds['high_value_customer_risk'])
            )
            
            analysis_results['is_high_risk'] = is_high_risk
            
            # Add to buffer
            self.customer_buffer.append({
                'data': customer_data,
                'result': analysis_results,
                'timestamp': datetime.now()
            })
            
            # Check for alerts
            if is_high_risk:
                self._trigger_alert('customer_churn', analysis_results)
            
            # Record performance
            processing_time = time.time() - start_time
            self.performance_metrics['attrition_prediction'].append({
                'processing_time': processing_time,
                'timestamp': datetime.now()
            })
            
        except Exception as e:
            logger.error(f"Error in customer risk analysis: {e}")
            analysis_results['error'] = str(e)
        
        return analysis_results
    
    def batch_analyze(self, data: Dict[str, List[Dict]]) -> Dict[str, List[Dict]]:
        """
        Perform batch analysis on multiple data points
        
        Args:
            data: Dictionary with lists of data to analyze
                  Keys: 'transactions', 'texts', 'customers'
        
        Returns:
            Batch analysis results
        """
        results = {}
        
        # Analyze transactions
        if 'transactions' in data:
            transaction_results = []
            for transaction in data['transactions']:
                result = self.analyze_transaction(transaction)
                transaction_results.append(result)
            results['transaction_analysis'] = transaction_results
        
        # Analyze texts
        if 'texts' in data:
            sentiment_results = []
            for text_data in data['texts']:
                if isinstance(text_data, str):
                    text = text_data
                    metadata = None
                else:
                    text = text_data.get('text', '')
                    metadata = {k: v for k, v in text_data.items() if k != 'text'}
                
                result = self.analyze_text_sentiment(text, metadata)
                sentiment_results.append(result)
            results['sentiment_analysis'] = sentiment_results
        
        # Analyze customers
        if 'customers' in data:
            customer_results = []
            for customer in data['customers']:
                result = self.analyze_customer_risk(customer)
                customer_results.append(result)
            results['customer_analysis'] = customer_results
        
        return results
    
    def get_real_time_dashboard(self) -> Dict[str, Any]:
        """
        Get real-time dashboard data
        
        Returns:
            Dashboard data with current metrics and alerts
        """
        current_time = datetime.now()
        
        # Recent activity (last hour)
        one_hour_ago = current_time - timedelta(hours=1)
        
        recent_transactions = [
            item for item in self.transaction_buffer 
            if item['timestamp'] > one_hour_ago
        ]
        
        recent_sentiments = [
            item for item in self.sentiment_buffer 
            if item['timestamp'] > one_hour_ago
        ]
        
        recent_customers = [
            item for item in self.customer_buffer 
            if item['timestamp'] > one_hour_ago
        ]
        
        # Calculate metrics
        fraud_alerts = sum(1 for item in recent_transactions if item['result'].get('is_high_risk', False))
        negative_sentiment_count = sum(
            1 for item in recent_sentiments 
            if item['result']['current_sentiment']['sentiment'] == 'negative'
        )
        churn_risk_customers = sum(1 for item in recent_customers if item['result'].get('is_high_risk', False))
        
        # Performance metrics
        avg_fraud_processing_time = np.mean([
            m['processing_time'] for m in self.performance_metrics['fraud_detection']
        ]) if self.performance_metrics['fraud_detection'] else 0
        
        avg_sentiment_processing_time = np.mean([
            m['processing_time'] for m in self.performance_metrics['sentiment_analysis']
        ]) if self.performance_metrics['sentiment_analysis'] else 0
        
        avg_attrition_processing_time = np.mean([
            m['processing_time'] for m in self.performance_metrics['attrition_prediction']
        ]) if self.performance_metrics['attrition_prediction'] else 0
        
        return {
            'timestamp': current_time.isoformat(),
            'system_status': 'operational' if self.is_initialized else 'initializing',
            'recent_activity': {
                'transactions_analyzed': len(recent_transactions),
                'texts_analyzed': len(recent_sentiments),
                'customers_analyzed': len(recent_customers)
            },
            'alerts': {
                'fraud_alerts': fraud_alerts,
                'negative_sentiment_alerts': negative_sentiment_count,
                'churn_risk_customers': churn_risk_customers,
                'total_alerts': fraud_alerts + negative_sentiment_count + churn_risk_customers
            },
            'performance': {
                'avg_fraud_processing_time_ms': avg_fraud_processing_time * 1000,
                'avg_sentiment_processing_time_ms': avg_sentiment_processing_time * 1000,
                'avg_attrition_processing_time_ms': avg_attrition_processing_time * 1000
            },
            'buffer_status': {
                'transaction_buffer_size': len(self.transaction_buffer),
                'sentiment_buffer_size': len(self.sentiment_buffer),
                'customer_buffer_size': len(self.customer_buffer)
            }
        }
    
    def _trigger_alert(self, alert_type: str, analysis_result: Dict):
        """Trigger an alert for high-risk situations"""
        alert = {
            'type': alert_type,
            'timestamp': datetime.now().isoformat(),
            'data': analysis_result,
            'severity': self._determine_alert_severity(alert_type, analysis_result)
        }
        
        self.alert_queue.put(alert)
        logger.warning(f"Alert triggered: {alert_type} - {alert['severity']}")
    
    def _determine_alert_severity(self, alert_type: str, analysis_result: Dict) -> str:
        """Determine alert severity based on analysis results"""
        if alert_type == 'fraud':
            score = analysis_result.get('combined_fraud_score', 0)
            if score > 0.9:
                return 'CRITICAL'
            elif score > 0.8:
                return 'HIGH'
            else:
                return 'MEDIUM'
        elif alert_type == 'customer_churn':
            churn_prob = analysis_result.get('churn_probability', 0)
            clv = analysis_result.get('customer_lifetime_value', 0)
            
            if churn_prob > 0.8 and clv > 20000:
                return 'CRITICAL'
            elif churn_prob > 0.75:
                return 'HIGH'
            else:
                return 'MEDIUM'
        else:
            return 'MEDIUM'
    
    def get_alerts(self, max_alerts: int = 10) -> List[Dict]:
        """Get recent alerts"""
        alerts = []
        count = 0
        
        while not self.alert_queue.empty() and count < max_alerts:
            alerts.append(self.alert_queue.get())
            count += 1
        
        # Sort by timestamp (most recent first)
        alerts.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return alerts
    
    def health_check(self) -> Dict[str, Any]:
        """Perform system health check"""
        current_time = datetime.now()
        self.last_health_check = current_time
        
        health_status = {
            'timestamp': current_time.isoformat(),
            'overall_status': 'healthy',
            'components': {}
        }
        
        # Check model initialization
        health_status['components']['models_initialized'] = self.is_initialized
        
        # Check detection engines
        health_status['components']['fraud_detector'] = self.fraud_detector.is_trained
        health_status['components']['sentiment_analyzer'] = self.sentiment_analyzer.is_trained
        health_status['components']['attrition_predictor'] = self.attrition_predictor.is_trained
        
        # Check buffer status
        buffer_health = {
            'transaction_buffer': len(self.transaction_buffer),
            'sentiment_buffer': len(self.sentiment_buffer),
            'customer_buffer': len(self.customer_buffer)
        }
        health_status['components']['buffers'] = buffer_health
        
        # Check alert queue
        health_status['components']['alert_queue_size'] = self.alert_queue.qsize()
        
        # Determine overall status
        if not all([
            self.is_initialized,
            self.fraud_detector.is_trained,
            self.sentiment_analyzer.is_trained,
            self.attrition_predictor.is_trained
        ]):
            health_status['overall_status'] = 'degraded'
        
        return health_status
    
    def save_models(self, base_path: str):
        """Save all trained models"""
        if not self.is_initialized:
            raise ValueError("Models must be initialized before saving")
        
        self.fraud_detector.save_models(f"{base_path}/fraud_detector.joblib")
        self.sentiment_analyzer.save_models(f"{base_path}/sentiment_analyzer.joblib")
        self.attrition_predictor.save_models(f"{base_path}/attrition_predictor.joblib")
        
        logger.info(f"All models saved to {base_path}")
    
    def load_models(self, base_path: str):
        """Load all trained models"""
        self.fraud_detector.load_models(f"{base_path}/fraud_detector.joblib")
        self.sentiment_analyzer.load_models(f"{base_path}/sentiment_analyzer.joblib")  
        self.attrition_predictor.load_models(f"{base_path}/attrition_predictor.joblib")
        
        # Initialize sentiment monitor
        self.sentiment_monitor = RealTimeSentimentMonitor(self.sentiment_analyzer)
        
        self.is_initialized = True
        logger.info(f"All models loaded from {base_path}")

class AlertManager:
    """
    Manages alerts and notifications from the real-time analyzer
    """
    
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {'max_alerts': 1000}
        self.alerts = deque(maxlen=self.config['max_alerts'])
        self.alert_handlers = {}
    
    def register_alert_handler(self, alert_type: str, handler_func):
        """Register a handler function for specific alert types"""
        self.alert_handlers[alert_type] = handler_func
    
    def process_alert(self, alert: Dict):
        """Process an incoming alert"""
        self.alerts.append(alert)
        
        # Call registered handler if available
        alert_type = alert.get('type')
        if alert_type in self.alert_handlers:
            try:
                self.alert_handlers[alert_type](alert)
            except Exception as e:
                logger.error(f"Error in alert handler for {alert_type}: {e}")
    
    def get_alert_summary(self, hours: int = 24) -> Dict:
        """Get summary of alerts for the specified time period"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        recent_alerts = [
            alert for alert in self.alerts
            if datetime.fromisoformat(alert['timestamp']) > cutoff_time
        ]
        
        # Group by type and severity
        summary = {}
        for alert in recent_alerts:
            alert_type = alert.get('type', 'unknown')
            severity = alert.get('severity', 'medium')
            
            if alert_type not in summary:
                summary[alert_type] = {}
            if severity not in summary[alert_type]:
                summary[alert_type][severity] = 0
            
            summary[alert_type][severity] += 1
        
        return {
            'total_alerts': len(recent_alerts),
            'time_period_hours': hours,
            'alert_breakdown': summary
        }