import { useEffect, useState, type FormEvent } from 'react';
import { db } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { ErrorState, Loading } from '../../components/ui';
import { isEmail, isHttpUrl } from '../../lib/validation';

const FIELDS: { key: string; label: string; type?: 'url' | 'email' | 'tel' | 'area'; hint?: string }[] = [
  { key: 'site_title', label: 'Titre du site' }, { key: 'seo_description', label: 'Description SEO (155 caractères conseillés)', type: 'area' },
  { key: 'hero_title', label: 'Titre de l’accueil' }, { key: 'hero_text', label: 'Texte de l’accueil', type: 'area' },
  { key: 'contact_email', label: 'E-mail public de contact', type: 'email', hint: 'Laissez vide pour le masquer.' },
  { key: 'contact_phone', label: 'Téléphone public', type: 'tel', hint: 'Laissez vide pour le masquer.' },
  { key: 'response_time', label: 'Délai de réponse affiché', hint: 'Laissez vide si non défini.' },
  { key: 'social_github', label: 'GitHub (URL)', type: 'url' }, { key: 'social_discord', label: 'Discord (URL)', type: 'url' },
  { key: 'social_youtube', label: 'YouTube (URL)', type: 'url' }, { key: 'social_x', label: 'X (URL)', type: 'url' }, { key: 'social_instagram', label: 'Instagram (URL)', type: 'url' },
];

export default function SettingsAdmin() {
  const { data, error, loading, reload } = useAsync(async () => {
    const { data, error } = await db().from('site_settings').select('key,value'); if (error) throw new Error(error.message);
    return Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) as Record<string, string>;
  }, []);
  const [v, setV] = useState<Record<string, string>>({}); const [msg, setMsg] = useState(''); const [bad, setBad] = useState('');
  useEffect(() => { if (data) setV(data); }, [data]);
  async function save(e: FormEvent) {
    e.preventDefault(); setMsg(''); setBad('');
    for (const f of FIELDS) {
      const val = (v[f.key] ?? '').trim();
      if (val && f.type === 'url' && !isHttpUrl(val)) return setBad(`${f.label} : adresse invalide.`);
      if (val && f.type === 'email' && !isEmail(val)) return setBad(`${f.label} : adresse invalide.`);
    }
    const rows = FIELDS.map((f) => ({ key: f.key, value: (v[f.key] ?? '').trim(), updated_at: new Date().toISOString() }));
    const { error } = await db().from('site_settings').upsert(rows);
    if (error) setBad('Enregistrement refusé : ' + error.message); else { setMsg('Paramètres enregistrés.'); reload(); }
  }
  if (loading) return <Loading />; if (error) return <ErrorState message={error} onRetry={reload} />;
  return (
    <form className="form" onSubmit={save} style={{ maxWidth: 720 }}>
      <h1>Paramètres du site</h1>
      {FIELDS.map((f) => (
        <div className="field" key={f.key}><label htmlFor={f.key}>{f.label}</label>
          {f.type === 'area' ? <textarea id={f.key} value={v[f.key] ?? ''} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} /> :
            <input id={f.key} type={f.type ?? 'text'} value={v[f.key] ?? ''} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />}
          {f.hint && <span className="hint">{f.hint}</span>}</div>
      ))}
      <p className="muted">Le logo et le favicon se remplacent dans le dossier <code>public/</code> du dépôt (voir README) : ils ne sont pas modifiables depuis cette interface.</p>
      {bad && <div className="alert alert--error" role="alert">{bad}</div>}{msg && <div className="alert alert--ok" role="status">{msg}</div>}
      <div><button className="btn">Enregistrer</button></div>
    </form>
  );
}
