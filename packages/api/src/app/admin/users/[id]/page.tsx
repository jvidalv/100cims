"use client";

import Link from "next/link";
import { parseAsInteger, useQueryState } from "nuqs";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type AdminUserUpdateBody,
  useAdminUserDetail,
  useAdminUserSummits,
  useUpdateAdminUser,
} from "@/domains/admin/api";

type Form = {
  firstName: string;
  lastName: string;
  username: string;
  town: string;
  country: string;
  locale: string;
  visibleOnHiscores: boolean;
  visibleOnPeopleSearch: boolean;
  admin: boolean;
};

const emptyForm: Form = {
  firstName: "",
  lastName: "",
  username: "",
  town: "",
  country: "",
  locale: "",
  visibleOnHiscores: false,
  visibleOnPeopleSearch: true,
  admin: false,
};

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const detail = useAdminUserDetail(id);
  const update = useUpdateAdminUser(id);

  const [summitsPage, setSummitsPage] = useQueryState(
    "summitsPage",
    parseAsInteger.withDefault(1),
  );
  const summits = useAdminUserSummits(id, summitsPage);

  const [form, setForm] = useState<Form>(emptyForm);
  const [initial, setInitial] = useState<Form>(emptyForm);

  useEffect(() => {
    if (!detail.data || update.isPending) return;
    const next: Form = {
      firstName: detail.data.firstName ?? "",
      lastName: detail.data.lastName ?? "",
      username: detail.data.username ?? "",
      town: detail.data.town ?? "",
      country: detail.data.country ?? "",
      locale: detail.data.locale ?? "",
      visibleOnHiscores: detail.data.visibleOnHiscores,
      visibleOnPeopleSearch: detail.data.visibleOnPeopleSearch,
      admin: detail.data.admin,
    };
    setForm(next);
    setInitial(next);
  }, [detail.data, update.isPending]);

  const dirty = (Object.keys(form) as (keyof Form)[]).some(
    (k) => form[k] !== initial[k],
  );

  const onSave = () => {
    const body: AdminUserUpdateBody = {};
    if (form.firstName !== initial.firstName)
      body.firstName = form.firstName || null;
    if (form.lastName !== initial.lastName)
      body.lastName = form.lastName || null;
    if (form.username !== initial.username) body.username = form.username;
    if (form.town !== initial.town) body.town = form.town || null;
    if (form.country !== initial.country) body.country = form.country || null;
    if (form.locale !== initial.locale) body.locale = form.locale || null;
    if (form.visibleOnHiscores !== initial.visibleOnHiscores)
      body.visibleOnHiscores = form.visibleOnHiscores;
    if (form.visibleOnPeopleSearch !== initial.visibleOnPeopleSearch)
      body.visibleOnPeopleSearch = form.visibleOnPeopleSearch;
    if (form.admin !== initial.admin) body.admin = form.admin;

    update.mutate(body, {
      onSuccess: () => toast.success("Saved"),
      onError: (e) => toast.error(e.message),
    });
  };

  if (detail.isLoading && !detail.data) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (detail.error || !detail.data) {
    return (
      <div className="p-8 space-y-2">
        <Link
          href="/admin/users"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Users
        </Link>
        <p className="text-red-600">
          {detail.error?.message ?? "User not found"}
        </p>
      </div>
    );
  }

  const u = detail.data;
  const displayName =
    [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username;
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="p-8 space-y-8">
      <div className="space-y-1">
        <Link
          href="/admin/users"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Users
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <Avatar className="size-10">
            {u.imageUrl && <AvatarImage src={u.imageUrl} alt={displayName} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold leading-tight">{displayName}</h1>
            <p className="text-sm text-muted-foreground">{u.email}</p>
          </div>
        </div>
      </div>

      <section className="space-y-4 max-w-2xl">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Profile
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldText
            label="First name"
            value={form.firstName}
            onChange={(v) => setForm((p) => ({ ...p, firstName: v }))}
          />
          <FieldText
            label="Last name"
            value={form.lastName}
            onChange={(v) => setForm((p) => ({ ...p, lastName: v }))}
          />
          <FieldText
            label="Username"
            value={form.username}
            onChange={(v) => setForm((p) => ({ ...p, username: v }))}
          />
          <FieldText
            label="Town"
            value={form.town}
            onChange={(v) => setForm((p) => ({ ...p, town: v }))}
          />
          <FieldText
            label="Country (ISO code)"
            value={form.country}
            onChange={(v) => setForm((p) => ({ ...p, country: v }))}
            placeholder="ES"
          />
          <FieldText
            label="Locale"
            value={form.locale}
            onChange={(v) => setForm((p) => ({ ...p, locale: v }))}
            placeholder="ca-ES"
          />
        </div>

        <div className="flex flex-wrap gap-6">
          <FieldCheckbox
            label="Visible on hiscores"
            checked={form.visibleOnHiscores}
            onChange={(v) => setForm((p) => ({ ...p, visibleOnHiscores: v }))}
          />
          <FieldCheckbox
            label="Visible on people search"
            checked={form.visibleOnPeopleSearch}
            onChange={(v) =>
              setForm((p) => ({ ...p, visibleOnPeopleSearch: v }))
            }
          />
          <FieldCheckbox
            label="Admin"
            checked={form.admin}
            onChange={(v) => setForm((p) => ({ ...p, admin: v }))}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button disabled={!dirty || update.isPending} onClick={onSave}>
            {update.isPending ? "Saving…" : "Save"}
          </Button>
          {dirty && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setForm(initial)}
              disabled={update.isPending}
            >
              Reset
            </Button>
          )}
        </div>
      </section>

      <section className="space-y-3 max-w-2xl">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Device
        </h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Platform</dt>
          <dd>{u.platform ?? "—"}</dd>
          <dt className="text-muted-foreground">App version</dt>
          <dd className="font-mono">{u.appVersion ?? "—"}</dd>
          <dt className="text-muted-foreground">Language</dt>
          <dd className="font-mono">{u.locale ?? "—"}</dd>
          <dt className="text-muted-foreground">Last location</dt>
          <dd className="font-mono">
            {u.lastLatitude && u.lastLongitude
              ? `${u.lastLatitude}, ${u.lastLongitude}`
              : "—"}
          </dd>
          <dt className="text-muted-foreground">Last location at</dt>
          <dd>
            {u.lastLocationAt
              ? new Date(u.lastLocationAt).toLocaleString()
              : "—"}
          </dd>
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Summits {summits.data ? `(${summits.data.total})` : ""}
        </h2>

        {summits.error && (
          <p className="text-red-600">{summits.error.message}</p>
        )}
        {summits.isLoading && !summits.data && (
          <p className="text-muted-foreground">Loading…</p>
        )}

        {summits.data && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-4 font-medium">Mountain</th>
                    <th className="py-2 pr-4 font-medium">Height</th>
                    <th className="py-2 pr-4 font-medium">Essential</th>
                    <th className="py-2 pr-4 font-medium">Validated</th>
                    <th className="py-2 pr-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {summits.data.items.map((s) => (
                    <tr key={s.summitId} className="border-b">
                      <td className="py-2 pr-4">{s.mountainName}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {s.mountainHeight} m
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {s.mountainEssential ? "Yes" : "—"}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {s.validated ? "Yes" : "No"}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {new Date(s.summitedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {summits.data.items.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No summits yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {summits.data.totalPages > 1 && (
              <div className="flex items-center gap-4 text-sm">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={summitsPage <= 1}
                  onClick={() => setSummitsPage(summitsPage - 1)}
                >
                  Previous
                </Button>
                <span className="text-muted-foreground">
                  Page {summits.data.page} of {summits.data.totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={summitsPage >= summits.data.totalPages}
                  onClick={() => setSummitsPage(summitsPage + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function FieldText({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function FieldCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}
