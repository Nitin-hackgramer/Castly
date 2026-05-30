import hashlib
import secrets
from cryptography.fernet import Fernet

# ─────────────────────────────────────────
# COUNTING KEY — Election Commission's secret
# ─────────────────────────────────────────


def generate_counting_key() -> str:
    """
    Run this ONCE before election starts.
    Copy the output into your .env as COUNTING_KEY.
    Never call this again — calling it again makes old
    encrypted votes unreadable.
    """
    return Fernet.generate_key().decode()


# ─────────────────────────────────────────
# VOTE ENCRYPTION
# ─────────────────────────────────────────


def encrypt_vote(key: str, candidate_name: str) -> str:
    """
    Locks the vote in a box only the counting key can open.
    Returns a string of random-looking characters.
    Example: "gAAAAABl..." — unreadable to anyone without key.
    """
    f = Fernet(key.encode())
    return f.encrypt(candidate_name.encode()).decode()


def decrypt_vote(key: str, encrypted_text: str) -> str:
    """
    Opens the box. Only called after election deadline.
    Returns the original candidate name.
    """
    f = Fernet(key.encode())
    return f.decrypt(encrypted_text.encode()).decode()


# ─────────────────────────────────────────
# CHAIN HASH — Tamper Detection (Your USP)
# ─────────────────────────────────────────


def compute_chain_hash(prev_hash: str, encrypted_vote: str, timestamp: str) -> str:
    """
    Links this vote mathematically to every vote before it.
    If ANY previous vote is changed, this hash will no longer
    match — chain is broken, tampering detected.

    Think of it like: each vote's seal includes the previous seal.
    Break one, break all.
    """
    combined = f"{prev_hash}{encrypted_vote}{timestamp}"
    return hashlib.sha256(combined.encode()).hexdigest()


# ─────────────────────────────────────────
# RECEIPT HASH — Voter's Proof
# ─────────────────────────────────────────


def compute_receipt_hash(voter_id_hash: str, timestamp: str) -> str:
    """
    What the voter gets back after voting.
    Proves their vote exists without revealing what they chose.
    """
    combined = f"{voter_id_hash}{timestamp}{secrets.token_hex(8)}"
    return hashlib.sha256(combined.encode()).hexdigest()


# ─────────────────────────────────────────
# VOTER ID HASH — Privacy Layer
# ─────────────────────────────────────────


def hash_voter_id(voter_id: str) -> str:
    """
    One-way transformation of Aadhaar/voter ID.
    Stored in votes table instead of the real ID.
    Cannot be reversed — identity separated from vote.
    """
    return hashlib.sha256(voter_id.encode()).hexdigest()
