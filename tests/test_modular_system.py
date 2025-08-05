#!/usr/bin/env python3
"""
Modular System Test
==================

모듈화된 시스템의 기능을 테스트합니다.
"""

import sys
import os
import numpy as np
import pandas as pd
from pathlib import Path

# 모듈 경로 추가
sys.path.append('/root/FCA')
sys.path.append('/root/FCA/web_app')

def test_fraud_detection_modules():
    """사기 탐지 모듈 테스트"""
    print("🔍 Testing Fraud Detection Modules...")
    
    try:
        from fraud_detection.models import IsolationForestDetector, ModelMetrics, DetectionResult
        
        # 테스트 데이터 생성
        np.random.seed(42)
        X_normal = np.random.normal(0, 1, (100, 5))
        X_anomaly = np.random.normal(3, 1, (10, 5))
        X = np.vstack([X_normal, X_anomaly])
        
        # 모델 테스트
        detector = IsolationForestDetector(contamination=0.1, random_state=42)
        detector.fit(X)
        
        result = detector.predict(X)
        
        print(f"   ✅ Model Name: {result.model_name}")
        print(f"   ✅ Sample Count: {result.sample_count}")
        print(f"   ✅ Outlier Count: {result.metrics.outlier_count}")
        print(f"   ✅ Normal Count: {result.metrics.normal_count}")
        
        # 모델 정보 확인
        model_info = detector.get_model_info()
        print(f"   ✅ Model fitted: {model_info['is_fitted']}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Fraud Detection Module Error: {e}")
        return False

def test_chart_modules():
    """차트 모듈 테스트"""
    print("\n📊 Testing Chart Modules...")
    
    try:
        from web_app.modules.charts import chart_factory, PerformanceOverviewChart
        
        # 테스트 데이터 생성
        fraud_df = pd.DataFrame({
            'Model': ['Random Forest', 'XGBoost', 'SVM'],
            'AUC-ROC': [0.99, 0.95, 0.88]
        })
        
        sentiment_df = pd.DataFrame({
            'Model': ['BERT', 'RoBERTa', 'DistilBERT'],
            'Accuracy': [0.94, 0.93, 0.91]
        })
        
        attrition_df = pd.DataFrame({
            'Model': ['Logistic', 'Random Forest', 'XGBoost'],
            'AUC-ROC': [0.87, 0.86, 0.84]
        })
        
        # 차트 팩토리 테스트
        available_charts = chart_factory.get_available_types()
        print(f"   ✅ Available chart types: {available_charts}")
        
        # 차트 생성 테스트
        chart = chart_factory.create_chart('performance_overview')
        chart_json = chart.generate(fraud_df, sentiment_df, attrition_df)
        
        print(f"   ✅ Chart generated: {len(chart_json)} characters")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Chart Module Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_statistics_modules():
    """통계 모듈 테스트"""
    print("\n📈 Testing Statistics Modules...")
    
    try:
        # 통계 모듈은 JS이므로 파일 존재 확인만
        stats_files = [
            '/root/FCA/frontend/modules/statistics/DescriptiveStats.js',
            '/root/FCA/frontend/modules/statistics/CorrelationAnalysis.js',
            '/root/FCA/frontend/modules/statistics/StatisticalTests.js'
        ]
        
        for file_path in stats_files:
            if os.path.exists(file_path):
                print(f"   ✅ {os.path.basename(file_path)} exists")
            else:
                print(f"   ❌ {os.path.basename(file_path)} missing")
                return False
        
        return True
        
    except Exception as e:
        print(f"   ❌ Statistics Module Error: {e}")
        return False

def test_advanced_statistics():
    """Advanced Statistics 모듈 업데이트 확인"""
    print("\n🔧 Testing Advanced Statistics Update...")
    
    try:
        stats_file = '/root/FCA/frontend/advanced-statistics.js'
        if os.path.exists(stats_file):
            with open(stats_file, 'r') as f:
                content = f.read()
                
            if 'import { DescriptiveStats }' in content:
                print("   ✅ Advanced Statistics updated with modular imports")
                return True
            else:
                print("   ⚠️  Advanced Statistics not fully updated")
                return False
        else:
            print("   ❌ Advanced Statistics file not found")
            return False
            
    except Exception as e:
        print(f"   ❌ Advanced Statistics Test Error: {e}")
        return False

def test_file_structure():
    """파일 구조 확인"""
    print("\n📁 Testing File Structure...")
    
    expected_structure = {
        '/root/FCA/fraud_detection/__init__.py': 'Fraud Detection Package',
        '/root/FCA/fraud_detection/models/__init__.py': 'Models Package',
        '/root/FCA/fraud_detection/models/base_detector.py': 'Base Detector',
        '/root/FCA/fraud_detection/models/isolation_forest_detector.py': 'Isolation Forest',
        '/root/FCA/web_app/modules/charts/__init__.py': 'Charts Package',
        '/root/FCA/web_app/modules/charts/base_chart.py': 'Base Chart',
        '/root/FCA/web_app/modules/charts/performance_charts.py': 'Performance Charts',
        '/root/FCA/frontend/modules/statistics/DescriptiveStats.js': 'Descriptive Stats',
        '/root/FCA/frontend/modules/statistics/CorrelationAnalysis.js': 'Correlation Analysis',
        '/root/FCA/frontend/modules/statistics/StatisticalTests.js': 'Statistical Tests'
    }
    
    all_good = True
    for file_path, description in expected_structure.items():
        if os.path.exists(file_path):
            file_size = os.path.getsize(file_path)
            print(f"   ✅ {description}: {file_size:,} bytes")
        else:
            print(f"   ❌ {description}: Missing")
            all_good = False
    
    return all_good

def main():
    """메인 테스트 함수"""
    print("🧪 FCA Modular System Test")
    print("=" * 50)
    
    tests = [
        ("File Structure", test_file_structure),
        ("Fraud Detection Modules", test_fraud_detection_modules),
        ("Chart Modules", test_chart_modules),
        ("Statistics Modules", test_statistics_modules),
        ("Advanced Statistics Update", test_advanced_statistics)
    ]
    
    results = {}
    for test_name, test_func in tests:
        results[test_name] = test_func()
    
    print("\n" + "=" * 50)
    print("📋 Test Summary:")
    
    passed = 0
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {status}: {test_name}")
        if result:
            passed += 1
    
    print(f"\n🎯 Overall Result: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All modular systems working correctly!")
        return True
    else:
        print("⚠️  Some issues found in modular system")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)