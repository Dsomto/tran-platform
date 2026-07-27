#!/usr/bin/env python3
"""Read one public Stage 5 Drive submission into a local grading workspace."""

import codecs
import html
import io
import json
import re
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path
from urllib.parse import quote
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
BATCH = ROOT / "marking-guides" / "stage5-all-batch.json"
CACHE = Path("/tmp/stage5-grade")
MAX_FILES = 600
MAX_EXTRACTED_FILES = 300
MAX_FOLDER_DEPTH = 8
MAX_TEXT_BYTES = 80_000_000
MAX_TOTAL_TEXT_BYTES = 400_000_000
MAX_DOWNLOAD_BYTES = 200_000_000
SHARED_SOC_SOURCE_NAMES = {
    "auth.jsonl",
    "dns.jsonl",
    "endpoint.jsonl",
    "firewall.jsonl",
    "web.jsonl",
}
IGNORED_DIRECTORY_NAMES = {
    ".git",
    ".mypy_cache",
    ".pytest_cache",
    ".ruff_cache",
    ".venv",
    "__pycache__",
    "node_modules",
    "venv",
    "archive",
}

FOLDER_MIME = "application/vnd.google-apps.folder"
GOOGLE_DOC = "application/vnd.google-apps.document"
GOOGLE_SHEET = "application/vnd.google-apps.spreadsheet"
GOOGLE_SLIDES = "application/vnd.google-apps.presentation"
DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

TEXT_EXTENSIONS = {
    ".c", ".conf", ".cpp", ".cs", ".css", ".csv", ".env.example", ".go",
    ".h", ".html", ".ini", ".java", ".js", ".json", ".jsonl", ".jsx",
    ".log", ".md", ".mjs", ".ps1", ".py", ".rb", ".rego", ".rs", ".sh",
    ".sql", ".toml", ".ts", ".tsx", ".txt", ".xml", ".yaml", ".yml",
}
TEXT_NAMES = {
    "dockerfile", "makefile", "procfile", "requirements.txt",
    "manifest.sha256",
}


def run(args):
    return subprocess.run(args, capture_output=True, check=False)


def curl(url):
    result = run([
        "curl", "-L", "--retry", "1", "--retry-delay", "1",
        "--connect-timeout", "5", "--max-time", "180",
        "--max-filesize", str(MAX_DOWNLOAD_BYTES), "-sS", url,
    ])
    return result.stdout


def safe_name(name):
    value = html.unescape(name).replace("\\u003c", "<").replace("\\u003e", ">")
    value = re.sub(r"[/:\x00]+", "_", value)
    return re.sub(r"\s+", " ", value).strip() or "untitled"


def extract_folder_id(url):
    match = re.search(r"/folders/([A-Za-z0-9_-]+)", url or "")
    return match.group(1) if match else None


def parse_drive_folder(page):
    items = []
    match = re.search(r"window\['_DRIVE_ivd'\] = '([^']*)'", page)
    if match:
        encoded = match.group(1).replace("\\/", "/")
        decoded = codecs.decode(encoded, "unicode_escape")
        for file_id, _parent, name, mime in re.findall(
            r'\["([A-Za-z0-9_-]{20,})",\["([A-Za-z0-9_-]{20,})"\],"([^"]+)","([^"]+)"',
            decoded,
        ):
            items.append({
                "id": file_id,
                "name": safe_name(name),
                "mime": mime.replace("\\/", "/"),
            })
    seen = set()
    unique = []
    for item in items:
        if item["id"] in seen:
            continue
        seen.add(item["id"])
        unique.append(item)
    return unique


def docx_to_text(data):
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        root = ET.fromstring(archive.read("word/document.xml"))
    namespace = {
        "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
    }
    paragraphs = []
    for paragraph in root.findall(".//w:p", namespace):
        text = "".join(
            node.text or "" for node in paragraph.findall(".//w:t", namespace)
        )
        if text.strip():
            paragraphs.append(text)
    return "\n".join(paragraphs).encode()


def pdf_to_text(data, output_path):
    pdf_path = (
        output_path
        if output_path.suffix.lower() == ".pdf"
        else output_path.with_name(f"{output_path.name}.pdf")
    )
    pdf_path.write_bytes(data)
    # Some candidates deliver a plain-text file with a .pdf extension. It isn't a
    # real PDF, so pdftotext/pypdf fail — but the content is right there. If the
    # bytes aren't a real PDF (no %PDF header) and decode cleanly as text, use them.
    if not data.lstrip()[:5].startswith(b"%PDF"):
        try:
            decoded = data.decode("utf-8")
            if decoded.strip():
                return decoded.encode()
        except UnicodeDecodeError:
            pass
    pdftotext_bin = shutil.which("pdftotext") or next(
        (candidate for candidate in (
            "/opt/homebrew/bin/pdftotext",
            "/usr/local/bin/pdftotext",
            "/usr/bin/pdftotext",
        ) if Path(candidate).exists()),
        None,
    )
    if pdftotext_bin:
        result = run([pdftotext_bin, "-layout", str(pdf_path), "-"])
        if result.stdout:
            return result.stdout
    try:
        from pypdf import PdfReader

        text = "\n\n".join(
            page.extract_text() or ""
            for page in PdfReader(io.BytesIO(data)).pages
        )
        if text.strip():
            return text.encode()
        return b"[PDF text extraction returned no content; inspect the preserved PDF.]"
    except ImportError:
        return b"[PDF preserved locally; install pdftotext or pypdf before grading.]"
    except Exception as error:
        return (
            f"[PDF extraction failed: {type(error).__name__}; inspect the preserved PDF.]"
        ).encode()


def is_text_item(item):
    name = item["name"].lower()
    suffix = Path(name).suffix
    return (
        item.get("mime", "").startswith("text/")
        or suffix in TEXT_EXTENSIONS
        or name in TEXT_NAMES
        or item.get("mime") in {
            "application/json",
            "application/xml",
            "application/javascript",
            "application/x-sh",
            "application/x-python",
        }
    )


def fetch_file(item, output_path):
    file_id = item["id"]
    mime = item.get("mime", "")
    name = item["name"].lower()
    if mime == GOOGLE_DOC:
        return curl(
            f"https://docs.google.com/document/d/{file_id}/export?format=txt"
        )
    if mime == GOOGLE_SHEET:
        return curl(
            f"https://docs.google.com/spreadsheets/d/{file_id}/export?format=csv"
        )
    if mime == GOOGLE_SLIDES:
        pdf = curl(
            f"https://docs.google.com/presentation/d/{file_id}/export/pdf"
        )
        return pdf_to_text(pdf, output_path)

    data = curl(
        "https://drive.usercontent.google.com/download"
        f"?id={quote(file_id)}&export=download&confirm=t"
    )
    if mime == DOCX_MIME or name.endswith(".docx"):
        return docx_to_text(data)
    if mime == "application/pdf" or name.endswith(".pdf"):
        return pdf_to_text(data, output_path)
    return data


def walk_folder(folder_id, relative, seen_folders, collected, depth=0):
    if folder_id in seen_folders:
        return
    seen_folders.add(folder_id)
    page = curl(f"https://drive.google.com/drive/folders/{folder_id}").decode(
        "utf-8", "ignore"
    )
    items = parse_drive_folder(page)
    if not items:
        collected.append({
            "path": str(relative),
            "id": folder_id,
            "mime": FOLDER_MIME,
            "error": "Folder is empty, private, or could not be listed.",
        })
        return
    for item in sorted(items, key=lambda value: value["mime"] == FOLDER_MIME):
        if len(collected) >= MAX_FILES:
            return
        item_path = relative / safe_name(item["name"])
        if item["mime"] == FOLDER_MIME:
            if item_path.name.lower() in IGNORED_DIRECTORY_NAMES:
                continue
            if depth >= MAX_FOLDER_DEPTH:
                collected.append({
                    "path": str(item_path),
                    "id": item["id"],
                    "mime": FOLDER_MIME,
                    "error": "Nested folder exceeds the grading reader depth limit.",
                })
                continue
            walk_folder(
                item["id"],
                item_path,
                seen_folders,
                collected,
                depth + 1,
            )
        else:
            collected.append({**item, "path": str(item_path)})


def main():
    if len(sys.argv) != 2:
        print("usage: stage5_fetch.py REPORT_ID_OR_INDEX", file=sys.stderr)
        return 2
    batch = json.loads(BATCH.read_text())
    argument = sys.argv[1]
    row = batch[int(argument)] if argument.isdigit() else next(
        item for item in batch if item["reportId"] == argument
    )
    report_id = row["reportId"]
    output_dir = CACHE / report_id
    if output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True)
    (output_dir / "batch-item.json").write_text(
        json.dumps(row, indent=2), encoding="utf-8"
    )

    root_id = extract_folder_id(row.get("folderUrl"))
    if not root_id:
        manifest = {
            "reportId": report_id,
            "cannotOpen": True,
            "reason": "Submission is not a Google Drive folder URL.",
            "files": [],
        }
    else:
        files = []
        walk_folder(root_id, Path("."), set(), files)
        def file_priority(item):
            parts = Path(item["path"]).parts
            if not parts:
                return (4, item["path"].lower())
            return (
                0 if len(parts) == 1 else
                1 if parts[0].lower() in {
                    "recon_engine", "schemas", "tests",
                } else
                2 if parts[0].lower() == "evidence" else
                3,
                item["path"].lower(),
            )

        files.sort(key=file_priority)
        extracted = []
        combined = []
        total_text = 0
        extracted_files = 0
        for item in files:
            if item.get("error"):
                extracted.append(item)
                continue
            relative = Path(item["path"])
            local_base = output_dir / "files" / relative
            local_base.parent.mkdir(parents=True, exist_ok=True)
            lower_parts = {part.lower() for part in relative.parts}
            if (
                relative.name.lower() in SHARED_SOC_SOURCE_NAMES
                and "source" in lower_parts
            ):
                extracted.append({
                    **item,
                    "skipped": "official shared SOC source; use signed staff copy",
                })
                continue
            if not is_text_item(item) and item.get("mime") not in {
                GOOGLE_DOC, GOOGLE_SHEET, GOOGLE_SLIDES, DOCX_MIME,
                "application/pdf",
            }:
                extracted.append({
                    **item,
                    "skipped": "binary or unsupported file type",
                })
                continue
            if extracted_files >= MAX_EXTRACTED_FILES:
                extracted.append({
                    **item,
                    "skipped": "extracted-file safety limit reached",
                })
                continue
            try:
                text = fetch_file(item, local_base)
            except (KeyError, OSError, ValueError, ET.ParseError, zipfile.BadZipFile) as error:
                extracted.append({
                    **item,
                    "error": (
                        f"File extraction failed: {type(error).__name__}. "
                        "The remaining submission files were still assessed."
                    ),
                })
                continue
            if len(text) > MAX_TEXT_BYTES:
                text = text[:MAX_TEXT_BYTES] + b"\\n[TRUNCATED BY GRADING READER]\\n"
            if total_text + len(text) > MAX_TOTAL_TEXT_BYTES:
                extracted.append({
                    **item,
                    "skipped": "combined text safety limit reached",
                })
                continue
            total_text += len(text)
            extracted_files += 1
            is_converted = item.get("mime") in {
                GOOGLE_DOC, GOOGLE_SHEET, GOOGLE_SLIDES, DOCX_MIME,
                "application/pdf",
            } or item["name"].lower().endswith((".docx", ".pdf"))
            text_path = (
                local_base.with_name(local_base.name + ".txt")
                if is_converted
                else local_base
            )
            text_path.write_bytes(text)
            decoded = text.decode("utf-8", "replace")
            combined.append(
                f"\n\n===== FILE: {item['path']} =====\n{decoded}"
            )
            extracted.append({
                **item,
                "textPath": str(text_path),
                "bytes": len(text),
            })
        combined_path = output_dir / "combined.txt"
        combined_path.write_text("".join(combined), encoding="utf-8")
        manifest = {
            "reportId": report_id,
            "folderUrl": row.get("folderUrl"),
            "cannotOpen": not any(item.get("textPath") for item in extracted),
            "fileCount": len(files),
            "extractedCount": sum(
                1 for item in extracted if item.get("textPath")
            ),
            "combinedTextBytes": total_text,
            "combinedPath": str(combined_path),
            "files": extracted,
        }

    manifest_path = output_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(json.dumps({
        "reportId": report_id,
        "name": row["name"],
        "track": row["track"],
        "version": row["version"],
        "cannotOpen": manifest["cannotOpen"],
        "fileCount": manifest.get("fileCount", 0),
        "extractedCount": manifest.get("extractedCount", 0),
        "combinedTextBytes": manifest.get("combinedTextBytes", 0),
        "manifestPath": str(manifest_path),
        "combinedPath": manifest.get("combinedPath"),
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
