import { describe, expect, it } from 'vitest';
import { computeStats, slugify, validateContact, validateQuote, validateReview, parseLinks } from '../src/lib/validation';

const quote = { name: 'Alice', email: 'alice@example.com', service_category: 'Développement web', project_title: 'Site vitrine',
  description: 'Un site vitrine de quelques pages pour mon association.', budget_range: '', desired_deadline: '', reference_links: '', consent: true };

describe('validateQuote', () => {
  it('accepte une demande valide', () => expect(validateQuote(quote)).toEqual({}));
  it('refuse les données invalides', () => {
    const e = validateQuote({ ...quote, name: '', email: 'x', description: 'court', consent: false, service_category: '' });
    expect(Object.keys(e).sort()).toEqual(['consent', 'description', 'email', 'name', 'service_category']);
  });
  it('refuse les liens non http(s)', () => expect(validateQuote({ ...quote, reference_links: 'javascript:alert(1)' }).reference_links).toBeDefined());
  it('limite à 5 liens', () => expect(validateQuote({ ...quote, reference_links: Array(6).fill('https://a.fr').join(' ') }).reference_links).toBeDefined());
});
describe('validateReview', () => {
  const ok = { rating: 5, comment: 'Très bon travail, merci !', public_name: 'Bob', email: '', project_id: '' };
  it('accepte un avis valide', () => expect(validateReview(ok)).toEqual({}));
  it('refuse une note hors plage', () => { expect(validateReview({ ...ok, rating: 0 }).rating).toBeDefined(); expect(validateReview({ ...ok, rating: 6 }).rating).toBeDefined(); });
  it('refuse un e-mail invalide mais accepte l’absence d’e-mail', () => { expect(validateReview({ ...ok, email: 'nope' }).email).toBeDefined(); expect(validateReview(ok).email).toBeUndefined(); });
});
describe('validateContact', () => {
  it('valide les champs', () => { expect(validateContact({ name: 'A', email: 'a', message: 'x' })).toHaveProperty('email'); });
});
describe('computeStats', () => {
  it('calcule moyenne et répartition', () => {
    const s = computeStats([5, 4, 4, 1]);
    expect(s.count).toBe(4); expect(s.average).toBe(3.5); expect(s.distribution).toEqual({ '1': 1, '2': 0, '3': 0, '4': 2, '5': 1 });
  });
  it('renvoie 0 sans avis', () => expect(computeStats([]).average).toBe(0));
});
describe('utilitaires', () => {
  it('slugify', () => expect(slugify('Été : Mon Projet n°1 !')).toBe('ete-mon-projet-n-1'));
  it('parseLinks', () => expect(parseLinks('https://a.fr, https://b.fr\nhttps://c.fr')).toHaveLength(3));
});
