import { db } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { ErrorState, Loading } from '../../components/ui';
import { formatDateTime } from '../../lib/format';
import type { ContactMessage } from '../../types';

export default function MessagesAdmin() {
  const { data, error, loading, reload } = useAsync(async () => {
    const { data, error } = await db().from('contact_messages').select('*').order('created_at', { ascending: false }).limit(100);
    if (error) throw new Error(error.message); return data as ContactMessage[];
  }, []);
  const toggle = async (m: ContactMessage) => { await db().from('contact_messages').update({ is_read: !m.is_read }).eq('id', m.id); reload(); };
  const del = async (m: ContactMessage) => { if (confirm('Supprimer ce message ?')) { await db().from('contact_messages').delete().eq('id', m.id); reload(); } };
  return (
    <>
      <h1>Messages de contact</h1>
      {loading ? <Loading /> : error ? <ErrorState message={error} onRetry={reload} /> : !data?.length ? <p className="muted">Aucun message.</p> :
        data.map((m) => (
          <article className="panel" key={m.id}>
            <strong>{m.name}</strong> {!m.is_read && <span className="badge badge--new">Nouveau</span>}<br />
            <small className="muted"><a href={`mailto:${m.email}`}>{m.email}</a> · {formatDateTime(m.created_at)}</small>
            <p style={{ whiteSpace: 'pre-wrap' }}>{m.message}</p>
            <div className="actions"><button className="btn btn--small btn--ghost" onClick={() => toggle(m)}>{m.is_read ? 'Marquer non lu' : 'Marquer lu'}</button><button className="btn btn--small btn--danger" onClick={() => del(m)}>Supprimer</button></div>
          </article>
        ))}
    </>
  );
}
