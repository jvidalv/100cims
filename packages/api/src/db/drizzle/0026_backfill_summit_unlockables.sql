-- Backfill "forcat" for users who have ever summited either Pollegó de Pedraforca
UPDATE "user" u
SET unlockables = array_append(u.unlockables, 'forcat')
WHERE NOT ('forcat' = ANY(u.unlockables))
  AND EXISTS (
    SELECT 1
    FROM summit_has_users shu
    INNER JOIN summit s ON s.id = shu.summit_id
    INNER JOIN mountain m ON m.id = s.mountain_id
    WHERE shu.user_id = u.id
      AND m.slug IN ('pollego-superior-pedraforca', 'pollego-inferior-pedraforca')
  );

--> statement-breakpoint
-- Backfill "picat" for users who have ever summited Pica d'Estats
UPDATE "user" u
SET unlockables = array_append(u.unlockables, 'picat')
WHERE NOT ('picat' = ANY(u.unlockables))
  AND EXISTS (
    SELECT 1
    FROM summit_has_users shu
    INNER JOIN summit s ON s.id = shu.summit_id
    INNER JOIN mountain m ON m.id = s.mountain_id
    WHERE shu.user_id = u.id
      AND m.slug = 'pica-destats'
  );
