import 'package:drift/drift.dart';
import 'package:drift/web.dart';

QueryExecutor connect() {
  // Use Drift's WebDatabase which uses IndexedDB under the hood (via Wasm/Sql.js if available or fallback)
  // For standard IndexedDB usage:
  return WebDatabase.withStorage(DriftWebStorage.indexedDb('flutter_book_db'));
}
