# Paris's Graduation 2026 🎓

A private family website for Paris's UMSI commencement on April 30, 2026.

---

## Setup Guide

### 1. Firebase Setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a project called `paris-graduation-2026`
2. Enable **Firestore Database** (start in production mode)
3. Enable **Storage** (start in production mode)
4. Go to **Project Settings → General → Your apps** and click **Add app → Web**
5. Copy your Firebase config and paste it into `js/firebase.js`, replacing the placeholder values

### 2. Firestore Security Rules

1. In Firebase Console → Firestore → Rules
2. Copy and paste the contents of `firestore.rules` and publish

### 3. Storage Rules

In Firebase Console → Storage → Rules, paste:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /photos/{photo} {
      allow read: if true;
      allow write: if request.resource.size < 10 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

### 4. Admin Password

Open `admin/index.html` and change the `ADMIN_PASSWORD` value on line ~85 to something secure.

### 5. GitHub Pages

1. Create a new repo on GitHub: `paris-graduation-2026`
2. Push all files to the `main` branch
3. Go to **Settings → Pages → Source → Deploy from branch → main / root**
4. Your site will be live at: `https://inevitableyellow.github.io/paris-graduation-2026`

---

## How It Works

### Adding Guests
1. Go to `https://inevitableyellow.github.io/paris-graduation-2026/admin/`
2. Log in with your admin password
3. Add each guest by name — a unique invite code (e.g. `GRAD-X7KP`) is generated automatically
4. Send each person their unique code via text/email

### RSVP Flow
- Guest visits the site and enters their invite code
- They fill in their name and select their attendance status
- Their RSVP is saved to Firestore

### Releasing Tickets
- When you're ready (e.g. 1–2 weeks before graduation), go to the admin panel
- Click **Release** next to each confirmed guest
- They will then see their QR code ticket in the Ticket tab

### QR Codes
- Each ticket has a unique ID tied to the guest's invite code
- The QR code is generated client-side and is unique per person
- Tickets are only shown after you manually release them

### Photos
- Only guests who have verified their invite code can upload
- Photos are stored in Firebase Storage and visible to all registered guests

---

## File Structure

```
paris-graduation-2026/
├── index.html          ← Main site (login + all tabs)
├── css/
│   └── style.css       ← All styles
├── js/
│   ├── firebase.js     ← Firebase config (fill in your credentials)
│   └── app.js          ← App logic
├── admin/
│   └── index.html      ← Admin panel (password protected)
├── firestore.rules     ← Firestore security rules
└── README.md
```

---

## Filling in Placeholders

Search for `Details coming soon` in `index.html` to find sections to fill in:
- Dinner reservation restaurant, address, and time
- Parking and transport info
- Dress code

These can be edited directly in GitHub's web editor or via a local Git commit.
