# Railway Deployment Guide

## Prerequisites
- Node.js installed
- Railway CLI installed (`npm install -g @railway/cli`)
- GitHub account connected to Railway

## Quick Deploy (Using CLI)

### Step 1: Login to Railway
```bash
railway login
```

### Step 2: Initialize Project
```bash
railway init
```
- Select "Create new project"
- Project name: `medico-legal`

### Step 3: Add MongoDB Database
```bash
railway add -a database
```
- Select "MongoDB"

### Step 4: Configure Environment Variables
```bash
railway variables set MONGO_URL=$MONGO_URL
railway variables set NODE_ENV=production
railway variables set PORT=5000
railway variables set JWT_SECRET=medico_secret_key_2024_secure_hash
railway variables set AI_SERVICE_URL=
```

### Step 5: Link to GitHub Repository
```bash
railway connect github
```
- Select repository: `VInitha24057/medio-legal`
- Configure as: Backend/API service

### Step 6: Deploy
```bash
railway up
```

### Step 7: Get Deployment URL
```bash
railway domain
```

## Manual Deploy via Web Dashboard

### Step 1: Connect Railway to GitHub
1. Go to https://railway.app
2. Sign up/Login with GitHub
3. Authorize Railway to access your repositories

### Step 2: Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Select repository: `VInitha24057/medio-legal`

### Step 3: Add MongoDB Database
1. Click "Add Plugin" → "Database"
2. Select "MongoDB"
3. Railway will auto-add `MONGO_URL` variable

### Step 4: Configure Environment
In project settings, add:
- `NODE_ENV=production`
- `PORT=5000`
- `JWT_SECRET=medico_secret_key_2024_secure_hash`

### Step 5: Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Railway auto-detects Node.js

### Step 6: Get URL
1. Click "Generate Domain" in the deployment
2. Copy the URL for frontend/API

## Configuration Files

### railway.json
```json
{
  "$schema": "https://railway.app/schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install",
    "startCommand": "node backend/src/server.js"
  },
  "deploy": {
    "numReplicas": 1
  },
  "env": {
    "NODE_ENV": { "value": "production" },
    "PORT": { "value": "5000" }
  }
}
```

## Environment Variables for Railway

| Variable | Value | Description |
|----------|-------|-------------|
| MONGO_URL | (auto-generated) | MongoDB connection string |
| NODE_ENV | production | Production mode |
| PORT | 5000 | Server port |
| JWT_SECRET | medico_secret_key_2024_secure_hash | JWT signing key |

## Post-Deployment Checklist

- [ ] Health check: `https://your-domain.railway.app/api/health`
- [ ] Test doctor record upload
- [ ] Test police case search
- [ ] Test blockchain verification
- [ ] Test report download
- [ ] Verify CORS works in production

## Troubleshooting

### Build Failures
- Ensure `npm install` works locally first
- Check Node.js version compatibility

### Database Connection Issues
- Verify MONGO_URL is set correctly
- Check MongoDB plugin is attached

### Port Errors
- Ensure PORT=5000 in environment
- Railway may use different port (check Railway variable)

### CORS Errors
- CORS is configured to accept all origins in production mode
- Check if Railway domain is properly set