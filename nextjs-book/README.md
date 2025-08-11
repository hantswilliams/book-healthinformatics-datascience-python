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
