# Unlocked By God — Deployment Guide

## Files to push to GitHub (replace in your repo):

### New / Changed files:
- src/App.jsx          ← Full app (restored + updated)
- src/components/AdminDashboard.jsx  ← Admin Dashboard (NEW)
- src/contexts/AuthContext.jsx       ← Auth context (NEW)
- src/firebase.js      ← Firebase config
- src/index.css        ← All styles
- src/main.jsx         ← Entry point
- firestore.rules      ← Firestore security rules
- package.json         ← Dependencies
- vite.config.js       ← Vite config
- index.html           ← HTML shell

## Vercel: No changes needed — auto-deploys on push.

## Firebase Console:
1. Go to Firestore → Rules → paste firestore.rules content
2. Collections are auto-created on first write

## Admin access:
- Email: cmalaysia56@gmail.com
- After login, an "⚙️ Admin" link appears in the nav
- Admin Dashboard is at /admin route (separate component)
