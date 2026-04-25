import { useState } from "react";
import { PATIENTS } from "../data/mockData";

const AVATAR_COLORS = ["cyan","green","red","amber","purple","cyan","green","red"];

export default function PatientsPage({ onNavigate }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const filtered = PATIENTS.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        p.id.toLowerCase().includes(search.toLowerCase());
    const matchRisk = filter === "ALL" || p.riskLevel === filter;
    return matchSearch && matchRisk;
  });

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-title">Patient Registry</div>
        <div className="page-desc">{PATIENTS.length} registered patients · click any row to view profile</div>
      </div>

      {/* Filters */}
      <div style={{display:"flex",gap:10,marginBottom:20,alignItems:"center"}}>
        <input
          className="form-input"
          style={{maxWidth:260}}
          placeholder="🔍  Search by name or ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {["ALL","HIGH","MEDIUM","SAFE"].map(r => (
          <button
            key={r}
            onClick={() => setFilter(r)}
            style={{
              padding:"7px 14px",
              borderRadius:"var(--r-sm)",
              fontSize:12,
              fontWeight:600,
              border: filter === r ? "1px solid var(--cyan)" : "1px solid var(--border)",
              background: filter === r ? "var(--cyan-dim)" : "var(--surface)",
              color: filter === r ? "var(--cyan)" : "var(--text-2)",
              cursor:"pointer",
              transition:"all .15s"
            }}
          >{r}</button>
        ))}
        <span style={{marginLeft:"auto",fontFamily:"var(--font-mono)",fontSize:11,color:"var(--text-3)"}}>
          {filtered.length} results
        </span>
      </div>

      <div className="card" style={{padding:0,overflow:"hidden"}}>
        <table className="patient-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Age / Gender</th>
              <th>Blood Type</th>
              <th>Conditions</th>
              <th>Allergies</th>
              <th>Last Visit</th>
              <th>Risk</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={p.id} onClick={() => onNavigate("profile", p.id)}>
                <td>
                  <div className="patient-name-cell">
                    <div className={`patient-avatar avatar-${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                      {p.name.split(" ").map(n=>n[0]).join("")}
                    </div>
                    <div>
                      <div className="patient-name-text">{p.name}</div>
                      <div className="patient-id-text">{p.id} · {p.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{fontFamily:"var(--font-mono)",fontSize:12}}>{p.age}y · {p.gender}</td>
                <td>
                  <span style={{
                    fontFamily:"var(--font-mono)",fontSize:12,padding:"2px 8px",
                    background:"var(--surface-2)",borderRadius:"var(--r-sm)",color:"var(--text-2)"
                  }}>{p.blood}</span>
                </td>
                <td>
                  {p.conditions.slice(0,1).map(c => (
                    <span key={c} className="tag-condition" style={{fontSize:11}}>{c}</span>
                  ))}
                  {p.conditions.length > 1 && (
                    <span className="tag-more">+{p.conditions.length-1}</span>
                  )}
                </td>
                <td>
                  {p.allergies.length === 0
                    ? <span style={{color:"var(--text-3)",fontSize:11}}>None</span>
                    : p.allergies.slice(0,2).map(a => <span key={a} className="allergy-tag">{a}</span>)
                  }
                  {p.allergies.length > 2 && <span className="tag-more">+{p.allergies.length-2}</span>}
                </td>
                <td style={{fontFamily:"var(--font-mono)",fontSize:11,color:"var(--text-3)"}}>{p.lastVisit}</td>
                <td><span className={`risk-pill ${p.riskLevel}`}>{p.riskLevel}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{textAlign:"center",padding:"40px",color:"var(--text-3)",fontSize:13}}>
            No patients found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
