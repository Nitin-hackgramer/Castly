import { useState, useEffect } from "react";
import {
    adminLoginByPassword,
    forceCloseElection,
    getStats,
    verifyChain,
    tamperTest,
    restoreTamper,
    triggerCount,
} from "../api/api";

export default function Admin() {
    const [authed, setAuthed] = useState(false);
    const [adminSessionToken, setAdminSessionToken] = useState("");
    const [authedElectionId, setAuthedElectionId] = useState("");
    const [pwInput, setPwInput] = useState("");
    const [pwError, setPwError] = useState("");
    const [stats, setStats] = useState(null);
    const [statsError, setStatsError] = useState("");
    const [chainResult, setChainResult] = useState(null);
    const [countResult, setCountResult] = useState(null);
    const [countError, setCountError] = useState("");
    const [adminToken, setAdminToken] = useState("");
    const [tamperState, setTamperState] = useState("clean");
    const [loading, setLoading] = useState({});

    const setLoad = (key, val) => setLoading((p) => ({ ...p, [key]: val }));

    useEffect(() => {
        if (!authed || !authedElectionId) return;
        fetchStats();
        const id = setInterval(fetchStats, 10000);
        return () => clearInterval(id);
    }, [authed, authedElectionId]);

    useEffect(() => {
        if (!authed || !authedElectionId) return;
        fetchStats();
    }, [authedElectionId]);

    const fetchStats = async () => {
        if (!authedElectionId) return;
        try {
            const res = await getStats(authedElectionId);
            const data = res.data;
            setStats(data);
            if (data.official_count_ready) {
                setCountResult({
                    results: data.official_results || {},
                    total_votes: data.official_total_votes || 0,
                    election_id: data.election_id,
                    election_title: data.election_title,
                    counted_at: data.counted_at,
                });
            }
            setStatsError("");
        } catch (err) {
            setStatsError(
                err.response?.status === 404
                    ? "Stats endpoint not available on backend"
                    : "Failed to load stats",
            );
        }
    };

    const handleTriggerCount = async () => {
        setLoad("count", true);
        setCountError("");
        try {
            const res = await triggerCount(adminToken.trim(), authedElectionId);
            setCountResult(res.data);
            setAdminToken("");
            await fetchStats();
        } catch (err) {
            setCountError(
                err.response?.data?.error || "Failed to trigger counting",
            );
        } finally {
            setLoad("count", false);
        }
    };

    const handleChainVerify = async () => {
        setLoad("chain", true);
        setChainResult(null);
        try {
            const res = await verifyChain(authedElectionId);
            setChainResult({ ok: true, data: res.data });
        } catch (err) {
            setChainResult({ ok: false, data: err.response?.data });
        } finally {
            setLoad("chain", false);
        }
    };

    const handleTamper = async () => {
        setLoad("tamper", true);
        try {
            await tamperTest(authedElectionId);
            setTamperState("tampered");
            setChainResult(null);
        } catch (err) {
            alert(err.response?.data?.error || "No votes to tamper");
        } finally {
            setLoad("tamper", false);
        }
    };

    const handleRestore = async () => {
        setLoad("restore", true);
        try {
            await restoreTamper(authedElectionId);
            setTamperState("clean");
            setChainResult(null);
        } catch {
        } finally {
            setLoad("restore", false);
        }
    };

    const handleAdminAccess = async () => {
        setPwError("");
        if (!pwInput.trim()) {
            setPwError("Admin password is required.");
            return;
        }

        setLoad("adminLogin", true);
        try {
            const res = await adminLoginByPassword(pwInput);
            setAdminSessionToken(res.data.admin_session_token);
            setAuthedElectionId(res.data.election_id);
            setAuthed(true);
            setPwInput("");
        } catch (err) {
            setPwError(
                err.response?.data?.error ||
                    "Failed to authenticate for this election.",
            );
        } finally {
            setLoad("adminLogin", false);
        }
    };

    const handleForceClose = async () => {
        if (!authedElectionId || !adminSessionToken) return;
        const confirmed = window.confirm(
            "Force close this election now? Voting will stop immediately.",
        );
        if (!confirmed) return;

        setLoad("forceClose", true);
        try {
            await forceCloseElection(authedElectionId, adminSessionToken);
            await fetchStats();
        } catch (err) {
            setCountError(
                err.response?.data?.error || "Failed to force close.",
            );
        } finally {
            setLoad("forceClose", false);
        }
    };

    /* ── Password Gate ───────────────────────────────── */
    if (!authed)
        return (
            <div style={s.gatePage}>
                <div style={s.gateWrap}>
                    {/* Left decoration */}
                    <div style={s.gateLeft}>
                        <div style={s.gateLeftContent}>
                            <div style={s.gateEmblem}>🏛️</div>
                            <h2 style={s.gateLeftTitle}>
                                Election Commission Portal
                            </h2>
                            <p style={s.gateLeftDesc}>
                                Restricted access. Authorised personnel only.
                                All actions are logged and audited.
                            </p>
                            <div style={s.gateFeatures}>
                                {[
                                    "Live vote statistics",
                                    "Chain integrity verification",
                                    "Tamper simulation & detection",
                                    "Official vote counting",
                                ].map((f, i) => (
                                    <div key={i} style={s.gateFeature}>
                                        <div style={s.gateFeatureDot} />
                                        {f}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right form */}
                    <div style={s.gateRight}>
                        <div style={s.gateCard}>
                            <div style={s.gateLockIcon}>🔐</div>
                            <h3 style={s.gateCardTitle}>Admin Access</h3>
                            <p style={s.gateCardDesc}>
                                Enter your admin password to open your election
                                dashboard
                            </p>
                            {pwError && <div style={s.error}>{pwError}</div>}
                            <label style={s.label}>Password</label>
                            <input
                                style={s.input}
                                type="password"
                                placeholder="Enter admin password"
                                value={pwInput}
                                onChange={(e) => setPwInput(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === "Enter" && handleAdminAccess()
                                }
                            />
                            <button
                                style={s.gateBtn}
                                onClick={handleAdminAccess}
                                disabled={loading.adminLogin}
                            >
                                {loading.adminLogin
                                    ? "Checking..."
                                    : "Access Portal →"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );

    /* ── Dashboard ───────────────────────────────────── */
    return (
        <div style={s.page}>
            <div style={s.container}>
                {/* Header */}
                <div style={s.dashHeader}>
                    <div>
                        <div style={s.breadcrumb}>Admin Portal</div>
                        <h1 style={s.dashTitle}>
                            Election Commission Dashboard
                        </h1>
                    </div>
                    <div style={s.liveChip}>
                        <div style={s.liveDot} />
                        Live · refreshes every 10s
                    </div>
                </div>

                <div style={{ ...s.section, marginBottom: 16 }}>
                    <h3 style={s.sectionTitle}>Election Scope</h3>
                    <p style={s.sectionDesc}>
                        Authenticated for one election only. All stats, audit,
                        force-close, and count actions below are scoped to this
                        election.
                    </p>
                    <div style={s.scopeChip}>
                        {stats?.election_title || "Election"} •{" "}
                        {stats?.election_status || "UNKNOWN"}
                    </div>
                </div>

                <div style={{ ...s.section, marginBottom: 16 }}>
                    <h3 style={s.sectionTitle}>Election Control</h3>
                    <p style={s.sectionDesc}>
                        Use force close if election organizers need to stop
                        voting before the configured end time.
                    </p>
                    <button
                        style={s.dangerBtn}
                        onClick={handleForceClose}
                        disabled={
                            loading.forceClose ||
                            stats?.election_status === "CLOSED"
                        }
                    >
                        {loading.forceClose
                            ? "Closing..."
                            : "Force Close Election"}
                    </button>
                </div>

                {/* Stats row */}
                {statsError ? (
                    <div style={s.error}>{statsError}</div>
                ) : (
                    <div style={s.statsGrid}>
                        <StatCard
                            label="Total Votes Cast"
                            value={stats?.total_votes ?? "—"}
                            icon="🗳️"
                            accent="var(--navy)"
                        />
                        <StatCard
                            label="Election Status"
                            value={stats?.election_status ?? "—"}
                            icon={
                                stats?.election_status === "OPEN" ? "🟢" : "🔴"
                            }
                            accent={
                                stats?.election_status === "OPEN"
                                    ? "var(--success)"
                                    : "var(--danger)"
                            }
                        />
                        <StatCard
                            label="Data Integrity"
                            value={
                                tamperState === "clean" ? "CLEAN" : "TAMPERED"
                            }
                            icon={tamperState === "clean" ? "✅" : "⚠️"}
                            accent={
                                tamperState === "clean"
                                    ? "var(--success)"
                                    : "var(--danger)"
                            }
                        />
                    </div>
                )}

                {/* Chain Integrity */}
                <div style={s.section}>
                    <div style={s.sectionHead}>
                        <div>
                            <h3 style={s.sectionTitle}>
                                🔗 Chain Integrity Audit
                            </h3>
                            <p style={s.sectionDesc}>
                                Verify no vote has been modified, deleted, or
                                inserted since it was cast. Every vote is
                                cryptographically linked — alter one, break all
                                that follow.
                            </p>
                        </div>
                    </div>

                    <div style={s.btnRow}>
                        <button
                            style={s.primaryBtn}
                            onClick={handleChainVerify}
                            disabled={loading.chain}
                        >
                            {loading.chain
                                ? "Verifying..."
                                : "🔍 Verify Chain Integrity"}
                        </button>
                        {tamperState === "clean" ? (
                            <button
                                style={s.dangerBtn}
                                onClick={handleTamper}
                                disabled={loading.tamper}
                            >
                                {loading.tamper
                                    ? "..."
                                    : "⚠ Simulate Tamper Attack"}
                            </button>
                        ) : (
                            <button
                                style={s.successBtn}
                                onClick={handleRestore}
                                disabled={loading.restore}
                            >
                                {loading.restore ? "..." : "🔧 Restore Data"}
                            </button>
                        )}
                    </div>

                    {chainResult && (
                        <div
                            style={{
                                ...s.resultBanner,
                                background: chainResult.ok
                                    ? "var(--success-bg)"
                                    : "var(--danger-bg)",
                                borderColor: chainResult.ok
                                    ? "#bbf7d0"
                                    : "#fecaca",
                            }}
                        >
                            <div
                                style={{
                                    ...s.resultBannerIcon,
                                    background: chainResult.ok
                                        ? "var(--success)"
                                        : "var(--danger)",
                                }}
                            >
                                {chainResult.ok ? "✓" : "✗"}
                            </div>
                            <div>
                                <div style={s.resultBannerTitle}>
                                    Chain{" "}
                                    {chainResult.ok
                                        ? "INTACT"
                                        : "BROKEN — Tampering Detected"}
                                </div>
                                <div style={s.resultBannerMsg}>
                                    {chainResult.ok
                                        ? `${chainResult.data.votes_verified} votes verified — no modifications detected`
                                        : chainResult.data?.message ||
                                          "Chain verification failed"}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Results */}
                <div style={s.section}>
                    <h3 style={s.sectionTitle}>📊 Official Vote Count</h3>
                    <p style={s.sectionDesc}>
                        Counting decrypts all ballots using the Election
                        Commission's private key. Only available after the
                        election deadline.
                    </p>

                    {!countResult && (
                        <div style={s.countRow}>
                            <input
                                style={{ ...s.input, flex: 1, marginBottom: 0 }}
                                placeholder="Admin token (generated for this election)"
                                value={adminToken}
                                onChange={(e) => setAdminToken(e.target.value)}
                            />
                            <button
                                style={s.primaryBtn}
                                onClick={handleTriggerCount}
                                disabled={loading.count}
                            >
                                {loading.count
                                    ? "Counting..."
                                    : "Run Official Count"}
                            </button>
                        </div>
                    )}

                    {countError && (
                        <div style={{ ...s.error, marginTop: 12 }}>
                            {countError}
                        </div>
                    )}

                    {!countResult ? (
                        <div style={s.noResults}>
                            <div style={s.noResultsIcon}>🔒</div>
                            <div style={s.noResultsText}>
                                Results sealed until election closes.
                                <br />
                                <span
                                    style={{
                                        fontSize: "0.8rem",
                                        color: "var(--text-muted)",
                                    }}
                                >
                                    Trigger count after deadline to reveal
                                    official results.
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div style={s.results}>
                            <div style={s.resultsHeader}>
                                Official Results · {countResult.total_votes}{" "}
                                votes counted
                            </div>
                            {Object.entries(countResult.results).map(
                                ([name, count], i) => {
                                    const pct = Math.round(
                                        (count / countResult.total_votes) * 100,
                                    );
                                    return (
                                        <div key={name} style={s.resultRow}>
                                            <div style={s.resultMeta}>
                                                <span
                                                    style={{
                                                        ...s.resultRank,
                                                        color:
                                                            i === 0
                                                                ? "var(--gold)"
                                                                : "var(--text-muted)",
                                                    }}
                                                >
                                                    {i === 0
                                                        ? "🏆"
                                                        : `#${i + 1}`}
                                                </span>
                                                <div>
                                                    <div style={s.resultName}>
                                                        {name}
                                                    </div>
                                                    <div style={s.resultCount}>
                                                        {count} votes · {pct}%
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={s.barTrack}>
                                                <div
                                                    style={{
                                                        ...s.barFill,
                                                        width: `${pct}%`,
                                                        background:
                                                            i === 0
                                                                ? "linear-gradient(90deg, var(--gold), var(--gold-light))"
                                                                : "linear-gradient(90deg, var(--navy), var(--blue-light))",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                },
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, accent }) {
    return (
        <div style={sc.card}>
            <div style={sc.top}>
                <span style={sc.icon}>{icon}</span>
                <div style={{ ...sc.accent, background: accent }} />
            </div>
            <div style={{ ...sc.value, color: accent }}>{value}</div>
            <div style={sc.label}>{label}</div>
        </div>
    );
}
const sc = {
    card: {
        background: "white",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "20px 22px",
        boxShadow: "var(--shadow-sm)",
    },
    top: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
    },
    icon: { fontSize: "1.5rem" },
    accent: { width: 6, height: 6, borderRadius: "50%" },
    value: {
        fontSize: "1.7rem",
        fontWeight: 800,
        marginBottom: 4,
        lineHeight: 1,
    },
    label: {
        fontSize: "0.75rem",
        color: "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        fontWeight: 600,
    },
};

const s = {
    /* Gate */
    gatePage: {
        minHeight: "calc(100vh - 66px)",
        display: "flex",
        alignItems: "stretch",
    },
    gateWrap: { display: "flex", flex: 1, flexWrap: "wrap" },
    gateLeft: {
        flex: "1 1 360px",
        background:
            "linear-gradient(160deg, var(--navy) 0%, var(--navy-light) 100%)",
        padding: "60px 48px",
        display: "flex",
        alignItems: "center",
    },
    gateLeftContent: { color: "white", maxWidth: 360 },
    gateEmblem: { fontSize: "3rem", marginBottom: 24 },
    gateLeftTitle: {
        fontFamily: "Playfair Display, serif",
        fontSize: "1.7rem",
        fontWeight: 700,
        marginBottom: 14,
        lineHeight: 1.3,
    },
    gateLeftDesc: {
        fontSize: "0.9rem",
        color: "rgba(255,255,255,0.55)",
        lineHeight: 1.7,
        marginBottom: 32,
    },
    gateFeatures: {},
    gateFeature: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: "0.875rem",
        color: "rgba(255,255,255,0.75)",
        marginBottom: 10,
    },
    gateFeatureDot: {
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: "var(--gold)",
        flexShrink: 0,
    },
    gateRight: {
        flex: "0 0 420px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        background: "var(--off-white)",
    },
    gateCard: {
        background: "white",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-xl)",
        padding: "40px 36px",
        width: "100%",
        maxWidth: 380,
        boxShadow: "var(--shadow-lg)",
    },
    gateLockIcon: { fontSize: "2.2rem", marginBottom: 16 },
    gateCardTitle: {
        fontFamily: "Playfair Display, serif",
        fontSize: "1.4rem",
        fontWeight: 700,
        color: "var(--navy)",
        marginBottom: 6,
    },
    gateCardDesc: {
        fontSize: "0.875rem",
        color: "var(--text-secondary)",
        marginBottom: 24,
    },
    gateBtn: {
        width: "100%",
        background: "linear-gradient(135deg, var(--navy), var(--navy-light))",
        color: "white",
        border: "none",
        padding: "13px",
        borderRadius: "var(--radius-md)",
        fontSize: "0.95rem",
        fontWeight: 600,
        boxShadow: "var(--shadow-md)",
    },
    gateHint: {
        textAlign: "center",
        fontSize: "0.75rem",
        color: "var(--text-muted)",
        marginTop: 12,
    },

    /* Dashboard */
    page: {
        padding: "40px 24px",
        minHeight: "calc(100vh - 66px)",
        background: "var(--off-white)",
    },
    container: { maxWidth: 900, margin: "0 auto" },
    dashHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 28,
        flexWrap: "wrap",
        gap: 12,
    },
    breadcrumb: {
        fontSize: "0.75rem",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "var(--blue)",
        marginBottom: 6,
    },
    dashTitle: {
        fontFamily: "Playfair Display, serif",
        fontSize: "2rem",
        fontWeight: 700,
        color: "var(--navy)",
    },
    liveChip: {
        display: "flex",
        alignItems: "center",
        gap: 7,
        background: "white",
        border: "1px solid var(--border)",
        borderRadius: 20,
        padding: "6px 14px",
        fontSize: "0.78rem",
        color: "var(--text-secondary)",
        fontWeight: 500,
    },
    liveDot: {
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: "#22c55e",
        animation: "pulse-gold 2s infinite",
    },
    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16,
        marginBottom: 24,
    },
    section: {
        background: "white",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "28px",
        marginBottom: 20,
        boxShadow: "var(--shadow-sm)",
    },
    sectionHead: { marginBottom: 20 },
    sectionTitle: {
        fontSize: "1.05rem",
        fontWeight: 700,
        color: "var(--navy)",
        marginBottom: 6,
    },
    sectionDesc: {
        fontSize: "0.875rem",
        color: "var(--text-secondary)",
        lineHeight: 1.6,
    },
    scopeChip: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: "0.82rem",
        fontWeight: 700,
        color: "var(--navy)",
        background: "#eef2ff",
        border: "1px solid #c7d2fe",
        borderRadius: 999,
        padding: "7px 12px",
    },
    btnRow: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 0 },

    primaryBtn: {
        background: "linear-gradient(135deg, var(--navy), var(--navy-light))",
        color: "white",
        border: "none",
        padding: "10px 20px",
        borderRadius: "var(--radius-md)",
        fontSize: "0.875rem",
        fontWeight: 600,
        boxShadow: "var(--shadow-sm)",
    },
    dangerBtn: {
        background: "white",
        color: "var(--danger)",
        border: "1.5px solid var(--danger)",
        padding: "10px 20px",
        borderRadius: "var(--radius-md)",
        fontSize: "0.875rem",
        fontWeight: 600,
    },
    successBtn: {
        background: "var(--success)",
        color: "white",
        border: "none",
        padding: "10px 20px",
        borderRadius: "var(--radius-md)",
        fontSize: "0.875rem",
        fontWeight: 600,
    },

    resultBanner: {
        display: "flex",
        gap: 14,
        alignItems: "center",
        border: "1px solid",
        borderRadius: "var(--radius-md)",
        padding: "16px",
        marginTop: 16,
    },
    resultBannerIcon: {
        width: 36,
        height: 36,
        borderRadius: "50%",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: "1rem",
        flexShrink: 0,
    },
    resultBannerTitle: {
        fontWeight: 700,
        fontSize: "0.9rem",
        color: "var(--text-primary)",
        marginBottom: 2,
    },
    resultBannerMsg: { fontSize: "0.82rem", color: "var(--text-secondary)" },

    countRow: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        alignItems: "center",
        marginBottom: 0,
    },
    error: {
        background: "var(--danger-bg)",
        color: "var(--danger)",
        border: "1px solid #fecaca",
        borderRadius: "var(--radius-md)",
        padding: "10px 14px",
        fontSize: "0.875rem",
    },
    label: {
        fontSize: "0.82rem",
        fontWeight: 600,
        color: "var(--text-primary)",
        letterSpacing: "0.02em",
        marginBottom: 6,
        display: "block",
    },
    input: {
        width: "100%",
        padding: "11px 14px",
        border: "1.5px solid var(--border)",
        borderRadius: "var(--radius-md)",
        fontSize: "0.9rem",
        marginBottom: 14,
        background: "var(--off-white)",
    },
    noResults: {
        textAlign: "center",
        padding: "40px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        marginTop: 16,
    },
    noResultsIcon: { fontSize: "2rem", opacity: 0.4 },
    noResultsText: {
        fontSize: "0.9rem",
        color: "var(--text-secondary)",
        lineHeight: 1.6,
    },
    results: { marginTop: 20 },
    resultsHeader: {
        fontSize: "0.75rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: "var(--text-muted)",
        marginBottom: 16,
        paddingBottom: 10,
        borderBottom: "1px solid var(--border)",
    },
    resultRow: { marginBottom: 18 },
    resultMeta: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 6,
    },
    resultRank: { fontSize: "1.1rem", flexShrink: 0, width: 28 },
    resultName: { fontSize: "0.9rem", fontWeight: 700, color: "var(--navy)" },
    resultCount: { fontSize: "0.78rem", color: "var(--text-muted)" },
    barTrack: {
        background: "var(--off-white)",
        borderRadius: 4,
        height: 10,
        overflow: "hidden",
        border: "1px solid var(--border)",
    },
    barFill: {
        height: "100%",
        borderRadius: 4,
        transition: "width 0.6s ease",
    },
};
