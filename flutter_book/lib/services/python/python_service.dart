import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'python_service_stub.dart'
    if (dart.library.js_interop) 'python_service_web.dart'
    if (dart.library.io) 'python_service_mobile.dart';

class PythonExecutionResult {
  final String output;
  final String? error;

  PythonExecutionResult({required this.output, this.error});

  @override
  String toString() => error != null ? 'Error: $error' : output;
}

abstract class PythonService {
  Future<void> initialize();
  Future<PythonExecutionResult> runCode(String code);
  Future<void> loadPackages(List<String> packages);

  static PythonService create() => getPythonService();
}

final pythonServiceProvider = Provider<PythonService>((ref) {
  return PythonService.create();
});
