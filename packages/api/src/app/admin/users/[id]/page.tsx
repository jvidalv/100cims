"use client";

import Link from "next/link";
import { parseAsInteger, useQueryState } from "nuqs";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type AdminUserUpdateBody,
  useAddAdminUserPerson,
  useAdminUserDetail,
  useAdminUserPeople,
  useAdminUsers,
  useAdminUserSummits,
  useRemoveAdminUserPerson,
  useUpdateAdminUser,
} from "@/domains/admin/api";
import { formatDate, formatDateTime } from "@/lib/format-date";

const UNLOCKABLES = ["merch", "share", "forcat", "picat"] as const;
type Unlockable = (typeof UNLOCKABLES)[number];
const UNLOCKABLE_LABELS: Record<Unlockable, string> = {
  merch: "Or (merch)",
  share: "Genteta (share)",
  forcat: "Forcat (Pedraforca)",
  picat: "Picat (Pica d'Estats)",
};

type Form = {
  firstName: string;
  lastName: string;
  username: string;
  town: string;
  phoneNumber: string;
  country: string;
  locale: string;
  visibleOnHiscores: boolean;
  visibleOnPeopleSearch: boolean;
  admin: boolean;
  unlockables: Unlockable[];
};

const emptyForm: Form = {
  firstName: "",
  lastName: "",
  username: "",
  town: "",
  phoneNumber: "",
  country: "",
  locale: "",
  visibleOnHiscores: false,
  visibleOnPeopleSearch: true,
  admin: false,
  unlockables: [],
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

  const people = useAdminUserPeople(id);
  const addPerson = useAddAdminUserPerson(id);
  const removePerson = useRemoveAdminUserPerson(id);
  const [personSearch, setPersonSearch] = useState("");
  const personSearchResults = useAdminUsers({
    page: 1,
    q: personSearch,
    country: "",
    platform: "",
    version: "",
    sort: "",
  });

  const [form, setForm] = useState<Form>(emptyForm);
  const [initial, setInitial] = useState<Form>(emptyForm);

  useEffect(() => {
    if (!detail.data || update.isPending) return;
    const next: Form = {
      firstName: detail.data.firstName ?? "",
      lastName: detail.data.lastName ?? "",
      username: detail.data.username ?? "",
      town: detail.data.town ?? "",
      phoneNumber: detail.data.phoneNumber ?? "",
      country: detail.data.country ?? "",
      locale: detail.data.locale ?? "",
      visibleOnHiscores: detail.data.visibleOnHiscores,
      visibleOnPeopleSearch: detail.data.visibleOnPeopleSearch,
      admin: detail.data.admin,
      unlockables: detail.data.unlockables.filter((u): u is Unlockable =>
        (UNLOCKABLES as readonly string[]).includes(u),
      ),
    };
    setForm(next);
    setInitial(next);
  }, [detail.data, update.isPending]);

  const unlockablesDirty =
    form.unlockables.length !== initial.unlockables.length ||
    form.unlockables.some((u) => !initial.unlockables.includes(u));

  const dirty =
    unlockablesDirty ||
    (Object.keys(form) as (keyof Form)[]).some(
      (k) => k !== "unlockables" && form[k] !== initial[k],
    );

  const onSave = () => {
    const body: AdminUserUpdateBody = {};
    if (form.firstName !== initial.firstName)
      body.firstName = form.firstName || null;
    if (form.lastName !== initial.lastName)
      body.lastName = form.lastName || null;
    if (form.username !== initial.username) body.username = form.username;
    if (form.town !== initial.town) body.town = form.town || null;
    if (form.phoneNumber !== initial.phoneNumber)
      body.phoneNumber = form.phoneNumber.trim() || null;
    if (form.country !== initial.country) body.country = form.country || null;
    if (form.locale !== initial.locale) body.locale = form.locale || null;
    if (form.visibleOnHiscores !== initial.visibleOnHiscores)
      body.visibleOnHiscores = form.visibleOnHiscores;
    if (form.visibleOnPeopleSearch !== initial.visibleOnPeopleSearch)
      body.visibleOnPeopleSearch = form.visibleOnPeopleSearch;
    if (form.admin !== initial.admin) body.admin = form.admin;
    if (unlockablesDirty) body.unlockables = form.unlockables;

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
            label="Phone number (private)"
            value={form.phoneNumber}
            onChange={(v) => setForm((p) => ({ ...p, phoneNumber: v }))}
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

        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Unlockables
          </Label>
          <div className="flex flex-wrap gap-6">
            {UNLOCKABLES.map((slug) => (
              <FieldCheckbox
                key={slug}
                label={UNLOCKABLE_LABELS[slug]}
                checked={form.unlockables.includes(slug)}
                onChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    unlockables: v
                      ? [...p.unlockables, slug]
                      : p.unlockables.filter((u) => u !== slug),
                  }))
                }
              />
            ))}
          </div>
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
          <dd>{u.lastLocationAt ? formatDateTime(u.lastLocationAt) : "—"}</dd>
          <dt className="text-muted-foreground">Push enabled</dt>
          <dd>{u.pushNotificationsEnabled ? "Yes" : "No"}</dd>
          <dt className="text-muted-foreground">Push token</dt>
          <dd>
            {u.expoPushToken ? (
              <div className="flex items-start gap-2">
                <code className="font-mono text-xs break-all">
                  {u.expoPushToken}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void navigator.clipboard.writeText(u.expoPushToken ?? "");
                    toast.success("Copied");
                  }}
                >
                  Copy
                </Button>
              </div>
            ) : (
              "—"
            )}
          </dd>
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          People {people.data ? `(${people.data.length})` : ""}
        </h2>

        <div className="flex gap-2 items-start">
          <div className="flex-1 relative">
            <Input
              value={personSearch}
              onChange={(e) => setPersonSearch(e.target.value)}
              placeholder="Search by name, username or email…"
            />
            {personSearch.length > 1 &&
              personSearchResults.data?.items &&
              personSearchResults.data.items.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg max-h-60 overflow-y-auto">
                  {personSearchResults.data.items
                    .filter(
                      (u) =>
                        u.id !== id &&
                        !people.data?.some((p) => p.userId === u.id),
                    )
                    .slice(0, 10)
                    .map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 hover:bg-muted text-left"
                        onClick={() => {
                          addPerson.mutate(u.id, {
                            onSuccess: () => {
                              setPersonSearch("");
                              toast.success("Person added");
                            },
                            onError: (err) =>
                              toast.error(err.message ?? "Add failed"),
                          });
                        }}
                      >
                        <Avatar className="size-6">
                          <AvatarImage src={u.imageUrl ?? undefined} />
                          <AvatarFallback>
                            {(u.firstName ?? u.username ?? "?")
                              .slice(0, 1)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {u.firstName} {u.lastName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          @{u.username}
                        </span>
                      </button>
                    ))}
                </div>
              )}
          </div>
        </div>

        {people.error && <p className="text-red-600">{people.error.message}</p>}
        {people.isLoading && !people.data && (
          <p className="text-muted-foreground">Loading…</p>
        )}

        {people.data && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4 font-medium">User</th>
                  <th className="py-2 pr-4 font-medium">Email</th>
                  <th className="py-2 pr-4 font-medium">Connected</th>
                  <th className="py-2 pr-4 font-medium" />
                </tr>
              </thead>
              <tbody>
                {people.data.map((p) => (
                  <tr key={p.userId} className="border-b">
                    <td className="py-2 pr-4">
                      <Link
                        href={`/admin/users/${p.userId}`}
                        className="flex items-center gap-2 hover:underline"
                      >
                        <Avatar className="size-6">
                          <AvatarImage src={p.imageUrl ?? undefined} />
                          <AvatarFallback>
                            {(p.firstName ?? p.email ?? "?")
                              .slice(0, 1)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {p.firstName} {p.lastName}
                        </span>
                      </Link>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {p.email}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {formatDateTime(p.connectedAt)}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          removePerson.mutate(p.userId, {
                            onSuccess: () => toast.success("Removed"),
                            onError: (err) =>
                              toast.error(err.message ?? "Remove failed"),
                          });
                        }}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
                {people.data.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No people yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
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
                        {formatDate(s.summitedAt)}
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
