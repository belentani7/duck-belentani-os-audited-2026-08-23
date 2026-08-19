import type { Express, Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { cronErrorPayload, refreshLeadSearchByTaskUid } from "./leadAutomation";

export function registerScheduledLeadRoutes(app: Express) {
  app.post("/api/scheduled/refreshLeads", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
      return res.json(await refreshLeadSearchByTaskUid(user.taskUid));
    } catch (error) {
      const taskUid = typeof req.headers["x-manus-task-uid"] === "string" ? req.headers["x-manus-task-uid"] : undefined;
      return res.status(500).json(cronErrorPayload(error, req.originalUrl, taskUid));
    }
  });
}
