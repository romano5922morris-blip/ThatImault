-- Fonctions publiques : seul point d'écriture pour les visiteurs. Validation + anti-spam + limitation de débit.

create or replace function public._rate_limit(p_kind text, p_subject text, p_max int, p_window interval)
returns void language plpgsql security definer set search_path = public as $$
declare h text := encode(digest(coalesce(nullif(p_subject,''),'unknown'), 'sha256'), 'hex'); n int;
begin
  delete from submission_log where created_at < now() - interval '2 days';
  select count(*) into n from submission_log where kind = p_kind and subject_hash = h and created_at > now() - p_window;
  if n >= p_max then raise exception 'rate_limited' using errcode = 'P0001'; end if;
  insert into submission_log (kind, subject_hash) values (p_kind, h);
end $$;

create or replace function public._client_ip() returns text language sql stable as $$
  select split_part(coalesce(current_setting('request.headers', true)::json->>'x-forwarded-for', ''), ',', 1)
$$;

create or replace function public._clean(p text, p_max int) returns text language sql immutable as $$
  select left(btrim(regexp_replace(coalesce(p,''), '[\x00-\x08\x0B\x0C\x0E-\x1F]', '', 'g')), p_max)
$$;

create or replace function public.submit_quote(payload jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare ref text; v_email text := lower(_clean(payload->>'email', 254)); links text[];
begin
  if coalesce(payload->>'website','') <> '' then raise exception 'invalid_request'; end if;
  if coalesce((payload->>'consent')::boolean, false) is not true then raise exception 'consent_required'; end if;
  perform _rate_limit('quote_ip', _client_ip(), 5, interval '1 hour');
  perform _rate_limit('quote_email', v_email, 3, interval '1 day');
  select coalesce(array_agg(l), '{}') into links from (
    select _clean(x, 300) as l from jsonb_array_elements_text(coalesce(payload->'reference_links','[]'::jsonb)) x limit 5
  ) s where l ~ '^https?://';
  ref := 'TIS-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));
  insert into quote_requests (reference, name, email, service_category, project_title, description, budget_range, desired_deadline, reference_links)
  values (ref, _clean(payload->>'name',120), v_email, _clean(payload->>'service_category',80),
          _clean(payload->>'project_title',160), _clean(payload->>'description',5000),
          nullif(_clean(payload->>'budget_range',80),''), nullif(_clean(payload->>'desired_deadline',80),''), links);
  return jsonb_build_object('reference', ref);
end $$;

create or replace function public.submit_review(payload jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare rid uuid; v_email text := nullif(lower(_clean(payload->>'email', 254)), ''); v_project uuid;
begin
  if coalesce(payload->>'website','') <> '' then raise exception 'invalid_request'; end if;
  perform _rate_limit('review_ip', _client_ip(), 3, interval '1 day');
  if v_email is not null then
    if v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'invalid_email'; end if;
    perform _rate_limit('review_email', v_email, 1, interval '7 days');
  end if;
  if nullif(payload->>'project_id','') is not null then
    select id into v_project from projects where id = (payload->>'project_id')::uuid and status = 'published';
  end if;
  insert into reviews (rating, comment, public_name, project_id)
  values ((payload->>'rating')::smallint, _clean(payload->>'comment',2000), _clean(payload->>'public_name',60), v_project)
  returning id into rid;
  if v_email is not null then insert into review_contacts (review_id, private_email) values (rid, v_email); end if;
  return jsonb_build_object('status', 'pending');
end $$;

create or replace function public.submit_contact(payload jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(payload->>'website','') <> '' then raise exception 'invalid_request'; end if;
  perform _rate_limit('contact_ip', _client_ip(), 5, interval '1 hour');
  insert into contact_messages (name, email, message)
  values (_clean(payload->>'name',120), lower(_clean(payload->>'email',254)), _clean(payload->>'message',5000));
  return jsonb_build_object('ok', true);
end $$;

-- Moyenne et répartition calculées uniquement sur les avis publiés
create or replace function public.review_stats() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'count', count(*),
    'average', coalesce(round(avg(rating)::numeric, 2), 0),
    'distribution', jsonb_build_object(
      '1', count(*) filter (where rating = 1), '2', count(*) filter (where rating = 2),
      '3', count(*) filter (where rating = 3), '4', count(*) filter (where rating = 4),
      '5', count(*) filter (where rating = 5)))
  from reviews where moderation_status = 'published'
$$;

-- Les fonctions internes ne sont pas appelables par les clients.
revoke all on function public._rate_limit(text,text,int,interval), public._client_ip(), public._clean(text,int) from public, anon, authenticated;
grant execute on function public.submit_quote(jsonb), public.submit_review(jsonb), public.submit_contact(jsonb), public.review_stats() to anon, authenticated;
grant execute on function public.is_admin() to authenticated;

-- Publication d'un avis : horodatage automatique (réservé aux admins via RLS)
create or replace function public.reviews_publish_stamp() returns trigger language plpgsql as $$
begin
  if new.moderation_status = 'published' and (old.moderation_status is distinct from 'published') then new.published_at = now(); end if;
  if new.moderation_status <> 'published' then new.published_at = null; end if;
  return new;
end $$;
create trigger reviews_stamp before update on public.reviews for each row execute function public.reviews_publish_stamp();
