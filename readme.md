# Health Informatics Python Learning Platform

This repository hosts the materials for an interactive Python course focused on healthcare data analysis. The primary application lives in the `nextjs-book/` directory and delivers a web-based learning experience with in-browser code execution, markdown-driven lessons, and multi-tenant user management.

## Repository Structure

- `nextjs-book/` – Next.js 15 application with the full learning platform; see [`nextjs-book/README.md`](nextjs-book/README.md) for detailed documentation.【F:nextjs-book/README.md†L1-L112】
- `enhancements/` – HTML prototypes showcasing alternative Pyodide and Monaco editor integrations.【F:enhancements/pyodide_pandas_monaco_polished_shared_cell_state.html†L1-L16】
- `additional-migration-auth-user-id.sql`, `migration-multi-org.sql`, and other `*.sql` files – Database migrations and fixes for Supabase/PostgreSQL deployments.【F:migration-multi-org.sql†L1-L23】
- `MULTI-ORG-IMPLEMENTATION.md`, `domains.md`, `readme.pdf` – Design notes, naming ideas, and supporting course documentation.【F:MULTI-ORG-IMPLEMENTATION.md†L1-L21】【F:domains.md†L1-L6】

## Quick Start (Next.js App)

1. **Install dependencies**
   ```bash
   cd nextjs-book
   npm install
   ```
2. **Configure environment**
   ```bash
   cp .env.example .env.local
   # add your PostgreSQL and Supabase settings
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
5. Open [http://localhost:3000](http://localhost:3000) to access the app.【F:nextjs-book/README.md†L58-L99】

## Key Features

- Interactive Python editor powered by Pyodide for browser-based execution.【F:nextjs-book/README.md†L8-L17】
- Role-based authentication and multi-organization support using NextAuth.js and PostgreSQL/Prisma.【F:nextjs-book/README.md†L18-L40】
- Chapter-based markdown content with progress tracking and a modern Tailwind CSS UI.【F:nextjs-book/README.md†L41-L74】
- Supabase-compatible SQL migrations and setup guides for email, storage, and RLS policies located under `nextjs-book/`.【F:nextjs-book/README.md†L113-L208】

## Additional Resources

- Quick setup, email/SMTP, and edge function instructions are provided in `nextjs-book/QUICK_START.md`, `SUPABASE_SMTP_SETUP.md`, and related guides within `nextjs-book/`.【F:nextjs-book/QUICK_START.md†L1-L26】【F:nextjs-book/SUPABASE_SMTP_SETUP.md†L1-L35】
- Architecture, migration plans, and package management details can be found in the various `*_IMPLEMENTATION.md` files under `nextjs-book/`.【F:nextjs-book/MIGRATION_PLAN.md†L1-L33】【F:nextjs-book/PACKAGE_MANAGEMENT_IMPLEMENTATION.md†L1-L28】

## Contributing

1. Fork the repository and create a feature branch.
2. Make and document your changes.
3. Run linting/tests as appropriate for the `nextjs-book` app (e.g., `npm run lint`).
4. Submit a pull request describing your updates.
