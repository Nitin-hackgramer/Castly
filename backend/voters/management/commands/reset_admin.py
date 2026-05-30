import re
import secrets
from pathlib import Path

from django.core.management.base import BaseCommand
from django.conf import settings

from votes.models import Election


class Command(BaseCommand):
    help = "Reset global ADMIN_TOKEN in .env and clear per-election admin passwords."

    def add_arguments(self, parser):
        parser.add_argument("--token", type=str, help="Admin token to set (optional).")
        parser.add_argument(
            "--no-clear",
            action="store_true",
            help="Do not clear per-election admin passwords.",
        )

    def handle(self, *args, **options):
        new_token = options.get("token") or secrets.token_urlsafe(24)

        env_path = Path(settings.BASE_DIR) / ".env"
        if not env_path.exists():
            self.stdout.write(self.style.ERROR(f".env not found at {env_path}"))
            return

        text = env_path.read_text()
        if re.search(r"^ADMIN_TOKEN=", text, flags=re.M):
            new_text = re.sub(
                r"^ADMIN_TOKEN=.*$", f"ADMIN_TOKEN='{new_token}'", text, flags=re.M
            )
        else:
            if not text.endswith("\n"):
                text += "\n"
            new_text = text + f"ADMIN_TOKEN='{new_token}'\n"

        env_path.write_text(new_text)

        if not options.get("no_clear"):
            Election.objects.update(admin_password_hash="", admin_token_hash="")

        self.stdout.write(self.style.SUCCESS("Updated .env ADMIN_TOKEN"))
        self.stdout.write(self.style.SUCCESS(f"New ADMIN_TOKEN: {new_token}"))
