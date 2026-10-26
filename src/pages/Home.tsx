import { Link } from 'react-router-dom';
import LineMotif from '../components/LineMotif';
import { Stars, Loading } from '../components/ui';
import { getProjects, getReviews, getReviewStats, getServices } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { useSettings } from '../lib/settings';
import { useSeo } from '../hooks/useSeo';
import { formatDate } from '../lib/format';

const METHOD = [
  { t: 'Échange', d: 'Vous décrivez votre besoin. Nous clarifions ensemble les objectifs et les contraintes.' },
  { t: 'Devis', d: 'Vous recevez une proposition personnalisée, sans prix standard imposé.' },
  { t: 'Création', d: 'Le projet est conçu et développé, avec des points d’étape pour valider la direction.' },
  { t: 'Livraison', d: 'Livraison, corrections éventuelles et suivi après la mise en ligne.' },
];

export default function Home() {
  const s = useSettings();
  useSeo(s.site_title || 'ThatImault Studio', s.seo_description || 'Studio de création numérique sur mesure.');
  const services = useAsync(getServices, []);
  const projects = useAsync(getProjects, []);
  const reviews = useAsync(async () => ({ list: (await getReviews(null, 1)).reviews.slice(0, 3), stats: await getReviewStats() }), []);

  return (
    <>
      <section className="hero">
        <LineMotif className="hero__motif" />
        <div className="wrap hero__body">
          <h1>{s.hero_title || 'Des solutions numériques conçues sur mesure.'}</h1>
          <p className="lede">{s.hero_text || 'ThatImault Studio crée des sites web, des plugins Minecraft, des applications, des identités visuelles et des montages vidéo, sur devis.'}</p>
          <div className="actions">
            <Link className="btn" to="/services">Découvrir les services</Link>
            <Link className="btn btn--ghost" to="/devis">Demander un devis</Link>
          </div>
        </div>
      </section>

      <section className="section section--paper" aria-labelledby="h-services">
        <div className="wrap">
          <h2 id="h-services">Ce que nous créons</h2>
          {services.loading ? <Loading /> : (
            <div className="service-list">
              {(services.data ?? []).map((sv) => (
                <Link key={sv.id} to={`/services#${sv.slug}`}><strong>{sv.title}</strong><span className="muted">{sv.description}</span></Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {!!projects.data?.length && (
        <section className="section" aria-labelledby="h-projects">
          <div className="wrap">
            <div className="toolbar"><h2 id="h-projects" style={{ margin: 0 }}>Réalisations</h2><Link to="/projets">Toutes les réalisations</Link></div>
            <div className="grid">
              {projects.data.slice(0, 3).map((p) => (
                <Link key={p.id} to={`/projets/${p.slug}`} className="card">
                  <div className="card__img">{p.cover_image && <img src={p.cover_image} alt={`Aperçu du projet ${p.title}`} loading="lazy" />}</div>
                  <h3>{p.title}</h3><p className="muted">{p.category}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section" aria-labelledby="h-method">
        <div className="wrap">
          <h2 id="h-method">Une méthode simple</h2>
          <ol className="steps">{METHOD.map((m) => <li key={m.t}><h3>{m.t}</h3><p className="muted">{m.d}</p></li>)}</ol>
        </div>
      </section>

      {!!reviews.data?.stats.count && (
        <section className="section section--paper" aria-labelledby="h-reviews">
          <div className="wrap">
            <div className="toolbar"><h2 id="h-reviews" style={{ margin: 0 }}>Avis clients</h2><Link to="/avis">Voir tous les avis</Link></div>
            {reviews.data.list.map((r) => (
              <article key={r.id} className="review"><Stars value={r.rating} /><p>{r.comment}</p><small>{r.public_name}, {formatDate(r.published_at)}</small></article>
            ))}
          </div>
        </section>
      )}

      <section className="section cta">
        <div className="wrap">
          <h2>Un projet en tête&nbsp;?</h2>
          <p className="lede">Décrivez-le en quelques lignes. Nous revenons vers vous avec une proposition adaptée.</p>
          <div className="actions"><Link className="btn" to="/devis">Demander un devis</Link><Link className="btn btn--ghost" to="/contact">Nous contacter</Link></div>
        </div>
      </section>
    </>
  );
}
