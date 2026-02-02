# This app is entirely vibecode b/c I am not familar with react native stack, i only guide it in term of security issue, testing feature, and architecture design. Please proceed with caution.


# Book Budget App Setup Guide

## Prerequisites
- Node.js (v16+)
- Expo CLI: `npm install -g expo-cli`
- Firebase account with a Firestore project

## Setup Instructions

### 1. Install Dependencies
```bash
cd budgetApp
npm install
```

### 2. Configure Firebase
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Create a Firestore database
4. Enable authentication (Email/Password)
5. *(Optional)* Set up Cloud Storage - **Note**: Cloud Storage requires a paid Firebase plan
6. Get your Firebase config from Project Settings

### 3. Environment Variables
1. Copy `.env.example` to `.env`
2. Fill in your Firebase credentials:
```
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

### 4. Firestore Security Rules
Set your Firestore rules to:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /books/{document=**} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid != null;
    }
  }
}
```

### 5. Cloud Storage Rules (Optional)
**Note**: Cloud Storage requires Firebase to be on a paid plan (Blaze Plan).

If using Cloud Storage, set your rules to:
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /book-covers/{allPaths=**} {
      allow read, write: if request.auth.uid == request.resource.metadata.userId || request.auth.uid == resource.metadata.userId;
    }
  }
}
```

### 6. Run the App
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web

# Or with Expo
npm start
```

## Features
✅ **Authentication** - Email/password signup and login with Firebase Auth
✅ **Book Management** - Create, read, update, and delete books
✅ **Cloud Storage** - Upload and store book cover images
✅ **Real-time Sync** - Automatic sync across devices with Firestore
✅ **Search & Filter** - Find books by title or author, filter by status
✅ **Book Details** - Title, author, genre, pages, price, rating, notes, status, description
✅ **User Profile** - View account info and logout
✅ **Responsive Design** - Works on iOS, Android, and Web

## Project Structure
```
src/
├── App.tsx                    # Main app component
├── config/
│   └── firebase.ts           # Firebase configuration
├── context/
│   ├── AuthContext.tsx       # Authentication logic
│   └── BooksContext.tsx      # Books management logic
├── screens/
│   ├── LoginScreen.tsx       # Login page
│   ├── SignUpScreen.tsx      # Sign up page
│   ├── HomeScreen.tsx        # Books list
│   ├── BookDetailScreen.tsx  # Book details & delete
│   ├── BookFormScreen.tsx    # Add/edit book form
│   └── ProfileScreen.tsx     # User profile
├── components/
│   └── LoadingSpinner.tsx    # Loading component
├── navigation/
│   └── RootNavigator.tsx     # Navigation setup
└── types/
    └── index.ts              # TypeScript types
```

## Next Steps (Optional Enhancements)
- [ ] Add book ratings and reviews
- [ ] Implement book wishlist/sharing
- [ ] Add offline sync
- [ ] Dark mode support
- [ ] Advanced filtering and sorting
- [ ] Book recommendations
- [ ] Social features

## Troubleshooting
- **Firebase not connecting**: Check your `.env` file and Firebase config
- **Image upload failing**: Verify Cloud Storage rules and permissions
- **Auth errors**: Clear app cache and try again
- **Expo issues**: Run `expo doctor` to diagnose problems

## Support
For issues with:
- **Firebase**: Check [Firebase Docs](https://firebase.google.com/docs)
- **React Native**: Check [React Native Docs](https://reactnative.dev)
- **Expo**: Check [Expo Docs](https://docs.expo.dev)
