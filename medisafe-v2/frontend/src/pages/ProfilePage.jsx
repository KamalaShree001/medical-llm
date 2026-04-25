import { PATIENTS, MEDICINES_DB } from "../data/mockData";

const AVATAR_COLORS = ["cyan","green","red","amber","purple","cyan","green","red"];

export default function ProfilePage({ patientId, onNavigate }) {
  const idx = PATIENTS.findIndex(p => p.id === patientId);
  const p = PATIENTS[idx] || PATIENTS[0];
  const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];

  const knownMeds = MEDICINES_DB.filter(m =>
    p.medicines.some(pm => pm.toLowerCase() === m.name.toLowerCase())
  );

  const timelineIcon = { HIGH: "🚨", MEDIUM: "⚠️", SAFE: "✅" };

  return (
    <div className="page-content">
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <button
          onClick={() => onNavigate("patients")}
          style={{
            background:"var(--surface)",border:"1px solid var(--border)",
            color:"var(--text-2)",padding:"7px 12px",borderRadius:"var(--r-sm)",
            fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:6
          }}
        >← Back</button>
        <div>
          <div className="page-title" style={{marginBottom:0}}>Patient Profile</div>
          <div className="page-desc">{p.id} · full clinical record</div>
        </div>
      </div>

      {/* Hero */}
      <div className="profile-hero">
        <div className={`profile-avatar-lg avatar-${color}`} style={{width:72,height:72,fontSize:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontWeight:700,border:"2px solid var(--cyan-border)",background:"var(--cyan-dim)",color:"var(--cyan)"}}>
          {p.name.split(" ").map(n=>n[0]).join("")}
        </div>
        <div className="profile-info">
          <div className="profile-name">{p.name}</div>
          <div className="profile-meta">
            <span className="profile-meta-item">🎂 Age {p.age}</span>
            <span className="profile-meta-item">⚧ {p.gender}</span>
            <span className="profile-meta-item">🩸 {p.blood}</span>
            <span className="profile-meta-item">📞 {p.phone}</span>
            <span className="profile-meta-item">✉️ {p.email}</span>
          </div>
          <div style={{marginBottom:8}}>
            <span style={{fontSize:10,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:"0.8px",marginRight:8}}>Conditions</span>
            <div className="profile-tags" style={{display:"inline-flex",flexWrap:"wrap",gap:6}}>
              {p.conditions.map(c => <span key={c} className="tag-condition">{c}</span>)}
            </div>
          </div>
          <div>
            <span style={{fontSize:10,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:"0.8px",marginRight:8}}>Current Medicines</span>
            <div className="profile-tags" style={{display:"inline-flex",flexWrap:"wrap",gap:6}}>
              {p.medicines.map(m => <span key={m} className="tag-medicine">{m}</span>)}
            </div>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8,flexShrink:0}}>
          <span className={`risk-pill ${p.riskLevel}`} style={{fontSize:13,padding:"6px 14px"}}>
            {p.riskLevel === "HIGH" ? "🚨" : p.riskLevel === "MEDIUM" ? "⚠️" : "✅"} {p.riskLevel} RISK
          </span>
          <button
            className="btn-sm"
            onClick={() => onNavigate("analysis")}
          >🔬 Scan Prescription</button>
        </div>
      </div>

      <div className="grid-2" style={{marginBottom:20}}>
        {/* Allergies */}
        <div className="card">
          <div className="card-title"><span className="card-title-icon">⚠️</span>Known Allergies</div>
          {p.allergies.length === 0 ? (
            <div style={{fontSize:13,color:"var(--text-3)",fontStyle:"italic"}}>No known allergies on record.</div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {p.allergies.map(a => (
                <div key={a} style={{
                  display:"flex",alignItems:"center",gap:10,
                  padding:"10px 14px",
                  background:"var(--red-dim)",border:"1px solid var(--red-border)",
                  borderRadius:"var(--r-sm)"
                }}>
                  <span style={{fontSize:18}}>🚫</span>
                  <div>
                    <div style={{fontSize:14,fontWeight:600,color:"var(--red)"}}>{a}</div>
                    <div style={{fontSize:11,color:"var(--text-3)"}}>Do not prescribe {a}-class medicines</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current medicines info */}
        <div className="card">
          <div className="card-title"><span className="card-title-icon">💊</span>Current Medications</div>
          {knownMeds.length === 0 ? (
            <div style={{fontSize:13,color:"var(--text-3)",fontStyle:"italic"}}>No medication data found.</div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {knownMeds.map(m => (
                <div key={m.name} style={{
                  display:"flex",alignItems:"center",justifyContent:"space-between",
                  padding:"10px 14px",
                  background:"var(--surface-2)",border:"1px solid var(--border)",
                  borderRadius:"var(--r-sm)"
                }}>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>{m.name}</div>
                    <div style={{fontSize:11,color:"var(--text-3)"}}>{m.category} · {m.uses}</div>
                  </div>
                  <span className={`risk-pill ${m.risk === "LOW" ? "SAFE" : m.risk}`}>
                    {m.risk}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="card">
        <div className="card-title"><span className="card-title-icon">📅</span>Prescription History</div>
        <div className="timeline">
          {p.history.map((h, i) => (
            <div key={i} className="timeline-item">
              <div className={`timeline-dot ${h.risk}`}>
                {timelineIcon[h.risk]}
              </div>
              <div className="timeline-body">
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                  <div className="timeline-date">{h.date}</div>
                  <span className={`risk-pill ${h.risk}`}>{h.risk}</span>
                </div>
                <div className="timeline-meds">{h.medicines.join(", ")}</div>
                <div className="timeline-reason">{h.reason}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
