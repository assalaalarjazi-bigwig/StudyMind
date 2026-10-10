# StudyMind — Android APK Architecture & GitHub Actions Workflow

This document details the exact path from a **Python + Streamlit** project in Visual Studio Code to an **installable Android APK** on a physical phone without needing Android Studio installed locally.

---

## 1. Realistic Technical Landscape: Python on Mobile

Streamlit requires a running Python interpreter and web server. It cannot compile directly into native ARM machine code. Therefore, packaging Python/Streamlit as an Android application follows one of two realistic architectures:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ANDROID DEPLOYMENT PATHS                        │
├───────────────────────────────────┬────────────────────────────────────┤
│   APPROACH A: Android WebView     │      APPROACH B: Termux/Local      │
│   (Recommended for StudyMind)     │      Python Server Engine          │
│                                   │                                    │
│ - Android App contains a native   │ - Local Python process runs on     │
│   hardware-accelerated WebView.   │   the phone, WebView connects to   │
│ - Connects to local server (via   │   localhost:8501.                  │
│   Wi-Fi or hosted endpoint).      │ - More complex mobile setup.       │
│ - Full file-picker integration.   │                                    │
└───────────────────────────────────┴────────────────────────────────────┘
```

StudyMind uses the **Standard Android WebView Wrapper Architecture** configured in the `android/` directory and built automatically via **GitHub Actions**.

---

## 2. The Development & Packaging Workflow

```
[ Develop in Visual Studio Code ]
  │
  ├── 1. Run & test locally: `streamlit run app.py`
  ├── 2. Commit and push changes: `git push origin main`
  │
[ GitHub Actions Automated CI Pipeline ]
  │
  ├── 3. GitHub detects push to `.github/workflows/build-android-apk.yml`
  ├── 4. Sets up Java 17 + Android SDK
  ├── 5. Executes `./gradlew assembleDebug`
  ├── 6. Generates `app-debug.apk` artifact
  │
[ Install on Phone ]
  │
  ├── 7. Download `StudyMind-Debug-APK.zip` from GitHub Actions Summary
  ├── 8. Extract `app-debug.apk` and transfer to Android phone
  └── 9. Tap to install (Allow "Install Unknown Apps" in phone settings)
```

---

## 3. Anatomy of the Android Package (`android/`)

- `android/app/src/main/AndroidManifest.xml`:
  Declares internet, storage, and file selection permissions.
- `android/app/src/main/java/com/studymind/app/MainActivity.java`:
  - Hardware-accelerated WebView.
  - Implements `WebChromeClient.onShowFileChooser`: Pops native Android file chooser so you can upload PDFs and Word documents straight from your phone's storage.
  - Intercepts the back button to navigate backwards in study history instead of exiting the app.
- `android/app/build.gradle`:
  Configured for Android SDK 34 (Android 14) with minimum SDK 24 (Android 7.0+), covering >98% of active Android devices.

---

## 4. Connecting Your Phone to Your Local Streamlit Server

When testing your APK against your computer's local development server over home Wi-Fi:
1. Find your computer's local IP address (`ipconfig` on Windows or `ip addr` / `ifconfig` on Linux/Mac, e.g., `192.168.1.50`).
2. Run Streamlit bound to all interfaces:
   ```bash
   streamlit run app.py --server.port 8501 --server.address 0.0.0.0
   ```
3. Update `APP_URL` in `MainActivity.java` or enter your computer's IP:
   ```java
   private static final String APP_URL = "http://192.168.1.50:8501";
   ```
4. Push to GitHub to generate the APK. Install it on your phone, and it connects directly to your local workstation.
