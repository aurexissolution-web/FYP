#!/usr/bin/env bash
set -u
BASE="${BASE:-http://localhost:3003}"
fail=0
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/chat/logs")
printf "GET   /api/chat/logs  %s " "$code"
if [ "$code" = "401" ]; then echo "PASS"; else echo "FAIL (want 401)"; fail=1; fi
code=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/api/chat/plans" \
  -H "Content-Type: application/json" -d '{"planId":"x","completed":true}')
printf "PATCH /api/chat/plans %s " "$code"
if [ "$code" = "401" ]; then echo "PASS"; else echo "FAIL (want 401)"; fail=1; fi
exit $fail
