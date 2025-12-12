import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers.dart';
import '../../data/database.dart';

// Provider for current user that refreshes when auth state changes
final currentUserProvider = FutureProvider<User?>((ref) async {
  // Watch auth state to trigger refresh on login/logout
  final authState = ref.watch(authStateProvider);
  
  // If not logged in, return null
  if (authState.value == null) return null;
  
  final authRepo = ref.watch(authRepositoryProvider);
  return authRepo.getCurrentUser();
});

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userAsync = ref.watch(currentUserProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text("Profile"),
        elevation: 2,
      ),
      body: userAsync.when(
        data: (user) {
          if (user == null) {
            return const Center(
              child: Text('No user logged in'),
            );
          }

          return SingleChildScrollView(
            child: Column(
              children: [
                // Header Section
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(
                    color: Theme.of(context)
                        .colorScheme
                        .primaryContainer
                        .withOpacity(0.3),
                  ),
                  child: Column(
                    children: [
                      // Avatar
                      CircleAvatar(
                        radius: 60,
                        backgroundColor:
                            Theme.of(context).colorScheme.primaryContainer,
                        child: Text(
                          _getInitials(user),
                          style: TextStyle(
                            fontSize: 36,
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context)
                                .colorScheme
                                .onPrimaryContainer,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Name
                      Text(
                        '${user.firstName ?? ''} ${user.lastName}',
                        style: Theme.of(context).textTheme.headlineSmall,
                      ),
                      const SizedBox(height: 4),

                      // Role Badge
                      Chip(
                        label: Text(
                          _formatRole(user.role),
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        backgroundColor: _getRoleColor(context, user.role),
                        avatar: Icon(
                          _getRoleIcon(user.role),
                          size: 18,
                        ),
                      ),
                    ],
                  ),
                ),

                // Details Section
                Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Account Details',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 16),

                      // Email
                      _DetailCard(
                        icon: Icons.email_outlined,
                        label: 'Email',
                        value: user.email,
                      ),
                      const SizedBox(height: 12),

                      // Username
                      _DetailCard(
                        icon: Icons.person_outline,
                        label: 'Username',
                        value: '@${user.username}',
                      ),
                      const SizedBox(height: 12),

                      // Role
                      _DetailCard(
                        icon: Icons.badge_outlined,
                        label: 'Role',
                        value: _formatRole(user.role),
                      ),
                      const SizedBox(height: 12),

                      // Join Date
                      _DetailCard(
                        icon: Icons.calendar_today_outlined,
                        label: 'Member Since',
                        value: _formatDate(user.joinedAt),
                      ),

                      const SizedBox(height: 32),

                      // Logout Button
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton.icon(
                          onPressed: () {
                            ref.read(authRepositoryProvider).signOut();
                          },
                          icon: const Icon(Icons.logout),
                          label: const Text("Logout"),
                          style: FilledButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
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
              Text('Error loading profile: $error'),
            ],
          ),
        ),
      ),
    );
  }

  String _getInitials(User user) {
    final first =
        user.firstName?.isNotEmpty == true ? user.firstName![0] : '';
    final last = user.lastName.isNotEmpty ? user.lastName[0] : '';
    return (first + last).toUpperCase();
  }

  String _formatRole(String role) {
    switch (role) {
      case 'LEARNER':
        return 'Learner';
      case 'INSTRUCTOR':
        return 'Instructor';
      case 'ADMIN':
        return 'Administrator';
      case 'OWNER':
        return 'Owner';
      default:
        return role;
    }
  }

  IconData _getRoleIcon(String role) {
    switch (role) {
      case 'LEARNER':
        return Icons.school;
      case 'INSTRUCTOR':
        return Icons.person_outline;
      case 'ADMIN':
        return Icons.admin_panel_settings;
      case 'OWNER':
        return Icons.business;
      default:
        return Icons.person;
    }
  }

  Color _getRoleColor(BuildContext context, String role) {
    switch (role) {
      case 'LEARNER':
        return Colors.blue.withOpacity(0.2);
      case 'INSTRUCTOR':
        return Colors.green.withOpacity(0.2);
      case 'ADMIN':
        return Colors.orange.withOpacity(0.2);
      case 'OWNER':
        return Colors.purple.withOpacity(0.2);
      default:
        return Colors.grey.withOpacity(0.2);
    }
  }

  String _formatDate(DateTime date) {
    final months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }
}

class _DetailCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _DetailCard({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Row(
        children: [
          Icon(icon, size: 24, color: Theme.of(context).colorScheme.primary),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
