#!/usr/bin/env bash
# Compare [project].version in a pyproject.toml between a base commit and the working tree.
# Writes `changed=true|false` and `version=<new version>` to $GITHUB_OUTPUT.
#
# Usage: check-version-changed.sh <path/to/pyproject.toml> <base commit>
set -euo pipefail

PYPROJECT="$1"
BASE_COMMIT="$2"

read_version() {
  python3 -c 'import sys, tomllib; print(tomllib.load(sys.stdin.buffer)["project"].get("version", ""))'
}

echo "Base commit: $BASE_COMMIT"

# A missing base commit must fail rather than look like a new version and trigger a publish
if ! git cat-file -e "$BASE_COMMIT^{commit}" 2>/dev/null; then
  echo "Base commit '$BASE_COMMIT' is not available in this checkout" >&2
  exit 1
fi

# Empty when the file or a static version does not exist at the base commit. Parse errors still fail.
if git cat-file -e "$BASE_COMMIT:$PYPROJECT" 2>/dev/null; then
  OLD_VERSION=$(git show "$BASE_COMMIT:$PYPROJECT" | read_version)
else
  OLD_VERSION=""
fi

NEW_VERSION=$(read_version < "$PYPROJECT")
if [ -z "$NEW_VERSION" ]; then
  echo "No static [project].version in $PYPROJECT" >&2
  exit 1
fi

echo "OLD_VERSION=$OLD_VERSION"
echo "NEW_VERSION=$NEW_VERSION"

if [ "$OLD_VERSION" != "$NEW_VERSION" ]; then
  echo "Result: version has changed"
  echo "changed=true" >> "$GITHUB_OUTPUT"
else
  echo "Result: version has NOT changed"
  echo "changed=false" >> "$GITHUB_OUTPUT"
fi
echo "version=$NEW_VERSION" >> "$GITHUB_OUTPUT"
