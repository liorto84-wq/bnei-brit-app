export type TopicId =
  | "convalescence"
  | "sick_leave"
  | "pension"
  | "national_insurance"
  | "holidays"
  | "overtime"
  | "minimum_wage"
  | "worker_rights"
  | "general";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface KnowledgeEntry {
  topicId: TopicId;
  answer: Record<string, string>; // locale → answer text
}

export interface TopicKeywords {
  topicId: TopicId;
  keywords: Record<string, string[]>; // locale → keywords array
}
