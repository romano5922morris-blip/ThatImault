import { useState, type FormEvent } from 'react';
import { Field, EmptyState, ErrorState, Loading, Stars, aria } from '../components/ui';
import { REVIEWS_PER_PAGE, friendlyError, getProjects, getReviewStats, getReviews, submitReview } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { useSeo } from '../hooks/useSeo';
import { formatDate } from '../lib/format';
import { validateReview, type Errors, type ReviewInput } from '../lib/validation';

const EMPTY: ReviewInput = { rating: 0, comment: '', public_name: '', email: '', project_id: '' };

export default function Reviews() {
  useSeo('Avis clients', 'Les avis publiés par les clients de ThatImault Studio, avec note moyenne et répartition.');
  const [rating, setRating] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const stats = useAsync(getReviewStats, []);
  const list = useAsync(() => getReviews(rating, page), [rating, page]);
  const projects = useAsync(getProjects, []);
  const [v, setV] = useState<ReviewInput>(EMPTY);
  const [errors, setErrors] = useState<Errors<keyof ReviewInput>>({});
  const [hp, setHp] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [serverError, setServerError] = useState('');
  const set = <K extends keyof ReviewInput>(k: K, val: ReviewInput[K]) => setV((p) => ({ ...p, [k]: val }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validateReview(v); setErrors(errs); setServerError('');
    if (Object.keys(errs).length) { document.getElementById('review-form')?.querySelector<HTMLElement>('[aria-invalid="true"], .star-input input')?.focus(); return; }
    setState('sending');
    try { await submitReview(v, hp); setState('done'); setV(EMPTY); }
    catch (err) { setServerError(friendlyError(err)); setState('idle'); }
  }

  const s = stats.data; const total = s?.count ?? 0;
  const pages = Math.max(1, Math.ceil((list.data?.total ?? 0) / REVIEWS_PER_PAGE));

  return (
    <>
      <div className="page-head"><div className="wrap"><h1>Avis clients</h1><p className="lede">Seuls les avis validés par le studio sont publiés.</p></div></div>
      <div className="wrap section" style={{ paddingTop: 'var(--space-3)' }}>
        {stats.error ? <ErrorState message={stats.error} onRetry={stats.reload} /> : stats.loading ? <Loading /> : total === 0 ? (
          <EmptyState title="Aucun avis n’a encore été publié">Vous avez travaillé avec le studio&nbsp;? Vous pouvez laisser le premier avis ci-dessous.</EmptyState>
        ) : (
          <>
            <div className="rating-summary">
              <div><div className="rating-summary__avg">{s!.average.toString().replace('.', ',')}</div><Stars value={s!.average} /><p className="muted" style={{ margin: 0 }}>{total} avis publié{total > 1 ? 's' : ''}</p></div>
              <div>{([5, 4, 3, 2, 1] as const).map((n) => (
                <div className="bar-row" key={n}><span>{n} étoile{n > 1 ? 's' : ''}</span><div className="bar"><span style={{ width: `${(s!.distribution[String(n) as '1'] / total) * 100}%` }} /></div><span>{s!.distribution[String(n) as '1']}</span></div>
              ))}</div>
            </div>
            <div className="filters" role="group" aria-label="Filtrer par note">
              <button className="chip" aria-pressed={!rating} onClick={() => { setRating(null); setPage(1); }}>Toutes les notes</button>
              {[5, 4, 3, 2, 1].map((n) => <button key={n} className="chip" aria-pressed={rating === n} onClick={() => { setRating(n); setPage(1); }}>{n} ★</button>)}
            </div>
            {list.loading ? <Loading /> : list.error ? <ErrorState message={list.error} onRetry={list.reload} /> :
              !list.data?.reviews.length ? <EmptyState title="Aucun avis pour cette note" /> : (
              <div>
                {list.data.reviews.map((r) => (
                  <article className="review" key={r.id}>
                    <Stars value={r.rating} />
                    <p>{r.comment}</p>
                    <small>{r.public_name}{r.verification_status === 'verified' ? ', client vérifié' : ''} · {formatDate(r.published_at)}</small>
                  </article>
                ))}
                {pages > 1 && (
                  <nav className="pager" aria-label="Pagination des avis">
                    <button className="btn btn--ghost btn--small" disabled={page <= 1} onClick={() => setPage(page - 1)}>Précédent</button>
                    <span>Page {page} sur {pages}</span>
                    <button className="btn btn--ghost btn--small" disabled={page >= pages} onClick={() => setPage(page + 1)}>Suivant</button>
                  </nav>
                )}
              </div>
            )}
          </>
        )}

        <hr />
        <h2 style={{ fontSize: 'var(--step-2)' }}>Laisser un avis</h2>
        {state === 'done' ? (
          <div className="alert alert--ok" role="status"><strong>Merci, votre avis a bien été reçu.</strong><p style={{ margin: 0 }}>Il sera publié après validation par le studio.</p></div>
        ) : (
          <form id="review-form" className="form" onSubmit={onSubmit} noValidate>
            <fieldset className="field" data-invalid={!!errors.rating} style={{ border: 0, padding: 0, margin: 0 }}>
              <legend>Votre note</legend>
              <div className="star-input" role="radiogroup" aria-label="Note de 1 à 5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n} data-on={v.rating >= n}>
                    <input type="radio" name="rating" value={n} checked={v.rating === n} onChange={() => set('rating', n)} />
                    <span aria-hidden="true">★</span><span className="sr-only">{n} étoile{n > 1 ? 's' : ''}</span>
                  </label>
                ))}
              </div>
              {errors.rating && <span className="error">{errors.rating}</span>}
            </fieldset>
            <Field id="r-comment" label="Votre commentaire" error={errors.comment}><textarea id="r-comment" value={v.comment} maxLength={2000} onChange={(e) => set('comment', e.target.value)} {...aria('r-comment', errors.comment)} /></Field>
            <div className="row-2">
              <Field id="r-name" label="Nom public ou pseudonyme" error={errors.public_name}><input id="r-name" value={v.public_name} maxLength={60} onChange={(e) => set('public_name', e.target.value)} autoComplete="nickname" {...aria('r-name', errors.public_name)} /></Field>
              <Field id="r-email" label="E-mail (facultatif, jamais publié)" hint="Sert uniquement à confirmer la réception." error={errors.email}><input id="r-email" type="email" value={v.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" {...aria('r-email', errors.email, 'h')} /></Field>
            </div>
            {!!projects.data?.length && (
              <Field id="r-project" label="Projet concerné (facultatif)">
                <select id="r-project" value={v.project_id} onChange={(e) => set('project_id', e.target.value)}><option value="">Aucun</option>{projects.data.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
              </Field>
            )}
            <div className="hp" aria-hidden="true"><label>Ne pas remplir<input tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} /></label></div>
            {serverError && <div className="alert alert--error" role="alert">{serverError}</div>}
            <div><button className="btn" disabled={state === 'sending'}>{state === 'sending' ? 'Envoi en cours…' : 'Envoyer mon avis'}</button></div>
          </form>
        )}
      </div>
    </>
  );
}
