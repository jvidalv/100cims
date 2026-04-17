import Link from "next/link";

import { ErrorLayout } from "@/components/error-layout";
import { Button } from "@/components/ui/button";

export default function RootNotFound() {
  return (
    <ErrorLayout
      eyebrow="404 · Lost up here"
      title="This peak isn't on our map"
      body="The page you were looking for doesn't exist or has moved. Let's get you back to solid ground."
      actions={
        <>
          <Button asChild size="lg" className="font-bold">
            <Link href="/">Back to home</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="font-bold">
            <Link href="/challenges">Browse challenges</Link>
          </Button>
        </>
      }
    />
  );
}
