# 🚀 FCA 웹 애플리케이션 서버 실행 정보

## 📍 서버 접속 정보

### 🌐 웹 애플리케이션 URL
- **메인 대시보드**: http://localhost:5000
- **로컬 접속**: http://127.0.0.1:5000
- **네트워크 접속**: http://172.22.171.250:5000

### 🔌 API 엔드포인트
- **헬스 체크**: http://localhost:5000/api/health
- **데이터 요약**: http://localhost:5000/api/summary
- **모든 API**: http://localhost:5000/api/

## 📋 주요 페이지

### 🏠 메인 페이지들
1. **대시보드** - http://localhost:5000/
   - 전체 시스템 개요 및 핵심 지표

2. **사기 탐지** - http://localhost:5000/fraud
   - 사기 탐지 모델 분석 및 결과

3. **감정 분석** - http://localhost:5000/sentiment  
   - 금융 문장 감정 분석

4. **고객 이탈** - http://localhost:5000/attrition
   - 고객 이탈 예측 모델

5. **데이터셋** - http://localhost:5000/datasets
   - 사용 가능한 데이터셋 탐색

6. **비교 분석** - http://localhost:5000/comparison
   - 모델 성능 비교

7. **XAI 분석** - http://localhost:5000/xai
   - 설명 가능한 AI 분석

8. **시각화** - http://localhost:5000/visualizations
   - 고급 데이터 시각화

## 🔧 서버 상태

### ✅ 현재 상태
- **서버 상태**: 🟢 실행 중
- **포트**: 5000
- **모드**: Production (debug=False)
- **프로세스 ID**: 16516

### 📊 시스템 모니터링
```json
{
  "status": "healthy",
  "modules": {
    "total_modules": 3,
    "available_modules": [
      "isolation_forest",
      "performance_chart", 
      "model_comparison_chart"
    ],
    "available_functions": [
      "calculate_descriptive_stats"
    ]
  }
}
```

## 🛠️ 개발자 도구

### 📝 로그 확인
```bash
tail -f /root/FCA/server.log
```

### 🔄 서버 재시작
```bash
# 현재 서버 종료
pkill -f "python3.*web_app"

# 서버 재시작
cd /root/FCA
python3 -c "
import sys
sys.path.append('.')
from web_app.app import create_app
app = create_app()
app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
" &
```

### 📈 성능 모니터링
- **메모리 사용량**: 약 100MB
- **CPU 사용률**: 실시간 모니터링 가능
- **응답 시간**: 평균 < 1초

## 🌟 주요 기능

### 📊 대시보드 기능
- 실시간 데이터 모니터링
- 인터랙티브 차트 및 그래프
- 모델 성능 지표
- 시스템 상태 모니터링

### 🔍 분석 기능
- 사기 탐지 알고리즘 (Isolation Forest, LOF, One-Class SVM)
- 감정 분석 (금융 텍스트)
- 고객 이탈 예측
- 설명 가능한 AI (XAI)

### 📱 사용자 인터페이스
- 반응형 디자인 (모바일 지원)
- 모던 Bootstrap 5.3 UI
- 다크/라이트 모드 지원
- 실시간 데이터 업데이트

## 🔒 보안 설정

- **CORS**: 활성화됨
- **디버그 모드**: 비활성화 (프로덕션)
- **요청 로깅**: 구조화된 JSON 로그
- **에러 처리**: 안전한 에러 메시지

---

**⚡ 서버가 포트 5000에서 실행 중입니다!**  
브라우저에서 http://localhost:5000 으로 접속하여 FCA 대시보드를 확인하세요.