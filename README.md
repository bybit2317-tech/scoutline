# Scoutline — how to put this website online

You don't need to know how to code. Follow these steps in order.

## Step 1 — Change your admin password (important, do this first)

1. Open the file `src/App.jsx`
2. Near the top, find these two lines:
   ```
   const ADMIN_USERNAME = "admin";
   const ADMIN_PASSWORD = "changeme123";
   ```
3. Change `"admin"` and `"changeme123"` to a username and password only you know.
4. Save the file.

⚠️ This is a basic lock, not bank-level security — it keeps casual visitors
out while you're testing, but someone who really wants to could still find
it in the site's code. Don't use a password you use elsewhere, and don't
treat this as safe for handling real payments yet (see Step 5).

## Step 2 — Put your real Bitcoin wallet address in

1. Still in `src/App.jsx`, find:
   ```
   const PLATFORM_BTC_ADDRESS = "bc1qexampleyourrealwalletaddresshere000";
   ```
2. Replace the address with your real receiving wallet address.

## Step 3 — Create a free GitHub account and upload this project

GitHub is just free storage for your website's files, and it connects
directly to the hosting service in Step 4.

1. Go to https://github.com and sign up (free)
2. Click the "+" icon top right → "New repository"
3. Name it `scoutline`, keep it Public or Private (your choice), click "Create repository"
4. On the next page, click "uploading an existing file"
5. Drag this whole `scoutline` folder's contents into the upload box
6. Click "Commit changes"

## Step 4 — Deploy it live with Vercel (free, a few clicks)

1. Go to https://vercel.com and sign up using your GitHub account (one click)
2. Click "Add New" → "Project"
3. Find your `scoutline` repository and click "Import"
4. Vercel will auto-detect it's a Vite project — leave all settings as default
5. Click "Deploy"
6. Wait about a minute. You'll get a real link like `scoutline-yourname.vercel.app`

**That link is what you share with players.** They will never see an "Admin"
button anywhere on the site.

## Step 5 — Access your admin area

Go to your link and add `/admin` to the end, for example:
```
https://scoutline-yourname.vercel.app/admin
```

That's the only way in. Log in with the username/password you set in Step 1.

## What's still "demo" and what a real launch needs next

This version works fully in the browser but does **not** yet have:

- **A real database.** Right now, if you refresh the page, all applications
  and posted opportunities disappear. Anything real needs a backend database
  (e.g. Supabase or Firebase — both have free tiers and don't require heavy
  coding) so data is saved permanently.
- **Real Bitcoin payment verification.** The "I've sent the payment" button
  is currently a simulation — it doesn't check the blockchain. Verifying a
  real payment landed requires a backend service (e.g. BTCPay Server or
  Coinbase Commerce).
- **Stronger admin security.** Fine for early testing with a link only you
  know. Before handling real user data or payments at scale, this should be
  upgraded to real server-side authentication.

When you're ready for these, come back and I'll walk you through them the
same way — step by step.
