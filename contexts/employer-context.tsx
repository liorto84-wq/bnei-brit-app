"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ContractConfig, Employer, EmployerWithBenefits } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import {
  fetchEmployers,
  insertEmployer,
  updateEmployer as updateEmployerQuery,
} from "@/lib/supabase/queries/employers";
import {
  fetchAllContractConfigs,
  upsertContractConfig,
} from "@/lib/supabase/queries/contract-configs";
import {
  fetchActiveLegalRates,
  fetchConvalescenceSchedule,
} from "@/lib/supabase/queries/legal-rates";
import {
  createEmployerWithBenefits,
  DEFAULT_BENEFIT_RATES,
  type BenefitRates,
} from "@/lib/benefits";

const DEFAULT_CANCELLATION_POLICY = {
  noticeHours: 24,
  shortNoticePayPercent: 100,
};

interface EmployerContextValue {
  employers: EmployerWithBenefits[];
  totalBalance: number;
  contractConfigs: Map<string, ContractConfig>;
  getContractConfig: (employerId: string) => ContractConfig | undefined;
  updateContractConfig: (config: ContractConfig) => void;
  addEmployer: (data: {
    name: string;
    monthlySalary: number;
    hoursPerWeek: number;
    startDate: string;
  }) => Promise<Employer>;
  updateEmployer: (
    id: string,
    data: {
      name?: string;
      monthlySalary?: number;
      hoursPerWeek?: number;
      startDate?: string;
    }
  ) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const EmployerContext = createContext<EmployerContextValue | null>(null);

export function EmployerProvider({ children }: { children: ReactNode }) {
  const [employers, setEmployers] = useState<EmployerWithBenefits[]>([]);
  const [contractConfigs, setContractConfigs] = useState<
    Map<string, ContractConfig>
  >(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const supabase = createClient();

      const [rawEmployers, rawConfigs, rawRates, rawSchedule] =
        await Promise.all([
          fetchEmployers(supabase),
          fetchAllContractConfigs(supabase),
          fetchActiveLegalRates(supabase).catch(() => null),
          fetchConvalescenceSchedule(supabase).catch(() => null),
        ]);

      // Build benefit rates from DB or use defaults
      const rates: BenefitRates = rawRates
        ? {
            convalescencePayPerDay: rawRates.convalescence_pay_per_day,
            sickLeaveDaysPerMonth: rawRates.sick_leave_days_per_month,
            maxSickDays: rawRates.max_sick_days,
            convalescenceSchedule:
              rawSchedule ?? DEFAULT_BENEFIT_RATES.convalescenceSchedule,
          }
        : DEFAULT_BENEFIT_RATES;

      const employersWithBenefits = rawEmployers.map((emp) =>
        createEmployerWithBenefits(emp, rates)
      );
      setEmployers(employersWithBenefits);

      // Build contract configs map
      const configMap = new Map<string, ContractConfig>();
      for (const config of rawConfigs) {
        configMap.set(config.employerId, config);
      }
      // Add defaults for employers without configs
      for (const emp of employersWithBenefits) {
        if (!configMap.has(emp.id)) {
          configMap.set(emp.id, {
            employerId: emp.id,
            rewardType: "hourly",
            cancellationPolicy: { ...DEFAULT_CANCELLATION_POLICY },
          });
        }
      }
      setContractConfigs(configMap);
    } catch (err) {
      console.error("Failed to load employer data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalBalance = useMemo(
    () => employers.reduce((sum, emp) => sum + emp.totalMonthly, 0),
    [employers]
  );

  const getContractConfig = useCallback(
    (employerId: string) => contractConfigs.get(employerId),
    [contractConfigs]
  );

  const addEmployerFn = useCallback(
    async (data: {
      name: string;
      monthlySalary: number;
      hoursPerWeek: number;
      startDate: string;
    }): Promise<Employer> => {
      const supabase = createClient();
      const newEmployer = await insertEmployer(supabase, data);
      await loadData();
      return newEmployer;
    },
    [loadData]
  );

  const updateEmployerFn = useCallback(
    async (
      id: string,
      data: {
        name?: string;
        monthlySalary?: number;
        hoursPerWeek?: number;
        startDate?: string;
      }
    ): Promise<void> => {
      // Optimistic update
      setEmployers((prev) =>
        prev.map((emp) => {
          if (emp.id !== id) return emp;
          const updated = {
            ...emp,
            ...(data.name !== undefined && { name: data.name }),
            ...(data.monthlySalary !== undefined && {
              monthlySalary: data.monthlySalary,
            }),
            ...(data.hoursPerWeek !== undefined && {
              hoursPerWeek: data.hoursPerWeek,
            }),
            ...(data.startDate !== undefined && { startDate: data.startDate }),
          };
          const totalMonthly =
            updated.monthlySalary + updated.benefits.convalescencePayPerMonth;
          return { ...updated, totalMonthly };
        })
      );

      // Persist to Supabase
      const supabase = createClient();
      updateEmployerQuery(supabase, id, data).catch((err) => {
        console.error("Failed to update employer:", err);
        loadData();
      });
    },
    [loadData]
  );

  const updateContractConfig = useCallback(
    (config: ContractConfig) => {
      // Optimistic update
      setContractConfigs((prev) => {
        const next = new Map(prev);
        next.set(config.employerId, config);
        return next;
      });

      // Persist to Supabase
      const supabase = createClient();
      upsertContractConfig(supabase, config).catch((err) => {
        console.error("Failed to save contract config:", err);
        // Revert on error by refetching
        loadData();
      });
    },
    [loadData]
  );

  return (
    <EmployerContext
      value={{
        employers,
        totalBalance,
        contractConfigs,
        getContractConfig,
        updateContractConfig,
        addEmployer: addEmployerFn,
        updateEmployer: updateEmployerFn,
        isLoading,
        error,
        refetch: loadData,
      }}
    >
      {children}
    </EmployerContext>
  );
}

export function useEmployers() {
  const context = useContext(EmployerContext);
  if (!context) {
    throw new Error("useEmployers must be used within an EmployerProvider");
  }
  return context;
}
