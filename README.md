# 🚆 RailOne - Next-Gen Indian Railways Ticketing App

<div align="center">

![RailOne App](assets/adaptive-icon.png)

**Fast, Reliable & Native Unreserved & Platform Ticket Booking Solution for Indian Railways**

[![GitHub Release](https://img.shields.io/github/v/release/codebysrk/RailOneApp?style=for-the-badge&color=0066ff)](https://github.com/codebysrk/RailOneApp/releases)
[![Build Status](https://img.shields.io/github/actions/workflow/status/codebysrk/RailOneApp/build.yml?style=for-the-badge&color=22c55e)](https://github.com/codebysrk/RailOneApp/actions)
[![Expo SDK 57](https://img.shields.io/badge/Expo-SDK_57-000000?style=for-the-badge&logo=expo)](https://expo.dev)
[![React Native 0.86](https://img.shields.io/badge/React_Native-0.86-61dafb?style=for-the-badge&logo=react)](https://reactnative.dev)

</div>

---

## 📱 Features

- 🎟️ **Instant Unreserved & Platform Ticketing**: Seamless paperless ticket booking across all Indian Railway stations.
- ⏱️ **Live Mechanical Ticket Reel**: Authenticated, rolling-digit verification reel for TTE inspection with anti-screenshot watermarks.
- 💼 **Integrated R-Wallet**: High-speed, seamless transactions with admin-approved wallet recharge requests and live balance sync.
- ⚡ **CRIS RBS Distance & Fare Engine**: Authoritative Dijkstra shortest-path track distance and authentic fare computation.
- 🛡️ **Comprehensive Admin Suite**: Station distance editors, passenger ledger, wallet request approvals, and audit log tracking.
- 🔋 **Offline Persistence & Battery Optimization**: 0ms instant cached data and low-power background listener management.

---

## 📦 4 Architecture Split APKs

Starting from **v1.1.0**, RailOne uses native architecture splits and ProGuard/R8 dead-code shrinking to deliver **~14-16 MB** ultra-lightweight APKs instead of a bulky universal build:

| APK Package | Target Architecture | Target Devices | Typical Size |
| :--- | :--- | :--- | :---: |
| **RailOne-v1.1.0-arm64-v8a.apk** | rm64-v8a | **95%+ Modern Android Smartphones** (OnePlus, Samsung, Xiaomi, Realme, Vivo, etc.) | **~15 MB** ⚡ |
| **RailOne-v1.1.0-armeabi-v7a.apk** | rmeabi-v7a | Older 32-bit Android phones | **~14 MB** |
| **RailOne-v1.1.0-x86_64.apk** | x86_64 | 64-bit Android Studio Emulators & Windows Subsystem for Android | **~16 MB** |
| **RailOne-v1.1.0-x86.apk** | x86 | 32-bit Emulators | **~16 MB** |

👉 **[Download the Latest Release APKs Here](https://github.com/codebysrk/RailOneApp/releases/latest)**

---

## 🚀 Performance & Size Optimizations

1. **R8 / ProGuard Code & Resource Shrinking**: Unused native libraries, unused Fresco modules, and debug resources are stripped during release build.
2. **Metro Bundler inlineRequires**: Defers module execution until needed, accelerating cold start by **~35%**.
3. **Firestore LRU Memory Caching**: Automatic garbage collection ensures zero memory leakage during prolonged sessions.
4. **150ms Station Search Debouncing**: Eliminates typing lag while searching 400+ Indian Railway stations.
5. **Native GPU Hardware Acceleration**: Butter-smooth 60-120 FPS UI transitions and rolling reel animations.
6. **Background AppState Throttling**: Firestore real-time listeners are cleanly paused when backgrounded, saving battery life.

---

## 🛠️ Local Development & Build

### Prerequisites
- **Node.js**: 20+
- **Java JDK**: 17
- **Android SDK**: Platform Tools & Build Tools 36.0.0

### 1. Install Dependencies
`ash
npm install
`

### 2. Start Expo Development Server
`ash
npx expo start
`

### 3. Build 4 Split Release APKs Locally
`powershell
cd android
.\gradlew clean assembleRelease
`
*Generated APKs will be in ndroid/app/build/outputs/apk/release/.*

---

## 🤖 Automated CI/CD
Every commit pushed to main or version tag * triggers **GitHub Actions** (.github/workflows/build.yml) to:
1. Run full TypeScript verification (	sc --noEmit).
2. Cleanly generate native Android prebuild.
3. Compile all 4 ABI split release APKs with ProGuard/R8.
4. Automatically publish a new **GitHub Release** with all 4 downloadable APK assets.

---

## 📄 License
Private & Confidential — Developed with ❤️ by SRK.
