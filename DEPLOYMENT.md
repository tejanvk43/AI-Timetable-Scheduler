# 🚀 Notice Board Deployment Guide

## 📋 Prerequisites
- MongoDB Atlas account (free tier available)
- Node.js 16+ installed
- Git installed

## 🗄️ Step 1: MongoDB Atlas Setup

### 1.1 Create Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for free account
3. Create new project: "Notice Board"

### 1.2 Create Database Cluster
1. Click "Build a Database"
2. Choose **FREE** shared cluster
3. Select cloud provider and region
4. Name: "notice-board-cluster"
5. Click "Create Cluster"

### 1.3 Database Access
1. Go to **Database Access** → "Add New Database User"
2. Authentication: **Password**
3. Username: `noticeboarduser` (or your choice)
4. Password: Generate secure password (save this!)
5. Role: "Read and write to any database"
6. Click "Add User"

### 1.4 Network Access
1. Go to **Network Access** → "Add IP Address"
2. Choose "Allow Access from Anywhere" (0.0.0.0/0)
3. Click "Confirm"

### 1.5 Get Connection String
1. Go to **Database** → Click "Connect"
2. Choose "Connect your application"
3. Select "Node.js" version "4.1 or later"
4. Copy connection string:
   ```
   mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## ⚙️ Step 2: Configure Application

### 2.1 Update Environment Variables
1. Open `backend/.env`
2. Replace `MONGODB_URI` with your Atlas connection string:
   ```env
   MONGODB_URI=mongodb+srv://noticeboarduser:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/notice-board?retryWrites=true&w=majority
   ```
3. Update `JWT_SECRET` with a secure random string:
   ```env
   JWT_SECRET=your-super-secure-jwt-secret-at-least-32-characters-long
   ```

### 2.2 Test Local Connection
```bash
cd backend
npm run setup
```

## 🌐 Step 3: Deployment Options

### Option A: Heroku Deployment

#### 3.1 Install Heroku CLI
Download from [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)

#### 3.2 Deploy Backend
```bash
cd backend
heroku login
heroku create your-notice-board-backend
heroku config:set MONGODB_URI="your-atlas-connection-string"
heroku config:set JWT_SECRET="your-jwt-secret"
heroku config:set NODE_ENV=production
git add .
git commit -m "Deploy backend"
git push heroku main
```

#### 3.3 Deploy Frontend
```bash
cd frontend
npm run build
# Deploy dist folder to Netlify/Vercel
```

### Option B: Railway Deployment

#### 3.1 Backend on Railway
1. Go to [Railway](https://railway.app)
2. Connect GitHub repository
3. Deploy backend folder
4. Add environment variables in Railway dashboard

#### 3.2 Frontend on Vercel
1. Go to [Vercel](https://vercel.com)
2. Import GitHub repository
3. Set build command: `npm run build`
4. Set output directory: `dist`

### Option C: DigitalOcean App Platform

#### 3.1 Create App
1. Go to [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
2. Create new app from GitHub
3. Configure backend and frontend services

## 🔧 Step 4: Production Configuration

### 4.1 Update Frontend API URL
In `frontend/.env`:
```env
REACT_APP_API_URL=https://your-backend-domain.com
```

### 4.2 Update CORS Settings
In `backend/server.js`, update CORS for production:
```javascript
app.use(cors({
  origin: ['https://your-frontend-domain.com', 'http://localhost:3000'],
  credentials: true
}));
```

## 🧪 Step 5: Testing

### 5.1 Test Database Connection
```bash
cd backend
npm run setup
```

### 5.2 Test Application
1. Visit your frontend URL
2. Create test notice
3. Test admin login: `admin@college.edu` / `admin123`

## 📝 Step 6: Post-Deployment

### 6.1 Create New Admin Account
1. Change default admin password
2. Create additional admin accounts if needed

### 6.2 Configure File Storage
For production, consider:
- AWS S3 (set `USE_CLOUD_STORAGE=true`)
- Cloudinary
- DigitalOcean Spaces

### 6.3 Set up Domain
1. Purchase domain
2. Configure DNS
3. Set up SSL certificate

## 🚨 Security Checklist

- [ ] Changed default admin password
- [ ] Used secure JWT secret (32+ characters)
- [ ] Restricted MongoDB network access
- [ ] Enabled HTTPS
- [ ] Updated CORS settings
- [ ] Set NODE_ENV=production

## 🆘 Troubleshooting

### Common Issues:
1. **Connection Timeout**: Check MongoDB network access
2. **Authentication Failed**: Verify username/password in connection string
3. **CORS Errors**: Update CORS settings in backend
4. **Images Not Loading**: Check file upload configuration

### Get Help:
- MongoDB Atlas: [Documentation](https://docs.atlas.mongodb.com/)
- Deployment platforms have extensive documentation
- Check application logs for specific errors

## 🎉 Success!

Your Notice Board application should now be deployed and accessible online!

Default admin credentials:
- Email: `admin@college.edu`
- Password: `admin123` (change this immediately!)
