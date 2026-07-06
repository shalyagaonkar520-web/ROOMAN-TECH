import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC36aeunmITCUP-qFBE0OqoKIi0iYTTvf4",
  authDomain: "rooman-eb7dd.firebaseapp.com",
  projectId: "rooman-eb7dd",
  storageBucket: "rooman-eb7dd.firebasestorage.app",
  messagingSenderId: "1056229436313",
  appId: "1:1056229436313:web:d7087ee79d2d863aeec108",
  measurementId: "G-VDJZW89F1M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, auth, storage };

