#!/usr/bin/env python3
"""
FCA 모듈화된 메인 애플리케이션
===========================

새로운 모듈 구조를 사용하는 메인 실행 파일
"""

import sys
from pathlib import Path

# 프로젝트 루트를 파이썬 경로에 추가
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from fca import create_app, get_logger, get_config

logger = get_logger("MainApp")
config = get_config()


def main():
    """메인 애플리케이션 실행"""
    try:
        # Flask 앱 생성
        app, api_manager = create_app()
        
        logger.info("FCA 애플리케이션 시작")
        logger.info(f"환경: {config.environment}")
        logger.info(f"디버그 모드: {config.debug}")
        
        # 등록된 엔드포인트 로깅
        endpoints = api_manager.get_registered_endpoints()
        logger.info(f"등록된 API 엔드포인트: {len(endpoints)}개")
        
        # 서버 실행
        app.run(
            host='0.0.0.0',
            port=5000,
            debug=config.debug,
            threaded=True
        )
        
    except Exception as e:
        logger.error(f"애플리케이션 시작 실패: {str(e)}")
        sys.exit(1)


if __name__ == '__main__':
    main()