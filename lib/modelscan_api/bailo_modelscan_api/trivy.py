from __future__ import annotations

import datetime
import hashlib
import json
import logging
import os
import subprocess
import tarfile
from functools import lru_cache
from http import HTTPStatus
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any

import oras.client
from fastapi import BackgroundTasks, HTTPException, UploadFile
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger("uvicorn.error")

__version__ = "0.68.2"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="TRIVY_")
    BINARY: str = "/usr/local/bin/trivy"
    CACHE_DIR: str = "/tmp/trivy"

    DB_DIR: str = "/tmp/trivy/db"

    # Default trivy database on Github.
    DB_IMAGE: str = "ghcr.io/aquasecurity/trivy-db:2"


@lru_cache
def get_settings() -> Settings:
    return Settings()


def create_sbom(tempfile: str, blob_hash: str) -> None:
    """Prompt trivy to create an SBOM given an unpacked filesystem.

    Vulnerability scanning doesn't occur at this point but a Bill of Materials is gathered so they can be scanned later.
    """
    cached_sbom = f"/tmp/{blob_hash}-master.json"

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

    try:
        if not Path(cached_sbom).is_file():
            logger.info("Scanning sbom using Trivy")
            subprocess.run(args, check=False)
            logger.error("Trivy was unable to create SBOM for %s", blob_hash)
    except FileNotFoundError:
        logger.error("SBOM %s couldn't be found", blob_hash)
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR.value,
            detail=f"There was a problem with creating the SBOM",
        )


def scan_sbom(blob_hash: str) -> Any:
    """Use trivy's vulnerability database to query the most up to date vulnerabilities"""
    cached_sbom = f"/tmp/{blob_hash}-master.json"
    sbom_target = f"/tmp/{blob_hash}.json"
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

    try:
        with open(sbom_target) as f:
            logger.info("Scanning sbom using Trivy")
            subprocess.run(args, check=False)
            sbom = json.load(f)
    except FileNotFoundError:
        logger.error("SBOM %s couldn't be found", blob_hash)
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR.value,
            detail=f"There was a problem with retrieving the SBOM",
        )
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
            tarf.extractall(path=get_settings().DB_DIR)
        try:
            os.remove(path)
        except OSError:
            logger.warning("Was unable to remove %s", path)


def get_next_update() -> datetime.datetime | None:
    try:
        with open(os.path.join(get_settings().DB_DIR, "metadata.json")) as f:
            metadata = json.load(f)
    except FileNotFoundError:
        return None
    return datetime.datetime.fromisoformat(metadata.get("NextUpdate"))


def scan(upload_file: UploadFile, background_tasks: BackgroundTasks, block_size: int = 1024) -> Any:
    file = upload_file.file
    filename = upload_file.filename
    """Scan an image blob"""
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
        f"/tmp/{blob_digest}-master.json",
    ).is_file():
        with TemporaryDirectory("wb", delete=False) as working_dir:
            dir_path = Path(working_dir)
            try:
                if tarfile.is_tarfile(file):
                    with tarfile.open(fileobj=file, bufsize=block_size) as tarf:
                        tarf.extractall(path=working_dir)
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
        background_tasks.add_task(Path.unlink, dir_path, missing_ok=True)
    else:
        logger.info(
            "SBOM (SHA256:%s) is already cached. Skipping unpack.",
            blob_digest,
        )

    # Download database if update available
    next_update = get_next_update()
    if next_update is None or next_update < datetime.datetime.now(datetime.timezone.utc):
        download_database()
    sbom = scan_sbom(blob_digest)

    return sbom
