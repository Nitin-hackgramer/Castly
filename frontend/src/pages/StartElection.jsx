import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { startElection } from "../api/api";

const EMOJI_HINT = ["🪷", "✋", "🧹", "🚲", "⭐", "🔥"];

export default function StartElection() {
    const navigate = useNavigate();
    const [title, setTitle] = useState("General Election 2026");
    const [candidateCount, setCandidateCount] = useState(4);
    const [candidates, setCandidates] = useState([
        { name: "Bhartiya Janta Party (BJP)", emoji: "🪷" },
        { name: "Indian National Congress (INC)", emoji: "✋" },
        { name: "Aam Aadmi Party (AAP)", emoji: "🧹" },
        { name: "Samajwadi Party (SP)", emoji: "🚲" },
    ]);
    const [endsAt, setEndsAt] = useState("");
    const [voterPassword, setVoterPassword] = useState("");
    const [adminPassword, setAdminPassword] = useState("");
    const [launchResult, setLaunchResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const dynamicCandidates = useMemo(() => {
        const next = [...candidates];
        while (next.length < candidateCount) {
            next.push({ name: "", emoji: "" });
        }
        return next.slice(0, candidateCount);
    }, [candidates, candidateCount]);

    const updateCandidate = (index, patch) => {
        const next = [...dynamicCandidates];
        next[index] = { ...next[index], ...patch };
        setCandidates(next);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (candidateCount < 2) {
            setError("At least 2 candidates are required.");
            return;
        }

        const payloadCandidates = dynamicCandidates.map((candidate) => ({
            name: candidate.name.trim(),
            emoji: candidate.emoji.trim(),
        }));

        if (
            payloadCandidates.some(
                (candidate) => !candidate.name || !candidate.emoji,
            )
        ) {
            setError("Please enter both name and emoji for all candidates.");
            return;
        }

        if (!voterPassword.trim()) {
            setError("Voter verification password is required.");
            return;
        }

        if (!adminPassword.trim()) {
            setError("Admin page password is required.");
            return;
        }

        setLoading(true);
        try {
            const res = await startElection({
                title: title.trim() || "General Election",
                candidates: payloadCandidates,
                ends_at: endsAt || null,
                voter_password: voterPassword,
                admin_password: adminPassword,
            });
            setLaunchResult({
                electionTitle: res.data?.election?.title,
                adminToken: res.data?.admin_token,
            });
        } catch (err) {
            setError(err.response?.data?.error || "Failed to start election.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={s.page}>
            <div style={s.wrap}>
                <h1 style={s.title}>Start Election</h1>
                <p style={s.subtitle}>
                    Configure candidates and launch a new election session.
                </p>

                <form onSubmit={handleSubmit} style={s.form}>
                    <label style={s.label}>Election title</label>
                    <input
                        style={s.input}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="General Election 2026"
                    />

                    <label style={s.label}>Number of candidates</label>
                    <input
                        style={s.input}
                        type="number"
                        min={2}
                        max={12}
                        value={candidateCount}
                        onChange={(e) =>
                            setCandidateCount(
                                Math.max(2, Number(e.target.value || 2)),
                            )
                        }
                    />

                    <label style={s.label}>Election end time (optional)</label>
                    <input
                        style={s.input}
                        type="datetime-local"
                        value={endsAt}
                        onChange={(e) => setEndsAt(e.target.value)}
                    />

                    <label style={s.label}>Voter verification password</label>
                    <input
                        style={s.input}
                        type="password"
                        value={voterPassword}
                        onChange={(e) => setVoterPassword(e.target.value)}
                        placeholder="Required before any user can vote"
                    />

                    <label style={s.label}>Admin page password</label>
                    <input
                        style={s.input}
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Required for organizer admin access"
                    />

                    <div style={s.blockTitle}>Candidates</div>
                    {dynamicCandidates.map((candidate, index) => (
                        <div key={index} style={s.row}>
                            <input
                                style={{ ...s.input, flex: 1 }}
                                placeholder={`Candidate #${index + 1} name`}
                                value={candidate.name}
                                onChange={(e) =>
                                    updateCandidate(index, {
                                        name: e.target.value,
                                    })
                                }
                            />
                            <input
                                style={{
                                    ...s.input,
                                    width: 110,
                                    textAlign: "center",
                                }}
                                placeholder="Emoji"
                                value={candidate.emoji}
                                onChange={(e) =>
                                    updateCandidate(index, {
                                        emoji: e.target.value,
                                    })
                                }
                            />
                        </div>
                    ))}

                    <div style={s.hint}>
                        Emoji examples: {EMOJI_HINT.join(" ")}
                    </div>

                    {error && <div style={s.error}>{error}</div>}

                    {launchResult?.adminToken && (
                        <div style={s.launchTokenCard}>
                            <div style={s.launchTokenTitle}>
                                Election launched successfully
                            </div>
                            <div style={s.launchTokenText}>
                                Save this admin token for official counting:
                            </div>
                            <div style={s.launchTokenValue}>
                                {launchResult.adminToken}
                            </div>
                            <div style={s.launchTokenHint}>
                                This token is unique for{" "}
                                {launchResult.electionTitle || "this election"}{" "}
                                and should be kept private.
                            </div>
                        </div>
                    )}

                    <div style={s.actions}>
                        <button
                            type="submit"
                            style={s.primaryBtn}
                            disabled={loading}
                        >
                            {loading ? "Starting..." : "Start Election"}
                        </button>
                        <button
                            type="button"
                            style={s.secondaryBtn}
                            onClick={() => navigate("/vote")}
                        >
                            Go to Voting
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const s = {
    page: {
        padding: "40px 16px",
        minHeight: "80vh",
        background: "var(--off-white)",
    },
    wrap: {
        maxWidth: 760,
        margin: "0 auto",
        background: "white",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
        padding: 28,
    },
    title: {
        fontFamily: "Playfair Display, serif",
        color: "var(--navy)",
        marginBottom: 6,
    },
    subtitle: { color: "var(--text-secondary)", marginBottom: 20 },
    form: { display: "flex", flexDirection: "column", gap: 12 },
    label: {
        fontSize: "0.84rem",
        fontWeight: 600,
        color: "var(--text-secondary)",
    },
    input: {
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        padding: "10px 12px",
        fontSize: "0.95rem",
    },
    blockTitle: { marginTop: 8, fontWeight: 700, color: "var(--navy)" },
    row: { display: "flex", gap: 10, alignItems: "center" },
    hint: { fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 2 },
    launchTokenCard: {
        background: "#fff7ed",
        border: "1px solid #fdba74",
        borderRadius: "var(--radius-sm)",
        padding: "12px",
    },
    launchTokenTitle: {
        color: "#9a3412",
        fontWeight: 700,
        marginBottom: 4,
    },
    launchTokenText: { fontSize: "0.86rem", color: "#7c2d12", marginBottom: 6 },
    launchTokenValue: {
        background: "#fff",
        border: "1px solid #fed7aa",
        borderRadius: "var(--radius-sm)",
        padding: "8px",
        fontFamily: "monospace",
        wordBreak: "break-all",
        color: "#7c2d12",
    },
    launchTokenHint: { fontSize: "0.8rem", color: "#9a3412", marginTop: 6 },
    error: {
        background: "#ffebee",
        border: "1px solid #ef9a9a",
        color: "#c62828",
        borderRadius: "var(--radius-sm)",
        padding: "10px 12px",
    },
    actions: { display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" },
    primaryBtn: {
        background: "var(--navy)",
        color: "white",
        border: "none",
        borderRadius: "var(--radius-sm)",
        padding: "11px 16px",
        fontWeight: 600,
        cursor: "pointer",
    },
    secondaryBtn: {
        background: "white",
        color: "var(--navy)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        padding: "11px 16px",
        fontWeight: 600,
        cursor: "pointer",
    },
};
