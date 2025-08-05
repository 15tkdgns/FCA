#!/usr/bin/env python3
"""
FCA 성능 최적화 도구
===================

프로젝트 성능을 자동으로 최적화하는 도구입니다.
"""

import os
import shutil
import gzip
import json
from pathlib import Path
import pandas as pd
import subprocess
import sys

class FCAPerformanceOptimizer:
    def __init__(self, project_root="/root/FCA"):
        self.project_root = Path(project_root)
        self.backup_dir = self.project_root / "optimization_backup"
        self.optimization_log = []
        
    def create_backup(self):
        """최적화 전 백업 생성"""
        print("📦 최적화 전 백업 생성 중...")
        
        if self.backup_dir.exists():
            shutil.rmtree(self.backup_dir)
        
        # 중요 파일들만 백업
        important_paths = [
            "fca",
            "static_dashboard", 
            "data/*.json",
            "requirements.txt",
            "README.md"
        ]
        
        self.backup_dir.mkdir(exist_ok=True)
        
        for pattern in important_paths:
            if "*" in pattern:
                for file_path in self.project_root.glob(pattern):
                    if file_path.is_file():
                        dest = self.backup_dir / file_path.relative_to(self.project_root)
                        dest.parent.mkdir(parents=True, exist_ok=True)
                        shutil.copy2(file_path, dest)
            else:
                src = self.project_root / pattern
                if src.exists():
                    if src.is_dir():
                        dest = self.backup_dir / pattern
                        shutil.copytree(src, dest)
                    else:
                        dest = self.backup_dir / pattern
                        dest.parent.mkdir(parents=True, exist_ok=True)
                        shutil.copy2(src, dest)
        
        print(f"✅ 백업 완료: {self.backup_dir}")
        self.optimization_log.append("백업 생성 완료")
    
    def optimize_data_files(self):
        """데이터 파일 최적화"""
        print("📊 데이터 파일 최적화 중...")
        
        optimized_count = 0
        saved_space_mb = 0
        
        # CSV 파일 최적화
        for csv_file in self.project_root.rglob("*.csv"):
            try:
                original_size = csv_file.stat().st_size / (1024 * 1024)
                
                # 100MB 이상 파일만 최적화
                if original_size > 100:
                    print(f"  📄 최적화 중: {csv_file.name}")
                    
                    # 압축된 버전 생성
                    compressed_file = csv_file.with_suffix('.csv.gz')
                    with open(csv_file, 'rb') as f_in:
                        with gzip.open(compressed_file, 'wb') as f_out:
                            shutil.copyfileobj(f_in, f_out)
                    
                    compressed_size = compressed_file.stat().st_size / (1024 * 1024)
                    space_saved = original_size - compressed_size
                    
                    if space_saved > 10:  # 10MB 이상 절약된 경우만
                        saved_space_mb += space_saved
                        optimized_count += 1
                        print(f"    ✅ {space_saved:.1f}MB 절약")
                        
                        # 원본을 백업으로 이동하고 압축 파일 사용
                        backup_file = csv_file.with_suffix('.csv.backup')
                        csv_file.rename(backup_file)
                        
                        self.optimization_log.append(f"{csv_file.name}: {space_saved:.1f}MB 절약")
                    else:
                        compressed_file.unlink()  # 효과 없으면 삭제
                        
            except Exception as e:
                print(f"    ❌ 최적화 실패: {e}")
        
        print(f"✅ 데이터 파일 최적화 완료: {optimized_count}개 파일, {saved_space_mb:.1f}MB 절약")
        return optimized_count, saved_space_mb
    
    def clean_unnecessary_files(self):
        """불필요한 파일 정리"""
        print("🧹 불필요한 파일 정리 중...")
        
        # 정리할 패턴들
        cleanup_patterns = [
            "**/__pycache__",
            "**/*.pyc",
            "**/*.pyo", 
            "**/.DS_Store",
            "**/Thumbs.db",
            "**/*.tmp",
            "**/*.temp",
            "**/node_modules",  # JavaScript
            "**/.pytest_cache",
            "**/htmlcov",
            "**/*.log.????-??-??",  # 오래된 로그 파일
        ]
        
        cleaned_count = 0
        cleaned_size_mb = 0
        
        for pattern in cleanup_patterns:
            for path in self.project_root.glob(pattern):
                try:
                    if path.is_file():
                        size_mb = path.stat().st_size / (1024 * 1024)
                        path.unlink()
                        cleaned_count += 1
                        cleaned_size_mb += size_mb
                    elif path.is_dir():
                        # 디렉토리 크기 계산
                        size_mb = sum(f.stat().st_size for f in path.rglob('*') if f.is_file()) / (1024 * 1024)
                        shutil.rmtree(path)
                        cleaned_count += 1
                        cleaned_size_mb += size_mb
                except Exception as e:
                    print(f"    ⚠️  정리 실패 {path}: {e}")
        
        print(f"✅ 파일 정리 완료: {cleaned_count}개 항목, {cleaned_size_mb:.1f}MB 정리")
        self.optimization_log.append(f"불필요한 파일 정리: {cleaned_count}개 항목, {cleaned_size_mb:.1f}MB")
        return cleaned_count, cleaned_size_mb
    
    def optimize_javascript_modules(self):
        """JavaScript 모듈 최적화"""
        print("📜 JavaScript 모듈 최적화 중...")
        
        js_files = list(self.project_root.rglob("*.js"))
        optimization_suggestions = []
        
        for js_file in js_files:
            try:
                with open(js_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 최적화 제안 사항 체크
                suggestions = []
                
                # console.log 과다 사용 체크
                console_count = content.count('console.log')
                if console_count > 10:
                    suggestions.append(f"console.log 과다 사용 ({console_count}개)")
                
                # 중복 코드 패턴 체크
                if 'document.getElementById' in content:
                    if content.count('document.getElementById') > 5:
                        suggestions.append("DOM 쿼리 최적화 필요")
                
                # 에러 처리 체크
                if 'try' not in content and 'catch' not in content and len(content) > 1000:
                    suggestions.append("에러 처리 부족")
                
                if suggestions:
                    optimization_suggestions.append({
                        'file': str(js_file.relative_to(self.project_root)),
                        'suggestions': suggestions
                    })
                    
            except Exception as e:
                continue
        
        print(f"✅ JavaScript 분석 완료: {len(optimization_suggestions)}개 파일에서 개선사항 발견")
        return optimization_suggestions
    
    def optimize_python_imports(self):
        """Python import 최적화"""
        print("🐍 Python import 최적화 중...")
        
        optimized_files = 0
        
        for py_file in self.project_root.rglob("*.py"):
            try:
                with open(py_file, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                
                # 사용되지 않는 import 검사 (간단한 휴리스틱)
                imports = []
                code_lines = []
                optimized = False
                
                for line in lines:
                    if line.strip().startswith(('import ', 'from ')):
                        imports.append(line)
                    else:
                        code_lines.append(line)
                
                # 간단한 최적화: 중복 import 제거
                unique_imports = []
                seen_imports = set()
                
                for imp in imports:
                    if imp.strip() not in seen_imports:
                        unique_imports.append(imp)
                        seen_imports.add(imp.strip())
                    else:
                        optimized = True
                
                if optimized:
                    # 파일 다시 쓰기
                    with open(py_file, 'w', encoding='utf-8') as f:
                        f.writelines(unique_imports)
                        f.writelines(code_lines)
                    
                    optimized_files += 1
                    
            except Exception as e:
                continue
        
        print(f"✅ Python import 최적화 완료: {optimized_files}개 파일 최적화")
        self.optimization_log.append(f"Python import 최적화: {optimized_files}개 파일")
        return optimized_files
    
    def generate_performance_script(self):
        """성능 모니터링 스크립트 생성"""
        print("📈 성능 모니터링 스크립트 생성 중...")
        
        monitoring_script = '''#!/usr/bin/env python3
"""
FCA 성능 모니터링 스크립트
========================
"""

import psutil
import time
import json
from datetime import datetime
import os

class FCAPerformanceMonitor:
    def __init__(self):
        self.metrics = []
        
    def collect_system_metrics(self):
        """시스템 메트릭 수집"""
        return {
            'timestamp': datetime.now().isoformat(),
            'cpu_percent': psutil.cpu_percent(interval=1),
            'memory_percent': psutil.virtual_memory().percent,
            'disk_usage': psutil.disk_usage('/').percent,
            'load_average': os.getloadavg() if hasattr(os, 'getloadavg') else [0, 0, 0]
        }
    
    def monitor_dashboard_performance(self, duration_seconds=60):
        """대시보드 성능 모니터링"""
        print(f"🔍 {duration_seconds}초간 성능 모니터링 시작...")
        
        start_time = time.time()
        while time.time() - start_time < duration_seconds:
            metrics = self.collect_system_metrics()
            self.metrics.append(metrics)
            time.sleep(5)  # 5초마다 수집
        
        # 결과 저장
        with open('performance_metrics.json', 'w') as f:
            json.dump(self.metrics, f, indent=2)
        
        # 요약 출력
        avg_cpu = sum(m['cpu_percent'] for m in self.metrics) / len(self.metrics)
        avg_memory = sum(m['memory_percent'] for m in self.metrics) / len(self.metrics)
        
        print(f"📊 평균 CPU 사용률: {avg_cpu:.1f}%")
        print(f"📊 평균 메모리 사용률: {avg_memory:.1f}%")
        
        return self.metrics

if __name__ == "__main__":
    monitor = FCAPerformanceMonitor()
    monitor.monitor_dashboard_performance(60)
'''
        
        script_path = self.project_root / "performance_monitor.py"
        with open(script_path, 'w', encoding='utf-8') as f:
            f.write(monitoring_script)
        
        os.chmod(script_path, 0o755)
        print(f"✅ 성능 모니터링 스크립트 생성: {script_path}")
        
    def run_optimization(self):
        """전체 최적화 실행"""
        print("🚀 FCA 성능 최적화 시작")
        print("=" * 50)
        
        start_time = time.time()
        
        # 백업 생성
        self.create_backup()
        
        # 각 최적화 실행
        print("\n1️⃣ 불필요한 파일 정리")
        cleaned_count, cleaned_size = self.clean_unnecessary_files()
        
        print("\n2️⃣ 데이터 파일 최적화")
        data_count, data_saved = self.optimize_data_files()
        
        print("\n3️⃣ Python 코드 최적화")
        python_optimized = self.optimize_python_imports()
        
        print("\n4️⃣ JavaScript 분석")
        js_suggestions = self.optimize_javascript_modules()
        
        print("\n5️⃣ 성능 모니터링 도구 생성")
        self.generate_performance_script()
        
        optimization_time = time.time() - start_time
        
        # 최적화 결과 요약
        print("\n" + "=" * 50)
        print("✅ 최적화 완료 결과")
        print("=" * 50)
        print(f"⏱️  소요 시간: {optimization_time:.2f}초")
        print(f"🧹 정리된 파일: {cleaned_count}개")
        print(f"💾 절약된 공간: {cleaned_size + data_saved:.1f}MB")
        print(f"🐍 최적화된 Python 파일: {python_optimized}개")
        print(f"📜 JavaScript 개선 제안: {len(js_suggestions)}개")
        
        if js_suggestions:
            print("\n📜 JavaScript 최적화 제안:")
            for suggestion in js_suggestions[:5]:  # 상위 5개만 출력
                print(f"   📄 {suggestion['file']}")
                for s in suggestion['suggestions']:
                    print(f"      • {s}")
        
        # 로그 저장
        log_data = {
            'optimization_time': optimization_time,
            'cleaned_files': cleaned_count,
            'space_saved_mb': cleaned_size + data_saved,
            'python_files_optimized': python_optimized,
            'javascript_suggestions': js_suggestions,
            'optimization_log': self.optimization_log
        }
        
        with open(self.project_root / 'optimization_results.json', 'w', encoding='utf-8') as f:
            json.dump(log_data, f, indent=2, ensure_ascii=False)
        
        print(f"\n📁 상세 로그: {self.project_root}/optimization_results.json")
        print(f"📦 백업 위치: {self.backup_dir}")

if __name__ == "__main__":
    optimizer = FCAPerformanceOptimizer()
    optimizer.run_optimization()