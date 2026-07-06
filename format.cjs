const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');
const newContent = content.replace(/app\.use\("\/api", apiRoutes\);/, 'app.use("/api", apiRoutes);\n  app.use("/api", (req, res, next) => { res.status(404).json({ error: "API route not found" }); });\n  app.use("/api", (err, req, res, next) => { console.error("API Error:", err); res.status(err.status || 500).json({ error: err.message || "Internal Server Error" }); });');
fs.writeFileSync('server.ts', newContent);
