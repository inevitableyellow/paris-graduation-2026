import { db, storage } from "./firebase.js";
import {
  doc, getDoc, setDoc, updateDoc, collection, getDocs, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  ref, uploadBytes, getDownloadURL, listAll
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// ─── STATE ───────────────────────────────────
let currentGuest = null;
let activeCeremonyView = "april30"; // for guests attending both ceremonies

// ─── CEREMONY CONFIG ─────────────────────────
const CEREMONIES = {
  april30: {
    date:            new Date("2026-04-30T10:00:00-04:00"),
    loginSub:        "April 30, 2026 · Ann Arbor, Michigan",
    meta:            "Thursday, April 30 · 10:00 AM – 12:00 PM EDT",
    venueName:       "Crisler Center",
    venueShort:      "Crisler Center, Ann Arbor",
    address:         "Crisler Center, 333 E Stadium Blvd, Ann Arbor, MI 48109",
    addressShort:    "333 E Stadium Blvd, Ann Arbor, MI",
    mapSrc:          "https://www.openstreetmap.org/export/embed.html?bbox=-83.75663280487062%2C42.260191605214274%2C-83.73706340789796%2C42.27238687338081&layer=mapnik",
    mapsApple:       "https://maps.apple.com/?address=333+E+Stadium+Blvd,+Ann+Arbor,+MI+48109&q=Crisler+Center&dirflg=d",
    mapsGoogle:      "https://www.google.com/maps/dir/?api=1&destination=Crisler+Center,+333+E+Stadium+Blvd,+Ann+Arbor,+MI+48109",
    calBtnLabel:     "April 30, 2026",
    calModalSub:     "Thursday, April 30 · 10:00 AM – 12:00 PM",
    calStartUTC:     "20260430T140000Z",
    calEndUTC:       "20260430T160000Z",
    livestreamHref:  "https://umsi.info/gradlive",
    livestreamText:  "Watch the livestream → umsi.info/gradlive",
    ticketDate:      "Thursday, April 30, 2026",
    dinnerTime:      "3:15 PM",
    dinnerAddress:   "Aventura, 303 Detroit St, Ann Arbor, MI 48104",
    dinnerVenue:     "Aventura",
    dinnerShort:     "303 Detroit St, Ann Arbor, MI",
    dinnerMenuHref:  "https://www.aventuraannarbor.com/menu",
    dinnerApple:     "https://maps.apple.com/?address=303+Detroit+St,+Ann+Arbor,+MI+48104&q=Aventura&dirflg=d",
    dinnerGoogle:    "https://www.google.com/maps/dir/?api=1&destination=Aventura,+303+Detroit+St,+Ann+Arbor,+MI+48104",
    dresscode:       "Smart casual is a safe bet, but honestly, wear whatever makes you feel your best! It's a celebration! 🎉 Keep in mind that Crisler Center can vary in temperature depending on where you're sitting, so layers are your friend. And since it's April in Ann Arbor, a light jacket for outdoors is always a good idea.",
    parking:         `Free parking is available in the Blue Lot surrounding Crisler Center (lots SC4, SC5, SC6, SC7), with entrances on Stadium Boulevard and East Keech Avenue / Greene Street.<br><br>ADA parking is available outside the Northeast entrance on a first-come, first-served basis — a state-issued disability placard is required.<br><br>Note: University parking permits are not valid for this event. Please leave bags in your vehicle as Crisler Center has a strict no-bag policy.<br><br><a href="https://mgoblue.com/documents/2022/9/28/20220928-gen-crisler-center-parking-non-basketball.pdf" target="_blank" style="color:var(--maize);text-decoration:none;border-bottom:0.5px solid rgba(255,203,5,0.3);">View parking map (PDF) →</a>`,
    prohibitedLabel: "Prohibited items at Crisler Center",
    prohibited:      `The following are strictly prohibited inside all U-M commencement venues:<ul style="margin-top:0.6rem;padding-left:1.25rem;color:var(--text-muted);font-size:13px;display:flex;flex-direction:column;gap:3px;"><li>All bags (including backpacks and purses)</li><li>Aerosol and spray cans</li><li>Containers of any kind (coolers, thermoses, cups, bottles, cans, flasks)</li><li>Animals (except service animals)</li><li>Signs and flags with or without flagpoles</li><li>Food of any kind</li><li>Alcoholic beverages</li><li>Noisemakers (whistles, air horns, vuvuzelas, etc.)</li><li>Strollers</li><li>Video cameras, tripods, selfie sticks, cameras with lens longer than 6 inches</li><li>Weapons</li><li>Cigarettes, vapes, e-cigarettes, and all smoking devices</li></ul>`,
    weatherLat:      42.2808,
    weatherLng:      -83.7430,
    weatherDate:     "2026-04-30",
    weatherCity:     "Ann Arbor",
  },
  may2: {
    date:            new Date("2026-05-02T10:00:00-04:00"),
    loginSub:        "May 2, 2026 · Ann Arbor, Michigan",
    meta:            "Saturday, May 2 · 10:00 AM – 12:00 PM EDT",
    venueName:       "Michigan Stadium",
    venueShort:      "Michigan Stadium, Ann Arbor",
    address:         "Michigan Stadium, 1201 S Main St, Ann Arbor, MI 48104",
    addressShort:    "1201 S Main St, Ann Arbor, MI",
    mapSrc:          "https://www.openstreetmap.org/export/embed.html?bbox=-83.75018775463105%2C42.26538185561386%2C-83.73061835765839%2C42.27757433456714&layer=mapnik",
    mapsApple:       "https://maps.apple.com/?address=1201+S+Main+St,+Ann+Arbor,+MI+48104&q=Michigan+Stadium&dirflg=d",
    mapsGoogle:      "https://www.google.com/maps/dir/?api=1&destination=Michigan+Stadium,+1201+S+Main+St,+Ann+Arbor,+MI+48104",
    calBtnLabel:     "May 2, 2026",
    calModalSub:     "Saturday, May 2 · 10:00 AM – 12:00 PM",
    calStartUTC:     "20260502T140000Z",
    calEndUTC:       "20260502T160000Z",
    livestreamHref:  "https://commencement.umich.edu",
    livestreamText:  "Watch the livestream → commencement.umich.edu",
    ticketDate:      "Saturday, May 2, 2026",
    dinnerTime:      "3:45 PM",
    dinnerAddress:   "Bellflower, 209 Pearl St, Ypsilanti, MI 48197",
    dinnerVenue:     "Bellflower",
    dinnerShort:     "209 Pearl St, Ypsilanti, MI",
    dinnerMenuHref:  "https://bellflowerypsi.com/dinner/",
    dinnerApple:     "https://maps.apple.com/?address=209+Pearl+St,+Ypsilanti,+MI+48197&q=Bellflower&dirflg=d",
    dinnerGoogle:    "https://www.google.com/maps/dir/?api=1&destination=Bellflower,+209+Pearl+St,+Ypsilanti,+MI+48197",
    dresscode:       "This ceremony is outdoors at Michigan Stadium, so please dress for the weather! Smart casual is always a safe bet, but layers are your friend for a May morning in Ann Arbor. A light jacket is strongly recommended.",
    parking:         `There is no open public parking at Michigan Stadium. Guests are encouraged to use the <strong style="color:var(--white);">complimentary shuttle service</strong> running from campus lots and area hotels.<br><br>Shuttle to stadium: <strong style="color:var(--white);">7:30 AM – 11:00 AM.</strong> Return shuttles from stadium: <strong style="color:var(--white);">12:00 PM – 1:30 PM.</strong> All buses are wheelchair-accessible. Expect 10–30 min waits at peak times.<br><br>Campus parking structures (Thayer, Fletcher, Hill, Thompson, Palmer-Blue Area) open at 9:00 AM with suspended enforcement. Surface lots on Central, North, and South Campuses are also available.<br><br>ADA parking is available on the north side of the stadium for vehicles with state-issued disability plates or tags.<br><br><a href="https://commencement.umich.edu/ceremony-venue-details/spring-commencement/travel-parkingsc/" target="_blank" style="color:var(--maize);text-decoration:none;border-bottom:0.5px solid rgba(255,203,5,0.3);">Full parking & shuttle info →</a>`,
    prohibitedLabel: "Prohibited items at Michigan Stadium",
    prohibited:      `The following are strictly prohibited at Michigan Stadium:<ul style="margin-top:0.6rem;padding-left:1.25rem;color:var(--text-muted);font-size:13px;display:flex;flex-direction:column;gap:3px;"><li>No purses, bags, wristlets, or cases of any size (medical exceptions only — permitted items must be in a clear plastic quart- or gallon-size bag)</li><li>Strollers</li><li>Outside food or beverages (concession stands open, cashless only)</li><li>Alcoholic beverages</li><li>Animals (except service animals)</li><li>Signs, flags, and banners</li><li>Noisemakers</li><li>Weapons of any kind</li><li>Cigarettes, vapes, and all smoking devices</li></ul><br>Enter through Gates 2, 4, 8, 9, or 10. Stadium opens at <strong style="color:var(--white);">8:00 AM</strong> — be seated by <strong style="color:var(--white);">8:30 AM</strong> to see the graduate procession.`,
    weatherLat:      42.2808,
    weatherLng:      -83.7430,
    weatherDate:     "2026-05-02",
    weatherCity:     "Ann Arbor",
  },
};

function getCeremony() {
  const key = currentGuest?.ceremony === "both" ? activeCeremonyView : currentGuest?.ceremony;
  return CEREMONIES[key] || CEREMONIES.april30;
}

window.switchCeremonyView = function(key) {
  activeCeremonyView = key;
  ["april30", "may2"].forEach(k => {
    const btn = document.getElementById(`csw-${k}`);
    if (!btn) return;
    btn.style.background = k === key ? "var(--maize)" : "transparent";
    btn.style.color      = k === key ? "#00274C"      : "rgba(255,255,255,0.5)";
    btn.style.fontWeight = k === key ? "500"           : "400";
  });
  renderInfoTab();
  updateCountdown();
  loadWeather();
};

// ─── COUNTDOWN ───────────────────────────────
function updateCountdown() {
  const diff = getCeremony().date - new Date();
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

// ─── RENDER INFO TAB ─────────────────────────
function renderInfoTab() {
  const c = getCeremony();
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  const setHTML = (id, val) => { const el = document.getElementById(id); if (el) el.innerHTML = val; };
  const setAttr = (id, attr, val) => { const el = document.getElementById(id); if (el) el.setAttribute(attr, val); };

  // Login screen
  set("login-sub", c.loginSub);

  // Ceremony block
  set("info-meta", c.meta);
  set("info-address", c.address);
  setAttr("info-map-iframe", "src", c.mapSrc);

  // Maps modal
  set("maps-modal-venue", c.venueName);
  set("maps-modal-address", c.addressShort);
  setAttr("maps-apple", "href", c.mapsApple);
  setAttr("maps-google", "href", c.mapsGoogle);

  // Livestream
  const ls = document.getElementById("info-livestream");
  if (ls) { ls.href = c.livestreamHref; ls.textContent = c.livestreamText; }

  // Calendar button + modal
  set("cal-btn-label", c.calBtnLabel);
  set("cal-modal-subtitle", c.calModalSub);

  // Schedule timeline
  set("tl-venue-start", c.venueName);
  set("tl-dinner-time", c.dinnerTime);
  set("tl-dinner-address", c.dinnerAddress);
  const dinnerMenu = document.getElementById("tl-dinner-menu");
  if (dinnerMenu) dinnerMenu.href = c.dinnerMenuHref;

  // Dinner maps modal
  set("dinner-modal-venue", c.dinnerVenue);
  set("dinner-modal-address", c.dinnerShort);
  setAttr("dinner-maps-apple", "href", c.dinnerApple);
  setAttr("dinner-maps-google", "href", c.dinnerGoogle);

  // Info cards
  setHTML("info-parking", c.parking);
  set("info-dresscode", c.dresscode);
  set("info-prohibited-label", c.prohibitedLabel);
  setHTML("info-prohibited", c.prohibited);

  // Ticket tab
  set("ticket-date-display", c.ticketDate);
  set("ticket-venue-display", c.venueShort);
  set("child-ticket-date-display", c.ticketDate);
  set("child-ticket-venue-display", c.venueShort);
}


// ─── TAB SWITCHING ────────────────────────────
window.switchTab = function(tab) {
  document.querySelectorAll(".nav-btn").forEach((btn, i) => {
    btn.classList.toggle("active", ["info","rsvp","ticket","photos"][i] === tab);
  });
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  document.getElementById(`tab-${tab}`).classList.add("active");
  sessionStorage.setItem("activeTab", tab);

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

    // Show ceremony switcher only for guests attending both ceremonies
    const switcher = document.getElementById("ceremony-switcher");
    if (switcher) switcher.style.display = currentGuest.ceremony === "both" ? "block" : "none";
    if (currentGuest.ceremony === "both") window.switchCeremonyView("april30");

    // Populate all ceremony-specific content
    renderInfoTab();
    updateCountdown();

    // Load weather for graduation day
    loadWeather();

    // Restore last active tab
    const savedTab = sessionStorage.getItem("activeTab");
    if (savedTab && savedTab !== "info") window.switchTab(savedTab);

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

// ─── CALENDAR CHOOSER ─────────────────────────
window.openCalendarChooser = function() {
  const c = getCeremony();
  const googleParams = new URLSearchParams({
    action:   "TEMPLATE",
    text:     EVENT.title,
    dates:    `${c.calStartUTC}/${c.calEndUTC}`,
    location: c.address,
    details:  EVENT.description,
  });
  document.getElementById("cal-google").href = `https://calendar.google.com/calendar/render?${googleParams}`;

  const outlookParams = new URLSearchParams({
    path:      "/calendar/action/compose",
    rru:       "addevent",
    subject:   EVENT.title,
    startdt:   c.calStartUTC.replace("Z", "").replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, "$1-$2-$3T$4:$5:$6"),
    enddt:     c.calEndUTC.replace("Z", "").replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, "$1-$2-$3T$4:$5:$6"),
    location:  c.address,
    body:      EVENT.description,
  });
  document.getElementById("cal-outlook").href = `https://outlook.live.com/calendar/0/deeplink/compose?${outlookParams}`;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `DTSTART:${c.calStartUTC}`,
    `DTEND:${c.calEndUTC}`,
    `SUMMARY:${EVENT.title}`,
    `LOCATION:${c.address}`,
    `DESCRIPTION:${EVENT.description}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\n");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const icsUrl = URL.createObjectURL(blob);
  document.getElementById("cal-apple").href = icsUrl;
  document.getElementById("cal-ics").href   = icsUrl;

  document.getElementById("calendar-modal").style.display = "flex";
  document.body.style.overflow = "hidden";
};

window.closeCalendarModal = function() {
  document.getElementById("calendar-modal").style.display = "none";
  document.body.style.overflow = "";
};

document.getElementById("calendar-modal")?.addEventListener("click", function(e) {
  if (e.target === this) window.closeCalendarModal();
});

// ─── CUSTOM MODAL ─────────────────────────────
function showModal(title, body, eyebrow) {
  return new Promise(resolve => {
    const modal = document.getElementById("confirm-modal");
    document.getElementById("modal-title").textContent = title;
    document.getElementById("modal-body").textContent  = body;
    if (eyebrow) document.getElementById("modal-eyebrow").textContent = eyebrow;
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";

    const close = (result) => {
      modal.style.display = "none";
      document.body.style.overflow = "";
      resolve(result);
    };

    document.getElementById("modal-confirm-btn").onclick = () => close(true);
    document.getElementById("modal-cancel-btn").onclick  = () => close(false);
  });
}
const RSVP_DEADLINE   = new Date("2026-04-28T23:59:59-04:00");
const CEREMONY_CAPS   = { april30: 10, may2: 6 };
const PARIS_PHONE     = "+16165660701";

// ─── EVENT CONFIG ─────────────────────────────
const EVENT = {
  title:       "Paris's UMSI Graduation",
  description: "UMSI Commencement 2026 — University of Michigan School of Information",
};

function showLockStatus() {
  const statusWrap = document.getElementById("rsvp-lock-status-wrap");
  const statusBadge = document.getElementById("rsvp-lock-status-badge");
  const textBtn = document.getElementById("rsvp-text-paris-btn");

  if (currentGuest.status && currentGuest.status !== "pending") {
    const colors = {
      confirmed: { bg: "rgba(29,158,117,0.18)", color: "#5DCAA5", label: "Attending in person" },
      virtual:   { bg: "rgba(55,138,221,0.18)",  color: "#85B7EB", label: "Attending virtually" },
      declined:  { bg: "rgba(226,75,74,0.18)",   color: "#E24B4A", label: "Unable to attend" },
      pending:   { bg: "rgba(239,159,39,0.18)",   color: "#EF9F27", label: "Pending" },
    };
    const s = colors[currentGuest.status] || colors.pending;
    statusBadge.textContent = s.label;
    statusBadge.style.cssText = `background:${s.bg};color:${s.color};font-family:var(--font-mono);font-size:12px;padding:5px 14px;border-radius:999px;`;
    statusWrap.classList.remove("hidden");
  }

  // Pre-fill text message with guest name and status
  const msg = `Hi Paris! I'm checking about my graduation RSVP — it shows as "${currentGuest.status || "not set"}" but I think there may be an error. Could you help? (Code: ${currentGuest.code})`;
  textBtn.href = `sms:${PARIS_PHONE}&body=${encodeURIComponent(msg)}`;
}

function isDeadlinePassed() { return new Date() > RSVP_DEADLINE; }

// ─── RSVP TAB RENDER ──────────────────────────
window.renderRsvpTab = async function() {
  const formWrap      = document.getElementById("rsvp-form-wrap");
  const confirmedWrap = document.getElementById("rsvp-confirmed");
  const deadlineEl    = document.getElementById("rsvp-deadline-msg");
  const errEl         = document.getElementById("rsvp-error");
  const noticeEl      = document.getElementById("rsvp-deadline-notice");

  errEl.classList.add("hidden");

  // Hide change button if deadline passed or locked
  const changeBtn = document.getElementById("change-rsvp-btn");
  if (changeBtn) changeBtn.style.display = (isDeadlinePassed() || currentGuest.rsvpLocked) ? "none" : "inline-block";

  // Admin locked — show locked message
  if (currentGuest.rsvpLocked) {
    formWrap.classList.add("hidden");
    confirmedWrap.classList.add("hidden");
    if (noticeEl) noticeEl.classList.add("hidden");
    deadlineEl.classList.remove("hidden");
    document.getElementById("rsvp-lock-title").textContent = "Your RSVP has been set";
    document.getElementById("rsvp-lock-body").textContent  = "Your attendance has been confirmed by Paris. If this is incorrect, please reach out to her directly.";
    showLockStatus();
    return;
  }

  // Deadline passed — show deadline message
  if (isDeadlinePassed()) {
    formWrap.classList.add("hidden");
    confirmedWrap.classList.add("hidden");
    if (noticeEl) noticeEl.classList.add("hidden");
    deadlineEl.classList.remove("hidden");
    document.getElementById("rsvp-lock-title").textContent = "RSVP deadline has passed";
    document.getElementById("rsvp-lock-body").textContent  = "The deadline to RSVP was April 20th. If you need to make changes, please reach out to Paris directly.";
    showLockStatus();
    return;
  }

  // Guest has already RSVPed — show confirmation with change option
  if (currentGuest.status && currentGuest.status !== "pending") {
    if (noticeEl) noticeEl.classList.add("hidden");
    showRsvpConfirmed(currentGuest.status);
    return;
  }

  // Default: show the form with deadline notice
  formWrap.classList.remove("hidden");
  confirmedWrap.classList.add("hidden");
  deadlineEl.classList.add("hidden");
  if (noticeEl) noticeEl.classList.remove("hidden");
};

// ─── RSVP SUBMISSION ──────────────────────────
window.submitRsvp = async function() {
  const name   = document.getElementById("rsvp-name").value.trim();
  const status = document.querySelector('input[name="rsvp-status"]:checked')?.value;
  const errEl  = document.getElementById("rsvp-error");

  if (isDeadlinePassed() || currentGuest.rsvpLocked) {
    errEl.textContent = "Your RSVP has been locked. Please contact Paris directly to make changes.";
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

  // Warn before submitting virtual — this is permanent
  if (status === "virtual" && !currentGuest.everWasVirtual) {
    const confirmed = await showModal(
      "Attending virtually?",
      "Once confirmed, you will not be able to change to in-person attendance without contacting Paris directly. Your ticket will be released to other guests.",
      "Please read carefully"
    );
    if (!confirmed) return;
  }

  // Check ticket cap for in-person (exclude current guest's existing status to allow changes)
  if (status === "confirmed") {
    // Block virtual guests from self-upgrading to in-person — even if they changed to declined first
    if (currentGuest.everWasVirtual || currentGuest.status === "virtual") {
      errEl.textContent = "You were previously registered as a virtual attendee. To change to in-person, please contact Paris directly as this affects ticket allocation.";
      errEl.classList.remove("hidden");
      return;
    }

    const guestCeremony = currentGuest.ceremony || "april30";
    const cap = CEREMONY_CAPS[guestCeremony] ?? CEREMONY_CAPS.april30;
    const snap = await getDocs(collection(db, "guests"));
    let inPersonCount = 0;
    snap.forEach(d => {
      const g = d.data();
      if (d.id === currentGuest.code || g.status !== "confirmed" || g.skipTicketCount) return;
      if (g.ceremony === guestCeremony || g.ceremony === "both" || (!g.ceremony && guestCeremony === "april30")) inPersonCount++;
    });
    if (inPersonCount >= cap) {
      errEl.textContent = "Sorry, all in-person tickets have been allocated for this ceremony. You can still attend virtually!";
      errEl.classList.remove("hidden");
      return;
    }
  }

  errEl.classList.add("hidden");

  try {
    // If selecting virtual for the first time, record it permanently
    const updates = { name, status, rsvpedAt: serverTimestamp() };
    if (status === "virtual") updates.everWasVirtual = true;

    await updateDoc(doc(db, "guests", currentGuest.code), updates);

    currentGuest.name   = name;
    currentGuest.status = status;
    if (status === "virtual") currentGuest.everWasVirtual = true;
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

  // If currently virtual or ever was virtual, disable in-person option and show note
  const inPersonRadio = document.querySelector('input[name="rsvp-status"][value="confirmed"]');
  const inPersonNote  = document.getElementById("inperson-note");
  const inPersonLabel = document.getElementById("option-confirmed");
  if (currentGuest.status === "virtual" || currentGuest.everWasVirtual) {
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

  // Show message section for confirmed and virtual guests
  const msgSection = document.getElementById("rsvp-message-section");
  if (msgSection && (status === "confirmed" || status === "virtual")) {
    msgSection.classList.remove("hidden");
    if (currentGuest.rsvpMessage) {
      document.getElementById("rsvp-msg-form").classList.add("hidden");
      const successEl = document.getElementById("rsvp-msg-success");
      successEl.textContent = `Your message: "${currentGuest.rsvpMessage}" 💙`;
      successEl.classList.remove("hidden");
    }
  }

  // Show child section only for in-person confirmed guests
  const childSection = document.getElementById("child-section");
  if (status === "confirmed" && !isDeadlinePassed()) {
    childSection.classList.remove("hidden");
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

// ─── RSVP MESSAGE ─────────────────────────────
window.submitRsvpMessage = async function() {
  const msg   = document.getElementById("rsvp-msg-input").value.trim();
  const errEl = document.getElementById("rsvp-msg-error");
  if (!msg) { errEl.textContent = "Please write something first!"; errEl.classList.remove("hidden"); return; }
  errEl.classList.add("hidden");
  try {
    await updateDoc(doc(db, "guests", currentGuest.code), { rsvpMessage: msg });
    currentGuest.rsvpMessage = msg;
    document.getElementById("rsvp-msg-form").classList.add("hidden");
    const successEl = document.getElementById("rsvp-msg-success");
    successEl.textContent = `Your message: "${msg}" 💙`;
    successEl.classList.remove("hidden");
  } catch (err) {
    errEl.textContent = "Something went wrong. Please try again.";
    errEl.classList.remove("hidden");
  }
};

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

  const pendingEl   = document.getElementById("ticket-pending-msg");
  const cardEl      = document.getElementById("ticket-card");
  const childCardEl = document.getElementById("child-ticket-card");
  const may2CardEl  = document.getElementById("may2-ticket-card");

  const hideAll = () => {
    pendingEl.classList.remove("hidden");
    cardEl.classList.add("hidden");
    if (childCardEl) childCardEl.classList.add("hidden");
    if (may2CardEl)  may2CardEl.classList.add("hidden");
  };

  if (currentGuest.status !== "confirmed") { hideAll(); return; }

  // ── Both-ceremony guests ──────────────────────
  if (currentGuest.ceremony === "both") {
    const t    = currentGuest.tickets || {};
    const apr  = t.april30 || {};
    const may2 = t.may2    || {};

    if (!apr.released && !may2.released) { hideAll(); return; }

    pendingEl.classList.add("hidden");

    if (apr.released) {
      cardEl.classList.remove("hidden");
      document.getElementById("ticket-name-display").textContent  = currentGuest.name || "Guest";
      document.getElementById("ticket-id-display").textContent    = apr.ticketId || currentGuest.ticketId || currentGuest.code;
      document.getElementById("ticket-date-display").textContent  = "Thursday, April 30, 2026";
      document.getElementById("ticket-venue-display").textContent = "Crisler Center, Ann Arbor";
      const qrData = `https://inevitableyellow.github.io/paris-graduation-2026/verify.html?id=${apr.ticketId || currentGuest.code}`;
      generateQR("ticket-qr", qrData, apr.url, apr.type, "ticket-save-btns");
    } else {
      cardEl.classList.add("hidden");
    }

    if (may2.released && may2CardEl) {
      may2CardEl.classList.remove("hidden");
      document.getElementById("may2-ticket-name-display").textContent = currentGuest.name || "Guest";
      document.getElementById("may2-ticket-id-display").textContent   = may2.ticketId || currentGuest.code + "-MAY2";
      const may2QrData = `https://inevitableyellow.github.io/paris-graduation-2026/verify.html?id=${may2.ticketId || currentGuest.code + "-MAY2"}`;
      generateQR("may2-ticket-qr", may2QrData, may2.url, may2.type, "may2-ticket-save-btns");
    } else if (may2CardEl) {
      may2CardEl.classList.add("hidden");
    }
    return;
  }

  // ── Single-ceremony guests ────────────────────
  if (!currentGuest.ticketReleased) { hideAll(); return; }

  pendingEl.classList.add("hidden");
  cardEl.classList.remove("hidden");
  if (may2CardEl) may2CardEl.classList.add("hidden");

  document.getElementById("ticket-name-display").textContent = currentGuest.name || "Guest";
  document.getElementById("ticket-id-display").textContent   = currentGuest.ticketId || currentGuest.code;

  const qrData = `https://inevitableyellow.github.io/paris-graduation-2026/verify.html?id=${currentGuest.ticketId || currentGuest.code}`;
  generateQR("ticket-qr", qrData, currentGuest.officialTicketUrl, currentGuest.officialTicketType, "ticket-save-btns");

  // Child ticket
  if (currentGuest.linkedChild?.needsTicket && currentGuest.linkedChild?.code) {
    try {
      const childSnap = await getDoc(doc(db, "guests", currentGuest.linkedChild.code));
      if (childSnap.exists()) {
        const child = childSnap.data();
        if (child.ticketReleased && childCardEl) {
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
      img.crossOrigin = "anonymous";
      img.id  = imgId;
      img.alt = "Official ticket";
      img.style.cssText = "width:200px;height:auto;border-radius:8px;display:block;margin:0 auto;";
      img.src = officialTicketUrl;
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
  const grid     = document.getElementById("photo-grid");
  const emptyEl  = document.getElementById("photos-empty");
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
    if (allPhotoUrls.length > 0) {
      dlBtn.classList.remove("hidden");
      if (emptyEl) emptyEl.style.display = "none";
    } else {
      dlBtn.classList.add("hidden");
      if (emptyEl) emptyEl.style.display = "block";
    }
  } catch (err) {
    console.error("Failed to load photos:", err);
  }
}

// ─── WEATHER ──────────────────────────────────
async function loadWeather() {
  const c = getCeremony();
  const { weatherLat, weatherLng, weatherDate, weatherCity } = c;
  try {
    const res  = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${weatherLat}&longitude=${weatherLng}&daily=temperature_2m_max,temperature_2m_min,weathercode&temperature_unit=fahrenheit&timezone=America%2FNew_York&start_date=${weatherDate}&end_date=${weatherDate}`);
    const data = await res.json();
    const max  = Math.round(data.daily.temperature_2m_max[0]);
    const min  = Math.round(data.daily.temperature_2m_min[0]);
    const code = data.daily.weathercode[0];
    const icons = { 0:"☀️", 1:"🌤️", 2:"⛅", 3:"☁️", 45:"🌫️", 48:"🌫️", 51:"🌦️", 53:"🌦️", 55:"🌧️", 61:"🌧️", 63:"🌧️", 65:"🌧️", 71:"🌨️", 73:"🌨️", 75:"❄️", 80:"🌦️", 81:"🌧️", 82:"⛈️", 95:"⛈️" };
    const descs = { 0:"Clear skies", 1:"Mostly clear", 2:"Partly cloudy", 3:"Overcast", 45:"Foggy", 48:"Foggy", 51:"Light drizzle", 53:"Drizzle", 55:"Heavy drizzle", 61:"Light rain", 63:"Rain", 65:"Heavy rain", 71:"Light snow", 73:"Snow", 75:"Heavy snow", 80:"Showers", 81:"Rain showers", 82:"Heavy showers", 95:"Thunderstorm" };
    // Update city label in weather widget
    const cityEl = document.getElementById("weather-city");
    if (cityEl) cityEl.textContent = weatherCity.toUpperCase();
    document.getElementById("weather-icon").textContent = icons[code] || "🌡️";
    document.getElementById("weather-temp").textContent = `${max}°F / ${min}°F`;
    document.getElementById("weather-desc").textContent = descs[code] || "Check forecast";
  } catch {
    document.getElementById("weather-temp").textContent = "Forecast unavailable";
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

// ─── LOGOUT ───────────────────────────────────
window.logout = function() {
  sessionStorage.removeItem("guestCode");
  sessionStorage.removeItem("guestData");
  window.location.reload();
};

// ─── SESSION RESTORE ─────────────────────────
const savedCode = sessionStorage.getItem("guestCode");
if (savedCode) {
  document.getElementById("invite-input").value = savedCode;
  window.verifyInvite();
} else {
  document.getElementById("login-screen").style.display = "block";
}