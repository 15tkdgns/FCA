#!/usr/bin/env python3
"""
FCA 자동화 헬스체크 시스템
=========================

프로젝트의 전반적인 상태를 자동으로 모니터링하고 리포트를 생성합니다.
"""

import os
import sys
import json
import time
import requests
import subprocess
import psutil
from datetime import datetime, timedelta
from pathlib import Path
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

class FCAHealthMonitor:
    def __init__(self, project_root="/root/FCA"):
        self.project_root = Path(project_root)
        self.config_file = self.project_root / "health_check_config.json"
        self.log_file = self.project_root / "logs" / "health_monitor.log"
        self.results_file = self.project_root / "health_check_results.json"
        
        # 로깅 설정
        self.setup_logging()
        
        # 설정 로드
        self.config = self.load_config()
        
        # 헬스 체크 결과
        self.health_status = {
            'timestamp': datetime.now().isoformat(),
            'overall_status': 'unknown',
            'checks': {},
            'alerts': [],
            'metrics': {},
            'recommendations': []
        }
    
    def setup_logging(self):
        """로깅 설정"""
        self.log_file.parent.mkdir(exist_ok=True)
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(self.log_file),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def load_config(self):
        """설정 파일 로드"""
        default_config = {
            'dashboard_url': 'http://localhost:8080',
            'api_endpoints': [
                '/api/health',
                '/api/data/fraud',
                '/api/data/sentiment'
            ],
            'thresholds': {
                'cpu_percent': 80,
                'memory_percent': 85,
                'disk_usage_percent': 90,
                'response_time_ms': 5000,
                'error_rate_percent': 5
            },
            'notification': {
                'enabled': False,
                'email': {
                    'smtp_server': 'smtp.gmail.com',
                    'smtp_port': 587,
                    'sender': '',
                    'password': '',
                    'recipients': []
                }
            },
            'schedule': {
                'interval_minutes': 15,
                'daily_report_hour': 9
            }
        }
        
        if self.config_file.exists():
            try:
                with open(self.config_file, 'r') as f:
                    config = json.load(f)
                    # 기본값과 병합
                    for key, value in default_config.items():
                        if key not in config:
                            config[key] = value
                    return config
            except Exception as e:
                self.logger.warning(f"설정 파일 로드 실패, 기본값 사용: {e}")
        
        # 기본 설정 파일 생성
        with open(self.config_file, 'w') as f:
            json.dump(default_config, f, indent=2)
        
        return default_config
    
    def check_system_resources(self):
        """시스템 리소스 체크"""
        self.logger.info("시스템 리소스 체크 중...")
        
        try:
            # CPU 사용률
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # 메모리 사용률
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            
            # 디스크 사용률
            disk = psutil.disk_usage('/')
            disk_percent = disk.percent
            
            # 로드 평균 (Linux/Unix만)
            load_avg = os.getloadavg() if hasattr(os, 'getloadavg') else [0, 0, 0]
            
            metrics = {
                'cpu_percent': cpu_percent,
                'memory_percent': memory_percent,
                'disk_percent': disk_percent,
                'load_average': load_avg[0],
                'memory_available_gb': memory.available / (1024**3),
                'disk_free_gb': disk.free / (1024**3)
            }
            
            # 임계값 체크
            status = 'healthy'
            issues = []
            
            if cpu_percent > self.config['thresholds']['cpu_percent']:
                status = 'warning'
                issues.append(f"높은 CPU 사용률: {cpu_percent}%")
            
            if memory_percent > self.config['thresholds']['memory_percent']:
                status = 'critical' if memory_percent > 95 else 'warning'
                issues.append(f"높은 메모리 사용률: {memory_percent}%")
            
            if disk_percent > self.config['thresholds']['disk_usage_percent']:
                status = 'critical' if disk_percent > 95 else 'warning'
                issues.append(f"디스크 공간 부족: {disk_percent}%")
            
            self.health_status['checks']['system_resources'] = {
                'status': status,
                'metrics': metrics,
                'issues': issues
            }
            
            # 메트릭 저장
            self.health_status['metrics'].update(metrics)
            
        except Exception as e:
            self.logger.error(f"시스템 리소스 체크 실패: {e}")
            self.health_status['checks']['system_resources'] = {
                'status': 'error',
                'error': str(e)
            }
    
    def check_dashboard_availability(self):
        """대시보드 가용성 체크"""
        self.logger.info("대시보드 가용성 체크 중...")
        
        try:
            url = self.config['dashboard_url']
            start_time = time.time()
            
            response = requests.get(url, timeout=10)
            response_time = (time.time() - start_time) * 1000  # ms
            
            status = 'healthy'
            issues = []
            
            if response.status_code != 200:
                status = 'critical'
                issues.append(f"HTTP 오류: {response.status_code}")
            
            if response_time > self.config['thresholds']['response_time_ms']:
                status = 'warning' if status == 'healthy' else status
                issues.append(f"느린 응답시간: {response_time:.0f}ms")
            
            # 응답 내용 체크
            content = response.text.lower()
            if 'error' in content or 'exception' in content:
                status = 'warning' if status == 'healthy' else status
                issues.append("페이지에 오류 메시지 포함")
            
            self.health_status['checks']['dashboard'] = {
                'status': status,
                'response_time_ms': response_time,
                'status_code': response.status_code,
                'issues': issues
            }
            
        except requests.exceptions.RequestException as e:
            self.logger.error(f"대시보드 접근 실패: {e}")
            self.health_status['checks']['dashboard'] = {
                'status': 'critical',
                'error': f"연결 실패: {str(e)}"
            }
    
    def check_data_integrity(self):
        """데이터 무결성 체크"""
        self.logger.info("데이터 무결성 체크 중...")
        
        data_files = {
            'fraud_data': self.project_root / 'data' / 'secure_performance_metrics.json',
            'dashboard_data': self.project_root / 'dashboard_data' / 'fraud_data.json',
            'static_data': self.project_root / 'static_dashboard' / 'data' / 'fraud_data.json'
        }
        
        status = 'healthy'
        issues = []
        file_stats = {}
        
        for data_type, file_path in data_files.items():
            try:
                if file_path.exists():
                    stat = file_path.stat()
                    size_mb = stat.st_size / (1024 * 1024)
                    modified = datetime.fromtimestamp(stat.st_mtime)
                    age_hours = (datetime.now() - modified).total_seconds() / 3600
                    
                    file_stats[data_type] = {
                        'exists': True,
                        'size_mb': round(size_mb, 2),
                        'modified': modified.isoformat(),
                        'age_hours': round(age_hours, 1)
                    }
                    
                    # 데이터 유효성 체크
                    if file_path.suffix == '.json':
                        with open(file_path, 'r') as f:
                            json.load(f)  # JSON 파싱 테스트
                    
                    # 데이터 신선도 체크
                    if age_hours > 24:
                        status = 'warning' if status == 'healthy' else status
                        issues.append(f"{data_type}: 24시간 이상 업데이트되지 않음")
                    
                    # 파일 크기 체크
                    if size_mb < 0.1:
                        status = 'warning' if status == 'healthy' else status
                        issues.append(f"{data_type}: 파일 크기가 너무 작음 ({size_mb}MB)")
                        
                else:
                    file_stats[data_type] = {'exists': False}
                    status = 'critical'
                    issues.append(f"{data_type}: 파일이 존재하지 않음")
                    
            except json.JSONDecodeError:
                status = 'critical'
                issues.append(f"{data_type}: JSON 형식 오류")
            except Exception as e:
                status = 'error'
                issues.append(f"{data_type}: 체크 실패 - {str(e)}")
        
        self.health_status['checks']['data_integrity'] = {
            'status': status,
            'file_stats': file_stats,
            'issues': issues
        }
    
    def check_log_files(self):
        """로그 파일 체크"""
        self.logger.info("로그 파일 체크 중...")
        
        log_dir = self.project_root / 'logs'
        status = 'healthy'
        issues = []
        log_stats = {}
        
        if log_dir.exists():
            log_files = list(log_dir.glob('*.log'))
            
            for log_file in log_files[-10:]:  # 최근 10개 파일만 체크
                try:
                    stat = log_file.stat()
                    size_mb = stat.st_size / (1024 * 1024)
                    
                    log_stats[log_file.name] = {
                        'size_mb': round(size_mb, 2),
                        'modified': datetime.fromtimestamp(stat.st_mtime).isoformat()
                    }
                    
                    # 로그 파일이 너무 큰 경우
                    if size_mb > 100:
                        status = 'warning' if status == 'healthy' else status
                        issues.append(f"{log_file.name}: 로그 파일이 너무 큼 ({size_mb}MB)")
                    
                    # 에러 로그 체크
                    if 'error' in log_file.name.lower():
                        with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read()
                            error_count = content.lower().count('error')
                            if error_count > 100:
                                status = 'warning' if status == 'healthy' else status
                                issues.append(f"{log_file.name}: 에러 로그 과다 ({error_count}개)")
                                
                except Exception as e:
                    issues.append(f"{log_file.name}: 체크 실패 - {str(e)}")
        else:
            status = 'warning'
            issues.append("로그 디렉토리가 존재하지 않음")
        
        self.health_status['checks']['log_files'] = {
            'status': status,
            'log_stats': log_stats,
            'issues': issues
        }
    
    def check_dependencies(self):
        """의존성 체크"""
        self.logger.info("의존성 체크 중...")
        
        status = 'healthy'
        issues = []
        
        # Python 의존성 체크
        req_file = self.project_root / 'requirements.txt'
        if req_file.exists():
            try:
                result = subprocess.run(
                    [sys.executable, '-m', 'pip', 'check'],
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                
                if result.returncode != 0:
                    status = 'warning'
                    issues.append(f"pip check 실패: {result.stderr}")
                    
            except subprocess.TimeoutExpired:
                status = 'warning'
                issues.append("의존성 체크 시간 초과")
            except Exception as e:
                status = 'error'
                issues.append(f"의존성 체크 실패: {str(e)}")
        
        # 중요 패키지 import 테스트
        critical_packages = ['pandas', 'numpy', 'flask', 'scikit-learn']
        import_issues = []
        
        for package in critical_packages:
            try:
                __import__(package)
            except ImportError:
                import_issues.append(package)
        
        if import_issues:
            status = 'critical'
            issues.append(f"중요 패키지 import 실패: {', '.join(import_issues)}")
        
        self.health_status['checks']['dependencies'] = {
            'status': status,
            'issues': issues,
            'missing_packages': import_issues
        }
    
    def generate_recommendations(self):
        """개선 권장사항 생성"""
        recommendations = []
        
        # 시스템 리소스 기반 권장사항
        if 'system_resources' in self.health_status['checks']:
            metrics = self.health_status['checks']['system_resources'].get('metrics', {})
            
            if metrics.get('cpu_percent', 0) > 70:
                recommendations.append("CPU 사용률이 높습니다. 프로세스 최적화를 고려하세요")
            
            if metrics.get('memory_percent', 0) > 80:
                recommendations.append("메모리 사용량이 높습니다. 메모리 리크 점검이 필요합니다")
            
            if metrics.get('disk_percent', 0) > 80:
                recommendations.append("디스크 공간이 부족합니다. 로그 정리나 데이터 압축을 고려하세요")
        
        # 대시보드 기반 권장사항
        if 'dashboard' in self.health_status['checks']:
            dashboard = self.health_status['checks']['dashboard']
            
            if dashboard.get('response_time_ms', 0) > 3000:
                recommendations.append("대시보드 응답시간이 느립니다. 캐싱이나 최적화를 고려하세요")
        
        # 데이터 무결성 기반 권장사항
        if 'data_integrity' in self.health_status['checks']:
            data_check = self.health_status['checks']['data_integrity']
            
            if data_check.get('status') == 'warning':
                recommendations.append("데이터 파일 정합성 점검이 필요합니다")
        
        # 일반적인 권장사항
        recommendations.extend([
            "정기적인 백업 수행",
            "보안 업데이트 확인",
            "모니터링 대시보드 구축",
            "자동화된 알림 시스템 설정"
        ])
        
        self.health_status['recommendations'] = recommendations[:10]  # 상위 10개만
    
    def calculate_overall_status(self):
        """전체 상태 계산"""
        statuses = []
        
        for check_name, check_result in self.health_status['checks'].items():
            status = check_result.get('status', 'unknown')
            statuses.append(status)
        
        # 상태 우선순위: critical > error > warning > healthy
        if 'critical' in statuses:
            overall = 'critical'
        elif 'error' in statuses:
            overall = 'error'  
        elif 'warning' in statuses:
            overall = 'warning'
        elif 'healthy' in statuses:
            overall = 'healthy'
        else:
            overall = 'unknown'
        
        self.health_status['overall_status'] = overall
        
        # 알림 생성
        if overall in ['critical', 'error']:
            self.health_status['alerts'].append({
                'level': overall,
                'message': f"FCA 시스템 상태: {overall.upper()}",
                'timestamp': datetime.now().isoformat()
            })
    
    def send_notification(self):
        """알림 발송"""
        if not self.config['notification']['enabled']:
            return
        
        if not self.health_status['alerts']:
            return
        
        try:
            email_config = self.config['notification']['email']
            
            # 이메일 메시지 구성
            msg = MIMEMultipart()
            msg['From'] = email_config['sender']
            msg['To'] = ', '.join(email_config['recipients'])
            msg['Subject'] = f"FCA Health Alert - {self.health_status['overall_status'].upper()}"
            
            # 메시지 본문
            body = f"""
FCA 시스템 헬스체크 알림

전체 상태: {self.health_status['overall_status'].upper()}
체크 시간: {self.health_status['timestamp']}

주요 이슈:
"""
            
            for check_name, check_result in self.health_status['checks'].items():
                if check_result.get('status') in ['critical', 'error', 'warning']:
                    body += f"\n{check_name}: {check_result.get('status', 'unknown')}"
                    for issue in check_result.get('issues', []):
                        body += f"\n  - {issue}"
            
            body += f"\n\n권장사항:\n"
            for rec in self.health_status['recommendations'][:5]:
                body += f"- {rec}\n"
            
            msg.attach(MIMEText(body, 'plain'))
            
            # SMTP 서버 연결 및 발송
            server = smtplib.SMTP(email_config['smtp_server'], email_config['smtp_port'])
            server.starttls()
            server.login(email_config['sender'], email_config['password'])
            server.send_message(msg)
            server.quit()
            
            self.logger.info("알림 이메일 발송 완료")
            
        except Exception as e:
            self.logger.error(f"알림 발송 실패: {e}")
    
    def save_results(self):
        """결과 저장"""
        try:
            with open(self.results_file, 'w', encoding='utf-8') as f:
                json.dump(self.health_status, f, indent=2, ensure_ascii=False)
            
            self.logger.info(f"헬스체크 결과 저장: {self.results_file}")
            
        except Exception as e:
            self.logger.error(f"결과 저장 실패: {e}")
    
    def run_health_check(self):
        """전체 헬스체크 실행"""
        self.logger.info("FCA 헬스체크 시작")
        
        start_time = time.time()
        
        # 각 체크 실행
        self.check_system_resources()
        self.check_dashboard_availability()
        self.check_data_integrity()
        self.check_log_files()
        self.check_dependencies()
        
        # 결과 분석
        self.generate_recommendations()
        self.calculate_overall_status()
        
        # 실행 시간 기록
        execution_time = time.time() - start_time
        self.health_status['execution_time_seconds'] = round(execution_time, 2)
        
        # 결과 저장
        self.save_results()
        
        # 알림 발송
        self.send_notification()
        
        # 결과 출력
        self.print_summary()
        
        self.logger.info(f"헬스체크 완료 (소요시간: {execution_time:.2f}초)")
        
        return self.health_status
    
    def print_summary(self):
        """결과 요약 출력"""
        print("\n🏥 FCA 헬스체크 결과")
        print("=" * 50)
        
        # 전체 상태
        status_emoji = {
            'healthy': '✅',
            'warning': '⚠️',
            'critical': '🚨',
            'error': '❌',
            'unknown': '❓'
        }
        
        overall = self.health_status['overall_status']
        print(f"전체 상태: {status_emoji.get(overall, '❓')} {overall.upper()}")
        
        # 개별 체크 결과
        print("\n📋 개별 체크 결과:")
        for check_name, result in self.health_status['checks'].items():
            status = result.get('status', 'unknown')
            emoji = status_emoji.get(status, '❓')
            print(f"  {emoji} {check_name}: {status}")
            
            # 이슈 출력
            for issue in result.get('issues', [])[:2]:
                print(f"    • {issue}")
        
        # 시스템 메트릭
        if self.health_status['metrics']:
            print(f"\n📊 시스템 메트릭:")
            metrics = self.health_status['metrics']
            print(f"  CPU: {metrics.get('cpu_percent', 0):.1f}%")
            print(f"  Memory: {metrics.get('memory_percent', 0):.1f}%")
            print(f"  Disk: {metrics.get('disk_percent', 0):.1f}%")
        
        # 권장사항
        print(f"\n💡 주요 권장사항:")
        for rec in self.health_status['recommendations'][:5]:
            print(f"  • {rec}")
        
        print(f"\n📁 상세 결과: {self.results_file}")

def main():
    """메인 실행 함수"""
    monitor = FCAHealthMonitor()
    
    if len(sys.argv) > 1:
        if sys.argv[1] == '--daemon':
            # 데몬 모드 (지속적 모니터링)
            interval = monitor.config['schedule']['interval_minutes'] * 60
            print(f"🤖 데몬 모드 시작 (체크 간격: {interval/60}분)")
            
            while True:
                try:
                    monitor.run_health_check()
                    time.sleep(interval)
                except KeyboardInterrupt:
                    print("\n데몬 모드 종료")
                    break
                except Exception as e:
                    monitor.logger.error(f"헬스체크 실행 오류: {e}")
                    time.sleep(60)  # 오류 시 1분 대기
        else:
            print("사용법: python3 automated_health_check.py [--daemon]")
    else:
        # 단일 실행
        monitor.run_health_check()

if __name__ == "__main__":
    main()