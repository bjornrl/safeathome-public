# SAFE@HOME — AI Suggestion Feature for Quick Notes

## CRITICAL: Read before writing anything

This is an existing Next.js 14+ App Router project. Quick Notes are already
built and working. This prompt adds one focused feature on top of them:
AI-powered suggestions for categories and related notes while writing a note.

Read the existing quick note form and surrounding code before touching anything.
Do not modify anything unrelated to this feature.

Supabase:
- URL: https://ditsssyrzjqdnhqxnffx.supabase.co
- Anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdHNzc3lyempxZG5ocXhuZmZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyODcwMzQsImV4cCI6MjA4ODg2MzAzNH0.BHWcpVrsenHjtTHCUUfGZv_SaDS-RqeGmENBXdVi7V0

Anthropic API key: read from environment variable ANTHROPIC_API_KEY
(This must already be set in Netlify env vars before deploying.
Add it locally to .env.local for development.)

---

## What this feature does

When a user is writing a Quick Note, a "✦ Suggest" button appears in the
form once the note body reaches at least 80 characters. Clicking it calls
a server action that sends the note content + all existing notes/insights
to Claude Haiku and returns structured suggestions:

- Which care_frictions apply (0–3 suggestions)
- Which care_qualities apply (0–3 suggestions)  
- Which work_package fits best (0–1 suggestion)
- Which existing notes/insights are most related (0–5 suggestions, by ID)

Suggestions appear in the sidebar as ghost items — visually distinct from
confirmed selections. The author can accept (clicks to confirm) or dismiss
(clicks x to remove) each suggestion individually. Accepted suggestions
become regular tag selections. Dismissed suggestions disappear.

---

## Rate limiting

Implement all three of the following limiters:

### 1. Minimum character threshold
The "✦ Suggest" button is disabled and greyed out until note body >= 80
characters. Show a subtle character count hint: "Type at least 80 characters
to enable suggestions" until threshold is met, then it disappears.

### 2. Debounce
After the user clicks "✦ Suggest", disable the button for 3 seconds to
prevent double-clicks. Re-enable after the response returns or after
3 seconds, whichever is later.

### 3. Per-user daily limit
Store usage in Supabase. Create this table if it does not already exist:

  suggestion_usage (
    id UUID PK DEFAULT gen_random_uuid(),
    user_id UUID → profiles(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    count INTEGER DEFAULT 0,
    UNIQUE(user_id, date)
  )

  RLS: authenticated users can read/update only their own row.
  Use INSERT ... ON CONFLICT (user_id, date) DO UPDATE SET count = count + 1
  to increment atomically.

Limit: 20 suggestion calls per user per day.
If the user has reached 20, the button is replaced with a subtle message:
"Suggestion limit reached for today" — no error, no drama.

Check the count before calling the API (read from Supabase first).
Increment the count only after a successful API response.

---

## Server action

Create a server action at app/actions/suggest.ts (or equivalent path).
It must run server-side — never expose the API key to the client.

The action receives:
- noteHeadline: string (may be empty)
- noteBody: string
- currentFrictions: care_friction[] (already selected, exclude from suggestions)
- currentQualities: care_quality[] (already selected, exclude from suggestions)
- userId: string (for rate limit check)

The action does:
1. Check suggestion_usage for today — return limit error if >= 20
2. Fetch all quick_notes (id, headline, body excerpt max 200 chars) from Supabase
3. Fetch all insights (id, title, summary/body excerpt max 200 chars) from Supabase
4. Build prompt (see below)
5. Call Claude Haiku: model "claude-haiku-4-5-20251001", max_tokens 500
6. Parse JSON response
7. Increment suggestion_usage count
8. Return structured suggestions

Return type:
  {
    frictions: care_friction[],
    qualities: care_quality[],
    work_package: work_package | null,
    related: { id: string, type: 'note' | 'insight', title: string }[]
  }

On any error (API failure, parse failure, rate limit): return empty suggestions
gracefully — never throw to the client, never break the form.

---

## Prompt to send to Claude

System prompt:
"You are a research assistant for the SAFE@HOME project, a Norwegian research
project studying how municipal homecare services can be adapted for aging
immigrants. You help researchers tag their field notes with the correct
analytical categories and find connections to related observations.

Respond only with valid JSON. No explanation, no markdown, no preamble."

User prompt (construct dynamically):
"A researcher has written the following note:

HEADLINE: {headline or "(none)"}
BODY: {body}

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

Already selected frictions (do not suggest these): {currentFrictions}
Already selected qualities (do not suggest these): {currentQualities}

Existing notes and insights (suggest up to 5 that are most related):
{list each as: "[id] [type: note|insight] {title/headline}: {excerpt}"}

Respond with JSON in exactly this format:
{
  "frictions": ["rotate", "script"],
  "qualities": ["cultural_anchoring"],
  "work_package": "WP1",
  "related": [
    {"id": "uuid-here", "type": "note", "title": "Title here"},
    {"id": "uuid-here", "type": "insight", "title": "Title here"}
  ]
}

Only suggest categories you are confident about. Fewer confident suggestions
are better than many uncertain ones. Return empty arrays if unsure."

---

## UI changes to the Quick Note form

### Suggest button
- Appears below the body textarea
- Disabled + muted when body < 80 characters
- Label: "✦ Suggest categories & connections"
- Loading state: "Thinking..." with a subtle spinner
- Uses the accent color (#C45D3E) when active

### Suggestion display — categories
When suggestions arrive, show them as ghost badges in the friction/quality
selectors. Ghost style: dashed border, 60% opacity, same color as confirmed.
Each ghost badge has:
- A ✓ checkmark to accept (moves it to confirmed selection)
- A × to dismiss (removes it)
Small label above the ghost badges: "AI suggestions — click to accept"

### Suggestion display — related notes
In the connections sidebar (the right panel listing existing notes/insights),
suggested connections are highlighted with a subtle background tint and a
"✦ Suggested" label. The author can click to confirm or ignore.
Suggested connections are not automatically added — they require a click.

### After interaction
Once all suggestions are either accepted or dismissed, the suggest button
returns to its normal state and can be clicked again (subject to rate limit).
Show a subtle "Suggestions cleared" state for 2 seconds then reset fully.

---

## Design notes
- The feature should feel like a quiet assistant, not an AI product
- No "Powered by AI" badges, no ChatGPT aesthetic
- The ✦ symbol is the only indicator that AI is involved
- Ghost badges use the existing friction/quality color system
- Error states are silent — if the API fails, nothing breaks, button resets
- The daily limit message is matter-of-fact, not apologetic

---

## Environment variable
ANTHROPIC_API_KEY must be set in:
- .env.local for development
- Netlify environment variables for production

Do not hardcode the key anywhere. If the key is missing, the suggest button
should not appear at all (check for key existence in the server action and
return a 'unavailable' status that hides the button client-side).