import { createClient } from "@/lib/supabase/client";
import { mapEmployerRow, mapWorkSessionRow, mapContractConfigRow } from "@/lib/supabase/mappers";
import { calculateBenefits } from "@/lib/benefits";
import {
  PENSION_EMPLOYER_RATE,
  PENSION_EMPLOYEE_RATE,
  PENSION_SEVERANCE_RATE,
} from "@/lib/constants";

const pctE = (PENSION_EMPLOYER_RATE * 100).toFixed(1);
const pctW = (PENSION_EMPLOYEE_RATE * 100).toFixed(1);
const pctS = (PENSION_SEVERANCE_RATE * 100).toFixed(1);

export async function queryUserStatus(locale: string): Promise<string> {
  const supabase = createClient();

  const [employersRes, sessionsRes, contractsRes] = await Promise.all([
    supabase.from("employers").select("*").order("created_at", { ascending: true }),
    supabase.from("work_sessions").select("*").not("end_time", "is", null).order("end_time", { ascending: false }),
    supabase.from("contract_configs").select("*"),
  ]);

  if (employersRes.error) throw employersRes.error;
  if (sessionsRes.error) throw sessionsRes.error;
  if (contractsRes.error) throw contractsRes.error;

  const employers = (employersRes.data ?? []).map(mapEmployerRow);
  const sessions = (sessionsRes.data ?? []).map(mapWorkSessionRow);
  const contracts = (contractsRes.data ?? []).map(mapContractConfigRow);

  if (employers.length === 0) {
    return statusLabels[locale]?.noEmployers ?? statusLabels.he.noEmployers;
  }

  const labels = statusLabels[locale] ?? statusLabels.he;
  const contractMap = new Map(contracts.map((c) => [c.employerId, c]));
  const lines: string[] = [labels.header];

  for (const emp of employers) {
    const benefits = calculateBenefits(emp);
    const empSessions = sessions.filter((s) => s.employerId === emp.id);
    const totalEarnings = empSessions.reduce((sum, s) => sum + (s.earnings ?? 0), 0);
    const totalHours = empSessions.reduce((sum, s) => {
      if (!s.startTime || !s.endTime) return sum;
      return sum + (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 3600000;
    }, 0);
    const contract = contractMap.get(emp.id);

    lines.push("");
    lines.push(`--- ${emp.name} ---`);
    lines.push(`${labels.salary}: ${emp.monthlySalary.toLocaleString()} ₪`);
    lines.push(`${labels.seniority}: ${benefits.yearsEmployed} ${labels.years}`);
    lines.push(`${labels.convalescence}: ${benefits.convalescencePayPerMonth} ₪/${labels.month} (${benefits.convalescenceDaysPerYear} ${labels.daysYear})`);
    lines.push(`${labels.sickLeave}: ${benefits.sickLeaveAccumulated} ${labels.days}`);
    lines.push(`${labels.pension}: ${pctE}% + ${pctW}% + ${pctS}%`);

    if (contract) {
      lines.push(`${labels.contractType}: ${labels.rewardTypes[contract.rewardType] ?? contract.rewardType}`);
    }

    if (empSessions.length > 0) {
      lines.push(`${labels.sessionsCount}: ${empSessions.length} (${totalHours.toFixed(1)} ${labels.hours}, ${totalEarnings.toLocaleString()} ₪)`);
    } else {
      lines.push(labels.noSessions);
    }
  }

  return lines.join("\n");
}

interface Labels {
  noEmployers: string;
  header: string;
  salary: string;
  seniority: string;
  years: string;
  convalescence: string;
  month: string;
  daysYear: string;
  sickLeave: string;
  days: string;
  pension: string;
  contractType: string;
  rewardTypes: Record<string, string>;
  sessionsCount: string;
  hours: string;
  noSessions: string;
}

const statusLabels: Record<string, Labels> = {
  he: {
    noEmployers: "לא נמצאו מעסיקים במערכת.",
    header: "סיכום הזכויות שלך:",
    salary: "שכר חודשי",
    seniority: "ותק",
    years: "שנים",
    convalescence: "הבראה",
    month: "חודש",
    daysYear: "ימים/שנה",
    sickLeave: "ימי מחלה צבורים",
    days: "ימים",
    pension: "פנסיה (מעסיק+עובד+פיצויים)",
    contractType: "סוג חוזה",
    rewardTypes: { hourly: "שעתי", daily: "יומי", global: "גלובלי" },
    sessionsCount: "משמרות",
    hours: "שעות",
    noSessions: "אין משמרות רשומות",
  },
  ar: {
    noEmployers: "لم يتم العثور على أصحاب عمل في النظام.",
    header: "ملخص حقوقك:",
    salary: "الراتب الشهري",
    seniority: "الأقدمية",
    years: "سنوات",
    convalescence: "بدل النقاهة",
    month: "شهر",
    daysYear: "أيام/سنة",
    sickLeave: "أيام مرضية متراكمة",
    days: "أيام",
    pension: "معاش (صاحب عمل+عامل+تعويضات)",
    contractType: "نوع العقد",
    rewardTypes: { hourly: "بالساعة", daily: "يومي", global: "شامل" },
    sessionsCount: "ورديات",
    hours: "ساعات",
    noSessions: "لا توجد ورديات مسجلة",
  },
  ru: {
    noEmployers: "Работодатели не найдены в системе.",
    header: "Сводка ваших прав:",
    salary: "Месячная зарплата",
    seniority: "Стаж",
    years: "лет",
    convalescence: "Выздоровление",
    month: "мес",
    daysYear: "дней/год",
    sickLeave: "Накопленные больничные",
    days: "дней",
    pension: "Пенсия (работодатель+работник+компенсация)",
    contractType: "Тип договора",
    rewardTypes: { hourly: "Почасовая", daily: "Посуточная", global: "Глобальная" },
    sessionsCount: "Смены",
    hours: "часов",
    noSessions: "Нет зарегистрированных смен",
  },
  uk: {
    noEmployers: "Роботодавців не знайдено в системі.",
    header: "Зведення ваших прав:",
    salary: "Місячна зарплата",
    seniority: "Стаж",
    years: "років",
    convalescence: "Одужання",
    month: "міс",
    daysYear: "днів/рік",
    sickLeave: "Накопичені лікарняні",
    days: "днів",
    pension: "Пенсія (роботодавець+працівник+компенсація)",
    contractType: "Тип договору",
    rewardTypes: { hourly: "Погодинна", daily: "Поденна", global: "Глобальна" },
    sessionsCount: "Зміни",
    hours: "годин",
    noSessions: "Немає зареєстрованих змін",
  },
  am: {
    noEmployers: "በስርዓቱ ውስጥ አሠሪዎች አልተገኙም።",
    header: "የመብቶችዎ ማጠቃለያ:",
    salary: "ወርሃዊ ደመወዝ",
    seniority: "አገልግሎት",
    years: "ዓመታት",
    convalescence: "እረፍት",
    month: "ወር",
    daysYear: "ቀናት/ዓመት",
    sickLeave: "የተከማቸ የታመመ ፈቃድ",
    days: "ቀናት",
    pension: "ጡረታ (አሠሪ+ሠራተኛ+ካሳ)",
    contractType: "የውል ዓይነት",
    rewardTypes: { hourly: "በሰዓት", daily: "በቀን", global: "ጠቅላላ" },
    sessionsCount: "ፈረቃዎች",
    hours: "ሰዓታት",
    noSessions: "የተመዘገቡ ፈረቃዎች የሉም",
  },
};
