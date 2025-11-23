// 순환 참조 회피를 위해 타입을 직접 정의
export type ProbBookSaveInput = {
  id?: number;
  ownerId: string;
  title: string;
  description?: string;
  blocks: WorkBookBlockSaveInput[];
  tags?: string[];
  isPublic?: boolean;
  thumbnail?: string;
};

export type WorkBookBlockSaveInput = {
  id?: number;
  type: "default" | "mcq" | "ranking" | "ox" | "matching";
  question?: string;
  content: any; // 간단하게 any로 처리
  answer?: any;
  tags?: string[];
  order?: number;
};
