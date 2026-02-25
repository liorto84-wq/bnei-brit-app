-- Bnei Brit App: Initial Schema
-- Israeli domestic worker-employer management platform

-- Anonymous user UUID (used before auth is implemented)
-- All tables default user_id to this value
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'absence_type') THEN
    CREATE TYPE absence_type AS ENUM ('sick_leave', 'personal', 'vacation');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'holiday_decision_type') THEN
    CREATE TYPE holiday_decision_type AS ENUM ('cancel', 'reschedule');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deposit_status_type') THEN
    CREATE TYPE deposit_status_type AS ENUM ('compliant', 'pending', 'overdue');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reward_type') THEN
    CREATE TYPE reward_type AS ENUM ('hourly', 'daily', 'global');
  END IF;
END $$;

-- ============================================================
-- updated_at auto-trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- legal_rates: key-value store for labor law constants
-- ============================================================
CREATE TABLE IF NOT EXISTS legal_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_key TEXT NOT NULL,
  rate_value NUMERIC NOT NULL,
  description TEXT,
  effective_from DATE NOT NULL DEFAULT '2024-01-01',
  effective_to DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER legal_rates_updated_at
  BEFORE UPDATE ON legal_rates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE legal_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to legal_rates" ON legal_rates
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- convalescence_days_schedule: seniority-based days-per-year lookup
-- ============================================================
CREATE TABLE IF NOT EXISTS convalescence_days_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  min_years INT NOT NULL,
  max_years INT, -- NULL means no upper limit (e.g. 11+)
  days_per_year INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER convalescence_days_updated_at
  BEFORE UPDATE ON convalescence_days_schedule
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE convalescence_days_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to convalescence_days_schedule" ON convalescence_days_schedule
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- employers
-- ============================================================
CREATE TABLE IF NOT EXISTS employers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  name TEXT NOT NULL,
  monthly_salary NUMERIC NOT NULL,
  hours_per_week NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER employers_updated_at
  BEFORE UPDATE ON employers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE employers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to employers" ON employers
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- contract_configs: per-employer contract settings (1:1 with employers)
-- ============================================================
CREATE TABLE IF NOT EXISTS contract_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  reward_type reward_type NOT NULL DEFAULT 'hourly',
  notice_hours INT NOT NULL DEFAULT 24,
  short_notice_pay_percent INT NOT NULL DEFAULT 100,
  daily_rate NUMERIC,
  global_monthly_amount NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT contract_configs_employer_unique UNIQUE (employer_id),
  CONSTRAINT daily_rate_required CHECK (
    reward_type != 'daily' OR daily_rate IS NOT NULL
  ),
  CONSTRAINT global_amount_required CHECK (
    reward_type != 'global' OR global_monthly_amount IS NOT NULL
  )
);

CREATE TRIGGER contract_configs_updated_at
  BEFORE UPDATE ON contract_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE contract_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to contract_configs" ON contract_configs
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- work_sessions: timer sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS work_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,
  earnings NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT end_after_start CHECK (
    end_time IS NULL OR end_time > start_time
  ),
  CONSTRAINT earnings_only_when_ended CHECK (
    earnings IS NULL OR end_time IS NOT NULL
  )
);

CREATE TRIGGER work_sessions_updated_at
  BEFORE UPDATE ON work_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to work_sessions" ON work_sessions
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- absences: absence records
-- ============================================================
CREATE TABLE IF NOT EXISTS absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  absence_type absence_type NOT NULL,
  absence_date DATE NOT NULL,
  medical_certificate_file_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT medical_cert_only_for_sick CHECK (
    medical_certificate_file_name IS NULL OR absence_type = 'sick_leave'
  )
);

CREATE TRIGGER absences_updated_at
  BEFORE UPDATE ON absences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE absences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to absences" ON absences
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- holiday_decisions: per-employer per-holiday decisions
-- ============================================================
CREATE TABLE IF NOT EXISTS holiday_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  holiday_key TEXT NOT NULL,
  holiday_date DATE NOT NULL,
  decision holiday_decision_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT holiday_decisions_unique UNIQUE (employer_id, holiday_key)
);

CREATE TRIGGER holiday_decisions_updated_at
  BEFORE UPDATE ON holiday_decisions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE holiday_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to holiday_decisions" ON holiday_decisions
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- dismissed_holidays: per-user dismissed holiday alerts
-- ============================================================
CREATE TABLE IF NOT EXISTS dismissed_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  holiday_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT dismissed_holidays_unique UNIQUE (user_id, holiday_key)
);

ALTER TABLE dismissed_holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to dismissed_holidays" ON dismissed_holidays
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- compliance_deposits: deposit status tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS compliance_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  status deposit_status_type NOT NULL DEFAULT 'pending',
  last_deposit_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT compliant_requires_date CHECK (
    status != 'compliant' OR last_deposit_date IS NOT NULL
  ),
  CONSTRAINT compliance_deposits_employer_unique UNIQUE (employer_id)
);

CREATE TRIGGER compliance_deposits_updated_at
  BEFORE UPDATE ON compliance_deposits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE compliance_deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to compliance_deposits" ON compliance_deposits
  FOR ALL USING (true) WITH CHECK (true);
