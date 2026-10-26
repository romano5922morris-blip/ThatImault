import { useState } from 'react';
import { db } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { ErrorState, Loading, Stars } from '../../components/ui';
import { formatDateTime } from '../../lib/format';
import type { ModerationStatus, Review } from '../../types';

const LABEL: Record<ModerationStatus, string> = { pending: 'En attente', published: 'Publié', rejected: 'Refusé', hidden: 'Masqué', flagged: 'Signalé' };

export default function ReviewsAdmin() {
  const [filter, setFilter] = useState<ModerationStatus | 'all'>('pending');
  const [msg, setMsg] = useState('');
  const { data, error, loading, reload } = useAsync(async () => {
    let q = db().from('reviews').select('*').order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('moderation_status', filter);
    const { data, error } = await q; if (error) throw new Error(error.message); return data as Review[];
  }, [filter]);
  async function setStatus(id: string, moderation_status: ModerationStatus) {
    const { error } = await db().from('reviews').update({ moderation_status }).eq('id', id);
    setMsg(error ? 'Action refusée : ' + error.message : `Avis ${LABEL[moderation_status].toLowerCase()}.`); reload();
  }
  async function setVerified(id: string, verified: boolean) {
    const { error } = await db().from('reviews').update({ verification_status: verified ? 'verified' : 'unverified' }).eq('id', id);
    setMsg(error ? 'Action refusée : ' + error.message : 'Vérification mise à jour.'); reload();
  }
  return (
    <>
      <h1>Avis</h1>
      <div className="filters" role="group" aria-label="Filtrer par statut">
        {(['pending', 'published', 'flagged', 'hidden', 'rejected', 'all'] as const).map((s) => <button key={s} className="chip" aria-pressed={filter === s} onClick={() => setFilter(s)}>{s === 'all' ? 'Tous' : LABEL[s]}</button>)}
      </div>
      <p role="status" className="muted">{msg}</p>
      {loading ? <Loading /> : error ? <ErrorState message={error} onRetry={reload} /> : !data?.length ? <p className="muted">Aucun avis dans cette catégorie.</p> :
        data.map((r) => (
          <article className="panel" key={r.id}>
            <div className="toolbar"><div><Stars value={r.rating} /> <strong>{r.public_name}</strong> <span className={`badge badge--${r.moderation_status}`}>{LABEL[r.moderation_status]}</span></div><small className="muted">{formatDateTime(r.created_at)}</small></div>
            <p>{r.comment}</p>
            <div className="actions">
              {r.moderation_status !== 'published' && <button className="btn btn--small" onClick={() => setStatus(r.id, 'published')}>Publier</button>}
              {r.moderation_status !== 'rejected' && <button className="btn btn--small btn--ghost" onClick={() => setStatus(r.id, 'rejected')}>Refuser</button>}
              {r.moderation_status === 'published' && <button className="btn btn--small btn--ghost" onClick={() => setStatus(r.id, 'hidden')}>Masquer</button>}
              {r.moderation_status !== 'flagged' && <button className="btn btn--small btn--ghost" onClick={() => setStatus(r.id, 'flagged')}>Signaler</button>}
              <button className="btn btn--small btn--ghost" onClick={() => setVerified(r.id, r.verification_status !== 'verified')}>{r.verification_status === 'verified' ? 'Retirer « vérifié »' : 'Marquer comme client vérifié'}</button>
            </div>
          </article>
        ))}
    </>
  );
}
