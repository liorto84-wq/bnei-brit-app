import type { TopicId } from "./types";
import { topicKeywords } from "./topics";
import { knowledgeBase, fallbackAnswer } from "./knowledge-base";

export function findAnswer(input: string, locale: string): string {
  const normalized = input.toLowerCase().trim();

  if (!normalized) {
    return fallbackAnswer[locale] ?? fallbackAnswer.he;
  }

  let bestTopic: TopicId | null = null;
  let bestScore = 0;

  for (const topic of topicKeywords) {
    const keywords = topic.keywords[locale] ?? topic.keywords.he;
    let score = 0;

    for (const keyword of keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        score += keyword.length;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestTopic = topic.topicId;
    }
  }

  if (bestTopic && bestScore > 0) {
    const entry = knowledgeBase.find((e) => e.topicId === bestTopic);
    if (entry) {
      return entry.answer[locale] ?? entry.answer.he;
    }
  }

  return fallbackAnswer[locale] ?? fallbackAnswer.he;
}
