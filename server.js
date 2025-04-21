const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

let activeSessions = [];
const EXPIRATION_TIME = 30 * 60 * 1000; // 30 minutes

// ⏲️ Automatically clean expired sessions every 5 minutes
setInterval(() => {
    const currentTime = Date.now();
    const originalLength = activeSessions.length;
    activeSessions = activeSessions.filter(session => currentTime - session.timestamp < EXPIRATION_TIME);
    const removedCount = originalLength - activeSessions.length;

    if (removedCount > 0) {
        console.log(`🧹 Auto-cleaned ${removedCount} expired session(s) at ${new Date().toISOString()}`);
    }
}, 5 * 60 * 1000); // Every 5 minutes

app.get("/api/debugSessions", (req, res) => {
    console.log(`🐛 Debug: Currently ${activeSessions.length} sessions stored.`);
    res.status(200).json({ totalSessions: activeSessions.length, sessions: activeSessions });
});

app.post("/api/addSession", (req, res) => {
    const { sessionCode, gameId } = req.body;

    if (!sessionCode || !gameId) {
        console.error("❌ Error: Missing sessionCode or gameId in request.");
        return res.status(400).json({ error: "Both sessionCode and gameId are required" });
    }

    const timestamp = Date.now();
    if (!activeSessions.some(session => session.sessionCode === sessionCode && session.gameId === gameId)) {
        activeSessions.push({ sessionCode, gameId, timestamp });
        console.log(`✅ Session added: ${sessionCode} for Game ID: ${gameId} at ${new Date(timestamp).toISOString()}`);
    } else {
        console.warn(`⚠️ Session already exists: ${sessionCode} for Game ID: ${gameId}`);
    }

    res.status(200).json({ message: "Session added successfully", sessionCode, gameId });
});

app.get("/api/getSessions", (req, res) => {
    const currentTime = Date.now();
    const validSessions = activeSessions.filter(session => currentTime - session.timestamp < EXPIRATION_TIME);
    const removedCount = activeSessions.length - validSessions.length;

    console.log(`📉 Removed ${removedCount} expired session(s).`);
    console.log(`📡 Active sessions fetched: ${validSessions.length} valid session(s).`);

    activeSessions = validSessions;
    res.status(200).json({
        sessions: validSessions.map(session => ({
            sessionCode: session.sessionCode,
            gameId: session.gameId
        }))
    });
});

app.delete("/api/removeSession", (req, res) => {
    const { sessionCode, gameId } = req.query;

    if (!sessionCode || !gameId) {
        console.error("❌ Error: Missing sessionCode or gameId in request.");
        return res.status(400).json({ error: "Both sessionCode and gameId are required" });
    }

    const initialLength = activeSessions.length;
    activeSessions = activeSessions.filter(session => session.sessionCode !== sessionCode || session.gameId !== gameId);

    if (activeSessions.length < initialLength) {
        console.log(`❌ Session removed: ${sessionCode} for Game ID: ${gameId}`);
        res.status(200).json({ success: true, message: "Session removed successfully" });
    } else {
        console.warn(`⚠️ Session not found: ${sessionCode} for Game ID: ${gameId}`);
        res.status(404).json({ error: "Session not found" });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
