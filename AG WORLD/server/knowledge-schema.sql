-- Private commander libraries. Approval is an administrator-managed record,
-- never a user-editable player role, facility choice or JWT user_metadata claim.
create table public.ag_knowledge_members (
 user_id uuid primary key references auth.users(id) on delete cascade,
 collections text[] not null default array['product','technical']::text[],
 approved_at timestamptz not null default now(),
 check(collections <@ array['product','technical']::text[])
);
create table public.ag_knowledge_documents (
 id text primary key,
 collection text not null check(collection in ('product','technical')),
 models text[] not null,
 title text not null,
 source_reference text not null,
 source_year integer,
 format text not null,
 status text not null,
 text_sha256 text,
 section_count integer not null default 0,
 imported_at timestamptz not null default now()
);
create table public.ag_knowledge_chunks (
 id text primary key,
 document_id text not null references public.ag_knowledge_documents(id) on delete cascade,
 collection text not null check(collection in ('product','technical')),
 locator text not null,
 content text not null check(length(content)<=12000),
 search_text text not null,
 fts tsvector generated always as (to_tsvector('english'::regconfig,search_text)) stored
);
create index ag_knowledge_chunks_fts on public.ag_knowledge_chunks using gin(fts);
create index ag_knowledge_chunks_document on public.ag_knowledge_chunks(document_id);
create index ag_knowledge_chunks_collection on public.ag_knowledge_chunks(collection);
create index ag_knowledge_documents_models on public.ag_knowledge_documents using gin(models);
create index ag_knowledge_documents_collection on public.ag_knowledge_documents(collection);
alter table public.ag_knowledge_members enable row level security;
alter table public.ag_knowledge_documents enable row level security;
alter table public.ag_knowledge_chunks enable row level security;
revoke all on public.ag_knowledge_members,public.ag_knowledge_documents,public.ag_knowledge_chunks from public,anon,authenticated;
grant select on public.ag_knowledge_members,public.ag_knowledge_documents,public.ag_knowledge_chunks to authenticated;
grant all on public.ag_knowledge_members,public.ag_knowledge_documents,public.ag_knowledge_chunks to service_role;
create policy knowledge_member_own on public.ag_knowledge_members for select to authenticated
 using(user_id=(select auth.uid()));
create policy knowledge_documents_approved on public.ag_knowledge_documents for select to authenticated
 using(collection=any(coalesce((select m.collections from public.ag_knowledge_members m where m.user_id=(select auth.uid())),array[]::text[])));
create policy knowledge_chunks_approved on public.ag_knowledge_chunks for select to authenticated
 using(collection=any(coalesce((select m.collections from public.ag_knowledge_members m where m.user_id=(select auth.uid())),array[]::text[])));

create function public.ag_knowledge_catalog(p_collection text)
returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object(
  'approved',exists(select 1 from public.ag_knowledge_members where user_id=(select auth.uid()) and p_collection=any(collections)),
  'documents',(select count(*) from public.ag_knowledge_documents where collection=p_collection and status='indexed'),
  'media',(select count(*) from public.ag_knowledge_documents where collection=p_collection and status='catalogued-media'),
  'models',coalesce((select jsonb_agg(model order by model) from (select distinct unnest(models) as model from public.ag_knowledge_documents where collection=p_collection) a),'[]'::jsonb)
 );
$$;

create function public.ag_knowledge_search(p_collection text,p_query text,p_model text default '',p_limit integer default 8)
returns table(document_id text,title text,models text[],source_reference text,source_year integer,locator text,content text,score real)
language sql stable security invoker set search_path='' as $$
 with query as (
  select plainto_tsquery('english'::regconfig,left(coalesce(p_query,''),500)) as exact,
   replace(plainto_tsquery('english'::regconfig,left(coalesce(p_query,''),500))::text,' & ',' | ')::tsquery as broad
 ), matches as (
 select d.id,d.title,d.models,d.source_reference,d.source_year,c.locator,c.content,
   (ts_rank_cd(c.fts,q.broad)+(case when c.fts@@q.exact then 1 else 0 end)+
    (case when p_model<>'' and p_model=any(d.models) then .2 else 0 end))::real as score,
   row_number() over(partition by d.id order by (c.fts@@q.exact) desc,ts_rank_cd(c.fts,q.broad) desc,c.id) as occurrence
 from public.ag_knowledge_chunks c join public.ag_knowledge_documents d on d.id=c.document_id cross join query q
 where c.collection=p_collection and d.collection=p_collection and d.status='indexed'
  and (coalesce(p_model,'')='' or p_model=any(d.models) or 'GENERAL'=any(d.models))
  and numnode(q.broad)>0 and c.fts@@q.broad
 ) select id,title,models,source_reference,source_year,locator,content,score from matches
 where occurrence<=2 order by score desc,title,locator limit greatest(1,least(coalesce(p_limit,8),12));
$$;
revoke all on function public.ag_knowledge_catalog(text),public.ag_knowledge_search(text,text,text,integer) from public,anon;
grant execute on function public.ag_knowledge_catalog(text),public.ag_knowledge_search(text,text,text,integer) to authenticated;
notify pgrst,'reload schema';
