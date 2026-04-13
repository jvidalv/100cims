"use client";

import {
  Camera,
  Clock,
  Compass,
  Home,
  LogOut,
  Mountain,
  ShoppingBag,
  Trophy,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useMe } from "@/domains/user/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: Home },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/mountains", label: "Mountains", icon: Mountain },
  { href: "/admin/challenges", label: "Challenges", icon: Trophy },
  { href: "/admin/summits", label: "Summits", icon: Camera },
  { href: "/admin/plans", label: "Plans", icon: Compass },
  { href: "/admin/merch", label: "Merch", icon: ShoppingBag },
  { href: "/admin/crons", label: "Crons", icon: Clock },
];

export function AdminSidebar({
  fallbackEmail,
  fallbackImage,
  signOutAction,
}: {
  fallbackEmail: string;
  fallbackImage?: string | null;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const { data: me } = useMe();

  const name = [me?.firstName, me?.lastName].filter(Boolean).join(" ");
  const email = me?.email ?? fallbackEmail;
  const displayName = name || email;
  const avatar = me?.imageUrl ?? fallbackImage ?? undefined;
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link href="/admin" className="flex items-center px-2 py-1">
          <Image
            src="/assets/icon.png"
            alt="100cims"
            width={28}
            height={28}
            className="rounded-md shrink-0"
          />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href));
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar className="size-8">
                    {avatar && <AvatarImage src={avatar} alt={displayName} />}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">
                      {displayName}
                    </span>
                    {name && (
                      <span className="truncate text-xs text-muted-foreground">
                        {email}
                      </span>
                    )}
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                className="w-[--radix-popper-anchor-width]"
              >
                <form action={signOutAction}>
                  <DropdownMenuItem asChild>
                    <button type="submit" className="w-full cursor-pointer">
                      <LogOut className="size-4" />
                      <span>Sign out</span>
                    </button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
