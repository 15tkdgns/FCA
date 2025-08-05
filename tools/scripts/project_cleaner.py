#!/usr/bin/env python3
"""
FCA 프로젝트 정리 도구
====================
불필요한 파일과 폴더를 식별하고 정리합니다.
"""

import os
import shutil
import json
from pathlib import Path
from collections import defaultdict
import re
from datetime import datetime

class FCAProjectCleaner:
    def __init__(self, project_root="/root/FCA"):
        self.project_root = Path(project_root)
        self.backup_dir = self.project_root / "archive" / f"cleanup_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.cleanup_report = {
            'start_time': datetime.now().isoformat(),
            'files_deleted': [],
            'directories_deleted': [],
            'files_moved': [],
            'space_saved_mb': 0,
            'summary': {}
        }
        
        # 정리 대상 패턴들
        self.cleanup_patterns = {
            'cache_files': [
                '**/__pycache__',
                '**/*.pyc',
                '**/*.pyo',
                '**/*.pyd',
                '**/.pytest_cache',
                '**/htmlcov',
                '**/.coverage',
                '**/coverage.xml'
            ],
            'system_files': [
                '**/.DS_Store',
                '**/Thumbs.db',
                '**/*.tmp',
                '**/*.temp',
                '**/*~',
                '**/*.swp',
                '**/*.swo'
            ],
            'log_files': [
                '**/*.log.*',  # 날짜별 로그 파일
                '**/logs/*.log.20*',  # 오래된 로그
            ],
            'duplicate_files': [],  # 런타임에 감지
            'empty_directories': [],  # 런타임에 감지
            'large_unnecessary_files': []  # 런타임에 감지
        }
        
        # 보존해야 할 중요 파일/폴더
        self.preserve_patterns = [
            'fca/**',
            'static_dashboard/**',
            'data/*.json',
            'requirements.txt',
            'README*.md',
            '*.py',
            'config/**',
            'docs/**'
        ]
    
    def analyze_project_structure(self):
        """프로젝트 구조 분석"""
        print("📊 프로젝트 구조 분석 중...")
        
        structure_analysis = {
            'total_files': 0,
            'total_size_mb': 0,
            'file_types': defaultdict(int),
            'large_files': [],
            'directory_sizes': {},
            'duplicate_candidates': defaultdict(list)
        }
        
        # 파일 분석
        for file_path in self.project_root.rglob('*'):
            if file_path.is_file():
                try:
                    size_mb = file_path.stat().st_size / (1024 * 1024)
                    structure_analysis['total_files'] += 1
                    structure_analysis['total_size_mb'] += size_mb
                    
                    # 파일 타입별 분류
                    suffix = file_path.suffix.lower()
                    structure_analysis['file_types'][suffix or 'no_extension'] += 1
                    
                    # 대용량 파일 (50MB 이상)
                    if size_mb > 50:
                        structure_analysis['large_files'].append({
                            'path': str(file_path.relative_to(self.project_root)),
                            'size_mb': round(size_mb, 2)
                        })
                    
                    # 중복 파일 후보 (파일명 기준)
                    filename = file_path.name.lower()
                    structure_analysis['duplicate_candidates'][filename].append(str(file_path))
                    
                except (OSError, PermissionError):
                    continue
        
        # 디렉토리 크기 분석
        for dir_path in self.project_root.rglob('*'):
            if dir_path.is_dir():
                try:
                    dir_size = sum(f.stat().st_size for f in dir_path.rglob('*') if f.is_file()) / (1024 * 1024)
                    if dir_size > 10:  # 10MB 이상만 기록
                        rel_path = str(dir_path.relative_to(self.project_root))
                        structure_analysis['directory_sizes'][rel_path] = round(dir_size, 2)
                except (OSError, PermissionError):
                    continue
        
        # 실제 중복 파일 필터링
        actual_duplicates = {k: v for k, v in structure_analysis['duplicate_candidates'].items() 
                           if len(v) > 1}
        structure_analysis['duplicate_candidates'] = actual_duplicates
        
        print(f"✅ 분석 완료: {structure_analysis['total_files']}개 파일, {structure_analysis['total_size_mb']:.1f}MB")
        return structure_analysis
    
    def identify_cleanup_targets(self):
        """정리 대상 파일들 식별"""
        print("🎯 정리 대상 식별 중...")
        
        cleanup_targets = {
            'safe_to_delete': [],
            'review_needed': [],
            'large_files': [],
            'duplicates': [],
            'empty_dirs': []
        }
        
        # 1. 캐시 및 임시 파일
        for category, patterns in self.cleanup_patterns.items():
            if category in ['cache_files', 'system_files']:
                for pattern in patterns:
                    for file_path in self.project_root.glob(pattern):
                        if file_path.exists():
                            size_mb = 0
                            if file_path.is_file():
                                size_mb = file_path.stat().st_size / (1024 * 1024)
                            elif file_path.is_dir():
                                size_mb = sum(f.stat().st_size for f in file_path.rglob('*') if f.is_file()) / (1024 * 1024)
                            
                            cleanup_targets['safe_to_delete'].append({
                                'path': str(file_path.relative_to(self.project_root)),
                                'type': category,
                                'size_mb': round(size_mb, 3)
                            })
        
        # 2. 오래된 로그 파일 (7일 이상)
        logs_dir = self.project_root / 'logs'
        if logs_dir.exists():
            for log_file in logs_dir.glob('*.log.*'):
                try:
                    mtime = datetime.fromtimestamp(log_file.stat().st_mtime)
                    age_days = (datetime.now() - mtime).days
                    if age_days > 7:
                        size_mb = log_file.stat().st_size / (1024 * 1024)
                        cleanup_targets['safe_to_delete'].append({
                            'path': str(log_file.relative_to(self.project_root)),
                            'type': 'old_log',
                            'age_days': age_days,
                            'size_mb': round(size_mb, 3)
                        })
                except (OSError, PermissionError):
                    continue
        
        # 3. 빈 디렉토리 찾기
        for dir_path in self.project_root.rglob('*'):
            if dir_path.is_dir() and dir_path != self.project_root:
                try:
                    if not any(dir_path.iterdir()):
                        cleanup_targets['empty_dirs'].append(str(dir_path.relative_to(self.project_root)))
                except (OSError, PermissionError):
                    continue
        
        # 4. 중복 파일 찾기 (더 정확한 방법)
        file_hashes = defaultdict(list)
        for file_path in self.project_root.rglob('*'):
            if file_path.is_file() and file_path.stat().st_size > 1024:  # 1KB 이상
                try:
                    # 파일 크기와 처음 1024바이트로 간단한 해시
                    with open(file_path, 'rb') as f:
                        first_chunk = f.read(1024)
                    
                    file_key = (file_path.stat().st_size, hash(first_chunk))
                    file_hashes[file_key].append(file_path)
                except (OSError, PermissionError):
                    continue
        
        for file_list in file_hashes.values():
            if len(file_list) > 1:
                # 가장 최근 파일 제외하고 나머지를 중복으로 표시
                sorted_files = sorted(file_list, key=lambda x: x.stat().st_mtime, reverse=True)
                for dup_file in sorted_files[1:]:
                    size_mb = dup_file.stat().st_size / (1024 * 1024)
                    cleanup_targets['duplicates'].append({
                        'path': str(dup_file.relative_to(self.project_root)),
                        'original': str(sorted_files[0].relative_to(self.project_root)),
                        'size_mb': round(size_mb, 3)
                    })
        
        # 5. 검토 필요한 대용량 파일
        for file_path in self.project_root.rglob('*'):
            if file_path.is_file():
                try:
                    size_mb = file_path.stat().st_size / (1024 * 1024)
                    if size_mb > 100:  # 100MB 이상
                        cleanup_targets['large_files'].append({
                            'path': str(file_path.relative_to(self.project_root)),
                            'size_mb': round(size_mb, 2),
                            'type': file_path.suffix
                        })
                except (OSError, PermissionError):
                    continue
        
        return cleanup_targets
    
    def create_selective_backup(self, targets):
        """선택적 백업 생성"""
        print(f"💾 중요 파일 백업 생성: {self.backup_dir}")
        
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        backed_up_count = 0
        
        # 보존 패턴에 해당하는 파일들만 백업
        for pattern in self.preserve_patterns:
            for file_path in self.project_root.glob(pattern):
                if file_path.is_file():
                    try:
                        rel_path = file_path.relative_to(self.project_root)
                        backup_path = self.backup_dir / rel_path
                        backup_path.parent.mkdir(parents=True, exist_ok=True)
                        shutil.copy2(file_path, backup_path)
                        backed_up_count += 1
                    except (OSError, PermissionError, shutil.Error):
                        continue
        
        print(f"✅ 백업 완료: {backed_up_count}개 파일")
        return backed_up_count
    
    def execute_cleanup(self, targets, auto_confirm=False):
        """정리 실행"""
        if not auto_confirm:
            print("\n🗑️ 정리 대상 요약:")
            print(f"  - 안전 삭제: {len(targets['safe_to_delete'])}개")
            print(f"  - 중복 파일: {len(targets['duplicates'])}개")
            print(f"  - 빈 디렉토리: {len(targets['empty_dirs'])}개")
            print(f"  - 대용량 파일: {len(targets['large_files'])}개 (검토 필요)")
            
            confirm = input("\n정리를 진행하시겠습니까? (y/N): ")
            if confirm.lower() != 'y':
                print("❌ 정리가 취소되었습니다.")
                return False
        
        total_saved_mb = 0
        
        # 1. 안전한 파일들 삭제
        print("🧹 캐시 및 임시 파일 정리 중...")
        for item in targets['safe_to_delete']:
            file_path = self.project_root / item['path']
            try:
                if file_path.exists():
                    if file_path.is_file():
                        file_path.unlink()
                        self.cleanup_report['files_deleted'].append(item['path'])
                    elif file_path.is_dir():
                        shutil.rmtree(file_path)
                        self.cleanup_report['directories_deleted'].append(item['path'])
                    
                    total_saved_mb += item['size_mb']
            except (OSError, PermissionError) as e:
                print(f"⚠️ 삭제 실패: {item['path']} - {e}")
        
        # 2. 중복 파일 삭제
        print("📋 중복 파일 정리 중...")
        for item in targets['duplicates']:
            file_path = self.project_root / item['path']
            try:
                if file_path.exists():
                    file_path.unlink()
                    self.cleanup_report['files_deleted'].append(item['path'])
                    total_saved_mb += item['size_mb']
            except (OSError, PermissionError) as e:
                print(f"⚠️ 중복 파일 삭제 실패: {item['path']} - {e}")
        
        # 3. 빈 디렉토리 삭제
        print("📁 빈 디렉토리 정리 중...")
        for dir_name in targets['empty_dirs']:
            dir_path = self.project_root / dir_name
            try:
                if dir_path.exists() and dir_path.is_dir():
                    dir_path.rmdir()
                    self.cleanup_report['directories_deleted'].append(dir_name)
            except (OSError, PermissionError) as e:
                print(f"⚠️ 빈 디렉토리 삭제 실패: {dir_name} - {e}")
        
        self.cleanup_report['space_saved_mb'] = round(total_saved_mb, 2)
        print(f"✅ 정리 완료: {total_saved_mb:.2f}MB 절약")
        
        return True
    
    def reorganize_project_structure(self):
        """프로젝트 구조 재정리"""
        print("📁 프로젝트 구조 재정리 중...")
        
        # 중복된 백업 디렉토리들 정리
        archive_dirs = list(self.project_root.glob('archive/frontend_backup_*'))
        if len(archive_dirs) > 3:  # 최신 3개만 유지
            archive_dirs.sort(key=lambda x: x.stat().st_mtime, reverse=True)
            for old_backup in archive_dirs[3:]:
                try:
                    shutil.rmtree(old_backup)
                    print(f"  ✅ 오래된 백업 삭제: {old_backup.name}")
                except Exception as e:
                    print(f"  ⚠️ 백업 삭제 실패: {old_backup.name} - {e}")
        
        # 루트 레벨의 임시 파일들 정리
        root_temp_files = [
            '*.png', '*.jpg', '*.jpeg',  # 임시 이미지
            'test_*.py', '*_test.py',    # 테스트 파일
            '*.tmp', '*.temp'            # 임시 파일
        ]
        
        moved_count = 0
        for pattern in root_temp_files:
            for file_path in self.project_root.glob(pattern):
                if file_path.is_file():
                    # tools 디렉토리로 이동 또는 삭제
                    if 'test' in file_path.name:
                        tests_dir = self.project_root / 'tests'
                        tests_dir.mkdir(exist_ok=True)
                        try:
                            shutil.move(str(file_path), tests_dir / file_path.name)
                            moved_count += 1
                        except Exception:
                            continue
                    elif file_path.suffix in ['.png', '.jpg', '.jpeg']:
                        # 이미지 파일은 적절한 위치로 이동 또는 삭제
                        if file_path.stat().st_size < 1024 * 1024:  # 1MB 미만만 삭제
                            try:
                                file_path.unlink()
                                moved_count += 1
                            except Exception:
                                continue
        
        if moved_count > 0:
            print(f"  ✅ 루트 레벨 정리: {moved_count}개 파일 처리")
        
        return moved_count
    
    def generate_cleanup_report(self):
        """정리 리포트 생성"""
        self.cleanup_report['end_time'] = datetime.now().isoformat()
        self.cleanup_report['summary'] = {
            'total_files_deleted': len(self.cleanup_report['files_deleted']),
            'total_directories_deleted': len(self.cleanup_report['directories_deleted']),
            'total_space_saved_mb': self.cleanup_report['space_saved_mb']
        }
        
        report_file = self.project_root / 'cleanup_report.json'
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(self.cleanup_report, f, indent=2, ensure_ascii=False)
        
        print(f"\n📊 정리 리포트 저장: {report_file}")
        return self.cleanup_report
    
    def run_full_cleanup(self, auto_confirm=False):
        """전체 정리 프로세스 실행"""
        print("🚀 FCA 프로젝트 정리 시작")
        print("=" * 50)
        
        # 1. 프로젝트 분석
        structure = self.analyze_project_structure()
        
        # 2. 정리 대상 식별
        targets = self.identify_cleanup_targets()
        
        # 3. 백업 생성
        self.create_selective_backup(targets)
        
        # 4. 정리 실행
        success = self.execute_cleanup(targets, auto_confirm)
        
        if success:
            # 5. 구조 재정리
            self.reorganize_project_structure()
            
            # 6. 리포트 생성
            report = self.generate_cleanup_report()
            
            print("\n✅ 프로젝트 정리 완료!")
            print(f"📊 총 절약 공간: {report['space_saved_mb']}MB")
            print(f"🗑️ 삭제된 파일: {len(report['files_deleted'])}개")
            print(f"📁 삭제된 디렉토리: {len(report['directories_deleted'])}개")
            print(f"💾 백업 위치: {self.backup_dir}")
            
            return report
        
        return None

if __name__ == "__main__":
    import sys
    
    cleaner = FCAProjectCleaner()
    
    # 명령행 인자 처리
    auto_confirm = '--auto' in sys.argv or '-y' in sys.argv
    
    if '--analyze-only' in sys.argv:
        # 분석만 실행
        structure = cleaner.analyze_project_structure()
        targets = cleaner.identify_cleanup_targets()
        
        print(f"\n📊 정리 대상 요약:")
        print(f"  - 안전 삭제: {len(targets['safe_to_delete'])}개")
        print(f"  - 중복 파일: {len(targets['duplicates'])}개")
        print(f"  - 빈 디렉토리: {len(targets['empty_dirs'])}개")
        print(f"  - 대용량 파일: {len(targets['large_files'])}개")
        
        # 예상 절약 공간
        total_savings = sum(item['size_mb'] for item in targets['safe_to_delete'])
        total_savings += sum(item['size_mb'] for item in targets['duplicates'])
        print(f"  - 예상 절약: {total_savings:.2f}MB")
        
    else:
        # 전체 정리 실행
        cleaner.run_full_cleanup(auto_confirm)