import { Link } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';

export default function NotFound() {
  useSeo('Page introuvable', 'Cette page n’existe pas.', { noindex: true });
  return (
    <div className="wrap section">
      <h1>Page introuvable</h1>
      <p className="lede">L’adresse demandée n’existe pas ou n’est plus disponible.</p>
      <div className="actions"><Link className="btn" to="/">Retour à l’accueil</Link><Link className="btn btn--ghost" to="/projets">Voir les réalisations</Link></div>
    </div>
  );
}
