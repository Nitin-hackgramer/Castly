import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getSessionStatus } from "../api/api";

export default function SessionStatus() {
    const { auth } = useAuth();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");

    const checkStatus = async () => {
        if (!auth.token) {
            setError("No active session. Please start a session first.");
            setResult(null);
            return;
        }

        setLoading(true);
        setError("");
        setResult(null);

        try {
            const res = await getSessionStatus(auth.token);
            setResult(res.data);
        } catch (err) {
            setError(
                err.response?.data?.reason || "Session status check failed",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <h2 style={styles.title}>Session Status</h2>
                <p style={styles.subtitle}>
                    Check current session for the active event.
                </p>

                <button
                    style={styles.btn}
                    onClick={checkStatus}
                    disabled={loading}
                >
                    {loading ? "Checking..." : "Check Session Status"}
                </button>

                {error && <div style={styles.error}>⚠ {error}</div>}

                {result && (
                    <div style={styles.result}>
                        <p>
                            <strong>Valid:</strong> {String(result.valid)}
                        </p>
                        {result.voter_name && (
                            <p>
                                <strong>Voter:</strong> {result.voter_name}
                            </p>
                        )}
                        {result.constituency && (
                            <p>
                                <strong>Constituency:</strong>{" "}
                                {result.constituency}
                            </p>
                        )}
                    </div>
                )}

                {!auth.token && (
                    <p style={styles.note}>
                        You are not logged in. Go to the{" "}
                        <Link to="/vote">voting</Link> page to start a session.
                    </p>
                )}
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
    error: {
        marginTop: 14,
        background: "#ffebee",
        border: "1px solid #ef9a9a",
        color: "#c62828",
        borderRadius: 6,
        padding: "10px 12px",
        fontSize: "0.9rem",
    },
    result: {
        marginTop: 14,
        background: "#e8f5e9",
        border: "1px solid #a5d6a7",
        borderRadius: 6,
        padding: "12px 14px",
        color: "#2e7d32",
    },
    note: { marginTop: 14, color: "#666", fontSize: "0.9rem" },
};
