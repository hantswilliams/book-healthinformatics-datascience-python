import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers.dart';
import '../../data/database.dart';
import '../../repositories/instructor_repository.dart';
import '../instructor/instructor_dashboard_screen.dart';

// Provider for current user (reuse from profile if needed, or define here)
final dashboardUserProvider = FutureProvider<User?>((ref) async {
  final authState = ref.watch(authStateProvider);
  if (authState.value == null) return null;
  
  final authRepo = ref.watch(authRepositoryProvider);
  return authRepo.getCurrentUser();
});

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userAsync = ref.watch(dashboardUserProvider);

    return Scaffold(
      appBar: AppBar(title: const Text("Dashboard")),
      body: userAsync.when(
        data: (user) {
          if (user == null) {
            return const Center(child: Text('Not logged in'));
          }

          // Show different dashboard based on role
          if (user.role == 'INSTRUCTOR' || user.role == 'ADMIN' || user.role == 'OWNER') {
            return _InstructorDashboard(user: user);
          } else {
            return _LearnerDashboard(user: user);
          }
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Text('Error: $error'),
        ),
      ),
    );
  }
}

// Learner Dashboard - shows personal progress
class _LearnerDashboard extends ConsumerWidget {
  final User user;

  const _LearnerDashboard({required this.user});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Welcome back, ${user.firstName ?? user.username}!",
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 8),
          const Text("Here is your progress overview."),
          const SizedBox(height: 24),
          
          // Stats
          Consumer(
            builder: (context, ref, child) {
              final repo = ref.read(courseRepositoryProvider);

              return FutureBuilder<(int, int)>(
                future: Future.wait([
                  repo.getCompletedChaptersCount(user.id),
                  repo.getTotalChaptersCount(),
                ]).then((values) => (values[0], values[1])),
                builder: (context, snapshot) {
                  if (!snapshot.hasData) {
                    return const Center(child: CircularProgressIndicator());
                  }

                  final completed = snapshot.data!.$1;
                  final total = snapshot.data!.$2;
                  final percent = total > 0 ? ((completed / total) * 100).toInt() : 0;

                  return Row(
                    children: [
                      Expanded(
                        child: Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              children: [
                                Text(
                                  "$completed",
                                  style: Theme.of(context).textTheme.headlineLarge,
                                ),
                                const Text("Chapters Done"),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              children: [
                                Text(
                                  "$percent%",
                                  style: Theme.of(context).textTheme.headlineLarge,
                                ),
                                const Text("Overall Progress"),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  );
                },
              );
            },
          ),
        ],
      ),
    );
  }
}

// Instructor Dashboard - shows student overview
class _InstructorDashboard extends ConsumerWidget {
  final User user;

  const _InstructorDashboard({required this.user});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final studentsAsync = ref.watch(studentsProvider(user.organizationId));

    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Welcome back, ${user.firstName ?? user.username}!",
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 8),
          Text(
            "You have ${studentsAsync.value?.length ?? 0} students enrolled.",
            style: Theme.of(context).textTheme.bodyLarge,
          ),
          const SizedBox(height: 24),

          // Quick Stats
          studentsAsync.when(
            data: (students) {
              return Row(
                children: [
                  Expanded(
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          children: [
                            Icon(
                              Icons.people,
                              size: 48,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              "${students.length}",
                              style: Theme.of(context).textTheme.headlineLarge,
                            ),
                            const Text("Total Students"),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          children: [
                            Icon(
                              Icons.school,
                              size: 48,
                              color: Theme.of(context).colorScheme.secondary,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              user.organizationId.split('-')[1].toUpperCase(),
                              style: Theme.of(context).textTheme.headlineSmall,
                            ),
                            const Text("Organization"),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              );
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, stack) => Text('Error loading students: $error'),
          ),

          const SizedBox(height: 24),

          // Quick Action
          Text(
            "Quick Actions",
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          Card(
            child: ListTile(
              leading: const Icon(Icons.people_outline),
              title: const Text("View All Students"),
              subtitle: const Text("See detailed progress and code history"),
              trailing: const Icon(Icons.arrow_forward),
              onTap: () {
                context.go('/instructor');
              },
            ),
          ),
        ],
      ),
    );
  }
}
