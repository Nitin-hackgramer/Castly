"""Compatibility shim package for deployments expecting the project to be named
"castly". This package simply ensures `uvicorn castly.asgi:application` will
work by placing the `backend` directory on `sys.path` and loading the Django
ASGI application from `voidx.settings`.
"""

__all__ = ["asgi"]
