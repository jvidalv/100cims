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
import {
  type AdminPlanUpdateBody,
  useAdminPlanDetail,
  useDeleteAdminPlan,
  useRemoveAdminPlanMember,
  useUpdateAdminPlan,
} from "@/domains/admin/api";

const STATUSES = ["open", "completed", "canceled"] as const;
const SPEEDS = ["chill", "normal", "fast"] as const;
type PlanStatus = (typeof STATUSES)[number];
type PlanSpeed = (typeof SPEEDS)[number];

const isStatus = (v: string): v is PlanStatus =>
  (STATUSES as readonly string[]).includes(v);
const isSpeed = (v: string): v is PlanSpeed =>
  (SPEEDS as readonly string[]).includes(v);

type Form = {
  title: string;
  description: string;
  status: PlanStatus;
  speed: PlanSpeed;
  startDate: string;
  imageUrl: string;
  routeUrl: string;
};

const emptyForm: Form = {
  title: "",
  description: "",
  status: "open",
  speed: "normal",
  startDate: "",
  imageUrl: "",
  routeUrl: "",
};

export default function AdminPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const detail = useAdminPlanDetail(id);
  const update = useUpdateAdminPlan(id);
  const deletePlan = useDeleteAdminPlan(id);
  const removeMember = useRemoveAdminPlanMember(id);

  const [form, setForm] = useState<Form>(emptyForm);
  const [initial, setInitial] = useState<Form>(emptyForm);

  useEffect(() => {
    if (!detail.data || update.isPending) return;
    const next: Form = {
      title: detail.data.title,
      description: detail.data.description ?? "",
      status: detail.data.status,
      speed: isSpeed(detail.data.speed) ? detail.data.speed : "normal",
      startDate: detail.data.startDate ?? "",
      imageUrl: detail.data.imageUrl ?? "",
      routeUrl: detail.data.routeUrl ?? "",
    };
    setForm(next);
    setInitial(next);
  }, [detail.data, update.isPending]);

  const dirty = (Object.keys(form) as (keyof Form)[]).some(
    (k) => form[k] !== initial[k],
  );

  const onSave = () => {
    const body: AdminPlanUpdateBody = {};
    if (form.title !== initial.title) body.title = form.title;
    if (form.description !== initial.description)
      body.description = form.description || null;
    if (form.status !== initial.status) body.status = form.status;
    if (form.speed !== initial.speed) body.speed = form.speed;
    if (form.startDate !== initial.startDate)
      body.startDate = form.startDate || null;
    if (form.imageUrl !== initial.imageUrl)
      body.imageUrl = form.imageUrl || null;
    if (form.routeUrl !== initial.routeUrl)
      body.routeUrl = form.routeUrl || null;

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
              className="size-16 rounded-md object-cover"
            />
          ) : (
            <div className="size-16 rounded-md bg-muted flex items-center justify-center text-2xl">
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
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
            <Label>Route URL</Label>
            <Input
              value={form.routeUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, routeUrl: e.target.value }))
              }
              placeholder="https://…"
            />
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
          <dd>{new Date(p.createdAt).toLocaleString()}</dd>
          <dt className="text-muted-foreground">Updated</dt>
          <dd>{new Date(p.updatedAt).toLocaleString()}</dd>
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Mountains ({p.mountains.length})
        </h2>
        {p.mountains.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No mountains linked to this plan.
          </p>
        ) : (
          <ul className="divide-y border rounded-md">
            {p.mountains.map((m) => (
              <li
                key={m.mountainId}
                className="flex items-center justify-between px-4 py-3"
              >
                <Link
                  href={`/admin/mountains/${m.mountainId}`}
                  className="font-medium hover:underline"
                >
                  {m.name}
                </Link>
                <span className="text-sm text-muted-foreground">
                  {m.height} m{m.essential ? " · essential" : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Members ({p.participants.length})
        </h2>
        {p.participants.length === 0 ? (
          <p className="text-muted-foreground text-sm">No members yet.</p>
        ) : (
          <ul className="divide-y border rounded-md">
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
                    <span className="inline-flex items-center rounded-md bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-300 px-2 py-0.5 text-xs font-medium">
                      Creator
                    </span>
                  )}
                  {m.willBringDogs && (
                    <span className="text-xs text-muted-foreground">🐕</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(m.joinedAt).toLocaleDateString()}
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
          <ul className="divide-y border rounded-md max-h-96 overflow-y-auto">
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
                        {new Date(msg.createdAt).toLocaleString()}
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
