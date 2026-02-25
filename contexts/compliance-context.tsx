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
  ComplianceViewMode,
} from "@/lib/types";
import { useEmployers } from "./employer-context";
import { createClient } from "@/lib/supabase/client";
import {
  fetchDepositStatuses,
  markAsDeposited as markAsDepositedQuery,
} from "@/lib/supabase/queries/compliance";

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

export function ComplianceProvider({ children }: { children: ReactNode }) {
  const { employers, isLoading: employersLoading } = useEmployers();
  const [depositStatuses, setDepositStatuses] = useState<
    Map<string, EmployerDepositStatus>
  >(new Map());
  const [viewMode, setViewMode] = useState<ComplianceViewMode>("worker");
  const [activeTab, setActiveTab] = useState<ComplianceTab>("pension");

  useEffect(() => {
    if (employersLoading) return;

    const supabase = createClient();
    fetchDepositStatuses(supabase)
      .then((statuses) => {
        const statusMap = new Map<string, EmployerDepositStatus>();
        for (const s of statuses) {
          statusMap.set(s.employerId, s);
        }
        // Add default "pending" for employers without a deposit record
        for (const emp of employers) {
          if (!statusMap.has(emp.id)) {
            statusMap.set(emp.id, {
              employerId: emp.id,
              status: "pending",
              lastDepositDate: null,
            });
          }
        }
        setDepositStatuses(statusMap);
      })
      .catch((err) => {
        console.error("Failed to load compliance data:", err);
        // Fallback: set all employers as pending
        const fallbackMap = new Map<string, EmployerDepositStatus>();
        employers.forEach((emp) => {
          fallbackMap.set(emp.id, {
            employerId: emp.id,
            status: "pending",
            lastDepositDate: null,
          });
        });
        setDepositStatuses(fallbackMap);
      });
  }, [employers, employersLoading]);

  const markAsDeposited = useCallback((employerId: string) => {
    const today = new Date().toISOString().split("T")[0];

    // Optimistic update
    setDepositStatuses((prev) => {
      const next = new Map(prev);
      next.set(employerId, {
        employerId,
        status: "compliant",
        lastDepositDate: today,
      });
      return next;
    });

    // Persist to Supabase
    const supabase = createClient();
    markAsDepositedQuery(supabase, employerId).catch((err) => {
      console.error("Failed to mark as deposited:", err);
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
