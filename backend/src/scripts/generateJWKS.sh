#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'
umask 077
export LC_ALL=C

CERT_DIR="backend/certs"
PUBLIC_KEY_PEM="${CERT_DIR}/cert.pem"
JWKS_OUTPUT="${CERT_DIR}/jwks.json"

fatal() {
  echo "ERROR: $*" >&2
  exit 1
}

b64url_encode() {
  # Reads binary data from stdin, writes base64url (no padding)
  openssl base64 -A \
    | tr '+/' '-_' \
    | tr -d '='
}

# Extract RSA parameters
# Validate key and normalise
if grep -q "BEGIN CERTIFICATE" "$PUBLIC_KEY_PEM"; then
  PUBKEY_PEM="$(
    openssl x509 -in "$PUBLIC_KEY_PEM" -pubkey -noout 2>/dev/null
  )" || fatal "Failed to extract public key from certificate"
else
  PUBKEY_PEM="$(
    openssl pkey -pubin -in "$PUBLIC_KEY_PEM" -outform PEM 2>/dev/null
  )" || fatal "Invalid or unsupported public key"
fi

# Extract modulus (n) in hex
MODULUS_HEX="$(
  printf '%s\n' "$PUBKEY_PEM" \
    | openssl rsa -pubin -noout -modulus 2>/dev/null \
    | sed 's/^Modulus=//'
)" || fatal "Failed to extract RSA modulus"

# Extract exponent (e) in decimal
EXPONENT_DEC="$(
  printf '%s\n' "$PUBKEY_PEM" \
    | openssl rsa -pubin -text -noout 2>/dev/null \
    | awk '/Exponent:/ {print $2; exit}'
)" || fatal "Failed to extract RSA exponent"

# Convert RSA parameters to base64url
# Modulus: hex to binary to base64url
N="$(
  printf '%s' "$MODULUS_HEX" \
    | xxd -r -p \
    | b64url_encode
)"

# Exponent: decimal to hex to binary to base64url
E="$(
  printf '%x' "$EXPONENT_DEC" \
    | sed 's/^0/00/' \
    | xxd -r -p \
    | b64url_encode
)"

# Build JWK (without kid)
JWK_CORE="$(
  jq -n -c -S \
    --arg n "$N" \
    --arg e "$E" \
    '{
      kty: "RSA",
      n: $n,
      e: $e
    }'
)"

# Compute RFC 7638 thumbprint (kid)
KID="$(
  printf '%s' "$JWK_CORE" \
    | openssl dgst -sha256 -binary \
    | b64url_encode
)"

# Emit JWKS
JWKS_JSON="$(
  jq -n -c \
    --arg kid "$KID" \
    --argjson jwk "$JWK_CORE" \
    '{
      keys: [
        $jwk + { kid: $kid }
      ]
    }'
)"

# Atomic write
tmpfile="$(mktemp)"
printf '%s\n' "$JWKS_JSON" >"$tmpfile"
mv "$tmpfile" "$JWKS_OUTPUT"

echo "JWKS written to: $JWKS_OUTPUT"
