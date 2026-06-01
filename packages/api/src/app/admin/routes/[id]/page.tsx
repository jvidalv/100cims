"use client";

import { useParams } from "next/navigation";

import { useAdminRouteDetail } from "@/domains/admin/api";

export default function AdminRouteDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, error, isLoading } = useAdminRouteDetail(params.id);

  if (isLoading)
    return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (error) return <div className="p-8 text-red-600">{error.message}</div>;
  if (!data) return <div className="p-8 text-muted-foreground">Not found.</div>;

  return (
    <div className="p-8 max-w-4xl">
      <a
        href="/admin/routes"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Back to routes
      </a>
      <h1 className="text-2xl font-bold mt-2 mb-1">{data.title.en}</h1>
      <p className="text-muted-foreground mb-6">{data.titleRaw}</p>

      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <Field label="Source" value={data.source ?? "—"} mono />
        <Field label="External id" value={data.externalId} mono />
        <Field
          label="Distance"
          value={
            data.distanceMeters != null
              ? `${(data.distanceMeters / 1000).toFixed(1)} km`
              : "—"
          }
        />
        <Field
          label="Elevation gain"
          value={
            data.elevationGainMeters != null
              ? `${data.elevationGainMeters} m`
              : "—"
          }
        />
        <Field label="Trail type" value={data.trailType ?? "—"} />
        <Field
          label="Technical difficulty"
          value={data.technicalDifficulty ?? "—"}
        />
        <Field label="Author" value={data.author ?? "—"} />
        <Field label="Uploaded at" value={fmtDate(data.uploadedAt)} />
        <Field label="Recorded at" value={fmtDate(data.recordedAt)} />
        <Field
          label="Coordinates"
          value={
            data.coordinates
              ? `${data.coordinates.length} of ${data.coordinatesCount ?? "?"}`
              : "—"
          }
        />
      </div>

      <h2 className="text-lg font-semibold mt-6 mb-2">Summited mountains</h2>
      <div className="flex flex-wrap gap-2 mb-6">
        {data.mountains.length === 0 && (
          <span className="text-muted-foreground text-sm">none</span>
        )}
        {data.mountains.map((m) => (
          <a
            key={m.slug}
            href={`/admin/mountains/${m.id}`}
            className="inline-flex items-center gap-2 rounded border bg-muted/40 px-2 py-1 text-sm hover:bg-muted"
          >
            <span className="font-medium">{m.name}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {m.slug}
            </span>
            <span className="text-xs text-muted-foreground">{m.height}m</span>
          </a>
        ))}
      </div>

      <h2 className="text-lg font-semibold mt-6 mb-2">Title (localized)</h2>
      <LocalizedBlock value={data.title} />

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Description (localized)
      </h2>
      {data.description ? (
        <LocalizedBlock value={data.description} />
      ) : (
        <p className="text-muted-foreground text-sm">No description yet.</p>
      )}

      <h2 className="text-lg font-semibold mt-6 mb-2">Source URL</h2>
      <a
        href={data.url}
        target="_blank"
        rel="noreferrer"
        className="text-sky-600 hover:underline text-sm break-all"
      >
        {data.url}
      </a>

      <h2 className="text-lg font-semibold mt-6 mb-2">Raw description</h2>
      <pre className="bg-muted/40 p-3 rounded text-xs whitespace-pre-wrap">
        {data.descriptionRaw ?? "—"}
      </pre>
    </div>
  );
}

// Eden Treaty auto-decodes any ISO-8601-shaped string into a Date object on
// the client, even though the schema declares t.String(). Coerce back to a
// string at the render boundary so React doesn't see a Date child.
function fmtDate(value: string | Date | null): string {
  if (value == null) return "—";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value;
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={mono ? "font-mono text-sm" : "text-sm"}>{value}</div>
    </div>
  );
}

function LocalizedBlock({
  value,
}: {
  value: { en: string; ca: string; es: string };
}) {
  return (
    <div className="space-y-2 text-sm">
      {(["en", "ca", "es"] as const).map((lang) => (
        <div key={lang}>
          <span className="font-mono text-xs text-muted-foreground uppercase">
            {lang}
          </span>
          <p className="whitespace-pre-wrap">{value[lang]}</p>
        </div>
      ))}
    </div>
  );
}
