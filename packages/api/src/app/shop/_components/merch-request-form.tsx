"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

const SIZES = ["S", "M", "L", "XL"] as const;
type Size = (typeof SIZES)[number];

interface Props {
  productName: string;
  hasSize: boolean;
}

type Status = "idle" | "submitting" | "success" | "error";

export const MerchRequestForm = ({ productName, hasSize }: Props) => {
  const t = useTranslations("shop-page");
  const [email, setEmail] = useState("");
  const [size, setSize] = useState<Size | null>(null);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError(t("email-required"));
      return;
    }
    if (hasSize && !size) {
      setError(t("size-required"));
      return;
    }

    setStatus("submitting");

    const sizeSuffix = size ? ` (Size: ${size})` : "";
    const message = `[MERCH REQUEST] ${productName}${sizeSuffix}${
      note.trim() ? `\n${note.trim()}` : ""
    }`;

    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), message }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("success");
    } catch {
      setStatus("error");
      setError(t("error-generic"));
    }
  };

  if (status === "success") {
    return (
      <div className="p-6 rounded-xl border bg-primary/5">
        <h3 className="text-xl font-bold mb-2 text-primary">
          {t("success-title")}
        </h3>
        <p className="text-muted-foreground">{t("success-body")}</p>
      </div>
    );
  }

  const submitting = status === "submitting";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {hasSize ? (
        <div>
          <label className="block text-sm font-semibold mb-2">
            {t("size-label")}
          </label>
          <div className="flex gap-2">
            {SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={`px-4 py-2 rounded-lg border font-bold transition-colors ${
                  size === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:border-primary"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <label htmlFor="merch-email" className="block text-sm font-semibold mb-2">
          {t("email-label")}
        </label>
        <input
          id="merch-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("email-placeholder")}
          className="w-full px-4 py-2 rounded-lg border bg-background"
        />
      </div>

      <div>
        <label htmlFor="merch-note" className="block text-sm font-semibold mb-2">
          {t("note-label")}
        </label>
        <textarea
          id="merch-note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("note-placeholder")}
          className="w-full px-4 py-2 rounded-lg border bg-background"
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" size="lg" disabled={submitting} className="font-bold">
        {submitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
};
