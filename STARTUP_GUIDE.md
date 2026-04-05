# Medico Legal System - Startup Guide

## Quick Start

### Option 1: Manual Start (Recommended for troubleshooting)

**Step 1: Install Dependencies**
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies  
cd ../frontend
npm install
```

**Step 2: Seed Database**
```bash
cd ..
node database/seed.js
```

**Step 3: Start Backend**
```bash
cd backend
npm run dev
```
Wait for: "Server running on port 5000"

**Step 4: Start Frontend (new terminal)**
```bash
cd frontend
npm run dev
```
Wait for: "Local: http://localhost:5173/"

**Step 5: Open Browser**
Go to: http://localhost:5173

---

### Option 2: Docker Start

```bash
docker-compose up --build
```
Then open: http://localhost:5173

---

## Common Issues & Fixes

### Issue 1: "Can't reach this site"

**Cause:** Services not running or wrong port

**Fix:**
1. Make sure MongoDB is running locally on port 27017
2. Start backend first (port 5000)
3. Start frontend second (port 5173)
4. Check firewall settings

### Issue 2: "MongoDB connection failed"

**Fix:**
```bash
# Start MongoDB
mongod

# Or use Docker
docker run -d -p 27017:27017 mongo:7.0
```

### Issue 3: "Module not found"

**Fix:**
```bash
# Reinstall all dependencies
rm -rf node_modules package-lock.json
npm run install:all
```

### Issue 4: Port already in use

**Fix:**
```bash
# Kill processes on ports 5000 and 5173
# Windows:
taskkill /F /IM node.exe

# Mac/Linux:
pkill -f node
```

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Doctor | doctor@medico.com | doctor123 |
| Police | police@medico.com | police123 |
| Judge | judge@medico.com | judge123 |
| Patient | patient@medico.com | patient123 |
| Admin | admin@medico.com | admin123 |

---

## Verify Services

**Backend Health Check:**
```
http://localhost:5000/api/health
```

**Expected Response:**
```json
{"status": "success", "message": "Medico Legal System API is running"}
```

---

## If Still Not Working

Check your system:

1. Node.js version: Should be 16+
```bash
node --version
```

2. MongoDB running:
```bash
# Check if MongoDB is accessible
mongosh --eval "db.version()"
```

3. No firewall blocking ports 5000, 5173, 27017

---

## File Structure

```
medico/
├── backend/          # Express API (port 5000)
│   ├── src/
│   │   ├── server.js
│   │   ├── routes/
│   │   ├── models/
│   │   └── services/
│   └── uploads/      # Uploaded files
├── frontend/         # React app (port 5173)
│   └── src/
│       ├── pages/
│       └── lib/
├── database/         # Seed script
└── package.json
```

---

## Need More Help?

Check the console output for specific error messages:
- Backend errors show in the backend terminal
- Frontend errors show in browser console (F12)