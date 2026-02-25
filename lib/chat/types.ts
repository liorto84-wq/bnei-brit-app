import type {
  EmployerWithBenefits,
  ContractConfig,
  WorkSession,
  AbsenceRecord,
  EmployerDepositStatus,
} from "@/lib/types";

export type TopicId =
  | "convalescence"
  | "sick_leave"
  | "pension"
  | "national_insurance"
  | "holidays"
  | "overtime"
  | "minimum_wage"
  | "worker_rights"
  | "my_status"
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

/** Live user data passed from React contexts into the chat matcher */
export interface UserDataContext {
  employers: EmployerWithBenefits[];
  contractConfigs: Map<string, ContractConfig>;
  completedSessions: WorkSession[];
  activeSessions: Map<string, WorkSession>;
  absences: AbsenceRecord[];
  depositStatuses: Map<string, EmployerDepositStatus>;
}
