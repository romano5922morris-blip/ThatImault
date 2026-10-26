import { db } from './supabase';
import type { Project, Review, ReviewStats, Service, Settings } from '../types';
import { parseLinks, type ContactInput, type QuoteInput, type ReviewInput } from './validation';

export const REVIEWS_PER_PAGE = 10;

const fail = (error: { message: string } | null) => { if (error) throw new Error(error.message); };

export async function getSettings(): Promise<Settings> {
  const { data, error } = await db().from('site_settings').select('key,value');
  fail(error);
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
}
export async function getServices(): Promise<Service[]> {
  const { data, error } = await db().from('services').select('*').eq('is_active', true).order('display_order');
  fail(error); return data ?? [];
}
export async function getProjects(): Promise<Project[]> {
  const { data, error } = await db().from('projects').select('*').eq('status', 'published').order('display_order').order('created_at', { ascending: false });
  fail(error); return data ?? [];
}
export async function getProject(slug: string): Promise<Project | null> {
  const { data, error } = await db().from('projects').select('*').eq('slug', slug).eq('status', 'published').maybeSingle();
  fail(error); return data;
}
export async function getReviews(rating: number | null, page: number) {
  let q = db().from('reviews').select('*', { count: 'exact' }).eq('moderation_status', 'published')
    .order('published_at', { ascending: false }).range((page - 1) * REVIEWS_PER_PAGE, page * REVIEWS_PER_PAGE - 1);
  if (rating) q = q.eq('rating', rating);
  const { data, error, count } = await q;
  fail(error); return { reviews: (data ?? []) as Review[], total: count ?? 0 };
}
export async function getReviewStats(): Promise<ReviewStats> {
  const { data, error } = await db().rpc('review_stats');
  fail(error); return data as ReviewStats;
}

/** Traduit les erreurs serveur en messages lisibles. */
export function friendlyError(e: unknown): string {
  const m = e instanceof Error ? e.message : '';
  if (m.includes('rate_limited')) return 'Trop de demandes envoyées. Réessayez plus tard.';
  if (m.includes('not_configured')) return 'Le service n’est pas encore configuré. Réessayez plus tard.';
  if (m.includes('consent_required')) return 'Vous devez accepter le traitement de vos données.';
  if (m.includes('invalid_request')) return 'La demande n’a pas pu être validée.';
  return 'L’envoi a échoué. Vos informations n’ont pas été enregistrées, veuillez réessayer.';
}

export async function submitQuote(v: QuoteInput, honeypot: string): Promise<string> {
  const { data, error } = await db().rpc('submit_quote', { payload: { ...v, reference_links: parseLinks(v.reference_links), website: honeypot } });
  fail(error);
  const reference = (data as { reference: string }).reference;
  // Notifications e-mail : tentative séparée. L'échec n'annule pas la demande, déjà enregistrée.
  db().functions.invoke('notify', { body: { type: 'quote', reference } }).catch(() => undefined);
  return reference;
}
export async function submitReview(v: ReviewInput, honeypot: string) {
  const { error } = await db().rpc('submit_review', { payload: { ...v, website: honeypot } });
  fail(error);
}
export async function submitContact(v: ContactInput, honeypot: string) {
  const { error } = await db().rpc('submit_contact', { payload: { ...v, website: honeypot } });
  fail(error);
}
