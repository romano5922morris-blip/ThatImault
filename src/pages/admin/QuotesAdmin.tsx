import { useState } from 'react';
import { db } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { ErrorState, Loading } from '../../components/ui';
import { formatDateTime } from '../../lib/format';
import type { QuoteEvent, QuoteRequest, QuoteStatus } from '../../types';

const STATUS: Record<QuoteStatus, string> = { new: 'Nouveau', in_review: 'En cours d’étude', replied: 'Répondu', accepted: 'Accepté', declined: 'Refusé', done: 'Traité', archived: 'Archivé' };
const RETENTION_MONTHS = 24;

export default function QuotesAdmin() {
  const [filter, setFilter] = useState<QuoteStatus | 'active'>('active');
  const [open, setOpen] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const { data, error, loading, reload } = useAsync(async () => {
    let q = db().from('quote_requests').select('*').order('created_at', { ascending: false });
    q = filter === 'active' ? q.neq('status', 'archived') : q.eq('status', filter);
    const { data, error } = await q; if (error) throw new Error(error.message); return data as QuoteRequest[];
  }, [filter]);
  const report = (e: { message: string } | null, ok: string) => { setMsg(e ? 'Action refusée : ' + e.message : ok); reload(); };

  async function setStatus(q: QuoteRequest, status: QuoteStatus) {
    const archive_after = status === 'archived' ? new Date(Date.now() + RETENTION_MONTHS * 30 * 864e5).toISOString().slice(0, 10) : null;
    const { error } = await db().from('quote_requests').update({ status, archive_after }).eq('id', q.id);
    if (!error) await db().from('quote_events').insert({ quote_id: q.id, kind: 'status', body: `Statut : ${STATUS[status]}` });
    report(error, 'Statut mis à jour.');
  }
  async function saveNotes(q: QuoteRequest, internal_notes: string) {
    const { error } = await db().from('quote_requests').update({ internal_notes }).eq('id', q.id); report(error, 'Notes enregistrées.');
  }
  async function remove(q: QuoteRequest) {
    if (!confirm(`Supprimer définitivement la demande ${q.reference} ?`)) return;
    const { error } = await db().from('quote_requests').delete().eq('id', q.id); report(error, 'Demande supprimée.');
  }
  return (
    <>
      <h1>Demandes de devis</h1>
      <div className="filters" role="group" aria-label="Filtrer par statut">
        <button className="chip" aria-pressed={filter === 'active'} onClick={() => setFilter('active')}>En cours</button>
        {(Object.keys(STATUS) as QuoteStatus[]).map((s) => <button key={s} className="chip" aria-pressed={filter === s} onClick={() => setFilter(s)}>{STATUS[s]}</button>)}
      </div>
      <p role="status" className="muted">{msg}</p>
      {loading ? <Loading /> : error ? <ErrorState message={error} onRetry={reload} /> : !data?.length ? <p className="muted">Aucune demande.</p> :
        data.map((q) => (
          <article className="panel" key={q.id}>
            <div className="toolbar">
              <div><strong>{q.reference}</strong> <span className={`badge badge--${q.status}`}>{STATUS[q.status]}</span><br />{q.project_title}</div>
              <button className="btn btn--small btn--ghost" aria-expanded={open === q.id} onClick={() => setOpen(open === q.id ? null : q.id)}>{open === q.id ? 'Réduire' : 'Ouvrir'}</button>
            </div>
            <small className="muted">{q.name} · <a href={`mailto:${q.email}`}>{q.email}</a> · {q.service_category} · {formatDateTime(q.created_at)} · e-mail de notification : {q.notified_at ? 'envoyé' : 'non envoyé'}</small>
            {open === q.id && <QuoteDetail q={q} onStatus={setStatus} onNotes={saveNotes} onDelete={remove} />}
          </article>
        ))}
      <p className="muted">Politique de conservation : les demandes archivées reçoivent une date de purge à {RETENTION_MONTHS} mois (colonne « archive_after »).</p>
    </>
  );
}

function QuoteDetail({ q, onStatus, onNotes, onDelete }: { q: QuoteRequest; onStatus: (q: QuoteRequest, s: QuoteStatus) => void; onNotes: (q: QuoteRequest, n: string) => void; onDelete: (q: QuoteRequest) => void }) {
  const [notes, setNotes] = useState(q.internal_notes);
  const [entry, setEntry] = useState(''); const [kind, setKind] = useState<'note' | 'email_in' | 'email_out'>('note');
  const events = useAsync(async () => { const { data } = await db().from('quote_events').select('*').eq('quote_id', q.id).order('created_at'); return (data ?? []) as QuoteEvent[]; }, [q.id]);
  async function addEvent() {
    if (!entry.trim()) return;
    await db().from('quote_events').insert({ quote_id: q.id, kind, body: entry.trim() }); setEntry(''); events.reload();
  }
  return (
    <div style={{ marginTop: 16 }}>
      <p style={{ whiteSpace: 'pre-wrap' }}>{q.description}</p>
      <p className="muted">Budget : {q.budget_range || 'non précisé'} · Délai : {q.desired_deadline || 'non précisé'}</p>
      {!!q.reference_links.length && <ul>{q.reference_links.map((l) => <li key={l}><a href={l} target="_blank" rel="noopener noreferrer">{l}</a></li>)}</ul>}
      <div className="field"><label htmlFor={`st-${q.id}`}>Statut</label>
        <select id={`st-${q.id}`} value={q.status} onChange={(e) => onStatus(q, e.target.value as QuoteStatus)}>{(Object.keys(STATUS) as QuoteStatus[]).map((s) => <option key={s} value={s}>{STATUS[s]}</option>)}</select></div>
      <div className="field" style={{ marginTop: 12 }}><label htmlFor={`n-${q.id}`}>Notes internes (jamais publiques)</label>
        <textarea id={`n-${q.id}`} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      <div className="actions" style={{ margin: '12px 0' }}>
        <button className="btn btn--small" onClick={() => onNotes(q, notes)}>Enregistrer les notes</button>
        <button className="btn btn--small btn--ghost" onClick={() => onStatus(q, 'done')}>Marquer comme traitée</button>
        <button className="btn btn--small btn--ghost" onClick={() => onStatus(q, 'archived')}>Archiver</button>
        <button className="btn btn--small btn--danger" onClick={() => onDelete(q)}>Supprimer</button>
      </div>
      <h3 style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--step-0)' }}>Suivi des échanges</h3>
      {events.data?.map((e) => <p key={e.id} style={{ margin: '0 0 .4rem' }}><small className="muted">{formatDateTime(e.created_at)} · {e.kind === 'email_in' ? 'E-mail reçu' : e.kind === 'email_out' ? 'E-mail envoyé' : e.kind === 'status' ? 'Statut' : 'Note'}</small><br />{e.body}</p>)}
      <div className="row-2"><div className="field"><label htmlFor={`k-${q.id}`}>Type</label><select id={`k-${q.id}`} value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}><option value="note">Note</option><option value="email_in">E-mail reçu</option><option value="email_out">E-mail envoyé</option></select></div>
        <div className="field"><label htmlFor={`e-${q.id}`}>Entrée</label><input id={`e-${q.id}`} value={entry} onChange={(e) => setEntry(e.target.value)} /></div></div>
      <button className="btn btn--small" style={{ marginTop: 8 }} onClick={addEvent}>Ajouter au suivi</button>
    </div>
  );
}
