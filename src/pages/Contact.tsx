import { useState, type FormEvent } from 'react';
import { Field, aria } from '../components/ui';
import { friendlyError, submitContact } from '../lib/api';
import { SOCIALS, useSettings } from '../lib/settings';
import { useSeo } from '../hooks/useSeo';
import { validateContact, type ContactInput, type Errors } from '../lib/validation';

export default function Contact() {
  useSeo('Contact', 'Contactez ThatImault Studio par formulaire, e-mail ou réseaux sociaux.');
  const s = useSettings();
  const [v, setV] = useState<ContactInput>({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<Errors<keyof ContactInput>>({});
  const [hp, setHp] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [serverError, setServerError] = useState('');
  const socials = SOCIALS.filter((x) => s[x.key]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validateContact(v); setErrors(errs); setServerError('');
    if (Object.keys(errs).length) { document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(); return; }
    setState('sending');
    try { await submitContact(v, hp); setState('done'); setV({ name: '', email: '', message: '' }); }
    catch (err) { setServerError(friendlyError(err)); setState('idle'); }
  }

  return (
    <>
      <div className="page-head"><div className="wrap"><h1>Contact</h1>{s.response_time && <p className="lede">{s.response_time}</p>}</div></div>
      <div className="wrap section detail-grid" style={{ paddingTop: 'var(--space-4)' }}>
        <div>
          {state === 'done' ? <div className="alert alert--ok" role="status"><strong>Message envoyé.</strong><p style={{ margin: 0 }}>Merci, il a bien été enregistré.</p></div> : (
            <form className="form" onSubmit={onSubmit} noValidate>
              <Field id="c-name" label="Nom" error={errors.name}><input id="c-name" value={v.name} autoComplete="name" onChange={(e) => setV({ ...v, name: e.target.value })} {...aria('c-name', errors.name)} /></Field>
              <Field id="c-email" label="Adresse e-mail" error={errors.email}><input id="c-email" type="email" value={v.email} autoComplete="email" onChange={(e) => setV({ ...v, email: e.target.value })} {...aria('c-email', errors.email)} /></Field>
              <Field id="c-msg" label="Message" error={errors.message}><textarea id="c-msg" value={v.message} maxLength={5000} onChange={(e) => setV({ ...v, message: e.target.value })} {...aria('c-msg', errors.message)} /></Field>
              <div className="hp" aria-hidden="true"><label>Ne pas remplir<input tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} /></label></div>
              {serverError && <div className="alert alert--error" role="alert">{serverError}</div>}
              <div><button className="btn" disabled={state === 'sending'}>{state === 'sending' ? 'Envoi en cours…' : 'Envoyer le message'}</button></div>
            </form>
          )}
        </div>
        {(s.contact_email || s.contact_phone || socials.length > 0) && (
          <aside>
            <h2 style={{ fontSize: 'var(--step-1)' }}>Autres moyens de contact</h2>
            <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.5rem' }}>
              {s.contact_email && <li><a href={`mailto:${s.contact_email}`}>{s.contact_email}</a></li>}
              {s.contact_phone && <li><a href={`tel:${s.contact_phone.replace(/\s/g, '')}`}>{s.contact_phone}</a></li>}
              {socials.map((x) => <li key={x.key}><a href={s[x.key]} target="_blank" rel="noopener noreferrer">{x.label}</a></li>)}
            </ul>
          </aside>
        )}
      </div>
    </>
  );
}
