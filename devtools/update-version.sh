#!/usr/bin/env bash
# Update the extension version in VERSION, package.json and package-lock.json.
#
# Usage:
#   devtools/update-version.sh <new-version>      # e.g. 0.2.0
#   devtools/update-version.sh major|minor|patch  # bump from the current VERSION
#   devtools/update-version.sh                    # sync all files to the current VERSION
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

current="$(tr -d '[:space:]' < VERSION)"
arg="${1:-$current}"

semver_re='^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$'

if ! [[ "$current" =~ $semver_re ]]; then
  echo "ERROR: VERSION contains an invalid version: '$current'" >&2
  exit 1
fi

IFS='.' read -r major minor patch <<< "${current%%[-+]*}"
case "$arg" in
  major) new="$((major + 1)).0.0" ;;
  minor) new="${major}.$((minor + 1)).0" ;;
  patch) new="${major}.${minor}.$((patch + 1))" ;;
  *)     new="${arg#v}" ;;
esac

if ! [[ "$new" =~ $semver_re ]]; then
  echo "ERROR: invalid version: '$new'" >&2
  echo "Usage: $0 [<x.y.z> | major | minor | patch]" >&2
  exit 1
fi

# npm updates package.json and both version fields in package-lock.json
# (top-level and packages[""]) without creating a git commit or tag.
npm version "$new" --no-git-tag-version --allow-same-version >/dev/null

printf '%s\n' "$new" > VERSION

echo "Version: $current -> $new"
echo "  VERSION           : $(cat VERSION)"
echo "  package.json      : $(node -p "require('./package.json').version")"
echo "  package-lock.json : $(node -p "const l=require('./package-lock.json'); l.version + ' / ' + l.packages[''].version")"

if ! grep -q "^## \[${new}\]" CHANGELOG.md; then
  echo "NOTE: CHANGELOG.md has no '## [${new}]' section yet (required by the release workflow)." >&2
fi
