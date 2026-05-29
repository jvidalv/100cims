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
 *
 * `decorative={true}` opts out of the default "Featured" accessibilityLabel —
 * use it on the calendar grid where the day number + event-type dots already
 * carry the semantic content and an extra per-day "Featured" announcement
 * would be noise.
 */
type Props = {
  size?: number;
  decorative?: boolean;
};

export const FeaturedStar = ({ size = 16, decorative = false }: Props) => {
  const intl = useIntl();
  if (decorative) {
    return (
      <Star
        size={size}
        color={Colors.light.featured}
        fill={Colors.light.featured}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
    );
  }
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
