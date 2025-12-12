import 'package:drift/drift.dart';
import '../data/database.dart';

abstract class CourseRepository {
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
}
