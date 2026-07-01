import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";
import { runGenerateSchedule, ALREADY_RUNNING } from "../lib/scheduler";

const router: IRouter = Router();

router.get("/refresh", async (req, res) => {
  const token = req.query.token as string | undefined;
  const adminToken = process.env.ADMIN_REFRESH_TOKEN;

  if (!adminToken || !token || token !== adminToken) {
    logger.warn("[refresh] Unauthorized attempt");
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  logger.info("[refresh] Admin-triggered generate-schedule starting");
  const result = await runGenerateSchedule();

  if (result === ALREADY_RUNNING) {
    logger.info("[refresh] generate-schedule already in progress");
    return res.status(409).json({ ok: false, error: "Already running" });
  }

  if (result === true) {
    logger.info("[refresh] Admin-triggered generate-schedule complete");
    return res.json({ ok: true });
  }

  logger.error("[refresh] generate-schedule failed");
  return res.status(500).json({ ok: false, error: "Refresh failed" });
});

export default router;
