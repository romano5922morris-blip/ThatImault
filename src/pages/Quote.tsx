import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Field, aria } from '../components/ui';
import { friendlyError, getServices, submitQuote } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { useSeo } from '../hooks/useSeo';
import { validateQuote, type Errors, type QuoteInput } from '../lib/validation';

const EMPTY: QuoteInput = { name: '', email: '', service_category: '', project_title: '', description: '', budget_range: '', desired_deadline: '', reference_links: '', consent: false };
const STEPS = ['Vos coordonnées', 'Votre projet', 'Détails'];
const FIELDS: (keyof QuoteInput)[][] = [['name', 'email'], ['service_category', 'project_title', 'description'], ['reference_links', 'consent']];

export default function Quote() {
  useSeo('Demander un devis', 'Décrivez votre projet et recevez un devis personnalisé de ThatImault Studio.');
  const [params] = useSearchParams();
  const services = useAsync(getServices, []);
  const [v, setV] = useState<QuoteInput>(() => ({ ...EMPTY, project_title: params.get('similar') ? `Projet similaire à « ${params.get('similar')} »` : '' }));
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors<keyof QuoteInput>>({});
  const [hp, setHp] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [reference, setReference] = useState('');
  const [serverError, setServerError] = useState('');
  const head = useRef<HTMLHeadingElement>(null);
  const set = <K extends keyof QuoteInput>(k: K, val: QuoteInput[K]) => setV((p) => ({ ...p, [k]: val }));

  useEffect(() => {
    const slug = params.get('service');
    const found = services.data?.find((s) => s.slug === slug);
    if (found) setV((p) => (p.service_category ? p : { ...p, service_category: found.category || found.title }));
  }, [services.data, params]);
  useEffect(() => { head.current?.focus(); }, [step, state]);

  const options = [...new Set((services.data ?? []).map((s) => s.category || s.title))];

  function next() {
    const all = validateQuote(v);
    const mine = Object.fromEntries(Object.entries(all).filter(([k]) => FIELDS[step].includes(k as keyof QuoteInput)));
    setErrors(mine);
    if (Object.keys(mine).length) { document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(); return; }
    setStep(step + 1);
  }
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (step < 2) return next();
    const errs = validateQuote(v); setServerError('');
    if (Object.keys(errs).length) {
      setErrors(errs);
      const first = FIELDS.findIndex((f) => f.some((k) => errs[k]));
      if (first < 2) setStep(first);
      return;
    }
    setState('sending');
    try { setReference(await submitQuote(v, hp)); setState('done'); }
    catch (err) { setServerError(friendlyError(err)); setState('idle'); }
  }

  if (state === 'done') {
    return (
      <div className="wrap section">
        <h1 ref={head} tabIndex={-1} style={{ fontSize: 'var(--step-3)' }}>Demande envoyée</h1>
        <div className="alert alert--ok" role="status" style={{ maxWidth: 640 }}>
          <p>Votre demande est enregistrée sous la référence <strong>{reference}</strong>. Conservez-la pour tout échange avec le studio.</p>
          <p>Vous serez recontacté à l’adresse {v.email}.</p>
          <p style={{ margin: 0 }}><strong>{v.project_title}</strong><br /><span className="muted" style={{ whiteSpace: 'pre-wrap' }}>{v.description}</span></p>
        </div>
        <div className="actions" style={{ marginTop: 'var(--space-3)' }}><Link className="btn" to="/">Retour à l’accueil</Link></div>
      </div>
    );
  }

  return (
    <>
      <div className="page-head"><div className="wrap"><h1>Demander un devis</h1><p className="lede">Trois étapes courtes. Aucun prix n’est imposé : chaque devis est personnalisé.</p></div></div>
      <div className="wrap section" style={{ paddingTop: 'var(--space-4)' }}>
        <ol className="stepper" aria-label="Progression">{STEPS.map((s, i) => <li key={s} aria-current={i === step ? 'step' : undefined} data-done={i < step}>{i + 1}. {s}</li>)}</ol>
        <form className="form" onSubmit={onSubmit} noValidate>
          <h2 ref={head} tabIndex={-1} style={{ fontSize: 'var(--step-1)' }}>{STEPS[step]}</h2>
          {step === 0 && <>
            <Field id="q-name" label="Nom ou organisation" error={errors.name}><input id="q-name" value={v.name} autoComplete="organization" onChange={(e) => set('name', e.target.value)} {...aria('q-name', errors.name)} /></Field>
            <Field id="q-email" label="Adresse e-mail" error={errors.email}><input id="q-email" type="email" value={v.email} autoComplete="email" onChange={(e) => set('email', e.target.value)} {...aria('q-email', errors.email)} /></Field>
          </>}
          {step === 1 && <>
            <Field id="q-service" label="Type de prestation" error={errors.service_category}>
              <select id="q-service" value={v.service_category} onChange={(e) => set('service_category', e.target.value)} {...aria('q-service', errors.service_category)}>
                <option value="">Choisir…</option>{options.map((o) => <option key={o}>{o}</option>)}<option>Autre</option>
              </select>
            </Field>
            <Field id="q-title" label="Titre du projet" error={errors.project_title}><input id="q-title" value={v.project_title} maxLength={160} onChange={(e) => set('project_title', e.target.value)} {...aria('q-title', errors.project_title)} /></Field>
            <Field id="q-desc" label="Décrivez votre demande" hint={`Plus c’est précis, plus le devis sera juste : objectifs, fonctionnalités attendues, public visé, exemples que vous aimez. ${v.description.length}/5000 caractères.`} error={errors.description}><textarea id="q-desc" style={{ minHeight: 220 }} placeholder="Ex. : un site de 5 pages pour mon association, avec un formulaire de réservation et une page actualités…" value={v.description} maxLength={5000} onChange={(e) => set('description', e.target.value)} {...aria('q-desc', errors.description, 'h')} /></Field>
          </>}
          {step === 2 && <>
            <div className="row-2">
              <Field id="q-budget" label="Budget indicatif (facultatif)"><input id="q-budget" value={v.budget_range} maxLength={80} onChange={(e) => set('budget_range', e.target.value)} /></Field>
              <Field id="q-deadline" label="Délai souhaité (facultatif)"><input id="q-deadline" value={v.desired_deadline} maxLength={80} onChange={(e) => set('desired_deadline', e.target.value)} /></Field>
            </div>
            <Field id="q-links" label="Liens de référence (facultatif)" hint="Jusqu’à 5 liens, séparés par un espace ou un retour à la ligne." error={errors.reference_links}><textarea id="q-links" style={{ minHeight: 90 }} value={v.reference_links} onChange={(e) => set('reference_links', e.target.value)} {...aria('q-links', errors.reference_links, 'h')} /></Field>
            <div className="field" data-invalid={!!errors.consent}>
              <div className="check"><input id="q-consent" type="checkbox" checked={v.consent} onChange={(e) => set('consent', e.target.checked)} {...aria('q-consent', errors.consent)} />
                <label htmlFor="q-consent" style={{ fontWeight: 400 }}>J’accepte que mes informations soient utilisées pour traiter ma demande de devis et me recontacter. Elles ne sont pas partagées avec des tiers.</label></div>
              {errors.consent && <span className="error" id="q-consent-err">{errors.consent}</span>}
            </div>
            <div className="hp" aria-hidden="true"><label>Ne pas remplir<input tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} /></label></div>
          </>}
          {serverError && <div className="alert alert--error" role="alert">{serverError}</div>}
          <div className="actions">
            {step > 0 && <button type="button" className="btn btn--ghost" onClick={() => setStep(step - 1)}>Retour</button>}
            {step < 2 ? <button type="button" className="btn" onClick={next}>Continuer</button>
              : <button className="btn" disabled={state === 'sending'}>{state === 'sending' ? 'Envoi en cours…' : 'Envoyer la demande'}</button>}
          </div>
        </form>
      </div>
    </>
  );
}
