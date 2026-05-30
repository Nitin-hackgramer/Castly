import secrets
import uuid
from datetime import timedelta
import logging
from django.core.cache import cache
from django.db import transaction
from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from voters.models import Voter
from .models import Vote, Election, ElectionCandidate
from crypto_utils import (
    encrypt_vote,
    decrypt_vote,
    compute_chain_hash,
    compute_receipt_hash,
    hash_voter_id,
)


def serialize_election(election):
    status_label = "CLOSED" if is_election_closed(election) else "OPEN"
    return {
        "id": str(election.id),
        "title": election.title,
        "starts_at": election.starts_at,
        "ends_at": election.ends_at,
        "is_active": election.is_active,
        "requires_voter_password": bool(election.voter_password_hash),
        "requires_admin_password": bool(election.admin_password_hash),
        "status": status_label,
        "candidates": [
            {
                "id": str(candidate.id),
                "name": candidate.name,
                "emoji": candidate.emoji,
                "display_order": candidate.display_order,
            }
            for candidate in election.candidates.order_by("display_order", "name")
        ],
    }


def get_active_election():
    return Election.objects.filter(is_active=True).order_by("-created_at").first()


def is_election_closed(election):
    if election and not election.is_active:
        return True
    if election and election.ends_at:
        return timezone.now() > election.ends_at
    deadline = timezone.make_aware(settings.ELECTION_DEADLINE)
    return timezone.now() > deadline


def validate_admin_session(request, election):
    session_token = request.headers.get("X-Admin-Session", "").strip()
    if not session_token:
        return None

    election_id = cache.get(f"admin_session_{session_token}")
    if election_id != str(election.id):
        return None

    return session_token


def find_election_by_password(password, password_field, open_only=False):
    if not password:
        return None

    queryset = Election.objects.all().order_by("-created_at")
    if open_only:
        queryset = queryset.filter(is_active=True)

    for election in queryset:
        stored_hash = getattr(election, password_field, "")
        if stored_hash and check_password(password, stored_hash):
            if open_only and is_election_closed(election):
                continue
            return election
    return None


@api_view(["GET"])
@permission_classes([AllowAny])
def list_elections(request):
    elections = Election.objects.all().order_by("-created_at")
    return Response(
        {"elections": [serialize_election(election) for election in elections]}
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def election_detail(request, election_id):
    try:
        election = Election.objects.get(id=election_id)
    except Election.DoesNotExist:
        return Response(
            {"error": "Election not found."}, status=status.HTTP_404_NOT_FOUND
        )

    return Response(serialize_election(election))


@api_view(["POST"])
@permission_classes([AllowAny])
def start_election(request):
    logger = logging.getLogger(__name__)
    try:
        title = (
            request.data.get("title", "General Election").strip() or "General Election"
        )
        candidates = request.data.get("candidates", [])
        ends_at_raw = request.data.get("ends_at")
        voter_password = str(request.data.get("voter_password", "")).strip()
        admin_password = str(request.data.get("admin_password", "")).strip()

        if not voter_password:
            return Response(
                {"error": "Voter verification password is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not admin_password:
            return Response(
                {"error": "Admin page password is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not isinstance(candidates, list) or len(candidates) < 2:
            return Response(
                {"error": "At least 2 candidates are required to start an election."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        parsed_candidates = []
        for index, candidate in enumerate(candidates):
            if not isinstance(candidate, dict):
                return Response(
                    {"error": f"Candidate #{index + 1} is invalid."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            name = str(candidate.get("name", "")).strip()
            emoji = str(candidate.get("emoji", "")).strip()
            if not name or not emoji:
                return Response(
                    {"error": f"Candidate #{index + 1} must include name and emoji."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            parsed_candidates.append(
                {"name": name, "emoji": emoji, "display_order": index}
            )

        ends_at = None
        if ends_at_raw:
            ends_at = parse_datetime(str(ends_at_raw))
            if not ends_at:
                return Response(
                    {"error": "Invalid ends_at datetime format."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if timezone.is_naive(ends_at):
                ends_at = timezone.make_aware(ends_at)
            if ends_at <= timezone.now():
                return Response(
                    {"error": "Election end time must be in the future."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            # Keep the election open by default for 24 hours if caller doesn't specify end time.
            ends_at = timezone.now() + timedelta(days=1)

        with transaction.atomic():
            Election.objects.filter(is_active=True).update(is_active=False)
            admin_token = secrets.token_urlsafe(24)
            election = Election.objects.create(
                title=title,
                voter_password_hash=make_password(voter_password),
                admin_password_hash=make_password(admin_password),
                admin_token_hash=make_password(admin_token),
                is_active=True,
                starts_at=timezone.now(),
                ends_at=ends_at,
            )
            ElectionCandidate.objects.bulk_create(
                [
                    ElectionCandidate(election=election, **candidate)
                    for candidate in parsed_candidates
                ]
            )

        return Response(
            {
                "message": "Election started successfully",
                "election": {
                    "id": str(election.id),
                    "title": election.title,
                    "starts_at": election.starts_at,
                    "ends_at": election.ends_at,
                    "status": "OPEN",
                    "candidates": [
                        {
                            "id": str(candidate.id),
                            "name": candidate.name,
                            "emoji": candidate.emoji,
                            "display_order": candidate.display_order,
                        }
                        for candidate in election.candidates.order_by(
                            "display_order", "name"
                        )
                    ],
                },
                "admin_token": admin_token,
                "message_admin": "Save this admin token now. It will not be shown again.",
            }
        )
    except Exception as exc:
        # Log full exception to server logs and return concise error to client
        logger.exception("Error starting election")
        return Response(
            {"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def admin_login(request, election_id):
    try:
        election = Election.objects.get(id=election_id)
    except Election.DoesNotExist:
        return Response(
            {"error": "Election not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    password = str(request.data.get("admin_password", "")).strip()
    if not password:
        return Response(
            {"error": "Admin password is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not election.admin_password_hash or not check_password(
        password, election.admin_password_hash
    ):
        return Response(
            {"error": "Invalid admin password for this election."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    session_token = secrets.token_urlsafe(24)
    cache.set(f"admin_session_{session_token}", str(election.id), timeout=43200)

    return Response(
        {
            "message": "Admin access granted.",
            "admin_session_token": session_token,
            "election_id": str(election.id),
            "election_title": election.title,
        }
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def admin_login_by_password(request):
    password = str(request.data.get("admin_password", "")).strip()
    if not password:
        return Response(
            {"error": "Admin password is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    election = None
    if password == settings.ADMIN_TOKEN:
        election = get_active_election()
        if not election:
            return Response(
                {"error": "No active election found."},
                status=status.HTTP_404_NOT_FOUND,
            )
    else:
        election = find_election_by_password(
            password, "admin_password_hash", open_only=False
        )
        if not election:
            return Response(
                {"error": "Invalid admin password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

    session_token = secrets.token_urlsafe(24)
    cache.set(f"admin_session_{session_token}", str(election.id), timeout=43200)

    return Response(
        {
            "message": "Admin access granted.",
            "admin_session_token": session_token,
            "election_id": str(election.id),
        }
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def force_close_election(request, election_id):
    try:
        election = Election.objects.get(id=election_id)
    except Election.DoesNotExist:
        return Response(
            {"error": "Election not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if not validate_admin_session(request, election):
        return Response(
            {"error": "Admin session required. Please login for this election."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if is_election_closed(election):
        return Response(
            {
                "message": "Election is already closed.",
                "election_id": str(election.id),
                "status": "CLOSED",
            }
        )

    election.ends_at = timezone.now()
    election.is_active = False
    election.save(update_fields=["ends_at", "is_active"])

    return Response(
        {
            "message": "Election has been force closed.",
            "election_id": str(election.id),
            "status": "CLOSED",
        }
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def unlock_election(request, election_id):
    try:
        election = Election.objects.get(id=election_id)
    except Election.DoesNotExist:
        return Response(
            {"error": "Election not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if is_election_closed(election):
        return Response(
            {"error": "Election is closed. Voting is no longer allowed."},
            status=status.HTTP_403_FORBIDDEN,
        )

    password = str(request.data.get("voter_password", "")).strip()
    if not password:
        return Response(
            {"error": "Verification password is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not check_password(password, election.voter_password_hash):
        return Response(
            {"error": "Invalid election verification password."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    verification_token = secrets.token_urlsafe(24)
    cache.set(f"unlock_{verification_token}", str(election.id), timeout=1800)
    return Response(
        {
            "message": "Election verification successful.",
            "verification_token": verification_token,
            "election_id": str(election.id),
        }
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def unlock_election_by_password(request):
    password = str(request.data.get("voter_password", "")).strip()
    if not password:
        return Response(
            {"error": "Verification password is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    election = find_election_by_password(
        password, "voter_password_hash", open_only=True
    )
    if not election:
        return Response(
            {"error": "No active election found for this password."},
            status=status.HTTP_404_NOT_FOUND,
        )

    verification_token = secrets.token_urlsafe(24)
    cache.set(f"unlock_{verification_token}", str(election.id), timeout=1800)
    return Response(
        {
            "message": "Election verification successful.",
            "verification_token": verification_token,
            "election_id": str(election.id),
        }
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def resolve_election_for_receipt(request):
    password = str(request.data.get("voter_password", "")).strip()
    if not password:
        return Response(
            {"error": "Verification password is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    election = find_election_by_password(
        password, "voter_password_hash", open_only=False
    )
    if not election:
        return Response(
            {"error": "Invalid election verification password."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    return Response({"election_id": str(election.id)})


@api_view(["GET"])
@permission_classes([AllowAny])
def current_election(request):
    election = get_active_election()
    if not election:
        return Response(
            {
                "status": "NOT_STARTED",
                "message": "No active election. Start an election first.",
                "candidates": [],
            }
        )

    data = serialize_election(election)
    return Response(
        {
            "status": data["status"],
            "requires_voter_password": data["requires_voter_password"],
            "election": {
                "id": data["id"],
                "title": data["title"],
                "starts_at": data["starts_at"],
                "ends_at": data["ends_at"],
            },
            "candidates": data["candidates"],
        }
    )


# ─────────────────────────────────────────
# ENDPOINT 1: Cast a Vote
# POST /api/votes/cast/
# Header: Authorization: Token <token>
# Takes: { candidate_choice }
# ─────────────────────────────────────────


@api_view(["POST"])
@permission_classes([AllowAny])
def cast_vote(request):
    election_id = request.data.get("election_id")
    if election_id:
        try:
            election = Election.objects.get(id=election_id)
        except Election.DoesNotExist:
            return Response(
                {"error": "Selected election was not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
    else:
        election = get_active_election()

    if not election:
        return Response(
            {"error": "No active election. Please start an election first."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if is_election_closed(election):
        return Response(
            {"error": "Election is closed. Voting is no longer allowed."},
            status=status.HTTP_403_FORBIDDEN,
        )

    verification_token = str(request.data.get("verification_token", "")).strip()
    if election.voter_password_hash:
        unlocked_election_id = cache.get(f"unlock_{verification_token}")
        if not verification_token or unlocked_election_id != str(election.id):
            return Response(
                {
                    "error": "Election verification required. Please enter the election password before voting."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

    # Step 1 — Validate token (optional for now)
    token = request.headers.get("Authorization", "").replace("Token ", "")
    aadhaar = cache.get(f"token_{token}")
    if token and not aadhaar:
        return Response(
            {"error": "Session expired. Please verify again."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # Step 2 — Get candidate choice
    candidate = request.data.get("candidate_choice", "").strip()
    if not candidate:
        return Response(
            {"error": "No candidate selected"}, status=status.HTTP_400_BAD_REQUEST
        )

    if not ElectionCandidate.objects.filter(election=election, name=candidate).exists():
        return Response(
            {"error": "Selected candidate is not part of the active election."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    counting_key = settings.COUNTING_KEY
    encrypted = encrypt_vote(counting_key, candidate)

    # Step 3 — Atomic operation
    with transaction.atomic():
        if aadhaar:
            voter = Voter.objects.select_for_update().get(aadhaar_number=aadhaar)

            if voter.has_voted:
                Vote.objects.filter(
                    voter_id_hash=hash_voter_id(aadhaar), status="ACTIVE"
                ).update(status="SUPERSEDED")
            voter_hash = hash_voter_id(aadhaar)
        else:
            # Verification route is disabled for now, so allow anonymous demo voting.
            voter_hash = hash_voter_id(str(uuid.uuid4()))

        # Step 5 — Compute chain hash
        # Get last vote's hash (or GENESIS if first vote)
        last_vote = (
            Vote.objects.filter(status="ACTIVE").order_by("-timestamp", "-id").first()
        )

        prev_hash = last_vote.chain_hash if last_vote else "GENESIS"
        # Compute timestamp ONCE before chain_hash computation
        # This ensures chain_hash computed now matches what will be stored
        timestamp_obj = timezone.now()
        timestamp_str = timestamp_obj.isoformat()
        chain_hash = compute_chain_hash(prev_hash, encrypted, timestamp_str)

        # Step 6 — Compute receipt
        receipt = compute_receipt_hash(voter_hash, timestamp_str)

        # Step 7 — Store vote with explicit timestamp to ensure chain verification works
        Vote.objects.create(
            voter_id_hash=voter_hash,
            election=election,
            encrypted_choice=encrypted,
            receipt_hash=receipt,
            chain_hash=chain_hash,
            status="ACTIVE",
            timestamp=timestamp_obj,  # Explicitly set timestamp to match chain_hash computation
        )

        if aadhaar:
            # Step 8 — Mark voter as voted
            voter.has_voted = True
            voter.save()

            # Step 9 — Invalidate token (one vote, one token)
            cache.delete(f"token_{token}")

        if verification_token:
            cache.delete(f"unlock_{verification_token}")

    return Response(
        {
            "receipt_hash": receipt,
            "message": "Vote cast successfully. Keep your receipt.",
        }
    )


# ─────────────────────────────────────────
# ENDPOINT 2: Verify Receipt
# GET /api/votes/verify/<receipt_hash>/
# ─────────────────────────────────────────


@api_view(["GET"])
@permission_classes([AllowAny])
def verify_receipt(request, receipt_hash):
    election_id = request.query_params.get("election_id")
    queryset = Vote.objects.all()
    if election_id:
        queryset = queryset.filter(election_id=election_id)

    try:
        vote = queryset.get(receipt_hash=receipt_hash)
    except Vote.DoesNotExist:
        return Response(
            {"error": "Receipt not found"}, status=status.HTTP_404_NOT_FOUND
        )

    return Response(
        {
            "status": vote.status,
            "timestamp": vote.timestamp,
            "message": "Your vote is securely recorded in the system",
            # Notice: no encrypted_choice, no voter_id_hash returned
            # Cannot correlate receipt to candidate or voter
        }
    )


# ─────────────────────────────────────────
# ENDPOINT 3: Get Statistics
# GET /api/votes/stats/
# ─────────────────────────────────────────


@api_view(["GET"])
@permission_classes([AllowAny])
def get_stats(request):
    election_id = request.query_params.get("election_id")
    if election_id:
        try:
            election = Election.objects.get(id=election_id)
        except Election.DoesNotExist:
            return Response(
                {"error": "Election not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
    else:
        election = get_active_election()

    if election:
        total_votes = Vote.objects.filter(status="ACTIVE", election=election).count()
    else:
        total_votes = 0
    if not election:
        election_status = "NOT_STARTED"
    else:
        election_status = "CLOSED" if is_election_closed(election) else "OPEN"

    return Response(
        {
            "election_id": str(election.id) if election else None,
            "election_title": election.title if election else None,
            "total_votes": total_votes,
            "election_status": election_status,
            "official_count_ready": bool(election and election.counted_at),
            "official_results": election.official_results if election else {},
            "official_total_votes": election.official_total_votes if election else 0,
            "counted_at": election.counted_at if election else None,
        }
    )


# ─────────────────────────────────────────
# ENDPOINT 4: Trigger Count (Admin Only)
# POST /api/votes/count/
# Header: Authorization: Token <adminToken>
# ─────────────────────────────────────────


@api_view(["POST"])
@permission_classes([AllowAny])
def trigger_count(request):
    election_id = request.data.get("election_id")
    if not election_id:
        return Response(
            {"error": "election_id is required for official counting."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        election = Election.objects.get(id=election_id)
    except Election.DoesNotExist:
        return Response(
            {"error": "Election not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    token = request.headers.get("Authorization", "").replace("Token ", "").strip()
    if not token or not election.admin_token_hash:
        return Response(
            {"error": "Admin access required. Invalid or missing token."},
            status=status.HTTP_403_FORBIDDEN,
        )
    if not check_password(token, election.admin_token_hash):
        return Response(
            {"error": "Admin access required. Invalid or missing token."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if not election:
        return Response(
            {"error": "No active election found."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not is_election_closed(election):
        return Response(
            {"error": "Election still ongoing. Cannot count yet."},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Decrypt all active votes
    counting_key = settings.COUNTING_KEY
    if not counting_key:
        return Response(
            {"error": "Counting key not configured"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    active_votes = Vote.objects.filter(status="ACTIVE", election=election)

    tally = {}
    for vote in active_votes:
        candidate = decrypt_vote(counting_key, vote.encrypted_choice)
        tally[candidate] = tally.get(candidate, 0) + 1

    # Sort by votes descending
    sorted_tally = dict(sorted(tally.items(), key=lambda x: x[1], reverse=True))
    total_votes = sum(tally.values())

    election.official_results = sorted_tally
    election.official_total_votes = total_votes
    election.counted_at = timezone.now()
    election.save(
        update_fields=["official_results", "official_total_votes", "counted_at"]
    )

    return Response(
        {
            "results": sorted_tally,
            "total_votes": total_votes,
            "election_id": str(election.id),
            "election_title": election.title,
            "counted_at": election.counted_at,
            "message": "Official count complete",
        }
    )


# ─────────────────────────────────────────
# ENDPOINT 5: Repair Chain (Admin Only)
# POST /api/votes/repair-chain/
# Header: Authorization: Token <adminToken>
# ─────────────────────────────────────────


@api_view(["POST"])
@permission_classes([AllowAny])
def repair_chain(request):
    token = request.headers.get("Authorization", "").replace("Token ", "").strip()
    admin_token = getattr(settings, "ADMIN_TOKEN", "")

    if not admin_token or token != admin_token:
        return Response(
            {"error": "Admin access required. Invalid or missing token."},
            status=status.HTTP_403_FORBIDDEN,
        )

    active_votes = Vote.objects.filter(status="ACTIVE").order_by("timestamp", "id")
    if not active_votes.exists():
        return Response({"message": "No active votes found", "repaired": 0})

    expected_prev = "GENESIS"
    repaired = 0

    with transaction.atomic():
        for vote in active_votes:
            expected_hash = compute_chain_hash(
                expected_prev,
                vote.encrypted_choice,
                vote.timestamp.isoformat(),
            )

            if vote.chain_hash != expected_hash:
                vote.chain_hash = expected_hash
                vote.save(update_fields=["chain_hash"])
                repaired += 1

            expected_prev = expected_hash

    return Response(
        {
            "message": "Chain repair complete",
            "votes_checked": active_votes.count(),
            "repaired": repaired,
        }
    )
