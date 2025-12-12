# Flutter Conversion Game Plan

This document outlines the strategy for converting the `nextjs-book` application to a Cross-Platform Flutter Application (Web, iOS, Android), preserving the core Python embedding functionality.

## 🎯 Goal
Create a high-quality, "wow"-factor Flutter application that replicates the interactive Python book experience. The app will allow users to read chapters and execute Python code snippets directly in the app, using the same "Client-Side" execution model (Pyodide) where possible, or robust Native equivalents.

## 🏗 Architecture & Tech Stack

### 1. Core Framework
- **Flutter**: Latest Stable version.
- **Languages**: Dart (UI/Logic), Python (Embedded).

### 2. State & Data Layer (Local-First Architecture)
We will implement a **Local-First** architecture using SQLite. This ensures the app is fully functional offline and simplifies the initial development loop.

- **Pattern**: Repository Pattern. `UI` -> `Controller (Riverpod)` -> `Repository` -> `Data Source (Local)`.
- **Local Database (Drift/SQLite)**:
  - Primary data store for Web and Mobile.
  - Stores: `Users`, `Organizations`, `Books`, `Chapters`, `Sections`, `Progress`.
  - **Web Support**: Uses `sqlite3_flutter_libs` and `sql.js` (WASM) for consistent behavior.
- **Authentication**:
  - Local-only username/password for Phase 1-3.
  - Passwords stored in plain-text (Demo Mode) or hashed (Production Prep).
- **Seeding**:
  - `DatabaseSeeder` populates initial content (Demo User, Python Course) on first launch.

#### 📊 Data Schema
- **Users**: Local accounts with role-based access.
- **Content**: Hierarchical structure: `Organization` -> `Book` -> `Chapter` -> `Section`.
- **Mixed Content**: Sections can be `MARKDOWN` (Text) or `PYTHON` (Executable Code).

### 3. Python Integration Strategy
This is the most critical component. We will define an abstract `PythonExecutionService` with platform-specific implementations.

#### 🌐 Flutter Web (The "Pyodide" Target)
Since the original app uses Pyodide (WASM), Flutter Web is the natural successor.
- **Mechanism**: Use `dart:js_interop` (or `package:web`) to bridge Dart <-> JavaScript.
- **Implementation**:
  - Load `pyodide.js` from CDN (just like the React app).
  - Create a Dart service that calls `pyodide.runPython()` functionality.
  - **Benefit**: 1:1 compatibility with current behavior.

#### 📱 Mobile (iOS/Android)
**Selected Strategy: Headless WebView**
To ensure 100% consistency with the Web version and leverage the exact same Pyodide environment (including `micropip` package loading behavior), we will use a **Headless WebView** approach.

- **Implementation**:
  - Use `flutter_inappwebview` (or `webview_flutter`) to launch a hidden WebView.
  - Load a local bundled HTML file that initializes Pyodide.
  - Use a text-based Message Channel (JavaScript Bridge) to send code -> execute -> receive output.
- **Pros**: 
  - Exact consistency with Web.
  - No need to cross-compile C-extensions for distinct mobile architectures; we use the WASM packages.
- **Cons**: 
  - Higher memory overhead than native embedding (acceptable for this use case).

### 4. UI/UX Design "Wow" Factors
- **Material 3 / Custom Theme**: High-polish design using `flex_color_scheme`.
- **Animations**: `flutter_animate` for entry effects and smooth transitions (hero animations for book covers).
- **Code Editor**: `flutter_code_editor` or keeping `Monaco` via WebView (Monaco is web-only, so for mobile we might need a native code field or a hybrid approach). *Decision: Use a native Flutter code editor for better mobile UX, or a WebView wrapper for Monaco if full IntelliSense is critical.*

## 🛣 Migration Roadmap

### Phase 1: Project Setup & Core Bridge (Completed ✅)
1. Initialize Flutter project.
2. Implement `PythonExecutionService`.
   - **Web**: `js_interop` bindings for Pyodide.
   - **Mobile**: `InAppWebView` hidden runner or `serious_python`.
3. Verify basic `print("Hello World")` execution on all platforms.

### Phase 2: Data Layer & Auth (Completed ✅)
1. **Local DB**: Setup `drift` database with WASM support.
2. **Schema**: Implement `Users`, `Books`, `Chapters`, `Sections`, `Progress`, `CodeSnippets`.
3. **Repository**: Implement `LocalAuthRepository` and `CourseRepository` (with Code Saving).
4. **Auth Ops**: Implement Local Login (Email/Password) and SignUp.
5. **Seeding**: Create `DatabaseSeeder` for initial content.

### Phase 3: UI Foundation (Completed ✅)
We have implemented the core "Learner View" shell and navigation.

#### 👤 Common UI features
- **Profile Tab**: View/Edit profile details, Change Password, Logout.
- **Navigation**: adaptable App Shell (BottomNav on Mobile, SideNav on Web).

#### 🎓 Learner View (implemented)
- **Dashboard**: Stats (Chapters Done, %) and Welcome Message.
- **Course Browser**: List of Books and Chapters.
- **Reader Interface**: Markdown content, Executable Code Cells, "Complete Chapter" action.
- **Code Logic**: Editable Python cells that persist code and output to DB.

#### 🧑‍🏫 Instructor View (Completed ✅)
- **Student Roster**: List all students belonging to the instructor's **Organization**.
- **Progress Dashboard**: View aggregate progress (e.g., "Student X has completed 3/10 chapters").
- **Code Inspector**: Drill down into a specific student's activity to view their **Code Execution History** (Input Code + Output) stored in the database.
- **Course Management**: (Deferred) Basic CRUD for Chapters/Sections.

#### 🛡 Admin / Owner View (Placeholder)
- **User Management**: List users, simple role assignment.
- **Org Settings**: Basic organization configuration.

### Phase 4: Feature Parity & Interactions (Completed ✅)
1. **Interactive Code**: Editable `PythonCodeCell` with execution.
2. **Output Display**: Real-time stdout capture and storage.
3. **Progress Tracking**: "Complete Chapter" button updates User Progress table.
4. **Code Persistence**: `CodeSnippets` table stores run history.

### Phase 5: Course Builder & Content Management (Next Priority 🎯)
This phase enables instructors to create, edit, and manage courses and chapters with full CRUD functionality.

#### 5.1 Data Model Extensions
- **Books Table**: Add `createdBy` (instructor user ID), `updatedAt` fields
- **Chapters Table**: Add `createdBy`, `updatedAt`, `pythonPackages` (JSON array), `isolatedCells` (boolean) fields
- **Sections Table**: Already supports `type` (MARKDOWN/PYTHON) and `content`

#### 5.2 Course Management (Books)
**List View** - Instructor's Courses Dashboard
- Display all courses created by the instructor
- Show course metadata: title, description, chapter count, last updated
- Actions: Create New, Edit, Delete, Duplicate
- Filter/Search functionality

**Create/Edit Course Form**
- Fields: Title, Slug (auto-generated), Description, Organization
- Visibility toggle: Published/Draft
- Display order (for multi-course scenarios)
- Save/Cancel actions with validation

#### 5.3 Chapter Management
**Chapter List View** (within a course)
- Display all chapters in a course with drag-to-reorder
- Show: Title, Emoji, Section count, Last updated
- Actions per chapter: Edit, Delete, Duplicate, Reorder
- "Add Chapter" button

**Create/Edit Chapter Form**
- **Basic Info**: Title, Emoji picker, Display order
- **Python Configuration**:
  - **Packages to Load**: Multi-select or text input for packages (e.g., `numpy`, `pandas`, `matplotlib`)
  - **Isolated Cells Toggle**: 
    - ON: Each Python cell runs in a fresh environment
    - OFF: Cells share variables/state within the chapter
  - Preview/Test environment button
- **Content Sections** (see 5.4)
- Save/Cancel with validation

#### 5.4 Section Editor (Content Builder)
**Section List** (within chapter editor)
- Drag-and-drop reordering
- Each section shows: Type (Markdown/Python), Preview, Actions (Edit, Delete, Move Up/Down)
- "Add Section" dropdown: Markdown or Python

**Markdown Section Editor**
- Rich text editor or simple textarea with Markdown preview
- Live preview pane (split view)
- Toolbar: Bold, Italic, Headers, Lists, Links, Code blocks
- Save inline or in modal

**Python Section Editor**
- Code editor with syntax highlighting (use `flutter_code_editor` or `TextField` with monospace)
- "Test Run" button (executes in preview environment with chapter's package config)
- Output preview pane
- Option to set as "Example" (non-editable for learners) vs "Exercise" (editable)

#### 5.5 Python Environment Configuration
**Package Management**
- Dropdown/autocomplete for common packages: `numpy`, `pandas`, `matplotlib`, `seaborn`, `scikit-learn`, `scipy`
- Custom package input field
- Version specification (optional, defaults to latest)
- Validation: Check if package is available in Pyodide

**Isolation Settings**
- **Shared Context** (default): Variables persist across cells in a chapter
  - Use case: Teaching progressive concepts (define variable in cell 1, use in cell 2)
- **Isolated Context**: Each cell runs independently
  - Use case: Independent exercises, testing, or avoiding state pollution
- Visual indicator in learner view showing which mode is active

#### 5.6 UI/UX Considerations
**Navigation Flow**
1. Instructor Dashboard → "Manage Courses" button
2. Course List → Select course → Chapter List
3. Chapter List → Select chapter → Chapter Editor (with sections)
4. Section Editor → Add/Edit individual sections

**Permissions**
- Only instructors/admins can access Course Builder
- Instructors can only edit courses they created (or org-wide if admin)
- Learners see read-only published courses

**Validation & Error Handling**
- Required fields: Course title, Chapter title
- Unique slugs for courses
- Prevent deletion of courses with enrolled students (or show warning)
- Validate Python package names before saving

#### 5.7 Implementation Order
1. **Database Schema Updates**: Add new fields to existing tables
2. **Course CRUD**: List, Create, Edit, Delete courses
3. **Chapter CRUD**: List, Create, Edit, Delete chapters (basic info only)
4. **Section Management**: Add/Edit/Delete/Reorder sections within a chapter
5. **Markdown Editor**: Simple textarea with preview
6. **Python Editor**: Code input with syntax highlighting
7. **Python Config UI**: Package selector and isolation toggle
8. **Integration**: Connect Python config to execution service
9. **Testing**: Create a full course end-to-end

### Phase 6: Future Enhancements (Deferred 🔮)
1. **Cloud Sync**: Integrate Supabase for remote backup.
2. **SaaS Features**: Multi-tenancy and Payment gating.
3. **Deployment**: Release to App Stores and Web Hosting.

## 📦 Key Packages
| Feature | React Package | Flutter Replacement |
|---|---|---|
| **Database** | `@supabase/supabase-js` | `drift` (Local SQLite) + `sql.js` (Web) |
| **Auth** | `@supabase/supabase-js` | Custom Local Auth (Repo + Riverpod) |
| **Editor** | `@monaco-editor/react` | `TextField` (Simple) or `flutter_code_editor` |
| **Markdown** | `react-markdown` | `flutter_markdown` |
| **Icons** | `lucide-react` | `lucide_icons` or Material Icons |
| **Styling** | `tailwindcss` | Flutter Core (Widgets) + `flex_color_scheme` |

## 🚀 Next Steps
1. Review this plan.
2. Initialize the Flutter project in a new directory (e.g., `flutter-book`).
3. Begin Phase 1 (Python Bridge).
