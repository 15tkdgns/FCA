#!/usr/bin/env python3
"""
Module Tester
=============

Comprehensive testing system for individual FCA modules
"""

import sys
import traceback
import time
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

class ModuleTester:
    """Test individual FCA modules"""
    
    def __init__(self):
        self.test_results = {}
        self.test_start_time = None
        
    def test_all_modules(self) -> Dict[str, Any]:
        """Test all FCA modules and return comprehensive results"""
        self.test_start_time = time.time()
        
        print("🧪 FCA COMPREHENSIVE MODULE TESTING")
        print("=" * 50)
        
        # Test categories
        test_categories = [
            ('Core Modules', self._test_core_modules),
            ('Visualization Modules', self._test_visualization_modules),
            ('Engine Modules', self._test_engine_modules),
            ('Data Processing Modules', self._test_data_modules),
            ('Utility Modules', self._test_utility_modules),
            ('API Modules', self._test_api_modules)
        ]
        
        overall_results = {
            'test_summary': {
                'start_time': datetime.fromtimestamp(self.test_start_time).isoformat(),
                'total_categories': len(test_categories),
                'passed_categories': 0,
                'failed_categories': 0
            },
            'category_results': {},
            'module_details': {}
        }
        
        for category_name, test_function in test_categories:
            print(f"\n📦 {category_name.upper()}:")
            try:
                category_result = test_function()
                overall_results['category_results'][category_name] = category_result
                
                if category_result['status'] == 'passed':
                    overall_results['test_summary']['passed_categories'] += 1
                    print(f"✅ {category_name}: PASSED")
                else:
                    overall_results['test_summary']['failed_categories'] += 1
                    print(f"❌ {category_name}: FAILED")
                    
            except Exception as e:
                error_result = {
                    'status': 'failed',
                    'error': str(e),
                    'traceback': traceback.format_exc()
                }
                overall_results['category_results'][category_name] = error_result
                overall_results['test_summary']['failed_categories'] += 1
                print(f"❌ {category_name}: FAILED - {str(e)}")
        
        # Calculate final metrics
        end_time = time.time()
        overall_results['test_summary'].update({
            'end_time': datetime.fromtimestamp(end_time).isoformat(),
            'duration_seconds': end_time - self.test_start_time,
            'success_rate': (overall_results['test_summary']['passed_categories'] / 
                           len(test_categories)) * 100
        })
        
        print(f"\n{'='*50}")
        print(f"🎯 FINAL RESULTS:")
        print(f"✅ Passed: {overall_results['test_summary']['passed_categories']}")
        print(f"❌ Failed: {overall_results['test_summary']['failed_categories']}")
        print(f"📊 Success Rate: {overall_results['test_summary']['success_rate']:.1f}%")
        print(f"⏱️ Duration: {overall_results['test_summary']['duration_seconds']:.2f}s")
        
        return overall_results
    
    def _test_core_modules(self) -> Dict[str, Any]:
        """Test core FCA modules"""
        results = {'status': 'passed', 'modules': {}}
        
        # Test config module
        try:
            from fca.core import config, get_config, get_logger
            results['modules']['config'] = {
                'status': 'passed',
                'project_root': str(config.project_root),
                'debug_mode': config.debug
            }
            print("  ✅ Config module")
        except Exception as e:
            results['modules']['config'] = {'status': 'failed', 'error': str(e)}
            results['status'] = 'failed'
            print(f"  ❌ Config module: {e}")
        
        # Test logging
        try:
            logger = get_logger('test_module')
            logger.info("Test log message")
            results['modules']['logging'] = {'status': 'passed'}
            print("  ✅ Logging module")
        except Exception as e:
            results['modules']['logging'] = {'status': 'failed', 'error': str(e)}
            results['status'] = 'failed'
            print(f"  ❌ Logging module: {e}")
        
        return results
    
    def _test_visualization_modules(self) -> Dict[str, Any]:
        """Test visualization modules"""
        results = {'status': 'passed', 'modules': {}}
        
        # Test base chart
        try:
            from fca.visualization import BaseChart
            base_chart = BaseChart()
            test_fig = base_chart.create_error_chart("Test error")
            results['modules']['base_chart'] = {
                'status': 'passed',
                'color_palette_size': len(base_chart.color_palette)
            }
            print("  ✅ BaseChart")
        except Exception as e:
            results['modules']['base_chart'] = {'status': 'failed', 'error': str(e)}
            results['status'] = 'failed'
            print(f"  ❌ BaseChart: {e}")
        
        # Test performance charts
        try:
            from fca.visualization import PerformanceChartGenerator
            perf_chart = PerformanceChartGenerator()
            
            # Test with sample data
            sample_models = [
                {'name': 'Test Model', 'accuracy': 0.95, 'precision': 0.92}
            ]
            chart_json = perf_chart.create_accuracy_comparison(sample_models)
            results['modules']['performance_charts'] = {'status': 'passed'}
            print("  ✅ PerformanceChartGenerator")
        except Exception as e:
            results['modules']['performance_charts'] = {'status': 'failed', 'error': str(e)}
            results['status'] = 'failed'
            print(f"  ❌ PerformanceChartGenerator: {e}")
        
        # Test distribution charts
        try:
            from fca.visualization import DistributionChartGenerator
            dist_chart = DistributionChartGenerator()
            
            sample_distribution = {'positive': 100, 'negative': 80, 'neutral': 120}
            chart_json = dist_chart.create_sentiment_distribution(sample_distribution)
            results['modules']['distribution_charts'] = {'status': 'passed'}
            print("  ✅ DistributionChartGenerator")
        except Exception as e:
            results['modules']['distribution_charts'] = {'status': 'failed', 'error': str(e)}
            results['status'] = 'failed'
            print(f"  ❌ DistributionChartGenerator: {e}")
        
        return results
    
    def _test_engine_modules(self) -> Dict[str, Any]:
        """Test engine modules"""
        results = {'status': 'passed', 'modules': {}}
        
        # Test fraud detection engine
        try:
            from fca.engines import FraudDetectionEngine
            fraud_engine = FraudDetectionEngine()
            results['modules']['fraud_engine'] = {
                'status': 'passed',
                'is_trained': fraud_engine.is_trained
            }
            print("  ✅ FraudDetectionEngine")
        except Exception as e:
            results['modules']['fraud_engine'] = {'status': 'failed', 'error': str(e)}
            results['status'] = 'failed'
            print(f"  ❌ FraudDetectionEngine: {e}")
        
        # Test sentiment analyzer
        try:
            from fca.engines import SentimentAnalyzer
            sentiment_analyzer = SentimentAnalyzer()
            
            # Test basic functionality
            test_text = "This is a great product with excellent performance"
            processed = sentiment_analyzer.preprocess_text(test_text)
            fin_score = sentiment_analyzer._calculate_financial_sentiment("profit growth")
            
            results['modules']['sentiment_analyzer'] = {
                'status': 'passed',
                'preprocessed_length': len(processed.split()),
                'financial_score': fin_score
            }
            print("  ✅ SentimentAnalyzer")
        except Exception as e:
            results['modules']['sentiment_analyzer'] = {'status': 'failed', 'error': str(e)}
            results['status'] = 'failed'
            print(f"  ❌ SentimentAnalyzer: {e}")
        
        # Test modular sentiment components
        try:
            from fca.engines.sentiment import BaseSentimentAnalyzer, SentimentFeatureExtractor
            base_analyzer = BaseSentimentAnalyzer()
            feature_extractor = SentimentFeatureExtractor()
            
            results['modules']['sentiment_modular'] = {
                'status': 'passed',
                'base_analyzer_config': bool(base_analyzer.config),
                'feature_extractor_ready': bool(feature_extractor.vader_analyzer)
            }
            print("  ✅ Modular Sentiment Components")
        except Exception as e:
            results['modules']['sentiment_modular'] = {'status': 'failed', 'error': str(e)}
            results['status'] = 'failed'
            print(f"  ❌ Modular Sentiment Components: {e}")
        
        return results
    
    def _test_data_modules(self) -> Dict[str, Any]:
        """Test data processing modules"""
        results = {'status': 'passed', 'modules': {}}
        
        # Test data processor
        try:
            from fca.data import DataProcessor
            processor = DataProcessor()
            results['modules']['data_processor'] = {'status': 'passed'}
            print("  ✅ DataProcessor")
        except Exception as e:
            results['modules']['data_processor'] = {'status': 'failed', 'error': str(e)}
            results['status'] = 'failed'
            print(f"  ❌ DataProcessor: {e}")
        
        # Test data loader
        try:
            from fca.data import DataLoader
            loader = DataLoader()
            results['modules']['data_loader'] = {'status': 'passed'}
            print("  ✅ DataLoader")
        except Exception as e:
            results['modules']['data_loader'] = {'status': 'failed', 'error': str(e)}
            results['status'] = 'failed'
            print(f"  ❌ DataLoader: {e}")
        
        return results
    
    def _test_utility_modules(self) -> Dict[str, Any]:
        """Test utility modules"""
        results = {'status': 'passed', 'modules': {}}
        
        # Test helper functions
        try:
            from fca.utils import format_number, safe_division, validate_dataframe, validate_numeric_array
            
            # Test helper functions
            formatted = format_number(1234567)
            division_result = safe_division(10, 2)
            zero_division = safe_division(10, 0)
            
            # Test validators
            test_df = pd.DataFrame({'a': [1, 2, 3], 'b': [4, 5, 6]})
            df_valid, df_msg = validate_dataframe(test_df)
            
            test_array = np.array([1, 2, 3, 4, 5])
            array_valid, array_msg = validate_numeric_array(test_array)
            
            results['modules']['utils'] = {
                'status': 'passed',
                'format_number_result': formatted,
                'safe_division_10_2': division_result,
                'safe_division_10_0': zero_division,
                'dataframe_validation': df_valid,
                'array_validation': array_valid
            }
            print("  ✅ Utility functions")
        except Exception as e:
            results['modules']['utils'] = {'status': 'failed', 'error': str(e)}
            results['status'] = 'failed'
            print(f"  ❌ Utility functions: {e}")
        
        return results
    
    def _test_api_modules(self) -> Dict[str, Any]:
        """Test API modules"""
        results = {'status': 'passed', 'modules': {}}
        
        # Test API manager
        try:
            from fca.api import APIManager
            api_manager = APIManager()
            results['modules']['api_manager'] = {'status': 'passed'}
            print("  ✅ APIManager")
        except Exception as e:
            results['modules']['api_manager'] = {'status': 'failed', 'error': str(e)}
            results['status'] = 'failed'
            print(f"  ❌ APIManager: {e}")
        
        return results
    
    def generate_test_report(self, results: Dict[str, Any]) -> str:
        """Generate detailed test report"""
        report_lines = [
            "FCA MODULE TEST REPORT",
            "=" * 50,
            f"Generated: {datetime.now().isoformat()}",
            f"Duration: {results['test_summary']['duration_seconds']:.2f}s",
            f"Success Rate: {results['test_summary']['success_rate']:.1f}%",
            "",
            "CATEGORY RESULTS:",
            "-" * 20
        ]
        
        for category, result in results['category_results'].items():
            status_icon = "✅" if result['status'] == 'passed' else "❌"
            report_lines.append(f"{status_icon} {category}: {result['status'].upper()}")
            
            if 'modules' in result:
                for module, module_result in result['modules'].items():
                    module_icon = "  ✓" if module_result['status'] == 'passed' else "  ✗"
                    report_lines.append(f"    {module_icon} {module}")
        
        return "\n".join(report_lines)