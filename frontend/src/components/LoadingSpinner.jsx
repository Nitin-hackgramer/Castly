export default function LoadingSpinner({ text = "Processing..." }) {
    return (
        <div style={s.wrap}>
            <div style={s.ring}>
                <div style={s.spinner} />
            </div>
            <p style={s.text}>{text}</p>
        </div>
    );
}

const s = {
    wrap: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "28px 16px",
        gap: 14,
    },
    ring: {
        width: 40,
        height: 40,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    spinner: {
        width: 40,
        height: 40,
        border: "3px solid rgba(36,81,180,0.12)",
        borderTop: "3px solid var(--blue)",
        borderRight: "3px solid var(--gold)",
        borderRadius: "50%",
        animation: "spin 0.75s linear infinite",
    },
    text: {
        fontSize: "0.85rem",
        color: "var(--text-muted)",
        fontWeight: 500,
        letterSpacing: "0.02em",
    },
};
