#!/bin/sh
# Build the password-protected, noindex review copy into deploy/public, then ship it to Vercel.
set -e
cd "$(dirname "$0")"
rm -rf deploy/public && cp -R site deploy/public
STAGING=1 OUT=deploy/public python3 build.py
rm -f deploy/public/_headers
cd deploy && npx --yes vercel@latest deploy --prod "$@"
