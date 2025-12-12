import 'package:drift/drift.dart';
import '../data/database.dart';

abstract class CourseRepository {
  // Learner methods (existing)
  Future<List<Book>> getBooks(String organizationId);
  Future<Book?> getBookBySlug(String slug);
  Future<List<Chapter>> getChapters(String bookId);
  Future<List<Section>> getSections(String chapterId);
  Future<void> saveProgress(String userId, String chapterId, bool completed);
  Future<int> getTotalChaptersCount();
  Future<int> getCompletedChaptersCount(String userId);
  Future<void> saveCodeSnippet({
    required String userId,
    required String sectionId,
    required String code,
    String? output,
    String? error,
  });

  // Instructor methods - Book Management
  Future<List<Book>> getBooksByCreator(String userId);
  Future<Book?> getBookById(String bookId);
  Future<String> createBook({
    required String organizationId,
    required String createdBy,
    required String title,
    required String slug,
    String? description,
    String? coverImage,
    String difficulty = 'BEGINNER',
    int displayOrder = 1,
    bool isPublished = false,
  });
  Future<void> updateBook({
    required String bookId,
    String? title,
    String? slug,
    String? description,
    String? coverImage,
    String? difficulty,
    int? displayOrder,
    bool? isPublished,
  });
  Future<void> deleteBook(String bookId);

  // Instructor methods - Chapter Management
  Future<String> createChapter({
    required String bookId,
    required String createdBy,
    required String title,
    required String emoji,
    int displayOrder = 1,
    String markdownUrl = '',
    String pythonUrl = '',
    int? estimatedMinutes,
    List<String> pythonPackages = const ['numpy', 'pandas', 'matplotlib'],
    bool isolatedCells = false,
  });
  Future<void> updateChapter({
    required String chapterId,
    String? title,
    String? emoji,
    int? displayOrder,
    String? markdownUrl,
    String? pythonUrl,
    int? estimatedMinutes,
    List<String>? pythonPackages,
    bool? isolatedCells,
  });
  Future<void> deleteChapter(String chapterId);
  Future<void> reorderChapters(List<String> chapterIds);

  // Instructor methods - Section Management
  Future<String> createSection({
    required String chapterId,
    required String type,
    required String content,
    String? title,
    int displayOrder = 1,
  });
  Future<void> updateSection({
    required String sectionId,
    String? title,
    String? type,
    String? content,
    int? displayOrder,
  });
  Future<void> deleteSection(String sectionId);
  Future<void> reorderSections(List<String> sectionIds);
}

class LocalCourseRepository implements CourseRepository {
  final AppDatabase db;

  LocalCourseRepository(this.db);

  @override
  Future<List<Book>> getBooks(String organizationId) {
    return (db.select(
      db.books,
    )..where((tbl) => tbl.organizationId.equals(organizationId))).get();
  }

  @override
  Future<Book?> getBookBySlug(String slug) {
    return (db.select(
      db.books,
    )..where((tbl) => tbl.slug.equals(slug))).getSingleOrNull();
  }

  @override
  Future<List<Chapter>> getChapters(String bookId) {
    return (db.select(db.chapters)
          ..where((tbl) => tbl.bookId.equals(bookId))
          ..orderBy([(t) => OrderingTerm(expression: t.displayOrder)]))
        .get();
  }

  @override
  Future<List<Section>> getSections(String chapterId) {
    return (db.select(db.sections)
          ..where((tbl) => tbl.chapterId.equals(chapterId))
          ..orderBy([(t) => OrderingTerm(expression: t.displayOrder)]))
        .get();
  }

  @override
  Future<void> saveProgress(
    String userId,
    String chapterId,
    bool completed,
  ) async {
    final now = DateTime.now();
    await db
        .into(db.progress)
        .insertOnConflictUpdate(
          ProgressCompanion(
            id: Value(chapterId + userId), // Simple composite ID strategy
            userId: Value(userId),
            chapterId: Value(chapterId),
            completed: Value(completed),
            completedAt: Value(completed ? now : null),
            updatedAt: Value(now),
          ),
        );
  }

  Future<int> getTotalChaptersCount() async {
    final result = await db.select(db.chapters).get();
    return result.length;
  }

  Future<int> getCompletedChaptersCount(String userId) async {
    final query = db.select(db.progress)
      ..where((t) => t.userId.equals(userId) & t.completed.equals(true));
    final result = await query.get();
    return result.length;
  }

  @override
  Future<void> saveCodeSnippet({
    required String userId,
    required String sectionId,
    required String code,
    String? output,
    String? error,
  }) async {
    await db
        .into(db.codeSnippets)
        .insert(
          CodeSnippetsCompanion(
            id: Value(
              DateTime.now().millisecondsSinceEpoch.toString(),
            ), // Simple ID
            userId: Value(userId),
            sectionId: Value(sectionId),
            code: Value(code),
            output: Value(output),
            error: Value(error),
            updatedAt: Value(DateTime.now()),
          ),
        );
  }

  // ========== Instructor Methods - Book Management ==========

  @override
  Future<List<Book>> getBooksByCreator(String userId) {
    return (db.select(db.books)
          ..where((tbl) => tbl.createdBy.equals(userId))
          ..orderBy([(t) => OrderingTerm(expression: t.updatedAt, mode: OrderingMode.desc)]))
        .get();
  }

  @override
  Future<Book?> getBookById(String bookId) {
    return (db.select(db.books)..where((tbl) => tbl.id.equals(bookId)))
        .getSingleOrNull();
  }

  @override
  Future<String> createBook({
    required String organizationId,
    required String createdBy,
    required String title,
    required String slug,
    String? description,
    String? coverImage,
    String difficulty = 'BEGINNER',
    int displayOrder = 1,
    bool isPublished = false,
  }) async {
    final bookId = 'book-${DateTime.now().millisecondsSinceEpoch}';
    final now = DateTime.now();

    await db.into(db.books).insert(
          BooksCompanion(
            id: Value(bookId),
            organizationId: Value(organizationId),
            slug: Value(slug),
            title: Value(title),
            description: Value(description),
            coverImage: Value(coverImage),
            difficulty: Value(difficulty),
            displayOrder: Value(displayOrder),
            isPublished: Value(isPublished),
            createdBy: Value(createdBy),
            createdAt: Value(now),
            updatedAt: Value(now),
          ),
        );

    return bookId;
  }

  @override
  Future<void> updateBook({
    required String bookId,
    String? title,
    String? slug,
    String? description,
    String? coverImage,
    String? difficulty,
    int? displayOrder,
    bool? isPublished,
  }) async {
    final updates = BooksCompanion(
      id: Value(bookId),
      title: title != null ? Value(title) : const Value.absent(),
      slug: slug != null ? Value(slug) : const Value.absent(),
      description: description != null ? Value(description) : const Value.absent(),
      coverImage: coverImage != null ? Value(coverImage) : const Value.absent(),
      difficulty: difficulty != null ? Value(difficulty) : const Value.absent(),
      displayOrder: displayOrder != null ? Value(displayOrder) : const Value.absent(),
      isPublished: isPublished != null ? Value(isPublished) : const Value.absent(),
      updatedAt: Value(DateTime.now()),
    );

    await (db.update(db.books)..where((tbl) => tbl.id.equals(bookId)))
        .write(updates);
  }

  @override
  Future<void> deleteBook(String bookId) async {
    await (db.delete(db.books)..where((tbl) => tbl.id.equals(bookId))).go();
  }

  // ========== Instructor Methods - Chapter Management ==========

  @override
  Future<String> createChapter({
    required String bookId,
    required String createdBy,
    required String title,
    required String emoji,
    int displayOrder = 1,
    String markdownUrl = '',
    String pythonUrl = '',
    int? estimatedMinutes,
    List<String> pythonPackages = const ['numpy', 'pandas', 'matplotlib'],
    bool isolatedCells = false,
  }) async {
    final chapterId = 'chap-${DateTime.now().millisecondsSinceEpoch}';
    final now = DateTime.now();

    // Convert pythonPackages list to JSON string
    final packagesJson = '["${pythonPackages.join('", "')}"]';

    await db.into(db.chapters).insert(
          ChaptersCompanion(
            id: Value(chapterId),
            bookId: Value(bookId),
            title: Value(title),
            emoji: Value(emoji),
            displayOrder: Value(displayOrder),
            markdownUrl: Value(markdownUrl),
            pythonUrl: Value(pythonUrl),
            estimatedMinutes: Value(estimatedMinutes),
            createdBy: Value(createdBy),
            createdAt: Value(now),
            updatedAt: Value(now),
            pythonPackages: Value(packagesJson),
            isolatedCells: Value(isolatedCells),
          ),
        );

    return chapterId;
  }

  @override
  Future<void> updateChapter({
    required String chapterId,
    String? title,
    String? emoji,
    int? displayOrder,
    String? markdownUrl,
    String? pythonUrl,
    int? estimatedMinutes,
    List<String>? pythonPackages,
    bool? isolatedCells,
  }) async {
    // Convert pythonPackages list to JSON string if provided
    String? packagesJson;
    if (pythonPackages != null) {
      packagesJson = '["${pythonPackages.join('", "')}"]';
    }

    final updates = ChaptersCompanion(
      id: Value(chapterId),
      title: title != null ? Value(title) : const Value.absent(),
      emoji: emoji != null ? Value(emoji) : const Value.absent(),
      displayOrder: displayOrder != null ? Value(displayOrder) : const Value.absent(),
      markdownUrl: markdownUrl != null ? Value(markdownUrl) : const Value.absent(),
      pythonUrl: pythonUrl != null ? Value(pythonUrl) : const Value.absent(),
      estimatedMinutes: estimatedMinutes != null ? Value(estimatedMinutes) : const Value.absent(),
      pythonPackages: packagesJson != null ? Value(packagesJson) : const Value.absent(),
      isolatedCells: isolatedCells != null ? Value(isolatedCells) : const Value.absent(),
      updatedAt: Value(DateTime.now()),
    );

    await (db.update(db.chapters)..where((tbl) => tbl.id.equals(chapterId)))
        .write(updates);
  }

  @override
  Future<void> deleteChapter(String chapterId) async {
    await (db.delete(db.chapters)..where((tbl) => tbl.id.equals(chapterId)))
        .go();
  }

  @override
  Future<void> reorderChapters(List<String> chapterIds) async {
    for (int i = 0; i < chapterIds.length; i++) {
      await (db.update(db.chapters)
            ..where((tbl) => tbl.id.equals(chapterIds[i])))
          .write(ChaptersCompanion(displayOrder: Value(i + 1)));
    }
  }

  // ========== Instructor Methods - Section Management ==========

  @override
  Future<String> createSection({
    required String chapterId,
    required String type,
    required String content,
    String? title,
    int displayOrder = 1,
  }) async {
    final sectionId = 'sec-${DateTime.now().millisecondsSinceEpoch}';

    await db.into(db.sections).insert(
          SectionsCompanion(
            id: Value(sectionId),
            chapterId: Value(chapterId),
            title: Value(title),
            type: Value(type),
            content: Value(content),
            displayOrder: Value(displayOrder),
          ),
        );

    return sectionId;
  }

  @override
  Future<void> updateSection({
    required String sectionId,
    String? title,
    String? type,
    String? content,
    int? displayOrder,
  }) async {
    final updates = SectionsCompanion(
      id: Value(sectionId),
      title: title != null ? Value(title) : const Value.absent(),
      type: type != null ? Value(type) : const Value.absent(),
      content: content != null ? Value(content) : const Value.absent(),
      displayOrder: displayOrder != null ? Value(displayOrder) : const Value.absent(),
    );

    await (db.update(db.sections)..where((tbl) => tbl.id.equals(sectionId)))
        .write(updates);
  }

  @override
  Future<void> deleteSection(String sectionId) async {
    await (db.delete(db.sections)..where((tbl) => tbl.id.equals(sectionId)))
        .go();
  }

  @override
  Future<void> reorderSections(List<String> sectionIds) async {
    for (int i = 0; i < sectionIds.length; i++) {
      await (db.update(db.sections)
            ..where((tbl) => tbl.id.equals(sectionIds[i])))
          .write(SectionsCompanion(displayOrder: Value(i + 1)));
    }
  }
}
