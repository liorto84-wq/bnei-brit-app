import type { RewardType } from "@/lib/types";

export type GuidedStep =
  | "ask_name"
  | "ask_start_date"
  | "ask_reward_type"
  | "ask_pay_amount"
  | "ask_hours"
  | "ask_notice_hours"
  | "ask_short_notice_percent"
  | "done";

export interface GuidedState {
  step: GuidedStep;
  rewardType?: RewardType;
}

interface StepDef {
  questionKey: string;
  field: string;
  parse: (input: string, state: GuidedState) => { value: unknown; valid: boolean };
  next: (state: GuidedState) => GuidedStep;
}

const stepDefs: Record<Exclude<GuidedStep, "done">, StepDef> = {
  ask_name: {
    questionKey: "askName",
    field: "name",
    parse: (input) => {
      const trimmed = input.trim();
      return { value: trimmed, valid: trimmed.length > 0 };
    },
    next: () => "ask_start_date",
  },
  ask_start_date: {
    questionKey: "askStartDate",
    field: "startDate",
    parse: (input) => {
      const trimmed = input.trim();
      // Accept YYYY-MM-DD or common date patterns
      const dateMatch = trimmed.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (dateMatch) {
        const [, y, m, d] = dateMatch;
        const formatted = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
        return { value: formatted, valid: true };
      }
      return { value: trimmed, valid: false };
    },
    next: () => "ask_reward_type",
  },
  ask_reward_type: {
    questionKey: "askRewardType",
    field: "rewardType",
    parse: (input) => {
      const lower = input.trim().toLowerCase();
      const hourlyWords = ["hourly", "שעתי", "بالساعة", "почасовая", "погодинна", "በሰዓት"];
      const dailyWords = ["daily", "יומי", "يومي", "посуточная", "поденна", "በቀን"];
      const globalWords = ["global", "גלובלי", "شامل", "глобальная", "глобальна", "ጠቅላላ"];

      if (hourlyWords.some((w) => lower.includes(w)))
        return { value: "hourly", valid: true };
      if (dailyWords.some((w) => lower.includes(w)))
        return { value: "daily", valid: true };
      if (globalWords.some((w) => lower.includes(w)))
        return { value: "global", valid: true };

      return { value: lower, valid: false };
    },
    next: () => "ask_pay_amount",
  },
  ask_pay_amount: {
    questionKey: "askHourlyRate", // overridden dynamically
    field: "hourlyRate", // overridden dynamically
    parse: (input) => {
      const num = parseFloat(input.replace(/[^\d.]/g, ""));
      return { value: num, valid: !isNaN(num) && num > 0 };
    },
    next: (state) => (state.rewardType === "global" ? "ask_notice_hours" : "ask_hours"),
  },
  ask_hours: {
    questionKey: "askHours",
    field: "hoursPerWeek",
    parse: (input) => {
      const num = parseFloat(input.replace(/[^\d.]/g, ""));
      return { value: num, valid: !isNaN(num) && num > 0 };
    },
    next: () => "ask_notice_hours",
  },
  ask_notice_hours: {
    questionKey: "askNoticeHours",
    field: "noticeHours",
    parse: (input) => {
      const trimmed = input.trim().toLowerCase();
      // Accept "default", "skip", or empty for default
      if (!trimmed || trimmed === "24" || ["default", "ברירת מחדל", "افتراضي", "по умолчанию", "за замовчуванням", "ነባሪ", "skip", "דלג"].some(w => trimmed.includes(w))) {
        return { value: 24, valid: true };
      }
      const num = parseInt(input.replace(/[^\d]/g, ""), 10);
      return { value: num, valid: !isNaN(num) && num >= 1 && num <= 72 };
    },
    next: () => "ask_short_notice_percent",
  },
  ask_short_notice_percent: {
    questionKey: "askShortNoticePercent",
    field: "shortNoticePayPercent",
    parse: (input) => {
      const trimmed = input.trim().toLowerCase();
      if (!trimmed || trimmed === "100" || ["default", "ברירת מחדל", "افتراضي", "по умолчанию", "за замовчуванням", "ነባሪ", "skip", "דלג"].some(w => trimmed.includes(w))) {
        return { value: 100, valid: true };
      }
      const num = parseInt(input.replace(/[^\d]/g, ""), 10);
      return { value: num, valid: !isNaN(num) && num >= 0 && num <= 100 };
    },
    next: () => "done",
  },
};

/** Get the question key for the current guided step */
export function getGuidedQuestionKey(state: GuidedState): string {
  if (state.step === "done") return "guidedDone";
  const def = stepDefs[state.step];
  // Override for pay amount based on reward type
  if (state.step === "ask_pay_amount") {
    if (state.rewardType === "daily") return "askDailyRate";
    if (state.rewardType === "global") return "askGlobalAmount";
    return "askHourlyRate";
  }
  return def.questionKey;
}

/** Get the form field name for the current guided step */
export function getGuidedField(state: GuidedState): string {
  if (state.step === "done") return "";
  if (state.step === "ask_pay_amount") {
    if (state.rewardType === "daily") return "dailyRate";
    if (state.rewardType === "global") return "globalMonthlyAmount";
    return "hourlyRate";
  }
  return stepDefs[state.step].field;
}

/** Parse user answer for the current step, return field, value, valid, and next state */
export function processGuidedAnswer(
  input: string,
  state: GuidedState
): {
  field: string;
  value: unknown;
  valid: boolean;
  nextState: GuidedState;
} {
  if (state.step === "done") {
    return { field: "", value: null, valid: false, nextState: state };
  }

  const def = stepDefs[state.step];
  const { value, valid } = def.parse(input, state);
  const field = getGuidedField(state);

  if (!valid) {
    return { field, value, valid: false, nextState: state };
  }

  const newState: GuidedState = { ...state };

  // Track reward type for subsequent steps
  if (state.step === "ask_reward_type") {
    newState.rewardType = value as RewardType;
  }

  newState.step = def.next(newState);

  return { field, value, valid: true, nextState: newState };
}

/** Create initial guided state */
export function createGuidedState(): GuidedState {
  return { step: "ask_name" };
}
