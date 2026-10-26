import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, Loading } from '../components/ui';
import { getProjects } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { useSeo } from '../hooks/useSeo';

export default function Projects() {
  useSeo('Réalisations', 'Les projets réalisés par ThatImault Studio : sites web, plugins, applications, design et vidéo.');
  const { data, error, loading, reload } = useAsync(getProjects, []);
  const [cat, setCat] = useState('');
  const [q, setQ] = useState('');
  const cats = useMemo(() => [...new Set((data ?? []).map((p) => p.category).filter(Boolean))], [data]);
  const shown = useMemo(() => (data ?? []).filter((p) =>
    (!cat || p.category === cat) &&
    (!q || `${p.title} ${p.description} ${p.technologies.join(' ')}`.toLowerCase().includes(q.toLowerCase()))), [data, cat, q]);

  return (
    <>
      <div className="page-head"><div className="wrap"><h1>Réalisations</h1><p className="lede">Une sélection de projets menés par le studio.</p></div></div>
      <div className="wrap section" style={{ paddingTop: 'var(--space-3)' }}>
        {loading ? <Loading /> : error ? <ErrorState message={error} onRetry={reload} /> :
          !data?.length ? <EmptyState title="Aucune réalisation publiée pour le moment" cta={{ to: '/devis', label: 'Démarrer un projet' }}>Les projets seront présentés ici dès leur publication.</EmptyState> : (
          <>
            <div className="toolbar">
              <div className="filters" role="group" aria-label="Filtrer par catégorie" style={{ margin: 0 }}>
                <button className="chip" aria-pressed={!cat} onClick={() => setCat('')}>Tous</button>
                {cats.map((c) => <button key={c} className="chip" aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>)}
              </div>
              <div className="field search"><label className="sr-only" htmlFor="q">Rechercher un projet</label><input id="q" type="search" placeholder="Rechercher" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            </div>
            <p className="sr-only" role="status">{shown.length} projet(s) affiché(s)</p>
            {shown.length === 0 ? <EmptyState title="Aucun projet ne correspond">Essayez une autre catégorie ou un autre mot-clé.</EmptyState> : (
              <div className="grid" key={`${cat}|${q}`}>
                {shown.map((p) => (
                  <Link key={p.id} to={`/projets/${p.slug}`} className="card">
                    <div className="card__img">{p.cover_image && <img src={p.cover_image} alt={`Aperçu du projet ${p.title}`} loading="lazy" />}</div>
                    <h3>{p.title}</h3>
                    <p className="muted">{p.category}</p>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
