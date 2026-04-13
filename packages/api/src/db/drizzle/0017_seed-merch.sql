INSERT INTO "merch" (slug, name_en, name_ca, name_es, price, has_size, featured, image_urls, active)
VALUES
  (
    'white-shirt', 'White T-Shirt', 'Samarreta blanca', 'Camiseta blanca', 45, true,  1,
    ARRAY[
      'https://dg49c3nlr5rbl.cloudfront.net/100cims/merch/ca86653f-8623-480d-9911-82a34c0bff83/019d8665-31a3-756c-9081-7efe24bf1fae.jpeg',
      'https://dg49c3nlr5rbl.cloudfront.net/100cims/merch/ca86653f-8623-480d-9911-82a34c0bff83/019d8665-31aa-76fd-a8f3-25e1290cfb2a.jpeg'
    ],
    true
  ),
  (
    'black-shirt', 'Black T-Shirt', 'Samarreta negra', 'Camiseta negra', 45, true,  2,
    ARRAY['https://dg49c3nlr5rbl.cloudfront.net/100cims/merch/2bec202c-1f59-42c7-9fae-807514982f74/019d8665-6199-7e9e-b754-106642777110.jpeg'],
    true
  ),
  (
    'black-mug', 'Black Mug', 'Tassa negra', 'Taza negra', 20, false, 3,
    ARRAY['https://dg49c3nlr5rbl.cloudfront.net/100cims/merch/24283587-d314-4d4a-a79c-8f555f4df0bd/019d8665-b0cd-77ff-bd1b-90cbd678e60b.jpeg'],
    true
  ),
  (
    'black-cap', 'Black Cap', 'Gorra negra', 'Gorra negra', 30, false, 4,
    ARRAY['https://dg49c3nlr5rbl.cloudfront.net/100cims/merch/e5d68052-4c7a-437a-9d12-699b7a18ddbb/019d8665-d966-7c0c-b92f-0b4f0a3f4798.jpeg'],
    true
  ),
  (
    'black-buff', 'Black Buff', 'Buff negre', 'Buff negro', 30, false, 5,
    ARRAY['https://dg49c3nlr5rbl.cloudfront.net/100cims/merch/6b531bba-6a76-4803-ab1d-49ed8543d854/019d8665-fd11-7804-a7f7-059432fdd35e.jpeg'],
    true
  )
ON CONFLICT (slug) DO NOTHING;
