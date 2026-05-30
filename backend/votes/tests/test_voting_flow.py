from datetime import date
from datetime import timedelta

from django.core.cache import cache
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from crypto_utils import compute_chain_hash
from voters.models import Voter
from votes.models import Vote, Election, ElectionCandidate


class VotingFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        election = Election.objects.create(
            title="Test Election",
            is_active=True,
            ends_at=timezone.now() + timedelta(days=1),
        )
        ElectionCandidate.objects.create(
            election=election,
            name="Bhartiya Janta Party (BJP)",
            emoji="🪷",
            display_order=0,
        )
        ElectionCandidate.objects.create(
            election=election,
            name="Indian National Congress (INC)",
            emoji="✋",
            display_order=1,
        )
        ElectionCandidate.objects.create(
            election=election,
            name="Aam Aadmi Party (AAP)",
            emoji="🧹",
            display_order=2,
        )
        ElectionCandidate.objects.create(
            election=election,
            name="Samajwadi Party (SP)",
            emoji="🚲",
            display_order=3,
        )

        self.voter1 = Voter.objects.create(
            aadhaar_number="200000000001",
            full_name="Voter One",
            date_of_birth=date(1991, 1, 1),
            constituency="Demo",
            is_eligible=True,
            has_voted=False,
            aadhaar_last4="0001",
        )
        self.voter2 = Voter.objects.create(
            aadhaar_number="200000000002",
            full_name="Voter Two",
            date_of_birth=date(1992, 2, 2),
            constituency="Demo",
            is_eligible=True,
            has_voted=False,
            aadhaar_last4="0002",
        )

    def _issue_token(self, aadhaar):
        initiate = self.client.post(
            "/api/digilocker/initiate/",
            {"aadhaar_number": aadhaar},
            format="json",
        )
        otp = initiate.data["demo_otp"]

        verify = self.client.post(
            "/api/digilocker/verify/",
            {"aadhaar_number": aadhaar, "otp": otp},
            format="json",
        )
        return verify.data["token"]

    def test_cast_vote_encrypts_payload_and_invalidates_token(self):
        token = self._issue_token(self.voter1.aadhaar_number)
        plaintext = "Bhartiya Janta Party (BJP)"

        response = self.client.post(
            "/api/votes/cast/",
            {"candidate_choice": plaintext},
            format="json",
            HTTP_AUTHORIZATION=f"Token {token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("receipt_hash", response.data)

        vote = Vote.objects.get(receipt_hash=response.data["receipt_hash"])
        self.assertNotEqual(vote.encrypted_choice, plaintext)
        self.assertTrue(vote.chain_hash)

        self.voter1.refresh_from_db()
        self.assertTrue(self.voter1.has_voted)
        self.assertIsNone(cache.get(f"token_{token}"))

    def test_double_vote_with_same_token_is_blocked(self):
        token = self._issue_token(self.voter1.aadhaar_number)

        first = self.client.post(
            "/api/votes/cast/",
            {"candidate_choice": "Indian National Congress (INC)"},
            format="json",
            HTTP_AUTHORIZATION=f"Token {token}",
        )
        second = self.client.post(
            "/api/votes/cast/",
            {"candidate_choice": "Aam Aadmi Party (AAP)"},
            format="json",
            HTTP_AUTHORIZATION=f"Token {token}",
        )

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 401)
        self.assertIn("Session expired", second.data["error"])

    def test_receipt_verification_returns_vote_status(self):
        token = self._issue_token(self.voter1.aadhaar_number)
        cast = self.client.post(
            "/api/votes/cast/",
            {"candidate_choice": "Samajwadi Party (SP)"},
            format="json",
            HTTP_AUTHORIZATION=f"Token {token}",
        )

        receipt_hash = cast.data["receipt_hash"]
        verify = self.client.get(f"/api/votes/verify/{receipt_hash}/")

        self.assertEqual(verify.status_code, 200)
        self.assertEqual(verify.data["status"], "ACTIVE")
        self.assertIn("timestamp", verify.data)

    def test_chain_hash_continuity_across_multiple_votes(self):
        token1 = self._issue_token(self.voter1.aadhaar_number)
        token2 = self._issue_token(self.voter2.aadhaar_number)

        self.client.post(
            "/api/votes/cast/",
            {"candidate_choice": "Bhartiya Janta Party (BJP)"},
            format="json",
            HTTP_AUTHORIZATION=f"Token {token1}",
        )
        self.client.post(
            "/api/votes/cast/",
            {"candidate_choice": "Indian National Congress (INC)"},
            format="json",
            HTTP_AUTHORIZATION=f"Token {token2}",
        )

        expected_prev = "GENESIS"
        for vote in Vote.objects.filter(status="ACTIVE").order_by("timestamp", "id"):
            expected_hash = compute_chain_hash(
                expected_prev, vote.encrypted_choice, vote.timestamp.isoformat()
            )
            self.assertEqual(vote.chain_hash, expected_hash)
            expected_prev = vote.chain_hash
