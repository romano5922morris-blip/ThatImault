export type Errors<T extends string = string> = Partial<Record<T, string>>;

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const isEmail = (v: string) => v.length <= 254 && EMAIL.test(v.trim());
export const isHttpUrl = (v: string) => { try { return ['http:', 'https:'].includes(new URL(v).protocol); } catch { return false; } };

export interface QuoteInput {
  name: string; email: string; service_category: string; project_title: string; description: string;
  budget_range: string; desired_deadline: string; reference_links: string; consent: boolean;
}
export function validateQuote(v: QuoteInput): Errors<keyof QuoteInput> {
  const e: Errors<keyof QuoteInput> = {};
  if (v.name.trim().length < 2) e.name = 'Indiquez votre nom ou celui de votre organisation.';
  if (!isEmail(v.email)) e.email = 'Saisissez une adresse e-mail valide.';
  if (!v.service_category) e.service_category = 'Choisissez un type de prestation.';
  if (v.project_title.trim().length < 3) e.project_title = 'Donnez un titre d’au moins 3 caractères.';
  if (v.description.trim().length < 20) e.description = 'Décrivez votre projet en au moins 20 caractères.';
  if (v.description.length > 5000) e.description = 'La description ne peut pas dépasser 5 000 caractères.';
  const links = parseLinks(v.reference_links);
  if (links.length > 5) e.reference_links = 'Cinq liens maximum.';
  else if (links.some((l) => !isHttpUrl(l))) e.reference_links = 'Chaque lien doit commencer par http:// ou https://.';
  if (!v.consent) e.consent = 'Vous devez accepter le traitement de vos données pour envoyer la demande.';
  return e;
}
export const parseLinks = (s: string) => s.split(/[\s,]+/).map((x) => x.trim()).filter(Boolean);

export interface ReviewInput { rating: number; comment: string; public_name: string; email: string; project_id: string; }
export function validateReview(v: ReviewInput): Errors<keyof ReviewInput> {
  const e: Errors<keyof ReviewInput> = {};
  if (!Number.isInteger(v.rating) || v.rating < 1 || v.rating > 5) e.rating = 'Choisissez une note de 1 à 5.';
  if (v.comment.trim().length < 10) e.comment = 'Votre commentaire doit contenir au moins 10 caractères.';
  if (v.comment.length > 2000) e.comment = 'Votre commentaire ne peut pas dépasser 2 000 caractères.';
  const n = v.public_name.trim().length;
  if (n < 2 || n > 60) e.public_name = 'Le nom public doit contenir entre 2 et 60 caractères.';
  if (v.email.trim() && !isEmail(v.email)) e.email = 'Cette adresse e-mail n’est pas valide.';
  return e;
}

export interface ContactInput { name: string; email: string; message: string; }
export function validateContact(v: ContactInput): Errors<keyof ContactInput> {
  const e: Errors<keyof ContactInput> = {};
  if (v.name.trim().length < 2) e.name = 'Indiquez votre nom.';
  if (!isEmail(v.email)) e.email = 'Saisissez une adresse e-mail valide.';
  if (v.message.trim().length < 10) e.message = 'Votre message doit contenir au moins 10 caractères.';
  return e;
}

export const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export function computeStats(ratings: number[]) {
  const distribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
  ratings.forEach((r) => { distribution[String(r) as keyof typeof distribution]++; });
  const average = ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100 : 0;
  return { count: ratings.length, average, distribution };
}
