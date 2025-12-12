import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/database.dart';
import '../../providers.dart';

class ChapterFormScreen extends ConsumerStatefulWidget {
  final String bookId;
  final String createdBy;
  final Chapter? chapter; // null for create, non-null for edit

  const ChapterFormScreen({
    super.key,
    required this.bookId,
    required this.createdBy,
    this.chapter,
  });

  @override
  ConsumerState<ChapterFormScreen> createState() => _ChapterFormScreenState();
}

class _ChapterFormScreenState extends ConsumerState<ChapterFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _titleController;
  late TextEditingController _emojiController;
  late TextEditingController _displayOrderController;
  late TextEditingController _customPackageController;
  late bool _isolatedCells;
  late List<String> _selectedPackages;

  // Predefined package list
  final List<String> _predefinedPackages = [
    'numpy',
    'pandas',
    'matplotlib',
  ];

  @override
  void initState() {
    super.initState();
    final chapter = widget.chapter;

    _titleController = TextEditingController(text: chapter?.title ?? '');
    _emojiController = TextEditingController(text: chapter?.emoji ?? '📚');
    _displayOrderController = TextEditingController(
      text: chapter?.displayOrder.toString() ?? '1',
    );
    _customPackageController = TextEditingController();
    _isolatedCells = chapter?.isolatedCells ?? false;

    // Parse existing packages or use defaults
    if (chapter != null) {
      try {
        final packagesJson = jsonDecode(chapter.pythonPackages) as List;
        _selectedPackages = packagesJson.map((e) => e.toString()).toList();
      } catch (e) {
        _selectedPackages = List.from(_predefinedPackages);
      }
    } else {
      _selectedPackages = List.from(_predefinedPackages);
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _emojiController.dispose();
    _displayOrderController.dispose();
    _customPackageController.dispose();
    super.dispose();
  }

  Future<void> _saveChapter() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final courseRepo = ref.read(courseRepositoryProvider);
    final navigator = Navigator.of(context);

    try {
      if (widget.chapter == null) {
        // Create new chapter
        await courseRepo.createChapter(
          bookId: widget.bookId,
          createdBy: widget.createdBy,
          title: _titleController.text.trim(),
          emoji: _emojiController.text.trim(),
          displayOrder: int.parse(_displayOrderController.text),
          pythonPackages: _selectedPackages,
          isolatedCells: _isolatedCells,
        );

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Chapter created successfully')),
          );
        }
      } else {
        // Update existing chapter
        await courseRepo.updateChapter(
          chapterId: widget.chapter!.id,
          title: _titleController.text.trim(),
          emoji: _emojiController.text.trim(),
          displayOrder: int.parse(_displayOrderController.text),
          pythonPackages: _selectedPackages,
          isolatedCells: _isolatedCells,
        );

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Chapter updated successfully')),
          );
        }
      }

      navigator.pop(true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving chapter: $e')),
        );
      }
    }
  }

  void _addCustomPackage() {
    final packageName = _customPackageController.text.trim();
    if (packageName.isNotEmpty && !_selectedPackages.contains(packageName)) {
      setState(() {
        _selectedPackages.add(packageName);
        _customPackageController.clear();
      });
    }
  }

  void _removePackage(String package) {
    setState(() {
      _selectedPackages.remove(package);
    });
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.chapter != null;

    return Scaffold(
      appBar: AppBar(
        title: Text(isEditing ? 'Edit Chapter' : 'Create Chapter'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Basic Info Section
            const Text(
              'Basic Information',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(
                labelText: 'Chapter Title *',
                hintText: 'e.g., Introduction to Python',
                border: OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter a chapter title';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  flex: 2,
                  child: TextFormField(
                    controller: _emojiController,
                    decoration: const InputDecoration(
                      labelText: 'Emoji *',
                      hintText: '📚',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Please enter an emoji';
                      }
                      return null;
                    },
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  flex: 3,
                  child: TextFormField(
                    controller: _displayOrderController,
                    decoration: const InputDecoration(
                      labelText: 'Display Order',
                      hintText: '1',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Required';
                      }
                      if (int.tryParse(value) == null) {
                        return 'Invalid number';
                      }
                      return null;
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Python Configuration Section
            const Text(
              'Python Configuration',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),

            // Python Packages
            const Text(
              'Python Packages',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _selectedPackages.map((package) {
                return Chip(
                  label: Text(package),
                  onDeleted: () => _removePackage(package),
                  deleteIcon: const Icon(Icons.close, size: 18),
                );
              }).toList(),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _customPackageController,
                    decoration: const InputDecoration(
                      labelText: 'Add Custom Package',
                      hintText: 'e.g., scipy, seaborn',
                      border: OutlineInputBorder(),
                    ),
                    onSubmitted: (_) => _addCustomPackage(),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  onPressed: _addCustomPackage,
                  icon: const Icon(Icons.add_circle),
                  tooltip: 'Add Package',
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Isolated Cells Toggle
            Card(
              child: SwitchListTile(
                title: const Text('Isolated Cells'),
                subtitle: Text(
                  _isolatedCells
                      ? 'Each Python cell runs in a fresh environment'
                      : 'Cells share variables and state within this chapter',
                ),
                value: _isolatedCells,
                onChanged: (value) {
                  setState(() {
                    _isolatedCells = value;
                  });
                },
              ),
            ),
            const SizedBox(height: 24),

            // Save/Cancel Buttons
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
                    onPressed: _saveChapter,
                    child: Text(isEditing ? 'Update Chapter' : 'Create Chapter'),
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
