import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers.dart';

class ChapterListScreen extends ConsumerWidget {
  final String bookId;
  const ChapterListScreen({super.key, required this.bookId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text("Chapters")),
      body: FutureBuilder(
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
            itemCount: chapters.length,
            itemBuilder: (context, index) {
              final chapter = chapters[index];
              return ListTile(
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
              );
            },
          );
        },
      ),
    );
  }
}
