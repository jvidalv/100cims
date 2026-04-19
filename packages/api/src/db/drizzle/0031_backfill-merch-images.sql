-- Realign merch + merch_variant image_urls to the current authoritative set.
-- Prod rows held URLs from the pre-variants era (or orphan re-uploads); this
-- pins the same URLs local has been serving for weeks.

UPDATE merch
SET image_urls = ARRAY['https://dg49c3nlr5rbl.cloudfront.net/100cims/merch/09046070-a0c9-48cc-8f32-00ad41ae5f6f/ce88d462-cb57-40eb-b4aa-bb5ae2c3b40b.jpeg']
WHERE slug = 'cap';
--> statement-breakpoint

UPDATE merch
SET image_urls = ARRAY['https://dg49c3nlr5rbl.cloudfront.net/100cims/merch/ca37ef37-7603-467f-8c59-28a0e3e4438d/6c45f786-4d59-488d-a2ff-ee58490a4a50.jpeg']
WHERE slug = 'mug';
--> statement-breakpoint

UPDATE merch
SET image_urls = ARRAY['https://dg49c3nlr5rbl.cloudfront.net/100cims/merch/068c8262-7328-44d3-8f63-1d1d31fed76d/black/cef3cb0d-f727-42bc-8525-e42a30c968ec.jpeg']
WHERE slug = 'shirt';
--> statement-breakpoint

UPDATE merch_variant mv
SET image_urls = ARRAY['https://dg49c3nlr5rbl.cloudfront.net/100cims/merch/068c8262-7328-44d3-8f63-1d1d31fed76d/black/cef3cb0d-f727-42bc-8525-e42a30c968ec.jpeg']
FROM merch m
WHERE mv.merch_id = m.id AND m.slug = 'shirt' AND mv.color = 'black';
--> statement-breakpoint

UPDATE merch_variant mv
SET image_urls = ARRAY['https://dg49c3nlr5rbl.cloudfront.net/100cims/merch/068c8262-7328-44d3-8f63-1d1d31fed76d/white/d1832929-52ac-453d-815a-bcd8713344d0.jpeg']
FROM merch m
WHERE mv.merch_id = m.id AND m.slug = 'shirt' AND mv.color = 'white';
