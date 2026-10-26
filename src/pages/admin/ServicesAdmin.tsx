import { useState, type FormEvent } from 'react';
import { db } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { ErrorState, Loading } from '../../components/ui';
import { slugify } from '../../lib/validation';
import type { Service } from '../../types';

type Draft = Omit<Service, 'id'> & { id?: string };
const NEW: Draft = { title: '', slug: '', description: '', capabilities: [], category: '', icon: null, is_active: true, display_order: 0 };

export default function ServicesAdmin() {
  const { data, error, loading, reload } = useAsync(async () => {
    const { data, error } = await db().from('services').select('*').order('display_order');
    if (error) throw new Error(error.message); return data as Service[];
  }, []);
  const [edit, setEdit] = useState<Draft | null>(null);
  const [msg, setMsg] = useState('');
  async function toggle(s: Service) { const { error } = await db().from('services').update({ is_active: !s.is_active }).eq('id', s.id); setMsg(error ? error.message : 'Service mis à jour.'); reload(); }
  async function remove(s: Service) { if (!confirm(`Supprimer « ${s.title} » ?`)) return; const { error } = await db().from('services').delete().eq('id', s.id); setMsg(error ? error.message : 'Service supprimé.'); reload(); }
  if (edit) return <ServiceForm draft={edit} onClose={(saved) => { setEdit(null); if (saved) { setMsg('Service enregistré.'); reload(); } }} />;
  return (
    <>
      <div className="toolbar"><h1 style={{ margin: 0 }}>Services</h1><button className="btn" onClick={() => setEdit(NEW)}>Nouveau service</button></div>
      <p role="status" className="muted">{msg}</p>
      {loading ? <Loading /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <div className="table-wrap"><table><thead><tr><th>Ordre</th><th>Titre</th><th>Catégorie</th><th>Actif</th><th>Actions</th></tr></thead><tbody>
          {data?.map((s) => <tr key={s.id}><td>{s.display_order}</td><td>{s.title}</td><td>{s.category}</td><td>{s.is_active ? 'Oui' : 'Non'}</td>
            <td><div className="actions"><button className="btn btn--small btn--ghost" onClick={() => setEdit(s)}>Modifier</button><button className="btn btn--small btn--ghost" onClick={() => toggle(s)}>{s.is_active ? 'Désactiver' : 'Activer'}</button><button className="btn btn--small btn--danger" onClick={() => remove(s)}>Supprimer</button></div></td></tr>)}
        </tbody></table></div>
      )}
    </>
  );
}

function ServiceForm({ draft, onClose }: { draft: Draft; onClose: (saved: boolean) => void }) {
  const [s, setS] = useState(draft); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setS((o) => ({ ...o, [k]: v }));
  async function save(e: FormEvent) {
    e.preventDefault(); setErr('');
    const row = { ...s, slug: slugify(s.slug || s.title) };
    if (row.title.trim().length < 2 || !row.slug) return setErr('Le titre est obligatoire.');
    setBusy(true); const { id, ...fields } = row;
    const { error } = id ? await db().from('services').update(fields).eq('id', id) : await db().from('services').insert(fields);
    setBusy(false);
    if (error) return setErr(error.code === '23505' ? 'Ce slug est déjà utilisé.' : 'Enregistrement refusé : ' + error.message);
    onClose(true);
  }
  return (
    <form className="form" onSubmit={save}>
      <h1>{s.id ? 'Modifier le service' : 'Nouveau service'}</h1>
      <div className="field"><label htmlFor="s-title">Titre</label><input id="s-title" value={s.title} onChange={(e) => { set('title', e.target.value); if (!s.id) set('slug', slugify(e.target.value)); }} required /></div>
      <div className="field"><label htmlFor="s-slug">Slug</label><input id="s-slug" value={s.slug} onChange={(e) => set('slug', e.target.value)} /></div>
      <div className="row-2">
        <div className="field"><label htmlFor="s-cat">Catégorie (utilisée dans le formulaire de devis)</label><input id="s-cat" value={s.category} onChange={(e) => set('category', e.target.value)} /></div>
        <div className="field"><label htmlFor="s-order">Ordre d’affichage</label><input id="s-order" type="number" value={s.display_order} onChange={(e) => set('display_order', Number(e.target.value))} /></div>
      </div>
      <div className="field"><label htmlFor="s-desc">Description</label><textarea id="s-desc" value={s.description} onChange={(e) => set('description', e.target.value)} /></div>
      <div className="field"><label htmlFor="s-cap">Possibilités (une par ligne)</label><textarea id="s-cap" value={s.capabilities.join('\n')} onChange={(e) => set('capabilities', e.target.value.split('\n').map((x) => x.trim()).filter(Boolean))} /></div>
      <div className="check"><input id="s-active" type="checkbox" checked={s.is_active} onChange={(e) => set('is_active', e.target.checked)} /><label htmlFor="s-active">Service actif (visible sur le site)</label></div>
      {err && <div className="alert alert--error" role="alert">{err}</div>}
      <div className="actions"><button className="btn" disabled={busy}>Enregistrer</button><button type="button" className="btn btn--ghost" onClick={() => onClose(false)}>Annuler</button></div>
    </form>
  );
}
