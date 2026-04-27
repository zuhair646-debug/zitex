"""
Source Code Downloader
──────────────────────
يسمح للـ owner بتصفّح وتحميل ملفات المشروع واحداً واحداً (لنقلها إلى GitHub repo خاص أو سيرفر آخر).

Security:
- يتطلب JWT للـ owner (نفس auth_dep في باقي الـ APIs)
- يقصر الوصول على whitelisted prefixes فقط (backend/, frontend/src/, frontend/public/, …)
- يمنع أي ملفات حسّاسة (.env, .git, node_modules, __pycache__, secrets)
- يمنع أي محاولة path traversal (..)
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import PlainTextResponse, StreamingResponse
from pathlib import Path
from typing import List, Dict, Any
import io
import zipfile
import time
import mimetypes


# Whitelisted top-level prefixes (relative to /app)
ALLOWED_PREFIXES = (
    "backend/",
    "frontend/src/",
    "frontend/public/",
    "frontend/package.json",
    "frontend/yarn.lock",
    "frontend/.env.example",
    "frontend/tailwind.config.js",
    "frontend/postcss.config.js",
    "frontend/craco.config.js",
    "frontend/jsconfig.json",
    "frontend/components.json",
    "backend/requirements.txt",
    "backend/.env.example",
    "README.md",
    "DEPLOY.md",
    "memory/PRD.md",
)

# Hard-blocked patterns — sensitive files / build artifacts / large dirs
BLOCKED_SUBSTRINGS = (
    ".git/",
    "node_modules/",
    "__pycache__/",
    ".pytest_cache/",
    ".DS_Store",
    "/build/",
    "/dist/",
    ".pyc",
    ".key",
    ".pem",
    ".zip",            # never include leftover zip artifacts
    "test_credentials",
    "credentials.json",
    "service-account",
    ".emergent/",
)


def _safe_resolve(rel_path: str) -> Path:
    """Resolve a relative path under /app safely. Raise 400 on traversal or 403 on blocked, 404 on missing."""
    if not rel_path or ".." in rel_path or rel_path.startswith("/"):
        raise HTTPException(400, "Invalid path")
    norm = rel_path.replace("\\", "/")
    # Block secret .env files (but allow .env.example, .env.template)
    if norm.endswith("/.env") or norm == ".env":
        raise HTTPException(403, "Blocked: .env file")
    for bad in BLOCKED_SUBSTRINGS:
        if bad in norm:
            raise HTTPException(403, f"Blocked path: {bad}")
    # Whitelist
    if not any(norm.startswith(prefix) for prefix in ALLOWED_PREFIXES):
        raise HTTPException(403, "Path not in allowed source tree")
    full = (Path("/app") / rel_path).resolve()
    if not str(full).startswith("/app/"):
        raise HTTPException(400, "Path outside /app")
    if not full.exists():
        raise HTTPException(404, "File not found")
    return full


def _is_secret_env(rel_path: str) -> bool:
    """Returns True iff this is an actual secret .env (not .env.example/.template)."""
    p = rel_path.replace("\\", "/")
    return p.endswith("/.env") or p == ".env"


def init_routes(database, auth_dep) -> APIRouter:
    r = APIRouter(prefix="/source", tags=["source"])

    @r.get("/manifest")
    async def _manifest(current_user: dict = Depends(auth_dep)):
        """
        Owner-only — return the full file tree (relative paths + sizes) of the codebase
        for download. Excludes any sensitive/blocked file.
        """
        if current_user.get("role") != "owner":
            raise HTTPException(403, "Owner access only")
        root = Path("/app")
        out: List[Dict[str, Any]] = []
        for prefix in ALLOWED_PREFIXES:
            full = root / prefix
            if full.is_file():
                out.append({
                    "path": prefix,
                    "size": full.stat().st_size,
                    "type": "file",
                })
                continue
            if not full.is_dir():
                continue
            for fp in full.rglob("*"):
                if not fp.is_file():
                    continue
                rel = str(fp.relative_to(root)).replace("\\", "/")
                if any(bad in rel for bad in BLOCKED_SUBSTRINGS):
                    continue
                if _is_secret_env(rel):
                    continue
                try:
                    sz = fp.stat().st_size
                except Exception:
                    continue
                # Skip very large files (>2 MB) — likely binary assets
                if sz > 2 * 1024 * 1024:
                    continue
                out.append({"path": rel, "size": sz, "type": "file"})
        # Sort by path for stable order
        out.sort(key=lambda x: x["path"])
        return {"files": out, "total": len(out), "root": "/app"}

    @r.get("/file")
    async def _file(
        path: str = Query(..., description="Relative path under /app (e.g. backend/server.py)"),
        current_user: dict = Depends(auth_dep),
    ):
        """Owner-only — return the raw text content of a single source file."""
        if current_user.get("role") != "owner":
            raise HTTPException(403, "Owner access only")
        full = _safe_resolve(path)
        try:
            text = full.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            raise HTTPException(415, "Binary file — not downloadable as text")
        # Determine content-type for browser hint
        ctype, _ = mimetypes.guess_type(str(full))
        if not ctype or not ctype.startswith("text/"):
            ctype = "text/plain; charset=utf-8"
        return PlainTextResponse(content=text, media_type=ctype)

    @r.get("/info")
    async def _info(
        path: str = Query(...),
        current_user: dict = Depends(auth_dep),
    ):
        """Owner-only — return metadata for a single file (size, lines, mtime)."""
        if current_user.get("role") != "owner":
            raise HTTPException(403, "Owner access only")
        full = _safe_resolve(path)
        st = full.stat()
        try:
            text = full.read_text(encoding="utf-8")
            lines = text.count("\n") + (0 if text.endswith("\n") else 1)
        except Exception:
            lines = 0
        return {
            "path": path,
            "size": st.st_size,
            "lines": lines,
            "mtime": int(st.st_mtime),
        }

    # ─────────────────────────────────────────────────────────────────
    # ZIP exports — bulk download whole project or specific folder
    # ─────────────────────────────────────────────────────────────────
    def _build_zip(prefix_filter: str = "") -> bytes:
        """
        Walk the allowed prefixes (optionally restricted to a single one) and
        zip every safe file into an in-memory archive. Returns the bytes.
        """
        root = Path("/app")
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
            for prefix in ALLOWED_PREFIXES:
                if prefix_filter and not prefix.startswith(prefix_filter):
                    continue
                full = root / prefix
                if full.is_file():
                    rel = prefix
                    if any(bad in rel for bad in BLOCKED_SUBSTRINGS) or _is_secret_env(rel):
                        continue
                    try:
                        zf.write(full, arcname=rel)
                    except Exception:
                        pass
                    continue
                if not full.is_dir():
                    continue
                for fp in full.rglob("*"):
                    if not fp.is_file():
                        continue
                    rel = str(fp.relative_to(root)).replace("\\", "/")
                    if prefix_filter and not rel.startswith(prefix_filter):
                        continue
                    if any(bad in rel for bad in BLOCKED_SUBSTRINGS) or _is_secret_env(rel):
                        continue
                    try:
                        if fp.stat().st_size > 5 * 1024 * 1024:
                            continue
                        zf.write(fp, arcname=rel)
                    except Exception:
                        continue
        return buf.getvalue()

    @r.get("/zip")
    async def _zip_all(current_user: dict = Depends(auth_dep)):
        """Owner-only — full project ZIP, ready to push to GitHub or upload to a server."""
        if current_user.get("role") != "owner":
            raise HTTPException(403, "Owner access only")
        data = _build_zip()
        ts = time.strftime("%Y%m%d-%H%M%S")
        return StreamingResponse(
            io.BytesIO(data),
            media_type="application/zip",
            headers={
                "Content-Disposition": f'attachment; filename="zitex-{ts}.zip"',
                "Content-Length": str(len(data)),
            },
        )

    @r.get("/zip-folder")
    async def _zip_folder(
        prefix: str = Query(..., description="Folder prefix (e.g. 'backend/' or 'frontend/src/')"),
        current_user: dict = Depends(auth_dep),
    ):
        """Owner-only — ZIP of a single folder/prefix."""
        if current_user.get("role") != "owner":
            raise HTTPException(403, "Owner access only")
        prefix = prefix.strip().rstrip("/") + "/"
        if not any(p.startswith(prefix) or prefix.startswith(p) for p in ALLOWED_PREFIXES):
            raise HTTPException(400, "Prefix not in allowed source tree")
        data = _build_zip(prefix_filter=prefix)
        if not data or len(data) < 22:  # empty zip header is 22 bytes
            raise HTTPException(404, "No files matched this prefix")
        ts = time.strftime("%Y%m%d-%H%M%S")
        safe = prefix.replace("/", "-").rstrip("-") or "all"
        return StreamingResponse(
            io.BytesIO(data),
            media_type="application/zip",
            headers={
                "Content-Disposition": f'attachment; filename="zitex-{safe}-{ts}.zip"',
                "Content-Length": str(len(data)),
            },
        )

    return r
