import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { safeAuth } from "@/lib/auth-session";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await safeAuth();
  if (session?.user) redirect("/admin");
  return children;
}
