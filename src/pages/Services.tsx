import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, Loading } from '../components/ui';
import { getServices } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { useSeo } from '../hooks/useSeo';

export default function Services() {
  useSeo('Services', 'Développement web, plugins Minecraft, applications, design graphique et motion design. Toutes les prestations sont proposées sur devis.');
  const { data, error, loading, reload } = useAsync(getServices, []);
  return (
    <>
      <div className="page-head"><div className="wrap">
        <h1>Services</h1>
        <p className="lede">Chaque prestation est étudiée avec vous et proposée sur devis personnalisé.</p>
      </div></div>
      <div className="wrap section" style={{ paddingTop: 'var(--space-4)' }}>
        {loading ? <Loading /> : error ? <ErrorState message={error} onRetry={reload} /> :
          !data?.length ? <EmptyState title="Aucun service disponible pour le moment" cta={{ to: '/contact', label: 'Nous contacter' }} /> :
          data.map((s) => (
            <section key={s.id} id={s.slug} className="service">
              <div><h2 style={{ fontSize: 'var(--step-2)' }}>{s.title}</h2></div>
              <div>
                <p>{s.description}</p>
                {!!s.capabilities.length && <ul>{s.capabilities.map((c) => <li key={c}>{c}</li>)}</ul>}
                <Link className="btn" to={`/devis?service=${encodeURIComponent(s.slug)}`}>Demander un devis</Link>
              </div>
            </section>
          ))}
      </div>
    </>
  );
}
