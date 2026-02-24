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
  EmployerDepositStatus,
  DepositStatus,
  ComplianceViewMode,
} from "@/lib/types";
import { useEmployers } from "./employer-context";

type ComplianceTab = "pension" | "ni" | "peaceOfMind";

interface ComplianceContextValue {
  depositStatuses: Map<string, EmployerDepositStatus>;
  viewMode: ComplianceViewMode;
  activeTab: ComplianceTab;
  markAsDeposited: (employerId: string) => void;
  setViewMode: (mode: ComplianceViewMode) => void;
  setActiveTab: (tab: ComplianceTab) => void;
}

const ComplianceContext = createContext<ComplianceContextValue | null>(null);

const MOCK_STATUSES: Record<string, DepositStatus> = {
  "1": "compliant",
  "2": "pending",
  "3": "compliant",
};

export function ComplianceProvider({ children }: { children: ReactNode }) {
  const { employers } = useEmployers();
  const [depositStatuses, setDepositStatuses] = useState<
    Map<string, EmployerDepositStatus>
  >(new Map());
  const [viewMode, setViewMode] = useState<ComplianceViewMode>("worker");
  const [activeTab, setActiveTab] = useState<ComplianceTab>("pension");

  useEffect(() => {
    const initial = new Map<string, EmployerDepositStatus>();
    employers.forEach((emp) => {
      const status = MOCK_STATUSES[emp.id] ?? "pending";
      initial.set(emp.id, {
        employerId: emp.id,
        status,
        lastDepositDate: status === "compliant" ? "2026-01-15" : null,
      });
    });
    setDepositStatuses(initial);
  }, [employers]);

  const markAsDeposited = useCallback((employerId: string) => {
    setDepositStatuses((prev) => {
      const next = new Map(prev);
      next.set(employerId, {
        employerId,
        status: "compliant",
        lastDepositDate: new Date().toISOString().split("T")[0],
      });
      return next;
    });
  }, []);

  return (
    <ComplianceContext
      value={{
        depositStatuses,
        viewMode,
        activeTab,
        markAsDeposited,
        setViewMode,
        setActiveTab,
      }}
    >
      {children}
    </ComplianceContext>
  );
}

export function useCompliance() {
  const context = useContext(ComplianceContext);
  if (!context) {
    throw new Error("useCompliance must be used within a ComplianceProvider");
  }
  return context;
}
