import { t } from "elysia";

export const PlanStatusSchema = t.Union([
  t.Literal("open"),
  t.Literal("completed"),
  t.Literal("canceled"),
]);

export const PlanSpeedSchema = t.Union([
  t.Literal("chill"),
  t.Literal("normal"),
  t.Literal("fast"),
]);

export const PlanTypeSchema = t.Union([
  t.Literal("hike"),
  t.Literal("trail"),
  t.Literal("bike"),
]);

export const CouponDiscountTypeSchema = t.Union([
  t.Literal("percentage"),
  t.Literal("fixed"),
]);

export const ShopRequestStatusSchema = t.Union([
  t.Literal("requested"),
  t.Literal("contacted"),
  t.Literal("done"),
  t.Literal("cancelled"),
]);
