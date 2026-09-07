from __future__ import annotations

import datetime
import hashlib
import hmac
import json
import logging
import os
import shutil
import subprocess
import tarfile
from functools import lru_cache
from http import HTTPStatus
from pathlib import Path
from tempfile import mkdtemp
from typing import Any

import oras.client
import oras.container
from fastapi import BackgroundTasks, HTTPException, UploadFile
from filelock import FileLock
from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger("uvicorn.error")

_DB_LOCK = FileLock("/tmp/trivy-db.lock", timeout=600)
SHA_STRING = "sha256:"


@lru_cache
def get_trivy_version() -> str:
    try:
        result = subprocess.run(
            (get_settings().BINARY, "--version"),
            capture_output=True,
            text=True,
            check=True,
        )
        # Example output: "Version: 0.68.2\n..."
        for line in result.stdout.splitlines():
            if line.startswith("Version:"):
                return line.split(":", 1)[1].strip()
    except (OSError, subprocess.SubprocessError):
        logger.warning("Failed to determine Trivy version", exc_info=True)
    return "unknown"


def safe_extract(tar: tarfile.TarFile, path: str) -> None:
    """tar.extractall is vulnerable to relative path relative.

    See [here](https://docs.python.org/3/library/tarfile.html#tarfile-extraction-filter)

    :param tar: tarfile to extract
    :param path: the target to extract to
    """
    base = Path(path).resolve()

    for member in tar.getmembers():
        # Create a PurePath where relative links `..` are resolved
        member_path = (base / member.name).resolve()

        if not member_path.is_relative_to(base):
            raise HTTPException(400, "Invalid tar contents")

    return tar.extractall(path)


class Settings(BaseSettings):
    """Settings to define trivy's behaviour

    :param BaseSettings: Default template object.
    """

    model_config = SettingsConfigDict(env_prefix="TRIVY_")

    BINARY: str = "/usr/local/bin/trivy"
    TEMP_DIR: str = "/tmp"
    CACHE_DIR: str = f"{TEMP_DIR}/trivy"

    DB_DIR: str = f"{CACHE_DIR}/db"

    # Default trivy database on Github.
    DB_HOSTNAME: str = "ghcr.io"
    DB_IMAGE: str = f"{DB_HOSTNAME}/aquasecurity/trivy-db:2"

    DB_TLS_VERIFY: bool | str = True
    DB_INSECURE: bool = False

    DB_USERNAME: str | None = None
    DB_PASSWORD: SecretStr | None = None

    CREATE_TIMEOUT_SECONDS: int = 900

    SCAN_TIMEOUT_SECONDS: int = 60


@lru_cache
def get_settings() -> Settings:
    """Loads some environment variables for trivy.

    :return: Evaluated Settings from config file.
    """
    return Settings()


def create_sbom(tempfile: str, blob_digest: str) -> None:
    """Prompt trivy to create an SBOM given an unpacked filesystem.

    Vulnerability scanning doesn't occur at this point but a Bill of Materials is gathered so they can be scanned later.

    :param tempfile: the target file to store unscanned sboms
    :param blob_digest: the digest of the blob to create an sbom
    """
    cached_sbom = f"{get_settings().TEMP_DIR}/{blob_digest}-master.json"

    args = (
        get_settings().BINARY,
        "rootfs",
        "--skip-db-update",
        "--skip-java-db-update",
        "--offline-scan",
        "--no-progress",
        "--format",
        "cyclonedx",
        "--cache-dir",
        get_settings().CACHE_DIR,
        "--output",
        cached_sbom,
        tempfile,
        "--quiet",
    )
    logger.info("Scanning SBOM (SHA256:%s) using Trivy", blob_digest)

    try:
        subprocess.run(
            args,
            capture_output=True,
            text=True,
            timeout=get_settings().CREATE_TIMEOUT_SECONDS,
            check=True,
        )

    except subprocess.TimeoutExpired as exception:
        logger.error("Trivy timed out: %s", exception)
        raise HTTPException(
            status_code=HTTPStatus.REQUEST_TIMEOUT,
            detail="Trivy scan timed out",
        ) from exception

    except subprocess.CalledProcessError as exception:
        logger.error(
            "Trivy failed (exit=%s): %s",
            exception.returncode,
            exception.stderr,
        )
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
            detail="Trivy failed creating sbom",
        ) from exception


def scan_sbom(blob_digest: str) -> Any:
    """Use trivy's vulnerability database to query the most up to date vulnerabilities

    :param blob_digest: the digest of the blob contents
    """
    cached_sbom = f"{get_settings().TEMP_DIR}/{blob_digest}-master.json"
    sbom_target = f"{get_settings().TEMP_DIR}/{blob_digest}.json"
    args = (
        get_settings().BINARY,
        "sbom",
        "--scanners",
        "vuln",
        cached_sbom,
        "--skip-db-update",
        "--skip-java-db-update",
        "--offline-scan",
        "--no-progress",
        "--format",
        "json",
        "--cache-dir",
        get_settings().CACHE_DIR,
        "--output",
        sbom_target,
        "--quiet",
    )

    logger.info("Scanning SBOM (SHA256:%s) using Trivy", blob_digest)

    try:
        subprocess.run(
            args,
            capture_output=True,
            text=True,
            timeout=get_settings().SCAN_TIMEOUT_SECONDS,
            check=True,
        )
        with open(sbom_target, encoding="utf-8") as f:
            sbom = json.load(f)

    except FileNotFoundError as exception:
        logger.error("SBOM (SHA256:%s) couldn't be found", blob_digest)
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR.value,
            detail="There was a problem with retrieving the SBOM",
        ) from exception

    except subprocess.TimeoutExpired as exception:
        logger.error("Trivy timed out: %s", exception)
        raise HTTPException(
            status_code=HTTPStatus.REQUEST_TIMEOUT,
            detail="Trivy scan timed out",
        ) from exception

    except subprocess.CalledProcessError as exception:
        logger.error(
            "Trivy failed (exit=%s): %s",
            exception.returncode,
            exception.stderr,
        )
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
            detail="Trivy failed during scanning",
        ) from exception

    return sbom


def _login_to_database_registry(client: oras.client.OrasClient, settings: Settings) -> None:
    """Log in to the configured database registry when credentials are provided."""
    if settings.DB_USERNAME and settings.DB_PASSWORD:
        client.login(
            username=settings.DB_USERNAME,
            password=settings.DB_PASSWORD.get_secret_value(),
            tls_verify=settings.DB_TLS_VERIFY is not False,
            hostname=settings.DB_HOSTNAME,
        )


def _download_and_extract_layers(
    client: oras.client.OrasClient,
    container: oras.container.Container,
    layers: list[dict[str, str]],
    staging_dir: str,
) -> None:
    """Download, verify, and safely extract each OCI layer into the staging directory."""
    for layer in layers:
        digest = layer["digest"]
        outfile = os.path.join(staging_dir, digest.replace(SHA_STRING, "") + ".tar")

        client.download_blob(container, digest, outfile)

        # Verify downloaded blob matches the digest from the manifest.
        verify_file_sha256(outfile, digest)

        logger.info("Extracting file %s into %s", outfile, staging_dir)
        with tarfile.open(outfile) as tarf:
            safe_extract(tarf, staging_dir)

        os.remove(outfile)


def _replace_database_dir(staging_dir: str, db_dir: str) -> None:
    """Replace the existing database directory with the fully prepared staging directory."""
    if os.path.exists(db_dir):
        shutil.rmtree(db_dir)

    os.rename(staging_dir, db_dir)


def verify_file_sha256(file_path: str, expected_digest: str) -> None:
    """Verify that a file's SHA-256 hash matches the expected digest.

    :param file_path: path to the file to verify
    :param expected_digest: expected digest in the form "sha256:<hex>" or plain hex
    :raises RuntimeError: if the computed digest does not match
    """
    expected_hex = expected_digest.removeprefix(SHA_STRING)
    sha = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(8192):
            sha.update(chunk)
    actual_hex = sha.hexdigest()
    if not hmac.compare_digest(actual_hex, expected_hex):
        raise RuntimeError(f"SHA-256 mismatch for {file_path}: expected {expected_hex}, got {actual_hex}")


def download_database():
    """Download, verify, and atomically install the Trivy database using the ORAS API.

    Trivy updates their database every 6 hours. Decompressed it's about 1GB

    https://trivy.dev/docs/latest/guide/advanced/self-hosting/#__tabbed_1_1
    """
    with _DB_LOCK:
        settings = get_settings()
        logger.info("Pulling trivy database via Oras API (image=%s)", settings.DB_IMAGE)
        client = oras.client.OrasClient(settings.DB_HOSTNAME, settings.DB_INSECURE, settings.DB_TLS_VERIFY)
        _login_to_database_registry(client, settings)

        # Fetch the OCI manifest to get layer digests for SHA-256 verification.
        # Use get_manifest + download_blob instead of client.pull() to verify
        # each layer's hash against the manifest before extracting.
        container = oras.container.Container(settings.DB_IMAGE)
        manifest = client.get_manifest(container)
        layers = manifest.get("layers", [])
        if not layers:
            raise RuntimeError(f"OCI manifest for {settings.DB_IMAGE} contains no layers")

        # Extract into staging dir so the live `DB_DIR` is never left in a half-updated state.
        # On success, atomically swap it in; on failure cleanup staging dir and leave old DB intact.
        db_parent = str(Path(settings.DB_DIR).parent)
        os.makedirs(db_parent, exist_ok=True)
        staging_dir = mkdtemp(dir=db_parent)
        try:
            _download_and_extract_layers(client, container, layers, staging_dir)
            _replace_database_dir(staging_dir, settings.DB_DIR)
        except Exception:
            shutil.rmtree(staging_dir, ignore_errors=True)
            raise


def _read_next_update() -> datetime.datetime | None:
    """Read NextUpdate from metadata.json without acquiring the DB lock."""
    try:
        with open(os.path.join(get_settings().DB_DIR, "metadata.json"), encoding="utf-8") as f:
            metadata = json.load(f)
    except FileNotFoundError:
        return None
    ts = metadata.get("NextUpdate")
    if not ts:
        return None
    dt = datetime.datetime.fromisoformat(ts)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=datetime.timezone.utc)
    return dt


def get_next_update() -> datetime.datetime | None:
    """Returns the next scheduled DB update time, reading metadata.json under lock."""
    with _DB_LOCK:
        return _read_next_update()


def scan(upload_file: UploadFile, background_tasks: BackgroundTasks, block_size: int = 1024) -> Any:
    """Scan an image blob from the registry

    :param upload_file: packed and compressed overlay filesystem to be scanned
    :param background_tasks: background tasks to carry out after the response is executed.
    :param block_size: chunk size for reading the file into memory
    """
    file = upload_file.file
    filename = upload_file.filename
    logger.info("Getting sha256 hash of the blob for caching")
    blob_hash = hashlib.sha256()

    while data := file.read(block_size):
        blob_hash.update(data)
    file.seek(0)
    blob_digest = blob_hash.hexdigest()

    if blob_digest != filename:
        logger.error("Calculated digest %s does not match expected digest %s", blob_digest, filename)
        raise HTTPException(
            status_code=HTTPStatus.BAD_REQUEST.value,
            detail=f"Uploaded blob {filename} did not match expected digest",
        )

    if not Path(
        f"{get_settings().TEMP_DIR}/{blob_digest}-master.json",
    ).is_file():
        working_dir = mkdtemp()
        try:
            if tarfile.is_tarfile(file):
                with tarfile.open(fileobj=file, bufsize=block_size) as tarf:
                    safe_extract(tarf, path=working_dir)
        except tarfile.ReadError as exception:
            logger.exception("Failed to extract blob %s", blob_digest)
            raise HTTPException(
                status_code=HTTPStatus.INTERNAL_SERVER_ERROR.value,
                detail=f"An error occurred while extracting image layer: {exception}",
            ) from exception
        create_sbom(working_dir, blob_digest)
        logger.info(
            "Cleaning up unpacked filesystem %s SHA256:%s",
            working_dir,
            blob_digest,
        )
        background_tasks.add_task(shutil.rmtree, working_dir, ignore_errors=True)
    else:
        logger.info(
            "SBOM (SHA256:%s) is already cached. Skipping unpack.",
            blob_digest,
        )

    # Check if the DB needs refreshing. _DB_LOCK is held only for the
    # metadata read so concurrent scans aren't blocked.
    with _DB_LOCK:
        next_update = _read_next_update()
    if next_update is not None and next_update < datetime.datetime.now(datetime.timezone.utc):
        background_tasks.add_task(download_database)

    return scan_sbom(blob_digest)
