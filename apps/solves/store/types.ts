import { BlockType } from "@service/solves/shared";

export interface WorkbookOptions {
  categories: number[]; // 소재
  situation?: string; // 상황
  blockTypes: BlockType[]; // 블록 유형
  ageGroup?: string; // 연령대
  difficulty?: string; // 난이도
}
