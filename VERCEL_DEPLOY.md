# Deploy to Vercel

Your attendance system is ready to deploy! Follow one of the methods below:

## Method 1: Using GitHub (Recommended)

### Step 1: Create a GitHub Repository
1. Go to https://github.com/new
2. Create a new repository named `attendance-system`
3. **Do NOT** initialize with README (we already have files)
4. Click **Create repository**

### Step 2: Push Your Code
Run these commands in your terminal:

```bash
cd ~/Documents/attendance-system
git remote add origin https://github.com/YOUR_USERNAME/attendance-system.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

### Step 3: Deploy on Vercel
1. Go to https://vercel.com
2. Sign in with GitHub (or create an account)
3. Click **Add New → Project**
4. Search for and select `attendance-system`
5. Click **Import**

### Step 4: Configure Environment Variables
In the **Environment Variables** section, add:

```
NEXT_PUBLIC_SUPABASE_URL=https://lbqlntagejtdifyxvukk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_qbzAv4K01SPRxgXs2HaWQg_44_Qjx3Q
```

6. Click **Deploy**

Vercel will automatically:
- ✓ Build the Next.js app
- ✓ Deploy to a live URL
- ✓ Set up continuous deployment (auto-deploy on git push)

---

## Method 2: Using Vercel CLI

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Deploy
```bash
cd ~/Documents/attendance-system
vercel
```

Follow the prompts:
- **Link to existing project?** → No (first time)
- **What's your project's name?** → `attendance-system`
- **In which directory is your code?** → `./web`
- **Want to modify vercel.json?** → No

### Step 3: Add Environment Variables
After deployment, go to https://vercel.com/dashboard, select your project, then:

1. Go to **Settings → Environment Variables**
2. Add:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://lbqlntagejtdifyxvukk.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_qbzAv4K01SPRxgXs2HaWQg_44_Qjx3Q`

3. Redeploy: `vercel --prod`

---

## After Deployment

### Test Your Live App
Once deployed, you'll get a URL like: `https://attendance-system-abc123.vercel.app`

Test these pages:
- ✓ Dashboard: `https://your-domain.vercel.app/`
- ✓ Add Card: `https://your-domain.vercel.app/add-card`
- ✓ Register: `https://your-domain.vercel.app/register`
- ✓ Students: `https://your-domain.vercel.app/students`

### Configure Your Domain (Optional)
1. In Vercel dashboard, go to your project
2. Click **Settings → Domains**
3. Add your custom domain (e.g., `attendance.yourcompany.com`)
4. Follow DNS setup instructions

### Update ESP8266 Firmware (Optional)
If you want the ESP8266 to point to your live URL instead of localhost, you can add an environment variable to your firmware for the API endpoint.

---

## Troubleshooting

### "Build failed"
- Check that `web/package.json` exists
- Check logs on Vercel dashboard
- Verify Next.js build: `cd web && npm run build`

### "Environment variables not set"
- Add them in Vercel dashboard: **Settings → Environment Variables**
- Redeploy after adding: `vercel --prod`

### "Can't connect to Supabase"
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Check RLS policies in Supabase allow your domain

---

## What's Deployed

Your Vercel deployment includes:
- ✓ Dashboard (attendance feed)
- ✓ Student management page
- ✓ Card detection system (/add-card)
- ✓ Student registration form
- ✓ Real-time Supabase integration

**The ESP8266 firmware stays on your device** — it communicates with your Supabase project directly.
