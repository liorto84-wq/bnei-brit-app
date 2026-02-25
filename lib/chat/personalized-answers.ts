import type { TopicId, UserDataContext } from "./types";
import type { EmployerWithBenefits, ContractConfig, RewardType } from "@/lib/types";
import {
  PENSION_EMPLOYER_RATE,
  PENSION_EMPLOYEE_RATE,
  PENSION_SEVERANCE_RATE,
} from "@/lib/constants";

// ─── Helpers ─────────────────────────────────────────────

function rewardTypeLabel(type: RewardType, locale: string): string {
  const labels: Record<RewardType, Record<string, string>> = {
    hourly: {
      he: "שעתי",
      ar: "بالساعة",
      ru: "почасовая",
      uk: "погодинна",
      am: "በሰዓት",
    },
    daily: {
      he: "יומי",
      ar: "يومي",
      ru: "дневная",
      uk: "денна",
      am: "በቀን",
    },
    global: {
      he: "גלובלי",
      ar: "شامل",
      ru: "глобальная",
      uk: "глобальна",
      am: "ጠቅላላ",
    },
  };
  return labels[type]?.[locale] ?? labels[type]?.he ?? type;
}

function depositStatusLabel(
  status: string,
  locale: string
): string {
  const labels: Record<string, Record<string, string>> = {
    compliant: {
      he: "תקין ✓",
      ar: "ملتزم ✓",
      ru: "в порядке ✓",
      uk: "в порядку ✓",
      am: "ተገዢ ✓",
    },
    pending: {
      he: "ממתין",
      ar: "معلق",
      ru: "ожидание",
      uk: "очікування",
      am: "በመጠባበቅ",
    },
    overdue: {
      he: "באיחור ✗",
      ar: "متأخر ✗",
      ru: "просрочено ✗",
      uk: "прострочено ✗",
      am: "የዘገየ ✗",
    },
  };
  return labels[status]?.[locale] ?? labels[status]?.he ?? status;
}

function totalEarnings(ctx: UserDataContext, employerId: string): number {
  return ctx.completedSessions
    .filter((s) => s.employerId === employerId && s.earnings != null)
    .reduce((sum, s) => sum + (s.earnings ?? 0), 0);
}

function totalHoursWorked(ctx: UserDataContext, employerId: string): number {
  return ctx.completedSessions
    .filter((s) => s.employerId === employerId && s.endTime)
    .reduce((sum, s) => {
      const ms =
        new Date(s.endTime!).getTime() - new Date(s.startTime).getTime();
      return sum + ms / (1000 * 60 * 60);
    }, 0);
}

function sickDaysUsed(ctx: UserDataContext, employerId: string): number {
  return ctx.absences.filter(
    (a) => a.employerId === employerId && a.type === "sick_leave"
  ).length;
}

function employerLine(
  emp: EmployerWithBenefits,
  config: ContractConfig | undefined,
  locale: string
): string {
  const payType = config
    ? rewardTypeLabel(config.rewardType, locale)
    : rewardTypeLabel("hourly", locale);

  const templates: Record<string, string> = {
    he: `${emp.name} — ${payType}, ${emp.monthlySalary.toLocaleString()} ₪/חודש`,
    ar: `${emp.name} — ${payType}، ${emp.monthlySalary.toLocaleString()} ₪/شهر`,
    ru: `${emp.name} — ${payType}, ${emp.monthlySalary.toLocaleString()} ₪/мес`,
    uk: `${emp.name} — ${payType}, ${emp.monthlySalary.toLocaleString()} ₪/міс`,
    am: `${emp.name} — ${payType}፣ ${emp.monthlySalary.toLocaleString()} ₪/ወር`,
  };
  return templates[locale] ?? templates.he;
}

// ─── Topic-specific personalized generators ──────────────

type PersonalizedGenerator = (
  ctx: UserDataContext,
  locale: string
) => string | null;

function personalizedSickLeave(
  ctx: UserDataContext,
  locale: string
): string | null {
  if (ctx.employers.length === 0) return null;

  const lines = ctx.employers.map((emp) => {
    const used = sickDaysUsed(ctx, emp.id);
    const accumulated = emp.benefits.sickLeaveAccumulated;
    const remaining = Math.max(0, accumulated - used);

    const templates: Record<string, string> = {
      he: `• ${emp.name}: צברת ${accumulated} ימי מחלה, ניצלת ${used}, נותרו ${remaining}`,
      ar: `• ${emp.name}: تراكمت ${accumulated} يوم مرضي، استخدمت ${used}، بقي ${remaining}`,
      ru: `• ${emp.name}: накоплено ${accumulated} дней, использовано ${used}, осталось ${remaining}`,
      uk: `• ${emp.name}: накопичено ${accumulated} днів, використано ${used}, залишилось ${remaining}`,
      am: `• ${emp.name}: ${accumulated} ቀናት ተከማቹ፣ ${used} ተጠቀሙ፣ ${remaining} ቀሩ`,
    };
    return templates[locale] ?? templates.he;
  });

  const header: Record<string, string> = {
    he: "\n\n📋 הנתונים שלך:",
    ar: "\n\n📋 بياناتك:",
    ru: "\n\n📋 Ваши данные:",
    uk: "\n\n📋 Ваші дані:",
    am: "\n\n📋 የእርስዎ መረጃ:",
  };

  return (header[locale] ?? header.he) + "\n" + lines.join("\n");
}

function personalizedConvalescence(
  ctx: UserDataContext,
  locale: string
): string | null {
  if (ctx.employers.length === 0) return null;

  const lines = ctx.employers.map((emp) => {
    const years = emp.benefits.yearsEmployed;
    const days = emp.benefits.convalescenceDaysPerYear;
    const pay = emp.benefits.convalescencePayPerMonth;

    const templates: Record<string, string> = {
      he: `• ${emp.name}: ותק ${years} שנים → ${days} ימי הבראה (${pay} ₪/חודש)`,
      ar: `• ${emp.name}: أقدمية ${years} سنة → ${days} أيام (${pay} ₪/شهر)`,
      ru: `• ${emp.name}: стаж ${years} лет → ${days} дней (${pay} ₪/мес)`,
      uk: `• ${emp.name}: стаж ${years} років → ${days} днів (${pay} ₪/міс)`,
      am: `• ${emp.name}: ${years} ዓመት → ${days} ቀናት (${pay} ₪/ወር)`,
    };
    return templates[locale] ?? templates.he;
  });

  const header: Record<string, string> = {
    he: "\n\n📋 הנתונים שלך:",
    ar: "\n\n📋 بياناتك:",
    ru: "\n\n📋 Ваши данные:",
    uk: "\n\n📋 Ваші дані:",
    am: "\n\n📋 የእርስዎ መረጃ:",
  };

  return (header[locale] ?? header.he) + "\n" + lines.join("\n");
}

function personalizedPension(
  ctx: UserDataContext,
  locale: string
): string | null {
  if (ctx.employers.length === 0) return null;

  const lines = ctx.employers.map((emp) => {
    const deposit = ctx.depositStatuses.get(emp.id);
    const statusText = deposit
      ? depositStatusLabel(deposit.status, locale)
      : depositStatusLabel("pending", locale);
    const employerPension = Math.round(
      emp.monthlySalary * PENSION_EMPLOYER_RATE
    );
    const employeePension = Math.round(
      emp.monthlySalary * PENSION_EMPLOYEE_RATE
    );
    const severance = Math.round(
      emp.monthlySalary * PENSION_SEVERANCE_RATE
    );

    const templates: Record<string, string> = {
      he: `• ${emp.name}: מעסיק ${employerPension} ₪ + עובד ${employeePension} ₪ + פיצויים ${severance} ₪ | ${statusText}`,
      ar: `• ${emp.name}: صاحب عمل ${employerPension} ₪ + عامل ${employeePension} ₪ + تعويض ${severance} ₪ | ${statusText}`,
      ru: `• ${emp.name}: работодатель ${employerPension} ₪ + работник ${employeePension} ₪ + компенсация ${severance} ₪ | ${statusText}`,
      uk: `• ${emp.name}: роботодавець ${employerPension} ₪ + працівник ${employeePension} ₪ + компенсація ${severance} ₪ | ${statusText}`,
      am: `• ${emp.name}: አሠሪ ${employerPension} ₪ + ሠራተኛ ${employeePension} ₪ + ካሳ ${severance} ₪ | ${statusText}`,
    };
    return templates[locale] ?? templates.he;
  });

  const header: Record<string, string> = {
    he: "\n\n📋 ההפרשות החודשיות שלך:",
    ar: "\n\n📋 مساهماتك الشهرية:",
    ru: "\n\n📋 Ваши ежемесячные взносы:",
    uk: "\n\n📋 Ваші щомісячні внески:",
    am: "\n\n📋 የወርሃዊ መዋጮዎ:",
  };

  return (header[locale] ?? header.he) + "\n" + lines.join("\n");
}

// ─── Full status overview ────────────────────────────────

function generateStatusOverview(
  ctx: UserDataContext,
  locale: string
): string {
  if (ctx.employers.length === 0) {
    const noData: Record<string, string> = {
      he: "אין מעסיקים רשומים עדיין. הוסיפו מעסיק כדי לראות את הסטטוס שלכם.",
      ar: "لا يوجد أصحاب عمل مسجلين بعد. أضف صاحب عمل لرؤية حالتك.",
      ru: "Пока нет зарегистрированных работодателей. Добавьте работодателя, чтобы увидеть статус.",
      uk: "Поки немає зареєстрованих роботодавців. Додайте роботодавця, щоб побачити статус.",
      am: "ገና የተመዘገቡ አሠሪዎች የሉም። ሁኔታዎን ለማየት አሠሪ ያክሉ።",
    };
    return noData[locale] ?? noData.he;
  }

  const sections: string[] = [];

  // Header
  const header: Record<string, string> = {
    he: "📊 סיכום הסטטוס שלך:",
    ar: "📊 ملخص حالتك:",
    ru: "📊 Сводка вашего статуса:",
    uk: "📊 Зведення вашого статусу:",
    am: "📊 የሁኔታዎ ማጠቃለያ:",
  };
  sections.push(header[locale] ?? header.he);

  for (const emp of ctx.employers) {
    const config = ctx.contractConfigs.get(emp.id);
    sections.push("");
    sections.push(`━━ ${employerLine(emp, config, locale)} ━━`);

    const hours = Math.round(totalHoursWorked(ctx, emp.id) * 10) / 10;
    const earnings = Math.round(totalEarnings(ctx, emp.id));
    const sick = sickDaysUsed(ctx, emp.id);
    const sickAccumulated = emp.benefits.sickLeaveAccumulated;
    const sickRemaining = Math.max(0, sickAccumulated - sick);
    const convalDays = emp.benefits.convalescenceDaysPerYear;
    const convalPay = emp.benefits.convalescencePayPerMonth;
    const deposit = ctx.depositStatuses.get(emp.id);
    const statusText = deposit
      ? depositStatusLabel(deposit.status, locale)
      : depositStatusLabel("pending", locale);

    const detail: Record<string, string[]> = {
      he: [
        `  ⏱ שעות עבודה מוקלטות: ${hours} שעות | הכנסות: ${earnings} ₪`,
        `  🤒 ימי מחלה: צברת ${sickAccumulated}, ניצלת ${sick}, נותרו ${sickRemaining}`,
        `  🏖 הבראה: ${convalDays} ימים/שנה (${convalPay} ₪/חודש)`,
        `  📋 פנסיה: ${statusText}`,
      ],
      ar: [
        `  ⏱ ساعات مسجلة: ${hours} ساعة | أرباح: ${earnings} ₪`,
        `  🤒 أيام مرضية: تراكمت ${sickAccumulated}، استخدمت ${sick}، بقي ${sickRemaining}`,
        `  🏖 نقاهة: ${convalDays} يوم/سنة (${convalPay} ₪/شهر)`,
        `  📋 معاش: ${statusText}`,
      ],
      ru: [
        `  ⏱ Отработано: ${hours} ч | Заработок: ${earnings} ₪`,
        `  🤒 Больничные: накоплено ${sickAccumulated}, использовано ${sick}, осталось ${sickRemaining}`,
        `  🏖 Выздоровление: ${convalDays} дней/год (${convalPay} ₪/мес)`,
        `  📋 Пенсия: ${statusText}`,
      ],
      uk: [
        `  ⏱ Відпрацьовано: ${hours} год | Заробіток: ${earnings} ₪`,
        `  🤒 Лікарняні: накопичено ${sickAccumulated}, використано ${sick}, залишилось ${sickRemaining}`,
        `  🏖 Одужання: ${convalDays} днів/рік (${convalPay} ₪/міс)`,
        `  📋 Пенсія: ${statusText}`,
      ],
      am: [
        `  ⏱ የተመዘገበ ሰዓታት: ${hours} ሰዓት | ገቢ: ${earnings} ₪`,
        `  🤒 የታመመ ፈቃድ: ${sickAccumulated} ተከማቹ፣ ${sick} ተጠቀሙ፣ ${sickRemaining} ቀሩ`,
        `  🏖 እረፍት: ${convalDays} ቀናት/ዓመት (${convalPay} ₪/ወር)`,
        `  📋 ጡረታ: ${statusText}`,
      ],
    };

    sections.push(...(detail[locale] ?? detail.he));
  }

  return sections.join("\n");
}

// ─── Public API ──────────────────────────────────────────

/** Map of topics that have personalized appendices */
const topicGenerators: Partial<Record<TopicId, PersonalizedGenerator>> = {
  sick_leave: personalizedSickLeave,
  convalescence: personalizedConvalescence,
  pension: personalizedPension,
};

/**
 * Returns a personalized appendix for a matched topic, or null if
 * no personalization is available. For `my_status`, returns a full
 * standalone overview instead of an appendix.
 */
export function getPersonalizedAnswer(
  topicId: TopicId,
  ctx: UserDataContext,
  locale: string
): string | null {
  if (topicId === "my_status") {
    return generateStatusOverview(ctx, locale);
  }
  const generator = topicGenerators[topicId];
  return generator ? generator(ctx, locale) : null;
}
