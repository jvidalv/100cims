-- Custom SQL migration file, put your code below! --
INSERT INTO "user" (
  username,
  email,
  first_name,
  image_url,
  town,
  admin,
  visible_on_hiscores,
  visible_on_people_search
)
VALUES (
  'cims',
  'hola@fescims.com',
  'Cims',
  'https://fescims.com/assets/cims-avatar.png',
  'Usuari oficial de Cims',
  false,
  false,
  false
)
ON CONFLICT (email) DO NOTHING;
