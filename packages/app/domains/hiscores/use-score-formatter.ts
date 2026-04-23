import { useCallback, useMemo } from "react";
import { useIntl } from "react-intl";

export function useScoreFormatter() {
  const intl = useIntl();
  const scoreFormatter = useMemo(
    () => Intl.NumberFormat(intl.locale, { maximumFractionDigits: 2 }),
    [intl.locale],
  );
  return useCallback(
    (score: number) => scoreFormatter.format(score),
    [scoreFormatter],
  );
}
