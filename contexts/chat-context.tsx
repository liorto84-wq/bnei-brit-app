"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import type { ChatMessage } from "@/lib/chat/types";
import { findAnswer } from "@/lib/chat/matcher";

interface ChatContextValue {
  messages: ChatMessage[];
  isOpen: boolean;
  isLoading: boolean;
  sendMessage: (content: string) => void;
  toggleOpen: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const t = useTranslations("chat");

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      role: "assistant",
      content: t("welcomeMessage"),
      timestamp: Date.now(),
    },
  ]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const sendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isLoading) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Simulate typing delay for natural feel
      setTimeout(() => {
        const answer = findAnswer(trimmed, locale);
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: answer,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
      }, 400);
    },
    [locale, isLoading]
  );

  return (
    <ChatContext value={{ messages, isOpen, isLoading, sendMessage, toggleOpen }}>
      {children}
    </ChatContext>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
