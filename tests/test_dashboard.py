#!/usr/bin/env python3
"""
FCA Static Dashboard Test Suite
==============================

Comprehensive testing for the static dashboard.
"""

import requests
import json
import time
import subprocess
import threading
from pathlib import Path
import sys

class DashboardTester:
    def __init__(self, base_url="http://localhost:8080"):
        self.base_url = base_url
        self.dashboard_dir = Path("/root/FCA/static_dashboard")
        self.test_results = []
        self.server_process = None
        
    def log_test(self, test_name, status, message="", details=None):
        """Log test result"""
        result = {
            "test": test_name,
            "status": status,
            "message": message,
            "details": details
        }
        self.test_results.append(result)
        
        status_emoji = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_emoji} {test_name}: {message}")
        
        if details and status == "FAIL":
            print(f"   Details: {details}")
    
    def start_test_server(self):
        """Start test server in background"""
        try:
            print("🚀 Starting test server...")
            
            # Start server process
            self.server_process = subprocess.Popen([
                sys.executable, "serve.py", "--port", "8080", "--no-browser"
            ], cwd=self.dashboard_dir, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            # Wait for server to start
            time.sleep(3)
            
            # Test if server is responding
            response = requests.get(self.base_url, timeout=5)
            if response.status_code == 200:
                print("✅ Test server started successfully")
                return True
            else:
                print(f"❌ Server returned status {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Failed to start test server: {e}")
            return False
    
    def stop_test_server(self):
        """Stop test server"""
        if self.server_process:
            self.server_process.terminate()
            self.server_process.wait()
            print("🛑 Test server stopped")
    
    def test_file_structure(self):
        """Test dashboard file structure"""
        print("\n📁 Testing file structure...")
        
        required_files = [
            "index.html",
            "serve.py",
            "assets/css/dashboard.css",
            "assets/js/dashboard.js", 
            "assets/js/charts.js",
            "data/summary.json",
            "data/fraud_data.json",
            "data/sentiment_data.json",
            "data/attrition_data.json",
            "data/charts.json",
            "data/datasets.json"
        ]
        
        for file_path in required_files:
            full_path = self.dashboard_dir / file_path
            if full_path.exists():
                self.log_test(f"File - {file_path}", "PASS", "Exists")
            else:
                self.log_test(f"File - {file_path}", "FAIL", "Missing")
    
    def test_html_validity(self):
        """Test HTML page validity"""
        print("\n📄 Testing HTML validity...")
        
        try:
            response = requests.get(self.base_url, timeout=10)
            
            if response.status_code == 200:
                content = response.text
                
                # Check HTML structure
                if "<!DOCTYPE html>" in content:
                    self.log_test("HTML - DOCTYPE", "PASS", "Valid DOCTYPE")
                else:
                    self.log_test("HTML - DOCTYPE", "FAIL", "Missing DOCTYPE")
                
                # Check meta tags
                if 'charset="UTF-8"' in content:
                    self.log_test("HTML - Charset", "PASS", "UTF-8 charset set")
                else:
                    self.log_test("HTML - Charset", "FAIL", "Missing charset")
                
                # Check viewport
                if "viewport" in content:
                    self.log_test("HTML - Viewport", "PASS", "Viewport meta tag found")
                else:
                    self.log_test("HTML - Viewport", "FAIL", "Missing viewport")
                
                # Check title
                if "<title>" in content:
                    self.log_test("HTML - Title", "PASS", "Title tag found")
                else:
                    self.log_test("HTML - Title", "FAIL", "Missing title")
                
                # Check for required elements
                required_elements = [
                    ("Navigation", "navbar"),
                    ("Dashboard Content", "dashboard-content"),
                    ("Summary Cards", "total-datasets"),
                    ("Chart Containers", "model-performance-chart"),
                    ("Bootstrap CSS", "bootstrap.min.css"),
                    ("Plotly JS", "plotly"),
                    ("Custom JS", "dashboard.js")
                ]
                
                for element_name, element_id in required_elements:
                    if element_id in content:
                        self.log_test(f"HTML - {element_name}", "PASS", "Found")
                    else:
                        self.log_test(f"HTML - {element_name}", "FAIL", "Not found")
            
            else:
                self.log_test("HTML - Response", "FAIL", f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("HTML - Validity", "FAIL", str(e))
    
    def test_data_files(self):
        """Test data file validity"""
        print("\n📊 Testing data files...")
        
        data_files = [
            ("Summary", "summary.json", ["system_status", "total_datasets"]),
            ("Fraud Data", "fraud_data.json", ["performance_metrics", "risk_distribution"]),
            ("Sentiment Data", "sentiment_data.json", ["sentiment_distribution", "model_performance"]),
            ("Attrition Data", "attrition_data.json", ["customer_segments", "dataset_info"]),
            ("Charts Data", "charts.json", ["model_comparison", "fraud_distribution"]),
            ("Datasets Info", "datasets.json", ["available_datasets", "dataset_statistics"])
        ]
        
        for data_name, file_name, required_keys in data_files:
            try:
                response = requests.get(f"{self.base_url}/data/{file_name}", timeout=5)
                
                if response.status_code == 200:
                    try:
                        data = response.json()
                        
                        # Check if it's valid JSON
                        self.log_test(f"Data - {data_name} JSON", "PASS", "Valid JSON")
                        
                        # Check required keys
                        missing_keys = [key for key in required_keys if key not in data]
                        if not missing_keys:
                            self.log_test(f"Data - {data_name} Structure", "PASS", "All required keys present")
                        else:
                            self.log_test(f"Data - {data_name} Structure", "FAIL", f"Missing keys: {missing_keys}")
                        
                        # Check data size
                        data_str = json.dumps(data)
                        if len(data_str) > 100:
                            self.log_test(f"Data - {data_name} Size", "PASS", f"{len(data_str)} bytes")
                        else:
                            self.log_test(f"Data - {data_name} Size", "WARN", "Data seems too small")
                        
                    except json.JSONDecodeError as e:
                        self.log_test(f"Data - {data_name} JSON", "FAIL", f"Invalid JSON: {str(e)}")
                
                else:
                    self.log_test(f"Data - {data_name} Access", "FAIL", f"HTTP {response.status_code}")
                    
            except Exception as e:
                self.log_test(f"Data - {data_name} Access", "FAIL", str(e))
    
    def test_css_assets(self):
        """Test CSS assets"""
        print("\n🎨 Testing CSS assets...")
        
        try:
            response = requests.get(f"{self.base_url}/assets/css/dashboard.css", timeout=5)
            
            if response.status_code == 200:
                css_content = response.text
                
                # Check CSS size
                if len(css_content) > 1000:
                    self.log_test("CSS - Size", "PASS", f"{len(css_content)} bytes")
                else:
                    self.log_test("CSS - Size", "WARN", "CSS file seems small")
                
                # Check for CSS variables
                if ":root" in css_content:
                    self.log_test("CSS - Variables", "PASS", "CSS variables found")
                else:
                    self.log_test("CSS - Variables", "WARN", "No CSS variables")
                
                # Check for responsive design
                if "@media" in css_content:
                    self.log_test("CSS - Responsive", "PASS", "Media queries found")
                else:
                    self.log_test("CSS - Responsive", "FAIL", "No media queries")
                
                # Check for dark theme support
                if "data-theme" in css_content:
                    self.log_test("CSS - Dark Theme", "PASS", "Dark theme support found")
                else:
                    self.log_test("CSS - Dark Theme", "WARN", "No dark theme support")
            
            else:
                self.log_test("CSS - Access", "FAIL", f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("CSS - Access", "FAIL", str(e))
    
    def test_js_assets(self):
        """Test JavaScript assets"""
        print("\n⚡ Testing JavaScript assets...")
        
        js_files = [
            ("Dashboard JS", "assets/js/dashboard.js", ["FCADashboard", "class"]),
            ("Charts JS", "assets/js/charts.js", ["FCACharts", "Plotly"])
        ]
        
        for js_name, js_path, required_content in js_files:
            try:
                response = requests.get(f"{self.base_url}/{js_path}", timeout=5)
                
                if response.status_code == 200:
                    js_content = response.text
                    
                    # Check JS size
                    if len(js_content) > 500:
                        self.log_test(f"JS - {js_name} Size", "PASS", f"{len(js_content)} bytes")
                    else:
                        self.log_test(f"JS - {js_name} Size", "WARN", "JS file seems small")
                    
                    # Check for required content
                    for content in required_content:
                        if content in js_content:
                            self.log_test(f"JS - {js_name} {content}", "PASS", "Found")
                        else:
                            self.log_test(f"JS - {js_name} {content}", "FAIL", "Not found")
                
                else:
                    self.log_test(f"JS - {js_name} Access", "FAIL", f"HTTP {response.status_code}")
                    
            except Exception as e:
                self.log_test(f"JS - {js_name} Access", "FAIL", str(e))
    
    def test_external_dependencies(self):
        """Test external CDN dependencies"""
        print("\n🌐 Testing external dependencies...")
        
        cdn_resources = [
            ("Bootstrap CSS", "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"),
            ("Font Awesome", "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"),
            ("Plotly JS", "https://cdn.plot.ly/plotly-2.25.2.min.js"),
            ("Bootstrap JS", "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js")
        ]
        
        for resource_name, url in cdn_resources:
            try:
                response = requests.head(url, timeout=10)
                if response.status_code == 200:
                    self.log_test(f"CDN - {resource_name}", "PASS", "Available")
                else:
                    self.log_test(f"CDN - {resource_name}", "FAIL", f"HTTP {response.status_code}")
            except Exception as e:
                self.log_test(f"CDN - {resource_name}", "WARN", f"Connection issue: {str(e)}")
    
    def generate_report(self):
        """Generate test report"""
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['status'] == 'PASS'])
        failed_tests = len([r for r in self.test_results if r['status'] == 'FAIL'])
        warned_tests = len([r for r in self.test_results if r['status'] == 'WARN'])
        
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        report = f"""
📊 FCA Static Dashboard Test Report
{'='*50}
📅 Test Time: {time.strftime('%Y-%m-%d %H:%M:%S')}
🌐 Base URL: {self.base_url}

📈 Summary:
  Total Tests: {total_tests}
  ✅ Passed: {passed_tests}
  ❌ Failed: {failed_tests}
  ⚠️  Warnings: {warned_tests}
  📊 Success Rate: {success_rate:.1f}%

🎯 Overall Status: {'🟢 HEALTHY' if success_rate >= 80 else '🟡 ISSUES' if success_rate >= 60 else '🔴 CRITICAL'}

{'='*50}
"""
        
        # Group results by category
        categories = {}
        for result in self.test_results:
            category = result['test'].split(' - ')[0] if ' - ' in result['test'] else 'General'
            if category not in categories:
                categories[category] = []
            categories[category].append(result)
        
        for category, results in categories.items():
            report += f"\n🔹 {category}:\n"
            for result in results:
                status_emoji = "✅" if result['status'] == "PASS" else "❌" if result['status'] == "FAIL" else "⚠️"
                report += f"  {status_emoji} {result['test']}: {result['message']}\n"
        
        report += f"\n{'='*50}\n"
        
        return report
    
    def run_all_tests(self):
        """Run all tests"""
        print("🧪 FCA Static Dashboard Test Suite")
        print("=" * 50)
        
        # Start test server
        if not self.start_test_server():
            print("❌ Cannot start test server, aborting tests")
            return False
        
        try:
            # Run all tests
            self.test_file_structure()
            self.test_html_validity()
            self.test_data_files()
            self.test_css_assets()
            self.test_js_assets()
            self.test_external_dependencies()
            
            # Generate and display report
            report = self.generate_report()
            print(report)
            
            # Save report
            with open('/root/FCA/static_dashboard/test_report.txt', 'w') as f:
                f.write(report)
            
            print("📁 Test report saved to: static_dashboard/test_report.txt")
            
            return True
            
        finally:
            # Stop test server
            self.stop_test_server()

def main():
    tester = DashboardTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 Dashboard testing completed!")
        print("🌍 To view dashboard manually: python static_dashboard/serve.py")
        return 0
    else:
        print("\n💥 Dashboard testing failed!")
        return 1

if __name__ == "__main__":
    exit(main())