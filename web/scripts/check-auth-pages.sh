#!/usr/bin/env bash
set -u
BASE="${BASE:-http://localhost:3003}"
fail=0
for path in /en/login /en/signup /en/forgot-password /ms/login /ms/signup; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$path")
  printf "%-22s %s " "$path" "$code"
  if [ "$code" = "200" ]; then echo "PASS"; else echo "FAIL"; fail=1; fi
done
echo "--- BM page must not show the English label ---"
if curl -s "$BASE/ms/login" | grep -qi "Log Masuk"; then
  echo "PASS: Malay copy present"
else
  echo "FAIL: Malay copy missing"; fail=1
fi
exit $fail
