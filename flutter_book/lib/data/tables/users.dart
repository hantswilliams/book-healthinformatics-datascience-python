import 'package:drift/drift.dart';
import 'organizations.dart';

class Users extends Table {
  TextColumn get id => text()(); // UUID from Supabase Auth
  TextColumn get username => text()();
  TextColumn get email => text()();
  TextColumn get firstName => text().nullable()();
  TextColumn get lastName => text()();
  TextColumn get password => text().withDefault(
    const Constant('password'),
  )(); // Simple text for local demo
  TextColumn get role => text().withDefault(
    const Constant('LEARNER'),
  )(); // OWNER, ADMIN, INSTRUCTOR, LEARNER

  // Foreign Key to Organization
  TextColumn get organizationId =>
      text().references(Organizations, #id, onDelete: KeyAction.cascade)();

  DateTimeColumn get joinedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};

  @override
  List<String> get customConstraints => [
    'UNIQUE(username, organization_id)',
    'UNIQUE(email, organization_id)',
  ];
}
