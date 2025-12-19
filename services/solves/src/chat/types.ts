import { UIMessage } from "ai";

export type UserMessageMetadata = {};
export type AssistantMessageMetadata = {
  input?: number;
  output?: number;
  cost?: number;
  provider?: string;
  model?: string;
};

export type ChatMetadata =
  | UserMessageMetadata
  | AssistantMessageMetadata
  | undefined;

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
  contextSize?: number;
  isDefaultModel?: boolean;
};

// TODO: SystemPrompt DB 관리? 연계 필요할 듯?
export enum SystemPrompt {
  SOLVES,
  EXPLAIN,
  SOLVE,
}
