"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const firestore_1 = require("firebase/firestore");
const firebase_1 = require("../lib/firebase");
const db = (0, firestore_1.getFirestore)(firebase_1.app);
exports.default = db;
//# sourceMappingURL=db.js.map