from datetime import date

from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

from voters.models import Voter


class DigiLockerFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.eligible = Voter.objects.create(
            aadhaar_number="123456789012",
            full_name="Eligible Voter",
            date_of_birth=date(1995, 1, 1),
            constituency="Demo",
            is_eligible=True,
            has_voted=False,
            aadhaar_last4="9012",
        )
        self.ineligible = Voter.objects.create(
            aadhaar_number="123456789013",
            full_name="Ineligible Voter",
            date_of_birth=date(2010, 1, 1),
            constituency="Demo",
            is_eligible=False,
            has_voted=False,
            aadhaar_last4="9013",
        )
        self.already_voted = Voter.objects.create(
            aadhaar_number="123456789014",
            full_name="Already Voted",
            date_of_birth=date(1990, 1, 1),
            constituency="Demo",
            is_eligible=True,
            has_voted=True,
            aadhaar_last4="9014",
        )

    def test_initiate_generates_otp_and_writes_cache(self):
        response = self.client.post(
            "/api/digilocker/initiate/",
            {"aadhaar_number": self.eligible.aadhaar_number},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("demo_otp", response.data)
        self.assertEqual(len(response.data["demo_otp"]), 6)
        self.assertEqual(
            cache.get(f"otp_{self.eligible.aadhaar_number}"), response.data["demo_otp"]
        )

    def test_initiate_rejects_unknown_aadhaar(self):
        response = self.client.post(
            "/api/digilocker/initiate/",
            {"aadhaar_number": "111122223333"},
            format="json",
        )

        self.assertEqual(response.status_code, 404)
        self.assertIn("Aadhaar not found", response.data["error"])

    def test_initiate_rejects_ineligible_voter(self):
        response = self.client.post(
            "/api/digilocker/initiate/",
            {"aadhaar_number": self.ineligible.aadhaar_number},
            format="json",
        )

        self.assertEqual(response.status_code, 403)
        self.assertIn("Not eligible", response.data["error"])

    def test_verify_fails_when_otp_expired(self):
        cache.set(f"otp_{self.eligible.aadhaar_number}", "123456", timeout=1)
        cache.delete(f"otp_{self.eligible.aadhaar_number}")

        response = self.client.post(
            "/api/digilocker/verify/",
            {"aadhaar_number": self.eligible.aadhaar_number, "otp": "123456"},
            format="json",
        )

        self.assertEqual(response.status_code, 401)
        self.assertIn("expired", response.data["error"])

    def test_verify_issues_session_token_and_cache_mapping(self):
        initiate = self.client.post(
            "/api/digilocker/initiate/",
            {"aadhaar_number": self.eligible.aadhaar_number},
            format="json",
        )
        otp = initiate.data["demo_otp"]

        response = self.client.post(
            "/api/digilocker/verify/",
            {"aadhaar_number": self.eligible.aadhaar_number, "otp": otp},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("token", response.data)
        token = response.data["token"]
        self.assertEqual(cache.get(f"token_{token}"), self.eligible.aadhaar_number)
