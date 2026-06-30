import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";
import { runGenerateSchedule } from "../lib/scheduler";

const router: IRouter = Router();

router.post("/refresh", async (req, res) => {
  const token = req.query.token as string | undefined;
  const adminToken = process.env.ADMIN_REFRESH_TOKEN;

  if (!adminToken || !token || token !== adminToken) {
    logger.warn("[refresh] Unauthorized attempt");
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  try {
    logger.info("[refresh] Admin-triggered generate-schedule starting");
    await runGenerateSchedule();
    logger.info("[refresh] Admin-triggered generate-schedule complete");
    return res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "[refresh] generate-schedule threw unexpectedly");
    return res.status(500).json({ ok: false, error: "Refresh failed" });
  }
});

export default router;
