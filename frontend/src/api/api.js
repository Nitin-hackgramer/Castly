import axios from "axios";

const api = axios.create({
    baseURL: "https://castly-backend-r1e0.onrender.com",
    headers: { "Content-Type": "application/json" },
});

// DigiLocker / Aadhaar flows removed — Castly uses local session tokens
export const getSessionStatus = (token) =>
    api.get("/api/digilocker/status/", {
        headers: { Authorization: `Token ${token}` },
    });

// ── Votes ────────────────────────────────────
export const startElection = (payload) =>
    api.post("/api/votes/election/start/", payload);

export const getElections = () => api.get("/api/votes/elections/");

export const getElectionById = (electionId) =>
    api.get(`/api/votes/election/${electionId}/`);

export const unlockElection = (electionId, voterPassword) =>
    api.post(`/api/votes/election/${electionId}/unlock/`, {
        voter_password: voterPassword,
    });

export const unlockElectionByPassword = (voterPassword) =>
    api.post("/api/votes/election/unlock/", {
        voter_password: voterPassword,
    });

export const resolveElectionForReceipt = (voterPassword) =>
    api.post("/api/votes/election/resolve/", {
        voter_password: voterPassword,
    });

export const adminLogin = (electionId, adminPassword) =>
    api.post(`/api/votes/election/${electionId}/admin-login/`, {
        admin_password: adminPassword,
    });

export const adminLoginByPassword = (adminPassword) =>
    api.post("/api/votes/admin-login/", {
        admin_password: adminPassword,
    });

export const forceCloseElection = (electionId, adminSessionToken) =>
    api.post(
        `/api/votes/election/${electionId}/force-close/`,
        {},
        {
            headers: {
                "X-Admin-Session": adminSessionToken,
            },
        },
    );

export const getCurrentElection = () => api.get("/api/votes/election/current/");

export const castVote = (token, candidate, electionId, verificationToken) => {
    const config = token
        ? { headers: { Authorization: `Token ${token}` } }
        : {};
    return api.post(
        "/api/votes/cast/",
        {
            candidate_choice: candidate,
            election_id: electionId,
            verification_token: verificationToken,
        },
        config,
    );
};

export const verifyReceipt = (hash, electionId) => {
    const query = electionId ? `?election_id=${electionId}` : "";
    return api.get(`/api/votes/verify/${hash}/${query}`);
};

export const getStats = (electionId) => {
    const query = electionId ? `?election_id=${electionId}` : "";
    return api.get(`/api/votes/stats/${query}`);
};

// ── Audit ────────────────────────────────────
export const verifyChain = (electionId) => {
    const query = electionId ? `?election_id=${electionId}` : "";
    return api.get(`/api/audit/verify-chain/${query}`);
};

export const tamperTest = (electionId) =>
    api.post("/api/audit/tamper-test/", { election_id: electionId });

export const restoreTamper = (electionId) =>
    api.post("/api/audit/restore-tamper/", { election_id: electionId });

// ── Admin (uses Django session auth) ─────────
export const triggerCount = (adminToken, electionId) =>
    api.post(
        "/api/votes/count/",
        { election_id: electionId },
        { headers: { Authorization: `Token ${adminToken}` } },
    );
