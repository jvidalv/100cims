"use client";

import { Monitor, RefreshCw, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FieldDef =
  | { type: "text"; default: string }
  | { type: "select"; default: string; options: readonly string[] };

type Props = {
  slug: string;
  locale: string;
  locales: readonly string[];
  fields: Record<string, FieldDef>;
  propValues: Record<string, string>;
  html: string;
};

const LOCALE_FLAGS: Record<string, string> = {
  en: "🇬🇧",
  ca: "😾",
  es: "🇪🇸",
};

const WIDTHS = {
  desktop: { px: 640, icon: Monitor },
  mobile: { px: 375, icon: Smartphone },
} as const;

type Width = keyof typeof WIDTHS;

export function EmailPreviewClient({
  slug,
  locale,
  locales,
  fields,
  propValues,
  html,
}: Props) {
  const router = useRouter();
  const [width, setWidth] = useState<Width>("desktop");
  const [draft, setDraft] = useState(propValues);

  const navigate = (
    nextLocale: string,
    overrides: Partial<Record<string, string>> = {},
  ) => {
    const params = new URLSearchParams({ locale: nextLocale });
    for (const [k, v] of Object.entries({ ...draft, ...overrides })) {
      if (v !== undefined && v !== "") params.set(k, v);
    }
    router.push(`/admin/emails/${slug}?${params.toString()}`);
  };

  const apply = (overrides: Partial<Record<string, string>> = {}) =>
    navigate(locale, overrides);
  const setLocale = (next: string) => navigate(next);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4 border rounded p-4 bg-muted/30">
        <div className="space-y-1">
          <Label>Locale</Label>
          <Select value={locale} onValueChange={setLocale}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {locales.map((l) => (
                <SelectItem key={l} value={l}>
                  <span className="mr-2">{LOCALE_FLAGS[l] ?? ""}</span>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {Object.entries(fields).map(([name, def]) => (
          <div key={name} className="space-y-1">
            <Label className="capitalize">{name}</Label>
            {def.type === "text" ? (
              <Input
                value={draft[name] ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, [name]: e.target.value }))
                }
                onBlur={() => apply()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") apply();
                }}
                className="w-[220px]"
                placeholder={def.default}
              />
            ) : (
              <Select
                value={draft[name] ?? def.default}
                onValueChange={(v) => {
                  setDraft((d) => ({ ...d, [name]: v }));
                  apply({ [name]: v });
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {def.options.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ))}

        <div className="ml-auto inline-flex rounded border bg-background">
          {(Object.keys(WIDTHS) as Width[]).map((w) => {
            const Icon = WIDTHS[w].icon;
            return (
              <button
                key={w}
                type="button"
                title={`${w} (${WIDTHS[w].px}px)`}
                onClick={() => setWidth(w)}
                className={`px-3 py-2 ${
                  width === w
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <Icon className="size-4" />
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => router.refresh()}
          title="Refresh"
        >
          <RefreshCw className="size-4" />
        </Button>
      </div>

      <div className="flex justify-center bg-slate-100 dark:bg-slate-900 rounded p-6 min-h-[600px]">
        <iframe
          srcDoc={html}
          title="Email preview"
          style={{
            width: WIDTHS[width].px,
            height: "80vh",
            border: "1px solid hsl(var(--border, 0 0% 89%))",
            borderRadius: 8,
            background: "white",
          }}
          sandbox=""
        />
      </div>
    </div>
  );
}
