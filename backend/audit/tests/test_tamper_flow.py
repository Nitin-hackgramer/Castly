from datetime import date
from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from voters.models import Voter
from votes.models import Election, ElectionCandidate


class AuditTamperTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        election = Election.objects.create(
            title="Audit Election",
            is_active=True,
            ends_at=timezone.now() + timedelta(days=1),
        )
        ElectionCandidate.objects.create(
            election=election,
            name="Aam Aadmi Party (AAP)",
            emoji="🧹",
            display_order=0,
        )
        ElectionCandidate.objects.create(
            election=election,
            name="Samajwadi Party (SP)",
            emoji="🚲",
            display_order=1,
        )

        self.voter = Voter.objects.create(
            aadhaar_number="300000000001",
            full_name="Audit Voter",
            date_of_birth=date(1990, 1, 1),
            constituency="Demo",
            is_eligible=True,
            has_voted=False,
            aadhaar_last4="0001",
        )

    def _issue_token(self):
        initiate = self.client.post(
            "/api/digilocker/initiate/",
            {"aadhaar_number": self.voter.aadhaar_number},
            format="json",
        )
        otp = initiate.data["demo_otp"]
        verify = self.client.post(
            "/api/digilocker/verify/",
            {"aadhaar_number": self.voter.aadhaar_number, "otp": otp},
            format="json",
        )
        return verify.data["token"]

    def test_verify_chain_then_tamper_then_restore(self):
        token = self._issue_token()
        cast = self.client.post(
            "/api/votes/cast/",
            {"candidate_choice": "Aam Aadmi Party (AAP)"},
            format="json",
            HTTP_AUTHORIZATION=f"Token {token}",
        )
        self.assertEqual(cast.status_code, 200)

        intact_before = self.client.get("/api/audit/verify-chain/")
        self.assertEqual(intact_before.status_code, 200)
        self.assertEqual(intact_before.data["status"], "INTACT")

        tamper = self.client.post("/api/audit/tamper-test/", {}, format="json")
        self.assertEqual(tamper.status_code, 200)

        broken = self.client.get("/api/audit/verify-chain/")
        self.assertEqual(broken.status_code, 500)
        self.assertEqual(broken.data["status"], "TAMPERED")

        restore = self.client.post("/api/audit/restore-tamper/", {}, format="json")
        self.assertEqual(restore.status_code, 200)

        intact_after = self.client.get("/api/audit/verify-chain/")
        self.assertEqual(intact_after.status_code, 200)
        self.assertEqual(intact_after.data["status"], "INTACT")
