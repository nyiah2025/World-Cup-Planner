import { Router, type IRouter } from "express";
import healthRouter from "./health";
import scoresRouter from "./scores";
import refreshRouter from "./refresh";

const router: IRouter = Router();

router.use(healthRouter);
router.use(scoresRouter);
router.use(refreshRouter);

export default router;
