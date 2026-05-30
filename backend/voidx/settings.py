"""Minimal Django settings for VoidX project"""

from datetime import datetime
from pathlib import Path
import environ
from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DEBUG=(bool, True),
    DB_HOST=(str, "localhost"),
    DB_PORT=(str, "5432"),
)
environ.Env.read_env(BASE_DIR / ".env")


def required_env(key: str) -> str:
    value = env(key, default="")
    if value is None or str(value).strip() == "":
        raise ImproperlyConfigured(
            f"Missing required environment variable: {key}. "
            "Refusing to start to avoid unsafe election runtime behavior."
        )
    return value


# Hard fail at startup when critical election secrets/config are missing.
REQUIRED_ENV_KEYS = [
    "SECRET_KEY",
    "COUNTING_KEY",
    "ADMIN_TOKEN",
    "DB_NAME",
    "DB_USER",
    "DB_PASSWORD",
]

_missing_keys = [key for key in REQUIRED_ENV_KEYS if not env(key, default="").strip()]
if _missing_keys:
    raise ImproperlyConfigured(
        "Missing required environment variables: "
        + ", ".join(_missing_keys)
        + ". Refusing to start."
    )

SECRET_KEY = required_env("SECRET_KEY")
COUNTING_KEY = required_env("COUNTING_KEY")
ADMIN_TOKEN = required_env("ADMIN_TOKEN")

DB_NAME = required_env("DB_NAME")
DB_USER = required_env("DB_USER")
DB_PASSWORD = required_env("DB_PASSWORD")

DEBUG = env("DEBUG")

ALLOWED_HOSTS = []

ELECTION_DEADLINE = datetime(2026, 3, 27, 18, 0)  # change to your demo date

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

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite's default port
]

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

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True
USE_L10N = True
USE_TZ = True

STATIC_URL = "/static/"


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
