"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isLocale } from "@/lib/i18n/config";

/**
 * Contact widget — a visitor sends a message from any page.
 *
 * Two steps, in this order and never the other way round:
 *   1. Store the row (public.contact_messages, via the rate-limited RPC).
 *   2. Best-effort email notification.
 *
 * If step 2 fails the message is still safely stored and `notified_at` stays
 * NULL, which is the signal that a message arrived without a mail going out.
 */

const MAX_BODY = 4000;
const MAX_NAME = 120;
const MAX_EMAIL = 254;

/** Anything faster than this was not typed by a person. */
const MIN_FILL_MS = 2000;

export type ContactResult =
  | { status: "sent" }
  | { status: "invalid" }
  | { status: "rate_limited" }
  | { status: "error" };

export interface ContactInput {
  body: string;
  name?: string;
  email?: string;
  pagePath?: string;
  lang?: string;
  /** Milliseconds between opening the panel and pressing send. */
  elapsedMs?: number;
  /** Honeypot: a real person never sees this field, so it must stay empty. */
  trap?: string;
}

/**
 * Salted hash of the caller's IP — the daily quota needs to tell senders
 * apart, not to know who they are. The salt keeps the (small, enumerable)
 * IPv4 space from being brute-forced back out of the stored digests.
 */
async function ipHash(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim();
  if (!ip) return null;

  const salt =
    process.env.CONTACT_IP_SALT ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    // Last resort: still better than storing the address itself, but a fixed
    // salt in the source is only obscurity — set CONTACT_IP_SALT in production.
    "safeathome-contact";

  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 64);
}

/** Loose on purpose: this rejects typos, not exotic-but-valid addresses. */
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function sendContactMessage(input: ContactInput): Promise<ContactResult> {
  // ── Bot checks. Both fail silently as "sent": telling a script why it was
  // rejected is free tuning advice, and a human never reaches this branch.
  if (input.trap && input.trap.trim().length > 0) return { status: "sent" };
  if (typeof input.elapsedMs === "number" && input.elapsedMs < MIN_FILL_MS) {
    return { status: "sent" };
  }

  const body = (input.body ?? "").trim().slice(0, MAX_BODY);
  if (body.length < 2) return { status: "invalid" };

  const name = (input.name ?? "").trim().slice(0, MAX_NAME) || null;
  const rawEmail = (input.email ?? "").trim().slice(0, MAX_EMAIL);
  // An unparseable address is worse than none: it would silently produce a
  // reply-to nobody can answer. Reject it so the visitor can fix the typo.
  if (rawEmail && !looksLikeEmail(rawEmail)) return { status: "invalid" };
  const email = rawEmail || null;

  const lang = isLocale(input.lang) ? input.lang : null;
  const pagePath = (input.pagePath ?? "").trim().slice(0, 300) || null;

  const supabase = await createSupabaseServerClient();

  const { data: messageId, error } = await supabase.rpc("submit_contact_message", {
    p_body: body,
    p_name: name,
    p_email: email,
    p_page_path: pagePath,
    p_lang: lang,
    p_ip_hash: await ipHash(),
  });

  if (error) {
    if (error.message.includes("rate_limited")) return { status: "rate_limited" };
    if (error.message.includes("empty_body")) return { status: "invalid" };
    console.error("[contact] could not store message:", error.message);
    return { status: "error" };
  }

  // Stored. From here on nothing may turn a delivered message into a failure
  // for the visitor — the mail is a convenience for us, not part of their
  // transaction.
  const notified = await notifyByEmail({ body, name, email, pagePath, lang });
  if (notified && typeof messageId === "string") {
    const { error: markError } = await supabase.rpc("mark_contact_message_notified", {
      p_id: messageId,
    });
    if (markError) console.error("[contact] could not mark notified:", markError.message);
  }

  return { status: "sent" };
}

interface NotifyPayload {
  body: string;
  name: string | null;
  email: string | null;
  pagePath: string | null;
  lang: string | null;
}

/** Escape for the HTML mail body — the message is untrusted visitor input. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Send the notification through Resend. Returns whether it went out.
 *
 * Never throws: every failure path is logged and swallowed, because the caller
 * has already stored the message and must not report an error to the visitor.
 */
async function notifyByEmail(payload: NotifyPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;

  if (!apiKey || !to) {
    // Expected before the keys are set — the message is in the table either
    // way, so this is a notice rather than an error.
    console.warn("[contact] RESEND_API_KEY/CONTACT_TO_EMAIL not set — stored without email.");
    return false;
  }

  // Resend's shared sender needs no DNS but only delivers to the account
  // owner. Set CONTACT_FROM_EMAIL once a domain is verified.
  const from = process.env.CONTACT_FROM_EMAIL ?? "safe@home <onboarding@resend.dev>";

  const sender = payload.name ?? "Anonym avsender";
  const subject = `safe@home: melding fra ${sender}`;

  const meta = [
    payload.email ? `E-post: ${payload.email}` : "E-post: ikke oppgitt — kan ikke svares",
    payload.pagePath ? `Side: ${payload.pagePath}` : null,
    payload.lang ? `Språk: ${payload.lang}` : null,
  ].filter(Boolean) as string[];

  const html = [
    `<p style="white-space:pre-wrap">${escapeHtml(payload.body)}</p>`,
    `<hr>`,
    `<p style="color:#666;font-size:13px">${meta.map(escapeHtml).join("<br>")}</p>`,
  ].join("");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
        text: `${payload.body}\n\n---\n${meta.join("\n")}`,
        // Replying in the mail client answers the visitor directly.
        ...(payload.email ? { reply_to: payload.email } : {}),
      }),
    });

    if (!response.ok) {
      console.error("[contact] Resend rejected the mail:", response.status, await response.text());
      return false;
    }
    return true;
  } catch (cause) {
    console.error("[contact] could not reach Resend:", cause);
    return false;
  }
}
