# Deployment Guide

## Overview
This project consists of a **Vite + React** frontend and an **Express** backend. The intended deployment targets are:
- **Frontend** → Netlify
- **Backend** → Render (using the existing `render.yaml`)

## Prerequisites
1. A GitHub (or GitLab/Bitbucket) repository containing the full project code.
2. Netlify account (free tier works fine).
3. Render account (free tier works fine).
4. Optional: custom domains if you want to replace the default generated URLs.

## Step‑by‑step
### 1. Push code to a remote repo
```bash
# From the project root
git init
git add .
git commit -m "Initial commit"
# Replace <remote‑url> with your repo URL
git remote add origin <remote‑url>
git push -u origin main
```

### 2. Deploy the **backend** on Render
1. Log in to Render and click **New → Web Service**.
2. Connect the repository you just pushed.
3. Render will automatically detect the `render.yaml` at the repo root.
4. Confirm the settings (service name, plan, branch, rootDir = `backend`).
5. Click **Create Web Service**. Render will run `npm install` and start the server with `npm start`.
6. Once deployed, note the generated URL, e.g. `https://novahamotech-backend-7gkj.onrender.com`.
   - The API endpoints are under `/api` (e.g., `https://.../api/auth/login`).
   - Render injects `process.env.PORT` automatically, which the server already uses.

### 3. Deploy the **frontend** on Netlify
1. In Netlify, click **New site → Import an existing project**.
2. Connect the same Git repository.
3. Netlify will read the `netlify.toml` file placed at the repository root.
   - Build command: `npm install && npm run build`
   - Publish directory: `dist` (the Vite production output)
   - Environment variable `VITE_API_BASE` is set to the Render backend URL (`https://novahamotech-backend-7gkj.onrender.com/api`).
4. Click **Deploy site**.
5. After the build finishes, Netlify provides a URL like `https://<your‑site>.netlify.app`.

### 4. Verify the deployment
- Open the Netlify URL in a browser.
- Log in using one of the seeded accounts (e.g., `admin@attendance.com` / `admin123`).
- Navigate the UI; all API calls should succeed (no CORS errors).
- Check the Render dashboard to see the backend logs and confirm requests are received.

## Optional: Custom Domains
- **Render**: Add a custom domain in the service settings → **Custom Domains** → follow the DNS instructions.
- **Netlify**: In the site settings, under **Domain management**, add a custom domain and configure DNS.

## Recap of key files added
- `netlify.toml` – Netlify build configuration & environment variable.
- `frontend/.env.example` – Example env file for local development and Netlify.
- `DEPLOYMENT.md` – This guide.

Feel free to edit the URLs or domain names as needed. Happy deploying!
