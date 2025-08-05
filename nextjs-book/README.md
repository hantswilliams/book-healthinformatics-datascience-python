# Health Informatics Learning Platform - Next.js Version

A modern, interactive web application for learning Python in the context of healthcare data analysis, built with Next.js, TypeScript, and Pyodide.

## 🚀 Features

- **Interactive Python Editor**: Monaco Editor with syntax highlighting and keyboard shortcuts
- **Browser-based Python Execution**: Pyodide for client-side Python execution
- **User Authentication**: Complete login/registration system with NextAuth.js
- **Progress Tracking**: Personal dashboards and learning progress monitoring
- **Role-based Access Control**: Admin, Instructor, and Student roles with different permissions
- **Database Integration**: SQLite database with Prisma ORM for user management
- **Markdown Content**: React-based markdown rendering with syntax highlighting
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **TypeScript**: Full type safety throughout the application
- **Healthcare Focus**: Content specifically designed for medical informatics and healthcare data analysis

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Authentication**: NextAuth.js with credentials provider
- **Database**: SQLite with Prisma ORM
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

2. **Set up the database**
   ```bash
   npm run db:reset
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
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

The Next.js app includes a local SQLite database with Prisma ORM for testing and development:

### Database Features
- **SQLite Database**: Local `prisma/dev.db` file for development
- **Prisma ORM**: Type-safe database operations
- **Seeded Data**: Pre-populated with test users, chapters, and exercises
- **API Routes**: RESTful endpoints for database operations

### Database Schema
- **Users**: Authentication and user management
- **Chapters**: Learning content structure
- **Progress**: User completion tracking
- **Exercises**: Code execution history

### Test Database
Visit `/test-db` to view all database content and test API endpoints.

### Database Management
```bash
# View database in browser GUI
npm run db:studio

# Reset database with fresh test data
npm run db:reset

# View database file
ls -la prisma/dev.db
```

## 🔐 Demo Accounts

The application comes with pre-seeded demo accounts for testing different user roles:

### Demo Login Credentials
All demo accounts use the password: **`password123`**

| Role | Email | Username | Access Level |
|------|-------|----------|--------------|
| **Student** | `student1@healthinformatics.com` | `student1` | Chapter access, progress tracking |
| **Student** | `student2@healthinformatics.com` | `student2` | Chapter access, progress tracking |
| **Instructor** | `instructor@healthinformatics.com` | `instructor` | Course content management |
| **Admin** | `admin@healthinformatics.com` | `admin` | Full platform administration |

### Account Features by Role

#### 👨‍🎓 Student Accounts
- Access to all learning chapters
- Personal progress tracking
- Exercise completion monitoring
- Account settings management

#### 👨‍🏫 Instructor Account
- Everything students have access to
- Course content management capabilities
- Student progress monitoring

#### ⚡ Admin Account
- Full platform administration
- User management dashboard
- System statistics and analytics
- Database management tools

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
- **User Authentication**: Complete NextAuth.js implementation with role-based access
- **Database Integration**: Full Prisma ORM integration with SQLite
- **Progress Persistence**: Server-side progress tracking and storage
- **Admin Panel**: Comprehensive admin dashboard with user management
- **Account Management**: User profile editing and account settings
- **Progress Dashboard**: Personal learning progress visualization

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
