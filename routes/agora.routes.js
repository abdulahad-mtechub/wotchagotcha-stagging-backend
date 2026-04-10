import express from "express";
import pkg from "agora-token";
import pool from "../db.config/index.js";

const { RtcTokenBuilder, RtcRole } = pkg;
const router = express.Router();
const livePresence = new Map();

router.post("/token", async (req, res) => {
  try {
    const { channelName, role = "audience", uid = 0 } = req.body || {};
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      return res.status(400).json({
        success: false,
        message: "Agora credentials are missing on server.",
      });
    }

    if (!channelName || typeof channelName !== "string") {
      return res.status(400).json({
        success: false,
        message: "channelName is required.",
      });
    }

    const rtcRole =
      role === "host" || role === "publisher"
        ? RtcRole.PUBLISHER
        : RtcRole.SUBSCRIBER;

    const now = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = now + 60 * 60;
    const numericUid = Number.isNaN(Number(uid)) ? 0 : Number(uid);

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      numericUid,
      rtcRole,
      privilegeExpiredTs
    );

    return res.status(200).json({
      success: true,
      token,
      uid: numericUid,
      appId,
      channelName,
      role: rtcRole === RtcRole.PUBLISHER ? "host" : "audience",
      expiresIn: 3600,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to generate Agora token.",
    });
  }
});

router.post("/notify-live", async (req, res) => {
  try {
    const { sender_id, channelName } = req.body || {};

    if (!sender_id || !channelName) {
      return res.status(400).json({
        success: false,
        message: "sender_id and channelName are required.",
      });
    }

    const senderResult = await pool.query(
      "SELECT id, username FROM users WHERE id = $1 AND is_deleted = FALSE",
      [sender_id]
    );
    if (senderResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Sender not found." });
    }

    const sender = senderResult.rows[0];
    let typeResult = await pool.query(
      "SELECT id FROM notification_type WHERE name = $1 LIMIT 1",
      ["live_stream"]
    );

    // Auto-create live_stream notification type when missing.
    if (typeResult.rowCount === 0) {
      typeResult = await pool.query(
        "INSERT INTO notification_type (name) VALUES ($1) RETURNING id",
        ["live_stream"]
      );
    }

    const notificationTypeId = typeResult.rows[0]?.id;
    if (!notificationTypeId) {
      return res.status(500).json({
        success: false,
        message: "Could not resolve notification type for live stream.",
      });
    }
    const title = `${sender.username} started live streaming`;
    const content = "Tap to watch now.";

    const insertQuery = `
      INSERT INTO public.notification
      (sender_id, receiver_id, type, title, content, moduletype, action, is_all_user)
      SELECT $1, u.id, $2, $3, $4, $5, $6, TRUE
      FROM users u
      WHERE u.id <> $1 AND u.is_deleted = FALSE
    `;

    const result = await pool.query(insertQuery, [
      sender_id,
      notificationTypeId,
      title,
      content,
      "live_stream",
      channelName,
    ]);

    return res.status(201).json({
      success: true,
      message: "Live notification sent.",
      sentCount: result.rowCount || 0,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to send live notifications.",
    });
  }
});

router.post("/presence/join", async (req, res) => {
  try {
    const { channelName, userId } = req.body || {};
    if (!channelName || !userId) {
      return res.status(400).json({ success: false, message: "channelName and userId are required." });
    }

    if (!livePresence.has(channelName)) {
      livePresence.set(channelName, new Set());
    }
    livePresence.get(channelName).add(String(userId));

    return res.status(200).json({
      success: true,
      participants: Array.from(livePresence.get(channelName)),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error?.message || "Presence join failed." });
  }
});

router.post("/presence/leave", async (req, res) => {
  try {
    const { channelName, userId } = req.body || {};
    if (!channelName || !userId) {
      return res.status(400).json({ success: false, message: "channelName and userId are required." });
    }

    if (livePresence.has(channelName)) {
      const set = livePresence.get(channelName);
      set.delete(String(userId));
      if (set.size === 0) livePresence.delete(channelName);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: error?.message || "Presence leave failed." });
  }
});

router.get("/presence/:channelName", async (req, res) => {
  try {
    const { channelName } = req.params;
    const participants = livePresence.has(channelName)
      ? Array.from(livePresence.get(channelName))
      : [];
    return res.status(200).json({ success: true, participants });
  } catch (error) {
    return res.status(500).json({ success: false, message: error?.message || "Presence fetch failed." });
  }
});

export default router;
