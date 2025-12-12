import 'package:drift/drift.dart';
import 'organizations.dart';

class Books extends Table {
  TextColumn get id => text()();
  TextColumn get organizationId =>
      text().references(Organizations, #id, onDelete: KeyAction.cascade)();
  TextColumn get slug => text()();
  TextColumn get title => text()();
  TextColumn get description => text().nullable()();
  TextColumn get coverImage => text().nullable()();
  TextColumn get difficulty => text().withDefault(const Constant('BEGINNER'))();
  IntColumn get displayOrder => integer()();
  BoolColumn get isPublished => boolean().withDefault(const Constant(false))();

  @override
  Set<Column> get primaryKey => {id};
}

class Chapters extends Table {
  TextColumn get id => text()();
  TextColumn get bookId =>
      text().references(Books, #id, onDelete: KeyAction.cascade)();
  TextColumn get title => text()();
  TextColumn get emoji => text()();
  IntColumn get displayOrder => integer()();
  TextColumn get markdownUrl => text()(); // URL to .md file
  TextColumn get pythonUrl => text()(); // URL to .py file
  IntColumn get estimatedMinutes => integer().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

class Sections extends Table {
  TextColumn get id => text()();
  TextColumn get chapterId =>
      text().references(Chapters, #id, onDelete: KeyAction.cascade)();
  TextColumn get title => text().nullable()();
  TextColumn get type => text()(); // MARKDOWN or PYTHON
  TextColumn get content => text()(); // The actual text content
  IntColumn get displayOrder => integer()();

  @override
  Set<Column> get primaryKey => {id};
}
