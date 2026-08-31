import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  MESSAGE_MAX,
  SUBJECT_MAX,
  sendContactEmail,
} from "@/lib/contact-email";

/**
 * POST /api/contact — sender en melding fra et innlogget team-medlem til
 * CONTACT_TO_EMAIL.
 *
 * Krever økt. Det er hele spam-beskyttelsen: skjemaet vises aldri for
 * utloggede, og ruta avviser dem. Avsenderadressen leses fra økta, ikke fra
 * request-kroppen, så den kan ikke forfalskes.
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user;

  if (error || !user?.email) {
    return Response.json(
      { error: "Du må være innlogget for å sende melding.", code: "unauthorized" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Ugyldig forespørsel.", code: "bad_request" },
      { status: 400 },
    );
  }

  const { message, subject, fromPath } = (body ?? {}) as Record<string, unknown>;

  const text = typeof message === "string" ? message.trim() : "";
  if (!text) {
    return Response.json(
      { error: "Skriv en melding først.", code: "empty" },
      { status: 400 },
    );
  }
  if (text.length > MESSAGE_MAX) {
    return Response.json(
      {
        error: `Meldingen er for lang (maks ${MESSAGE_MAX} tegn).`,
        code: "too_long",
        // Klienten trenger tallene for å formulere sin egen versjon.
        length: text.length,
        max: MESSAGE_MAX,
      },
      { status: 400 },
    );
  }

  const subjectText =
    typeof subject === "string" ? subject.trim().slice(0, SUBJECT_MAX) : undefined;

  const result = await sendContactEmail({
    message: text,
    subject: subjectText,
    fromPath: typeof fromPath === "string" ? fromPath.slice(0, 200) : undefined,
    senderEmail: user.email,
  });

  if (!result.ok) {
    return Response.json(
      { error: result.error, code: result.code },
      { status: result.status },
    );
  }

  return Response.json({ ok: true });
}
