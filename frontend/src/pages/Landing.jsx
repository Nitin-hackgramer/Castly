import { useNavigate } from "react-router-dom";

export default function Landing() {
    const navigate = useNavigate();

    return (
        <div style={s.page}>
            {/* ── Hero ───────────────────────────────── */}
            <section style={s.heroWrap}>
                {/* Background geometry */}
                <div style={s.heroBg} />
                <div style={s.heroCircle1} />
                <div style={s.heroCircle2} />

                <div style={s.heroInner}>
                    <div style={s.heroLeft}>
                        <div style={s.eyebrow}>
                            <div style={s.eyebrowDot} />
                            Castly — Secure Elections
                        </div>
                        <h1 style={s.heroTitle}>
                            Democratic Voting,
                            <br />
                            <span style={s.heroTitleAccent}>Reimagined.</span>
                        </h1>
                        <p style={s.heroDesc}>
                            End-to-end encrypted ballots. Flexible verification
                            options for private or public events. A
                            tamper-evident audit chain anyone can verify.
                            Elections the way they should be.
                        </p>
                        <div style={s.heroCtas}>
                            <button
                                style={s.primaryBtn}
                                onClick={() => navigate("/vote")}
                            >
                                Begin Voting
                                <span style={s.btnArrow}>→</span>
                            </button>
                            <button
                                style={s.ghostBtn}
                                onClick={() => navigate("/start-election")}
                            >
                                Start Election
                            </button>
                            <button
                                style={s.ghostBtn}
                                onClick={() => navigate("/receipt")}
                            >
                                Verify Receipt
                            </button>
                        </div>
                    </div>

                    {/* Stats card */}
                    <div style={s.heroCard}>
                        <div style={s.heroCardTop}>
                            <div style={s.cardTopLabel}>System Status</div>
                            <div style={s.statusBadge}>
                                <div style={s.statusDot} />
                                Live
                            </div>
                        </div>
                        <div style={s.cardDivider} />
                        {statsData.map((item, i) => (
                            <div key={i} style={s.statRow}>
                                <span style={s.statIcon}>{item.icon}</span>
                                <div style={s.statInfo}>
                                    <div style={s.statLabel}>{item.label}</div>
                                    <div style={s.statValue}>{item.value}</div>
                                </div>
                            </div>
                        ))}
                        <div style={s.cardFooter}>
                            Powered by AES-256 + Chain Hash Audit
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Features ───────────────────────────── */}
            <section style={s.section}>
                <div style={s.sectionInner}>
                    <div style={s.sectionLabel}>Core Features</div>
                    <h2 style={s.sectionTitle}>
                        Built for Security. Designed for Trust.
                    </h2>
                    <div style={s.featureGrid}>
                        {features.map((f, i) => (
                            <div key={i} style={s.featureCard}>
                                <div style={s.featureIconWrap}>
                                    <span style={s.featureIcon}>{f.icon}</span>
                                </div>
                                <h3 style={s.featureTitle}>{f.title}</h3>
                                <p style={s.featureDesc}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── How It Works ───────────────────────── */}
            <section style={s.howSection}>
                <div style={s.sectionInner}>
                    <div style={s.sectionLabel}>Process</div>
                    <h2 style={s.sectionTitle}>Four Steps to Your Vote</h2>
                    <div style={s.stepsWrap}>
                        {steps.map((step, i) => (
                            <div key={i} style={s.stepCard}>
                                <div style={s.stepNumWrap}>
                                    <div style={s.stepNum}>
                                        {String(i + 1).padStart(2, "0")}
                                    </div>
                                    {i < steps.length - 1 && (
                                        <div style={s.stepLine} />
                                    )}
                                </div>
                                <div style={s.stepContent}>
                                    <h4 style={s.stepTitle}>{step.title}</h4>
                                    <p style={s.stepDesc}>{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA Banner ─────────────────────────── */}
            <section style={s.ctaBanner}>
                <div style={s.ctaInner}>
                    <div>
                        <h3 style={s.ctaTitle}>Ready to cast your vote?</h3>
                        <p style={s.ctaDesc}>
                            Verification takes under 60 seconds.
                        </p>
                    </div>
                    <button style={s.ctaBtn} onClick={() => navigate("/vote")}>
                        Start Now →
                    </button>
                </div>
            </section>
        </div>
    );
}

const statsData = [
    { icon: "🔐", label: "Encryption", value: "AES-256 Fernet" },
    { icon: "🔗", label: "Audit", value: "Tamper-Evident Chain" },
    { icon: "🧾", label: "Receipts", value: "Cryptographic Proof" },
];

const features = [
    {
        icon: "🔐",
        title: "End-to-End Encrypted",
        desc: "Your ballot is encrypted before leaving your browser. No server, no administrator, nobody can read it until the election closes.",
    },
    {
        icon: "🔑",
        title: "Flexible Verification",
        desc: "Supports guest sessions, organization-managed verification, or external identity providers.",
    },
    {
        icon: "🧾",
        title: "Verifiable Receipt",
        desc: "Every voter gets a cryptographic receipt hash. Verify your vote was counted — without revealing your candidate choice to anyone.",
    },
    {
        icon: "🔗",
        title: "Tamper-Evident Chain",
        desc: "Every vote is mathematically chained to the one before it. Delete or alter any single record, and the entire chain breaks — instantly detected.",
    },
];

const steps = [
    {
        title: "Start or Join",
        desc: "Enter your event code or use the verification method provided by your organizer to join the session.",
    },
    {
        title: "Cast Your Vote",
        desc: "Select your candidate. Your choice is encrypted automatically before submission. Even our servers cannot read it.",
    },
    {
        title: "Receive Receipt",
        desc: "Get a unique cryptographic receipt hash the moment your vote is recorded. Save it — it's your permanent proof.",
    },
    {
        title: "Verify Anytime",
        desc: "Return at any time, enter your receipt hash, and confirm your vote is present and counted in the system.",
    },
];

const s = {
    page: { minHeight: "100vh" },

    /* Hero */
    heroWrap: {
        background:
            "linear-gradient(160deg, var(--navy) 0%, var(--navy-mid) 60%, var(--navy-light) 100%)",
        position: "relative",
        overflow: "hidden",
        padding: "80px 24px 100px",
    },
    heroBg: {
        position: "absolute",
        inset: 0,
        backgroundImage: `radial-gradient(ellipse at 20% 50%, rgba(36,81,180,0.3) 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 20%, rgba(201,168,76,0.1) 0%, transparent 50%)`,
    },
    heroCircle1: {
        position: "absolute",
        top: -100,
        right: -100,
        width: 500,
        height: 500,
        borderRadius: "50%",
        border: "1px solid rgba(201,168,76,0.08)",
        pointerEvents: "none",
    },
    heroCircle2: {
        position: "absolute",
        bottom: -150,
        left: -80,
        width: 400,
        height: 400,
        borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.04)",
        pointerEvents: "none",
    },
    heroInner: {
        maxWidth: 1200,
        margin: "0 auto",
        position: "relative",
        zIndex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 60,
        flexWrap: "wrap",
    },
    heroLeft: { flex: "1 1 460px", maxWidth: 560 },
    eyebrow: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontSize: "0.78rem",
        fontWeight: 600,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "var(--gold-light)",
        marginBottom: 20,
    },
    eyebrowDot: {
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: "var(--gold)",
        flexShrink: 0,
    },
    heroTitle: {
        fontFamily: "Playfair Display, serif",
        fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
        fontWeight: 800,
        color: "white",
        lineHeight: 1.15,
        marginBottom: 20,
    },
    heroTitleAccent: {
        background: "linear-gradient(135deg, var(--gold), var(--gold-light))",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
    },
    heroDesc: {
        fontSize: "1.05rem",
        color: "rgba(255,255,255,0.65)",
        lineHeight: 1.7,
        marginBottom: 36,
        maxWidth: 480,
    },
    heroCtas: { display: "flex", gap: 14, flexWrap: "wrap" },
    primaryBtn: {
        background: "linear-gradient(135deg, var(--gold), var(--gold-light))",
        color: "var(--navy)",
        border: "none",
        padding: "13px 28px",
        borderRadius: "var(--radius-md)",
        fontSize: "0.95rem",
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        gap: 8,
        boxShadow: "var(--shadow-gold)",
    },
    btnArrow: { fontSize: "1.1rem", transition: "transform 0.2s" },
    ghostBtn: {
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.18)",
        color: "rgba(255,255,255,0.85)",
        padding: "13px 28px",
        borderRadius: "var(--radius-md)",
        fontSize: "0.95rem",
        fontWeight: 500,
    },

    /* Hero card */
    heroCard: {
        flex: "0 0 300px",
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "var(--radius-xl)",
        padding: "28px 24px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    },
    heroCardTop: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    cardTopLabel: {
        fontSize: "0.78rem",
        color: "rgba(255,255,255,0.5)",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
    },
    statusBadge: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "rgba(26,107,60,0.3)",
        border: "1px solid rgba(26,107,60,0.5)",
        borderRadius: 20,
        padding: "3px 10px",
        fontSize: "0.75rem",
        color: "#6ee7b7",
        fontWeight: 600,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: "#6ee7b7",
        animation: "pulse-gold 2s infinite",
    },
    cardDivider: {
        height: 1,
        background: "rgba(255,255,255,0.08)",
        margin: "16px 0",
    },
    statRow: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 14,
    },
    statIcon: { fontSize: "1.3rem", flexShrink: 0 },
    statInfo: {},
    statLabel: {
        fontSize: "0.72rem",
        color: "rgba(255,255,255,0.45)",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
    },
    statValue: {
        fontSize: "0.88rem",
        color: "rgba(255,255,255,0.88)",
        fontWeight: 600,
    },
    cardFooter: {
        marginTop: 16,
        paddingTop: 14,
        borderTop: "1px solid rgba(255,255,255,0.08)",
        fontSize: "0.72rem",
        color: "rgba(255,255,255,0.3)",
        textAlign: "center",
        fontFamily: "DM Mono, monospace",
    },

    /* Sections */
    section: { padding: "80px 24px", background: "var(--white)" },
    howSection: { padding: "80px 24px", background: "var(--off-white)" },
    sectionInner: { maxWidth: 1100, margin: "0 auto" },
    sectionLabel: {
        fontSize: "0.75rem",
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--blue)",
        marginBottom: 10,
    },
    sectionTitle: {
        fontFamily: "Playfair Display, serif",
        fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
        fontWeight: 700,
        color: "var(--navy)",
        marginBottom: 48,
    },

    /* Features */
    featureGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
        gap: 24,
    },
    featureCard: {
        background: "var(--off-white)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "28px 24px",
        transition: "all 0.25s ease",
    },
    featureIconWrap: {
        width: 48,
        height: 48,
        background: "linear-gradient(135deg, var(--navy), var(--navy-light))",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 18,
    },
    featureIcon: { fontSize: "1.4rem" },
    featureTitle: {
        fontSize: "1rem",
        fontWeight: 700,
        color: "var(--navy)",
        marginBottom: 8,
    },
    featureDesc: {
        fontSize: "0.875rem",
        color: "var(--text-secondary)",
        lineHeight: 1.65,
    },

    /* Steps */
    stepsWrap: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 0,
    },
    stepCard: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        paddingRight: 24,
    },
    stepNumWrap: {
        display: "flex",
        alignItems: "center",
        width: "100%",
        marginBottom: 16,
    },
    stepNum: {
        fontFamily: "Playfair Display, serif",
        fontSize: "2rem",
        fontWeight: 800,
        color: "var(--gold)",
        lineHeight: 1,
        flexShrink: 0,
        width: 56,
    },
    stepLine: {
        flex: 1,
        height: 1,
        background: "linear-gradient(90deg, var(--gold), transparent)",
    },
    stepContent: {},
    stepTitle: {
        fontSize: "0.95rem",
        fontWeight: 700,
        color: "var(--navy)",
        marginBottom: 6,
    },
    stepDesc: {
        fontSize: "0.85rem",
        color: "var(--text-secondary)",
        lineHeight: 1.6,
    },

    /* CTA */
    ctaBanner: {
        background:
            "linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%)",
        padding: "56px 24px",
    },
    ctaInner: {
        maxWidth: 900,
        margin: "0 auto",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 32,
        flexWrap: "wrap",
    },
    ctaTitle: {
        fontFamily: "Playfair Display, serif",
        fontSize: "1.7rem",
        fontWeight: 700,
        color: "white",
        marginBottom: 6,
    },
    ctaDesc: { fontSize: "0.9rem", color: "rgba(255,255,255,0.55)" },
    ctaBtn: {
        background: "linear-gradient(135deg, var(--gold), var(--gold-light))",
        color: "var(--navy)",
        border: "none",
        padding: "14px 32px",
        borderRadius: "var(--radius-md)",
        fontSize: "0.95rem",
        fontWeight: 700,
        whiteSpace: "nowrap",
        boxShadow: "var(--shadow-gold)",
        flexShrink: 0,
    },
};
