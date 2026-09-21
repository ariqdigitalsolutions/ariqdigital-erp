-- General Business ERP v6 production migration sketch
-- This is a PostgreSQL/Supabase-ready design outline for the new accounting UX modules.

create table if not exists close_periods (
  id bigserial primary key,
  company_id uuid,
  period_name text not null,
  start_date date,
  end_date date,
  status text not null default 'Open',
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists close_tasks (
  id bigserial primary key,
  company_id uuid,
  close_period_id bigint references close_periods(id),
  entity_name text,
  task_category text not null,
  task_name text not null,
  description text,
  owner_user_id uuid,
  start_date date,
  due_date date,
  dependency text,
  schedule_status text default 'On track',
  task_status text default 'Not started',
  completed_by uuid,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists bank_reconciliations (
  id bigserial primary key,
  company_id uuid,
  bank_account_id bigint,
  statement_ending_date date not null,
  statement_ending_balance numeric(18,2) not null,
  book_balance numeric(18,2) not null default 0,
  difference numeric(18,2) not null default 0,
  status text not null default 'In-progress',
  attachment_url text,
  created_by uuid,
  approved_by uuid,
  created_at timestamptz default now(),
  approved_at timestamptz
);

create table if not exists reconciliation_matches (
  id bigserial primary key,
  reconciliation_id bigint references bank_reconciliations(id),
  bank_transaction_id bigint,
  erp_reference text,
  match_type text not null default 'manual',
  matched_by uuid,
  matched_at timestamptz default now()
);

create table if not exists report_definitions (
  id bigserial primary key,
  company_id uuid,
  report_name text not null,
  report_type text not null,
  report_audience text,
  description text,
  module_key text,
  export_formats text[],
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists journal_approval_requests (
  id bigserial primary key,
  company_id uuid,
  request_status text not null default 'Submitted',
  requester_user_id uuid,
  journal_type text not null,
  transaction_type text,
  reference_no text unique,
  description text,
  outlier_flag boolean default false,
  approval_status text not null default 'Pending Approval',
  approved_by uuid,
  approved_at timestamptz,
  decline_reason text,
  created_at timestamptz default now()
);

create table if not exists journal_approval_lines (
  id bigserial primary key,
  request_id bigint references journal_approval_requests(id) on delete cascade,
  account_id bigint,
  department text,
  location text,
  debit numeric(18,2) default 0,
  credit numeric(18,2) default 0,
  memo text
);

-- Security notes:
-- 1. Enable RLS on all tables.
-- 2. Permit only Admin/Accountant roles to read/write accounting UX tables.
-- 3. All approve/decline actions must be server-side and audited.
-- 4. Bank credentials and attachments must be encrypted/stored outside public buckets.
