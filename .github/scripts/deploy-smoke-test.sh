#!/usr/bin/env bash
# CD's smoke test (deploy.yml): checks the public site. Exits 1 when any check failed, after running them all.
# -e like GitHub's default `run` shell (bash -e), which a script run from it doesn't inherit
set -e

base=https://freekmencke.com
failed=0
expect() {
  status=$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 "$base$2" || true)
  echo "$2: $status (expected $1)"
  [ "$status" = "$1" ] || failed=1
}
home=$(curl -s --max-time 30 "$base/" || true)
if printf '%s\n' "$home" | grep -q '<title>Freek Mencke'; then echo "/: the page"; else echo "/: not the page"; failed=1; fi
# The bundle the page loads, from the static file server
main=$(printf '%s\n' "$home" | grep -o -E '<script src="main-[^"]+\.js"' | head -1 | cut -d'"' -f2)
if [ -n "$main" ]; then expect 200 "/$main"; else echo "/: no main-*.js script tag"; failed=1; fi
expect 200 /robots.txt
# www only redirects to the apex
www=$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' --max-time 30 https://www.freekmencke.com/ || true)
echo "www: $www (expected 301 $base/)"
[ "$www" = "301 $base/" ] || failed=1
exit "$failed"
