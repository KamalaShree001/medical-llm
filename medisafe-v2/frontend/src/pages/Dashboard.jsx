import { PATIENTS, RISK_HISTORY, MEDICINES_DB } from "../data/mockData";

function DonutChart({ high, medium, safe }) {
  const total = high + medium + safe;
  const r = 54;
  const circ = 2 * Math.PI * r;
  const highPct   = high / total;
  const medPct    = medium / total;
  const safePct   = safe / total;

  const highDash  = circ * highPct;
  const medDash   = circ * medPct;
  const safeDash  = circ * safePct;

  const highOff   = 0;
  const medOff    = -(circ - highDash);
  const safeOff   = -(circ - highDash - medDash);

  return (
    <div className="donut-chart">
      <svg className="donut-svg" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="12"/>
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--green)" strokeWidth="12"
          strokeDasharray={`${safeDash} ${circ}`} strokeDashoffset={safeOff} strokeLinecap="round"/>
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--amber)" strokeWidth="12"
          strokeDasharray={`${medDash} ${circ}`} strokeDashoffset={medOff} strokeLinecap="round"/>
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--red)" strokeWidth="12"
          strokeDasharray={`${highDash} ${circ}`} strokeDashoffset={highOff} strokeLinecap="round"/>
      </svg>
      <div className="donut-center">
        <div className="donut-value">{total}</div>
        <div className="donut-label">Total</div>
      </div>
    </div>
  );
}

function BarChart({ data }) {
  const maxTotal = Math.max(...data.map(d => d.high + d.medium + d.safe));
  return (
    <div>
      <div className="bar-chart">
        {data.map((d, i) => {
          const total = d.high + d.medium + d.safe;
          const scale = 100 / maxTotal;
          return (
            <div className="bar-group" key={i}>
              <div className="bar-stack" style={{ height: `${total * scale}%` }}>
                <div className="bar-seg red"   style={{ height: `${(d.high   / total) * 100}%` }} title={`HIGH: ${d.high}`} />
                <div className="bar-seg amber" style={{ height: `${(d.medium / total) * 100}%` }} title={`MEDIUM: ${d.medium}`} />
                <div className="bar-seg green" style={{ height: `${(d.safe   / total) * 100}%` }} title={`SAFE: ${d.safe}`} />
              </div>
              <div className="bar-label">{d.date.split(" ")[1]}</div>
            </div>
          );
        })}
      </div>
      <div className="chart-legend">
        <div className="legend-item"><div className="legend-dot" style={{background:"var(--red)"}}/>High</div>
        <div className="legend-item"><div className="legend-dot" style={{background:"var(--amber)"}}/>Medium</div>
        <div className="legend-item"><div className="legend-dot" style={{background:"var(--green)"}}/>Safe</div>
      </div>
    </div>
  );
}

const AVATAR_COLORS = ["cyan","green","red","amber","purple","cyan","green","red"];

export default function Dashboard({ onNavigate }) {
  const totalPatients = PATIENTS.length;
  const highRisk   = PATIENTS.filter(p => p.riskLevel === "HIGH").length;
  const medRisk    = PATIENTS.filter(p => p.riskLevel === "MEDIUM").length;
  const safeCount  = PATIENTS.filter(p => p.riskLevel === "SAFE").length;
  const totalScans = PATIENTS.reduce((sum, p) => sum + p.history.length, 0);

  const recentPatients = [...PATIENTS].sort((a,b) => b.lastVisit.localeCompare(a.lastVisit)).slice(0,5);
  const highRiskMeds   = MEDICINES_DB.filter(m => m.risk === "HIGH");

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-title">Clinical Dashboard</div>
        <div className="page-desc">system overview · {new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card cyan">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{totalPatients}</div>
          <div className="stat-label">Total Patients</div>
          <div className="stat-sub">+2 this week</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon">🚨</div>
          <div className="stat-value">{highRisk}</div>
          <div className="stat-label">High Risk</div>
          <div className="stat-sub">{Math.round(highRisk/totalPatients*100)}% of patients</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-icon">⚠️</div>
          <div className="stat-value">{medRisk}</div>
          <div className="stat-label">Medium Risk</div>
          <div className="stat-sub">{Math.round(medRisk/totalPatients*100)}% of patients</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">🔬</div>
          <div className="stat-value">{totalScans}</div>
          <div className="stat-label">Total Scans</div>
          <div className="stat-sub">{safeCount} safe outcomes</div>
        </div>
      </div>

      <div className="grid-2" style={{marginBottom:20}}>
        {/* Bar Chart */}
        <div className="card">
          <div className="card-title"><span className="card-title-icon">📊</span>7-Day Risk Overview</div>
          <BarChart data={RISK_HISTORY} />
        </div>

        {/* Donut */}
        <div className="card">
          <div className="card-title"><span className="card-title-icon">🎯</span>Risk Distribution</div>
          <DonutChart high={highRisk} medium={medRisk} safe={safeCount} />
          <div className="chart-legend" style={{justifyContent:"center",marginTop:16}}>
            <div className="legend-item"><div className="legend-dot" style={{background:"var(--red)"}}/>High ({highRisk})</div>
            <div className="legend-item"><div className="legend-dot" style={{background:"var(--amber)"}}/>Medium ({medRisk})</div>
            <div className="legend-item"><div className="legend-dot" style={{background:"var(--green)"}}/>Safe ({safeCount})</div>
          </div>
        </div>
      </div>

      <div className="grid-2-1">
        {/* Recent patients */}
        <div className="card">
          <div className="card-title"><span className="card-title-icon">🕐</span>Recent Patients</div>
          <table className="patient-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Last Visit</th>
                <th>Risk</th>
                <th>Allergies</th>
              </tr>
            </thead>
            <tbody>
              {recentPatients.map((p, i) => (
                <tr key={p.id} onClick={() => onNavigate("patients", p.id)}>
                  <td>
                    <div className="patient-name-cell">
                      <div className={`patient-avatar avatar-${AVATAR_COLORS[i]}`}>
                        {p.name.split(" ").map(n=>n[0]).join("")}
                      </div>
                      <div>
                        <div className="patient-name-text">{p.name}</div>
                        <div className="patient-id-text">{p.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{fontFamily:"var(--font-mono)",fontSize:11}}>{p.lastVisit}</td>
                  <td><span className={`risk-pill ${p.riskLevel}`}>{p.riskLevel}</span></td>
                  <td>
                    {p.allergies.slice(0,2).map(a => <span key={a} className="allergy-tag">{a}</span>)}
                    {p.allergies.length > 2 && <span className="tag-more">+{p.allergies.length-2}</span>}
                    {p.allergies.length === 0 && <span style={{color:"var(--text-3)",fontSize:11}}>None</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* High risk meds */}
        <div className="card">
          <div className="card-title"><span className="card-title-icon">🔴</span>High Risk Medicines</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {highRiskMeds.map(m => (
              <div key={m.name} style={{
                padding:"10px 12px",
                background:"var(--red-dim)",
                border:"1px solid var(--red-border)",
                borderRadius:"var(--r-sm)"
              }}>
                <div style={{fontSize:13,fontWeight:600,color:"var(--red)",marginBottom:2}}>{m.name}</div>
                <div style={{fontSize:11,color:"var(--text-3)"}}>{m.category} · {m.interactions}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
