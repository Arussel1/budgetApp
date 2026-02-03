# Vault - Personal Finance Tracker

A privacy-focused, cross-platform personal budget and expense tracking application built with React Native and Expo.

## Prerequisites
- Node.js (v18+)
- Expo Go app on your phone (for mobile testing)
- Firebase account (Free Spark plan)

## Setup Instructions

### 1. Install Dependencies
```bash
git clone <repository-url>
cd vault
npm install
```

### 2. Configure Firebase
1.  Go to the [Firebase Console](https://console.firebase.google.com).
2.  Create a new project (e.g., `budget-app-abdc9`).
3.  Enable **Authentication** (Email/Password).
4.  Enable **Firestore Database**.
5.  Enable **Cloud Storage**.

### 3. Environment Variables
Copy `.env.example` to `.env` and fill in your credentials from the Firebase Project Settings:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

### 4. Running the App
```bash
# Start development server
npx expo start
```
Scan the QR code with **Expo Go** (iOS/Android) or press `w` to open in the web browser.

## Web Deployment & PWA
To use Vault as a standalone app on your iPhone without a Mac:
1.  **Build for Web**:
    ```bash
    npx expo export -p web
    ```
2.  **Deploy to Firebase**:
    ```bash
    npx firebase-tools deploy --only hosting
    ```
3.  **Install on iPhone**:
    - Open your deployment URL in **Safari**.
    - Tap the **Share** button.
    - Select **Add to Home Screen**.

## Features
✅ **Secure Auth** - Firebase Email/Password authentication.
✅ **Budget Books** - Organize your finances into custom books (e.g., Monthly, Vacation).
✅ **Transaction Tracking** - Easily log income and expenses with categories and descriptions.
✅ **Visual Analytics** - Interactive charts and filters to understand your spending habits.
✅ **Custom Avatars** - Upload your own profile picture via Firebase Storage.
✅ **Dark Mode** - Fully responsive dark and light themes.
✅ **Cross-Platform** - Runs on iOS, Android, and Web.

## Project Structure
```
src/
├── App.tsx                    # Main entry point
├── config/
│   └── firebase.ts           # Firebase SDK initialization
├── context/
│   ├── AuthContext.tsx       # Authentication & Profile management
│   ├── BudgetContext.tsx     # Transaction & Category logic
│   └── ThemeContext.tsx      # Dark mode management
├── screens/
│   ├── LoginScreen.tsx
│   ├── SignUpScreen.tsx
│   ├── HomeScreen.tsx        # Budget book list
│   ├── BudgetDetailScreen.tsx# Charts & transaction history
│   ├── EntryFormScreen.tsx   # Add/Edit transactions
│   └── ProfileScreen.tsx     # Avatar & settings
├── navigation/
│   └── RootNavigator.tsx     # App routing logic
```

## Security
This app uses Firebase Security Rules to ensure users can only access their own data.
- **Firestore**: Rules restrict access per `userId`.
- **Storage**: User avatars are stored in `avatars/{userId}` and restricted to the owner.

## Troubleshooting
- **Icons not showing**: Ensure `expo-font` is installed and fonts are loaded in `App.tsx`.
- **Firebase Persistence**: On web, standard browser persistence is used; on native, `AsyncStorage` is used via `getReactNativePersistence`.
