"use client";

import { useTranslations } from "next-intl";

export default function ChatTypingIndicator() {
  const t = useTranslations("chat");

  return (
    <div className="flex items-center gap-1 px-4 py-2" aria-label={t("typing")}>
      <div className="flex gap-1">
        <span className="h-2 w-2 rounded-full bg-teal-400 animate-bounce [animation-delay:0ms]" />
        <span className="h-2 w-2 rounded-full bg-teal-400 animate-bounce [animation-delay:150ms]" />
        <span className="h-2 w-2 rounded-full bg-teal-400 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}
