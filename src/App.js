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
  const [menuOpen, setMenuOpen] = useState(false);
  const isHome = screen === "home";

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [screen]);

  return (
    <nav style={{
      position:"fixed", top:0, left:0, right:0, zIndex:1000,
      backdropFilter: scrolled || !isHome ? "blur(14px)" : "none",
      borderBottom: scrolled || !isHome ? `3px solid ${T.yellow}` : "none",
      transition:"all .3s",
    }}>
      {/* ── Main bar ── */}
      <div style={{ padding:"14px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>

        {/* Logo */}
        <div onClick={() => { onLogout(); setScreen("home"); }} style={{ cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
          <img src={logo} alt="DibsOnAI Logo" style={{ height:50, width:"auto" }} />
          <div style={{ display:"flex", flexDirection:"column", justifyContent:"center" }}>
            <span style={{ fontFamily:"'Fredoka One',cursive", fontSize:24, color:"#FFFFFF", lineHeight:"1.4" }}>
              Dibs<span style={{ color:"#9D00FF" }}>On</span>AI
            </span>
            <span style={{ fontSize:11, fontWeight:800, color:"#FF1493", letterSpacing:"0.8px", textTransform:"uppercase" }}>
              CODE CREATE CONQUER
            </span>
          </div>
        </div>

        {/* Desktop: center links + right buttons */}
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>

          {/* Center nav links — desktop only */}
          {isHome && (
            <div className="nav-links-desktop" style={{ display:"flex", gap:10, alignItems:"center" }}>
              {["courses","about","contact"].map(s => (
                <a key={s} href={`#${s}`}
                  style={{ padding:"8px 18px", borderRadius:99, fontSize:14, fontWeight:700, color:"#FFFFFF",
                    background:"rgba(255,255,255,0.1)", textDecoration:"none", textTransform:"capitalize",
                    transition:"all 0.3s ease", border:"1px solid rgba(255,255,255,0.2)" }}
                  onMouseEnter={e => { e.target.style.background=T.yellow; e.target.style.color=T.navy; }}
                  onMouseLeave={e => { e.target.style.background="rgba(255,255,255,0.1)"; e.target.style.color="#FFFFFF"; }}
                >{s}</a>
              ))}
            </div>
          )}

          {/* Right portal buttons — desktop only */}
          <div className="nav-portal-desktop">
            {session ? (
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontWeight:700, fontSize:13, color:"#FFD93D" }}>
                  {session.role === "tutor" ? "🧑‍🏫 Tutor" : `🧒 ${session.student.name}`}
                </span>
                <Btn onClick={onLogout} color={T.navy} small>Sign Out</Btn>
              </div>
            ) : (
              <div style={{ display:"flex", gap:8 }}>
                <Btn onClick={() => setScreen("student-login")} color={T.teal} outline small>Student Login 🧒</Btn>
                <Btn onClick={() => setScreen("tutor-login")} color={"#9D00FF"} small>Tutor Login 🧑‍🏫</Btn>
              </div>
            )}
          </div>

          {/* Hamburger — mobile only */}
          <button
            className="nav-hamburger"
            onClick={() => setMenuOpen(o => !o)}
            style={{ display:"none", background:"none", border:"none", cursor:"pointer", padding:6, flexDirection:"column", gap:5, alignItems:"center", justifyContent:"center" }}
            aria-label="Toggle menu"
          >
            <span style={{ display:"block", width:24, height:3, borderRadius:3, background:"#FFFFFF", transition:"all .3s", transform: menuOpen ? "rotate(45deg) translate(5px,6px)" : "none" }}/>
            <span style={{ display:"block", width:24, height:3, borderRadius:3, background:"#FFFFFF", transition:"all .3s", opacity: menuOpen ? 0 : 1 }}/>
            <span style={{ display:"block", width:24, height:3, borderRadius:3, background:"#FFFFFF", transition:"all .3s", transform: menuOpen ? "rotate(-45deg) translate(5px,-6px)" : "none" }}/>
          </button>
        </div>
      </div>

      {/* ── Mobile dropdown menu ── */}
      <div className="nav-mobile-menu" style={{
        display: menuOpen ? "flex" : "none",
        flexDirection:"column", gap:10,
        padding:"16px 24px 20px",
        borderTop:`2px solid rgba(255,215,61,0.3)`,
        background:"rgba(26,26,94,0.98)",
      }}>
        {/* Nav links */}
        {isHome && ["courses","about","contact"].map(s => (
          <a key={s} href={`#${s}`} onClick={() => setMenuOpen(false)}
            style={{ padding:"12px 18px", borderRadius:14, fontSize:15, fontWeight:700,
              color:"#FFFFFF", background:"rgba(255,255,255,0.08)", textDecoration:"none",
              textTransform:"capitalize", textAlign:"center", border:"1px solid rgba(255,255,255,0.15)" }}
          >{s}</a>
        ))}

        {/* Auth buttons */}
        {session ? (
          <>
            <div style={{ textAlign:"center", fontWeight:700, fontSize:14, color:"#FFD93D", padding:"8px 0" }}>
              {session.role === "tutor" ? "🧑‍🏫 Tutor" : `🧒 ${session.student.name}`}
            </div>
            <Btn onClick={() => { onLogout(); setMenuOpen(false); }} color={T.navy} full>Sign Out</Btn>
          </>
        ) : (
          <>
            <Btn onClick={() => { setScreen("student-login"); setMenuOpen(false); }} color={T.teal} outline full>Student Login 🧒</Btn>
            <Btn onClick={() => { setScreen("tutor-login"); setMenuOpen(false); }} color={"#9D00FF"} full>Tutor Login 🧑‍🏫</Btn>
          </>
        )}
      </div>

      {/* ── Responsive styles injected once ── */}
      <style>{`
        @media (max-width: 680px) {
          .nav-links-desktop { display: none !important; }
          .nav-portal-desktop { display: none !important; }
          .nav-hamburger { display: flex !important; }
        }
        @media (min-width: 681px) {
          .nav-mobile-menu { display: none !important; }
        }
      `}</style>
    </nav>
  );
}

/* ════════════ MODAL ════════════ */
function Modal({ onClose, children }) {
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:2000, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", padding:20, backdropFilter:"blur(4px)" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:T.white, borderRadius:28, padding:36, maxWidth:560, width:"100%", maxHeight:"85vh", overflowY:"auto", position:"relative", animation:"pop .3s ease", boxShadow:"0 24px 80px rgba(0,0,0,0.2)" }}>
        <button onClick={onClose} style={{ position:"absolute", top:16, right:16, background:"#F3F4F6", border:"none", borderRadius:"50%", width:34, height:34, fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#6B7280" }}>✕</button>
        {children}
      </div>
    </div>
  );
}

/* ════════════ COURSES SECTION ════════════ */
function CoursesSection() {
  const [activeModal, setActiveModal] = useState(null);

  const COURSES = [
    {
      icon:"🧱", title:"Logic Legends", desc:"Build games, animations & stories. Focuses on the brain of coding.", color:T.teal, age:"Age 6+",
      modules:["Coding Fundamentals","App Development","Scientific Explorers","Codimath","Game Development","3D Modelling","Design Thinking","HTML / CSS","Microbit","Intro to Python","Java","C++","Edublocks"]
    },
    {
      icon:"🐍", title:"Code Commanders", desc:"Master the language of the future! Build gravity-defying games and interactive stories with Python.", color:T.yellow, age:"Age 8+",
      modules:["Coding Fundamentals","AI / ML","App Development","Electronics","HTML / CSS","Intro to Python","C++","Java","Python Advanced","Javascript","Premier OOP C++ & Java","Graphic Design"]
    },
    {
      icon:"🤖", title:"AI Adventures", desc:"Train your own AI model, talk to chatbots, and explore machine learning!", color:T.orange, age:"Age 8+",
      modules:["Premier Intro to Python","Premier Python Advanced","Intro to AI / ML","Data Visualisation","Premier Machine Learning","Python Flask","Premier Computer Vision","Advanced DBMS"]
    },
    {
      icon:"🌐", title:"Web Magic", desc:"Create your own website with HTML, CSS and JavaScript from scratch.", color:T.green, age:"Age 10+",
      modules:["Coding Fundamentals","App Development","HTML / CSS","Java","Javascript","Graphic Design","Premier Flask"]
    },
    {
      icon:"🧠", title:"Prompt Engineering", desc:"Learn to talk to AI like a pro — craft prompts, build AI tools, go viral!", color:T.purple, age:"Age 12+",
      modules:["Intro to ChatGPT & GenAI","Skill Building","Python and AI","Education & L&D with GenAI","Coding & Design Thinking","Content Creation","AI Tools Exploration","Deep Dive into GenAI","Building Products with GenAI"]
    },
    {
      icon:"🎮", title:"Gamifiers", desc:"Dive into the world of Roblox and build your own games!", color:T.pink, age:"Age 12+",
      modules:["Roblox Fundamentals","Advanced Roblox"]
    },
  ];

  const active = COURSES.find(c => c.title === activeModal);

  return (
    <section id="courses" style={{ background:"#FF1493", padding:"100px 40px" }}>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:56 }}>
          <div style={{ display:"inline-block", background:T.yellow, color:T.navy, fontFamily:"'Fredoka One',cursive", padding:"6px 20px", borderRadius:99, fontSize:14, marginBottom:14 }}>What We Teach</div>
          <h2 style={{ fontFamily:"'Fredoka One',cursive", fontSize:"clamp(30px,5vw,50px)", color:T.white }}>Courses Kids <span style={{ color:T.yellow }}>Love</span> 🎉</h2>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:22 }}>
          {COURSES.map((c,i) => (
            <div key={i}
              onClick={() => setActiveModal(c.title)}
              style={{ background:T.white, borderRadius:24, padding:26, boxShadow:"0 4px 22px rgba(0,0,0,0.06)", borderBottom:`5px solid ${c.color}`, transition:"transform .2s, box-shadow .2s", cursor:"pointer" }}
              onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-8px)"; e.currentTarget.style.boxShadow=`0 12px 32px ${c.color}33`; }}
              onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 4px 22px rgba(0,0,0,0.06)"; }}
            >
              <div style={{ fontSize:46, marginBottom:12, display:"inline-block", animation:`float 4s ease-in-out ${i*.5}s infinite` }}>{c.icon}</div>
              <div style={{ background:`${c.color}18`, color:c.color, fontSize:11, fontWeight:800, padding:"3px 12px", borderRadius:99, display:"inline-block", marginBottom:10 }}>{c.age}</div>
              <h3 style={{ fontFamily:"'Fredoka One',cursive", fontSize:21, color:T.navy, marginBottom:8 }}>{c.title}</h3>
              <p style={{ color:"#666", fontSize:14, lineHeight:1.6, marginBottom:14 }}>{c.desc}</p>
              <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:`${c.color}15`, color:c.color, fontWeight:800, fontSize:12, padding:"6px 14px", borderRadius:99, border:`1.5px solid ${c.color}33` }}>
                View Modules ✦
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Course Modal */}
      {active && (
        <Modal onClose={() => setActiveModal(null)}>
          <div style={{ textAlign:"center", marginBottom:24 }}>
            <div style={{ fontSize:52, marginBottom:8 }}>{active.icon}</div>
            <div style={{ background:`${active.color}15`, color:active.color, fontSize:12, fontWeight:800, padding:"4px 14px", borderRadius:99, display:"inline-block", marginBottom:10 }}>{active.age}</div>
            <h2 style={{ fontFamily:"'Fredoka One',cursive", fontSize:26, color:T.navy, marginBottom:6 }}>{active.title}</h2>
            <p style={{ color:"#6B7280", fontSize:14, lineHeight:1.6 }}>{active.desc}</p>
          </div>
          <div style={{ background:`${active.color}08`, borderRadius:18, padding:20, border:`2px solid ${active.color}20` }}>
            <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:16, color:T.navy, marginBottom:14 }}>📚 What's Included</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {active.modules.map((m, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10, background:T.white, borderRadius:12, padding:"10px 14px", boxShadow:"0 1px 6px rgba(0,0,0,0.04)" }}>
                  <div style={{ width:24, height:24, borderRadius:"50%", background:`linear-gradient(135deg,${active.color},${active.color}88)`, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:11, fontWeight:800, flexShrink:0 }}>{i+1}</div>
                  <span style={{ fontWeight:700, fontSize:14, color:T.navy }}>{m}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop:22, textAlign:"center" }}>
            <Btn color={active.color} onClick={() => { setActiveModal(null); document.getElementById("contact").scrollIntoView({behavior:"smooth"}); }}>Book a Free Trial 🚀</Btn>
          </div>
        </Modal>
      )}
    </section>
  );
}

/* ════════════ ABOUT SECTION ════════════ */
function AboutSection() {
  const [showCreds, setShowCreds] = useState(false);

  const DEGREES = [
    { icon:"🎓", title:"PG Program in AI & ML", sub:"McCombs School of Business, University of Texas at Austin, USA" },
    { icon:"🎓", title:"M.Tech — Electronics", sub:"Engineering & Technology" },
    { icon:"🎓", title:"B.E. — E&TC", sub:"Electronics & Telecommunication Engineering" },
    { icon:"📚", title:"B.Ed.", sub:"Bachelor of Education" },
  ];

  const CERTS = [
    { icon:"🏛️", title:"Innovation Ambassador", sub:"Innovation Cell, Ministry of Education, India" },
    { icon:"📋", title:"LEAD with Project Management", sub:"Certified" },
    { icon:"🏫", title:"Competency Based Educator", sub:"CBSE, India" },
    { icon:"🚀", title:"School Innovation Ambassador", sub:"Ministry of Education, India" },
    { icon:"🌏", title:"Transformative Teaching for Inclusive Development", sub:"LearnX, Singapore" },
    { icon:"🛸", title:"National Space Innovation Challenge", sub:"NSIC" },
    { icon:"🔧", title:"ATL Unbox Tinkering Training", sub:"Atal Tinkering Labs" },
  ];

  return (
    <section id="about" style={{ background:T.purple, padding:"100px 40px" }}>
      <div style={{ maxWidth:1000, margin:"0 auto", display:"flex", gap:56, alignItems:"center", flexWrap:"wrap" }}>

        {/* Photo + badges */}
        <div style={{ flex:"0 0 300px", position:"relative" }}>
          <div style={{ width:270, height:270, borderRadius:"40% 60% 60% 40% / 50% 40% 60% 50%", background:`linear-gradient(135deg,${T.teal},${T.navy})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 20px 60px ${T.teal}44`, animation:"float 5s ease-in-out infinite" }}>
            <div style={{ width:270, height:270, borderRadius:"40% 60% 60% 40% / 50% 40% 60% 50%", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <img src={profilePic} alt="Divya Maheshwari" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            </div>
          </div>
          {/* Static badges */}
          {[{top:-18,right:-8,emoji:"🏆",label:"Top Tutor",color:T.yellow},{bottom:-8,right:28,emoji:"⭐",label:"4.9 Stars",color:T.pink}].map((b,i)=>(
            <div key={i} style={{ position:"absolute",top:b.top,bottom:b.bottom,right:b.right, background:T.white, borderRadius:14, padding:"9px 13px", display:"flex", alignItems:"center", gap:7, boxShadow:"0 4px 18px rgba(0,0,0,0.12)", border:`3px solid ${b.color}`, fontWeight:800, fontSize:13, color:T.navy, animation:`float 4s ease-in-out ${i}s infinite`, zIndex:2, whiteSpace:"nowrap" }}>
              <span style={{ fontSize:18 }}>{b.emoji}</span>{b.label}
            </div>
          ))}
          {/* Clickable Certified badge */}
          <div onClick={() => setShowCreds(true)} style={{ position:"absolute", top:"48%", left:-90, background:T.white, borderRadius:14, padding:"9px 13px", display:"flex", alignItems:"center", gap:7, boxShadow:"0 4px 18px rgba(0,0,0,0.12)", border:`3px solid ${T.green}`, fontWeight:800, fontSize:13, color:T.navy, animation:"float 4s ease-in-out 2s infinite", zIndex:2, whiteSpace:"nowrap", cursor:"pointer", transition:"transform .2s" }}
            onMouseEnter={e=>e.currentTarget.style.transform="scale(1.08)"}
            onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
          >
            <span style={{ fontSize:18 }}>🎓</span>Certified
            <span style={{ fontSize:10, background:T.green, color:"white", borderRadius:99, padding:"2px 7px", fontWeight:800 }}>VIEW</span>
          </div>
        </div>

        {/* Text */}
        <div style={{ flex:1, minWidth:280 }}>
          <div style={{ display:"inline-block", background:`${T.teal}18`, color:T.teal, fontFamily:"'Fredoka One',cursive", padding:"6px 20px", borderRadius:99, fontSize:14, marginBottom:14 }}>Meet Your Mentor</div>
          <h2 style={{ fontFamily:"'Fredoka One',cursive", fontSize:"clamp(26px,4vw,42px)", color:T.navy, marginBottom:6 }}>
            Hi! I'm <span style={{ color:T.orange }}>Divya Maheshwari</span> 👋
          </h2>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
            {["🎓 Double Master's","📍 UT Austin, USA","👩‍🏫 13+ Years Teaching","👧 50+ Students"].map(tag => (
              <span key={tag} style={{ background:"rgba(255,255,255,0.15)", color:T.white, fontSize:12, fontWeight:700, padding:"4px 12px", borderRadius:99 }}>{tag}</span>
            ))}
          </div>
          <p style={{ color:T.white, fontSize:15, lineHeight:1.8, marginBottom:14 }}>
            Engineer, educator, and the person who will make your child say <em>"Coding is actually SO cool."</em> With a Post-Graduate program in AI & ML from the <strong style={{color:T.yellow}}>University of Texas at Austin</strong> and 13+ years of teaching experience, I've had the privilege of watching curious kids transform into confident creators. 🧠
          </p>
          <p style={{ color:T.white, fontSize:15, lineHeight:1.8, marginBottom:14 }}>
            I started DibsOnAI with one belief: <strong style={{color:T.yellow}}>every child deserves to learn like a builder, not a listener.</strong> Schools are great — but they rarely hand kids a problem and say <em>"now go invent the solution."</em> That's exactly what we do here.
          </p>
          <p style={{ color:T.white, fontSize:15, lineHeight:1.8, marginBottom:22 }}>
            We are living through the most significant technological shift in human history. <strong style={{color:T.yellow}}>AI isn't coming — it's already here.</strong> The children of today won't just use these tools — <strong style={{color:T.yellow}}>they will build them.</strong> Every DibsOnAI session ends with something real your child actually made. 🏆
          </p>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:18 }}>
            {[["🧒","Kid-First"],["🎮","Learn by Building"],["💬","Live 1-on-1"]].map(([icon,label])=>(
              <div key={label} style={{ display:"flex", alignItems:"center", gap:8, background:T.bg, padding:"10px 18px", borderRadius:99, fontWeight:700, fontSize:14, color:T.navy }}>{icon} {label}</div>
            ))}
          </div>
          <div onClick={() => setShowCreds(true)} style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.12)", border:"2px solid rgba(255,255,255,0.25)", color:T.white, padding:"10px 20px", borderRadius:99, fontWeight:700, fontSize:13, cursor:"pointer", transition:"all .2s" }}
            onMouseEnter={e=>{ e.currentTarget.style.background="rgba(255,255,255,0.22)"; }}
            onMouseLeave={e=>{ e.currentTarget.style.background="rgba(255,255,255,0.12)"; }}
          >
            🎓 View Full Credentials & Certifications
          </div>
        </div>
      </div>

      {/* Credentials Modal */}
      {showCreds && (
        <Modal onClose={() => setShowCreds(false)}>
          <div style={{ textAlign:"center", marginBottom:24 }}>
            <div style={{ fontSize:48, marginBottom:8 }}>🎓</div>
            <h2 style={{ fontFamily:"'Fredoka One',cursive", fontSize:26, color:T.navy, marginBottom:4 }}>Divya Maheshwari</h2>
            <p style={{ color:"#6B7280", fontSize:13 }}>Founder, DibsOnAI · Engineer · Educator</p>
          </div>

          <div style={{ marginBottom:20 }}>
            <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:16, color:T.navy, marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>🎓 Academic Degrees</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {DEGREES.map((d,i) => (
                <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:12, background:`${T.teal}08`, borderRadius:14, padding:"12px 16px", border:`1.5px solid ${T.teal}20` }}>
                  <span style={{ fontSize:20 }}>{d.icon}</span>
                  <div>
                    <div style={{ fontWeight:800, fontSize:14, color:T.navy }}>{d.title}</div>
                    <div style={{ fontSize:12, color:"#6B7280", marginTop:2 }}>{d.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:16, color:T.navy, marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>🏅 Certifications</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {CERTS.map((c,i) => (
                <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:12, background:`${T.orange}08`, borderRadius:14, padding:"12px 16px", border:`1.5px solid ${T.orange}20` }}>
                  <span style={{ fontSize:20 }}>{c.icon}</span>
                  <div>
                    <div style={{ fontWeight:800, fontSize:14, color:T.navy }}>{c.title}</div>
                    <div style={{ fontSize:12, color:"#6B7280", marginTop:2 }}>{c.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p style={{ textAlign:"center", fontSize:12, color:"#9CA3AF", marginTop:20 }}>
            ✅ Verified credentials available on request
          </p>
        </Modal>
      )}
    </section>
  );
}

/* ════════════ HOMEPAGE ════════════ */
function Homepage({ setScreen }) {
  return (
    <div style={{ background:T.bg }}>
      {/* HERO */}
      <section id="home" style={{ minHeight:"100vh", background:T.navy, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"visible", paddingTop:80, paddingBottom:0 }}>
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

      </section>

      {/* WAVE: Hero → Courses */}
      <svg viewBox="0 0 1440 70" xmlns="http://www.w3.org/2000/svg" style={{ display:"block", marginTop:-2 }}>
        <path fill="#1A1A5E" d="M0,0 L1440,0 L1440,35 C1200,65 960,10 720,40 C480,65 240,15 0,40 Z"/>
        <path fill="#FF1493" d="M0,40 C240,15 480,65 720,40 C960,10 1200,65 1440,35 L1440,70 L0,70 Z"/>
      </svg>

      {/* COURSES MODAL */}
      <CoursesSection setScreen={setScreen} />

      {/* WAVE: Courses → About */}
      <svg viewBox="0 0 1440 70" xmlns="http://www.w3.org/2000/svg" style={{ display:"block", marginTop:-2 }}>
        <path fill="#FF1493" d="M0,0 L1440,0 L1440,35 C1200,65 960,10 720,40 C480,65 240,15 0,40 Z"/>
        <path fill="#7B5EA7" d="M0,40 C240,15 480,65 720,40 C960,10 1200,65 1440,35 L1440,70 L0,70 Z"/>
      </svg>

      {/* ABOUT */}
      <AboutSection />

      {/* WAVE: About → Contact */}
      <svg viewBox="0 0 1440 50" xmlns="http://www.w3.org/2000/svg" style={{ display:"block", marginTop:-2 }}>
        <path fill="#7B5EA7" d="M0,0 L1440,0 L1440,25 Q720,55 0,25 Z"/>
        <path fill="#FFD93D" d="M0,25 Q720,55 1440,25 L1440,50 L0,50 Z"/>
      </svg>

      {/* CONTACT */}
      <section id="contact" style={{ background:T.yellow, padding:"100px 40px" }}>
        <div style={{ maxWidth:660, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:44 }}>
            <div style={{ display:"inline-block", background:`${T.pink}18`, color:T.pink, fontFamily:"'Fredoka One',cursive", padding:"6px 20px", borderRadius:99, fontSize:14, marginBottom:14 }}>Let's Connect!</div>
            <h2 style={{ fontFamily:"'Fredoka One',cursive", fontSize:"clamp(26px,4vw,46px)", color:"#1C1C1C" }}>Book a <span style={{ color:T.orange }}>Free Trial</span> 🎯</h2>
            <p style={{ color:"#777", fontSize:15 }}>No commitment — just 30 mins of pure AI fun for your kid!</p>
          </div>
          <ContactForm />
        </div>
      </section>

      {/* WAVE: Contact → Footer */}
      <svg viewBox="0 0 1440 50" xmlns="http://www.w3.org/2000/svg" style={{ display:"block", marginTop:-2 }}>
        <path fill="#FFD93D" d="M0,0 L1440,0 L1440,25 Q720,55 0,25 Z"/>
        <path fill="#1A1A5E" d="M0,25 Q720,55 1440,25 L1440,50 L0,50 Z"/>
      </svg>


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
  {/* Social Icons */}
  <div style={{ display:"flex", gap:10, marginTop:16 }}>
    {[
      { href:"https://www.instagram.com/dibsonai/", label:"Instagram", bg:"#E1306C", svg:<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg> },
      { href:"https://www.linkedin.com/company/dibsonai/", label:"LinkedIn", bg:"#0A66C2", svg:<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg> },
      { href:"https://wa.me/917217890305", label:"WhatsApp", bg:"#25D366", svg:<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg> },
    ].map(({ href, label, bg, svg }) => (
      <a key={label} href={href} target="_blank" rel="noreferrer" title={label}
        style={{ width:38, height:38, borderRadius:"50%", background:bg, display:"flex", alignItems:"center", justifyContent:"center", transition:"transform .2s, opacity .2s", opacity:0.9 }}
        onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.opacity="1"; }}
        onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.opacity="0.9"; }}
      >{svg}</a>
    ))}
  </div>
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
            <a href="mailto:dibsonai@gmail.com" style={{ display:"block", fontSize:14, marginBottom:7, color:"rgba(255,255,255,.75)", textDecoration:"none" }}
              onMouseEnter={e=>e.target.style.color=T.yellow} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.75)"}>📧 infodibsonai@gmail.com</a>
            <a href="https://wa.me/917217890305" target="_blank" rel="noreferrer" style={{ display:"block", fontSize:14, marginBottom:7, color:"rgba(255,255,255,.75)", textDecoration:"none" }}
              onMouseEnter={e=>e.target.style.color=T.yellow} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.75)"}>💬 WhatsApp +917217890305</a>
            <div style={{ fontSize:14, color:"rgba(255,255,255,.75)" }}>🌍 Online · Worldwide</div>
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
      <div className="contact-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
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
            <div className="student-detail-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
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
            <div className="student-detail-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
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
      <div className="student-detail-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
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
