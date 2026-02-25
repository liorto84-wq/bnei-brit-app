-- Bnei Brit App: Seed Data
-- Populates initial legal rates, convalescence schedule, mock employers, and defaults

-- ============================================================
-- Legal rates (Israeli labor law constants)
-- ============================================================
INSERT INTO legal_rates (rate_key, rate_value, description) VALUES
  ('convalescence_pay_per_day', 418, 'Convalescence pay per day in ILS (2024 rate)'),
  ('sick_leave_days_per_month', 1.5, 'Sick leave accumulation: days per month'),
  ('max_sick_days', 90, 'Maximum accumulable sick days'),
  ('pension_employer_rate', 0.065, 'Pension employer contribution rate (6.5%)'),
  ('pension_employee_rate', 0.06, 'Pension employee contribution rate (6%)'),
  ('pension_severance_rate', 0.06, 'Pension severance contribution rate (6%)'),
  ('ni_reduced_rate_threshold', 7122, 'NI reduced rate income threshold in ILS'),
  ('ni_full_rate', 0.07, 'NI full rate (7%) above threshold'),
  ('ni_reduced_rate', 0.004, 'NI reduced rate (0.4%) below threshold');

-- ============================================================
-- Convalescence days schedule (seniority-based)
-- ============================================================
INSERT INTO convalescence_days_schedule (min_years, max_years, days_per_year) VALUES
  (1, 1, 5),    -- Year 1: 5 days
  (2, 3, 6),    -- Years 2-3: 6 days
  (4, 10, 7),   -- Years 4-10: 7 days
  (11, NULL, 8); -- Years 11+: 8 days

-- ============================================================
-- Mock employers (deterministic UUIDs for consistency)
-- ============================================================
INSERT INTO employers (id, name, monthly_salary, hours_per_week, start_date) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'משפחת כהן', 3500, 12, '2022-03-15'),
  ('a0000000-0000-0000-0000-000000000002', 'משפחת לוי', 2800, 8, '2023-09-01'),
  ('a0000000-0000-0000-0000-000000000003', 'משפחת מזרחי', 4200, 16, '2021-01-10');

-- ============================================================
-- Default contract configs (hourly, 24h notice, 100% short notice pay)
-- ============================================================
INSERT INTO contract_configs (employer_id, reward_type, notice_hours, short_notice_pay_percent) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'hourly', 24, 100),
  ('a0000000-0000-0000-0000-000000000002', 'hourly', 24, 100),
  ('a0000000-0000-0000-0000-000000000003', 'hourly', 24, 100);

-- ============================================================
-- Default compliance deposit statuses (matching current mock)
-- ============================================================
INSERT INTO compliance_deposits (employer_id, status, last_deposit_date) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'compliant', '2026-01-15'),
  ('a0000000-0000-0000-0000-000000000002', 'pending', NULL),
  ('a0000000-0000-0000-0000-000000000003', 'compliant', '2026-01-15');
