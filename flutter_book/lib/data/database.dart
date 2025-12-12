import 'package:drift/drift.dart';

import 'tables/organizations.dart';
import 'tables/users.dart';
import 'tables/content.dart';
import 'tables/progress.dart';

import 'connection/connection.dart' as impl;

import 'tables/code_snippets.dart';

part 'database.g.dart';

@DriftDatabase(
  tables: [
    Organizations,
    Users,
    Books,
    Chapters,
    Sections,
    Progress,
    CodeSnippets,
  ],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(impl.connect());

  @override
  int get schemaVersion => 2;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (Migrator m) async {
          await m.createAll();
        },
        onUpgrade: (Migrator m, int from, int to) async {
          if (from < 2) {
            // Migration from version 1 to 2
            // Add new columns to Books table
            await m.addColumn(books, books.createdBy);
            await m.addColumn(books, books.createdAt);
            await m.addColumn(books, books.updatedAt);

            // Add new columns to Chapters table
            await m.addColumn(chapters, chapters.createdBy);
            await m.addColumn(chapters, chapters.createdAt);
            await m.addColumn(chapters, chapters.updatedAt);
            await m.addColumn(chapters, chapters.pythonPackages);
            await m.addColumn(chapters, chapters.isolatedCells);
          }
        },
      );
}
