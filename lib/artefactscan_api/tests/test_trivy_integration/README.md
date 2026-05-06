# Trivy Integration Test Files

These artefacts ensure the ArtefactScan API correctly orchestrates Trivy for image layer scanning without pulling the real Trivy vulnerability database or requiring network
access.

## fake_trivy.py

A lightweight executable stand‑in for the Trivy CLI. It supports:

- `--version`
- `rootfs` SBOM generation
- `sbom` vulnerability scanning and emits predictable JSON suitable for assertions.

## dummy_layer.tar

A minimal, valid tar archive representing a container image layer.

```bash
mkdir layer && echo "hello" > layer/file.txt
tar -cf dummy_layer.tar -C layer .
rm -rf layer
```
