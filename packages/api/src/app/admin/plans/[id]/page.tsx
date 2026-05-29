"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchPicker } from "@/app/admin/_lib/search-picker";
import { useMountainSearch } from "@/app/admin/_lib/use-mountain-search";
import { useOrganizationSearch } from "@/app/admin/_lib/use-organization-search";
import {
  type AdminPlanUpdateBody,
  useAddAdminPlanMountain,
  useAdminPlanDetail,
  useAdminPlanMemberLog,
  useDeleteAdminPlan,
  useRemoveAdminPlanMember,
  useRemoveAdminPlanMountain,
  useUpdateAdminPlan,
  useUpdateAdminPlanMemberRole,
} from "@/domains/admin/api";
import { PLAN_USER_LOG_ACTIONS } from "@/db/enums";
import {
  formatDate,
  formatDateTime,
  toDateInputValue,
} from "@/lib/format-date";

const STATUSES = ["open", "completed", "canceled"] as const;
const SPEEDS = ["chill", "normal", "fast"] as const;
const TYPES = ["hike", "trail", "bike"] as const;
type PlanStatus = (typeof STATUSES)[number];
type PlanSpeed = (typeof SPEEDS)[number];
type PlanType = (typeof TYPES)[number];

const isStatus = (v: string): v is PlanStatus =>
  (STATUSES as readonly string[]).includes(v);
const isSpeed = (v: string): v is PlanSpeed =>
  (SPEEDS as readonly string[]).includes(v);
const isType = (v: string): v is PlanType =>
  (TYPES as readonly string[]).includes(v);

type Form = {
  title: string;
  description: string;
  status: PlanStatus;
  speed: PlanSpeed;
  type: PlanType | "";
  startDate: string;
  startTime: string;
  imageUrl: string;
  routeUrl: string;
  whatsappGroupUrl: string;
  wikilocUrl: string;
  stravaUrl: string;
  isPrivate: boolean;
  featured: boolean;
  paid: boolean;
  // Empty string = unaffiliated. The route normalizes "" → null before
  // hitting the DB, so we send the form value through untouched.
  // `organizationName` is for display only — never sent to the API; it
  // lets the chip render the current org without re-fetching it.
  organizationId: string;
  organizationName: string;
};

const emptyForm: Form = {
  title: "",
  description: "",
  status: "open",
  speed: "normal",
  type: "",
  startDate: "",
  startTime: "",
  imageUrl: "",
  routeUrl: "",
  whatsappGroupUrl: "",
  wikilocUrl: "",
  stravaUrl: "",
  isPrivate: false,
  featured: false,
  paid: false,
  organizationId: "",
  organizationName: "",
};

export default function AdminPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const detail = useAdminPlanDetail(id);
  const memberLog = useAdminPlanMemberLog(id);
  const update = useUpdateAdminPlan(id);
  const deletePlan = useDeleteAdminPlan(id);
  const removeMember = useRemoveAdminPlanMember(id);
  const updatePlanMemberRole = useUpdateAdminPlanMemberRole(id);
  const addMountain = useAddAdminPlanMountain(id);
  const removeMountain = useRemoveAdminPlanMountain(id);

  const [form, setForm] = useState<Form>(emptyForm);
  const [initial, setInitial] = useState<Form>(emptyForm);

  useEffect(() => {
    if (!detail.data || update.isPending) return;
    const next: Form = {
      title: detail.data.title,
      description: detail.data.description ?? "",
      status: detail.data.status,
      speed: isSpeed(detail.data.speed) ? detail.data.speed : "normal",
      type:
        detail.data.type && isType(detail.data.type) ? detail.data.type : "",
      startDate: toDateInputValue(detail.data.startDate),
      startTime: detail.data.startTime ?? "",
      imageUrl: detail.data.imageUrl ?? "",
      routeUrl: detail.data.routeUrl ?? "",
      whatsappGroupUrl: detail.data.whatsappGroupUrl ?? "",
      wikilocUrl: detail.data.wikilocUrl ?? "",
      stravaUrl: detail.data.stravaUrl ?? "",
      isPrivate: detail.data.isPrivate,
      featured: detail.data.featured,
      paid: detail.data.paid,
      organizationId: detail.data.organizationId ?? "",
      organizationName: detail.data.organizationName ?? "",
    };
    setForm(next);
    setInitial(next);
  }, [detail.data, update.isPending]);

  const dirty = (Object.keys(form) as (keyof Form)[]).some(
    // `organizationName` is display-only (never sent to the API) so changes
    // to it shouldn't enable Save on their own. `organizationId` drives
    // affiliation; the name follows.
    (k) => k !== "organizationName" && form[k] !== initial[k],
  );

  const onSave = () => {
    const body: AdminPlanUpdateBody = {};
    if (form.title !== initial.title) body.title = form.title;
    if (form.description !== initial.description)
      body.description = form.description || null;
    if (form.status !== initial.status) body.status = form.status;
    if (form.speed !== initial.speed) body.speed = form.speed;
    if (form.type !== initial.type) body.type = form.type || null;
    if (form.startDate !== initial.startDate)
      body.startDate = form.startDate || null;
    if (form.startTime !== initial.startTime)
      body.startTime = form.startTime || null;
    if (form.imageUrl !== initial.imageUrl)
      body.imageUrl = form.imageUrl || null;
    if (form.routeUrl !== initial.routeUrl)
      body.routeUrl = form.routeUrl || null;
    if (form.whatsappGroupUrl !== initial.whatsappGroupUrl)
      body.whatsappGroupUrl = form.whatsappGroupUrl || null;
    if (form.wikilocUrl !== initial.wikilocUrl)
      body.wikilocUrl = form.wikilocUrl || null;
    if (form.stravaUrl !== initial.stravaUrl)
      body.stravaUrl = form.stravaUrl || null;
    if (form.isPrivate !== initial.isPrivate) body.isPrivate = form.isPrivate;
    if (form.featured !== initial.featured) body.featured = form.featured;
    if (form.paid !== initial.paid) body.paid = form.paid;
    if (form.organizationId !== initial.organizationId) {
      // Send "" so the route normalizes to null. Sending null directly is
      // also fine but the type narrows to string|null vs string, which
      // would require widening the form's organizationId field.
      body.organizationId = form.organizationId;
    }

    update.mutate(body, {
      onSuccess: () => toast.success("Saved"),
      onError: (e) =>
        toast.error(e instanceof Error ? e.message : "Update failed"),
    });
  };

  const onDelete = () =>
    deletePlan.mutate(undefined, {
      onSuccess: () => {
        toast.success("Plan deleted");
        router.push("/admin/plans");
      },
      onError: (e) =>
        toast.error(e instanceof Error ? e.message : "Delete failed"),
    });

  const onRemoveMember = (userId: string, name: string) => {
    if (!window.confirm(`Remove ${name} from this plan?`)) return;
    removeMember.mutate(userId, {
      onSuccess: () => toast.success("Member removed"),
      onError: (e) =>
        toast.error(e instanceof Error ? e.message : "Remove failed"),
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
          href="/admin/plans"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Plans
        </Link>
        <p className="text-red-600">
          {detail.error?.message ?? "Plan not found"}
        </p>
      </div>
    );
  }

  const p = detail.data;
  const creatorName =
    [p.creator.firstName, p.creator.lastName].filter(Boolean).join(" ") ||
    p.creator.username ||
    "—";
  const creatorInitials = creatorName.slice(0, 2).toUpperCase();

  return (
    <div className="p-8 space-y-8">
      <div className="space-y-1">
        <Link
          href="/admin/plans"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Plans
        </Link>
        <div className="flex items-center gap-4 mt-2">
          {p.imageUrl ? (
            <img
              src={p.imageUrl}
              alt=""
              className="size-16 rounded object-cover"
            />
          ) : (
            <div className="size-16 rounded bg-muted flex items-center justify-center text-2xl">
              🗺
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-tight truncate">
              {p.title}
            </h1>
            <Link
              href={`/admin/users/${p.creatorId}`}
              className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-2 mt-1"
            >
              <Avatar className="size-5">
                {p.creator.imageUrl && (
                  <AvatarImage src={p.creator.imageUrl} alt={creatorName} />
                )}
                <AvatarFallback>{creatorInitials}</AvatarFallback>
              </Avatar>
              <span>{creatorName}</span>
            </Link>
          </div>
        </div>
      </div>

      <section className="space-y-4 max-w-2xl">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Edit
        </h2>
        <div className="space-y-1">
          <Label>Title</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <Label>Description</Label>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            rows={4}
            className="flex w-full rounded border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => {
                if (isStatus(v)) setForm((f) => ({ ...f, status: v }));
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Speed</Label>
            <Select
              value={form.speed}
              onValueChange={(v) => {
                if (isSpeed(v)) setForm((f) => ({ ...f, speed: v }));
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPEEDS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Type</Label>
            <Select
              value={form.type || "__none"}
              onValueChange={(v) => {
                if (v === "__none") setForm((f) => ({ ...f, type: "" }));
                else if (isType(v)) setForm((f) => ({ ...f, type: v }));
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">—</SelectItem>
                {TYPES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Start date</Label>
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, startDate: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label>Start time</Label>
            <Input
              type="time"
              value={form.startTime}
              onChange={(e) =>
                setForm((f) => ({ ...f, startTime: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label>Route URL</Label>
            <Input
              value={form.routeUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, routeUrl: e.target.value }))
              }
              placeholder="https://…"
            />
          </div>
          <div className="space-y-1">
            <Label>WhatsApp group URL</Label>
            <Input
              value={form.whatsappGroupUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, whatsappGroupUrl: e.target.value }))
              }
              placeholder="https://chat.whatsapp.com/…"
            />
          </div>
          <div className="space-y-1">
            <Label>Wikiloc trail URL</Label>
            <Input
              value={form.wikilocUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, wikilocUrl: e.target.value }))
              }
              placeholder="https://www.wikiloc.com/…"
            />
          </div>
          <div className="space-y-1">
            <Label>Strava URL</Label>
            <Input
              value={form.stravaUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, stravaUrl: e.target.value }))
              }
              placeholder="https://www.strava.com/…"
            />
          </div>
          <div className="md:col-span-2 space-y-1">
            <Label>Organization</Label>
            {form.organizationId ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded border px-3 py-1.5 text-sm">
                  <span className="font-medium">
                    {form.organizationName || form.organizationId}
                  </span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      organizationId: "",
                      organizationName: "",
                    }))
                  }
                >
                  Unaffiliate
                </Button>
              </div>
            ) : (
              <SearchPicker
                placeholder="Pick an organization to host this plan…"
                emptyLabel="No organizations match."
                useResults={useOrganizationSearch}
                onPick={(org) =>
                  setForm((f) => ({
                    ...f,
                    organizationId: org.id,
                    organizationName: org.name,
                  }))
                }
                renderOption={(org) => (
                  <div className="flex w-full items-center gap-3">
                    {org.imageUrl ? (
                      <img
                        src={org.imageUrl}
                        alt=""
                        className="size-8 rounded object-cover shrink-0"
                      />
                    ) : (
                      <div className="size-8 rounded bg-muted flex items-center justify-center text-base shrink-0">
                        🏔️
                      </div>
                    )}
                    <span className="font-medium truncate">{org.name}</span>
                  </div>
                )}
              />
            )}
          </div>
          <div className="space-y-1">
            <Label>Private</Label>
            <label className="flex items-center gap-2 h-9 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPrivate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isPrivate: e.target.checked }))
                }
                className="size-4 rounded border-input"
              />
              <span className="text-sm text-muted-foreground">
                Only invited members can see it
              </span>
            </label>
          </div>
          <div className="space-y-1">
            <Label>Featured</Label>
            <label className="flex items-center gap-2 h-9 cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) =>
                  setForm((f) => ({ ...f, featured: e.target.checked }))
                }
                className="size-4 rounded border-input"
              />
              <span className="text-sm text-muted-foreground">
                Show this plan in the featured list
              </span>
            </label>
          </div>
          <div className="space-y-1">
            <Label>Paid</Label>
            <label className="flex items-center gap-2 h-9 cursor-pointer">
              <input
                type="checkbox"
                checked={form.paid}
                onChange={(e) =>
                  setForm((f) => ({ ...f, paid: e.target.checked }))
                }
                className="size-4 rounded border-input"
              />
              <span className="text-sm text-muted-foreground">
                Joining this plan requires payment
              </span>
            </label>
          </div>
          <div className="md:col-span-2 space-y-1">
            <Label>Image URL</Label>
            <Input
              value={form.imageUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, imageUrl: e.target.value }))
              }
              placeholder="https://bucket.s3.…/plan.jpg"
            />
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
          Info
        </h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Challenge</dt>
          <dd>{p.challengeName ?? "—"}</dd>
          <dt className="text-muted-foreground">Created</dt>
          <dd>{formatDateTime(p.createdAt)}</dd>
          <dt className="text-muted-foreground">Updated</dt>
          <dd>{formatDateTime(p.updatedAt)}</dd>
        </dl>
      </section>

      <section className="space-y-3 max-w-2xl">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Mountains ({p.mountains.length})
        </h2>
        {p.mountains.length > 0 && (
          <ul className="divide-y border rounded">
            {p.mountains.map((m) => (
              <li
                key={m.mountainId}
                className="flex items-center gap-3 px-4 py-3"
              >
                {m.imageUrl ? (
                  <img
                    src={m.imageUrl}
                    alt=""
                    className="size-10 rounded object-cover shrink-0"
                  />
                ) : (
                  <div className="size-10 rounded bg-muted flex items-center justify-center text-lg shrink-0">
                    ⛰
                  </div>
                )}
                <Link
                  href={`/admin/mountains/${m.mountainId}`}
                  className="font-medium hover:underline flex-1 min-w-0 truncate"
                >
                  {m.name}
                </Link>
                <span className="text-sm text-muted-foreground">
                  {m.height} m{m.essential ? " · essential" : ""}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={removeMountain.isPending}
                  onClick={() =>
                    removeMountain.mutate(m.mountainId, {
                      onError: (e) =>
                        toast.error(
                          e instanceof Error ? e.message : "Remove failed",
                        ),
                    })
                  }
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
        <SearchPicker
          placeholder="Add a mountain by name or location…"
          emptyLabel="No mountains match."
          useResults={useMountainSearch}
          excludeIds={new Set(p.mountains.map((m) => m.mountainId))}
          onPick={(m) =>
            addMountain.mutate(m.id, {
              onError: (e) =>
                toast.error(e instanceof Error ? e.message : "Add failed"),
            })
          }
          renderOption={(m) => (
            <>
              <span className="font-medium">{m.name}</span>
              {m.location && (
                <span className="text-xs text-muted-foreground">
                  {m.location}
                </span>
              )}
            </>
          )}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Members ({p.participants.length})
        </h2>
        {p.participants.length === 0 ? (
          <p className="text-muted-foreground text-sm">No members yet.</p>
        ) : (
          <ul className="divide-y border rounded">
            {p.participants.map((m) => {
              const name =
                [m.firstName, m.lastName].filter(Boolean).join(" ") ||
                m.username;
              const initials = name.slice(0, 2).toUpperCase();
              return (
                <li
                  key={m.userId}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <Link
                    href={`/admin/users/${m.userId}`}
                    className="flex items-center gap-3 flex-1 min-w-0 hover:underline"
                  >
                    <Avatar className="size-8">
                      {m.imageUrl && (
                        <AvatarImage src={m.imageUrl} alt={name} />
                      )}
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium truncate">{name}</span>
                  </Link>
                  {m.isCreator && (
                    <span className="inline-flex items-center rounded bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-300 px-2 py-0.5 text-xs font-medium">
                      Creator
                    </span>
                  )}
                  {m.willBringDogs && (
                    <span className="text-xs text-muted-foreground">🐕</span>
                  )}
                  <Select
                    value={m.role}
                    onValueChange={(v) => {
                      if (v === "member" || v === "organizer") {
                        updatePlanMemberRole.mutate(
                          { userId: m.userId, role: v },
                          {
                            onSuccess: () => toast.success("Role updated"),
                            onError: (err) =>
                              toast.error(
                                err instanceof Error
                                  ? err.message
                                  : "Role update failed",
                              ),
                          },
                        );
                      }
                    }}
                    disabled={updatePlanMemberRole.isPending}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="organizer">Organizer</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(m.joinedAt)}
                  </span>
                  {!m.isCreator && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={removeMember.isPending}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onRemoveMember(m.userId, name);
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Recent messages ({p.recentMessages.length})
        </h2>
        {p.recentMessages.length === 0 ? (
          <p className="text-muted-foreground text-sm">No messages yet.</p>
        ) : (
          <ul className="divide-y border rounded max-h-96 overflow-y-auto">
            {p.recentMessages.map((msg) => {
              const name =
                [msg.firstName, msg.lastName].filter(Boolean).join(" ") ||
                msg.username ||
                "—";
              const initials = name.slice(0, 2).toUpperCase();
              return (
                <li key={msg.id} className="flex gap-3 px-4 py-3">
                  <Avatar className="size-8 shrink-0">
                    {msg.imageUrl && (
                      <AvatarImage src={msg.imageUrl} alt={name} />
                    )}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <Link
                        href={`/admin/users/${msg.userId}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {name}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(msg.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {msg.message}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Member activity ({memberLog.data?.length ?? 0})
        </h2>
        {memberLog.isLoading && !memberLog.data ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : !memberLog.data || memberLog.data.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No join/leave events yet.
          </p>
        ) : (
          <div className="overflow-x-auto border rounded">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="py-2 px-3 font-medium">When</th>
                  <th className="py-2 px-3 font-medium">Member</th>
                  <th className="py-2 px-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {memberLog.data.map((event) => {
                  const name =
                    [event.firstName, event.lastName]
                      .filter(Boolean)
                      .join(" ") ||
                    event.username ||
                    "—";
                  const initials = name.slice(0, 2).toUpperCase();
                  return (
                    <tr key={event.id} className="border-t">
                      <td className="py-2 px-3 text-muted-foreground tabular-nums">
                        {formatDateTime(event.timestamp)}
                      </td>
                      <td className="py-2 px-3">
                        <Link
                          href={`/admin/users/${event.userId}`}
                          className="flex items-center gap-2 hover:underline"
                        >
                          <Avatar className="size-6">
                            {event.imageUrl && (
                              <AvatarImage src={event.imageUrl} alt={name} />
                            )}
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <span>{name}</span>
                        </Link>
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                            event.action === PLAN_USER_LOG_ACTIONS.JOINED
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                          }`}
                        >
                          {event.action}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3 max-w-2xl pt-4 border-t border-destructive/30">
        <h2 className="text-sm font-medium text-destructive uppercase tracking-wide">
          Danger zone
        </h2>
        <p className="text-sm text-muted-foreground">
          Deleting this plan removes it along with its members, mountains,
          messages, and logs. This cannot be undone.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={deletePlan.isPending}>
              Delete plan
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this plan?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes the plan, its members, mountains, messages, and
                logs. Cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={onDelete}
              >
                {deletePlan.isPending ? "Deleting…" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
}
