#!/usr/bin/env bash
# Unauthenticated calls must be rejected with 401 — never a redirect, since
# these are fetch targets, not navigations.
set -u
BASE="${BASE:-http://localhost:3003}"
fail=0
for path in /api/chat/reply /api/chat/analyze; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE$path" \
    -H "Content-Type: application/json" -d '{"message":"hi"}')
  printf "%-22s %s " "$path" "$code"
  if [ "$code" = "401" ]; then echo "PASS"; else echo "FAIL (want 401)"; fail=1; fi
done
exit $fail
