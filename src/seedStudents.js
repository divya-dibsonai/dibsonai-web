// seedStudents.js
// ─────────────────────────────────────────────────────────────
// Run this ONCE to create all student accounts in Firebase.
// After running, DELETE or comment out the call to seedStudents().
// ─────────────────────────────────────────────────────────────

import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA-EcyqqQGm_o1LH85nzljXmT6X2DhTXWA",
  authDomain: "dibsonai.firebaseapp.com",
  projectId: "dibsonai",
  storageBucket: "dibsonai.firebasestorage.app",
  messagingSenderId: "32265647057",
  appId: "1:32265647057:web:86436d2de86dac3ff9a6f0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

const STUDENTS = [
  {
    email: "aanya@student.com", password: "pass123",
    name: "Aanya S.", avatar: "AS", subject: "Python & AI",
    level: "Intermediate", streak: 12, progress: 72,
    nextSession: "Today, 4:00 PM", sessions: 24, color: "#0ABFBC",
    badges: ["🔥","🏆","⭐"],
    homework: ["Build a calculator in Python","Watch: Intro to Neural Networks"],
    milestones: ["Variables","Functions","OOP","APIs","ML Intro","Neural Nets","Projects"],
    completedIdx: 5
  },
  {
    email: "leo@student.com", password: "pass123",
    name: "Leo M.", avatar: "LM", subject: "Web Magic",
    level: "Beginner", streak: 5, progress: 38,
    nextSession: "Tomorrow, 2:00 PM", sessions: 10, color: "#FF1493",
    badges: ["🌟","🎯"],
    homework: ["Style a page with Flexbox","JS Quiz on MDN"],
    milestones: ["HTML/CSS","JS Basics","DOM","Python Intro","ML Concepts"],
    completedIdx: 1
  },
  {
    email: "priya@student.com", password: "pass123",
    name: "Priya N.", avatar: "PN", subject: "AI Adventures",
    level: "Advanced", streak: 21, progress: 91,
    nextSession: "Wed, 11:00 AM", sessions: 41, color: "#FF6B35",
    badges: ["🔥","🏆","🎖️","⭐","🚀"],
    homework: ["Fine-tune GPT-2","Read: Attention is All You Need"],
    milestones: ["Python Adv","ML Theory","PyTorch","Transformers","LLMs","Fine-tuning","RAG","Deploy"],
    completedIdx: 7
  },
  {
    email: "sam@student.com", password: "pass123",
    name: "Sam O.", avatar: "SO", subject: "Python Basics",
    level: "Beginner", streak: 3, progress: 22,
    nextSession: "Thu, 5:00 PM", sessions: 7, color: "#7B5EA7",
    badges: ["🌟"],
    homework: ["Complete variables worksheet","Print your name 10 ways"],
    milestones: ["Variables","Functions","Arrays","DOM","Events"],
    completedIdx: 1
  },
  {
    email: "yuki@student.com", password: "pass123",
    name: "Yuki T.", avatar: "YT", subject: "Prompt Eng.",
    level: "Intermediate", streak: 9, progress: 60,
    nextSession: "Fri, 3:00 PM", sessions: 18, color: "#4CAF82",
    badges: ["🔥","🎯","⭐"],
    homework: ["Write 5 creative AI prompts","Summarise: Chain-of-thought"],
    milestones: ["Basics","Zero-shot","Few-shot","Chain-of-thought","Agents","Tools","Eval"],
    completedIdx: 4
  },
];

export async function seedStudents() {
  console.log("🌱 Starting student seeding...");
  for (const student of STUDENTS) {
    const { password, ...profile } = student;
    try {
      const cred = await createUserWithEmailAndPassword(auth, student.email, password);
      await setDoc(doc(db, "students", cred.user.uid), profile);
      console.log(`✅ Created: ${student.email}`);
    } catch (e) {
      if (e.code === "auth/email-already-in-use") {
        console.log(`⚠️  Already exists (skipped): ${student.email}`);
      } else {
        console.error(`❌ Error for ${student.email}:`, e.message);
      }
    }
  }
  console.log("🎉 Seeding complete!");
}
