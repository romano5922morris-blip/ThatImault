-- Catégories de services initiales (offre du studio, modifiables depuis /admin). Aucun prix. Aucun projet ni avis fictif.
insert into public.services (title, slug, category, description, capabilities, display_order) values
('Développement web','developpement-web','Développement web','Sites et interfaces web conçus sur mesure, du site vitrine à l''application métier.',
 array['Sites vitrines','Sites professionnels multi-pages','Interfaces web','Formulaires et systèmes de réservation','Tableaux de bord','Intégrations backend'],1),
('Plugins et développement Minecraft','minecraft','Minecraft','Plugins Paper et projets Minecraft compatibles, du système de jeu à l''outil d''administration.',
 array['Plugins Paper et projets compatibles','Systèmes de gameplay personnalisés','Outils d''administration','Interfaces graphiques','Corrections de bugs et améliorations','Fonctionnalités spécifiques'],2),
('Applications et logiciels','applications-logiciels','Applications','Outils sur mesure qui font gagner du temps : applications web, utilitaires, automatisations.',
 array['Applications web','Outils personnalisés','Logiciels utilitaires','Interfaces et tableaux de bord','Automatisation de tâches'],3),
('Design graphique','design-graphique','Design graphique','Une identité visuelle claire et des visuels cohérents pour vos projets.',
 array['Logos','Identités visuelles','Bannières','Miniatures','Textures et éléments graphiques'],4),
('Montage vidéo et motion design','montage-motion','Vidéo et motion','Montage et animations graphiques pour donner du rythme à vos contenus.',
 array['Montage','Transitions','Habillages vidéo','Animations graphiques','Overlays'],5)
on conflict (slug) do nothing;

insert into public.site_settings (key, value) values
('site_title','ThatImault Studio'),
('seo_description','Studio de création numérique : sites web, plugins Minecraft, applications, design graphique et motion design, sur devis.'),
('hero_title','Des solutions numériques conçues sur mesure.'),
('hero_text','ThatImault Studio crée des sites web, des plugins Minecraft, des applications, des identités visuelles et des montages vidéo. Chaque projet est étudié et chiffré sur devis.'),
('contact_email',''),('contact_phone',''),('social_github',''),('social_discord',''),('social_youtube',''),
('social_x',''),('social_instagram',''),('response_time','')
on conflict (key) do nothing;
