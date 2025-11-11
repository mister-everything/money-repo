import { UIMessage } from "ai";

export type ChatMetadata = {
  // 어떤 데이터 할 쥐  고 민 중!
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
};
