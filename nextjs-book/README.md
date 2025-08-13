# Health Informatics Learning Platform - Next.js Version.

A modern, interactive web application for learning Python in the context of healthcare data analysis, built with Next.js, TypeScript, and Pyodide.

## 🚀 Features

- **Interactive Python Editor**: Monaco Editor with syntax highlighting and keyboard shortcuts
- **Browser-based Python Execution**: Pyodide for client-side Python execution
- **User Authentication**: Complete login/registration system with NextAuth.js
- **Progress Tracking**: Personal dashboards and learning progress monitoring
- **Role-based Access Control**: Admin, Instructor, and Student roles with different permissions
- **Database Integration**: PostgreSQL database with Prisma ORM for scalable user management
- **Markdown Content**: React-based markdown rendering with syntax highlighting
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **TypeScript**: Full type safety throughout the application
- **Healthcare Focus**: Content specifically designed for medical informatics and healthcare data analysis

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Authentication**: NextAuth.js with credentials provider
- **Database**: PostgreSQL with Prisma ORM and Prisma Accelerate
- **Styling**: Tailwind CSS
- **Python Runtime**: Pyodide v0.26.4
- **Code Editor**: Monaco Editor
- **Markdown**: React Markdown with GFM support
- **Deployment**: Vercel-ready

## 📚 Key Components

### Core Features
- `PythonEditor`: Interactive Python code editor with execution capabilities
- `MarkdownRenderer`: Dynamic markdown content loading and rendering
- `Sidebar`: Chapter navigation with progress tracking
- `Header`: User authentication and navigation

### Python Integration
- Browser-based Python execution using Pyodide
- Real-time code execution without server requirements
- Support for popular Python libraries (can be extended)
- Interactive output console

### Content Structure
- Chapter-based learning modules
- Healthcare-focused Python examples
- Progressive difficulty levels
- Real-world dataset examples

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Add your PostgreSQL connection strings
   ```

3. **Set up the database**
   ```bash
   npx prisma migrate dev
   npm run db:seed
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database Scripts

- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:seed` - Seed database with test data
- `npm run db:reset` - Reset and reseed database

## 🗄️ Database

The application uses a production-ready PostgreSQL database with Prisma ORM:

### Database Features
- **PostgreSQL Database**: Scalable production database with connection pooling
- **Prisma Accelerate**: Built-in caching and connection pooling for optimal performance
- **Multi-tenant Architecture**: Organizations, users, books, and progress tracking
- **Role-based Access Control**: Owner, Admin, Instructor, and Learner roles
- **Subscription Management**: Integrated billing and subscription tracking

### Database Schema
- **Organizations**: Multi-tenant boundary with billing
- **Users**: Authentication and role management
- **Books & Chapters**: Hierarchical content structure with sections
- **Progress**: Detailed learning progress tracking
- **Exercises**: Interactive code execution history
- **BookAccess**: Granular content access control
- **BillingEvents**: Audit trail for subscription events

### Environment Configuration
```bash
# Required environment variables
DATABASE_URL="postgres://username:password@host:5432/database?sslmode=require"
PRISMA_DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=your_key"
```

### Database Management
```bash
# View database in browser GUI
npm run db:studio

# Apply schema changes
npx prisma migrate dev

# Seed with demo data
npm run db:seed

# Reset database (development only)
npm run db:reset
```

## 🔐 Demo Accounts

The application comes with pre-seeded demo accounts for testing different user roles:

### Demo Login Credentials
All demo accounts use the password: **`password123`**

| Role | Email | Username | Access Level |
|------|-------|----------|--------------|
| **Owner** | `owner@demo-org.com` | `owner` | Organization owner, billing management |
| **Admin** | `admin@demo-org.com` | `admin` | Content management, user administration |
| **Instructor** | `instructor@demo-org.com` | `instructor` | Content assignment, progress monitoring |
| **Learner** | `learner@demo-org.com` | `learner` | Learning content access, progress tracking |

### Account Features by Role

#### 👑 Owner Account
- Organization management and billing
- Subscription and payment management
- Full user management capabilities
- Complete platform administration

#### ⚙️ Admin Account
- Content creation and management
- User invitation and role assignment
- Progress monitoring and reporting
- Organization settings management

#### 👨‍🏫 Instructor Account
- Content assignment to learners
- Progress monitoring and analytics
- Learning content access
- Student performance tracking

#### 🎓 Learner Account
- Interactive learning content access
- Personal progress tracking
- Exercise completion and scoring
- Account profile management

### Quick Login
Visit the homepage and use the demo account boxes, or go directly to `/login` and use any of the email addresses above with password `password123`.

## 📖 Usage

### Adding New Chapters

1. **Update chapter data**
   ```typescript
   // src/data/chapters.ts
   export const chapters: Chapter[] = [
     {
       id: 'chapter3',
       title: 'Chapter 3 - Advanced Analytics',
       emoji: '📊',
       order: 3,
       markdownUrl: '/docs/chapter3.md',
       pythonUrl: '/python/chapter3_examples.py'
     }
   ];
   ```

2. **Add content files**
   - Place markdown files in `public/docs/`
   - Place Python code files in `public/python/`

### Customizing the Python Environment

The Python environment is initialized in `src/lib/usePyodide.ts`. You can extend it with additional packages:

```typescript
// Load additional packages
await pyodideInstance.loadPackage(['numpy', 'matplotlib', 'pandas']);
```

## 📧 Supabase Setup

This application uses **Supabase** for authentication, database, and email functionality. Follow these steps to set up your Supabase project:

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Note your **PROJECT_REF** from the URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`
4. Go to **Settings > API** and copy your:
   - Project URL (e.g., `https://YOUR_PROJECT_REF.supabase.co`)
   - Anon public key
   - Service role key (keep secret!)

### Step 2: Environment Variables

Add these to your `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# App Configuration  
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Database Setup

Run these SQL scripts in your **Supabase Dashboard > SQL Editor**:

#### 3.1 Create Database Tables

```sql
-- Run supabase-migration.sql first
-- This creates all tables: organizations, users, books, chapters, etc.
-- File: supabase-migration.sql (copy contents and run in SQL Editor)
```

#### 3.2 Create Verification Codes Table

```sql
-- Create verification_codes table for passwordless login
CREATE TABLE verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ NULL,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_verification_codes_email ON verification_codes(email);
CREATE INDEX idx_verification_codes_expires_at ON verification_codes(expires_at);

-- Enable Row Level Security
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow anonymous read access" ON verification_codes
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow service role full access" ON verification_codes
  FOR ALL TO service_role USING (true);

CREATE POLICY "Allow authenticated users to update verification codes" ON verification_codes
  FOR UPDATE TO authenticated USING (true);

-- Cleanup function for expired codes
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM verification_codes 
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;
```

#### 3.3 Set up Row Level Security Policies

```sql
-- Run supabase-rls-policies.sql
-- This sets up security policies for all tables
-- File: supabase-rls-policies.sql (copy contents and run in SQL Editor)
```

### Step 4: Email Setup (SMTP)

#### 4.1 Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Other platforms: https://supabase.com/docs/guides/cli
```

#### 4.2 Deploy Email Function

```bash
# Login and link your project
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Set up SMTP secrets (example with Gmail)
supabase secrets set SMTP_HOST=smtp.gmail.com
supabase secrets set SMTP_PORT=587
supabase secrets set SMTP_USER=your-email@gmail.com
supabase secrets set SMTP_PASS=your-gmail-app-password
supabase secrets set FROM_EMAIL=your-email@gmail.com

# Deploy the email function
supabase functions deploy send-email-smtp
```

#### 4.3 Gmail App Password Setup

For Gmail SMTP:
1. Enable 2-Factor Authentication on your Google account
2. Go to [Google Account Settings](https://myaccount.google.com)
3. **Security → 2-Step Verification → App passwords**
4. Generate a new app password for "Mail"
5. Use this app password (not your regular password) as `SMTP_PASS`

#### 4.4 Alternative Email Providers

**Outlook/Hotmail:**
```bash
supabase secrets set SMTP_HOST=smtp-mail.outlook.com
supabase secrets set SMTP_USER=your-email@outlook.com
supabase secrets set SMTP_PASS=your-account-password
```

**Custom SMTP:**
```bash
supabase secrets set SMTP_HOST=smtp.your-provider.com
supabase secrets set SMTP_PORT=587
supabase secrets set SMTP_USER=your-username
supabase secrets set SMTP_PASS=your-password
```

### Step 5: Test Your Setup

#### 5.1 Test Database Connection

```bash
npm run dev
# Visit http://localhost:3000/test-db to verify database connection
```

#### 5.2 Test Email Function

```bash
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-email-smtp" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<h1>🎉 SMTP is working!</h1><p>Your verification code workflow is ready.</p>"
  }'
```

#### 5.3 Test Verification Code Flow

1. **Send Code**: POST to `/api/auth/send-code`
   ```json
   {"email": "test@yourdomain.com", "orgSlug": "demo-org"}
   ```

2. **Check Email**: You should receive a 6-digit verification code

3. **Verify Code**: POST to `/api/auth/verify-code`
   ```json
   {"email": "test@yourdomain.com", "code": "123456", "orgSlug": "demo-org"}
   ```

### 🔧 Troubleshooting

#### Function Not Found
```bash
supabase functions list  # Check if deployed
supabase functions deploy send-email-smtp  # Redeploy if needed
```

#### Email Not Sending
```bash
supabase functions logs send-email-smtp  # Check function logs
supabase secrets list  # Verify secrets are set
```

#### Development Mode
If SMTP isn't configured, emails will be logged to console:
```
📧 Email fallback (SMTP function not deployed): {
  to: ['user@example.com'],
  subject: 'Your verification code: 123456'
}
```

### 📁 Important Files

- `supabase-migration.sql` - Complete database schema
- `supabase-verification-codes-table.sql` - Verification codes table
- `supabase-rls-policies.sql` - Security policies
- `supabase/functions/send-email-smtp/` - Email function
- `SUPABASE_SMTP_SETUP.md` - Detailed email setup guide

## 🔄 Migrated from Flask

This Next.js version maintains feature parity with the original Flask application:

### ✅ Migrated Features
- Interactive Python editor with Pyodide
- Markdown content rendering
- Chapter-based navigation
- Responsive design with Tailwind CSS
- Progress tracking (client-side)

### 🔄 Architecture Changes
- **Frontend**: React components instead of Jinja2 templates
- **State Management**: React hooks instead of server-side sessions
- **Python Execution**: Client-side Pyodide instead of server evaluation
- **Content Loading**: Dynamic imports instead of server-side file reading
- **Routing**: Next.js App Router instead of Flask routes

### ✅ Enhanced Features
- **Multi-tenant SaaS Architecture**: Complete organization-based multi-tenancy
- **Subscription Management**: Integrated Stripe billing with multiple tiers
- **User Authentication**: NextAuth.js with role-based access control
- **PostgreSQL Database**: Production-ready database with connection pooling
- **Interactive Content Editor**: Monaco-based content creation and editing
- **Progress Analytics**: Comprehensive learning progress tracking and reporting
- **Team Management**: User invitations and role-based permissions
- **Admin Dashboard**: Full platform administration and monitoring

## 📂 Project Structure

```
nextjs-book/
├── src/
│   ├── app/                    # Next.js App Router pages
│   ├── components/             # React components
│   ├── lib/                    # Utilities and hooks
│   ├── types/                  # TypeScript definitions
│   └── data/                   # Static data and configuration
├── public/                     # Static assets
│   ├── docs/                   # Markdown content
│   └── python/                 # Python code examples
└── package.json
```

## 🌐 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect repository to Vercel
3. Deploy automatically

### Other Platforms
```bash
npm run build
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details
