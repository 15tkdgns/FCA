#!/bin/bash
# FCA 프로젝트 최적화 스위트 실행 스크립트

echo "🚀 FCA 프로젝트 최적화 스위트"
echo "================================"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 함수 정의
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 스크립트 존재 확인
check_script() {
    if [ ! -f "$1" ]; then
        log_error "스크립트 파일 없음: $1"
        return 1
    fi
    return 0
}

# 메뉴 표시
show_menu() {
    echo ""
    echo "🔧 최적화 도구 메뉴:"
    echo "1) 전체 분석 실행 (권장)"
    echo "2) 프로젝트 구조 분석"
    echo "3) 보안 감사"
    echo "4) 성능 최적화"
    echo "5) 헬스체크"
    echo "6) 성능 모니터링 (60초)"
    echo "7) 데몬 모드 헬스체크"
    echo "8) 종료"
    echo ""
    read -p "선택하세요 (1-8): " choice
}

# 1. 전체 분석 실행
run_full_analysis() {
    log_info "전체 분석 시작..."
    
    echo "📊 1/4: 프로젝트 구조 분석"
    if check_script "optimization_analysis.py"; then
        python3 optimization_analysis.py
        log_success "프로젝트 분석 완료"
    fi
    
    echo -e "\n🔒 2/4: 보안 감사"
    if check_script "security_audit.py"; then
        python3 security_audit.py
        log_success "보안 감사 완료"
    fi
    
    echo -e "\n🏥 3/4: 헬스체크"
    if check_script "automated_health_check.py"; then
        python3 automated_health_check.py
        log_success "헬스체크 완료"
    fi
    
    echo -e "\n⚡ 4/4: 성능 최적화 (선택적)"
    read -p "성능 최적화를 실행하시겠습니까? (y/N): " confirm
    if [[ $confirm =~ ^[Yy]$ ]]; then
        if check_script "performance_optimizer.py"; then
            python3 performance_optimizer.py
            log_success "성능 최적화 완료"
        fi
    else
        log_info "성능 최적화 스킵됨"
    fi
    
    echo -e "\n📋 결과 요약:"
    echo "- 프로젝트 분석: optimization_analysis_results.json"
    echo "- 보안 감사: security_audit_report.json"
    echo "- 헬스체크: health_check_results.json"
    if [[ $confirm =~ ^[Yy]$ ]]; then
        echo "- 성능 최적화: optimization_results.json"
    fi
}

# 2. 프로젝트 구조 분석
run_project_analysis() {
    log_info "프로젝트 구조 분석 시작..."
    if check_script "optimization_analysis.py"; then
        python3 optimization_analysis.py
        log_success "분석 완료: optimization_analysis_results.json"
    fi
}

# 3. 보안 감사
run_security_audit() {
    log_info "보안 감사 시작..."
    if check_script "security_audit.py"; then
        python3 security_audit.py
        log_success "보안 감사 완료: security_audit_report.json"
    fi
}

# 4. 성능 최적화
run_performance_optimization() {
    log_warning "주의: 이 작업은 파일을 수정/삭제할 수 있습니다."
    log_info "백업이 자동으로 생성됩니다: optimization_backup/"
    
    read -p "계속하시겠습니까? (y/N): " confirm
    if [[ $confirm =~ ^[Yy]$ ]]; then
        if check_script "performance_optimizer.py"; then
            python3 performance_optimizer.py
            log_success "성능 최적화 완료: optimization_results.json"
        fi
    else
        log_info "성능 최적화 취소됨"
    fi
}

# 5. 헬스체크
run_health_check() {
    log_info "헬스체크 시작..."
    if check_script "automated_health_check.py"; then
        python3 automated_health_check.py
        log_success "헬스체크 완료: health_check_results.json"
    fi
}

# 6. 성능 모니터링
run_performance_monitoring() {
    log_info "60초간 성능 모니터링 시작..."
    if check_script "performance_monitor.py"; then
        python3 performance_monitor.py
        log_success "성능 모니터링 완료: performance_metrics.json"
    else
        log_error "performance_monitor.py 파일을 찾을 수 없습니다."
        log_info "헬스체크를 먼저 실행하여 파일을 생성하세요."
    fi
}

# 7. 데몬 모드 헬스체크
run_daemon_monitoring() {
    log_info "데몬 모드 헬스체크 시작..."
    log_warning "Ctrl+C로 중지할 수 있습니다."
    
    if check_script "automated_health_check.py"; then
        python3 automated_health_check.py --daemon
    fi
}

# 결과 파일 요약 표시
show_results_summary() {
    echo ""
    echo "📊 생성된 결과 파일:"
    echo "===================="
    
    results_files=(
        "optimization_analysis_results.json:프로젝트 구조 분석"
        "security_audit_report.json:보안 감사 리포트"
        "health_check_results.json:헬스체크 결과"
        "optimization_results.json:성능 최적화 로그"
        "performance_metrics.json:성능 메트릭"
    )
    
    for entry in "${results_files[@]}"; do
        IFS=':' read -r file desc <<< "$entry"
        if [ -f "$file" ]; then
            size=$(du -h "$file" | cut -f1)
            modified=$(stat -c %y "$file" 2>/dev/null | cut -d' ' -f1,2 | cut -d'.' -f1)
            echo "✅ $desc ($size) - $modified"
            echo "   📁 $file"
        fi
    done
    
    echo ""
    echo "📖 자세한 내용은 PROJECT_OPTIMIZATION_GUIDE.md를 참조하세요."
}

# 메인 루프
main() {
    # 현재 디렉토리 확인
    if [ ! -f "optimization_analysis.py" ]; then
        log_error "FCA 프로젝트 루트 디렉토리에서 실행해주세요."
        exit 1
    fi
    
    while true; do
        show_menu
        
        case $choice in
            1)
                run_full_analysis
                show_results_summary
                ;;
            2)
                run_project_analysis
                ;;
            3)
                run_security_audit
                ;;
            4)
                run_performance_optimization
                ;;
            5)
                run_health_check
                ;;
            6)
                run_performance_monitoring
                ;;
            7)
                run_daemon_monitoring
                ;;
            8)
                log_success "프로그램을 종료합니다."
                exit 0
                ;;
            *)
                log_error "잘못된 선택입니다. 1-8 사이의 숫자를 입력하세요."
                ;;
        esac
        
        echo ""
        read -p "계속하려면 Enter를 누르세요..."
    done
}

# 스크립트 실행
main