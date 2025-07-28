"""
Cache Manager Module
====================

통합 캐싱 시스템 관리 모듈
- 다중 백엔드 지원 (메모리, Redis, Memcached)
- TTL 관리
- 캐시 성능 모니터링
- 캐시 무효화 전략
"""

import pickle
import time
import json
import hashlib
import threading
from abc import ABC, abstractmethod
from typing import Any, Optional, Dict, List, Union, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass
import logging

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

try:
    import pymemcache
    MEMCACHED_AVAILABLE = True
except ImportError:
    MEMCACHED_AVAILABLE = False


@dataclass
class CacheEntry:
    """캐시 엔트리"""
    value: Any
    timestamp: float
    ttl: Optional[int] = None
    access_count: int = 0
    last_access: float = 0
    
    def is_expired(self) -> bool:
        """만료 여부 확인"""
        if self.ttl is None:
            return False
        return time.time() - self.timestamp > self.ttl
    
    def touch(self):
        """접근 시간 업데이트"""
        self.access_count += 1
        self.last_access = time.time()


class CacheBackend(ABC):
    """캐시 백엔드 추상 클래스"""
    
    @abstractmethod
    def get(self, key: str) -> Optional[Any]:
        """값 조회"""
        pass
    
    @abstractmethod
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """값 저장"""
        pass
    
    @abstractmethod
    def delete(self, key: str) -> bool:
        """값 삭제"""
        pass
    
    @abstractmethod
    def clear(self) -> bool:
        """모든 값 삭제"""
        pass
    
    @abstractmethod
    def keys(self, pattern: str = '*') -> List[str]:
        """키 목록 조회"""
        pass
    
    @abstractmethod
    def exists(self, key: str) -> bool:
        """키 존재 여부"""
        pass
    
    @abstractmethod
    def get_stats(self) -> Dict[str, Any]:
        """통계 정보"""
        pass


class MemoryBackend(CacheBackend):
    """메모리 기반 캐시 백엔드"""
    
    def __init__(self, max_size: int = 1000):
        self.cache: Dict[str, CacheEntry] = {}
        self.max_size = max_size
        self.lock = threading.RLock()
        self.hits = 0
        self.misses = 0
        self.sets = 0
        self.deletes = 0
    
    def _cleanup_expired(self):
        """만료된 엔트리 정리"""
        expired_keys = [
            key for key, entry in self.cache.items()
            if entry.is_expired()
        ]
        for key in expired_keys:
            del self.cache[key]
    
    def _evict_lru(self):
        """LRU 기반 축출"""
        if len(self.cache) >= self.max_size:
            # 가장 오래된 접근 시간을 가진 엔트리 찾기
            lru_key = min(
                self.cache.keys(),
                key=lambda k: self.cache[k].last_access or self.cache[k].timestamp
            )
            del self.cache[lru_key]
    
    def get(self, key: str) -> Optional[Any]:
        with self.lock:
            self._cleanup_expired()
            
            if key in self.cache:
                entry = self.cache[key]
                if not entry.is_expired():
                    entry.touch()
                    self.hits += 1
                    return entry.value
                else:
                    del self.cache[key]
            
            self.misses += 1
            return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        with self.lock:
            self._cleanup_expired()
            self._evict_lru()
            
            entry = CacheEntry(
                value=value,
                timestamp=time.time(),
                ttl=ttl,
                last_access=time.time()
            )
            self.cache[key] = entry
            self.sets += 1
            return True
    
    def delete(self, key: str) -> bool:
        with self.lock:
            if key in self.cache:
                del self.cache[key]
                self.deletes += 1
                return True
            return False
    
    def clear(self) -> bool:
        with self.lock:
            self.cache.clear()
            return True
    
    def keys(self, pattern: str = '*') -> List[str]:
        with self.lock:
            self._cleanup_expired()
            if pattern == '*':
                return list(self.cache.keys())
            
            # 간단한 패턴 매칭 (glob 스타일)
            import fnmatch
            return [key for key in self.cache.keys() if fnmatch.fnmatch(key, pattern)]
    
    def exists(self, key: str) -> bool:
        with self.lock:
            if key in self.cache:
                entry = self.cache[key]
                if not entry.is_expired():
                    return True
                else:
                    del self.cache[key]
            return False
    
    def get_stats(self) -> Dict[str, Any]:
        with self.lock:
            self._cleanup_expired()
            total_requests = self.hits + self.misses
            hit_rate = (self.hits / total_requests * 100) if total_requests > 0 else 0
            
            return {
                'backend': 'memory',
                'size': len(self.cache),
                'max_size': self.max_size,
                'hits': self.hits,
                'misses': self.misses,
                'hit_rate': round(hit_rate, 2),
                'sets': self.sets,
                'deletes': self.deletes
            }


class RedisBackend(CacheBackend):
    """Redis 기반 캐시 백엔드"""
    
    def __init__(self, host: str = 'localhost', port: int = 6379, 
                 db: int = 0, password: str = None):
        if not REDIS_AVAILABLE:
            raise ImportError("Redis library not available")
        
        self.client = redis.Redis(
            host=host, port=port, db=db, password=password,
            decode_responses=False, socket_timeout=5
        )
        self.prefix = 'fca_cache:'
    
    def _make_key(self, key: str) -> str:
        """키에 프리픽스 추가"""
        return f"{self.prefix}{key}"
    
    def get(self, key: str) -> Optional[Any]:
        try:
            data = self.client.get(self._make_key(key))
            if data:
                return pickle.loads(data)
            return None
        except Exception as e:
            logging.error(f"Redis get error: {e}")
            return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        try:
            data = pickle.dumps(value)
            return self.client.set(self._make_key(key), data, ex=ttl)
        except Exception as e:
            logging.error(f"Redis set error: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        try:
            return bool(self.client.delete(self._make_key(key)))
        except Exception as e:
            logging.error(f"Redis delete error: {e}")
            return False
    
    def clear(self) -> bool:
        try:
            keys = self.client.keys(f"{self.prefix}*")
            if keys:
                return bool(self.client.delete(*keys))
            return True
        except Exception as e:
            logging.error(f"Redis clear error: {e}")
            return False
    
    def keys(self, pattern: str = '*') -> List[str]:
        try:
            redis_pattern = f"{self.prefix}{pattern}"
            keys = self.client.keys(redis_pattern)
            # 프리픽스 제거
            return [key.decode('utf-8')[len(self.prefix):] for key in keys]
        except Exception as e:
            logging.error(f"Redis keys error: {e}")
            return []
    
    def exists(self, key: str) -> bool:
        try:
            return bool(self.client.exists(self._make_key(key)))
        except Exception as e:
            logging.error(f"Redis exists error: {e}")
            return False
    
    def get_stats(self) -> Dict[str, Any]:
        try:
            info = self.client.info()
            return {
                'backend': 'redis',
                'connected_clients': info.get('connected_clients', 0),
                'used_memory': info.get('used_memory', 0),
                'keyspace_hits': info.get('keyspace_hits', 0),
                'keyspace_misses': info.get('keyspace_misses', 0),
                'total_commands_processed': info.get('total_commands_processed', 0)
            }
        except Exception as e:
            logging.error(f"Redis stats error: {e}")
            return {'backend': 'redis', 'error': str(e)}


class CacheManager:
    """캐시 관리자"""
    
    def __init__(self, config=None):
        from .config import config as default_config
        self.config = config or default_config.cache
        
        self.backend = self._create_backend()
        self.logger = logging.getLogger('fca.cache')
        
        # 캐시 성능 추적
        self.operation_times = []
        self.max_operation_history = 100
    
    def _create_backend(self) -> CacheBackend:
        """백엔드 생성"""
        cache_type = self.config.type.lower()
        
        if cache_type == 'redis':
            if not REDIS_AVAILABLE:
                self.logger.warning("Redis not available, falling back to memory cache")
                return MemoryBackend(max_size=self.config.max_size)
            
            try:
                return RedisBackend(
                    host=self.config.host,
                    port=self.config.port,
                    db=self.config.db,
                    password=self.config.password
                )
            except Exception as e:
                self.logger.error(f"Failed to create Redis backend: {e}")
                self.logger.warning("Falling back to memory cache")
                return MemoryBackend(max_size=self.config.max_size)
        
        elif cache_type == 'memcached':
            if not MEMCACHED_AVAILABLE:
                self.logger.warning("Memcached not available, falling back to memory cache")
                return MemoryBackend(max_size=self.config.max_size)
            
            # Memcached 백엔드 구현 필요
            self.logger.warning("Memcached backend not implemented, using memory cache")
            return MemoryBackend(max_size=self.config.max_size)
        
        else:  # memory
            return MemoryBackend(max_size=self.config.max_size)
    
    def _track_operation(self, operation: str, duration: float):
        """작업 성능 추적"""
        self.operation_times.append({
            'operation': operation,
            'duration': duration,
            'timestamp': time.time()
        })
        
        # 히스토리 크기 제한
        if len(self.operation_times) > self.max_operation_history:
            self.operation_times.pop(0)
    
    def _make_cache_key(self, key: str, namespace: str = None) -> str:
        """캐시 키 생성"""
        if namespace:
            return f"{namespace}:{key}"
        return key
    
    def get(self, key: str, namespace: str = None) -> Optional[Any]:
        """값 조회"""
        start_time = time.time()
        cache_key = self._make_cache_key(key, namespace)
        
        try:
            result = self.backend.get(cache_key)
            duration = time.time() - start_time
            self._track_operation('get', duration)
            
            if result is not None:
                self.logger.debug(f"Cache hit: {cache_key}")
            else:
                self.logger.debug(f"Cache miss: {cache_key}")
            
            return result
            
        except Exception as e:
            self.logger.error(f"Cache get error for {cache_key}: {e}")
            return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None, namespace: str = None) -> bool:
        """값 저장"""
        start_time = time.time()
        cache_key = self._make_cache_key(key, namespace)
        
        if ttl is None:
            ttl = self.config.ttl
        
        try:
            result = self.backend.set(cache_key, value, ttl)
            duration = time.time() - start_time
            self._track_operation('set', duration)
            
            self.logger.debug(f"Cache set: {cache_key} (TTL: {ttl}s)")
            return result
            
        except Exception as e:
            self.logger.error(f"Cache set error for {cache_key}: {e}")
            return False
    
    def delete(self, key: str, namespace: str = None) -> bool:
        """값 삭제"""
        start_time = time.time()
        cache_key = self._make_cache_key(key, namespace)
        
        try:
            result = self.backend.delete(cache_key)
            duration = time.time() - start_time
            self._track_operation('delete', duration)
            
            self.logger.debug(f"Cache delete: {cache_key}")
            return result
            
        except Exception as e:
            self.logger.error(f"Cache delete error for {cache_key}: {e}")
            return False
    
    def clear(self, namespace: str = None) -> bool:
        """캐시 클리어"""
        start_time = time.time()
        
        try:
            if namespace:
                # 네임스페이스별 삭제
                keys = self.backend.keys(f"{namespace}:*")
                for key in keys:
                    self.backend.delete(key)
                result = True
            else:
                result = self.backend.clear()
            
            duration = time.time() - start_time
            self._track_operation('clear', duration)
            
            self.logger.info(f"Cache cleared: {namespace or 'all'}")
            return result
            
        except Exception as e:
            self.logger.error(f"Cache clear error: {e}")
            return False
    
    def exists(self, key: str, namespace: str = None) -> bool:
        """키 존재 여부"""
        cache_key = self._make_cache_key(key, namespace)
        return self.backend.exists(cache_key)
    
    def get_or_set(self, key: str, func: Callable, ttl: Optional[int] = None, 
                   namespace: str = None) -> Any:
        """값 조회 또는 설정 (캐시 미스 시 함수 실행)"""
        value = self.get(key, namespace)
        
        if value is None:
            value = func()
            self.set(key, value, ttl, namespace)
        
        return value
    
    def mget(self, keys: List[str], namespace: str = None) -> Dict[str, Any]:
        """다중 키 조회"""
        result = {}
        for key in keys:
            result[key] = self.get(key, namespace)
        return result
    
    def mset(self, data: Dict[str, Any], ttl: Optional[int] = None, 
            namespace: str = None) -> bool:
        """다중 키 설정"""
        success = True
        for key, value in data.items():
            if not self.set(key, value, ttl, namespace):
                success = False
        return success
    
    def increment(self, key: str, delta: int = 1, namespace: str = None) -> Optional[int]:
        """카운터 증가"""
        current = self.get(key, namespace) or 0
        new_value = current + delta
        if self.set(key, new_value, namespace=namespace):
            return new_value
        return None
    
    def get_stats(self) -> Dict[str, Any]:
        """캐시 통계"""
        backend_stats = self.backend.get_stats()
        
        # 평균 작업 시간 계산
        if self.operation_times:
            avg_time = sum(op['duration'] for op in self.operation_times) / len(self.operation_times)
            recent_ops = len([op for op in self.operation_times 
                            if time.time() - op['timestamp'] < 60])  # 최근 1분
        else:
            avg_time = 0
            recent_ops = 0
        
        return {
            **backend_stats,
            'config': {
                'type': self.config.type,
                'ttl': self.config.ttl,
                'max_size': self.config.max_size
            },
            'performance': {
                'avg_operation_time_ms': round(avg_time * 1000, 2),
                'recent_operations_per_minute': recent_ops,
                'total_tracked_operations': len(self.operation_times)
            }
        }
    
    def health_check(self) -> Dict[str, Any]:
        """헬스 체크"""
        test_key = f"health_check_{int(time.time())}"
        test_value = "ok"
        
        try:
            # 설정/조회/삭제 테스트
            set_success = self.set(test_key, test_value, ttl=60)
            get_success = self.get(test_key) == test_value
            delete_success = self.delete(test_key)
            
            return {
                'status': 'healthy' if all([set_success, get_success, delete_success]) else 'unhealthy',
                'operations': {
                    'set': set_success,
                    'get': get_success,
                    'delete': delete_success
                },
                'backend': self.backend.__class__.__name__
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'backend': self.backend.__class__.__name__
            }


# 전역 캐시 매니저 인스턴스
cache_manager = CacheManager()