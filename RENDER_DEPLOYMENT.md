# 🚀 Render Deployment Guide

## Quick Deploy to Render

### Option 1: Auto-Deploy with render.yaml (Recommended)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Connect to Render:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml` and create both services

3. **Set Environment Variables:**
   The `render.yaml` will automatically configure most settings, but verify:
   - `MONGODB_URI`: Your Atlas connection string
   - `JWT_SECRET`: Auto-generated secure key
   - `REACT_APP_API_URL`: Auto-set to backend URL

### Option 2: Manual Setup

#### Backend Deployment:
1. **Create Web Service:**
   - New → Web Service
   - Connect GitHub repo
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`

2. **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://ptejanvk:Teja%404569@main.pgpt3dm.mongodb.net/notice-board?retryWrites=true&w=majority&appName=Main
   JWT_SECRET=your-super-secret-jwt-key-for-production
   ```

#### Frontend Deployment:
1. **Create Static Site:**
   - New → Static Site
   - Connect GitHub repo
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `build`

2. **Environment Variables:**
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com
   ```

## 🔧 Troubleshooting Common Issues

### Issue 1: "Cannot find module '/opt/render/project/src/index.js'"
**Solution:** Ensure your `package.json` has correct `main` field and `start` script:
```json
{
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  }
}
```

### Issue 2: Build Failures
**Solution:** Check build commands in Render dashboard:
- Backend: `npm install`
- Frontend: `npm install && npm run build`

### Issue 3: CORS Errors
**Solution:** Update backend CORS configuration to include your Render frontend URL.

### Issue 4: Database Connection Issues
**Solution:** Verify MongoDB Atlas:
- IP whitelist includes `0.0.0.0/0` (or Render's IPs)
- Connection string is correctly URL-encoded
- Database user has proper permissions

## 📝 Pre-Deployment Checklist

- [ ] MongoDB Atlas configured and tested
- [ ] Environment variables set
- [ ] CORS configured for production domains
- [ ] Git repository up to date
- [ ] Build commands tested locally
- [ ] Database connection string URL-encoded

## 🌐 Post-Deployment

1. **Test Your Application:**
   - Frontend: `https://your-app-name.onrender.com`
   - Backend: `https://your-backend-name.onrender.com`

2. **Create Admin User:**
   - Backend will automatically run setup on first deployment
   - Login with: `admin@college.edu` / `admin123`

3. **Update DNS (Optional):**
   - Configure custom domain in Render dashboard
   - Update environment variables with new domain

Your Notice Board is now live! 🎉
