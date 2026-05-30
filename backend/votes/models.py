import uuid
from django.db import models
from django.utils import timezone


class Election(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    title = models.CharField(max_length=120, default="General Election")
    voter_password_hash = models.CharField(max_length=255, blank=True, default="")
    admin_password_hash = models.CharField(max_length=255, blank=True, default="")
    admin_token_hash = models.CharField(max_length=255, blank=True, default="")
    official_results = models.JSONField(default=dict, blank=True)
    official_total_votes = models.PositiveIntegerField(default=0)
    counted_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    starts_at = models.DateTimeField(default=timezone.now)
    ends_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "elections"


class ElectionCandidate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    election = models.ForeignKey(
        Election,
        on_delete=models.CASCADE,
        related_name="candidates",
    )
    name = models.CharField(max_length=120)
    emoji = models.CharField(max_length=8)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "election_candidates"
        constraints = [
            models.UniqueConstraint(
                fields=["election", "name"],
                name="unique_candidate_name_per_election",
            )
        ]


class Vote(models.Model):

    STATUS_CHOICES = [
        ("ACTIVE", "Active"),
        ("SUPERSEDED", "Superseded"),  # voter changed their mind
    ]

    # UUID — harder to enumerate than 1,2,3
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)

    # Hashed voter ID — identity separated from choice
    voter_id_hash = models.CharField(max_length=64)

    # Election this vote belongs to (nullable for legacy records)
    election = models.ForeignKey(
        Election,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="votes",
    )

    # The locked box — no one reads this until counting
    encrypted_choice = models.TextField()

    # Voter's proof of participation
    receipt_hash = models.CharField(max_length=64, unique=True)

    # YOUR USP — links every vote to the one before it
    chain_hash = models.CharField(max_length=64)

    # Revocation support
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default="ACTIVE")

    # Timestamp must be explicitly set to ensure chain verification works
    # DO NOT use auto_now_add — it sets timestamp AFTER chain_hash is computed,
    # causing verification to fail. Instead, timestamp is set explicitly in views.
    timestamp = models.DateTimeField(blank=False, null=False, default=timezone.now)

    class Meta:
        db_table = "votes"
        # Enforce one active vote per voter at DB level
        constraints = [
            models.UniqueConstraint(
                fields=["voter_id_hash"],
                condition=models.Q(status="ACTIVE"),
                name="one_active_vote_per_voter",
            )
        ]
