import { Link } from 'react-router-dom';
import { db, isConfigured } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { Loading, ErrorState } from '../../components/ui';
import { formatDateTime } from '../../lib/format';
import type { Project, QuoteRequest, Review } from '../../types';

const count = async (table: string, f?: (q: any) => any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  let q = db().from(table).select('*', { count: 'exact', head: true }); if (f) q = f(q);
  const { count: c, error } = await q; if (error) throw new Error(error.message); return c ?? 0;
};

export default function Dashboard() {
  const { data, error, loading, reload } = useAsync(async () => {
    const [newQuotes, pendingReviews, published, drafts, unread] = await Promise.all([
      count('quote_requests', (q) => q.eq('status', 'new')), count('reviews', (q) => q.eq('moderation_status', 'pending')),
      count('projects', (q) => q.eq('status', 'published')), count('projects', (q) => q.eq('status', 'draft')),
      count('contact_messages', (q) => q.eq('is_read', false)),
    ]);
    const [quotes, reviews, projects] = await Promise.all([
      db().from('quote_requests').select('*').order('created_at', { ascending: false }).limit(5),
      db().from('reviews').select('*').eq('moderation_status', 'pending').order('created_at', { ascending: false }).limit(5),
      db().from('projects').select('*').eq('status', 'published').order('updated_at', { ascending: false }).limit(5),
    ]);
    return { newQuotes, pendingReviews, published, drafts, unread, quotes: (quotes.data ?? []) as QuoteRequest[], reviews: (reviews.data ?? []) as Review[], projects: (projects.data ?? []) as Project[] };
  }, []);
  if (loading) return <Loading />;
  if (error || !data) return <ErrorState message={error ?? undefined} onRetry={reload} />;
  return (
    <>
      <h1>Tableau de bord</h1>
      <div className="stat-grid">
        <div className="stat"><b>{data.newQuotes}</b>devis nouveaux</div>
        <div className="stat"><b>{data.pendingReviews}</b>avis en attente</div>
        <div className="stat"><b>{data.unread}</b>messages non lus</div>
        <div className="stat"><b>{data.published}</b>projets publiés</div>
        <div className="stat"><b>{data.drafts}</b>brouillons</div>
      </div>
      <div className="panel"><h2 style={{ fontSize: 'var(--step-1)' }}>Dernières demandes de devis</h2>
        {data.quotes.length === 0 ? <p className="muted">Aucune demande pour le moment.</p> :
          <ul>{data.quotes.map((q) => <li key={q.id}><Link to="/admin/devis">{q.reference}</Link> · {q.project_title} · {formatDateTime(q.created_at)}</li>)}</ul>}</div>
      <div className="panel"><h2 style={{ fontSize: 'var(--step-1)' }}>Avis à modérer</h2>
        {data.reviews.length === 0 ? <p className="muted">Aucun avis en attente.</p> :
          <ul>{data.reviews.map((r) => <li key={r.id}><Link to="/admin/avis">{r.public_name} · {r.rating}/5</Link></li>)}</ul>}</div>
      <div className="panel"><h2 style={{ fontSize: 'var(--step-1)' }}>Derniers projets publiés</h2>
        {data.projects.length === 0 ? <p className="muted">Aucun projet publié.</p> : <ul>{data.projects.map((p) => <li key={p.id}>{p.title}</li>)}</ul>}</div>
      <div className="panel"><h2 style={{ fontSize: 'var(--step-1)' }}>État des fonctionnalités</h2>
        <ul><li>Base de données : {isConfigured ? 'connectée' : 'non configurée'}</li>
          <li>E-mails : l’envoi dépend de la fonction « notify » et de ses secrets (voir README). Une demande dont « notified_at » est vide n’a pas déclenché d’e-mail.</li></ul></div>
    </>
  );
}
