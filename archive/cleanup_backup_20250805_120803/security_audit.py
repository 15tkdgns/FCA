#!/usr/bin/env python3
"""
FCA 보안 및 코드 품질 감사 도구
==============================

프로젝트의 보안 취약점과 코드 품질 이슈를 체크합니다.
"""

import os
import re
import json
import hashlib
from pathlib import Path
from collections import defaultdict
import ast
import tokenize
import io

class FCASecurityAuditor:
    def __init__(self, project_root="/root/FCA"):
        self.project_root = Path(project_root)
        self.security_issues = []
        self.code_quality_issues = []
        self.findings = {
            'critical': [],
            'high': [],
            'medium': [],
            'low': [],
            'info': []
        }
        
        # 보안 패턴 정의
        self.security_patterns = {
            'hardcoded_secrets': [
                (r'password\s*=\s*["\'][^"\']{3,}["\']', 'Hardcoded password'),
                (r'api_key\s*=\s*["\'][^"\']{10,}["\']', 'Hardcoded API key'),
                (r'secret_key\s*=\s*["\'][^"\']{10,}["\']', 'Hardcoded secret key'),
                (r'token\s*=\s*["\'][^"\']{10,}["\']', 'Hardcoded token'),
                (r'private_key\s*=\s*["\'][^"\']{10,}["\']', 'Hardcoded private key'),
            ],
            'dangerous_functions': [
                (r'eval\s*\(', 'Dangerous eval() usage'),
                (r'exec\s*\(', 'Dangerous exec() usage'),
                (r'subprocess\.call.*shell=True', 'Shell injection risk'),
                (r'os\.system\s*\(', 'Command injection risk'),
                (r'pickle\.load\s*\(', 'Unsafe deserialization'),
            ],
            'sql_injection': [
                (r'execute\s*\(["\'].*%.*["\']', 'Potential SQL injection'),
                (r'query\s*=.*%.*', 'String formatting in SQL query'),
                (r'SELECT.*\+.*', 'SQL concatenation detected'),
            ],
            'xss_vulnerabilities': [
                (r'innerHTML\s*=.*\+', 'Potential XSS vulnerability'),
                (r'document\.write\s*\(.*\+', 'XSS via document.write'),
                (r'\.html\s*\(.*\+', 'Potential XSS in HTML injection'),
            ]
        }
    
    def scan_python_files(self):
        """Python 파일 보안 스캔"""
        print("🐍 Python 파일 보안 스캔 중...")
        
        python_files = list(self.project_root.rglob("*.py"))
        scanned_count = 0
        
        for py_file in python_files:
            try:
                with open(py_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 보안 패턴 검사
                self._check_security_patterns(py_file, content, 'python')
                
                # AST 기반 정적 분석
                self._analyze_python_ast(py_file, content)
                
                # 코드 품질 검사
                self._check_python_quality(py_file, content)
                
                scanned_count += 1
                
            except Exception as e:
                self._add_finding('low', py_file, f"파일 스캔 실패: {e}")
        
        print(f"✅ Python 파일 스캔 완료: {scanned_count}개 파일")
        
    def scan_javascript_files(self):
        """JavaScript 파일 보안 스캔"""
        print("📜 JavaScript 파일 보안 스캔 중...")
        
        js_files = list(self.project_root.rglob("*.js"))
        scanned_count = 0
        
        for js_file in js_files:
            try:
                with open(js_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 보안 패턴 검사
                self._check_security_patterns(js_file, content, 'javascript')
                
                # JavaScript 특화 검사
                self._check_javascript_security(js_file, content)
                
                scanned_count += 1
                
            except Exception as e:
                self._add_finding('low', js_file, f"파일 스캔 실패: {e}")
        
        print(f"✅ JavaScript 파일 스캔 완료: {scanned_count}개 파일")
    
    def scan_config_files(self):
        """설정 파일 보안 스캔"""
        print("⚙️ 설정 파일 보안 스캔 중...")
        
        config_patterns = ['*.json', '*.yaml', '*.yml', '*.toml', '*.ini', '*.env*']
        scanned_count = 0
        
        for pattern in config_patterns:
            for config_file in self.project_root.rglob(pattern):
                try:
                    with open(config_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # 민감한 정보 검사
                    self._check_sensitive_data(config_file, content)
                    
                    # 파일 권한 검사
                    self._check_file_permissions(config_file)
                    
                    scanned_count += 1
                    
                except Exception as e:
                    self._add_finding('low', config_file, f"설정 파일 스캔 실패: {e}")
        
        print(f"✅ 설정 파일 스캔 완료: {scanned_count}개 파일")
    
    def _check_security_patterns(self, file_path, content, file_type):
        """보안 패턴 검사"""
        for category, patterns in self.security_patterns.items():
            for pattern, description in patterns:
                matches = re.finditer(pattern, content, re.IGNORECASE | re.MULTILINE)
                for match in matches:
                    line_num = content[:match.start()].count('\n') + 1
                    self._add_finding('high', file_path, f"{description} (라인 {line_num})")
    
    def _analyze_python_ast(self, file_path, content):
        """Python AST 기반 분석"""
        try:
            tree = ast.parse(content)
            
            for node in ast.walk(tree):
                # 위험한 함수 호출 검사
                if isinstance(node, ast.Call):
                    if isinstance(node.func, ast.Name):
                        if node.func.id in ['eval', 'exec']:
                            self._add_finding('critical', file_path, f"위험한 함수 사용: {node.func.id}")
                
                # 하드코딩된 비밀번호 검사
                if isinstance(node, ast.Assign):
                    for target in node.targets:
                        if isinstance(target, ast.Name) and 'password' in target.id.lower():
                            if isinstance(node.value, ast.Str) and len(node.value.s) > 3:
                                self._add_finding('high', file_path, f"하드코딩된 비밀번호: {target.id}")
                                
        except SyntaxError:
            self._add_finding('medium', file_path, "Python 구문 오류")
        except Exception as e:
            pass
    
    def _check_python_quality(self, file_path, content):
        """Python 코드 품질 검사"""
        lines = content.split('\n')
        
        # 긴 함수 검사
        in_function = False
        function_lines = 0
        function_name = ""
        
        for i, line in enumerate(lines):
            if line.strip().startswith('def '):
                in_function = True
                function_lines = 1
                function_name = line.strip().split('(')[0].replace('def ', '')
            elif in_function:
                if line.strip() and not line.startswith(' ') and not line.startswith('\t'):
                    if function_lines > 50:
                        self._add_finding('medium', file_path, f"긴 함수: {function_name} ({function_lines}줄)")
                    in_function = False
                    function_lines = 0
                else:
                    function_lines += 1
        
        # TODO 주석 검사
        todo_count = content.lower().count('todo')
        if todo_count > 10:
            self._add_finding('low', file_path, f"TODO 주석 과다: {todo_count}개")
        
        # 중복 import 검사
        imports = re.findall(r'^import\s+(.+)$', content, re.MULTILINE)
        from_imports = re.findall(r'^from\s+(.+)\s+import', content, re.MULTILINE)
        
        if len(imports) != len(set(imports)):
            self._add_finding('low', file_path, "중복 import 발견")
    
    def _check_javascript_security(self, file_path, content):
        """JavaScript 보안 검사"""
        # DOM 기반 XSS 검사
        dom_patterns = [
            r'innerHTML\s*=.*\+',
            r'outerHTML\s*=.*\+',
            r'document\.write\s*\(',
            r'\.html\s*\(.*\+'
        ]
        
        for pattern in dom_patterns:
            if re.search(pattern, content):
                self._add_finding('high', file_path, f"잠재적 XSS 취약점: {pattern}")
        
        # 안전하지 않은 eval 사용
        if 'eval(' in content:
            self._add_finding('critical', file_path, "eval() 사용 - 코드 인젝션 위험")
        
        # console.log 과다 사용 (운영 환경)
        console_count = content.count('console.log')
        if console_count > 20:
            self._add_finding('low', file_path, f"console.log 과다 사용: {console_count}개")
    
    def _check_sensitive_data(self, file_path, content):
        """민감한 데이터 검사"""
        sensitive_patterns = [
            (r'["\'][A-Za-z0-9]{20,}["\']', '의심스러운 긴 토큰/키'),
            (r'["\']sk_[a-zA-Z0-9]{20,}["\']', 'Stripe secret key'),
            (r'["\']pk_[a-zA-Z0-9]{20,}["\']', 'Stripe public key'),
            (r'["\'][0-9a-f]{32}["\']', '의심스러운 MD5 해시'),
            (r'mongodb://[^"\']*:[^"\']*@', 'MongoDB 연결 문자열'),
            (r'postgres://[^"\']*:[^"\']*@', 'PostgreSQL 연결 문자열'),
        ]
        
        for pattern, description in sensitive_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                self._add_finding('high', file_path, f"민감한 데이터 노출: {description}")
    
    def _check_file_permissions(self, file_path):
        """파일 권한 검사"""
        try:
            stat_info = file_path.stat()
            permissions = oct(stat_info.st_mode)[-3:]
            
            # 너무 관대한 권한 (777, 666 등)
            if permissions in ['777', '666', '755'] and file_path.suffix in ['.json', '.yml', '.yaml']:
                self._add_finding('medium', file_path, f"위험한 파일 권한: {permissions}")
                
        except Exception:
            pass
    
    def _add_finding(self, severity, file_path, description):
        """발견사항 추가"""
        finding = {
            'file': str(file_path.relative_to(self.project_root)),
            'description': description,
            'severity': severity
        }
        self.findings[severity].append(finding)
    
    def generate_dependency_report(self):
        """의존성 보안 리포트"""
        print("📦 의존성 보안 검사 중...")
        
        # requirements.txt 체크
        req_file = self.project_root / 'requirements.txt'
        if req_file.exists():
            try:
                with open(req_file, 'r') as f:
                    requirements = f.read()
                
                # 버전 명시되지 않은 패키지
                unversioned = re.findall(r'^([a-zA-Z0-9_-]+)$', requirements, re.MULTILINE)
                for pkg in unversioned:
                    self._add_finding('medium', req_file, f"버전 미명시 패키지: {pkg}")
                
                # 알려진 취약한 패키지 (예시)
                vulnerable_packages = ['pickle', 'yaml']  # 실제로는 더 많은 패키지 목록 필요
                for pkg in vulnerable_packages:
                    if pkg in requirements:
                        self._add_finding('high', req_file, f"잠재적 취약 패키지: {pkg}")
                        
            except Exception as e:
                self._add_finding('low', req_file, f"의존성 파일 분석 실패: {e}")
    
    def generate_report(self):
        """보안 감사 리포트 생성"""
        print("\n📋 보안 감사 리포트 생성 중...")
        
        total_findings = sum(len(findings) for findings in self.findings.values())
        
        report = {
            'scan_summary': {
                'total_findings': total_findings,
                'critical': len(self.findings['critical']),
                'high': len(self.findings['high']),
                'medium': len(self.findings['medium']),
                'low': len(self.findings['low']),
                'info': len(self.findings['info'])
            },
            'findings_by_severity': self.findings,
            'recommendations': []
        }
        
        # 권장사항 생성
        if self.findings['critical']:
            report['recommendations'].append("🚨 즉시 조치 필요: Critical 이슈들을 최우선으로 해결하세요")
        
        if self.findings['high']:
            report['recommendations'].append("⚠️ 높은 우선순위: High 이슈들을 빠른 시일 내에 해결하세요")
        
        if len(self.findings['medium']) > 10:
            report['recommendations'].append("📊 Medium 이슈가 많습니다. 코드 리뷰 프로세스 강화를 고려하세요")
        
        report['recommendations'].extend([
            "🔐 정기적인 보안 스캔 자동화 구축",
            "📚 개발팀 보안 교육 실시",
            "🛡️ 의존성 취약점 모니터링 시스템 구축",
            "🔍 코드 리뷰 시 보안 체크리스트 적용"
        ])
        
        return report
    
    def run_full_audit(self):
        """전체 보안 감사 실행"""
        print("🔒 FCA 보안 감사 시작")
        print("=" * 50)
        
        # 각 스캔 실행
        self.scan_python_files()
        self.scan_javascript_files()
        self.scan_config_files()
        self.generate_dependency_report()
        
        # 리포트 생성
        report = self.generate_report()
        
        # 결과 출력
        print("\n📊 보안 감사 결과")
        print("=" * 50)
        print(f"🔍 총 발견사항: {report['scan_summary']['total_findings']}개")
        print(f"🚨 Critical: {report['scan_summary']['critical']}개")
        print(f"⚠️ High: {report['scan_summary']['high']}개")
        print(f"📊 Medium: {report['scan_summary']['medium']}개")
        print(f"ℹ️ Low: {report['scan_summary']['low']}개")
        
        # 주요 이슈 출력
        if self.findings['critical']:
            print("\n🚨 Critical 이슈:")
            for finding in self.findings['critical'][:5]:
                print(f"   📄 {finding['file']}: {finding['description']}")
        
        if self.findings['high']:
            print("\n⚠️ High 이슈:")
            for finding in self.findings['high'][:5]:
                print(f"   📄 {finding['file']}: {finding['description']}")
        
        # 권장사항 출력
        print("\n💡 주요 권장사항:")
        for rec in report['recommendations'][:5]:
            print(f"   • {rec}")
        
        # JSON 파일로 저장
        output_file = self.project_root / 'security_audit_report.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"\n📁 상세 리포트: {output_file}")
        
        return report

if __name__ == "__main__":
    auditor = FCASecurityAuditor()
    auditor.run_full_audit()