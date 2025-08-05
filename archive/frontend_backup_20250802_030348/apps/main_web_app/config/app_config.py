"""
Application Configuration
=========================
Configuration and sample data for FCA Dashboard
"""

# Sample data for the application
SAMPLE_DATA = {
    'stats': {
        'total_transactions': 156789,
        'fraud_detected': 1247,
        'accuracy_rate': 98.7,
        'models_active': 5,
        'datasets': 8,
        'detection_rate': 0.79,
        'false_positive_rate': 0.12,
        'processing_time_ms': 45.7
    },
    'datasets': [
        {
            'name': 'IBM AML Dataset', 
            'description': 'Anti-money laundering transaction data',
            'records': 95412,
            'features': 127,
            'status': 'active',
            'last_updated': '2025-07-31',
            'accuracy': 0.967,
            'size_mb': 456.2
        },
        {
            'name': 'Financial Phrasebank',
            'description': 'Financial sentiment analysis data', 
            'records': 4845,
            'features': 50,
            'status': 'active',
            'last_updated': '2025-07-30',
            'accuracy': 0.892,
            'size_mb': 12.8
        },
        {
            'name': 'Credit Card Fraud 2023',
            'description': 'Latest credit card fraud patterns',
            'records': 284807,
            'features': 31,
            'status': 'active', 
            'last_updated': '2025-07-29',
            'accuracy': 0.994,
            'size_mb': 143.9
        },
        {
            'name': 'Customer Attrition Analysis',
            'description': 'Customer churn prediction dataset',
            'records': 10000,
            'features': 23,
            'status': 'active',
            'last_updated': '2025-07-28',
            'accuracy': 0.875,
            'size_mb': 5.2
        },
        {
            'name': 'Wamc Fraud Dataset',
            'description': 'Various fraud detection patterns',
            'records': 125394,
            'features': 89,
            'status': 'processing',
            'last_updated': '2025-07-27',
            'accuracy': 0.923,
            'size_mb': 89.7
        }
    ],
    'model_comparison': {
        'total_models': 12,
        'best_performer': 'Random Forest',
        'average_accuracy': 0.934,
        'top_domain': 'Fraud Detection'
    }
}

def get_app_config():
    """Get application configuration"""
    return {
        'SECRET_KEY': 'your-secret-key-here',
        'DEBUG': True,
        'HOST': '0.0.0.0',
        'PORT': 5000
    }