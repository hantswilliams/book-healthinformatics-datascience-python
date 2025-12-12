// Superseded by LocalAuthRepository
/*
import 'package:supabase_flutter/supabase_flutter.dart';
import 'auth_repository.dart';

class SupabaseAuthRepository implements AuthRepository {
  final SupabaseClient _client;

  SupabaseAuthRepository(this._client);

  @override
  Future<void> signInWithEmail(String email) async {
    await _client.auth.signInWithOtp(
      email: email,
      emailRedirectTo: 'io.supabase.flutterbook://login-callback',
    );
  }

  @override
  Future<void> verifyOtp(String email, String token) async {
    await _client.auth.verifyOTP(
      email: email,
      token: token,
      type: OtpType.email,
    );
  }

  @override
  Future<void> signOut() async {
    await _client.auth.signOut();
  }

  @override
  Stream<String?> get authStateChanges {
    return _client.auth.onAuthStateChange.map(
      (event) => event.session?.user.id,
    );
  }

  @override
  Future<String?> getCurrentUserId() async {
    return _client.auth.currentUser?.id;
  }
}
*/
