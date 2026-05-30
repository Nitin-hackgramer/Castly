import random
import secrets
from datetime import date
from django.core.cache import cache
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import Voter

# ─────────────────────────────────────────
# ENDPOINT 1: Initiate DigiLocker Login
# POST /api/digilocker/initiate/
# Takes: { aadhaar_number }
# ─────────────────────────────────────────


@api_view(["POST"])
@permission_classes([AllowAny])
def initiate_digilocker(request):
    aadhaar = request.data.get("aadhaar_number", "").replace("-", "").strip()

    # Validate format
    if len(aadhaar) != 12 or not aadhaar.isdigit():
        return Response(
            {"error": "Invalid Aadhaar format"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Check electoral roll
    try:
        voter = Voter.objects.get(aadhaar_number=aadhaar)
    except Voter.DoesNotExist:
        return Response(
            {"error": "Aadhaar not found in electoral roll"},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Check eligibility
    if not voter.is_eligible:
        return Response(
            {"error": "Not eligible to vote — age below 18"},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Check already voted
    if voter.has_voted:
        return Response(
            {"error": "This Aadhaar has already been used to vote"},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Generate OTP
    otp = str(random.randint(100000, 999999))
    cache.set(f"otp_{aadhaar}", otp, timeout=300)  # 5 minutes

    # In production: send via SMS gateway
    # For demo: return OTP only when DEBUG=True
    resp = {
        "message": "OTP sent to Aadhaar-registered mobile",
        "aadhaar_last4": voter.aadhaar_last4,
    }
    if settings.DEBUG:
        resp["demo_otp"] = otp
    return Response(resp)


# ─────────────────────────────────────────
# ENDPOINT 2: Verify OTP → Issue Token
# POST /api/digilocker/verify/
# Takes: { aadhaar_number, otp }
# ─────────────────────────────────────────


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_digilocker(request):
    aadhaar = request.data.get("aadhaar_number", "").replace("-", "").strip()
    otp_entered = request.data.get("otp", "").strip()

    # Fetch OTP from cache
    stored_otp = cache.get(f"otp_{aadhaar}")

    if not stored_otp:
        return Response(
            {"error": "OTP expired or not requested. Please start again."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if stored_otp != otp_entered:
        return Response({"error": "Invalid OTP"}, status=status.HTTP_401_UNAUTHORIZED)

    # OTP correct — delete immediately (one-time use)
    cache.delete(f"otp_{aadhaar}")

    # Get voter details
    voter = Voter.objects.get(aadhaar_number=aadhaar)

    # Generate session token
    token = secrets.token_urlsafe(32)

    # Store token → maps to aadhaar (15 min expiry)
    cache.set(f"token_{token}", aadhaar, timeout=900)

    return Response(
        {
            "token": token,
            "voter_name": voter.full_name,
            "constituency": voter.constituency,
            "aadhaar_last4": voter.aadhaar_last4,
            "message": "Identity verified via DigiLocker",
        }
    )


# ─────────────────────────────────────────
# ENDPOINT 3: Check Token Status
# GET /api/digilocker/status/
# Header: Authorization: Token <token>
# ─────────────────────────────────────────


@api_view(["GET"])
@permission_classes([AllowAny])
def token_status(request):
    token = request.headers.get("Authorization", "").replace("Token ", "")

    if not token:
        return Response({"valid": False})

    aadhaar = cache.get(f"token_{token}")

    if not aadhaar:
        return Response({"valid": False, "reason": "Token expired"})

    voter = Voter.objects.get(aadhaar_number=aadhaar)

    return Response(
        {
            "valid": True,
            "voter_name": voter.full_name,
            "constituency": voter.constituency,
        }
    )
