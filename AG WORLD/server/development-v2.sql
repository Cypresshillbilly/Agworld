-- Development Version 2: private player uploads and atomic mission rewards.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('agworld-player-private','agworld-player-private',false,10485760,array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy "agworld_player_private_read" on storage.objects for select to authenticated
using(bucket_id='agworld-player-private' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "agworld_player_private_insert" on storage.objects for insert to authenticated
with check(bucket_id='agworld-player-private' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "agworld_player_private_update" on storage.objects for update to authenticated
using(bucket_id='agworld-player-private' and (storage.foldername(name))[1]=(select auth.uid())::text)
with check(bucket_id='agworld-player-private' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "agworld_player_private_delete" on storage.objects for delete to authenticated
using(bucket_id='agworld-player-private' and (storage.foldername(name))[1]=(select auth.uid())::text);

create or replace function public.ag_complete_mission_v2(p_mission_id text)
returns jsonb language plpgsql security invoker set search_path='' as $fn$
declare
 player public.ag_players; mission jsonb; candidate jsonb; evidence jsonb; next_chapter int:=3; new_level int:=1; new_xp int;
 catalogue constant jsonb := $catalog$[{"id": "c1-welcome", "title": "Welcome to AgWorld", "owner": "system-administrator", "xp": 120, "objective": "Discover your menus, missions and map with your System Administrator.", "kind": "orientation", "type": "ORIENTATION", "skill": "Operations", "chapter": 1}, {"id": "c1-hr", "title": "Check Your Player Information", "owner": "compliance", "xp": 180, "objective": "Save your name, role, contact number and working region.", "kind": "profile", "type": "PROFILE", "skill": "Compliance", "chapter": 1}, {"id": "c1-documents", "title": "Submit Required Documents", "owner": "compliance", "xp": 160, "objective": "Upload your required Company documents privately for submission.", "kind": "documents", "type": "DOCUMENTS", "skill": "Compliance", "chapter": 1}, {"id": "c1-safety", "title": "Complete Mandatory Safety Training", "owner": "compliance", "xp": 200, "objective": "Complete the Company safety and responsible field conduct assessment.", "kind": "safety", "type": "SAFETY", "skill": "Compliance", "chapter": 1}, {"id": "c2-profile", "title": "Create Your Profile Photograph", "owner": "compliance", "xp": 250, "objective": "Take a webcam photograph or upload a profile picture.", "kind": "photo", "type": "PHOTO", "skill": "Compliance", "chapter": 1}, {"id": "c1-company-training", "title": "Meet Your Product Range", "owner": "product", "xp": 220, "objective": "Study an approved model presentation and explain its application.", "kind": "product-intro", "type": "PRODUCT INTRO", "skill": "Product Knowledge", "chapter": 2}, {"id": "c2-assets", "title": "Match the Product to the Farm", "owner": "product", "xp": 300, "objective": "Use model specifications to explain a benefit and a limitation for a client.", "kind": "product-application", "type": "PRODUCT APPLICATION", "skill": "Product Knowledge", "chapter": 2}, {"id": "c2-product-compare", "title": "Build a Confident Product Pitch", "owner": "product", "xp": 250, "objective": "Compare two models using approved sources and ask your Product Commander a question.", "kind": "product-compare", "type": "PRODUCT COMPARE", "skill": "Product Knowledge", "chapter": 2}, {"id": "c1-briefing", "title": "Your Sales Territory Briefing", "owner": "sales", "xp": 120, "objective": "Choose an existing prospect or begin scouting your area.", "kind": "sales-brief", "type": "SALES BRIEF", "skill": "Sales", "chapter": 3}, {"id": "c2-explore", "title": "Scout Your Working Area", "owner": "sales", "xp": 300, "objective": "Select a province or municipality and inspect its recorded market.", "kind": "scout-area", "type": "SCOUT AREA", "skill": "Sales", "chapter": 3}, {"id": "c2-survey", "title": "Inspect a Farm Prospect", "owner": "sales", "xp": 350, "objective": "Select a real farm on the map and review its business information.", "kind": "inspect-farm", "type": "INSPECT FARM", "skill": "Sales", "chapter": 3}, {"id": "c2-create", "title": "Record Your Farm Intelligence", "owner": "sales", "xp": 400, "objective": "Create a farm if it is missing, or save updated intelligence on an existing farm.", "kind": "save-farm", "type": "SAVE FARM", "skill": "Sales", "chapter": 3}, {"id": "c2-intelligence", "title": "Classify Your Prospect", "owner": "sales", "xp": 350, "objective": "Record whether the selected farm is neutral, competitor-aligned or a Company client.", "kind": "classify", "type": "CLASSIFY", "skill": "Sales", "chapter": 3}, {"id": "c3-contractors", "title": "Scout a Contractor", "owner": "sales", "xp": 300, "objective": "Create or update a real contractor record through Map Menu Actions.", "kind": "save-contractor", "type": "SAVE CONTRACTOR", "skill": "Sales", "chapter": 3}, {"id": "c3-competitors", "title": "Scout a Competitor", "owner": "sales", "xp": 300, "objective": "Create or update a real competitor record through Map Menu Actions.", "kind": "save-competitor", "type": "SAVE COMPETITOR", "skill": "Sales", "chapter": 3}, {"id": "c3-meeting", "title": "Plan a Drone Meeting", "owner": "sales", "xp": 400, "objective": "Choose a neutral or competitor prospect and record a real meeting plan.", "kind": "meeting", "type": "MEETING", "skill": "Sales", "chapter": 3}, {"id": "c3-follow-up", "title": "Record the Client Outcome", "owner": "sales", "xp": 450, "objective": "Record what happened at the meeting and the agreed next step.", "kind": "follow-up", "type": "FOLLOW UP", "skill": "Sales", "chapter": 3}]$catalog$::jsonb;
begin
 if auth.uid() is null then raise exception 'Sign in to complete a mission'; end if;
 select * into player from public.ag_players where id=auth.uid() for update;
 if player.id is null then raise exception 'Player profile missing'; end if;
 if exists(select 1 from public.ag_mission_progress where player_id=auth.uid() and mission_id=p_mission_id and status='completed') then
  return jsonb_build_object('completed',true,'already_completed',true);
 end if;
 for candidate in select value from jsonb_array_elements(catalogue) loop
  if not exists(select 1 from public.ag_mission_progress where player_id=auth.uid() and mission_id=candidate->>'id' and status='completed') then mission:=candidate;exit;end if;
 end loop;
 if mission is null or mission->>'id'<>p_mission_id then raise exception 'Complete your current mission first';end if;
 select mission_state into evidence from public.ag_mission_progress where player_id=auth.uid() and mission_id=p_mission_id;
 if coalesce(evidence->>'ready','false')<>'true' then raise exception 'Complete the mission requirements before claiming rewards';end if;
 insert into public.ag_mission_progress(player_id,mission_id,chapter,status,mission_state,completed_at,updated_at)
 values(auth.uid(),p_mission_id,(mission->>'chapter')::int,'completed',evidence,now(),now())
 on conflict(player_id,mission_id) do update set status='completed',completed_at=now(),updated_at=now();
 new_xp:=player.xp+(mission->>'xp')::int;
 for candidate in select value from jsonb_array_elements(catalogue) loop
  if not exists(select 1 from public.ag_mission_progress where player_id=auth.uid() and mission_id=candidate->>'id' and status='completed') then next_chapter:=(candidate->>'chapter')::int;exit;end if;
 end loop;
 if next_chapter>=2 then new_xp:=greatest(new_xp,1000);end if;
 if next_chapter>=3 then new_xp:=greatest(new_xp,2250);end if;
 while new_xp >= case when new_level+1<=10 then new_level*250 else 2250+(new_level+1-10)*400 end loop new_level:=new_level+1;end loop;
 update public.ag_players set xp=new_xp,level=new_level,current_chapter=next_chapter,updated_at=now() where id=auth.uid();
 insert into public.ag_career_events(player_id,event_type,payload) values(auth.uid(),'mission_completed',jsonb_build_object('mission_id',p_mission_id,'title',mission->>'title','chapter',mission->'chapter','xp',mission->'xp','commander',mission->>'owner'));
 insert into public.ag_contributions(player_id,contribution_type,mission_id,title,xp,payload) values(auth.uid(),'mission',p_mission_id,mission->>'title',(mission->>'xp')::int,jsonb_build_object('chapter',mission->'chapter','commander',mission->>'owner'));
 return jsonb_build_object('completed',true,'xp',new_xp,'level',new_level);
end;$fn$;
revoke all on function public.ag_complete_mission_v2(text) from public,anon;
grant execute on function public.ag_complete_mission_v2(text) to authenticated;
