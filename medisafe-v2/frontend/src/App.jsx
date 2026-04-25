import { useState, useEffect } from "react";
import "./index.css";
import Dashboard    from "./pages/Dashboard";
import PatientsPage from "./pages/PatientsPage";
import ProfilePage  from "./pages/ProfilePage";
import AnalysisPage from "./pages/AnalysisPage";
import RiskInsights from "./pages/RiskInsights";
import ChatbotPage  from "./pages/ChatbotPage";

const NAV = [
  { id: "dashboard", label: "Dashboard",    icon: "⬡" },
  { id: "patients",  label: "Patients",     icon: "👥" },
  { id: "analysis",  label: "Analysis",     icon: "🔬" },
  { id: "insights",  label: "Risk Insights",icon: "📊" },
  { id: "chat",      label: "AI Assistant", icon: "💬" },
];

const PAGE_TITLES = {
  dashboard: "Dashboard",
  patients:  "Patient Registry",
  profile:   "Patient Profile",
  analysis:  "Prescription Analysis",
  insights:  "Risk Insights",
  chat:      "AI Assistant",
};

export default function App() {
  const [page, setPage]       = useState("dashboard");
  const [profileId, setProfileId] = useState(null);
  const [time, setTime]       = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  function navigate(target, id = null) {
    setPage(target);
    if (id) setProfileId(id);
  }

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">✚</div>
          <div className="logo-text-block">
            <span className="logo-name">MediSafe</span>
            <span className="logo-ver">v2.0 · Clinical AI</span>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">Navigation</div>
          {NAV.map(n => (
            <button
              key={n.id}
              className={`nav-item ${page === n.id || (n.id === "patients" && page === "profile") ? "active" : ""}`}
              onClick={() => navigate(n.id)}
            >
              <span className="nav-icon">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-badge">
            ⚠️ Prototype only<br/>Not for clinical use
          </div>
        </div>
      </aside>

      {/* ── Header ── */}
      <header className="app-header">
        <div>
          <div className="header-title">{PAGE_TITLES[page] || "MediSafe"}</div>
          <div className="header-subtitle">AI Medical Safety Auditor</div>
        </div>
        <div className="header-spacer" />
        <div className="header-time">
          {time.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit"})}
        </div>
        <div className="header-dot" title="System online" />
      </header>

      {/* ── Page Content ── */}
      <main>
        {page === "dashboard" && <Dashboard   onNavigate={navigate} />}
        {page === "patients"  && <PatientsPage onNavigate={navigate} />}
        {page === "profile"   && <ProfilePage  patientId={profileId} onNavigate={navigate} />}
        {page === "analysis"  && <AnalysisPage />}
        {page === "insights"  && <RiskInsights onNavigate={navigate} />}
        {page === "chat"      && <ChatbotPage  />}
      </main>
    </div>
  );
}
