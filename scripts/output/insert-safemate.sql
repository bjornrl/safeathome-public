-- Adds "Safemate" (Sensio AS) as a new welfare_technologies initiative.
-- Image already uploaded to Storage: welfare-tech-images/safemate-cb2f8e9f.webp
-- Run in the Supabase SQL editor (or psql/CLI) for project ditsssyrzjqdnhqxnffx.
insert into public.welfare_technologies
  (id, title, description, category, tags, url, image_url, manufacturer, country_availability, published)
values (
  'cb2f8e9f-c635-4611-9828-4bb20ce2bc87',
  'Safemate',
  'Mobil trygghetsalarm og lokaliseringsteknologi fra Sensio, rettet mot eldre og personer med helseutfordringer i kommunal hjemmetjeneste. Fungerer overalt med mobildekning og lar brukeren tilkalle hjelp i nødsituasjoner både i og utenfor boligen, via alarmknapp, GPS-sporing og toveis tale. Administreres gjennom Safemate Pro-portalen, og har over 19 000 enheter i bruk i nærmere 200 norske kommuner.',
  'Trygghet i hjemmet',
  array['trygghetsalarm','lokalisering','GPS','digitalt tilsyn'],
  'https://www.sensio.com/no/produkter/safemate',
  'https://ditsssyrzjqdnhqxnffx.supabase.co/storage/v1/object/public/welfare-tech-images/safemate-cb2f8e9f.webp',
  'Sensio AS',
  array['Norge'],
  true
)
returning id, title, url, image_url, published;
