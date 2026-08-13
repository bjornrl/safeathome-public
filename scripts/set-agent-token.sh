#!/usr/bin/env bash
# Legger inn GitHub-PAT-en som vedlikeholdsagenten bruker til å pushe.
# Kjør fra Terminal på Mac-en:  ./scripts/set-agent-token.sh
#
# Tokenet lagres i .git/agent-credentials (rettigheter 600, inne i .git,
# kan aldri bli committet). Se docs/email-agent.md punkt 1.

set -euo pipefail

cd "$(dirname "$0")/.."

if [ "$(git config --local --get credential.helper || true)" = "" ]; then
  echo "Setter opp credential-helper først…"
  git config --local credential.helper \
    '!git credential-store --file="$(git rev-parse --git-dir)/agent-credentials"'
fi

read -rp "GitHub-brukernavn [bjornrl]: " username
username="${username:-bjornrl}"

echo "Lim inn fine-grained PAT (contents + pull_requests: read/write på"
echo "bjornrl/safeathome-public). Tegnene vises ikke."
read -rsp "Token: " token
echo

if [ -z "$token" ]; then
  echo "Tomt token — avbryter." >&2
  exit 1
fi

printf 'protocol=https\nhost=github.com\nusername=%s\npassword=%s\n\n' \
  "$username" "$token" | git credential approve

unset token

echo
echo "Lagret. Verifiserer mot GitHub…"
if git push --dry-run origin main >/dev/null 2>&1; then
  echo "✓ Push-tilgang virker. Agenten er selvgående."
else
  echo "✗ Push-forsøket gikk ikke gjennom." >&2
  echo "  Sjekk at PAT-en har contents: read/write og pull_requests: read/write" >&2
  echo "  på bjornrl/safeathome-public, og at den ikke er utløpt." >&2
  exit 1
fi
