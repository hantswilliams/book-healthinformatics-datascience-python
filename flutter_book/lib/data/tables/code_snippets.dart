import 'package:drift/drift.dart';
import 'users.dart';
import 'content.dart';

class CodeSnippets extends Table {
  TextColumn get id => text()(); // UUID or composite
  TextColumn get userId =>
      text().references(Users, #id, onDelete: KeyAction.cascade)();
  TextColumn get sectionId =>
      text().references(Sections, #id, onDelete: KeyAction.cascade)();

  TextColumn get code => text()();
  TextColumn get output => text().nullable()();
  TextColumn get error => text().nullable()(); // To store stderr

  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}
