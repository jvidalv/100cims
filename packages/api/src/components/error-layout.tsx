import type { ReactNode } from "react";

interface Props {
  eyebrow: string;
  title: string;
  body: string;
  actions: ReactNode;
  digest?: string;
}

export function ErrorLayout({ eyebrow, title, body, actions, digest }: Props) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_top,theme(colors.primary/0.15),transparent_60%),radial-gradient(ellipse_at_bottom,theme(colors.primary/0.08),transparent_55%)] bg-background px-6 py-16 text-center text-foreground">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/logo.png"
        alt="Cims, sempre amunt"
        width={72}
        height={72}
        className="mb-8 rounded-xl shadow-lg"
      />
      <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
        {eyebrow}
      </p>
      <h1 className="mb-5 max-w-2xl text-4xl font-black leading-tight sm:text-5xl">
        {title}
      </h1>
      <p className="mb-10 max-w-xl text-lg text-muted-foreground">{body}</p>
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        {actions}
      </div>
      {digest ? (
        <p className="mt-10 font-mono text-xs text-muted-foreground/70">
          Error ID: {digest}
        </p>
      ) : null}
    </main>
  );
}
