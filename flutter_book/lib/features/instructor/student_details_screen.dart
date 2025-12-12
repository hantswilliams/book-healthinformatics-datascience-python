import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/database.dart';
import '../../repositories/instructor_repository.dart';
import 'instructor_dashboard_screen.dart';

// Provider for student code history
final studentCodeHistoryProvider =
    FutureProvider.family<List<CodeSnippet>, String>(
  (ref, userId) async {
    final repo = ref.watch(instructorRepositoryProvider);
    return repo.getStudentCodeHistory(userId);
  },
);

class StudentDetailsScreen extends ConsumerWidget {
  final String studentId;

  const StudentDetailsScreen({
    super.key,
    required this.studentId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final progressAsync = ref.watch(studentProgressProvider(studentId));
    final codeHistoryAsync = ref.watch(studentCodeHistoryProvider(studentId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Student Details'),
        elevation: 2,
      ),
      body: progressAsync.when(
        data: (progress) {
          return SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Student Header
                _StudentHeader(progress: progress),

                const Divider(height: 1),

                // Code Execution History
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Code Execution History',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 16),
                      codeHistoryAsync.when(
                        data: (codeSnippets) {
                          if (codeSnippets.isEmpty) {
                            return const Center(
                              child: Padding(
                                padding: EdgeInsets.all(32),
                                child: Column(
                                  children: [
                                    Icon(
                                      Icons.code_off,
                                      size: 64,
                                      color: Colors.grey,
                                    ),
                                    SizedBox(height: 16),
                                    Text(
                                      'No code executed yet',
                                      style: TextStyle(
                                        fontSize: 16,
                                        color: Colors.grey,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          }

                          return ListView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: codeSnippets.length,
                            itemBuilder: (context, index) {
                              final snippet = codeSnippets[index];
                              return _CodeSnippetCard(snippet: snippet);
                            },
                          );
                        },
                        loading: () => const Center(
                          child: Padding(
                            padding: EdgeInsets.all(32),
                            child: CircularProgressIndicator(),
                          ),
                        ),
                        error: (error, stack) => Center(
                          child: Padding(
                            padding: const EdgeInsets.all(32),
                            child: Text('Error: $error'),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
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

class _StudentHeader extends StatelessWidget {
  final StudentProgressSummary progress;

  const _StudentHeader({required this.progress});

  @override
  Widget build(BuildContext context) {
    final student = progress.student;

    return Container(
      padding: const EdgeInsets.all(24),
      color: Theme.of(context).colorScheme.primaryContainer.withOpacity(0.3),
      child: Column(
        children: [
          // Avatar
          CircleAvatar(
            radius: 48,
            backgroundColor: Theme.of(context).colorScheme.primaryContainer,
            child: Text(
              _getInitials(student),
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.bold,
                color: Theme.of(context).colorScheme.onPrimaryContainer,
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Name
          Text(
            '${student.firstName ?? ''} ${student.lastName}',
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),

          // Email
          Text(
            student.email,
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 8),

          // Username
          Chip(
            label: Text('@${student.username}'),
            avatar: const Icon(Icons.person, size: 16),
          ),
          const SizedBox(height: 24),

          // Progress Stats
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _StatCard(
                icon: Icons.book_outlined,
                label: 'Completed',
                value: '${progress.completedChapters}',
              ),
              _StatCard(
                icon: Icons.pending_actions,
                label: 'Remaining',
                value: '${progress.totalChapters - progress.completedChapters}',
              ),
              _StatCard(
                icon: Icons.percent,
                label: 'Progress',
                value: '${progress.progressPercentage.toStringAsFixed(0)}%',
              ),
            ],
          ),
        ],
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

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, size: 32, color: Theme.of(context).colorScheme.primary),
        const SizedBox(height: 8),
        Text(
          value,
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }
}

class _CodeSnippetCard extends StatelessWidget {
  final CodeSnippet snippet;

  const _CodeSnippetCard({required this.snippet});

  @override
  Widget build(BuildContext context) {
    final hasError = snippet.error != null && snippet.error!.isNotEmpty;
    final hasOutput = snippet.output != null && snippet.output!.isNotEmpty;

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with timestamp
            Row(
              children: [
                Icon(
                  hasError ? Icons.error_outline : Icons.check_circle_outline,
                  size: 20,
                  color: hasError ? Colors.red : Colors.green,
                ),
                const SizedBox(width: 8),
                Text(
                  _formatTimestamp(snippet.updatedAt),
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
                const Spacer(),
                Chip(
                  label: Text(
                    hasError ? 'Error' : 'Success',
                    style: const TextStyle(fontSize: 12),
                  ),
                  backgroundColor: hasError
                      ? Colors.red.withOpacity(0.1)
                      : Colors.green.withOpacity(0.1),
                  labelStyle: TextStyle(
                    color: hasError ? Colors.red : Colors.green,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Code
            const Text(
              'Code:',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 4),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey[300]!),
              ),
              child: Text(
                snippet.code,
                style: const TextStyle(
                  fontFamily: 'monospace',
                  fontSize: 13,
                ),
              ),
            ),

            // Output or Error
            if (hasOutput || hasError) ...[
              const SizedBox(height: 12),
              Text(
                hasError ? 'Error:' : 'Output:',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: hasError ? Colors.red : Colors.green,
                ),
              ),
              const SizedBox(height: 4),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: hasError
                      ? Colors.red.withOpacity(0.05)
                      : Colors.green.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: hasError
                        ? Colors.red.withOpacity(0.3)
                        : Colors.green.withOpacity(0.3),
                  ),
                ),
                child: Text(
                  hasError ? snippet.error! : snippet.output!,
                  style: TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 13,
                    color: hasError ? Colors.red[900] : Colors.green[900],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _formatTimestamp(DateTime timestamp) {
    final now = DateTime.now();
    final difference = now.difference(timestamp);

    if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d ago';
    } else {
      return '${timestamp.month}/${timestamp.day}/${timestamp.year}';
    }
  }
}
