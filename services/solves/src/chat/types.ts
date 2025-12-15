import { UIMessage } from "ai";

export type ChatMetadata = {
  // 어떤 데이터 할 쥐  고 민 중!
};

export type ChatThread = {
  title: string;
  id: string;
  createdAt: Date;
};

export type ChatMessage = {
  id: string;
  threadId: string;
  role: UIMessage["role"];
  parts: UIMessage["parts"];
  metadata?: ChatMetadata;
  createdAt: Date;
};

export type ChatModel = {
  provider: string;
  model: string;
  displayName?: string;
};

// TODO: SystemPrompt DB 관리? 연계 필요할 듯?
export enum SystemPrompt {
  SOLVES,
  EXPLAIN,
  SOLVE,
}