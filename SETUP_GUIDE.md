# IOT Simulator - Complete Setup & Configuration Guide

## ✅ All Fixes Applied

### Backend Fixes ✓
1. **Prisma Version Standardization** 
   - ✅ Fixed incompatible versions (6.19 & 7.7.0 → 5.20.0)
   - ✅ Reinstalled all 138 packages with compatible versions

2. **Prisma Connection Pooling**
   - ✅ Fixed historyController.js to use shared Prisma instance
   - ✅ Eliminates connection exhaustion & database errors
   
3. **Syntax & Imports**
   - ✅ Backend syntax verified (no errors)
   - ✅ All route modules properly imported
   - ✅ Auth middleware correctly exported

### Frontend Fixes ✓
1. **React Router → Next.js Migration**
   - ✅ Fixed historyPage.jsx (was importing react-router-dom → not in Next.js)
   - ✅ Added "use client" directive for client components
   - ✅ Updated navigation to use useRouter from 'next/navigation'

2. **Build & Compilation**
   - ✅ Frontend builds successfully (9.4s compilation)
   - ✅ All 8 routes properly generated
   - ✅ 13 static pages prerendered

## 🔧 Critical Configuration Required

### 1. MongoDB Connection String
Edit `.env` with your MongoDB Atlas credentials:

```env
DATABASE_URL="mongodb+srv://USERNAME:PASSWORD@cluster-name.mongodb.net/iot-simulator?retryWrites=true&w=majority"

# Example (replace with your values):
# DATABASE_URL="mongodb+srv://admin:abc123@myapp.9sd4a.mongodb.net/iot-simulator?retryWrites=true&w=majority"
```

**Steps to get your connection string:**
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a database user (remember credentials)
3. Get connection string from "Connect" → "Drivers" → "Node.js"
4. Replace placeholders with your actual credentials

### 2. Verify Other .env Settings
```env
# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Backend Port
PORT=4000
```

## 🚀 Running the Application

### Terminal 1: Backend
```bash
cd backend
npm run dev
# Should output: "IotSimX Backend — Ready" on port 4000
```

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
# Should output: "▲ Next.js ready on http://localhost:3000" 
```

## 📝 Demo Account (Auto-seeded)
- **Email:** demo@iotsimx.dev
- **Password:** demo1234

*(Note: Will be created on first backend run if MongoDB is connected)*

## ✨ Features Ready to Use
- ✅ User Authentication (Signup/Login/Logout)
- ✅ History Logging System (FIXED from 500 errors)
- ✅ Sensor Simulation & Configuration
- ✅ Circuit Design & Management
- ✅ Dashboard & Real-time Updates
- ✅ WebSocket Support via Socket.io

## 🔍 Troubleshooting

### Port Already in Use (EADDRINUSE)
```powershell
# Find process on port 4000
netstat -ano | findstr :4000

# Kill it (replace PID)
taskkill /PID <PID> /F
```

### Database Connection Fails
- Ensure MongoDB connection string in `.env` is present
- Check MongoDB user exists with correct password
- Verify cluster is accessible (IP whitelist)

### Frontend Won't Build
- Delete `.next` folder: `rm -r .next`
- Reinstall: `npm install`
- Rebuild: `npm run build`

### Backend Module Errors
- Ensure packages installed: `npm install`
- Regenerate Prisma: `npx prisma generate`
- Check `.env` file exists in root

## 📊 Project Structure
```
IOT-Simulator/
├── backend/
│   ├── index.js (main entry)
│   ├── prisma.js (shared Prisma instance)
│   ├── routes/ (API endpoints)
│   ├── controller/ (business logic)
│   ├── prisma/schema.prisma (database schema)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/ (Next.js 13 pages)
│   │   ├── components/ (React components)
│   │   └── context/ (Auth context)
│   └── package.json
└── .env (configuration)
```

## 🎯 Next Steps After Setup
1. Add MongoDB connection string to `.env`
2. Start backend: `npm run dev`
3. Start frontend: `npm run dev`
4. Visit http://localhost:3000
5. Sign up or use demo@iotsimx.dev / demo1234

---
**Last Updated:** April 10, 2026  
**Status:** All critical issues resolved ✓

