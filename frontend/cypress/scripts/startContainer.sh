#!/bin/bash

# Podman provides a `docker` alias, so either CLI works here.
CONTAINER_CLI="${CONTAINER_CLI:-docker}"

"$CONTAINER_CLI" run -d -p 9999:9000 "$1"

echo "Starting container"
