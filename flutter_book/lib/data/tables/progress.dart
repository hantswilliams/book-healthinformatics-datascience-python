import 'package:drift/drift.dart';
import 'users.dart';
import 'content.dart';

class Progress extends Table {
  TextColumn get id => text()();
  TextColumn get userId =>
      text().references(Users, #id, onDelete: KeyAction.cascade)();
  TextColumn get chapterId =>
      text().references(Chapters, #id, onDelete: KeyAction.cascade)();
  BoolColumn get completed => boolean().withDefault(const Constant(false))();
  DateTimeColumn get completedAt => dateTime().nullable()();
  IntColumn get timeSpent => integer().nullable()(); // Minutes

  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};

  @override
  List<String> get customConstraints => ['UNIQUE(user_id, chapter_id)'];
}
