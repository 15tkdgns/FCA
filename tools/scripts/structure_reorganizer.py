#!/usr/bin/env python3
"""
FCA 프로젝트 구조 재정리 도구
============================
프로젝트 구조를 체계적으로 재정리합니다.
"""

import os
import shutil
import json
from pathlib import Path
from datetime import datetime

class FCAStructureReorganizer:
    def __init__(self, project_root="/root/FCA"):
        self.project_root = Path(project_root)
        self.reorganize_log = []
        
        # 표준 프로젝트 구조 정의
        self.target_structure = {
            'src/': {
                'description': '핵심 소스 코드',
                'subdirs': ['fca/', 'static_dashboard/']
            },
            'data/': {
                'description': '데이터 파일들',
                'subdirs': ['raw/', 'processed/', 'models/']
            },
            'tests/': {
                'description': '테스트 코드',
                'subdirs': ['unit/', 'integration/', 'e2e/']
            },
            'docs/': {
                'description': '문서 및 가이드',
                'subdirs': ['api/', 'guides/', 'reports/']
            },
            'tools/': {
                'description': '유틸리티 및 스크립트',
                'subdirs': ['scripts/', 'notebooks/', 'utilities/']
            },
            'config/': {
                'description': '설정 파일들',
                'subdirs': []
            },
            'archive/': {
                'description': '백업 및 아카이브',
                'subdirs': []
            },
            'logs/': {
                'description': '로그 파일들',
                'subdirs': []
            }
        }
        
        # 파일 분류 규칙
        self.file_classification = {
            'config_files': ['.json', '.yml', '.yaml', '.toml', '.ini', '.env'],
            'documentation': ['.md', '.rst', '.txt'],
            'python_scripts': ['.py'],
            'javascript_files': ['.js'],
            'data_files': ['.csv', '.pkl', '.parquet', '.h5'],
            'notebook_files': ['.ipynb'],
            'image_files': ['.png', '.jpg', '.jpeg', '.gif', '.svg'],
            'archive_files': ['.zip', '.tar', '.gz', '.bz2']
        }
    
    def analyze_current_structure(self):
        """현재 구조 분석"""
        print("📊 현재 프로젝트 구조 분석 중...")
        
        current_structure = {}
        root_files = []
        
        # 루트 레벨 분석
        for item in self.project_root.iterdir():
            if item.is_dir() and not item.name.startswith('.'):
                file_count = len(list(item.rglob('*')))
                current_structure[item.name] = {
                    'type': 'directory',
                    'file_count': file_count,
                    'size_mb': self._get_dir_size(item)
                }
            elif item.is_file():
                root_files.append({
                    'name': item.name,
                    'size_mb': item.stat().st_size / (1024 * 1024),
                    'type': self._classify_file(item)
                })
        
        print(f"✅ 분석 완료: {len(current_structure)}개 디렉토리, {len(root_files)}개 루트 파일")
        return current_structure, root_files
    
    def _get_dir_size(self, dir_path):
        """디렉토리 크기 계산"""
        try:
            total_size = sum(f.stat().st_size for f in dir_path.rglob('*') if f.is_file())
            return round(total_size / (1024 * 1024), 2)
        except (OSError, PermissionError):
            return 0
    
    def _classify_file(self, file_path):
        """파일 분류"""
        suffix = file_path.suffix.lower()
        
        for file_type, extensions in self.file_classification.items():
            if suffix in extensions:
                return file_type
        
        return 'other'
    
    def create_target_directories(self):
        """목표 디렉토리 구조 생성"""
        print("📁 표준 디렉토리 구조 생성 중...")
        
        created_dirs = []
        
        for main_dir, config in self.target_structure.items():
            main_path = self.project_root / main_dir
            
            if not main_path.exists():
                main_path.mkdir(exist_ok=True)
                created_dirs.append(main_dir)
                self.reorganize_log.append(f"디렉토리 생성: {main_dir}")
            
            # 서브 디렉토리 생성
            for subdir in config['subdirs']:
                sub_path = main_path / subdir
                if not sub_path.exists():
                    sub_path.mkdir(exist_ok=True)
                    created_dirs.append(f"{main_dir}{subdir}")
        
        print(f"✅ 디렉토리 생성 완료: {len(created_dirs)}개")
        return created_dirs
    
    def reorganize_root_files(self):
        """루트 레벨 파일 재정리"""
        print("📄 루트 레벨 파일 재정리 중...")
        
        moved_files = []
        
        for item in self.project_root.iterdir():
            if item.is_file() and not item.name.startswith('.'):
                target_dir = self._determine_target_directory(item)
                
                if target_dir:
                    target_path = self.project_root / target_dir / item.name
                    
                    try:
                        # 중복 파일 체크
                        if target_path.exists():
                            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                            name_parts = item.name.rsplit('.', 1)
                            if len(name_parts) == 2:
                                new_name = f"{name_parts[0]}_{timestamp}.{name_parts[1]}"
                            else:
                                new_name = f"{item.name}_{timestamp}"
                            target_path = target_path.parent / new_name
                        
                        shutil.move(str(item), str(target_path))
                        moved_files.append({
                            'file': item.name,
                            'from': 'root',
                            'to': target_dir
                        })
                        self.reorganize_log.append(f"파일 이동: {item.name} → {target_dir}")
                        
                    except (OSError, PermissionError, shutil.Error) as e:
                        print(f"⚠️ 파일 이동 실패: {item.name} - {e}")
        
        print(f"✅ 루트 파일 정리 완료: {len(moved_files)}개 파일 이동")
        return moved_files
    
    def _determine_target_directory(self, file_path):
        """파일의 목표 디렉토리 결정"""
        file_type = self._classify_file(file_path)
        file_name = file_path.name.lower()
        
        # 특별한 파일들 처리
        if file_name in ['readme.md', 'license', 'changelog.md', 'contributing.md']:
            return None  # 루트에 유지
        
        if file_name.startswith('requirements'):
            return 'config/'
        
        if 'test' in file_name or file_name.startswith('test_'):
            return 'tests/'
        
        # 타입별 분류
        if file_type == 'config_files':
            return 'config/'
        elif file_type == 'documentation':
            return 'docs/'
        elif file_type == 'python_scripts':
            if 'notebook' in file_name or 'analysis' in file_name:
                return 'tools/notebooks/'
            else:
                return 'tools/scripts/'
        elif file_type == 'notebook_files':
            return 'tools/notebooks/'
        elif file_type == 'data_files':
            return 'data/raw/'
        elif file_type == 'image_files':
            return 'docs/images/'
        elif file_type == 'archive_files':
            return 'archive/'
        
        # 기본적으로 tools로
        return 'tools/utilities/'
    
    def consolidate_similar_directories(self):
        """유사한 디렉토리 통합"""
        print("🔄 유사한 디렉토리 통합 중...")
        
        consolidations = [
            # 백업/아카이브 디렉토리들
            {
                'source_patterns': ['*backup*', '*archive*', 'deprecated'],
                'target': 'archive/',
                'exclude': ['archive/']  # 이미 정리된 것은 제외
            },
            # 문서 관련
            {
                'source_patterns': ['documentation', 'guides'],  
                'target': 'docs/',
                'exclude': ['docs/']
            },
            # 도구 관련
            {
                'source_patterns': ['scripts', 'utilities', 'notebooks'],
                'target': 'tools/',
                'exclude': ['tools/']
            }
        ]
        
        consolidated_count = 0
        
        for consolidation in consolidations:
            for pattern in consolidation['source_patterns']:
                for dir_path in self.project_root.glob(pattern):
                    if (dir_path.is_dir() and 
                        str(dir_path.relative_to(self.project_root)) not in consolidation['exclude']):
                        
                        target_dir = self.project_root / consolidation['target'] / dir_path.name
                        
                        try:
                            if target_dir.exists():
                                # 기존 타겟이 있으면 내용물을 이동
                                for item in dir_path.iterdir():
                                    target_item = target_dir / item.name
                                    if not target_item.exists():
                                        shutil.move(str(item), str(target_item))
                                
                                # 빈 디렉토리 삭제
                                if not any(dir_path.iterdir()):
                                    dir_path.rmdir()
                            else:
                                shutil.move(str(dir_path), str(target_dir))
                            
                            consolidated_count += 1
                            self.reorganize_log.append(f"디렉토리 통합: {dir_path.name} → {consolidation['target']}")
                            
                        except (OSError, PermissionError, shutil.Error) as e:
                            print(f"⚠️ 디렉토리 통합 실패: {dir_path.name} - {e}")
        
        print(f"✅ 디렉토리 통합 완료: {consolidated_count}개")
        return consolidated_count
    
    def create_project_readme(self):
        """프로젝트 README 업데이트/생성"""
        readme_path = self.project_root / 'README.md'
        
        readme_content = f"""# FCA (Fraud & Customer Analytics) Project

## 📋 프로젝트 개요
고급 사기 탐지 및 고객 분석 시스템

## 🏗️ 프로젝트 구조

```
FCA/
├── src/                    # 핵심 소스 코드
│   ├── fca/               # Python 백엔드 모듈
│   └── static_dashboard/  # 정적 대시보드
├── data/                  # 데이터 파일들
│   ├── raw/              # 원본 데이터
│   ├── processed/        # 전처리된 데이터
│   └── models/           # 학습된 모델
├── tests/                # 테스트 코드
│   ├── unit/             # 단위 테스트
│   ├── integration/      # 통합 테스트
│   └── e2e/              # E2E 테스트
├── docs/                 # 문서 및 가이드
│   ├── api/              # API 문서
│   ├── guides/           # 사용 가이드
│   └── reports/          # 분석 리포트
├── tools/                # 유틸리티 및 스크립트
│   ├── scripts/          # 실행 스크립트
│   ├── notebooks/        # Jupyter 노트북
│   └── utilities/        # 유틸리티 도구
├── config/               # 설정 파일들
├── logs/                 # 로그 파일들
└── archive/              # 백업 및 아카이브
```

## 🚀 시작하기

### 설치
```bash
pip install -r config/requirements.txt
```

### 실행
```bash
# 대시보드 실행
cd src/static_dashboard
python3 serve.py

# 헬스체크
python3 tools/scripts/automated_health_check.py
```

## 🔧 주요 도구

- **프로젝트 분석**: `tools/scripts/optimization_analysis.py`
- **보안 감사**: `tools/scripts/security_audit.py`
- **성능 최적화**: `tools/scripts/performance_optimizer.py`
- **헬스체크**: `tools/scripts/automated_health_check.py`

## 📊 기능

- 🔍 **사기 탐지**: 실시간 사기 거래 탐지
- 💬 **감정 분석**: 고객 피드백 감정 분석
- 👥 **고객 이탈 예측**: 이탈 위험 고객 식별
- 📈 **대시보드**: 인터랙티브 분석 대시보드

## 🛠️ 개발

### 코드 품질
```bash
# 보안 감사
python3 tools/scripts/security_audit.py

# 테스트 실행
python3 -m pytest tests/

# 코드 포맷팅
black src/
```

### 모니터링
```bash
# 헬스체크
python3 tools/scripts/automated_health_check.py

# 성능 모니터링
python3 tools/scripts/automated_health_check.py --daemon
```

## 📚 문서

- [최적화 가이드](docs/guides/PROJECT_OPTIMIZATION_GUIDE.md)
- [API 문서](docs/api/)
- [배포 가이드](docs/guides/deployment/)

## 🤝 기여

1. Fork the project
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

**마지막 업데이트**: {datetime.now().strftime('%Y-%m-%d')}  
**버전**: 2.0.0
"""
        
        try:
            with open(readme_path, 'w', encoding='utf-8') as f:
                f.write(readme_content)
            print("✅ README.md 업데이트 완료")
            return True
        except Exception as e:
            print(f"⚠️ README 생성 실패: {e}")
            return False
    
    def generate_structure_report(self):
        """구조 재정리 리포트 생성"""
        report = {
            'reorganization_date': datetime.now().isoformat(),
            'changes_made': self.reorganize_log,
            'final_structure': {}
        }
        
        # 최종 구조 스캔
        for item in self.project_root.iterdir():
            if item.is_dir() and not item.name.startswith('.'):
                report['final_structure'][item.name] = {
                    'file_count': len(list(item.rglob('*'))),
                    'size_mb': self._get_dir_size(item)
                }
        
        report_path = self.project_root / 'structure_reorganization_report.json'
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"📊 구조 재정리 리포트 저장: {report_path}")
        return report
    
    def run_full_reorganization(self):
        """전체 구조 재정리 실행"""
        print("🏗️ FCA 프로젝트 구조 재정리 시작")
        print("=" * 50)
        
        # 1. 현재 구조 분석
        current_structure, root_files = self.analyze_current_structure()
        
        # 2. 표준 디렉토리 생성
        created_dirs = self.create_target_directories()
        
        # 3. 루트 파일 재정리
        moved_files = self.reorganize_root_files()
        
        # 4. 유사한 디렉토리 통합
        consolidated = self.consolidate_similar_directories()
        
        # 5. README 업데이트
        self.create_project_readme()
        
        # 6. 리포트 생성
        report = self.generate_structure_report()
        
        print("\n✅ 프로젝트 구조 재정리 완료!")
        print(f"📁 생성된 디렉토리: {len(created_dirs)}개")
        print(f"📄 이동된 파일: {len(moved_files)}개")
        print(f"🔄 통합된 디렉토리: {consolidated}개")
        print(f"📊 총 변경사항: {len(self.reorganize_log)}개")
        
        return report

if __name__ == "__main__":
    reorganizer = FCAStructureReorganizer()
    reorganizer.run_full_reorganization()