#!/bin/bash

echo "🚀 문제집 테스트용 목업 데이터 생성 중..."

# 데이터베이스 마이그레이션 실행 (필요한 경우)
echo "📊 데이터베이스 마이그레이션 확인 중..."
cd ../../services/prob
pnpm db:migrate

# 목업 데이터 생성
echo "💾 목업 데이터 생성 중..."
pnpm db:seed

echo ""
echo "🎯 테스트용 목업 데이터 생성 완료!"
echo ""
echo "🔧 서비스 패키지 명령어:"
echo "pnpm -F @service/solves db:seed   # 목업 데이터 재생성"
echo "pnpm -F @service/solves db:reset  # 데이터베이스 초기화"
echo "pnpm -F @service/solves db:studio # 데이터베이스 확인"
