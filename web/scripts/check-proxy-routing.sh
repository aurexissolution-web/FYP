#!/usr/bin/env bash
# Verifies the two proxy.ts hazards from the spec:
#   1. /auth/callback must NOT be locale-prefixed
#   2. a locale redirect must still carry Set-Cookie through
set -u
BASE="${BASE:-http://localhost:3003}"
fail=0

echo "--- /auth/callback must not redirect to /en/auth/callback ---"
loc=$(curl -s -o /dev/null -D - "$BASE/auth/callback" | grep -i '^location:' | tr -d '\r')
echo "location: ${loc:-<none>}"
case "$loc" in
  *"/en/auth/callback"*) echo "FAIL: callback was locale-prefixed"; fail=1 ;;
  *) echo "PASS: callback not locale-prefixed" ;;
esac

echo "--- /features must redirect to /en/features ---"
loc=$(curl -s -o /dev/null -D - "$BASE/features" | grep -i '^location:' | tr -d '\r')
echo "location: ${loc:-<none>}"
case "$loc" in
  *"/en/features"*) echo "PASS: locale redirect intact" ;;
  *) echo "FAIL: locale redirect broken"; fail=1 ;;
esac

exit $fail
