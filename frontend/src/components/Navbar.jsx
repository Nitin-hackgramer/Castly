import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
    const { auth, logout } = useAuth();
    const location = useLocation();

    return (
        <nav style={s.nav}>
            {/* Gold top line */}
            <div style={s.goldLine} />

            <div style={s.inner}>
                {/* Brand */}
                <Link to="/" style={s.brand}>
                    <div style={s.brandIcon}>
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                        >
                            <path
                                d="M12 2L2 7l10 5 10-5-10-5z"
                                fill="currentColor"
                                opacity="0.9"
                            />
                            <path
                                d="M2 17l10 5 10-5M2 12l10 5 10-5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>
                    <div>
                        <div style={s.brandName}>Castly</div>
                        <div style={s.brandSub}>Organize Secure Elections</div>
                    </div>
                </Link>

                {/* Nav links */}
                <div style={s.links}>
                    {[
                        ["/", "Home"],
                        ["/receipt", "Verify Receipt"],
                    ].map(([path, label]) => (
                        <Link
                            key={path}
                            to={path}
                            style={{
                                ...s.navLink,
                                color:
                                    location.pathname === path
                                        ? "var(--gold-light)"
                                        : "rgba(255,255,255,0.7)",
                                borderBottom:
                                    location.pathname === path
                                        ? "1px solid var(--gold)"
                                        : "1px solid transparent",
                            }}
                        >
                            {label}
                        </Link>
                    ))}
                </div>

                {/* Right side */}
                <div style={s.right}>
                    {auth.token ? (
                        <div style={s.voterInfo}>
                            <div style={s.voterBadge}>
                                <div style={s.verifiedDot} />
                                <span>{auth.voterName}</span>
                            </div>
                            <button onClick={logout} style={s.endBtn}>
                                End Session
                            </button>
                        </div>
                    ) : (
                        <Link to="/admin" style={s.adminLink}>
                            Admin Portal →
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}

const s = {
    nav: {
        background:
            "linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 100%)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 2px 20px rgba(13,27,62,0.3)",
    },
    goldLine: {
        height: 2,
        background:
            "linear-gradient(90deg, transparent, var(--gold), var(--gold-light), var(--gold), transparent)",
    },
    inner: {
        maxWidth: 1200,
        margin: "0 auto",
        padding: "0 24px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    },
    brand: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        textDecoration: "none",
        color: "white",
    },
    brandIcon: {
        width: 36,
        height: 36,
        background: "linear-gradient(135deg, var(--gold), var(--gold-light))",
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--navy)",
        flexShrink: 0,
    },
    brandName: {
        fontSize: "1.05rem",
        fontWeight: 700,
        letterSpacing: "0.02em",
        lineHeight: 1.2,
    },
    brandSub: {
        fontSize: "0.68rem",
        opacity: 0.6,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
    },
    links: { display: "flex", gap: 28, alignItems: "center" },
    navLink: {
        textDecoration: "none",
        fontSize: "0.88rem",
        fontWeight: 500,
        letterSpacing: "0.02em",
        paddingBottom: 2,
        transition: "all 0.2s",
    },
    right: { display: "flex", alignItems: "center" },
    voterInfo: { display: "flex", alignItems: "center", gap: 12 },
    voterBadge: {
        display: "flex",
        alignItems: "center",
        gap: 7,
        background: "rgba(201,168,76,0.15)",
        border: "1px solid rgba(201,168,76,0.35)",
        borderRadius: 20,
        padding: "5px 14px",
        fontSize: "0.82rem",
        color: "var(--gold-light)",
        fontWeight: 500,
    },
    verifiedDot: {
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: "var(--gold)",
        flexShrink: 0,
        animation: "pulse-gold 2s infinite",
    },
    endBtn: {
        background: "transparent",
        border: "1px solid rgba(255,255,255,0.25)",
        color: "rgba(255,255,255,0.7)",
        borderRadius: "var(--radius-sm)",
        padding: "6px 14px",
        fontSize: "0.82rem",
        fontWeight: 500,
    },
    adminLink: {
        color: "rgba(255,255,255,0.55)",
        fontSize: "0.82rem",
        textDecoration: "none",
        letterSpacing: "0.02em",
        transition: "color 0.2s",
    },
};
