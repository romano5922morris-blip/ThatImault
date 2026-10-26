// Fonction serveur : e-mails transactionnels pour une demande de devis (Resend).
// Secrets requis (supabase secrets set ...) : RESEND_API_KEY, MAIL_FROM, ADMIN_NOTIFY_EMAIL
// SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis automatiquement par Supabase.
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

const layout = (title: string, body: string) => `<!doctype html><html lang="fr"><body style="margin:0;background:#faf9f7;font-family:Arial,sans-serif;color:#111">
<div style="max-width:560px;margin:0 auto;padding:24px"><div style="background:#fff;border:1px solid #eae7e4;padding:28px">
<p style="font:600 22px Georgia,serif;margin:0 0 4px">ThatImault Studio</p><div style="height:2px;background:#f29a82;margin:12px 0 20px"></div>
<h1 style="font:500 20px Georgia,serif;margin:0 0 16px">${esc(title)}</h1>${body}</div></div></body></html>`;

async function send(to: string, subject: string, html: string, replyTo?: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: Deno.env.get('MAIL_FROM'), to, subject, html, reply_to: replyTo }),
  });
  if (!res.ok) throw new Error(`mail_provider_${res.status}`);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const env = Deno.env.toObject();
  const RESEND_API_KEY = env.RESEND_API_KEY;
  // Adresse de réception des demandes (non secrète). Surchargeable via le secret ADMIN_NOTIFY_EMAIL.
  const ADMIN_NOTIFY_EMAIL = env.ADMIN_NOTIFY_EMAIL || 'thatimaultstudio@gmail.com';
  // Sans domaine vérifié chez Resend, l'expéditeur de test ci-dessous ne peut écrire qu'au propriétaire du compte Resend.
  const MAIL_FROM = env.MAIL_FROM || 'ThatImault Studio <onboarding@resend.dev>';
  if (!RESEND_API_KEY) return json({ sent: false, reason: 'not_configured' }, 503);

  let reference = '';
  try { reference = String((await req.json()).reference ?? ''); } catch { return json({ error: 'bad_request' }, 400); }
  if (!/^TIS-\d{6}-[A-F0-9]{6}$/.test(reference)) return json({ error: 'bad_request' }, 400);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  // Idempotence : une demande n'est notifiée qu'une fois (notified_at), ce qui borne les abus de cette route.
  const { data: q } = await admin.from('quote_requests').select('*').eq('reference', reference).is('notified_at', null).maybeSingle();
  if (!q) return json({ sent: false, reason: 'already_notified_or_unknown' });

  try {
    // 1) Notification à l'équipe : obligatoire. Reply-To = client, pour répondre directement depuis Gmail.
    await send(ADMIN_NOTIFY_EMAIL, `Nouveau devis ${q.reference} : ${q.project_title}`, layout('Nouvelle demande de devis',
      `<p><strong>${esc(q.name)}</strong> (${esc(q.email)})<br>${esc(q.service_category)}</p><p><strong>${esc(q.project_title)}</strong></p><p style="white-space:pre-wrap">${esc(q.description)}</p><p>Budget : ${esc(q.budget_range ?? 'non précisé')}<br>Délai : ${esc(q.desired_deadline ?? 'non précisé')}<br>Référence : ${esc(q.reference)}</p>`), q.email);
    await admin.from('quote_requests').update({ notified_at: new Date().toISOString() }).eq('id', q.id);
    // 2) Confirmation au client : facultative. Échoue sans bloquer tant que le domaine d'envoi n'est pas vérifié.
    let confirmation = true;
    try {
      await send(q.email, `Demande ${q.reference} bien reçue`, layout('Votre demande est bien reçue',
        `<p>Bonjour ${esc(q.name)},</p><p>Nous avons bien reçu votre demande « ${esc(q.project_title)} ». Référence : <strong>${esc(q.reference)}</strong>.</p><p>Nous revenons vers vous avec une proposition personnalisée.</p>`));
    } catch { confirmation = false; }
    return json({ sent: true, confirmation });
  } catch (e) {
    console.error('notify failed', (e as Error).message); // pas de données personnelles dans les logs
    return json({ sent: false, reason: 'provider_error' }, 502);
  }
});
