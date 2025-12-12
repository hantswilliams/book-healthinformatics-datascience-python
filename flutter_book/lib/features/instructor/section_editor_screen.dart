import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/database.dart';
import '../../providers.dart';

class SectionEditorScreen extends ConsumerStatefulWidget {
  final Chapter chapter;

  const SectionEditorScreen({
    super.key,
    required this.chapter,
  });

  @override
  ConsumerState<SectionEditorScreen> createState() => _SectionEditorScreenState();
}

class _SectionEditorScreenState extends ConsumerState<SectionEditorScreen> {
  @override
  Widget build(BuildContext context) {
    final courseRepo = ref.watch(courseRepositoryProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('Sections: ${widget.chapter.title}'),
      ),
      body: FutureBuilder<List<Section>>(
        future: courseRepo.getSections(widget.chapter.id),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }

          final sections = snapshot.data ?? [];

          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        '${sections.length} section(s)',
                        style: const TextStyle(fontSize: 16),
                      ),
                    ),
                    PopupMenuButton<String>(
                      icon: const Icon(Icons.add_circle),
                      tooltip: 'Add Section',
                      onSelected: (type) => _showAddSectionDialog(type),
                      itemBuilder: (context) => [
                        const PopupMenuItem(
                          value: 'MARKDOWN',
                          child: Row(
                            children: [
                              Icon(Icons.text_fields),
                              SizedBox(width: 8),
                              Text('Markdown Section'),
                            ],
                          ),
                        ),
                        const PopupMenuItem(
                          value: 'PYTHON',
                          child: Row(
                            children: [
                              Icon(Icons.code),
                              SizedBox(width: 8),
                              Text('Python Section'),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              if (sections.isEmpty)
                const Expanded(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.article_outlined, size: 64, color: Colors.grey),
                        SizedBox(height: 16),
                        Text(
                          'No sections yet',
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
                    itemCount: sections.length,
                    onReorder: (oldIndex, newIndex) =>
                        _reorderSections(sections, oldIndex, newIndex),
                    itemBuilder: (context, index) {
                      final section = sections[index];
                      return _SectionCard(
                        key: ValueKey(section.id),
                        section: section,
                        onEdit: () => _showEditSectionDialog(section),
                        onDelete: () => _confirmDelete(section),
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

  void _showAddSectionDialog(String type) {
    showDialog(
      context: context,
      builder: (context) => _SectionFormDialog(
        chapterId: widget.chapter.id,
        type: type,
      ),
    ).then((result) {
      if (result == true) {
        setState(() {}); // Refresh the list
      }
    });
  }

  void _showEditSectionDialog(Section section) {
    showDialog(
      context: context,
      builder: (context) => _SectionFormDialog(
        chapterId: widget.chapter.id,
        section: section,
        type: section.type,
      ),
    ).then((result) {
      if (result == true) {
        setState(() {}); // Refresh the list
      }
    });
  }

  Future<void> _reorderSections(
    List<Section> sections,
    int oldIndex,
    int newIndex,
  ) async {
    if (oldIndex < newIndex) {
      newIndex -= 1;
    }

    final reorderedSections = List<Section>.from(sections);
    final section = reorderedSections.removeAt(oldIndex);
    reorderedSections.insert(newIndex, section);

    final sectionIds = reorderedSections.map((s) => s.id).toList();

    try {
      final courseRepo = ref.read(courseRepositoryProvider);
      await courseRepo.reorderSections(sectionIds);
      setState(() {}); // Refresh
    } catch (e) {
      debugPrint('Error reordering sections: $e');
    }
  }

  Future<void> _confirmDelete(Section section) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Section'),
        content: const Text('Are you sure you want to delete this section?'),
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

    if (confirmed == true && mounted) {
      try {
        final courseRepo = ref.read(courseRepositoryProvider);
        await courseRepo.deleteSection(section.id);
        setState(() {}); // Refresh
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Section deleted successfully')),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error deleting section: $e')),
          );
        }
      }
    }
  }
}

class _SectionCard extends StatelessWidget {
  final Section section;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _SectionCard({
    super.key,
    required this.section,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final isPython = section.type == 'PYTHON';
    final preview = section.content.length > 100
        ? '${section.content.substring(0, 100)}...'
        : section.content;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isPython ? Icons.code : Icons.text_fields,
              color: isPython ? Colors.blue : Colors.green,
            ),
          ],
        ),
        title: Text(
          section.title ?? (isPython ? 'Python Code' : 'Markdown Text'),
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Text(
          preview,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            fontFamily: isPython ? 'monospace' : null,
            fontSize: 12,
          ),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.edit, size: 20),
              onPressed: onEdit,
            ),
            IconButton(
              icon: const Icon(Icons.delete, size: 20, color: Colors.red),
              onPressed: onDelete,
            ),
            const Icon(Icons.drag_handle, color: Colors.grey),
          ],
        ),
      ),
    );
  }
}

class _SectionFormDialog extends ConsumerStatefulWidget {
  final String chapterId;
  final String type;
  final Section? section;

  const _SectionFormDialog({
    required this.chapterId,
    required this.type,
    this.section,
  });

  @override
  ConsumerState<_SectionFormDialog> createState() => _SectionFormDialogState();
}

class _SectionFormDialogState extends ConsumerState<_SectionFormDialog> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _titleController;
  late TextEditingController _contentController;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.section?.title ?? '');
    _contentController = TextEditingController(text: widget.section?.content ?? '');
  }

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final courseRepo = ref.read(courseRepositoryProvider);

    try {
      if (widget.section == null) {
        // Create new section
        await courseRepo.createSection(
          chapterId: widget.chapterId,
          type: widget.type,
          content: _contentController.text.trim(),
          title: _titleController.text.trim().isEmpty
              ? null
              : _titleController.text.trim(),
        );
      } else {
        // Update existing section
        await courseRepo.updateSection(
          sectionId: widget.section!.id,
          title: _titleController.text.trim().isEmpty
              ? null
              : _titleController.text.trim(),
          content: _contentController.text.trim(),
        );
      }

      if (mounted) {
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving section: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isPython = widget.type == 'PYTHON';
    final isEditing = widget.section != null;

    return AlertDialog(
      title: Text(
        isEditing
            ? 'Edit ${isPython ? 'Python' : 'Markdown'} Section'
            : 'Add ${isPython ? 'Python' : 'Markdown'} Section',
      ),
      content: SizedBox(
        width: MediaQuery.of(context).size.width * 0.8,
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: 'Title (optional)',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _contentController,
                decoration: InputDecoration(
                  labelText: isPython ? 'Python Code *' : 'Markdown Content *',
                  border: const OutlineInputBorder(),
                ),
                maxLines: 10,
                style: TextStyle(
                  fontFamily: isPython ? 'monospace' : null,
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter content';
                  }
                  return null;
                },
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: _save,
          child: Text(isEditing ? 'Update' : 'Add'),
        ),
      ],
    );
  }
}
