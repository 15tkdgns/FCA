#!/usr/bin/env python3
"""
Integration Testing Module
==========================

FCA 시스템 전체 통합 테스트 모듈
- 엔드투엔드 테스트
- 데이터 파이프라인 검증
- 성능 벤치마크
- 시스템 안정성 테스트
"""

import time
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from pathlib import Path
import json

from .dataset_loader import DatasetLoader, DATASET_CONFIGS
from .api_tester import APITester
from .server_manager import ServerManager

logger = logging.getLogger(__name__)

@dataclass
class IntegrationTestResult:
    """통합 테스트 결과"""
    test_name: str
    success: bool
    duration_seconds: float
    details: Dict[str, Any]
    error_message: Optional[str] = None
    timestamp: str = ""

class IntegrationTester:
    """FCA 시스템 통합 테스터"""
    
    def __init__(self, project_root: str = "/root/FCA"):
        self.project_root = Path(project_root)
        self.dataset_loader = DatasetLoader()
        self.api_tester = APITester()
        self.server_manager = ServerManager()
        
    def test_data_loading_pipeline(self) -> IntegrationTestResult:
        """데이터 로딩 파이프라인 테스트"""
        start_time = time.time()
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        
        try:
            logger.info("📊 Testing data loading pipeline...")
            
            results = {}
            
            # 각 데이터셋 로딩 테스트
            for dataset_name, config in DATASET_CONFIGS.items():
                try:
                    logger.info(f"  📁 Testing {dataset_name}...")
                    df, metadata = self.dataset_loader.load_dataset(config, sample_size=100)
                    
                    results[dataset_name] = {
                        "success": df is not None,
                        "shape": df.shape if df is not None else None,
                        "columns": list(df.columns) if df is not None else None,
                        "metadata": metadata,
                        "error": metadata.get("error")
                    }
                    
                except Exception as e:
                    results[dataset_name] = {
                        "success": False,
                        "error": str(e)
                    }
            
            # 결과 요약
            successful_datasets = [name for name, result in results.items() if result["success"]]
            failed_datasets = [name for name, result in results.items() if not result["success"]]
            
            overall_success = len(successful_datasets) > 0
            duration = time.time() - start_time
            
            details = {
                "total_datasets": len(DATASET_CONFIGS),
                "successful_datasets": len(successful_datasets),
                "failed_datasets": len(failed_datasets),
                "success_rate": len(successful_datasets) / len(DATASET_CONFIGS) * 100,
                "results": results,
                "successful_list": successful_datasets,
                "failed_list": failed_datasets
            }
            
            return IntegrationTestResult(
                test_name="Data Loading Pipeline",
                success=overall_success,
                duration_seconds=duration,
                details=details,
                timestamp=timestamp
            )
            
        except Exception as e:
            return IntegrationTestResult(
                test_name="Data Loading Pipeline",
                success=False,
                duration_seconds=time.time() - start_time,
                details={},
                error_message=str(e),
                timestamp=timestamp
            )
    
    def test_api_functionality(self) -> IntegrationTestResult:
        """API 기능 테스트"""
        start_time = time.time()
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        
        try:
            logger.info("🔌 Testing API functionality...")
            
            # 서버 상태 확인
            is_running, server_info = self.server_manager.is_server_running()
            if not is_running:
                logger.warning("⚠️ Server not running, attempting to start...")
                success, pid = self.server_manager.start_server()
                if not success:
                    raise Exception("Failed to start server for testing")
                time.sleep(5)  # 서버 시작 대기
            
            # API 테스트 실행
            api_results = self.api_tester.run_comprehensive_test()
            
            duration = time.time() - start_time
            
            return IntegrationTestResult(
                test_name="API Functionality",
                success=api_results["summary"]["success_rate"] > 80,
                duration_seconds=duration,
                details=api_results,
                timestamp=timestamp
            )
            
        except Exception as e:
            return IntegrationTestResult(
                test_name="API Functionality",
                success=False,
                duration_seconds=time.time() - start_time,
                details={},
                error_message=str(e),
                timestamp=timestamp
            )
    
    def test_end_to_end_workflow(self) -> IntegrationTestResult:
        """엔드투엔드 워크플로우 테스트"""
        start_time = time.time()
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        
        try:
            logger.info("🔄 Testing end-to-end workflow...")
            
            workflow_steps = {}
            
            # Step 1: 데이터 로딩
            logger.info("  Step 1: Loading sample dataset...")
            df, metadata = self.dataset_loader.load_dataset(
                DATASET_CONFIGS["ibm_aml"], 
                sample_size=50
            )
            workflow_steps["data_loading"] = {
                "success": df is not None,
                "shape": df.shape if df is not None else None
            }
            
            if df is None:
                raise Exception("Failed to load sample dataset")
            
            # Step 2: API 호출
            logger.info("  Step 2: Testing API endpoints...")
            health = self.api_tester.health_check()
            workflow_steps["api_health"] = health
            
            if health["status"] != "healthy":
                raise Exception("API health check failed")
            
            # Step 3: 데이터 분석 API 테스트
            logger.info("  Step 3: Testing data analysis APIs...")
            sentiment_result = self.api_tester.test_endpoint("/api/sentiment/data")
            fraud_result = self.api_tester.test_endpoint("/api/results/fraud")
            
            workflow_steps["analysis_apis"] = {
                "sentiment": sentiment_result.success,
                "fraud": fraud_result.success
            }
            
            # Step 4: 차트 생성 API 테스트
            logger.info("  Step 4: Testing chart generation...")
            chart_result = self.api_tester.test_endpoint("/api/chart/overview")
            workflow_steps["chart_generation"] = {
                "success": chart_result.success,
                "response_time": chart_result.response_time_ms
            }
            
            # 전체 성공 여부 판단
            all_steps_success = all(
                step.get("success", False) if isinstance(step, dict) else 
                step.get("status") == "healthy" for step in workflow_steps.values()
            )
            
            duration = time.time() - start_time
            
            return IntegrationTestResult(
                test_name="End-to-End Workflow",
                success=all_steps_success,
                duration_seconds=duration,
                details={
                    "workflow_steps": workflow_steps,
                    "total_steps": len(workflow_steps),
                    "successful_steps": sum(1 for step in workflow_steps.values() 
                                          if step.get("success", False) or step.get("status") == "healthy")
                },
                timestamp=timestamp
            )
            
        except Exception as e:
            return IntegrationTestResult(
                test_name="End-to-End Workflow",
                success=False,
                duration_seconds=time.time() - start_time,
                details={"error_details": str(e)},
                error_message=str(e),
                timestamp=timestamp
            )
    
    def test_performance_benchmark(self) -> IntegrationTestResult:
        """성능 벤치마크 테스트"""
        start_time = time.time()
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        
        try:
            logger.info("⚡ Running performance benchmark...")
            
            benchmark_results = {}
            
            # 데이터 로딩 성능
            logger.info("  Benchmarking data loading...")
            load_start = time.time()
            df, _ = self.dataset_loader.load_dataset(DATASET_CONFIGS["ibm_aml"], sample_size=1000)
            load_time = time.time() - load_start
            
            benchmark_results["data_loading"] = {
                "time_seconds": load_time,
                "rows_per_second": 1000 / load_time if load_time > 0 else 0,
                "success": df is not None
            }
            
            # API 응답 성능
            logger.info("  Benchmarking API performance...")
            api_endpoints = [
                "/api/health",
                "/api/summary", 
                "/api/sentiment/data",
                "/api/models/compare"
            ]
            
            api_times = []
            for endpoint in api_endpoints:
                result = self.api_tester.test_endpoint(endpoint)
                if result.success:
                    api_times.append(result.response_time_ms)
            
            benchmark_results["api_performance"] = {
                "avg_response_time_ms": sum(api_times) / len(api_times) if api_times else 0,
                "max_response_time_ms": max(api_times) if api_times else 0,
                "min_response_time_ms": min(api_times) if api_times else 0,
                "successful_requests": len(api_times),
                "total_requests": len(api_endpoints)
            }
            
            # 전체 성능 평가
            performance_score = 0
            if benchmark_results["data_loading"]["success"]:
                performance_score += 40
            if benchmark_results["api_performance"]["avg_response_time_ms"] < 1000:
                performance_score += 30
            if benchmark_results["api_performance"]["successful_requests"] >= 3:
                performance_score += 30
            
            duration = time.time() - start_time
            
            return IntegrationTestResult(
                test_name="Performance Benchmark",
                success=performance_score >= 70,
                duration_seconds=duration,
                details={
                    "benchmark_results": benchmark_results,
                    "performance_score": performance_score,
                    "grade": "A" if performance_score >= 90 else "B" if performance_score >= 70 else "C"
                },
                timestamp=timestamp
            )
            
        except Exception as e:
            return IntegrationTestResult(
                test_name="Performance Benchmark",
                success=False,
                duration_seconds=time.time() - start_time,
                details={},
                error_message=str(e),
                timestamp=timestamp
            )
    
    def run_full_integration_test(self) -> Dict[str, Any]:
        """전체 통합 테스트 실행"""
        logger.info("🧪 Starting full integration test suite...")
        start_time = time.time()
        
        tests = [
            self.test_data_loading_pipeline,
            self.test_api_functionality,
            self.test_end_to_end_workflow,
            self.test_performance_benchmark
        ]
        
        results = []
        for test_func in tests:
            try:
                result = test_func()
                results.append(result)
                
                status_icon = "✅" if result.success else "❌"
                logger.info(f"{status_icon} {result.test_name}: {result.duration_seconds:.2f}s")
                
            except Exception as e:
                logger.error(f"❌ Test failed: {e}")
                results.append(IntegrationTestResult(
                    test_name=test_func.__name__,
                    success=False,
                    duration_seconds=0,
                    details={},
                    error_message=str(e)
                ))
        
        # 전체 결과 요약
        total_duration = time.time() - start_time
        successful_tests = [r for r in results if r.success]
        failed_tests = [r for r in results if not r.success]
        
        summary = {
            "overview": {
                "total_tests": len(results),
                "successful_tests": len(successful_tests),
                "failed_tests": len(failed_tests),
                "success_rate": len(successful_tests) / len(results) * 100,
                "total_duration_seconds": total_duration,
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
            },
            "test_results": [
                {
                    "name": r.test_name,
                    "success": r.success,
                    "duration": r.duration_seconds,
                    "error": r.error_message
                }
                for r in results
            ],
            "detailed_results": {r.test_name: r.details for r in results},
            "overall_status": "PASS" if len(successful_tests) >= 3 else "FAIL"
        }
        
        # 결과 저장
        self._save_test_results(summary)
        
        logger.info(f"🎯 Integration test complete: {summary['overall_status']}")
        logger.info(f"📊 Success rate: {summary['overview']['success_rate']:.1f}%")
        
        return summary
    
    def _save_test_results(self, results: Dict[str, Any]):
        """테스트 결과 저장"""
        try:
            results_file = self.project_root / "integration_test_results.json"
            with open(results_file, 'w') as f:
                json.dump(results, f, indent=2)
            logger.info(f"💾 Test results saved: {results_file}")
        except Exception as e:
            logger.warning(f"⚠️ Failed to save test results: {e}")


def run_quick_integration_test() -> bool:
    """빠른 통합 테스트 (편의 함수)"""
    tester = IntegrationTester()
    
    # 핵심 테스트만 실행
    data_test = tester.test_data_loading_pipeline()
    api_test = tester.test_api_functionality()
    
    return data_test.success and api_test.success


def run_full_system_test() -> Dict[str, Any]:
    """전체 시스템 테스트 (편의 함수)"""
    tester = IntegrationTester()
    return tester.run_full_integration_test()