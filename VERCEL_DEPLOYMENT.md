# Vercel Deployment Guide

This guide will help you deploy the Booking Project API to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. A PostgreSQL database (recommended: [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres), [Supabase](https://supabase.com), or [Neon](https://neon.tech))
3. Git repository (GitHub, GitLab, or Bitbucket)

## Required Environment Variables

Set these in your Vercel project settings:

### 1. Database Configuration
```
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
```

**Important:** Your database URL must include SSL parameters for production.

### 2. Authentication
```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**Security Note:** Use a strong, random string for JWT_SECRET. You can generate one using:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Optional Environment Variables
```
NODE_ENV=production
PORT=3000  # Vercel automatically sets this, but you can override if needed
```

## Deployment Steps

### Step 1: Push Your Code to Git

Make sure your code is pushed to your Git repository:
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your Git repository
4. Vercel will auto-detect your project settings

### Step 3: Configure Environment Variables

1. In your Vercel project dashboard, go to **Settings** → **Environment Variables**
2. Add each environment variable:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `JWT_SECRET` - Your JWT secret key
   - `NODE_ENV` - Set to `production`

### Step 4: Run Database Migrations

Before your first deployment, you need to run database migrations:

**Option A: Using Vercel CLI (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Link your project
vercel link

# Run migrations using Vercel's environment
vercel env pull .env.local
npx sequelize-cli db:migrate
```

**Option B: Using a Database Management Tool**
- Connect to your production database
- Run the SQL migrations manually from the `migrations/` folder

**Option C: Create a Migration Endpoint (Temporary)**
You can create a temporary admin endpoint to run migrations, then remove it after first deployment.

### Step 5: Deploy

1. Vercel will automatically deploy when you push to your main branch
2. Or click "Deploy" in the Vercel dashboard
3. Wait for deployment to complete

### Step 6: Verify Deployment

1. Check your deployment URL (provided by Vercel)
2. Test the root endpoint: `https://your-project.vercel.app/`
3. Test your API endpoints

## Project Structure for Vercel

- `vercel.json` - Vercel configuration
- `api/index.js` - Serverless function entry point
- `index.js` - Express app (exported for serverless use)

## Important Notes

### Database Migrations
- **Never use `sync()` in production** - Always use migrations
- Run migrations before first deployment
- Use `npx sequelize-cli db:migrate` to apply migrations

### Serverless Considerations
- Each API request runs in a separate serverless function
- Database connections are pooled automatically by Sequelize
- Cold starts may occur on first request after inactivity

### CORS Configuration
- Update CORS settings if you have a frontend on a different domain
- Current setup allows all origins (update for production if needed)

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Ensure SSL is enabled in your database
- Check database firewall settings

### Migration Errors
- Ensure migrations are run before deployment
- Check database user has proper permissions
- Verify migration files are correct

### Environment Variables Not Working
- Make sure variables are set in Vercel dashboard
- Redeploy after adding new environment variables
- Check variable names match exactly (case-sensitive)

## Post-Deployment

1. **Remove test/verification files** if not needed:
   - `verify_booking.js`
   - `verify_band_price.js`
   - `verify_output*.txt`

2. **Set up custom domain** (optional):
   - Go to Vercel project settings → Domains
   - Add your custom domain

3. **Monitor your deployment**:
   - Check Vercel dashboard for logs
   - Monitor database connections
   - Set up error tracking (optional)

## Support

For issues:
- Check Vercel logs in the dashboard
- Review [Vercel documentation](https://vercel.com/docs)
- Check Sequelize documentation for database issues

