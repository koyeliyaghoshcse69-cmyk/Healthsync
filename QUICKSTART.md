# HealthSync Quick Start Guide

Get HealthSync running in under 5 minutes!

## Prerequisites

- Node.js 22.x installed
- Two terminal windows

## Quick Setup

### 1. Install Dependencies

```bash
# From project root
npm install
cd backend && npm install
cd ../react && npm install
cd ..
```

### 2. Start Backend Server

**Terminal 1:**
```bash
cd backend
npm start
# Server starts on http://localhost:4000
```

The backend will use in-memory storage by default (no MongoDB required for testing).

### 3. Start Frontend Server

**Terminal 2:**
```bash
cd react
npm run dev
# Frontend starts on http://localhost:3000
```

### 4. Access the Application

Open your browser to: **http://localhost:3000**

## Test the Login Flow

### Option 1: Demo Account
Click "Try the demo account" on the login page

**Credentials:**
- Email: `test@gmail.com`
- Password: `testacc`

### Option 2: Create New Account
1. Go to signup page
2. Enter email and password
3. Choose role (Doctor or Organization)
4. Submit form

### Option 3: Run Automated Tests

```bash
# Start backend first, then run:
./test-auth.sh
```

This will test:
- ✓ Health check
- ✓ User signup
- ✓ User login
- ✓ Token validation
- ✓ Invalid credentials rejection

## Verify Everything Works

### Check Backend Health

```bash
curl http://localhost:4000/health
```

Expected response:
```json
{
  "ok": true,
  "status": "healthy",
  "timestamp": "...",
  "uptime": 123.45,
  "socketConnections": 0,
  "socketEnabled": true
}
```

### Test Login API

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com","password":"testacc"}'
```

Expected response:
```json
{
  "token": "eyJhbGci...",
  "user": {
    "id": "...",
    "email": "test@gmail.com",
    "role": "doctor",
    "profile": {...}
  }
}
```

## Features You Can Test

Once logged in, you can:

✅ View dashboard with analytics
✅ Create and manage patients
✅ Add diagnoses with ICD-11 codes
✅ Search for disease information
✅ View real-time notifications
✅ Use AI chat for patient health information
✅ Generate reports

## Environment Configuration

### Backend (.env file is already configured)

The backend uses these default values:
- No MongoDB (in-memory storage)
- JWT secret for development
- Port 4000
- Socket.IO enabled

### Frontend (.env.local is already configured)

The frontend uses:
- Backend URL: http://localhost:4000
- Socket URL: http://localhost:4000
- Google OAuth (optional)

## Adding MongoDB (Optional)

To persist data between server restarts:

1. Create a free MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a cluster and get connection string
3. Edit `backend/.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
   MONGODB_DB=healthsync
   ```
4. Restart backend server

## Troubleshooting

### Backend won't start
- Check if port 4000 is available: `lsof -i :4000`
- Kill any process using it: `pkill -f "node index.js"`

### Frontend won't start
- Check if port 3000 is available: `lsof -i :3000`
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### Can't login
- Verify backend is running: `curl http://localhost:4000/health`
- Check browser console for errors
- Try demo account first: test@gmail.com / testacc

### CORS errors
- Verify FRONTEND_URL in backend/.env matches your frontend URL
- Check backend/index.js CORS configuration includes your frontend origin

## Next Steps

1. **Read SETUP.md** for detailed configuration options
2. **Add MongoDB** for data persistence
3. **Configure email** for password reset functionality
4. **Set up Google OAuth** for Google Sign-In
5. **Add Groq API key** for AI features
6. **Deploy to Vercel** for production use

## Production Deployment

For production deployment instructions, see SETUP.md

Quick deploy to Vercel:
```bash
npm i -g vercel
vercel
```

## Need Help?

- Check backend logs in Terminal 1
- Check frontend console in browser DevTools
- Review SETUP.md for detailed troubleshooting
- Run `./test-auth.sh` to verify backend is working

## Architecture Overview

```
┌─────────────────┐         ┌─────────────────┐
│   React App     │  HTTP   │  Express API    │
│  (Port 3000)    │ ◄─────► │  (Port 4000)    │
│                 │         │                 │
│  - Auth UI      │         │  - JWT Auth     │
│  - Dashboard    │         │  - User CRUD    │
│  - Patient Mgmt │         │  - Patient API  │
└─────────────────┘         └─────────────────┘
                                    │
                                    ▼
                            ┌───────────────┐
                            │   MongoDB     │
                            │ (or in-memory)│
                            └───────────────┘
```

## Happy Coding! 🚀

HealthSync is now running and ready for development!
