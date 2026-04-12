"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactPage() {
  const t = useTranslations("contact-page");
  const footer = useTranslations("footer");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!EMAIL_RE.test(email.trim())) {
      setError(t("error-email-invalid"));
      return;
    }
    if (!message.trim()) {
      setError(t("error-message-required"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          message: message.trim(),
        }),
      });
      if (!res.ok) throw new Error("request failed");
      setSent(true);
    } catch {
      setError(t("error-generic"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-16 sm:py-24 px-4">
        <div className="max-w-xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-black mb-2">
              {t("title")}
            </h1>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>

          {sent ? (
            <div className="rounded-xl border bg-muted/30 p-6 text-center space-y-2">
              <h2 className="text-xl font-bold">{t("success-title")}</h2>
              <p className="text-muted-foreground">{t("success-body")}</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="contact-name">{t("name-label")}</Label>
                <Input
                  id="contact-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("name-placeholder")}
                  maxLength={100}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="contact-email">{t("email-label")}</Label>
                <Input
                  id="contact-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("email-placeholder")}
                  maxLength={200}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="contact-message">{t("message-label")}</Label>
                <textarea
                  id="contact-message"
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t("message-placeholder")}
                  maxLength={4000}
                  rows={6}
                  className={cn(
                    "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-y",
                  )}
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button
                type="submit"
                size="lg"
                className="w-full font-bold"
                disabled={submitting}
              >
                {submitting ? t("submitting") : t("submit")}
              </Button>
            </form>
          )}
        </div>
      </main>

      <footer className="border-t py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Cims
          </Link>
          <div className="flex gap-6">
            <a
              href="/privacy-policy"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {footer("privacy-policy")}
            </a>
            <a
              href="/terms-of-service"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {footer("terms-of-service")}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
