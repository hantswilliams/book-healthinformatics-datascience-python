import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:go_router/go_router.dart';
import '../../providers.dart';
import 'widgets/python_code_cell.dart';

class ChapterViewScreen extends ConsumerWidget {
  final String chapterId;
  const ChapterViewScreen({super.key, required this.chapterId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text("Chapter Content")),
      body: FutureBuilder(
        future: ref.read(courseRepositoryProvider).getSections(chapterId),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text("Error: ${snapshot.error}"));
          }

          final sections = snapshot.data ?? [];
          if (sections.isEmpty) {
            return const Center(child: Text("No content in this chapter."));
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: sections.length + 1, // +1 for the Complete Button
            itemBuilder: (context, index) {
              // 1. Show Complete Button at the very end
              if (index == sections.length) {
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 32.0),
                  child: FilledButton.icon(
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.all(20),
                      backgroundColor: Colors.green,
                    ),
                    icon: const Icon(Icons.check_circle),
                    label: const Text(
                      "COMPLETE CHAPTER",
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    onPressed: () async {
                      final userId = ref.read(authStateProvider).asData?.value;
                      if (userId != null) {
                        await ref
                            .read(courseRepositoryProvider)
                            .saveProgress(userId, chapterId, true);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text("Chapter Completed! 🎉"),
                            ),
                          );
                          context.pop(); // Go back to list
                        }
                      }
                    },
                  ),
                );
              }

              // 2. Render Section Content
              final section = sections[index];

              if (section.type == 'MARKDOWN') {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 24.0),
                  child: MarkdownBody(data: section.content),
                );
              } else if (section.type == 'PYTHON') {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 24.0),
                  child: PythonCodeCell(
                    code: section.content,
                    sectionId: section.id,
                  ),
                );
              }

              return const SizedBox.shrink();
            },
          );
        },
      ),
    );
  }
}
