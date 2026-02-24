"use client";

import { useEffect, useRef } from "react";
import { useChat } from "@/contexts/chat-context";
import ChatTypingIndicator from "./chat-typing-indicator";

export default function ChatMessageList() {
  const { messages, isLoading } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div
      className="flex-1 overflow-y-auto p-4 space-y-3"
      aria-live="polite"
    >
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-line ${
              msg.role === "user"
                ? "bg-teal-600 text-white"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {msg.content}
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-gray-100 rounded-2xl">
            <ChatTypingIndicator />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
