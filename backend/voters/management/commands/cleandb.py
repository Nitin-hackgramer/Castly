from django.core.management.base import BaseCommand
from django.db import transaction
from django.core.cache import cache

from votes.models import Vote, Election, ElectionCandidate
from voters.models import Voter
from audit.models import AuditRecord


class Command(BaseCommand):
    help = "Permanently delete votes, elections, voters and audit records."

    def add_arguments(self, parser):
        parser.add_argument(
            "--yes", action="store_true", help="Execute without confirmation"
        )

    def handle(self, *args, **options):
        if not options.get("yes"):
            confirm = input(
                "This will PERMANENTLY DELETE votes, elections, voters and audit records. Type YES to continue: "
            ).strip()
            if confirm != "YES":
                self.stdout.write(self.style.WARNING("Aborted."))
                return

        with transaction.atomic():
            Vote.objects.all().delete()
            AuditRecord.objects.all().delete()
            ElectionCandidate.objects.all().delete()
            Election.objects.all().delete()
            Voter.objects.all().delete()
            cache.clear()

        self.stdout.write(self.style.SUCCESS("Database cleaned."))
