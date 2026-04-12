import { redirect } from "next/navigation";

import { signOut } from "@/auth";
import { AdminSidebar } from "@/components/admin-sidebar";
import { QueryClientProvider } from "@/components/providers/query-client-provider";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { safeAuth } from "@/lib/auth-session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await safeAuth();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (!session.user.admin) redirect("/login?error=AccessDenied");

  const signOutAction = async () => {
    "use server";
    await signOut({ redirectTo: "/login" });
  };

  return (
    <QueryClientProvider>
      <SidebarProvider>
        <AdminSidebar
          fallbackEmail={session.user.email ?? ""}
          fallbackImage={session.user.image}
          signOutAction={signOutAction}
        />
        <SidebarInset className="min-w-0">
          <header className="flex h-12 items-center gap-2 border-b px-4">
            <SidebarTrigger />
          </header>
          <div className="flex-1 overflow-auto">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </QueryClientProvider>
  );
}
