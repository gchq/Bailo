#!/usr/bin/env bash
# This script intentionally performs a lightweight set of heuristic checks to catch common style-guide violations in CI.
# It is not a full MDX or Markdown parser and does not attempt to validate every possible document structure or edge case.
#
# The checks are designed to provide fast feedback with a low maintenance cost.
# False positives and false negatives are possible, particularly for complex MDX content, unusual formatting, or constructs that span multiple lines.
#
# If additional validation requirements arise, prefer keeping the rules simple where possible and consider using a dedicated Markdown/MDX parser rather
# than continually increasing the complexity of this shell script.
set -euo pipefail

DOCS_DIR="frontend/pages/docs"
ERRORS=0
REPO_ROOT="$(pwd)"
DOCS_ABS="$REPO_ROOT/$DOCS_DIR"

EXCLUDE_FILES=(
  "$DOCS_DIR/markdown-examples.mdx"
  "$DOCS_DIR/style-guide.mdx"
)

is_excluded() {
  local file="$1"
  for excl in "${EXCLUDE_FILES[@]}"; do
    [[ "$file" == "$excl" ]] && return 0
  done
  return 1
}

error() {
  echo "ERROR: $1"
  ERRORS=$((ERRORS + 1))
}

mapfile -t MDX_FILES < <(find "$DOCS_DIR" -name '*.mdx' -type f | sort)

for file in "${MDX_FILES[@]}"; do
  is_excluded "$file" && continue

  file_dir="$(dirname "$file")"
  line_num=0
  h1_count=0
  has_common_questions=false
  has_docs_wrapper=false
  in_code_block=false

  while IFS= read -r line || [[ -n "$line" ]]; do
    line_num=$((line_num + 1))

    # Track fenced code blocks to avoid false positives
    if [[ "$line" =~ ^\`\`\` ]]; then
      if $in_code_block; then
        in_code_block=false
      else
        in_code_block=true
      fi
      continue
    fi
    $in_code_block && continue

    # Check H1 count
    if [[ "$line" =~ ^#[[:space:]][^#] ]]; then
      h1_count=$((h1_count + 1))
    fi

    # Check H4+ headings
    if [[ "$line" =~ ^#{4,}[[:space:]] ]]; then
      error "$file:$line_num: H4 or deeper heading found (style guide says no H4+)"
    fi

    # Check common questions callout
    if [[ "$line" =~ ^\> ]] && [[ "$line" =~ \*\*[Cc]ommon\ questions ]]; then
      has_common_questions=true
    fi

    # Check DocsWrapper export
    if [[ "$line" =~ export[[:space:]]+default ]] && [[ "$line" =~ DocsWrapper ]]; then
      has_docs_wrapper=true
    fi

    # Check Image tags have responsive style
    if [[ "$line" =~ \<Image[[:space:]] ]] && [[ ! "$line" =~ style= ]]; then
      error "$file:$line_num: <Image> missing style={{ width: '100%', height: 'auto' }}"
    fi

    # Check links (only outside code blocks)
    check_line="$line"
    link_re='\[([^]]+)\]\(([^)]+)\)'
    while [[ "$check_line" =~ $link_re ]]; do
      link_text="${BASH_REMATCH[1]}"
      link_target="${BASH_REMATCH[2]}"
      check_line="${check_line#*"${BASH_REMATCH[0]}"}"

      # Skip external links, anchors, autolinks, and non-MDX targets (.html, etc.)
      if [[ "$link_target" =~ ^https?:// ]] || [[ "$link_target" =~ ^# ]] \
        || [[ "$link_target" =~ ^\< ]] || [[ "$link_target" =~ \.[a-zA-Z]+$ ]]; then
        continue
      fi

      # Strip anchor from target
      link_target="${link_target%%#*}"
      # Strip query params
      link_target="${link_target%%\?*}"

      # Allow docs index page links such as "docs/getting-started/quick-start"
      if [[ "$file" == "$DOCS_DIR/index.mdx" ]] && [[ "$link_target" == docs/* ]]; then
        link_target="${link_target#docs/}"
      fi

      # Check for root-relative links
      if [[ "$link_target" =~ ^/ ]]; then
        error "$file:$line_num: Root-relative link '${link_target}' - use relative paths instead"
        continue
      fi

      # Check for "click here" link text
      if [[ "${link_text,,}" == "click here" ]]; then
        error "$file:$line_num: Link text 'click here' - use descriptive link text"
        continue
      fi

      # Resolve to absolute path and skip links outside the docs directory
      resolved_abs="$(realpath -m "$file_dir/$link_target" 2>/dev/null)"
      case "$resolved_abs" in
        "$DOCS_ABS"/*) ;;
        *) continue ;;
      esac

      if [[ ! -f "${resolved_abs}.mdx" ]] && [[ ! -f "${resolved_abs}/index.mdx" ]] && [[ ! -f "$resolved_abs" ]]; then
        error "$file:$line_num: Broken internal link '${link_target}' - no matching .mdx file found"
      fi
    done
  done < "$file"

  # Per-file checks
  if [[ $h1_count -eq 0 ]]; then
    error "$file: Missing H1 heading"
  elif [[ $h1_count -gt 1 ]]; then
    error "$file: Multiple H1 headings found ($h1_count)"
  fi

  if ! $has_common_questions; then
    error "$file: Missing common questions callout (expected '> Common questions...' block)"
  fi

  if ! $has_docs_wrapper; then
    error "$file: Missing DocsWrapper export"
  fi
done

if [[ $ERRORS -gt 0 ]]; then
  echo ""
  echo "Found $ERRORS style violation(s). See the style guide: $DOCS_DIR/style-guide.mdx"
  exit 1
else
  echo "All docs style checks passed."
  exit 0
fi
