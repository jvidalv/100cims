import { Elysia, t } from "elysia";
import Stripe from "stripe";

import { INVALID_AMOUNT_PROVIDED } from "@/api/routes/@shared/error-codes";

const stripe = new Stripe((process.env.STRIPE_SECRET_KEY as string) || "");

export const stripeRoute = new Elysia({ prefix: "/stripe" }).get(
  "/donation",
  async ({ query, error }) => {
    const { amount } = query;

    if (!amount || isNaN(Number(amount)) || Number(amount) < 1) {
      return error(421, {
        success: false,
        message: INVALID_AMOUNT_PROVIDED,
      });
    }

    // Convert amount from EUR to the smallest currency unit (e.g., cents)
    const amountInCents = Math.round(Number(amount) * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "eur",
    });

    if (!paymentIntent.client_secret) {
      return error(500, {
        success: false,
      });
    }

    return {
      success: true,
      message: paymentIntent.client_secret,
    };
  },
  {
    query: t.Object({
      amount: t.String(),
    }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        message: t.String(),
      }),
      421: t.Object({
        success: t.Boolean(),
        message: t.String(),
      }),
      500: t.Object({
        success: t.Boolean(),
      }),
    },
  },
);
