# ThatImault Studio

Site professionnel du studio : vitrine, services, réalisations, avis modérés, demandes de devis, contact et administration sécurisée.

**Stack** : React 18 + TypeScript + Vite · React Router · Supabase (PostgreSQL, Auth, Storage, Edge Functions) · Cloudflare Pages · Resend (e-mails, configurable).

## Prérequis
Node.js 20+, un projet Supabase, (optionnel) un compte Resend, un compte Cloudflare. [Supabase CLI](https://supabase.com/docs/guides/cli) pour les migrations et la fonction.

## Installation locale
```bash
npm install
cp .env.example .env     # renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
npm run dev
```
Sans `.env`, le site s'ouvre et affiche des états d'erreur explicites : il n'invente jamais de données.

## Base de données
```bash
supabase login
supabase link --project-ref VOTRE_REF
supabase db push          # applique supabase/migrations/0001 à 0004
```
Les migrations créent les tables, contraintes, index, politiques RLS, le bucket `project-images`, les fonctions publiques (`submit_quote`, `submit_review`, `submit_contact`, `review_stats`) et les 5 catégories de services. Aucun projet, avis ni statistique fictif n'est inséré.

## Créer le compte administrateur (sans mot de passe dans le code)
1. Supabase → Authentication → Users → **Add user** (e-mail + mot de passe fort choisi par vous). Activez la MFA si possible et désactivez les inscriptions publiques (Authentication → Providers → Email → *Disable sign ups*).
2. SQL editor : `insert into public.admins (user_id) select id from auth.users where email = 'votre@email';`
3. Connectez-vous sur `/admin`. Un utilisateur authentifié mais absent de `admins` est refusé, et les RLS bloquent ses écritures côté base.

## E-mails : les devis arrivent sur thatimaultstudio@gmail.com
Chaque demande de devis envoie un e-mail à `thatimaultstudio@gmail.com` (Reply-To = le client : répondre depuis Gmail lui écrit directement). Le client reçoit en plus un accusé de réception.

1. Créez un compte sur [resend.com](https://resend.com) **avec l'adresse thatimaultstudio@gmail.com** et générez une clé API.
2. Enregistrez-la **comme secret Supabase, jamais dans GitHub** :
```bash
supabase secrets set RESEND_API_KEY=re_xxxxx
supabase functions deploy notify
```
(ou Supabase → Edge Functions → Secrets). Sans autre réglage, l'expéditeur de test `onboarding@resend.dev` suffit pour recevoir les demandes sur votre Gmail.

3. **Accusé de réception au client** : tant que vous n'avez pas vérifié un domaine dans Resend, Resend refuse d'écrire à d'autres adresses que la vôtre. La demande est alors quand même enregistrée et vous recevez bien l'e-mail ; seul l'accusé client n'est pas envoyé. Pour l'activer, vérifiez votre domaine puis `supabase secrets set MAIL_FROM="ThatImault Studio <contact@votre-domaine>"`.

Autres secrets facultatifs : `ADMIN_NOTIFY_EMAIL` (change l'adresse de réception). Sans `RESEND_API_KEY`, aucun e-mail n'est envoyé et `notified_at` reste vide dans l'admin.

## Tests et vérifications
```bash
npm test          # validation, calcul de moyenne (Vitest)
npm run typecheck
npm run lint
npm run build
```
Les tests base de données sont décrits dans `docs/tests-sql.md` et sont à exécuter sur votre instance.

## Déploiement (Cloudflare Pages)
Build command `npm run build`, output `dist`, variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL`. `public/_redirects` gère le routage SPA. Pensez à remplacer `https://example.com` dans `public/robots.txt`.

## Logo et favicon
`public/logo-full.png` : logo fourni, inchangé. `public/logo.png` : recadrage horizontal du même fichier (en-tête). `public/favicon.png` : recadrage de la lettre T. Ces recadrages sont provisoires : remplacez-les par vos exports officiels si vous en avez. Ils ne sont pas modifiables depuis l'admin.

## Maintenance
- Archivage : une demande archivée reçoit `archive_after` (+24 mois). Purge à planifier : `delete from quote_requests where archive_after < current_date;`
- Les données de limitation de débit (`submission_log`) sont stockées sous forme de hash et purgées après 2 jours.
- Ne jamais committer `.env` ni la clé `service_role` (déjà ignorés par `.gitignore`).

## Limites actuelles
Pièces jointes de devis non implémentées (liens de référence uniquement). Sécurité et RLS à valider avec `docs/tests-sql.md`. Aucun test end-to-end navigateur automatisé.
