"use client";

import { useState } from "react";

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

export type CouponFormValues = {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxUses: number | null;
  onePerUser: boolean;
  active: boolean;
};

export const emptyCouponForm: CouponFormValues = {
  code: "",
  discountType: "percentage",
  discountValue: 10,
  maxUses: null,
  onePerUser: false,
  active: true,
};

const isFormValid = (f: CouponFormValues): boolean => {
  if (f.code.trim().length < 2) return false;
  if (f.discountValue < 1) return false;
  if (f.discountType === "percentage" && f.discountValue > 99) return false;
  if (f.maxUses != null && f.maxUses < 1) return false;
  return true;
};

export function CouponForm({
  initial,
  saving,
  saveLabel,
  onSubmitForm,
}: {
  initial: CouponFormValues;
  saving: boolean;
  saveLabel: string;
  onSubmitForm: (values: CouponFormValues) => void;
}) {
  const [form, setForm] = useState<CouponFormValues>(initial);

  const percentOverflow =
    form.discountType === "percentage" && form.discountValue > 99;

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Code</Label>
          <Input
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            placeholder="SUMMER25"
          />
          <p className="text-xs text-muted-foreground">
            Case-insensitive: <code>SUMMER25</code> and <code>summer25</code>{" "}
            collide.
          </p>
        </div>
        <div className="space-y-1">
          <Label>Discount type</Label>
          <Select
            value={form.discountType}
            onValueChange={(v) => {
              if (v !== "percentage" && v !== "fixed") return;
              setForm((f) => ({ ...f, discountType: v }));
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage (%)</SelectItem>
              <SelectItem value="fixed">Fixed (€ off)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>
            Discount value ({form.discountType === "percentage" ? "%" : "€"})
          </Label>
          <Input
            type="number"
            min={1}
            max={form.discountType === "percentage" ? 99 : undefined}
            value={form.discountValue}
            onChange={(e) =>
              setForm((f) => ({ ...f, discountValue: Number(e.target.value) }))
            }
          />
          {percentOverflow && (
            <p className="text-xs text-red-500">
              Percentage discounts must be between 1 and 99.
            </p>
          )}
        </div>
        <div className="space-y-1">
          <Label>Max uses (optional)</Label>
          <Input
            type="number"
            min={1}
            value={form.maxUses ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                maxUses: e.target.value === "" ? null : Number(e.target.value),
              }))
            }
            placeholder="Unlimited"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.onePerUser}
            onChange={(e) =>
              setForm((f) => ({ ...f, onePerUser: e.target.checked }))
            }
          />
          <span>One per user</span>
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) =>
              setForm((f) => ({ ...f, active: e.target.checked }))
            }
          />
          <span>Active</span>
        </label>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button
          disabled={saving || !isFormValid(form)}
          onClick={() => onSubmitForm({ ...form, code: form.code.trim() })}
        >
          {saving ? "Saving…" : saveLabel}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={saving}
          onClick={() => setForm(initial)}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
