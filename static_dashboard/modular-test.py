#!/usr/bin/env python3
"""
Modular FCA Dashboard Test Suite
===============================

Tests for the modular architecture implementation
"""

import requests
import json
import time
import subprocess
import sys
from pathlib import Path

class ModularDashboardTester:
    def __init__(self, base_url="http://localhost:8081"):
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
        """Start test server"""
        try:
            print("🚀 Starting modular test server...")
            
            # Create simple server script for modular version
            server_script = self.dashboard_dir / "serve-modular.py"
            with open(server_script, 'w') as f:
                f.write("""#!/usr/bin/env python3
import http.server
import socketserver
import os
import sys

class ModularHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def guess_type(self, path):
        mimetype, encoding = super().guess_type(path)
        if path.endswith('.js'):
            return 'application/javascript', encoding
        elif path.endswith('.css'):
            return 'text/css', encoding
        return mimetype, encoding
    
    def do_GET(self):
        if self.path == '/' or self.path == '/index.html':
            self.path = '/index-modular.html'
        return super().do_GET()

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8081
    os.chdir('/root/FCA/static_dashboard')
    
    with socketserver.TCPServer(("", port), ModularHTTPRequestHandler) as httpd:
        print(f"Serving modular dashboard at http://localhost:{port}")
        httpd.serve_forever()
""")
            
            server_script.chmod(0o755)
            
            # Start server process
            self.server_process = subprocess.Popen([
                sys.executable, str(server_script), "8081"
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            # Wait for server to start
            time.sleep(3)
            
            # Test if server is responding
            response = requests.get(self.base_url, timeout=5)
            if response.status_code == 200:
                self.log_test("Modular Server", "PASS", "Server started successfully")
                return True
            else:
                self.log_test("Modular Server", "FAIL", f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Modular Server", "FAIL", str(e))
            return False
    
    def stop_test_server(self):
        """Stop test server"""
        if self.server_process:
            self.server_process.terminate()
            self.server_process.wait()
            print("🛑 Modular test server stopped")
    
    def test_modular_structure(self):
        """Test modular file structure"""
        print("\n📁 Testing modular structure...")
        
        required_modules = [
            "assets/js/modules/data-loader.js",
            "assets/js/modules/navigation.js", 
            "assets/js/modules/theme-manager.js",
            "assets/js/modules/base-chart.js",
            "assets/js/modules/performance-charts.js",
            "assets/js/modules/business-charts.js",
            "assets/js/modules/dashboard-core.js",
            "assets/js/utils/ui-utils.js",
            "assets/js/app.js",
            "assets/css/modules/variables.css",
            "assets/css/modules/components.css",
            "assets/css/modules/layout.css",
            "assets/css/dashboard-modular.css",
            "index-modular.html"
        ]
        
        for module_path in required_modules:
            full_path = self.dashboard_dir / module_path
            if full_path.exists():
                self.log_test(f"Module - {module_path}", "PASS", "Exists")
            else:
                self.log_test(f"Module - {module_path}", "FAIL", "Missing")
    
    def test_modular_html(self):
        """Test modular HTML structure"""
        print("\n📄 Testing modular HTML...")
        
        try:
            response = requests.get(self.base_url, timeout=10)
            
            if response.status_code == 200:
                content = response.text
                
                # Check for modular CSS
                if 'dashboard-modular.css' in content:
                    self.log_test("Modular CSS", "PASS", "Modular CSS file referenced")
                else:
                    self.log_test("Modular CSS", "FAIL", "Modular CSS not found")
                
                # Check for module script
                if 'type="module"' in content:
                    self.log_test("ES6 Modules", "PASS", "ES6 module support detected")
                else:
                    self.log_test("ES6 Modules", "FAIL", "ES6 modules not found")
                
                # Check for app.js entry point
                if 'app.js' in content:
                    self.log_test("App Entry Point", "PASS", "App.js entry point found")
                else:
                    self.log_test("App Entry Point", "FAIL", "App.js not found")
                
                # Check for improved loading indicator
                if 'loading-submessage' in content:
                    self.log_test("Enhanced Loading", "PASS", "Enhanced loading UI found")
                else:
                    self.log_test("Enhanced Loading", "WARN", "Basic loading UI")
                    
            else:
                self.log_test("Modular HTML", "FAIL", f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Modular HTML", "FAIL", str(e))
    
    def test_module_accessibility(self):
        """Test module file accessibility"""
        print("\n🌐 Testing module accessibility...")
        
        module_files = [
            "assets/js/modules/data-loader.js",
            "assets/js/modules/dashboard-core.js",
            "assets/js/app.js",
            "assets/css/dashboard-modular.css"
        ]
        
        for module_file in module_files:
            try:
                response = requests.get(f"{self.base_url}/{module_file}", timeout=5)
                
                if response.status_code == 200:
                    # Check content type for JS files
                    if module_file.endswith('.js'):
                        content_type = response.headers.get('content-type', '')
                        if 'javascript' in content_type or 'text/plain' in content_type:
                            self.log_test(f"Module Access - {module_file}", "PASS", "Accessible with correct MIME type")
                        else:
                            self.log_test(f"Module Access - {module_file}", "WARN", f"MIME type: {content_type}")
                    else:
                        self.log_test(f"Module Access - {module_file}", "PASS", "Accessible")
                else:
                    self.log_test(f"Module Access - {module_file}", "FAIL", f"HTTP {response.status_code}")
                    
            except Exception as e:
                self.log_test(f"Module Access - {module_file}", "FAIL", str(e))
    
    def test_css_modular_imports(self):
        """Test CSS modular imports"""
        print("\n🎨 Testing CSS modular imports...")
        
        try:
            response = requests.get(f"{self.base_url}/assets/css/dashboard-modular.css", timeout=5)
            
            if response.status_code == 200:
                css_content = response.text
                
                # Check for CSS imports
                required_imports = [
                    '@import url(\'./modules/variables.css\')',
                    '@import url(\'./modules/layout.css\')',
                    '@import url(\'./modules/components.css\')'
                ]
                
                for import_statement in required_imports:
                    if import_statement in css_content:
                        module_name = import_statement.split('/')[-1].replace('.css\')', '')
                        self.log_test(f"CSS Import - {module_name}", "PASS", "Import found")
                    else:
                        self.log_test(f"CSS Import - {import_statement}", "FAIL", "Import missing")
                
                # Check for CSS variables usage
                if '--color-primary' in css_content:
                    self.log_test("CSS Variables", "PASS", "CSS custom properties found")
                else:
                    self.log_test("CSS Variables", "FAIL", "CSS variables not found")
                    
            else:
                self.log_test("CSS Modular", "FAIL", f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("CSS Modular", "FAIL", str(e))
    
    def test_javascript_modules(self):
        """Test JavaScript ES6 modules"""
        print("\n⚡ Testing JavaScript modules...")
        
        try:
            # Test main app.js
            response = requests.get(f"{self.base_url}/assets/js/app.js", timeout=5)
            
            if response.status_code == 200:
                js_content = response.text
                
                # Check for ES6 imports
                if 'import {' in js_content and 'from \'./' in js_content:
                    self.log_test("ES6 Imports", "PASS", "ES6 import statements found")
                else:
                    self.log_test("ES6 Imports", "FAIL", "ES6 imports not found")
                
                # Check for FCADashboard import
                if 'FCADashboard' in js_content:
                    self.log_test("Dashboard Import", "PASS", "Dashboard core imported")
                else:
                    self.log_test("Dashboard Import", "FAIL", "Dashboard core not imported")
                
                # Check for error handling
                if 'try {' in js_content and 'catch' in js_content:
                    self.log_test("Error Handling", "PASS", "Error handling implemented")
                else:
                    self.log_test("Error Handling", "WARN", "Limited error handling")
                    
            else:
                self.log_test("JavaScript Modules", "FAIL", f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("JavaScript Modules", "FAIL", str(e))
    
    def test_performance_improvements(self):
        """Test performance improvements"""
        print("\n⚡ Testing performance improvements...")
        
        try:
            start_time = time.time()
            response = requests.get(self.base_url, timeout=10)
            load_time = time.time() - start_time
            
            if response.status_code == 200:
                content = response.text
                
                # Check for preload hints
                if 'rel="preload"' in content:
                    self.log_test("Resource Preloading", "PASS", "Preload hints found")
                else:
                    self.log_test("Resource Preloading", "WARN", "No preload hints")
                
                # Check for preconnect
                if 'rel="preconnect"' in content:
                    self.log_test("DNS Preconnect", "PASS", "Preconnect hints found")
                else:
                    self.log_test("DNS Preconnect", "WARN", "No preconnect hints")
                
                # Check load time
                if load_time < 2.0:
                    self.log_test("Load Time", "PASS", f"{load_time:.2f} seconds")
                elif load_time < 5.0:
                    self.log_test("Load Time", "WARN", f"{load_time:.2f} seconds (acceptable)")
                else:
                    self.log_test("Load Time", "FAIL", f"{load_time:.2f} seconds (too slow)")
                
                # Check for PWA features
                if 'serviceWorker' in content:
                    self.log_test("PWA Features", "PASS", "Service Worker registration found")
                else:
                    self.log_test("PWA Features", "WARN", "No PWA features")
                    
            else:
                self.log_test("Performance Test", "FAIL", f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Performance Test", "FAIL", str(e))
    
    def test_code_size_reduction(self):
        """Test code size after modularization"""
        print("\n📏 Testing code size reduction...")
        
        try:
            # Compare original vs modular
            original_files = [
                self.dashboard_dir / "assets/js/dashboard.js",
                self.dashboard_dir / "assets/js/charts.js", 
                self.dashboard_dir / "assets/css/dashboard.css",
                self.dashboard_dir / "index.html"
            ]
            
            modular_files = [
                self.dashboard_dir / "assets/js/app.js",
                self.dashboard_dir / "assets/css/dashboard-modular.css",
                self.dashboard_dir / "index-modular.html"
            ]
            
            original_size = 0
            for file_path in original_files:
                if file_path.exists():
                    original_size += file_path.stat().st_size
            
            modular_size = 0
            for file_path in modular_files:
                if file_path.exists():
                    modular_size += file_path.stat().st_size
            
            # Add module files
            module_dirs = [
                self.dashboard_dir / "assets/js/modules",
                self.dashboard_dir / "assets/js/utils",
                self.dashboard_dir / "assets/css/modules"
            ]
            
            for module_dir in module_dirs:
                if module_dir.exists():
                    for module_file in module_dir.rglob("*.js"):
                        modular_size += module_file.stat().st_size
                    for module_file in module_dir.rglob("*.css"):
                        modular_size += module_file.stat().st_size
            
            if original_size > 0:
                size_change = ((modular_size - original_size) / original_size) * 100
                
                self.log_test("Code Organization", "PASS", 
                    f"Original: {original_size//1024}KB, Modular: {modular_size//1024}KB ({size_change:+.1f}%)")
                
                # Test maintainability (number of files)
                module_count = sum(1 for d in module_dirs for f in d.rglob("*.js") if d.exists())
                if module_count >= 5:
                    self.log_test("Maintainability", "PASS", f"{module_count} modules created")
                else:
                    self.log_test("Maintainability", "WARN", f"Only {module_count} modules")
            else:
                self.log_test("Code Size", "WARN", "Cannot compare - original files missing")
                
        except Exception as e:
            self.log_test("Code Size", "FAIL", str(e))
    
    def generate_report(self):
        """Generate test report"""
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['status'] == 'PASS'])
        failed_tests = len([r for r in self.test_results if r['status'] == 'FAIL'])
        warned_tests = len([r for r in self.test_results if r['status'] == 'WARN'])
        
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        report = f"""
🧪 FCA Dashboard Modularization Test Report
============================================
📅 Test Time: {time.strftime('%Y-%m-%d %H:%M:%S')}
🌐 Base URL: {self.base_url}

📈 Summary:
  Total Tests: {total_tests}
  ✅ Passed: {passed_tests}
  ❌ Failed: {failed_tests}
  ⚠️  Warnings: {warned_tests}
  📊 Success Rate: {success_rate:.1f}%

🎯 Overall Status: {'🟢 EXCELLENT' if success_rate >= 90 else '🟡 GOOD' if success_rate >= 75 else '🔴 NEEDS WORK'}

============================================
        """
        
        # Group results by category
        categories = {}
        for result in self.test_results:
            category = result['test'].split(' - ')[0].split(' ')[0] if ' - ' in result['test'] or ' ' in result['test'] else 'General'
            if category not in categories:
                categories[category] = []
            categories[category].append(result)
        
        for category, results in categories.items():
            report += f"\n🔹 {category}:\n"
            for result in results:
                status_emoji = "✅" if result['status'] == "PASS" else "❌" if result['status'] == "FAIL" else "⚠️"
                report += f"  {status_emoji} {result['test']}: {result['message']}\n"
        
        report += f"\n{'='*44}\n"
        
        return report
    
    def run_all_tests(self):
        """Run all modular tests"""
        print("🧪 FCA Dashboard Modularization Test Suite")
        print("=" * 50)
        
        # Start test server
        if not self.start_test_server():
            print("❌ Cannot start modular test server, aborting tests")
            return False
        
        try:
            # Run all tests
            self.test_modular_structure()
            self.test_modular_html()
            self.test_module_accessibility()
            self.test_css_modular_imports()
            self.test_javascript_modules()
            self.test_performance_improvements()
            self.test_code_size_reduction()
            
            # Generate and display report
            report = self.generate_report()
            print(report)
            
            # Save report
            with open('/root/FCA/static_dashboard/modular-test-report.txt', 'w') as f:
                f.write(report)
            
            print("📁 Modular test report saved to: modular-test-report.txt")
            
            return True
            
        finally:
            # Stop test server
            self.stop_test_server()

def main():
    tester = ModularDashboardTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 Modular dashboard testing completed!")
        print("🔧 Modular version available at: index-modular.html")
        return 0
    else:
        print("\n💥 Modular dashboard testing failed!")
        return 1

if __name__ == "__main__":
    exit(main())