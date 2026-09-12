-- Run in a transaction against the deployment database. All fixtures roll back.
begin;
select set_config('agworld.test_user',gen_random_uuid()::text,true);
select set_config('agworld.other_user',gen_random_uuid()::text,true);
insert into auth.users(id,email) values(current_setting('agworld.test_user')::uuid,'dev2-rollback-test@example.invalid'),(current_setting('agworld.other_user')::uuid,'dev2-rollback-other@example.invalid');
-- The existing auth trigger creates each player with its Company facility.
update public.ag_players set display_name='Rollback fixture' where id in(current_setting('agworld.test_user')::uuid,current_setting('agworld.other_user')::uuid);
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('agworld.test_user'),'role','authenticated')::text,true);
set local role authenticated;
do $test$
declare result jsonb; before_xp int; blocked boolean:=false;
begin
 begin perform public.ag_complete_mission_v2('c1-hr');exception when others then blocked:=true;end;
 if not blocked then raise exception 'FAIL: out-of-order mission accepted';end if;
 blocked:=false;
 begin perform public.ag_complete_mission_v2('c1-welcome');exception when others then blocked:=true;end;
 if not blocked then raise exception 'FAIL: missing evidence accepted';end if;
 insert into public.ag_mission_progress(player_id,mission_id,chapter,status,mission_state) values(auth.uid(),'c1-welcome',1,'in_progress','{"ready":true,"step":9}');
 result:=public.ag_complete_mission_v2('c1-welcome');
 if (result->>'completed')::boolean is not true then raise exception 'FAIL: completion';end if;
 select xp into before_xp from public.ag_players where id=auth.uid();
 if before_xp<>120 then raise exception 'FAIL: reward value';end if;
 perform public.ag_complete_mission_v2('c1-welcome');
 if (select xp from public.ag_players where id=auth.uid())<>before_xp then raise exception 'FAIL: duplicate reward';end if;
 if (select count(*) from public.ag_contributions where player_id=auth.uid())<>1 then raise exception 'FAIL: duplicate contribution';end if;
 if exists(select 1 from public.ag_players where id=current_setting('agworld.other_user')::uuid) then raise exception 'FAIL: cross-player visibility';end if;
 insert into storage.objects(bucket_id,name) values('agworld-player-private',auth.uid()::text||'/documents/rollback.pdf');
 blocked:=false;
 begin insert into storage.objects(bucket_id,name) values('agworld-player-private',current_setting('agworld.other_user')||'/documents/forbidden.pdf');exception when insufficient_privilege then blocked:=true;end;
 if not blocked then raise exception 'FAIL: cross-player upload accepted';end if;
 insert into public.entity_relationships(source_entity_id,target_entity_id,relationship_type,created_by)
 values('rollback-'||auth.uid(),'rollback-target','associated_with',auth.uid()::text);
 blocked:=false;
 begin insert into public.entity_relationships(source_entity_id,target_entity_id,relationship_type,created_by)
 values('forged-'||auth.uid(),'rollback-target','associated_with',current_setting('agworld.other_user'));exception when insufficient_privilege then blocked:=true;end;
 if not blocked then raise exception 'FAIL: forged relationship identity accepted';end if;
end;$test$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('agworld.other_user'),'role','authenticated')::text,true);
do $test$ begin
 if not exists(select 1 from public.entity_relationships where source_entity_id='rollback-'||current_setting('agworld.test_user')) then raise exception 'FAIL: enrolled Company relationship read denied';end if;
 update public.entity_relationships set status='inactive' where source_entity_id='rollback-'||current_setting('agworld.test_user');
 if exists(select 1 from public.entity_relationships where source_entity_id='rollback-'||current_setting('agworld.test_user') and status='inactive') then raise exception 'FAIL: another player relationship changed';end if;
 if exists(select 1 from storage.objects where bucket_id='agworld-player-private' and name=current_setting('agworld.test_user')||'/documents/rollback.pdf') then raise exception 'FAIL: cross-player download visible';end if;
end;$test$;
reset role;
rollback;
select 'PASS: prerequisite/evidence checks, atomic award, retry idempotency, player isolation, private upload ownership, cross-player read denial and relationship ownership; all fixtures rolled back' as result;
