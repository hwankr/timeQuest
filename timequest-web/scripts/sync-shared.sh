#!/bin/bash
# sync-shared.sh — 모바일 → 웹 공유 코드 동기화
# 사용법: bash scripts/sync-shared.sh (timequest-web/ 디렉토리에서 실행)

set -e

MOBILE_ROOT="../"
WEB_ROOT="."

echo "공유 코드 동기화 시작..."

# types
cp "${MOBILE_ROOT}types/index.ts" "${WEB_ROOT}/shared/types/index.ts"

# repositories
cp "${MOBILE_ROOT}repositories/converters.ts" "${WEB_ROOT}/shared/repositories/converters.ts"
cp "${MOBILE_ROOT}repositories/scheduleRepo.ts" "${WEB_ROOT}/shared/repositories/scheduleRepo.ts"
cp "${MOBILE_ROOT}repositories/rewardRepo.ts" "${WEB_ROOT}/shared/repositories/rewardRepo.ts"
cp "${MOBILE_ROOT}repositories/userRepo.ts" "${WEB_ROOT}/shared/repositories/userRepo.ts"
cp "${MOBILE_ROOT}repositories/purchaseRepo.ts" "${WEB_ROOT}/shared/repositories/purchaseRepo.ts"

# constants
cp "${MOBILE_ROOT}constants/blockTypes.ts" "${WEB_ROOT}/shared/constants/blockTypes.ts"
cp "${MOBILE_ROOT}constants/rewards.ts" "${WEB_ROOT}/shared/constants/rewards.ts"
cp "${MOBILE_ROOT}constants/theme.ts" "${WEB_ROOT}/shared/constants/theme.ts"

# utils
cp "${MOBILE_ROOT}utils/time.ts" "${WEB_ROOT}/shared/utils/time.ts"
cp "${MOBILE_ROOT}utils/timeValidation.ts" "${WEB_ROOT}/shared/utils/timeValidation.ts"

echo "동기화 완료 — 11개 파일 복사됨"
