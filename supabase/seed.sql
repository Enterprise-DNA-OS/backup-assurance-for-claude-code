do $$
declare c1 uuid; c2 uuid; j1 uuid; j2 uuid; j3 uuid; j4 uuid;
begin
 if exists(select 1 from clients where code='DEMO-HARBOUR') then return; end if;
 insert into clients(code,name,owner,review_due,security_evidence,retention_days) values('DEMO-HARBOUR','Harbour Design (demo)','Mina',current_date+30,'Demo access review: restricted backup operators',90) returning id into c1;
 insert into clients(code,name,owner,review_due) values('DEMO-CEDAR','Cedar Wholesale (demo)','Leon',current_date-7) returning id into c2;
 insert into jobs(code,client_id,name,device,rpo_hours,restore_days,owner,policy_evidence) values('H-FILES',c1,'File server nightly','HAR-FS01',24,90,'Mina','Demo continuity plan: daily backups, quarterly restore') returning id into j1;
 insert into jobs(code,client_id,name,device,rpo_hours,restore_days,owner,policy_evidence) values('H-DESIGN',c1,'Design archive','HAR-NAS01',24,90,'Mina','Demo continuity plan: daily backups, quarterly restore') returning id into j2;
 insert into jobs(code,client_id,name,device,rpo_hours,restore_days,owner,policy_evidence) values('C-ERP',c2,'Orders database','CED-DB01',12,30,'Leon','Demo continuity plan: twice daily backup, monthly restore') returning id into j3;
 insert into jobs(code,client_id,name,device) values('C-ARCHIVE',c2,'Legacy archive','CED-ARC01') returning id into j4;
 insert into results(job_id,occurred_at,status,evidence,source) values
 (j1,now()-interval '2 hours','success','Synthetic successful result','demo'),
 (j2,now()-interval '3 days','success','Synthetic old success','demo'),
 (j3,now()-interval '2 days','success','Synthetic last known success','demo'),
 (j3,now()-interval '1 hour','failure','Synthetic failed verification','demo');
 insert into restore_tests(job_id,tested_at,outcome,recovery_minutes,evidence,actor) values
 (j1,now()-interval '10 days','passed',45,'Synthetic restore exercise, sample files opened','Demo operator'),
 (j2,now()-interval '100 days','passed',110,'Synthetic old exercise','Demo operator'),
 (j3,now()-interval '2 days','failed',80,'Synthetic order reconciliation failed','Demo operator');
 insert into actions(code,job_id,name,owner,due_on) values('A-RESTORE',j3,'Repeat order recovery and reconcile counts','Leon',current_date-1),('A-SOURCE',j2,'Check silent archive collector','Mina',current_date+1);
end $$;
