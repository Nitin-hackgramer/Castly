// import React, { useState } from "react";
// import { useLocation } from "react-router-dom";
// import { verifyReceipt } from "../api/api";

// export default function Receipt() {
//     const location = useLocation();
//     const passed = location.state; // { receipt, voterName } passed from Vote page

//     const [input, setInput] = useState("");
//     const [result, setResult] = useState(null);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState("");
//     const [copied, setCopied] = useState(false);

//     const handleVerify = async (hash) => {
//         const target = hash || input.trim();
//         if (!target) return;
//         setLoading(true);
//         setError("");
//         setResult(null);
//         try {
//             const res = await verifyReceipt(target);
//             setResult(res.data);
//         } catch {
//             setError("Receipt not found. Please check and try again.");
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleCopy = () => {
//         navigator.clipboard.writeText(passed?.receipt || "");
//         setCopied(true);
//         setTimeout(() => setCopied(false), 2000);
//     };

//     return (
//         <div style={styles.page}>
//             <div style={styles.container}>
//                 {/* Your receipt — shown only if navigated from Vote page */}
//                 {passed?.receipt && (
//                     <div style={styles.receiptCard}>
//                         <div style={styles.successIcon}>✓</div>
//                         <h2 style={styles.successTitle}>
//                             Vote Cast Successfully
//                         </h2>
//                         <p style={styles.voterName}>
//                             Voted as: <strong>{passed.voterName}</strong>
//                         </p>

//                         <div style={styles.hashBox}>
//                             <p style={styles.hashLabel}>
//                                 Your Cryptographic Receipt
//                             </p>
//                             <code style={styles.hash}>{passed.receipt}</code>
//                             <button style={styles.copyBtn} onClick={handleCopy}>
//                                 {copied ? "✓ Copied!" : "Copy Receipt"}
//                             </button>
//                         </div>

//                         <p style={styles.saveNote}>
//                             📸 Screenshot this receipt. It is your permanent
//                             proof that your vote was recorded.
//                         </p>

//                         <button
//                             style={styles.verifyOwnBtn}
//                             onClick={() => handleVerify(passed.receipt)}
//                         >
//                             Verify My Vote Now →
//                         </button>
//                     </div>
//                 )}

//                 {/* Verify any receipt */}
//                 <div style={styles.verifyCard}>
//                     <h3 style={styles.verifyTitle}>🔍 Verify Any Receipt</h3>
//                     <p style={styles.verifySubtitle}>
//                         Enter any receipt hash to confirm the vote exists in the
//                         system.
//                     </p>
//                     <div style={styles.inputRow}>
//                         <input
//                             style={styles.input}
//                             placeholder="Paste receipt hash here..."
//                             value={input}
//                             onChange={(e) => setInput(e.target.value)}
//                         />
//                         <button
//                             style={styles.verifyBtn}
//                             onClick={() => handleVerify()}
//                             disabled={loading || !input.trim()}
//                         >
//                             {loading ? "..." : "Verify"}
//                         </button>
//                     </div>

//                     {error && (
//                         <div style={styles.resultFail}>
//                             <span style={styles.resultIcon}>✗</span>
//                             <div>
//                                 <strong>Not Found</strong>
//                                 <p style={styles.resultMsg}>{error}</p>
//                             </div>
//                         </div>
//                     )}

//                     {result && (
//                         <div style={styles.resultSuccess}>
//                             <span style={styles.resultIcon}>✓</span>
//                             <div>
//                                 <strong>Vote Confirmed</strong>
//                                 <p style={styles.resultMsg}>
//                                     Status: {result.status} · Recorded at:{" "}
//                                     {new Date(
//                                         result.timestamp,
//                                     ).toLocaleString()}
//                                 </p>
//                                 <p style={styles.resultMsg}>{result.message}</p>
//                             </div>
//                         </div>
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// }

// const styles = {
//     page: { padding: "32px 16px" },
//     container: {
//         maxWidth: 560,
//         margin: "0 auto",
//         display: "flex",
//         flexDirection: "column",
//         gap: 24,
//     },
//     receiptCard: {
//         background: "#fff",
//         border: "1px solid #c8e6c9",
//         borderRadius: 12,
//         padding: 32,
//         textAlign: "center",
//         boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
//     },
//     successIcon: {
//         width: 60,
//         height: 60,
//         background: "#43a047",
//         color: "#fff",
//         borderRadius: "50%",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         fontSize: "1.8rem",
//         margin: "0 auto 16px",
//         fontWeight: 700,
//     },
//     successTitle: { fontSize: "1.4rem", color: "#2e7d32", margin: "0 0 8px" },
//     voterName: { color: "#555", fontSize: "0.9rem", margin: "0 0 20px" },
//     hashBox: {
//         background: "#f5f5f5",
//         borderRadius: 8,
//         padding: 16,
//         marginBottom: 16,
//     },
//     hashLabel: {
//         fontSize: "0.78rem",
//         color: "#888",
//         margin: "0 0 8px",
//         textTransform: "uppercase",
//         letterSpacing: 1,
//     },
//     hash: {
//         display: "block",
//         wordBreak: "break-all",
//         fontSize: "0.78rem",
//         color: "#1a237e",
//         fontFamily: "monospace",
//         marginBottom: 12,
//     },
//     copyBtn: {
//         background: "#1a237e",
//         color: "#fff",
//         border: "none",
//         padding: "6px 18px",
//         borderRadius: 4,
//         cursor: "pointer",
//         fontSize: "0.82rem",
//     },
//     saveNote: {
//         fontSize: "0.85rem",
//         color: "#666",
//         margin: "0 0 20px",
//         lineHeight: 1.5,
//     },
//     verifyOwnBtn: {
//         background: "transparent",
//         border: "1px solid #1a237e",
//         color: "#1a237e",
//         padding: "8px 20px",
//         borderRadius: 6,
//         cursor: "pointer",
//         fontWeight: 600,
//     },
//     verifyCard: {
//         background: "#fff",
//         border: "1px solid #e0e0e0",
//         borderRadius: 12,
//         padding: 28,
//         boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
//     },
//     verifyTitle: { margin: "0 0 8px", color: "#1a237e" },
//     verifySubtitle: { color: "#666", fontSize: "0.88rem", margin: "0 0 16px" },
//     inputRow: { display: "flex", gap: 8 },
//     input: {
//         flex: 1,
//         padding: "10px 14px",
//         border: "1px solid #ccc",
//         borderRadius: 6,
//         fontSize: "0.9rem",
//         fontFamily: "monospace",
//     },
//     verifyBtn: {
//         background: "#1a237e",
//         color: "#fff",
//         border: "none",
//         padding: "10px 20px",
//         borderRadius: 6,
//         cursor: "pointer",
//         fontWeight: 600,
//         whiteSpace: "nowrap",
//     },
//     resultSuccess: {
//         display: "flex",
//         gap: 12,
//         background: "#e8f5e9",
//         border: "1px solid #a5d6a7",
//         borderRadius: 8,
//         padding: 16,
//         marginTop: 16,
//         alignItems: "flex-start",
//     },
//     resultFail: {
//         display: "flex",
//         gap: 12,
//         background: "#ffebee",
//         border: "1px solid #ef9a9a",
//         borderRadius: 8,
//         padding: 16,
//         marginTop: 16,
//         alignItems: "flex-start",
//     },
//     resultIcon: { fontSize: "1.3rem", flexShrink: 0 },
//     resultMsg: { margin: "4px 0 0", fontSize: "0.85rem", color: "#555" },
// };

import { useState } from "react";
import { useLocation } from "react-router-dom";
import { resolveElectionForReceipt, verifyReceipt } from "../api/api";

export default function Receipt() {
    const location = useLocation();
    const passed = location.state; // { receipt, voterName } passed from Vote page

    const [input, setInput] = useState("");
    const [electionPassword, setElectionPassword] = useState("");
    const [resolvedElectionId, setResolvedElectionId] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    const handleUnlock = async () => {
        if (!electionPassword.trim()) {
            setError("Election verification password is required.");
            return;
        }
        setLoading(true);
        setError("");
        setResult(null);
        try {
            const res = await resolveElectionForReceipt(
                electionPassword.trim(),
            );
            setResolvedElectionId(res.data.election_id);
        } catch (err) {
            setError(
                err.response?.data?.error ||
                    "Invalid election verification password.",
            );
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (hash) => {
        const target = (hash || input).trim();
        if (!target) return;
        if (!resolvedElectionId) {
            setError("Enter election password first to unlock verification.");
            return;
        }
        setLoading(true);
        setError("");
        setResult(null);
        try {
            const res = await verifyReceipt(target, resolvedElectionId);
            setResult(res.data);
        } catch {
            setError("This receipt was not found. Please check and try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(passed?.receipt || "");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={s.page}>
            <div style={s.container}>
                {/* Page header */}
                <div style={s.pageHeader}>
                    <div style={s.breadcrumb}>General Election 2026</div>
                    <h1 style={s.pageTitle}>Vote Receipt</h1>
                    <p style={s.pageDesc}>
                        Your cryptographic proof of participation. Enter any
                        receipt hash to verify it exists in the system.
                    </p>
                </div>

                <div style={s.twoCol}>
                    {/* Your receipt — left */}
                    {passed?.receipt && (
                        <div style={s.receiptCard}>
                            <div style={s.receiptCardTop}>
                                <div style={s.successIconWrap}>
                                    <div style={s.successIcon}>✓</div>
                                </div>
                                <div>
                                    <h2 style={s.receiptTitle}>
                                        Vote Recorded
                                    </h2>
                                    <p style={s.receiptSubtitle}>
                                        Voted as:{" "}
                                        <strong>{passed.voterName}</strong>
                                    </p>
                                </div>
                            </div>

                            <div style={s.divider} />

                            <div style={s.hashSection}>
                                <div style={s.hashLabel}>
                                    Cryptographic Receipt Hash
                                </div>
                                <div style={s.hashBox}>
                                    <code style={s.hashCode}>
                                        {passed.receipt}
                                    </code>
                                </div>
                                <button style={s.copyBtn} onClick={handleCopy}>
                                    {copied
                                        ? "✓ Copied to clipboard"
                                        : "Copy Receipt Hash"}
                                </button>
                            </div>

                            <div style={s.saveNote}>
                                <span style={s.saveNoteIcon}>📸</span>
                                <span>
                                    Screenshot this page. Your receipt hash is
                                    permanent proof that your vote was recorded
                                    — without revealing your choice.
                                </span>
                            </div>

                            <button
                                style={s.verifyOwnBtn}
                                onClick={() => handleVerify(passed.receipt)}
                                disabled={loading}
                            >
                                {loading
                                    ? "Verifying..."
                                    : "Verify This Receipt →"}
                            </button>
                        </div>
                    )}

                    {/* Verify any receipt — right */}
                    <div
                        style={{
                            ...s.verifyCard,
                            flex: passed?.receipt ? "0 0 360px" : "0 0 100%",
                        }}
                    >
                        <div style={s.verifyIcon}>🔍</div>
                        <h3 style={s.verifyTitle}>Verify Any Receipt</h3>
                        <p style={s.verifyDesc}>
                            Enter any receipt hash to confirm it's present and
                            active in the system.
                        </p>

                        <div style={s.unlockCard}>
                            <label style={s.selectLabel}>
                                Election verification password
                            </label>
                            <div style={s.inputGroup}>
                                <input
                                    style={{
                                        ...s.input,
                                        fontFamily: "inherit",
                                    }}
                                    type="password"
                                    placeholder="Enter election password"
                                    value={electionPassword}
                                    onChange={(e) =>
                                        setElectionPassword(e.target.value)
                                    }
                                    onKeyDown={(e) =>
                                        e.key === "Enter" && handleUnlock()
                                    }
                                />
                                <button
                                    style={s.verifyBtn}
                                    onClick={handleUnlock}
                                    disabled={
                                        loading || !electionPassword.trim()
                                    }
                                >
                                    {loading ? "..." : "Unlock"}
                                </button>
                            </div>
                            {resolvedElectionId && (
                                <div style={s.unlockSuccess}>
                                    Verification unlocked.
                                </div>
                            )}
                        </div>

                        <div style={s.inputGroup}>
                            <input
                                style={s.input}
                                placeholder="Paste receipt hash here..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === "Enter" && handleVerify()
                                }
                            />
                            <button
                                style={{
                                    ...s.verifyBtn,
                                    opacity:
                                        input.trim() &&
                                        resolvedElectionId &&
                                        !loading
                                            ? 1
                                            : 0.5,
                                }}
                                onClick={() => handleVerify()}
                                disabled={
                                    loading ||
                                    !input.trim() ||
                                    !resolvedElectionId
                                }
                            >
                                {loading ? "..." : "Verify"}
                            </button>
                        </div>

                        {error && (
                            <div style={s.resultBox("fail")}>
                                <div style={s.resultIconCircle("fail")}>✗</div>
                                <div>
                                    <div style={s.resultTitle}>Not Found</div>
                                    <div style={s.resultMsg}>{error}</div>
                                </div>
                            </div>
                        )}

                        {result && (
                            <div style={s.resultBox("ok")}>
                                <div style={s.resultIconCircle("ok")}>✓</div>
                                <div>
                                    <div style={s.resultTitle}>
                                        Vote Confirmed
                                    </div>
                                    <div style={s.resultMsg}>
                                        Status: {result.status}
                                        <br />
                                        Recorded:{" "}
                                        {new Date(
                                            result.timestamp,
                                        ).toLocaleString("en-IN")}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div style={s.auditNote}>
                            <div style={s.auditNoteTitle}>
                                Public Audit Trail
                            </div>
                            <div style={s.auditNoteText}>
                                All votes are stored in a tamper-evident chain.
                                Any modification to any record breaks the chain
                                — instantly detectable.
                            </div>
                        </div>
                    </div>
                </div>
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
    container: { maxWidth: 1000, margin: "0 auto" },

    pageHeader: { marginBottom: 36 },
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
        marginBottom: 8,
    },
    pageDesc: {
        fontSize: "0.9rem",
        color: "var(--text-secondary)",
        maxWidth: 520,
    },

    twoCol: {
        display: "flex",
        gap: 24,
        flexWrap: "wrap",
        alignItems: "flex-start",
    },

    /* Receipt card */
    receiptCard: {
        flex: 1,
        background: "white",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-xl)",
        padding: "32px",
        boxShadow: "var(--shadow-md)",
    },
    receiptCardTop: {
        display: "flex",
        alignItems: "center",
        gap: 16,
        marginBottom: 24,
    },
    successIconWrap: {
        width: 52,
        height: 52,
        flexShrink: 0,
        background: "linear-gradient(135deg, #16a34a, #22c55e)",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 12px rgba(22,163,74,0.3)",
    },
    successIcon: { color: "white", fontSize: "1.4rem", fontWeight: 700 },
    receiptTitle: {
        fontFamily: "Playfair Display, serif",
        fontSize: "1.3rem",
        fontWeight: 700,
        color: "var(--navy)",
        marginBottom: 3,
    },
    receiptSubtitle: { fontSize: "0.85rem", color: "var(--text-secondary)" },
    divider: { height: 1, background: "var(--border)", marginBottom: 24 },

    hashSection: { marginBottom: 16 },
    hashLabel: {
        fontSize: "0.72rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "var(--text-muted)",
        marginBottom: 8,
    },
    hashBox: {
        background: "var(--off-white)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "14px",
        marginBottom: 10,
    },
    hashCode: {
        fontFamily: "DM Mono, monospace",
        fontSize: "0.75rem",
        color: "var(--navy)",
        wordBreak: "break-all",
        lineHeight: 1.6,
        display: "block",
    },
    copyBtn: {
        background: "var(--navy)",
        color: "white",
        border: "none",
        padding: "8px 18px",
        borderRadius: "var(--radius-sm)",
        fontSize: "0.82rem",
        fontWeight: 600,
    },
    saveNote: {
        background: "#fffbeb",
        border: "1px solid #fde68a",
        borderRadius: "var(--radius-md)",
        padding: "12px 14px",
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        fontSize: "0.82rem",
        color: "#92400e",
        lineHeight: 1.5,
        marginBottom: 16,
    },
    saveNoteIcon: { fontSize: "1rem", flexShrink: 0, marginTop: 1 },
    verifyOwnBtn: {
        width: "100%",
        background: "transparent",
        border: "1.5px solid var(--navy)",
        color: "var(--navy)",
        padding: "11px",
        borderRadius: "var(--radius-md)",
        fontSize: "0.9rem",
        fontWeight: 600,
    },

    /* Verify card */
    verifyCard: {
        background: "white",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-xl)",
        padding: "32px",
        boxShadow: "var(--shadow-md)",
    },
    verifyIcon: { fontSize: "2rem", marginBottom: 12 },
    verifyTitle: {
        fontFamily: "Playfair Display, serif",
        fontSize: "1.2rem",
        fontWeight: 700,
        color: "var(--navy)",
        marginBottom: 6,
    },
    verifyDesc: {
        fontSize: "0.875rem",
        color: "var(--text-secondary)",
        marginBottom: 20,
        lineHeight: 1.6,
    },
    unlockCard: {
        background: "var(--off-white)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "12px",
        marginBottom: 12,
    },
    unlockSuccess: {
        fontSize: "0.8rem",
        color: "var(--success)",
        marginTop: 4,
        fontWeight: 600,
    },
    selectLabel: {
        display: "block",
        fontSize: "0.8rem",
        fontWeight: 600,
        color: "var(--text-muted)",
        marginBottom: 6,
    },
    inputGroup: { display: "flex", gap: 10, marginBottom: 16 },
    input: {
        flex: 1,
        padding: "11px 14px",
        border: "1.5px solid var(--border)",
        borderRadius: "var(--radius-md)",
        fontSize: "0.85rem",
        fontFamily: "DM Mono, monospace",
        background: "var(--off-white)",
    },
    verifyBtn: {
        background: "var(--navy)",
        color: "white",
        border: "none",
        padding: "11px 20px",
        borderRadius: "var(--radius-md)",
        fontSize: "0.9rem",
        fontWeight: 600,
        flexShrink: 0,
    },

    resultBox: (type) => ({
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        background: type === "ok" ? "var(--success-bg)" : "var(--danger-bg)",
        border: `1px solid ${type === "ok" ? "#bbf7d0" : "#fecaca"}`,
        borderRadius: "var(--radius-md)",
        padding: "14px 16px",
        marginBottom: 16,
    }),
    resultIconCircle: (type) => ({
        width: 30,
        height: 30,
        borderRadius: "50%",
        flexShrink: 0,
        background: type === "ok" ? "var(--success)" : "var(--danger)",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: "0.85rem",
    }),
    resultTitle: {
        fontWeight: 700,
        fontSize: "0.9rem",
        color: "var(--text-primary)",
        marginBottom: 3,
    },
    resultMsg: {
        fontSize: "0.82rem",
        color: "var(--text-secondary)",
        lineHeight: 1.5,
    },

    auditNote: {
        background: "var(--off-white)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "14px",
        marginTop: 4,
    },
    auditNoteTitle: {
        fontSize: "0.75rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: "var(--navy)",
        marginBottom: 4,
    },
    auditNoteText: {
        fontSize: "0.8rem",
        color: "var(--text-secondary)",
        lineHeight: 1.55,
    },
};
