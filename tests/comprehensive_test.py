#!/usr/bin/env python3
"""
FCA 대시보드 종합 기능 테스트
============================

전체 시스템의 모든 기능을 테스트합니다.
"""

import requests
import json
import time
import subprocess
import threading
import sys
import os
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

class ComprehensiveTester:
    def __init__(self, base_url="http://localhost:8080"):
        self.base_url = base_url
        self.dashboard_dir = Path("/root/FCA/static_dashboard")
        self.test_results = []
        self.server_process = None
        self.driver = None
        
        print("🧪 FCA 대시보드 종합 기능 테스트 시작")
        print("=" * 60)
    
    def log_test(self, category, test_name, status, message="", details=None):
        """테스트 결과 기록"""
        result = {
            "category": category,
            "test": test_name,
            "status": status,
            "message": message,
            "details": details
        }
        self.test_results.append(result)
        
        status_emoji = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_emoji} [{category}] {test_name}: {message}")
        
        if details and status == "FAIL":
            print(f"   Details: {details}")
    
    def start_server(self):
        """테스트 서버 시작"""
        try:
            print("🚀 테스트 서버 시작 중...")
            
            self.server_process = subprocess.Popen([
                sys.executable, "serve.py", "--port", "8080", "--no-browser"
            ], cwd=self.dashboard_dir, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            # 서버 시작 대기
            time.sleep(5)
            
            # 서버 응답 확인
            response = requests.get(self.base_url, timeout=10)
            if response.status_code == 200:
                self.log_test("SERVER", "Server Startup", "PASS", "Server running on port 8080")
                return True
            else:
                self.log_test("SERVER", "Server Startup", "FAIL", f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("SERVER", "Server Startup", "FAIL", str(e))
            return False
    
    def setup_browser(self):
        """브라우저 설정"""
        try:
            print("🌐 브라우저 초기화 중...")
            
            chrome_options = Options()
            chrome_options.add_argument("--headless")  # 헤드리스 모드
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--window-size=1920,1080")
            chrome_options.binary_location = "/usr/bin/chromium-browser"
            
            from selenium.webdriver.chrome.service import Service
            service = Service("/usr/bin/chromedriver")
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            self.driver.implicitly_wait(10)
            
            self.log_test("BROWSER", "Browser Setup", "PASS", "Chrome headless mode")
            return True
            
        except Exception as e:
            self.log_test("BROWSER", "Browser Setup", "FAIL", str(e))
            return False
    
    def test_page_loading(self):
        """페이지 로딩 테스트"""
        print("\n📄 페이지 로딩 테스트...")
        
        try:
            start_time = time.time()
            self.driver.get(self.base_url)
            
            # 페이지 타이틀 확인
            WebDriverWait(self.driver, 10).until(
                lambda driver: driver.title != ""
            )
            
            load_time = time.time() - start_time
            
            if "FCA Analysis Dashboard" in self.driver.title:
                self.log_test("LOADING", "Page Title", "PASS", f"Title loaded ({load_time:.2f}s)")
            else:
                self.log_test("LOADING", "Page Title", "FAIL", f"Wrong title: {self.driver.title}")
            
            # 메인 컨테이너 로딩 확인
            try:
                main_content = WebDriverWait(self.driver, 15).until(
                    EC.presence_of_element_located((By.ID, "dashboard-content"))
                )
                self.log_test("LOADING", "Main Content", "PASS", "Dashboard content loaded")
            except TimeoutException:
                self.log_test("LOADING", "Main Content", "FAIL", "Dashboard content not found")
            
            # 로딩 인디케이터 사라짐 확인
            try:
                WebDriverWait(self.driver, 20).until(
                    EC.invisibility_of_element_located((By.ID, "loading-indicator"))
                )
                self.log_test("LOADING", "Loading Indicator", "PASS", "Loading indicator disappeared")
            except TimeoutException:
                self.log_test("LOADING", "Loading Indicator", "WARN", "Loading indicator still visible")
            
        except Exception as e:
            self.log_test("LOADING", "Page Loading", "FAIL", str(e))
    
    def test_navigation(self):
        """네비게이션 테스트"""
        print("\n🧭 네비게이션 테스트...")
        
        pages = [
            ("dashboard", "Overview"),
            ("fraud", "Fraud Detection"),
            ("sentiment", "Sentiment Analysis"),
            ("attrition", "Customer Attrition"),
            ("datasets", "Datasets")
        ]
        
        for page_id, page_name in pages:
            try:
                # 네비게이션 링크 클릭
                nav_link = WebDriverWait(self.driver, 10).until(
                    EC.element_to_be_clickable((By.CSS_SELECTOR, f'[data-page="{page_id}"]'))
                )
                nav_link.click()
                
                # 페이지 전환 대기
                time.sleep(2)
                
                # 페이지 타이틀 확인
                try:
                    page_title = self.driver.find_element(By.ID, "page-title-text")
                    if page_name.lower() in page_title.text.lower():
                        self.log_test("NAVIGATION", f"{page_name} Page", "PASS", "Page title updated")
                    else:
                        self.log_test("NAVIGATION", f"{page_name} Page", "FAIL", f"Wrong title: {page_title.text}")
                except NoSuchElementException:
                    self.log_test("NAVIGATION", f"{page_name} Page", "FAIL", "Page title not found")
                
                # 페이지 콘텐츠 확인
                try:
                    page_content = self.driver.find_element(By.ID, f"{page_id}-page")
                    if page_content.is_displayed():
                        self.log_test("NAVIGATION", f"{page_name} Content", "PASS", "Page content visible")
                    else:
                        self.log_test("NAVIGATION", f"{page_name} Content", "FAIL", "Page content not visible")
                except NoSuchElementException:
                    self.log_test("NAVIGATION", f"{page_name} Content", "FAIL", "Page content not found")
                
            except Exception as e:
                self.log_test("NAVIGATION", f"{page_name} Navigation", "FAIL", str(e))
    
    def test_dashboard_elements(self):
        """대시보드 요소 테스트"""
        print("\n📊 대시보드 요소 테스트...")
        
        # Overview 페이지로 이동
        try:
            overview_link = self.driver.find_element(By.CSS_SELECTOR, '[data-page="dashboard"]')
            overview_link.click()
            time.sleep(3)
        except:
            pass
        
        # 서머리 카드 테스트
        summary_cards = [
            ("total-datasets", "Total Datasets"),
            ("models-trained", "Models Trained"),
            ("fraud-detection-rate", "Fraud Detection Rate"),
            ("system-status", "System Status")
        ]
        
        for card_id, card_name in summary_cards:
            try:
                card_element = self.driver.find_element(By.ID, card_id)
                card_text = card_element.text.strip()
                
                if card_text and card_text != "Loading..." and "spinner" not in card_text:
                    self.log_test("DASHBOARD", f"{card_name} Card", "PASS", f"Value: {card_text}")
                else:
                    self.log_test("DASHBOARD", f"{card_name} Card", "FAIL", "No data or still loading")
                    
            except NoSuchElementException:
                self.log_test("DASHBOARD", f"{card_name} Card", "FAIL", "Card not found")
        
        # 차트 컨테이너 테스트
        chart_containers = [
            ("model-performance-chart", "Model Performance Chart"),
            ("fraud-risk-chart", "Fraud Risk Chart"),
            ("sentiment-distribution-chart", "Sentiment Distribution Chart"),
            ("customer-segments-chart", "Customer Segments Chart")
        ]
        
        for chart_id, chart_name in chart_containers:
            try:
                chart_element = self.driver.find_element(By.ID, chart_id)
                
                # Plotly 차트가 렌더링되었는지 확인
                plotly_elements = chart_element.find_elements(By.CSS_SELECTOR, ".plotly-graph-div")
                
                if plotly_elements:
                    self.log_test("DASHBOARD", f"{chart_name}", "PASS", "Chart container has Plotly elements")
                else:
                    # 에러 메시지나 로딩 상태 확인
                    chart_html = chart_element.get_attribute("innerHTML")
                    if "chart-loading" in chart_html:
                        self.log_test("DASHBOARD", f"{chart_name}", "WARN", "Chart still loading")
                    elif "error" in chart_html.lower():
                        self.log_test("DASHBOARD", f"{chart_name}", "FAIL", "Chart error detected")
                    else:
                        self.log_test("DASHBOARD", f"{chart_name}", "WARN", "Chart status unclear")
                        
            except NoSuchElementException:
                self.log_test("DASHBOARD", f"{chart_name}", "FAIL", "Chart container not found")
    
    def test_data_loading(self):
        """데이터 로딩 테스트"""
        print("\n📊 데이터 로딩 테스트...")
        
        data_files = [
            "summary.json",
            "fraud_data.json",
            "sentiment_data.json",
            "attrition_data.json",
            "charts.json",
            "datasets.json"
        ]
        
        for data_file in data_files:
            try:
                response = requests.get(f"{self.base_url}/data/{data_file}", timeout=5)
                
                if response.status_code == 200:
                    try:
                        data = response.json()
                        data_size = len(json.dumps(data))
                        
                        if data_size > 100:
                            self.log_test("DATA", f"{data_file}", "PASS", f"Valid JSON ({data_size} bytes)")
                        else:
                            self.log_test("DATA", f"{data_file}", "WARN", "Data seems small")
                            
                    except json.JSONDecodeError:
                        self.log_test("DATA", f"{data_file}", "FAIL", "Invalid JSON")
                else:
                    self.log_test("DATA", f"{data_file}", "FAIL", f"HTTP {response.status_code}")
                    
            except Exception as e:
                self.log_test("DATA", f"{data_file}", "FAIL", str(e))
    
    def test_responsive_design(self):
        """반응형 디자인 테스트"""
        print("\n📱 반응형 디자인 테스트...")
        
        screen_sizes = [
            (1920, 1080, "Desktop"),
            (1024, 768, "Tablet"),
            (375, 667, "Mobile")
        ]
        
        for width, height, device in screen_sizes:
            try:
                self.driver.set_window_size(width, height)
                time.sleep(2)
                
                # 네비게이션 바 확인
                navbar = self.driver.find_element(By.CSS_SELECTOR, ".navbar")
                if navbar.is_displayed():
                    self.log_test("RESPONSIVE", f"{device} Navbar", "PASS", f"Navbar visible at {width}x{height}")
                else:
                    self.log_test("RESPONSIVE", f"{device} Navbar", "FAIL", "Navbar not visible")
                
                # 메인 콘텐츠 확인
                main_content = self.driver.find_element(By.ID, "dashboard-content")
                if main_content.is_displayed():
                    self.log_test("RESPONSIVE", f"{device} Content", "PASS", "Main content visible")
                else:
                    self.log_test("RESPONSIVE", f"{device} Content", "FAIL", "Main content not visible")
                
            except Exception as e:
                self.log_test("RESPONSIVE", f"{device} Test", "FAIL", str(e))
        
        # 원래 크기로 복원
        self.driver.set_window_size(1920, 1080)
    
    def test_theme_functionality(self):
        """테마 기능 테스트"""
        print("\n🎨 테마 기능 테스트...")
        
        try:
            # 설정 드롭다운 열기
            settings_dropdown = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, ".dropdown-toggle"))
            )
            settings_dropdown.click()
            
            time.sleep(1)
            
            # 테마 토글 버튼 찾기
            theme_toggle = WebDriverWait(self.driver, 5).until(
                EC.element_to_be_clickable((By.XPATH, "//a[contains(text(), 'Toggle Theme')]"))
            )
            
            # 현재 테마 확인
            body_element = self.driver.find_element(By.TAG_NAME, "body")
            current_theme = self.driver.execute_script(
                "return document.documentElement.getAttribute('data-theme')"
            )
            
            self.log_test("THEME", "Current Theme", "PASS", f"Theme: {current_theme or 'light'}")
            
            # 테마 전환
            theme_toggle.click()
            time.sleep(2)
            
            # 테마 변경 확인
            new_theme = self.driver.execute_script(
                "return document.documentElement.getAttribute('data-theme')"
            )
            
            if new_theme != current_theme:
                self.log_test("THEME", "Theme Toggle", "PASS", f"Changed to: {new_theme or 'light'}")
            else:
                self.log_test("THEME", "Theme Toggle", "FAIL", "Theme did not change")
                
        except Exception as e:
            self.log_test("THEME", "Theme Functionality", "FAIL", str(e))
    
    def test_javascript_errors(self):
        """JavaScript 오류 테스트"""
        print("\n⚡ JavaScript 오류 테스트...")
        
        try:
            # JavaScript 콘솔 로그 확인
            logs = self.driver.get_log('browser')
            
            errors = [log for log in logs if log['level'] == 'SEVERE']
            warnings = [log for log in logs if log['level'] == 'WARNING']
            
            if not errors:
                self.log_test("JAVASCRIPT", "Console Errors", "PASS", "No severe errors found")
            else:
                error_messages = [log['message'] for log in errors[:3]]  # 첫 3개만
                self.log_test("JAVASCRIPT", "Console Errors", "FAIL", f"{len(errors)} errors found")
                for i, msg in enumerate(error_messages, 1):
                    print(f"   Error {i}: {msg[:100]}...")
            
            if len(warnings) <= 5:  # 5개 이하의 경고는 허용
                self.log_test("JAVASCRIPT", "Console Warnings", "PASS", f"{len(warnings)} warnings (acceptable)")
            else:
                self.log_test("JAVASCRIPT", "Console Warnings", "WARN", f"{len(warnings)} warnings found")
                
        except Exception as e:
            self.log_test("JAVASCRIPT", "Console Check", "WARN", f"Could not check console: {str(e)}")
    
    def test_performance(self):
        """성능 테스트"""
        print("\n⚡ 성능 테스트...")
        
        try:
            # 페이지 로딩 시간 측정
            start_time = time.time()
            self.driver.get(self.base_url)
            
            # 페이지 로딩 완료 대기
            WebDriverWait(self.driver, 20).until(
                EC.invisibility_of_element_located((By.ID, "loading-indicator"))
            )
            
            load_time = time.time() - start_time
            
            if load_time < 5:
                self.log_test("PERFORMANCE", "Page Load Time", "PASS", f"{load_time:.2f} seconds")
            elif load_time < 10:
                self.log_test("PERFORMANCE", "Page Load Time", "WARN", f"{load_time:.2f} seconds (slow)")
            else:
                self.log_test("PERFORMANCE", "Page Load Time", "FAIL", f"{load_time:.2f} seconds (too slow)")
            
            # 메모리 사용량 (대략적인 추정)
            memory_info = self.driver.execute_script("return performance.memory")
            if memory_info:
                used_mb = memory_info['usedJSHeapSize'] / (1024 * 1024)
                if used_mb < 100:
                    self.log_test("PERFORMANCE", "Memory Usage", "PASS", f"{used_mb:.1f} MB")
                else:
                    self.log_test("PERFORMANCE", "Memory Usage", "WARN", f"{used_mb:.1f} MB (high)")
            
        except Exception as e:
            self.log_test("PERFORMANCE", "Performance Test", "FAIL", str(e))
    
    def cleanup(self):
        """정리 작업"""
        print("\n🧹 정리 작업...")
        
        if self.driver:
            self.driver.quit()
            print("✅ 브라우저 종료")
        
        if self.server_process:
            self.server_process.terminate()
            self.server_process.wait()
            print("✅ 서버 종료")
    
    def generate_report(self):
        """종합 테스트 보고서 생성"""
        categories = {}
        for result in self.test_results:
            category = result['category']
            if category not in categories:
                categories[category] = {'PASS': 0, 'FAIL': 0, 'WARN': 0, 'tests': []}
            
            categories[category][result['status']] += 1
            categories[category]['tests'].append(result)
        
        total_tests = len(self.test_results)
        total_pass = sum(1 for r in self.test_results if r['status'] == 'PASS')
        total_fail = sum(1 for r in self.test_results if r['status'] == 'FAIL')
        total_warn = sum(1 for r in self.test_results if r['status'] == 'WARN')
        
        success_rate = (total_pass / total_tests * 100) if total_tests > 0 else 0
        
        report = f"""
🧪 FCA 대시보드 종합 기능 테스트 보고서
{'='*60}
📅 테스트 시간: {time.strftime('%Y-%m-%d %H:%M:%S')}
🌐 테스트 URL: {self.base_url}

📊 전체 요약:
  총 테스트: {total_tests}
  ✅ 성공: {total_pass}
  ❌ 실패: {total_fail}
  ⚠️  경고: {total_warn}
  📈 성공률: {success_rate:.1f}%

🎯 전체 상태: {'🟢 우수' if success_rate >= 90 else '🟡 양호' if success_rate >= 75 else '🔴 개선필요'}

{'='*60}
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
            
            # 실패한 테스트 상세 정보
            failed_tests = [t for t in stats['tests'] if t['status'] == 'FAIL']
            if failed_tests:
                report += "   ❌ 실패한 테스트:\n"
                for test in failed_tests[:3]:  # 최대 3개까지만
                    report += f"      - {test['test']}: {test['message']}\n"
        
        report += f"\n{'='*60}\n"
        
        # 권장사항
        if total_fail > 0:
            report += "💡 권장사항:\n"
            if any(r['category'] == 'JAVASCRIPT' and r['status'] == 'FAIL' for r in self.test_results):
                report += "  • JavaScript 오류를 확인하고 수정하세요\n"
            if any(r['category'] == 'PERFORMANCE' and r['status'] == 'FAIL' for r in self.test_results):
                report += "  • 페이지 로딩 성능을 최적화하세요\n"
            if any(r['category'] == 'NAVIGATION' and r['status'] == 'FAIL' for r in self.test_results):
                report += "  • 네비게이션 동작을 확인하세요\n"
        
        return report
    
    def run_comprehensive_test(self):
        """종합 테스트 실행"""
        try:
            # 서버 시작
            if not self.start_server():
                print("❌ 서버 시작 실패, 테스트 중단")
                return False
            
            # 브라우저 설정
            if not self.setup_browser():
                print("❌ 브라우저 설정 실패, 테스트 중단")
                return False
            
            # 각종 테스트 실행
            self.test_page_loading()
            self.test_data_loading()
            self.test_navigation()
            self.test_dashboard_elements()
            self.test_responsive_design()
            self.test_theme_functionality()
            self.test_javascript_errors()
            self.test_performance()
            
            # 보고서 생성
            report = self.generate_report()
            print(report)
            
            # 보고서 저장
            with open('/root/FCA/static_dashboard/comprehensive_test_report.txt', 'w', encoding='utf-8') as f:
                f.write(report)
            
            print("📁 종합 테스트 보고서 저장: static_dashboard/comprehensive_test_report.txt")
            
            return True
            
        except Exception as e:
            print(f"❌ 종합 테스트 중 오류 발생: {e}")
            import traceback
            traceback.print_exc()
            return False
            
        finally:
            self.cleanup()

def main():
    print("🚀 FCA 대시보드 종합 기능 테스트를 시작합니다...")
    
    # Chrome 드라이버 확인
    try:
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options
    except ImportError:
        print("❌ Selenium이 설치되지 않았습니다. pip install selenium을 실행하세요.")
        return 1
    
    tester = ComprehensiveTester()
    success = tester.run_comprehensive_test()
    
    if success:
        print("\n🎉 종합 기능 테스트가 완료되었습니다!")
        return 0
    else:
        print("\n💥 종합 기능 테스트 중 오류가 발생했습니다.")
        return 1

if __name__ == "__main__":
    exit(main())