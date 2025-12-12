import 'dart:async';
import 'dart:js_interop';
import 'dart:js_interop_unsafe';
import 'package:flutter/foundation.dart';
import 'package:web/web.dart' as web;
import 'python_service.dart';

@JS('loadPyodide')
external JSPromise<JSPyodide> loadPyodideExternal([JSAny? config]);

@JS()
extension type JSPyodide(JSObject _) implements JSObject {
  external JSPromise<JSAny?> runPythonAsync(JSString code);
  external JSAny? runPython(JSString code);
  external JSPromise<JSAny?> loadPackage(JSAny package);
  external JSPyodide pyimport(JSString module);
}

@JS()
extension type JSMicropip(JSObject _) implements JSObject {
  external JSPromise<JSAny?> install(JSString package);
}

class PythonServiceWeb implements PythonService {
  JSPyodide? _pyodide;
  bool _isInit = false;

  @override
  Future<void> initialize() async {
    if (_isInit) return;

    // Inject script tag if not present
    if (!globalContext.has('loadPyodide')) {
      final script =
          web.document.createElement('script') as web.HTMLScriptElement;
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
      web.document.head!.appendChild(script);

      await _waitForLoadPyodide();
    }

    try {
      _pyodide = await loadPyodideExternal().toDart;
      await _pyodide!.loadPackage('micropip'.toJS).toDart;

      // Setup Output Capture
      await _pyodide!
          .runPythonAsync(
            '''
import sys
from io import StringIO
class OutputCapture:
    def __init__(self):
        self.output = StringIO()
        self.original_stdout = sys.stdout
    def capture(self):
        sys.stdout = self.output
    def release(self):
        sys.stdout = self.original_stdout
        contents = self.output.getvalue()
        self.output = StringIO()
        return contents
_output_capture = OutputCapture()
'''
                .toJS,
          )
          .toDart;

      _isInit = true;
    } catch (e) {
      debugPrint('Pyodide Web Init Error: $e');
      rethrow;
    }
  }

  Future<void> _waitForLoadPyodide() async {
    final completer = Completer<void>();
    Timer.periodic(const Duration(milliseconds: 100), (timer) {
      if (globalContext.has('loadPyodide')) {
        timer.cancel();
        completer.complete();
      }
    });
    return completer.future;
  }

  @override
  Future<PythonExecutionResult> runCode(String code) async {
    if (_pyodide == null) {
      return PythonExecutionResult(output: '', error: 'Pyodide not loaded');
    }

    try {
      _pyodide!.runPython('_output_capture.capture()'.toJS);
      final resultPromise = _pyodide!.runPythonAsync(code.toJS);
      final result = await resultPromise.toDart;

      // Safely handle potentially null return from release()
      final stdoutJSAny = _pyodide!.runPython('_output_capture.release()'.toJS);

      String finalOutput = '';
      if (stdoutJSAny != null && stdoutJSAny.isA<JSString>()) {
        finalOutput = (stdoutJSAny as JSString).toDart;
      }

      if (result != null) {
        finalOutput += (finalOutput.isNotEmpty ? '\n' : '') + result.toString();
      }

      return PythonExecutionResult(output: finalOutput);
    } catch (e) {
      try {
        _pyodide!.runPython('_output_capture.release()'.toJS);
      } catch (_) {
        // Ignore cleanup errors
      }
      return PythonExecutionResult(output: '', error: e.toString());
    }
  }

  @override
  Future<void> loadPackages(List<String> packages) async {
    if (_pyodide == null) return;
    try {
      for (final pkg in packages) {
        await _pyodide!.loadPackage(pkg.toJS).toDart;
      }
    } catch (e) {
      try {
        final micropip = _pyodide!.pyimport('micropip'.toJS) as JSMicropip;
        for (final pkg in packages) {
          await micropip.install(pkg.toJS).toDart;
        }
      } catch (e2) {
        debugPrint('Web Package Load Error: $e2');
      }
    }
  }
}

PythonService getPythonService() => PythonServiceWeb();
