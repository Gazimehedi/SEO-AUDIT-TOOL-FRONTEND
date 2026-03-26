# Frontend Deployment Guide (SEO Tool)

The frontend is a **Next.js 14 (App Router)** application configured to perform optimally as a stateless client that communicates with the backend API.

## Environment Variables (.env)
Create a `.env.production` file in this directory:

```bash
NEXT_PUBLIC_API_URL="https://your-api-domain.com"
NEXTAUTH_URL="https://your-frontend-domain.com"
NEXTAUTH_SECRET="a_secure_random_string"
```

*Note: The `NEXT_PUBLIC_API_URL` is critical as it defines where your client-side fetches point to in production.*

## Deployment Steps (Cloudways / VPS)

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Build the Standalone App**:
   ```bash
   npm run build
   ```
   *Our build script automatically copies the static assets and public folder into the `.next/standalone` directory for minimal footprint.*

3. **Install PM2 & Run**:
   If `pm2` is not installed on your VPS, install it globally:
   ```bash
   npm install -g pm2
   ```

   Start the frontend:
   ```bash
   npx pm2 start ecosystem.config.js
   npx pm2 save
   ```
   *Note: Using `npx pm2` ensures the command works even if the global binary path isn't in your server's current $PATH.*

## Deployment Steps (Vercel / Netlify)

1. **Root Directory**: Set to `./frontend`.
2. **Build Command**: `next build`.
3. **Environment Variables**: Add the variables listed above in the provider's Dashboard.
4. **No Database Needed**: The frontend is completely decoupled from your database; it interacts purely with the backend API.

## Requirements
* **Node.js**: 18.x or higher
