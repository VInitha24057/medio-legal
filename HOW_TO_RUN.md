# Medico Legal System - How to Run

## Quick Commands to Start

**Step 1: Install Dependencies**
Open Command Prompt in the project folder and run:
```bash
npm run install:all
```

**Step 2: Setup Database**
```bash
node database/seed.js
```

**Step 3: Start Backend**
Open a new terminal, go to backend folder:
```bash
cd backend
npm run dev
```
Wait for message: "Server running on port 5000"

**Step 4: Start Frontend**
Open another new terminal, go to frontend folder:
```bash
cd frontend
npm run dev
```
Wait for message showing the URL

---

## The Website Link

Once everything is running, open your browser and go to:

**http://localhost:5173**

This is the frontend React application.

---

## If You Need Backend API

The backend API runs at:
**http://localhost:5000/api**

Health check: http://localhost:5000/api/health

---

## Login

Use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Doctor | doctor@medico.com | doctor123 |
| Police | police@medico.com | police123 |
| Judge | judge@medico.com | judge123 |
| Patient | patient@medico.com | patient123 |