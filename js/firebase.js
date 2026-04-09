// ─────────────────────────────────────────────
//  FIREBASE CONFIG
//  Replace the values below with your own from
//  Firebase Console → Project Settings → General
//  → Your apps → SDK setup and configuration
// ─────────────────────────────────────────────

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyC_xOO38k0i4mouvvGc5ZT5DB0Yb14F8xc",
  authDomain: "paris-graduation-2026.firebaseapp.com",
  projectId: "paris-graduation-2026",
  storageBucket: "paris-graduation-2026.firebasestorage.app",
  messagingSenderId: "337432248682",
  appId: "1:337432248682:web:2c819048ecf3f5d2f22513",
  measurementId: "G-CYNED2LDG7"
};

const app = initializeApp(firebaseConfig);

export const db      = getFirestore(app);
export const storage = getStorage(app);
