import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/database.dart';
import '../../repositories/instructor_repository.dart';
import '../../providers.dart';
import 'student_details_screen.dart';

// Provider for instructor repository
final instructorRepositoryProvider = Provider<InstructorRepository>((ref) {
  final db = ref.watch(databaseProvider);
  return LocalInstructorRepository(db);
});

// Provider for students list
final studentsProvider = FutureProvider.family<List<User>, String>(
  (ref, organizationId) async {
    final repo = ref.watch(instructorRepositoryProvider);
    return repo.getStudents(organizationId);
  },
);

// Provider for student progress
final studentProgressProvider =
    FutureProvider.family<StudentProgressSummary, String>(
  (ref, userId) async {
    final repo = ref.watch(instructorRepositoryProvider);
    return repo.getStudentProgress(userId);
  },
);

class InstructorDashboardScreen extends ConsumerWidget {
  final String organizationId;

  const InstructorDashboardScreen({
    super.key,
    required this.organizationId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final studentsAsync = ref.watch(studentsProvider(organizationId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Student Roster'),
        elevation: 2,
      ),
      body: studentsAsync.when(
        data: (students) {
          if (students.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.people_outline, size: 64, color: Colors.grey),
                  SizedBox(height: 16),
                  Text(
                    'No students enrolled yet',
                    style: TextStyle(fontSize: 18, color: Colors.grey),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: students.length,
            itemBuilder: (context, index) {
              final student = students[index];
              return _StudentCard(student: student);
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 64, color: Colors.red),
              const SizedBox(height: 16),
              Text('Error: $error'),
            ],
          ),
        ),
      ),
    );
  }
}

class _StudentCard extends ConsumerWidget {
  final User student;

  const _StudentCard({required this.student});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final progressAsync = ref.watch(studentProgressProvider(student.id));

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => StudentDetailsScreen(studentId: student.id),
            ),
          );
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Avatar
              CircleAvatar(
                radius: 28,
                backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                child: Text(
                  _getInitials(student),
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.onPrimaryContainer,
                  ),
                ),
              ),
              const SizedBox(width: 16),

              // Student Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${student.firstName ?? ''} ${student.lastName}',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      student.email,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(height: 8),
                    progressAsync.when(
                      data: (progress) {
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: LinearProgressIndicator(
                                    value: progress.progressPercentage / 100,
                                    backgroundColor: Colors.grey[200],
                                    minHeight: 6,
                                    borderRadius: BorderRadius.circular(3),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Text(
                                  '${progress.progressPercentage.toStringAsFixed(0)}%',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.grey[700],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${progress.completedChapters}/${progress.totalChapters} chapters completed',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        );
                      },
                      loading: () => const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                      error: (_, __) => const Text(
                        'Error loading progress',
                        style: TextStyle(fontSize: 12, color: Colors.red),
                      ),
                    ),
                  ],
                ),
              ),

              // Arrow icon
              Icon(
                Icons.chevron_right,
                color: Colors.grey[400],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _getInitials(User student) {
    final first = student.firstName?.isNotEmpty == true
        ? student.firstName![0]
        : '';
    final last = student.lastName.isNotEmpty ? student.lastName[0] : '';
    return (first + last).toUpperCase();
  }
}
