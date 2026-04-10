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

  if (tab === "rsvp")   window.renderRsvpTab();
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
    sessionStorage.setItem("guestData", JSON.stringify(currentGuest));
    errorEl.classList.add("hidden");
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("main-screen").classList.remove("hidden");

    // Pre-fill RSVP name if already set
    if (currentGuest.name) {
      document.getElementById("rsvp-name").value = currentGuest.name;
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

// ─── RSVP CONFIG ──────────────────────────────
const RSVP_DEADLINE   = new Date("2026-04-20T23:59:59-04:00");
const MAX_IN_PERSON   = 10;

function isDeadlinePassed() { return new Date() > RSVP_DEADLINE; }

// ─── RSVP TAB RENDER ──────────────────────────
// Called when switching to RSVP tab or after login
window.renderRsvpTab = async function() {
  const formWrap      = document.getElementById("rsvp-form-wrap");
  const confirmedWrap = document.getElementById("rsvp-confirmed");
  const deadlineEl    = document.getElementById("rsvp-deadline-msg");
  const errEl         = document.getElementById("rsvp-error");

  errEl.classList.add("hidden");

  // Always hide change button after deadline
  const changeBtn = document.getElementById("change-rsvp-btn");
  if (changeBtn) changeBtn.style.display = isDeadlinePassed() ? "none" : "inline-block";

  // Deadline passed — lock the form
  if (isDeadlinePassed()) {
    formWrap.classList.add("hidden");
    confirmedWrap.classList.add("hidden");
    deadlineEl.classList.remove("hidden");
    return;
  }

  // Guest has already RSVPed — show confirmation with change option
  if (currentGuest.status && currentGuest.status !== "pending") {
    showRsvpConfirmed(currentGuest.status);
    return;
  }

  // Default: show the form
  formWrap.classList.remove("hidden");
  confirmedWrap.classList.add("hidden");
  deadlineEl.classList.add("hidden");
};

// ─── RSVP SUBMISSION ──────────────────────────
window.submitRsvp = async function() {
  const name   = document.getElementById("rsvp-name").value.trim();
  const status = document.querySelector('input[name="rsvp-status"]:checked')?.value;
  const errEl  = document.getElementById("rsvp-error");

  if (isDeadlinePassed()) {
    errEl.textContent = "The RSVP deadline has passed. Please contact Paris directly.";
    errEl.classList.remove("hidden");
    return;
  }
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

  // Check ticket cap for in-person (exclude current guest's existing status to allow changes)
  if (status === "confirmed") {
    // Block virtual guests from self-upgrading to in-person
    if (currentGuest.status === "virtual") {
      errEl.textContent = "You're currently registered as a virtual attendee. To change to in-person, please contact Paris directly as this affects ticket allocation.";
      errEl.classList.remove("hidden");
      return;
    }

    const snap = await getDocs(collection(db, "guests"));
    let inPersonCount = 0;
    snap.forEach(d => {
      const g = d.data();
      if (d.id !== currentGuest.code && g.status === "confirmed") inPersonCount++;
    });
    if (inPersonCount >= MAX_IN_PERSON) {
      errEl.textContent = "Sorry, all in-person tickets have been allocated. You can still attend virtually!";
      errEl.classList.remove("hidden");
      return;
    }
  }

  errEl.classList.add("hidden");

  try {
    await updateDoc(doc(db, "guests", currentGuest.code), {
      name, status, rsvpedAt: serverTimestamp()
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

// ─── CHANGE RSVP ──────────────────────────────
window.changeRsvp = function() {
  if (isDeadlinePassed()) {
    document.getElementById("rsvp-confirmed").classList.add("hidden");
    document.getElementById("rsvp-deadline-msg").classList.remove("hidden");
    return;
  }

  document.getElementById("rsvp-confirmed").classList.add("hidden");
  document.getElementById("rsvp-deadline-msg").classList.add("hidden");
  document.getElementById("rsvp-form-wrap").classList.remove("hidden");

  // Pre-select current status
  const radio = document.querySelector(`input[name="rsvp-status"][value="${currentGuest.status}"]`);
  if (radio) radio.checked = true;

  // If currently virtual, disable in-person option and show note
  const inPersonRadio = document.querySelector('input[name="rsvp-status"][value="confirmed"]');
  const inPersonNote  = document.getElementById("inperson-note");
  const inPersonLabel = document.getElementById("option-confirmed");
  if (currentGuest.status === "virtual") {
    inPersonRadio.disabled = true;
    inPersonLabel.style.opacity = "0.4";
    inPersonLabel.style.cursor  = "not-allowed";
    inPersonNote.classList.remove("hidden");
  } else {
    inPersonRadio.disabled = false;
    inPersonLabel.style.opacity = "";
    inPersonLabel.style.cursor  = "";
    inPersonNote.classList.add("hidden");
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

  // Show child section only for in-person confirmed guests
  const childSection = document.getElementById("child-section");
  if (status === "confirmed" && !isDeadlinePassed()) {
    childSection.classList.remove("hidden");
    // If child already linked, show confirmed state
    if (currentGuest.linkedChild) {
      document.getElementById("child-form").classList.add("hidden");
      document.getElementById("child-confirmed").classList.remove("hidden");
      document.getElementById("child-confirmed-name").textContent =
        `${currentGuest.linkedChild.name} · age ${currentGuest.linkedChild.age}`;
    }
  } else {
    childSection.classList.add("hidden");
  }
}

// ─── CHILD AGE WATCHER ────────────────────────
document.getElementById("child-age")?.addEventListener("input", function() {
  const age = parseInt(this.value);
  const codeWrap = document.getElementById("child-code-wrap");
  const freeNote = document.getElementById("child-free-note");
  if (isNaN(age)) { codeWrap.classList.add("hidden"); freeNote.classList.add("hidden"); return; }
  if (age <= 2)  { codeWrap.classList.add("hidden"); freeNote.classList.remove("hidden"); }
  else           { codeWrap.classList.remove("hidden"); freeNote.classList.add("hidden"); }
});

// ─── ADD CHILD GUEST ──────────────────────────
window.addChild = async function() {
  const name   = document.getElementById("child-name").value.trim();
  const age    = parseInt(document.getElementById("child-age").value);
  const code   = document.getElementById("child-code")?.value.trim().toUpperCase();
  const errEl  = document.getElementById("child-error");

  errEl.classList.add("hidden");

  if (!name) { errEl.textContent = "Please enter the child's name."; errEl.classList.remove("hidden"); return; }
  if (isNaN(age) || age < 0) { errEl.textContent = "Please enter a valid age."; errEl.classList.remove("hidden"); return; }

  // Under 2 — no ticket needed
  if (age <= 2) {
    currentGuest.linkedChild = { name, age, needsTicket: false };
    await updateDoc(doc(db, "guests", currentGuest.code), { linkedChild: { name, age, needsTicket: false } });
    showChildConfirmed(name, age);
    return;
  }

  // Over 2 — verify their invite code
  if (!code) { errEl.textContent = "Please enter the child's invite code."; errEl.classList.remove("hidden"); return; }

  try {
    const snap = await getDoc(doc(db, "guests", code));
    if (!snap.exists()) {
      errEl.textContent = "That invite code doesn't match our guest list.";
      errEl.classList.remove("hidden");
      return;
    }
    if (code === currentGuest.code) {
      errEl.textContent = "That's your own invite code — please enter the child's code.";
      errEl.classList.remove("hidden");
      return;
    }

    // Link child to parent
    await updateDoc(doc(db, "guests", code), { linkedTo: currentGuest.code, name, status: "confirmed" });
    await updateDoc(doc(db, "guests", currentGuest.code), { linkedChild: { name, age, code, needsTicket: true } });

    currentGuest.linkedChild = { name, age, code, needsTicket: true };
    showChildConfirmed(name, age);

  } catch (err) {
    console.error(err);
    errEl.textContent = "Something went wrong. Please try again.";
    errEl.classList.remove("hidden");
  }
};

function showChildConfirmed(name, age) {
  document.getElementById("child-form").classList.add("hidden");
  document.getElementById("child-confirmed").classList.remove("hidden");
  document.getElementById("child-confirmed-name").textContent = `${name} · age ${age}`;
}

// ─── TICKET DISPLAY ───────────────────────────
async function renderTicket() {
  if (!currentGuest) return;

  const pendingEl    = document.getElementById("ticket-pending-msg");
  const cardEl       = document.getElementById("ticket-card");
  const childCardEl  = document.getElementById("child-ticket-card");

  // Show ticket only if released by admin AND guest confirmed in person
  if (!currentGuest.ticketReleased || currentGuest.status !== "confirmed") {
    pendingEl.classList.remove("hidden");
    cardEl.classList.add("hidden");
    childCardEl.classList.add("hidden");
    return;
  }

  pendingEl.classList.add("hidden");
  cardEl.classList.remove("hidden");

  document.getElementById("ticket-name-display").textContent = currentGuest.name || "Guest";
  document.getElementById("ticket-id-display").textContent   = currentGuest.ticketId || currentGuest.code;

  // Generate QR code
  const qrData = `https://inevitableyellow.github.io/paris-graduation-2026/verify.html?id=${currentGuest.ticketId || currentGuest.code}`;
  generateQR("ticket-qr", qrData, currentGuest.officialTicketUrl, currentGuest.officialTicketType, "ticket-save-btns");

  // Child ticket — show if linked child with ticket and released
  if (currentGuest.linkedChild?.needsTicket && currentGuest.linkedChild?.code) {
    try {
      const childSnap = await getDoc(doc(db, "guests", currentGuest.linkedChild.code));
      if (childSnap.exists()) {
        const child = childSnap.data();
        if (child.ticketReleased) {
          childCardEl.classList.remove("hidden");
          document.getElementById("child-ticket-name-display").textContent = currentGuest.linkedChild.name;
          document.getElementById("child-ticket-id-display").textContent   = child.ticketId || currentGuest.linkedChild.code;
          const childQrData = `https://inevitableyellow.github.io/paris-graduation-2026/verify.html?id=${child.ticketId || currentGuest.linkedChild.code}`;
          generateQR("child-ticket-qr", childQrData, child.officialTicketUrl, child.officialTicketType, "child-ticket-save-btns");
        }
      }
    } catch (err) { console.error("Child ticket error:", err); }
  }
}

function generateQR(elementId, data, officialTicketUrl, officialTicketType, saveBtnId) {
  const wrap = document.getElementById(elementId);
  wrap.innerHTML = "";

  // Determine image id for save buttons
  const imgId = elementId + "-img";

  // If official ticket uploaded, show that instead of generated QR
  if (officialTicketUrl) {
    if (officialTicketType === "application/pdf") {
      wrap.innerHTML = `
        <a href="${officialTicketUrl}" target="_blank" class="btn-secondary" style="display:inline-block;margin-bottom:0.5rem;">
          View official ticket (PDF) →
        </a>
        <p style="font-size:11px;color:#999;margin-top:4px;">To save offline: open the PDF and save to your device.</p>`;
    } else {
      const img = document.createElement("img");
      img.src = officialTicketUrl;
      img.id  = imgId;
      img.alt = "Official ticket";
      img.crossOrigin = "anonymous";
      img.style.cssText = "width:200px;height:auto;border-radius:8px;display:block;margin:0 auto;";
      wrap.appendChild(img);
      // Show save buttons
      if (saveBtnId) document.getElementById(saveBtnId)?.classList.remove("hidden");
    }
    return;
  }

  // Fall back to generated QR
  const renderQR = () => {
    new QRCode(wrap, { text: data, width: 160, height: 160, colorDark: "#00274C", colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.H });
    // Tag the generated canvas/img for saving
    setTimeout(() => {
      const el = wrap.querySelector("canvas") || wrap.querySelector("img");
      if (el) el.id = imgId;
      if (saveBtnId) document.getElementById(saveBtnId)?.classList.remove("hidden");
    }, 200);
  };

  if (window.QRCode) {
    renderQR();
  } else {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    script.onload = renderQR;
    document.head.appendChild(script);
  }
}

// ─── SAVE / DOWNLOAD TICKET ───────────────────
window.saveTicketToPhotos = function(imgId) {
  const el = document.getElementById(imgId);
  if (!el) return;

  // Convert canvas or img to data URL
  let dataUrl;
  if (el.tagName === "CANVAS") {
    dataUrl = el.toDataURL("image/png");
  } else {
    const canvas = document.createElement("canvas");
    canvas.width  = el.naturalWidth  || el.width;
    canvas.height = el.naturalHeight || el.height;
    canvas.getContext("2d").drawImage(el, 0, 0);
    dataUrl = canvas.toDataURL("image/png");
  }

  // On iOS Safari, open in new tab (user long-presses to save)
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isIOS) {
    const win = window.open();
    win.document.write(`<img src="${dataUrl}" style="max-width:100%;"/>`);
    win.document.write('<p style="font-family:sans-serif;font-size:14px;color:#666;text-align:center;">Press and hold the image, then tap "Save to Photos"</p>');
    return;
  }

  // On Android/desktop, trigger download
  window.downloadTicket(imgId, "my-graduation-ticket");
};

window.downloadTicket = function(imgId, filename) {
  const el = document.getElementById(imgId);
  if (!el) return;

  let dataUrl;
  if (el.tagName === "CANVAS") {
    dataUrl = el.toDataURL("image/png");
  } else {
    const canvas = document.createElement("canvas");
    canvas.width  = el.naturalWidth  || el.width;
    canvas.height = el.naturalHeight || el.height;
    canvas.getContext("2d").drawImage(el, 0, 0);
    dataUrl = canvas.toDataURL("image/png");
  }

  const a = document.createElement("a");
  a.href     = dataUrl;
  a.download = `${filename || "ticket"}.png`;
  a.click();
};

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

// ─── PHOTO URLS STORE (for lightbox + download all) ──
let allPhotoUrls = [];
let lightboxIndex = 0;

async function loadPhotos() {
  const grid = document.getElementById("photo-grid");
  grid.innerHTML = "";
  allPhotoUrls = [];
  try {
    const snap = await getDocs(collection(db, "photos"));
    snap.forEach(d => {
      const url = d.data().url;
      allPhotoUrls.push(url);
      appendPhoto(url, allPhotoUrls.length - 1);
    });
    const dlBtn = document.getElementById("download-all-btn");
    if (allPhotoUrls.length > 0) dlBtn.classList.remove("hidden");
    else dlBtn.classList.add("hidden");
  } catch (err) {
    console.error("Failed to load photos:", err);
  }
}

function appendPhoto(url, index) {
  const grid = document.getElementById("photo-grid");
  const div  = document.createElement("div");
  div.className = "photo-item";
  div.style.cursor = "pointer";
  const img = document.createElement("img");
  img.src = url; img.loading = "lazy"; img.alt = "Graduation photo";
  div.appendChild(img);
  div.addEventListener("click", () => openLightbox(index ?? allPhotoUrls.length - 1));
  grid.appendChild(div);
}

// ─── LIGHTBOX ─────────────────────────────────
function openLightbox(index) {
  lightboxIndex = index;
  const lb = document.getElementById("lightbox");
  lb.style.display = "flex";
  document.body.style.overflow = "hidden";
  updateLightbox();
}

function updateLightbox() {
  document.getElementById("lightbox-img").src = allPhotoUrls[lightboxIndex];
  document.getElementById("lightbox-counter").textContent = `${lightboxIndex + 1} / ${allPhotoUrls.length}`;
}

window.closeLightbox = function() {
  document.getElementById("lightbox").style.display = "none";
  document.body.style.overflow = "";
};

window.lightboxNav = function(dir) {
  lightboxIndex = (lightboxIndex + dir + allPhotoUrls.length) % allPhotoUrls.length;
  updateLightbox();
};

window.downloadLightboxPhoto = function() {
  const url = allPhotoUrls[lightboxIndex];
  const a = document.createElement("a");
  a.href = url; a.download = `graduation-photo-${lightboxIndex + 1}.jpg`; a.target = "_blank"; a.click();
};

// Close lightbox on backdrop click
document.getElementById("lightbox")?.addEventListener("click", function(e) {
  if (e.target === this) window.closeLightbox();
});

// Keyboard navigation
document.addEventListener("keydown", e => {
  const lb = document.getElementById("lightbox");
  if (!lb || lb.style.display === "none") return;
  if (e.key === "ArrowRight") window.lightboxNav(1);
  if (e.key === "ArrowLeft")  window.lightboxNav(-1);
  if (e.key === "Escape")     window.closeLightbox();
});

// ─── DOWNLOAD ALL PHOTOS ──────────────────────
window.downloadAllPhotos = async function() {
  if (!allPhotoUrls.length) return;
  const btn = document.getElementById("download-all-btn");
  btn.textContent = "Downloading...";
  btn.disabled = true;

  for (let i = 0; i < allPhotoUrls.length; i++) {
    const a = document.createElement("a");
    a.href = allPhotoUrls[i]; a.download = `graduation-photo-${i + 1}.jpg`; a.target = "_blank";
    a.click();
    await new Promise(r => setTimeout(r, 500)); // stagger downloads
  }

  btn.textContent = "↓ Download all";
  btn.disabled = false;
};

// ─── SESSION RESTORE ─────────────────────────
// Restore session if user refreshes the page
const savedCode = sessionStorage.getItem("guestCode");
if (savedCode) {
  document.getElementById("invite-input").value = savedCode;
  window.verifyInvite();
}
