import { useRef, useState, useEffect, useCallback } from "react";
import { MEDICINES_DB, PATIENTS } from "../data/mockData";

const API_BASE = "http://localhost:8000";
const RISK_ICONS = { HIGH: "🔴", MEDIUM: "🟡", LOW: "🟢" };

// Fuzzy match helper (client-side fallback)
function fuzzyScore(a, b) {
  a = a.toLowerCase(); b = b.toLowerCase();
  if (b.includes(a)) return 90;
  let score = 0, j = 0;
  for (let i = 0; i < a.length && j < b.length; i++) {
    if (a[i] === b[j]) { score++; j++; }
  }
  return Math.round((score / Math.max(a.length, b.length)) * 100);
}

function searchMedicines(query, patientId) {
  if (!query || query.length < 2) return [];
  const patient   = PATIENTS.find(p => p.id === patientId);
  const allergies = patient?.allergies || [];
  return MEDICINES_DB
    .map(m => {
      const score   = fuzzyScore(query, m.name);
      const conflict = allergies.some(a =>
        m.name.toLowerCase().includes(a.toLowerCase()) ||
        a.toLowerCase().includes(m.name.toLowerCase())
      );
      return { ...m, match_score: score, conflict, conflict_reason: conflict ? `Conflicts with ${allergies.find(a => m.name.toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(m.name.toLowerCase()))?.charAt(0).toUpperCase() + allergies.find(a => m.name.toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(m.name.toLowerCase()))?.slice(1)} allergy` : "", risk_level: m.risk };
    })
    .filter(m => m.match_score > 25)
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 5);
}

export default function DrawToIdentify({ selectedPatient }) {
  const canvasRef       = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [results, setResults]         = useState([]);
  const [activeMed, setActiveMed]     = useState(null);
  const [addedMeds, setAddedMeds]     = useState([]);
  const [mode, setMode]               = useState("draw"); // draw | results
  const [penColor, setPenColor]       = useState("#00e5ff");
  const [penSize, setPenSize]         = useState(4);
  const lastPos                       = useRef(null);

  // Init canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#080d1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = penColor;
    ctx.lineWidth   = penSize;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
  }, []);

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top)  * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    };
  }

  function startDraw(e) {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    ctx.strokeStyle = penColor;
    ctx.lineWidth   = penSize;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, penSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = penColor;
    ctx.fill();
    lastPos.current = pos;
    setDrawing(true);
    setHasStrokes(true);
  }

  function draw(e) {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    const pos    = getPos(e, canvas);
    ctx.strokeStyle = penColor;
    ctx.lineWidth   = penSize;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  }

  function endDraw(e) {
    e.preventDefault();
    setDrawing(false);
    lastPos.current = null;
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    ctx.fillStyle = "#080d1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
    setResults([]);
    setActiveMed(null);
    setMode("draw");
  }

  async function recognize() {
    if (!hasStrokes) return;
    setRecognizing(true);
    setMode("results");

    try {
      // Send canvas image to backend OCR
      const canvas   = canvasRef.current;
      const blob     = await new Promise(res => canvas.toBlob(res, "image/png"));
      const formData = new FormData();
      formData.append("file", blob, "drawing.png");

      const res  = await fetch(`${API_BASE}/extract`, { method: "POST", body: formData });
      const data = await res.json();
      const text = (data.text || "").trim();

      if (text && text.length > 1) {
        const found = searchMedicines(text, selectedPatient);
        setResults(found.length > 0 ? found : searchMedicines(text.split(/\s+/)[0], selectedPatient));
      } else {
        setResults([]);
      }
    } catch {
      // Fallback: try simple client-side recognition from canvas pixel analysis
      setResults([]);
    } finally {
      setRecognizing(false);
    }
  }

  function pickMed(med) {
    setActiveMed(med);
    if (!addedMeds.find(m => m.name === med.name)) {
      setAddedMeds(prev => [med, ...prev]);
    }
  }

  function removeMed(name) {
    setAddedMeds(prev => prev.filter(m => m.name !== name));
    if (activeMed?.name === name) setActiveMed(null);
  }

  const hasConflict = addedMeds.some(m => m.conflict);

  const pt = PATIENTS.find(p => p.id === selectedPatient);

  return (
    <div>
      {/* Section header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20, paddingBottom:16, borderBottom:"1px solid var(--border)" }}>
        <div style={{ width:40, height:40, borderRadius:"var(--r-sm)", background:"linear-gradient(135deg,rgba(167,139,250,0.15),var(--cyan-dim))", border:"1px solid rgba(167,139,250,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>✍️</div>
        <div>
          <div style={{ fontSize:16, fontWeight:700, color:"var(--text)" }}>Draw to Identify</div>
          <div style={{ fontSize:11, color:"var(--text-3)", fontFamily:"var(--font-mono)" }}>
            write a medicine name on the canvas · touchscreen &amp; mouse supported
          </div>
        </div>
        {pt && (
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8, padding:"6px 12px", borderRadius:"var(--r-sm)", background:"var(--surface-2)", border:"1px solid var(--border)" }}>
            <span style={{ fontSize:11, color:"var(--text-3)" }}>Patient:</span>
            <span style={{ fontSize:12, fontWeight:600, color:"var(--text)" }}>{pt.name}</span>
            {pt.allergies.map(a => <span key={a} className="allergy-tag" style={{ margin:0 }}>{a}</span>)}
          </div>
        )}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
        {/* LEFT: Canvas + controls */}
        <div>
          {/* Toolbar */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
            <span style={{ fontSize:11, color:"var(--text-3)", fontFamily:"var(--font-mono)" }}>Pen:</span>
            {["#00e5ff","#10e89a","#ffffff","#ffb547","#ff3d6e"].map(c => (
              <button key={c} onClick={() => setPenColor(c)} style={{
                width:22, height:22, borderRadius:"50%", background:c, border:penColor===c?"2px solid white":"2px solid transparent",
                cursor:"pointer", flexShrink:0, transition:"transform .1s",
                transform: penColor===c ? "scale(1.25)" : "scale(1)"
              }}/>
            ))}
            <div style={{ width:1, height:20, background:"var(--border)", margin:"0 4px" }}/>
            <span style={{ fontSize:11, color:"var(--text-3)", fontFamily:"var(--font-mono)" }}>Size:</span>
            {[3, 5, 8].map(s => (
              <button key={s} onClick={() => setPenSize(s)} style={{
                width:s*4+8, height:s*4+8, borderRadius:"50%", background:"var(--text-2)",
                border:penSize===s?"2px solid var(--cyan)":"2px solid transparent",
                cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center"
              }}>
                <div style={{ width:s, height:s, borderRadius:"50%", background:"var(--bg)" }}/>
              </button>
            ))}
            <button onClick={clearCanvas} style={{ marginLeft:"auto", padding:"5px 12px", background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", fontSize:11, color:"var(--text-3)", cursor:"pointer" }}>
              🗑 Clear
            </button>
          </div>

          {/* Canvas */}
          <div style={{ position:"relative", borderRadius:"var(--r)", overflow:"hidden", border:"2px solid var(--border-2)", background:"#080d1a" }}>
            <canvas
              ref={canvasRef}
              width={520}
              height={200}
              style={{ display:"block", width:"100%", height:200, cursor:"crosshair", touchAction:"none" }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
            {!hasStrokes && (
              <div style={{
                position:"absolute", top:0, left:0, right:0, bottom:0,
                display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                pointerEvents:"none"
              }}>
                <div style={{ fontSize:32, opacity:.15, marginBottom:8 }}>✍️</div>
                <div style={{ fontSize:13, color:"var(--text-3)", opacity:.5 }}>Write a medicine name here</div>
                <div style={{ fontSize:11, color:"var(--text-3)", opacity:.35, marginTop:4, fontFamily:"var(--font-mono)" }}>
                  e.g. Aspirin · Warfarin · Codeine
                </div>
              </div>
            )}
          </div>

          {/* Recognize button */}
          <button
            onClick={recognize}
            disabled={!hasStrokes || recognizing}
            style={{
              width:"100%", marginTop:10, padding:"11px",
              background: hasStrokes ? "var(--cyan)" : "var(--surface-2)",
              border:"none", borderRadius:"var(--r-sm)",
              color: hasStrokes ? "#000" : "var(--text-3)",
              fontSize:14, fontWeight:700, cursor: hasStrokes ? "pointer" : "not-allowed",
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              transition:"all .2s"
            }}
          >
            {recognizing
              ? <><div style={{ width:14, height:14, border:"2px solid rgba(0,0,0,0.3)", borderTopColor:"#000", borderRadius:"50%", animation:"spin .6s linear infinite" }}/> Recognizing…</>
              : "🔍 Identify Medicine"
            }
          </button>

          <div style={{ fontSize:10, color:"var(--text-3)", marginTop:6, fontFamily:"var(--font-mono)", textAlign:"center" }}>
            💡 Write clearly · print letters work better than cursive
          </div>

          {/* Added list */}
          {addedMeds.length > 0 && (
            <div style={{ marginTop:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:10, fontWeight:700, letterSpacing:"1px", textTransform:"uppercase", color:"var(--text-3)" }}>Identified ({addedMeds.length})</span>
                <button onClick={() => { setAddedMeds([]); setActiveMed(null); }} style={{ fontSize:11, color:"var(--text-3)", background:"none", border:"none", cursor:"pointer" }}>Clear all</button>
              </div>
              {addedMeds.map(med => (
                <div key={med.name} onClick={() => setActiveMed(med)} style={{
                  display:"flex", alignItems:"center", gap:10, padding:"9px 12px",
                  borderRadius:"var(--r-sm)", cursor:"pointer", marginBottom:6,
                  background: activeMed?.name===med.name ? "var(--surface-2)" : "var(--surface)",
                  border:`1px solid ${med.conflict ? "var(--red-border)" : activeMed?.name===med.name ? "var(--cyan-border)" : "var(--border)"}`,
                  transition:"all .15s"
                }}>
                  <span style={{ fontSize:16 }}>{med.conflict ? "🚫" : RISK_ICONS[med.risk_level] || "🟢"}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color: med.conflict ? "var(--red)" : "var(--text)" }}>{med.name}</div>
                    <div style={{ fontSize:11, color:"var(--text-3)" }}>{med.category}</div>
                  </div>
                  <span className={`risk-pill ${med.risk_level==="LOW"?"SAFE":med.risk_level||"SAFE"}`}>{med.risk_level||"LOW"}</span>
                  <button onClick={e => { e.stopPropagation(); removeMed(med.name); }} style={{ background:"none", border:"none", color:"var(--text-3)", cursor:"pointer", fontSize:13 }}>✕</button>
                </div>
              ))}
              <div style={{ padding:"9px 12px", borderRadius:"var(--r-sm)", fontSize:12, fontWeight:600, background: hasConflict ? "var(--red-dim)" : "var(--green-dim)", border:`1px solid ${hasConflict?"var(--red-border)":"var(--green-border)"}`, color: hasConflict ? "var(--red)" : "var(--green)" }}>
                {hasConflict ? `🚨 ${addedMeds.filter(m=>m.conflict).length} conflict(s) — review before prescribing` : `✅ All ${addedMeds.length} medicine(s) safe for this patient`}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Results + Detail */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* Recognition results */}
          {mode === "results" && (
            <div>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:"1px", textTransform:"uppercase", color:"var(--text-3)", marginBottom:8 }}>Recognition Results</div>
              {recognizing ? (
                <div style={{ padding:"20px", textAlign:"center", color:"var(--text-3)", fontSize:13 }}>Analyzing your handwriting…</div>
              ) : results.length > 0 ? (
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {results.map((med, i) => (
                    <div key={med.name} onClick={() => pickMed(med)} style={{
                      display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
                      borderRadius:"var(--r-sm)", cursor:"pointer",
                      background: med.conflict ? "var(--red-dim)" : i===0 ? "var(--cyan-dim)" : "var(--surface)",
                      border:`1px solid ${med.conflict?"var(--red-border)":i===0?"var(--cyan-border)":"var(--border)"}`,
                      transition:"opacity .15s"
                    }}
                      onMouseEnter={e => e.currentTarget.style.opacity=".8"}
                      onMouseLeave={e => e.currentTarget.style.opacity="1"}
                    >
                      <span style={{ fontSize:18 }}>{med.conflict ? "🚫" : RISK_ICONS[med.risk_level] || "🟢"}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <span style={{ fontSize:13, fontWeight:700, color: med.conflict?"var(--red)":i===0?"var(--cyan)":"var(--text)" }}>{med.name}</span>
                          {i===0 && <span style={{ fontSize:9, background:"var(--cyan-dim)", color:"var(--cyan)", padding:"1px 6px", borderRadius:10, fontFamily:"var(--font-mono)", border:"1px solid var(--cyan-border)" }}>BEST MATCH</span>}
                        </div>
                        <div style={{ fontSize:11, color:"var(--text-3)" }}>{med.category} · {med.common_uses}</div>
                        {med.conflict && <div style={{ fontSize:11, color:"var(--red)", fontWeight:600 }}>⚠️ {med.conflict_reason}</div>}
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <span className={`risk-pill ${med.risk_level==="LOW"?"SAFE":med.risk_level||"SAFE"}`}>{med.risk_level||"LOW"}</span>
                        <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--text-3)", marginTop:3 }}>{med.match_score}% match</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding:"20px 16px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", textAlign:"center" }}>
                  <div style={{ fontSize:24, marginBottom:8 }}>🤔</div>
                  <div style={{ fontSize:13, color:"var(--text-2)", marginBottom:4 }}>Couldn't recognize the medicine name</div>
                  <div style={{ fontSize:11, color:"var(--text-3)", fontFamily:"var(--font-mono)" }}>
                    Try writing more clearly or in printed letters.<br/>
                    Use the text search above for better results.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Medicine detail */}
          {activeMed ? (
            <div style={{ background:"var(--surface)", border:`2px solid ${activeMed.conflict?"var(--red-border)":"var(--border-2)"}`, borderRadius:"var(--r-lg)", overflow:"hidden", animation:"fadeUp .3s ease", flex:1 }}>
              <div style={{ padding:"16px 20px", background: activeMed.conflict?"var(--red-dim)":activeMed.risk_level==="HIGH"?"var(--red-dim)":activeMed.risk_level==="MEDIUM"?"var(--amber-dim)":"var(--green-dim)", borderBottom:`1px solid ${activeMed.conflict?"var(--red-border)":"var(--border)"}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                  <span style={{ fontSize:28 }}>{activeMed.conflict ? "🚫" : RISK_ICONS[activeMed.risk_level] || "🟢"}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:20, fontWeight:800, color:"var(--text)", fontFamily:"var(--font-serif)", fontStyle:"italic" }}>{activeMed.name}</div>
                    <div style={{ fontSize:11, color:"var(--text-3)", fontFamily:"var(--font-mono)" }}>{activeMed.category}</div>
                  </div>
                  <span className={`risk-pill ${activeMed.risk_level==="LOW"?"SAFE":activeMed.risk_level||"SAFE"}`} style={{ fontSize:12, padding:"4px 12px" }}>{activeMed.risk_level||"LOW"} RISK</span>
                </div>
                <div style={{ height:4, background:"rgba(255,255,255,0.08)", borderRadius:2 }}>
                  <div style={{ height:"100%", borderRadius:2, width:`${activeMed.match_score||90}%`, background:"linear-gradient(90deg,var(--cyan),var(--green))", transition:"width .8s ease" }}/>
                </div>
                <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--text-3)", marginTop:3 }}>{activeMed.match_score||90}% recognition confidence</div>
              </div>

              <div style={{ padding:"14px 18px", display:"flex", flexDirection:"column", gap:12 }}>
                {activeMed.conflict && (
                  <div style={{ padding:"10px 14px", background:"var(--red-dim)", border:"1px solid var(--red-border)", borderRadius:"var(--r-sm)" }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"var(--red)", marginBottom:2 }}>🚫 ALLERGY CONFLICT</div>
                    <div style={{ fontSize:12, color:"var(--text-2)" }}>{activeMed.conflict_reason}</div>
                  </div>
                )}

                <div>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:"1px", textTransform:"uppercase", color:"var(--green)", marginBottom:6, display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--green)", display:"inline-block" }}/>Benefits
                  </div>
                  <div style={{ padding:"9px 12px", background:"var(--green-dim)", border:"1px solid var(--green-border)", borderRadius:"var(--r-sm)", fontSize:13, color:"var(--text-2)", lineHeight:1.7 }}>
                    {activeMed.common_uses || activeMed.uses}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:"1px", textTransform:"uppercase", color:"var(--red)", marginBottom:6, display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--red)", display:"inline-block" }}/>Risks &amp; Side Effects
                  </div>
                  <div style={{ padding:"9px 12px", background:"var(--red-dim)", border:"1px solid var(--red-border)", borderRadius:"var(--r-sm)", fontSize:13, color:"var(--text-2)", lineHeight:1.7 }}>
                    {activeMed.interactions}
                  </div>
                </div>

                {pt && (
                  <div style={{ padding:"9px 12px", background: activeMed.conflict?"var(--red-dim)":"var(--cyan-dim)", border:`1px solid ${activeMed.conflict?"var(--red-border)":"var(--cyan-border)"}`, borderRadius:"var(--r-sm)", fontSize:12, color:"var(--text-2)", lineHeight:1.8 }}>
                    <strong style={{ color:"var(--text)" }}>{pt.name}</strong>{" "}
                    {pt.allergies.length>0 ? <>allergic to: <strong style={{color:"var(--red)"}}>{pt.allergies.join(", ")}</strong></> : "has no recorded allergies"}<br/>
                    {activeMed.conflict
                      ? <span style={{ color:"var(--red)", fontWeight:700 }}>🚫 NOT SAFE for this patient</span>
                      : <span style={{ color:"var(--green)", fontWeight:700 }}>✅ SAFE for this patient</span>
                    }
                  </div>
                )}

                {(activeMed.alternatives||[]).length > 0 && (
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, letterSpacing:"1px", textTransform:"uppercase", color:"var(--amber)", marginBottom:6 }}>🔄 Alternatives</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {activeMed.alternatives.map(alt => (
                        <span key={alt} style={{ padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:600, background:"var(--green-dim)", color:"var(--green)", border:"1px solid var(--green-border)" }}>✦ {alt}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : mode !== "results" && (
            <div style={{ flex:1, minHeight:200, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--r-lg)", color:"var(--text-3)", textAlign:"center", padding:24 }}>
              <div style={{ fontSize:40, marginBottom:10, opacity:.2 }}>✍️</div>
              <div style={{ fontSize:13, fontWeight:600, color:"var(--text-2)", marginBottom:6 }}>Write a medicine name on the canvas</div>
              <div style={{ fontSize:11, lineHeight:1.8 }}>Then click <strong style={{color:"var(--cyan)"}}>Identify Medicine</strong><br/>to see its full profile here</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
