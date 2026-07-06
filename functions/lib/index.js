"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const https_1 = require("firebase-functions/v2/https");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./server/routes"));
const app = (0, express_1.default)();
// Middlewares
app.use((req, res, next) => {
    console.log(`[Firebase Function] Incoming request: ${req.method} ${req.url}`);
    next();
});
app.use((0, cors_1.default)({ origin: true }));
app.use((req, res, next) => {
    if (req.path === '/api/upload') {
        next();
    }
    else {
        express_1.default.json()(req, res, next);
    }
});
// API Routes
app.use('/api', routes_1.default);
// Fallback handlers
app.use('/api', (req, res, next) => {
    res.status(404).json({ error: 'API route not found' });
});
app.use('/api', (err, req, res, next) => {
    console.error('API Error:', err);
    res.status(err.status || 500).json({ success: false, step: 'Global Error Handler', message: err.message || 'Internal Server Error', stack: err.stack });
});
// Configure options and export function
exports.api = (0, https_1.onRequest)({ maxInstances: 10, timeoutSeconds: 60 }, app);
//# sourceMappingURL=index.js.map