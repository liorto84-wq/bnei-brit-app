"use client";

import { useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { useChat } from "@/contexts/chat-context";

export default function ChatInput() {
  const t = useTranslations("chat");
  const { sendMessage, isLoading } = useChat();
  const [value, setValue] = useState("");

  const handleSend = () => {
    if (!value.trim() || isLoading) return;
    sendMessage(value);
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2 border-t border-gray-200 p-3">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("placeholder")}
        disabled={isLoading}
        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
        aria-label={t("placeholder")}
      />
      <button
        onClick={handleSend}
        disabled={!value.trim() || isLoading}
        className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label={t("send")}
      >
        {t("send")}
      </button>
    </div>
  );
}
