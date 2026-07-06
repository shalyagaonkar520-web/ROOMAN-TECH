import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC36aeunmITCUP-qFBE0OqoKIi0iYTTvf4",
  authDomain: "rooman-eb7dd.firebaseapp.com",
  projectId: "rooman-eb7dd",
  storageBucket: "rooman-eb7dd.firebasestorage.app",
  messagingSenderId: "1056229436313",
  appId: "1:1056229436313:web:76e95b726980f4e4eec108",
  measurementId: "G-33ZTX3Q38H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const auth = getAuth(app);

export { app, analytics, auth };
