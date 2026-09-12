-- Company world relationships are shared among enrolled players. Personal
-- progress, compliance files and staff-library access retain their own policies.
alter table public.entity_relationships enable row level security;
revoke all on public.entity_relationships from anon;
grant select,insert,update,delete on public.entity_relationships to authenticated;
create policy "enrolled_company_relationship_read" on public.entity_relationships for select to authenticated
 using(exists(select 1 from public.ag_players p where p.id=(select auth.uid())));
create policy "enrolled_company_relationship_insert" on public.entity_relationships for insert to authenticated
 with check(created_by=(select auth.uid())::text and exists(select 1 from public.ag_players p where p.id=(select auth.uid())));
create policy "enrolled_company_relationship_update" on public.entity_relationships for update to authenticated
 using(created_by=(select auth.uid())::text)
 with check(created_by=(select auth.uid())::text);
create policy "enrolled_company_relationship_delete" on public.entity_relationships for delete to authenticated
 using(created_by=(select auth.uid())::text);
alter view public.farm_audit_readable set(security_invoker=true);
revoke all on public.farm_audit_readable from anon;
revoke insert,update,delete on public.farm_audit_readable from authenticated;
grant select on public.farm_audit_readable to authenticated;
-- Limited to the two audited objects; other public-table privileges are unchanged.
revoke truncate,references,trigger on public.entity_relationships,public.farm_audit_readable from anon,authenticated;
