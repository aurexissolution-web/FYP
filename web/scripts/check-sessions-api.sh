#!/usr/bin/env bash
set -u
BASE="${BASE:-http://localhost:3003}"
fail=0
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/chat/sessions")
printf "GET  /api/chat/sessions %s " "$code"
if [ "$code" = "401" ]; then echo "PASS"; else echo "FAIL (want 401)"; fail=1; fi
code=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/api/chat/sessions?id=x")
printf "DEL  /api/chat/sessions %s " "$code"
if [ "$code" = "401" ]; then echo "PASS"; else echo "FAIL (want 401)"; fail=1; fi
exit $fail
