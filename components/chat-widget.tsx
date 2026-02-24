"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useChat } from "@/contexts/chat-context";
import ChatMessageList from "./chat-message-list";
import ChatInput from "./chat-input";

export default function ChatWidget() {
  const t = useTranslations("chat");
  const { isOpen, toggleOpen } = useChat();
  const inputRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        toggleOpen();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, toggleOpen]);

  // Auto-focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      const input = inputRef.current?.querySelector("input");
      input?.focus();
    }
  }, [isOpen]);

  return (
    <>
      {/* Floating bubble */}
      {!isOpen && (
        <button
          onClick={toggleOpen}
          className="fixed bottom-4 end-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg hover:bg-teal-700 transition-colors"
          aria-label={t("openChat")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 w-6"
          >
            <path
              fillRule="evenodd"
              d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label={t("title")}
          className="fixed bottom-4 end-4 z-50 flex flex-col rounded-2xl bg-white shadow-2xl border border-gray-200 w-96 h-[500px] max-sm:inset-0 max-sm:w-auto max-sm:h-auto max-sm:rounded-none max-sm:bottom-0 max-sm:end-0"
        >
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-2xl max-sm:rounded-t-none bg-teal-600 px-4 py-3 text-white">
            <h2 className="text-sm font-semibold">{t("title")}</h2>
            <button
              onClick={toggleOpen}
              className="rounded-lg p-1 hover:bg-teal-700 transition-colors"
              aria-label={t("close")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>

          {/* Message list */}
          <ChatMessageList />

          {/* Input */}
          <div ref={inputRef}>
            <ChatInput />
          </div>
        </div>
      )}
    </>
  );
}
