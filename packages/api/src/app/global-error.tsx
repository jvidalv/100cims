"use client";

import { useEffect } from "react";

import { ErrorLayout } from "@/components/error-layout";
import { Button } from "@/components/ui/button";

import "./globals.css";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <ErrorLayout
          eyebrow="500 · We slipped"
          title="Something broke on our side"
          body="An unexpected error came up. We've logged it and we'll take a look."
          digest={error.digest}
          actions={
            <Button
              type="button"
              size="lg"
              className="font-bold"
              onClick={reset}
            >
              Try again
            </Button>
          }
        />
      </body>
    </html>
  );
}
