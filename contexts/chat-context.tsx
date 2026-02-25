"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import type { ChatMessage, UserDataContext } from "@/lib/chat/types";
import { findAnswer, matchTopic } from "@/lib/chat/matcher";
import { queryUserStatus } from "@/lib/chat/status-query";
import {
  createGuidedState,
  getGuidedQuestionKey,
  processGuidedAnswer,
  type GuidedState,
} from "@/lib/chat/guided-setup";
import { useEmployers } from "./employer-context";
import { useVisitReporting } from "./visit-reporting-context";
import { useCompliance } from "./compliance-context";

type FormFillCallback = (field: string, value: string | number) => void;

interface ChatContextValue {
  messages: ChatMessage[];
  isOpen: boolean;
  isLoading: boolean;
  sendMessage: (content: string) => void;
  toggleOpen: () => void;
  registerFormFillCallback: (cb: FormFillCallback) => void;
  unregisterFormFillCallback: () => void;
  showCompletionMessage: (name: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

const dbUnavailableMessage: Record<string, string> = {
  he: "לא ניתן להתחבר למסד הנתונים כרגע. נסו שוב מאוחר יותר, או שאלו על נושא אחר.",
  ar: "تعذر الاتصال بقاعدة البيانات حالياً. حاول مرة أخرى لاحقاً أو اسأل عن موضوع آخر.",
  ru: "Не удалось подключиться к базе данных. Попробуйте позже или спросите о другой теме.",
  uk: "Не вдалося підключитися до бази даних. Спробуйте пізніше або запитайте про іншу тему.",
  am: "አሁን ከመረጃ ቋቱ ጋር መገናኘት አልተቻለም። እንደገና ይሞክሩ ወይም ስለ ሌላ ርዕስ ይጠይቁ።",
};

const completionMessages: Record<string, (name: string) => string> = {
  he: (name) => `מצוין! התיק של ${name} מוכן, והזכויות שלך מאובטחות.`,
  ar: (name) => `ممتاز! ملف ${name} جاهز، وحقوقك محفوظة.`,
  ru: (name) => `Отлично! Файл ${name} готов, и ваши права защищены.`,
  uk: (name) => `Чудово! Файл ${name} готовий, і ваші права захищені.`,
  am: (name) => `በጣም ጥሩ! የ${name} ፋይል ዝግጁ ነው፣ መብቶችዎ ተጠብቀዋል።`,
};

export function ChatProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const t = useTranslations("chat");
  const tGuided = useTranslations("guided");

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
    [
      employers,
      contractConfigs,
      completedSessions,
      activeSessions,
      absences,
      depositStatuses,
    ]
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

  // Guided setup state
  const [guidedState, setGuidedState] = useState<GuidedState | null>(null);
  const formFillCallbackRef = useRef<FormFillCallback | null>(null);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const registerFormFillCallback = useCallback((cb: FormFillCallback) => {
    formFillCallbackRef.current = cb;
  }, []);

  const unregisterFormFillCallback = useCallback(() => {
    formFillCallbackRef.current = null;
    setGuidedState(null);
  }, []);

  const addAssistantMessage = useCallback((content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role: "assistant",
        content,
        timestamp: Date.now(),
      },
    ]);
  }, []);

  const showCompletionMessage = useCallback(
    (name: string) => {
      const getMessage =
        completionMessages[locale] ?? completionMessages.he;
      addAssistantMessage(getMessage(name));
      setIsOpen(true);
    },
    [locale, addAssistantMessage]
  );

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

      // If in guided mode, process as guided answer
      if (guidedState && guidedState.step !== "done") {
        const result = processGuidedAnswer(trimmed, guidedState);

        if (!result.valid) {
          addAssistantMessage(tGuided("invalidInput"));
          return;
        }

        // Fill the form field
        if (formFillCallbackRef.current && result.field) {
          formFillCallbackRef.current(
            result.field,
            result.value as string | number
          );
        }

        setGuidedState(result.nextState);

        // Confirmation + next question
        if (result.nextState.step === "done") {
          addAssistantMessage(tGuided("guidedDone"));
        } else {
          const questionKey = getGuidedQuestionKey(result.nextState);
          addAssistantMessage(tGuided(questionKey));
        }
        return;
      }

      setIsLoading(true);

      const matchResult = matchTopic(trimmed, locale);

      // If user asks about adding employer and callback is registered, start guided setup
      if (
        matchResult.topicId === "add_employer" &&
        formFillCallbackRef.current
      ) {
        const newState = createGuidedState();
        setGuidedState(newState);
        const questionKey = getGuidedQuestionKey(newState);
        setTimeout(() => {
          addAssistantMessage(
            tGuided("offerGuided") + "\n\n" + tGuided(questionKey)
          );
          setIsLoading(false);
        }, 400);
        return;
      }

      if (matchResult.topicId === "my_status") {
        // Async DB query for full live status overview
        queryUserStatus(locale)
          .then((answer) => {
            addAssistantMessage(answer);
          })
          .catch(() => {
            addAssistantMessage(
              dbUnavailableMessage[locale] ?? dbUnavailableMessage.he
            );
          })
          .finally(() => setIsLoading(false));
      } else {
        // Knowledge base answer + personalized data from contexts
        setTimeout(() => {
          const answer = findAnswer(trimmed, locale, userData);
          addAssistantMessage(answer);
          setIsLoading(false);
        }, 400);
      }
    },
    [locale, isLoading, userData, guidedState, addAssistantMessage, tGuided]
  );

  return (
    <ChatContext
      value={{
        messages,
        isOpen,
        isLoading,
        sendMessage,
        toggleOpen,
        registerFormFillCallback,
        unregisterFormFillCallback,
        showCompletionMessage,
      }}
    >
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
