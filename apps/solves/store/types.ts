import { BlockType } from "@service/solves/shared";

export interface WorkbookOptions {
  categoryId?: number; // 소재 (단일 카테고리)
  situation?: string; // 상황
  ageGroup?: string; // 연령대
  blockTypes: BlockType[]; // 블록 유형
}
