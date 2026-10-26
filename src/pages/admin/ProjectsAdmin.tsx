import { useState, type ChangeEvent, type FormEvent } from 'react';
import { db } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { ErrorState, Loading } from '../../components/ui';
import { slugify } from '../../lib/validation';
import type { Project } from '../../types';

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);
const csv = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);

type Draft = Omit<Project, 'id' | 'created_at' | 'updated_at'> & { id?: string };
const NEW: Draft = { title: '', slug: '', description: '', features: [], category: '', technologies: [], cover_image: null, gallery: [], external_url: null, status: 'draft', display_order: 0 };

export default function ProjectsAdmin() {
  const { data, error, loading, reload } = useAsync(async () => {
    const { data, error } = await db().from('projects').select('*').order('display_order').order('created_at', { ascending: false });
    if (error) throw new Error(error.message); return data as Project[];
  }, []);
  const [edit, setEdit] = useState<Draft | null>(null);
  const [msg, setMsg] = useState('');
  async function remove(p: Project) {
    if (!confirm(`Supprimer définitivement « ${p.title} » ?`)) return;
    const { error } = await db().from('projects').delete().eq('id', p.id);
    setMsg(error ? 'Action refusée : ' + error.message : 'Projet supprimé.'); reload();
  }
  async function toggle(p: Project) {
    const { error } = await db().from('projects').update({ status: p.status === 'published' ? 'draft' : 'published' }).eq('id', p.id);
    setMsg(error ? 'Action refusée : ' + error.message : p.status === 'published' ? 'Projet dépublié.' : 'Projet publié.'); reload();
  }
  if (edit) return <ProjectForm draft={edit} onClose={(saved) => { setEdit(null); if (saved) { setMsg('Projet enregistré.'); reload(); } }} />;
  return (
    <>
      <div className="toolbar"><h1 style={{ margin: 0 }}>Projets</h1><button className="btn" onClick={() => setEdit(NEW)}>Nouveau projet</button></div>
      <p role="status" className="muted">{msg}</p>
      {loading ? <Loading /> : error ? <ErrorState message={error} onRetry={reload} /> : !data?.length ? <p className="muted">Aucun projet. Créez le premier.</p> : (
        <div className="table-wrap"><table><thead><tr><th>Ordre</th><th>Titre</th><th>Catégorie</th><th>Statut</th><th>Actions</th></tr></thead><tbody>
          {data.map((p) => <tr key={p.id}><td>{p.display_order}</td><td>{p.title}<br /><small className="muted">/projets/{p.slug}</small></td><td>{p.category}</td><td><span className="badge">{p.status === 'published' ? 'Publié' : 'Brouillon'}</span></td>
            <td><div className="actions"><button className="btn btn--small btn--ghost" onClick={() => setEdit(p)}>Modifier</button><button className="btn btn--small btn--ghost" onClick={() => toggle(p)}>{p.status === 'published' ? 'Dépublier' : 'Publier'}</button><button className="btn btn--small btn--danger" onClick={() => remove(p)}>Supprimer</button></div></td></tr>)}
        </tbody></table></div>
      )}
    </>
  );
}

function ProjectForm({ draft, onClose }: { draft: Draft; onClose: (saved: boolean) => void }) {
  const [p, setP] = useState(draft);
  const [slugTouched, setSlugTouched] = useState(!!draft.id);
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setP((o) => ({ ...o, [k]: v }));

  async function upload(e: ChangeEvent<HTMLInputElement>, target: 'cover' | 'gallery') {
    const files = Array.from(e.target.files ?? []); e.target.value = '';
    for (const f of files) {
      if (!TYPES.includes(f.type)) return setErr('Format refusé : utilisez JPEG, PNG, WebP ou AVIF.');
      if (f.size > MAX_BYTES) return setErr('Image trop lourde : 5 Mo maximum.');
    }
    setBusy(true); setErr('');
    const urls: string[] = [];
    for (const f of files) {
      const ext = f.type.split('/')[1];
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await db().storage.from('project-images').upload(path, f, { contentType: f.type });
      if (error) { setErr('Téléversement refusé : ' + error.message); setBusy(false); return; }
      urls.push(db().storage.from('project-images').getPublicUrl(path).data.publicUrl);
    }
    setP((o) => target === 'cover' ? { ...o, cover_image: urls[0] ?? o.cover_image } : { ...o, gallery: [...o.gallery, ...urls] });
    setBusy(false);
  }
  async function save(e: FormEvent, status?: 'draft' | 'published') {
    e.preventDefault(); setErr('');
    const row = { ...p, slug: slugify(p.slug || p.title), status: status ?? p.status, external_url: p.external_url?.trim() || null };
    if (row.title.trim().length < 2) return setErr('Le titre est obligatoire.');
    if (!row.slug) return setErr('Le slug est obligatoire.');
    if (row.external_url && !/^https?:\/\//.test(row.external_url)) return setErr('Le lien externe doit commencer par http:// ou https://.');
    setBusy(true);
    const { id, ...fields } = row;
    const { error } = id ? await db().from('projects').update(fields).eq('id', id) : await db().from('projects').insert(fields);
    setBusy(false);
    if (error) return setErr(error.code === '23505' ? 'Ce slug est déjà utilisé.' : 'Enregistrement refusé : ' + error.message);
    onClose(true);
  }
  return (
    <form className="form" onSubmit={(e) => save(e)} style={{ maxWidth: 800 }}>
      <h1>{p.id ? 'Modifier le projet' : 'Nouveau projet'}</h1>
      <div className="field"><label htmlFor="p-title">Titre</label><input id="p-title" value={p.title} onChange={(e) => { set('title', e.target.value); if (!slugTouched) set('slug', slugify(e.target.value)); }} required /></div>
      <div className="field"><label htmlFor="p-slug">Slug (URL)</label><input id="p-slug" value={p.slug} onChange={(e) => { setSlugTouched(true); set('slug', e.target.value); }} /><span className="hint">Modifier le slug d’un projet publié change son adresse.</span></div>
      <div className="row-2">
        <div className="field"><label htmlFor="p-cat">Catégorie</label><input id="p-cat" value={p.category} onChange={(e) => set('category', e.target.value)} /></div>
        <div className="field"><label htmlFor="p-order">Ordre d’affichage</label><input id="p-order" type="number" value={p.display_order} onChange={(e) => set('display_order', Number(e.target.value))} /></div>
      </div>
      <div className="field"><label htmlFor="p-desc">Présentation (séparez les paragraphes par une ligne vide)</label><textarea id="p-desc" value={p.description} onChange={(e) => set('description', e.target.value)} /></div>
      <div className="field"><label htmlFor="p-feat">Fonctionnalités (une par ligne)</label><textarea id="p-feat" value={p.features.join('\n')} onChange={(e) => set('features', lines(e.target.value))} /></div>
      <div className="field"><label htmlFor="p-tech">Technologies (séparées par des virgules)</label><input id="p-tech" defaultValue={p.technologies.join(', ')} onBlur={(e) => set('technologies', csv(e.target.value))} /></div>
      <div className="field"><label htmlFor="p-url">Lien externe (facultatif)</label><input id="p-url" type="url" value={p.external_url ?? ''} onChange={(e) => set('external_url', e.target.value)} /></div>
      <div className="field"><label htmlFor="p-cover">Image de couverture (JPEG, PNG, WebP, AVIF, 5 Mo max)</label><input id="p-cover" type="file" accept={TYPES.join(',')} onChange={(e) => upload(e, 'cover')} />
        {p.cover_image && <img src={p.cover_image} alt="Couverture actuelle" style={{ maxWidth: 240 }} />}</div>
      <div className="field"><label htmlFor="p-gal">Galerie</label><input id="p-gal" type="file" multiple accept={TYPES.join(',')} onChange={(e) => upload(e, 'gallery')} />
        <div className="actions">{p.gallery.map((g) => <div key={g}><img src={g} alt="" style={{ width: 100 }} /><button type="button" className="btn btn--small btn--ghost" onClick={() => set('gallery', p.gallery.filter((x) => x !== g))}>Retirer</button></div>)}</div></div>
      {err && <div className="alert alert--error" role="alert">{err}</div>}
      <div className="actions">
        <button type="button" className="btn btn--ghost" disabled={busy} onClick={(e) => save(e, 'draft')}>Enregistrer en brouillon</button>
        <button type="button" className="btn" disabled={busy} onClick={(e) => save(e, 'published')}>Enregistrer et publier</button>
        <button type="button" className="btn btn--ghost" onClick={() => onClose(false)}>Annuler</button>
      </div>
    </form>
  );
}
