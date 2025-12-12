import 'package:drift/drift.dart';

class Organizations extends Table {
  TextColumn get id => text()(); // UUID from Supabase
  TextColumn get name => text()();
  TextColumn get slug => text().unique()();
  TextColumn get domain => text().nullable().unique()();
  TextColumn get description => text().nullable()();
  TextColumn get logo => text().nullable()();

  // Subscription fields
  TextColumn get subscriptionStatus =>
      text().withDefault(const Constant('TRIAL'))();
  TextColumn get subscriptionTier =>
      text().withDefault(const Constant('STARTER'))();

  // Timestamps
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}
