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

**Important:** 
- Your database URL must include SSL parameters for production
- **Format must be:** `postgresql://username:password@host:port/database`
- **All parts are required:** username, password (even if empty), host, port, and database name
- If your password contains special characters, URL-encode them:
  - `@` → `%40`, `:` → `%3A`, `/` → `%2F`, `#` → `%23`, space → `%20`

**Example valid formats:**
```
postgresql://user:password@host.example.com:5432/mydb?sslmode=require
postgresql://user:password123@db.example.com:5432/booking_db
postgresql://user:p%40ssw%3Ard@host:5432/db  (password: p@ssw:rd)
```

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

### Step 4: Database Tables (Auto-Created)

**Good News!** Tables are now automatically created on first request when deploying to Vercel. The system will:

1. Check if database tables exist on the first API request
2. Automatically create all tables if they don't exist
3. Use the correct order to handle foreign key dependencies

**Manual Migration (Optional)**
If you prefer to run migrations manually before deployment:

**Option A: Using Vercel CLI**
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
- **Auto-creation enabled**: Tables are automatically created on first request in Vercel
- The system checks if tables exist and creates them if needed
- For manual control, use `npx sequelize-cli db:migrate` before deployment
- Tables are created in the correct order to handle foreign key dependencies

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
- **Error: "The dialect jdbc is not supported"**: This occurs if your `DATABASE_URL` has a `jdbc:` prefix. The code now automatically removes this prefix, but ensure your `DATABASE_URL` format is: `postgresql://username:password@host:port/database` (not `jdbc:postgresql://...`)
- **Error: "Please install pg package manually"**: This occurs when the `pg` (PostgreSQL driver) package isn't installed. Ensure `pg` is in your `package.json` dependencies (it should be: `"pg": "^8.16.3"`). The code now explicitly requires `pg` to ensure it's loaded. If the error persists, try:
  - Clearing Vercel build cache
  - Redeploying the project
  - Verifying `package.json` is committed to your repository
- **Error: "SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string"**: This occurs when the password in your `DATABASE_URL` is missing, undefined, or improperly formatted. To fix:
  1. Check your `DATABASE_URL` in Vercel environment variables
  2. Ensure the format is: `postgresql://username:password@host:port/database`
  3. If your password contains special characters (like `@`, `:`, `/`, `#`, etc.), you must URL-encode them:
     - `@` becomes `%40`
     - `:` becomes `%3A`
     - `/` becomes `%2F`
     - `#` becomes `%23`
     - Space becomes `%20` or `+`
  4. Example: If password is `p@ssw:rd`, use `p%40ssw%3Ard` in the URL
  5. Verify the password is not empty in your database connection string

- **Error: "Invalid DATABASE_URL: missing username"**: This occurs when your `DATABASE_URL` is malformed or missing the username. To fix:
  1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
  2. Check your `DATABASE_URL` value
  3. Ensure it follows the format: `postgresql://username:password@host:port/database`
  4. **Common issues:**
     - Missing `://` after `postgresql`
     - Missing `@` between credentials and host
     - Missing `:` between username and password (use `username:@host` if no password)
     - Extra spaces or line breaks in the URL
  5. **Test your URL format:** The URL should look like: `postgresql://myuser:mypass@db.example.com:5432/mydb`
  6. If using Vercel Postgres, copy the connection string directly from the Vercel Postgres dashboard

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

