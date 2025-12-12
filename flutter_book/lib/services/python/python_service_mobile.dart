import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'python_service.dart';

class PythonServiceMobile implements PythonService {
  HeadlessInAppWebView? _headlessWebView;
  Completer<void>? _initCompleter;

  @override
  Future<void> initialize() async {
    if (_initCompleter != null) return _initCompleter!.future;
    _initCompleter = Completer<void>();

    _headlessWebView = HeadlessInAppWebView(
      initialFile: 'assets/pyodide/index.html',
      initialSettings: InAppWebViewSettings(
        isInspectable: true,
        javaScriptEnabled: true,
      ),
      onWebViewCreated: (controller) {
        controller.addJavaScriptHandler(
          handlerName: 'onReady',
          callback: (args) {
            if (!_initCompleter!.isCompleted) {
              _initCompleter!.complete();
            }
          },
        );

        controller.addJavaScriptHandler(
          handlerName: 'onError',
          callback: (args) {
            debugPrint('Python Service Error: ${args[0]}');
            if (!_initCompleter!.isCompleted) {
              _initCompleter!.completeError(args[0]);
            }
          },
        );
      },
      onConsoleMessage: (controller, consoleMessage) {
        debugPrint('Pyodide Console: ${consoleMessage.message}');
      },
    );

    await _headlessWebView?.run();
    return _initCompleter!.future;
  }

  @override
  Future<PythonExecutionResult> runCode(String code) async {
    if (_headlessWebView == null) {
      return PythonExecutionResult(
        output: '',
        error: 'Service not initialized',
      );
    }

    try {
      // Use callAsyncJavaScript to pass arguments safely
      final result = await _headlessWebView!.webViewController!
          .callAsyncJavaScript(
            functionBody: "return await runPythonCode(code)",
            arguments: {'code': code},
          );

      if (result == null || result.value is! String) {
        return PythonExecutionResult(
          output: '',
          error: 'No result returned or invalid format',
        );
      }

      final String resultStr = result.value;
      final Map<String, dynamic> resultMap = jsonDecode(resultStr);
      return PythonExecutionResult(
        output: resultMap['output'] ?? '',
        error: resultMap['error'],
      );
    } catch (e) {
      return PythonExecutionResult(output: '', error: e.toString());
    }
  }

  @override
  Future<void> loadPackages(List<String> packages) async {
    if (_headlessWebView == null) return;

    await _headlessWebView!.webViewController!.callAsyncJavaScript(
      functionBody: "return await loadPackages(packages)",
      arguments: {'packages': packages},
    );
  }
}

PythonService getPythonService() => PythonServiceMobile();
