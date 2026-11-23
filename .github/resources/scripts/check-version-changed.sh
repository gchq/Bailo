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

# Empty when the file or a static version does not exist at the base commit
OLD_VERSION=$(git show "$BASE_COMMIT:$PYPROJECT" 2>/dev/null | read_version 2>/dev/null || echo "")
NEW_VERSION=$(read_version < "$PYPROJECT")
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
