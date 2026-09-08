#!/usr/bin/env bash
set -u
BASE="${BASE:-http://localhost:3003}"
fail=0

echo "--- /auth/callback with no code redirects to login with an error ---"
loc=$(curl -s -o /dev/null -D - "$BASE/auth/callback" | grep -i '^location:' | tr -d '\r')
echo "location: ${loc:-<none>}"
case "$loc" in
  *"/login"*) echo "PASS" ;;
  *) echo "FAIL: expected a redirect to a login page"; fail=1 ;;
esac

echo "--- /auth/signout returns a redirect ---"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/signout")
echo "status: $code"
case "$code" in
  30*) echo "PASS" ;;
  *) echo "FAIL: expected a 3xx redirect"; fail=1 ;;
esac

exit $fail
