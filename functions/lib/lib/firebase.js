"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = exports.app = void 0;
const app_1 = require("firebase/app");
const auth_1 = require("firebase/auth");
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
const app = (0, app_1.initializeApp)(firebaseConfig);
exports.app = app;
const auth = (0, auth_1.getAuth)(app);
exports.auth = auth;
//# sourceMappingURL=firebase.js.map