import { db, storage } from "./firebase.js";
import {
  doc, getDoc, setDoc, updateDoc, collection, getDocs, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  ref, uploadBytes, getDownloadURL, listAll
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// ─── STATE ───────────────────────────────────
let currentGuest = null; // { code, name, status, ticketId, ticketReleased }

// ─── COUNTDOWN ───────────────────────────────
const gradDate = new Date("2026-04-30T10:00:00-04:00");

function updateCountdown() {
  const diff = gradDate - new Date();
  if (diff <= 0) {
    document.getElementById("countdown").innerHTML =
      '<div style="color:var(--maize);font-family:var(--font-display);font-size:22px;font-style:italic;">Today is the day!</div>';
    return;
  }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  document.getElementById("cd-days").textContent = String(d).padStart(2, "0");
  document.getElementById("cd-hrs").textContent  = String(h).padStart(2, "0");
  document.getElementById("cd-min").textContent  = String(m).padStart(2, "0");
  document.getElementById("cd-sec").textContent  = String(s).padStart(2, "0");
}
updateCountdown();
setInterval(updateCountdown, 1000);

// ─── TAB SWITCHING ────────────────────────────
window.switchTab = function(tab) {
  document.querySelectorAll(".nav-btn").forEach((btn, i) => {
    btn.classList.toggle("active", ["info","rsvp","ticket","photos"][i] === tab);
  });
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  document.getElementById(`tab-${tab}`).classList.add("active");

  if (tab === "ticket") renderTicket();
  if (tab === "photos") loadPhotos();
};

// ─── INVITE CODE VERIFICATION ─────────────────
window.verifyInvite = async function() {
  const code = document.getElementById("invite-input").value.trim().toUpperCase();
  const errorEl = document.getElementById("invite-error");

  if (!code) {
    errorEl.textContent = "Please enter your invite code.";
    errorEl.classList.remove("hidden");
    return;
  }

  try {
    const snap = await getDoc(doc(db, "guests", code));
    if (!snap.exists()) {
      errorEl.textContent = "That code doesn't match our guest list. Please check and try again.";
      errorEl.classList.remove("hidden");
      return;
    }

    currentGuest = { code, ...snap.data() };
    sessionStorage.setItem("guestCode", code);

    errorEl.classList.add("hidden");
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("main-screen").classList.remove("hidden");

    // Pre-fill RSVP name if already set
    if (currentGuest.name) {
      document.getElementById("rsvp-name").value = currentGuest.name;
    }
    if (currentGuest.status && currentGuest.status !== "pending") {
      showRsvpConfirmed(currentGuest.status);
    }

  } catch (err) {
    console.error(err);
    errorEl.textContent = "Something went wrong. Please try again.";
    errorEl.classList.remove("hidden");
  }
};

// Allow Enter key on invite input
document.getElementById("invite-input").addEventListener("keydown", e => {
  if (e.key === "Enter") window.verifyInvite();
});

// ─── RSVP SUBMISSION ──────────────────────────
window.submitRsvp = async function() {
  const name   = document.getElementById("rsvp-name").value.trim();
  const status = document.querySelector('input[name="rsvp-status"]:checked')?.value;
  const errEl  = document.getElementById("rsvp-error");

  if (!name) {
    errEl.textContent = "Please enter your full name.";
    errEl.classList.remove("hidden");
    return;
  }
  if (!status) {
    errEl.textContent = "Please select your attendance.";
    errEl.classList.remove("hidden");
    return;
  }

  errEl.classList.add("hidden");

  try {
    await updateDoc(doc(db, "guests", currentGuest.code), {
      name,
      status,
      rsvpedAt: serverTimestamp()
    });

    currentGuest.name   = name;
    currentGuest.status = status;

    showRsvpConfirmed(status);

  } catch (err) {
    console.error(err);
    errEl.textContent = "Something went wrong saving your RSVP. Please try again.";
    errEl.classList.remove("hidden");
  }
};

function showRsvpConfirmed(status) {
  document.getElementById("rsvp-form-wrap").classList.add("hidden");
  document.getElementById("rsvp-confirmed").classList.remove("hidden");

  const msgs = {
    confirmed: "You're confirmed to attend in person. Your ticket will be available closer to graduation day — check the Ticket tab!",
    virtual:   "You're confirmed to watch the livestream. The stream link is on the Info tab.",
    pending:   "Got it — you're marked as undecided. You can update your RSVP any time.",
    declined:  "You're marked as unable to attend. We'll miss you there!"
  };

  document.getElementById("rsvp-success-msg").textContent = msgs[status] || "";
}

// ─── TICKET DISPLAY ───────────────────────────
function renderTicket() {
  if (!currentGuest) return;

  const pendingEl = document.getElementById("ticket-pending-msg");
  const cardEl    = document.getElementById("ticket-card");

  // Show ticket only if released by admin AND guest confirmed in person
  if (!currentGuest.ticketReleased || currentGuest.status !== "confirmed") {
    pendingEl.classList.remove("hidden");
    cardEl.classList.add("hidden");
    return;
  }

  pendingEl.classList.add("hidden");
  cardEl.classList.remove("hidden");

  document.getElementById("ticket-name-display").textContent = currentGuest.name || "Guest";
  document.getElementById("ticket-id-display").textContent   = currentGuest.ticketId || currentGuest.code;

  // Generate QR code pointing to ticket verification URL
  const qrData = `https://inevitableyellow.github.io/paris-graduation-2026/verify.html?id=${currentGuest.ticketId || currentGuest.code}`;
  const qrWrap = document.getElementById("ticket-qr");
  qrWrap.innerHTML = "";

  // Use QRCode.js from CDN
  const script = document.createElement("script");
  script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
  script.onload = () => {
    new QRCode(qrWrap, {
      text:   qrData,
      width:  160,
      height: 160,
      colorDark:  "#00274C",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
  };
  document.head.appendChild(script);
}

// ─── PHOTO UPLOAD ─────────────────────────────
window.handlePhotoUpload = async function(event) {
  const files = Array.from(event.target.files);
  if (!files.length || !currentGuest) return;

  const uploadingEl = document.getElementById("photo-uploading");
  uploadingEl.classList.remove("hidden");

  for (const file of files) {
    if (file.size > 10 * 1024 * 1024) {
      alert(`${file.name} is over 10MB and was skipped.`);
      continue;
    }
    try {
      const ext      = file.name.split(".").pop();
      const filename = `${Date.now()}_${currentGuest.code}.${ext}`;
      const storageRef = ref(storage, `photos/${filename}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, "photos"), {
        url,
        uploadedBy: currentGuest.name || currentGuest.code,
        uploadedAt: serverTimestamp()
      });

      appendPhoto(url);
    } catch (err) {
      console.error("Upload error:", err);
      alert("One photo failed to upload. Please try again.");
    }
  }

  uploadingEl.classList.add("hidden");
  event.target.value = "";
};

async function loadPhotos() {
  const grid = document.getElementById("photo-grid");
  grid.innerHTML = "";
  try {
    const snap = await getDocs(collection(db, "photos"));
    snap.forEach(doc => appendPhoto(doc.data().url));
  } catch (err) {
    console.error("Failed to load photos:", err);
  }
}

function appendPhoto(url) {
  const grid = document.getElementById("photo-grid");
  const div  = document.createElement("div");
  div.className = "photo-item";
  const img = document.createElement("img");
  img.src = url; img.loading = "lazy"; img.alt = "Graduation photo";
  div.appendChild(img);
  grid.appendChild(div);
}

// ─── SESSION RESTORE ─────────────────────────
// Restore session if user refreshes the page
const savedCode = sessionStorage.getItem("guestCode");
if (savedCode) {
  document.getElementById("invite-input").value = savedCode;
  window.verifyInvite();
}
