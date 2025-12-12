import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flex_color_scheme/flex_color_scheme.dart';
import 'config.dart';
import 'data/seeder.dart';
import 'providers.dart';
import 'router/app_router.dart';
import 'services/python/python_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Supabase
  // Note: users  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Pyodide/Python environment support
  // Supabase init removed for Local Auth Phase

  runApp(const ProviderScope(child: MyApp()));
}

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'Flutter Book',
      theme: FlexThemeData.light(scheme: FlexScheme.deepPurple),
      darkTheme: FlexThemeData.dark(scheme: FlexScheme.deepPurple),
      themeMode: ThemeMode.system,
      routerConfig: router,
      builder: (context, child) {
        return InitializationWrapper(child: child!);
      },
    );
  }
}

class InitializationWrapper extends ConsumerStatefulWidget {
  final Widget child;
  const InitializationWrapper({super.key, required this.child});

  @override
  ConsumerState<InitializationWrapper> createState() =>
      _InitializationWrapperState();
}

class _InitializationWrapperState extends ConsumerState<InitializationWrapper> {
  bool _ready = false;
  String _status = "Initializing...";

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    try {
      final db = ref.read(databaseProvider);
      final pythonService = ref.read(pythonServiceProvider);

      // 1. Seed Database
      await DatabaseSeeder(db).seed();

      // 2. Init Python
      await pythonService.initialize();

      if (mounted) {
        setState(() {
          _status = "Ready";
          _ready = true;
        });
      }
    } catch (e) {
      debugPrint('Init Error: $e');
      if (mounted) setState(() => _status = "Error: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_ready) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircularProgressIndicator(),
              const SizedBox(height: 16),
              Text(_status),
            ],
          ),
        ),
      );
    }

    // Once ready, show the main content
    return widget.child;
  }
}

class PythonTestPage extends ConsumerStatefulWidget {
  const PythonTestPage({super.key});

  @override
  ConsumerState<PythonTestPage> createState() => _PythonTestPageState();
}

class _PythonTestPageState extends ConsumerState<PythonTestPage> {
  final TextEditingController _controller = TextEditingController(
    text:
        "print('Hello from Python!')\nimport numpy as np\nprint(np.random.rand(3))",
  );
  String _output = "Not run yet";
  bool _isLoading = false;

  Future<void> _runCode() async {
    setState(() => _isLoading = true);
    try {
      final service = ref.read(pythonServiceProvider);
      final result = await service.runCode(_controller.text);
      setState(() {
        _output = result.output.isEmpty && result.error != null
            ? "Error: ${result.error}"
            : result.output;
      });
    } catch (e) {
      setState(() => _output = "Exec Error: $e");
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Flutter Book (Phase 2)")),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: _controller,
              maxLines: 5,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                labelText: 'Python Code',
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _isLoading ? null : _runCode,
              child: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text("Run Code"),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                color: Colors.black87,
                child: SingleChildScrollView(
                  child: Text(
                    _output,
                    style: const TextStyle(
                      color: Colors.greenAccent,
                      fontFamily: 'monospace',
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
