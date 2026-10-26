import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { SOCIALS, useSettings } from '../lib/settings';
import { useReveal } from '../hooks/useReveal';

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
  function toggle() {
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch { /* stockage indisponible */ }
    setDark(!dark);
  }
  return (
    <button type="button" className="theme-toggle" onClick={toggle} aria-pressed={dark} aria-label="Mode sombre">
      <span aria-hidden="true">{dark ? '☀' : '☾'}</span><span>{dark ? 'Clair' : 'Sombre'}</span>
    </button>
  );
}

const LINKS = [
  { to: '/', label: 'Accueil', end: true }, { to: '/services', label: 'Services' },
  { to: '/projets', label: 'Réalisations' }, { to: '/avis', label: 'Avis' }, { to: '/contact', label: 'Contact' },
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const s = useSettings();
  const [scrolled, setScrolled] = useState(false);
  useReveal();
  useEffect(() => { const f = () => setScrolled(window.scrollY > 8); f(); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f); }, []);
  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [pathname]);
  const socials = SOCIALS.filter((x) => s[x.key]);

  return (
    <>
      <a className="skip" href="#main">Aller au contenu</a>
      <header className="header" data-scrolled={scrolled}>
        <div className="wrap header__inner">
          <Link to="/" className="brand" aria-label="ThatImault Studio, accueil"><img src="/logo.png" alt="ThatImault Studio" width="124" height="40" /></Link>
          <button className="burger" aria-expanded={open} aria-controls="nav" onClick={() => setOpen(!open)}>{open ? 'Fermer' : 'Menu'}</button>
          <nav id="nav" className="nav" data-open={open} aria-label="Navigation principale">
            {LINKS.map((l) => <NavLink key={l.to} to={l.to} end={l.end}>{l.label}</NavLink>)}
            <NavLink to="/devis" className="btn">Demander un devis</NavLink>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main id="main" tabIndex={-1}><div key={pathname} className="page"><Outlet /></div></main>
      <footer className="footer">
        <div className="wrap">
          <div className="footer__grid">
            <div>
              <img src="/logo.png" alt="ThatImault Studio" width="150" height="48" style={{ height: 48, width: 'auto', marginBottom: 16 }} />
              <p className="muted">Création de solutions numériques sur mesure, sur devis.</p>
            </div>
            <div><h2>Le studio</h2><ul>{LINKS.map((l) => <li key={l.to}><Link to={l.to}>{l.label}</Link></li>)}<li><Link to="/devis">Demander un devis</Link></li></ul></div>
            <div><h2>Contact</h2><ul>
              {s.contact_email && <li><a href={`mailto:${s.contact_email}`}>{s.contact_email}</a></li>}
              {s.contact_phone && <li><a href={`tel:${s.contact_phone.replace(/\s/g, '')}`}>{s.contact_phone}</a></li>}
              {socials.map((x) => <li key={x.key}><a href={s[x.key]} rel="noopener noreferrer" target="_blank">{x.label}</a></li>)}
              <li><Link to="/contact">Formulaire de contact</Link></li>
            </ul></div>
          </div>
          <p className="footer__legal">© {new Date().getFullYear()} ThatImault Studio. Les données transmises via les formulaires servent uniquement à traiter votre demande.</p>
        </div>
      </footer>
    </>
  );
}
