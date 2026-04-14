#!/usr/bin/env bash

set -e

echo "🔐 Configuring npm for OIDC Provenance..."
npm config set provenance true

echo "📦 Scanning packages directory..."

for dir in packages/*; do
  # Ensure we are only looking at directories that have a package.json
  if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then

    # FILTER: Skip any directory that starts with "example-"
    if [[ "$basename $dir" == example-* ]]; then
      echo "⏭️  Skipping example app: $dir"
      continue
    fi

    echo "➡️  Publishing $dir..."

    # Enter the directory, publish, and catch already-published errors gracefully
    (cd "$dir" && npm publish --access public) || echo "⚠️ Skipped $dir (likely already published or private)"

  fi
done

echo "✅ Publish script completed."
