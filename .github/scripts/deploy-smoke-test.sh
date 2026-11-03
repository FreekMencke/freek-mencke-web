#!/usr/bin/env bash
# CD's smoke test (deploy.yml): checks the public site. Exits 1 when any check failed, after running them all.
# -e like GitHub's default `run` shell (bash -e), which a script run from it doesn't inherit
set -e

# BASE_URL runs the same checks on a local server (the www check then fails)
base=${BASE_URL:-https://freekmencke.com}
failed=0
expect() {
  status=$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 "$base$2" || true)
  echo "$2: $status (expected $1)"
  [ "$status" = "$1" ] || failed=1
}
headers=$(mktemp)
home=$(curl -s -D "$headers" --max-time 30 "$base/" || true)
if printf '%s\n' "$home" | grep -q '<title>Freek Mencke'; then echo "/: the page"; else echo "/: not the page"; failed=1; fi
# Every script runs only with the response's nonce: a page left with the build's placeholder, or with another nonce,
# runs none of them
nonce=$(grep -i '^content-security-policy:' "$headers" | grep -o -E "'nonce-[^']+'" | head -1 | sed -E "s/^'nonce-(.*)'$/\1/")
others=$(printf '%s\n' "$home" | grep -o -E 'nonce="[^"]*"' | grep -v -F "nonce=\"$nonce\"" || true)
if [ -z "$nonce" ]; then echo "/: no nonce in the CSP"; failed=1
elif printf '%s\n' "$home" | grep -q CSP_NONCE_PLACEHOLDER; then echo "/: CSP_NONCE_PLACEHOLDER left in the page"; failed=1
elif [ -n "$others" ]; then echo "/: a nonce that isn't the CSP's"; failed=1
else echo "/: every nonce is the CSP's"; fi
if printf '%s\n' "$home" | grep -q -F '<link rel="canonical" href="https://freekmencke.com/">'; then echo "/: canonical"; else echo "/: no canonical link to https://freekmencke.com/"; failed=1; fi
if printf '%s\n' "$home" | grep -q -i noindex || grep -q -i '^x-robots-tag:.*noindex' "$headers"; then echo "/: noindex"; failed=1; else echo "/: indexable"; fi
rm -f "$headers"
# The bundle the page loads, from the static file server, cached for good
main=$(printf '%s\n' "$home" | grep -o -E '<script src="main-[^"]+\.js"' | head -1 | cut -d'"' -f2)
if [ -n "$main" ]; then
  expect 200 "/$main"
  cache=$(curl -s -o /dev/null -D - --max-time 30 "$base/$main" | grep -i '^cache-control:' | tr -d '\r' || true)
  echo "/$main: $cache (expected immutable)"
  printf '%s\n' "$cache" | grep -q immutable || failed=1
else echo "/: no main-*.js script tag"; failed=1; fi
expect 200 /robots.txt
# www only redirects to the apex
www=$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' --max-time 30 https://www.freekmencke.com/ || true)
echo "www: $www (expected 301 $base/)"
[ "$www" = "301 $base/" ] || failed=1
exit "$failed"
