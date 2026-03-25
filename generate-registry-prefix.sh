#!/usr/bin/env bash
set -euo pipefail

# Args:
#   $1 = registry prefix (e.g. local mirror or pull‑through cache)
#   $2 = label for the new compose file (used for compose.<label>.yaml and Dockerfile.<label>)
# See https://gchq.github.io/Bailo/docs/administration/helm/isolated-environments or `frontend/pages/docs/administration/helm/isolated-environments.mdx` for further detail
USAGE_MESSAGE="Usage: $0 <registry-prefix> <label>}"
REGISTRY_PREFIX="${1:?$USAGE_MESSAGE}"
LABEL="${2:?$USAGE_MESSAGE}"

# Check if yq is installed
command -v yq >/dev/null 2>&1 || {
  echo "ERROR: 'yq' is required."
  exit 1
}

# Prefix non‑local images in a compose file
prefix_images () {
  yq -y '
    if .services then
      .services |= with_entries(
        if (.value.image | type == "string")
          and (.value.build | type == "object" | not)
        then
          .value.image |= "'"$REGISTRY_PREFIX"'/" + .
        else
          .
        end
      )
    else
      .
    end
  ' "$1"
}
# Process base & override, letting `docker compose` handle the merge
echo "Adding REGISTRY_PREFIX to 'compose.$LABEL.yaml'"
{
  prefix_images compose.yaml
  echo '---'
  prefix_images compose.override.yaml
  # Add other files here as needed
} > "compose.$LABEL.yaml"

rewrite_dockerfile () {
  local src="$1"
  local dst="$src.$LABEL"

  awk -v prefix="$REGISTRY_PREFIX/" '
    BEGIN { IGNORECASE=1 }

    # Track stage names: FROM image AS name
    /^FROM[[:space:]]+/ {
      image=$2

      if (NF >= 4 && toupper($3) == "AS") {
        stages[$4]=1
      }

      # Prefix only if image is not a previous stage
      if (!(image in stages) && image !~ prefix) {
        sub(image, prefix image)
      }
    }

    { print }
  ' "$src" > "$dst"
}
export -f rewrite_dockerfile

# Generate Dockerfile.<label> alongside each Dockerfile
git ls-files '**/Dockerfile' | while read -r df; do
  echo "Adding REGISTRY_PREFIX from '$df' to '$df.$LABEL'"
  rewrite_dockerfile "$df"
done

# Update compose to point at Dockerfile.<label> for local images
echo "Updating 'compose.$LABEL.yaml' to use new 'Dockerfile.$LABEL' files"
yq -y '
  if .services then
    .services |= with_entries(
      if (.value.image | type == "string")
         and (.value.build | type == "object")
      then
        .value.build.dockerfile = "Dockerfile.'"$LABEL"'"
      else
        .
      end
    )
  else
    .
  end
' "compose.$LABEL.yaml" > "compose.$LABEL.yaml.tmp" \
&& mv "compose.$LABEL.yaml.tmp" "compose.$LABEL.yaml"
