from __future__ import annotations

import datetime
import hashlib
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
from fastapi import BackgroundTasks, HTTPException, UploadFile
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger("uvicorn.error")

__version__ = "0.68.2"


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
    DB_IMAGE: str = "ghcr.io/aquasecurity/trivy-db:2"

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
        "cyclonedx",
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


def download_database():
    """Download trivy database into a container using oras

    Trivy updates their database every 6 hours. Decompressed it's about 1GB

    https://trivy.dev/docs/latest/guide/advanced/self-hosting/#__tabbed_1_1
    """
    client = oras.client.OrasClient()
    logger.info("Pulling trivy database via Oras API")
    dbpaths = client.pull(target=get_settings().DB_IMAGE, outdir=get_settings().DB_DIR, overwrite=True)
    for path in dbpaths:
        logger.info("Extracting file %s into %s", path, get_settings().DB_DIR)
        with tarfile.open(path) as tarf:
            safe_extract(tarf, get_settings().DB_DIR)
        try:
            os.remove(path)
        except OSError:
            logger.warning("Was unable to remove %s", path)


def get_next_update() -> datetime.datetime | None:
    """Updates the next update time according to `metadata.json` in trivy"""
    try:
        with open(os.path.join(get_settings().DB_DIR, "metadata.json"), encoding="utf-8") as f:
            metadata = json.load(f)
    except FileNotFoundError:
        return None
    return datetime.datetime.fromisoformat(metadata.get("NextUpdate"))


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
        raise HTTPException(
            status_code=HTTPStatus.BAD_REQUEST.value,
            detail=f"Blob {filename} has been modified",
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

    # Download database if update available.
    next_update = get_next_update()
    if next_update is not None and next_update < datetime.datetime.now(datetime.timezone.utc):
        background_tasks.add_task(download_database)
    sbom = scan_sbom(blob_digest)

    return sbom
