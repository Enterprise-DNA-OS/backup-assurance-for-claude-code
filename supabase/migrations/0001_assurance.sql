create function touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create table clients (
 id uuid primary key default gen_random_uuid(), code text unique not null, name text not null check(length(trim(name))>0),
 owner text not null default '', review_due date, security_evidence text not null default '', retention_days integer check(retention_days>0),
 source text, source_key text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(source,source_key)
);
create table jobs (
 id uuid primary key default gen_random_uuid(), code text unique not null, client_id uuid not null references clients(id), name text not null, device text not null,
 classification text not null default '', rpo_hours integer check(rpo_hours>0 and rpo_hours<=8760), restore_days integer check(restore_days>0 and restore_days<=3660),
 owner text not null default '', policy_evidence text not null default '', active boolean not null default true, source text, source_key text,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(source,source_key)
);
create table results (
 id uuid primary key default gen_random_uuid(), job_id uuid not null references jobs(id), occurred_at timestamptz not null,
 status text not null check(status in ('success','failure','warning','no-result','pending')), evidence text not null check(length(trim(evidence))>0),
 source text not null, created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(job_id,occurred_at,source)
);
create table restore_tests (
 id uuid primary key default gen_random_uuid(),job_id uuid not null references jobs(id),tested_at timestamptz not null,
 outcome text not null check(outcome in ('passed','failed')), recovery_minutes integer not null check(recovery_minutes>=0),
 evidence text not null check(length(trim(evidence))>0), actor text not null, created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table actions (
 id uuid primary key default gen_random_uuid(),code text unique not null,job_id uuid not null references jobs(id),name text not null,
 owner text not null check(length(trim(owner))>0),due_on date not null,status text not null default 'open' check(status in ('open','done')),
 evidence text not null default '', created_at timestamptz not null default now(),updated_at timestamptz not null default now(),check(status<>'done' or length(trim(evidence))>0)
);
create table imports (
 id uuid primary key default gen_random_uuid(),source text not null,sha256 text not null,exported_at timestamptz not null,records integer not null,
 actor text not null,payload jsonb not null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(source,sha256)
);
create table vendor_history (
 id uuid primary key default gen_random_uuid(),job_id uuid not null references jobs(id),import_id uuid not null references imports(id),day date not null,
 sla_status text not null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(job_id,import_id,day)
);
create table audit (
 id uuid primary key default gen_random_uuid(),actor text not null,operation text not null,record_id text not null,detail jsonb not null,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index results_job_time on results(job_id,occurred_at desc);
create index restore_job_time on restore_tests(job_id,tested_at desc);
create function assurance_health(at_time timestamptz) returns table(
 id uuid,client_id uuid,code text,client text,name text,device text,owner text,rpo_hours integer,last_status text,last_result timestamptz,last_success timestamptz,
 state text,restore_state text,last_restore timestamptz,restore_due timestamptz
) language sql stable as $$
 select j.id,j.client_id,j.code,c.name,j.name,j.device,j.owner,j.rpo_hours,r.status,r.occurred_at,s.occurred_at,
 case when j.rpo_hours is null or j.owner='' or j.policy_evidence='' then 'unconfigured'
 when r.occurred_at is null then 'no-results'
 when r.occurred_at<at_time-make_interval(hours=>j.rpo_hours) then 'stale-results'
 when r.status<>'success' then r.status
 when s.occurred_at<at_time-make_interval(hours=>j.rpo_hours) then 'recovery-gap'
 else 'current-success' end,
 case when j.restore_days is null then 'unconfigured' when rt.id is null then 'never-tested'
 when rt.outcome='failed' then 'failed' when rt.tested_at+make_interval(days=>j.restore_days)<at_time then 'overdue' else 'current' end,
 rt.tested_at,rt.tested_at+make_interval(days=>j.restore_days)
 from jobs j join clients c on c.id=j.client_id
 left join lateral(select status,occurred_at from results where job_id=j.id and occurred_at<=at_time order by occurred_at desc,(status<>'success') desc,id limit 1)r on true
 left join lateral(select occurred_at from results where job_id=j.id and status='success' and occurred_at<=at_time order by occurred_at desc limit 1)s on true
 left join lateral(select id,tested_at,outcome from restore_tests where job_id=j.id and tested_at<=at_time order by tested_at desc,(outcome='failed') desc,id limit 1)rt on true
 where j.active
$$;
create view v_morning as select * from assurance_health(now());
create view v_client_health as select c.code,c.name,c.owner,count(h.id)::integer jobs,
 count(h.id) filter(where h.state<>'current-success')::integer backup_exceptions,
 count(h.id) filter(where h.restore_state<>'current')::integer restore_exceptions
 from clients c left join v_morning h on h.client_id=c.id group by c.id;
create view v_attention as
 select 'backup-'||state reason,code,name,owner,last_result::text due from v_morning where state<>'current-success'
 union all select 'restore-'||restore_state,code,name,owner,restore_due::text from v_morning where restore_state<>'current'
 union all select 'action-overdue',code,name,owner,due_on::text from actions where status='open' and due_on<current_date
 union all select 'client-review',code,name,owner,review_due::text from clients where review_due is null or review_due<current_date or owner='';
do $$ declare t text; begin foreach t in array array['clients','jobs','results','restore_tests','actions','imports','vendor_history','audit'] loop
 execute format('create trigger touch before update on %I for each row execute function touch_updated_at()',t);
 execute format('alter table %I enable row level security',t); execute format('revoke all on %I from public',t); end loop; end $$;
revoke all on v_morning,v_client_health,v_attention from public;
revoke execute on function assurance_health(timestamptz) from public;
