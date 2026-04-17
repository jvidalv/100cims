type Props = { data: Record<string, unknown> };

/**
 * Inline JSON-LD structured data. Must be emitted as <script type="application/ld+json">;
 * Next suppressHydrationWarning is safe here — the node has no client-side updates.
 */
export const JsonLd = ({ data }: Props) => (
  <script
    type="application/ld+json"
    suppressHydrationWarning
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
  />
);
