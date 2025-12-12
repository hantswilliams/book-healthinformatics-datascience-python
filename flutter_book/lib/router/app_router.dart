import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers.dart';
import '../features/dashboard/dashboard_screen.dart';
import '../features/profile/profile_screen.dart';
import '../features/layout/scaffold_with_navbar.dart';
import '../features/auth/login_screen.dart';
import '../features/home/home_screen.dart';
import '../features/course/chapter_list_screen.dart';
import '../features/course/chapter_view_screen.dart';
import '../features/instructor/instructor_dashboard_screen.dart';
import '../features/instructor/student_details_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: '/dashboard',
    refreshListenable: AuthStateListenable(
      authState,
    ), // Kept original AuthStateListenable as AsyncValue is not a Stream
    redirect: (context, state) {
      final isLoggedIn = authState.asData?.value != null;
      final isLoggingIn = state.uri.path == '/login';

      if (!isLoggedIn && !isLoggingIn) return '/login';
      if (isLoggedIn && isLoggingIn) return '/dashboard';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      ShellRoute(
        builder: (context, state, child) {
          return ScaffoldWithNavBar(child: child);
        },
        routes: [
          GoRoute(
            path: '/dashboard',
            builder: (context, state) => const DashboardScreen(),
          ),
          GoRoute(
            path: '/courses',
            builder: (context, state) => const HomeScreen(),
            routes: [
              GoRoute(
                path: 'book/:bookId',
                builder: (context, state) {
                  final bookId = state.pathParameters['bookId']!;
                  return ChapterListScreen(bookId: bookId);
                },
              ),
              GoRoute(
                path: 'chapter/:chapterId',
                builder: (context, state) {
                  final chapterId = state.pathParameters['chapterId']!;
                  return ChapterViewScreen(chapterId: chapterId);
                },
              ),
            ],
          ),
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfileScreen(),
          ),
          GoRoute(
            path: '/instructor',
            builder: (context, state) {
              // Get organization ID from current user
              // For now, we'll use a placeholder - this should be fetched from auth
              return const InstructorDashboardScreen(
                organizationId: 'org-1',
              );
            },
            routes: [
              GoRoute(
                path: 'student/:studentId',
                builder: (context, state) {
                  final studentId = state.pathParameters['studentId']!;
                  return StudentDetailsScreen(studentId: studentId);
                },
              ),
            ],
          ),
        ],
      ),
    ],
  );
});

// Helper to convert Stream to Listenable for GoRouter
class StreamListenable extends ChangeNotifier {
  final Stream stream;
  StreamListenable(this.stream) {
    stream.listen((_) => notifyListeners());
  }
}

// Helper to convert Stream to Listenable for GoRouter
class AuthStateListenable extends ChangeNotifier {
  final AsyncValue<String?> authState;

  AuthStateListenable(this.authState);
}
