"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import type { ChatMessage, UserDataContext } from "@/lib/chat/types";
import { findAnswer, matchTopic } from "@/lib/chat/matcher";
import { queryUserStatus } from "@/lib/chat/status-query";
import { useEmployers } from "./employer-context";
import { useVisitReporting } from "./visit-reporting-context";
import { useCompliance } from "./compliance-context";

interface ChatContextValue {
  messages: ChatMessage[];
  isOpen: boolean;
  isLoading: boolean;
  sendMessage: (content: string) => void;
  toggleOpen: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

const dbUnavailableMessage: Record<string, string> = {
  he: "לא ניתן להתחבר למסד הנתונים כרגע. נסו שוב מאוחר יותר, או שאלו על נושא אחר.",
  ar: "تعذر الاتصال بقاعدة البيانات حالياً. حاول مرة أخرى لاحقاً أو اسأل عن موضوع آخر.",
  ru: "Не удалось подключиться к базе данных. Попробуйте позже или спросите о другой теме.",
  uk: "Не вдалося підключитися до бази даних. Спробуйте пізніше або запитайте про іншу тему.",
  am: "አሁን ከመረጃ ቋቱ ጋር መገናኘት አልተቻለም። እንደገና ይሞክሩ ወይም ስለ ሌላ ርዕስ ይጠይቁ።",
};

export function ChatProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const t = useTranslations("chat");

  // Access live data from all contexts
  const { employers, contractConfigs } = useEmployers();
  const { activeSessions, completedSessions, absences } = useVisitReporting();
  const { depositStatuses } = useCompliance();

  // Build the UserDataContext for personalized answers
  const userData = useMemo<UserDataContext>(
    () => ({
      employers,
      contractConfigs,
      completedSessions,
      activeSessions,
      absences,
      depositStatuses,
    }),
    [employers, contractConfigs, completedSessions, activeSessions, absences, depositStatuses]
  );

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

      const result = matchTopic(trimmed, locale);

      if (result.topicId === "my_status") {
        // Async DB query for full live status overview
        queryUserStatus(locale)
          .then((answer) => {
            setMessages((prev) => [
              ...prev,
              {
                id: `assistant-${Date.now()}`,
                role: "assistant",
                content: answer,
                timestamp: Date.now(),
              },
            ]);
          })
          .catch(() => {
            setMessages((prev) => [
              ...prev,
              {
                id: `assistant-${Date.now()}`,
                role: "assistant",
                content: dbUnavailableMessage[locale] ?? dbUnavailableMessage.he,
                timestamp: Date.now(),
              },
            ]);
          })
          .finally(() => setIsLoading(false));
      } else {
        // Knowledge base answer + personalized data from contexts
        setTimeout(() => {
          const answer = findAnswer(trimmed, locale, userData);
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              content: answer,
              timestamp: Date.now(),
            },
          ]);
          setIsLoading(false);
        }, 400);
      }
    },
    [locale, isLoading, userData]
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
