# Deploy Frontend to Vercel

## Steps:
1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Deploy with these settings:
   - Framework: Vite
   - Build Command: npm run build
   - Output Directory: dist
   - Install Command: npm install

## Environment Variables in Vercel:
Set this in your Vercel dashboard:
- VITE_API_BASE_URL=https://your-backend-deployment.herokuapp.com/api

## Deploy Backend Separately:
Since Puppeteer doesn't work on Vercel, deploy the backend to:
- Heroku (recommended)
- Railway
- Render
- DigitalOcean App Platform