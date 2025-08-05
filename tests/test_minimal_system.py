#!/usr/bin/env python3
"""
Minimal System Test
==================

최소화된 호출 시스템과 모듈화된 기능들을 테스트합니다.
"""

import sys
import os
import time
from pathlib import Path

# 모듈 경로 추가
sys.path.append('/root/FCA')

def test_logging_system():
    """로깅 시스템 테스트"""
    print("📝 Testing Logging System...")
    
    try:
        from core.logging_manager import get_logger, log_calls
        
        logger = get_logger("TestLogger")
        
        # 기본 로깅 테스트
        logger.info("Test info message")
        logger.warning("Test warning message")
        logger.error("Test error message")
        
        # 함수 호출 로깅 테스트
        @log_calls()
        def test_function(x, y):
            return x + y
        
        result = test_function(5, 3)
        
        print(f"   ✅ Logging system working, test function result: {result}")
        
        # 로그 파일 확인
        log_dir = Path("/root/FCA/logs")
        if log_dir.exists():
            log_files = list(log_dir.glob("*.log"))
            print(f"   ✅ Log files created: {len(log_files)} files")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Logging System Error: {e}")
        return False

def test_module_loader():
    """모듈 로더 테스트"""
    print("\n📦 Testing Module Loader...")
    
    try:
        from core.module_loader import get_module_loader, load_module, get_system_status
        
        loader = get_module_loader()
        
        # 시스템 상태 확인
        status = get_system_status()
        print(f"   ✅ Available modules: {status['available_modules']}")
        print(f"   ✅ Total modules: {status['total_modules']}")
        
        # 모듈 로드 테스트
        detector = load_module('isolation_forest', contamination=0.1)
        print(f"   ✅ Fraud detector loaded: {detector.name}")
        
        chart_gen = load_module('performance_chart')
        print(f"   ✅ Chart generator loaded: {chart_gen.__class__.__name__}")
        
        # 업데이트된 상태 확인
        updated_status = get_system_status()
        print(f"   ✅ Loaded modules: {updated_status['loaded_modules']}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Module Loader Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_route_handlers():
    """라우트 핸들러 테스트"""
    print("\n🛣️  Testing Route Handlers...")
    
    try:
        from core.module_loader import get_module_loader
        from web_app.routes.handlers import PageHandlers, APIHandlers
        
        loader = get_module_loader()
        
        # 페이지 핸들러 테스트
        page_handler = PageHandlers(loader)
        
        # API 핸들러 테스트
        api_handler = APIHandlers(loader)
        
        # API 호출 시뮬레이션
        health_response = api_handler.health_check()
        print(f"   ✅ Health check response: {health_response.status_code}")
        
        summary_response = api_handler.project_summary()
        print(f"   ✅ Project summary response: {summary_response.status_code}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Route Handlers Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_minimal_app_creation():
    """최소화된 앱 생성 테스트"""
    print("\n🚀 Testing Minimal App Creation...")
    
    try:
        from web_app.app_minimal import create_app
        
        app = create_app()
        
        print(f"   ✅ App created: {app.name}")
        print(f"   ✅ Debug mode: {app.debug}")
        
        # 등록된 라우트 확인
        routes = []
        for rule in app.url_map.iter_rules():
            routes.append(f"{rule.methods} {rule.rule}")
        
        print(f"   ✅ Registered routes: {len(routes)}")
        print(f"   ✅ Sample routes: {routes[:5]}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Minimal App Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_file_structure():
    """파일 구조 확인"""
    print("\n📁 Testing Minimal System File Structure...")
    
    expected_files = {
        '/root/FCA/core/__init__.py': 'Core Package',
        '/root/FCA/core/logging_manager.py': 'Logging Manager',
        '/root/FCA/core/module_loader.py': 'Module Loader',
        '/root/FCA/web_app/app_minimal.py': 'Minimal Flask App',
        '/root/FCA/web_app/routes/route_manager.py': 'Route Manager',
        '/root/FCA/web_app/routes/handlers/page_handlers.py': 'Page Handlers',
        '/root/FCA/web_app/routes/handlers/api_handlers.py': 'API Handlers',
        '/root/FCA/web_app/middleware/request_middleware.py': 'Request Middleware'
    }
    
    all_good = True
    for file_path, description in expected_files.items():
        if os.path.exists(file_path):
            file_size = os.path.getsize(file_path)
            print(f"   ✅ {description}: {file_size:,} bytes")
        else:
            print(f"   ❌ {description}: Missing")
            all_good = False
    
    return all_good

def main():
    """메인 테스트 함수"""
    print("🧪 FCA Minimal System Test")
    print("=" * 50)
    
    tests = [
        ("File Structure", test_file_structure),
        ("Logging System", test_logging_system),
        ("Module Loader", test_module_loader),
        ("Route Handlers", test_route_handlers),
        ("Minimal App Creation", test_minimal_app_creation)
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
        print("🎉 Minimal system working correctly!")
        print("\n📋 Key Improvements:")
        print("   ✅ Centralized logging with structured logs")
        print("   ✅ Dynamic module loading system")
        print("   ✅ Minimal Flask app (< 50 lines)")
        print("   ✅ Separated route handlers")
        print("   ✅ Request middleware with monitoring")
        print("   ✅ Function call tracking")
        return True
    else:
        print("⚠️  Some issues found in minimal system")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)