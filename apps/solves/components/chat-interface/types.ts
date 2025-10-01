export interface Message {
  id: string;
  sender: "user" | "ai";
  content: string;
  timestamp: Date;
  type?: "text" | "file" | "error";
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
