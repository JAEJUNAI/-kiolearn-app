// 앱 테이블 DDL (06 명세 7장). 접두사 app_ 로 홈페이지 테이블과 구분. RLS는 켜 두고 정책을 두지 않아 서버(service role)만 접근.
// 실행: 홈페이지 API의 op 'app-setup'(SETUP_TOKEN) 또는 Supabase SQL 편집기에 붙여 넣기. 멱등(여러 번 실행 가능).
module.exports = `
create extension if not exists pgcrypto;

create table if not exists public.app_accounts (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,
  name text default '',
  roles text[] default array['family','seeker'],
  last_mode text default 'family',
  trainee_id uuid,
  push_tokens jsonb default '[]'::jsonb,
  status text default 'active',
  first_instructor_login_at timestamptz,
  delete_requested_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.app_otps (
  id uuid primary key default gen_random_uuid(),
  phone text not null, code_hash text not null, expires_at timestamptz not null,
  attempts int default 0, locked_until timestamptz, used_at timestamptz, created_at timestamptz default now()
);
create index if not exists idx_app_otps_phone on public.app_otps(phone, created_at desc);

create table if not exists public.app_recipients (
  id uuid primary key default gen_random_uuid(),
  type text default 'senior', name text not null, honorific text default '어머님', honorific_teacher text default '선생님',
  sigungu text default '', dong text default '', dong_lat double precision, dong_lng double precision, address_detail text default '',
  device_brand text default '', device_os text default '', pains text[] default '{}', ops_memo text default '',
  consult_done_at timestamptz, cohabit boolean, photo_consent boolean default false, linked_account_id uuid, org_id uuid,
  created_by uuid, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.app_recipient_guardians (
  recipient_id uuid references public.app_recipients(id) on delete cascade,
  account_id uuid references public.app_accounts(id) on delete cascade,
  is_primary boolean default false, can_pay boolean default false, can_view boolean default true, relation text default '', sms_only_phone text,
  created_at timestamptz default now(), primary key (recipient_id, account_id)
);
create table if not exists public.app_invites (
  token text primary key, recipient_id uuid references public.app_recipients(id) on delete cascade, created_by uuid,
  perms jsonb default '{}'::jsonb, expires_at timestamptz, used_at timestamptz, used_by uuid, created_at timestamptz default now()
);
create table if not exists public.app_passes (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references public.app_recipients(id) on delete cascade,
  product text not null, total numeric(4,1) not null, remaining numeric(4,1) not null, price int not null, extras jsonb default '[]'::jsonb,
  status text default 'draft', method text, paid_at timestamptz, promise_due_at timestamptz, promise_extended boolean default false,
  valid_until timestamptz, extended_once boolean default false, source text default 'pg', source_ref text, pg_payment_key text,
  slot1 jsonb, slot2 jsonb, no_show_count int default 0,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.app_instructor_settings (
  account_id uuid primary key references public.app_accounts(id) on delete cascade,
  enabled boolean default false, dongs jsonb default '[]'::jsonb, weekdays int[] default '{}', timeslots text[] default '{}',
  max_per_week int default 6, home_lat double precision, home_lng double precision, intro text default '', photo_path text default '',
  grade int default 1, suspended_until timestamptz, updated_at timestamptz default now()
);
create table if not exists public.app_assignments (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references public.app_recipients(id) on delete cascade, pass_id uuid references public.app_passes(id) on delete cascade,
  instructor_id uuid references public.app_accounts(id), slot1 jsonb, slot2 jsonb, status text default 'requested',
  requested_at timestamptz default now(), expires_at timestamptz, responded_at timestamptz, decline_reason text, score numeric, mode text default 'auto',
  distance_km numeric, topic text default '', payout int default 40000
);
create index if not exists idx_app_assignments_instr on public.app_assignments(instructor_id, status);
create table if not exists public.app_sessions (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references public.app_recipients(id) on delete cascade, instructor_id uuid references public.app_accounts(id),
  pass_id uuid references public.app_passes(id), seq int default 1, scheduled_at timestamptz not null, topic text default '', status text default 'scheduled',
  confirmed_at timestamptz, call_failed_at timestamptz, departed_at timestamptz, arrived_at timestamptz, arrive_distance_m int, arrive_reason text,
  started_at timestamptz, ended_at timestamptz, early_end_min int, early_end_reason text, no_show_at timestamptz, flags jsonb default '{}'::jsonb,
  cancelled_by text, cancel_reason text, deduction numeric(3,1) default 0,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create index if not exists idx_app_sessions_instr on public.app_sessions(instructor_id, scheduled_at);
create index if not exists idx_app_sessions_rec on public.app_sessions(recipient_id, scheduled_at);
create table if not exists public.app_reports (
  id uuid primary key default gen_random_uuid(),
  session_id uuid unique references public.app_sessions(id) on delete cascade,
  recipient_id uuid, instructor_id uuid, seq int, checks jsonb default '[]'::jsonb, photo_path text, memo text default '', next_task text default '',
  flag boolean default false, flag_type text, flag_note text, next_session_at timestamptz,
  submitted_at timestamptz default now(), status text default 'submitted', hold_until timestamptz, sent_at timestamptz, read_at timestamptz,
  rating text, rating_note text, locked boolean default true
);
create table if not exists public.app_report_notes (
  id uuid primary key default gen_random_uuid(), report_id uuid references public.app_reports(id) on delete cascade,
  author text default 'instructor', body text not null, created_at timestamptz default now()
);
create table if not exists public.app_payouts (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid references public.app_accounts(id), session_id uuid, month text not null, kind text not null, amount int not null,
  note text default '', sub text, status text default 'confirmed', date timestamptz default now()
);
create index if not exists idx_app_payouts_instr on public.app_payouts(instructor_id, month);
create table if not exists public.app_missions (
  id uuid primary key default gen_random_uuid(), recipient_id uuid references public.app_recipients(id) on delete cascade,
  body text not null, source text default 'report', report_id uuid, done_at timestamptz, notified_at timestamptz, created_at timestamptz default now()
);
create table if not exists public.app_help_requests (
  id uuid primary key default gen_random_uuid(), recipient_id uuid, kind text not null, status text default 'open', created_at timestamptz default now(), handled_by uuid, handled_at timestamptz
);
create table if not exists public.app_orgs (
  id uuid primary key default gen_random_uuid(), name text not null, type text default '', code text unique not null,
  contact_name text default '', contact_email text default '', programs jsonb default '[]'::jsonb, outreach_id uuid, created_at timestamptz default now()
);
create table if not exists public.app_org_members (
  id uuid primary key default gen_random_uuid(), org_id uuid references public.app_orgs(id) on delete cascade,
  account_id uuid, recipient_id uuid, consent_identify boolean default false, linked_at timestamptz default now()
);
create table if not exists public.app_org_posts (
  id uuid primary key default gen_random_uuid(), org_id uuid references public.app_orgs(id) on delete cascade,
  title text not null, body text default '', event_at timestamptz, place text default '', apply_phone text default '', created_at timestamptz default now()
);
create table if not exists public.app_gift_codes (
  code text primary key, corp_org_id uuid, corp_name text default '', product text not null, batch_id text,
  issued_at timestamptz default now(), expires_at timestamptz, redeemed_at timestamptz, recipient_id uuid, redeemed_by uuid
);
create table if not exists public.app_providers (
  id uuid primary key default gen_random_uuid(), kind text default 'partner', org_id uuid, name text not null, status text default 'review',
  fee_rate numeric default 0.2, insurance text default '', refund_policy text default '', created_at timestamptz default now()
);
create table if not exists public.app_courses (
  id uuid primary key default gen_random_uuid(), provider_id uuid, title text not null, category text default 'teacher', format text default '',
  sessions int default 0, price int default 0, curriculum jsonb default '[]'::jsonb, place text default '', note text default '', status text default 'draft', sort int default 100
);
create table if not exists public.app_enrollments (
  id uuid primary key default gen_random_uuid(), course_id uuid references public.app_courses(id), account_id uuid references public.app_accounts(id),
  status text default 'applied', paid_at timestamptz, pg_key text, completed_at timestamptz, created_at timestamptz default now()
);
create table if not exists public.app_certificates (
  id uuid primary key default gen_random_uuid(), account_id uuid, course_id uuid, issuer_name text not null, course_title text not null,
  issued_at timestamptz default now(), cert_no text unique, pdf_path text
);
create table if not exists public.app_tickets (
  id uuid primary key default gen_random_uuid(), kind text not null, ref text default '', body text default '', status text default 'open',
  created_by uuid, handled_by uuid, resolved_at timestamptz, created_at timestamptz default now()
);
create table if not exists public.app_notifications (
  id uuid primary key default gen_random_uuid(), account_id uuid, phone text, kind text not null, channel text default 'push', template text default '',
  payload jsonb default '{}'::jsonb, scheduled_at timestamptz, sent_at timestamptz, read_at timestamptz, result text default ''
);
create table if not exists public.app_service_areas (
  sigungu text primary key, status text default 'open', updated_at timestamptz default now()
);
create table if not exists public.app_config (
  key text primary key, value jsonb not null, updated_by text default '', updated_at timestamptz default now()
);
create table if not exists public.app_audit_logs (
  id uuid primary key default gen_random_uuid(), actor text default '', action text not null, tbl text default '', row_id text default '',
  before jsonb, after jsonb, created_at timestamptz default now()
);

insert into public.app_service_areas(sigungu) values ('서울 전역'),('경기 하남시'),('경기 구리시'),('경기 성남시'),('경기 광명시'),('경기 부천시'),('경기 고양시') on conflict do nothing;
insert into public.app_config(key, value) values
 ('rules', '{"promiseHours":72,"assignHours":24,"changeFreeHours":24,"lateDeduction":0.5,"noShowDeductionFrom2nd":0.5,"noShowWaitMin":15,"earlyEndMin":30,"payBase":35000,"payTransport":5000,"payTwo":10000,"payWeekendEve":5000,"payOutside":5000,"payEscort":5000,"payCall":5000,"bonusOver":20,"bonusAmount":50000,"taxRate":0.033,"depositDays":3,"reportSendCutoff":21,"reportSendMorning":8,"holdMin":10,"gradeLessons":[0,10,40]}'::jsonb)
 on conflict (key) do nothing;

do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname='public' and tablename like 'app\\_%' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;
`;
