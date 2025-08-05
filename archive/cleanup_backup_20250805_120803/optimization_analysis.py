#!/usr/bin/env python3
"""
FCA 프로젝트 최적화 및 점검 도구
=====================================

프로젝트 상태를 종합적으로 분석하고 최적화 권장사항을 제공합니다.
"""

import os
import sys
import json
import subprocess
import time
from pathlib import Path
from collections import defaultdict, Counter
import re

class FCAOptimizationAnalyzer:
    def __init__(self, project_root="/root/FCA"):
        self.project_root = Path(project_root)
        self.analysis_results = {}
        
    def analyze_project_structure(self):
        """프로젝트 구조 분석"""
        print("🏗️  프로젝트 구조 분석 중...")
        
        structure = {
            'python_files': 0,
            'javascript_files': 0,
            'config_files': 0,
            'data_files': 0,
            'documentation': 0,
            'total_size_mb': 0,
            'directories': {},
            'large_files': []
        }
        
        for root, dirs, files in os.walk(self.project_root):
            rel_path = os.path.relpath(root, self.project_root)
            if rel_path == '.':
                rel_path = 'root'
                
            structure['directories'][rel_path] = len(files)
            
            for file in files:
                file_path = Path(root) / file
                file_size = file_path.stat().st_size / (1024 * 1024)  # MB
                
                # 대용량 파일 체크 (50MB 이상)
                if file_size > 50:
                    structure['large_files'].append({
                        'path': str(file_path.relative_to(self.project_root)),
                        'size_mb': round(file_size, 2)
                    })
                
                # 파일 타입별 카운트
                if file.endswith('.py'):
                    structure['python_files'] += 1
                elif file.endswith('.js'):
                    structure['javascript_files'] += 1
                elif file.endswith(('.json', '.yaml', '.yml', '.toml', '.ini')):
                    structure['config_files'] += 1
                elif file.endswith(('.csv', '.parquet', '.pkl')):
                    structure['data_files'] += 1
                elif file.endswith(('.md', '.rst', '.txt')):
                    structure['documentation'] += 1
                    
                structure['total_size_mb'] += file_size
        
        structure['total_size_mb'] = round(structure['total_size_mb'], 2)
        self.analysis_results['structure'] = structure
        return structure
    
    def analyze_performance_bottlenecks(self):
        """성능 병목 지점 분석"""
        print("⚡ 성능 병목 지점 분석 중...")
        
        bottlenecks = {
            'large_data_files': [],
            'duplicate_dependencies': [],
            'inefficient_patterns': [],
            'memory_intensive_operations': [],
            'recommendations': []
        }
        
        # 대용량 데이터 파일 검사
        for root, dirs, files in os.walk(self.project_root / 'data'):
            for file in files:
                file_path = Path(root) / file
                if file_path.exists():
                    size_mb = file_path.stat().st_size / (1024 * 1024)
                    if size_mb > 100:  # 100MB 이상
                        bottlenecks['large_data_files'].append({
                            'file': str(file_path.relative_to(self.project_root)),
                            'size_mb': round(size_mb, 2)
                        })
        
        # Python 코드 패턴 분석
        python_files = list(self.project_root.rglob("*.py"))
        for py_file in python_files[:20]:  # 첫 20개 파일만 샘플링
            try:
                with open(py_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                # 비효율적 패턴 검사
                if 'for' in content and 'append' in content:
                    if content.count('append') > 10:
                        bottlenecks['inefficient_patterns'].append({
                            'file': str(py_file.relative_to(self.project_root)),
                            'issue': 'Multiple append operations in loops'
                        })
                        
                if 'pd.read_csv' in content and 'pd.concat' in content:
                    bottlenecks['memory_intensive_operations'].append({
                        'file': str(py_file.relative_to(self.project_root)),
                        'issue': 'Large DataFrame operations detected'
                    })
            except:
                continue
        
        # 권장사항 생성
        if bottlenecks['large_data_files']:
            bottlenecks['recommendations'].append("대용량 데이터 파일은 압축하거나 청크 단위로 처리하세요")
        if bottlenecks['inefficient_patterns']:
            bottlenecks['recommendations'].append("리스트 컴프리헨션이나 벡터화 연산을 사용하세요")
        if bottlenecks['memory_intensive_operations']:
            bottlenecks['recommendations'].append("청크 단위 처리나 Dask를 고려해보세요")
            
        self.analysis_results['performance'] = bottlenecks
        return bottlenecks
    
    def analyze_code_quality(self):
        """코드 품질 및 보안 점검"""
        print("🔍 코드 품질 및 보안 점검 중...")
        
        quality = {
            'duplicated_code': [],
            'security_issues': [],
            'code_complexity': [],
            'documentation_coverage': 0,
            'test_coverage': 0,
            'recommendations': []
        }
        
        # 문서화 커버리지 체크
        python_files = list(self.project_root.rglob("*.py"))
        documented_files = 0
        
        for py_file in python_files[:50]:  # 샘플링
            try:
                with open(py_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if '"""' in content or "'''" in content:
                        documented_files += 1
                        
                    # 보안 이슈 체크
                    security_patterns = [
                        (r'password\s*=\s*["\'][^"\']+["\']', 'Hardcoded password'),
                        (r'api_key\s*=\s*["\'][^"\']+["\']', 'Hardcoded API key'),
                        (r'eval\s*\(', 'Dangerous eval() usage'),
                        (r'exec\s*\(', 'Dangerous exec() usage'),
                        (r'subprocess\.call.*shell=True', 'Shell injection risk')
                    ]
                    
                    for pattern, issue in security_patterns:
                        if re.search(pattern, content, re.IGNORECASE):
                            quality['security_issues'].append({
                                'file': str(py_file.relative_to(self.project_root)),
                                'issue': issue
                            })
            except:
                continue
        
        quality['documentation_coverage'] = round(documented_files / len(python_files) * 100, 1) if python_files else 0
        
        # 테스트 커버리지 체크
        test_files = list(self.project_root.rglob("test*.py")) + list(self.project_root.rglob("*test.py"))
        quality['test_coverage'] = round(len(test_files) / len(python_files) * 100, 1) if python_files else 0
        
        # 권장사항
        if quality['documentation_coverage'] < 50:
            quality['recommendations'].append("문서화 커버리지가 낮습니다. docstring 추가를 권장합니다")
        if quality['test_coverage'] < 30:
            quality['recommendations'].append("테스트 커버리지가 낮습니다. 단위 테스트 추가를 권장합니다")
        if quality['security_issues']:
            quality['recommendations'].append("보안 이슈가 발견되었습니다. 즉시 수정하세요")
            
        self.analysis_results['quality'] = quality
        return quality
    
    def check_dependencies(self):
        """의존성 분석"""
        print("📦 의존성 분석 중...")
        
        deps = {
            'python_packages': [],
            'javascript_packages': [],
            'outdated_packages': [],
            'security_vulnerabilities': [],
            'recommendations': []
        }
        
        # requirements.txt 체크
        req_file = self.project_root / 'requirements.txt'
        if req_file.exists():
            with open(req_file, 'r') as f:
                deps['python_packages'] = [line.strip() for line in f if line.strip() and not line.startswith('#')]
        
        # package.json 체크
        pkg_file = self.project_root / 'package.json'
        if pkg_file.exists():
            try:
                with open(pkg_file, 'r') as f:
                    pkg_data = json.load(f)
                    deps['javascript_packages'] = list(pkg_data.get('dependencies', {}).keys())
            except:
                pass
        
        self.analysis_results['dependencies'] = deps
        return deps
    
    def generate_optimization_recommendations(self):
        """최적화 권장사항 생성"""
        print("💡 최적화 권장사항 생성 중...")
        
        recommendations = {
            'immediate_actions': [],
            'performance_improvements': [],
            'code_quality_improvements': [],
            'security_enhancements': [],
            'monitoring_setup': []
        }
        
        structure = self.analysis_results.get('structure', {})
        performance = self.analysis_results.get('performance', {})
        quality = self.analysis_results.get('quality', {})
        
        # 즉시 조치 필요
        if structure.get('total_size_mb', 0) > 1000:
            recommendations['immediate_actions'].append("프로젝트 크기가 1GB를 초과합니다. 불필요한 파일 정리 필요")
        
        if quality.get('security_issues'):
            recommendations['immediate_actions'].append("보안 이슈가 발견되었습니다. 즉시 수정 필요")
        
        # 성능 개선
        if performance.get('large_data_files'):
            recommendations['performance_improvements'].append("대용량 데이터 파일 압축 또는 청크 처리 구현")
        
        if performance.get('inefficient_patterns'):
            recommendations['performance_improvements'].append("비효율적 코드 패턴 리팩토링")
        
        # 코드 품질 개선
        if quality.get('documentation_coverage', 0) < 50:
            recommendations['code_quality_improvements'].append("문서화 커버리지 향상 (현재: {}%)".format(quality.get('documentation_coverage', 0)))
        
        if quality.get('test_coverage', 0) < 30:
            recommendations['code_quality_improvements'].append("테스트 커버리지 향상 (현재: {}%)".format(quality.get('test_coverage', 0)))
        
        # 모니터링 설정
        recommendations['monitoring_setup'].extend([
            "로그 레벨 및 로테이션 정책 설정",
            "성능 메트릭 수집 시스템 구축",
            "에러 추적 및 알림 시스템 구축",
            "대시보드 헬스체크 엔드포인트 추가"
        ])
        
        self.analysis_results['recommendations'] = recommendations
        return recommendations
    
    def run_full_analysis(self):
        """전체 분석 실행"""
        print("🚀 FCA 프로젝트 최적화 분석 시작")
        print("=" * 50)
        
        start_time = time.time()
        
        # 각 분석 실행
        self.analyze_project_structure()
        self.analyze_performance_bottlenecks()
        self.analyze_code_quality()
        self.check_dependencies()
        self.generate_optimization_recommendations()
        
        analysis_time = time.time() - start_time
        
        # 결과 출력
        self.print_analysis_results()
        
        # JSON 파일로 저장
        output_file = self.project_root / 'optimization_analysis_results.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(self.analysis_results, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ 분석 완료! (소요시간: {analysis_time:.2f}초)")
        print(f"📁 상세 결과: {output_file}")
        
        return self.analysis_results
    
    def print_analysis_results(self):
        """분석 결과 출력"""
        print("\n📊 분석 결과 요약")
        print("=" * 50)
        
        # 프로젝트 구조
        structure = self.analysis_results.get('structure', {})
        print(f"📁 프로젝트 크기: {structure.get('total_size_mb', 0)}MB")
        print(f"🐍 Python 파일: {structure.get('python_files', 0)}개")
        print(f"📜 JavaScript 파일: {structure.get('javascript_files', 0)}개")
        print(f"📊 데이터 파일: {structure.get('data_files', 0)}개")
        
        # 성능
        performance = self.analysis_results.get('performance', {})
        print(f"\n⚡ 성능 이슈:")
        print(f"   대용량 파일: {len(performance.get('large_data_files', []))}개")
        print(f"   비효율적 패턴: {len(performance.get('inefficient_patterns', []))}개")
        
        # 코드 품질
        quality = self.analysis_results.get('quality', {})
        print(f"\n🔍 코드 품질:")
        print(f"   문서화 커버리지: {quality.get('documentation_coverage', 0)}%")
        print(f"   테스트 커버리지: {quality.get('test_coverage', 0)}%")
        print(f"   보안 이슈: {len(quality.get('security_issues', []))}개")
        
        # 권장사항
        recommendations = self.analysis_results.get('recommendations', {})
        print(f"\n💡 주요 권장사항:")
        for action in recommendations.get('immediate_actions', [])[:3]:
            print(f"   🚨 {action}")
        for improvement in recommendations.get('performance_improvements', [])[:3]:
            print(f"   ⚡ {improvement}")

if __name__ == "__main__":
    analyzer = FCAOptimizationAnalyzer()
    analyzer.run_full_analysis()