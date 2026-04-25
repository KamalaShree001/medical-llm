import { PATIENTS, RISK_HISTORY } from "../data/mockData";

export default function RiskInsights({ onNavigate }) {
  const allHistory = PATIENTS.flatMap(p =>
    p.history.map(h => ({ ...h, patientName: p.name, patientId: p.id }))
  ).sort((a, b) => b.date.localeCompare(a.date));

  const totalHigh   = allHistory.filter(h => h.risk === "HIGH").length;
  const totalMed    = allHistory.filter(h => h.risk === "MEDIUM").length;
  const totalSafe   = allHistory.filter(h => h.risk === "SAFE").length;
  const total       = allHistory.length;

  const topRiskPatients = [...PATIENTS]
    .filter(p => p.riskLevel === "HIGH")
    .slice(0, 5);

  // Medicine frequency
  const medFreq = {};
  allHistory.forEach(h => h.medicines.forEach(m => { medFreq[m] = (medFreq[m] || 0) + 1; }));
  const topMeds = Object.entries(medFreq).sort((a,b) => b[1]-a[1]).slice(0, 8);
  const maxFreq = topMeds[0]?.[1] || 1;

  const riskIcon = { HIGH: "🚨", MEDIUM: "⚠️", SAFE: "✅" };
  const avatarColors = ["cyan","green","red","amber","purple"];

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-title">Risk Insights</div>
        <div className="page-desc">historical analysis · {total} total audits</div>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid" style={{marginBottom:24}}>
        <div className="stat-card red">
          <div className="stat-icon">🚨</div>
          <div className="stat-value">{totalHigh}</div>
          <div className="stat-label">High Risk Audits</div>
          <div className="stat-sub">{Math.round(totalHigh/total*100)}% of all scans</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-icon">⚠️</div>
          <div className="stat-value">{totalMed}</div>
          <div className="stat-label">Medium Risk</div>
          <div className="stat-sub">{Math.round(totalMed/total*100)}% of all scans</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{totalSafe}</div>
          <div className="stat-label">Safe Outcomes</div>
          <div className="stat-sub">{Math.round(totalSafe/total*100)}% of all scans</div>
        </div>
        <div className="stat-card cyan">
          <div className="stat-icon">📋</div>
          <div className="stat-value">{total}</div>
          <div className="stat-label">Total Audits</div>
          <div className="stat-sub">Across {PATIENTS.length} patients</div>
        </div>
      </div>

      <div className="grid-2" style={{marginBottom:20}}>
        {/* Medicine frequency chart */}
        <div className="card">
          <div className="card-title"><span className="card-title-icon">💊</span>Most Prescribed Medicines</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {topMeds.map(([med, count]) => (
              <div key={med}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:12,color:"var(--text-2)",fontWeight:500}}>{med}</span>
                  <span style={{fontFamily:"var(--font-mono)",fontSize:11,color:"var(--text-3)"}}>{count}x</span>
                </div>
                <div style={{height:6,background:"var(--surface-2)",borderRadius:3,overflow:"hidden"}}>
                  <div style={{
                    height:"100%",
                    width:`${(count/maxFreq)*100}%`,
                    background:"linear-gradient(90deg, var(--cyan), var(--green))",
                    borderRadius:3,
                    transition:"width 0.8s ease"
                  }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* High-risk patients */}
        <div className="card">
          <div className="card-title"><span className="card-title-icon">🚨</span>High Risk Patients</div>
          {topRiskPatients.length === 0 ? (
            <div style={{fontSize:13,color:"var(--text-3)",fontStyle:"italic"}}>No high-risk patients currently.</div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {topRiskPatients.map((p, i) => (
                <div
                  key={p.id}
                  onClick={() => onNavigate("profile", p.id)}
                  style={{
                    display:"flex",alignItems:"center",gap:12,
                    padding:"10px 14px",
                    background:"var(--red-dim)",border:"1px solid var(--red-border)",
                    borderRadius:"var(--r-sm)",cursor:"pointer",transition:"opacity .15s"
                  }}
                >
                  <div className={`patient-avatar avatar-${avatarColors[i % avatarColors.length]}`}>
                    {p.name.split(" ").map(n=>n[0]).join("")}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>{p.name}</div>
                    <div style={{fontSize:11,color:"var(--text-3)",fontFamily:"var(--font-mono)"}}>
                      {p.allergies.length > 0 ? `⚠️ ${p.allergies.join(", ")}` : "No allergies on record"}
                    </div>
                  </div>
                  <span style={{fontSize:11,color:"var(--text-3)"}}>›</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full audit feed */}
      <div className="card">
        <div className="card-title"><span className="card-title-icon">📜</span>Complete Audit Log</div>
        <div className="risk-feed">
          {allHistory.map((h, i) => (
            <div
              key={i}
              className="risk-feed-item"
              onClick={() => onNavigate("profile", h.patientId)}
              style={{cursor:"pointer"}}
            >
              <div style={{
                width:36,height:36,borderRadius:"50%",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:16,flexShrink:0,
                background: h.risk === "HIGH" ? "var(--red-dim)" : h.risk === "MEDIUM" ? "var(--amber-dim)" : "var(--green-dim)",
                border: `1px solid ${h.risk === "HIGH" ? "var(--red-border)" : h.risk === "MEDIUM" ? "var(--amber-border)" : "var(--green-border)"}`
              }}>
                {riskIcon[h.risk]}
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                  <span className="feed-name">{h.patientName}</span>
                  <span style={{fontFamily:"var(--font-mono)",fontSize:10,color:"var(--text-3)"}}>{h.patientId}</span>
                  <span className={`risk-pill ${h.risk}`} style={{marginLeft:"auto"}}>{h.risk}</span>
                </div>
                <div className="feed-meds">💊 {h.medicines.join(", ")}</div>
                <div className="feed-reason">{h.reason}</div>
              </div>
              <div style={{fontFamily:"var(--font-mono)",fontSize:10,color:"var(--text-3)",flexShrink:0}}>{h.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
