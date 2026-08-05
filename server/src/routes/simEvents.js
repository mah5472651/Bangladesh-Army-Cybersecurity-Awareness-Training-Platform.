import { Router } from "express";
import { getPool, query } from "../db/pool.js";
import { memRecordSimEvent } from "../db/memoryStore.js";
import { requireAuth } from "../auth.js";

const router = Router();

const MODULE_IDS = new Set([
  "email-phishing",
  "fake-login",
  "qr-phishing",
  "sms-phishing",
  "voice-phishing",
  "usb-security",
  "password-security",
  "social-engineering",
]);

/**
 * Records simulation interaction COUNTS only.
 * Explicitly rejects any credential-like payload.
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const { kind, moduleId } = req.body || {};

    if (kind !== "click" && kind !== "form_attempt") {
      return res.status(400).json({ error: "kind must be 'click' or 'form_attempt'." });
    }
    if (!moduleId || !MODULE_IDS.has(moduleId)) {
      return res.status(400).json({ error: "Invalid moduleId." });
    }

    // Safety net: if client accidentally sends credential fields, drop them
    const unsafe = ["password", "username", "email", "otp", "pin", "credential"];
    for (const k of unsafe) {
      if (req.body && Object.prototype.hasOwnProperty.call(req.body, k)) {
        return res.status(400).json({
          error:
            "Simulation payloads must not include credential fields. Only kind and moduleId are accepted.",
        });
      }
    }

    if (getPool()) {
      await query(
        `INSERT INTO sim_events (user_id, module_id, kind) VALUES ($1, $2, $3)`,
        [req.user.id, moduleId, kind]
      );
    } else {
      memRecordSimEvent(req.user.id, kind, moduleId);
    }

    return res.json({
      ok: true,
      recorded: { kind, moduleId },
      note: "Count-only event. No credentials stored.",
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
