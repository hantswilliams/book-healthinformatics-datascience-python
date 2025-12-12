import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers.dart';
import '../../data/database.dart';

// Provider to check if a chapter is completed
final chapterCompletionProvider = FutureProvider.family<bool, (String, String)>(
  (ref, params) async {
    final userId = params.$1;
    final chapterId = params.$2;
    
    final db = ref.watch(databaseProvider);
    final progress = await (db.select(db.progress)
          ..where((t) => t.userId.equals(userId))
          ..where((t) => t.chapterId.equals(chapterId))
          ..where((t) => t.completed.equals(true)))
        .getSingleOrNull();
    
    return progress != null;
  },
);

class ChapterListScreen extends ConsumerWidget {
  final String bookId;
  const ChapterListScreen({super.key, required this.bookId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userIdAsync = ref.watch(authStateProvider);

    return Scaffold(
      appBar: AppBar(title: const Text("Chapters")),
      body: userIdAsync.when(
        data: (userId) {
          if (userId == null) {
            return const Center(child: Text('Not logged in'));
          }

          return FutureBuilder(
            future: ref.read(courseRepositoryProvider).getChapters(bookId),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }
              if (snapshot.hasError) {
                return Center(child: Text("Error: ${snapshot.error}"));
              }

              final chapters = snapshot.data ?? [];
              if (chapters.isEmpty) {
                return const Center(child: Text("No chapters found."));
              }

              return ListView.builder(
                padding: const EdgeInsets.all(8),
                itemCount: chapters.length,
                itemBuilder: (context, index) {
                  final chapter = chapters[index];
                  return _ChapterCard(
                    chapter: chapter,
                    userId: userId,
                    index: index,
                  );
                },
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(child: Text('Error: $error')),
      ),
    );
  }
}

class _ChapterCard extends ConsumerWidget {
  final Chapter chapter;
  final String userId;
  final int index;

  const _ChapterCard({
    required this.chapter,
    required this.userId,
    required this.index,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final completionAsync = ref.watch(
      chapterCompletionProvider((userId, chapter.id)),
    );

    return completionAsync.when(
      data: (isCompleted) {
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          elevation: 1,
          child: ListTile(
            leading: Stack(
              children: [
                CircleAvatar(
                  backgroundColor: isCompleted
                      ? Colors.green.shade100
                      : Colors.deepPurple.shade100,
                  child: Text(
                    "${index + 1}",
                    style: TextStyle(
                      color: isCompleted ? Colors.green.shade900 : null,
                      fontWeight: isCompleted ? FontWeight.bold : null,
                    ),
                  ),
                ),
                if (isCompleted)
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      padding: const EdgeInsets.all(2),
                      decoration: BoxDecoration(
                        color: Colors.green,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                      child: const Icon(
                        Icons.check,
                        size: 12,
                        color: Colors.white,
                      ),
                    ),
                  ),
              ],
            ),
            title: Row(
              children: [
                Expanded(
                  child: Text(
                    chapter.title,
                    style: TextStyle(
                      decoration: isCompleted
                          ? TextDecoration.lineThrough
                          : null,
                      color: isCompleted
                          ? Colors.grey.shade600
                          : null,
                    ),
                  ),
                ),
                if (isCompleted)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.green.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.green.shade200),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.check_circle,
                          size: 14,
                          color: Colors.green.shade700,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Complete',
                          style: TextStyle(
                            fontSize: 11,
                            color: Colors.green.shade700,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
            subtitle: Text(chapter.emoji ?? ''),
            trailing: Icon(
              Icons.chevron_right,
              color: isCompleted ? Colors.grey.shade400 : null,
            ),
            onTap: () {
              context.push('/courses/chapter/${chapter.id}');
            },
          ),
        );
      },
      loading: () => Card(
        margin: const EdgeInsets.only(bottom: 8),
        child: ListTile(
          leading: CircleAvatar(
            backgroundColor: Colors.deepPurple.shade100,
            child: Text("${index + 1}"),
          ),
          title: Text(chapter.title),
          subtitle: Text(chapter.emoji ?? ''),
          trailing: const SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ),
      ),
      error: (_, __) => Card(
        margin: const EdgeInsets.only(bottom: 8),
        child: ListTile(
          leading: CircleAvatar(
            backgroundColor: Colors.deepPurple.shade100,
            child: Text("${index + 1}"),
          ),
          title: Text(chapter.title),
          subtitle: Text(chapter.emoji ?? ''),
          trailing: const Icon(Icons.chevron_right),
          onTap: () {
            context.push('/courses/chapter/${chapter.id}');
          },
        ),
      ),
    );
  }
}
