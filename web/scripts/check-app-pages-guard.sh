#!/usr/bin/env bash
# All four app pages must redirect a signed-out visitor to login.
set -u
BASE="${BASE:-http://localhost:3003}"
fail=0
for lang in en ms; do
  for page in chat history plan profile; do
    loc=$(curl -s -o /dev/null -D - "$BASE/$lang/$page" | grep -i '^location:' | tr -d '\r')
    printf "/%s/%-8s -> %s " "$lang" "$page" "${loc:-<none>}"
    case "$loc" in
      *"/$lang/login"*) echo "PASS" ;;
      *) echo "FAIL: expected redirect to /$lang/login"; fail=1 ;;
    esac
  done
done
exit $fail
