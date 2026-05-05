# Paris's Graduation 2026

A private family website for Paris Heard's UMSI Commencement — April 30 (Crisler Center) and May 2 (Michigan Stadium), 2026. Built with vanilla HTML/CSS/JS, Firebase, and hosted on GitHub Pages.

**Live Site:** https://inevitableyellow.github.io/paris-graduation-2026

---

## Viewer Access

To browse the site, use invite code: `GRAD-RSJD`
> Note: the QR code on the ticket page is *not* functional.

Guests see: Info, RSVP, My Ticket, and Photos tabs. Links to the About page and Books page are on the Info tab.

---

## Features

### Main Site (`index.html`)
- **Invite code login**: each guest receives a unique code; session persists across navigation
- **Live countdown**: to graduation day
- **Info tab**: ceremony details, schedule, venue, dinner reservation, dress code, parking info, and livestream link
- **Ceremony switcher**: guests assigned to both ceremonies can toggle between Apr 30 · Crisler and May 2 · Stadium to see ceremony-specific info
- **RSVP tab** with the following logic:
  - Deadline enforcement (April 28) — form locks after the deadline
  - Per-ceremony ticket caps (10 for April 30, 6 for May 2) — blocks confirmations once full
  - Virtual attendance warning — guests are informed their ticket may be released to others
  - Guests can change their RSVP up until the deadline
- **Child guest linking**: confirmed in-person guests can link a child's invite code; both tickets appear under the parent's account, can link a child to multiple parent accounts
- **My Ticket tab**: displays official QR ticket once released by admin; save to camera roll or download; iOS-aware save flow; guests attending both ceremonies see a card for each
- **Photos tab**: upload photos, tap to expand in a lightbox with navigation, download individually or all at once

### About Page (`about.html`)
- Seamless session — no second login required if already logged in on the main site
- Expandable bio section
- Education, work experience, and skills sections
- **Mastery project** — PDF poster embed with iOS fallback, project stats, and plain-English description
- **Future plans** section
- **Notes for the future** — any guest with an invite code can leave Paris a message

### Books Page (`books.html`)
- Paris's curated reading list organized by category: Favorites, Data Science, Fantasy, Fiction, Political Science
- Each entry includes a synopsis and a Bookshop.org link

### Admin Panel (`admin/index.html`)
- **Firebase Authentication** — sign in with Google (restricted to `pmheard@umich.edu`); email/password as fallback
- Fully mobile responsive — table collapses to cards on small screens
- **Overview Stats** — total guests, confirmed, pending, tickets remaining per ceremony
- **Guest Management** — add guests with ceremony assignment (`april30`, `may2`, or `both`), generate unique invite codes, view/filter RSVP status, remove guests
- **Invite Link Generator** — enter a guest's code and name, generates a ready-to-send message with copy and "Open in Messages" buttons
- **Ticket Upload & Release** — upload the university-issued ticket (image or PDF) per guest per ceremony; Release button is locked until a ticket is uploaded
- **Photo Management** — view all uploaded photos in a grid, delete individual photos

---

## File Structure

```
paris-graduation-2026/
├── index.html          ← main site
├── about.html          ← about me page
├── books.html          ← my reading list
├── poster.pdf          ← mastery project poster
├── firestore.rules     ← firestore security rules
├── README.md
├── .gitignore
├── css/
│   └── style.css
├── js/
│   ├── app.js          ← all main site logic
│   └── firebase.js     ← firebase config
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

### 2. Firestore Rules
Copy the contents of `firestore.rules` into **Firebase Console → Firestore → Rules** and publish.

### 3. Storage Rules
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

### 5. Firebase Authentication
1. Firebase Console → **Authentication → Get started → Sign-in method**
2. Enable **Google** and **Email/Password**
3. Under **Authentication → Users**, add your admin account
4. Google Cloud Console → **APIs & Services → Credentials** → find the Firebase web API key → under **Application restrictions → HTTP referrers**, add:
   - `https://paris-graduation-2026.firebaseapp.com/*`
   - `https://inevitableyellow.github.io/*`
5. Google Cloud Console → **APIs & Services → Credentials** → find the OAuth 2.0 Web client → under **Authorized JavaScript origins**, add:
   - `https://inevitableyellow.github.io`
   - `https://paris-graduation-2026.firebaseapp.com`
6. The allowed admin email is hardcoded in `admin/index.html` (`ADMIN_EMAIL`) and in `firestore.rules` (`isAdmin()`). Update both if the email changes.

### 6. GitHub Pages
1. Push to the `main` branch of `inevitableyellow/paris-graduation-2026`
2. Go to **Settings → Pages → Deploy from branch → main / root**
3. Live at `https://inevitableyellow.github.io/paris-graduation-2026`

---

## Guest Management Workflow

### Adding Guests
1. Go to `/admin/` and log in
2. Enter the guest's name, relationship, and ceremony assignment (`april30`, `may2`, or `both`)
3. Send the generated code using the **Invite link generator**

### RSVP Deadline and Caps
Set in `js/app.js`:
```js
const RSVP_DEADLINE = new Date("2026-04-28T23:59:59-04:00");
const CEREMONY_CAPS = { april30: 10, may2: 6 };
```

### Releasing Tickets
1. Receive official tickets from UMSI
2. In the admin panel, click **Upload ticket** next to each confirmed guest (per ceremony for "both" guests)
3. Click **Release** — the guest will see their ticket in the My Ticket tab

---

## Tech Stack
- **Frontend**: vanilla HTML, CSS, JavaScript (ES modules)
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Hosting**: GitHub Pages
- **Fonts**: Cormorant Garamond, DM Sans, DM Mono (Google Fonts)
- **QR codes**: QRCode.js

---

*Built with love. Go Blue! 〽️*
