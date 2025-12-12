import '../data/database.dart';

abstract class AuthRepository {
  Future<void> signIn(String email, String password);
  Future<void> signUp(
    String email,
    String password,
    String firstName,
    String lastName,
  );
  Future<void> verifyOtp(String email, String token);
  Future<void> signOut();
  Stream<String?> get authStateChanges;
  Future<String?> getCurrentUserId();
  Future<User?> getCurrentUser();
}
