import { Star } from "lucide-react-native";
import { useIntl } from "react-intl";

import { Colors } from "@/constants/colors";

/**
 * Filled gold star used wherever the app shows a "featured" affordance —
 * plan list rows, plan-detail header, calendar grid. Centralised so the
 * tint stays in lockstep with `Colors.featured` and the size convention
 * stays consistent across surfaces.
 *
 * The star renders the brand-fixed amber tint regardless of theme: a "gold
 * star" reads as gold in both light and dark mode, and the contrast against
 * either background is already adequate at the design level. Both
 * `Colors.light.featured` and `Colors.dark.featured` are the same `#f59e0b`
 * for this reason — keep them in sync if you ever touch one.
 *
 * Renders `<Star>` directly (not via `LucideIcon`) so the theme-aware tint
 * resolution and `useColorScheme()` subscription don't fire on every render
 * just to be thrown away.
 */
export const FeaturedStar = ({ size = 16 }: { size?: number }) => {
  const intl = useIntl();
  const label = intl.formatMessage({ defaultMessage: "Featured" });
  return (
    <Star
      size={size}
      color={Colors.light.featured}
      fill={Colors.light.featured}
      accessibilityLabel={label}
    />
  );
};
