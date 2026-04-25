import { useState, useRef, useEffect } from "react";
import { CHATBOT_RULES } from "../data/mockData";

function getBotResponse(input) {
  const lower = input.toLowerCase().trim();
  for (const rule of CHATBOT_RULES) {
    if (rule.patterns.some(p => lower.includes(p))) {
      return rule.response;
    }
  }
  // Fallback: check if it's a medicine name
  const medMatch = lower.match(/what is (.+)/);
  if (medMatch) {
    return `I don't have specific information about "${medMatch[1]}" in my database. Please consult a licensed pharmacist or physician for details about this medicine.`;
  }
  return `I'm not sure about that. Try asking about specific medicines (e.g., "What is Warfarin?"), risk levels, or type "help" to see what I can do.`;
}

const QUICK_PROMPTS = [
  "What is Warfarin?",
  "What is Amoxicillin?",
  "What does HIGH RISK mean?",
  "What is a Penicillin allergy?",
  "How does OCR work?",
  "What is Ibuprofen?",
  "What are alternatives to Codeine?",
  "Help",
];

function formatMessage(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n•/g, '<br>•')
    .replace(/\n/g, '<br>');
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hello! I'm **MediSafe AI Assistant** 🩺\n\nI can help you look up medicine information, explain allergy risks, and clarify risk levels.\n\nTry asking: *\"What is Warfarin?\"* or type **help** to see all options.",
      time: new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})
    }
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  function sendMessage(text) {
    const userText = text || input.trim();
    if (!userText) return;
    const time = new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});

    setMessages(prev => [...prev, { role: "user", text: userText, time }]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const response = getBotResponse(userText);
      setTyping(false);
      setMessages(prev => [...prev, {
        role: "bot",
        text: response,
        time: new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})
      }]);
    }, 800 + Math.random() * 600);
  }

  return (
    <div className="page-content" style={{paddingBottom:0}}>
      <div className="page-header">
        <div className="page-title">AI Assistant</div>
        <div className="page-desc">rule-based clinical knowledge · always verify with a physician</div>
      </div>

      <div className="chat-layout">
        {/* Chat */}
        <div className="chat-container">
          {/* Status bar */}
          <div style={{
            display:"flex",alignItems:"center",gap:8,padding:"10px 16px",
            borderBottom:"1px solid var(--border)",background:"var(--surface-2)"
          }}>
            <div style={{width:8,height:8,borderRadius:"50%",background:"var(--green)",boxShadow:"0 0 8px var(--green)"}}/>
            <span style={{fontSize:12,fontWeight:600,color:"var(--text)"}}>MediSafe Assistant</span>
            <span style={{fontFamily:"var(--font-mono)",fontSize:10,color:"var(--text-3)",marginLeft:4}}>online · rule-based AI</span>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`msg ${msg.role}`}>
                <div className="msg-avatar">
                  {msg.role === "bot" ? "🩺" : "👤"}
                </div>
                <div>
                  <div
                    className="msg-bubble"
                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }}
                  />
                  <div className="msg-time">{msg.time}</div>
                </div>
              </div>
            ))}

            {typing && (
              <div className="msg bot">
                <div className="msg-avatar">🩺</div>
                <div>
                  <div className="msg-bubble">
                    <div className="typing-dots">
                      <span/><span/><span/>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="chat-input-row">
            <input
              className="chat-input"
              placeholder="Ask about a medicine, allergy, or risk level..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
            />
            <button className="chat-send" onClick={() => sendMessage()}>Send</button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="chat-sidebar">
          <div className="card">
            <div className="card-title"><span className="card-title-icon">⚡</span>Quick Questions</div>
            {QUICK_PROMPTS.map(q => (
              <button key={q} className="quick-chip" onClick={() => sendMessage(q)}>
                {q}
              </button>
            ))}
          </div>

          <div className="card">
            <div className="card-title"><span className="card-title-icon">ℹ️</span>About</div>
            <div style={{fontSize:12,color:"var(--text-2)",lineHeight:1.7}}>
              This assistant uses <strong style={{color:"var(--text)"}}>rule-based logic</strong> to answer questions about medicines in the MediSafe database.
              <br/><br/>
              It is <strong style={{color:"var(--red)"}}>not a substitute</strong> for professional medical advice.
              <br/><br/>
              Always verify information with a licensed pharmacist or physician.
            </div>
          </div>

          <div className="card" style={{background:"var(--cyan-dim)",border:"1px solid var(--cyan-border)"}}>
            <div className="card-title" style={{color:"var(--cyan)"}}>
              <span className="card-title-icon">🔬</span>Coverage
            </div>
            <div style={{fontSize:12,color:"var(--text-2)",lineHeight:1.7}}>
              Knowledge base covers <strong style={{color:"var(--text)"}}>20 medicines</strong> including antibiotics, NSAIDs, anticoagulants, antidiabetics, and more.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
