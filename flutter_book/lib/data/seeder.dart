import 'package:drift/drift.dart';
import '../data/database.dart';

class DatabaseSeeder {
  final AppDatabase db;

  DatabaseSeeder(this.db);

  Future<void> seed() async {
    // Check if data exists
    final user = await db.select(db.users).getSingleOrNull();
    if (user != null) {
      print('Database already seeded. User found: ${user.email}');
      return;
    }

    print("Seeding Database...");

    // 1. Create Organization
    final orgId = 'org-1';
    await db
        .into(db.organizations)
        .insert(
          OrganizationsCompanion(
            id: Value(orgId),
            name: Value('Health Informatics'),
            slug: Value('health-informatics'),
          ),
        );

    // 2. Create Users
    // Instructor
    await db
        .into(db.users)
        .insert(
          UsersCompanion(
            id: Value('user-instructor'),
            organizationId: Value(orgId),
            username: Value('instructor'),
            email: Value('instructor@test.com'),
            firstName: Value('Jane'),
            lastName: Value('Instructor'),
            password: Value('password'), // Plain text for local demo
            role: Value('INSTRUCTOR'),
          ),
        );

    // Learner 1
    await db
        .into(db.users)
        .insert(
          UsersCompanion(
            id: Value('user-1'),
            organizationId: Value(orgId),
            username: Value('demo'),
            email: Value('demo@test.com'),
            firstName: Value('Demo'),
            lastName: Value('User'),
            password: Value('password'), // Plain text for local demo
            role: Value('LEARNER'),
          ),
        );

    // Learner 2
    await db
        .into(db.users)
        .insert(
          UsersCompanion(
            id: Value('user-2'),
            organizationId: Value(orgId),
            username: Value('student'),
            email: Value('student@test.com'),
            firstName: Value('John'),
            lastName: Value('Student'),
            password: Value('password'), // Plain text for local demo
            role: Value('LEARNER'),
          ),
        );

    // 3. Create Book
    final bookId = 'book-1';
    await db
        .into(db.books)
        .insert(
          BooksCompanion(
            id: Value(bookId),
            organizationId: Value(orgId),
            slug: Value('python-datascience'),
            title: Value('Python for Data Science'),
            description: Value('Learn Python interactively.'),
            displayOrder: Value(1),
            isPublished: Value(true),
          ),
        );

    // 4. Create Chapter
    final chapterId = 'chap-1';
    await db
        .into(db.chapters)
        .insert(
          ChaptersCompanion(
            id: Value(chapterId),
            bookId: Value(bookId),
            title: Value('Introduction to Python'),
            emoji: Value('🐍'),
            displayOrder: Value(1),
            markdownUrl: Value('assets/content/intro.md'),
            pythonUrl: Value('assets/content/intro.py'),
          ),
        );

    // 5. Create Sections
    await db
        .into(db.sections)
        .insert(
          SectionsCompanion(
            id: Value('sec-1'),
            chapterId: Value(chapterId),
            title: Value('Welcome'),
            type: Value('MARKDOWN'),
            content: Value(
              '# Welcome to Python\nPython is a powerful language.',
            ),
            displayOrder: Value(1),
          ),
        );

    await db
        .into(db.sections)
        .insert(
          SectionsCompanion(
            id: Value('sec-2'),
            chapterId: Value(chapterId),
            title: Value('First Code'),
            type: Value('PYTHON'),
            content: Value("print('Hello from the Database!')"),
            displayOrder: Value(2),
          ),
        );

    await db
        .into(db.sections)
        .insert(
          SectionsCompanion(
            id: Value('sec-3'),
            chapterId: Value(chapterId),
            title: Value('Next Steps'),
            type: Value('MARKDOWN'),
            content: Value('Great job! Now try modifying the code above.'),
            displayOrder: Value(3),
          ),
        );

    // 6. Add Sample Progress for Learners
    await db
        .into(db.progress)
        .insertOnConflictUpdate(
          ProgressCompanion(
            id: Value(chapterId + 'user-1'), // Match repository ID strategy
            userId: Value('user-1'),
            chapterId: Value(chapterId),
            completed: Value(true),
            completedAt: Value(DateTime.now().subtract(Duration(days: 2))),
            updatedAt: Value(DateTime.now()),
          ),
        );

    await db
        .into(db.progress)
        .insertOnConflictUpdate(
          ProgressCompanion(
            id: Value(chapterId + 'user-2'), // Match repository ID strategy
            userId: Value('user-2'),
            chapterId: Value(chapterId),
            completed: Value(false),
            updatedAt: Value(DateTime.now()),
          ),
        );

    // 7. Add Sample Code Snippets
    await db
        .into(db.codeSnippets)
        .insert(
          CodeSnippetsCompanion(
            id: Value('snippet-1'),
            userId: Value('user-1'),
            sectionId: Value('sec-2'),
            code: Value("print('Hello from Demo User!')"),
            output: Value("Hello from Demo User!"),
            updatedAt: Value(DateTime.now().subtract(Duration(hours: 5))),
          ),
        );

    await db
        .into(db.codeSnippets)
        .insert(
          CodeSnippetsCompanion(
            id: Value('snippet-2'),
            userId: Value('user-1'),
            sectionId: Value('sec-2'),
            code: Value("x = 42\nprint(f'The answer is {x}')"),
            output: Value("The answer is 42"),
            updatedAt: Value(DateTime.now().subtract(Duration(hours: 3))),
          ),
        );

    await db
        .into(db.codeSnippets)
        .insert(
          CodeSnippetsCompanion(
            id: Value('snippet-3'),
            userId: Value('user-2'),
            sectionId: Value('sec-2'),
            code: Value("print('Hello World')"),
            output: Value("Hello World"),
            updatedAt: Value(DateTime.now().subtract(Duration(hours: 1))),
          ),
        );

    await db
        .into(db.codeSnippets)
        .insert(
          CodeSnippetsCompanion(
            id: Value('snippet-4'),
            userId: Value('user-2'),
            sectionId: Value('sec-2'),
            code: Value("import math\nprint(math.pi)"),
            error: Value("ModuleNotFoundError: No module named 'math'"),
            updatedAt: Value(DateTime.now().subtract(Duration(minutes: 30))),
          ),
        );

    print("Database Seeded Successfully!");
  }
}
