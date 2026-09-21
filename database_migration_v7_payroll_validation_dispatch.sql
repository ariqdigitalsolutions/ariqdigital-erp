-- General Business ERP v7 production migration add-on
-- Covers required-field validation, payroll approvals, payslips, bank payments, dispatch and audit trail.

create table if not exists payroll_requests (
  id bigserial primary key,
  company_id uuid,
  request_type text not null check (request_type in ('Employee Addition','Employee Deletion','Payroll Run')),
  status text not null default 'Pending Approval',
  requested_by uuid not null,
  requested_at timestamptz not null default now(),
  description text,
  payload jsonb not null default '{}'::jsonb,
  reviewed_by uuid,
  reviewed_at timestamptz,
  reason text,
  constraint payroll_requests_status_check check (status in ('Pending Approval','Approved','Disapproved'))
);

create table if not exists employees (
  id bigserial primary key,
  company_id uuid,
  employee_name text not null,
  employee_number text not null unique,
  national_id text not null,
  job_title text not null,
  department text not null,
  email text not null,
  phone text not null,
  bank_name text not null,
  bank_account_number text not null,
  branch text not null,
  salary_wage numeric(18,2) not null check (salary_wage > 0),
  allowances numeric(18,2) not null default 0,
  deductions numeric(18,2) not null default 0,
  employment_status text not null default 'Active',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  approved_request_id bigint references payroll_requests(id)
);

create table if not exists payroll_runs (
  id bigserial primary key,
  company_id uuid,
  payroll_number text not null unique,
  payroll_period text not null,
  status text not null default 'Pending Approval',
  gross_total numeric(18,2) not null default 0,
  deduction_total numeric(18,2) not null default 0,
  net_total numeric(18,2) not null default 0,
  submitted_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  source_request_id bigint references payroll_requests(id),
  created_at timestamptz not null default now()
);

create table if not exists payroll_run_lines (
  id bigserial primary key,
  payroll_run_id bigint references payroll_runs(id) on delete cascade,
  employee_id bigint references employees(id),
  employee_number text not null,
  employee_name text not null,
  email text not null,
  bank_name text not null,
  bank_account_number text not null,
  branch text not null,
  gross_pay numeric(18,2) not null,
  deductions numeric(18,2) not null,
  net_pay numeric(18,2) not null check (net_pay > 0)
);

create table if not exists payslips (
  id bigserial primary key,
  payroll_run_id bigint references payroll_runs(id) on delete cascade,
  employee_id bigint references employees(id),
  pdf_url text,
  pdf_status text not null default 'Queued',
  email_status text not null default 'Queued',
  password_rule text not null default 'Employee number',
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists bank_payment_requests (
  id bigserial primary key,
  company_id uuid,
  payment_type text not null,
  beneficiary_name text not null,
  bank_name text not null,
  bank_account_number text not null,
  branch text not null,
  amount numeric(18,2) not null check (amount > 0),
  currency text not null default 'USD',
  reference text not null,
  status text not null default 'Prepared',
  approved_by uuid,
  approved_at timestamptz,
  processed_at timestamptz,
  bank_reference text,
  payroll_run_id bigint references payroll_runs(id),
  created_at timestamptz not null default now()
);

create table if not exists dispatches (
  id bigserial primary key,
  company_id uuid,
  invoice_id bigint not null,
  dispatch_reference text not null unique,
  dispatched_by uuid not null,
  dispatched_at timestamptz not null default now(),
  delivery_details text,
  driver_vehicle text,
  status text not null default 'Dispatched'
);

create table if not exists audit_logs (
  id bigserial primary key,
  company_id uuid,
  action_requested text not null,
  requested_by uuid,
  requested_at timestamptz not null default now(),
  approved_disapproved_by uuid,
  reviewed_at timestamptz,
  final_status text not null,
  reason text,
  details jsonb not null default '{}'::jsonb
);

-- Recommended: enable RLS and restrict approval actions to Admin only.
-- Salary transfers, PDF generation and payslip emails must run from a secure backend worker.
