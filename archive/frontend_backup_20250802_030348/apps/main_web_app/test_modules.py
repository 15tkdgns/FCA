#!/usr/bin/env python3
"""
모듈 테스트 스크립트
"""

import sys
import json
from datetime import datetime

# 경로 추가
sys.path.append('.')

def test_transparency_module():
    """투명성 모듈 테스트"""
    print("🧪 투명성 모듈 테스트 시작...")
    
    try:
        from modules.core.transparency import transparency_manager
        
        # 1. 처리 단계 테스트
        result = transparency_manager.get_processing_steps()
        assert result['status'] == 'success', "처리 단계 조회 실패"
        assert 'processing_steps' in result, "처리 단계 데이터 없음"
        print("✅ 처리 단계 조회 성공")
        
        # 2. 데이터 플로우 테스트
        result = transparency_manager.get_data_flow_metrics()
        assert result['status'] == 'success', "데이터 플로우 조회 실패"
        assert 'data_flow' in result, "데이터 플로우 데이터 없음"
        print("✅ 데이터 플로우 조회 성공")
        
        print("✅ 투명성 모듈 테스트 완료")
        return True
        
    except Exception as e:
        print(f"❌ 투명성 모듈 테스트 실패: {e}")
        return False

def test_api_endpoints():
    """API 엔드포인트 테스트"""
    print("🧪 API 엔드포인트 테스트 시작...")
    
    try:
        from run_web_app import app
        
        with app.test_client() as client:
            # 테스트할 엔드포인트들
            endpoints = {
                '/api/metrics': 'GET',
                '/api/transparency/processing-steps': 'GET',
                '/api/transparency/data-flow': 'GET',
                '/api/fraud/statistics': 'GET',
                '/api/sentiment/data': 'GET',
                '/api/attrition/data': 'GET',
                '/health': 'GET'
            }
            
            success_count = 0
            total_count = len(endpoints)
            
            for endpoint, method in endpoints.items():
                try:
                    if method == 'GET':
                        response = client.get(endpoint)
                    else:
                        response = client.post(endpoint)
                    
                    if response.status_code == 200:
                        # JSON 응답 파싱 테스트
                        data = response.get_json()
                        if data and isinstance(data, dict):
                            success_count += 1
                            print(f"✅ {endpoint}: 정상 ({response.status_code})")
                        else:
                            print(f"⚠️ {endpoint}: JSON 파싱 실패")
                    else:
                        print(f"❌ {endpoint}: HTTP {response.status_code}")
                        
                except Exception as e:
                    print(f"❌ {endpoint}: {str(e)}")
            
            print(f"📊 API 테스트 결과: {success_count}/{total_count} 성공")
            return success_count == total_count
        
    except Exception as e:
        print(f"❌ API 엔드포인트 테스트 실패: {e}")
        return False

def test_performance_calculator():
    """성능 계산기 테스트"""
    print("🧪 성능 계산기 테스트 시작...")
    
    try:
        from utils.performance_calculator import performance_calculator
        
        # 전체 성능 메트릭 조회
        metrics = performance_calculator.get_all_performance_metrics()
        
        # 필수 키 확인
        required_keys = ['fraud_detection', 'sentiment_analysis', 'customer_attrition']
        for key in required_keys:
            assert key in metrics, f"{key} 메트릭 없음"
            
            # 각 메트릭의 필수 필드 확인
            metric_data = metrics[key]
            assert 'accuracy' in metric_data, f"{key}에 accuracy 없음"
            assert 'total_samples' in metric_data, f"{key}에 total_samples 없음"
            
        print("✅ 성능 계산기 테스트 완료")
        return True
        
    except Exception as e:
        print(f"❌ 성능 계산기 테스트 실패: {e}")
        return False

def test_flask_pages():
    """Flask 페이지 테스트"""
    print("🧪 Flask 페이지 테스트 시작...")
    
    try:
        from run_web_app import app
        
        with app.test_client() as client:
            pages = ['/', '/transparency', '/datasets', '/detection']
            success_count = 0
            total_count = len(pages)
            
            for page in pages:
                try:
                    response = client.get(page)
                    if response.status_code == 200:
                        success_count += 1
                        print(f"✅ {page}: 정상 로드")
                    else:
                        print(f"❌ {page}: HTTP {response.status_code}")
                except Exception as e:
                    print(f"❌ {page}: {str(e)}")
            
            print(f"📊 페이지 테스트 결과: {success_count}/{total_count} 성공")
            return success_count >= total_count - 1  # 1개 실패까지 허용
        
    except Exception as e:
        print(f"❌ Flask 페이지 테스트 실패: {e}")
        return False

def main():
    """메인 테스트 실행"""
    print("🚀 FCA 모듈 통합 테스트 시작")
    print("=" * 50)
    
    tests = [
        ("투명성 모듈", test_transparency_module),
        ("성능 계산기", test_performance_calculator),
        ("API 엔드포인트", test_api_endpoints),
        ("Flask 페이지", test_flask_pages)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🔬 {test_name} 테스트 중...")
        if test_func():
            passed += 1
            print(f"✅ {test_name} 테스트 통과")
        else:
            print(f"❌ {test_name} 테스트 실패")
    
    print("\n" + "=" * 50)
    print(f"📊 최종 결과: {passed}/{total} 테스트 통과")
    
    if passed == total:
        print("🎉 모든 테스트 통과!")
        return True
    else:
        print("⚠️ 일부 테스트 실패")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)