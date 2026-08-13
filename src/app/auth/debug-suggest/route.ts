// TEMPORARY diagnostic — delete after use.
import Anthropic from "@anthropic-ai/sdk";
import { FRICTIONS, QUALITIES } from "@/lib/constants";

const FRICTION_KEYS = Object.keys(FRICTIONS);
const QUALITY_KEYS = Object.keys(QUALITIES);

// Same extraction logic as suggest.ts
function extractJsonObject(text: string): string | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : text).trim();
  const start = candidate.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < candidate.length; i++) {
    const c = candidate[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return candidate.slice(start, i + 1);
    }
  }
  return null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const headline = url.searchParams.get("h") ?? "Demens finnes ikke som ord på urdu";
  const body =
    url.searchParams.get("b") ??
    "I en gruppe der lege og politi var til stede, sa en deltaker at hun aldri hadde hørt om demens. Det finnes ikke et etablert ord for demens på urdu, og tilstanden forstås ofte som normal aldring.";

  const userPrompt = `A researcher has written the following note:

HEADLINE: ${headline}
BODY: ${body}

Available care frictions (systemic failure mechanisms):
- rotate: staff turnover breaks relational continuity
- script: technologies embed assumptions that don't fit diverse households
- isolate: care plans sever people from family and community networks
- reduce: complex identities flattened into bureaucratic categories
- exclude: language/digital/administrative barriers prevent service access
- invisible: care work the system doesn't see (family, transnational)
- displace: interventions that make people feel less at home

Available care qualities (how people actually live):
- transnational_flow: care/money/support circulating across borders
- household_choreography: orchestration of multi-use spaces and roles
- invisible_labor: unpaid care by relatives and community
- cultural_anchoring: food, prayer, language, ritual sustaining identity
- adaptive_resistance: quietly stopping or modifying services that don't fit
- intergenerational_exchange: bidirectional care between old and young
- digital_bridging: technology maintaining connections across distance
- belonging_negotiation: tension between 'here' and 'there'

Work packages:
- WP1: inside the home, material spaces, objects
- WP2: neighborhood, service access, care institutions
- WP3: transnational context, policy, city-level
- WP4: innovation, design, cross-cutting

Already selected frictions (do not suggest these): none
Already selected qualities (do not suggest these): none

Respond with JSON in exactly this format:
{
  "frictions": ["rotate", "script"],
  "qualities": ["cultural_anchoring"],
  "work_package": "WP1"
}

Only suggest categories you are confident about. Fewer confident suggestions are better than many uncertain ones. Return empty arrays if unsure.`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    system:
      "You are a research assistant for the SAFE@HOME project, a Norwegian research project studying how municipal homecare services can be adapted for aging immigrants. You help researchers tag their field notes with the correct analytical categories.\n\nRespond only with valid JSON. No explanation, no markdown, no preamble.",
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const jsonText = extractJsonObject(text);
  let parsed: unknown = null;
  try {
    parsed = jsonText ? JSON.parse(jsonText) : null;
  } catch {
    parsed = "JSON.parse failed";
  }

  const obj = (parsed ?? {}) as Record<string, unknown>;
  const keptFrictions = Array.isArray(obj.frictions)
    ? obj.frictions.filter((v) => typeof v === "string" && FRICTION_KEYS.includes(v as string))
    : [];
  const keptQualities = Array.isArray(obj.qualities)
    ? obj.qualities.filter((v) => typeof v === "string" && QUALITY_KEYS.includes(v as string))
    : [];

  return Response.json({
    stop_reason: response.stop_reason,
    rawText: text,
    extracted: jsonText,
    parsed,
    keptFrictions,
    keptQualities,
    verdict:
      keptFrictions.length || keptQualities.length
        ? "categories SURVIVE parsing — bug is downstream (client/render)"
        : "categories EMPTY after parsing — bug is here",
  });
}
