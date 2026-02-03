# HealthSync Authentication System

Complete documentation for the HealthSync authentication and authorization system.

## Overview

HealthSync uses JWT (JSON Web Tokens) for stateless authentication. The system supports:
- Email/password authentication
- Google OAuth with PIN protection
- Password reset via OTP
- Role-based access control (doctor/organization)
- 7-day token expiration
- Session persistence across page reloads

## Authentication Flow

### 1. Email/Password Login

```
Frontend                Backend                  Database
   |                       |                        |
   |-- POST /api/auth/login with {email, password}->|
   |                       |                        |
   |                       |-- Query user by email->|
   |                       |<-- Return user data ---|
   |                       |                        |
   |                       |-- bcrypt.compare() --->|
   |                       |                        |
   |                       |-- Generate JWT token ->|
   |                       |                        |
   |<-- {token, user} -----|                        |
   |                       |                        |
   |-- Store token in localStorage/sessionStorage ->|
   |                       |                        |
   |-- Redirect to /dashboard                       |
```

**Request:**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "c5ff6aff-52af-4d53-bfd2-b57f86627762",
    "email": "user@example.com",
    "role": "doctor",
    "profile": {
      "name": "Dr. Smith"
    }
  }
}
```

**Response (Failure):**
```json
{
  "error": "Invalid credentials"
}
```

### 2. User Signup

```
Frontend                Backend                  Database
   |                       |                        |
   |-- POST /api/auth/signup with user data ------>|
   |                       |                        |
   |                       |-- Check if email exists|
   |                       |<-----------------------|
   |                       |                        |
   |                       |-- bcrypt.hash(password)|
   |                       |                        |
   |                       |-- Insert user -------->|
   |                       |<-- User created -------|
   |                       |                        |
   |                       |-- Generate JWT token ->|
   |                       |                        |
   |<-- {token, user} -----|                        |
   |                       |                        |
   |-- Store token ------->|                        |
   |-- Redirect to /dashboard                       |
```

**Request:**
```bash
POST /api/auth/signup
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "role": "doctor",
  "profile": {
    "name": "Dr. John Doe",
    "specialty": "Cardiology"
  }
}
```

**Response (Success):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "new-user-id",
    "email": "newuser@example.com",
    "role": "doctor",
    "profile": {
      "name": "Dr. John Doe",
      "specialty": "Cardiology"
    }
  }
}
```

### 3. Google OAuth Login

```
Frontend                Backend                  Google        Database
   |                       |                        |             |
   |-- Click Google Sign In|                        |             |
   |                       |                        |             |
   |<-- Google credential ---|                      |             |
   |                       |                        |             |
   |-- POST /api/auth/google with credential ------>|             |
   |                       |                        |             |
   |                       |-- Verify credential -->|             |
   |                       |<-- User info -----------|             |
   |                       |                        |             |
   |                       |-- Query user by email ------------->|
   |                       |<-- User data (if exists) -----------|
   |                       |                        |             |
   |<-- {needPin: true, hasPin: boolean} -----------|             |
   |                       |                        |             |
   |-- User enters PIN --->|                        |             |
   |                       |                        |             |
   |-- POST /api/auth/google with credential + PIN ->|            |
   |                       |                        |             |
   |                       |-- Verify PIN ----------------------->|
   |                       |<-- PIN valid -----------------------|
   |                       |                        |             |
   |                       |-- Generate JWT token ->|             |
   |                       |                        |             |
   |<-- {token, user} -----|                        |             |
```

**Step 1: Check if PIN exists**
```bash
POST /api/auth/google
Content-Type: application/json

{
  "credential": "google-oauth-credential-string"
}
```

**Response:**
```json
{
  "needPin": true,
  "hasPin": false
}
```

**Step 2: Submit PIN**
```bash
POST /api/auth/google
Content-Type: application/json

{
  "credential": "google-oauth-credential-string",
  "pin": "1234",
  "setPinForFuture": true
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "email": "user@gmail.com",
    "role": "doctor",
    "profile": {
      "name": "John Smith",
      "picture": "https://..."
    }
  }
}
```

### 4. Session Verification (/me endpoint)

```
Frontend                Backend                  Database
   |                       |                        |
   |-- GET /api/auth/me with Authorization header >|
   |                       |                        |
   |                       |-- Verify JWT token --->|
   |                       |                        |
   |                       |-- Query user by ID --->|
   |                       |<-- User data -----------|
   |                       |                        |
   |<-- {user} ------------|                        |
```

**Request:**
```bash
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (Success):**
```json
{
  "user": {
    "id": "c5ff6aff-52af-4d53-bfd2-b57f86627762",
    "email": "user@example.com",
    "role": "doctor",
    "profile": {
      "name": "Dr. Smith"
    }
  }
}
```

**Response (Failure):**
```json
{
  "error": "invalid token"
}
```

### 5. Password Reset Flow

#### Step 1: Request OTP
```bash
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "If the email exists, an OTP has been sent"
}
```

An email with a 6-digit OTP is sent to the user (valid for 10 minutes).

#### Step 2: Reset Password with OTP
```bash
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newpassword123"
}
```

**Response (Success):**
```json
{
  "message": "Password reset successful"
}
```

**Response (Failure):**
```json
{
  "error": "Invalid or expired OTP"
}
```

## JWT Token Structure

### Token Payload
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "role": "doctor",
  "iat": 1770063297,
  "exp": 1770668097
}
```

### Token Properties
- **Algorithm**: HS256 (HMAC with SHA-256)
- **Expiration**: 7 days from issue
- **Secret**: Stored in `JWT_SECRET` environment variable

## Frontend Integration

### AuthProvider Context

The React app uses `AuthProvider` to manage authentication state:

```typescript
import { useAuth } from './lib/auth'

function MyComponent() {
  const { user, loading, login, logout, authFetch } = useAuth()
  
  // Check if user is logged in
  if (loading) return <div>Loading...</div>
  if (!user) return <div>Please log in</div>
  
  return <div>Welcome {user.email}</div>
}
```

### Login Function

```typescript
const { login } = useAuth()

async function handleLogin(email: string, password: string, remember: boolean) {
  try {
    await login(email, password, remember)
    // User is now logged in, redirect to dashboard
    navigate('/dashboard')
  } catch (error) {
    // Handle error
    console.error('Login failed:', error)
  }
}
```

### Authenticated API Requests

```typescript
const { authFetch } = useAuth()

async function fetchPatients() {
  const response = await authFetch('/api/patients')
  const data = await response.json()
  return data
}
```

The `authFetch` function automatically adds the JWT token to the Authorization header.

### Token Storage

Tokens are stored based on the "remember me" option:
- **Remember me = true**: localStorage (persists across browser sessions)
- **Remember me = false**: sessionStorage (cleared when browser closes)

## Backend Implementation

### JWT Generation

```javascript
const jwt = require('jsonwebtoken')

function signToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    }, 
    process.env.JWT_SECRET, 
    { expiresIn: '7d' }
  )
}
```

### Token Verification

```javascript
const jwt = require('jsonwebtoken')

function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    return decoded
  } catch (error) {
    throw new Error('Invalid token')
  }
}
```

### Password Hashing

```javascript
const bcrypt = require('bcryptjs')

// Hash password during signup
const salt = await bcrypt.genSalt(10)
const hash = await bcrypt.hash(password, salt)

// Verify password during login
const isValid = await bcrypt.compare(password, user.passwordHash)
```

## Security Best Practices

### Implemented
✅ Passwords hashed with bcrypt (10 rounds)
✅ JWT tokens with 7-day expiration
✅ CORS configuration for specific origins
✅ HTTPS required in production
✅ Password reset with time-limited OTP
✅ Google OAuth with additional PIN protection
✅ Input validation on all endpoints
✅ Error messages don't leak sensitive information

### Recommended for Production
⚠️ Rate limiting on login/signup endpoints
⚠️ Account lockout after failed login attempts
⚠️ Email verification on signup
⚠️ Two-factor authentication (2FA)
⚠️ Token refresh mechanism
⚠️ Security headers (helmet.js)
⚠️ SQL injection prevention (using parameterized queries)
⚠️ XSS protection (input sanitization)

## Testing Authentication

### Manual Testing

1. **Test Signup:**
```bash
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","role":"doctor"}'
```

2. **Test Login:**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

3. **Test /me endpoint:**
```bash
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Automated Testing

Run the test script:
```bash
./test-auth.sh
```

This tests:
- Health check
- User signup
- User login
- Token validation
- Invalid credentials rejection

## Troubleshooting

### "Invalid token" error
- Token may have expired (7 days)
- JWT_SECRET may have changed
- Token may be malformed
- Solution: Log out and log in again

### "Invalid credentials" error
- Wrong email or password
- User doesn't exist
- Solution: Verify credentials or create new account

### "User already exists" error
- Email is already registered
- Solution: Use different email or login instead

### CORS errors
- Frontend origin not allowed
- Solution: Add frontend URL to CORS whitelist in backend/index.js

### Token not persisting after refresh
- Check browser storage (localStorage/sessionStorage)
- Verify token is being stored correctly
- Check /api/auth/me endpoint is responding

## Environment Variables

### Backend (.env)
```env
JWT_SECRET=your-very-secure-secret
MONGODB_URI=mongodb+srv://...
FRONTEND_URL=http://localhost:3000
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:4000
VITE_GOOGLE_CLIENT_ID=your-client-id
```

## API Reference

### POST /api/auth/signup
Create a new user account.

### POST /api/auth/login
Authenticate with email and password.

### POST /api/auth/google
Authenticate with Google OAuth.

### GET /api/auth/me
Get current authenticated user.

### PUT /api/auth/me
Update current user profile.

### POST /api/auth/logout
Logout (client-side token clearing).

### POST /api/auth/forgot-password
Request password reset OTP.

### POST /api/auth/reset-password
Reset password with OTP.

For detailed API documentation, see the code in `backend/routes/auth.js`.
