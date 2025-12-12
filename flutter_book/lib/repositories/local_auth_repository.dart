import 'dart:async';
import 'package:drift/drift.dart';
import '../data/database.dart';
import 'auth_repository.dart';

class LocalAuthRepository implements AuthRepository {
  final AppDatabase db;
  final _authStateController = StreamController<String?>.broadcast();
  String? _currentUserId;

  LocalAuthRepository(this.db) {
    _authStateController.add(null);
  }

  @override
  Stream<String?> get authStateChanges => _authStateController.stream;

  @override
  Future<String?> getCurrentUserId() async {
    return _currentUserId;
  }

  @override
  Future<void> signIn(String email, String password) async {
    final user = await (db.select(
      db.users,
    )..where((t) => t.email.equals(email))).getSingleOrNull();

    if (user != null && user.password == password) {
      print('Login Successful: ${user.email}');
      _currentUserId = user.id;
      _authStateController.add(user.id);
    } else {
      print(
        'Login Failed: User found? ${user != null}. Password match? ${user?.password == password}',
      );
      throw Exception('Invalid Credentials');
    }
  }

  @override
  Future<void> signUp(
    String email,
    String password,
    String firstName,
    String lastName,
  ) async {
    final existingUser = await (db.select(
      db.users,
    )..where((t) => t.email.equals(email))).getSingleOrNull();

    if (existingUser != null) {
      throw Exception('User already exists');
    }

    // Assign to a default Organization for now
    final defaultOrg = await (db.select(db.organizations)).getSingleOrNull();
    if (defaultOrg == null) {
      throw Exception('No Organization Data found - Seed database first');
    }

    await db
        .into(db.users)
        .insert(
          UsersCompanion(
            id: Value(
              DateTime.now().millisecondsSinceEpoch.toString(),
            ), // Simple ID
            organizationId: Value(defaultOrg.id),
            email: Value(email),
            username: Value(email.split('@')[0]), // Simple username
            password: Value(password),
            firstName: Value(firstName),
            lastName: Value(lastName),
          ),
        );
    // Auto Sign In after Sign Up? Maybe.
  }

  @override
  Future<void> signOut() async {
    _currentUserId = null;
    _authStateController.add(null);
  }

  @override
  Future<User?> getCurrentUser() async {
    if (_currentUserId == null) return null;
    return (db.select(db.users)
          ..where((t) => t.id.equals(_currentUserId!)))
        .getSingleOrNull();
  }

  @override
  Future<void> verifyOtp(String email, String token) async {
    // No-op for local auth
  }
}
