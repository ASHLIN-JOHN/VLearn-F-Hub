
# Firebase Setup Instructions

## 1. Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Follow the setup wizard

## 2. Enable Authentication
1. In your Firebase project, go to Authentication
2. Click "Get started"
3. Enable Email/Password sign-in method

## 3. Enable Firestore Database
1. Go to Firestore Database
2. Click "Create database"
3. Choose "Start in test mode" for development
4. Select a location

## 4. Get Your Firebase Config
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" and select web app
4. Copy the config object

## 5. Update Firebase Config
Replace the placeholder values in `lib/firebase.ts` with your actual Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-actual-project-id", 
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-actual-app-id"
}
```

"""// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
apiKey: "AIzaSyALv3M75CyKBtX3Y5tW_7veQMwy0DXFINc",
authDomain: "free-lance-f717c.firebaseapp.com",
projectId: "free-lance-f717c",
storageBucket: "free-lance-f717c.firebasestorage.app",
messagingSenderId: "565689617088",
appId: "1:565689617088:web:0eb42ed8d0dc2aea533b25",
measurementId: "G-NGK8E89NWC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);"""

## 6. Firestore Security Rules (Development)
For development, you can use these permissive rules (update for production):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 7. Initialize Collections
The app will automatically create the following collections:
- `users` - User profiles and data
- `notes` - User notes
- `messages` - Chat messages
- `groupChats` - Group chat information

Your app is now ready to use Firebase for real-time data!
