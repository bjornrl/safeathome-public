-- Applies the 36 successful entries from scripts/output/welfare-tech-image-manifest.json
-- to public.welfare_technologies.image_url. Run in the Supabase SQL editor
-- (or `supabase db execute` / psql) for project ditsssyrzjqdnhqxnffx.
update public.welfare_technologies as w
set image_url = v.image_url
from (values
  ('488d1610-b906-48fa-80b8-aa79705cb456', 'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/backfill/9solutions-488d1610.jpg'),
  ('67c9e1c1-ab27-4177-a964-dd83ae94d76a', 'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/backfill/abilia-67c9e1c1.webp'),
  ('45532310-fa20-4592-8f05-5bcfd03fb512', 'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/backfill/ably-medical-45532310.jpg'),
  ('52aefc17-14a7-40fb-b8ab-c319736c4616', 'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/backfill/addsecure-52aefc17.png'),
  ('10da1bbd-8727-4942-84b5-dff51e016c61', 'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/backfill/caretech-10da1bbd.jpg'),
  ('dcb79639-2421-4fc3-a1bd-44d7ca0b20e9', 'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/backfill/digirehab-dcb79639.png'),
  ('1e52c5f6-0b75-4fca-9cee-4302bf15219d', 'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/backfill/dignio-1e52c5f6.jpg'),
  ('f5e2ecc4-aca1-4533-aead-349d5946957f', 'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/backfill/doro-f5e2ecc4.jpg'),
  ('4712af3a-5e75-49f3-b86e-2c16c2371a7f', 'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/backfill/everon-global-4712af3a.jpg'),
  ('f5a4bdbd-a339-4e55-b1bd-f880102c5706', 'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/backfill/evondos-f5a4bdbd.jpg'),
  ('a56dccc5-4136-4def-94d3-071daf2a35ba', 'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/backfill/farseeing-a56dccc5.jpg'),
  ('da7a0bf2-690e-406b-948a-be04316c4dfe', 'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/backfill/guldmann-da7a0bf2.webp'),
  ('61eb2d65-64db-4714-890c-1a8926d2bd21', 'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/backfill/hemby-61eb2d65.jpg'),
  ('8fe16182-42a7-48eb-a0b1-00c1654bb851', 'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/backfill/hepro-8fe16182.jpg'),
  ('2e823d9a-dfa7-46d9-ab15-05e4c6150043', 'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/backfill/hjelpemiddelpartner-2e823d9a.jpg'),
  ('25007e75-7dd7-4e89-b073-7726261771b6', 'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/backfill/komp-25007e75.webp'),
  ('e08726d7-a666-4025-b45e-930fbd16879d', 'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/backfill/minifinder-e08726d7.jpg'),
  ('9db1c7e4-b106-4275-85b2-4e12ca0aacce', 'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/backfill/nattugla-9db1c7e4.webp'),
  ('a90a9945-5267-452f-9fc3-072fe09a6133', 'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/backfill/paro-a90a9945.jpg'),
  ('7ac29e94-185b-4567-9f33-fe99a8c67813', 'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/backfill/phoniro-7ac29e94.jpg'),
  ('fdc19658-5beb-4aed-95ea-eec1648b99d1', 'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/backfill/picomed-fdc19658.png'),
  ('7d3db16d-b881-4c05-8d08-f246e9331224', 'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/backfill/pilloxa-7d3db16d.png'),
  ('f5d8531d-9ea6-4df7-ab3b-50d8c47f3f3a', 'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/backfill/securitas-technology-f5d8531d.png'),
  ('b63b5c88-522d-48d1-bf24-771998967fe6', 'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/backfill/sensio-b63b5c88.png'),
  ('7c3266cb-2a0c-4364-a3b3-9a5c9c0bd226', 'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/backfill/sensorem-7c3266cb.png'),
  ('08d9b599-0447-489a-9805-722b56c2d743', 'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/backfill/stella-care-08d9b599.png'),
  ('ec49224a-2c09-4730-a94b-eb84b4842654', 'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/backfill/suvanto-care-ec49224a.png'),
  ('2c7c6715-1d31-498f-83b5-46eac2badd7c', 'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/backfill/tellu-2c7c6715.webp'),
  ('8952af4f-198e-47dc-9260-aa9ba00d9512', 'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/backfill/tessa-8952af4f.png'),
  ('d0717e04-472f-4673-861d-6dac3a26bae7', 'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/backfill/teton-ai-d0717e04.png'),
  ('a500f2a0-ac2b-4e99-84a1-8b80b587260a', 'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/backfill/tunstall-a500f2a0.jpg'),
  ('33ec27b7-ad77-4e5d-8e8c-9b32b2ca2477', 'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/backfill/varodd-velferdsteknologi-33ec27b7.jpg'),
  ('7b1b805f-7912-4640-955b-39acc787853e', 'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/backfill/vivago-7b1b805f.jpg'),
  ('d4b199de-2f53-420c-8f80-83ad67a85e6b', 'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/backfill/wear-and-care-d4b199de.png'),
  ('70b582e4-af10-4664-98c8-e633ea04bf35', 'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/backfill/yeticare-70b582e4.jpg'),
  ('e0bb19f1-3218-44aa-9775-087d11d1eee1', 'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/backfill/zembro-e0bb19f1.png')
) as v(id, image_url)
where w.id = v.id::uuid
returning w.id, w.title, w.image_url;
