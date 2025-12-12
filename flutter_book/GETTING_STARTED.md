# Getting Started with Flutter Book

This guide will help you set up and run the **Flutter Book** application locally. This app uses a unique Hybrid Architecture to run Python code directly within the app using **Pyodide** (Web Assembly).

## 📋 Prerequisites

- **Flutter SDK**: Ensure you have Flutter installed (`flutter doctor`).
- **Chrome**: For running the web version.
- **Xcode / Android Studio**: If you plan to run on mobile emulators.

## 🔑 Local Authentication (Phase 2)

The application currently uses a **Local SQLite Database** for authentication and data storage.

**Default Credentials:**
- **Email:** `demo@test.com`
- **Password:** `password`

*The database is automatically seeded with this user and sample content on the first run.*

## 🚀 Quick Start (Web)

The easiest way to test the application is via Chrome.

1.  **Open Terminal** in the project directory:
    ```bash
    cd flutter_book
    ```

2.  **Install Dependencies**:
    ```bash
    flutter pub get
    ```

3.  **Run in Chrome**:
    ```bash
    flutter run -d chrome
    ```

_Note: The first launch might take a moment as it downloads the Web Assembly assets._

## 📱 Running on Mobile

The app uses a **Headless WebView** bridge on mobile to maintain 100% compatibility with the Web version's Python environment.

1.  **Start a Simulator/Emulator**:
    - iOS: `open -a Simulator`
    - Android: Launch via Android Studio or `flutter emulators --launch <id>`

2.  **Run the App**:
    ```bash
    flutter run
    ```

## 🛠 Verifying Python Execution

Once the app is running:

1.  You will see a "Python Bridge Test" screen.
2.  Wait for the status to change to **"Python Ready (Numpy loaded)"**.
    - *On Mobile, this indicates the hidden WebView has successfully initialized Pyodide.*
    - *On Web, this indicates the WASM binaries are loaded.*
3.  Click **Run Code** to execute the sample Python script.
4.  You should see the output (including random numbers from Numpy) appear in the console box below.

## 📁 Project Structure

- `lib/services/python/`: Contains the bridge logic.
    - `python_service.dart`: The universal interface.
    - `python_service_web.dart`: `dart:js_interop` implementation for Web.
    - `python_service_mobile.dart`: Headless WebView implementation for Mobile.
- `assets/pyodide/`: Contains the HTML runner for mobile.
