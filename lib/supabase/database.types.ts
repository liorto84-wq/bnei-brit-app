// Hand-written types matching the Supabase schema.
// Replace with generated types once Supabase CLI is set up:
//   npx supabase gen types typescript --local > lib/supabase/database.types.ts

export type AbsenceTypeEnum = "sick_leave" | "personal" | "vacation";
export type HolidayDecisionEnum = "cancel" | "reschedule";
export type DepositStatusEnum = "compliant" | "pending" | "overdue";
export type RewardTypeEnum = "hourly" | "daily" | "global";

export interface Database {
  public: {
    Tables: {
      legal_rates: {
        Row: {
          id: string;
          rate_key: string;
          rate_value: number;
          description: string | null;
          effective_from: string;
          effective_to: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          rate_key: string;
          rate_value: number;
          description?: string | null;
          effective_from?: string;
          effective_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          rate_key?: string;
          rate_value?: number;
          description?: string | null;
          effective_from?: string;
          effective_to?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      convalescence_days_schedule: {
        Row: {
          id: string;
          min_years: number;
          max_years: number | null;
          days_per_year: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          min_years: number;
          max_years?: number | null;
          days_per_year: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          min_years?: number;
          max_years?: number | null;
          days_per_year?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      employers: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          monthly_salary: number;
          hours_per_week: number;
          start_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          monthly_salary: number;
          hours_per_week: number;
          start_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          monthly_salary?: number;
          hours_per_week?: number;
          start_date?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      contract_configs: {
        Row: {
          id: string;
          employer_id: string;
          user_id: string;
          reward_type: RewardTypeEnum;
          notice_hours: number;
          short_notice_pay_percent: number;
          daily_rate: number | null;
          global_monthly_amount: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employer_id: string;
          user_id?: string;
          reward_type?: RewardTypeEnum;
          notice_hours?: number;
          short_notice_pay_percent?: number;
          daily_rate?: number | null;
          global_monthly_amount?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          reward_type?: RewardTypeEnum;
          notice_hours?: number;
          short_notice_pay_percent?: number;
          daily_rate?: number | null;
          global_monthly_amount?: number | null;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contract_configs_employer_id_fkey";
            columns: ["employer_id"];
            isOneToOne: true;
            referencedRelation: "employers";
            referencedColumns: ["id"];
          },
        ];
      };
      work_sessions: {
        Row: {
          id: string;
          employer_id: string;
          user_id: string;
          start_time: string;
          end_time: string | null;
          earnings: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employer_id: string;
          user_id?: string;
          start_time?: string;
          end_time?: string | null;
          earnings?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          end_time?: string | null;
          earnings?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "work_sessions_employer_id_fkey";
            columns: ["employer_id"];
            isOneToOne: false;
            referencedRelation: "employers";
            referencedColumns: ["id"];
          },
        ];
      };
      absences: {
        Row: {
          id: string;
          employer_id: string;
          user_id: string;
          absence_type: AbsenceTypeEnum;
          absence_date: string;
          medical_certificate_file_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employer_id: string;
          user_id?: string;
          absence_type: AbsenceTypeEnum;
          absence_date: string;
          medical_certificate_file_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          absence_type?: AbsenceTypeEnum;
          absence_date?: string;
          medical_certificate_file_name?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "absences_employer_id_fkey";
            columns: ["employer_id"];
            isOneToOne: false;
            referencedRelation: "employers";
            referencedColumns: ["id"];
          },
        ];
      };
      holiday_decisions: {
        Row: {
          id: string;
          employer_id: string;
          user_id: string;
          holiday_key: string;
          holiday_date: string;
          decision: HolidayDecisionEnum;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employer_id: string;
          user_id?: string;
          holiday_key: string;
          holiday_date: string;
          decision: HolidayDecisionEnum;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          decision?: HolidayDecisionEnum;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "holiday_decisions_employer_id_fkey";
            columns: ["employer_id"];
            isOneToOne: false;
            referencedRelation: "employers";
            referencedColumns: ["id"];
          },
        ];
      };
      dismissed_holidays: {
        Row: {
          id: string;
          user_id: string;
          holiday_key: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          holiday_key: string;
          created_at?: string;
        };
        Update: {
          holiday_key?: string;
        };
        Relationships: [];
      };
      compliance_deposits: {
        Row: {
          id: string;
          employer_id: string;
          user_id: string;
          status: DepositStatusEnum;
          last_deposit_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employer_id: string;
          user_id?: string;
          status?: DepositStatusEnum;
          last_deposit_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: DepositStatusEnum;
          last_deposit_date?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "compliance_deposits_employer_id_fkey";
            columns: ["employer_id"];
            isOneToOne: true;
            referencedRelation: "employers";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      absence_type: AbsenceTypeEnum;
      holiday_decision_type: HolidayDecisionEnum;
      deposit_status_type: DepositStatusEnum;
      reward_type: RewardTypeEnum;
    };
  };
}
