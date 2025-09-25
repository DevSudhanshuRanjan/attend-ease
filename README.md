# AttendEase# AttendEase# AttendEase 📊



UPES Attendance Management System - Full Stack Application



## 🚀 GitHub + Render Deployment GuideUPES Attendance Management System**Professional UPES Attendance Management System**



### Step 1: Push to GitHub



1. **Initialize Git (if not already done)**## DeploymentA complete solution for automating attendance tracking at UPES with secure authentication, real-time data scraping, and professional PDF reporting.

   ```bash

   git init

   git add .

   git commit -m "Initial commit: AttendEase full-stack app"### Frontend## 🏗️ Project Structure

   ```

Deploy `frontend` folder to any static hosting service (Netlify/Vercel)

2. **Create GitHub Repository**

   - Go to GitHub and create a new repository named `attend-ease`- Build command: `npm run build`This project is now organized into separate frontend and backend applications:

   - Don't initialize with README (you already have one)

- Output directory: `dist`

3. **Push to GitHub**

   ```bash```

   git remote add origin https://github.com/DevSudhanshuRanjan/attend-ease.git

   git branch -M main### Backend  attendance-calci/

   git push -u origin main

   ```Deploy `backend` folder to Render/Railway/Heroku├── frontend/          # React + Vite Frontend Application



### Step 2: Deploy Backend to Render- Environment: Copy `.env.example` to `.env` and configure│   ├── src/           # React components and services



1. **Go to [Render.com](https://render.com)** and sign up/login- Start command: `npm start`│   ├── package.json   # Frontend dependencies only

2. **Create New Web Service**

   - Click "New" → "Web Service"│   ├── vite.config.js # Vite build configuration

   - Connect your GitHub repository

   - Select your `attend-ease` repository## Local Development│   └── .env.*         # Frontend environment variables



3. **Configure Backend Deployment**│

   ```

   Name: attendease-backend (or your choice)```bash├── backend/           # Node.js + Express API Server

   Runtime: Node

   Build Command: cd backend && npm install# Install dependencies│   ├── config/        # Server configuration files

   Start Command: cd backend && npm start

   ```npm run install:all│   ├── routes/        # API route handlers



4. **Set Environment Variables**│   ├── services/      # Business logic and scraping

   ```

   NODE_ENV=production# Start both frontend and backend│   ├── package.json   # Backend dependencies only

   PORT=10000

   JWT_SECRET=your-super-secure-jwt-secret-key-minimum-32-characters-long-for-productionnpm run dev│   └── .env.example   # Backend environment template

   UPES_PORTAL_URL=https://myupes-beta.upes.ac.in/oneportal/app/auth/login

   CORS_ORIGINS=https://your-frontend-domain.netlify.app,https://your-frontend-domain.vercel.app```│

   RATE_LIMIT_WINDOW_MS=900000

   RATE_LIMIT_MAX_REQUESTS=100└── docs/              # Documentation files

   LOG_LEVEL=info

   HEADLESS_BROWSER=true**Frontend**: http://localhost:5173      ├── README.md      # This file

   BROWSER_TIMEOUT=60000

   ```**Backend**: http://localhost:3001    ├── DEPLOYMENT.md  # Deployment instructions

    ├── SECURITY.md    # Security guidelines

5. **Deploy**    └── *.md          # Other documentation

   - Click "Create Web Service"```

   - Wait for deployment (5-10 minutes)

   - Note your backend URL: `https://attendease-backend.onrender.com`## 🚀 Quick Start



### Step 3: Deploy Frontend### Prerequisites

- Node.js 18+ installed

#### Option A: Netlify (Recommended)- Git for cloning the repository

1. Go to [Netlify](https://netlify.com) and login

2. **New site from Git** → Connect GitHub → Select `attend-ease`### 1. Clone and Setup

3. **Build settings**:```bash

   ```git clone <your-repo-url>

   Base directory: frontendcd attendance-calci

   Build command: npm run build```

   Publish directory: frontend/dist

   ```### 2. Backend Setup

4. **Environment variables**:```bash

   ```cd backend

   VITE_API_BASE_URL=https://your-backend-name.onrender.com/apinpm install

   ```cp .env.example .env

# Edit .env with your configuration

#### Option B: Vercelnpm run dev

1. Go to [Vercel](https://vercel.com) and login```

2. **Import Git Repository** → Select `attend-ease`Backend will run on `http://localhost:3001`

3. **Framework**: Vite

4. **Root Directory**: `frontend`### 3. Frontend Setup (New Terminal)

5. **Environment variables**:```bash

   ```cd frontend

   VITE_API_BASE_URL=https://your-backend-name.onrender.com/apinpm install

   ```npm run dev

```

### Step 4: Update CORS OriginsFrontend will run on `http://localhost:5173`



1. **After frontend is deployed**, update your Render backend environment:## ✨ Features

   ```

   CORS_ORIGINS=https://your-actual-frontend-url.netlify.app- **Secure Authentication**: JWT-based login with UPES portal integration

   ```- **Real-time Data Scraping**: Automated attendance retrieval from UPES portal

- **Professional PDF Reports**: Detailed attendance analytics and summaries

### Step 5: Final Configuration- **Modern React UI**: Responsive design with Tailwind CSS

- **Queue Management**: Efficient processing of attendance requests

1. **Update frontend/.env.production**:- **Rate Limiting**: API protection against abuse

   ```bash- **Comprehensive Logging**: Winston-based logging system

   VITE_API_BASE_URL=https://your-actual-backend.onrender.com/api- **Error Handling**: Robust error management and user feedback

   ```

## 📦 Development Commands

2. **Redeploy frontend** if needed

### Backend Commands

## 📱 Local Development```bash

cd backend

```bashnpm run dev      # Start development server with nodemon

# Install all dependenciesnpm start        # Start production server

npm run install:allnpm run test     # Run backend tests

```

# Start both frontend and backend

npm run dev### Frontend Commands  

``````bash

cd frontend

**Frontend**: http://localhost:5173  npm run dev      # Start Vite dev server

**Backend**: http://localhost:3001npm run build    # Build for production

npm run preview  # Preview production build

## 🔧 Project Structure```



```## 🌐 Deployment

attend-ease/

├── frontend/          # React + Vite (deploy to Netlify/Vercel)### Frontend (Vercel)

│   ├── src/The frontend is configured for seamless Vercel deployment:

│   ├── package.json

│   └── .env.production1. Connect your GitHub repository to Vercel

├── backend/           # Node.js + Express (deploy to Render)2. Set build command: `npm run build`

│   ├── routes/3. Set output directory: `dist`

│   ├── services/4. Deploy automatically on push to main branch

│   ├── package.json

│   └── .env.example### Backend (Railway/Heroku/DigitalOcean)

└── package.json       # Root workspace managementThe backend can be deployed to any Node.js hosting platform:

```

1. Set environment variables from `.env.example`

## ⚡ Quick Deploy Checklist2. Ensure `NODE_ENV=production`

3. Configure PORT for your hosting platform

- [ ] Push code to GitHub4. Update CORS_ORIGINS with your frontend URL

- [ ] Deploy backend to Render with environment variables

- [ ] Deploy frontend to Netlify/Vercel with API URL## 🔧 Environment Configuration

- [ ] Update CORS origins in Render backend

- [ ] Test both frontend and backend are working### Frontend Environment Variables

- [ ] Verify login and attendance fetching worksCreate `frontend/.env.development` and `frontend/.env.production`:

```bash

## 🆘 TroubleshootingVITE_API_BASE_URL=http://localhost:3001/api    # Development

VITE_API_BASE_URL=https://your-api.com/api     # Production

**Backend Issues:**```

- Check Render logs for errors

- Ensure all environment variables are set### Backend Environment Variables  

- Verify Node.js version compatibilityCopy `backend/.env.example` to `backend/.env` and configure:

- `JWT_SECRET`: Strong secret key for authentication

**Frontend Issues:**- `CORS_ORIGINS`: Your frontend URLs

- Check browser console for API errors- `UPES_PORTAL_URL`: UPES portal endpoint

- Verify VITE_API_BASE_URL is correct- Database and logging configuration

- Ensure CORS is properly configured

## 🏢 Architecture Overview

**CORS Errors:**

- Update CORS_ORIGINS in Render backend### Frontend Technologies

- Include both www and non-www versions of your domain- **React 18.2.0**: Modern UI framework

- **Vite 5.0.8**: Lightning-fast build tool

---- **Tailwind CSS**: Utility-first styling

- **Axios**: HTTP client for API communication

🎉 **Your AttendEase app will be live!**- **jsPDF**: Client-side PDF generation

### Backend Technologies
- **Node.js + Express**: RESTful API server
- **Puppeteer**: Automated browser for scraping
- **JWT**: Secure authentication
- **Winston**: Professional logging
- **Rate Limiting**: API protection  
✅ Icon integration (RemixIcon)  

## Technologies Used

- **React 18**: Modern React with hooks
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **jsPDF**: PDF generation
- **jsPDF-AutoTable**: Table generation in PDFs
- **React-SortableJS**: Drag-and-drop functionality
- **RemixIcon**: Icon library

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── App.jsx          # Main application component
├── main.jsx         # React entry point
└── index.css        # Global styles with Tailwind

public/
└── index.html       # HTML template

package.json         # Dependencies and scripts
vite.config.js       # Vite configuration
tailwind.config.js   # Tailwind CSS configuration
postcss.config.js    # PostCSS configuration
```

## Key React Improvements

1. **Component-Based Architecture**: Organized code in reusable React components
2. **State Management**: Used React hooks (useState, useEffect) for reactive state
3. **Modern JavaScript**: Leveraged ES6+ features and React best practices
4. **Type Safety Ready**: Structure supports easy TypeScript integration
5. **Hot Module Replacement**: Instant updates during development
6. **Optimized Builds**: Vite provides fast, optimized production builds

## Functionality Comparison

| Feature | Original | React Version |
|---------|----------|---------------|
| Form validation | ✅ | ✅ |
| Subject CRUD operations | ✅ | ✅ |
| Attendance calculations | ✅ | ✅ |
| PDF generation | ✅ | ✅ |
| Drag & drop reordering | ✅ | ✅ |
| Local storage | ✅ | ✅ |
| Responsive design | ✅ | ✅ |
| Dark theme | ✅ | ✅ |

## Development Notes

- All original calculations and validations are preserved
- localStorage integration works identically to the original
- PDF output format matches the original exactly
- All Tailwind classes and custom CSS are maintained
- Component structure allows for easy future enhancements

## License

MIT