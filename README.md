# 🔵 Ping — Chat App

A mobile-first dark futuristic chat app. No build tools needed — just open `index.html` in a browser!

## 📁 File Structure
```
ping-app/
├── index.html        ← Main HTML + your logo (base64 embedded)
├── src/
│   ├── style.css     ← All styles (dark theme, animations, layout)
│   └── app.js        ← All React components & logic
└── README.md
```

## 🚀 How to Run
1. Open `index.html` directly in Chrome/Safari/Firefox
2. Or drag the folder to any static host (Netlify, Vercel, GitHub Pages)

## 🔐 Login Codes
| Code | Role |
|------|------|
| `D@rsh` | 👑 Creator (can manage ranks) |
| `darsh1` | Regular user |
| `darsh2` | Regular user |
| `darsh3` | Regular user |
| `vishit` | Regular user |
| `Avishi.j` | Regular user |
Any new code → auto-creates a new account.

## ✏️ Common Edits

### Add a new login code
In `index.html`, find:
```js
const VALID_CODES = ['D@rsh', 'darsh1', ...]
```
Add your new code to the array.

### Change the app logo
Replace the logo image file and update the base64 in `index.html`:
```js
window.PING_LOGO = "data:image/png;base64,YOUR_NEW_BASE64_HERE";
```

### Change colors/theme
In `src/style.css`, edit the `:root` block:
```css
--neon: #7c6df0;    /* primary purple */
--neon2: #5b8ef0;   /* secondary blue */
--bg: #0a0b0f;      /* background */
```

### Add more rank types
In `src/app.js`, find `const RANKS = {...}` and add your rank.

## 💾 Data Storage
All data is saved in the browser's `localStorage`:
- `ping_accounts` — all user profiles
- `ping_groups` — all groups
- `ping_chat_<id>` — messages per chat
- `ping_session` — who's logged in

## 📱 Deploy to the Web (Free)
1. Go to [netlify.com](https://netlify.com)
2. Drag the `ping-app` folder onto the Netlify dashboard
3. Done — you get a live URL instantly!
