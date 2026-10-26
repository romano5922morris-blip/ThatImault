import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { isConfigured } from '../lib/supabase';

export const Loading = () => <div className="spinner" role="status" aria-label="Chargement" />;

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="state" role="alert">
      <h2 style={{ fontSize: 'var(--step-1)' }}>Impossible de charger ce contenu</h2>
      <p className="muted">{!isConfigured ? 'La connexion à la base de données n’est pas configurée (voir README).' : message || 'Vérifiez votre connexion et réessayez.'}</p>
      {onRetry && <button className="btn btn--ghost" onClick={onRetry}>Réessayer</button>}
    </div>
  );
}

export function EmptyState({ title, children, cta }: { title: string; children?: ReactNode; cta?: { to: string; label: string } }) {
  return (
    <div className="state">
      <h2 style={{ fontSize: 'var(--step-1)' }}>{title}</h2>
      {children && <p className="muted">{children}</p>}
      {cta && <Link className="btn" to={cta.to}>{cta.label}</Link>}
    </div>
  );
}

export function Stars({ value }: { value: number }) {
  return (
    <span className="stars" role="img" aria-label={`${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => <span key={i} className={i <= Math.round(value) ? '' : 'off'} aria-hidden="true">★</span>)}
    </span>
  );
}

export function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div className="field" data-invalid={!!error}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && <span className="hint" id={`${id}-hint`}>{hint}</span>}
      {error && <span className="error" id={`${id}-err`}>{error}</span>}
    </div>
  );
}
export const aria = (id: string, error?: string, hint?: string) => ({
  'aria-invalid': !!error || undefined,
  'aria-describedby': [hint ? `${id}-hint` : '', error ? `${id}-err` : ''].filter(Boolean).join(' ') || undefined,
});
