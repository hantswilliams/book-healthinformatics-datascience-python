import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/database.dart';
import '../../providers.dart';

class CourseFormScreen extends ConsumerStatefulWidget {
  final Book? book; // null for create, non-null for edit
  final String organizationId;
  final String createdBy;

  const CourseFormScreen({
    super.key,
    this.book,
    required this.organizationId,
    required this.createdBy,
  });

  @override
  ConsumerState<CourseFormScreen> createState() => _CourseFormScreenState();
}

class _CourseFormScreenState extends ConsumerState<CourseFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _titleController;
  late TextEditingController _slugController;
  late TextEditingController _descriptionController;
  late TextEditingController _displayOrderController;
  late bool _isPublished;
  late String _difficulty;
  bool _autoGenerateSlug = true;

  @override
  void initState() {
    super.initState();
    final book = widget.book;
    _titleController = TextEditingController(text: book?.title ?? '');
    _slugController = TextEditingController(text: book?.slug ?? '');
    _descriptionController = TextEditingController(text: book?.description ?? '');
    _displayOrderController = TextEditingController(
      text: book?.displayOrder.toString() ?? '1',
    );
    _isPublished = book?.isPublished ?? false;
    _difficulty = book?.difficulty ?? 'BEGINNER';
    _autoGenerateSlug = book == null;

    // Auto-generate slug from title
    _titleController.addListener(_onTitleChanged);
  }

  @override
  void dispose() {
    _titleController.dispose();
    _slugController.dispose();
    _descriptionController.dispose();
    _displayOrderController.dispose();
    super.dispose();
  }

  void _onTitleChanged() {
    if (_autoGenerateSlug && _titleController.text.isNotEmpty) {
      final slug = _titleController.text
          .toLowerCase()
          .replaceAll(RegExp(r'[^a-z0-9]+'), '-')
          .replaceAll(RegExp(r'^-+|-+$'), '');
      _slugController.text = slug;
    }
  }

  Future<void> _saveCourse() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final courseRepo = ref.read(courseRepositoryProvider);
    final navigator = Navigator.of(context);

    try {
      if (widget.book == null) {
        // Create new course
        await courseRepo.createBook(
          organizationId: widget.organizationId,
          createdBy: widget.createdBy,
          title: _titleController.text.trim(),
          slug: _slugController.text.trim(),
          description: _descriptionController.text.trim().isEmpty
              ? null
              : _descriptionController.text.trim(),
          difficulty: _difficulty,
          displayOrder: int.parse(_displayOrderController.text),
          isPublished: _isPublished,
        );

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Course created successfully')),
          );
        }
      } else {
        // Update existing course
        await courseRepo.updateBook(
          bookId: widget.book!.id,
          title: _titleController.text.trim(),
          slug: _slugController.text.trim(),
          description: _descriptionController.text.trim().isEmpty
              ? null
              : _descriptionController.text.trim(),
          difficulty: _difficulty,
          displayOrder: int.parse(_displayOrderController.text),
          isPublished: _isPublished,
        );

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Course updated successfully')),
          );
        }
      }

      navigator.pop(true); // Return true to indicate success
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving course: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.book != null;

    return Scaffold(
      appBar: AppBar(
        title: Text(isEditing ? 'Edit Course' : 'Create Course'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(
                labelText: 'Course Title *',
                hintText: 'e.g., Python for Data Science',
                border: OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter a course title';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _slugController,
              decoration: InputDecoration(
                labelText: 'Slug *',
                hintText: 'e.g., python-datascience',
                border: const OutlineInputBorder(),
                suffixIcon: IconButton(
                  icon: Icon(
                    _autoGenerateSlug ? Icons.link : Icons.link_off,
                    color: _autoGenerateSlug ? Colors.blue : Colors.grey,
                  ),
                  onPressed: () {
                    setState(() {
                      _autoGenerateSlug = !_autoGenerateSlug;
                      if (_autoGenerateSlug) {
                        _onTitleChanged();
                      }
                    });
                  },
                  tooltip: _autoGenerateSlug
                      ? 'Auto-generate from title'
                      : 'Manual slug entry',
                ),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter a slug';
                }
                if (!RegExp(r'^[a-z0-9-]+$').hasMatch(value)) {
                  return 'Slug must contain only lowercase letters, numbers, and hyphens';
                }
                return null;
              },
              enabled: !_autoGenerateSlug,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _descriptionController,
              decoration: const InputDecoration(
                labelText: 'Description',
                hintText: 'Brief description of the course',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _difficulty,
              decoration: const InputDecoration(
                labelText: 'Difficulty Level',
                border: OutlineInputBorder(),
              ),
              items: const [
                DropdownMenuItem(value: 'BEGINNER', child: Text('Beginner')),
                DropdownMenuItem(value: 'INTERMEDIATE', child: Text('Intermediate')),
                DropdownMenuItem(value: 'ADVANCED', child: Text('Advanced')),
              ],
              onChanged: (value) {
                if (value != null) {
                  setState(() {
                    _difficulty = value;
                  });
                }
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _displayOrderController,
              decoration: const InputDecoration(
                labelText: 'Display Order',
                hintText: '1',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter a display order';
                }
                if (int.tryParse(value) == null) {
                  return 'Please enter a valid number';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            SwitchListTile(
              title: const Text('Published'),
              subtitle: const Text('Make this course visible to learners'),
              value: _isPublished,
              onChanged: (value) {
                setState(() {
                  _isPublished = value;
                });
              },
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _saveCourse,
                    child: Text(isEditing ? 'Update Course' : 'Create Course'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
