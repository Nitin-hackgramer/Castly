"""Minimal Django settings for VoidX project"""

from datetime import datetime
from pathlib import Path
import environ
from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DEBUG=(bool, False),
    DB_HOST=(str, "localhost"),
    DB_PORT=(str, "5432"),
)
environ.Env.read_env(BASE_DIR / ".env")

ALLOWED_HOSTS = ["localhost", "https://castly-backend-r1e0.onrender.com"]
def required_env(key: str) -> str:
    value = env(key, default="")
    if value is None or str(value).strip() == "":
        raise ImproperlyConfigured(
            f"Missing required environment variable: {key}. "
            "Refusing to start to avoid unsafe election runtime behavior."
        )
    return value


# Hard-fail at startup when critical election secrets/config are missing.
# For database configuration we accept either a full `DATABASE_URL` (recommended
# for platforms like Render) OR the individual DB_* variables.
missing = []
for key in ("SECRET_KEY", "COUNTING_KEY", "ADMIN_TOKEN"):
    if not env(key, default="").strip():
        missing.append(key)
if missing:
    raise ImproperlyConfigured(
        "Missing required environment variables: "
        + ", ".join(missing)
        + ". Refusing to start."
    )

SECRET_KEY = required_env("SECRET_KEY")
COUNTING_KEY = required_env("COUNTING_KEY")
ADMIN_TOKEN = required_env("ADMIN_TOKEN")

# DATABASE: prefer DATABASE_URL if present (common on Render); otherwise
# fall back to DB_NAME/DB_USER/DB_PASSWORD checks below.
DATABASE_URL = env("DATABASE_URL", default="").strip()
if not DATABASE_URL:
    db_missing = [
        k
        for k in ("DB_NAME", "DB_USER", "DB_PASSWORD")
        if not env(k, default="").strip()
    ]
    if db_missing:
        raise ImproperlyConfigured(
            "Missing database configuration: provide DATABASE_URL or "
            + ", ".join(db_missing)
            + ". Refusing to start."
        )

DB_NAME = env("DB_NAME", default="").strip()
DB_USER = env("DB_USER", default="").strip()
DB_PASSWORD = env("DB_PASSWORD", default="").strip()

DEBUG = env("DEBUG") 

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "voters",
    "votes",
    "audit",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# Optionally enable WhiteNoise if installed so static files can be served
# directly by Django (helpful if you run `collectstatic` on the host).
try:
    import whitenoise  # type: ignore

    _whitenoise_available = True
except Exception:
    _whitenoise_available = False

if _whitenoise_available:
    try:
        idx = MIDDLEWARE.index("django.middleware.security.SecurityMiddleware") + 1
    except ValueError:
        idx = 0
    MIDDLEWARE.insert(idx, "whitenoise.middleware.WhiteNoiseMiddleware")

CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS", default=["http://localhost:5173", "https://castly-frontend-r1e0.onrender.com"]
)

ROOT_URLCONF = "voidx.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "voidx.wsgi.application"

# If running behind a proxy (Render sets X-Forwarded-Proto), ensure
# Django knows the request was secure.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Security defaults for production. When DEBUG=False these are enabled
# and help harden cookies and redirects.
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_SSL_REDIRECT = not DEBUG

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True
USE_L10N = True
USE_TZ = True

STATIC_URL = "/static/"
# Where `collectstatic` will gather files for production.
STATIC_ROOT = BASE_DIR / "staticfiles"

# Use WhiteNoise storage when available for compressed manifest files.
if "_whitenoise_available" in globals() and _whitenoise_available:
    STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"


if DATABASE_URL:
    # DATABASE_URL parsing via django-environ
    try:
        DATABASES = {"default": env.db()}
    except Exception:
        # Fallback to explicit variables if parsing fails
        DATABASES = {
            "default": {
                "ENGINE": "django.db.backends.postgresql",
                "NAME": DB_NAME,
                "USER": DB_USER,
                "PASSWORD": DB_PASSWORD,
                "HOST": env("DB_HOST"),
                "PORT": env("DB_PORT"),
            }
        }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": DB_NAME,
            "USER": DB_USER,
            "PASSWORD": DB_PASSWORD,
            "HOST": env("DB_HOST"),
            "PORT": env("DB_PORT"),
        }
    }

# Cache (for OTPs and tokens -- they auto-expire)
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}

# Django REST Framework settings
REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ]
}

# Recommended default for modern Django projects
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
