import type { AppLocale } from "@/api/lib/locale";
import { formatMerchPrice } from "@/lib/merch-format";
import { cn } from "@/lib/utils";

type Props = {
  price: number;
  discountedPrice: number | null;
  locale: AppLocale;
  as?: "p" | "div" | "span";
  className?: string;
  primaryClassName?: string;
  strikethroughClassName?: string;
};

export function MerchPrice({
  price,
  discountedPrice,
  locale,
  as: Tag = "p",
  className,
  primaryClassName,
  strikethroughClassName,
}: Props) {
  const { primary, strikethrough } = formatMerchPrice(
    price,
    discountedPrice,
    locale,
  );
  return (
    <Tag className={cn("flex items-baseline gap-2", className)}>
      {strikethrough ? (
        <span className={cn("line-through", strikethroughClassName)}>
          {strikethrough}
        </span>
      ) : null}
      <span className={primaryClassName}>{primary}</span>
    </Tag>
  );
}
