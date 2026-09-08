#!/usr/bin/env bash
set -u
BASE="${BASE:-http://localhost:3003}"
fail=0
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/chat/contact")
printf "GET    /api/chat/contact %s " "$code"
if [ "$code" = "401" ]; then echo "PASS"; else echo "FAIL (want 401)"; fail=1; fi

code=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/chat/contact" \
  -H "Content-Type: application/json" -d '{"name":"x","phone":"123"}')
printf "PUT    /api/chat/contact %s " "$code"
if [ "$code" = "401" ]; then echo "PASS"; else echo "FAIL (want 401)"; fail=1; fi

code=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/api/chat/contact?id=x")
printf "DELETE /api/chat/contact %s " "$code"
if [ "$code" = "401" ]; then echo "PASS"; else echo "FAIL (want 401)"; fail=1; fi

exit $fail
