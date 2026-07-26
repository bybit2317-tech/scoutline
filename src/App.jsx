import React, { useState } from "react";
import { LANGUAGES, translations, positionKeys, positionLabels } from "./i18n.js";

// ---------- Platform config ----------
// In a real deployment, the receiving wallet address and fee would live in
// a backend config, and payment would be verified server-side against the
// Bitcoin blockchain (e.g. via BTCPay Server, Coinbase Commerce, or a node).
// This prototype simulates that confirmation client-side for demo purposes.
const PLATFORM_BTC_ADDRESS = "bc1qexampleyourrealwalletaddresshere000";
const CONNECT_FEE_USD = 200;
const BTC_USD_RATE = 64000; // demo rate only — real build would fetch live rate

// ---------- Admin access ----------
// NOTE: This is a basic client-side check meant only to keep casual visitors
// out of the admin tools during early testing. It is NOT secure — anyone who
// reads the site's code can find this password. Real protection requires a
// backend that checks credentials on a server before showing admin data.
// Change this password before sharing your link with anyone.
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "changeme123";
const ADMIN_SESSION_KEY = "scoutline_admin_authed";
const LANG_STORAGE_KEY = "scoutline_lang";

// ---------- Demo data ----------
// Position values below use internal keys (see i18n.js positionKeys) so the
// dropdowns and filters can display translated labels while storing a
// stable, language-independent value.
const initialOpportunities = [
  {
    id: "op1",
    club: "FC Nordvik U19",
    country: "Norway",
    region: "Bergen",
    postedBy: "Admin",
    positionKey: "winger",
    ageRange: "16–19",
    footPref: "either",
    level: "Youth Academy — Trial Invite",
    requirements: [
      "Match footage (min. 10 minutes)",
      "Height 170cm+",
      "Available for a 2-week trial in Bergen",
    ],
    blurb:
      "Nordvik's academy is rebuilding its wide attack for the spring season. They want pace and end product — not just tricks.",
    slots: 3,
    deadline: "2026-09-01",
    status: "open",
    contact: { email: "recruit@fcnordvik.no", phone: "+47 55 123 4567" },
  },
  {
    id: "op2",
    club: "Club Atlético Rosales",
    country: "Argentina",
    region: "Rosario",
    postedBy: "Admin",
    positionKey: "centralMid",
    ageRange: "15–17",
    footPref: "left",
    level: "Reserve Feeder Program",
    requirements: [
      "Full stat sheet (last season)",
      "Video: passing range + defensive work",
      "Guardian consent (under 18)",
    ],
    blurb:
      "Rosales feeds two senior league clubs. They're specifically short on left-footed midfielders who can dictate tempo.",
    slots: 2,
    deadline: "2026-08-20",
    status: "open",
    contact: { email: "cantera@rosales.com.ar", phone: "+54 341 555 0192" },
  },
  {
    id: "op3",
    club: "Ashcombe Town FC",
    country: "England",
    region: "Kent",
    postedBy: "Admin",
    positionKey: "goalkeeper",
    ageRange: "17–19",
    footPref: "either",
    level: "Semi-Pro Development Squad",
    requirements: [
      "Height 185cm+",
      "Video: distribution + shot-stopping",
      "Valid passport for UK entry",
    ],
    blurb:
      "Ashcombe lost their #1 to injury. They need a shot-stopper who can also play out from the back under pressure.",
    slots: 1,
    deadline: "2026-08-10",
    status: "open",
    contact: { email: "trials@ashcombetownfc.co.uk", phone: "+44 1622 555 019" },
  },
];

const emptyForm = {
  name: "",
  age: "",
  height: "",
  weight: "",
  foot: "right",
  positionKey: "",
  country: "",
  notes: "",
};

// ---------- Small UI atoms ----------
function StatusStamp({ status, t }) {
  const map = {
    pending: { label: t.myApps.statusPending, color: "#C9A54E", rotate: "-6deg" },
    approved: { label: t.myApps.statusApproved, color: "#2E7D4F", rotate: "-8deg" },
    rejected: { label: t.myApps.statusRejected, color: "#8B4A3D", rotate: "-5deg" },
    unlocked: { label: t.myApps.statusUnlocked, color: "#C9A54E", rotate: "-4deg" },
    submitted: { label: t.myApps.statusSubmitted, color: "#C9A54E", rotate: "-3deg" },
  };
  const s = map[status];
  if (!s) return null;
  return (
    <div
      style={{
        border: `3px solid ${s.color}`,
        color: s.color,
        transform: `rotate(${s.rotate})`,
        fontFamily: "'Oswald', sans-serif",
        fontWeight: 700,
        letterSpacing: "0.12em",
        fontSize: "0.7rem",
        padding: "4px 10px",
        display: "inline-block",
        borderRadius: "3px",
        background: "rgba(0,0,0,0.15)",
      }}
    >
      {s.label}
    </div>
  );
}

function Pill({ children, tone = "default" }) {
  const tones = {
    default: { bg: "rgba(243,241,233,0.08)", fg: "#F3F1E9" },
    gold: { bg: "rgba(201,165,78,0.15)", fg: "#C9A54E" },
  };
  const tn = tones[tone];
  return (
    <span
      style={{
        background: tn.bg,
        color: tn.fg,
        fontSize: "0.72rem",
        fontFamily: "'Inter', sans-serif",
        fontWeight: 600,
        padding: "3px 9px",
        borderRadius: "999px",
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

// ---------- Language helpers ----------
function getInitialLang() {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved && translations[saved]) return saved;
  } catch {}
  return "en";
}

function getInitialView() {
  try {
    if (window.location.pathname.replace(/\/$/, "") === "/admin") {
      return "admin";
    }
  } catch {}
  return "home";
}

// ---------- Main App ----------
export default function ScoutLink() {
  const [lang, setLang] = useState(getInitialLang);
  const t = translations[lang];
  const posLabels = positionLabels[lang];

  const [view, setView] = useState(getInitialView); // home | browse | admin | myApps | apply | pay | adminLogin
  const [isAdminAuthed, setIsAdminAuthed] = useState(() => {
    try {
      return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [opportunities, setOpportunities] = useState(initialOpportunities);
  const [applications, setApplications] = useState([]); // {id, oppId, ...playerInfo, status, paid}
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [payingApp, setPayingApp] = useState(null);
  const [applyForm, setApplyForm] = useState(emptyForm);
  const [toast, setToast] = useState(null);
  const [postForm, setPostForm] = useState({
    club: "",
    country: "",
    region: "",
    positionKey: "",
    ageRange: "",
    footPref: "either",
    level: "",
    requirements: "",
    blurb: "",
    slots: "",
    deadline: "",
  });

  function changeLang(code) {
    setLang(code);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, code);
    } catch {}
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  function submitApplication(e) {
    e.preventDefault();
    if (!applyForm.name || !applyForm.age || !applyForm.positionKey) {
      showToast(t.apply.fillRequired);
      return;
    }
    const newApp = {
      id: "app-" + Date.now(),
      oppId: selectedOpp.id,
      club: selectedOpp.club,
      contactEmail: selectedOpp.contact?.email || "—",
      contactPhone: selectedOpp.contact?.phone || "—",
      ...applyForm,
      status: "pending",
      paid: false,
      paymentStatus: null,
      txId: "",
      submittedAt: new Date().toISOString(),
    };
    setApplications((prev) => [newApp, ...prev]);
    setApplyForm(emptyForm);
    setSelectedOpp(null);
    setView("myApps");
    showToast(t.apply.sentTo(newApp.club));
  }

  function updateAppStatus(appId, status) {
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status } : a))
    );
  }

  function submitPaymentForReview(appId, txId) {
    setApplications((prev) =>
      prev.map((a) =>
        a.id === appId ? { ...a, txId, paymentStatus: "submitted" } : a
      )
    );
    showToast(t.pay.confirmedToast);
    setView("myApps");
    setPayingApp(null);
  }

  function confirmPayment(appId) {
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, paid: true, paymentStatus: "confirmed" } : a))
    );
  }

  function postOpportunity(e) {
    e.preventDefault();
    if (!postForm.club || !postForm.positionKey || !postForm.country) {
      showToast(t.admin.requiredFields);
      return;
    }
    const newOpp = {
      id: "op-" + Date.now(),
      club: postForm.club,
      country: postForm.country,
      region: postForm.region,
      postedBy: "Admin",
      positionKey: postForm.positionKey,
      ageRange: postForm.ageRange || "Open",
      footPref: postForm.footPref,
      level: postForm.level || "Trial Invite",
      requirements: postForm.requirements
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean),
      blurb: postForm.blurb,
      slots: Number(postForm.slots) || 1,
      deadline: postForm.deadline || "TBD",
      status: "open",
    };
    setOpportunities((prev) => [newOpp, ...prev]);
    setPostForm({
      club: "",
      country: "",
      region: "",
      positionKey: "",
      ageRange: "",
      footPref: "either",
      level: "",
      requirements: "",
      blurb: "",
      slots: "",
      deadline: "",
    });
    showToast(t.admin.postedToast(newOpp.club));
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse at top, #10291d 0%, #0B1F17 55%, #081712 100%)",
        color: "#F3F1E9",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <GoogleFonts />
      <TopNav view={view} setView={setView} t={t} lang={lang} changeLang={changeLang} />

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#F3F1E9",
            color: "#0B1F17",
            padding: "12px 20px",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: "0.9rem",
            zIndex: 100,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            maxWidth: "88vw",
            textAlign: "center",
          }}
        >
          {toast}
        </div>
      )}

      {view === "home" && (
        <Home setView={setView} opportunities={opportunities} t={t} />
      )}

      {view === "browse" && (
        <Browse
          opportunities={opportunities}
          onSelect={(op) => {
            setSelectedOpp(op);
            setView("apply");
          }}
          t={t}
          posLabels={posLabels}
        />
      )}

      {view === "apply" && selectedOpp && (
        <ApplyForm
          opp={selectedOpp}
          form={applyForm}
          setForm={setApplyForm}
          onSubmit={submitApplication}
          onBack={() => setView("browse")}
          t={t}
          posLabels={posLabels}
        />
      )}

      {view === "myApps" && (
        <MyApplications
          applications={applications}
          setView={setView}
          onPay={(app) => {
            setPayingApp(app);
            setView("pay");
          }}
          t={t}
        />
      )}

      {view === "pay" && payingApp && (
        <PaymentScreen
          app={payingApp}
          onConfirm={(txId) => submitPaymentForReview(payingApp.id, txId)}
          onBack={() => setView("myApps")}
          t={t}
        />
      )}

      {view === "adminLogin" && !isAdminAuthed && (
        <AdminLogin
          t={t}
          onSuccess={() => {
            setIsAdminAuthed(true);
            try {
              sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
            } catch {}
            setView("admin");
          }}
        />
      )}

      {view === "admin" && isAdminAuthed && (
        <AdminPanel
          opportunities={opportunities}
          applications={applications}
          postForm={postForm}
          setPostForm={setPostForm}
          onPost={postOpportunity}
          onUpdateStatus={updateAppStatus}
          onConfirmPayment={confirmPayment}
          onLogout={() => {
            setIsAdminAuthed(false);
            try {
              sessionStorage.removeItem(ADMIN_SESSION_KEY);
            } catch {}
            setView("home");
          }}
          t={t}
          posLabels={posLabels}
        />
      )}

      {view === "admin" && !isAdminAuthed && (
        <AdminLogin
          t={t}
          onSuccess={() => {
            setIsAdminAuthed(true);
            try {
              sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
            } catch {}
            setView("admin");
          }}
        />
      )}

      <Footer t={t} />
    </div>
  );
}

function GoogleFonts() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
      * { box-sizing: border-box; }
      body { margin: 0; }
      ::selection { background: #C9A54E; color: #0B1F17; }
      input, select, textarea {
        font-family: 'Inter', sans-serif;
      }
      input:focus, select:focus, textarea:focus, button:focus-visible {
        outline: 2px solid #C9A54E;
        outline-offset: 2px;
      }
      @media (prefers-reduced-motion: reduce) {
        * { animation: none !important; transition: none !important; }
      }
    `}</style>
  );
}

function LanguageSwitcher({ lang, changeLang }) {
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find((l) => l.code === lang);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: "rgba(243,241,233,0.07)",
          border: "1px solid rgba(243,241,233,0.2)",
          color: "#F3F1E9",
          padding: "8px 12px",
          borderRadius: 8,
          fontSize: "0.8rem",
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontFamily: "'Inter', sans-serif",
        }}
        aria-label="Change language"
      >
        <span>🌐</span>
        <span>{current?.label}</span>
        <span style={{ fontSize: "0.65rem" }}>▾</span>
      </button>
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 40 }}
          />
          <div
            style={{
              position: "absolute",
              top: 42,
              right: 0,
              background: "#10291d",
              border: "1px solid rgba(243,241,233,0.15)",
              borderRadius: 10,
              padding: 6,
              minWidth: 150,
              boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
              zIndex: 50,
            }}
          >
            {LANGUAGES.map((l) => (
              <div
                key={l.code}
                onClick={() => {
                  changeLang(l.code);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 10px",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  color: lang === l.code ? "#C9A54E" : "#F3F1E9",
                  fontWeight: lang === l.code ? 700 : 500,
                  background: lang === l.code ? "rgba(201,165,78,0.08)" : "transparent",
                }}
              >
                <span>{l.flag}</span>
                <span>{l.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TopNav({ view, setView, t, lang, changeLang }) {
  const linkStyle = (v) => ({
    background: "none",
    border: "none",
    color: view === v ? "#C9A54E" : "rgba(243,241,233,0.75)",
    fontFamily: "'Inter', sans-serif",
    fontWeight: 600,
    fontSize: "0.85rem",
    cursor: "pointer",
    padding: "8px 4px",
    borderBottom: view === v ? "2px solid #C9A54E" : "2px solid transparent",
  });
  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "18px 28px",
        borderBottom: "1px solid rgba(243,241,233,0.1)",
        position: "sticky",
        top: 0,
        background: "rgba(11,31,23,0.92)",
        backdropFilter: "blur(8px)",
        zIndex: 50,
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <button
        onClick={() => setView("home")}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 6,
            background: "linear-gradient(135deg, #2E7D4F, #0B1F17)",
            border: "2px solid #C9A54E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 700,
            color: "#C9A54E",
            fontSize: "1rem",
          }}
        >
          10
        </div>
        <span
          style={{
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 700,
            fontSize: "1.15rem",
            letterSpacing: "0.02em",
            color: "#F3F1E9",
          }}
        >
          {t.brand}
        </span>
      </button>
      <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
        <button style={linkStyle("browse")} onClick={() => setView("browse")}>
          {t.nav.opportunities}
        </button>
        <button style={linkStyle("myApps")} onClick={() => setView("myApps")}>
          {t.nav.myApplications}
        </button>
        <LanguageSwitcher lang={lang} changeLang={changeLang} />
      </div>
    </nav>
  );
}

function Home({ setView, opportunities, t }) {
  const openCount = opportunities.filter((o) => o.status === "open").length;
  return (
    <div>
      <section
        style={{
          padding: "90px 28px 70px",
          maxWidth: 980,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-block",
            marginBottom: 22,
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.78rem",
            fontWeight: 700,
            letterSpacing: "0.16em",
            color: "#C9A54E",
            textTransform: "uppercase",
          }}
        >
          {t.home.eyebrow(openCount)}
        </div>
        <h1
          style={{
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 700,
            fontSize: "clamp(2.4rem, 6vw, 4.2rem)",
            lineHeight: 1.05,
            margin: "0 0 24px",
            letterSpacing: "-0.01em",
          }}
        >
          {t.home.headlineLine1}
          <br />
          <span style={{ color: "#2E7D4F", WebkitTextStroke: "1px #C9A54E" }}>
            {t.home.headlineLine2}
          </span>
          <br />
          {t.home.headlineLine3}
        </h1>
        <p
          style={{
            fontSize: "1.05rem",
            lineHeight: 1.6,
            color: "rgba(243,241,233,0.75)",
            maxWidth: 560,
            margin: "0 auto 36px",
          }}
        >
          {t.home.sub}
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => setView("browse")}
            style={{
              background: "#2E7D4F",
              color: "#F3F1E9",
              border: "none",
              padding: "14px 28px",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              boxShadow: "0 8px 20px rgba(46,125,79,0.35)",
            }}
          >
            {t.home.browseBtn}
          </button>
          <button
            onClick={() => setView("myApps")}
            style={{
              background: "transparent",
              color: "#F3F1E9",
              border: "1px solid rgba(243,241,233,0.3)",
              padding: "14px 28px",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {t.home.trackBtn}
          </button>
        </div>
      </section>

      <section
        style={{
          maxWidth: 980,
          margin: "0 auto",
          padding: "0 28px 100px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 20,
        }}
      >
        {t.home.steps.map((s) => (
          <div
            key={s.n}
            style={{
              background: "rgba(243,241,233,0.04)",
              border: "1px solid rgba(243,241,233,0.08)",
              borderRadius: 12,
              padding: "22px 20px",
            }}
          >
            <div
              style={{
                fontFamily: "'Oswald', sans-serif",
                color: "#C9A54E",
                fontSize: "0.85rem",
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              {s.n}
            </div>
            <div style={{ fontWeight: 700, marginBottom: 8, fontSize: "1.05rem" }}>
              {s.t}
            </div>
            <div style={{ color: "rgba(243,241,233,0.65)", fontSize: "0.9rem", lineHeight: 1.55 }}>
              {s.d}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function Browse({ opportunities, onSelect, t, posLabels }) {
  const [posFilter, setPosFilter] = useState("all");
  const filtered =
    posFilter === "all"
      ? opportunities
      : opportunities.filter((o) => o.positionKey === posFilter);

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "48px 28px 100px" }}>
      <div style={{ marginBottom: 30 }}>
        <h2
          style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: "2rem",
            fontWeight: 700,
            margin: "0 0 8px",
          }}
        >
          {t.browse.title}
        </h2>
        <p style={{ color: "rgba(243,241,233,0.6)", margin: 0, fontSize: "0.92rem" }}>
          {t.browse.sub}
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
        <button
          onClick={() => setPosFilter("all")}
          style={{
            background: posFilter === "all" ? "#C9A54E" : "rgba(243,241,233,0.06)",
            color: posFilter === "all" ? "#0B1F17" : "#F3F1E9",
            border: "none",
            borderRadius: 999,
            padding: "7px 14px",
            fontSize: "0.8rem",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {t.browse.all}
        </button>
        {positionKeys.map((pk) => (
          <button
            key={pk}
            onClick={() => setPosFilter(pk)}
            style={{
              background: posFilter === pk ? "#C9A54E" : "rgba(243,241,233,0.06)",
              color: posFilter === pk ? "#0B1F17" : "#F3F1E9",
              border: "none",
              borderRadius: 999,
              padding: "7px 14px",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {posLabels[pk]}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ color: "rgba(243,241,233,0.5)", padding: "40px 0", textAlign: "center" }}>
          {t.browse.empty}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {filtered.map((op) => (
          <div
            key={op.id}
            style={{
              background: "rgba(243,241,233,0.04)",
              border: "1px solid rgba(243,241,233,0.1)",
              borderRadius: 14,
              padding: "22px 24px",
              display: "flex",
              justifyContent: "space-between",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: "1 1 320px" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
                <h3
                  style={{
                    fontFamily: "'Oswald', sans-serif",
                    fontSize: "1.3rem",
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  {op.club}
                </h3>
                <span style={{ color: "#C9A54E", fontSize: "0.85rem", fontWeight: 600 }}>
                  {op.region ? `${op.region}, ` : ""}
                  {op.country}
                </span>
              </div>
              <div style={{ margin: "6px 0 14px", fontSize: "0.85rem", color: "rgba(243,241,233,0.55)" }}>
                {op.level}
              </div>
              <p style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "rgba(243,241,233,0.8)", margin: "0 0 14px", maxWidth: 520 }}>
                {op.blurb}
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Pill tone="gold">{posLabels[op.positionKey]}</Pill>
                <Pill>{t.browse.ageLabel(op.ageRange)}</Pill>
                <Pill>{t.browse.footLabel(op.footPref)}</Pill>
                <Pill>{t.browse.spots(op.slots)}</Pill>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "flex-end",
                minWidth: 160,
              }}
            >
              <div style={{ textAlign: "right", fontSize: "0.78rem", color: "rgba(243,241,233,0.5)" }}>
                {t.browse.deadline}
                <div style={{ color: "#F3F1E9", fontWeight: 600, fontSize: "0.88rem" }}>
                  {op.deadline}
                </div>
              </div>
              <button
                onClick={() => onSelect(op)}
                style={{
                  marginTop: 16,
                  background: "#2E7D4F",
                  color: "#F3F1E9",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: 8,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.85rem",
                }}
              >
                {t.browse.apply}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApplyForm({ opp, form, setForm, onSubmit, onBack, t, posLabels }) {
  function set(field, val) {
    setForm((f) => ({ ...f, [field]: val }));
  }
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 28px 100px" }}>
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          color: "rgba(243,241,233,0.6)",
          cursor: "pointer",
          marginBottom: 20,
          fontSize: "0.85rem",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {t.apply.back}
      </button>

      <div
        style={{
          background: "rgba(201,165,78,0.08)",
          border: "1px solid rgba(201,165,78,0.3)",
          borderRadius: 12,
          padding: "18px 20px",
          marginBottom: 28,
        }}
      >
        <div style={{ fontSize: "0.78rem", color: "#C9A54E", fontWeight: 700, letterSpacing: "0.05em", marginBottom: 4 }}>
          {t.apply.applyingTo}
        </div>
        <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: "1.4rem", fontWeight: 700 }}>
          {opp.club}
        </div>
        <div style={{ fontSize: "0.85rem", color: "rgba(243,241,233,0.7)", marginTop: 4 }}>
          {posLabels[opp.positionKey]} · {opp.country} · {t.browse.ageLabel(opp.ageRange)}
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: "0.78rem", color: "rgba(243,241,233,0.55)", fontWeight: 600, marginBottom: 6 }}>
            {t.apply.requires}
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem", color: "rgba(243,241,233,0.8)", lineHeight: 1.7 }}>
            {opp.requirements.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      </div>

      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label={t.apply.fullName}>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            style={inputStyle}
            placeholder={t.apply.fullNamePh}
          />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <Field label={t.apply.age}>
            <input
              type="number"
              value={form.age}
              onChange={(e) => set("age", e.target.value)}
              style={inputStyle}
              placeholder="17"
            />
          </Field>
          <Field label={t.apply.height}>
            <input
              type="number"
              value={form.height}
              onChange={(e) => set("height", e.target.value)}
              style={inputStyle}
              placeholder="178"
            />
          </Field>
          <Field label={t.apply.weight}>
            <input
              type="number"
              value={form.weight}
              onChange={(e) => set("weight", e.target.value)}
              style={inputStyle}
              placeholder="70"
            />
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label={t.apply.foot}>
            <select
              value={form.foot}
              onChange={(e) => set("foot", e.target.value)}
              style={inputStyle}
            >
              <option value="right">{t.apply.footRight}</option>
              <option value="left">{t.apply.footLeft}</option>
              <option value="both">{t.apply.footBoth}</option>
            </select>
          </Field>
          <Field label={t.apply.position}>
            <select
              value={form.positionKey}
              onChange={(e) => set("positionKey", e.target.value)}
              style={inputStyle}
            >
              <option value="">{t.apply.selectPosition}</option>
              {positionKeys.map((pk) => (
                <option key={pk} value={pk}>
                  {posLabels[pk]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label={t.apply.country}>
          <input
            value={form.country}
            onChange={(e) => set("country", e.target.value)}
            style={inputStyle}
            placeholder={t.apply.countryPh}
          />
        </Field>

        <Field label={t.apply.notes}>
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
            placeholder={t.apply.notesPh}
          />
        </Field>

        <button
          type="submit"
          style={{
            background: "#C9A54E",
            color: "#0B1F17",
            border: "none",
            padding: "14px 20px",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: "0.95rem",
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
            marginTop: 8,
          }}
        >
          {t.apply.submit}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(243,241,233,0.6)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle = {
  background: "rgba(243,241,233,0.06)",
  border: "1px solid rgba(243,241,233,0.15)",
  borderRadius: 8,
  padding: "11px 12px",
  color: "#F3F1E9",
  fontSize: "0.92rem",
};

function MyApplications({ applications, setView, onPay, t }) {
  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "48px 28px 100px" }}>
      <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: "2rem", fontWeight: 700, margin: "0 0 8px" }}>
        {t.myApps.title}
      </h2>
      <p style={{ color: "rgba(243,241,233,0.6)", margin: "0 0 30px", fontSize: "0.92rem" }}>
        {t.myApps.sub}
      </p>

      {applications.length === 0 ? (
        <div
          style={{
            border: "1px dashed rgba(243,241,233,0.2)",
            borderRadius: 12,
            padding: "50px 20px",
            textAlign: "center",
            color: "rgba(243,241,233,0.55)",
          }}
        >
          {t.myApps.emptyText}
          <div style={{ marginTop: 16 }}>
            <button
              onClick={() => setView("browse")}
              style={{
                background: "#2E7D4F",
                color: "#F3F1E9",
                border: "none",
                padding: "10px 20px",
                borderRadius: 8,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {t.myApps.browseBoard}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {applications.map((a) => (
            <div
              key={a.id}
              style={{
                background: "rgba(243,241,233,0.04)",
                border: "1px solid rgba(243,241,233,0.1)",
                borderRadius: 12,
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "1.1rem" }}>
                    {a.club}
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "rgba(243,241,233,0.6)", marginTop: 3 }}>
                    {a.age} · {a.foot}
                  </div>
                </div>
                <StatusStamp
                  status={a.paid ? "unlocked" : a.paymentStatus === "submitted" ? "submitted" : a.status}
                  t={t}
                />
              </div>

              {a.status === "approved" && !a.paid && a.paymentStatus !== "submitted" && (
                <div
                  style={{
                    background: "rgba(201,165,78,0.1)",
                    border: "1px solid rgba(201,165,78,0.35)",
                    borderRadius: 10,
                    padding: "14px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ fontSize: "0.85rem", color: "rgba(243,241,233,0.85)", maxWidth: 420 }}>
                    {t.myApps.approvedNotice(a.club)}
                  </div>
                  <button
                    onClick={() => onPay(a)}
                    style={{
                      background: "#C9A54E",
                      color: "#0B1F17",
                      border: "none",
                      padding: "10px 18px",
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      fontFamily: "'Inter', sans-serif",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.myApps.payToConnect(CONNECT_FEE_USD)}
                  </button>
                </div>
              )}

              {a.paymentStatus === "submitted" && !a.paid && (
                <div
                  style={{
                    background: "rgba(201,165,78,0.08)",
                    border: "1px solid rgba(201,165,78,0.3)",
                    borderRadius: 10,
                    padding: "14px 16px",
                    fontSize: "0.85rem",
                    color: "rgba(243,241,233,0.8)",
                  }}
                >
                  {t.pay.demoNote}
                </div>
              )}

              {a.paid && (
                <div
                  style={{
                    background: "rgba(46,125,79,0.12)",
                    border: "1px solid rgba(46,125,79,0.4)",
                    borderRadius: 10,
                    padding: "14px 16px",
                  }}
                >
                  <div style={{ fontSize: "0.78rem", color: "#8FD3AA", fontWeight: 700, letterSpacing: "0.04em", marginBottom: 6 }}>
                    {t.myApps.clubContact}
                  </div>
                  <div style={{ fontSize: "0.88rem", color: "#F3F1E9" }}>{a.contactEmail}</div>
                  <div style={{ fontSize: "0.88rem", color: "#F3F1E9" }}>{a.contactPhone}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PaymentScreen({ app, onConfirm, onBack, t }) {
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [txId, setTxId] = useState("");
  const [error, setError] = useState("");
  const btcAmount = (CONNECT_FEE_USD / BTC_USD_RATE).toFixed(8);

  function copyAddress() {
    navigator.clipboard?.writeText(PLATFORM_BTC_ADDRESS).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleConfirm() {
    if (!txId.trim()) {
      setError(t.pay.txIdRequired);
      return;
    }
    setError("");
    setConfirming(true);
    // This submits the transaction ID for the admin to manually verify
    // against the blockchain before contact info unlocks. No automatic
    // on-chain checking happens here.
    setTimeout(() => {
      onConfirm(txId.trim());
    }, 700);
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 28px 100px" }}>
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          color: "rgba(243,241,233,0.6)",
          cursor: "pointer",
          marginBottom: 20,
          fontSize: "0.85rem",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {t.pay.back}
      </button>

      <div
        style={{
          background: "rgba(201,165,78,0.08)",
          border: "1px solid rgba(201,165,78,0.3)",
          borderRadius: 12,
          padding: "18px 20px",
          marginBottom: 24,
        }}
      >
        <div style={{ fontSize: "0.78rem", color: "#C9A54E", fontWeight: 700, letterSpacing: "0.05em", marginBottom: 4 }}>
          {t.pay.unlockTitle}
        </div>
        <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: "1.4rem", fontWeight: 700 }}>
          {app.club}
        </div>
        <div style={{ fontSize: "0.85rem", color: "rgba(243,241,233,0.7)", marginTop: 4 }}>
          {t.pay.unlockSub}
        </div>
      </div>

      <div
        style={{
          background: "rgba(243,241,233,0.04)",
          border: "1px solid rgba(243,241,233,0.12)",
          borderRadius: 12,
          padding: "22px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
          <span style={{ fontSize: "0.85rem", color: "rgba(243,241,233,0.6)" }}>{t.pay.amountDue}</span>
          <span style={{ fontWeight: 700 }}>${CONNECT_FEE_USD}.00 USD</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
          <span style={{ fontSize: "0.85rem", color: "rgba(243,241,233,0.6)" }}>{t.pay.payInBtc}</span>
          <span style={{ fontWeight: 700, fontFamily: "monospace" }}>{btcAmount} BTC</span>
        </div>

        <div style={{ fontSize: "0.78rem", color: "rgba(243,241,233,0.55)", fontWeight: 600, marginBottom: 8 }}>
          {t.pay.sendTo}
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            background: "rgba(0,0,0,0.25)",
            border: "1px solid rgba(243,241,233,0.1)",
            borderRadius: 8,
            padding: "10px 12px",
            marginBottom: 20,
          }}
        >
          <code style={{ fontSize: "0.78rem", wordBreak: "break-all", color: "#F3F1E9", flex: 1 }}>
            {PLATFORM_BTC_ADDRESS}
          </code>
          <button
            onClick={copyAddress}
            style={{
              background: copied ? "#2E7D4F" : "rgba(243,241,233,0.1)",
              color: "#F3F1E9",
              border: "none",
              borderRadius: 6,
              padding: "6px 10px",
              fontSize: "0.72rem",
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {copied ? t.pay.copied : t.pay.copy}
          </button>
        </div>

        <label style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
          <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(243,241,233,0.6)" }}>
            {t.pay.txIdLabel}
          </span>
          <input
            value={txId}
            onChange={(e) => {
              setTxId(e.target.value);
              if (error) setError("");
            }}
            style={inputStyle}
            placeholder={t.pay.txIdPh}
          />
        </label>

        {error && (
          <div style={{ color: "#D98B7A", fontSize: "0.82rem", marginBottom: 12 }}>{error}</div>
        )}

        <button
          onClick={handleConfirm}
          disabled={confirming}
          style={{
            width: "100%",
            background: confirming ? "rgba(201,165,78,0.4)" : "#C9A54E",
            color: "#0B1F17",
            border: "none",
            padding: "14px 20px",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: "0.95rem",
            cursor: confirming ? "default" : "pointer",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {confirming ? t.pay.confirming : t.pay.confirmBtn}
        </button>

        <div style={{ fontSize: "0.74rem", color: "rgba(243,241,233,0.4)", marginTop: 14, lineHeight: 1.5 }}>
          {t.pay.demoNote}
        </div>
      </div>
    </div>
  );
}

function AdminLogin({ onSuccess, t }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setError("");
      onSuccess();
    } else {
      setError(t.adminLogin.error);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: "0 28px" }}>
      <div
        style={{
          background: "rgba(243,241,233,0.04)",
          border: "1px solid rgba(243,241,233,0.12)",
          borderRadius: 14,
          padding: "32px 28px",
        }}
      >
        <div
          style={{
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 700,
            fontSize: "1.4rem",
            marginBottom: 4,
          }}
        >
          {t.adminLogin.title}
        </div>
        <p style={{ color: "rgba(243,241,233,0.55)", fontSize: "0.85rem", margin: "0 0 24px" }}>
          {t.adminLogin.sub}
        </p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label={t.adminLogin.username}>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={inputStyle}
              autoFocus
            />
          </Field>
          <Field label={t.adminLogin.password}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </Field>
          {error && (
            <div style={{ color: "#D98B7A", fontSize: "0.82rem" }}>{error}</div>
          )}
          <button
            type="submit"
            style={{
              background: "#C9A54E",
              color: "#0B1F17",
              border: "none",
              padding: "12px 20px",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              marginTop: 4,
            }}
          >
            {t.adminLogin.signIn}
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminPanel({ opportunities, applications, postForm, setPostForm, onPost, onUpdateStatus, onConfirmPayment, onLogout, t, posLabels }) {
  const [tab, setTab] = useState("applications");

  function set(field, val) {
    setPostForm((f) => ({ ...f, [field]: val }));
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 28px 100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: "2rem", fontWeight: 700, margin: "0 0 4px" }}>
            {t.admin.title}
          </h2>
          <p style={{ color: "rgba(243,241,233,0.6)", margin: "0 0 26px", fontSize: "0.9rem" }}>
            {t.admin.sub}
          </p>
        </div>
        <button
          onClick={onLogout}
          style={{
            background: "rgba(243,241,233,0.06)",
            color: "rgba(243,241,233,0.7)",
            border: "1px solid rgba(243,241,233,0.15)",
            borderRadius: 8,
            padding: "8px 14px",
            fontSize: "0.8rem",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {t.admin.logout}
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        {[
          { k: "applications", l: t.admin.tabApplications(applications.length) },
          { k: "post", l: t.admin.tabPost },
        ].map((tb) => (
          <button
            key={tb.k}
            onClick={() => setTab(tb.k)}
            style={{
              background: tab === tb.k ? "#C9A54E" : "rgba(243,241,233,0.06)",
              color: tab === tb.k ? "#0B1F17" : "#F3F1E9",
              border: "none",
              borderRadius: 8,
              padding: "9px 16px",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {tb.l}
          </button>
        ))}
      </div>

      {tab === "applications" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {applications.length === 0 && (
            <div style={{ color: "rgba(243,241,233,0.5)", padding: "30px 0" }}>
              {t.admin.noApplications}
            </div>
          )}
          {applications.map((a) => (
            <div
              key={a.id}
              style={{
                background: "rgba(243,241,233,0.04)",
                border: "1px solid rgba(243,241,233,0.1)",
                borderRadius: 12,
                padding: "18px 20px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "1.1rem" }}>
                    {a.name || t.admin.unnamed}
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "rgba(243,241,233,0.6)", margin: "3px 0" }}>
                    {t.admin.applyingTo} <strong style={{ color: "#C9A54E" }}>{a.club}</strong>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                    <Pill>{posLabels[a.positionKey] || "—"}</Pill>
                    <Pill>{a.age || "—"}</Pill>
                    <Pill>{a.height || "—"}cm / {a.weight || "—"}kg</Pill>
                    <Pill>{a.foot}</Pill>
                  </div>
                  {a.notes && (
                    <div style={{ fontSize: "0.83rem", color: "rgba(243,241,233,0.7)", marginTop: 10, maxWidth: 480 }}>
                      "{a.notes}"
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
                  <StatusStamp
                    status={a.paid ? "unlocked" : a.paymentStatus === "submitted" ? "submitted" : a.status}
                    t={t}
                  />
                  {a.status === "approved" && (
                    <span style={{ fontSize: "0.72rem", color: a.paid ? "#8FD3AA" : "rgba(243,241,233,0.45)" }}>
                      {a.paid ? t.admin.feePaid : t.admin.feeAwaiting}
                    </span>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => onUpdateStatus(a.id, "approved")}
                      style={{
                        background: "#2E7D4F",
                        color: "#F3F1E9",
                        border: "none",
                        borderRadius: 6,
                        padding: "6px 12px",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {t.admin.approve}
                    </button>
                    <button
                      onClick={() => onUpdateStatus(a.id, "rejected")}
                      style={{
                        background: "transparent",
                        color: "#8B4A3D",
                        border: "1px solid #8B4A3D",
                        borderRadius: 6,
                        padding: "6px 12px",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {t.admin.reject}
                    </button>
                  </div>
                </div>
              </div>

              {a.status === "approved" && a.paymentStatus === "submitted" && !a.paid && (
                <div
                  style={{
                    marginTop: 14,
                    background: "rgba(201,165,78,0.08)",
                    border: "1px solid rgba(201,165,78,0.3)",
                    borderRadius: 10,
                    padding: "14px 16px",
                  }}
                >
                  <div style={{ fontSize: "0.78rem", color: "#C9A54E", fontWeight: 700, marginBottom: 6 }}>
                    {t.admin.txIdShown}
                  </div>
                  <code style={{ fontSize: "0.8rem", color: "#F3F1E9", wordBreak: "break-all", display: "block", marginBottom: 10 }}>
                    {a.txId}
                  </code>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <a
                      href={`https://www.blockchain.com/explorer/search?search=${encodeURIComponent(a.txId)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#8FD3AA", fontSize: "0.8rem", fontWeight: 600, textDecoration: "underline" }}
                    >
                      {t.admin.checkOnExplorer}
                    </a>
                    <button
                      onClick={() => onConfirmPayment(a.id)}
                      style={{
                        background: "#2E7D4F",
                        color: "#F3F1E9",
                        border: "none",
                        borderRadius: 6,
                        padding: "8px 14px",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      {t.admin.confirmPayment}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "post" && (
        <form onSubmit={onPost} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label={t.admin.clubName}>
              <input value={postForm.club} onChange={(e) => set("club", e.target.value)} style={inputStyle} placeholder={t.admin.clubNamePh} />
            </Field>
            <Field label={t.admin.positionNeeded}>
              <select value={postForm.positionKey} onChange={(e) => set("positionKey", e.target.value)} style={inputStyle}>
                <option value="">{t.apply.selectPosition}</option>
                {positionKeys.map((pk) => (
                  <option key={pk} value={pk}>
                    {posLabels[pk]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label={t.admin.country}>
              <input value={postForm.country} onChange={(e) => set("country", e.target.value)} style={inputStyle} placeholder={t.admin.countryPh} />
            </Field>
            <Field label={t.admin.region}>
              <input value={postForm.region} onChange={(e) => set("region", e.target.value)} style={inputStyle} placeholder={t.admin.regionPh} />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Field label={t.admin.ageRange}>
              <input value={postForm.ageRange} onChange={(e) => set("ageRange", e.target.value)} style={inputStyle} placeholder={t.admin.ageRangePh} />
            </Field>
            <Field label={t.admin.footPref}>
              <select value={postForm.footPref} onChange={(e) => set("footPref", e.target.value)} style={inputStyle}>
                <option value="either">{t.admin.footEither}</option>
                <option value="left">{t.admin.footLeft}</option>
                <option value="right">{t.admin.footRight}</option>
              </select>
            </Field>
            <Field label={t.admin.openSpots}>
              <input type="number" value={postForm.slots} onChange={(e) => set("slots", e.target.value)} style={inputStyle} placeholder="2" />
            </Field>
          </div>
          <Field label={t.admin.level}>
            <input value={postForm.level} onChange={(e) => set("level", e.target.value)} style={inputStyle} placeholder={t.admin.levelPh} />
          </Field>
          <Field label={t.admin.blurb}>
            <textarea value={postForm.blurb} onChange={(e) => set("blurb", e.target.value)} style={{ ...inputStyle, minHeight: 70 }} placeholder={t.admin.blurbPh} />
          </Field>
          <Field label={t.admin.requirements}>
            <textarea
              value={postForm.requirements}
              onChange={(e) => set("requirements", e.target.value)}
              style={{ ...inputStyle, minHeight: 90 }}
              placeholder={t.admin.requirementsPh}
            />
          </Field>
          <Field label={t.admin.deadline}>
            <input type="date" value={postForm.deadline} onChange={(e) => set("deadline", e.target.value)} style={inputStyle} />
          </Field>
          <button
            type="submit"
            style={{
              background: "#C9A54E",
              color: "#0B1F17",
              border: "none",
              padding: "14px 20px",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {t.admin.postBtn}
          </button>
        </form>
      )}
    </div>
  );
}

function Footer({ t }) {
  return (
    <div
      style={{
        borderTop: "1px solid rgba(243,241,233,0.08)",
        padding: "24px 28px",
        textAlign: "center",
        color: "rgba(243,241,233,0.4)",
        fontSize: "0.8rem",
      }}
    >
      {t.footer}
    </div>
  );
}
