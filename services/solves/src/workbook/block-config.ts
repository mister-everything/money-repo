/**
 * Block 관련 공통 설정 상수
 * blocks.ts (서버)와 block-content.tsx (클라이언트)에서 공유하여 사용
 */

// ============================================
// Default Block (주관식)
// ============================================
/** 주관식 정답 최대 개수 */
export const DEFAULT_BLOCK_MAX_ANSWERS = 5;
/** 주관식 정답 최대 글자수 */
export const DEFAULT_BLOCK_ANSWER_MAX_LENGTH = 30;

// ============================================
// MCQ Block (객관식)
// ============================================
/** 객관식 보기 최소 개수 */
export const MCQ_BLOCK_MIN_OPTIONS = 4;
/** 객관식 보기 최대 개수 */
export const MCQ_BLOCK_MAX_OPTIONS = 5;
/** 객관식 보기 최대 글자수 */
export const MCQ_BLOCK_OPTION_MAX_LENGTH = 30;

// ============================================
// Ranking Block (순위 맞추기)
// ============================================
/** 순위 맞추기 항목 최소 개수 */
export const RANKING_BLOCK_MIN_ITEMS = 2;
/** 순위 맞추기 항목 최대 개수 */
export const RANKING_BLOCK_MAX_ITEMS = 10;
/** 순위 맞추기 항목 최대 글자수 */
export const RANKING_BLOCK_ITEM_MAX_LENGTH = 30;

// ============================================
// Common
// ============================================
/** 옵션/항목 텍스트 최대 글자수 (공통) */
export const BLOCK_OPTION_TEXT_MAX_LENGTH = 100;

export const MAX_INPROGRESS_WORKBOOK_CREATE_COUNT = 3;
