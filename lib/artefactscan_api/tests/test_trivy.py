from __future__ import annotations

import hashlib
import os
import pathlib
import stat
import tarfile
from http import HTTPStatus
from io import BytesIO
from pathlib import Path
from subprocess import CalledProcessError
from unittest.mock import Mock, patch

import pytest
from bailo_artefactscan_api import trivy
from fastapi import BackgroundTasks, HTTPException, UploadFile

EMPTY_CONTENTS = b""
EMPTY_DIGEST = hashlib.sha256(EMPTY_CONTENTS).hexdigest()

# 32MiB of zero bytes compresses down to a few KB, i.e. a tar bomb.
BOMB_MEMBER_SIZE = 32 * 1024**2


def build_tar_bytes(members: dict[str, bytes], compress: bool = True) -> bytes:
    """Build an in-memory tar archive containing the given name to content mapping."""
    buffer = BytesIO()
    mode = "w:gz" if compress else "w"
    with tarfile.open(fileobj=buffer, mode=mode) as tar:
        for name, content in members.items():
            info = tarfile.TarInfo(name)
            info.size = len(content)
            tar.addfile(info, BytesIO(content))
    return buffer.getvalue()


def build_tar_bomb_bytes() -> bytes:
    """Build a small compressed archive that expands to a disproportionately large filesystem."""
    return build_tar_bytes({"bomb.bin": b"\0" * BOMB_MEMBER_SIZE})


def make_member(
    name: str, member_type: bytes = tarfile.REGTYPE, linkname: str = "", mode: int = 0o644
) -> tarfile.TarInfo:
    """Build a tar header for an arbitrary member type, e.g. a symlink or hardlink."""
    info = tarfile.TarInfo(name)
    info.type = member_type
    info.linkname = linkname
    info.mode = mode
    return info


def build_tar_from_members(members: list[tuple[tarfile.TarInfo, bytes | None]]) -> bytes:
    """Build an in-memory tar archive from explicit headers, so links and directories can be included."""
    buffer = BytesIO()
    with tarfile.open(fileobj=buffer, mode="w") as tar:
        for info, content in members:
            if content is None:
                tar.addfile(info)
            else:
                info.size = len(content)
                tar.addfile(info, BytesIO(content))
    return buffer.getvalue()


def build_cve_2025_4517_archive(dest: Path) -> bytes:
    """Build the CVE-2025-4517 PoC archive, which writes `pwned.txt` into the parent of `dest`.

    A chain of symlinks through long directory names pushes the resolved path beyond PATH_MAX, so `realpath` stops
    resolving and the escaping path appears to stay inside `dest`.
    """
    steps = "abcdefghijklmnop"
    component = "d" * ((4096 - len(str(dest))) // (len(steps) + 1))
    members: list[tuple[tarfile.TarInfo, bytes | None]] = []

    dir_path = ""
    step_path = ""
    for step in steps:
        members.append((make_member(os.path.join(dir_path, component), tarfile.DIRTYPE, mode=0o755), None))
        members.append((make_member(os.path.join(dir_path, step), tarfile.SYMTYPE, linkname=component), None))
        dir_path = os.path.join(dir_path, component)
        step_path = os.path.join(step_path, step)

    long_link_path = os.path.join(step_path, "l" * 254)
    members.append((make_member(long_link_path, tarfile.SYMTYPE, linkname=os.path.join(*[".."] * len(steps))), None))
    members.append((make_member("escape", tarfile.SYMTYPE, linkname=os.path.join(long_link_path, "..")), None))
    members.append((make_member("escape/pwned.txt"), b"pwned"))
    return build_tar_from_members(members)


def extract_archive(archive: bytes, target: Path) -> None:
    with (
        patch.object(trivy, "get_settings", return_value=trivy.Settings()),
        tarfile.open(fileobj=BytesIO(archive)) as tar,
    ):
        trivy.safe_extract(tar, str(target))


@pytest.mark.parametrize(
    ("file_name", "file_content"),
    [("deadbeef", EMPTY_CONTENTS)],
)
def test_scan_wrong_digest(file_name: str, file_content: bytes) -> None:
    with pytest.raises(HTTPException) as exception:
        trivy.scan(UploadFile(BytesIO(file_content), filename=file_name), BackgroundTasks([]))

    assert exception.value.status_code == HTTPStatus.BAD_REQUEST.value
    assert exception.value.detail == f"Uploaded blob {file_name} did not match expected digest"


@patch("subprocess.Popen")
def test_unable_to_create_sbom(mock_run: Mock) -> None:
    mock_run.side_effect = CalledProcessError(1, "trivy")
    with pytest.raises(HTTPException) as exception:
        trivy.create_sbom("tempfile", "deadbeef")

    assert exception.value.status_code == HTTPStatus.INTERNAL_SERVER_ERROR.value
    assert exception.value.detail == "Trivy failed creating sbom"


@patch("builtins.open")
def test_unable_to_find_sbom(mock_open: Mock) -> None:
    mock_open.side_effect = FileNotFoundError
    with pytest.raises(HTTPException) as exception:
        trivy.scan_sbom("deadbeef")

    assert exception.value.status_code == HTTPStatus.INTERNAL_SERVER_ERROR.value
    assert exception.value.detail == "There was a problem with retrieving the SBOM"


@patch("tarfile.is_tarfile")
@patch("tarfile.open")
def test_unable_to_extract_tar_file(
    mock_tarfile_istarfile: Mock,
    mock_tarfile_open: Mock,
) -> None:
    mock_tarfile_istarfile.return_value = True
    mock_tarfile_open.side_effect = tarfile.ReadError

    with patch.object(pathlib.Path, "is_file") as mock_isfile:
        mock_isfile.return_value = False
        with pytest.raises(HTTPException) as exception:
            trivy.scan(UploadFile(BytesIO(EMPTY_CONTENTS), filename=EMPTY_DIGEST), BackgroundTasks([]))

    assert exception.value.detail.startswith("An error occurred while extracting image layer:")


def test_verify_file_sha256_valid(tmp_path: Path) -> None:
    file = tmp_path / "test.bin"
    file.write_bytes(b"hello world")
    expected = "sha256:" + hashlib.sha256(b"hello world").hexdigest()
    trivy.verify_file_sha256(str(file), expected)


def test_verify_file_sha256_valid_plain_hex(tmp_path: Path) -> None:
    file = tmp_path / "test.bin"
    file.write_bytes(b"hello world")
    expected = hashlib.sha256(b"hello world").hexdigest()
    trivy.verify_file_sha256(str(file), expected)


def test_verify_file_sha256_mismatch(tmp_path: Path) -> None:
    file = tmp_path / "test.bin"
    file.write_bytes(b"hello world")
    with pytest.raises(RuntimeError, match="SHA-256 mismatch"):
        trivy.verify_file_sha256(str(file), "sha256:deadbeef")


@patch("bailo_artefactscan_api.trivy.oras.client.OrasClient")
@patch("bailo_artefactscan_api.trivy.oras.container.Container")
def test_download_database_verifies_digest(mock_container_cls: Mock, mock_client_cls: Mock, tmp_path: Path) -> None:
    content = b"fake tar content"
    digest = "sha256:" + hashlib.sha256(content).hexdigest()
    manifest = {"layers": [{"digest": digest, "mediaType": "application/vnd.oci.image.layer.v1.tar"}]}

    mock_client = mock_client_cls.return_value
    mock_client.get_manifest.return_value = manifest

    def fake_download(container: Mock, dig: str, outfile: str) -> str:
        os.makedirs(os.path.dirname(outfile), exist_ok=True)
        with open(outfile, "wb") as f:
            f.write(content)
        return outfile

    mock_client.download_blob.side_effect = fake_download

    settings = trivy.Settings(DB_DIR=str(tmp_path / "db"))

    with patch.object(trivy, "get_settings", return_value=settings), patch("tarfile.open") as mock_tar:
        mock_tar.return_value.__enter__ = Mock()
        mock_tar.return_value.__exit__ = Mock(return_value=False)
        with patch.object(trivy, "safe_extract"):
            trivy.download_database()

    assert os.path.isdir(str(tmp_path / "db")), "DB_DIR should exist after successful download"
    mock_container_cls.assert_called_once_with(settings.DB_IMAGE)
    mock_client.get_manifest.assert_called_once()
    mock_client.download_blob.assert_called_once()


@patch("bailo_artefactscan_api.trivy.oras.client.OrasClient")
def test_download_database_rejects_bad_digest(mock_client_cls: Mock, tmp_path: Path) -> None:
    manifest = {"layers": [{"digest": "sha256:expectedhash", "mediaType": "application/vnd.oci.image.layer.v1.tar"}]}

    mock_client = mock_client_cls.return_value
    mock_client.get_manifest.return_value = manifest

    def fake_download(container: Mock, dig: str, outfile: str) -> str:
        os.makedirs(os.path.dirname(outfile), exist_ok=True)
        with open(outfile, "wb") as f:
            f.write(b"corrupted content")
        return outfile

    mock_client.download_blob.side_effect = fake_download

    settings = trivy.Settings(DB_DIR=str(tmp_path / "db"))

    with (
        patch.object(trivy, "get_settings", return_value=settings),
        pytest.raises(RuntimeError, match="SHA-256 mismatch"),
    ):
        trivy.download_database()

    assert not os.path.exists(str(tmp_path / "db")), "DB_DIR should not be created on failure"


@patch("bailo_artefactscan_api.trivy.oras.client.OrasClient")
def test_download_database_rejects_empty_manifest(mock_client_cls: Mock, tmp_path: Path) -> None:
    mock_client = mock_client_cls.return_value
    mock_client.get_manifest.return_value = {"layers": []}

    settings = trivy.Settings(DB_DIR=str(tmp_path / "db"))

    with (
        patch.object(trivy, "get_settings", return_value=settings),
        pytest.raises(RuntimeError, match="contains no layers"),
    ):
        trivy.download_database()


@patch("bailo_artefactscan_api.trivy.oras.client.OrasClient")
def test_download_database_atomic_on_failure(mock_client_cls: Mock, tmp_path: Path) -> None:
    """If second layer fails, original DB_DIR stays intact."""
    good_content = b"good layer"
    good_digest = "sha256:" + hashlib.sha256(good_content).hexdigest()
    bad_digest = "sha256:badhash"
    manifest = {
        "layers": [
            {"digest": good_digest, "mediaType": "application/vnd.oci.image.layer.v1.tar"},
            {"digest": bad_digest, "mediaType": "application/vnd.oci.image.layer.v1.tar"},
        ]
    }

    mock_client = mock_client_cls.return_value
    mock_client.get_manifest.return_value = manifest

    call_count = 0

    def fake_download(container: Mock, dig: str, outfile: str) -> str:
        nonlocal call_count
        os.makedirs(os.path.dirname(outfile), exist_ok=True)
        with open(outfile, "wb") as f:
            call_count += 1
            f.write(good_content if call_count == 1 else b"corrupted")
        return outfile

    mock_client.download_blob.side_effect = fake_download

    db_dir = tmp_path / "db"
    db_dir.mkdir()
    sentinel = db_dir / "existing.txt"
    sentinel.write_text("original")

    settings = trivy.Settings(DB_DIR=str(db_dir))

    with patch.object(trivy, "get_settings", return_value=settings), patch("tarfile.open") as mock_tar:
        mock_tar.return_value.__enter__ = Mock()
        mock_tar.return_value.__exit__ = Mock(return_value=False)
        with patch.object(trivy, "safe_extract"), pytest.raises(RuntimeError, match="SHA-256 mismatch"):
            trivy.download_database()

    assert sentinel.read_text() == "original", "Original DB should be preserved on failure"


def test_safe_extract_rejects_oversized_archive(tmp_path: Path) -> None:
    """A tar bomb is rejected before any of its contents are written to disk."""
    target = tmp_path / "extracted"
    target.mkdir()
    settings = trivy.Settings(MAX_EXTRACT_BYTES=1024**2)

    with (
        patch.object(trivy, "get_settings", return_value=settings),
        tarfile.open(fileobj=BytesIO(build_tar_bomb_bytes())) as tar,
        pytest.raises(HTTPException) as exception,
    ):
        trivy.safe_extract(tar, str(target))

    assert exception.value.status_code == HTTPStatus.BAD_REQUEST.value
    assert exception.value.detail == "Invalid tar contents: extracted size exceeds limit"
    assert list(target.iterdir()) == [], "No archive contents should have been extracted"


def test_safe_extract_rejects_too_many_entries(tmp_path: Path) -> None:
    """An archive with an excessive number of members is rejected."""
    target = tmp_path / "extracted"
    target.mkdir()
    archive = build_tar_bytes({f"file-{index}.txt": b"x" for index in range(20)})
    settings = trivy.Settings(MAX_EXTRACT_ENTRIES=5)

    with (
        patch.object(trivy, "get_settings", return_value=settings),
        tarfile.open(fileobj=BytesIO(archive)) as tar,
        pytest.raises(HTTPException) as exception,
    ):
        trivy.safe_extract(tar, str(target))

    assert exception.value.status_code == HTTPStatus.BAD_REQUEST.value
    assert exception.value.detail == "Invalid tar contents: too many entries"
    assert len(list(target.iterdir())) == 5, "Only members within the entry limit should be extracted"


def test_safe_extract_allows_archive_within_limits(tmp_path: Path) -> None:
    """An archive comfortably within the limits extracts as normal."""
    target = tmp_path / "extracted"
    target.mkdir()
    archive = build_tar_bytes({"nested/hello.txt": b"hello world"})

    with (
        patch.object(trivy, "get_settings", return_value=trivy.Settings()),
        tarfile.open(fileobj=BytesIO(archive)) as tar,
    ):
        trivy.safe_extract(tar, str(target))

    assert (target / "nested/hello.txt").read_bytes() == b"hello world"


def test_scan_rejects_zip_bomb_and_cleans_up(tmp_path: Path) -> None:
    """An uploaded tar bomb is rejected and its tmp directory is removed."""
    archive = build_tar_bomb_bytes()
    digest = hashlib.sha256(archive).hexdigest()
    working_dir = tmp_path / "working"
    working_dir.mkdir()
    settings = trivy.Settings(TEMP_DIR=str(tmp_path), MAX_EXTRACT_BYTES=1024**2)

    with (
        patch.object(trivy, "get_settings", return_value=settings),
        patch.object(trivy, "mkdtemp", return_value=str(working_dir)),
        pytest.raises(HTTPException) as exception,
    ):
        trivy.scan(UploadFile(BytesIO(archive), filename=digest), BackgroundTasks([]))

    assert exception.value.status_code == HTTPStatus.BAD_REQUEST.value
    assert exception.value.detail == "Invalid tar contents: extracted size exceeds limit"
    assert not working_dir.exists(), "Tmp directory should be cleaned up when extraction fails"


@pytest.mark.parametrize("member_name", ["../escape.txt", "nested/../../escape.txt"])
def test_safe_extract_rejects_parent_traversal(tmp_path: Path, member_name: str) -> None:
    """A member whose name climbs out of the target directory is rejected."""
    target = tmp_path / "extracted"
    target.mkdir()
    archive = build_tar_from_members([(make_member(member_name), b"escaped")])

    with pytest.raises(HTTPException) as exception:
        extract_archive(archive, target)

    assert exception.value.status_code == HTTPStatus.BAD_REQUEST.value
    assert exception.value.detail == "Invalid tar contents"
    assert not (tmp_path / "escape.txt").exists()


def test_safe_extract_rejects_absolute_path(tmp_path: Path) -> None:
    """A member with an absolute name is rejected rather than written to that location."""
    target = tmp_path / "extracted"
    target.mkdir()
    outside_file = tmp_path / "absolute.txt"
    archive = build_tar_from_members([(make_member(str(outside_file)), b"escaped")])

    with pytest.raises(HTTPException) as exception:
        extract_archive(archive, target)

    assert exception.value.status_code == HTTPStatus.BAD_REQUEST.value
    assert exception.value.detail == "Invalid tar contents"
    assert not outside_file.exists()


def test_safe_extract_skips_symlink_escape(tmp_path: Path) -> None:
    """A symlink pointing outside the target is not created, so later members cannot be written through it."""
    target = tmp_path / "extracted"
    target.mkdir()
    outside_dir = tmp_path / "outside"
    outside_dir.mkdir()
    archive = build_tar_from_members(
        [
            (make_member("link", tarfile.SYMTYPE, linkname=str(outside_dir)), None),
            (make_member("link/pwned.txt"), b"pwned"),
        ]
    )

    extract_archive(archive, target)

    assert list(outside_dir.iterdir()) == [], "Nothing should be written outside the target directory"
    assert not (target / "link").is_symlink()
    assert (target / "link/pwned.txt").read_bytes() == b"pwned"


def test_safe_extract_skips_hardlink_overwrite(tmp_path: Path) -> None:
    """A hardlink to a file outside the target is not created, so a later member cannot overwrite that file."""
    target = tmp_path / "extracted"
    target.mkdir()
    outside_file = tmp_path / "authorized_keys"
    outside_file.write_bytes(b"original")
    archive = build_tar_from_members(
        [
            (make_member("hardlink", tarfile.LNKTYPE, linkname=str(outside_file)), None),
            (make_member("hardlink"), b"pwned"),
        ]
    )

    extract_archive(archive, target)

    assert outside_file.read_bytes() == b"original"
    assert (target / "hardlink").read_bytes() == b"pwned"
    assert (target / "hardlink").stat().st_ino != outside_file.stat().st_ino


def test_safe_extract_blocks_cve_2025_4517_symlink_chain(tmp_path: Path) -> None:
    """The CVE-2025-4517 PATH_MAX symlink chain cannot write outside the target directory."""
    target = tmp_path / "extracted"
    target.mkdir()
    archive = build_cve_2025_4517_archive(target)

    extract_archive(archive, target)

    assert not (tmp_path / "pwned.txt").exists(), "Payload should not escape the target directory"
    assert not any(path.is_symlink() for path in target.rglob("*")), "No symlinks should be extracted"


def test_safe_extract_strips_setuid(tmp_path: Path) -> None:
    """Privilege-escalating permission bits are removed from extracted files."""
    target = tmp_path / "extracted"
    target.mkdir()
    archive = build_tar_from_members([(make_member("setuid", mode=0o4755), b"binary")])

    extract_archive(archive, target)

    assert not (target / "setuid").stat().st_mode & stat.S_ISUID


def test_scan_rejects_traversal_and_cleans_up(tmp_path: Path) -> None:
    """An uploaded layer containing a traversal member is rejected and its tmp directory is removed."""
    archive = build_tar_from_members([(make_member("../escape.txt"), b"escaped")])
    digest = hashlib.sha256(archive).hexdigest()
    working_dir = tmp_path / "working"
    working_dir.mkdir()
    settings = trivy.Settings(TEMP_DIR=str(tmp_path))

    with (
        patch.object(trivy, "get_settings", return_value=settings),
        patch.object(trivy, "mkdtemp", return_value=str(working_dir)),
        pytest.raises(HTTPException) as exception,
    ):
        trivy.scan(UploadFile(BytesIO(archive), filename=digest), BackgroundTasks([]))

    assert exception.value.status_code == HTTPStatus.BAD_REQUEST.value
    assert exception.value.detail == "Invalid tar contents"
    assert not working_dir.exists(), "Tmp directory should be cleaned up when extraction fails"
    assert not (tmp_path / "escape.txt").exists()
