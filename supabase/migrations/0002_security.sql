-- Row Level Security : tout est fermé par défaut, on ouvre au strict nécessaire.
alter table public.admins enable row level security;
alter table public.projects enable row level security;
alter table public.services enable row level security;
alter table public.reviews enable row level security;
alter table public.review_contacts enable row level security;
alter table public.quote_requests enable row level security;
alter table public.quote_events enable row level security;
alter table public.contact_messages enable row level security;
alter table public.site_settings enable row level security;
alter table public.submission_log enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- Lecture publique (uniquement le contenu publié)
grant select on public.projects, public.services, public.reviews, public.site_settings to anon, authenticated;
create policy projects_public_read on public.projects for select using (status = 'published');
create policy services_public_read on public.services for select using (is_active);
create policy reviews_public_read on public.reviews for select using (moderation_status = 'published');
create policy settings_public_read on public.site_settings for select using (true);

-- Administration : droits complets, vérifiés côté base via is_admin()
grant select, insert, update, delete on public.projects, public.services, public.reviews,
  public.review_contacts, public.quote_requests, public.quote_events,
  public.contact_messages, public.site_settings to authenticated;
grant select on public.admins to authenticated;

create policy projects_admin on public.projects for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy services_admin on public.services for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy reviews_admin on public.reviews for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy review_contacts_admin on public.review_contacts for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy quotes_admin on public.quote_requests for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy quote_events_admin on public.quote_events for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy contact_admin on public.contact_messages for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy settings_admin on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admins_self_read on public.admins for select to authenticated using (user_id = auth.uid());
-- Aucune policy d'écriture sur admins ni de lecture sur submission_log : seul le service role / SQL editor y accède.

-- Stockage des images de projets : lecture publique, écriture réservée aux admins, 5 Mo, images uniquement.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('project-images', 'project-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "project images read" on storage.objects for select using (bucket_id = 'project-images');
create policy "project images admin insert" on storage.objects for insert to authenticated with check (bucket_id = 'project-images' and public.is_admin());
create policy "project images admin update" on storage.objects for update to authenticated using (bucket_id = 'project-images' and public.is_admin());
create policy "project images admin delete" on storage.objects for delete to authenticated using (bucket_id = 'project-images' and public.is_admin());
