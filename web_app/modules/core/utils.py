"""
Core Utilities Module
=====================

핵심 유틸리티 함수들 모음
- 데이터 변환 및 검증
- 파일 처리
- 날짜/시간 유틸리티
- 해시 및 암호화
- 성능 측정
"""

import os
import json
import hashlib
import base64
import uuid
import mimetypes
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Union, Callable, Tuple
from pathlib import Path
import time
import functools
import logging
from contextlib import contextmanager
import threading


class DataConverter:
    """데이터 변환 유틸리티"""
    
    @staticmethod
    def to_json(data: Any, ensure_ascii: bool = False, indent: int = None) -> str:
        """객체를 JSON 문자열로 변환"""
        try:
            return json.dumps(data, ensure_ascii=ensure_ascii, indent=indent, default=str)
        except TypeError:
            # 직렬화 불가능한 객체 처리
            return json.dumps(str(data), ensure_ascii=ensure_ascii, indent=indent)
    
    @staticmethod
    def from_json(json_str: str, default: Any = None) -> Any:
        """JSON 문자열을 객체로 변환"""
        try:
            return json.loads(json_str)
        except (json.JSONDecodeError, TypeError):
            return default
    
    @staticmethod
    def to_bool(value: Any) -> bool:
        """값을 불린으로 변환"""
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.lower() in ('true', '1', 'yes', 'on', 'y')
        if isinstance(value, (int, float)):
            return bool(value)
        return False
    
    @staticmethod
    def to_int(value: Any, default: int = 0) -> int:
        """값을 정수로 변환"""
        try:
            return int(value)
        except (ValueError, TypeError):
            return default
    
    @staticmethod
    def to_float(value: Any, default: float = 0.0) -> float:
        """값을 실수로 변환"""
        try:
            return float(value)
        except (ValueError, TypeError):
            return default
    
    @staticmethod
    def flatten_dict(d: Dict, parent_key: str = '', sep: str = '.') -> Dict:
        """중첩된 딕셔너리를 평면화"""
        items = []
        for k, v in d.items():
            new_key = f"{parent_key}{sep}{k}" if parent_key else k
            if isinstance(v, dict):
                items.extend(DataConverter.flatten_dict(v, new_key, sep=sep).items())
            else:
                items.append((new_key, v))
        return dict(items)
    
    @staticmethod
    def unflatten_dict(d: Dict, sep: str = '.') -> Dict:
        """평면화된 딕셔너리를 중첩 구조로 복원"""
        result = {}
        for key, value in d.items():
            keys = key.split(sep)
            current = result
            for k in keys[:-1]:
                if k not in current:
                    current[k] = {}
                current = current[k]
            current[keys[-1]] = value
        return result


class FileUtils:
    """파일 처리 유틸리티"""
    
    @staticmethod
    def ensure_dir(path: Union[str, Path]) -> Path:
        """디렉토리 생성 (존재하지 않는 경우)"""
        path = Path(path)
        path.mkdir(parents=True, exist_ok=True)
        return path
    
    @staticmethod
    def get_file_info(file_path: Union[str, Path]) -> Dict[str, Any]:
        """파일 정보 조회"""
        path = Path(file_path)
        
        if not path.exists():
            return {'exists': False}
        
        stat = path.stat()
        mime_type, _ = mimetypes.guess_type(str(path))
        
        return {
            'exists': True,
            'size': stat.st_size,
            'size_human': FileUtils.format_file_size(stat.st_size),
            'modified': datetime.fromtimestamp(stat.st_mtime),
            'created': datetime.fromtimestamp(stat.st_ctime),
            'mime_type': mime_type,
            'extension': path.suffix.lower(),
            'is_file': path.is_file(),
            'is_dir': path.is_dir()
        }
    
    @staticmethod
    def format_file_size(size_bytes: int) -> str:
        """파일 크기를 읽기 쉬운 형태로 포맷"""
        if size_bytes == 0:
            return "0B"
        
        size_names = ["B", "KB", "MB", "GB", "TB"]
        i = 0
        
        while size_bytes >= 1024 and i < len(size_names) - 1:
            size_bytes /= 1024.0
            i += 1
        
        return f"{size_bytes:.1f}{size_names[i]}"
    
    @staticmethod
    def safe_filename(filename: str) -> str:
        """안전한 파일명 생성"""
        # 위험한 문자 제거
        safe_chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-_"
        safe_name = ''.join(c for c in filename if c in safe_chars)
        
        # 길이 제한
        if len(safe_name) > 255:
            name, ext = os.path.splitext(safe_name)
            safe_name = name[:255-len(ext)] + ext
        
        # 빈 파일명 처리
        if not safe_name:
            safe_name = f"file_{uuid.uuid4().hex[:8]}"
        
        return safe_name
    
    @staticmethod
    def read_file_safely(file_path: Union[str, Path], max_size: int = 10 * 1024 * 1024) -> Optional[str]:
        """안전한 파일 읽기 (크기 제한)"""
        path = Path(file_path)
        
        if not path.exists() or not path.is_file():
            return None
        
        if path.stat().st_size > max_size:
            raise ValueError(f"File too large: {path.stat().st_size} bytes (max: {max_size})")
        
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return f.read()
        except UnicodeDecodeError:
            # 바이너리 파일인 경우
            with open(path, 'rb') as f:
                return base64.b64encode(f.read()).decode('ascii')
    
    @staticmethod
    def write_file_safely(file_path: Union[str, Path], content: str, 
                         backup: bool = True) -> bool:
        """안전한 파일 쓰기 (백업 생성)"""
        path = Path(file_path)
        
        # 디렉토리 생성
        FileUtils.ensure_dir(path.parent)
        
        # 백업 생성
        if backup and path.exists():
            backup_path = path.with_suffix(f"{path.suffix}.bak")
            path.replace(backup_path)
        
        try:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        except Exception as e:
            logging.error(f"Failed to write file {path}: {e}")
            return False


class DateTimeUtils:
    """날짜/시간 유틸리티"""
    
    @staticmethod
    def now(tz: timezone = timezone.utc) -> datetime:
        """현재 시간 (타임존 포함)"""
        return datetime.now(tz)
    
    @staticmethod
    def format_datetime(dt: datetime, format_str: str = '%Y-%m-%d %H:%M:%S') -> str:
        """날짜시간 포맷팅"""
        return dt.strftime(format_str)
    
    @staticmethod
    def parse_datetime(date_str: str, format_str: str = '%Y-%m-%d %H:%M:%S') -> Optional[datetime]:
        """문자열을 날짜시간으로 파싱"""
        try:
            return datetime.strptime(date_str, format_str)
        except ValueError:
            return None
    
    @staticmethod
    def to_timestamp(dt: datetime) -> float:
        """날짜시간을 타임스탬프로 변환"""
        return dt.timestamp()
    
    @staticmethod
    def from_timestamp(timestamp: float, tz: timezone = timezone.utc) -> datetime:
        """타임스탬프를 날짜시간으로 변환"""
        return datetime.fromtimestamp(timestamp, tz)
    
    @staticmethod
    def relative_time(dt: datetime, reference: datetime = None) -> str:
        """상대 시간 표현"""
        if reference is None:
            reference = DateTimeUtils.now(dt.tzinfo)
        
        diff = reference - dt
        seconds = diff.total_seconds()
        
        if seconds < 60:
            return f"{int(seconds)}초 전"
        elif seconds < 3600:
            return f"{int(seconds // 60)}분 전"
        elif seconds < 86400:
            return f"{int(seconds // 3600)}시간 전"
        elif seconds < 2592000:  # 30일
            return f"{int(seconds // 86400)}일 전"
        elif seconds < 31536000:  # 365일
            return f"{int(seconds // 2592000)}개월 전"
        else:
            return f"{int(seconds // 31536000)}년 전"
    
    @staticmethod
    def add_time(dt: datetime, **kwargs) -> datetime:
        """시간 더하기"""
        return dt + timedelta(**kwargs)
    
    @staticmethod
    def start_of_day(dt: datetime) -> datetime:
        """하루의 시작 시간"""
        return dt.replace(hour=0, minute=0, second=0, microsecond=0)
    
    @staticmethod
    def end_of_day(dt: datetime) -> datetime:
        """하루의 끝 시간"""
        return dt.replace(hour=23, minute=59, second=59, microsecond=999999)


class HashUtils:
    """해시 및 암호화 유틸리티"""
    
    @staticmethod
    def md5(data: Union[str, bytes]) -> str:
        """MD5 해시"""
        if isinstance(data, str):
            data = data.encode('utf-8')
        return hashlib.md5(data).hexdigest()
    
    @staticmethod
    def sha256(data: Union[str, bytes]) -> str:
        """SHA256 해시"""
        if isinstance(data, str):
            data = data.encode('utf-8')
        return hashlib.sha256(data).hexdigest()
    
    @staticmethod
    def generate_uuid() -> str:
        """UUID 생성"""
        return str(uuid.uuid4())
    
    @staticmethod
    def generate_short_id(length: int = 8) -> str:
        """짧은 ID 생성"""
        return uuid.uuid4().hex[:length]
    
    @staticmethod
    def base64_encode(data: Union[str, bytes]) -> str:
        """Base64 인코딩"""
        if isinstance(data, str):
            data = data.encode('utf-8')
        return base64.b64encode(data).decode('ascii')
    
    @staticmethod
    def base64_decode(data: str) -> bytes:
        """Base64 디코딩"""
        return base64.b64decode(data)
    
    @staticmethod
    def hash_file(file_path: Union[str, Path], algorithm: str = 'sha256') -> str:
        """파일 해시 계산"""
        hash_func = getattr(hashlib, algorithm)()
        
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_func.update(chunk)
        
        return hash_func.hexdigest()


class PerformanceUtils:
    """성능 측정 유틸리티"""
    
    @staticmethod
    def timer(func: Callable = None, *, name: str = None):
        """함수 실행 시간 측정 데코레이터"""
        def decorator(f):
            @functools.wraps(f)
            def wrapper(*args, **kwargs):
                start_time = time.perf_counter()
                try:
                    result = f(*args, **kwargs)
                    return result
                finally:
                    end_time = time.perf_counter()
                    duration = end_time - start_time
                    func_name = name or f.__name__
                    logging.info(f"Function {func_name} took {duration:.4f} seconds")
            return wrapper
        
        if func is None:
            return decorator
        else:
            return decorator(func)
    
    @staticmethod
    @contextmanager
    def measure_time(operation_name: str = "Operation"):
        """컨텍스트 매니저로 시간 측정"""
        start_time = time.perf_counter()
        try:
            yield
        finally:
            end_time = time.perf_counter()
            duration = end_time - start_time
            logging.info(f"{operation_name} took {duration:.4f} seconds")
    
    @staticmethod
    def profile_memory(func: Callable):
        """메모리 사용량 프로파일링 데코레이터"""
        try:
            import psutil
            process = psutil.Process()
        except ImportError:
            logging.warning("psutil not available, memory profiling disabled")
            return func
        
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            mem_before = process.memory_info().rss
            try:
                result = func(*args, **kwargs)
                return result
            finally:
                mem_after = process.memory_info().rss
                mem_diff = mem_after - mem_before
                logging.info(f"Function {func.__name__} memory change: {mem_diff / 1024 / 1024:.2f} MB")
        
        return wrapper
    
    @staticmethod
    def rate_limit(calls: int, period: int):
        """레이트 리미팅 데코레이터"""
        call_times = []
        lock = threading.Lock()
        
        def decorator(func):
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                with lock:
                    now = time.time()
                    
                    # 오래된 호출 기록 제거
                    while call_times and call_times[0] <= now - period:
                        call_times.pop(0)
                    
                    # 제한 확인
                    if len(call_times) >= calls:
                        raise Exception(f"Rate limit exceeded: {calls} calls per {period} seconds")
                    
                    call_times.append(now)
                
                return func(*args, **kwargs)
            
            return wrapper
        return decorator


class CoreUtils:
    """핵심 유틸리티 통합 클래스"""
    
    data = DataConverter
    file = FileUtils
    datetime = DateTimeUtils
    hash = HashUtils
    performance = PerformanceUtils
    
    @staticmethod
    def get_caller_info(depth: int = 1) -> Dict[str, Any]:
        """호출자 정보 조회"""
        import inspect
        
        frame = inspect.currentframe()
        for _ in range(depth + 1):
            frame = frame.f_back
            if frame is None:
                break
        
        if frame is None:
            return {}
        
        return {
            'filename': frame.f_code.co_filename,
            'function': frame.f_code.co_name,
            'line': frame.f_lineno,
            'locals': {k: str(v) for k, v in frame.f_locals.items() if not k.startswith('_')}
        }
    
    @staticmethod
    def retry(max_attempts: int = 3, delay: float = 1.0, backoff: float = 2.0):
        """재시도 데코레이터"""
        def decorator(func):
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                attempts = 0
                current_delay = delay
                
                while attempts < max_attempts:
                    try:
                        return func(*args, **kwargs)
                    except Exception as e:
                        attempts += 1
                        if attempts >= max_attempts:
                            raise e
                        
                        logging.warning(f"Attempt {attempts} failed for {func.__name__}: {e}")
                        time.sleep(current_delay)
                        current_delay *= backoff
                
            return wrapper
        return decorator
    
    @staticmethod
    def deprecated(reason: str = ""):
        """Deprecated 마킹 데코레이터"""
        def decorator(func):
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                logging.warning(f"Function {func.__name__} is deprecated. {reason}")
                return func(*args, **kwargs)
            return wrapper
        return decorator
    
    @staticmethod
    def singleton(cls):
        """싱글톤 패턴 데코레이터"""
        instances = {}
        lock = threading.Lock()
        
        def get_instance(*args, **kwargs):
            if cls not in instances:
                with lock:
                    if cls not in instances:
                        instances[cls] = cls(*args, **kwargs)
            return instances[cls]
        
        return get_instance
    
    @staticmethod
    def cached_property(func):
        """캐시된 프로퍼티 데코레이터"""
        cached_name = f"_cached_{func.__name__}"
        
        @functools.wraps(func)
        def wrapper(self):
            if not hasattr(self, cached_name):
                setattr(self, cached_name, func(self))
            return getattr(self, cached_name)
        
        return property(wrapper)