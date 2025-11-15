"use client";

import { UIMessage } from "ai";

export function Message({ message }: { message: UIMessage }) {
  return (
    <div>
      {message.role} :{message.role}
      {message.parts
        .map((part) => (part.type === "text" ? part.text : part.type))
        .join("")}
    </div>
  );
}
