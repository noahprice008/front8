import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  message: z.string().trim().min(10, "Message is too short").max(2000),
  context: z.string().trim().max(200).optional(),
  // honeypot: real users leave this empty
  website: z.string().max(0).optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => contactSchema.parse(data))
  .handler(async ({ data }) => {
    if (data.website) return { ok: true as const };
    // Recipient lives only on the server — never sent to the browser.
    const recipient = "noah@elevex.digital";
    const webhook = process.env["CONTACT_WEBHOOK_URL_PROD"] || process.env["CONTACT_WEBHOOK_URL"];
    if (!webhook) {
      console.error("CONTACT_WEBHOOK_URL is not configured");
      return { ok: false as const, error: "Messaging is temporarily unavailable. Please try again later." };
    }
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipient,
          subject: `Magen Global contact: ${data.name}`,
          name: data.name,
          reply_to: data.email,
          message: data.message,
          context: data.context ?? null,
          submitted_at: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        console.error(`Contact webhook failed [${res.status}]: ${await res.text()}`);
        return { ok: false as const, error: "Your message could not be sent. Please try again." };
      }
      return { ok: true as const };
    } catch (err) {
      console.error("Contact webhook error", err);
      return { ok: false as const, error: "Your message could not be sent. Please try again." };
    }
  });
