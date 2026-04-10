# Paris's Graduation 2026 🎓

A private family website for Paris Heard's UMSI Commencement on April 30, 2026. Built with vanilla HTML/CSS/JS, Firebase, and hosted on GitHub Pages.

---

## Features

### Main site
- **Invite code login** — each guest receives a unique code, session persists across page navigation
- **Live countdown** to graduation day
- **Info tab** — ceremony details, schedule, venue, livestream link, and link to the About page
- **RSVP tab** — guests confirm attendance with the following logic:
  - Deadline enforcement (April 20th) — form locks after the deadline
  - Ticket cap (10 in-person tickets) — blocks confirmations once full
  - Virtual attendance warning — guests are informed their ticket will be released to others
  - Virtual guests cannot self-upgrade to in-person after selecting virtual
  - Guests can change their RSVP up until the deadline
- **Child guest linking** — confirmed in-person guests can link a child's invite code; both tickets appear under the parent's account
- **My Ticket tab** — displays official ticket (uploaded by admin) in the QR area once released; save to camera roll or download; iOS-aware save flow
- **Photos tab** — upload photos, tap to expand in a lightbox with navigation, download individual photos or download all

### About page (`about.html`)
- Seamless session — no second login required if already logged in via main site
- Bio, education, experience, and skills sections (editable via Git)
- **Mastery project** section — PDF poster embed with iOS fallback, project stats, and plain-English description
- **Future plans** section
- **Notes for the future** — any guest with an invite code can leave Paris a message

### Admin panel (`admin/index.html`)
- SHA-256 hashed password protection
- Fully mobile responsive — table collapses to cards on small screens
- **Overview stats** — total guests, confirmed, pending, tickets remaining
- **Guest management** — add guests, generate unique invite codes, view RSVP status, remove guests
- **Invite link generator** — enter a guest's code and name, generates a ready-to-send message with copy and "Open in Messages" buttons
- **Official ticket upload** — upload the university-issued ticket (image or PDF) per guest; Release button is locked until a ticket is uploaded
- **Ticket release** — releases the ticket to the guest's account
- **Photo management** — view all uploaded photos in a grid, delete individual photos

---

## File structure

```
paris-graduation-2026/
├── index.html          ← main site
├── about.html          ← about Paris page
├── poster.pdf          ← mastery project poster
├── firestore.rules     ← Firestore security rules
├── README.md
├── .gitignore
├── css/
│   └── style.css
├── js/
│   ├── app.js          ← all main site logic
│   └── firebase.js     ← Firebase config
└── admin/
    └── index.html      ← admin panel
```

---

## Setup

### 1. Firebase
1. Create a project at https://console.firebase.google.com
2. Enable **Firestore** (Native mode, nam5)
3. Enable **Storage** (requires Blaze plan)
4. Go to **Project Settings → Your apps → Web** and copy the config into `js/firebase.js`

### 2. Firestore rules
Copy the contents of `firestore.rules` into **Firebase Console → Firestore → Rules** and publish.

### 3. Storage rules
In **Firebase Console → Storage → Rules**, paste:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /photos/{photo} {
      allow read: if true;
      allow write: if request.resource.size < 10 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
      allow delete: if true;
    }
    match /tickets/{ticket} {
      allow read: if true;
      allow write: if request.resource.size < 20 * 1024 * 1024;
    }
  }
}
```

### 4. CORS
Create a `cors.json` file (already in `.gitignore`):
```json
[
  {
    "origin": ["https://inevitableyellow.github.io"],
    "method": ["GET"],
    "maxAgeSeconds": 3600
  }
]
```
Then run:
```bash
gcloud storage buckets update gs://paris-graduation-2026.firebasestorage.app --cors-file=cors.json
```

### 5. Admin password
The admin password is hashed with SHA-256. To change it:
```bash
echo -n "yournewpassword" | sha256sum
```
Replace the `ADMIN_PASSWORD_HASH` value in `admin/index.html`.

### 6. GitHub Pages
1. Push to the `main` branch of `inevitableyellow/paris-graduation-2026`
2. Go to **Settings → Pages → Deploy from branch → main / root**
3. Live at `https://inevitableyellow.github.io/paris-graduation-2026`

---

## Guest management workflow

### Adding guests
1. Go to `/admin/` and log in
2. Enter the guest's name and relationship, click **Generate invite**
3. Send the generated code using the **Invite link generator**

### RSVP deadline
Set in `js/app.js`:
```js
const RSVP_DEADLINE = new Date("2026-04-20T23:59:59-04:00");
```

### Releasing tickets
1. Receive official tickets from UMSI
2. In the admin panel, click **Upload ticket** next to each confirmed guest
3. Click **Release** — the guest will see their ticket in the My Ticket tab

---

## Filling in placeholders

Search `Details coming soon` in `index.html` for:
- Dinner reservation details
- Parking & transport info
- Dress code

Search `Add` in `about.html` for:
- Bio text
- Undergraduate education
- Work experience
- Skills
- Future plans

---

## Tech stack
- **Frontend** — vanilla HTML, CSS, JavaScript (ES modules)
- **Database** — Firebase Firestore
- **Storage** — Firebase Storage
- **Hosting** — GitHub Pages
- **Fonts** — Cormorant Garamond, DM Sans, DM Mono (Google Fonts)
- **QR codes** — QRCode.js

---

*Built with love for Paris's graduation. Go Blue! 〽️*
