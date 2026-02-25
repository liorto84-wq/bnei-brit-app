import type { TopicId, UserDataContext } from "./types";
import { topicKeywords } from "./topics";
import { knowledgeBase, fallbackAnswer } from "./knowledge-base";
import { getPersonalizedAnswer } from "./personalized-answers";

export interface MatchResult {
  topicId: TopicId | null;
  answer: string;
}

export function matchTopic(input: string, locale: string): MatchResult {
  const normalized = input.toLowerCase().trim();

  if (!normalized) {
    return { topicId: null, answer: fallbackAnswer[locale] ?? fallbackAnswer.he };
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
    if (bestTopic === "my_status") {
      return { topicId: "my_status", answer: "" };
    }

    const entry = knowledgeBase.find((e) => e.topicId === bestTopic);
    if (entry) {
      return { topicId: bestTopic, answer: entry.answer[locale] ?? entry.answer.he };
    }
  }

  return { topicId: null, answer: fallbackAnswer[locale] ?? fallbackAnswer.he };
}

export function findAnswer(
  input: string,
  locale: string,
  userData?: UserDataContext
): string {
  const { topicId, answer } = matchTopic(input, locale);

  if (!topicId || !userData) return answer;

  // For my_status, return a fully personalized answer
  if (topicId === "my_status") {
    const personalized = getPersonalizedAnswer(topicId, userData, locale);
    return personalized ?? (fallbackAnswer[locale] ?? fallbackAnswer.he);
  }

  // For other topics, append personalized data to the static answer
  const personalized = getPersonalizedAnswer(topicId, userData, locale);
  return personalized ? answer + personalized : answer;
}
