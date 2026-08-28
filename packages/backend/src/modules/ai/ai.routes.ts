import { Router, Response } from "express";
import { AIService } from "./ai.service";
import { validate } from "../../core/middleware/validation";
import { authenticate, AuthRequest } from "../../core/middleware/auth.middleware";
import { chatSchema, insightsSchema } from "./ai.schema";

const router = Router();

router.get(
  "/insights/student/:studentId",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const insights = await AIService.generateInsights(
        req.user!.tenantId,
        req.params.studentId,
      );
      res.json({ insights });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to generate insights";
      res.status(500).json({ error: message });
    }
  },
);

router.post(
  "/assistant/chat",
  authenticate,
  validate(chatSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { message, role, history } = req.body;
      const response = await AIService.chat(
        req.user!.tenantId,
        role || req.user!.role,
        message,
        history,
      );
      res.json({ response });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "AI assistant error";
      res.status(500).json({ error: message });
    }
  },
);

export default router;
