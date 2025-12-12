import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/database.dart';
import '../../providers.dart';
import 'chapter_form_screen.dart';
import 'section_editor_screen.dart';

class ChapterManagementScreen extends ConsumerWidget {
  final Book book;

  const ChapterManagementScreen({
    super.key,
    required this.book,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUser = ref.watch(currentUserProvider);
    final courseRepo = ref.watch(courseRepositoryProvider);

    if (currentUser == null) {
      return const Scaffold(
        body: Center(child: Text('Please log in')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('Chapters: ${book.title}'),
      ),
      body: FutureBuilder<List<Chapter>>(
        future: courseRepo.getChapters(book.id),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }

          final chapters = snapshot.data ?? [];

          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        '${chapters.length} chapter(s)',
                        style: const TextStyle(fontSize: 16),
                      ),
                    ),
                    ElevatedButton.icon(
                      onPressed: () => _navigateToCreateChapter(context, currentUser),
                      icon: const Icon(Icons.add),
                      label: const Text('Add Chapter'),
                    ),
                  ],
                ),
              ),
              if (chapters.isEmpty)
                const Expanded(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.book_outlined, size: 64, color: Colors.grey),
                        SizedBox(height: 16),
                        Text(
                          'No chapters yet',
                          style: TextStyle(fontSize: 18, color: Colors.grey),
                        ),
                      ],
                    ),
                  ),
                )
              else
                Expanded(
                  child: ReorderableListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: chapters.length,
                    onReorder: (oldIndex, newIndex) =>
                        _reorderChapters(ref, chapters, oldIndex, newIndex),
                    itemBuilder: (context, index) {
                      final chapter = chapters[index];
                      return _ChapterCard(
                        key: ValueKey(chapter.id),
                        chapter: chapter,
                        onEdit: () => _navigateToEditChapter(context, chapter),
                        onDelete: () => _confirmDelete(context, ref, chapter),
                        onManageSections: () => _navigateToManageSections(context, chapter),
                      );
                    },
                  ),
                ),
            ],
          );
        },
      ),
    );
  }

  void _navigateToCreateChapter(BuildContext context, User currentUser) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ChapterFormScreen(
          bookId: book.id,
          createdBy: currentUser.id,
        ),
      ),
    );
  }

  void _navigateToEditChapter(BuildContext context, Chapter chapter) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ChapterFormScreen(
          bookId: book.id,
          createdBy: chapter.createdBy,
          chapter: chapter,
        ),
      ),
    );
  }

  void _navigateToManageSections(BuildContext context, Chapter chapter) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => SectionEditorScreen(chapter: chapter),
      ),
    );
  }

  Future<void> _reorderChapters(
    WidgetRef ref,
    List<Chapter> chapters,
    int oldIndex,
    int newIndex,
  ) async {
    if (oldIndex < newIndex) {
      newIndex -= 1;
    }

    final reorderedChapters = List<Chapter>.from(chapters);
    final chapter = reorderedChapters.removeAt(oldIndex);
    reorderedChapters.insert(newIndex, chapter);

    final chapterIds = reorderedChapters.map((c) => c.id).toList();

    try {
      final courseRepo = ref.read(courseRepositoryProvider);
      await courseRepo.reorderChapters(chapterIds);
    } catch (e) {
      // Error handling - could show a snackbar
      debugPrint('Error reordering chapters: $e');
    }
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref, Chapter chapter) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Chapter'),
        content: Text(
          'Are you sure you want to delete "${chapter.title}"? This will also delete all sections.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      try {
        final courseRepo = ref.read(courseRepositoryProvider);
        await courseRepo.deleteChapter(chapter.id);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Chapter deleted successfully')),
          );
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error deleting chapter: $e')),
          );
        }
      }
    }
  }
}

class _ChapterCard extends StatelessWidget {
  final Chapter chapter;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  final VoidCallback onManageSections;

  const _ChapterCard({
    super.key,
    required this.chapter,
    required this.onEdit,
    required this.onDelete,
    required this.onManageSections,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  chapter.emoji,
                  style: const TextStyle(fontSize: 32),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        chapter.title,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Order: ${chapter.displayOrder}',
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.drag_handle, color: Colors.grey),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(Icons.science, size: 16, color: Colors.grey[600]),
                const SizedBox(width: 4),
                Text(
                  _getPythonPackagesText(),
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),
                const SizedBox(width: 16),
                Icon(
                  chapter.isolatedCells ? Icons.lock : Icons.link,
                  size: 16,
                  color: Colors.grey[600],
                ),
                const SizedBox(width: 4),
                Text(
                  chapter.isolatedCells ? 'Isolated' : 'Shared',
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              children: [
                OutlinedButton.icon(
                  onPressed: onManageSections,
                  icon: const Icon(Icons.list, size: 18),
                  label: const Text('Sections'),
                ),
                OutlinedButton.icon(
                  onPressed: onEdit,
                  icon: const Icon(Icons.edit, size: 18),
                  label: const Text('Edit'),
                ),
                OutlinedButton.icon(
                  onPressed: onDelete,
                  icon: const Icon(Icons.delete, size: 18),
                  label: const Text('Delete'),
                  style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _getPythonPackagesText() {
    try {
      // Parse JSON array from pythonPackages field
      final packagesStr = chapter.pythonPackages
          .replaceAll('[', '')
          .replaceAll(']', '')
          .replaceAll('"', '');
      final packages = packagesStr.split(',').map((p) => p.trim()).toList();
      return packages.join(', ');
    } catch (e) {
      return 'No packages';
    }
  }
}
