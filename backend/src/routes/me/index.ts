import { Router } from "express";
import { requireUser } from "../../middleware/requireUser.js";
import subscriptionsRouter from "./subscriptions.js";
import integrationsRouter from "./integrations.js";
import profileRouter from "./profile.js";

const router = Router();

router.use(requireUser);

router.use("/subscriptions", subscriptionsRouter);
router.use("/integrations", integrationsRouter);
router.use("/profile", profileRouter);

export default router;
