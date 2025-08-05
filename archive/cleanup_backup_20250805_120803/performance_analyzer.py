#!/usr/bin/env python3
"""
Performance Analyzer
===================

FCA 웹앱의 성능 문제를 분석하는 도구
"""

import sys
import os
import time
import requests
import psutil
from pathlib import Path
import pandas as pd
from typing import Dict, List, Any

# 모듈 경로 추가
sys.path.append('/root/FCA')

from core.logging_manager import get_logger, log_calls

logger = get_logger("PerformanceAnalyzer")


class PerformanceAnalyzer:
    """성능 분석기"""
    
    def __init__(self):
        self.base_url = "http://localhost:5003"
        self.results = {}
    
    @log_calls()
    def analyze_startup_time(self):
        """앱 시작 시간 분석"""
        print("🚀 Analyzing startup time...")
        
        # 프로세스 시작 시간 측정
        startup_metrics = {
            'module_loading_time': 0,
            'route_registration_time': 0,
            'total_startup_time': 0
        }
        
        # 로그에서 시작 시간 분석
        log_file = Path("/root/FCA/logs/moduleloader.log")
        if log_file.exists():
            with open(log_file, 'r') as f:
                lines = f.readlines()
            
            start_time = None
            module_load_start = None
            route_config_start = None
            
            for line in lines:
                if "🚀 Starting FCA Web Application" in line:
                    start_time = self._extract_timestamp(line)
                elif "📦 Module loader initialized" in line and module_load_start is None:
                    module_load_start = self._extract_timestamp(line)
                elif "✅ All routes configured" in line:
                    route_config_start = self._extract_timestamp(line)
            
            if start_time and module_load_start:
                startup_metrics['module_loading_time'] = (module_load_start - start_time).total_seconds()
            
            if module_load_start and route_config_start:
                startup_metrics['route_registration_time'] = (route_config_start - module_load_start).total_seconds()
            
            if start_time and route_config_start:
                startup_metrics['total_startup_time'] = (route_config_start - start_time).total_seconds()
        
        self.results['startup'] = startup_metrics
        print(f"   📊 Module loading: {startup_metrics['module_loading_time']:.3f}s")
        print(f"   📊 Route registration: {startup_metrics['route_registration_time']:.3f}s")
        print(f"   📊 Total startup: {startup_metrics['total_startup_time']:.3f}s")
        
        return startup_metrics
    
    @log_calls()
    def analyze_page_load_times(self):
        """페이지 로딩 시간 분석"""
        print("\n📄 Analyzing page load times...")
        
        pages_to_test = [
            ('/', 'Main Dashboard'),
            ('/fraud', 'Fraud Analysis'),
            ('/sentiment', 'Sentiment Analysis'),
            ('/attrition', 'Attrition Analysis'),
            ('/datasets', 'Datasets'),
            ('/comparison', 'Model Comparison')
        ]
        
        page_metrics = {}
        
        for path, name in pages_to_test:
            try:
                start_time = time.time()
                response = requests.get(f"{self.base_url}{path}", timeout=10)
                load_time = time.time() - start_time
                
                page_metrics[path] = {
                    'name': name,
                    'status_code': response.status_code,
                    'load_time': load_time,
                    'response_size': len(response.content),
                    'success': response.status_code == 200
                }
                
                status = "✅" if response.status_code == 200 else "❌"
                print(f"   {status} {name}: {load_time:.3f}s ({response.status_code})")
                
            except requests.exceptions.RequestException as e:
                page_metrics[path] = {
                    'name': name,
                    'status_code': 0,
                    'load_time': -1,
                    'response_size': 0,
                    'success': False,
                    'error': str(e)
                }
                print(f"   ❌ {name}: Connection failed - {e}")
        
        self.results['pages'] = page_metrics
        return page_metrics
    
    @log_calls()
    def analyze_api_performance(self):
        """API 성능 분석"""
        print("\n🔌 Analyzing API performance...")
        
        api_endpoints = [
            ('/api/health', 'Health Check'),
            ('/api/summary', 'Project Summary'),
            ('/api/chart/overview', 'Overview Chart'),
            ('/api/system/status', 'System Status'),
            ('/api/system/modules', 'Module Status')
        ]
        
        api_metrics = {}
        
        for path, name in api_endpoints:
            try:
                start_time = time.time()
                response = requests.get(f"{self.base_url}{path}", timeout=5)
                load_time = time.time() - start_time
                
                api_metrics[path] = {
                    'name': name,
                    'status_code': response.status_code,
                    'load_time': load_time,
                    'response_size': len(response.content),
                    'success': response.status_code == 200
                }
                
                status = "✅" if response.status_code == 200 else "❌"
                print(f"   {status} {name}: {load_time:.3f}s ({response.status_code})")
                
            except requests.exceptions.RequestException as e:
                api_metrics[path] = {
                    'name': name,
                    'status_code': 0,
                    'load_time': -1,
                    'response_size': 0,
                    'success': False,
                    'error': str(e)
                }
                print(f"   ❌ {name}: Connection failed - {e}")
        
        self.results['api'] = api_metrics
        return api_metrics
    
    @log_calls()
    def analyze_system_resources(self):
        """시스템 리소스 사용량 분석"""
        print("\n💻 Analyzing system resources...")
        
        # CPU 및 메모리 사용량
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Flask 프로세스 찾기
        flask_processes = []
        for proc in psutil.process_iter(['pid', 'name', 'memory_info', 'cpu_percent']):
            try:
                if 'python' in proc.info['name'].lower() and any('flask' in cmd.lower() for cmd in proc.cmdline()):
                    flask_processes.append({
                        'pid': proc.info['pid'],
                        'memory_mb': proc.info['memory_info'].rss / 1024 / 1024,
                        'cpu_percent': proc.info['cpu_percent']
                    })
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        
        resource_metrics = {
            'cpu_percent': cpu_percent,
            'memory_total_gb': memory.total / 1024 / 1024 / 1024,
            'memory_used_gb': memory.used / 1024 / 1024 / 1024,
            'memory_percent': memory.percent,
            'disk_total_gb': disk.total / 1024 / 1024 / 1024,
            'disk_used_gb': disk.used / 1024 / 1024 / 1024,
            'disk_percent': (disk.used / disk.total) * 100,
            'flask_processes': flask_processes
        }
        
        print(f"   📊 CPU Usage: {cpu_percent}%")
        print(f"   📊 Memory Usage: {memory.percent}% ({memory.used / 1024 / 1024 / 1024:.1f}GB / {memory.total / 1024 / 1024 / 1024:.1f}GB)")
        print(f"   📊 Disk Usage: {(disk.used / disk.total) * 100:.1f}%")
        print(f"   📊 Flask Processes: {len(flask_processes)}")
        
        for proc in flask_processes:
            print(f"      - PID {proc['pid']}: {proc['memory_mb']:.1f}MB RAM")
        
        self.results['resources'] = resource_metrics
        return resource_metrics
    
    @log_calls()
    def analyze_file_sizes(self):
        """파일 크기 분석"""
        print("\n📁 Analyzing file sizes...")
        
        directories_to_check = [
            '/root/FCA/frontend',
            '/root/FCA/web_app',
            '/root/FCA/core',
            '/root/FCA/logs'
        ]
        
        file_metrics = {}
        
        for directory in directories_to_check:
            if os.path.exists(directory):
                total_size = 0
                file_count = 0
                large_files = []
                
                for root, dirs, files in os.walk(directory):
                    for file in files:
                        file_path = os.path.join(root, file)
                        try:
                            size = os.path.getsize(file_path)
                            total_size += size
                            file_count += 1
                            
                            if size > 1024 * 1024:  # > 1MB
                                large_files.append({
                                    'path': file_path,
                                    'size_mb': size / 1024 / 1024
                                })
                        except OSError:
                            continue
                
                file_metrics[directory] = {
                    'total_size_mb': total_size / 1024 / 1024,
                    'file_count': file_count,
                    'large_files': large_files
                }
                
                print(f"   📊 {os.path.basename(directory)}: {total_size / 1024 / 1024:.1f}MB ({file_count} files)")
                for large_file in large_files:
                    print(f"      - {os.path.basename(large_file['path'])}: {large_file['size_mb']:.1f}MB")
        
        self.results['files'] = file_metrics
        return file_metrics
    
    @log_calls()
    def check_missing_templates(self):
        """누락된 템플릿 확인"""
        print("\n🔍 Checking for missing templates...")
        
        template_dir = Path("/root/FCA/web_app/templates")
        required_templates = [
            'dashboard.html',
            'fraud.html',
            'sentiment.html',
            'attrition.html',
            'datasets.html',
            'comparison.html',
            'visualizations.html',
            'xai.html',
            'error.html'
        ]
        
        template_status = {}
        
        for template in required_templates:
            template_path = template_dir / template
            exists = template_path.exists()
            template_status[template] = {
                'exists': exists,
                'path': str(template_path),
                'size': template_path.stat().st_size if exists else 0
            }
            
            status = "✅" if exists else "❌"
            print(f"   {status} {template}")
        
        self.results['templates'] = template_status
        return template_status
    
    def _extract_timestamp(self, log_line):
        """로그 라인에서 타임스탬프 추출"""
        import datetime
        try:
            timestamp_str = log_line.split(' | ')[0]
            return datetime.datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')
        except:
            return None
    
    @log_calls()
    def generate_report(self):
        """성능 분석 리포트 생성"""
        print("\n📋 Generating Performance Report...")
        
        report = {
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'analysis_results': self.results,
            'recommendations': self._generate_recommendations()
        }
        
        # JSON 리포트 저장
        import json
        report_file = Path("/root/FCA/performance_report.json")
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        print(f"   💾 Report saved to: {report_file}")
        
        return report
    
    def _generate_recommendations(self):
        """성능 개선 권장사항 생성"""
        recommendations = []
        
        # 시작 시간 분석
        if 'startup' in self.results:
            startup = self.results['startup']
            if startup.get('total_startup_time', 0) > 2:
                recommendations.append("앱 시작 시간이 느립니다. 모듈 lazy loading 고려")
        
        # 페이지 로딩 분석
        if 'pages' in self.results:
            failed_pages = [path for path, data in self.results['pages'].items() if not data.get('success')]
            if failed_pages:
                recommendations.append(f"페이지 로딩 실패: {', '.join(failed_pages)}")
        
        # 템플릿 확인
        if 'templates' in self.results:
            missing_templates = [name for name, data in self.results['templates'].items() if not data.get('exists')]
            if missing_templates:
                recommendations.append(f"누락된 템플릿: {', '.join(missing_templates)}")
        
        # 리소스 사용량
        if 'resources' in self.results:
            resources = self.results['resources']
            if resources.get('memory_percent', 0) > 80:
                recommendations.append("메모리 사용량이 높습니다")
            if resources.get('cpu_percent', 0) > 80:
                recommendations.append("CPU 사용량이 높습니다")
        
        return recommendations


def main():
    """메인 실행 함수"""
    print("🔍 FCA Performance Analysis")
    print("=" * 50)
    
    analyzer = PerformanceAnalyzer()
    
    # 분석 실행
    try:
        analyzer.analyze_startup_time()
        analyzer.analyze_system_resources()
        analyzer.analyze_file_sizes()
        analyzer.check_missing_templates()
        analyzer.analyze_page_load_times()
        analyzer.analyze_api_performance()
        
        # 리포트 생성
        report = analyzer.generate_report()
        
        print("\n" + "=" * 50)
        print("🎯 Performance Analysis Summary:")
        
        if report['recommendations']:
            print("⚠️  Issues Found:")
            for rec in report['recommendations']:
                print(f"   - {rec}")
        else:
            print("✅ No major performance issues detected")
        
        return True
        
    except Exception as e:
        logger.error(f"Performance analysis failed: {e}")
        print(f"❌ Analysis failed: {e}")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)