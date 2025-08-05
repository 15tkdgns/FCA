# FCA Static Web Dashboard

A complete static web application for Financial Crime Analysis (FCA) data visualization and analysis.

## 🚀 Features

- **Fraud Detection Analysis**: Interactive visualizations of credit card fraud detection results
- **Sentiment Analysis**: Financial news sentiment classification with pie charts
- **Customer Attrition**: Bank customer churn analysis and predictions
- **Dataset Management**: Overview of all datasets and their status
- **Model Comparison**: Performance comparison across different ML models
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 📁 Project Structure

```
static_web/
├── index.html              # Main HTML file
├── assets/
│   ├── css/
│   │   └── style.css       # All CSS styles
│   └── js/
│       ├── app.js          # Main application logic
│       ├── charts.js       # Chart generation logic
│       └── pages.js        # Page-specific functionality
├── data/
│   ├── fraud_data.json     # Fraud detection dataset
│   ├── sentiment_data.json # Sentiment analysis dataset
│   ├── attrition_data.json # Customer attrition dataset
│   ├── datasets.json       # Dataset metadata
│   ├── summary.json        # Overall summary statistics
│   └── charts.json         # Chart configuration data
├── test_functionality.html # Testing page
└── README.md              # This file
```

## 🌐 How to Run

### Option 1: Python HTTP Server
```bash
cd /root/FCA/static_web
python3 -m http.server 8080
# Open http://localhost:8080 in browser
```

### Option 2: Node.js HTTP Server
```bash
cd /root/FCA/static_web
npx http-server -p 8080
# Open http://localhost:8080 in browser
```

### Option 3: Any Web Server
Simply serve the `static_web` directory using any web server (Apache, Nginx, etc.)

## 📊 Data Overview

- **Fraud Detection**: 568,629 credit card transactions with 99.91% model accuracy
- **Sentiment Analysis**: 4,839 financial news sentences with 87.3% classification accuracy
- **Customer Attrition**: 10,127 bank customers with 89.4% churn prediction accuracy

## 🎮 Navigation

- **Keyboard Shortcuts**:
  - `1-6`: Navigate between pages
  - `Ctrl/Cmd + R`: Refresh data
  - `Ctrl/Cmd + P`: Print current page
  - `F11`: Toggle fullscreen
  - `Home`: Scroll to top

- **Mobile Support**: 
  - Hamburger menu for navigation
  - Touch-friendly interface
  - Responsive charts and tables

## 🔧 Technical Details

- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Plotly.js and Chart.js for interactive visualizations
- **Styling**: Bootstrap 5 + Custom CSS
- **Icons**: Font Awesome 6
- **No Backend Required**: Completely client-side application

## 🧪 Testing

Open `test_functionality.html` to run automated tests that verify:
- Data file accessibility
- JSON format validation
- Chart data integrity
- Overall application health

## 🎯 Key Features

### Interactive Charts
- Fraud transaction distribution
- Model performance metrics
- Sentiment analysis pie charts
- Customer churn by demographics
- Cross-model performance comparison

### Real-time UI
- Loading animations
- Toast notifications
- Smooth page transitions
- Responsive data updates

### Data Management
- JSON-based data storage
- Efficient data loading
- Error handling and fallbacks
- Data export capabilities

## 🚀 Performance Optimizations

- Lazy loading of chart libraries
- Efficient DOM manipulation
- Minimal HTTP requests
- Compressed data formats
- Mobile-optimized rendering

---

**Project Status**: ✅ Complete and Ready for Production

This static web application provides all the functionality of the original Flask-based application without requiring any server-side dependencies.