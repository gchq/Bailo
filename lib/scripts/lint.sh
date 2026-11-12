#!/usr/bin/env bash
# Lints backend and frontend in parallel, prefixing each output line with the project name.
# Run from the repository root. Exits non-zero if either project fails.

# Without pipefail, the exit status of the pipe below would be sed's, hiding lint failures.
set -o pipefail

lint_project() {
  local project="$1"
  npm --prefix "./${project}" run lint 2>&1 | sed "s/^/[${project}] /"
}

lint_project backend &
backend_pid=$!
lint_project frontend &
frontend_pid=$!

exit_code=0
wait "$backend_pid" || exit_code=$?
wait "$frontend_pid" || exit_code=$?

exit "$exit_code"
