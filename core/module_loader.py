#!/usr/bin/env python3
"""
Module Loader
============

동적 모듈 로딩 및 관리 시스템
"""

import sys
import importlib
import inspect
from typing import Dict, Any, Type, Optional, List
from pathlib import Path

from .logging_manager import get_logger, log_calls

logger = get_logger("ModuleLoader")


class ModuleRegistry:
    """모듈 레지스트리 - 사용 가능한 모듈들을 관리"""
    
    def __init__(self):
        self._modules: Dict[str, Dict[str, Any]] = {}
        self._instances: Dict[str, Any] = {}
    
    @log_calls()
    def register_module(self, name: str, module_path: str, class_name: str, 
                       description: str = "", dependencies: List[str] = None):
        """모듈 등록"""
        self._modules[name] = {
            'module_path': module_path,
            'class_name': class_name,
            'description': description,
            'dependencies': dependencies or [],
            'loaded': False,
            'instance': None
        }
        logger.info(f"Module registered: {name}", extra={'module_path': module_path})
    
    @log_calls()
    def load_module(self, name: str, **kwargs) -> Any:
        """모듈 로드 및 인스턴스 생성"""
        if name not in self._modules:
            raise ValueError(f"Module '{name}' not registered")
        
        module_info = self._modules[name]
        
        # 이미 로드된 경우 기존 인스턴스 반환
        if module_info['loaded'] and module_info['instance']:
            logger.debug(f"Returning cached instance: {name}")
            return module_info['instance']
        
        try:
            # 의존성 체크
            for dep in module_info['dependencies']:
                if dep not in self._modules or not self._modules[dep]['loaded']:
                    logger.warning(f"Dependency '{dep}' not loaded for module '{name}'")
            
            # 모듈 임포트
            module = importlib.import_module(module_info['module_path'])
            
            # 클래스 가져오기
            cls = getattr(module, module_info['class_name'])
            
            # 인스턴스 생성
            instance = cls(**kwargs)
            
            # 등록 업데이트
            module_info['loaded'] = True
            module_info['instance'] = instance
            self._instances[name] = instance
            
            logger.info(f"Module loaded successfully: {name}")
            return instance
            
        except Exception as e:
            logger.error(f"Failed to load module '{name}': {e}")
            raise
    
    @log_calls()
    def get_instance(self, name: str) -> Optional[Any]:
        """로드된 모듈 인스턴스 반환"""
        return self._instances.get(name)
    
    @log_calls()
    def unload_module(self, name: str):
        """모듈 언로드"""
        if name in self._modules:
            self._modules[name]['loaded'] = False
            self._modules[name]['instance'] = None
        
        if name in self._instances:
            del self._instances[name]
        
        logger.info(f"Module unloaded: {name}")
    
    def list_modules(self) -> Dict[str, Dict[str, Any]]:
        """등록된 모듈 목록 반환"""
        return {name: {
            'description': info['description'],
            'loaded': info['loaded'],
            'dependencies': info['dependencies']
        } for name, info in self._modules.items()}
    
    def get_loaded_modules(self) -> List[str]:
        """로드된 모듈 이름 목록 반환"""
        return [name for name, info in self._modules.items() if info['loaded']]


class FunctionRegistry:
    """함수 레지스트리 - 모듈별 함수들을 관리"""
    
    def __init__(self):
        self._functions: Dict[str, Dict[str, Any]] = {}
    
    @log_calls()
    def register_function(self, name: str, func: callable, module_name: str = "",
                         description: str = "", parameters: Dict = None):
        """함수 등록"""
        self._functions[name] = {
            'function': func,
            'module_name': module_name,
            'description': description,
            'parameters': parameters or {},
            'signature': inspect.signature(func)
        }
        logger.info(f"Function registered: {name} (module: {module_name})")
    
    @log_calls()
    def call_function(self, name: str, *args, **kwargs) -> Any:
        """등록된 함수 호출"""
        if name not in self._functions:
            raise ValueError(f"Function '{name}' not registered")
        
        func_info = self._functions[name]
        try:
            result = func_info['function'](*args, **kwargs)
            logger.info(f"Function called successfully: {name}")
            return result
        except Exception as e:
            logger.error(f"Function call failed: {name} - {e}")
            raise
    
    def list_functions(self) -> Dict[str, Dict[str, Any]]:
        """등록된 함수 목록 반환"""
        return {name: {
            'module_name': info['module_name'],
            'description': info['description'],
            'parameters': info['parameters'],
            'signature': str(info['signature'])
        } for name, info in self._functions.items()}


class ModuleLoader:
    """통합 모듈 로더"""
    
    def __init__(self):
        self.module_registry = ModuleRegistry()
        self.function_registry = FunctionRegistry()
        self._setup_default_modules()
    
    def _setup_default_modules(self):
        """기본 모듈들 등록"""
        
        # 사기 탐지 모듈들
        self.module_registry.register_module(
            name="isolation_forest",
            module_path="fraud_detection.models.isolation_forest_detector",
            class_name="IsolationForestDetector",
            description="Isolation Forest 기반 사기 탐지 모델"
        )
        
        # 차트 생성 모듈들
        self.module_registry.register_module(
            name="performance_chart",
            module_path="web_app.modules.charts.performance_charts",
            class_name="PerformanceOverviewChart",
            description="성능 개요 차트 생성기"
        )
        
        self.module_registry.register_module(
            name="model_comparison_chart",
            module_path="web_app.modules.charts.performance_charts",
            class_name="ModelComparisonChart", 
            description="모델 비교 차트 생성기"
        )
        
        # 통계 분석 모듈들 (Python에서 JS 호출 시뮬레이션)
        self.function_registry.register_function(
            name="calculate_descriptive_stats",
            func=self._descriptive_stats_wrapper,
            module_name="statistics",
            description="기술통계 계산",
            parameters={"data": "array", "return": "dict"}
        )
        
        logger.info("Default modules registered")
    
    def _descriptive_stats_wrapper(self, data):
        """기술통계 계산 래퍼 함수"""
        import numpy as np
        
        return {
            'mean': np.mean(data),
            'median': np.median(data),
            'std': np.std(data),
            'min': np.min(data),
            'max': np.max(data)
        }
    
    @log_calls()
    def load_fraud_detector(self, detector_type: str = "isolation_forest", **kwargs):
        """사기 탐지 모델 로드"""
        return self.module_registry.load_module(detector_type, **kwargs)
    
    @log_calls()
    def load_chart_generator(self, chart_type: str = "performance_chart", **kwargs):
        """차트 생성기 로드"""
        return self.module_registry.load_module(chart_type, **kwargs)
    
    @log_calls()
    def get_system_status(self) -> Dict[str, Any]:
        """시스템 상태 반환"""
        return {
            'loaded_modules': self.module_registry.get_loaded_modules(),
            'available_modules': list(self.module_registry.list_modules().keys()),
            'available_functions': list(self.function_registry.list_functions().keys()),
            'total_modules': len(self.module_registry._modules),
            'loaded_count': len(self.module_registry.get_loaded_modules())
        }


# 글로벌 모듈 로더 인스턴스
_global_loader = None

def get_module_loader() -> ModuleLoader:
    """글로벌 모듈 로더 인스턴스 반환"""
    global _global_loader
    if _global_loader is None:
        _global_loader = ModuleLoader()
    return _global_loader

@log_calls()
def load_module(name: str, **kwargs):
    """편의 함수: 모듈 로드"""
    return get_module_loader().module_registry.load_module(name, **kwargs)

@log_calls()
def call_function(name: str, *args, **kwargs):
    """편의 함수: 함수 호출"""
    return get_module_loader().function_registry.call_function(name, *args, **kwargs)

@log_calls()
def get_system_status():
    """편의 함수: 시스템 상태"""
    return get_module_loader().get_system_status()