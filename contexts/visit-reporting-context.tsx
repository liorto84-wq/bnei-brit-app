"use client";

import {
  createContext,
  useCallback,
  useContext,
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
import { generateId, getHourlyRate } from "@/lib/utils";
import { useEmployers } from "./employer-context";

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
  const { employers } = useEmployers();

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

  const startSession = useCallback((employerId: string) => {
    const session: WorkSession = {
      id: generateId(),
      employerId,
      startTime: new Date().toISOString(),
    };
    setActiveSessions((prev) => {
      const next = new Map(prev);
      next.set(employerId, session);
      return next;
    });
  }, []);

  const endSession = useCallback(
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

        setCompletedSessions((prev) => [completed, ...prev]);

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
      const record: AbsenceRecord = {
        id: generateId(),
        employerId,
        type,
        date,
        createdAt: new Date().toISOString(),
        medicalCertificateFileName,
      };
      setAbsences((prev) => [...prev, record]);
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
      setHolidayDecisions((prev) => [
        ...prev,
        { employerId, holidayDate, holidayKey, decision },
      ]);
    },
    []
  );

  const dismissHoliday = useCallback((holidayKey: string) => {
    setDismissedHolidays((prev) => {
      const next = new Set(prev);
      next.add(holidayKey);
      return next;
    });
  }, []);

  return (
    <VisitReportingContext
      value={{
        activeSessions,
        completedSessions,
        startSession,
        endSession,
        getLastSession,
        absences,
        reportAbsence,
        getSickDaysUsed,
        holidayDecisions,
        dismissedHolidays,
        recordHolidayDecision,
        dismissHoliday,
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
