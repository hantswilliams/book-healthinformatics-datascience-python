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
  int get schemaVersion => 1;
}
