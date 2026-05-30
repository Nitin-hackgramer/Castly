"""ASGI entrypoint compatibility shim.

This file makes the project importable as `castly.asgi` and exposes the
`application` object that Uvicorn expects. It adds the `backend` folder to
`sys.path` so the existing `voidx` Django package can be imported when the
process is started from the repository root (Render's default behaviour).
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

# Ensure the 'backend' directory is on the import path so `voidx` can be
# imported when uvicorn runs from the repository root.
ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Set DJANGO_SETTINGS_MODULE if not already set
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "voidx.settings")

from django.core.asgi import get_asgi_application

application = get_asgi_application()
