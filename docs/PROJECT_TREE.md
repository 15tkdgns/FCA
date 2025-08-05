# 🏗️ FCA (Financial Crime Analysis) Project Structure

```
FCA/
├── 📱 apps/                                    # Web Applications
│   ├── main_web_app/                          # 🎯 Main Unified Dashboard App
│   │   ├── api/                               # API Layer
│   │   │   └── endpoints/
│   │   │       ├── transparency_api.py        # Transparency endpoints
│   │   │       └── __init__.py
│   │   ├── static/                            # Static Assets
│   │   │   ├── css/
│   │   │   │   ├── dashboard-modular.css      # Main dashboard styles
│   │   │   │   ├── enhanced-dashboard.css     # Enhanced dashboard styles
│   │   │   │   └── modules/                   # CSS modules
│   │   │   ├── js/
│   │   │   │   ├── api-client.js              # 🔥 Main API client
│   │   │   │   ├── common.js                  # Common utilities
│   │   │   │   ├── error-display.js           # Error handling
│   │   │   │   ├── translator.js              # 🌐 Translation system
│   │   │   │   ├── visualizations-modular.js  # Chart rendering
│   │   │   │   └── modules/                   # JS modules
│   │   │   └── images/                        # Static images
│   │   ├── templates/                         # HTML Templates
│   │   │   ├── 🏠 unified_dashboard.html      # ⭐ NEW: Unified Dashboard
│   │   │   ├── base.html                      # Base template with nav
│   │   │   ├── enhanced_dashboard.html        # Enhanced dashboard
│   │   │   ├── simple_dashboard.html          # Simple dashboard
│   │   │   ├── index.html                     # Basic dashboard
│   │   │   ├── comparison.html                # 🔥 Model comparison
│   │   │   ├── datasets.html                  # Dataset management
│   │   │   ├── fraud.html                     # Fraud detection
│   │   │   ├── sentiment.html                 # Sentiment analysis
│   │   │   ├── attrition.html                 # Customer attrition
│   │   │   ├── visualizations.html            # Visualizations
│   │   │   ├── xai.html                       # Explainable AI
│   │   │   ├── transparency.html              # Transparency dashboard
│   │   │   └── includes/                      # Reusable components
│   │   │       ├── chart-card.html
│   │   │       ├── loading-spinner.html
│   │   │       └── category-buttons.html
│   │   ├── utils/                             # Utilities
│   │   │   ├── performance_calculator.py      # Performance metrics
│   │   │   └── secure_performance_calculator.py # Secure metrics
│   │   └── 🚀 run_web_app.py                  # ⭐ Main Flask app
│   └── modular_web_app/                       # Modular architecture version
│       ├── api/
│       ├── charts/
│       ├── config/
│       ├── routes/
│       └── web_app_modular_app.py
│
├── 🧠 fca/                                     # Core FCA Library
│   ├── engines/                               # ML Engines
│   │   ├── fraud_detector.py                  # 🛡️ Fraud detection engine
│   │   ├── sentiment_analyzer.py              # 💬 Sentiment analysis engine
│   │   ├── attrition_predictor.py             # 👥 Customer attrition engine
│   │   └── sentiment/                         # Sentiment models
│   ├── data/                                  # Data management
│   │   ├── data_loader.py                     # Data loading utilities
│   │   └── data_validator.py                  # Data validation
│   ├── visualization/                         # Chart generators
│   │   ├── base_chart.py                      # Base chart class
│   │   ├── comparison_charts.py               # 🔥 Model comparison charts
│   │   ├── fraud_charts.py                    # Fraud detection charts
│   │   └── sentiment_charts.py                # Sentiment analysis charts
│   ├── core/                                  # Core utilities
│   ├── api/                                   # API utilities
│   └── utils/                                 # Helper functions
│
├── 📊 data/                                    # Datasets
│   ├── ibm_aml/                               # IBM AML dataset
│   │   ├── process_data.py
│   │   ├── analyze_data.py
│   │   ├── dataset_info.json
│   │   └── fraud_summary.json
│   ├── financial_phrasebank/                  # Financial sentiment data
│   │   └── FinancialPhraseBank/
│   ├── credit_card_fraud_2023/                # Credit card fraud data
│   ├── customer_attrition/                    # Customer attrition data
│   ├── performance_metrics.json               # Performance data
│   └── dataset_metadata.json                  # Dataset metadata
│
├── 🧪 tests/                                   # Test Suite
│   ├── test_server.py                         # Server tests
│   ├── test_advanced_fraud_detection.py       # Advanced fraud tests
│   ├── test_dataset_api.py                    # Dataset API tests
│   ├── test_ibm_aml_integration.py            # IBM AML integration tests
│   └── README.md
│
├── 🌐 static_web/                             # Static Website
│   ├── index.html                             # Static main page
│   ├── test_functionality.html                # Functionality tests
│   └── assets/                                # Static assets
│       ├── css/
│       ├── js/
│       └── images/
│
├── 🛠️ tools/                                  # Development Tools
│   ├── notebooks/                             # Jupyter notebooks
│   │   └── model_comparison_dashboard.py
│   └── utilities/                             # Utility scripts
│
├── 📁 config/                                 # Configuration files
├── 📝 docs/                                   # Documentation
│   ├── deployment/                            # Deployment guides
│   ├── guides/                                # User guides
│   └── reports/                               # Analysis reports
│
├── 🗄️ archive/                                # Archived/deprecated files
│   ├── deprecated/
│   └── logs/
│
├── 🐳 docker/                                 # Docker configuration
├── 📊 examples/                               # Usage examples
├── 📚 models/                                 # Trained models
├── 📋 logs/                                   # Application logs
├── 🔧 backend/                                # Backend services
│   └── server.py
│
├── 🚀 simple_server.py                        # Simple Flask server
├── 🌍 translation_test.html                   # Translation testing
├── 📄 SYSTEM_FLOW_DIAGRAM.md                  # System architecture
└── 📋 PROJECT_TREE.md                        # This file
```

## 🎯 Key Components Overview

### 🏠 **Main Application** (`/apps/main_web_app/`)
- **Entry Point**: `run_web_app.py` - Main Flask application
- **Main Dashboard**: `unified_dashboard.html` - Unified dashboard combining all features
- **API Client**: `api-client.js` - Handles all frontend-backend communication
- **Translation**: `translator.js` - Multi-language support system

### 🧠 **Core Library** (`/fca/`)
- **Fraud Detection**: Advanced ML models for fraud detection
- **Sentiment Analysis**: Financial sentiment analysis engine  
- **Attrition Prediction**: Customer attrition prediction models
- **Visualizations**: Plotly-based chart generation system

### 📊 **Data Management** (`/data/`)
- **IBM AML Dataset**: Anti-money laundering transaction data
- **Financial Phrasebank**: Financial sentiment data
- **Performance Metrics**: Real-time model performance data
- **Dataset Metadata**: Comprehensive dataset information

### 🎨 **Frontend Architecture**
- **Bootstrap 5**: Modern responsive UI framework
- **Plotly.js**: Interactive data visualizations
- **Custom CSS**: Enhanced styling with gradients and animations
- **Modular JS**: Component-based JavaScript architecture

### 🔧 **Development & Testing**
- **Comprehensive Tests**: Unit and integration tests
- **Docker Support**: Containerization ready
- **Development Tools**: Jupyter notebooks and utilities
- **Documentation**: Extensive guides and reports

## 🚀 **Current Status**
- ✅ **Unified Dashboard**: All dashboard variants combined into one
- ✅ **Model Comparison**: Full comparison system working
- ✅ **Translation System**: Multi-language support active
- ✅ **API Integration**: All endpoints functional
- ✅ **Real-time Updates**: Live data refresh system

## 📈 **Architecture Benefits**
- **Scalable**: Modular design allows easy feature addition
- **Maintainable**: Clear separation of concerns
- **User-Friendly**: Intuitive dashboard interface
- **Comprehensive**: Complete fraud detection ecosystem
- **Modern**: Latest web technologies and best practices