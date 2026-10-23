import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

const Input = z.object({ amount: z.number().min(1).max(100000) });

export const createDonationCheckout = createServerFn({ method: "POST" })
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env["STRIPE_SECRET_KEY"];
    if (!key) return { url: null, error: "Card payments are not available right now." };

    const origin =
      getRequestHeader("origin") ||
      (getRequestHeader("host") ? `https://${getRequestHeader("host")}` : "https://front8.lovable.app");

    const body = new URLSearchParams({
      mode: "payment",
      submit_type: "donate",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(Math.round(data.amount * 100)),
      "line_items[0][price_data][product_data][name]": "Contribution to Magen Global",
      success_url: `${origin}/support?thanks=1`,
      cancel_url: `${origin}/support`,
      "managed_payments[enabled]": "false",
    });

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    const json = (await res.json()) as { url?: string; error?: { message?: string } };
    if (!res.ok || !json.url) {
      console.error("Stripe checkout error", json.error?.message);
      return { url: null, error: "Could not start card checkout. Please try again." };
    }
    return { url: json.url, error: null };
  });
