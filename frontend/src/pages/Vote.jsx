import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    castVote,
    getElectionById,
    unlockElectionByPassword,
} from "../api/api";
import LoadingSpinner from "../components/LoadingSpinner";

const COLORS = [
    "#ea580c",
    "#1d4ed8",
    "#0f766e",
    "#be123c",
    "#4f46e5",
    "#0f766e",
];

export default function Vote() {
    const { auth, logout } = useAuth();
    const navigate = useNavigate();
    const [resolvedElectionId, setResolvedElectionId] = useState("");
    const [candidates, setCandidates] = useState([]);
    const [electionStatus, setElectionStatus] = useState("NOT_STARTED");
    const [electionTitle, setElectionTitle] = useState("Election");
    const [verificationToken, setVerificationToken] = useState("");
    const [voterPassword, setVoterPassword] = useState("");
    const [pageLoading, setPageLoading] = useState(false);
    const [selected, setSelected] = useState(null);
    const [confirmed, setConfirmed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleCast = async () => {
        setError("");
        setLoading(true);
        try {
            const candidate = candidates.find((c) => c.id === selected);
            const res = await castVote(
                auth.token,
                candidate.name,
                resolvedElectionId,
                verificationToken,
            );
            logout();
            navigate("/receipt", {
                state: {
                    receipt: res.data.receipt_hash,
                    voterName: auth.voterName,
                },
            });
        } catch (err) {
            setError(
                err.response?.data?.error ||
                    "Failed to cast vote. Please try again.",
            );
            setLoading(false);
        }
    };

    const selectedCandidate = candidates.find((c) => c.id === selected);

    const isVotingUnlocked = Boolean(verificationToken);

    const handleUnlockVoting = async () => {
        if (!voterPassword.trim()) {
            setError("Election verification password is required.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const unlockRes = await unlockElectionByPassword(
                voterPassword.trim(),
            );
            const electionRes = await getElectionById(
                unlockRes.data.election_id,
            );
            const data = electionRes.data;

            setVerificationToken(unlockRes.data.verification_token);
            setResolvedElectionId(unlockRes.data.election_id);
            setElectionStatus(
                data.status ||
                    (data.is_active === false && data.ends_at
                        ? "CLOSED"
                        : "OPEN") ||
                    "NOT_STARTED",
            );
            setElectionTitle(data.title || "Election");
            setCandidates(
                (data.candidates || []).map((candidate, index) => ({
                    id: candidate.id,
                    name: candidate.name,
                    party: candidate.name,
                    symbol: candidate.emoji,
                    color: COLORS[index % COLORS.length],
                })),
            );
            setSelected(null);
            setConfirmed(false);
            setVoterPassword("");
        } catch (err) {
            setError(
                err.response?.data?.error ||
                    "Failed to verify election password.",
            );
        } finally {
            setLoading(false);
        }
    };

    if (!verificationToken) {
        return (
            <div style={s.page}>
                <div style={s.container}>
                    <div style={s.passwordGateStandalone}>
                        <div style={s.passwordTitle}>
                            Enter Election Password
                        </div>
                        <div style={s.passwordDesc}>
                            Enter your election password to open the active
                            election.
                        </div>
                        <div style={s.passwordRow}>
                            <input
                                style={s.passwordInput}
                                type="password"
                                value={voterPassword}
                                onChange={(e) =>
                                    setVoterPassword(e.target.value)
                                }
                                placeholder="Enter election password"
                                onKeyDown={(e) =>
                                    e.key === "Enter" && handleUnlockVoting()
                                }
                            />
                            <button
                                style={s.passwordBtn}
                                onClick={handleUnlockVoting}
                                disabled={!voterPassword.trim() || loading}
                            >
                                {loading ? "Verifying..." : "Open Election"}
                            </button>
                        </div>
                        {error && <div style={s.error}>⚠ {error}</div>}
                    </div>
                </div>
            </div>
        );
    }

    if (pageLoading) {
        return (
            <div style={s.page}>
                <div style={s.container}>
                    <LoadingSpinner text="Loading election..." />
                </div>
            </div>
        );
    }

    return (
        <div style={s.page}>
            <div style={s.container}>
                {/* Header */}
                <div style={s.header}>
                    <div style={s.headerLeft}>
                        <div style={s.breadcrumb}>{electionTitle}</div>
                        <h1 style={s.pageTitle}>Cast Your Vote</h1>
                    </div>
                    <div style={s.voterCard}>
                        <div style={s.voterCardTop}>
                            <div style={s.voterAvatar}>
                                {auth.voterName?.[0] ?? "V"}
                            </div>
                            <div>
                                <div style={s.voterName}>{auth.voterName}</div>
                                <div style={s.voterConst}>
                                    {auth.constituency}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Encryption notice */}
                <div style={s.encryptBanner}>
                    <span style={s.encryptIcon}>🔐</span>
                    <span>
                        Your vote will be{" "}
                        <strong>encrypted before leaving this device</strong>.
                        No server or administrator can read your choice until
                        the election closes.
                    </span>
                </div>

                {/* Instructions */}
                <p style={s.instructions}>
                    Select one candidate below. You may change your selection
                    before confirming.
                </p>

                {electionStatus === "NOT_STARTED" && (
                    <div style={s.warning}>
                        No active election found. Please start an election
                        first.
                    </div>
                )}

                {electionStatus === "CLOSED" && (
                    <div style={s.warning}>
                        Election is closed. Voting is disabled.
                    </div>
                )}

                {/* Candidate grid */}
                <div style={s.grid}>
                    {candidates.map((c) => {
                        const isSelected = selected === c.id;
                        return (
                            <div
                                key={c.id}
                                style={{
                                    ...s.card,
                                    border: isSelected
                                        ? `2px solid var(--navy)`
                                        : "2px solid var(--border)",
                                    boxShadow: isSelected
                                        ? "var(--shadow-md)"
                                        : "var(--shadow-sm)",
                                    transform: isSelected
                                        ? "translateY(-2px)"
                                        : "none",
                                }}
                                onClick={() => {
                                    if (electionStatus !== "OPEN") return;
                                    if (!isVotingUnlocked) return;
                                    setSelected(c.id);
                                    setConfirmed(false);
                                }}
                            >
                                {/* Selected indicator */}
                                {isSelected && (
                                    <div style={s.selectedBadge}>Selected</div>
                                )}

                                <div
                                    style={{
                                        ...s.symbolWrap,
                                        background: `${c.color}18`,
                                        border: `1px solid ${c.color}30`,
                                    }}
                                >
                                    <span style={s.symbol}>{c.symbol}</span>
                                </div>

                                <div style={s.candidateName}>{c.name}</div>
                                <div style={s.partyName}>{c.party}</div>

                                <div
                                    style={{
                                        ...s.radioRow,
                                        borderColor: isSelected
                                            ? "var(--navy)"
                                            : "var(--border)",
                                        background: isSelected
                                            ? "var(--navy)"
                                            : "white",
                                    }}
                                >
                                    {isSelected && <div style={s.radioInner} />}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {error && <div style={s.error}>⚠ {error}</div>}

                {/* Confirmation panel */}
                {selected && !confirmed && (
                    <div style={s.confirmPanel}>
                        <div style={s.confirmLeft}>
                            <div style={s.confirmLabel}>Your selection</div>
                            <div style={s.confirmName}>
                                {selectedCandidate?.name}
                            </div>
                            <div style={s.confirmParty}>
                                {selectedCandidate?.party}
                            </div>
                        </div>
                        <button
                            style={s.confirmBtn}
                            onClick={() => setConfirmed(true)}
                        >
                            Confirm Selection →
                        </button>
                    </div>
                )}

                {/* Cast panel */}
                {confirmed && (
                    <div style={s.castPanel}>
                        {loading ? (
                            <LoadingSpinner text="Encrypting and recording your vote..." />
                        ) : (
                            <>
                                <div style={s.castInfo}>
                                    <div style={s.castReadyIcon}>🔒</div>
                                    <div>
                                        <div style={s.castReadyLabel}>
                                            Ready to submit
                                        </div>
                                        <div style={s.castReadyName}>
                                            {selectedCandidate?.name} —{" "}
                                            {selectedCandidate?.party}
                                        </div>
                                    </div>
                                </div>
                                <div style={s.castActions}>
                                    <button
                                        style={s.castBtn}
                                        onClick={handleCast}
                                        disabled={electionStatus !== "OPEN"}
                                    >
                                        Cast My Vote
                                    </button>
                                    <button
                                        style={s.changeBtn}
                                        onClick={() => setConfirmed(false)}
                                    >
                                        Change
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

const s = {
    page: {
        padding: "40px 24px",
        minHeight: "calc(100vh - 66px)",
        background: "var(--off-white)",
    },
    container: { maxWidth: 820, margin: "0 auto" },

    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 24,
        flexWrap: "wrap",
        gap: 16,
    },
    headerLeft: {},
    breadcrumb: {
        fontSize: "0.75rem",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "var(--blue)",
        marginBottom: 6,
    },
    pageTitle: {
        fontFamily: "Playfair Display, serif",
        fontSize: "2rem",
        fontWeight: 700,
        color: "var(--navy)",
    },
    voterCard: {
        background: "white",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "12px 18px",
        boxShadow: "var(--shadow-sm)",
    },
    voterCardTop: { display: "flex", alignItems: "center", gap: 12 },
    voterAvatar: {
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: "linear-gradient(135deg, var(--navy), var(--navy-light))",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: "0.95rem",
        flexShrink: 0,
    },
    voterName: { fontSize: "0.9rem", fontWeight: 600, color: "var(--navy)" },
    voterConst: { fontSize: "0.75rem", color: "var(--text-muted)" },

    encryptBanner: {
        background: "#eff6ff",
        border: "1px solid #bfdbfe",
        borderRadius: "var(--radius-md)",
        padding: "12px 16px",
        fontSize: "0.875rem",
        color: "#1e40af",
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 20,
        lineHeight: 1.5,
    },
    encryptIcon: { fontSize: "1.1rem", flexShrink: 0 },

    instructions: {
        fontSize: "0.88rem",
        color: "var(--text-secondary)",
        marginBottom: 20,
    },
    warning: {
        background: "#fff8e1",
        border: "1px solid #ffe082",
        color: "#8d6e63",
        borderRadius: "var(--radius-sm)",
        padding: "10px 12px",
        marginBottom: 16,
    },
    passwordGate: {
        background: "#eef2ff",
        border: "1px solid #c7d2fe",
        borderRadius: "var(--radius-md)",
        padding: "12px 14px",
        marginBottom: 16,
    },
    passwordGateStandalone: {
        background: "#eef2ff",
        border: "1px solid #c7d2fe",
        borderRadius: "var(--radius-md)",
        padding: "18px",
        marginTop: 40,
    },
    passwordTitle: {
        fontSize: "0.9rem",
        fontWeight: 700,
        color: "var(--navy)",
        marginBottom: 4,
    },
    passwordDesc: {
        fontSize: "0.82rem",
        color: "var(--text-secondary)",
        marginBottom: 8,
    },
    passwordRow: { display: "flex", gap: 8, flexWrap: "wrap" },
    passwordInput: {
        flex: 1,
        minWidth: 220,
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        padding: "10px 12px",
        fontSize: "0.9rem",
    },
    passwordBtn: {
        background: "var(--navy)",
        color: "white",
        border: "none",
        borderRadius: "var(--radius-sm)",
        padding: "10px 14px",
        fontWeight: 600,
        cursor: "pointer",
    },

    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
        gap: 16,
        marginBottom: 24,
    },
    card: {
        background: "white",
        borderRadius: "var(--radius-lg)",
        padding: "24px 18px",
        cursor: "pointer",
        textAlign: "center",
        position: "relative",
        transition: "all 0.2s ease",
    },
    selectedBadge: {
        position: "absolute",
        top: 10,
        right: 10,
        background: "var(--navy)",
        color: "white",
        fontSize: "0.68rem",
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        padding: "3px 8px",
        borderRadius: 10,
    },
    symbolWrap: {
        width: 56,
        height: 56,
        borderRadius: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 14px",
    },
    symbol: { fontSize: "1.7rem" },
    candidateName: {
        fontSize: "0.95rem",
        fontWeight: 700,
        color: "var(--navy)",
        marginBottom: 4,
    },
    partyName: {
        fontSize: "0.75rem",
        color: "var(--text-muted)",
        marginBottom: 16,
        lineHeight: 1.4,
    },
    radioRow: {
        width: 20,
        height: 20,
        borderRadius: "50%",
        border: "2px solid",
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s",
    },
    radioInner: {
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: "white",
    },

    error: {
        background: "var(--danger-bg)",
        color: "var(--danger)",
        border: "1px solid #fecaca",
        borderRadius: "var(--radius-md)",
        padding: "10px 16px",
        fontSize: "0.875rem",
        marginBottom: 16,
    },

    confirmPanel: {
        background: "white",
        border: "1.5px solid var(--border-dark)",
        borderRadius: "var(--radius-lg)",
        padding: "20px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
        boxShadow: "var(--shadow-sm)",
        marginBottom: 16,
    },
    confirmLeft: {},
    confirmLabel: {
        fontSize: "0.72rem",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: "var(--text-muted)",
        marginBottom: 4,
    },
    confirmName: { fontSize: "1.05rem", fontWeight: 700, color: "var(--navy)" },
    confirmParty: { fontSize: "0.8rem", color: "var(--text-secondary)" },
    confirmBtn: {
        background: "linear-gradient(135deg, var(--navy), var(--navy-light))",
        color: "white",
        border: "none",
        padding: "11px 24px",
        borderRadius: "var(--radius-md)",
        fontSize: "0.9rem",
        fontWeight: 600,
        flexShrink: 0,
        boxShadow: "var(--shadow-md)",
    },

    castPanel: {
        background:
            "linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%)",
        borderRadius: "var(--radius-lg)",
        padding: "24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
    },
    castInfo: { display: "flex", alignItems: "center", gap: 14 },
    castReadyIcon: { fontSize: "1.8rem" },
    castReadyLabel: {
        fontSize: "0.75rem",
        color: "rgba(255,255,255,0.55)",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        marginBottom: 3,
    },
    castReadyName: { fontSize: "0.95rem", fontWeight: 600, color: "white" },
    castActions: { display: "flex", gap: 10, flexShrink: 0 },
    castBtn: {
        background: "linear-gradient(135deg, var(--gold), var(--gold-light))",
        color: "var(--navy)",
        border: "none",
        padding: "12px 28px",
        borderRadius: "var(--radius-md)",
        fontSize: "0.95rem",
        fontWeight: 700,
        boxShadow: "var(--shadow-gold)",
    },
    changeBtn: {
        background: "rgba(255,255,255,0.1)",
        border: "1px solid rgba(255,255,255,0.2)",
        color: "rgba(255,255,255,0.7)",
        padding: "12px 18px",
        borderRadius: "var(--radius-md)",
        fontSize: "0.875rem",
        fontWeight: 500,
    },
};
