import React, { useState } from "react";
import { verifyChain } from "../api/api";

export default function ChainCheck() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");

    const runCheck = async () => {
        setLoading(true);
        setResult(null);
        setError("");

        try {
            const res = await verifyChain();
            setResult(res.data);
        } catch (err) {
            setError(
                err.response?.data?.message || "Chain verification failed",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <h2 style={styles.title}>Public Audit Chain Verification</h2>
                <p style={styles.subtitle}>
                    Check endpoint: GET /api/audit/verify-chain/
                </p>

                <button
                    style={styles.btn}
                    onClick={runCheck}
                    disabled={loading}
                >
                    {loading ? "Verifying..." : "Verify Chain"}
                </button>

                {result && (
                    <div style={styles.okBox}>
                        <p>
                            <strong>Status:</strong> {result.status}
                        </p>
                        <p>{result.message}</p>
                        {typeof result.votes_verified === "number" && (
                            <p>
                                <strong>Votes Verified:</strong>{" "}
                                {result.votes_verified}
                            </p>
                        )}
                    </div>
                )}

                {error && <div style={styles.errorBox}>⚠ {error}</div>}
            </div>
        </div>
    );
}

const styles = {
    page: { padding: "32px 16px" },
    card: {
        maxWidth: 560,
        margin: "0 auto",
        background: "#fff",
        border: "1px solid #e0e0e0",
        borderRadius: 10,
        padding: 24,
    },
    title: { margin: "0 0 8px", color: "#1a237e" },
    subtitle: { margin: "0 0 16px", color: "#666", fontSize: "0.9rem" },
    btn: {
        background: "#1a237e",
        color: "#fff",
        border: "none",
        borderRadius: 6,
        padding: "10px 18px",
        cursor: "pointer",
        fontWeight: 600,
    },
    okBox: {
        marginTop: 14,
        background: "#e8f5e9",
        border: "1px solid #a5d6a7",
        borderRadius: 6,
        padding: "12px 14px",
        color: "#2e7d32",
    },
    errorBox: {
        marginTop: 14,
        background: "#ffebee",
        border: "1px solid #ef9a9a",
        borderRadius: 6,
        padding: "12px 14px",
        color: "#c62828",
    },
};
