# HealthSync Setup Guide

This guide will help you set up HealthSync for both local development and production deployment.

## Prerequisites

- Node.js 22.x
- MongoDB database (MongoDB Atlas recommended for production)
- Google OAuth credentials (optional, for Google Sign-In)
- Email account for password reset functionality (Gmail with App Password recommended)

## Local Development Setup

### 1. Clone and Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../react
npm install
```

### 2. Configure Backend Environment Variables

Create `backend/.env` file (or copy from `.env.example`):

```env
# MongoDB Configuration
# For local dev, you can leave this empty to use in-memory storage
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB=healthsync

# JWT Secret - IMPORTANT: Change this in production!
JWT_SECRET=dev-jwt-secret-change-in-production-12345

# Email Configuration (for password reset)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000

# Server Configuration
PORT=4000
NODE_ENV=development

# Socket.IO enabled for local development
ENABLE_SOCKETS=true

# Groq API (optional for AI features)
GROQ_API_KEY=your-groq-api-key

# SerpAPI (optional for research papers)
SERPAPI_API_KEY=your-serpapi-key
```

### 3. Configure Frontend Environment Variables

Create `react/.env.local` file (or copy from `.env.local.example`):

```env
# Backend API URL (local development)
VITE_API_URL=http://localhost:4000

# Socket.IO URL (for real-time features)
VITE_SOCKET_URL=http://localhost:4000

# API base path
VITE_API_BASE_URL=/api

# Google OAuth Client ID (optional)
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 4. Start Development Servers

#### Terminal 1 - Backend Server:
```bash
cd backend
npm run dev
# Server will run on http://localhost:4000
```

#### Terminal 2 - Frontend Server:
```bash
cd react
npm run dev
# Frontend will run on http://localhost:3000
```

### 5. Test the Login Flow

1. Navigate to `http://localhost:3000`
2. Click "Try the demo account" or create a new account
3. For demo: email: `test@gmail.com`, password: `testacc`

## MongoDB Setup

### Option 1: MongoDB Atlas (Recommended)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier available)
3. Create a database user
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get your connection string and update `MONGODB_URI` in `backend/.env`

### Option 2: In-Memory Storage (Development Only)

If `MONGODB_URI` is not set, the backend will use in-memory storage. This is useful for quick testing but data will be lost on server restart.

## Production Deployment

### Vercel Deployment (Recommended for Frontend + Serverless Backend)

#### 1. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project root
vercel
```

#### 2. Set Environment Variables in Vercel Dashboard

Go to your project settings in Vercel and add these environment variables:

**Backend Variables (for Serverless Functions):**
```
MONGODB_URI=mongodb+srv://...
MONGODB_DB=healthsync
JWT_SECRET=your-production-jwt-secret-change-this
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
FRONTEND_URL=https://your-app.vercel.app
ENABLE_SOCKETS=false
GROQ_API_KEY=your-groq-api-key
SERPAPI_API_KEY=your-serpapi-key
```

**Frontend Variables (Vite):**
```
VITE_API_URL=https://your-app.vercel.app
VITE_SOCKET_URL=https://your-render-backend.onrender.com
VITE_API_BASE_URL=/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Optional: Render Deployment (For Socket.IO Support)

For real-time features, deploy the backend separately to Render:

1. Create account at [Render](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Set build command: `cd backend && npm install`
5. Set start command: `cd backend && node index.js`
6. Add environment variables (same as above, but set `ENABLE_SOCKETS=true`)

## Authentication Flow

### Email/Password Login

1. User enters email and password on `/login`
2. Frontend calls `POST /api/auth/login` with credentials
3. Backend validates against MongoDB (or in-memory store)
4. Backend returns JWT token and user object
5. Frontend stores token in localStorage/sessionStorage
6. Frontend redirects to `/dashboard`

### Google OAuth Login

1. User clicks "Sign in with Google"
2. Google OAuth flow returns credential
3. Frontend calls `POST /api/auth/google` with credential
4. Backend verifies credential with Google
5. User enters 4-digit PIN (creates if first time, verifies if existing)
6. Backend returns JWT token
7. Frontend stores token and redirects to dashboard

### Session Persistence

- JWT tokens are valid for 7 days
- Token is stored in localStorage (remember me) or sessionStorage
- On page refresh, frontend calls `GET /api/auth/me` with token
- If valid, user session is restored
- If invalid, user is redirected to login

## API Endpoints

### Authentication
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/me` - Get current user (requires JWT)
- `PUT /api/auth/me` - Update user profile (requires JWT)
- `POST /api/auth/logout` - Logout (client-side token clearing)
- `POST /api/auth/forgot-password` - Request password reset OTP
- `POST /api/auth/reset-password` - Reset password with OTP

### Health Check
- `GET /health` - Server health status

## Troubleshooting

### Backend won't start
- Check MongoDB connection string in `backend/.env`
- Ensure `JWT_SECRET` is set
- Try running with `NODE_ENV=development node index.js`

### Frontend can't connect to backend
- Verify `VITE_API_URL` in `react/.env.local` matches backend URL
- Check CORS settings in `backend/index.js`
- Ensure backend is running and accessible

### MongoDB connection fails
- Verify connection string format
- Check network access in MongoDB Atlas
- Ensure database user has proper permissions
- Try using in-memory storage (leave `MONGODB_URI` empty)

### Login fails with valid credentials
- Check JWT_SECRET is set in backend
- Verify user exists in database
- Check backend logs for errors
- Test with demo account: `test@gmail.com` / `testacc`

### Token not persisting after refresh
- Check browser console for storage errors
- Verify token is being stored in localStorage/sessionStorage
- Check that `/api/auth/me` endpoint is responding
- Ensure JWT_SECRET hasn't changed

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String,
  passwordHash: String,
  role: String, // 'doctor' or 'organization'
  profile: {
    name: String,
    specialty: String,
    organization: String,
    organizationId: String,
    googlePinHash: String,
    googleSub: String,
    picture: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Organizations Collection
```javascript
{
  _id: ObjectId,
  name: String,
  slug: String,
  admin: String, // user ID
  createdAt: Date
}
```

### Password Resets Collection
```javascript
{
  _id: ObjectId,
  email: String,
  otp: String,
  expiresAt: Date,
  createdAt: Date,
  used: Boolean,
  usedAt: Date
}
```

## Security Best Practices

1. **Always change JWT_SECRET in production** - Use a strong random string
2. **Use HTTPS in production** - Never send credentials over HTTP
3. **Set proper CORS origins** - Don't use wildcard (*) in production
4. **Secure MongoDB connection** - Use connection string with SSL
5. **Use environment variables** - Never commit secrets to Git
6. **Enable rate limiting** - Prevent brute force attacks (not yet implemented)
7. **Validate all inputs** - Backend should validate all user inputs
8. **Use secure email credentials** - Gmail App Passwords recommended

## Support

For issues or questions:
- Check the troubleshooting section above
- Review backend logs for error messages
- Verify all environment variables are set correctly
- Test with demo account first
