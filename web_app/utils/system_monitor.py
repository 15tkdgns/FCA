#!/usr/bin/env python3
"""
System Monitor
==============

FCA 웹 애플리케이션의 시스템 모니터링 및 성능 추적
- 시스템 성능 메트릭 수집
- API 요청 추적 및 분석
- 에러 발생률 모니터링
- 자동 알림 및 경고 시스템
"""

import time
import psutil
import threading
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from collections import defaultdict, deque
from dataclasses import dataclass
import json

from core.logging_manager import get_logger

logger = get_logger("SystemMonitor")


@dataclass
class MetricSnapshot:
    """시스템 메트릭 스냅샷"""
    timestamp: datetime
    cpu_percent: float
    memory_percent: float
    disk_usage: float
    network_io: Dict[str, int]
    active_connections: int


@dataclass
class APIRequestMetric:
    """API 요청 메트릭"""
    endpoint: str
    method: str
    status_code: int
    duration_ms: float
    timestamp: datetime
    error_message: Optional[str] = None


class SystemMonitor:
    """
    시스템 모니터링 클래스
    
    주요 기능:
    - 실시간 시스템 리소스 모니터링
    - API 요청/응답 성능 추적
    - 에러 발생률 분석
    - 알림 및 경고 시스템
    - 성능 트렌드 분석
    """
    
    def __init__(self, monitoring_interval: int = 60):
        """
        SystemMonitor 초기화
        
        Args:
            monitoring_interval: 모니터링 간격 (초)
        """
        self.monitoring_interval = monitoring_interval
        self.is_monitoring = False
        self.monitor_thread = None
        
        # 메트릭 저장소 (최대 1440개 = 24시간 분량)
        self.system_metrics = deque(maxlen=1440)
        self.api_metrics = deque(maxlen=10000)
        
        # 실시간 통계
        self.current_stats = {
            'total_requests': 0,
            'error_count': 0,
            'avg_response_time': 0.0,
            'last_error': None,
            'uptime_start': datetime.now()
        }
        
        # 엔드포인트별 통계
        self.endpoint_stats = defaultdict(lambda: {
            'count': 0,
            'errors': 0,
            'total_duration': 0.0,
            'avg_duration': 0.0,
            'last_request': None
        })
        
        # 경고 임계값
        self.thresholds = {
            'cpu_percent': 80.0,
            'memory_percent': 85.0,
            'disk_usage': 90.0,
            'error_rate': 5.0,  # 5% 이상
            'response_time': 5000.0  # 5초 이상
        }
        
        # 알림 기록 (스팸 방지)
        self.alert_history = deque(maxlen=100)
        
    def start_monitoring(self):
        """시스템 모니터링 시작"""
        if self.is_monitoring:
            logger.warning("Monitoring is already running")
            return
            
        self.is_monitoring = True
        self.monitor_thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self.monitor_thread.start()
        logger.info("🟢 System monitoring started")
        
    def stop_monitoring(self):
        """시스템 모니터링 중지"""
        if not self.is_monitoring:
            return
            
        self.is_monitoring = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=5)
        logger.info("🔴 System monitoring stopped")
        
    def _monitor_loop(self):
        """모니터링 메인 루프"""
        while self.is_monitoring:
            try:
                # 시스템 메트릭 수집
                snapshot = self._collect_system_metrics()
                self.system_metrics.append(snapshot)
                
                # 경고 확인
                self._check_alerts(snapshot)
                
                # 통계 업데이트
                self._update_statistics()
                
                time.sleep(self.monitoring_interval)
                
            except Exception as e:
                logger.error(f"Monitoring loop error: {e}")
                time.sleep(5)  # 에러 시 짧은 대기
                
    def _collect_system_metrics(self) -> MetricSnapshot:
        """시스템 메트릭 수집"""
        try:
            # CPU 사용률
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # 메모리 사용률
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            
            # 디스크 사용률
            disk = psutil.disk_usage('/')
            disk_usage = (disk.used / disk.total) * 100
            
            # 네트워크 I/O
            network = psutil.net_io_counters()
            network_io = {
                'bytes_sent': network.bytes_sent,
                'bytes_recv': network.bytes_recv,
                'packets_sent': network.packets_sent,
                'packets_recv': network.packets_recv
            }
            
            # 활성 연결 수
            try:
                connections = len(psutil.net_connections())
            except (psutil.AccessDenied, psutil.NoSuchProcess):
                connections = 0
                
            return MetricSnapshot(
                timestamp=datetime.now(),
                cpu_percent=cpu_percent,
                memory_percent=memory_percent,
                disk_usage=disk_usage,
                network_io=network_io,
                active_connections=connections
            )
            
        except Exception as e:
            logger.error(f"Failed to collect system metrics: {e}")
            # 기본값 반환
            return MetricSnapshot(
                timestamp=datetime.now(),
                cpu_percent=0.0,
                memory_percent=0.0,
                disk_usage=0.0,
                network_io={},
                active_connections=0
            )
            
    def track_api_request(self, endpoint: str, method: str, status_code: int, 
                         duration_ms: float, error_message: Optional[str] = None):
        """API 요청 추적"""
        try:
            metric = APIRequestMetric(
                endpoint=endpoint,
                method=method,
                status_code=status_code,
                duration_ms=duration_ms,
                timestamp=datetime.now(),
                error_message=error_message
            )
            
            self.api_metrics.append(metric)
            
            # 실시간 통계 업데이트
            self.current_stats['total_requests'] += 1
            
            if status_code >= 400:
                self.current_stats['error_count'] += 1
                self.current_stats['last_error'] = error_message
                
            # 엔드포인트별 통계 업데이트
            endpoint_stat = self.endpoint_stats[endpoint]
            endpoint_stat['count'] += 1
            endpoint_stat['total_duration'] += duration_ms
            endpoint_stat['avg_duration'] = endpoint_stat['total_duration'] / endpoint_stat['count']
            endpoint_stat['last_request'] = datetime.now()
            
            if status_code >= 400:
                endpoint_stat['errors'] += 1
                
            logger.debug(f"📊 API request tracked: {method} {endpoint} - {status_code} ({duration_ms:.1f}ms)")
            
        except Exception as e:
            logger.error(f"Failed to track API request: {e}")
            
    def _check_alerts(self, snapshot: MetricSnapshot):
        """경고 조건 확인 및 알림"""
        alerts = []
        
        # CPU 사용률 확인
        if snapshot.cpu_percent > self.thresholds['cpu_percent']:
            alerts.append(f"🔥 High CPU usage: {snapshot.cpu_percent:.1f}%")
            
        # 메모리 사용률 확인
        if snapshot.memory_percent > self.thresholds['memory_percent']:
            alerts.append(f"🧠 High memory usage: {snapshot.memory_percent:.1f}%")
            
        # 디스크 사용률 확인
        if snapshot.disk_usage > self.thresholds['disk_usage']:
            alerts.append(f"💾 High disk usage: {snapshot.disk_usage:.1f}%")
            
        # 에러율 확인
        if self.current_stats['total_requests'] > 10:  # 최소 10개 요청 후
            error_rate = (self.current_stats['error_count'] / self.current_stats['total_requests']) * 100
            if error_rate > self.thresholds['error_rate']:
                alerts.append(f"⚠️ High error rate: {error_rate:.1f}%")
                
        # 응답시간 확인
        if self.current_stats['avg_response_time'] > self.thresholds['response_time']:
            alerts.append(f"🐌 High response time: {self.current_stats['avg_response_time']:.1f}ms")
            
        # 알림 발송
        for alert in alerts:
            self._send_alert(alert)
            
    def _send_alert(self, message: str):
        """경고 알림 발송"""
        # 중복 알림 방지 (같은 메시지를 5분 내에 다시 보내지 않음)
        now = datetime.now()
        recent_alerts = [
            alert for alert in self.alert_history 
            if now - alert['timestamp'] < timedelta(minutes=5)
        ]
        
        if any(alert['message'] == message for alert in recent_alerts):
            return
            
        # 알림 기록
        alert_record = {
            'message': message,
            'timestamp': now
        }
        self.alert_history.append(alert_record)
        
        # 로그에 경고 출력
        logger.warning(f"ALERT: {message}")
        
        # TODO: 실제 환경에서는 이메일, Slack, 웹훅 등으로 알림 발송
        
    def _update_statistics(self):
        """통계 업데이트"""
        if len(self.api_metrics) > 0:
            # 평균 응답시간 계산
            recent_metrics = [
                metric for metric in self.api_metrics 
                if datetime.now() - metric.timestamp < timedelta(minutes=5)
            ]
            
            if recent_metrics:
                total_duration = sum(metric.duration_ms for metric in recent_metrics)
                self.current_stats['avg_response_time'] = total_duration / len(recent_metrics)
                
    def get_system_health(self) -> Dict[str, Any]:
        """시스템 건강 상태 조회"""
        try:
            if not self.system_metrics:
                # 메트릭이 없으면 현재 시스템 상태를 즉시 수집
                snapshot = self._collect_system_metrics()
                self.system_metrics.append(snapshot)
                
            latest = self.system_metrics[-1]
            uptime = datetime.now() - self.current_stats['uptime_start']
            
            # 전체 상태 판단
            status = 'healthy'
            issues = []
            
            if latest.cpu_percent > self.thresholds['cpu_percent']:
                status = 'warning'
                issues.append('High CPU usage')
                
            if latest.memory_percent > self.thresholds['memory_percent']:
                status = 'warning'
                issues.append('High memory usage')
                
            if self.current_stats['total_requests'] > 10:
                error_rate = (self.current_stats['error_count'] / self.current_stats['total_requests']) * 100
                if error_rate > self.thresholds['error_rate']:
                    status = 'critical'
                    issues.append('High error rate')
                    
            return {
                'status': status,
                'issues': issues,
                'metrics': {
                    'cpu_percent': latest.cpu_percent,
                    'memory_percent': latest.memory_percent,
                    'disk_usage': latest.disk_usage,
                    'active_connections': latest.active_connections,
                    'uptime_seconds': int(uptime.total_seconds()),
                    'total_requests': self.current_stats['total_requests'],
                    'error_count': self.current_stats['error_count'],
                    'avg_response_time': self.current_stats['avg_response_time']
                },
                'timestamp': latest.timestamp.isoformat()
            }
        except Exception as e:
            logger.error(f"Error getting system health: {e}")
            return {
                'status': 'error',
                'issues': [f'Monitoring system error: {str(e)}'],
                'metrics': {
                    'cpu_percent': 0.0,
                    'memory_percent': 0.0,
                    'disk_usage': 0.0,
                    'active_connections': 0,
                    'uptime_seconds': 0,
                    'total_requests': self.current_stats.get('total_requests', 0),
                    'error_count': self.current_stats.get('error_count', 0),
                    'avg_response_time': self.current_stats.get('avg_response_time', 0.0)
                },
                'timestamp': datetime.now().isoformat()
            }
        
    def get_api_statistics(self) -> Dict[str, Any]:
        """API 통계 조회"""
        return {
            'total_requests': self.current_stats['total_requests'],
            'error_count': self.current_stats['error_count'],
            'error_rate': (self.current_stats['error_count'] / max(self.current_stats['total_requests'], 1)) * 100,
            'avg_response_time': self.current_stats['avg_response_time'],
            'endpoints': dict(self.endpoint_stats),
            'last_error': self.current_stats['last_error'],
            'uptime_start': self.current_stats['uptime_start'].isoformat()
        }
        
    def get_performance_trends(self, hours: int = 24) -> Dict[str, List]:
        """성능 트렌드 분석"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        # 시스템 메트릭 트렌드
        recent_system = [
            metric for metric in self.system_metrics 
            if metric.timestamp > cutoff_time
        ]
        
        # API 메트릭 트렌드
        recent_api = [
            metric for metric in self.api_metrics
            if metric.timestamp > cutoff_time
        ]
        
        return {
            'system_metrics': [
                {
                    'timestamp': metric.timestamp.isoformat(),
                    'cpu_percent': metric.cpu_percent,
                    'memory_percent': metric.memory_percent,
                    'disk_usage': metric.disk_usage,
                    'active_connections': metric.active_connections
                }
                for metric in recent_system
            ],
            'api_metrics': [
                {
                    'timestamp': metric.timestamp.isoformat(),
                    'endpoint': metric.endpoint,
                    'duration_ms': metric.duration_ms,
                    'status_code': metric.status_code
                }
                for metric in recent_api
            ]
        }
        
    def reset_statistics(self):
        """통계 초기화"""
        self.current_stats = {
            'total_requests': 0,
            'error_count': 0,
            'avg_response_time': 0.0,
            'last_error': None,
            'uptime_start': datetime.now()
        }
        self.endpoint_stats.clear()
        logger.info("📊 Statistics reset")


# 전역 모니터 인스턴스
global_monitor = SystemMonitor()


def track_request(endpoint: str, method: str, status_code: int, 
                 duration_ms: float, error_message: Optional[str] = None):
    """API 요청 추적 편의 함수"""
    global_monitor.track_api_request(endpoint, method, status_code, duration_ms, error_message)


def get_health_status() -> Dict[str, Any]:
    """시스템 건강 상태 조회 편의 함수"""
    return global_monitor.get_system_health()


def get_monitoring_stats() -> Dict[str, Any]:
    """모니터링 통계 조회 편의 함수"""
    return {
        'system_health': global_monitor.get_system_health(),
        'api_statistics': global_monitor.get_api_statistics(),
        'performance_trends': global_monitor.get_performance_trends(hours=1)  # 최근 1시간
    }