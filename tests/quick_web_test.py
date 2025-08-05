#!/usr/bin/env python3
"""
FCA 대시보드 빠른 웹 테스트 (브라우저 없이)
"""

import requests
import json
import time
import sys
from pathlib import Path

class QuickWebTester:
    def __init__(self, base_url="http://localhost:8080"):
        self.base_url = base_url
        self.test_results = []
        
    def log_test(self, category, test_name, status, message=""):
        status_emoji = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_emoji} [{category}] {test_name}: {message}")
        self.test_results.append({
            "category": category,
            "test": test_name,
            "status": status,
            "message": message
        })
    
    def test_server_accessibility(self):
        """서버 접근성 테스트"""
        print("\n🌐 서버 접근성 테스트...")
        
        try:
            response = requests.get(self.base_url, timeout=10)
            if response.status_code == 200:
                self.log_test("SERVER", "HTTP Response", "PASS", f"Status {response.status_code}")
                
                # HTML 기본 구조 확인
                html_content = response.text
                if "<title>" in html_content and "FCA" in html_content:
                    self.log_test("SERVER", "HTML Content", "PASS", "Valid HTML with title")
                else:
                    self.log_test("SERVER", "HTML Content", "FAIL", "Invalid HTML structure")
                    
                # 필수 리소스 확인
                required_elements = [
                    "plotly",
                    "bootstrap", 
                    "dashboard.js",
                    "charts.js"
                ]
                
                for element in required_elements:
                    if element.lower() in html_content.lower():
                        self.log_test("SERVER", f"{element} Resource", "PASS", "Resource found in HTML")
                    else:
                        self.log_test("SERVER", f"{element} Resource", "WARN", "Resource not found")
                        
            else:
                self.log_test("SERVER", "HTTP Response", "FAIL", f"Status {response.status_code}")
                
        except Exception as e:
            self.log_test("SERVER", "Server Access", "FAIL", str(e))
    
    def test_static_assets(self):
        """정적 자산 테스트"""
        print("\n📁 정적 자산 테스트...")
        
        assets = [
            "assets/css/dashboard.css",
            "assets/js/dashboard.js",
            "assets/js/charts.js",
            "assets/js/modules/ChartManager.js",
            "assets/js/modules/ChartRenderer.js",
            "assets/js/modules/ChartMonitor.js",
            "assets/js/modules/StaticChartFallback.js"
        ]
        
        for asset in assets:
            try:
                response = requests.get(f"{self.base_url}/{asset}", timeout=5)
                if response.status_code == 200:
                    size_kb = len(response.content) / 1024
                    self.log_test("ASSETS", f"{asset}", "PASS", f"{size_kb:.1f}KB")
                else:
                    self.log_test("ASSETS", f"{asset}", "FAIL", f"Status {response.status_code}")
            except Exception as e:
                self.log_test("ASSETS", f"{asset}", "FAIL", str(e))
    
    def test_data_files(self):
        """데이터 파일 테스트"""
        print("\n📊 데이터 파일 테스트...")
        
        data_files = [
            "summary.json",
            "fraud_data.json", 
            "sentiment_data.json",
            "attrition_data.json",
            "charts.json",
            "datasets.json",
            "xai_data.json"
        ]
        
        for data_file in data_files:
            try:
                response = requests.get(f"{self.base_url}/data/{data_file}", timeout=5)
                if response.status_code == 200:
                    try:
                        data = response.json()
                        size_kb = len(response.content) / 1024
                        
                        # 데이터 구조 검증
                        if isinstance(data, dict) and len(data) > 0:
                            self.log_test("DATA", f"{data_file}", "PASS", f"Valid JSON {size_kb:.1f}KB")
                        else:
                            self.log_test("DATA", f"{data_file}", "WARN", "Empty or invalid data structure")
                            
                    except json.JSONDecodeError:
                        self.log_test("DATA", f"{data_file}", "FAIL", "Invalid JSON format")
                else:
                    self.log_test("DATA", f"{data_file}", "FAIL", f"Status {response.status_code}")
            except Exception as e:
                self.log_test("DATA", f"{data_file}", "FAIL", str(e))
    
    def test_api_endpoints(self):
        """API 엔드포인트 테스트"""
        print("\n🔌 API 엔드포인트 테스트...")
        
        # Bundle API 테스트
        try:
            response = requests.get(f"{self.base_url}/data/bundle.json", timeout=5)
            if response.status_code == 200:
                try:
                    bundle_data = response.json()
                    size_kb = len(response.content) / 1024
                    
                    # Bundle 구조 확인
                    expected_keys = ["summary", "fraud_data", "sentiment_data", "attrition_data", "charts", "datasets"]
                    found_keys = [key for key in expected_keys if key in bundle_data]
                    
                    if len(found_keys) >= 4:
                        self.log_test("API", "Data Bundle", "PASS", f"{len(found_keys)}/{len(expected_keys)} keys, {size_kb:.1f}KB")
                    else:
                        self.log_test("API", "Data Bundle", "WARN", f"Only {len(found_keys)}/{len(expected_keys)} keys found")
                        
                except json.JSONDecodeError:
                    self.log_test("API", "Data Bundle", "FAIL", "Invalid JSON in bundle")
            else:
                self.log_test("API", "Data Bundle", "FAIL", f"Bundle not available (HTTP {response.status_code})")
        except Exception as e:
            self.log_test("API", "Data Bundle", "FAIL", str(e))
    
    def test_chart_assets(self):
        """차트 관련 자산 테스트"""
        print("\n📈 차트 자산 테스트...")
        
        # 정적 차트 이미지 확인
        chart_images = [
            "assets/images/charts/model_comparison.png",
            "assets/images/charts/fraud_distribution.png",
            "assets/images/charts/sentiment_distribution.png",
            "assets/images/charts/customer_segments.png"
        ]
        
        found_images = 0
        for image in chart_images:
            try:
                response = requests.get(f"{self.base_url}/{image}", timeout=5)
                if response.status_code == 200:
                    size_kb = len(response.content) / 1024
                    if size_kb > 1:  # 최소 1KB 이상
                        self.log_test("CHARTS", f"{image.split('/')[-1]}", "PASS", f"{size_kb:.1f}KB")
                        found_images += 1
                    else:
                        self.log_test("CHARTS", f"{image.split('/')[-1]}", "WARN", "Image too small")
                else:
                    self.log_test("CHARTS", f"{image.split('/')[-1]}", "FAIL", f"Status {response.status_code}")
            except Exception as e:
                self.log_test("CHARTS", f"{image.split('/')[-1]}", "FAIL", str(e))
        
        # 차트 모듈 파일 확인
        chart_modules = [
            "assets/js/modules/PieCharts.js",
            "assets/js/modules/BarCharts.js",
            "assets/js/modules/XAICharts.js"
        ]
        
        for module in chart_modules:
            try:
                response = requests.get(f"{self.base_url}/{module}", timeout=5)
                if response.status_code == 200:
                    content = response.text
                    if "class" in content and "Chart" in content:
                        self.log_test("CHARTS", f"{module.split('/')[-1]}", "PASS", "Valid chart module")
                    else:
                        self.log_test("CHARTS", f"{module.split('/')[-1]}", "WARN", "Module structure unclear")
                else:
                    self.log_test("CHARTS", f"{module.split('/')[-1]}", "FAIL", f"Status {response.status_code}")
            except Exception as e:
                self.log_test("CHARTS", f"{module.split('/')[-1]}", "FAIL", str(e))
    
    def test_performance(self):
        """성능 테스트"""
        print("\n⚡ 성능 테스트...")
        
        # 페이지 로딩 시간
        start_time = time.time()
        try:
            response = requests.get(self.base_url, timeout=10)
            load_time = time.time() - start_time
            
            if load_time < 2:
                self.log_test("PERFORMANCE", "Page Load", "PASS", f"{load_time:.2f}s")
            elif load_time < 5:
                self.log_test("PERFORMANCE", "Page Load", "WARN", f"{load_time:.2f}s (slow)")
            else:
                self.log_test("PERFORMANCE", "Page Load", "FAIL", f"{load_time:.2f}s (too slow)")
                
        except Exception as e:
            self.log_test("PERFORMANCE", "Page Load", "FAIL", str(e))
        
        # 데이터 로딩 시간
        start_time = time.time()
        try:
            response = requests.get(f"{self.base_url}/data/bundle.json", timeout=10)
            data_load_time = time.time() - start_time
            
            if data_load_time < 1:
                self.log_test("PERFORMANCE", "Data Load", "PASS", f"{data_load_time:.2f}s")
            elif data_load_time < 3:
                self.log_test("PERFORMANCE", "Data Load", "WARN", f"{data_load_time:.2f}s")
            else:
                self.log_test("PERFORMANCE", "Data Load", "FAIL", f"{data_load_time:.2f}s")
                
        except Exception as e:
            self.log_test("PERFORMANCE", "Data Load", "FAIL", str(e))
    
    def generate_report(self):
        """테스트 보고서 생성"""
        categories = {}
        for result in self.test_results:
            category = result['category']
            if category not in categories:
                categories[category] = {'PASS': 0, 'FAIL': 0, 'WARN': 0}
            categories[category][result['status']] += 1
        
        total_tests = len(self.test_results)
        total_pass = sum(1 for r in self.test_results if r['status'] == 'PASS')
        total_fail = sum(1 for r in self.test_results if r['status'] == 'FAIL')
        total_warn = sum(1 for r in self.test_results if r['status'] == 'WARN')
        
        success_rate = (total_pass / total_tests * 100) if total_tests > 0 else 0
        
        report = f"""
🧪 FCA 대시보드 빠른 웹 테스트 보고서
{'='*50}
📅 테스트 시간: {time.strftime('%Y-%m-%d %H:%M:%S')}
🌐 테스트 URL: {self.base_url}

📊 전체 요약:
  총 테스트: {total_tests}
  ✅ 성공: {total_pass}
  ❌ 실패: {total_fail}
  ⚠️  경고: {total_warn}
  📈 성공률: {success_rate:.1f}%

🎯 전체 상태: {'🟢 우수' if success_rate >= 90 else '🟡 양호' if success_rate >= 75 else '🔴 개선필요'}

{'='*50}
📋 카테고리별 결과:
"""
        
        for category, stats in categories.items():
            total_cat = stats['PASS'] + stats['FAIL'] + stats['WARN']
            cat_success = (stats['PASS'] / total_cat * 100) if total_cat > 0 else 0
            
            report += f"""
🔹 {category} ({total_cat}개 테스트):
   ✅ 성공: {stats['PASS']} | ❌ 실패: {stats['FAIL']} | ⚠️ 경고: {stats['WARN']}
   📊 성공률: {cat_success:.1f}%
"""
        
        return report, success_rate
    
    def run_quick_test(self):
        """빠른 테스트 실행"""
        print("🚀 FCA 대시보드 빠른 웹 테스트 시작...")
        print("=" * 50)
        
        try:
            self.test_server_accessibility()
            self.test_static_assets()
            self.test_data_files()
            self.test_api_endpoints()
            self.test_chart_assets()
            self.test_performance()
            
            report, success_rate = self.generate_report()
            print(report)
            
            # 보고서 저장
            with open('/root/FCA/static_dashboard/quick_test_report.txt', 'w', encoding='utf-8') as f:
                f.write(report)
            
            print("📁 테스트 보고서 저장: static_dashboard/quick_test_report.txt")
            
            return success_rate >= 75
            
        except Exception as e:
            print(f"❌ 테스트 중 오류 발생: {e}")
            return False

def main():
    tester = QuickWebTester()
    success = tester.run_quick_test()
    
    if success:
        print("\n🎉 빠른 웹 테스트가 성공적으로 완료되었습니다!")
        return 0
    else:
        print("\n💥 빠른 웹 테스트에서 문제가 발견되었습니다.")
        return 1

if __name__ == "__main__":
    exit(main())