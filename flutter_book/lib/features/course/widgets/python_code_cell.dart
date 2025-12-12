import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../services/python/python_service.dart';
import '../../../providers.dart';

class PythonCodeCell extends ConsumerStatefulWidget {
  final String code;
  final String sectionId;

  const PythonCodeCell({
    super.key,
    required this.code,
    required this.sectionId,
  });

  @override
  ConsumerState<PythonCodeCell> createState() => _PythonCodeCellState();
}

class _PythonCodeCellState extends ConsumerState<PythonCodeCell> {
  bool _isRunning = false;
  String? _output;
  String? _error;
  late TextEditingController _codeController;

  @override
  void initState() {
    super.initState();
    _codeController = TextEditingController(text: widget.code);
  }

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _runCode() async {
    setState(() {
      _isRunning = true;
      _output = null;
      _error = null;
    });

    try {
      final pythonService = ref.read(pythonServiceProvider);
      // Run the code using the Python Service
      final result = await pythonService.runCode(_codeController.text);

      if (mounted) {
        setState(() {
          _output = result.output;
          // Capture error if output is empty but error exists, or just append it
          if (result.error != null && result.error!.isNotEmpty) {
            _error = result.error;
          }
        });

        // Save to Database
        final userId = ref.read(authStateProvider).asData?.value;
        if (userId != null) {
          await ref
              .read(courseRepositoryProvider)
              .saveCodeSnippet(
                userId: userId,
                sectionId: widget.sectionId,
                code: _codeController.text,
                output: _output,
                error: _error,
              );
          debugPrint("✅ Saved Code Snippet to DB!");
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _error = e.toString());
      }
    } finally {
      if (mounted) {
        setState(() => _isRunning = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.grey.shade900,
      clipBehavior: Clip.antiAlias,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  "PYTHON CODE",
                  style: TextStyle(
                    color: Colors.grey.shade500,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (_isRunning)
                  const SizedBox(
                    width: 12,
                    height: 12,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Container(
              decoration: BoxDecoration(
                color: Colors.black45,
                borderRadius: BorderRadius.circular(4),
              ),
              child: TextField(
                controller: _codeController,
                maxLines: null,
                style: const TextStyle(
                  color: Colors.greenAccent,
                  fontFamily: 'monospace',
                ),
                decoration: const InputDecoration(
                  contentPadding: EdgeInsets.all(8),
                  border: InputBorder.none,
                  isDense: true,
                ),
              ),
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: _isRunning ? null : _runCode,
              icon: const Icon(Icons.play_arrow),
              label: const Text("Run Code"),
              style: FilledButton.styleFrom(
                backgroundColor: Colors.deepPurple,
                foregroundColor: Colors.white,
              ),
            ),
            if (_output != null || _error != null) ...[
              const SizedBox(height: 16),
              const Divider(color: Colors.white24),
              if (_output != null && _output!.isNotEmpty) ...[
                const Text(
                  "OUTPUT:",
                  style: TextStyle(color: Colors.white54, fontSize: 10),
                ),
                const SizedBox(height: 4),
                Text(
                  _output!,
                  style: const TextStyle(
                    color: Colors.white,
                    fontFamily: 'monospace',
                  ),
                ),
              ],
              if (_error != null && _error!.isNotEmpty) ...[
                if (_output != null && _output!.isNotEmpty)
                  const SizedBox(height: 8),
                const Text(
                  "ERROR:",
                  style: TextStyle(color: Colors.redAccent, fontSize: 10),
                ),
                const SizedBox(height: 4),
                Text(
                  _error!,
                  style: const TextStyle(
                    color: Colors.redAccent,
                    fontFamily: 'monospace',
                  ),
                ),
              ],
            ],
          ],
        ),
      ),
    );
  }
}
