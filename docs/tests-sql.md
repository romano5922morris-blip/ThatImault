# Tests de sécurité base de données (à exécuter sur votre projet Supabase)

Ces vérifications n'ont **pas** été exécutées dans l'environnement de génération (pas d'instance Supabase). À lancer dans le SQL editor après les migrations, puis cocher.

| # | Test | Résultat attendu |
|---|------|------------------|
| 1 | `set role anon; select * from quote_requests;` | erreur « permission denied » |
| 2 | `set role anon; select * from review_contacts;` | erreur « permission denied » |
| 3 | `set role anon; insert into reviews(rating,comment,public_name,moderation_status) values (5,'xxxxxxxxxxxx','Bob','published');` | erreur « permission denied » |
| 4 | `set role anon; update projects set title='x';` | erreur « permission denied » |
| 5 | `set role anon; select submit_review('{"rating":5,"comment":"Très bon travail !","public_name":"Bob"}');` | `{"status":"pending"}` ; la ligne a `moderation_status='pending'` |
| 6 | Appeler `submit_review` avec `"rating":9` | erreur (contrainte `rating between 1 and 5`) |
| 7 | `submit_quote` avec champ `website` non vide | erreur `invalid_request` |
| 8 | `submit_quote` sans `consent` | erreur `consent_required` |
| 9 | `submit_quote` 6 fois depuis la même IP en 1 h | 6e appel : `rate_limited` |
| 10 | Publier 2 avis (5 et 4), garder 1 avis `pending` ; `select review_stats();` | `count=2`, `average=4.5` |
| 11 | Connecté avec un utilisateur **non** présent dans `admins` : `update reviews set moderation_status='published'` | 0 ligne modifiée (RLS) |
| 12 | `set role anon; select * from reviews;` | uniquement les avis `published` |
