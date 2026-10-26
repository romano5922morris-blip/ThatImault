import { useEffect, useState, type FormEvent } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { db, isConfigured } from '../../lib/supabase';
import { useSeo } from '../../hooks/useSeo';
import { Loading } from '../../components/ui';
import Dashboard from './Dashboard';
import ProjectsAdmin from './ProjectsAdmin';
import ServicesAdmin from './ServicesAdmin';
import ReviewsAdmin from './ReviewsAdmin';
import QuotesAdmin from './QuotesAdmin';
import MessagesAdmin from './MessagesAdmin';
import SettingsAdmin from './SettingsAdmin';

type Auth = { status: 'loading' } | { status: 'out' } | { status: 'forbidden'; email?: string } | { status: 'in'; session: Session };

export default function AdminApp() {
  useSeo('Administration', 'Espace réservé.', { noindex: true });
  const [auth, setAuth] = useState<Auth>({ status: 'loading' });

  useEffect(() => {
    if (!isConfigured) { setAuth({ status: 'out' }); return; }
    const check = async (session: Session | null) => {
      if (!session) return setAuth({ status: 'out' });
      // Vérification serveur : is_admin() est évaluée par la base. Les RLS protègent de toute façon chaque requête.
      const { data } = await db().rpc('is_admin');
      setAuth(data === true ? { status: 'in', session } : { status: 'forbidden', email: session.user.email });
    };
    db().auth.getSession().then(({ data }) => check(data.session));
    const { data: sub } = db().auth.onAuthStateChange((_e, session) => { setTimeout(() => check(session), 0); });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (auth.status === 'loading') return <Loading />;
  if (auth.status === 'out') return <Login />;
  if (auth.status === 'forbidden') return (
    <div className="login"><h1>Accès refusé</h1><p>Le compte {auth.email} n’est pas autorisé à administrer ce site.</p>
      <button className="btn" onClick={() => db().auth.signOut()}>Se déconnecter</button></div>
  );
  return (
    <div className="admin">
      <nav className="admin__nav" aria-label="Administration">
        <img src="/logo.png" alt="ThatImault Studio" style={{ width: 150, marginBottom: 16 }} />
        <NavLink to="/admin" end>Tableau de bord</NavLink>
        <NavLink to="/admin/devis">Devis</NavLink>
        <NavLink to="/admin/avis">Avis</NavLink>
        <NavLink to="/admin/projets">Projets</NavLink>
        <NavLink to="/admin/services">Services</NavLink>
        <NavLink to="/admin/messages">Messages</NavLink>
        <NavLink to="/admin/parametres">Paramètres</NavLink>
        <button className="btn btn--ghost btn--small" style={{ marginTop: 16 }} onClick={() => db().auth.signOut()}>Se déconnecter</button>
      </nav>
      <main className="admin__main">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="devis" element={<QuotesAdmin />} />
          <Route path="avis" element={<ReviewsAdmin />} />
          <Route path="projets" element={<ProjectsAdmin />} />
          <Route path="services" element={<ServicesAdmin />} />
          <Route path="messages" element={<MessagesAdmin />} />
          <Route path="parametres" element={<SettingsAdmin />} />
        </Routes>
      </main>
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const { error } = await db().auth.signInWithPassword({ email, password });
      if (error) setError('Identifiants incorrects.');
    } catch { setError('Connexion impossible : le service n’est pas configuré.'); }
    setBusy(false);
  }
  return (
    <form className="login form" onSubmit={submit}>
      <h1 style={{ fontSize: 'var(--step-2)' }}>Administration</h1>
      <div className="field"><label htmlFor="a-email">E-mail</label><input id="a-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
      <div className="field"><label htmlFor="a-pass">Mot de passe</label><input id="a-pass" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
      {error && <div className="alert alert--error" role="alert">{error}</div>}
      <button className="btn" disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</button>
    </form>
  );
}
