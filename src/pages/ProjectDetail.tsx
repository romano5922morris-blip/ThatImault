import { Link, useParams } from 'react-router-dom';
import { ErrorState, Loading } from '../components/ui';
import { getProject } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { useSeo } from '../hooks/useSeo';
import NotFound from './NotFound';

export default function ProjectDetail() {
  const { slug = '' } = useParams();
  const { data, error, loading, reload } = useAsync(() => getProject(slug), [slug]);
  useSeo(data?.title ?? 'Projet', data?.description.slice(0, 155) || 'Détail d’une réalisation du studio.', { image: data?.cover_image ?? undefined });
  if (loading) return <div className="wrap"><Loading /></div>;
  if (error) return <div className="wrap section"><ErrorState message={error} onRetry={reload} /></div>;
  if (!data) return <NotFound />;
  return (
    <div className="wrap section" style={{ paddingTop: 'var(--space-4)' }}>
      <p><Link to="/projets">Retour aux réalisations</Link></p>
      <h1 style={{ fontSize: 'var(--step-3)' }}>{data.title}</h1>
      {data.category && <p className="muted">{data.category}</p>}
      {data.cover_image && <img className="detail-cover" src={data.cover_image} alt={`Visuel principal du projet ${data.title}`} />}
      <div className="detail-grid">
        <div>
          {data.description.split('\n\n').map((para, i) => <p key={i}>{para}</p>)}
          {!!data.features.length && <><h2 style={{ fontSize: 'var(--step-1)' }}>Fonctionnalités</h2><ul>{data.features.map((f) => <li key={f}>{f}</li>)}</ul></>}
        </div>
        <aside>
          {!!data.technologies.length && <><h2 style={{ fontSize: 'var(--step-1)' }}>Technologies</h2><ul className="tags">{data.technologies.map((t) => <li key={t}>{t}</li>)}</ul></>}
          <div className="actions">
            {data.external_url && <a className="btn btn--ghost" href={data.external_url} target="_blank" rel="noopener noreferrer">Voir le projet<span className="sr-only"> (nouvel onglet)</span></a>}
            <Link className="btn" to={`/devis?similar=${encodeURIComponent(data.title)}`}>Demander un projet similaire</Link>
          </div>
        </aside>
      </div>
      {!!data.gallery.length && <div className="gallery">{data.gallery.map((src, i) => <img key={src} src={src} loading="lazy" alt={`${data.title}, visuel ${i + 2}`} />)}</div>}
    </div>
  );
}
