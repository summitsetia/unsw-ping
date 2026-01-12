import { Router } from "express";
import { db } from "../db/db.js";

const router = Router();

router.get("/api/cron/process-reminders", async (req, res) => {});

export default router;
