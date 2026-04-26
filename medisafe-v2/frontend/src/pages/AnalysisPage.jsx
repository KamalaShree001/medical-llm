import { useState, useRef, useEffect } from "react";
import { PATIENTS, MEDICINES_DB } from "../data/mockData";
import DrawToIdentify from "../components/DrawToIdentify";

const API_BASE = "https://medical-llm-production-bf9f.up.railway.app";

function highlightMedicinesInText(text, medicines) {
  if (!text || medicines.length === 0) return text;
  let result = text;
  medicines.forEach(med => {
    const regex = new RegExp(`(${med.name})`, "gi");
    result = result.replace(regex, `__HIGHLIGHT__$1__ENDHIGHLIGHT__`);
  });
  return result;
}

function HighlightedText({ text, medicines, conflictNames }) {
  if (!text) return <span style={{color:"var(--text-3)",fontStyle:"italic"}}>(No text extracted)</span>;
  const parts = text.split(/(__HIGHLIGHT__|__ENDHIGHLIGHT__)/);
  let inside = false, currentWord = "";
  const elements = [];
  let key = 0;
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === "__HIGHLIGHT__") { inside = true; continue; }
    if (parts[i] === "__ENDHIGHLIGHT__") {
      const isConflict = conflictNames.some(c => c.toLowerCase() === currentWord.toLowerCase());
      elements.push(<span key={key++} className={`text-highlight ${isConflict ? "conflict" : ""}`}>{currentWord}</span>);
      currentWord = ""; inside = false; continue;
    }
    if (inside) currentWord = parts[i];
    else elements.push(<span key={key++}>{parts[i]}</span>);
  }
  return <>{elements}</>;
}

// ── Medicine Identifier ───────────────────────────────────────────────────────

const RISK_ICONS = { HIGH: "🔴", MEDIUM: "🟡", LOW: "🟢" };

function MedicineCheckerSection({ selectedPatient }) {
  const [query, setQuery]             = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [addedMeds, setAddedMeds]     = useState([]);
  const [activeMed, setActiveMed]     = useState(null);
  const debounceRef                   = useRef(null);
  const inputRef                      = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.length < 2) { setSuggestions([]); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
  const res = await fetch(`${API_BASE}/search-medicine?q=${encodeURIComponent(query)}&patient_id=${selectedPatient}`);
  
  // Check if response is ok before parsing
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  
  const data = await res.json();
  setSuggestions(data.results || []);
} catch (error) {
  console.error("Fetch failed, using local data:", error); // Debugging
  
  // Your existing fallback logic
  const q = query.toLowerCase();
  const patient = PATIENTS.find(p => p.id === selectedPatient);
  const allergies = patient?.allergies || [];
  const local = MEDICINES_DB
    .filter(m => m.name.toLowerCase().includes(q))
    .slice(0, 6)
    .map(m => {
      const conflict = allergies.some(a =>
        m.name.toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(m.name.toLowerCase())
      );
      return { ...m, match_score: 95, conflict, conflict_reason: conflict ? "Conflicts with known allergy" : "", risk_level: m.risk };
    });
  setSuggestions(local);
}
      setLoading(false);
    }, 280);
  }, [query, selectedPatient]);

  function pickSuggestion(med) {
    setActiveMed(med);
    if (!addedMeds.find(m => m.name === med.name)) setAddedMeds(prev => [med, ...prev]);
    setQuery(""); setSuggestions([]);
    inputRef.current?.focus();
  }

  function removeMed(name) {
    setAddedMeds(prev => prev.filter(m => m.name !== name));
    if (activeMed?.name === name) setActiveMed(null);
  }

  const hasConflict = addedMeds.some(m => m.conflict);

  return (
    <div>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,paddingBottom:16,borderBottom:"1px solid var(--border)"}}>
        <div style={{
          width:40,height:40,borderRadius:"var(--r-sm)",
          background:"linear-gradient(135deg,var(--cyan-dim),var(--green-dim))",
          border:"1px solid var(--cyan-border)",
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:20
        }}>💊</div>
        <div>
          <div style={{fontSize:16,fontWeight:700,color:"var(--text)"}}>Medicine Identifier</div>
          <div style={{fontSize:11,color:"var(--text-3)",fontFamily:"var(--font-mono)"}}>
            type any medicine · instant allergy &amp; risk check · benefits · side effects · alternatives
          </div>
        </div>
        {selectedPatient && (() => {
          const pt = PATIENTS.find(p => p.id === selectedPatient);
          return pt && (
            <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8,padding:"6px 12px",borderRadius:"var(--r-sm)",background:"var(--surface-2)",border:"1px solid var(--border)"}}>
              <span style={{fontSize:11,color:"var(--text-3)"}}>Checking for:</span>
              <span style={{fontSize:12,fontWeight:600,color:"var(--text)"}}>{pt.name}</span>
              {pt.allergies.map(a => <span key={a} className="allergy-tag" style={{margin:0}}>{a}</span>)}
            </div>
          );
        })()}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
        {/* LEFT: Search + list */}
        <div>
          {/* Search box */}
          <div style={{position:"relative",marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:10,background:"var(--bg-3)",border:"2px solid var(--border-2)",borderRadius:"var(--r)",padding:"11px 14px",transition:"border-color .15s"}}>
              <span style={{fontSize:18}}>🔍</span>
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Type medicine name... e.g. Amoxicillin, Warfarin"
                style={{flex:1,background:"none",border:"none",outline:"none",color:"var(--text)",fontSize:14,fontFamily:"var(--font-sans)"}}
                autoComplete="off"
                onFocus={e => e.currentTarget.parentElement.style.borderColor="var(--cyan)"}
                onBlur={e => e.currentTarget.parentElement.style.borderColor="var(--border-2)"}
              />
              {loading && <div style={{width:14,height:14,border:"2px solid var(--border-2)",borderTopColor:"var(--cyan)",borderRadius:"50%",animation:"spin .6s linear infinite",flexShrink:0}}/>}
              {query && <button onClick={() => {setQuery("");setSuggestions([]);}} style={{background:"none",border:"none",color:"var(--text-3)",fontSize:14,cursor:"pointer",padding:0}}>✕</button>}
            </div>

            {/* Dropdown suggestions */}
            {suggestions.length > 0 && (
              <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,right:0,background:"var(--surface)",border:"1px solid var(--border-2)",borderRadius:"var(--r)",zIndex:100,boxShadow:"0 8px 32px rgba(0,0,0,0.5)",overflow:"hidden"}}>
                {suggestions.map((med, i) => (
                  <div key={med.name} onClick={() => pickSuggestion(med)}
                    style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",cursor:"pointer",background:med.conflict?"var(--red-dim)":"transparent",borderBottom:i<suggestions.length-1?"1px solid var(--border)":"none",transition:"background .1s"}}
                    onMouseEnter={e => !med.conflict&&(e.currentTarget.style.background="var(--surface-2)")}
                    onMouseLeave={e => !med.conflict&&(e.currentTarget.style.background="transparent")}
                  >
                    <span style={{fontSize:22}}>{med.conflict?"🚫":RISK_ICONS[med.risk_level]||"🟢"}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:med.conflict?"var(--red)":"var(--text)",marginBottom:2}}>{med.name}</div>
                      <div style={{fontSize:11,color:"var(--text-3)"}}>{med.category} · {med.common_uses}</div>
                      {med.conflict && <div style={{fontSize:11,color:"var(--red)",fontWeight:600,marginTop:2}}>⚠️ {med.conflict_reason}</div>}
                    </div>
                    <div style={{textAlign:"right"}}>
                      <span className={`risk-pill ${med.risk_level==="LOW"?"SAFE":med.risk_level||"SAFE"}`}>{med.risk_level||"LOW"}</span>
                      <div style={{fontFamily:"var(--font-mono)",fontSize:9,color:"var(--text-3)",marginTop:3}}>{med.match_score}% match</div>
                    </div>
                  </div>
                ))}
                <div style={{padding:"7px 16px",fontSize:10,color:"var(--text-3)",fontFamily:"var(--font-mono)",background:"var(--bg-3)",borderTop:"1px solid var(--border)"}}>
                  Click a result to inspect it →
                </div>
              </div>
            )}

            {query.length >= 2 && suggestions.length === 0 && !loading && (
              <div style={{marginTop:6,padding:"10px 14px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--r-sm)",fontSize:12,color:"var(--text-3)"}}>
                No medicines found for "{query}"
              </div>
            )}
          </div>

          {/* Added medicines list */}
          {addedMeds.length > 0 ? (
            <div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",color:"var(--text-3)"}}>
                  Checked Medicines ({addedMeds.length})
                </span>
                <button onClick={() => {setAddedMeds([]);setActiveMed(null);}} style={{fontSize:11,color:"var(--text-3)",background:"none",border:"none",cursor:"pointer"}}>Clear all</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {addedMeds.map(med => (
                  <div key={med.name} onClick={() => setActiveMed(med)}
                    style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:"var(--r-sm)",cursor:"pointer",transition:"all .15s",
                      background:activeMed?.name===med.name?"var(--surface-2)":"var(--surface)",
                      border:`1px solid ${med.conflict?"var(--red-border)":activeMed?.name===med.name?"var(--cyan-border)":"var(--border)"}`
                    }}
                  >
                    <span style={{fontSize:18}}>{med.conflict?"🚫":RISK_ICONS[med.risk_level]||"🟢"}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600,color:med.conflict?"var(--red)":"var(--text)"}}>{med.name}</div>
                      <div style={{fontSize:11,color:"var(--text-3)"}}>{med.category}</div>
                    </div>
                    <span className={`risk-pill ${med.risk_level==="LOW"?"SAFE":med.risk_level||"SAFE"}`}>{med.risk_level||"LOW"}</span>
                    <button onClick={e=>{e.stopPropagation();removeMed(med.name);}} style={{background:"none",border:"none",color:"var(--text-3)",cursor:"pointer",fontSize:13}}>✕</button>
                  </div>
                ))}
              </div>
              <div style={{marginTop:10,padding:"10px 14px",borderRadius:"var(--r-sm)",
                background:hasConflict?"var(--red-dim)":"var(--green-dim)",
                border:`1px solid ${hasConflict?"var(--red-border)":"var(--green-border)"}`,
                fontSize:12,fontWeight:600,color:hasConflict?"var(--red)":"var(--green)"
              }}>
                {hasConflict
                  ? `🚨 ${addedMeds.filter(m=>m.conflict).length} conflict(s) — review before prescribing`
                  : `✅ All ${addedMeds.length} medicine(s) safe for this patient`
                }
              </div>
            </div>
          ) : (
            <div style={{textAlign:"center",padding:"32px 20px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--r)",color:"var(--text-3)"}}>
              <div style={{fontSize:36,marginBottom:8,opacity:.3}}>💊</div>
              <div style={{fontSize:13,marginBottom:4,color:"var(--text-2)"}}>Start typing a medicine above</div>
              <div style={{fontSize:11,fontFamily:"var(--font-mono)"}}>Try: Amoxicillin · Warfarin · Codeine · Aspirin</div>
            </div>
          )}
        </div>

        {/* RIGHT: Detail panel */}
        <div>
          {activeMed ? (
            <div style={{background:"var(--surface)",border:`2px solid ${activeMed.conflict?"var(--red-border)":"var(--border-2)"}`,borderRadius:"var(--r-lg)",overflow:"hidden",animation:"fadeUp .3s ease"}}>
              {/* Medicine header */}
              <div style={{
                padding:"18px 20px",
                background:activeMed.conflict?"var(--red-dim)":activeMed.risk_level==="HIGH"?"var(--red-dim)":activeMed.risk_level==="MEDIUM"?"var(--amber-dim)":"var(--green-dim)",
                borderBottom:`1px solid ${activeMed.conflict?"var(--red-border)":"var(--border)"}`
              }}>
                <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:10}}>
                  <span style={{fontSize:32}}>{activeMed.conflict?"🚫":RISK_ICONS[activeMed.risk_level]||"🟢"}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:22,fontWeight:800,color:"var(--text)",fontFamily:"var(--font-serif)",fontStyle:"italic",lineHeight:1.1}}>{activeMed.name}</div>
                    <div style={{fontSize:11,color:"var(--text-3)",fontFamily:"var(--font-mono)",marginTop:2}}>{activeMed.category}</div>
                  </div>
                  <span className={`risk-pill ${activeMed.risk_level==="LOW"?"SAFE":activeMed.risk_level||"SAFE"}`} style={{fontSize:12,padding:"5px 12px"}}>
                    {activeMed.risk_level||"LOW"} RISK
                  </span>
                </div>
                <div style={{height:5,background:"rgba(255,255,255,0.08)",borderRadius:3}}>
                  <div style={{height:"100%",borderRadius:3,width:`${activeMed.match_score||95}%`,background:"linear-gradient(90deg,var(--cyan),var(--green))",transition:"width .8s ease"}}/>
                </div>
                <div style={{fontFamily:"var(--font-mono)",fontSize:10,color:"var(--text-3)",marginTop:3}}>{activeMed.match_score||95}% match confidence</div>
              </div>

              <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:14}}>
                {/* Allergy conflict */}
                {activeMed.conflict && (
                  <div style={{padding:"12px 14px",background:"var(--red-dim)",border:"1px solid var(--red-border)",borderRadius:"var(--r-sm)"}}>
                    <div style={{fontSize:13,fontWeight:700,color:"var(--red)",marginBottom:4}}>🚫 ALLERGY CONFLICT</div>
                    <div style={{fontSize:12,color:"var(--text-2)"}}>{activeMed.conflict_reason}</div>
                    <div style={{fontSize:11,color:"var(--text-3)",marginTop:4}}>Do not prescribe without physician review</div>
                  </div>
                )}

                {/* Benefits */}
                <div>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",color:"var(--green)",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                    <span style={{width:6,height:6,borderRadius:"50%",background:"var(--green)",display:"inline-block"}}/>
                    Benefits / What It Treats
                  </div>
                  <div style={{padding:"10px 14px",background:"var(--green-dim)",border:"1px solid var(--green-border)",borderRadius:"var(--r-sm)",fontSize:13,color:"var(--text-2)",lineHeight:1.7}}>
                    {activeMed.common_uses || activeMed.uses}
                  </div>
                </div>

                {/* Risks */}
                <div>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",color:"var(--red)",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                    <span style={{width:6,height:6,borderRadius:"50%",background:"var(--red)",display:"inline-block"}}/>
                    Risks &amp; Side Effects
                  </div>
                  <div style={{padding:"10px 14px",background:"var(--red-dim)",border:"1px solid var(--red-border)",borderRadius:"var(--r-sm)",fontSize:13,color:"var(--text-2)",lineHeight:1.7}}>
                    {activeMed.interactions}
                  </div>
                </div>

                {/* Patient safety */}
                {selectedPatient && (() => {
                  const pt = PATIENTS.find(p => p.id === selectedPatient);
                  if (!pt) return null;
                  return (
                    <div>
                      <div style={{fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",color:"var(--cyan)",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                        <span style={{width:6,height:6,borderRadius:"50%",background:"var(--cyan)",display:"inline-block"}}/>
                        Patient Safety Check — {pt.name}
                      </div>
                      <div style={{padding:"10px 14px",background:activeMed.conflict?"var(--red-dim)":"var(--cyan-dim)",border:`1px solid ${activeMed.conflict?"var(--red-border)":"var(--cyan-border)"}`,borderRadius:"var(--r-sm)",fontSize:12,color:"var(--text-2)",lineHeight:1.8}}>
                        {pt.allergies.length > 0
                          ? <>Known allergies: <strong style={{color:"var(--red)"}}>{pt.allergies.join(", ")}</strong><br/></>
                          : <>No recorded allergies.<br/></>
                        }
                        {activeMed.conflict
                          ? <span style={{color:"var(--red)",fontWeight:700}}>🚫 NOT SAFE — allergy conflict detected</span>
                          : <span style={{color:"var(--green)",fontWeight:700}}>✅ SAFE — no allergy conflict</span>
                        }
                      </div>
                    </div>
                  );
                })()}

                {/* Alternatives */}
                <div>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",color:"var(--amber)",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                    <span style={{width:6,height:6,borderRadius:"50%",background:"var(--amber)",display:"inline-block"}}/>
                    Suggested Alternatives
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {(activeMed.alternatives||[]).length > 0
                      ? (activeMed.alternatives).map(alt => (
                          <div key={alt} onClick={() => { setQuery(alt); setSuggestions([]); inputRef.current?.focus(); }}
                            style={{padding:"5px 12px",borderRadius:20,fontSize:12,fontWeight:600,background:"var(--green-dim)",color:"var(--green)",border:"1px solid var(--green-border)",cursor:"pointer",transition:"opacity .15s"}}
                            onMouseEnter={e=>e.currentTarget.style.opacity=".7"}
                            onMouseLeave={e=>e.currentTarget.style.opacity="1"}
                          >✦ {alt}</div>
                        ))
                      : <span style={{fontSize:12,color:"var(--text-3)",fontStyle:"italic"}}>Consult a physician for alternatives</span>
                    }
                  </div>
                  {(activeMed.alternatives||[]).length > 0 && (
                    <div style={{fontSize:10,color:"var(--text-3)",marginTop:6,fontFamily:"var(--font-mono)"}}>Click an alternative to search it</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{height:"100%",minHeight:320,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--r-lg)",color:"var(--text-3)",textAlign:"center",padding:24}}>
              <div style={{fontSize:52,marginBottom:12,opacity:.2}}>🔍</div>
              <div style={{fontSize:14,fontWeight:600,color:"var(--text-2)",marginBottom:8}}>Search a medicine to see its full profile</div>
              <div style={{fontSize:12,color:"var(--text-3)",lineHeight:1.8}}>
                ✅ Benefits &amp; uses<br/>
                🔴 Risks &amp; side effects<br/>
                👤 Patient allergy check<br/>
                🔄 Safer alternatives
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AnalysisPage() {
  const [selectedPatient, setSelectedPatient] = useState("");
  const [imageFile, setImageFile]     = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState(null);
  const [error, setError]             = useState(null);
  const [drag, setDrag]               = useState(false);
  const [identifierTab, setIdentifierTab] = useState("type");
  const fileRef                       = useRef(null);

  function handleFile(file) {
    if (!file) return;
    if (!["image/jpeg","image/png","image/jpg"].includes(file.type)) { setError("Only JPG or PNG images are supported."); return; }
    setImageFile(file); setImagePreview(URL.createObjectURL(file)); setResult(null); setError(null);
  }

  async function analyze() {
    if (!imageFile) { setError("Please upload an image first."); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", imageFile);
      if (selectedPatient) fd.append("patient_id", selectedPatient);
      const res  = await fetch(`${API_BASE}/analyze`, { method:"POST", body:fd });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail||"Server error"); }
      const data = await res.json();

      const enriched = data.medicines.map(m => {
        const db = MEDICINES_DB.find(d => d.name.toLowerCase() === m.name.toLowerCase());
        return { ...m, alternatives: db?.alternatives||[], risk_level: m.risk_level||db?.risk||"LOW" };
      });
      const patient     = PATIENTS.find(p => p.id === selectedPatient);
      const allergies   = patient?.allergies||[];
      const conflictMeds = enriched.filter(m => allergies.some(a => m.name.toLowerCase().includes(a.toLowerCase())||a.toLowerCase().includes(m.name.toLowerCase().split(" ")[0])));
      const missing     = [];
      if (!selectedPatient) missing.push("No patient selected — allergy check skipped");
      if (data.text.length < 30) missing.push("Extracted text is very short — image quality may be low");
      if (data.medicines.length === 0) missing.push("No medicines detected — try a clearer image or use the Medicine Identifier below");
      const avgScore    = enriched.length > 0 ? Math.round(enriched.reduce((s,m)=>s+m.match_score,0)/enriched.length) : 0;
      const highlighted = highlightMedicinesInText(data.text, enriched);
      setResult({ ...data, medicines:enriched, conflictMeds, missing, avgScore, highlightedText:highlighted, patient });
    } catch(err) {
      setError(err.message||"Could not connect to backend.");
    } finally { setLoading(false); }
  }

  function reset() {
    setImageFile(null); setImagePreview(null); setResult(null); setError(null); setSelectedPatient("");
    if (fileRef.current) fileRef.current.value="";
  }

  const riskLabel = { HIGH:"🚨 High Risk", MEDIUM:"⚠️ Caution", SAFE:"✅ Safe" };

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-title">Prescription Analysis</div>
        <div className="page-desc">upload · ocr · detect · audit</div>
      </div>

      {/* Upload + Results */}
      <div className="analysis-layout">
        <div>
          <div className="card" style={{marginBottom:16}}>
            <div className="card-title"><span className="card-title-icon">📋</span>Patient Context</div>
            <div className="form-field">
              <label className="form-label">Select Patient</label>
              <select className="form-select" value={selectedPatient} onChange={e=>setSelectedPatient(e.target.value)}>
                <option value="">— Anonymous (no allergy check) —</option>
                {PATIENTS.map(p=>(
                  <option key={p.id} value={p.id}>{p.name} ({p.id}){p.allergies.length?` · ⚠️ ${p.allergies.join(", ")}`:""}</option>
                ))}
              </select>
            </div>
            {selectedPatient && (() => {
              const pt = PATIENTS.find(p=>p.id===selectedPatient);
              return pt && (
                <div style={{marginTop:10,padding:"10px 14px",background:"var(--surface-2)",borderRadius:"var(--r-sm)",fontSize:12}}>
                  <div style={{color:"var(--text-2)",marginBottom:4}}><strong style={{color:"var(--text)"}}>{pt.name}</strong> · {pt.age}y · {pt.blood}</div>
                  {pt.allergies.length>0&&<div style={{display:"flex",gap:6,flexWrap:"wrap"}}><span style={{color:"var(--text-3)"}}>Allergies:</span>{pt.allergies.map(a=><span key={a} className="allergy-tag">{a}</span>)}</div>}
                </div>
              );
            })()}
          </div>
          <div className="card">
            <div className="card-title"><span className="card-title-icon">🖼️</span>Prescription Image</div>
            <div className={`upload-zone ${drag?"drag":""} ${imagePreview?"has-img":""}`}
              onClick={()=>fileRef.current?.click()}
              onDragOver={e=>{e.preventDefault();setDrag(true);}}
              onDragLeave={()=>setDrag(false)}
              onDrop={e=>{e.preventDefault();setDrag(false);handleFile(e.dataTransfer.files[0]);}}>
              {imagePreview
                ? <img src={imagePreview} alt="Preview" className="preview-image"/>
                : <div className="upload-placeholder"><div className="upload-icon">📄</div><div className="upload-text">Drop image here or click to browse</div><div className="upload-sub">JPG / PNG · works best with printed text</div></div>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
            {imageFile&&<div style={{fontFamily:"var(--font-mono)",fontSize:11,color:"var(--text-3)",marginBottom:12}}>📎 {imageFile.name}</div>}
            <div className="btn-row">
              <button className="btn-primary" onClick={analyze} disabled={loading||!imageFile} style={{flex:1}}>
                {loading?<><span className="spinner"/>Analyzing…</>:"🔬 Run Analysis"}
              </button>
              <button className="btn-ghost" onClick={reset}>Reset</button>
            </div>
            {error&&<div className="error-msg">⛔ {error}</div>}
          </div>
        </div>

        <div>
          {!result&&!loading&&(
            <div className="card"><div className="empty-results"><div className="empty-icon">🩺</div><div style={{fontSize:14,color:"var(--text-2)",marginBottom:6}}>No analysis yet</div><div style={{fontSize:12,color:"var(--text-3)"}}>Upload a prescription and click Run Analysis</div><div style={{fontSize:11,color:"var(--text-3)",marginTop:8,fontFamily:"var(--font-mono)"}}>💡 Or use the Medicine Identifier below to manually check any medicine</div></div></div>
          )}
          {loading&&<div className="card"><div className="loading-pulse"><div className="pulse-ring"/><div style={{fontSize:13}}>Running OCR → Detecting → Checking allergies…</div></div></div>}
          {result&&(
            <>
              <div className={`result-risk-banner ${result.risk}`}>
                <div className="banner-icon">{result.risk==="HIGH"?"🚨":result.risk==="MEDIUM"?"⚠️":"✅"}</div>
                <div>
                  <div className="banner-risk">{riskLabel[result.risk]}</div>
                  <div className="banner-sub">{result.medicines.length} medicine(s) detected{result.patient?` · Patient: ${result.patient.name}`:" · No patient selected"}</div>
                </div>
                <div className="banner-score"><div className="score-value">{result.avgScore}%</div><div className="score-label">Confidence</div></div>
              </div>
              {result.missing.length>0&&(
                <div className="missing-box" style={{marginBottom:16}}>
                  <div className="missing-title">⚠️ Missing / Uncertain Information</div>
                  {result.missing.map((m,i)=><div key={i} className="missing-item"><span style={{color:"var(--amber)"}}>›</span> {m}</div>)}
                </div>
              )}
              <div className="card" style={{marginBottom:16}}>
                <div className="card-title"><span className="card-title-icon">💊</span>Detected Medicines<span style={{marginLeft:"auto",fontFamily:"var(--font-mono)",fontSize:11,color:"var(--text-3)"}}>{result.medicines.length} found</span></div>
                {result.medicines.length===0
                  ? <div style={{fontSize:13,color:"var(--text-3)",fontStyle:"italic"}}>No medicines detected. Use the Medicine Identifier below.</div>
                  : <>
                    <div className="medicine-highlight-list">
                      {result.medicines.map(m=>{
                        const isC=result.conflictMeds.some(c=>c.name===m.name);
                        return <div key={m.name} className={`med-chip ${isC?"conflict":m.risk_level||"LOW"}`}>{isC?"🚫":m.risk_level==="HIGH"?"🔴":m.risk_level==="MEDIUM"?"🟡":"🟢"}{m.name}<span className="med-chip-score">{m.match_score}%</span></div>;
                      })}
                    </div>
                    {result.medicines.map(m=>{
                      const isC=result.conflictMeds.some(c=>c.name===m.name);
                      return (
                        <div key={m.name} className={`med-detail-card ${isC?"conflict-card":""}`}>
                          <div className="med-detail-header">
                            <span className={`risk-pill ${isC?"HIGH":m.risk_level==="LOW"?"SAFE":m.risk_level}`}>{isC?"CONFLICT":m.risk_level}</span>
                            <span className="med-detail-name">{m.name}</span>
                            <span style={{fontFamily:"var(--font-mono)",fontSize:11,color:"var(--text-3)",marginLeft:"auto"}}>{m.category}</span>
                          </div>
                          <div className="med-detail-body"><strong>Uses:</strong> {m.common_uses} · <strong>Caution:</strong> {m.interactions}{isC&&<div style={{color:"var(--red)",marginTop:6,fontWeight:600}}>🚫 ALLERGY CONFLICT — do not prescribe without physician review</div>}</div>
                          <div className="med-confidence-bar"><div className="med-confidence-fill" style={{width:`${m.match_score}%`}}/></div>
                          <div className="med-confidence-label">OCR confidence: {m.match_score}%</div>
                          {(isC||m.risk_level==="HIGH")&&m.alternatives?.length>0&&(
                            <div style={{marginTop:10}}>
                              <div style={{fontSize:10,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:6}}>Suggested Alternatives</div>
                              <div className="alternatives-row">{m.alternatives.map(a=><div key={a} className="alt-chip">✦ {a}</div>)}</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                }
              </div>
              <div className="card" style={{marginBottom:16}}>
                <div className="card-title"><span className="card-title-icon">📝</span>Extracted Text (OCR)</div>
                <div className="extracted-text-box"><HighlightedText text={result.highlightedText} medicines={result.medicines} conflictNames={result.conflictMeds.map(c=>c.name)}/></div>
                <div style={{fontSize:10,color:"var(--text-3)",marginTop:6,fontFamily:"var(--font-mono)"}}>
                  <span style={{background:"var(--cyan-dim)",color:"var(--cyan)",padding:"1px 4px",borderRadius:3}}>highlighted</span> = detected &nbsp;
                  <span style={{background:"var(--red-dim)",color:"var(--red)",padding:"1px 4px",borderRadius:3}}>highlighted</span> = conflict
                </div>
              </div>
              <div className="explanation-section">
                <div className="card-title" style={{marginBottom:12}}><span className="card-title-icon">🔎</span>Detailed Explanation</div>
                <p className="explanation-text" style={{marginBottom:12}}>{result.reason}</p>
                {result.reasons?.map((r,i)=>{
                  const cls=r.includes("CONFLICT")||r.includes("HIGH")?"danger":r.includes("CAUTION")?"warn":"ok";
                  return <div key={i} className={`reason-item ${cls}`}>{r}</div>;
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Medicine Identifier + Draw to Identify ── */}
      <div className="card" style={{marginTop:28}}>
        {/* Tab switcher */}
        <div style={{display:"flex",gap:0,marginBottom:24,background:"var(--bg-3)",borderRadius:"var(--r-sm)",padding:4,width:"fit-content"}}>
          {[
            {id:"type", label:"💊 Type to Search"},
            {id:"draw", label:"✍️ Draw to Identify"},
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setIdentifierTab(tab.id)}
              style={{
                padding:"8px 18px", borderRadius:"var(--r-sm)", fontSize:13, fontWeight:600,
                border:"none", cursor:"pointer", transition:"all .15s",
                background: identifierTab===tab.id ? "var(--surface-2)" : "transparent",
                color: identifierTab===tab.id ? "var(--cyan)" : "var(--text-3)",
                boxShadow: identifierTab===tab.id ? "0 1px 4px rgba(0,0,0,0.3)" : "none",
              }}
            >{tab.label}</button>
          ))}
        </div>

        {identifierTab === "type"
          ? <MedicineCheckerSection selectedPatient={selectedPatient} />
          : <DrawToIdentify selectedPatient={selectedPatient} />
        }
      </div>
    </div>
  );
}
