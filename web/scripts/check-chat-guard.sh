#!/usr/bin/env bash
# A signed-out visitor must be redirected to login, not shown the chat.
set -u
BASE="${BASE:-http://localhost:3003}"
fail=0
for lang in en ms; do
  loc=$(curl -s -o /dev/null -D - "$BASE/$lang/chat" | grep -i '^location:' | tr -d '\r')
  printf "/%s/chat -> %s " "$lang" "${loc:-<none>}"
  case "$loc" in
    *"/$lang/login"*) echo "PASS" ;;
    *) echo "FAIL: expected redirect to /$lang/login"; fail=1 ;;
  esac
done
exit $fail
