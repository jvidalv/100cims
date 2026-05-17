-- Custom SQL migration file, put your code below! --
INSERT INTO "user" (
  "username",
  "email",
  "firstName",
  "imageUrl",
  "town",
  "admin",
  "visibleOnHiscores",
  "visibleOnPeopleSearch"
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
ON CONFLICT ("email") DO NOTHING;
