# FCA (Fraud & Customer Analytics) Project

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

**마지막 업데이트**: 2025-08-05  
**버전**: 2.0.0
