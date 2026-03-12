import { useState, useEffect } from "react";
import { useGoogleCalendar } from "./useGoogleCalendar";
import logo from './logo.jpg';
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { auth, db } from "./firebase";
import profilePic from './profile.png'; // Make sure the filename matches your actual file




/* ── Firebase (imported from central firebase.js) ── */

/* ── Fonts ── */
const fl = document.createElement("link");
fl.rel = "stylesheet";
fl.href = "https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800;900&display=swap";
document.head.appendChild(fl);

const css = document.createElement("style");
css.textContent = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Nunito', sans-serif; }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
  @keyframes slideUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes pop { 0%{transform:scale(0.85);opacity:0} 100%{transform:scale(1);opacity:1} }
  @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
  @keyframes twinkle { 0%,100%{opacity:0.12} 50%{opacity:0.5} }
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  html { scroll-behavior: smooth; }
`;
document.head.appendChild(css);

/* ── Theme ── */
const T = {
  yellow:"#FFD93D", orange:"#FF6B35", teal:"#0ABFBC",
  navy:"#1A1A5E", pink:"#FF1493", green:"#4CAF82",
  purple:"#7B5EA7", bg:"#FFFBF0", white:"#FFFFFF",
};

/* ── Credentials ── */
const TUTOR = { email:"tutor@dibsonai.com", password:"teach123" };
// Students are now stored in Firebase Firestore — no hardcoded passwords!

const CAL = {
  11:[{time:"4:00 PM",student:"Aanya S.",topic:"Neural Networks",color:T.teal}],
  12:[{time:"2:00 PM",student:"Leo M.",topic:"React Hooks",color:T.pink},{time:"5:30 PM",student:"Priya N.",topic:"LLM Fine-tuning",color:T.orange}],
  14:[{time:"11:00 AM",student:"Priya N.",topic:"Prompt Engineering",color:T.orange}],
  15:[{time:"5:00 PM",student:"Sam O.",topic:"Async JS",color:T.purple}],
  16:[{time:"3:00 PM",student:"Yuki T.",topic:"Pandas & Viz",color:T.green}],
};

/* ════════════ SHARED UI ════════════ */
function Av({ i, color, size=40 }) {
  return <div style={{ width:size, height:size, borderRadius:"50%", background:`linear-gradient(135deg,${color},${color}88)`, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:800, fontSize:size*.32, fontFamily:"'Fredoka One',cursive", flexShrink:0, boxShadow:`0 2px 10px ${color}44` }}>{i}</div>;
}

function PBar({ value, color, h=8 }) {
  return <div style={{ background:"#F0EDFF", borderRadius:99, height:h, overflow:"hidden" }}><div style={{ width:`${value}%`, height:"100%", borderRadius:99, background:`linear-gradient(90deg,${color},${color}99)`, transition:"width .6s ease" }}/></div>;
}

function Inp({ label, type="text", value, onChange, placeholder, icon }) {
  const [f,setF] = useState(false);
  return (
    <div style={{ marginBottom:16 }}>
      {label && <div style={{ fontWeight:700, fontSize:13, color:T.navy, marginBottom:6 }}>{label}</div>}
      <div style={{ position:"relative" }}>
        {icon && <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:16 }}>{icon}</span>}
        <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
          onFocus={()=>setF(true)} onBlur={()=>setF(false)}
          style={{ width:"100%", padding:`13px 16px 13px ${icon?"44px":"16px"}`, borderRadius:14, border:`2px solid ${f?T.teal:"#E0E0F0"}`, fontSize:15, color:T.navy, outline:"none", background:T.white, transition:"border .2s", fontFamily:"'Nunito',sans-serif" }}
        />
      </div>
    </div>
  );
}

function Btn({ children, onClick, color=T.orange, outline=false, full=false, small=false, style:sx={} }) {
  const [h,setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ width:full?"100%":"auto", padding:small?"8px 18px":"13px 26px", borderRadius:99, border:outline?`2.5px solid ${color}`:"none", background:outline?"transparent":`linear-gradient(135deg,${color},${color}cc)`, color:outline?color:"white", fontWeight:800, fontSize:small?13:15, cursor:"pointer", fontFamily:"'Fredoka One',cursive", letterSpacing:.3, boxShadow:outline?"none":`0 4px 16px ${color}44`, transform:h?"translateY(-2px)":"none", transition:"all .2s", ...sx }}>
      {children}
    </button>
  );
}

/* ════════════ NAV ════════════ */
function Nav({ screen, setScreen, session, onLogout }) {
  const [scrolled, setScrolled] = useState(false);
  const isHome = screen === "home";

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav style={{
      position:"fixed", top:0, left:0, right:0, zIndex:1000,
      //background: scrolled || !isHome ? "rgba(255,251,240,0.97)" : "transparent",
      backdropFilter: scrolled || !isHome ? "blur(14px)" : "none",
      borderBottom: scrolled || !isHome ? `3px solid ${T.yellow}` : "none",
      padding:"14px 40px", display:"flex", alignItems:"center", justifyContent:"space-between",
      transition:"all .3s",
    }}>
{/* Logo */}
{/* Logo & Two-Line Brand Name */}
<div onClick={() => { onLogout(); setScreen("home"); }} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
  
  {/* Your Logo Image */}
  <img src={logo} alt="DibsOnAI Logo" style={{ height: 55, width: "auto" }} /> 

  {/* Text Container: Stacks Brand and Tagline vertically */}
  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
    
    {/* Line 1: Main Brand Name */}
    <span style={{ 
      fontFamily: "'Fredoka One', cursive", 
      fontSize: 25, 
      color: "#FFFFFF", 
      lineHeight: "1.5" 
    }}>
      Dibs<span style={{ color: "#9D00FF" }}>On</span>AI
    </span>

    {/* Line 2: Tagline */}
    <span style={{ 
      fontSize: 15, 
      fontWeight: 800, 
      color: "#FF1493", // Hot Pink/Fuchsia
      letterSpacing: "0.8px",
      marginTop: 1,
      textTransform: "uppercase"
    }}>
      CODE CREATE CONQUER
    </span>
    
  </div>
</div>

{/* Center links — only on homepage */}
{/* Center links — only on homepage */}
{isHome && (
  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
    {["courses", "about", "contact"].map(s => (
      <a 
        key={s} 
        href={`#${s}`} 
        style={{ 
          padding: "8px 20px", 
          borderRadius: 99, 
          fontSize: 15, 
          fontWeight: 700, 
          color: "#FFFFFF", 
          background: "rgba(255, 255, 255, 0.1)", // Subtle background so they are visible
          textDecoration: "none", 
          textTransform: "capitalize", 
          transition: "all 0.3s ease", // Smooth transition like the other buttons
          border: "1px solid rgba(255, 255, 255, 0.2)"
        }}
        onMouseEnter={e => {
          e.target.style.background = T.yellow; // Changes to Yellow on hover
          e.target.style.color = T.navy;       // Text changes to Navy for readability
          e.target.style.transform = "scale(1.05)"; // Slight "pop" effect
        }}
        onMouseLeave={e => {
          e.target.style.background = "rgba(255, 255, 255, 0.1)"; // Back to subtle white
          e.target.style.color = "#FFFFFF";
          e.target.style.transform = "scale(1)";
        }}
      >
        {s}
      </a>
    ))}
  </div>
)}



      {/* Right — portal buttons OR logout */}
      <div style={{ display:"flex", gap:10, alignItems:"center" }}>
        {session ? (
          <>
            <span style={{ fontWeight:700, fontSize:13, color:T.navy }}>
              {session.role==="tutor" ? "🧑‍🏫 Tutor" : `🧒 ${session.student.name}`}
            </span>
            <Btn onClick={onLogout} color={T.navy} small>Sign Out</Btn>
          </>
        ) : (
          <>
            <Btn onClick={() => setScreen("student-login")} color={T.teal} outline small>Student Login 🧒</Btn>
            <Btn onClick={() => setScreen("tutor-login")}   color={"#9D00FF"} small>Tutor Login 🧑‍🏫</Btn>
          </>
        )}
      </div>
    </nav>
  );
}

/* ════════════ HOMEPAGE ════════════ */
function Homepage({ setScreen }) {
  return (
    <div style={{ background:T.bg }}>
      {/* HERO */}
      <section id="home" style={{ minHeight:"100vh", background:T.navy, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden", paddingTop:80 }}>
        {[["-10%","5%",300,T.teal,"0s"],["55%","82%",380,T.pink,"2s"],["75%","15%",260,T.yellow,"1s"]].map(([top,left,size,col,delay],i)=>(
          <div key={i} style={{ position:"absolute",top,left,width:size,height:size,borderRadius:"50%",background:col,opacity:.13,filter:"blur(50px)",animation:`float 7s ease-in-out ${delay} infinite`,pointerEvents:"none" }}/>
        ))}
        {[...Array(18)].map((_,i)=>(
          <div key={i} style={{ position:"absolute",top:`${10+Math.random()*80}%`,left:`${Math.random()*100}%`,fontSize:`${10+Math.random()*12}px`,opacity:.2,animation:`twinkle ${2+Math.random()*3}s ease-in-out ${Math.random()*2}s infinite`,pointerEvents:"none" }}>✦</div>
        ))}

        <div style={{ textAlign:"center", position:"relative", zIndex:1, padding:"0 24px", maxWidth:820, animation:"slideUp .7s ease both" }}>
          <div style={{ display:"flex", justifyContent:"center", gap:16, marginBottom:22, fontSize:36 }}>
            {["🤖","💻","🧠","✨","🚀"].map((e,i)=>(
              <span key={i} style={{ display:"inline-block", animation:`float 3s ease-in-out ${i*.4}s infinite` }}>{e}</span>
            ))}
          </div>
          <h1 style={{ fontFamily:"'Fredoka One',cursive", fontSize:"clamp(46px,8vw,86px)", color:T.white, lineHeight:1.1, marginBottom:16 }}>
            Learn <span style={{ color:T.yellow }}>Coding</span> &<br/>
            <span style={{ color:T.teal }}>AI</span> — The Fun Way!
          </h1>
          <p style={{ color:"rgba(255,255,255,.72)", fontSize:20, maxWidth:540, margin:"0 auto 36px", fontWeight:600, lineHeight:1.6 }}>
            Kids aged 6–17 discover the magic of AI & programming through live 1-on-1 sessions that feel like play! 🎮
          </p>
          <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
            <a href="#contact">
              <Btn color={T.yellow} style={{ color:T.navy, fontSize:18 }}>Book a Free Trial 🎯</Btn>
            </a>
            <Btn onClick={()=>setScreen("student-login")} color={T.white} outline style={{ color:T.white, borderColor:"rgba(255,255,255,.4)", fontSize:18 }}>Student Login 🔑</Btn>
          </div>
          <div style={{ display:"flex", gap:32, justifyContent:"center", marginTop:52, flexWrap:"wrap" }}>
            {[["50+","Happy Kids"],["4.9★","Rating"],["100%","Fun Guaranteed"]].map(([num,label])=>(
              <div key={label} style={{ textAlign:"center" }}>
                <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:30, color:T.yellow }}>{num}</div>
                <div style={{ color:"rgba(255,255,255,.55)", fontSize:13, fontWeight:600 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position:"absolute", bottom:-2, left:0, right:0 }}>
          <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg"><path fill={T.bg} d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z"/></svg>
        </div>
      </section>

      {/* SERVICES */}
      <section id="courses" style={{ background:"#FF1493", padding:"100px 40px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:56 }}>
            <div style={{ display:"inline-block", background:T.yellow, color:T.navy, fontFamily:"'Fredoka One',cursive", padding:"6px 20px", borderRadius:99, fontSize:14, marginBottom:14 }}>What We Teach</div>
            <h2 style={{ fontFamily:"'Fredoka One',cursive", fontSize:"clamp(30px,5vw,50px)", color:T.navy }}>Courses Kids <span style={{ color:T.teal }}>Love</span> 🎉</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:22 }}>
            {[
              {icon:"🧱",title:"Logic Legends",desc:"Build games, animations & stories.. Focuses on the brain of coding",color:T.teal,age:"Age 6+"},
	      {icon:"🐍",title:"Code Commanders",desc:"Master the language of the future! Build your own gravity-defying games and interactive stories, with Python.",color:T.yellow,age:"Age 8+"},
              {icon:"🤖",title:"AI Adventures",desc:"Train your own AI model, talk to chatbots, and explore machine learning!",color:T.orange,age:"Age 8+"},
              {icon:"🌐",title:"Web Magic",desc:"Create your own website with HTML, CSS and JavaScript from scratch.",color:T.green,age:"Age 10+"},
              {icon:"🧠",title:"Prompt Engineering",desc:"Learn to talk to AI like a pro — craft prompts, build AI tools, go viral!",color:T.purple,age:"Age 12+"},
		{icon:"🎮",title:"Gamifiers",desc:"Indulge yourself into world of Roblox. & much more",color:T.yellow,age:"Age 12+"},
            ].map((c,i)=>(
              <div key={i} style={{ background:T.white, borderRadius:24, padding:26, boxShadow:"0 4px 22px rgba(0,0,0,0.06)", borderBottom:`5px solid ${c.color}`, transition:"transform .2s, box-shadow .2s", cursor:"default" }}
                onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-8px)"; e.currentTarget.style.boxShadow=`0 12px 32px ${c.color}33`; }}
                onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 4px 22px rgba(0,0,0,0.06)"; }}
              >
                <div style={{ fontSize:46, marginBottom:12, display:"inline-block", animation:`float 4s ease-in-out ${i*.5}s infinite` }}>{c.icon}</div>
                <div style={{ background:`${c.color}18`, color:c.color, fontSize:11, fontWeight:800, padding:"3px 12px", borderRadius:99, display:"inline-block", marginBottom:10 }}>{c.age}</div>
                <h3 style={{ fontFamily:"'Fredoka One',cursive", fontSize:21, color:T.navy, marginBottom:8 }}>{c.title}</h3>
                <p style={{ color:"#666", fontSize:14, lineHeight:1.6 }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" style={{ background:T.purple, padding:"100px 40px" }}>
        <div style={{ maxWidth:1000, margin:"0 auto", display:"flex", gap:56, alignItems:"center", flexWrap:"wrap" }}>
          <div style={{ flex:"0 0 300px", position:"relative" }}>
            <div style={{ width:270, height:270, borderRadius:"40% 60% 60% 40% / 50% 40% 60% 50%", background:`linear-gradient(135deg,${T.teal},${T.navy})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:96, boxShadow:`0 20px 60px ${T.teal}44`, animation:"float 5s ease-in-out infinite" }}><div style={{ width:270, height:270, borderRadius:"40% 60% 60% 40% / 50% 40% 60% 50%", background:`linear-gradient(135deg,${T.teal},${T.navy})`, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", boxShadow:`0 20px 60px ${T.teal}44`, animation:"float 5s ease-in-out infinite" }}>
  <img 
    src={profilePic} 
    alt="Tutor" 
    style={{ width: "100%", height: "100%", objectFit: "cover" }} 
  />
</div></div>
            {[{top:-18,right:-8,emoji:"🏆",label:"Top Tutor",color:T.yellow},{bottom:-8,right:28,emoji:"⭐",label:"4.9 Stars",color:T.pink},{top:"48%",left:-28,emoji:"🎓",label:"Certified",color:T.green}].map((b,i)=>(
              <div key={i} style={{ position:"absolute",top:b.top,bottom:b.bottom,left:b.left,right:b.right, background:T.white, borderRadius:14, padding:"9px 13px", display:"flex", alignItems:"center", gap:7, boxShadow:"0 4px 18px rgba(0,0,0,0.12)", border:`3px solid ${b.color}`, fontWeight:800, fontSize:13, color:T.navy, animation:`float 4s ease-in-out ${i}s infinite`, zIndex:2, whiteSpace:"nowrap" }}>
                <span style={{ fontSize:18 }}>{b.emoji}</span>{b.label}
              </div>
            ))}
          </div>
          <div style={{ flex:1, minWidth:280 }}>
            <div style={{ display:"inline-block", background:`${T.teal}18`, color:T.teal, fontFamily:"'Fredoka One',cursive", padding:"6px 20px", borderRadius:99, fontSize:14, marginBottom:14 }}>Meet Your Tutor</div>
            <h2 style={{ fontFamily:"'Fredoka One',cursive", fontSize:"clamp(26px,4vw,42px)", color:T.navy, marginBottom:14 }}>
              Hi! I'm the founder of <span style={{ color:T.orange }}>DibsOnAI</span> 👋
            </h2>
            <p style={{ color:T.white, fontSize:16, lineHeight:1.8, marginBottom:14 }}>I'm passionate about making AI & coding accessible, exciting, and genuinely fun for kids. Every session is designed to spark curiosity and build real skills — not just copy-paste exercises.</p>
            <p style={{ color:T.white, fontSize:16, lineHeight:1.8, marginBottom:26 }}>With 1-on-1 live sessions tailored to each child's pace and interests, kids leave every class feeling like <strong>actual AI inventors</strong>. 🚀</p>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              {[["🧒","Kid-First"],["🎮","Learn by Building"],["💬","Live 1-on-1"]].map(([icon,label])=>(
                <div key={label} style={{ display:"flex", alignItems:"center", gap:8, background:T.bg, padding:"10px 18px", borderRadius:99, fontWeight:700, fontSize:14, color:T.navy }}>{icon} {label}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" style={{ background:T.yellow, padding:"100px 40px" }}>
        <div style={{ maxWidth:660, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:44 }}>
            <div style={{ display:"inline-block", background:`${T.pink}18`, color:T.pink, fontFamily:"'Fredoka One',cursive", padding:"6px 20px", borderRadius:99, fontSize:14, marginBottom:14 }}>Let's Connect!</div>
            <h2 style={{ fontFamily:"'Fredoka One',cursive", fontSize:"clamp(26px,4vw,46px)", color:T.navy }}>Book a <span style={{ color:T.orange }}>Free Trial</span> 🎯</h2>
            <p style={{ color:"#777", fontSize:15 }}>No commitment — just 30 mins of pure AI fun for your kid!</p>
          </div>
          <ContactForm />
        </div>
      </section>



      {/* FOOTER */}
      <footer style={{ background:T.navy, padding:"48px 40px 28px", color:"rgba(255,255,255,.65)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:28, marginBottom:28 }}>
<div>
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
    {/* Your Logo Image */}
    <img src={logo} alt="DibsOnAI Logo" style={{ height: 45, width: "auto" }} />
    
    <span style={{ fontFamily: "'Fredoka One',cursive", fontSize: 32, color: T.white }}>
      Dibs<span style={{ color: "#9D00FF" }}>On</span>AI
    </span>
  </div>
  <p style={{ fontSize: 14, maxWidth: 240, lineHeight: 1.6 , color: "#FF1493",fontWeight: 800,}}>CODE CREATE CONQUER</p>
</div>
          <div>
            <div style={{ fontWeight:800, color:T.white, marginBottom:10 }}>Quick Links</div>
            {[["#services","Courses"],["#about","About"],["#contact","Book Trial"]].map(([href,label])=>(
              <a key={label} href={href} style={{ display:"block", color:"rgba(255,255,255,.55)", textDecoration:"none", fontSize:14, marginBottom:7, transition:"color .2s" }}
                onMouseEnter={e=>e.target.style.color=T.yellow} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.55)"}>{label}</a>
            ))}
          </div>
          <div>
            <div style={{ fontWeight:800, color:T.white, marginBottom:10 }}>Contact</div>
            <div style={{ fontSize:14, marginBottom:7 }}>📧 dibsonai.@gmail.com</div>
            <div style={{ fontSize:14, marginBottom:7 }}>💬 Call or WhatsApp on +917217890305</div>
            <div style={{ fontSize:14 }}>🌍 Online · Worldwide</div>
          </div>
        </div>
        <div style={{ borderTop:"1px solid rgba(255,255,255,.1)", paddingTop:18, textAlign:"center", fontSize:13 }}>
          © 2025 DibsOnAI · Built with 💛 for curious kids everywhere!
        </div>
      </footer>
    </div>
  );
}
function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", child: "", age: "", course: "", msg: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    // Basic validation
    if (!form.name || !form.email) {
      alert("Please fill in your name and email!");
      return;
    }

    setLoading(true);

    try {
      // 🟢 Paste your Google Script Web App URL here 🟢
      const scriptURL = "https://script.google.com/macros/s/AKfycbxPZm5xuPcIXegYn8EZV2x2juJWx5bMi6rJ9rM5uje9aJCW5l3dSk4cuu8yEwrXyKHu9g/exec";

      await fetch(scriptURL, {
        method: 'POST',
        mode: 'no-cors', // Essential for Google Apps Script to work with React
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      setLoading(false);
      setSent(true);
    } catch (error) {
      setLoading(false);
      console.error("Error!", error.message);
      alert("Something went wrong. Please try again!");
    }
  };

  if (sent) return (
    <div style={{ background: T.white, borderRadius: 26, padding: 44, textAlign: "center", boxShadow: "0 8px 36px rgba(0,0,0,0.07)", border: `3px solid ${T.green}` }}>
      <div style={{ fontSize: 60, marginBottom: 14, animation: "pop .5s ease" }}>🎉</div>
      <h3 style={{ fontFamily: "'Fredoka One',cursive", fontSize: 26, color: T.navy, marginBottom: 8 }}>You're booked!</h3>
      <p style={{ color: "#666" }}>We've received your request. We'll reach out within 24 hours! ✨</p>
    </div>
  );

  const inp = { border: "2px solid #E8E4FF", borderRadius: 14, padding: "13px 16px", fontSize: 15, fontFamily: "'Nunito',sans-serif", color: T.navy, outline: "none", width: "100%", boxSizing: "border-box", background: T.white };
  
  return (
    <div style={{ background: T.white, borderRadius: 26, padding: 38, boxShadow: "0 8px 36px rgba(0,0,0,0.07)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        {[["Your Name", "name", "👤", "text"], ["Email", "email", "📧", "email"], ["Child's Name", "child", "🧒", "text"], ["Child's Age", "age", "🎂", "text"]].map(([ph, k, icon, type]) => (
          <div key={k} style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 15 }}>{icon}</span>
            <input type={type} placeholder={ph} value={form[k]} onChange={e => set(k, e.target.value)} style={{ ...inp, paddingLeft: 40 }}
              onFocus={e => e.target.style.border = `2px solid ${T.teal}`} onBlur={e => e.target.style.border = "2px solid #E8E4FF"} />
          </div>
        ))}
      </div>
      <select value={form.course} onChange={e => set("course", e.target.value)} style={{ ...inp, marginBottom: 14 }}>
        <option value="">🎓 Select a course...</option>
        <option> 🧱 Logic Legends </option>
        <option> 🐍 Code Commanders </option>
        <option> 🤖 AI/ ML Adventures </option>
        <option> 🌐 Web Magic </option>
	<option> 🧠 Prompt Engineering </option>
        <option> 🎮 Gamifiers </option>
	<option> ✨ Help me choose... </option>
      </select>
      <textarea placeholder="💬 Anything else? (optional)" value={form.msg} onChange={e => set("msg", e.target.value)}
        style={{ ...inp, height: 90, resize: "none", marginBottom: 22 }}
        onFocus={e => e.target.style.border = `2px solid ${T.teal}`} onBlur={e => e.target.style.border = "2px solid #E8E4FF"} />
      
      <Btn onClick={handleSubmit} color={T.orange} full style={{ fontSize: 17 }}>
        {loading ? "Sending..." : "Book My Free Trial! 🚀"}
      </Btn>
    </div>
  );
}


/* ════════════ LOGIN SCREEN ════════════ */
function LoginScreen({ role, onSuccess, goBack }) {
  const isTutor = role === "tutor";
  const color = isTutor ? T.orange : T.teal;
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  const attempt = async () => {
    setLoading(true);
    setErr("");
    try {
      if (isTutor) {
        // Tutor login stays local
        if (email === TUTOR.email && pass === TUTOR.password) {
          onSuccess({ role: "tutor" });
        } else {
          trigErr("Wrong tutor credentials.");
        }
        setLoading(false);
        return;
      }
      // Student login via Firebase Auth + Firestore
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const snap = await getDoc(doc(db, "students", cred.user.uid));
      if (snap.exists()) {
        onSuccess({ role: "student", student: snap.data() });
      } else {
        trigErr("Student profile not found. Contact your tutor.");
      }
    } catch (e) {
      trigErr("Invalid email or password. Please try again.");
    }
    setLoading(false);
  };

  const trigErr = msg => { setErr(msg); setShake(true); setTimeout(()=>setShake(false),500); };

  return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:24, paddingTop:100 }}>
      <div style={{ width:"100%", maxWidth:420, animation:"pop .4s ease both" }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:50, marginBottom:10, display:"inline-block", animation:"float 4s ease-in-out infinite" }}>{isTutor?"🧑‍🏫":"🧒"}</div>
          <h1 style={{ fontFamily:"'Fredoka One',cursive", fontSize:30, color:T.navy, marginBottom:4 }}>{isTutor?"Tutor Portal":"Student Portal"}</h1>
          <p style={{ color:"#9CA3AF", fontSize:14 }}>{isTutor?"Sign in to manage your students":"Sign in to see your progress!"}</p>
        </div>

        <div style={{ background:T.white, borderRadius:26, padding:"34px 30px", boxShadow:"0 8px 36px rgba(0,0,0,0.08)", borderTop:`5px solid ${color}`, animation:shake?"shake .4s ease":"none" }}>
          <Inp label="Email" type="email" value={email} onChange={setEmail} placeholder={isTutor?"tutor@dibsonai.com":"you@student.com"} icon="📧" />
          <Inp label="Password" type="password" value={pass} onChange={setPass} placeholder="••••••••" icon="🔒" />

          {err && <div style={{ background:"#FEE2E2", color:"#DC2626", borderRadius:12, padding:"10px 14px", fontSize:13, marginBottom:14, fontWeight:600 }}>⚠️ {err}</div>}



          <Btn onClick={attempt} color={color} full style={{ fontSize:16, padding:"14px" }}>
            {loading ? "Signing in..." : `Sign In ${isTutor?"🏫":"🚀"}`}
          </Btn>
        </div>

        <div style={{ textAlign:"center", marginTop:18 }}>
          <button onClick={goBack} style={{ background:"none", border:"none", color:"#9CA3AF", fontSize:13, cursor:"pointer" }}>
            ← Back to website
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════ STUDENT DASHBOARD ════════════ */
function StudentDash({ student:s, onLogout }) {
  const [tab, setTab] = useState("home");
  const done = s.completedIdx;
  const tabs = [{id:"home",icon:"🏠",label:"Home"},{id:"progress",icon:"📈",label:"Progress"},{id:"sessions",icon:"📅",label:"Sessions"},{id:"homework",icon:"📚",label:"Homework"},{id:"badges",icon:"🏆",label:"Badges"}];

  return (
    <div style={{ minHeight:"100vh", background:"#F0FFFE", display:"flex", paddingTop:68 }}>
      {/* Sidebar */}
      <div style={{ position:"fixed", left:0, top:68, width:195, height:"calc(100vh - 68px)", background:`linear-gradient(180deg,${T.navy},#0a3a40)`, display:"flex", flexDirection:"column", padding:"22px 12px", zIndex:50 }}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ display:"flex", alignItems:"center", gap:9, padding:"11px 14px", borderRadius:12, border:"none", cursor:"pointer", marginBottom:3, background:tab===t.id?`linear-gradient(135deg,${T.teal},${T.teal}bb)`:"transparent", color:tab===t.id?"white":"rgba(255,255,255,.5)", fontWeight:700, fontSize:13, fontFamily:"'Nunito',sans-serif", boxShadow:tab===t.id?`0 4px 14px ${T.teal}55`:"none", transition:"all .2s" }}>
            <span style={{ fontSize:16 }}>{t.icon}</span>{t.label}
          </button>
        ))}
        <div style={{ marginTop:"auto" }}>
          <div style={{ display:"flex", alignItems:"center", gap:9, padding:"12px", background:"rgba(255,255,255,.07)", borderRadius:14, marginBottom:8 }}>
            <Av i={s.avatar} color={s.color} size={34} />
            <div><div style={{ color:T.white, fontWeight:700, fontSize:13 }}>{s.name}</div><div style={{ color:"rgba(255,255,255,.4)", fontSize:11 }}>{s.level}</div></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ marginLeft:195, padding:"30px 34px", flex:1, animation:"slideUp .5s ease" }}>
        {tab==="home" && (
          <div>
            <div style={{ background:`linear-gradient(135deg,${s.color},${s.color}bb)`, borderRadius:22, padding:"26px 30px", marginBottom:22, color:"white", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", right:-10, top:-10, fontSize:110, opacity:.1 }}>🤖</div>
              <h1 style={{ fontFamily:"'Fredoka One',cursive", fontSize:26, marginBottom:5 }}>Hey {s.name.split(" ")[0]}! 👋</h1>
              <p style={{ opacity:.85, fontSize:14 }}>You're learning <b>{s.subject}</b>. Keep it up!</p>
              <div style={{ display:"flex", gap:18, marginTop:18 }}>
                {[["🔥",s.streak+"d","Streak"],["✅",s.sessions,"Sessions"],["📈",s.progress+"%","Progress"]].map(([icon,val,label])=>(
                  <div key={label} style={{ background:"rgba(255,255,255,.2)", borderRadius:14, padding:"10px 16px", textAlign:"center" }}>
                    <div style={{ fontSize:18 }}>{icon}</div>
                    <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:19 }}>{val}</div>
                    <div style={{ fontSize:11, opacity:.8 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
              <div style={{ background:T.white, borderRadius:20, padding:20, boxShadow:"0 2px 14px rgba(0,0,0,0.05)" }}>
                <h3 style={{ fontFamily:"'Fredoka One',cursive", fontSize:17, color:T.navy, marginBottom:12 }}>📅 Next Session</h3>
                <div style={{ background:`${s.color}12`, borderRadius:14, padding:"14px 16px", borderLeft:`4px solid ${s.color}` }}>
                  <div style={{ fontWeight:800, color:T.navy }}>{s.subject}</div>
                  <div style={{ color:s.color, fontWeight:700, fontSize:14, marginTop:3 }}>⏰ {s.nextSession}</div>
                </div>
              </div>
              <div style={{ background:T.white, borderRadius:20, padding:20, boxShadow:"0 2px 14px rgba(0,0,0,0.05)" }}>
                <h3 style={{ fontFamily:"'Fredoka One',cursive", fontSize:17, color:T.navy, marginBottom:12 }}>📚 Due Soon</h3>
                <div style={{ background:"#FFF7ED", borderRadius:12, padding:"12px 14px", borderLeft:`4px solid ${T.orange}` }}>
                  <div style={{ fontSize:13, color:T.navy, fontWeight:600 }}>{s.homework[0]}</div>
                </div>
              </div>
            </div>
            <div style={{ background:T.white, borderRadius:20, padding:20, boxShadow:"0 2px 14px rgba(0,0,0,0.05)", marginTop:18 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <h3 style={{ fontFamily:"'Fredoka One',cursive", fontSize:17, color:T.navy }}>📈 Your Progress</h3>
                <button onClick={()=>setTab("progress")} style={{ background:"none", border:"none", color:s.color, fontWeight:700, cursor:"pointer", fontSize:13 }}>View all →</button>
              </div>
              <PBar value={s.progress} color={s.color} h={14} />
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                <span style={{ fontSize:12, color:"#9CA3AF" }}>Keep going!</span>
                <span style={{ fontSize:13, fontWeight:800, color:s.color }}>{s.progress}% complete</span>
              </div>
            </div>
          </div>
        )}

        {tab==="progress" && (
          <div>
            <h1 style={{ fontFamily:"'Fredoka One',cursive", fontSize:26, color:T.navy, marginBottom:4 }}>Your Progress 📈</h1>
            <p style={{ color:"#9CA3AF", marginBottom:22 }}>Every step of your learning journey</p>
            <div style={{ background:T.white, borderRadius:22, padding:26, boxShadow:"0 2px 14px rgba(0,0,0,0.05)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:22 }}>
                <Av i={s.avatar} color={s.color} size={50} />
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:18, color:T.navy }}>{s.name}</div>
                  <div style={{ color:s.color, fontWeight:700, fontSize:13 }}>{s.subject} · {s.level}</div>
                  <div style={{ marginTop:7 }}><PBar value={s.progress} color={s.color} h={12} /></div>
                </div>
                <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:34, color:s.color }}>{s.progress}%</div>
              </div>
              <h3 style={{ fontFamily:"'Fredoka One',cursive", fontSize:17, color:T.navy, marginBottom:12 }}>🗺️ Learning Path</h3>
              {s.milestones.map((m,i)=>{
                const isDone=i<done, isCur=i===done;
                return (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:12, marginBottom:7, background:isDone?`${s.color}10`:isCur?"#FFF7ED":"#FAFAFA" }}>
                    <div style={{ width:28,height:28,borderRadius:"50%",background:isDone?s.color:isCur?T.orange:"#E5E7EB",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:12,fontWeight:800,flexShrink:0 }}>
                      {isDone?"✓":isCur?"▶":i+1}
                    </div>
                    <span style={{ fontWeight:isDone?700:500, color:isDone?T.navy:isCur?T.orange:"#9CA3AF", fontSize:14, flex:1 }}>{m}</span>
                    {isDone&&<span style={{ fontSize:16 }}>✅</span>}
                    {isCur&&<span style={{ background:"#FEF3C7",color:T.orange,padding:"2px 9px",borderRadius:99,fontSize:11,fontWeight:800 }}>In Progress</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab==="sessions" && (
          <div>
            <h1 style={{ fontFamily:"'Fredoka One',cursive", fontSize:26, color:T.navy, marginBottom:4 }}>My Sessions 📅</h1>
            <p style={{ color:"#9CA3AF", marginBottom:22 }}>Upcoming & past sessions</p>
            <div style={{ background:T.white, borderRadius:22, padding:24, boxShadow:"0 2px 14px rgba(0,0,0,0.05)", marginBottom:18 }}>
              <h3 style={{ fontFamily:"'Fredoka One',cursive", fontSize:17, color:T.navy, marginBottom:14 }}>⏭️ Upcoming</h3>
              <div style={{ background:`${s.color}12`, borderRadius:16, padding:"16px 18px", borderLeft:`5px solid ${s.color}` }}>
                <div style={{ fontWeight:800, color:T.navy, fontSize:15 }}>{s.subject}</div>
                <div style={{ color:s.color, fontWeight:700, marginTop:4 }}>📅 {s.nextSession}</div>
                <div style={{ color:"#9CA3AF", fontSize:12, marginTop:4 }}>Live 1-on-1 with your tutor</div>
                <div style={{ marginTop:12, display:"flex", gap:10 }}>
                  <Btn color={s.color} small>Join Session 🔗</Btn>
                  <Btn color={s.color} outline small>Reschedule</Btn>
                </div>
              </div>
            </div>
            <div style={{ background:T.white, borderRadius:22, padding:24, boxShadow:"0 2px 14px rgba(0,0,0,0.05)" }}>
              <h3 style={{ fontFamily:"'Fredoka One',cursive", fontSize:17, color:T.navy, marginBottom:14 }}>🕘 Past ({s.sessions})</h3>
              {[...Array(Math.min(4,s.sessions))].map((_,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 14px", borderRadius:12, background:"#FAFAFA", marginBottom:7 }}>
                  <div style={{ width:8,height:8,borderRadius:"50%",background:s.color }} />
                  <div style={{ flex:1, fontWeight:600, color:T.navy, fontSize:14 }}>{s.subject} — Session {s.sessions-i}</div>
                  <div style={{ fontSize:12, color:"#9CA3AF" }}>Mar {Math.max(1,11-i*3)}, 2026</div>
                  <span style={{ background:"#F0FDF4",color:T.green,padding:"2px 10px",borderRadius:99,fontSize:11,fontWeight:700 }}>✓ Done</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==="homework" && (
          <div>
            <h1 style={{ fontFamily:"'Fredoka One',cursive", fontSize:26, color:T.navy, marginBottom:4 }}>Homework 📚</h1>
            <p style={{ color:"#9CA3AF", marginBottom:22 }}>Assignments from your tutor</p>
            {s.homework.map((hw,i)=>(
              <div key={i} style={{ background:T.white, borderRadius:20, padding:22, boxShadow:"0 2px 14px rgba(0,0,0,0.05)", borderLeft:`5px solid ${i===0?T.orange:T.teal}`, marginBottom:14 }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:14 }}>
                  <div style={{ fontSize:26 }}>{i===0?"📝":"📖"}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, color:T.navy, fontSize:15, marginBottom:5 }}>{hw}</div>
                    <div style={{ fontSize:12, color:"#9CA3AF" }}>Due next session</div>
                    <div style={{ marginTop:12 }}><Btn color={i===0?T.orange:T.teal} small>Mark Complete ✅</Btn></div>
                  </div>
                  <span style={{ background:i===0?"#FEF3C7":"#EFF6FF",color:i===0?T.orange:T.teal,padding:"4px 12px",borderRadius:99,fontSize:11,fontWeight:800 }}>{i===0?"Due Soon":"Pending"}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab==="badges" && (
          <div>
            <h1 style={{ fontFamily:"'Fredoka One',cursive", fontSize:26, color:T.navy, marginBottom:4 }}>My Badges 🏆</h1>
            <p style={{ color:"#9CA3AF", marginBottom:22 }}>Achievements you've earned!</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:14 }}>
              {[{emoji:"🔥",name:"On Fire",desc:"7-day streak",earned:s.streak>=7},{emoji:"🏆",name:"Champion",desc:"20+ sessions",earned:s.sessions>=20},{emoji:"⭐",name:"Star Student",desc:"80%+ progress",earned:s.progress>=80},{emoji:"🎯",name:"Sharp Shooter",desc:"All homework done",earned:s.badges.includes("🎯")},{emoji:"🚀",name:"Rocket",desc:"100% progress",earned:s.progress===100},{emoji:"🌟",name:"Rising Star",desc:"First session done",earned:s.sessions>=1}].map((b,i)=>(
                <div key={i} style={{ background:b.earned?T.white:"#F9FAFB", borderRadius:18, padding:20, textAlign:"center", boxShadow:b.earned?"0 4px 18px rgba(0,0,0,0.07)":"none", border:b.earned?`2px solid ${s.color}22`:"2px dashed #E5E7EB", opacity:b.earned?1:.5 }}>
                  <div style={{ fontSize:38, marginBottom:7, filter:b.earned?"none":"grayscale(1)" }}>{b.emoji}</div>
                  <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:14, color:T.navy, marginBottom:3 }}>{b.name}</div>
                  <div style={{ fontSize:11, color:"#9CA3AF" }}>{b.desc}</div>
                  {b.earned&&<div style={{ marginTop:7, fontSize:11, color:s.color, fontWeight:800 }}>✓ Earned!</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════ TUTOR DASHBOARD ════════════ */
function TutorDash({ onLogout }) {
  const [tab, setTab] = useState("dashboard");
  const [sel, setSel] = useState(null);
  const [day, setDay] = useState(null);
  const [students, setStudents] = useState([]);

  // Load all students from Firestore on mount
  useEffect(() => {
    getDocs(collection(db, "students")).then(snap => {
      setStudents(snap.docs.map(d => d.data()));
    });
  }, []);

  // Use local alias so existing STUDENTS references just work
  const STUDENTS = students;
  const tabs = [{id:"dashboard",icon:"🏠",label:"Dashboard"},{id:"students",icon:"👩‍💻",label:"Students"},{id:"schedule",icon:"📅",label:"Schedule"},{id:"progress",icon:"📈",label:"Progress"}];

  return (
    <div style={{ minHeight:"100vh", background:"#FFF8F0", display:"flex", paddingTop:68 }}>
      <div style={{ position:"fixed", left:0, top:68, width:200, height:"calc(100vh - 68px)", background:`linear-gradient(180deg,${T.navy},#2a1a0e)`, display:"flex", flexDirection:"column", padding:"22px 12px", zIndex:50 }}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>{ setTab(t.id); setSel(null); }} style={{ display:"flex", alignItems:"center", gap:9, padding:"11px 14px", borderRadius:12, border:"none", cursor:"pointer", marginBottom:3, background:tab===t.id?`linear-gradient(135deg,${T.orange},${T.pink})`:"transparent", color:tab===t.id?"white":"rgba(255,255,255,.5)", fontWeight:700, fontSize:13, fontFamily:"'Nunito',sans-serif", boxShadow:tab===t.id?`0 4px 14px ${T.orange}55`:"none", transition:"all .2s" }}>
            <span style={{ fontSize:16 }}>{t.icon}</span>{t.label}
          </button>
        ))}
        <div style={{ marginTop:"auto" }}>
          <div style={{ display:"flex", alignItems:"center", gap:9, padding:"12px", background:"rgba(255,255,255,.07)", borderRadius:14 }}>
            <Av i="ME" color={T.orange} size={34} />
            <div><div style={{ color:T.white, fontWeight:700, fontSize:13 }}>DibsOnAI</div><div style={{ color:"rgba(255,255,255,.4)", fontSize:11 }}>Admin · Tutor</div></div>
          </div>
        </div>
      </div>

      <div style={{ marginLeft:200, padding:"30px 34px", flex:1, animation:"slideUp .5s ease" }}>
        {tab==="dashboard" && (
          <div>
            <h1 style={{ fontFamily:"'Fredoka One',cursive", fontSize:28, color:T.navy, marginBottom:4 }}>Welcome back! 👋</h1>
            <p style={{ color:"#9CA3AF", marginBottom:22 }}>Your DibsOnAI overview for today.</p>
            <div style={{ display:"flex", gap:14, marginBottom:22, flexWrap:"wrap" }}>
              {[["👩‍💻","Students","5","all active",T.teal],["📅","This Week","8","sessions",T.orange],["🔥","Avg Streak","10d","keep it up",T.pink],["📈","Avg Progress","57%","",T.green]].map(([icon,label,val,sub,color])=>(
                <div key={label} style={{ background:T.white, borderRadius:18, padding:"18px 20px", flex:1, minWidth:140, borderTop:`4px solid ${color}`, boxShadow:"0 2px 14px rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize:24, marginBottom:4 }}>{icon}</div>
                  <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:24, color:T.navy }}>{val}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:T.navy }}>{label}</div>
                  <div style={{ fontSize:11, color:"#9CA3AF" }}>{sub}</div>
                </div>
              ))}
            </div>
            <div style={{ background:T.white, borderRadius:20, padding:22, boxShadow:"0 2px 14px rgba(0,0,0,0.05)", marginBottom:18 }}>
              <h2 style={{ fontFamily:"'Fredoka One',cursive", fontSize:19, color:T.navy, marginBottom:14 }}>📅 Today's Sessions</h2>
              {CAL[11]?.map((e,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", background:`${e.color}12`, borderRadius:14, borderLeft:`4px solid ${e.color}`, marginBottom:8 }}>
                  <span style={{ fontSize:20 }}>⏰</span>
                  <div style={{ flex:1 }}><div style={{ fontWeight:700, color:T.navy }}>{e.student}</div><div style={{ fontSize:12, color:"#6B7280" }}>{e.topic}</div></div>
                  <div style={{ fontWeight:700, color:e.color }}>{e.time}</div>
                  <button style={{ background:e.color, color:"white", border:"none", borderRadius:10, padding:"7px 16px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>Start 🚀</button>
                </div>
              ))}
            </div>
            <div style={{ background:T.white, borderRadius:20, padding:22, boxShadow:"0 2px 14px rgba(0,0,0,0.05)" }}>
              <h2 style={{ fontFamily:"'Fredoka One',cursive", fontSize:19, color:T.navy, marginBottom:14 }}>🌟 Student Progress</h2>
              {STUDENTS.map(s=>(
                <div key={s.email} style={{ display:"flex", alignItems:"center", gap:14, marginBottom:12, cursor:"pointer" }}
                  onClick={()=>{ setSel(s); setTab("progress"); }}>
                  <Av i={s.avatar} color={s.color} size={34} />
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontWeight:700, fontSize:13, color:T.navy }}>{s.name}</span>
                      <span style={{ fontSize:12, color:s.color, fontWeight:700 }}>{s.progress}%</span>
                    </div>
                    <PBar value={s.progress} color={s.color} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==="students" && !sel && (
          <div>
            <h1 style={{ fontFamily:"'Fredoka One',cursive", fontSize:28, color:T.navy, marginBottom:4 }}>Students 👩‍💻</h1>
            <p style={{ color:"#9CA3AF", marginBottom:22 }}>Your coding & AI learners</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:18 }}>
              {STUDENTS.map(s=>(
                <div key={s.email} onClick={()=>setSel(s)} style={{ background:T.white, borderRadius:22, padding:22, cursor:"pointer", boxShadow:"0 2px 14px rgba(0,0,0,0.05)", borderTop:`5px solid ${s.color}`, transition:"transform .2s,box-shadow .2s" }}
                  onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-6px)"; e.currentTarget.style.boxShadow=`0 10px 28px ${s.color}33`; }}
                  onMouseLeave={e=>{ e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 2px 14px rgba(0,0,0,0.05)"; }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                    <Av i={s.avatar} color={s.color} size={46} />
                    <div><div style={{ fontWeight:800, fontSize:15, color:T.navy }}>{s.name}</div><div style={{ fontSize:12, color:s.color, fontWeight:700 }}>{s.subject}</div></div>
                  </div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
                    <span style={{ background:`${s.color}15`,color:s.color,padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:700 }}>{s.level}</span>
                    <span style={{ background:"#FFF7ED",color:T.orange,padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:700 }}>🔥 {s.streak}d</span>
                    <span style={{ background:"#F0FDF4",color:T.green,padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:700 }}>{s.sessions} sessions</span>
                  </div>
                  <div style={{ marginBottom:6 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}><span style={{ fontSize:12,color:"#9CA3AF" }}>Progress</span><span style={{ fontSize:12,fontWeight:700,color:s.color }}>{s.progress}%</span></div>
                    <PBar value={s.progress} color={s.color} h={10} />
                  </div>
                  <div style={{ fontSize:12, color:"#9CA3AF", marginTop:8 }}>📅 Next: <span style={{ color:T.navy,fontWeight:600 }}>{s.nextSession}</span></div>
                </div>
              ))}
              <div style={{ background:T.white, borderRadius:22, padding:22, border:`2px dashed ${T.teal}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:180, cursor:"pointer", color:T.teal }}>
                <div style={{ fontSize:32 }}>+</div>
                <div style={{ fontWeight:800, fontSize:14 }}>Add Student</div>
              </div>
            </div>
          </div>
        )}
        {tab==="students" && sel && <TutorStudentDetail s={sel} onBack={()=>setSel(null)} />}

        {tab==="schedule" && (
  <div>
    <h1 style={{ fontFamily:"'Fredoka One',cursive", fontSize:28, color:T.navy, marginBottom:4 }}>Schedule 📅</h1>
    <p style={{ color:"#9CA3AF", marginBottom:22 }}>March 2026 — click a day</p>
    <GoogleCalendarPanel />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
              <div style={{ background:T.white, borderRadius:22, padding:22, boxShadow:"0 2px 14px rgba(0,0,0,0.05)" }}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3, marginBottom:10 }}>
                  {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=><div key={d} style={{ textAlign:"center", fontSize:11, fontWeight:700, color:"#9CA3AF", padding:"3px 0" }}>{d}</div>)}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>
                  {Array.from({length:31},(_,i)=>i+1).map(d=>{
                    const has=CAL[d], isT=d===11, isSel=day===d;
                    return (
                      <div key={d} onClick={()=>setDay(d===day?null:d)} style={{ aspectRatio:"1", borderRadius:9, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:12, fontWeight:isT?900:500, background:isSel?T.orange:isT?`${T.orange}18`:has?`${T.teal}10`:"transparent", color:isSel?"white":isT?T.orange:T.navy, transition:"all .15s" }}>
                        {d}
                        {has&&!isSel&&<div style={{ display:"flex",gap:2,marginTop:1 }}>{has.slice(0,3).map((e,i)=><div key={i} style={{ width:4,height:4,borderRadius:"50%",background:e.color }}/>)}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ background:T.white, borderRadius:22, padding:22, boxShadow:"0 2px 14px rgba(0,0,0,0.05)" }}>
                <h3 style={{ fontFamily:"'Fredoka One',cursive", fontSize:17, color:T.navy, marginBottom:14 }}>{day?`March ${day}`:"Pick a day 👈"}</h3>
                {day&&CAL[day]?CAL[day].map((e,i)=>(
                  <div key={i} style={{ padding:"14px 16px", borderRadius:14, background:`${e.color}12`, borderLeft:`4px solid ${e.color}`, marginBottom:10 }}>
                    <div style={{ fontWeight:800, color:T.navy }}>{e.student}</div>
                    <div style={{ fontSize:13, color:"#6B7280" }}>📚 {e.topic}</div>
                    <div style={{ color:e.color, fontWeight:700, fontSize:13, marginTop:4 }}>⏰ {e.time}</div>
                    <div style={{ display:"flex", gap:8, marginTop:10 }}>
                      <button style={{ background:e.color,color:"white",border:"none",borderRadius:10,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Nunito',sans-serif" }}>Join</button>
                      <button style={{ background:"transparent",color:e.color,border:`2px solid ${e.color}`,borderRadius:10,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Nunito',sans-serif" }}>Reschedule</button>
                    </div>
                  </div>
                )):day?<div style={{ textAlign:"center",color:"#9CA3AF",padding:28 }}><div style={{ fontSize:34 }}>🗓️</div><div>No sessions</div><button style={{ marginTop:12,background:T.orange,color:"white",border:"none",borderRadius:12,padding:"9px 20px",fontWeight:700,cursor:"pointer",fontFamily:"'Nunito',sans-serif" }}>+ Book</button></div>:<div style={{ textAlign:"center",color:"#C4B5FD",padding:28 }}>Select a date</div>}
              </div>
            </div>
          </div>
        )}

        {tab==="progress" && !sel && (
          <div>
            <h1 style={{ fontFamily:"'Fredoka One',cursive", fontSize:28, color:T.navy, marginBottom:4 }}>Progress 📈</h1>
            <p style={{ color:"#9CA3AF", marginBottom:22 }}>Track every student's journey</p>
            {STUDENTS.map(s=>(
              <div key={s.email} onClick={()=>setSel(s)} style={{ background:T.white, borderRadius:20, padding:20, marginBottom:12, cursor:"pointer", display:"flex", alignItems:"center", gap:18, boxShadow:"0 2px 14px rgba(0,0,0,0.05)", transition:"all .2s" }}
                onMouseEnter={e=>e.currentTarget.style.boxShadow=`0 8px 24px ${s.color}33`}
                onMouseLeave={e=>e.currentTarget.style.boxShadow="0 2px 14px rgba(0,0,0,0.05)"}>
                <Av i={s.avatar} color={s.color} size={48} />
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                    <span style={{ fontWeight:800, fontSize:15, color:T.navy }}>{s.name}</span>
                    <span style={{ background:`${s.color}15`,color:s.color,padding:"2px 10px",borderRadius:99,fontSize:11,fontWeight:700 }}>{s.level}</span>
                  </div>
                  <div style={{ fontSize:12,color:"#9CA3AF",marginBottom:6 }}>{s.subject}</div>
                  <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                    <div style={{ flex:1 }}><PBar value={s.progress} color={s.color} h={12} /></div>
                    <span style={{ fontWeight:800,color:s.color,fontSize:14,minWidth:36 }}>{s.progress}%</span>
                  </div>
                </div>
                <div style={{ display:"flex",gap:14,textAlign:"center" }}>
                  <div><div style={{ fontFamily:"'Fredoka One',cursive",fontSize:20,color:T.navy }}>{s.sessions}</div><div style={{ fontSize:11,color:"#9CA3AF" }}>Sessions</div></div>
                  <div><div style={{ fontFamily:"'Fredoka One',cursive",fontSize:20,color:T.orange }}>🔥{s.streak}</div><div style={{ fontSize:11,color:"#9CA3AF" }}>Streak</div></div>
                </div>
                <div style={{ color:T.orange,fontSize:22 }}>›</div>
              </div>
            ))}
          </div>
        )}
        {tab==="progress" && sel && <TutorStudentDetail s={sel} onBack={()=>setSel(null)} />}
      </div>
    </div>
  );
}

function TutorStudentDetail({ s, onBack }) {
  const done = s.completedIdx;
  return (
    <div style={{ animation:"slideUp .5s ease" }}>
      <button onClick={onBack} style={{ background:"none",border:"none",color:T.orange,fontWeight:700,fontSize:14,cursor:"pointer",marginBottom:16,fontFamily:"'Nunito',sans-serif" }}>← Back</button>
      <div style={{ background:`linear-gradient(135deg,${s.color},${s.color}bb)`, borderRadius:22, padding:24, marginBottom:20, color:"white", display:"flex", alignItems:"center", gap:18 }}>
        <Av i={s.avatar} color="rgba(255,255,255,.25)" size={58} />
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Fredoka One',cursive",fontSize:22 }}>{s.name}</div>
          <div style={{ opacity:.8 }}>{s.subject} · {s.level}</div>
          <div style={{ opacity:.65,fontSize:13,marginTop:3 }}>Next: {s.nextSession}</div>
        </div>
        {[["🔥",s.streak+"d","Streak"],["✅",s.sessions,"Sessions"],["📈",s.progress+"%","Progress"]].map(([icon,val,label])=>(
          <div key={label} style={{ textAlign:"center",background:"rgba(255,255,255,.2)",borderRadius:14,padding:"10px 16px" }}>
            <div style={{ fontSize:18 }}>{icon}</div>
            <div style={{ fontFamily:"'Fredoka One',cursive",fontSize:18 }}>{val}</div>
            <div style={{ fontSize:11,opacity:.75 }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
        <div style={{ background:T.white, borderRadius:20, padding:22, boxShadow:"0 2px 14px rgba(0,0,0,0.05)" }}>
          <h3 style={{ fontFamily:"'Fredoka One',cursive",fontSize:17,color:T.navy,marginBottom:14 }}>🗺️ Learning Path</h3>
          {s.milestones.map((m,i)=>{
            const isDone=i<done, isCur=i===done;
            return (
              <div key={i} style={{ display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderRadius:12,marginBottom:7,background:isDone?`${s.color}10`:isCur?"#FFF7ED":"#FAFAFA" }}>
                <div style={{ width:26,height:26,borderRadius:"50%",background:isDone?s.color:isCur?T.orange:"#E5E7EB",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:12,fontWeight:800,flexShrink:0 }}>{isDone?"✓":isCur?"▶":i+1}</div>
                <span style={{ fontWeight:isDone?700:500,color:isDone?T.navy:isCur?T.orange:"#9CA3AF",fontSize:13,flex:1 }}>{m}</span>
                {isCur&&<span style={{ background:"#FEF3C7",color:T.orange,padding:"2px 9px",borderRadius:99,fontSize:11,fontWeight:800 }}>Now</span>}
              </div>
            );
          })}
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
          <div style={{ background:T.white,borderRadius:20,padding:22,boxShadow:"0 2px 14px rgba(0,0,0,0.05)" }}>
            <h3 style={{ fontFamily:"'Fredoka One',cursive",fontSize:17,color:T.navy,marginBottom:12 }}>📚 Homework</h3>
            {s.homework.map((hw,i)=>(
              <div key={i} style={{ background:"#FFF7ED",borderRadius:12,padding:"11px 14px",marginBottom:7,borderLeft:`4px solid ${T.orange}` }}>
                <div style={{ fontSize:13,color:T.navy,fontWeight:600 }}>{hw}</div>
              </div>
            ))}
          </div>
          <div style={{ background:T.white,borderRadius:20,padding:22,boxShadow:"0 2px 14px rgba(0,0,0,0.05)" }}>
            <h3 style={{ fontFamily:"'Fredoka One',cursive",fontSize:17,color:T.navy,marginBottom:12 }}>📝 Notes</h3>
            <textarea placeholder="Add session notes..." style={{ width:"100%",height:80,border:"2px solid #E8E4FF",borderRadius:12,padding:12,fontSize:13,fontFamily:"'Nunito',sans-serif",resize:"none",outline:"none",boxSizing:"border-box" }} />
            <Btn color={s.color} small style={{ marginTop:8 }}>Save</Btn>
          </div>
          <div style={{ background:T.white,borderRadius:20,padding:22,boxShadow:"0 2px 14px rgba(0,0,0,0.05)" }}>
            <h3 style={{ fontFamily:"'Fredoka One',cursive",fontSize:17,color:T.navy,marginBottom:12 }}>⚡ Actions</h3>
            {[["📅 Schedule Session",s.color],["📧 Send Homework",T.teal],["🏆 Award Badge",T.orange]].map(([label,color])=>(
              <button key={label} style={{ width:"100%",background:`${color}10`,color,border:`2px solid ${color}25`,borderRadius:12,padding:"10px 14px",fontWeight:700,cursor:"pointer",fontSize:13,textAlign:"left",fontFamily:"'Nunito',sans-serif",marginBottom:7 }}>{label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}



/**** Function for Google Calendar *******/
function GoogleCalendarPanel() {
  const { events, loading, error, connected, connectCalendar, formatTime } = useGoogleCalendar();

  if (!connected) return (
    <div style={{ background:"white", borderRadius:20, padding:32, textAlign:"center",
      boxShadow:"0 2px 14px rgba(0,0,0,0.06)", marginBottom:22 }}>
      <div style={{ fontSize:48, marginBottom:12 }}>📅</div>
      <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:20, color:T.navy, marginBottom:8 }}>
        Connect Google Calendar
      </div>
      <p style={{ color:"#9CA3AF", fontSize:14, marginBottom:20 }}>
        See your real sessions directly in the dashboard
      </p>
      {error && <div style={{ color:"#DC2626", fontSize:13, marginBottom:14 }}>⚠️ {error}</div>}
      <button onClick={connectCalendar} style={{
        background:`linear-gradient(135deg,${T.orange},${T.pink})`,
        color:"white", border:"none", borderRadius:99, padding:"13px 28px",
        fontFamily:"'Fredoka One',cursive", fontSize:16, cursor:"pointer",
        boxShadow:`0 4px 16px ${T.orange}44`,
      }}>
        {loading ? "Connecting..." : "Connect Google Calendar 🔗"}
      </button>
    </div>
  );

  return (
    <div style={{ background:"white", borderRadius:20, padding:24,
      boxShadow:"0 2px 14px rgba(0,0,0,0.06)", marginBottom:22 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <h3 style={{ fontFamily:"'Fredoka One',cursive", fontSize:20, color:T.navy }}>
          🗓️ Your Google Calendar
        </h3>
        <span style={{ background:"#F0FDF4", color:T.green, fontSize:12,
          fontWeight:800, padding:"4px 12px", borderRadius:99 }}>
          ✓ Connected
        </span>
      </div>

      {events.length === 0 ? (
        <div style={{ textAlign:"center", color:"#9CA3AF", padding:24 }}>
          No upcoming events in the next 30 days
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {events.map(event => (
            <div key={event.id} style={{
              display:"flex", alignItems:"center", gap:14, padding:"13px 16px",
              borderRadius:14, background:`${event.color}12`,
              borderLeft:`4px solid ${event.color}`,
            }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800, color:T.navy, fontSize:14 }}>{event.title}</div>
                <div style={{ fontSize:12, color:"#6B7280", marginTop:2 }}>
                  📅 {new Date(event.start).toLocaleDateString()} &nbsp;
                  ⏰ {formatTime(event.start)} — {formatTime(event.end)}
                </div>
              </div>
              {event.meetLink && (
                <a href={event.meetLink} target="_blank" rel="noreferrer"
                  style={{ background:T.teal, color:"white", borderRadius:10,
                    padding:"7px 16px", fontSize:12, fontWeight:700,
                    textDecoration:"none", whiteSpace:"nowrap" }}>
                  Join Meet 🎥
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



/* ════════════ ROOT ════════════ */
export default function App() {
  const [screen, setScreen] = useState("home");
  const [session, setSession] = useState(null);

  const handleLogin = (data) => {
    setSession(data);
    setScreen(data.role === "tutor" ? "tutor" : "student");
  };

  const handleLogout = () => {
    setSession(null);
    setScreen("home");
  };

  return (
    <div>
      <Nav screen={screen} setScreen={setScreen} session={session} onLogout={handleLogout} />
      {screen === "home"          && <Homepage setScreen={setScreen} />}
      {screen === "student-login" && <LoginScreen role="student" onSuccess={handleLogin} goBack={()=>setScreen("home")} />}
      {screen === "tutor-login"   && <LoginScreen role="tutor"   onSuccess={handleLogin} goBack={()=>setScreen("home")} />}
      {screen === "student"       && session && <StudentDash student={session.student} onLogout={handleLogout} />}
      {screen === "tutor"         && <TutorDash onLogout={handleLogout} />}
    </div>
  );
}
