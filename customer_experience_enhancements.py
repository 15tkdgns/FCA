#!/usr/bin/env python3
"""
Customer Experience Enhancement System
=====================================

This module provides advanced customer experience features for fraud detection:
- False positive reduction algorithms
- Real-time customer notifications
- Whitelist/blocklist management
- Customer feedback integration
- Behavioral pattern learning
- Personalized fraud thresholds

Author: Advanced Analytics Team
Version: 1.0.0
"""

import json
import smtplib
import time
import hashlib
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from collections import defaultdict, deque
import sqlite3
import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class CustomerProfile:
    """Customer profile and behavior patterns."""
    customer_id: str
    email: Optional[str]
    phone: Optional[str]
    created_at: datetime
    last_activity: datetime
    transaction_patterns: Dict[str, Any]
    risk_score: float
    whitelist_status: bool = False
    notification_preferences: Dict[str, bool] = None
    feedback_score: float = 0.0
    false_positive_count: int = 0

@dataclass
class FraudAlert:
    """Fraud alert for customer notification."""
    alert_id: str
    customer_id: str
    transaction_id: str
    fraud_score: float
    risk_level: str
    description: str
    blocked: bool
    timestamp: datetime
    customer_feedback: Optional[str] = None
    resolution_status: str = "pending"

@dataclass
class CustomerFeedback:
    """Customer feedback on fraud detection."""
    feedback_id: str
    customer_id: str
    alert_id: str
    is_legitimate: bool
    feedback_text: Optional[str]
    satisfaction_score: int  # 1-5
    timestamp: datetime

class CustomerNotificationSystem:
    """Handles customer notifications for fraud alerts."""
    
    def __init__(self, smtp_config: Optional[Dict] = None):
        """Initialize notification system."""
        self.smtp_config = smtp_config or {
            'host': 'localhost',
            'port': 587,
            'username': '',
            'password': '',
            'use_tls': True
        }
        
    def send_email_alert(self, customer_email: str, alert: FraudAlert) -> bool:
        """Send email alert to customer."""
        try:
            if not customer_email or not self.smtp_config['username']:
                logger.warning("Email notification skipped - missing configuration")
                return False
            
            # Create message
            msg = MimeMultipart()
            msg['From'] = self.smtp_config['username']
            msg['To'] = customer_email
            msg['Subject'] = f"Security Alert: Potential Fraud Detected - {alert.risk_level}"
            
            # Email body
            body = f"""
            Dear Valued Customer,
            
            We detected suspicious activity on your account and wanted to notify you immediately.
            
            Alert Details:
            - Transaction ID: {alert.transaction_id}
            - Risk Level: {alert.risk_level}
            - Description: {alert.description}
            - Time: {alert.timestamp.strftime('%Y-%m-%d %H:%M:%S')}
            - Action Taken: {'Transaction Blocked' if alert.blocked else 'Transaction Flagged'}
            
            If this was you:
            - No action needed if transaction was blocked
            - Please verify your account if flagged
            
            If this was NOT you:
            - Your account has been secured
            - Please contact us immediately at 1-800-FRAUD-HELP
            - Change your passwords and review recent transactions
            
            You can provide feedback on this alert here:
            http://localhost:5003/feedback/{alert.alert_id}
            
            Thank you for your attention to account security.
            
            Best regards,
            Fraud Prevention Team
            """
            
            msg.attach(MimeText(body, 'plain'))
            
            # Send email
            server = smtplib.SMTP(self.smtp_config['host'], self.smtp_config['port'])
            if self.smtp_config['use_tls']:
                server.starttls()
            if self.smtp_config['username'] and self.smtp_config['password']:
                server.login(self.smtp_config['username'], self.smtp_config['password'])
            
            server.send_message(msg)
            server.quit()
            
            logger.info(f"Email alert sent to {customer_email} for alert {alert.alert_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email alert: {e}")
            return False
    
    def send_sms_alert(self, phone_number: str, alert: FraudAlert) -> bool:
        """Send SMS alert to customer (placeholder implementation)."""
        try:
            # In production, integrate with SMS service like Twilio
            message = f"FRAUD ALERT: {alert.risk_level} risk detected. " \
                     f"Transaction {alert.transaction_id[:8]}... " \
                     f"{'blocked' if alert.blocked else 'flagged'}. " \
                     f"Contact us if not you: 1-800-FRAUD-HELP"
            
            logger.info(f"SMS alert would be sent to {phone_number}: {message}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send SMS alert: {e}")
            return False

class BehavioralLearning:
    """Learns customer behavioral patterns to reduce false positives."""
    
    def __init__(self):
        """Initialize behavioral learning system."""
        self.customer_patterns = defaultdict(lambda: {
            'transaction_times': deque(maxlen=100),
            'amounts': deque(maxlen=100),
            'locations': deque(maxlen=100),
            'merchants': deque(maxlen=100),
            'frequencies': deque(maxlen=50)
        })
        
    def learn_transaction_pattern(self, customer_id: str, transaction: Dict[str, Any]):
        """Learn from a legitimate transaction."""
        patterns = self.customer_patterns[customer_id]
        
        # Record transaction patterns
        patterns['transaction_times'].append(transaction.get('hour', 12))
        patterns['amounts'].append(transaction.get('amount', 0))
        patterns['locations'].append(transaction.get('location', 'unknown'))
        patterns['merchants'].append(transaction.get('merchant', 'unknown'))
        
        # Calculate frequency (transactions per day)
        current_time = datetime.now()
        recent_transactions = [t for t in patterns['transaction_times'] 
                             if (current_time - t).days <= 1]
        patterns['frequencies'].append(len(recent_transactions))
    
    def calculate_behavioral_score(self, customer_id: str, transaction: Dict[str, Any]) -> float:
        """Calculate behavioral anomaly score for transaction."""
        if customer_id not in self.customer_patterns:
            return 0.5  # Neutral score for new customers
        
        patterns = self.customer_patterns[customer_id]
        anomaly_scores = []
        
        # Time pattern analysis
        transaction_hour = transaction.get('hour', 12)
        if patterns['transaction_times']:
            usual_hours = list(patterns['transaction_times'])
            hour_scores = [abs(transaction_hour - h) for h in usual_hours]
            avg_hour_diff = np.mean(hour_scores) if hour_scores else 0
            time_anomaly = min(avg_hour_diff / 12, 1.0)  # Normalize to 0-1
            anomaly_scores.append(time_anomaly)
        
        # Amount pattern analysis
        transaction_amount = transaction.get('amount', 0)
        if patterns['amounts']:
            usual_amounts = list(patterns['amounts'])
            mean_amount = np.mean(usual_amounts)
            std_amount = np.std(usual_amounts) if len(usual_amounts) > 1 else mean_amount * 0.5
            
            if std_amount > 0:
                amount_z_score = abs((transaction_amount - mean_amount) / std_amount)
                amount_anomaly = min(amount_z_score / 3, 1.0)  # 3-sigma rule
                anomaly_scores.append(amount_anomaly)
        
        # Location pattern analysis
        transaction_location = transaction.get('location', 'unknown')
        if patterns['locations']:
            usual_locations = list(patterns['locations'])
            location_anomaly = 0.0 if transaction_location in usual_locations else 0.8
            anomaly_scores.append(location_anomaly)
        
        # Merchant pattern analysis
        transaction_merchant = transaction.get('merchant', 'unknown')
        if patterns['merchants']:
            usual_merchants = list(patterns['merchants'])
            merchant_anomaly = 0.0 if transaction_merchant in usual_merchants else 0.6
            anomaly_scores.append(merchant_anomaly)
        
        # Return average anomaly score
        return np.mean(anomaly_scores) if anomaly_scores else 0.5

class CustomerExperienceManager:
    """Main customer experience management system."""
    
    def __init__(self, db_path: str = '/root/FCA/customer_experience.db'):
        """Initialize customer experience manager."""
        self.db_path = db_path
        self.notification_system = CustomerNotificationSystem()
        self.behavioral_learning = BehavioralLearning()
        
        # Initialize database
        self._init_database()
        
        # Customer data
        self.customer_profiles = {}
        self.whitelisted_customers = set()
        self.blacklisted_customers = set()
        
        # False positive tracking
        self.false_positive_patterns = defaultdict(list)
        
        # Load existing data
        self._load_customer_data()
        
        logger.info("Customer Experience Manager initialized")
    
    def _init_database(self):
        """Initialize SQLite database for customer data."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Customer profiles table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS customer_profiles (
                    customer_id TEXT PRIMARY KEY,
                    email TEXT,
                    phone TEXT,
                    created_at TEXT,
                    last_activity TEXT,
                    transaction_patterns TEXT,
                    risk_score REAL,
                    whitelist_status BOOLEAN,
                    notification_preferences TEXT,
                    feedback_score REAL,
                    false_positive_count INTEGER
                )
            ''')
            
            # Fraud alerts table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS fraud_alerts (
                    alert_id TEXT PRIMARY KEY,
                    customer_id TEXT,
                    transaction_id TEXT,
                    fraud_score REAL,
                    risk_level TEXT,
                    description TEXT,
                    blocked BOOLEAN,
                    timestamp TEXT,
                    customer_feedback TEXT,
                    resolution_status TEXT
                )
            ''')
            
            # Customer feedback table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS customer_feedback (
                    feedback_id TEXT PRIMARY KEY,
                    customer_id TEXT,
                    alert_id TEXT,
                    is_legitimate BOOLEAN,
                    feedback_text TEXT,
                    satisfaction_score INTEGER,
                    timestamp TEXT
                )
            ''')
            
            # Whitelisted items table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS whitelist (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    customer_id TEXT,
                    item_type TEXT,
                    item_value TEXT,
                    added_at TEXT,
                    expires_at TEXT
                )
            ''')
            
            conn.commit()
            conn.close()
            logger.info("Customer experience database initialized")
            
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
    
    def _load_customer_data(self):
        """Load existing customer data from database."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Load customer profiles
            cursor.execute('SELECT * FROM customer_profiles')
            for row in cursor.fetchall():
                customer_id = row[0]
                self.customer_profiles[customer_id] = CustomerProfile(
                    customer_id=customer_id,
                    email=row[1],
                    phone=row[2],
                    created_at=datetime.fromisoformat(row[3]) if row[3] else datetime.now(),
                    last_activity=datetime.fromisoformat(row[4]) if row[4] else datetime.now(),
                    transaction_patterns=json.loads(row[5]) if row[5] else {},
                    risk_score=row[6] or 0.5,
                    whitelist_status=bool(row[7]),
                    notification_preferences=json.loads(row[8]) if row[8] else {'email': True, 'sms': False},
                    feedback_score=row[9] or 0.0,
                    false_positive_count=row[10] or 0
                )
                
                if self.customer_profiles[customer_id].whitelist_status:
                    self.whitelisted_customers.add(customer_id)
            
            conn.close()
            logger.info(f"Loaded {len(self.customer_profiles)} customer profiles")
            
        except Exception as e:
            logger.error(f"Error loading customer data: {e}")
    
    def create_customer_profile(self, customer_id: str, email: str = None, 
                              phone: str = None) -> CustomerProfile:
        """Create a new customer profile."""
        profile = CustomerProfile(
            customer_id=customer_id,
            email=email,
            phone=phone,
            created_at=datetime.now(),
            last_activity=datetime.now(),
            transaction_patterns={},
            risk_score=0.5,
            notification_preferences={'email': True, 'sms': False}
        )
        
        self.customer_profiles[customer_id] = profile
        self._save_customer_profile(profile)
        
        logger.info(f"Created new customer profile for {customer_id}")
        return profile
    
    def _save_customer_profile(self, profile: CustomerProfile):
        """Save customer profile to database."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT OR REPLACE INTO customer_profiles 
                (customer_id, email, phone, created_at, last_activity, 
                 transaction_patterns, risk_score, whitelist_status, 
                 notification_preferences, feedback_score, false_positive_count)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                profile.customer_id,
                profile.email,
                profile.phone,
                profile.created_at.isoformat(),
                profile.last_activity.isoformat(),
                json.dumps(profile.transaction_patterns),
                profile.risk_score,
                profile.whitelist_status,
                json.dumps(profile.notification_preferences),
                profile.feedback_score,
                profile.false_positive_count
            ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Error saving customer profile: {e}")
    
    def process_fraud_detection(self, customer_id: str, transaction: Dict[str, Any], 
                              fraud_score: float, fraud_prediction: bool) -> Dict[str, Any]:
        """Process fraud detection with customer experience enhancements."""
        
        # Get or create customer profile
        if customer_id not in self.customer_profiles:
            self.create_customer_profile(customer_id)
        
        profile = self.customer_profiles[customer_id]
        
        # Apply behavioral learning
        behavioral_score = self.behavioral_learning.calculate_behavioral_score(
            customer_id, transaction
        )
        
        # Adjust fraud score based on customer behavior and whitelist status
        adjusted_score = fraud_score
        
        # Whitelist adjustment
        if profile.whitelist_status:
            adjusted_score *= 0.3  # Significantly reduce for whitelisted customers
        
        # Behavioral adjustment
        if behavioral_score < 0.3:  # Low anomaly = typical behavior
            adjusted_score *= 0.7
        elif behavioral_score > 0.7:  # High anomaly = unusual behavior
            adjusted_score *= 1.2
        
        # Customer history adjustment
        if profile.false_positive_count > 5:
            adjusted_score *= 0.8  # Reduce for customers with many false positives
        
        # Determine final decision
        threshold = 0.5
        final_prediction = adjusted_score > threshold
        
        # Create alert if fraud detected
        alert = None
        if final_prediction:
            alert = self._create_fraud_alert(customer_id, transaction, adjusted_score)
            
            # Send notifications based on customer preferences
            if profile.notification_preferences.get('email', False) and profile.email:
                self.notification_system.send_email_alert(profile.email, alert)
            
            if profile.notification_preferences.get('sms', False) and profile.phone:
                self.notification_system.send_sms_alert(profile.phone, alert)
        
        # Learn from legitimate transactions
        if not final_prediction:
            self.behavioral_learning.learn_transaction_pattern(customer_id, transaction)
        
        # Update customer profile
        profile.last_activity = datetime.now()
        self._save_customer_profile(profile)
        
        return {
            'original_score': fraud_score,
            'adjusted_score': adjusted_score,
            'behavioral_score': behavioral_score,
            'final_prediction': final_prediction,
            'alert': asdict(alert) if alert else None,
            'customer_adjustments': {
                'whitelisted': profile.whitelist_status,
                'false_positive_count': profile.false_positive_count,
                'behavioral_factor': behavioral_score
            }
        }
    
    def _create_fraud_alert(self, customer_id: str, transaction: Dict[str, Any], 
                           fraud_score: float) -> FraudAlert:
        """Create a fraud alert."""
        alert_id = f"alert_{int(time.time())}_{customer_id}"
        
        # Determine risk level
        if fraud_score >= 0.8:
            risk_level = "HIGH"
            blocked = True
        elif fraud_score >= 0.6:
            risk_level = "MEDIUM"
            blocked = False
        else:
            risk_level = "LOW"
            blocked = False
        
        alert = FraudAlert(
            alert_id=alert_id,
            customer_id=customer_id,
            transaction_id=transaction.get('transaction_id', 'unknown'),
            fraud_score=fraud_score,
            risk_level=risk_level,
            description=f"Suspicious transaction detected: ${transaction.get('amount', 0):.2f}",
            blocked=blocked,
            timestamp=datetime.now()
        )
        
        self._save_fraud_alert(alert)
        return alert
    
    def _save_fraud_alert(self, alert: FraudAlert):
        """Save fraud alert to database."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT OR REPLACE INTO fraud_alerts 
                (alert_id, customer_id, transaction_id, fraud_score, risk_level, 
                 description, blocked, timestamp, customer_feedback, resolution_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                alert.alert_id,
                alert.customer_id,
                alert.transaction_id,
                alert.fraud_score,
                alert.risk_level,
                alert.description,
                alert.blocked,
                alert.timestamp.isoformat(),
                alert.customer_feedback,
                alert.resolution_status
            ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Error saving fraud alert: {e}")
    
    def submit_customer_feedback(self, customer_id: str, alert_id: str, 
                                is_legitimate: bool, feedback_text: str = None, 
                                satisfaction_score: int = 3) -> bool:
        """Submit customer feedback on fraud alert."""
        try:
            feedback_id = f"feedback_{int(time.time())}_{customer_id}"
            
            feedback = CustomerFeedback(
                feedback_id=feedback_id,
                customer_id=customer_id,
                alert_id=alert_id,
                is_legitimate=is_legitimate,
                feedback_text=feedback_text,
                satisfaction_score=satisfaction_score,
                timestamp=datetime.now()
            )
            
            # Save feedback
            self._save_customer_feedback(feedback)
            
            # Update customer profile based on feedback
            if customer_id in self.customer_profiles:
                profile = self.customer_profiles[customer_id]
                
                # Update feedback score (running average)
                profile.feedback_score = (profile.feedback_score + satisfaction_score) / 2
                
                # Track false positives
                if is_legitimate:
                    profile.false_positive_count += 1
                    self.false_positive_patterns[customer_id].append({
                        'alert_id': alert_id,
                        'timestamp': datetime.now(),
                        'feedback': feedback_text
                    })
                
                # Consider whitelisting if customer has good history
                if (profile.false_positive_count >= 3 and 
                    profile.feedback_score >= 4.0 and 
                    not profile.whitelist_status):
                    self.add_to_whitelist(customer_id, "Automatic whitelist due to good feedback history")
                
                self._save_customer_profile(profile)
            
            logger.info(f"Customer feedback submitted for alert {alert_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error submitting customer feedback: {e}")
            return False
    
    def _save_customer_feedback(self, feedback: CustomerFeedback):
        """Save customer feedback to database."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO customer_feedback 
                (feedback_id, customer_id, alert_id, is_legitimate, 
                 feedback_text, satisfaction_score, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                feedback.feedback_id,
                feedback.customer_id,
                feedback.alert_id,
                feedback.is_legitimate,
                feedback.feedback_text,
                feedback.satisfaction_score,
                feedback.timestamp.isoformat()
            ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Error saving customer feedback: {e}")
    
    def add_to_whitelist(self, customer_id: str, reason: str = "Manual addition"):
        """Add customer to whitelist."""
        if customer_id in self.customer_profiles:
            self.customer_profiles[customer_id].whitelist_status = True
            self.whitelisted_customers.add(customer_id)
            self._save_customer_profile(self.customer_profiles[customer_id])
            
            # Add to whitelist table
            try:
                conn = sqlite3.connect(self.db_path)
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO whitelist 
                    (customer_id, item_type, item_value, added_at, expires_at)
                    VALUES (?, ?, ?, ?, ?)
                ''', (
                    customer_id,
                    'customer',
                    reason,
                    datetime.now().isoformat(),
                    None  # No expiration
                ))
                
                conn.commit()
                conn.close()
                
            except Exception as e:
                logger.error(f"Error adding to whitelist table: {e}")
            
            logger.info(f"Customer {customer_id} added to whitelist: {reason}")
    
    def remove_from_whitelist(self, customer_id: str):
        """Remove customer from whitelist."""
        if customer_id in self.customer_profiles:
            self.customer_profiles[customer_id].whitelist_status = False
            self.whitelisted_customers.discard(customer_id)
            self._save_customer_profile(self.customer_profiles[customer_id])
            logger.info(f"Customer {customer_id} removed from whitelist")
    
    def get_customer_insights(self, customer_id: str) -> Dict[str, Any]:
        """Get comprehensive customer insights."""
        if customer_id not in self.customer_profiles:
            return {'error': 'Customer not found'}
        
        profile = self.customer_profiles[customer_id]
        
        # Get feedback history
        feedback_history = []
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT * FROM customer_feedback 
                WHERE customer_id = ? 
                ORDER BY timestamp DESC LIMIT 10
            ''', (customer_id,))
            
            for row in cursor.fetchall():
                feedback_history.append({
                    'feedback_id': row[0],
                    'alert_id': row[2],
                    'is_legitimate': bool(row[3]),
                    'satisfaction_score': row[5],
                    'timestamp': row[6]
                })
            
            conn.close()
            
        except Exception as e:
            logger.error(f"Error getting feedback history: {e}")
        
        return {
            'customer_profile': asdict(profile),
            'behavioral_patterns': self.behavioral_learning.customer_patterns.get(customer_id, {}),
            'feedback_history': feedback_history,
            'whitelist_status': customer_id in self.whitelisted_customers,
            'false_positive_patterns': self.false_positive_patterns.get(customer_id, [])
        }
    
    def generate_customer_report(self) -> Dict[str, Any]:
        """Generate comprehensive customer experience report."""
        total_customers = len(self.customer_profiles)
        whitelisted_count = len(self.whitelisted_customers)
        
        # Calculate average feedback scores
        feedback_scores = [p.feedback_score for p in self.customer_profiles.values() if p.feedback_score > 0]
        avg_feedback = np.mean(feedback_scores) if feedback_scores else 0
        
        # False positive analysis
        total_false_positives = sum(p.false_positive_count for p in self.customer_profiles.values())
        avg_false_positives = total_false_positives / total_customers if total_customers > 0 else 0
        
        return {
            'summary': {
                'total_customers': total_customers,
                'whitelisted_customers': whitelisted_count,
                'average_feedback_score': round(avg_feedback, 2),
                'total_false_positives': total_false_positives,
                'average_false_positives_per_customer': round(avg_false_positives, 2)
            },
            'whitelist_percentage': round((whitelisted_count / total_customers * 100), 2) if total_customers > 0 else 0,
            'customer_satisfaction': {
                'excellent': len([s for s in feedback_scores if s >= 4.5]),
                'good': len([s for s in feedback_scores if 3.5 <= s < 4.5]),
                'average': len([s for s in feedback_scores if 2.5 <= s < 3.5]),
                'poor': len([s for s in feedback_scores if s < 2.5])
            }
        }

# Usage example
if __name__ == "__main__":
    # Initialize customer experience manager
    ce_manager = CustomerExperienceManager()
    
    # Create test customer
    customer_id = "test_customer_001"
    ce_manager.create_customer_profile(
        customer_id=customer_id,
        email="test@example.com",
        phone="+1234567890"
    )
    
    # Simulate fraud detection process
    test_transaction = {
        'transaction_id': 'txn_12345',
        'amount': 150.00,
        'hour': 14,  # 2 PM
        'location': 'New York',
        'merchant': 'Amazon'
    }
    
    # Process with high fraud score
    result = ce_manager.process_fraud_detection(
        customer_id=customer_id,
        transaction=test_transaction,
        fraud_score=0.85,
        fraud_prediction=True
    )
    
    print("Fraud Detection Result:")
    print(json.dumps(result, indent=2, default=str))
    
    # Simulate customer feedback (false positive)
    if result['alert']:
        ce_manager.submit_customer_feedback(
            customer_id=customer_id,
            alert_id=result['alert']['alert_id'],
            is_legitimate=True,  # Customer says it was legitimate
            feedback_text="This was my purchase, I was shopping online",
            satisfaction_score=2  # Poor experience due to false positive
        )
    
    # Get customer insights
    insights = ce_manager.get_customer_insights(customer_id)
    print("\nCustomer Insights:")
    print(json.dumps(insights, indent=2, default=str))
    
    # Generate report
    report = ce_manager.generate_customer_report()
    print("\nCustomer Experience Report:")
    print(json.dumps(report, indent=2))