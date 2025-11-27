# Railway Deployment Guide

This guide will help you deploy Splice to Railway.app, which supports the CLI tools needed for mock server and SDK generation features.

## Prerequisites
- GitHub account
- Railway account (sign up at https://railway.app)

## Deployment Steps

### 1. Sign Up / Log In to Railway
1. Go to https://railway.app
2. Click "Login" and sign in with your GitHub account
3. Authorize Railway to access your repositories

### 2. Create New Project
1. Click "New Project" on the Railway dashboard
2. Select "Deploy from GitHub repo"
3. Choose your `splice` repository
4. Railway will automatically detect it's a Next.js app

### 3. Configure Environment Variables
Railway should auto-detect most settings, but verify these:

**Required Variables:**
- `NODE_ENV` = `production`
- `PORT` = `3000` (Railway will override this automatically)

**Optional Variables (if you have any):**
- Add any API keys or secrets your app needs

### 4. Deploy
1. Click "Deploy"
2. Railway will:
   - Install Node.js 20 and pnpm
   - Install global CLI tools (Prism, OpenAPI Generator)
   - Run `pnpm install`
   - Run `pnpm build`
   - Start your app with `pnpm start`

### 5. Monitor Deployment
1. Watch the build logs in the Railway dashboard
2. First deployment takes ~5-10 minutes
3. You'll get a public URL when deployment completes (e.g., `your-app.up.railway.app`)

### 6. Test Your App
Once deployed, test these features:
- ✅ Upload OpenAPI spec
- ✅ API Explorer
- ✅ Mock Server (should work now!)
- ✅ SDK Generation (should work now!)

## Troubleshooting

### Build Fails
- Check the build logs in Railway dashboard
- Ensure `nixpacks.toml` is in the repository root
- Verify `pnpm-lock.yaml` is committed

### CLI Tools Not Found
- Check that `nixpacks.toml` includes the global install commands
- Verify the install phase completed successfully in logs

### App Won't Start
- Check that `apps/web/package.json` has a `start` script
- Verify the PORT environment variable is set correctly
- Check Railway logs for startup errors

## Custom Domain (Optional)
1. Go to your Railway project settings
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as instructed

## Cost
- Railway offers $5/month free credit
- Your app should stay within free tier for development/hackathon
- Monitor usage in Railway dashboard

## Support
- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
