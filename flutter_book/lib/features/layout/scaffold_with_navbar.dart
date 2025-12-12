import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers.dart';

class ScaffoldWithNavBar extends ConsumerWidget {
  final Widget child;

  const ScaffoldWithNavBar({required this.child, super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authRepo = ref.watch(authRepositoryProvider);
    
    return FutureBuilder(
      future: authRepo.getCurrentUser(),
      builder: (context, snapshot) {
        final user = snapshot.data;
        final isInstructor = user?.role == 'INSTRUCTOR';
        
        return Scaffold(
          body: child,
          bottomNavigationBar: NavigationBar(
            selectedIndex: _calculateSelectedIndex(context, isInstructor),
            onDestinationSelected: (int idx) => _onItemTapped(idx, context, isInstructor),
            destinations: isInstructor
                ? const [
                    NavigationDestination(
                      icon: Icon(Icons.dashboard_outlined),
                      selectedIcon: Icon(Icons.dashboard),
                      label: 'Dashboard',
                    ),
                    NavigationDestination(
                      icon: Icon(Icons.people_outlined),
                      selectedIcon: Icon(Icons.people),
                      label: 'Students',
                    ),
                    NavigationDestination(
                      icon: Icon(Icons.person_outline),
                      selectedIcon: Icon(Icons.person),
                      label: 'Profile',
                    ),
                  ]
                : const [
                    NavigationDestination(
                      icon: Icon(Icons.dashboard_outlined),
                      selectedIcon: Icon(Icons.dashboard),
                      label: 'Dashboard',
                    ),
                    NavigationDestination(
                      icon: Icon(Icons.library_books_outlined),
                      selectedIcon: Icon(Icons.library_books),
                      label: 'Courses',
                    ),
                    NavigationDestination(
                      icon: Icon(Icons.person_outline),
                      selectedIcon: Icon(Icons.person),
                      label: 'Profile',
                    ),
                  ],
          ),
        );
      },
    );
  }

  static int _calculateSelectedIndex(BuildContext context, bool isInstructor) {
    final String location = GoRouterState.of(context).uri.path;
    
    if (isInstructor) {
      if (location.startsWith('/dashboard')) {
        return 0;
      }
      if (location.startsWith('/instructor')) {
        return 1;
      }
      if (location.startsWith('/profile')) {
        return 2;
      }
      return 0;
    } else {
      if (location.startsWith('/dashboard')) {
        return 0;
      }
      if (location.startsWith('/courses') || location == '/') {
        return 1;
      }
      if (location.startsWith('/profile')) {
        return 2;
      }
      return 0;
    }
  }

  void _onItemTapped(int index, BuildContext context, bool isInstructor) {
    if (isInstructor) {
      switch (index) {
        case 0:
          context.go('/dashboard');
          break;
        case 1:
          context.go('/instructor');
          break;
        case 2:
          context.go('/profile');
          break;
      }
    } else {
      switch (index) {
        case 0:
          context.go('/dashboard');
          break;
        case 1:
          context.go('/courses');
          break;
        case 2:
          context.go('/profile');
          break;
      }
    }
  }
}
