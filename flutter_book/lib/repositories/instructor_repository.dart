import 'package:drift/drift.dart';
import '../data/database.dart';

/// Data class to hold student progress summary
class StudentProgressSummary {
  final User student;
  final int completedChapters;
  final int totalChapters;

  StudentProgressSummary({
    required this.student,
    required this.completedChapters,
    required this.totalChapters,
  });

  double get progressPercentage =>
      totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0.0;
}

abstract class InstructorRepository {
  Future<List<User>> getStudents(String organizationId);
  Future<StudentProgressSummary> getStudentProgress(String userId);
  Future<List<CodeSnippet>> getStudentCodeHistory(String userId);
  Future<List<CodeSnippet>> getStudentCodeForSection(
    String userId,
    String sectionId,
  );
}

class LocalInstructorRepository implements InstructorRepository {
  final AppDatabase db;

  LocalInstructorRepository(this.db);

  @override
  Future<List<User>> getStudents(String organizationId) async {
    return (db.select(db.users)
          ..where((tbl) =>
              tbl.organizationId.equals(organizationId) &
              tbl.role.equals('LEARNER'))
          ..orderBy([(t) => OrderingTerm(expression: t.lastName)]))
        .get();
  }

  @override
  Future<StudentProgressSummary> getStudentProgress(String userId) async {
    // Get total chapters count
    final totalChapters = await db.select(db.chapters).get();

    // Get completed chapters for this user
    final completedProgress = await (db.select(db.progress)
          ..where((tbl) => tbl.userId.equals(userId) & tbl.completed.equals(true)))
        .get();

    // Get the user
    final student = await (db.select(db.users)
          ..where((tbl) => tbl.id.equals(userId)))
        .getSingle();

    return StudentProgressSummary(
      student: student,
      completedChapters: completedProgress.length,
      totalChapters: totalChapters.length,
    );
  }

  @override
  Future<List<CodeSnippet>> getStudentCodeHistory(String userId) async {
    return (db.select(db.codeSnippets)
          ..where((tbl) => tbl.userId.equals(userId))
          ..orderBy([
            (t) => OrderingTerm(expression: t.updatedAt, mode: OrderingMode.desc)
          ]))
        .get();
  }

  @override
  Future<List<CodeSnippet>> getStudentCodeForSection(
    String userId,
    String sectionId,
  ) async {
    return (db.select(db.codeSnippets)
          ..where((tbl) =>
              tbl.userId.equals(userId) & tbl.sectionId.equals(sectionId))
          ..orderBy([
            (t) => OrderingTerm(expression: t.updatedAt, mode: OrderingMode.desc)
          ]))
        .get();
  }
}
