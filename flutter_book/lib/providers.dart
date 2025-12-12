import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'data/database.dart';
import 'repositories/auth_repository.dart';
import 'repositories/local_auth_repository.dart';
import 'repositories/course_repository.dart';

// Database Provider
final databaseProvider = Provider<AppDatabase>((ref) {
  return AppDatabase();
});

// Supabase Client Provider
final supabaseClientProvider = Provider<SupabaseClient>((ref) {
  return Supabase.instance.client;
});

// Auth Repository Provider (Local)
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final db = ref.watch(databaseProvider);
  return LocalAuthRepository(db);
});

// Auth State Provider
final authStateProvider = StreamProvider<String?>((ref) {
  final authRepo = ref.watch(authRepositoryProvider);
  return authRepo.authStateChanges;
});

// Course Repository Provider
final courseRepositoryProvider = Provider<CourseRepository>((ref) {
  final db = ref.watch(databaseProvider);
  return LocalCourseRepository(db);
});
