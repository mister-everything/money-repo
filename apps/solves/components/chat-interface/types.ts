/**
 * @deprecated 재설계 필요
 */

/**
 * 메시지를 보낸 주체를 명시합니다.
 * 시스템 안내 메시지를 위해 "system" 타입을 확장해 둡니다.
 */
export type ChatSender = "user" | "ai" | "system";

/**
 * 메시지의 표현 형식을 정의합니다.
 * "state"는 로딩/상태 안내 등 비대화형 메시지에 사용합니다.
 */
export type ChatMessageType = "text" | "file" | "error" | "state";

/**
 * Vercel AI SDK의 stream 기반 메시지 렌더링을 위한 기본 필드입니다.
 */
export interface StreamMessage {
  id: string;
  content: string;
  role: ChatSender;
}

/**
 * 메시지에 내장될 수 있는 후속 동작의 타입을 구분합니다.
 */
export type ChatActionType = "navigate" | "executeTool" | "openPanel";

/**
 * 메시지 분석 정보나 관련 리소스를 메타데이터로 담습니다.
 */
export interface ChatMessageMetadata {
  intent?: string;
  tags?: string[];
  confidenceScore?: number;
  relatedResourceIds?: string[];
}

interface BaseAction<
  TType extends ChatActionType,
  TPayload extends Record<string, unknown>,
> {
  /** UI에 노출될 동작 타입 */
  type: TType;
  /** 사용자에게 보여줄 레이블 */
  label: string;
  /** 추가 설명이 필요한 경우 사용 */
  description?: string;
  /** 동작 실행에 필요한 파라미터 */
  payload: TPayload;
  /** 실행 전에 사용자 확인이 필요한지 여부 */
  requiresConfirmation?: boolean;
  /** 동작 비활성화 사유를 노출할 때 사용 */
  disabledReason?: string;
}

export type NavigateAction = BaseAction<
  "navigate",
  {
    targetId: string;
    targetType?: "problem" | "book" | "external";
    href?: string;
  }
>;

export type ExecuteToolAction = BaseAction<
  "executeTool",
  {
    toolId: string;
    input?: Record<string, unknown>;
    runInBackground?: boolean;
  }
>;

export type OpenPanelAction = BaseAction<
  "openPanel",
  {
    panelId: string;
    initialState?: Record<string, unknown>;
  }
>;

export type ChatAction = NavigateAction | ExecuteToolAction | OpenPanelAction;

export interface Message {
  id: string;
  sender: ChatSender;
  content: string;
  timestamp: Date;
  type?: ChatMessageType;
  /** 메시지가 트리거할 수 있는 후속 동작 목록 */
  actions?: ChatAction[];
  /** 대화 맥락 추가 정보를 위한 메타데이터 */
  metadata?: ChatMessageMetadata;
  /** 스트리밍 메시지와의 동기화를 위한 원본 데이터 */
  streamMessage?: StreamMessage;
}

/**
 * Vercel AI SDK의 tool invocation 흐름을 추상화한 상태 타입입니다.
 */
export type ChatToolInvocationStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "failed";

export interface ChatToolInvocation {
  id: string;
  toolName: string;
  input: Record<string, unknown>;
  status: ChatToolInvocationStatus;
  output?: unknown;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * 스트리밍 중 메시지 단위 업데이트를 전달하기 위한 델타 타입입니다.
 */
export type ChatStreamChunk =
  | {
      type: "token";
      messageId: string;
      token: string;
      isFirstToken: boolean;
    }
  | {
      type: "message.completed";
      message: Message;
    }
  | {
      type: "tool.updated";
      invocation: ChatToolInvocation;
    }
  | {
      type: "actions.appended";
      messageId: string;
      actions: ChatAction[];
    };

/**
 * 스트리밍 파이프라인에서 사용할 콜백 시그니처를 정의합니다.
 */
export interface ChatStreamCallbacks {
  onChunk?: (chunk: ChatStreamChunk) => void;
  onError?: (error: unknown) => void;
  onComplete?: (finalMessages: Message[]) => void;
}

/**
 * Vercel AI SDK의 ReadableStream을 UI 상태에 반영하기 위한 어댑터 타입입니다.
 */
export interface ChatStreamController {
  /** 스트림을 소비하여 UI에 반영하는 함수 */
  consume: (
    stream: ReadableStream<Uint8Array>,
    callbacks: ChatStreamCallbacks,
  ) => Promise<void>;
  /** 스트리밍 중 강제 중단을 위한 함수 */
  abort?: () => void;
}

/**
 * 대화 세션 전역 상태를 표현하며, Vercel AI SDK의 useChat 훅과 연동합니다.
 */
export interface ChatSessionState {
  sessionId: string;
  messages: Message[];
  pendingMessage?: Message;
  toolInvocations?: ChatToolInvocation[];
  isStreaming: boolean;
  error?: string;
}

export interface ChatInterfaceProps {
  onSendMessage: (message: string, option?: string) => void;
  messages: Message[];
  isLoading?: boolean;
  documentUploaded?: boolean;
  className?: string;
}

export type ChatOption = "설명" | "문제풀이" | "유사문제";

export interface ModelOption {
  id: string;
  label: string;
  description?: string;
}
