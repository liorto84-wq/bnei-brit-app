"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type {
  WorkSession,
  AbsenceRecord,
  AbsenceType,
  HolidayDecision,
  HolidayDecisionRecord,
} from "@/lib/types";
import { getHourlyRate } from "@/lib/utils";
import { useEmployers } from "./employer-context";
import { createClient } from "@/lib/supabase/client";
import {
  fetchActiveSessions,
  fetchCompletedSessions,
  insertWorkSession,
  endWorkSession,
} from "@/lib/supabase/queries/work-sessions";
import {
  fetchAbsences,
  insertAbsence,
} from "@/lib/supabase/queries/absences";
import {
  fetchHolidayDecisions,
  insertHolidayDecision,
  fetchDismissedHolidays,
  dismissHoliday as dismissHolidayQuery,
} from "@/lib/supabase/queries/holidays";
import type { AbsenceTypeEnum, HolidayDecisionEnum } from "@/lib/supabase/database.types";

interface VisitReportingContextValue {
  // Timer
  activeSessions: Map<string, WorkSession>;
  completedSessions: WorkSession[];
  startSession: (employerId: string) => void;
  endSession: (employerId: string) => void;
  getLastSession: (employerId: string) => WorkSession | undefined;

  // Absences
  absences: AbsenceRecord[];
  reportAbsence: (
    employerId: string,
    type: AbsenceType,
    date: string,
    medicalCertificateFileName?: string
  ) => void;
  getSickDaysUsed: (employerId: string) => number;

  // Holidays
  holidayDecisions: HolidayDecisionRecord[];
  dismissedHolidays: Set<string>;
  recordHolidayDecision: (
    employerId: string,
    holidayDate: string,
    holidayKey: string,
    decision: HolidayDecision
  ) => void;
  dismissHoliday: (holidayKey: string) => void;
}

const VisitReportingContext =
  createContext<VisitReportingContextValue | null>(null);

export function VisitReportingProvider({ children }: { children: ReactNode }) {
  const { employers, isLoading: employersLoading } = useEmployers();

  const [activeSessions, setActiveSessions] = useState<
    Map<string, WorkSession>
  >(new Map());
  const [completedSessions, setCompletedSessions] = useState<WorkSession[]>([]);
  const [absences, setAbsences] = useState<AbsenceRecord[]>([]);
  const [holidayDecisions, setHolidayDecisions] = useState<
    HolidayDecisionRecord[]
  >([]);
  const [dismissedHolidays, setDismissedHolidays] = useState<Set<string>>(
    new Set()
  );

  // Load data from Supabase on mount (after employers are loaded)
  useEffect(() => {
    if (employersLoading) return;

    const supabase = createClient();

    Promise.all([
      fetchActiveSessions(supabase),
      fetchCompletedSessions(supabase),
      fetchAbsences(supabase),
      fetchHolidayDecisions(supabase),
      fetchDismissedHolidays(supabase),
    ])
      .then(([active, completed, abs, decisions, dismissed]) => {
        const activeMap = new Map<string, WorkSession>();
        for (const s of active) {
          activeMap.set(s.employerId, s);
        }
        setActiveSessions(activeMap);
        setCompletedSessions(completed);
        setAbsences(abs);
        setHolidayDecisions(decisions);
        setDismissedHolidays(dismissed);
      })
      .catch((err) => {
        console.error("Failed to load visit reporting data:", err);
      });
  }, [employersLoading]);

  const startSession = useCallback((employerId: string) => {
    const supabase = createClient();

    // Optimistic: create a temp session locally
    const tempSession: WorkSession = {
      id: `temp-${Date.now()}`,
      employerId,
      startTime: new Date().toISOString(),
    };
    setActiveSessions((prev) => {
      const next = new Map(prev);
      next.set(employerId, tempSession);
      return next;
    });

    // Persist to Supabase
    insertWorkSession(supabase, employerId)
      .then((session) => {
        setActiveSessions((prev) => {
          const next = new Map(prev);
          next.set(employerId, session);
          return next;
        });
      })
      .catch((err) => {
        console.error("Failed to start session:", err);
        // Revert optimistic update
        setActiveSessions((prev) => {
          const next = new Map(prev);
          next.delete(employerId);
          return next;
        });
      });
  }, []);

  const endSessionCb = useCallback(
    (employerId: string) => {
      setActiveSessions((prev) => {
        const session = prev.get(employerId);
        if (!session) return prev;

        const endTime = new Date().toISOString();
        const elapsedMs =
          new Date(endTime).getTime() - new Date(session.startTime).getTime();
        const elapsedHours = elapsedMs / (1000 * 60 * 60);

        const employer = employers.find((e) => e.id === employerId);
        const hourlyRate = employer ? getHourlyRate(employer) : 0;
        const earnings = Math.round(elapsedHours * hourlyRate * 100) / 100;

        const completed: WorkSession = {
          ...session,
          endTime,
          earnings,
        };

        // Optimistic update
        setCompletedSessions((prev) => [completed, ...prev]);

        // Persist to Supabase (skip temp sessions that failed to save)
        if (!session.id.startsWith("temp-")) {
          const supabase = createClient();
          endWorkSession(supabase, session.id, earnings).catch((err) => {
            console.error("Failed to end session:", err);
          });
        }

        const next = new Map(prev);
        next.delete(employerId);
        return next;
      });
    },
    [employers]
  );

  const getLastSession = useCallback(
    (employerId: string) => {
      return completedSessions.find((s) => s.employerId === employerId);
    },
    [completedSessions]
  );

  const reportAbsence = useCallback(
    (
      employerId: string,
      type: AbsenceType,
      date: string,
      medicalCertificateFileName?: string
    ) => {
      // Optimistic update
      const tempRecord: AbsenceRecord = {
        id: `temp-${Date.now()}`,
        employerId,
        type,
        date,
        createdAt: new Date().toISOString(),
        medicalCertificateFileName,
      };
      setAbsences((prev) => [...prev, tempRecord]);

      // Persist to Supabase
      const supabase = createClient();
      insertAbsence(
        supabase,
        employerId,
        type as AbsenceTypeEnum,
        date,
        medicalCertificateFileName
      )
        .then((record) => {
          setAbsences((prev) =>
            prev.map((a) => (a.id === tempRecord.id ? record : a))
          );
        })
        .catch((err) => {
          console.error("Failed to report absence:", err);
          setAbsences((prev) => prev.filter((a) => a.id !== tempRecord.id));
        });
    },
    []
  );

  const getSickDaysUsed = useCallback(
    (employerId: string) => {
      return absences.filter(
        (a) => a.employerId === employerId && a.type === "sick_leave"
      ).length;
    },
    [absences]
  );

  const recordHolidayDecision = useCallback(
    (
      employerId: string,
      holidayDate: string,
      holidayKey: string,
      decision: HolidayDecision
    ) => {
      // Optimistic update
      setHolidayDecisions((prev) => [
        ...prev,
        { employerId, holidayDate, holidayKey, decision },
      ]);

      // Persist to Supabase
      const supabase = createClient();
      insertHolidayDecision(
        supabase,
        employerId,
        holidayKey,
        holidayDate,
        decision as HolidayDecisionEnum
      ).catch((err) => {
        console.error("Failed to record holiday decision:", err);
      });
    },
    []
  );

  const dismissHolidayCb = useCallback((holidayKey: string) => {
    // Optimistic update
    setDismissedHolidays((prev) => {
      const next = new Set(prev);
      next.add(holidayKey);
      return next;
    });

    // Persist to Supabase
    const supabase = createClient();
    dismissHolidayQuery(supabase, holidayKey).catch((err) => {
      console.error("Failed to dismiss holiday:", err);
    });
  }, []);

  return (
    <VisitReportingContext
      value={{
        activeSessions,
        completedSessions,
        startSession,
        endSession: endSessionCb,
        getLastSession,
        absences,
        reportAbsence,
        getSickDaysUsed,
        holidayDecisions,
        dismissedHolidays,
        recordHolidayDecision,
        dismissHoliday: dismissHolidayCb,
      }}
    >
      {children}
    </VisitReportingContext>
  );
}

export function useVisitReporting() {
  const context = useContext(VisitReportingContext);
  if (!context) {
    throw new Error(
      "useVisitReporting must be used within a VisitReportingProvider"
    );
  }
  return context;
}
