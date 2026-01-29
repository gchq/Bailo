from http import HTTPStatus
import logging
import subprocess
from tempfile import TemporaryDirectory
import tarfile
import os
from pathlib import Path
from typing import BinaryIO
from fastapi import HTTPException
import oras.client
import json
import hashlib
import datetime
from fastapi import BackgroundTasks

logger = logging.getLogger("uvicorn.error")

TRIVY_BIN = "/usr/local/bin/trivy"
CACHE_DIR = "/tmp/trivy"

TRIVYDB_FILE = "/tmp/trivy/db"

# Default trivy database.
TRIVYDB = "ghcr.io/aquasecurity/trivy-db:2"


def create_sbom(tempfile, blob_hash):
    """Prompt trivy to create an SBOM given an unpacked filesystem.

    Vulnerability scanning doesn't occur at this point but a Bill of Materials is gathered so they can be scanned later.
    """
    cached_sbom = f"/tmp/{blob_hash}-master.json"

    args = (
        TRIVY_BIN,
        "rootfs",
        "--skip-db-update",
        "--skip-java-db-update",
        "--offline-scan",
        "--no-progress",
        "--exit-code",
        "0",
        "--format",
        "cyclonedx",
        "--cache-dir",
        CACHE_DIR,
        "--output",
        cached_sbom,
        tempfile,
        "--quiet",
    )

    try:
        logger.info("Scanning sbom using Trivy")
        subprocess.run(args)
        if not Path(cached_sbom).is_file():
            logger.error("Trivy was unable to create SBOM for %s", blob_hash)
    except FileNotFoundError:
        logger.error("SBOM %s couldn't be found", blob_hash)
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR.value,
            detail=f"There was a problem with creating the SBOM",
        )


def scan_sbom(blob_hash):
    """Use trivy's vulnerability database to query the most up to date vulnerabilities"""
    cached_sbom = f"/tmp/{blob_hash}-master.json"
    sbom_target = f"/tmp/{blob_hash}.json"
    args = (
        TRIVY_BIN,
        "sbom",
        "--scanners",
        "vuln",
        cached_sbom,
        "--skip-db-update",
        "--skip-java-db-update",
        "--offline-scan",
        "--no-progress",
        "--exit-code",
        "0",
        "--format",
        "cyclonedx",
        "--cache-dir",
        CACHE_DIR,
        "--output",
        sbom_target,
        "--quiet",
    )

    try:
        logger.info("Scanning sbom using Trivy")
        subprocess.run(args)
        with open(sbom_target) as f:
            sbom = json.load(f)
    except FileNotFoundError:
        logger.error("SBOM %s couldn't be found", blob_hash)
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR.value,
            detail=f"There was a problem with retreving the SBOM",
        )
    return sbom


class TrivyClient:
    """A Class to scan image layers with trivy"""

    __version__ = "0.68.2"

    def __init__(self):
        if not Path(TRIVYDB_FILE).is_dir():
            self.download_database()
        else:
            self._update_metadata()

    def _update_metadata(self):
        with open(os.path.join(TRIVYDB_FILE, "metadata.json")) as f:
            metadata = json.load(f)
        self.next_update = datetime.datetime.fromisoformat(metadata.get("NextUpdate"))

    def download_database(self, image=TRIVYDB):
        """Download trivy database into a container using oras

        Trivy updates their database every 6 hours. Decompressed it's about 1GB

        https://trivy.dev/docs/latest/guide/advanced/self-hosting/#__tabbed_1_1
        """
        client = oras.client.OrasClient()
        logger.info("Pulling trivy database via Oras API")
        dbpaths = client.pull(target=image, outdir=TRIVYDB_FILE, overwrite=True)
        for path in dbpaths:
            logger.info("Extracting file %s into %s", path, TRIVYDB_FILE)
            with tarfile.open(path) as tarf:
                tarf.extractall(path=TRIVYDB_FILE)
            try:
                os.remove(path)
            except OSError:
                logger.warning("Was unable to remove %s", path)
        self._update_metadata()

    def scan_image_blob(
        self, file: BinaryIO, background_tasks: BackgroundTasks, filename: str | None, block_size: int = 1024
    ):
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

        # Download database if update avalible
        if self.next_update > datetime.datetime.now(datetime.timezone.utc):
            self.download_database()

        sbom = scan_sbom(blob_digest)

        return sbom
