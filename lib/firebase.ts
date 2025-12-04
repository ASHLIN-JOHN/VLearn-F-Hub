
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyALv3M75CyKBtX3Y5tW_7veQMwy0DXFINc",
  authDomain: "free-lance-f717c.firebaseapp.com",
  projectId: "free-lance-f717c",
  storageBucket: "free-lance-f717c.firebasestorage.app",
  messagingSenderId: "565689617088",
  appId: "1:565689617088:web:0eb42ed8d0dc2aea533b25",
  measurementId: "G-NGK8E89NWC"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export default app
