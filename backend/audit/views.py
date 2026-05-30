from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from votes.models import Vote
from crypto_utils import compute_chain_hash
from .models import AuditRecord


# ─────────────────────────────────────────
# ENDPOINT: Verify Chain Integrity
# GET /api/audit/verify-chain/
# PUBLIC — anyone can verify
# ─────────────────────────────────────────


@api_view(["GET"])
@permission_classes([AllowAny])
def verify_chain(request):
    election_id = request.query_params.get("election_id")
    vote_qs = Vote.objects.filter(status="ACTIVE")
    if election_id:
        vote_qs = vote_qs.filter(election_id=election_id)

    all_votes = vote_qs.order_by("timestamp", "id")

    if not all_votes.exists():
        return Response({"message": "No votes cast yet"})

    expected_prev = "GENESIS"

    for index, vote in enumerate(all_votes):
        # Recompute the chain hash using the STORED timestamp, not current time
        expected_hash = compute_chain_hash(
            expected_prev,
            vote.encrypted_choice,
            vote.timestamp.isoformat(),  # Use stored timestamp, not timezone.now()
        )

        # Compare to what's stored
        if expected_hash != vote.chain_hash:
            # TAMPERED — tell exactly where chain broke
            return Response(
                {
                    "status": "TAMPERED",
                    "message": f"Chain broken at vote #{index + 1}",
                    "vote_id": str(vote.id),
                    "warning": "Election data has been modified",
                },
                status=500,
            )

        expected_prev = vote.chain_hash

    # All hashes match — nothing touched
    return Response(
        {
            "status": "INTACT",
            "election_id": election_id,
            "votes_verified": all_votes.count(),
            "message": "All votes verified. No tampering detected.",
        }
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def tamper_test(request):
    election_id = request.data.get("election_id")
    vote_qs = Vote.objects.filter(status="ACTIVE")
    if election_id:
        vote_qs = vote_qs.filter(election_id=election_id)

    vote = vote_qs.order_by("timestamp", "id").first()
    if not vote:
        return Response({"error": "No votes to tamper"}, status=400)

    if vote.encrypted_choice == "CORRUPTED_TAMPERED_DATA":
        return Response(
            {"error": "Tamper simulation already active for this vote"}, status=400
        )

    # Persist the original encrypted payload so restore can truly revert.
    AuditRecord.objects.create(
        event="tamper_simulated",
        metadata={
            "vote_id": str(vote.id),
            "original_encrypted_choice": vote.encrypted_choice,
        },
    )

    vote.encrypted_choice = "CORRUPTED_TAMPERED_DATA"
    vote.save(update_fields=["encrypted_choice"])
    return Response(
        {
            "message": "Vote corrupted",
            "vote_id": str(vote.id),
            "election_id": str(vote.election_id) if vote.election_id else None,
        }
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def restore_tamper(request):
    election_id = request.data.get("election_id")
    vote_qs = Vote.objects.filter(encrypted_choice="CORRUPTED_TAMPERED_DATA")
    if election_id:
        vote_qs = vote_qs.filter(election_id=election_id)

    vote = vote_qs.first()
    if not vote:
        return Response({"message": "Nothing to restore"})

    backup = (
        AuditRecord.objects.filter(
            event="tamper_simulated",
            metadata__vote_id=str(vote.id),
        )
        .order_by("-recorded_at")
        .first()
    )

    if not backup:
        return Response(
            {"error": "No tamper backup found. Cannot safely restore this vote."},
            status=400,
        )

    original_encrypted_choice = backup.metadata.get("original_encrypted_choice")
    if not original_encrypted_choice:
        return Response(
            {"error": "Tamper backup is incomplete. Cannot safely restore this vote."},
            status=400,
        )

    vote.encrypted_choice = original_encrypted_choice
    vote.save(update_fields=["encrypted_choice"])

    AuditRecord.objects.create(
        event="tamper_restored",
        metadata={"vote_id": str(vote.id)},
    )

    return Response({"message": "Restored", "vote_id": str(vote.id)})
