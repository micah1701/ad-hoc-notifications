# Ad Hoc Notifications

A React Native Android app that pairs with a backend server to receive and display push notifications on demand. You register the device by scanning a QR code (or entering a URL manually), and from that point the server can push notifications to your phone at any time — even when the app is in the background or closed.

The app uses Firebase Cloud Messaging (FCM) as the delivery channel, so notifications are reliable and battery-efficient. It keeps a scrollable history of everything received.

---

## Table of Contents

1. [How it works](#how-it-works)
2. [Prerequisites overview](#prerequisites-overview)
3. [Step 1 — Install Node.js](#step-1--install-nodejs)
4. [Step 2 — Install JDK 21](#step-2--install-jdk-21)
5. [Step 3 — Install Android Studio and the Android SDK](#step-3--install-android-studio-and-the-android-sdk)
6. [Step 4 — Set environment variables](#step-4--set-environment-variables)
7. [Step 5 — Set up Firebase](#step-5--set-up-firebase)
8. [Step 6 — Install JavaScript dependencies](#step-6--install-javascript-dependencies)
9. [Step 7 — Build the APK](#step-7--build-the-apk)
10. [Step 8 — Install the APK on your device](#step-8--install-the-apk-on-your-device)

---

## How it works

1. On first launch the app shows a registration screen. You scan a QR code displayed by your backend server (or paste the URL manually).
2. The app reads the registration token and server URL from the QR code and calls the server's `/api/notifications/register` endpoint, linking your device's FCM push token to your account.
3. After registration the app shows a notification list and periodically sends a heartbeat to the server so it knows your push token is still valid.
4. Notifications arrive via Firebase even when the app is closed. They are saved to local storage and shown in the list the next time you open the app.

---

## Prerequisites overview

Building an Android app from source requires several tools that you may not have installed. The table below lists everything needed and why:

| Tool | Why you need it |
|---|---|
| Node.js | Runs the JavaScript build tooling |
| JDK 21 | Android's build system is written in Java and needs a Java runtime |
| Android Studio | Provides the Android SDK — the libraries and compilers that turn code into an APK |
| A Firebase project | Provides the `google-services.json` config file that lets the app talk to FCM |

---

## Step 1 — Install Node.js

**Why:** The JavaScript layer of a React Native app is built and bundled by Node.js tools. Without Node, none of the build scripts can run.

1. Go to [https://nodejs.org](https://nodejs.org) and download the **LTS** installer for Windows (`.msi`). This project requires Node **22.11 or newer**, so make sure the version you download is at least 22.11.
2. Run the installer and accept the defaults.
3. Open a new PowerShell window and verify the install:
   ```powershell
   node --version
   ```
   You should see something like `v22.x.x`.

---

## Step 2 — Install JDK 21

**Why:** Android apps are compiled using tools written in Java. Gradle — the build system that assembles the APK — is a Java program and needs a Java Development Kit (JDK) installed to run. "JDK" is simply the package that includes the Java compiler and runtime together.

1. Go to [https://adoptium.net/temurin/releases/?version=21](https://adoptium.net/temurin/releases/?version=21).
2. Under **Operating System** select **Windows**, under **Architecture** select **x64**, and under **Package Type** select **JDK**.
3. Download the `.msi` installer and run it.
4. On the "Custom Setup" screen, make sure **Set JAVA_HOME variable** is set to **"Will be installed on local hard drive"** — this checkbox does the environment variable work for you automatically.
5. Complete the installation.
6. Open a new PowerShell window and verify:
   ```powershell
   java -version
   ```
   You should see `openjdk version "21.x.x"`.

> **What is `JAVA_HOME`?** It is an environment variable — a named piece of text the operating system stores — that tells other programs where Java is installed on your machine. Tools like Gradle look for `JAVA_HOME` so they can find and launch the Java runtime without you having to type the full path every time.

---

## Step 3 — Install Android Studio and the Android SDK

**Why:** To build an Android APK you need the Android SDK (Software Development Kit) — a large collection of Android platform libraries, compilers, and device tooling maintained by Google. Android Studio is the official IDE for Android development; you do not need to use it as your editor, but installing it is the easiest way to get the SDK and keep it up to date.

### 3a — Install Android Studio

1. Go to [https://developer.android.com/studio](https://developer.android.com/studio) and download the installer.
2. Run it and accept the defaults. The installer will also install the Android SDK in `C:\Users\<YourName>\AppData\Local\Android\Sdk`.

### 3b — Install the required SDK components

1. Open Android Studio. On the first launch it will run a setup wizard — let it download the default SDK components.
2. Once the main window opens, go to **More Actions → SDK Manager** (or **Tools → SDK Manager** from the menu).
3. On the **SDK Platforms** tab, check **Android 15 (API Level 35)** and click **Apply**.
4. Switch to the **SDK Tools** tab. Verify these are installed (checked):
   - Android SDK Build-Tools
   - Android SDK Platform-Tools
   - Android Emulator (optional, only needed if you want to test in a virtual device)
5. Click **OK** and let everything download.

> **What is the Android SDK?** Think of it as the "standard library" for Android. It contains the Java/Kotlin code that your app calls when it wants to show a notification, access the camera, or write a file — plus the `adb` command-line tool used to communicate with a physical device.

---

## Step 4 — Set environment variables

**Why:** The build tools need to know where your Android SDK is installed. They look for an environment variable called `ANDROID_HOME`. Without it, Gradle cannot find the Android compilers and the build will fail with a "SDK location not found" error.

### Set `ANDROID_HOME`

1. Open **Start**, search for **"Edit the system environment variables"**, and open it.
2. Click **Environment Variables…** at the bottom of the dialog.
3. Under **System variables**, click **New** and add:
   - **Variable name:** `ANDROID_HOME`
   - **Variable value:** `C:\Users\<YourName>\AppData\Local\Android\Sdk`
   
   Replace `<YourName>` with your actual Windows username. You can confirm the correct path by looking at the SDK location shown in Android Studio's SDK Manager.

### Add SDK tools to `Path`

The `Path` variable tells Windows where to look for executable programs. Adding the Android SDK tools to it means you can type `adb` in any terminal without needing to type the full path.

1. Still in **Environment Variables**, find the **Path** entry under **System variables**, select it, and click **Edit**.
2. Click **New** and add each of these on its own line:
   ```
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\emulator
   ```
3. Click **OK** on all dialogs to save.

### Verify

Open a **new** PowerShell window (existing windows won't pick up the changes) and run:
```powershell
adb --version
```
You should see an ADB version number. If you get "not recognized", double-check the paths above.

---

## Step 5 — Set up Firebase

**Why:** This app uses Firebase Cloud Messaging (FCM) to receive push notifications. FCM is Google's service for delivering messages to Android devices. To use it, the app needs a configuration file — `google-services.json` — that identifies which Firebase project it belongs to.

If `android/app/google-services.json` already exists in this repo, you can skip this step — it is already configured.

If it is missing:

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com) and create a new project (or open the existing one for this app).
2. Inside the project, click **Add app** and choose the **Android** icon.
3. Enter the package name: `com.adhocnotifications`. Leave the other fields blank and click **Register app**.
4. Download the `google-services.json` file Firebase generates.
5. Copy it into `android/app/google-services.json` in this repository.

---

## Step 6 — Install JavaScript dependencies

**Why:** React Native apps are partly JavaScript. The JS code depends on many third-party packages (navigation, camera, Firebase client libraries, etc.). These packages are not committed to the repository — instead, `package.json` lists them and `npm install` downloads them into the `node_modules` folder.

From the root of the repository, run:
```powershell
npm install
```

This only needs to be run once after a fresh clone, and again any time `package.json` changes.

---

## Step 7 — Build the APK

**Why:** Gradle is the build system that ties everything together — it compiles the Java/Kotlin Android code, bundles the JavaScript, and packages all of it into a single `.apk` file (Android Package) that can be installed on a device.

> **First build warning:** Gradle will download its own dependencies the first time it runs. This can take **10–15 minutes** and requires an internet connection. Subsequent builds are much faster.

From the root of the repository, run:
```powershell
cd android
.\gradlew assembleRelease
```

When it finishes (you should see `BUILD SUCCESSFUL`), the APK is at:
```
android\app\build\outputs\apk\release\app-release.apk
```

### If the build fails

- **`SDK location not found`** — `ANDROID_HOME` is not set or pointing to the wrong folder. Re-read Step 4.
- **`error: JAVA_HOME not set`** — JDK was not installed correctly or the `JAVA_HOME` variable is missing. Re-read Step 2.
- **`Could not find google-services.json`** — Re-read Step 5.

---

## Step 8 — Install the APK on your device

You have two options:

### Option A — USB (recommended)

This uses `adb`, the Android Debug Bridge — a command-line tool that lets your computer talk to an Android device over USB.

1. On your Android phone, open **Settings → About phone** and tap **Build number** seven times. This enables Developer Options.
2. Go to **Settings → Developer options** and turn on **USB debugging**.
3. Connect your phone to your computer with a USB cable. Accept the "Allow USB debugging?" prompt on the phone.
4. Run:
   ```powershell
   adb install android\app\build\outputs\apk\release\app-release.apk
   ```
   You should see `Performing Streamed Install` followed by `Success`.

### Option B — Direct file transfer

1. Copy `android\app\build\outputs\apk\release\app-release.apk` to your phone (via USB file transfer, Google Drive, email, etc.).
2. Open the file on your phone. Android will ask you to allow installing from an unknown source — accept this in Settings when prompted.
3. The app will install and appear in your app drawer.
